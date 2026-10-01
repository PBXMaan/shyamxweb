import { botApi, botApiConfigured } from "@/lib/bot-api.server";
import type { PublicState } from "@/lib/zyrox-types";

/** Platform-admin check used everywhere (server-side only). */
export function isAdminId(userId: string): boolean {
  // ADMIN_DISCORD_IDS wins; otherwise fall back to the bot's own OWNER_IDS so a
  // single shared .env (single-host deployment) configures both sides at once.
  return (process.env["ADMIN_DISCORD_IDS"] || process.env["OWNER_IDS"] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(userId);
}

/**
 * Throws if maintenance mode is on and the caller is not a platform admin.
 * Fails open if the bot API can't be reached (the write would fail anyway).
 */
export async function assertNotInMaintenance(userId: string): Promise<void> {
  if (!botApiConfigured() || isAdminId(userId)) return;
  try {
    const state = await botApi<PublicState>("/api/v1/platform/public-state");
    if (state.maintenance.enabled) {
      throw new Error(
        state.maintenance.message || "ShyamX is currently under maintenance. Changes are disabled.",
      );
    }
  } catch (error) {
    if ((error as Error).message.includes("maintenance")) throw error;
  }
}
