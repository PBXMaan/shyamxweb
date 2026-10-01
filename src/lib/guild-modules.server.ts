/**
 * One GET/PATCH(POST) pair per bot module endpoint. Every export below writes
 * `createServerFn(...).handler(...)` LITERALLY at the export site — this is a hard
 * requirement of the framework's build-time plugin, which needs to see that exact
 * pattern directly to correctly split/register each server function. Returning the
 * whole chain from a factory function silently breaks it (the call resolves to
 * `undefined` instead of running); only the HANDLER BODY may be produced by a shared
 * factory (getFnHandler/writeFnHandler below), never the createServerFn(...) call
 * itself. See DEPLOY.md "Server function gotcha" for the full writeup.
 *
 * Every endpoint here corresponds 1:1 to a route in api/routes/guilds.py — see
 * that file for the source of truth. Nothing here invents a field or a route.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireUser, assertGuildAccess } from "@/lib/auth.server";
import { isValidGuildId } from "@/lib/id-validation";
import type * as T from "@/lib/zyrox-types";
import type { ModuleResult } from "@/lib/zyrox-types";

function validateGuildId(data: unknown): { guildId: string } {
  const guildId = (data as { guildId?: string } | undefined)?.guildId;
  if (!isValidGuildId(guildId)) throw new Error("Invalid server id");
  return { guildId };
}

function validateGuildBody<B>(data: unknown): { guildId: string; body: B } {
  const d = data as { guildId?: string; body?: B } | undefined;
  if (!isValidGuildId(d?.guildId)) throw new Error("Invalid server id");
  return { guildId: d!.guildId, body: (d?.body ?? {}) as B };
}

/** Produces just the handler body for a GET; the createServerFn(...) call happens at each export. */
function getFnHandler<Resp>(path: string) {
  return async ({ data }: { data: { guildId: string } }): Promise<ModuleResult<Resp>> => {
    const user = await requireUser();
    assertGuildAccess(user, data.guildId);
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) return { live: false, data: null };
    try {
      const result = await botApi<Resp>(`/api/v1/guilds/${data.guildId}${path}`);
      return { live: true, data: result };
    } catch (error) {
      return { live: false, data: null, errorMessage: (error as Error).message };
    }
  };
}

/** Produces just the handler body for a write; the createServerFn(...) call happens at each export. */
function writeFnHandler<Body, Resp = { status: string }>(
  path: string,
  method: "PATCH" | "POST" | "DELETE" = "PATCH",
) {
  return async ({ data }: { data: { guildId: string; body: Body } }): Promise<Resp> => {
    const user = await requireUser();
    assertGuildAccess(user, data.guildId);
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) {
      throw new Error("Bot API is not configured. Connect it under Settings first.");
    }
    // Maintenance is enforced here, server-side: while it's on, only platform
    // admins may change configuration. The browser can't bypass this.
    const { assertNotInMaintenance } = await import("@/lib/maintenance.server");
    await assertNotInMaintenance(user.id);

    const { recordAudit } = await import("@/lib/audit.server");
    const init: RequestInit = { method };
    if (method !== "DELETE") init.body = JSON.stringify(data.body);
    const action = `config.${method.toLowerCase()} ${path || "/"}`;
    try {
      const result = await botApi<Resp>(`/api/v1/guilds/${data.guildId}${path}`, init);
      await recordAudit(user, action, `guild:${data.guildId}`, "success");
      return result;
    } catch (error) {
      await recordAudit(user, action, `guild:${data.guildId}`, "failure");
      throw error;
    }
  };
}

// ---------- Shared guild data (used by selectors on every module page) ----------
export const getGuildDetails = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.GuildDetails>(""));
export const getGuildChannels = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.DiscordChannel[]>("/channels"));
export const getGuildRoles = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.DiscordRole[]>("/roles"));

// ---------- Prefix ----------
export const getPrefix = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.PrefixConfig>("/prefix"));
export const setPrefix = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<{ prefix: string }>(data))
  .handler(writeFnHandler<{ prefix: string }>("/prefix", "POST"));

// ---------- AutoMod ----------
export const getAutomod = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.AutomodConfig>("/automod"));
export const patchAutomod = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<Partial<T.AutomodConfig>>(data))
  .handler(writeFnHandler<Partial<T.AutomodConfig>>("/automod"));

// ---------- AntiNuke ----------
type AntiNukeBody = { status?: boolean; add_whitelist?: string; remove_whitelist?: string };
export const getAntiNuke = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.AntiNukeConfig>("/antinuke"));
export const patchAntiNuke = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<AntiNukeBody>(data))
  .handler(writeFnHandler<AntiNukeBody>("/antinuke"));

// ---------- Logging ----------
// Note: the bot's LoggingUpdate schema only accepts log_enabled/log_channels — ignore_* and
// auto_delete_duration are read-only from the dashboard's perspective (no PATCH support yet).
type LoggingBody = { log_enabled?: Record<string, boolean>; log_channels?: Record<string, number> };
export const getLogging = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.LoggingConfig>("/logging"));
export const patchLogging = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<LoggingBody>(data))
  .handler(writeFnHandler<LoggingBody>("/logging"));

// ---------- Welcome ----------
type WelcomeBody = {
  welcome_type?: string;
  welcome_message?: string;
  channel_id?: string | null;
  embed_data?: T.WelcomeEmbedData | undefined;
};
export const getWelcome = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.WelcomeConfig>("/welcome"));
export const patchWelcome = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<WelcomeBody>(data))
  .handler(writeFnHandler<WelcomeBody>("/welcome"));
export const deleteWelcome = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<Record<string, never>>(data))
  .handler(writeFnHandler<Record<string, never>>("/welcome", "DELETE"));

// ---------- Tickets ----------
type TicketsBody = {
  panel_channel?: number | undefined;
  logging_channel?: number | undefined;
  closed_category?: number | undefined;
  panel_type?: string;
  embed_title?: string;
  embed_description?: string;
  embed_color?: number;
  embed_image_url?: string | undefined;
  embed_thumbnail_url?: string;
  categories?: T.TicketCategory[];
  staff_roles?: number[];
};
export const getTickets = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.TicketConfig>("/tickets"));
export const patchTickets = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<TicketsBody>(data))
  .handler(writeFnHandler<TicketsBody>("/tickets"));

// ---------- Leveling ----------
// Note: LevelingUpdate only supports these five fields — thumbnail/image are set elsewhere in the bot.
type LevelingBody = {
  enabled?: boolean;
  xp_per_message?: number;
  cooldown?: number;
  level_up_channel?: number | undefined;
  embed_color?: string;
};
export const getLeveling = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.LevelingConfig>("/leveling"));
export const patchLeveling = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<LevelingBody>(data))
  .handler(writeFnHandler<LevelingBody>("/leveling"));
export const getLevelingLeaderboard = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.LeaderboardEntry[]>("/leveling/leaderboard"));

// ---------- Verification ----------
type VerificationBody = {
  enabled?: boolean;
  verification_channel_id?: string | undefined;
  verified_role_id?: string | undefined;
  log_channel_id?: string | undefined;
  verification_method?: string;
};
export const getVerification = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.VerificationConfig>("/verification"));
export const patchVerification = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<VerificationBody>(data))
  .handler(writeFnHandler<VerificationBody>("/verification"));

// ---------- Vanity Roles (list-based, not a single config object) ----------
export const getVanityRoles = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.VanityRoleSetup[]>("/vanityroles"));
export const upsertVanityRole = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<T.VanityRoleSetup>(data))
  .handler(
    writeFnHandler<T.VanityRoleSetup, { status: string; vanity: string }>("/vanityroles", "POST"),
  );
export const deleteVanityRole = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as { guildId?: string; vanity?: string };
    if (!isValidGuildId(d.guildId)) throw new Error("Invalid server id");
    if (!d.vanity) throw new Error("Missing vanity code");
    return { guildId: d.guildId, vanity: d.vanity };
  })
  .handler(async ({ data }: { data: { guildId: string; vanity: string } }) => {
    const user = await requireUser();
    assertGuildAccess(user, data.guildId);
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) {
      throw new Error("Bot API is not configured. Connect it under Settings first.");
    }
    const { assertNotInMaintenance } = await import("@/lib/maintenance.server");
    await assertNotInMaintenance(user.id);
    const { recordAudit } = await import("@/lib/audit.server");
    try {
      const result = await botApi<{ status: string }>(
        `/api/v1/guilds/${data.guildId}/vanityroles/${encodeURIComponent(data.vanity)}`,
        { method: "DELETE" },
      );
      await recordAudit(user, "config.delete /vanityroles", `guild:${data.guildId}`, "success");
      return result;
    } catch (error) {
      await recordAudit(user, "config.delete /vanityroles", `guild:${data.guildId}`, "failure");
      throw error;
    }
  });

// ---------- AutoRole ----------
type AutoRoleBody = { bots?: string[]; humans?: string[] };
export const getAutoRole = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.AutoRoleConfig>("/autorole"));
export const patchAutoRole = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<AutoRoleBody>(data))
  .handler(writeFnHandler<AutoRoleBody>("/autorole"));

// ---------- Tracking (member-count / invite-log channel) ----------
type TrackingBody = { channel_id?: number | null };
export const getTracking = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.TrackingConfig>("/tracking"));
export const patchTracking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<TrackingBody>(data))
  .handler(writeFnHandler<TrackingBody>("/tracking"));

// ---------- Join 2 Create ----------
type J2CBody = {
  join_channel_id?: string | null;
  control_channel_id?: string | null;
  category_id?: string | null;
};
export const getJ2C = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.J2CConfig>("/j2c"));
export const patchJ2C = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<J2CBody>(data))
  .handler(writeFnHandler<J2CBody>("/j2c"));

// ---------- Join DM ----------
type JoinDMBody = { message?: string | null };
export const getJoinDM = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.JoinDMConfig>("/joindm"));
export const patchJoinDM = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<JoinDMBody>(data))
  .handler(writeFnHandler<JoinDMBody>("/joindm"));

// ---------- Custom Roles ----------
export const getCustomRoles = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.CustomRoleConfig>("/customroles"));
export const patchCustomRoles = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<Partial<T.CustomRoleConfig>>(data))
  .handler(writeFnHandler<Partial<T.CustomRoleConfig>>("/customroles"));

// ---------- Auto React ----------
type AutoReactBody = { triggers: T.AutoReactTrigger[] };
export const getAutoReact = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.AutoReactConfig>("/autoreact"));
export const patchAutoReact = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<AutoReactBody>(data))
  .handler(writeFnHandler<AutoReactBody>("/autoreact"));

// ---------- Invite-to-VC Role ----------
type InvcRoleBody = { role_id?: string | null; enabled?: boolean };
export const getInvcRole = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.InvcConfig>("/invcrole"));
export const patchInvcRole = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<InvcRoleBody>(data))
  .handler(writeFnHandler<InvcRoleBody>("/invcrole"));

// ---------- Reaction Roles ----------
type ReactionRolesBody = {
  dm_enabled?: boolean;
  add_role?: T.ReactionRoleEntry;
  remove_role_message_id?: string;
  remove_role_emoji?: string;
};
export const getReactionRoles = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.RRConfig>("/reactionroles"));
export const patchReactionRoles = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateGuildBody<ReactionRolesBody>(data))
  .handler(writeFnHandler<ReactionRolesBody>("/reactionroles"));

// ---------- Invite Tracking Leaderboard (read-only) ----------
export const getInvitesLeaderboard = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(getFnHandler<T.InvitesLeaderboard>("/invites"));

// ---------- Recent configuration activity for this guild (from the platform audit trail) ----------
type GuildActivity = {
  live: boolean;
  entries: Array<{ id: number; ts: number; actor_name: string; action: string; result: string }>;
};
export const getGuildActivity = createServerFn({ method: "GET" })
  .inputValidator(validateGuildId)
  .handler(async ({ data }: { data: { guildId: string } }): Promise<GuildActivity> => {
    const user = await requireUser();
    assertGuildAccess(user, data.guildId);
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) return { live: false, entries: [] };
    try {
      const rows = await botApi<T.AuditEntry[]>(
        `/api/v1/admin/audit?limit=100&q=${encodeURIComponent(`guild:${data.guildId}`)}`,
      );
      return {
        live: true,
        // Only this guild's own entries, and never the actor's Discord ID.
        entries: rows
          .filter((r) => r.target === `guild:${data.guildId}`)
          .slice(0, 15)
          .map((r) => ({
            id: r.id,
            ts: r.ts,
            actor_name: r.actor_name,
            action: r.action,
            result: r.result,
          })),
      };
    } catch {
      return { live: false, entries: [] };
    }
  });
