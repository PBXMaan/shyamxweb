import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/auth.server";
import type { AdminConfig, AdminStats, CommandInfo } from "@/lib/zyrox-types";

import { isAdminId } from "@/lib/maintenance.server";

export async function isAdmin(userId: string): Promise<boolean> {
  return isAdminId(userId);
}

async function requireAdmin() {
  const user = await requireUser();
  if (!(await isAdmin(user.id))) throw new Error("Not authorized");
  return user;
}

/**
 * Real server-side admin gate for the /admin route tree. This is what actually
 * protects /admin — never the client-side nav item visibility. Runs as a
 * createServerFn so it always executes on the server, even for client-side
 * (SPA) navigations into /admin.
 */
export const checkAdminAccess = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    authed: boolean;
    isAdmin: boolean;
    user: { id: string; username: string; globalName: string | null; avatar: string | null } | null;
  }> => {
    const { currentSession } = await import("@/lib/auth.server");
    const user = await currentSession();
    if (!user) return { authed: false, isAdmin: false, user: null };
    const admin = await isAdmin(user.id);
    return {
      authed: true,
      isAdmin: admin,
      user: {
        id: user.id,
        username: user.username,
        globalName: user.globalName,
        avatar: user.avatar,
      },
    };
  },
);

export type AdminGuildRow = {
  id: string;
  name: string;
  icon_url: string | null;
  owner_id: string | null;
  member_count: number;
};

/** All guilds the bot is actually in, unfiltered by any single user's OAuth access — admin-only. */
export const getAllGuilds = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    live: boolean;
    isAdmin: boolean;
    guilds: AdminGuildRow[];
    errorMessage?: string;
  }> => {
    const user = await requireUser();
    const admin = await isAdmin(user.id);
    if (!admin) return { live: false, isAdmin: false, guilds: [] };
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) return { live: false, isAdmin: true, guilds: [] };
    try {
      const guilds = await botApi<AdminGuildRow[]>("/api/v1/guilds/");
      return { live: true, isAdmin: true, guilds };
    } catch (error) {
      return { live: false, isAdmin: true, guilds: [], errorMessage: (error as Error).message };
    }
  },
);

export const getCommands = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ live: boolean; commands: CommandInfo[]; errorMessage?: string }> => {
    await requireUser();
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) return { live: false, commands: [] };
    try {
      const commands = await botApi<CommandInfo[]>("/api/v1/bot/commands");
      return { live: true, commands };
    } catch (error) {
      return { live: false, commands: [], errorMessage: (error as Error).message };
    }
  },
);

export const getAdminStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    live: boolean;
    stats: AdminStats | null;
    isAdmin: boolean;
    errorMessage?: string;
  }> => {
    const user = await requireUser();
    const admin = await isAdmin(user.id);
    if (!admin) return { live: false, stats: null, isAdmin: false };
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) return { live: false, stats: null, isAdmin: true };
    try {
      const stats = await botApi<AdminStats>("/api/v1/admin/stats");
      return { live: true, stats, isAdmin: true };
    } catch (error) {
      return { live: false, stats: null, isAdmin: true, errorMessage: (error as Error).message };
    }
  },
);

export const getAdminConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminConfig | null> => {
    await requireAdmin();
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) return null;
    return botApi<AdminConfig>("/api/v1/admin/config");
  },
);

export const patchAdminConfig = createServerFn({ method: "POST" })
  .inputValidator((data: Partial<AdminConfig>) => data)
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const { botApi, botApiConfigured } = await import("@/lib/bot-api.server");
    if (!botApiConfigured()) throw new Error("Bot API is not configured.");
    const { recordAudit } = await import("@/lib/audit.server");
    const result = await botApi<AdminConfig>("/api/v1/admin/config", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    await recordAudit(user, "admin.config.patch", "global", "success");
    return result;
  });
