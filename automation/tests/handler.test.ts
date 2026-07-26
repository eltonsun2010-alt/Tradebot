import { test } from "node:test";
import assert from "node:assert/strict";
import { handleIngress } from "../src/handler.js";
import { createCapturingLogger } from "../src/logger.js";
import { InMemoryStore } from "../src/adapters/store/inMemory.js";
import { ConsoleEmail } from "../src/adapters/email/console.js";
import { testConfig, signedHeaders, instantIO } from "./helpers.js";

const SECRET = "test-secret";
const env = { TEST_SIGNING_SECRET: SECRET };

function makeReq(body: Record<string, unknown>) {
  const rawBody = JSON.stringify(body);
  return {
    rawBody,
    body,
    headers: signedHeaders(SECRET, rawBody),
    meta: { ip: "203.0.113.1" },
  };
}

function makeDeps() {
  const { logger } = createCapturingLogger();
  return { config: testConfig(), env, io: instantIO, logger };
}

const goodBody = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "I'd like to discuss a project with your team.",
};

test("valid signed submission completes", async () => {
  const res = await handleIngress(makeReq(goodBody), makeDeps());
  assert.equal(res.status, "completed");
  assert.equal(res.httpStatus, 200);
});

test("missing signature headers → rejected", async () => {
  const rawBody = JSON.stringify(goodBody);
  const res = await handleIngress(
    { rawBody, body: goodBody, headers: {} },
    makeDeps(),
  );
  assert.equal(res.status, "rejected");
  assert.equal(res.httpStatus, 400);
});

test("bad signature → rejected with generic message", async () => {
  const rawBody = JSON.stringify(goodBody);
  const res = await handleIngress(
    {
      rawBody,
      body: goodBody,
      headers: { "x-southpage-signature": "deadbeef", "x-southpage-timestamp": String(Math.floor(Date.now() / 1000)) },
    },
    makeDeps(),
  );
  assert.equal(res.status, "rejected");
  assert.equal(res.httpStatus, 400);
  assert.ok(!res.publicMessage.toLowerCase().includes("signature"), "must not leak why");
});

test("honeypot tripped → silent accept, nothing processed", async () => {
  const body = { ...goodBody, company_website: "http://spam.example" };
  const res = await handleIngress(makeReq(body), makeDeps());
  assert.equal(res.status, "rejected");
  assert.equal(res.httpStatus, 200, "bots get a normal-looking success");
  assert.equal(res.steps.length, 0);
});

test("invalid fields → 422 with a helpful message", async () => {
  const body = { name: "A", email: "nope", message: "hi" };
  const res = await handleIngress(makeReq(body), makeDeps());
  assert.equal(res.status, "rejected");
  assert.equal(res.httpStatus, 422);
});

test("missing signing secret in env → config failure, no leak", async () => {
  const res = await handleIngress(makeReq(goodBody), {
    config: testConfig(),
    env: {},
    io: instantIO,
  });
  assert.equal(res.status, "failed");
  assert.equal(res.httpStatus, 500);
});

test("same submission twice with a shared store → second is a duplicate", async () => {
  // Inject one shared store so dedupe is proven end-to-end through the handler.
  const store = new InMemoryStore();
  const email = new ConsoleEmail();
  const { logger } = createCapturingLogger();
  const deps = { config: testConfig(), env, io: instantIO, logger, adapters: { store, email } };

  const first = await handleIngress(makeReq(goodBody), deps);
  const second = await handleIngress(makeReq(goodBody), deps);

  assert.equal(first.status, "completed");
  assert.equal(second.status, "duplicate");
  assert.equal(store.size, 1, "the deterministic idempotency key prevented a second record");
});
