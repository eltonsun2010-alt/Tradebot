import { createSign } from "node:crypto";
import { AppError, classifyHttpStatus } from "../../errors.js";
import type { Enquiry } from "../../types.js";
import type { StorePort, StoredEnquiry } from "../../ports.js";

/**
 * Google Sheets store via a service account (server-to-server, no OAuth dance).
 * The service-account private key + email come from env vars (never config).
 *
 * This is the deliberately-swappable starting point: it satisfies StorePort, so
 * moving to Airtable / a database / a CRM later is a new adapter + a config
 * change, with zero pipeline impact.
 *
 * Sheet columns (row 1 headers expected):
 *   correlationId | idempotencyKey | receivedAt | name | email | phone |
 *   company | subject | message | source | status
 */

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  /** Tab/sheet name, e.g. "Enquiries". */
  sheetName: string;
  clientEmail: string;
  /** PEM private key (with real newlines). */
  privateKey: string;
  dedupeWindowMs: number;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
  now?: () => number;
}

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Mint a short-lived Google access token from the service-account key (RS256). */
async function getAccessToken(cfg: GoogleSheetsConfig): Promise<string> {
  const fetchImpl = cfg.fetchImpl ?? fetch;
  const now = Math.floor((cfg.now ?? Date.now)() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: cfg.clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  );
  const signingInput = `${header}.${claim}`;
  const signature = createSign("RSA-SHA256")
    .update(signingInput)
    .sign(cfg.privateKey, "base64url");
  const assertion = `${signingInput}.${signature}`;

  const res = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });
  if (!res.ok) {
    const kind = classifyHttpStatus(res.status);
    throw new AppError(kind, `Google token request failed (${res.status})`, {
      provider: "googleSheets",
      status: res.status,
    });
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new AppError("permanent", "Google token response missing access_token", {
      provider: "googleSheets",
    });
  }
  return json.access_token;
}

export class GoogleSheetsStore implements StorePort {
  readonly provider = "googleSheets";
  constructor(private readonly cfg: GoogleSheetsConfig) {}

  private get base(): string {
    return `https://sheets.googleapis.com/v4/spreadsheets/${this.cfg.spreadsheetId}`;
  }

  private async request(
    token: string,
    path: string,
    init: RequestInit,
  ): Promise<Response> {
    const fetchImpl = this.cfg.fetchImpl ?? fetch;
    const res = await fetchImpl(`${this.base}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      throw new AppError(
        classifyHttpStatus(res.status),
        `Google Sheets API error (${res.status})`,
        { provider: "googleSheets", status: res.status },
      );
    }
    return res;
  }

  async findByIdempotencyKey(key: string): Promise<StoredEnquiry | null> {
    const token = await getAccessToken(this.cfg);
    const range = encodeURIComponent(`${this.cfg.sheetName}!A2:C`);
    const res = await this.request(token, `/values/${range}`, { method: "GET" });
    const json = (await res.json()) as { values?: string[][] };
    const rows = json.values ?? [];
    const windowStart = (this.cfg.now ?? Date.now)() - this.cfg.dedupeWindowMs;

    for (let i = rows.length - 1; i >= 0; i -= 1) {
      const row = rows[i];
      if (!row) continue;
      const [correlationId, idempotencyKey, storedAt] = row;
      if (idempotencyKey !== key) continue;
      const storedMs = storedAt ? new Date(storedAt).getTime() : 0;
      if (Number.isFinite(storedMs) && storedMs >= windowStart) {
        return {
          idempotencyKey: key,
          correlationId: correlationId ?? "",
          storedAt: storedAt ?? "",
          ref: `row-${i + 2}`,
        };
      }
    }
    return null;
  }

  async save(enquiry: Enquiry): Promise<StoredEnquiry> {
    const token = await getAccessToken(this.cfg);
    const range = encodeURIComponent(`${this.cfg.sheetName}!A1`);
    const storedAt = new Date((this.cfg.now ?? Date.now)()).toISOString();
    const row = [
      enquiry.correlationId,
      enquiry.idempotencyKey,
      storedAt,
      enquiry.name,
      enquiry.email,
      enquiry.phone ?? "",
      enquiry.company ?? "",
      enquiry.subject ?? "",
      enquiry.message,
      enquiry.source ?? "",
      "stored",
    ];
    const res = await this.request(
      token,
      `/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { method: "POST", body: JSON.stringify({ values: [row] }) },
    );
    const json = (await res.json()) as {
      updates?: { updatedRange?: string };
    };
    return {
      idempotencyKey: enquiry.idempotencyKey,
      correlationId: enquiry.correlationId,
      storedAt,
      ref: json.updates?.updatedRange ?? "appended",
    };
  }
}
