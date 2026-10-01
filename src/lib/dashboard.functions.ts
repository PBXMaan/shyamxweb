import { createServerFn } from "@tanstack/react-start";
import { demoGuilds, demoLeaderboard, demoLogs, demoModules, demoStatus } from "@/lib/demo-data";
import { currentSession, assertGuildAccess, type SessionUser } from "@/lib/auth.server";

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonRecord = { [key: string]: JsonValue };

export type { SessionUser };

/**
 * Connection state shown on every data page:
 *  live         real data from the bot API
 *  demo         built-in sample data, ONLY when ENABLE_DEMO_DATA=true (development)
 *  offline      the API is configured but unreachable / erroring: no data is invented
 *  unconfigured BOT_API_BASE_URL / DASHBOARD_API_KEY are missing
 */
export type DataMode = "live" | "demo" | "offline" | "unconfigured";

function demoEnabled(): boolean {
  return process.env["ENABLE_DEMO_DATA"] === "true";
}

const EMPTY_STATUS: typeof demoStatus = {
  user: "—",
  id: "0",
  latency: 0,
  guild_count: 0,
  user_count: 0,
  shards: 0,
  uptime: 0,
  commands: 0,
};

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  return { user: await currentSession() };
});

export type Overview = {
  live: boolean;
  mode: DataMode;
  status: typeof demoStatus;
  // Renamed from `error`: TanStack's createServerFn treats a truthy `.error` return
  // field as an internal error envelope and re-throws it. Never use that field name.
  errorMessage: string | null;
};

export const getOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<Overview> => {
    const user = await currentSession();
    if (!user) throw new Error("Unauthorized");

    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) {
      return demoEnabled()
        ? { live: false, mode: "demo", status: demoStatus, errorMessage: null }
        : { live: false, mode: "unconfigured", status: EMPTY_STATUS, errorMessage: null };
    }

    try {
      const [status, info] = await Promise.all([
        botApi<JsonRecord>("/api/v1/bot/status"),
        botApi<JsonRecord>("/api/v1/bot/info").catch(() => ({})),
      ]);
      return {
        live: true,
        mode: "live",
        status: {
          ...EMPTY_STATUS,
          ...status,
          commands: Number((info as JsonRecord)["commands"] ?? 0),
        } as typeof demoStatus,
        errorMessage: null,
      };
    } catch (error) {
      return {
        live: false,
        mode: "offline",
        status: EMPTY_STATUS,
        errorMessage: (error as Error).message,
      };
    }
  },
);

export type GuildRow = {
  id: string;
  name: string;
  icon: string | null;
  member_count: number;
  owner: boolean;
  botPresent: boolean;
};

export type GuildConfig = { live: boolean; guild: GuildRow; modules: JsonRecord };
export type GuildsResult = { live: boolean; mode: DataMode; guilds: GuildRow[] };

export const getGuilds = createServerFn({ method: "GET" }).handler(
  async (): Promise<GuildsResult> => {
    const user = await currentSession();
    if (!user) throw new Error("Unauthorized");

    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) {
      if (demoEnabled()) {
        return {
          live: false,
          mode: "demo",
          guilds: demoGuilds.map((g) => ({ ...g, botPresent: true })) as GuildRow[],
        };
      }
      return {
        live: false,
        mode: "unconfigured",
        guilds: user.guilds.map((g) => ({
          ...g,
          member_count: 0,
          botPresent: false,
        })) as GuildRow[],
      };
    }

    try {
      const botGuilds =
        await botApi<
          Array<{ id: string | number; name: string; icon?: string | null; member_count?: number }>
        >("/api/v1/guilds/");
      const byId = new Map(botGuilds.map((g) => [String(g.id), g]));
      const guilds: GuildRow[] = user.guilds.map((g) => {
        const match = byId.get(g.id);
        return {
          id: g.id,
          name: match?.name ?? g.name,
          icon: g.icon,
          member_count: match?.member_count ?? 0,
          owner: g.owner,
          botPresent: Boolean(match),
        };
      });
      return { live: true, mode: "live", guilds };
    } catch (error) {
      console.error("getGuilds failed", error);
      return {
        live: false,
        mode: "offline",
        guilds: user.guilds.map((g) => ({
          ...g,
          member_count: 0,
          botPresent: false,
        })) as GuildRow[],
      };
    }
  },
);

export const getGuildConfig = createServerFn({ method: "GET" })
  .inputValidator((data: { guildId: string }) => {
    if (!data?.guildId || !/^\d{5,25}$/.test(data.guildId)) throw new Error("Invalid server id");
    return data;
  })
  .handler(async ({ data }): Promise<GuildConfig> => {
    const user = await currentSession();
    if (!user) throw new Error("Unauthorized");

    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    const known = user.guilds.find((g) => g.id === data.guildId);
    if (!known && botApiConfigured()) assertGuildAccess(user, data.guildId);

    if (!botApiConfigured()) {
      if (!demoEnabled()) {
        return {
          live: false,
          guild: {
            id: data.guildId,
            name: known?.name ?? "Unknown server",
            icon: known?.icon ?? null,
            member_count: 0,
            owner: known?.owner ?? false,
            botPresent: false,
          },
          modules: {} as JsonRecord,
        };
      }
      const demo = demoGuilds.find((g) => g.id === data.guildId) ?? demoGuilds[0]!;
      return {
        live: false,
        guild: { ...demo, botPresent: true },
        modules: demoModules as unknown as JsonRecord,
      };
    }

    const id = data.guildId;
    const [details, prefix, automod, leveling, welcome, antinuke, logging, tickets] =
      await Promise.all([
        botApi<JsonRecord>(`/api/v1/guilds/${id}`).catch(() => ({})),
        botApi<JsonRecord>(`/api/v1/guilds/${id}/prefix`).catch(() => ({})),
        botApi<JsonRecord>(`/api/v1/guilds/${id}/automod`).catch(() => ({})),
        botApi<JsonRecord>(`/api/v1/guilds/${id}/leveling`).catch(() => ({})),
        botApi<JsonRecord>(`/api/v1/guilds/${id}/welcome`).catch(() => ({})),
        botApi<JsonRecord>(`/api/v1/guilds/${id}/antinuke`).catch(() => ({})),
        botApi<JsonRecord>(`/api/v1/guilds/${id}/logging`).catch(() => ({})),
        botApi<JsonRecord>(`/api/v1/guilds/${id}/tickets`).catch(() => ({})),
      ]);

    return {
      live: true,
      guild: {
        id,
        name: String((details as JsonRecord)["name"] ?? known?.name ?? "Unknown server"),
        icon: known?.icon ?? null,
        member_count: Number((details as JsonRecord)["member_count"] ?? 0),
        owner: known?.owner ?? false,
        botPresent: Object.keys(details).length > 0,
      },
      modules: { prefix, automod, leveling, welcome, antinuke, logging, tickets } as JsonRecord,
    };
  });

export const updatePrefix = createServerFn({ method: "POST" })
  .inputValidator((data: { guildId: string; prefix: string }) => {
    if (!/^\d{5,25}$/.test(data?.guildId ?? "")) throw new Error("Invalid server id");
    const prefix = (data.prefix ?? "").trim();
    if (prefix.length < 1 || prefix.length > 5) throw new Error("Prefix must be 1-5 characters");
    return { guildId: data.guildId, prefix };
  })
  .handler(async ({ data }) => {
    const user = await currentSession();
    if (!user) throw new Error("Unauthorized");
    assertGuildAccess(user, data.guildId);

    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) {
      return { ok: false, message: "Connect your bot API in Settings to save changes." };
    }
    await botApi(`/api/v1/guilds/${data.guildId}/prefix`, {
      method: "POST",
      body: JSON.stringify({ prefix: data.prefix }),
    });
    return { ok: true, message: `Prefix updated to ${data.prefix}` };
  });

export const getLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((data: { guildId: string }) => {
    if (!/^\d{5,25}$/.test(data?.guildId ?? "")) throw new Error("Invalid server id");
    return data;
  })
  .handler(async ({ data }): Promise<{ live: boolean; entries: typeof demoLeaderboard }> => {
    const user = await currentSession();
    if (!user) throw new Error("Unauthorized");
    assertGuildAccess(user, data.guildId);

    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) {
      return {
        live: false,
        entries: demoEnabled() ? demoLeaderboard : ([] as typeof demoLeaderboard),
      };
    }

    try {
      const entries = await botApi<JsonRecord[]>(
        `/api/v1/guilds/${data.guildId}/leveling/leaderboard`,
      );
      return { live: true, entries: entries as unknown as typeof demoLeaderboard };
    } catch (error) {
      console.error("leaderboard failed", error);
      return { live: false, entries: [] as typeof demoLeaderboard };
    }
  });

export type LogsResult = { live: boolean; logs: typeof demoLogs; stats: JsonRecord | null };

export const getLogs = createServerFn({ method: "GET" }).handler(async (): Promise<LogsResult> => {
  const user = await currentSession();
  if (!user) throw new Error("Unauthorized");
  const { isAdmin } = await import("@/lib/bot-modules.server");
  if (!(await isAdmin(user.id))) throw new Error("Not authorized");

  const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
  if (!botApiConfigured()) {
    return {
      live: false,
      logs: demoEnabled() ? demoLogs : ([] as typeof demoLogs),
      stats: null as JsonRecord | null,
    };
  }

  try {
    const [logs, stats] = await Promise.all([
      botApi<typeof demoLogs>("/api/v1/admin/logs"),
      botApi<JsonRecord>("/api/v1/admin/stats").catch(() => null),
    ]);
    return { live: true, logs, stats };
  } catch (error) {
    console.error("logs failed", error);
    return { live: false, logs: [] as typeof demoLogs, stats: null as JsonRecord | null };
  }
});
