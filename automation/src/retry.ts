import { toAppError } from "./errors.js";

export interface RetryOptions {
  /** Number of *additional* attempts after the first (0 = no retry). */
  retries: number;
  /** Base backoff in ms; grows exponentially. */
  baseMs: number;
  /** Upper bound for a single backoff wait. */
  maxMs: number;
  /** Jitter fraction (0–1) to avoid thundering herds. Default 0.2. */
  jitter?: number;
}

export interface RetryContext {
  attempts: number;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Run `fn` with exponential backoff, retrying only when `isRetriable` says so.
 * Returns the value plus the attempt count (for the step's audit record).
 *
 * `sleep` and `random` are injectable so tests run instantly and deterministically.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions,
  isRetriable: (err: unknown) => boolean,
  io: { sleep?: (ms: number) => Promise<void>; random?: () => number } = {},
): Promise<{ value: T; attempts: number }> {
  const sleep = io.sleep ?? defaultSleep;
  const random = io.random ?? Math.random;
  const jitter = opts.jitter ?? 0.2;

  let attempt = 0;
  // total tries = retries + 1
  for (;;) {
    attempt += 1;
    try {
      const value = await fn(attempt);
      return { value, attempts: attempt };
    } catch (err) {
      const isLast = attempt > opts.retries;
      if (isLast || !isRetriable(err)) {
        // Preserve the typed error but stamp the final attempt count via cause.
        throw toAppError(err);
      }
      const backoff = Math.min(opts.maxMs, opts.baseMs * 2 ** (attempt - 1));
      const wait = backoff * (1 + jitter * (random() * 2 - 1));
      await sleep(Math.max(0, Math.round(wait)));
    }
  }
}
