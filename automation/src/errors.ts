import type { ErrorKind, SerializedError } from "./types.js";

/**
 * A single, typed error for the whole framework. `kind` drives behaviour:
 * transient errors are retried, permanent ones are dead-lettered, validation /
 * abuse / duplicate shape the HTTP response. Business logic never throws raw
 * strings — always an AppError — so the pipeline can reason about failures.
 */
export class AppError extends Error {
  readonly kind: ErrorKind;
  readonly provider?: string;
  readonly status?: number;

  constructor(
    kind: ErrorKind,
    message: string,
    opts: { provider?: string; status?: number; cause?: unknown } = {},
  ) {
    super(message, opts.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = "AppError";
    this.kind = kind;
    this.provider = opts.provider;
    this.status = opts.status;
  }

  /** Transient failures are the only ones worth retrying automatically. */
  get retriable(): boolean {
    return this.kind === "transient";
  }

  serialize(): SerializedError {
    const out: SerializedError = { kind: this.kind, message: this.message };
    if (this.provider) out.provider = this.provider;
    if (this.status !== undefined) out.status = this.status;
    return out;
  }
}

/** HTTP status → transient vs permanent. 408/425/429 + 5xx are worth retrying. */
export function classifyHttpStatus(status: number): "transient" | "permanent" {
  if (status === 408 || status === 425 || status === 429) return "transient";
  if (status >= 500 && status <= 599) return "transient";
  return "permanent";
}

/** Normalise anything thrown into an AppError so the pipeline stays predictable. */
export function toAppError(e: unknown, fallbackProvider?: string): AppError {
  if (e instanceof AppError) return e;
  // Network-level failures (fetch throwing) are almost always transient.
  const message = e instanceof Error ? e.message : String(e);
  const opts = fallbackProvider ? { provider: fallbackProvider } : {};
  return new AppError("transient", message, opts);
}
