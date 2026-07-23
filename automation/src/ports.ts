import type { Enquiry } from "./types.js";

/**
 * Ports are the seams of the architecture (ports-and-adapters / hexagonal).
 *
 * The pipeline depends ONLY on these interfaces, never on a concrete provider.
 * Swapping Google Sheets for Airtable, or Resend for Postmark, means writing a
 * new adapter that satisfies the same port — no pipeline change, no test change.
 * That is what makes onboarding a new business a config edit, not a rewrite.
 */

/** A record already persisted, returned by de-duplication lookups. */
export interface StoredEnquiry {
  idempotencyKey: string;
  correlationId: string;
  storedAt: string;
  /** Provider-native id (sheet row, record id, CRM id) for cross-reference. */
  ref: string;
}

/**
 * Where enquiries are persisted. Any adapter (Sheets, Airtable, Notion,
 * HubSpot, Postgres) implements this. `findByIdempotencyKey` powers dedupe;
 * adapters that can't query cheaply may return null and rely on the store's
 * own uniqueness, but implementing it is strongly preferred.
 */
export interface StorePort {
  readonly provider: string;
  /** Look up an existing enquiry within the dedupe window, or null. */
  findByIdempotencyKey(key: string): Promise<StoredEnquiry | null>;
  /** Persist a new enquiry and return its stored form. Must be idempotent-safe. */
  save(enquiry: Enquiry): Promise<StoredEnquiry>;
}

/** A rendered message, provider-agnostic. */
export interface EmailMessage {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}

/** The result of a send, carrying the provider's message id for the audit trail. */
export interface EmailSendResult {
  id: string;
  provider: string;
}

/**
 * How transactional email is sent (customer confirmation + team notification).
 * Resend/Postmark/SendGrid/Gmail/Outlook adapters all implement this.
 */
export interface EmailPort {
  readonly provider: string;
  send(message: EmailMessage): Promise<EmailSendResult>;
}

/**
 * Optional side-channel notifiers (Slack, Twilio SMS, etc.). Kept separate from
 * EmailPort so adding one never touches the email path. Not used by the core
 * pipeline yet — declared here so future integrations have a stable seam.
 */
export interface NotifierPort {
  readonly provider: string;
  notify(subject: string, body: string): Promise<void>;
}
