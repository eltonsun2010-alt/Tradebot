import { toAppError } from "./errors.js";
import { withRetry } from "./retry.js";
import { renderCustomerEmail, renderTeamEmail } from "./templating.js";
import type { Logger } from "./logger.js";
import type { Adapters } from "./factory.js";
import type { ClientConfig } from "../config/schema.js";
import type {
  Enquiry,
  StepName,
  StepResult,
  WorkflowResult,
  WorkflowStatus,
} from "./types.js";

/**
 * The orchestrator. Given a validated enquiry and wired adapters, it runs the
 * modular steps in order and produces a WorkflowResult that captures the full
 * audit trail. Every step is isolated: it retries transient failures on its
 * own, records its outcome, and the pipeline decides the terminal status from
 * the collected results.
 *
 * Failure model (deliberate):
 *   - store fails            → status "failed"  (nothing persisted; ingress 5xx-safe)
 *   - store ok, notify fails → status "partial" (team can follow up; browser still 200)
 *   - all ok                 → status "completed"
 *   - duplicate found        → status "duplicate" (short-circuit, still 200)
 */

export interface PipelineDeps {
  config: ClientConfig;
  adapters: Adapters;
  logger: Logger;
  /** Injectable IO so tests are deterministic and instant. */
  io?: { sleep?: (ms: number) => Promise<void>; random?: () => number };
}

const isRetriable = (err: unknown): boolean => toAppError(err).retriable;

/** Run one modular step with retry + timing, never throwing to the caller. */
async function runStep(
  step: StepName,
  deps: PipelineDeps,
  work: () => Promise<string | undefined>,
): Promise<StepResult> {
  const startedAt = new Date().toISOString();
  const { retries, baseMs, maxMs, jitter } = deps.config.retry;
  const log = deps.logger.child({ step });

  try {
    const { value, attempts } = await withRetry(
      () => work(),
      { retries, baseMs, maxMs, jitter },
      isRetriable,
      deps.io ?? {},
    );
    log.info("step ok", { attempts });
    const result: StepResult = {
      step,
      status: "ok",
      startedAt,
      finishedAt: new Date().toISOString(),
      attempts,
    };
    if (value) result.detail = value;
    return result;
  } catch (err) {
    const appErr = toAppError(err);
    log.error("step failed", { error: appErr.serialize() });
    return {
      step,
      status: "failed",
      startedAt,
      finishedAt: new Date().toISOString(),
      attempts: retries + 1,
      error: appErr.serialize(),
    };
  }
}

function terminal(
  enquiry: Enquiry,
  status: WorkflowStatus,
  httpStatus: number,
  publicMessage: string,
  steps: StepResult[],
): WorkflowResult {
  return {
    correlationId: enquiry.correlationId,
    status,
    httpStatus,
    publicMessage,
    steps,
    timestamps: { receivedAt: enquiry.receivedAt, completedAt: new Date().toISOString() },
  };
}

export async function runPipeline(
  enquiry: Enquiry,
  deps: PipelineDeps,
): Promise<WorkflowResult> {
  const { adapters, config, logger } = deps;
  const steps: StepResult[] = [];

  // 1. De-duplicate. A dedupe lookup failure must not create a duplicate, so a
  //    transient error here is retried; a hard failure short-circuits to failed.
  try {
    const existing = await withRetry(
      () => adapters.store.findByIdempotencyKey(enquiry.idempotencyKey),
      config.retry,
      isRetriable,
      deps.io ?? {},
    );
    if (existing.value) {
      logger.info("duplicate suppressed", { ref: existing.value.ref });
      return terminal(
        enquiry,
        "duplicate",
        200,
        "We've already received your message — thanks!",
        steps,
      );
    }
  } catch (err) {
    const appErr = toAppError(err);
    logger.error("dedupe lookup failed", { error: appErr.serialize() });
    return terminal(
      enquiry,
      "failed",
      502,
      "We couldn't process your message right now. Please try again shortly.",
      steps,
    );
  }

  // 2. Store — the gate. If we can't persist, we stop: notifications without a
  //    record would be un-actionable.
  const storeStep = await runStep("store", deps, async () => {
    const stored = await adapters.store.save(enquiry);
    return stored.ref;
  });
  steps.push(storeStep);

  if (storeStep.status === "failed") {
    return terminal(
      enquiry,
      "failed",
      502,
      "We couldn't save your message right now. Please try again shortly.",
      steps,
    );
  }

  // 3. Notify customer + 4. Notify team. Independent; a failure here degrades to
  //    "partial", never loses the enquiry.
  const customerStep = await runStep("notifyCustomer", deps, async () => {
    const msg = renderCustomerEmail(enquiry, config);
    const res = await adapters.email.send(msg);
    return res.id;
  });
  steps.push(customerStep);

  const teamStep = await runStep("notifyTeam", deps, async () => {
    const ids: string[] = [];
    // One message per recipient; a single bad address shouldn't block the rest,
    // but any failure marks the step failed so it surfaces as "partial".
    for (const to of config.teamRecipients) {
      const msg = renderTeamEmail(enquiry, config, to);
      const res = await adapters.email.send(msg);
      ids.push(res.id);
    }
    return ids.join(",");
  });
  steps.push(teamStep);

  const anyNotifyFailed =
    customerStep.status === "failed" || teamStep.status === "failed";

  if (anyNotifyFailed) {
    return terminal(
      enquiry,
      "partial",
      200,
      "Thanks — we've received your message and will be in touch soon.",
      steps,
    );
  }

  return terminal(
    enquiry,
    "completed",
    200,
    "Thanks — we've received your message and will be in touch soon.",
    steps,
  );
}
