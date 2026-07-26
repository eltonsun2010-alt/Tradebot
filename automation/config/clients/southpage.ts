import type { ClientConfig } from "../schema.js";

/**
 * Southpage tenant configuration.
 *
 * This is the ENTIRE surface a business owns. Onboarding another client means
 * copying this file, changing values, and adding their secrets to the
 * environment — no framework code changes. Note there is not a single secret
 * value here: only the NAMES of environment variables the factory resolves.
 */
export const southpage: ClientConfig = {
  client: "southpage",
  displayName: "Southpage",
  teamRecipients: ["team@southpage.co.uk"],

  signingSecret: { var: "SOUTHPAGE_SIGNING_SECRET" },
  signatureToleranceSeconds: 300,
  honeypotField: "company_website", // hidden field; humans never fill it

  fields: [
    { name: "name", required: true, type: "text", minLength: 2, maxLength: 100 },
    { name: "email", required: true, type: "email" },
    { name: "phone", required: false, type: "phone" },
    { name: "company", required: false, type: "text", maxLength: 120 },
    { name: "subject", required: false, type: "text", maxLength: 150 },
    {
      name: "message",
      required: true,
      type: "longtext",
      minLength: 10,
      maxLength: 5000,
    },
  ],

  store: {
    provider: "googleSheets",
    dedupeWindowMinutes: 24 * 60, // 24h
    options: {
      // Non-secret: the spreadsheet id is safe to keep in config.
      spreadsheetId: "REPLACE_WITH_SPREADSHEET_ID",
      sheetName: "Enquiries",
    },
    secrets: {
      clientEmail: { var: "GOOGLE_SA_CLIENT_EMAIL" },
      privateKey: { var: "GOOGLE_SA_PRIVATE_KEY" },
    },
  },

  email: {
    provider: "resend",
    fromName: "Southpage",
    fromAddress: "hello@southpage.co.uk",
    replyTo: "team@southpage.co.uk",
    options: {},
    secrets: {
      apiKey: { var: "RESEND_API_KEY" },
    },
  },

  templates: {
    customerSubject: "Thanks for contacting Southpage, {{name}}",
    customerBody: [
      "Hi {{name}},",
      "Thanks for reaching out to Southpage — we've received your message and a member of our team will be in touch shortly.",
      "For your records, here's what you sent us:\n\n{{message}}",
      "Talk soon,\nThe Southpage Team",
    ].join("\n\n"),
    teamSubject: "New enquiry from {{name}} ({{email}})",
    teamBody: [
      "A new enquiry has arrived via the website.",
      "Name: {{name}}\nEmail: {{email}}\nPhone: {{phone}}\nCompany: {{company}}\nSubject: {{subject}}\nSource: {{source}}",
      "Message:\n{{message}}",
      "Correlation ID: {{correlationId}}\nReceived: {{receivedAt}}",
    ].join("\n\n"),
  },

  retry: {
    retries: 3,
    baseMs: 500,
    maxMs: 8000,
    jitter: 0.2,
  },
};

/** Registry of known clients, keyed by tenant id. */
export const clients: Record<string, ClientConfig> = {
  southpage,
};
