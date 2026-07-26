# Southpage Automation — Manual Testing Checklist

The required post-implementation deliverable: **every scenario, failure
scenario, and edge case** to verify before calling the workflow production-ready.
Automated coverage (`npm test`, 33 tests) already exercises the pure logic; this
checklist is for verifying the *deployed* system end to end.

Legend: ⬜ = to verify · ✅ automated equivalent exists.

## 0. Pre-flight

- ⬜ `.env` populated from `.env.example`; **no** secrets committed.
- ⬜ `SOUTHPAGE_SIGNING_SECRET` is identical in the edge signer and in n8n.
- ⬜ Google service account has editor access to the target spreadsheet; row 1
  headers match the column order in `googleSheets.ts`.
- ⬜ Resend domain verified; `fromAddress` is on the verified domain.
- ⬜ `@southpage/automation` built (`npm run build`) and installed in the n8n
  instance; `NODE_FUNCTION_ALLOW_EXTERNAL` permits it.
- ⬜ Error Trigger workflow imported and set as the instance/workflow error
  workflow.

## 1. Happy path

- ⬜ Submit a valid enquiry via the real form. Browser shows the success message.
- ⬜ Customer receives a personalised confirmation (correct name, message echoed,
  reply-to = team).
- ⬜ Team receives a notification (reply-to = customer, all fields present).
- ⬜ A row appears in the Sheet with `status = stored`, a `correlationId`, an
  `idempotencyKey`, and an ISO timestamp.
- ⬜ n8n execution shows `status = completed`, `httpStatus = 200`, three steps
  all `ok`, each with `attempts = 1`. ✅

## 2. Validation (each field)

- ⬜ Empty name / empty email / empty message → 422, field-specific message, no
  Sheet row, no emails. ✅
- ⬜ Malformed email (`ada@`, `ada`, `a@b`) → 422. ✅
- ⬜ Name < 2 chars, message < 10 chars → 422. ✅
- ⬜ Over-long message (> 5000 chars) → 422. ✅
- ⬜ Optional phone present but invalid → 422; absent → accepted. ✅
- ⬜ Unicode/emoji in name and message → stored and rendered correctly.

## 3. Anti-abuse

- ⬜ Honeypot (`company_website`) filled → response looks like success (200) but
  **nothing** stored or emailed; n8n shows `rejected`, 0 steps. ✅
- ⬜ Request with no signature headers → 400, generic message. ✅
- ⬜ Request with a wrong/tampered signature → 400; message does **not** mention
  "signature". ✅
- ⬜ Replay a captured valid request after 6 minutes → rejected (stale
  timestamp). ✅
- ⬜ POST directly to the n8n webhook, bypassing the edge → rejected (no valid
  signature).
- ⬜ Cross-origin POST to the edge signer → 403.
- ⬜ Non-POST method to the edge → 405; `OPTIONS` preflight → 204 with CORS.

## 4. Duplicates & idempotency

- ⬜ Submit the identical enquiry twice within the dedupe window → second returns
  `duplicate` (200), and the Sheet has **one** row. ✅
- ⬜ Same email, *different* message → treated as new (two rows). ✅
- ⬜ Same content but different case/whitespace in email → deduped (one row). ✅
- ⬜ Retry of a request (same idempotency key) after a timeout → no second row.

## 5. Storage failures

- ⬜ Temporarily revoke Sheet access / use a bad spreadsheet id → `failed`, 502,
  **no** emails sent (never notify about an unsaved enquiry). ✅ (unit: store
  throws)
- ⬜ Restore access, resubmit → succeeds. Confirms recoverability.
- ⬜ Google returns 429 (rate limit) → step retries with backoff, then succeeds
  or degrades cleanly. ✅ (unit: transient retried)

## 6. Notification failures

- ⬜ Break the Resend key → store still succeeds, status `partial` (200), Sheet
  row present, team can follow up from the Sheet. ✅
- ⬜ Invalid customer email that passed regex but bounces at ESP (permanent 4xx)
  → **not** retried; status `partial`; team notification still attempted. ✅
- ⬜ Transient ESP blip (simulated 503) → retried up to 3× with backoff, then
  succeeds → `completed`. ✅
- ⬜ One of several team recipients is invalid → step fails → `partial`; verify
  the failure is logged with the recipient.

## 7. Error handling & observability

- ⬜ Force an unhandled exception (e.g. malformed config) → Error Trigger
  workflow fires, logs a structured line, sends the team alert. ✅ (unit:
  config error → 500, no leak)
- ⬜ Every execution log line is single-line JSON and carries the same
  `correlationId` from ingress to final step. ✅ (unit: capturing logger)
- ⬜ No log line or browser response contains a secret, stack trace, or provider
  internals. ✅ (unit: generic messages)

## 8. Config / onboarding sanity

- ⬜ Missing `RESEND_API_KEY` → `config` failure, 500, generic browser message,
  clear server log naming the missing var. ✅
- ⬜ Change `teamRecipients` in config → new recipient receives notifications, no
  code change, redeploy only.
- ⬜ Follow `ONBOARDING.md` to add a throwaway second client end to end → works
  with only a new config file + new env vars.

## 9. Edge cases

- ⬜ Empty body / non-JSON body to the edge → 400.
- ⬜ Body at the 100 KB edge cap → rejected; just under → accepted.
- ⬜ Concurrent identical submissions (fire 5 at once) → at most one stored;
  others `duplicate` (note the accepted best-effort caveat under Sheets — verify
  the count is 1, investigate if > 1).
- ⬜ Clock skew: set the client/edge clock ±4 min → still within tolerance;
  ±6 min → rejected.
- ⬜ Very large but valid message (4 900 chars) → stored intact, email renders.
- ⬜ HTML/script in name or message → escaped in the HTML email, raw in the text
  part, never executes. ✅ (unit: escapeHtml)

## 10. Deployment gates

- ⬜ `npm run typecheck` clean.
- ⬜ `npm test` green (33/33).
- ⬜ `next build` unaffected (automation package is excluded from the site
  build).
- ⬜ Edge signer deployed with secrets as Wrangler secrets (not in code).
- ⬜ Secret rotation rehearsed once per the runbook.
