import type { Enquiry } from "../../types.js";
import type { StorePort, StoredEnquiry } from "../../ports.js";

/**
 * In-memory store. Used by tests and local development, and as the reference
 * implementation of StorePort — it shows exactly what a store must do:
 * de-duplicate by idempotency key within a window, and persist.
 */
export class InMemoryStore implements StorePort {
  readonly provider = "inMemory";
  private readonly rows = new Map<string, StoredEnquiry>();

  constructor(private readonly dedupeWindowMs: number = 24 * 60 * 60 * 1000) {}

  async findByIdempotencyKey(key: string): Promise<StoredEnquiry | null> {
    const row = this.rows.get(key);
    if (!row) return null;
    const age = Date.now() - new Date(row.storedAt).getTime();
    return age <= this.dedupeWindowMs ? row : null;
  }

  async save(enquiry: Enquiry): Promise<StoredEnquiry> {
    const stored: StoredEnquiry = {
      idempotencyKey: enquiry.idempotencyKey,
      correlationId: enquiry.correlationId,
      storedAt: new Date().toISOString(),
      ref: `mem-${this.rows.size + 1}`,
    };
    this.rows.set(enquiry.idempotencyKey, stored);
    return stored;
  }

  /** Test helper. */
  get size(): number {
    return this.rows.size;
  }
}
