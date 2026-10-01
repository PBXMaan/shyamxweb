/**
 * Server functions for the bot-owner /admin panel. Every function re-checks
 * admin status server-side (defense in depth — the /admin layout guard is not
 * the only gate) and every mutation writes an audit event.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/auth.server";
import { isAdminId } from "@/lib/maintenance.server";
import type * as T from "@/lib/zyrox-types";
import type { AdminResult } from "@/lib/zyrox-types";

async function requireAdminUser() {
  const user = await requireUser();
  if (!isAdminId(user.id)) throw new Error("Not authorized");
  return user;
}

type Query = Record<string, string | number | undefined>;

function qs(q?: Query): string {
  if (!q) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Produces the handler body for an admin GET; createServerFn(...) is called literally at each export. */
function adminGetHandler<Resp>(path: string) {
  return async ({ data }: { data: Query }): Promise<AdminResult<Resp>> => {
    await requireAdminUser();
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) return { live: false, data: null };
    try {
      return { live: true, data: await botApi<Resp>(`${path}${qs(data)}`) };
    } catch (error) {
      return { live: false, data: null, errorMessage: (error as Error).message };
    }
  };
}

/** Produces the handler body for an audited admin mutation; createServerFn(...) is called literally at each export. */
function adminWriteHandler<Body, Resp = { status: string }>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  pathFor: (body: Body) => string,
  action: string,
  targetFor: (body: Body) => string = () => "platform",
) {
  return async ({ data }: { data: Body }): Promise<Resp> => {
    const user = await requireAdminUser();
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) throw new Error("Bot API is not configured.");
    const { recordAudit } = await import("@/lib/audit.server");
    const init: RequestInit = { method };
    if (method !== "DELETE") init.body = JSON.stringify(data);
    try {
      const result = await botApi<Resp>(pathFor(data), init);
      await recordAudit(user, action, targetFor(data), "success");
      return result;
    } catch (error) {
      await recordAudit(user, action, targetFor(data), "failure");
      throw error;
    }
  };
}

function adminQueryValidator(d: unknown): Query {
  return (d ?? {}) as Query;
}

export const adminGetSystem = createServerFn({ method: "GET" })
  .inputValidator(adminQueryValidator)
  .handler(adminGetHandler<T.SystemInfo>("/api/v1/admin/system"));
export const adminGetModules = createServerFn({ method: "GET" })
  .inputValidator(adminQueryValidator)
  .handler(adminGetHandler<T.ModulesResponse>("/api/v1/admin/modules"));
export const adminGetDatabase = createServerFn({ method: "GET" })
  .inputValidator(adminQueryValidator)
  .handler(adminGetHandler<T.DatabaseResponse>("/api/v1/admin/database"));
export const adminGetApiStats = createServerFn({ method: "GET" })
  .inputValidator(adminQueryValidator)
  .handler(adminGetHandler<T.ApiStats>("/api/v1/admin/api-stats"));
export const adminGetAudit = createServerFn({ method: "GET" })
  .inputValidator(adminQueryValidator)
  .handler(adminGetHandler<T.AuditEntry[]>("/api/v1/admin/audit"));
export const adminGetGuildEvents = createServerFn({ method: "GET" })
  .inputValidator(adminQueryValidator)
  .handler(adminGetHandler<T.GuildEvent[]>("/api/v1/admin/guild-events"));
export const adminGetAnnouncements = createServerFn({ method: "GET" })
  .inputValidator(adminQueryValidator)
  .handler(adminGetHandler<T.Announcement[]>("/api/v1/admin/announcements"));
export const adminGetMaintenance = createServerFn({ method: "GET" })
  .inputValidator(adminQueryValidator)
  .handler(adminGetHandler<T.MaintenanceState>("/api/v1/admin/maintenance"));

export const adminSetMaintenance = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { enabled: boolean; message?: string })
  .handler((async ({ data }: { data: { enabled: boolean; message?: string } }) => {
    const user = await requireAdminUser();
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) throw new Error("Bot API is not configured.");
    const { recordAudit } = await import("@/lib/audit.server");
    try {
      const result = await botApi<T.MaintenanceState>("/api/v1/admin/maintenance", {
        method: "PUT",
        body: JSON.stringify({
          enabled: data.enabled,
          message: data.message ?? null,
          actor_id: user.id,
          actor_name: user.username,
        }),
      });
      await recordAudit(
        user,
        data.enabled ? "admin.maintenance.enable" : "admin.maintenance.disable",
        "platform",
      );
      return result;
    } catch (error) {
      await recordAudit(user, "admin.maintenance.set", "platform", "failure");
      throw error;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any) as unknown as (opts: {
  data: { enabled: boolean; message?: string };
}) => Promise<T.MaintenanceState>;

type NewAnnouncement = {
  title: string;
  message: string;
  type: T.Announcement["type"];
  active: boolean;
  starts_at: number | null;
  expires_at: number | null;
  created_by: string;
};
export const adminCreateAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as NewAnnouncement)
  .handler(
    adminWriteHandler<NewAnnouncement, T.Announcement>(
      "POST",
      () => "/api/v1/admin/announcements",
      "admin.announcement.create",
      (b) => `announcement:${b.title.slice(0, 60)}`,
    ),
  );

export const adminToggleAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { id: number; active: boolean })
  .handler(
    adminWriteHandler<{ id: number; active: boolean }>(
      "PATCH",
      (b) => `/api/v1/admin/announcements/${Number(b.id)}?active=${b.active ? "true" : "false"}`,
      "admin.announcement.toggle",
      (b) => `announcement:${b.id}`,
    ),
  );

export const adminDeleteAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { id: number })
  .handler(
    adminWriteHandler<{ id: number }>(
      "DELETE",
      (b) => `/api/v1/admin/announcements/${Number(b.id)}`,
      "admin.announcement.delete",
      (b) => `announcement:${b.id}`,
    ),
  );

/** Read-only inspection of any guild's configuration (audited; no writes, no impersonation). */
export const adminInspectGuild = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => {
    const g = (d as { guildId?: string })?.guildId;
    if (typeof g !== "string" || !/^\d{5,25}$/.test(g)) throw new Error("Invalid server id");
    return { guildId: g };
  })
  .handler((async ({ data }: { data: { guildId: string } }) => {
    const user = await requireAdminUser();
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) return { live: false, details: null, modules: {} };
    const { recordAudit } = await import("@/lib/audit.server");
    const get = async (suffix: string) => {
      try {
        return await botApi<unknown>(`/api/v1/guilds/${data.guildId}${suffix}`);
      } catch {
        return null;
      }
    };
    const names = [
      "antinuke",
      "automod",
      "logging",
      "welcome",
      "tickets",
      "leveling",
      "verification",
      "autorole",
      "reactionroles",
      "tracking",
      "j2c",
      "joindm",
      "customroles",
      "autoreact",
      "invcrole",
    ];
    const [details, ...rest] = await Promise.all([get(""), ...names.map((n) => get(`/${n}`))]);
    await recordAudit(user, "admin.guild.inspect", `guild:${data.guildId}`);
    const modules: Record<string, unknown> = {};
    names.forEach((n, i) => (modules[n] = rest[i]));
    return { live: details !== null, details, modules };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any) as unknown as (opts: { data: { guildId: string } }) => Promise<{
  live: boolean;
  details: T.GuildDetails | null;
  modules: Record<string, unknown>;
}>;

/** Admin identities known to this deployment: configured IDs + actors seen in the audit log. IDs only. */
export const adminGetUsers = createServerFn({ method: "GET" }).handler((async () => {
  const me = await requireAdminUser();
  const raw = process.env["ADMIN_DISCORD_IDS"] || process.env["OWNER_IDS"] || "";
  const configured = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
  let audit: T.AuditEntry[] = [];
  let live = false;
  if (botApiConfigured()) {
    try {
      audit = await botApi<T.AuditEntry[]>("/api/v1/admin/audit?limit=500");
      live = true;
    } catch {
      /* leave empty */
    }
  }
  const actors = new Map<string, { id: string; name: string; actions: number; last: number }>();
  for (const e of audit) {
    const a = actors.get(e.actor_id) ?? { id: e.actor_id, name: e.actor_name, actions: 0, last: 0 };
    a.actions += 1;
    a.last = Math.max(a.last, e.ts);
    actors.set(e.actor_id, a);
  }
  return {
    live,
    currentUserId: me.id,
    configuredAdmins: configured,
    actors: [...actors.values()].sort((a, b) => b.last - a.last),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any) as unknown as () => Promise<{
  live: boolean;
  currentUserId: string;
  configuredAdmins: string[];
  actors: Array<{ id: string; name: string; actions: number; last: number }>;
}>;

/** Which dashboard-side settings are present. Booleans only — values are never sent to the browser. */
export const adminGetEnvStatus = createServerFn({ method: "GET" }).handler((async () => {
  await requireAdminUser();
  const has = (k: string) => Boolean(process.env[k]);
  return {
    vars: [
      { key: "BOT_API_BASE_URL", set: has("BOT_API_BASE_URL"), required: true },
      { key: "DASHBOARD_API_KEY", set: has("DASHBOARD_API_KEY"), required: true },
      { key: "DISCORD_CLIENT_ID", set: has("DISCORD_CLIENT_ID"), required: true },
      { key: "DISCORD_CLIENT_SECRET", set: has("DISCORD_CLIENT_SECRET"), required: true },
      { key: "DASHBOARD_SESSION_SECRET", set: has("DASHBOARD_SESSION_SECRET"), required: true },
      {
        key: "ADMIN_DISCORD_IDS / OWNER_IDS",
        set: has("ADMIN_DISCORD_IDS") || has("OWNER_IDS"),
        required: true,
      },
    ],
    sessionSecretLength: (process.env["DASHBOARD_SESSION_SECRET"] ?? "").length,
    apiKeyLength: (process.env["DASHBOARD_API_KEY"] ?? "").length,
    baseUrlIsHttps: (process.env["BOT_API_BASE_URL"] ?? "").startsWith("https://"),
    baseUrlIsInternal: /^http:\/\/(bot|localhost|127\.0\.0\.1)(:|\/|$)/.test(
      process.env["BOT_API_BASE_URL"] ?? "",
    ),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any) as unknown as () => Promise<{
  vars: Array<{ key: string; set: boolean; required: boolean }>;
  sessionSecretLength: number;
  apiKeyLength: number;
  baseUrlIsHttps: boolean;
  baseUrlIsInternal: boolean;
}>;
