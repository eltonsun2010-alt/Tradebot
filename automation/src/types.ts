/**
 * Canonical, provider-agnostic domain types.
 *
 * Everything downstream (adapters, pipeline, n8n) speaks in these shapes, never
 * in a specific provider's payload. That decoupling is what lets us swap Google
 * Sheets for a CRM, or Resend for Postmark, by changing configuration only.
 */

/** A normalised enquiry after ingress validation. Never contains secrets. */
export interface Enquiry {
  /** UUID minted per submission; threads every log line and stored record. */
  correlationId: string;
  /** Deterministic key for de-duplication AND safe retries (see idempotency.ts). */
  idempotencyKey: string;
  /** Config key identifying the tenant, e.g. "southpage". */
  client: string;
  /** ISO-8601 timestamp captured the instant ingress accepted the request. */
  receivedAt: string;
  name: string;
  email: string;
  message: string;
  phone?: string;
  company?: string;
  subject?: string;
  /** Where the enquiry came from (page path, campaign, form id). */
  source?: string;
  /** Non-PII audit metadata (ip, userAgent, referer). Optional per privacy config. */
  meta: Record<string, string | undefined>;
}

export type StepName = "store" | "notifyCustomer" | "notifyTeam";
export type StepStatus = "ok" | "skipped" | "failed";

/** The outcome of one modular step — the audit trail for a single submission. */
export interface StepResult {
  step: StepName;
  status: StepStatus;
  startedAt: string;
  finishedAt: string;
  /** How many times the step ran (1 = succeeded first try). */
  attempts: number;
  /** Human-readable note or provider id (e.g. the email/message id). */
  detail?: string;
  error?: SerializedError;
}

/**
 * The terminal state of the whole workflow.
 * - completed : stored + both notifications sent.
 * - partial   : stored, but a notification failed (recoverable, team can follow up).
 * - duplicate : a matching enquiry already exists within the dedupe window.
 * - rejected  : failed validation / anti-abuse (never reached the pipeline).
 * - failed    : could not even store the enquiry (nothing was persisted).
 */
export type WorkflowStatus =
  | "completed"
  | "partial"
  | "duplicate"
  | "rejected"
  | "failed";

export interface WorkflowResult {
  correlationId: string;
  status: WorkflowStatus;
  /** HTTP status the ingress should return to the browser. */
  httpStatus: number;
  /** Safe, non-leaky message for the browser. */
  publicMessage: string;
  steps: StepResult[];
  timestamps: { receivedAt: string; completedAt: string };
}

/** A structured error safe to log and store (no stack traces, no secrets). */
export interface SerializedError {
  kind: ErrorKind;
  message: string;
  provider?: string;
  /** Upstream status code when the failure came from an HTTP integration. */
  status?: number;
}

export type ErrorKind =
  | "validation"
  | "abuse"
  | "duplicate"
  | "transient"
  | "permanent"
  | "config";
