import type { ClientConfig } from "../config/schema.js";
import type { Enquiry } from "../src/types.js";
import { signPayload } from "../src/security.js";

/** A minimal, fast test config: in-memory store, console email, no real IO. */
export function testConfig(overrides: Partial<ClientConfig> = {}): ClientConfig {
  return {
    client: "testco",
    displayName: "Test Co",
    teamRecipients: ["team@test.co"],
    signingSecret: { var: "TEST_SIGNING_SECRET" },
    signatureToleranceSeconds: 300,
    honeypotField: "company_website",
    fields: [
      { name: "name", required: true, type: "text", minLength: 2, maxLength: 100 },
      { name: "email", required: true, type: "email" },
      { name: "phone", required: false, type: "phone" },
      { name: "subject", required: false, type: "text", maxLength: 150 },
      { name: "message", required: true, type: "longtext", minLength: 5, maxLength: 5000 },
    ],
    store: {
      provider: "inMemory",
      dedupeWindowMinutes: 60,
      options: {},
      secrets: {},
    },
    email: {
      provider: "console",
      fromName: "Test Co",
      fromAddress: "hello@test.co",
      replyTo: "team@test.co",
      options: {},
      secrets: {},
    },
    templates: {
      customerSubject: "Thanks {{name}}",
      customerBody: "Hi {{name}}, we got: {{message}}",
      teamSubject: "New enquiry from {{name}}",
      teamBody: "Email: {{email}}\nMessage: {{message}}\nCID: {{correlationId}}",
    },
    // Zero retries + instant sleep keep tests fast unless a case overrides.
    retry: { retries: 0, baseMs: 1, maxMs: 2, jitter: 0 },
    ...overrides,
  };
}

export function testEnquiry(overrides: Partial<Enquiry> = {}): Enquiry {
  return {
    correlationId: "cid-1",
    idempotencyKey: "key-1",
    client: "testco",
    receivedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "Please get in touch about a project.",
    meta: {},
    ...overrides,
  };
}

/** Build signed ingress headers for a raw body, as the edge signer would. */
export function signedHeaders(
  secret: string,
  rawBody: string,
  timestamp = String(Math.floor(Date.now() / 1000)),
): Record<string, string> {
  return {
    "x-southpage-signature": signPayload(secret, timestamp, rawBody),
    "x-southpage-timestamp": timestamp,
  };
}

/** No-op instant sleep for deterministic retry tests. */
export const instantIO = {
  sleep: async () => {},
  random: () => 0.5,
};
