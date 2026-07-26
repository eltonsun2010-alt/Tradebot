# Onboarding a new business

The promise of this framework: **a new client is a configuration change, not a
rewrite.** Here is the whole process.

## 1. Create the client config

Copy `config/clients/southpage.ts` to `config/clients/<client>.ts` and edit the
values. You are choosing behaviour, not writing logic:

- `client` / `displayName` — tenant id (also namespaces idempotency keys) and
  the human name used in emails.
- `teamRecipients` — who gets the internal notification.
- `honeypotField` — the hidden form field name (keep it plausible, e.g.
  `company_website`).
- `fields` — the form fields and their rules (required, type, min/max). This
  drives validation; no code changes.
- `store` — pick a `provider` (`googleSheets`, `airtable`, …), set non-secret
  `options`, and map `secrets` to **env-var names**.
- `email` — pick a `provider`, set the from identity, map the API key to an
  env-var name.
- `templates` — the customer + team subject/body with `{{placeholders}}`.
- `retry` — attempts/backoff.

Register it:

```ts
// config/clients/index or wherever the registry lives
export const clients = { southpage, <client> };
```

## 2. Add the secrets (environment only)

For each `EnvRef` in the config, set the real value as an environment variable
in every host that runs the pipeline (n8n credentials/env, the edge signer's
secrets). **Never** put a secret in the config file, code, or workflow JSON. See
`.env.example` for the shape.

## 3. Provision the providers

- **Google Sheet**: create the sheet, add the header row (order per
  `googleSheets.ts`), share it with the service-account email as Editor, put the
  spreadsheet id in `store.options.spreadsheetId`.
- **Resend**: verify the sending domain, confirm `fromAddress` uses it.

## 4. Deploy the edge signer

Deploy `edge/signer.ts` (one Worker per site is fine, or reuse with per-origin
config) with `SIGNING_SECRET`, `N8N_WEBHOOK_URL`, `ALLOWED_ORIGIN` as secrets.
The site form POSTs JSON to the Worker URL.

## 5. Import the n8n workflows

Import `n8n/southpage-contact.workflow.json` (rename per client, change the
webhook path and the `southpage` import to the new client config) and ensure the
error-handler workflow is set as the error workflow.

## 6. Verify

Run `npm test`, then walk `TESTING.md` against the deployed client.

---

### Adding a NEW provider (e.g. Airtable, HubSpot, Postmark)

Only needed when a client wants a store or ESP we haven't built yet:

1. Copy the relevant stub (`src/adapters/store/airtable.ts` is a worked
   template) and implement the port methods against the provider's API. Read
   secrets from the values the factory passes in — never from `process.env`
   inside the adapter.
2. Register the provider in the `switch` in `factory.ts`.
3. Point the client config at it.

The pipeline, validation, templating, and all existing tests are untouched —
that isolation is the point of the ports-and-adapters design.
