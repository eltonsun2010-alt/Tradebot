# @southpage/automation

A production automation framework for contact-form enquiries:
**validate → block abuse → de-duplicate → store → notify → record → recover.**

It is config-driven and provider-agnostic, so onboarding a new business is a
configuration change, not a rewrite — the framework Southpage reuses across
clients.

## Why it's shaped this way (the short version)

- **All business logic is a dependency-free TypeScript package.** n8n is only
  the ops shell (webhook, credentials, retry, error workflow). The same build
  runs in an n8n Code node, a serverless function, or the test suite.
- **Ports and adapters.** The pipeline depends on `StorePort` / `EmailPort`
  interfaces; Google Sheets and Resend are just adapters. Swapping to a CRM or a
  different ESP is a new adapter + a config line — the tested pipeline never
  changes, so new integrations can't destabilise the flow.
- **Secrets only in env vars.** Config holds behaviour and the *names* of env
  vars. No secret in code, config, tests, or workflow JSON.
- **Explicit failure model.** Transient failures retry with backoff; the enquiry
  is never lost — a failed notification degrades to `partial`, not a drop.

Full reasoning, risks, and the improvement roadmap: [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Quick start

```bash
cd automation
npm install
npm test          # 33 deterministic tests
npm run build     # emit dist/ for n8n / serverless to consume
cp .env.example .env   # then fill in secrets
```

## The security model in one picture

The site is a static export with no backend, so an HMAC secret can't live in the
browser. A tiny **edge signer** (`edge/signer.ts`) holds the secret, gates
origin + honeypot, signs the request, and forwards to n8n, which verifies it:

```
browser → edge signer (HMAC + timestamp) → n8n webhook → handleIngress()
```

## Docs

| File | What it's for |
|---|---|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Why this design, weaknesses, roadmap |
| [`ONBOARDING.md`](./ONBOARDING.md) | Add a new client / a new provider |
| [`RUNBOOK.md`](./RUNBOOK.md) | Deploy, incidents, secret rotation |
| [`TESTING.md`](./TESTING.md) | Full manual test checklist (every scenario) |

## Layout

See the map at the end of [`ARCHITECTURE.md`](./ARCHITECTURE.md#9-map-of-the-package).
