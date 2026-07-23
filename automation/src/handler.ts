import { AppError, toAppError } from "./errors.js";
import { createLogger, type Logger } from "./logger.js";
import { assertValid } from "./validation.js";
import { verifySignature, isHoneypotTripped } from "./security.js";
import { resolveIdempotencyKey, newCorrelationId } from "./idempotency.js";
import { buildAdapters, type Adapters, type Env, type FactoryIO } from "./factory.js";
import { runPipeline } from "./pipeline.js";
import type { ClientConfig } from "../config/schema.js";
import type { Enquiry, WorkflowResult } from "./types.js";

/**
 * Ingress entrypoint. This is the single function an n8n Code node, a
 * serverless function, or a test calls. It owns the request-level concerns
 * (signature, honeypot, validation, enquiry assembly) and then hands a clean
 * Enquiry to the pipeline. Being dependency-free and IO-injectable, it runs
 * identically everywhere.
 */

export interface IngressRequest {
  /** Raw request body string — MUST be the exact bytes that were signed. */
  rawBody: string;
  /** Parsed form/JSON fields. */
  body: Record<string, unknown>;
  headers: Record<string, string | undefined>;
  meta?: Record<string, string | undefined>;
}

export interface HandlerDeps {
  config: ClientConfig;
  env: Env;
  io?: FactoryIO;
  logger?: Logger;
  /**
   * Pre-built adapters. Optional: when omitted the factory builds them per
   * request from config + env. A long-lived host (or a test) can build them
   * once and pass them here to reuse connections and share state.
   */
  adapters?: Adapters;
}

const SIG_HEADER = "x-southpage-signature";
const TS_HEADER = "x-southpage-timestamp";

/** Build the normalised, secret-free Enquiry from a validated body. */
function toEnquiry(
  config: ClientConfig,
  values: Record<string, string>,
  body: Record<string, unknown>,
  meta: Record<string, string | undefined>,
): Enquiry {
  const receivedAt = new Date().toISOString();
  const suppliedKey =
    typeof body.idempotencyKey === "string" ? body.idempotencyKey : undefined;
  const idempotencyKey = resolveIdempotencyKey(suppliedKey, {
    client: config.client,
    email: values.email ?? "",
    message: values.message ?? "",
    extra: values.subject ? [values.subject] : [],
  });

  const enquiry: Enquiry = {
    correlationId: newCorrelationId(),
    idempotencyKey,
    client: config.client,
    receivedAt,
    name: values.name ?? "",
    email: values.email ?? "",
    message: values.message ?? "",
    meta,
  };
  if (values.phone) enquiry.phone = values.phone;
  if (values.company) enquiry.company = values.company;
  if (values.subject) enquiry.subject = values.subject;
  if (typeof body.source === "string") enquiry.source = body.source;
  return enquiry;
}

/** Map a rejection (validation/abuse/config) to a safe WorkflowResult. */
function reject(
  correlationId: string,
  err: AppError,
  receivedAt: string,
): WorkflowResult {
  const base = {
    correlationId,
    steps: [],
    timestamps: { receivedAt, completedAt: new Date().toISOString() },
  };
  switch (err.kind) {
    case "validation":
      return { ...base, status: "rejected", httpStatus: 422, publicMessage: err.message };
    case "abuse":
      // Uniform, unrevealing response for anything that smells like abuse.
      return {
        ...base,
        status: "rejected",
        httpStatus: 400,
        publicMessage: "Your message could not be accepted.",
      };
    case "config":
      // A misconfiguration is our fault — never leak details to the browser.
      return {
        ...base,
        status: "failed",
        httpStatus: 500,
        publicMessage: "We couldn't process your message right now. Please try again shortly.",
      };
    default:
      return {
        ...base,
        status: "failed",
        httpStatus: 502,
        publicMessage: "We couldn't process your message right now. Please try again shortly.",
      };
  }
}

export async function handleIngress(
  req: IngressRequest,
  deps: HandlerDeps,
): Promise<WorkflowResult> {
  const { config, env } = deps;
  const correlationId = newCorrelationId();
  const receivedAt = new Date().toISOString();
  const logger =
    deps.logger ??
    createLogger({ client: config.client, correlationId }, { sink: (l) => console.log(l) });

  try {
    // 1. Verify the signed request (replay-protected HMAC from the edge signer).
    const signature = req.headers[SIG_HEADER];
    const timestamp = req.headers[TS_HEADER];
    if (!signature || !timestamp) {
      throw new AppError("abuse", "Missing signature headers");
    }
    verifySignature(timestamp, req.rawBody, signature, {
      secret: requireSecret(env, config.signingSecret.var),
      toleranceSeconds: config.signatureToleranceSeconds,
      ...(deps.io?.now ? { now: deps.io.now } : {}),
    });

    // 2. Honeypot — silent bot trap. Respond as if accepted (don't teach bots).
    if (isHoneypotTripped(req.body, config.honeypotField)) {
      logger.warn("honeypot tripped");
      return {
        correlationId,
        status: "rejected",
        httpStatus: 200,
        publicMessage: "Thanks — we've received your message and will be in touch soon.",
        steps: [],
        timestamps: { receivedAt, completedAt: new Date().toISOString() },
      };
    }

    // 3. Validate required fields (config-driven).
    const values = assertValid(req.body, config.fields);

    // 4. Assemble the enquiry and run the pipeline.
    const enquiry = toEnquiry(config, values, req.body, req.meta ?? {});
    const runLogger = logger.child({ correlationId: enquiry.correlationId });
    const adapters = deps.adapters ?? buildAdapters(config, env, deps.io ?? {});
    return await runPipeline(enquiry, {
      config,
      adapters,
      logger: runLogger,
      ...(deps.io ? { io: deps.io } : {}),
    });
  } catch (err) {
    const appErr = toAppError(err);
    logger.error("ingress rejected", { error: appErr.serialize() });
    return reject(correlationId, appErr, receivedAt);
  }
}

function requireSecret(env: Env, name: string): string {
  const value = env[name];
  if (!value || value.trim().length === 0) {
    throw new AppError("config", `Missing required environment variable: ${name}`);
  }
  return value;
}
