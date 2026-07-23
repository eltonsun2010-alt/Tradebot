import { AppError } from "./errors.js";
import type { ClientConfig, EnvRef } from "../config/schema.js";
import type { EmailPort, StorePort } from "./ports.js";
import { InMemoryStore } from "./adapters/store/inMemory.js";
import { GoogleSheetsStore } from "./adapters/store/googleSheets.js";
import { AirtableStore } from "./adapters/store/airtable.js";
import { ConsoleEmail } from "./adapters/email/console.js";
import { ResendEmail } from "./adapters/email/resend.js";

/**
 * The composition root. It is the ONLY place that reads environment variables
 * and decides which concrete adapter implements each port. Everything else
 * depends on interfaces. Swapping providers or onboarding a client happens
 * here + in config, never in business logic.
 */

export type Env = Record<string, string | undefined>;

/** Resolve a secret by its env-var NAME. Fails loud (config error) if absent. */
function requireEnv(env: Env, ref: EnvRef): string {
  const value = env[ref.var];
  if (!value || value.trim().length === 0) {
    throw new AppError("config", `Missing required environment variable: ${ref.var}`);
  }
  return value;
}

export interface Adapters {
  store: StorePort;
  email: EmailPort;
}

export interface FactoryIO {
  /** Injectable fetch for adapters (tests pass a fake). */
  fetchImpl?: typeof fetch;
  now?: () => number;
  log?: (line: string) => void;
  /** Injectable retry backoff sleep (consumed by the pipeline, not the factory). */
  sleep?: (ms: number) => Promise<void>;
  /** Injectable RNG for jitter (consumed by the pipeline, not the factory). */
  random?: () => number;
}

function buildStore(config: ClientConfig, env: Env, io: FactoryIO): StorePort {
  const windowMs = config.store.dedupeWindowMinutes * 60 * 1000;
  const { provider, options, secrets } = config.store;

  switch (provider) {
    case "inMemory":
      return new InMemoryStore(windowMs);

    case "googleSheets":
      return new GoogleSheetsStore({
        spreadsheetId: options.spreadsheetId ?? "",
        sheetName: options.sheetName ?? "Enquiries",
        clientEmail: requireEnv(env, secrets.clientEmail as EnvRef),
        // Env vars flatten newlines to \n; restore them for the PEM parser.
        privateKey: requireEnv(env, secrets.privateKey as EnvRef).replace(/\\n/g, "\n"),
        dedupeWindowMs: windowMs,
        ...(io.fetchImpl ? { fetchImpl: io.fetchImpl } : {}),
        ...(io.now ? { now: io.now } : {}),
      });

    case "airtable":
      return new AirtableStore({
        apiKey: requireEnv(env, secrets.apiKey as EnvRef),
        baseId: options.baseId ?? "",
        tableName: options.tableName ?? "Enquiries",
        dedupeWindowMs: windowMs,
        ...(io.fetchImpl ? { fetchImpl: io.fetchImpl } : {}),
      });

    case "notion":
    case "hubspot":
      throw new AppError(
        "config",
        `Store provider "${provider}" is declared but not yet implemented — add an adapter under src/adapters/store/`,
      );

    default: {
      const _exhaustive: never = provider;
      throw new AppError("config", `Unknown store provider: ${String(_exhaustive)}`);
    }
  }
}

function buildEmail(config: ClientConfig, env: Env, io: FactoryIO): EmailPort {
  const { provider, secrets } = config.email;

  switch (provider) {
    case "console":
      return new ConsoleEmail(io.log);

    case "resend":
      return new ResendEmail({
        apiKey: requireEnv(env, secrets.apiKey as EnvRef),
        ...(io.fetchImpl ? { fetchImpl: io.fetchImpl } : {}),
      });

    case "postmark":
    case "sendgrid":
    case "gmail":
    case "outlook":
      throw new AppError(
        "config",
        `Email provider "${provider}" is declared but not yet implemented — add an adapter under src/adapters/email/`,
      );

    default: {
      const _exhaustive: never = provider;
      throw new AppError("config", `Unknown email provider: ${String(_exhaustive)}`);
    }
  }
}

/** Build every adapter a client needs. Throws a `config` error on missing env. */
export function buildAdapters(config: ClientConfig, env: Env, io: FactoryIO = {}): Adapters {
  return {
    store: buildStore(config, env, io),
    email: buildEmail(config, env, io),
  };
}
