import { test } from "node:test";
import assert from "node:assert/strict";
import { signPayload, verifySignature, isHoneypotTripped } from "../src/security.js";
import { AppError } from "../src/errors.js";

const secret = "super-secret";
const body = JSON.stringify({ name: "Ada", email: "a@b.co" });

test("a correctly signed request verifies", () => {
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = signPayload(secret, ts, body);
  assert.doesNotThrow(() =>
    verifySignature(ts, body, sig, { secret, now: () => Date.now() }),
  );
});

test("a tampered body fails verification", () => {
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = signPayload(secret, ts, body);
  assert.throws(
    () => verifySignature(ts, body + "x", sig, { secret, now: () => Date.now() }),
    (e) => e instanceof AppError && e.kind === "abuse",
  );
});

test("the wrong secret fails verification", () => {
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = signPayload("other-secret", ts, body);
  assert.throws(
    () => verifySignature(ts, body, sig, { secret, now: () => Date.now() }),
    (e) => e instanceof AppError && e.kind === "abuse",
  );
});

test("a stale timestamp is rejected (replay protection)", () => {
  const now = 1_700_000_000_000;
  const oldTs = String(Math.floor(now / 1000) - 10_000);
  const sig = signPayload(secret, oldTs, body);
  assert.throws(
    () => verifySignature(oldTs, body, sig, { secret, toleranceSeconds: 300, now: () => now }),
    (e) => e instanceof AppError && e.kind === "abuse",
  );
});

test("a non-numeric timestamp is rejected", () => {
  const sig = signPayload(secret, "not-a-number", body);
  assert.throws(
    () => verifySignature("not-a-number", body, sig, { secret }),
    (e) => e instanceof AppError && e.kind === "abuse",
  );
});

test("honeypot detects a filled hidden field", () => {
  assert.equal(isHoneypotTripped({ company_website: "http://spam" }, "company_website"), true);
  assert.equal(isHoneypotTripped({ company_website: "" }, "company_website"), false);
  assert.equal(isHoneypotTripped({}, "company_website"), false);
});
