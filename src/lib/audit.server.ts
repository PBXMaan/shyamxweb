/**
 * Best-effort audit trail. Writes to the bot's platform.db via
 * POST /api/v1/admin/audit. Never throws — auditing must not break the action
 * being audited — and never stores secrets (callers pass only ids/action names).
 */
import { botApi, botApiConfigured } from "@/lib/bot-api.server";

export async function recordAudit(
  actor: { id: string; username: string },
  action: string,
  target: string,
  result: "success" | "failure" = "success",
): Promise<void> {
  if (!botApiConfigured()) return;
  try {
    await botApi("/api/v1/admin/audit", {
      method: "POST",
      body: JSON.stringify({
        actor_id: actor.id,
        actor_name: actor.username,
        action,
        target,
        result,
      }),
    });
  } catch {
    /* audit is best-effort */
  }
}
