/**
 * Thin client for the bot's FastAPI backend (api/server.py in the bot repo).
 * Auth: Bearer DASHBOARD_API_KEY. Base URL: BOT_API_BASE_URL.
 *
 * This is the single source of truth for talking to the bot API — everything
 * runs server-side, so DASHBOARD_API_KEY never reaches the browser.
 */

const TIMEOUT_MS = 8000;

export function botApiConfigured(): boolean {
  return Boolean(process.env["BOT_API_BASE_URL"] && process.env["DASHBOARD_API_KEY"]);
}

/** Accepts https://host, https://host/, or https://host/api/v1 — never yields /api/v1/api/v1. */
function normalizedBase(raw: string): string {
  return raw
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/i, "");
}

function friendlyMessage(status: number): string {
  switch (status) {
    case 401:
      return "The bot API rejected the dashboard API key (check DASHBOARD_API_KEY).";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return "Not found on the bot API.";
    case 409:
      return "That change conflicts with the current configuration.";
    case 422:
      return "The bot rejected that configuration as invalid.";
    case 429:
      return "Too many requests — slow down and try again.";
    case 503:
      return "The bot is still starting up. Try again in a moment.";
    default:
      return status >= 500
        ? "The bot API hit an internal error."
        : `Bot API request failed (${status}).`;
  }
}

export async function botApi<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env["BOT_API_BASE_URL"];
  const key = process.env["DASHBOARD_API_KEY"];
  if (!base || !key) throw new Error("Bot API is not configured");

  let res: Response;
  try {
    res = await fetch(`${normalizedBase(base)}${path}`, {
      ...init,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    const name = (error as Error).name;
    throw new Error(
      name === "TimeoutError" || name === "AbortError"
        ? "The bot API took too long to respond (is the bot offline?)."
        : "Could not reach the bot API (is the bot offline?).",
    );
  }

  if (!res.ok) {
    // Full body stays in server logs only — never shown to users (may contain stack traces).
    const text = await res.text().catch(() => "");
    console.error(`Bot API ${path} failed [${res.status}]: ${text.slice(0, 500)}`);
    throw new Error(friendlyMessage(res.status));
  }
  return (await res.json()) as T;
}
