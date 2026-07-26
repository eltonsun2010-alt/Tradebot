import { test } from "node:test";
import assert from "node:assert/strict";
import { computeIdempotencyKey, resolveIdempotencyKey } from "../src/idempotency.js";

test("same content yields the same key", () => {
  const a = computeIdempotencyKey({ client: "c", email: "A@B.com", message: "Hello  world" });
  const b = computeIdempotencyKey({ client: "c", email: "a@b.com", message: "hello world" });
  assert.equal(a, b, "email case and whitespace should not change the key");
});

test("different clients never collide", () => {
  const a = computeIdempotencyKey({ client: "c1", email: "a@b.com", message: "hi there" });
  const b = computeIdempotencyKey({ client: "c2", email: "a@b.com", message: "hi there" });
  assert.notEqual(a, b);
});

test("different message yields a different key", () => {
  const a = computeIdempotencyKey({ client: "c", email: "a@b.com", message: "one" });
  const b = computeIdempotencyKey({ client: "c", email: "a@b.com", message: "two" });
  assert.notEqual(a, b);
});

test("resolve trusts a supplied key, else derives", () => {
  const derived = computeIdempotencyKey({ client: "c", email: "a@b.com", message: "hi" });
  assert.equal(resolveIdempotencyKey("  ", { client: "c", email: "a@b.com", message: "hi" }), derived);
  assert.equal(resolveIdempotencyKey("supplied-key", { client: "c", email: "a@b.com", message: "hi" }), "supplied-key");
});
