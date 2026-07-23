import { test } from "node:test";
import assert from "node:assert/strict";
import { runPipeline } from "../src/pipeline.js";
import { InMemoryStore } from "../src/adapters/store/inMemory.js";
import { ConsoleEmail } from "../src/adapters/email/console.js";
import { AppError } from "../src/errors.js";
import { createCapturingLogger } from "../src/logger.js";
import type { EmailMessage, EmailPort, EmailSendResult, StorePort, StoredEnquiry } from "../src/ports.js";
import { testConfig, testEnquiry, instantIO } from "./helpers.js";

function deps(store: StorePort, email: EmailPort, retries = 0) {
  const { logger } = createCapturingLogger();
  return {
    config: testConfig({ retry: { retries, baseMs: 1, maxMs: 2, jitter: 0 } }),
    adapters: { store, email },
    logger,
    io: instantIO,
  };
}

test("happy path: stores and sends both emails → completed", async () => {
  const store = new InMemoryStore();
  const email = new ConsoleEmail();
  const res = await runPipeline(testEnquiry(), deps(store, email));

  assert.equal(res.status, "completed");
  assert.equal(res.httpStatus, 200);
  assert.equal(store.size, 1);
  assert.equal(email.sent.length, 2); // customer + one team recipient
  assert.deepEqual(
    res.steps.map((s) => [s.step, s.status]),
    [["store", "ok"], ["notifyCustomer", "ok"], ["notifyTeam", "ok"]],
  );
});

test("duplicate submission is suppressed → duplicate", async () => {
  const store = new InMemoryStore();
  const email = new ConsoleEmail();
  const enquiry = testEnquiry();
  await runPipeline(enquiry, deps(store, email));
  const second = await runPipeline(enquiry, deps(store, email));

  assert.equal(second.status, "duplicate");
  assert.equal(second.httpStatus, 200);
  assert.equal(store.size, 1, "no second record written");
});

test("store failure → failed, no emails sent", async () => {
  const failingStore: StorePort = {
    provider: "failing",
    async findByIdempotencyKey() {
      return null;
    },
    async save(): Promise<StoredEnquiry> {
      throw new AppError("permanent", "sheet unavailable");
    },
  };
  const email = new ConsoleEmail();
  const res = await runPipeline(testEnquiry(), deps(failingStore, email));

  assert.equal(res.status, "failed");
  assert.equal(res.httpStatus, 502);
  assert.equal(email.sent.length, 0);
});

test("notification failure after store → partial (enquiry preserved)", async () => {
  const store = new InMemoryStore();
  const failingEmail: EmailPort = {
    provider: "failing",
    async send(): Promise<EmailSendResult> {
      throw new AppError("permanent", "mailbox rejected");
    },
  };
  const res = await runPipeline(testEnquiry(), deps(store, failingEmail));

  assert.equal(res.status, "partial");
  assert.equal(res.httpStatus, 200, "browser still gets a success");
  assert.equal(store.size, 1, "the enquiry was still stored");
});

test("transient email failure is retried, then succeeds → completed", async () => {
  const store = new InMemoryStore();
  let attempts = 0;
  const flakyEmail: EmailPort = {
    provider: "flaky",
    async send(_msg: EmailMessage): Promise<EmailSendResult> {
      attempts += 1;
      if (attempts < 3) throw new AppError("transient", "temporary blip");
      return { id: `ok-${attempts}`, provider: "flaky" };
    },
  };
  const res = await runPipeline(testEnquiry(), deps(store, flakyEmail, 3));

  assert.equal(res.status, "completed");
  const customer = res.steps.find((s) => s.step === "notifyCustomer");
  assert.equal(customer?.status, "ok");
  assert.ok((customer?.attempts ?? 0) >= 3, "should have retried the transient failures");
});

test("permanent email failure is NOT retried", async () => {
  const store = new InMemoryStore();
  let attempts = 0;
  const email: EmailPort = {
    provider: "perm",
    async send(): Promise<EmailSendResult> {
      attempts += 1;
      throw new AppError("permanent", "invalid address");
    },
  };
  await runPipeline(testEnquiry(), deps(store, email, 3));
  // customer + team both attempted once each = 2, none retried.
  assert.equal(attempts, 2);
});

test("each step records attempts and timestamps", async () => {
  const res = await runPipeline(
    testEnquiry(),
    deps(new InMemoryStore(), new ConsoleEmail()),
  );
  for (const step of res.steps) {
    assert.ok(step.startedAt);
    assert.ok(step.finishedAt);
    assert.ok(step.attempts >= 1);
  }
});
