import { AppError } from "../../errors.js";
import type { Enquiry } from "../../types.js";
import type { StorePort, StoredEnquiry } from "../../ports.js";

/**
 * TEMPLATE / STUB adapter — shows exactly how to add a new store provider.
 *
 * To make Airtable (or Notion, HubSpot, Postgres) the persistence layer:
 *   1. Copy this file, implement the two methods against the provider's API.
 *   2. Read secrets from `secrets` (env-var values the factory resolved).
 *   3. Register the provider in factory.ts.
 *   4. Point the client config's `store.provider` at it.
 * No pipeline, validation, templating, or test change is required. That is the
 * whole point of the ports-and-adapters design.
 */
export interface AirtableConfig {
  apiKey: string;
  baseId: string;
  tableName: string;
  dedupeWindowMs: number;
  fetchImpl?: typeof fetch;
}

export class AirtableStore implements StorePort {
  readonly provider = "airtable";
  constructor(private readonly _cfg: AirtableConfig) {}

  async findByIdempotencyKey(_key: string): Promise<StoredEnquiry | null> {
    throw new AppError("config", "AirtableStore is a template stub — implement before use", {
      provider: this.provider,
    });
  }

  async save(_enquiry: Enquiry): Promise<StoredEnquiry> {
    throw new AppError("config", "AirtableStore is a template stub — implement before use", {
      provider: this.provider,
    });
  }
}
