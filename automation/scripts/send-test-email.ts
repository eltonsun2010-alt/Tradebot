/**
 * Local smoke test for the Resend email adapter.
 *
 * Exercises ONLY the email path — no Google Sheets, no edge signer, no n8n —
 * so you can confirm your RESEND_API_KEY works and see a real email arrive
 * before wiring up the rest of the pipeline.
 *
 * Run (after `npm run build`):
 *   node --env-file=.env dist/scripts/send-test-email.js you@example.com
 *
 * Or set TEST_EMAIL_TO in .env and omit the argument.
 *
 * FROM defaults to Resend's shared sandbox sender (onboarding@resend.dev), which
 * works WITHOUT domain verification but can only deliver to the address you
 * signed up to Resend with. Once your own domain is verified, pass a real from:
 *   TEST_EMAIL_FROM="Southpage <hello@southpage.co.uk>"
 */
import { ResendEmail } from "../src/adapters/email/resend.js";
import { AppError } from "../src/errors.js";

async function main(): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    console.error(
      "✗ RESEND_API_KEY is not set. Did you run with `node --env-file=.env ...` and fill in .env?",
    );
    process.exit(1);
  }

  const to = process.argv[2] ?? process.env.TEST_EMAIL_TO;
  if (!to) {
    console.error(
      "✗ No recipient. Pass one as an argument or set TEST_EMAIL_TO in .env.\n" +
        "  node --env-file=.env dist/scripts/send-test-email.js you@example.com",
    );
    process.exit(1);
  }

  const from = process.env.TEST_EMAIL_FROM ?? "Southpage Test <onboarding@resend.dev>";
  const email = new ResendEmail({ apiKey });

  console.log(`→ Sending a test email\n    from: ${from}\n    to:   ${to}`);

  try {
    const result = await email.send({
      to,
      from,
      subject: "Southpage automation — Resend test ✅",
      text: "This is a plain-text test from the Southpage automation framework. If you're reading this, your RESEND_API_KEY works.",
      html: "<p>This is a test from the <strong>Southpage automation framework</strong>.</p><p>If you're reading this, your <code>RESEND_API_KEY</code> works. 🎉</p>",
    });
    console.log(`✓ Sent. Resend message id: ${result.id}`);
    console.log("  Check the recipient inbox (and spam) — it should arrive within a few seconds.");
  } catch (err) {
    if (err instanceof AppError) {
      console.error(`✗ Send failed [${err.kind}${err.status ? " " + err.status : ""}]: ${err.message}`);
      if (err.status === 401 || err.status === 403) {
        console.error("  → The API key was rejected. Double-check RESEND_API_KEY in .env.");
      } else if (err.status === 422) {
        console.error(
          "  → Resend rejected the request. Most often this is the FROM address: the sandbox\n" +
            "    sender only delivers to your Resend signup email. Verify your domain, then set\n" +
            '    TEST_EMAIL_FROM="Southpage <hello@yourdomain>".',
        );
      }
    } else {
      console.error(`✗ Unexpected error: ${String(err)}`);
    }
    process.exit(1);
  }
}

void main();
