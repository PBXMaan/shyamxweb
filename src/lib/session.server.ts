import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "shyamx_session";
export const OAUTH_STATE_COOKIE = "shyamx_oauth_state";
// 24h: the session embeds the user's manageable-guild list, so a short lifetime
// keeps revoked Discord permissions from lingering for days.
const MAX_AGE = 60 * 60 * 24;

export type DashboardSession = {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  guilds: Array<{ id: string; name: string; icon: string | null; owner: boolean }>;
  exp: number;
};

function secret(): string {
  const value = process.env["DASHBOARD_SESSION_SECRET"];
  if (!value) throw new Error("DASHBOARD_SESSION_SECRET is not configured");
  if (value.length < 32) {
    throw new Error(
      "DASHBOARD_SESSION_SECRET must be at least 32 characters (try: openssl rand -hex 32)",
    );
  }
  return value;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function signSession(session: Omit<DashboardSession, "exp">): string {
  const payload: DashboardSession = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac("sha256", secret()).update(body).digest());
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined | null): DashboardSession | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = b64url(createHmac("sha256", secret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(fromB64url(body).toString("utf8")) as DashboardSession;
    if (!parsed.exp || parsed.exp * 1000 < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * "Secure" cookies are dropped by browsers on plain http:// (except localhost), which would
 * cause an endless login loop. HTTPS is strongly recommended in production; only an explicit
 * http:// PUBLIC_URL (e.g. a LAN test box) switches Secure off.
 */
function secureAttr(): string[] {
  return (process.env["PUBLIC_URL"] ?? "").trim().toLowerCase().startsWith("http://")
    ? []
    : ["Secure"];
}

export function sessionCookie(value: string, maxAge = MAX_AGE): string {
  return [
    `${SESSION_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    ...secureAttr(),
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ].join("; ");
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

/** Short-lived cookie binding an OAuth login attempt to this browser (CSRF protection). */
export function oauthStateCookie(value: string, maxAge = 600): string {
  return [
    `${OAUTH_STATE_COOKIE}=${value}`,
    "Path=/api/public/auth",
    "HttpOnly",
    ...secureAttr(),
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ].join("; ");
}

/**
 * The site's public origin. Prefer PUBLIC_URL (required behind a reverse proxy,
 * where the request URL is the internal address, and immune to Host-header spoofing).
 */
export function publicOrigin(request: Request): string {
  const configured = process.env["PUBLIC_URL"]?.trim().replace(/\/+$/, "");
  return configured || new URL(request.url).origin;
}
