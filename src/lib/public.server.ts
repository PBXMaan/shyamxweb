/**
 * Server functions for PUBLIC pages (no login required): platform state,
 * command list and health checks. Responses are cached briefly in-process so
 * anonymous traffic can't amplify into load on the bot API.
 */
import { createServerFn } from "@tanstack/react-start";
import type { CommandInfo, PublicState } from "@/lib/zyrox-types";

type Cached<T> = { at: number; value: T };
const cache = new Map<string, Cached<unknown>>();

async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as Cached<T> | undefined;
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

export type PublicStateResult = { live: boolean; state: PublicState | null };

export const getPublicState = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicStateResult> => {
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) return { live: false, state: null };
    return cached("public-state", 15_000, async () => {
      try {
        return { live: true, state: await botApi<PublicState>("/api/v1/platform/public-state") };
      } catch {
        return { live: false, state: null };
      }
    });
  },
);

export const getPublicCommands = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ live: boolean; commands: CommandInfo[] }> => {
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) return { live: false, commands: [] };
    return cached("public-commands", 60_000, async () => {
      try {
        return { live: true, commands: await botApi<CommandInfo[]>("/api/v1/bot/commands") };
      } catch {
        return { live: false, commands: [] };
      }
    });
  },
);

export type ServiceStatus = "operational" | "degraded" | "offline";

export type PublicHealth = {
  website: ServiceStatus;
  dashboard: ServiceStatus;
  api: ServiceStatus;
  bot: ServiceStatus;
  database: ServiceStatus;
  latencyMs: number | null;
  maintenance: boolean;
  checkedAt: string;
};

export const getPublicHealth = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicHealth> => {
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    return cached("public-health", 10_000, async () => {
      const checkedAt = new Date().toISOString();
      const down: PublicHealth = {
        website: "operational",
        dashboard: botApiConfigured() ? "operational" : "degraded",
        api: "offline",
        bot: "offline",
        database: "offline",
        latencyMs: null,
        maintenance: false,
        checkedAt,
      };
      if (!botApiConfigured()) return down;
      const start = Date.now();
      try {
        const [state, health] = await Promise.all([
          botApi<PublicState>("/api/v1/platform/public-state"),
          botApi<{ status: string }>("/health"),
        ]);
        const latencyMs = Date.now() - start;
        return {
          ...down,
          api: health.status === "ok" ? "operational" : "degraded",
          bot: state.bot_online ? "operational" : "degraded",
          // The bot's SQLite files are read on every public-state call (announcements/maintenance),
          // so a successful response is a genuine (if shallow) database read check.
          database: "operational",
          latencyMs,
          maintenance: state.maintenance.enabled,
        };
      } catch {
        return down;
      }
    });
  },
);

export type SiteContext = {
  user: {
    id: string;
    username: string;
    globalName: string | null;
    avatar: string | null;
    serverCount: number;
  } | null;
  isAdmin: boolean;
  platform: PublicState | null;
  live: boolean;
};

/** One call every public page's loader makes: who is signed in + platform banner state. */
export const getSiteContext = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteContext> => {
    const { currentSession } = await import("@/lib/auth.server");
    const { isAdminId } = await import("@/lib/maintenance.server");
    const user = await currentSession();
    const pub = await getPublicState();
    return {
      user: user
        ? {
            id: user.id,
            username: user.username,
            globalName: user.globalName,
            avatar: user.avatar,
            serverCount: user.guilds.length,
          }
        : null,
      isAdmin: user ? isAdminId(user.id) : false,
      platform: pub.state,
      live: pub.live,
    };
  },
);
