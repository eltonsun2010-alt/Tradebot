import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "./errors.js";

/**
 * Anti-abuse primitives: HMAC request signing + honeypot.
 *
 * IMPORTANT ARCHITECTURAL NOTE. A static, client-side form cannot hold an HMAC
 * secret without exposing it in browser JavaScript. The secret therefore lives
 * in an edge "front door" (see edge/signer.ts): the browser POSTs to the edge,
 * the edge validates origin + honeypot, signs the canonical body with a
 * timestamp, and forwards to n8n. This module is what n8n (or the handler) uses
 * to VERIFY that signature. It never runs in the browser.
 */

/** The canonical string that both signer and verifier agree to sign. */
export function canonicalString(timestamp: string, rawBody: string): string {
  return `${timestamp}.${rawBody}`;
}

/** Compute the hex HMAC-SHA256 of the canonical string. */
export function signPayload(secret: string, timestamp: string, rawBody: string): string {
  return createHmac("sha256", secret)
    .update(canonicalString(timestamp, rawBody))
    .digest("hex");
}

/** Constant-time hex comparison; false on any length/format mismatch. */
function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let bufA: Buffer;
  let bufB: Buffer;
  try {
    bufA = Buffer.from(a, "hex");
    bufB = Buffer.from(b, "hex");
  } catch {
    return false;
  }
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return timingSafeEqual(bufA, bufB);
}

export interface VerifyOptions {
  secret: string;
  /** How old a signature may be, in seconds (replay protection). Default 300. */
  toleranceSeconds?: number;
  /** Injectable clock for deterministic tests. */
  now?: () => number;
}

/**
 * Verify an incoming signed request. Throws an `abuse` AppError on any failure
 * so the pipeline rejects it with a uniform 401/403 and no detail leaks.
 * Rejects stale timestamps to defeat replay of a captured valid request.
 */
export function verifySignature(
  timestamp: string,
  rawBody: string,
  signature: string,
  opts: VerifyOptions,
): void {
  const tolerance = opts.toleranceSeconds ?? 300;
  const now = (opts.now ?? Date.now)();

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    throw new AppError("abuse", "Invalid signature timestamp");
  }
  const ageSeconds = Math.abs(now / 1000 - ts);
  if (ageSeconds > tolerance) {
    throw new AppError("abuse", "Signature timestamp outside tolerance");
  }

  const expected = signPayload(opts.secret, timestamp, rawBody);
  if (!safeEqualHex(expected, signature)) {
    throw new AppError("abuse", "Signature verification failed");
  }
}

/**
 * Honeypot check. The form carries a hidden field a human never fills; a bot
 * that auto-fills every input trips it. Any non-empty value means "bot".
 */
export function isHoneypotTripped(
  body: Record<string, unknown>,
  fieldName: string,
): boolean {
  const value = body[fieldName];
  return typeof value === "string" && value.trim().length > 0;
}
