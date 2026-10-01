import { createServerOnlyFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export type SessionUser = {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  guilds: Array<{ id: string; name: string; icon: string | null; owner: boolean }>;
};

// Wrapped in createServerOnlyFn so the framework strips this (and its
// @tanstack/react-start/server import) from the client bundle entirely, even
// though it's cross-imported by multiple *.server.ts modules rather than
// living in the same file as the createServerFn handlers that call it.
const resolveSession = createServerOnlyFn(async (): Promise<SessionUser | null> => {
  const { verifySession, readCookie, SESSION_COOKIE } = await import("@/lib/session.server");
  const request = getRequest();
  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  const session = verifySession(token);
  if (!session) return null;
  return {
    id: session.id,
    username: session.username,
    globalName: session.globalName,
    avatar: session.avatar,
    guilds: session.guilds ?? [],
  };
});

/** Resolves the signed session cookie into a user, or null if absent/expired/tampered. */
export async function currentSession(): Promise<SessionUser | null> {
  return resolveSession();
}

/** Throws if there is no valid session. Use at the top of every server function. */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentSession();
  if (!user) throw new Error("Unauthorized");
  return user;
}

/**
 * Never trust a guildId from the browser: every server-specific call must confirm
 * the signed-in user actually owns/manages that guild before hitting the bot API.
 */
export function assertGuildAccess(user: SessionUser, guildId: string): void {
  if (!user.guilds.some((g) => g.id === guildId)) {
    throw new Error("You do not manage this server");
  }
}

export { isValidGuildId } from "@/lib/id-validation";
