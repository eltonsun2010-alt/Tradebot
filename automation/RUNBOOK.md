# Runbook — Southpage Automation

Operational procedures for running, deploying, and recovering the automation.

## Build & test

```bash
cd automation
npm install
npm run typecheck   # tsc --noEmit
npm test            # compile + 33 tests
npm run build       # emit dist/ for n8n to require()
```

## Deploy

1. `npm run build` and install `@southpage/automation` into the n8n instance
   (copy the built package or publish to a private registry). Set
   `NODE_FUNCTION_ALLOW_EXTERNAL=@southpage/automation`.
2. Import `n8n/southpage-contact.workflow.json` and
   `n8n/error-handler.workflow.json`. Set the error-handler as the workflow's
   error workflow.
3. Set n8n environment variables: `SOUTHPAGE_SIGNING_SECRET`, `RESEND_API_KEY`,
   `GOOGLE_SA_CLIENT_EMAIL`, `GOOGLE_SA_PRIVATE_KEY`, and the alert email vars.
4. Deploy `edge/signer.ts` as a Cloudflare Worker with `SIGNING_SECRET` (same
   value as n8n), `N8N_WEBHOOK_URL`, `ALLOWED_ORIGIN` as Wrangler secrets.
5. Point the site form at the Worker URL.

## Common incidents

### Enquiries not arriving
1. Check the edge Worker logs — is it receiving POSTs? Origin rejected (403)?
2. Check the n8n execution list — are executions being created? If not, the
   webhook URL or signature is wrong.
3. If executions show `rejected` with an abuse error, the signing secret differs
   between edge and n8n → rotate to match (below).

### Status `partial` on many executions
The store is fine but email is failing. Check the ESP key/domain and Resend
status. Enquiries are safe in the Sheet — reconcile from there once email is
restored.

### Status `failed`
The store failed. Check service-account access to the spreadsheet and Google API
status. Nothing was persisted; ask affected customers to resubmit once fixed.

### Duplicate rows appearing
Under heavy concurrency Sheets dedupe is best-effort. If this is material,
migrate the store to one with a unique constraint on `idempotencyKey` (Airtable
with a unique field, or a database). Config change only.

## Secret rotation (HMAC signing secret)

The secret lives in **two** places and must match:

1. Generate: `openssl rand -hex 32`.
2. Set it in the edge Worker (`wrangler secret put SIGNING_SECRET`) **and** in
   n8n (`SOUTHPAGE_SIGNING_SECRET`).
3. Because the freshness window is 5 minutes, deploy both within that window, or
   briefly widen `signatureToleranceSeconds` during the change and restore it.

Rotate ESP and Google keys independently — they live in one place each and have
no cross-dependency.

## Where the audit trail is
- **Per submission**: one `correlationId` threads every JSON log line and the
  stored row. Search logs by it to reconstruct a submission end to end.
- **Sheet**: `status` column + timestamps.
- **Unhandled failures**: the Error Trigger workflow logs + alerts.
