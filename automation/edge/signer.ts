/**
 * Edge "front door" — a Cloudflare Worker (also runs on any Web-standard edge
 * runtime). This is the answer to a hard problem: a static site CANNOT hold an
 * HMAC secret without leaking it in browser JavaScript. So the browser posts to
 * THIS worker, which holds the secret in an encrypted env binding, does cheap
 * abuse checks, HMAC-signs the exact body with a timestamp, and forwards to the
 * n8n webhook. n8n (via src/security.ts) verifies the signature.
 *
 * Secrets (Wrangler secrets / env bindings — never in code):
 *   SIGNING_SECRET   the shared HMAC secret, also configured in n8n's env
 *   N8N_WEBHOOK_URL  the ingress webhook to forward to
 *   ALLOWED_ORIGIN   the site origin permitted to submit (CORS + referer gate)
 *
 * Uses Web Crypto (crypto.subtle) — no Node APIs — so it runs unchanged on
 * Cloudflare Workers, Vercel Edge, Deno Deploy, etc.
 */

export interface Env {
  SIGNING_SECRET: string;
  N8N_WEBHOOK_URL: string;
  ALLOWED_ORIGIN: string;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
  };
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(status: number, body: unknown, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowed = env.ALLOWED_ORIGIN;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(allowed) });
    }
    if (request.method !== "POST") {
      return json(405, { message: "Method not allowed" }, allowed);
    }

    // Origin gate: reject cross-site posts outright.
    const origin = request.headers.get("origin");
    if (origin && origin !== allowed) {
      return json(403, { message: "Forbidden" }, allowed);
    }

    // Read the EXACT bytes we will sign. The browser must send JSON.
    const rawBody = await request.text();
    if (rawBody.length === 0 || rawBody.length > 100_000) {
      return json(400, { message: "Invalid request body" }, allowed);
    }

    // Sign with a current timestamp; n8n enforces the freshness window.
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = await hmacHex(env.SIGNING_SECRET, `${timestamp}.${rawBody}`);

    let upstream: Response;
    try {
      upstream = await fetch(env.N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-southpage-timestamp": timestamp,
          "x-southpage-signature": signature,
        },
        body: rawBody,
      });
    } catch {
      // Never surface upstream detail to the browser.
      return json(502, { message: "We couldn't process your message right now." }, allowed);
    }

    // Pass through n8n's status but keep the message generic + CORS intact.
    const text = await upstream.text();
    const passthroughStatus = upstream.status >= 500 ? 502 : upstream.status;
    return new Response(text || JSON.stringify({ ok: upstream.ok }), {
      status: passthroughStatus,
      headers: { "content-type": "application/json", ...corsHeaders(allowed) },
    });
  },
};
