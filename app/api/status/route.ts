import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Public, read-only status proxy. The bot API key stays on the server and is
 * never shipped to the browser. The upstream /bot/status endpoint is the
 * source of truth for the live bot metrics.
 */
export async function GET() {
  const baseUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/+$/, "");
  const apiKey = process.env.DASHBOARD_API_KEY || process.env.NEXT_PUBLIC_DASHBOARD_API_KEY;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${baseUrl}/bot/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status === 404 ? "endpoint_missing" : "upstream_error",
          message: response.status === 404
            ? "The bot API does not expose its /bot/status endpoint."
            : `The bot API returned HTTP ${response.status}.`,
          checkedAt: new Date().toISOString(),
        },
        { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    const data: unknown = await response.json();
    const payload = data && typeof data === "object" && !Array.isArray(data)
      ? data as Record<string, unknown>
      : null;
    const hasRequiredMetrics = Boolean(
      payload &&
      typeof payload.user === "string" &&
      Number.isFinite(Number(payload.latency)) &&
      Number.isFinite(Number(payload.guild_count)) &&
      Number.isFinite(Number(payload.user_count))
    );

    if (!payload || !hasRequiredMetrics) {
      return NextResponse.json(
        { ok: false, status: "invalid_response", message: "The bot API response is missing required live status fields.", checkedAt: new Date().toISOString() },
        { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    return NextResponse.json(
      { ok: true, data: payload, checkedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      {
        ok: false,
        status: timedOut ? "timeout" : "unreachable",
        message: timedOut ? "The bot API did not respond within 8 seconds." : "Could not connect to the bot API. Check the API URL and network connection.",
        checkedAt: new Date().toISOString(),
      },
      { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } finally {
    clearTimeout(timeout);
  }
}
