import { AppError, classifyHttpStatus } from "../../errors.js";
import type { EmailMessage, EmailPort, EmailSendResult } from "../../ports.js";

/**
 * Resend transactional-email adapter (the default ESP). Chosen for a simple
 * HTTPS API and strong deliverability. Swapping to Postmark/SendGrid is a new
 * adapter behind the same EmailPort — the pipeline never changes.
 *
 * The API key comes from an env var, resolved by the factory; it is never in
 * config or code.
 */
export interface ResendConfig {
  apiKey: string;
  fetchImpl?: typeof fetch;
}

const ENDPOINT = "https://api.resend.com/emails";

export class ResendEmail implements EmailPort {
  readonly provider = "resend";
  constructor(private readonly cfg: ResendConfig) {}

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const fetchImpl = this.cfg.fetchImpl ?? fetch;
    const payload: Record<string, unknown> = {
      from: message.from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    };
    if (message.replyTo) payload.reply_to = message.replyTo;

    let res: Response;
    try {
      res = await fetchImpl(ENDPOINT, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.cfg.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Network-level failure — transient, worth retrying.
      throw new AppError("transient", `Resend request failed: ${String(err)}`, {
        provider: this.provider,
      });
    }

    if (!res.ok) {
      throw new AppError(
        classifyHttpStatus(res.status),
        `Resend API error (${res.status})`,
        { provider: this.provider, status: res.status },
      );
    }
    const json = (await res.json()) as { id?: string };
    return { id: json.id ?? "unknown", provider: this.provider };
  }
}
