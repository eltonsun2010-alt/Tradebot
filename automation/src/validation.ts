import { AppError } from "./errors.js";
import type { FieldRule } from "../config/schema.js";

/**
 * Zero-dependency, config-driven field validation. The rules come from the
 * client config, so a new business changes *config*, not this code. Kept
 * deliberately small and explicit rather than pulling in a schema library —
 * fewer dependencies, easier to audit, runs unchanged in an n8n Code node.
 */

// Pragmatic email check: exactly one @, non-empty local part, dotted domain.
// Not RFC-5322-perfect on purpose — deliverability is the real gate downstream.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits, spaces, and + ( ) - for international formats; 7–20 significant digits.
const PHONE_RE = /^[+()\-\s]*(?:\d[()\-\s]*){7,20}$/;

const DEFAULT_MAX = { text: 200, longtext: 5000, email: 254, phone: 40 } as const;

export interface ValidationResult {
  /** Cleaned values keyed by field name; only present, valid fields included. */
  values: Record<string, string>;
  /** Field-level errors; empty means valid. */
  errors: Record<string, string>;
}

function titleCase(name: string): string {
  return name.replace(/(^|[\s_-])(\w)/g, (_, s, c) => s + c.toUpperCase());
}

function coerceString(raw: unknown): string {
  if (raw === undefined || raw === null) return "";
  return typeof raw === "string" ? raw : String(raw);
}

/**
 * Validate a raw submission body against the field rules. Pure function:
 * returns a result, never throws — the caller decides how to respond so the
 * same logic serves both the pipeline and unit tests.
 */
export function validateFields(
  body: Record<string, unknown>,
  rules: FieldRule[],
): ValidationResult {
  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const rule of rules) {
    const label = rule.label ?? titleCase(rule.name);
    const value = coerceString(body[rule.name]).trim();

    if (value.length === 0) {
      if (rule.required) errors[rule.name] = `${label} is required.`;
      continue;
    }

    const max = rule.maxLength ?? DEFAULT_MAX[rule.type];
    if (value.length > max) {
      errors[rule.name] = `${label} must be at most ${max} characters.`;
      continue;
    }
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      errors[rule.name] = `${label} must be at least ${rule.minLength} characters.`;
      continue;
    }

    if (rule.type === "email" && !EMAIL_RE.test(value)) {
      errors[rule.name] = `${label} must be a valid email address.`;
      continue;
    }
    if (rule.type === "phone" && !PHONE_RE.test(value)) {
      errors[rule.name] = `${label} must be a valid phone number.`;
      continue;
    }

    values[rule.name] = value;
  }

  return { values, errors };
}

/**
 * Convenience wrapper for the pipeline: throws a single `validation` AppError
 * carrying all field errors when the body is invalid.
 */
export function assertValid(
  body: Record<string, unknown>,
  rules: FieldRule[],
): Record<string, string> {
  const { values, errors } = validateFields(body, rules);
  const keys = Object.keys(errors);
  if (keys.length > 0) {
    const summary = keys.map((k) => errors[k]).join(" ");
    throw new AppError("validation", summary);
  }
  return values;
}
