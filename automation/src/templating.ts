import type { Enquiry } from "./types.js";
import type { ClientConfig } from "../config/schema.js";
import type { EmailMessage } from "./ports.js";

/**
 * Config-driven templating. Bodies live in the client config as strings with
 * {{placeholders}}; this module resolves them against the enquiry and produces
 * both plaintext and safe HTML. No template engine dependency — a tiny,
 * auditable resolver is enough and keeps the package dependency-free.
 */

/** Escape the five HTML-significant characters. Applied to every substitution. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Values available to templates. Missing keys resolve to an empty string. */
function templateContext(enquiry: Enquiry, config: ClientConfig): Record<string, string> {
  return {
    name: enquiry.name,
    email: enquiry.email,
    message: enquiry.message,
    phone: enquiry.phone ?? "",
    company: enquiry.company ?? "",
    subject: enquiry.subject ?? "",
    source: enquiry.source ?? "",
    client: config.displayName,
    correlationId: enquiry.correlationId,
    receivedAt: enquiry.receivedAt,
  };
}

/** Resolve {{key}} tokens. `escape` decides whether values are HTML-escaped. */
function render(
  template: string,
  context: Record<string, string>,
  escape: boolean,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const raw = context[key] ?? "";
    return escape ? escapeHtml(raw) : raw;
  });
}

/** Wrap resolved, escaped text in a minimal, email-client-safe HTML shell. */
function toHtml(body: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;font-size:15px">${paragraphs}</div>`;
}

/** Build the customer confirmation email from config + enquiry. */
export function renderCustomerEmail(enquiry: Enquiry, config: ClientConfig): EmailMessage {
  const ctx = templateContext(enquiry, config);
  const message: EmailMessage = {
    to: enquiry.email,
    from: `${config.email.fromName} <${config.email.fromAddress}>`,
    subject: render(config.templates.customerSubject, ctx, false),
    text: render(config.templates.customerBody, ctx, false),
    html: toHtml(render(config.templates.customerBody, ctx, true)),
  };
  if (config.email.replyTo) message.replyTo = config.email.replyTo;
  return message;
}

/** Build the internal team notification. One message per recipient is sent by
 * the pipeline; this returns the shared content addressed to the first team
 * recipient, with the rest handled by the caller. */
export function renderTeamEmail(
  enquiry: Enquiry,
  config: ClientConfig,
  to: string,
): EmailMessage {
  const ctx = templateContext(enquiry, config);
  const message: EmailMessage = {
    to,
    from: `${config.email.fromName} <${config.email.fromAddress}>`,
    subject: render(config.templates.teamSubject, ctx, false),
    text: render(config.templates.teamBody, ctx, false),
    html: toHtml(render(config.templates.teamBody, ctx, true)),
  };
  // Team can reply straight to the customer.
  message.replyTo = enquiry.email;
  return message;
}
