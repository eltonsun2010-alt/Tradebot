import type { EmailMessage, EmailPort, EmailSendResult } from "../../ports.js";

/**
 * Console email adapter. Sends nothing — records messages in memory and logs a
 * line. Used for local development and tests so the pipeline can be exercised
 * end-to-end without a real ESP or leaking test emails.
 */
export class ConsoleEmail implements EmailPort {
  readonly provider = "console";
  readonly sent: EmailMessage[] = [];

  constructor(private readonly log: (line: string) => void = () => {}) {}

  async send(message: EmailMessage): Promise<EmailSendResult> {
    this.sent.push(message);
    this.log(`[console-email] to=${message.to} subject=${message.subject}`);
    return { id: `console-${this.sent.length}`, provider: this.provider };
  }
}
