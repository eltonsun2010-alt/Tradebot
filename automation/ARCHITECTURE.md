# Southpage Automation — Architecture

This document explains **what** was built, **why** it was built this way, the
**weaknesses/risks** we accept, and the **improvements** we'd make next. It is
the reasoning-first deliverable; the code is the second.

---

## 1. The problem, restated

When a contact form is submitted we must, reliably and repeatably:

1. validate required fields,
2. reject spam and duplicate submissions,
3. store the enquiry safely (Google Sheets now; a CRM later, without a rewrite),
4. send a personalised confirmation to the customer,
5. notify the Southpage team,
6. record timestamps and a workflow status,
7. handle errors, log failures, and retry the transient ones,
8. keep every step modular,

and do all of this so that **onboarding the next business is a configuration
change, not a code change** — because this becomes the framework Southpage
reuses for hundreds of clients.

## 2. The core decision: logic in code, orchestration in n8n

The single most important architectural choice: **all business logic lives in a
dependency-free TypeScript package (`@southpage/automation`); n8n is only the
ops shell.**

- **n8n** provides the webhook ingress, credential vault, native retry,
  scheduling, an Error Trigger workflow for dead-lettering, and a visual map of
  the integrations to come (Gmail, Airtable, HubSpot, Stripe, Twilio, …). It is
  genuinely good at being the *operational* layer, and it matches the four
  locked decisions (self-hosted Docker, HMAC + honeypot, transactional ESP,
  Google Sheet).
- **The package** owns validation, anti-abuse verification, idempotency,
  storage, templating, notification, retry classification, and status. A single
  n8n Code node calls `handleIngress()` and nothing else.

Why split it this way?

- **Testability.** Logic in a Code node cannot be unit-tested; logic in a
  package has 33 fast, deterministic tests and runs in CI.
- **Portability.** The exact same build runs in an n8n Code node, a serverless
  function, or a test. If we ever outgrow n8n, the valuable part moves untouched.
- **Reuse.** ~90% of a new client is the package + one config file. n8n
  workflows become thin and nearly identical per client.
- **Safe integrations.** Adding HubSpot or Stripe is a new *adapter* behind a
  stable *port*; the tested pipeline never changes, so a new integration can't
  destabilise the existing flow.

## 3. Ports and adapters (hexagonal)

The pipeline depends only on **ports** (interfaces): `StorePort`, `EmailPort`,
`NotifierPort`. Concrete **adapters** implement them:

```
                 ┌──────────────────────────────────────────┐
  edge signer →  │  handler → validation → security →        │
  (HMAC)         │            idempotency → pipeline          │
                 │                 │            │             │
                 │            StorePort     EmailPort         │  ← ports
                 └─────────────────┼────────────┼────────────┘
                                   │            │
              googleSheets / airtable /    resend / postmark /
              inMemory / (notion,hubspot)  console / (gmail,outlook)   ← adapters
```

Swapping Google Sheets for Airtable = write `airtable.ts` (a stub template is
included), register it in `factory.ts`, change `store.provider` in config. No
change to `pipeline.ts`, `validation.ts`, `templating.ts`, or any test.

## 4. Configuration vs. business logic vs. secrets

Three strictly separated layers, exactly as required:

- **Business logic** — `src/*`. Never mentions a client or a secret.
- **Configuration** — `config/clients/southpage.ts`, shape enforced by
  `config/schema.ts`. Onboarding a client is one file of this shape. Config
  holds only non-secret values (spreadsheet id, field rules, templates) and the
  **names** of environment variables.
- **Secrets** — environment variables only, resolved at runtime by the single
  composition root (`factory.ts`). No secret appears in code, config, tests, or
  the n8n workflow JSON.

## 5. Anti-abuse: why the edge signer exists

The site is a static Next.js export on GitHub Pages — there is **no backend** to
hold an HMAC secret, and a secret shipped in browser JS is not a secret. The
honest solution is a tiny **edge "front door"** (`edge/signer.ts`, a Cloudflare
Worker):

```
browser ──POST JSON──▶ edge signer ──HMAC-signed──▶ n8n webhook ──▶ handler
                       (holds secret,               (verifies signature
                        origin + size gate)          + timestamp freshness)
```

Defences, layered:

- **HMAC-SHA256** over `timestamp.rawBody`, constant-time compared, with a
  **±300s freshness window** to defeat replay of a captured request.
- **Honeypot** hidden field (`company_website`) — silent bot trap; bots get a
  normal-looking success so they don't learn they were caught.
- **Origin gate + body-size cap** at the edge.
- **Deterministic idempotency key** (`sha256(client|email|message)`) prevents
  duplicates *and* makes retries safe — a replayed request can never create a
  second record.

## 6. Failure model (explicit, not accidental)

| Situation | Status | HTTP | Persisted? | Rationale |
|---|---|---|---|---|
| Invalid fields | `rejected` | 422 | no | user can fix and resubmit |
| Bad signature / honeypot | `rejected` | 400 / 200 | no | generic response, no info leak |
| Dedupe hit | `duplicate` | 200 | no (already there) | idempotent, friendly |
| Store fails | `failed` | 502 | no | never notify about an un-saved enquiry |
| Store ok, a notify fails | `partial` | 200 | **yes** | enquiry is safe; team can follow up |
| All steps ok | `completed` | 200 | yes | happy path |

- **Transient** failures (network, 408/425/429/5xx) are retried with exponential
  backoff + jitter. **Permanent** failures (validation, 4xx) are not.
- Every step records `attempts`, `startedAt`, `finishedAt`, and a serialized
  error — a full audit trail per submission, carried by one `correlationId`.
- Unhandled errors hit the n8n **Error Trigger** workflow → structured log +
  team alert (dead-letter). Nothing fails silently.

## 7. Weaknesses & risks (accepted, with mitigations)

- **Google Sheets is not a database.** No transactions, rate-limited, dedupe is
  a range scan. *Mitigated* by the swappable `StorePort` — this is explicitly a
  starting point. Move to Airtable/Postgres when volume warrants; it's a config
  change.
- **Dedupe is best-effort under concurrency.** Two identical submissions racing
  within milliseconds could both pass the Sheets lookup. *Mitigated* by the
  short race window and idempotency key; *fully solved* by a store with a unique
  constraint (any real DB) — again a config change.
- **Edge signer is required.** Without it there is no strong client
  authentication for a static site. A documented weaker fallback (static bearer
  token) exists but is not recommended.
- **Per-tenant secret sharing.** The HMAC secret lives in both the edge and n8n;
  rotating it is a two-place operation (documented in the runbook).
- **Email templating is intentionally minimal** (no MJML/engine) to stay
  dependency-free. Rich, brand-heavy templates would justify adding one later.

## 8. Improvements we'd make next

1. Replace Sheets with a store that has a unique constraint on
   `idempotencyKey` — turns best-effort dedupe into a guarantee.
2. A real dead-letter *queue* (not just an alert) so failed enquiries can be
   replayed on demand.
3. Rate-limiting at the edge (per-IP) to blunt volumetric abuse before n8n.
4. Delivery/bounce webhooks from the ESP folded back as `NotifierPort` events.
5. Metrics (counts by status, retry rates) shipped from the structured logs.

## 9. Map of the package

```
automation/
  config/
    schema.ts              # the config contract (types only)
    clients/southpage.ts   # the ONLY file you edit to onboard Southpage
  src/
    types.ts               # provider-agnostic domain types
    errors.ts              # AppError + transient/permanent classification
    logger.ts              # structured JSON logging, correlation-aware
    retry.ts               # exponential backoff + jitter, injectable IO
    idempotency.ts         # deterministic key = dedupe + safe retries
    security.ts            # HMAC verify + honeypot (runs in n8n, not browser)
    validation.ts          # zero-dep, config-driven field validation
    templating.ts          # config-driven emails, HTML-escaped
    ports.ts               # StorePort / EmailPort / NotifierPort
    factory.ts             # composition root; the ONLY reader of env secrets
    pipeline.ts            # the orchestrator + failure model
    handler.ts             # ingress entrypoint (verify → validate → run)
    index.ts               # public API
    adapters/
      store/  inMemory | googleSheets | airtable(stub)
      email/  console | resend
  edge/signer.ts           # Cloudflare Worker HMAC front door
  n8n/                     # contact ingress + error-handler workflows
  tests/                   # 33 deterministic unit/integration tests
```
