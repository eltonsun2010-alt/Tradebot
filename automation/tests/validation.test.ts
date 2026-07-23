import { test } from "node:test";
import assert from "node:assert/strict";
import { validateFields, assertValid } from "../src/validation.js";
import { AppError } from "../src/errors.js";
import { testConfig } from "./helpers.js";

const rules = testConfig().fields;

test("accepts a valid submission and trims values", () => {
  const { values, errors } = validateFields(
    { name: "  Ada  ", email: "ada@example.com", message: "Hello there team" },
    rules,
  );
  assert.deepEqual(errors, {});
  assert.equal(values.name, "Ada");
  assert.equal(values.email, "ada@example.com");
});

test("flags missing required fields", () => {
  const { errors } = validateFields({ email: "a@b.co" }, rules);
  assert.ok(errors.name);
  assert.ok(errors.message);
  assert.ok(!errors.email);
});

test("rejects malformed email", () => {
  const { errors } = validateFields(
    { name: "Ada", email: "not-an-email", message: "Hello there" },
    rules,
  );
  assert.ok(errors.email);
});

test("enforces min and max length", () => {
  const short = validateFields({ name: "A", email: "a@b.co", message: "hi" }, rules);
  assert.ok(short.errors.name); // minLength 2
  assert.ok(short.errors.message); // minLength 5

  const long = validateFields(
    { name: "Ada", email: "a@b.co", message: "x".repeat(6000) },
    rules,
  );
  assert.ok(long.errors.message);
});

test("optional phone is validated only when present", () => {
  const ok = validateFields(
    { name: "Ada", email: "a@b.co", message: "Hello team", phone: "+44 20 7946 0000" },
    rules,
  );
  assert.deepEqual(ok.errors, {});

  const bad = validateFields(
    { name: "Ada", email: "a@b.co", message: "Hello team", phone: "abc" },
    rules,
  );
  assert.ok(bad.errors.phone);
});

test("assertValid throws a validation AppError with a summary", () => {
  try {
    assertValid({ email: "bad" }, rules);
    assert.fail("should have thrown");
  } catch (err) {
    assert.ok(err instanceof AppError);
    assert.equal(err.kind, "validation");
  }
});
