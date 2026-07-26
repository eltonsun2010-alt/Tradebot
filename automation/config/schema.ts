/**
 * Configuration schema — the single contract that separates *what a business
 * needs* from *how the framework works*. Onboarding a new client means writing
 * one object of this shape (see config/clients/*.ts). No secrets live here:
 * every credential is referenced by the NAME of an environment variable, never
 * the value. The factory reads those env vars at runtime.
 */

export type StoreProvider =
  | "googleSheets"
  | "inMemory"
  | "airtable"
  | "notion"
  | "hubspot";

export type EmailProvider =
  | "resend"
  | "postmark"
  | "sendgrid"
  | "gmail"
  | "outlook"
  | "console";

/** A field the form collects and the pipeline validates. */
export interface FieldRule {
  name: string;
  required: boolean;
  /** Logical type drives built-in validation (no external schema library). */
  type: "text" | "email" | "phone" | "longtext";
  maxLength?: number;
  minLength?: number;
  /** Label used in emails/templates. Defaults to a title-cased `name`. */
  label?: string;
}

/** Names of environment variables — NOT the secret values themselves. */
export interface EnvRef {
  /** e.g. "SOUTHPAGE_RESEND_API_KEY". Resolved at runtime by the factory. */
  var: string;
}

export interface StoreConfig {
  provider: StoreProvider;
  /** How far back (minutes) a duplicate is suppressed. */
  dedupeWindowMinutes: number;
  /** Provider-specific, non-secret settings. */
  options: Record<string, string>;
  /** Secret references consumed by the adapter, by logical name. */
  secrets: Record<string, EnvRef>;
}

export interface EmailConfig {
  provider: EmailProvider;
  fromName: string;
  fromAddress: string;
  /** Where customer replies should go. */
  replyTo?: string;
  options: Record<string, string>;
  secrets: Record<string, EnvRef>;
}

export interface RetryConfig {
  retries: number;
  baseMs: number;
  maxMs: number;
  jitter: number;
}

export interface TemplateConfig {
  /** Confirmation email to the customer. */
  customerSubject: string;
  /** Plaintext body with {{placeholders}} resolved from the enquiry. */
  customerBody: string;
  /** Notification email to the team. */
  teamSubject: string;
  teamBody: string;
}

export interface ClientConfig {
  /** Stable tenant id, e.g. "southpage". Also namespaces idempotency keys. */
  client: string;
  displayName: string;
  /** Recipients of the internal team notification. */
  teamRecipients: string[];
  /** HMAC secret env var name for verifying signed ingress. */
  signingSecret: EnvRef;
  /** Max age (seconds) a signed request may be before it's rejected. */
  signatureToleranceSeconds: number;
  /** Hidden form field used as the honeypot. */
  honeypotField: string;
  fields: FieldRule[];
  store: StoreConfig;
  email: EmailConfig;
  templates: TemplateConfig;
  retry: RetryConfig;
}
