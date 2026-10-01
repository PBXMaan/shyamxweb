import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";
import {
  signSession,
  sessionCookie,
  oauthStateCookie,
  readCookie,
  OAUTH_STATE_COOKIE,
  publicOrigin,
} from "@/lib/session.server";

const MANAGE_GUILD = 0x20n;
const ADMINISTRATOR = 0x8n;

type DiscordUser = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
};

type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

export const Route = createFileRoute("/api/public/auth/discord/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const origin = publicOrigin(request);

        // Verify the OAuth state we issued at /login matches this browser.
        const stateParam = url.searchParams.get("state") ?? "";
        const stateCookieValue =
          readCookie(request.headers.get("cookie"), OAUTH_STATE_COOKIE) ?? "";
        const a = Buffer.from(stateParam);
        const b = Buffer.from(stateCookieValue);
        const stateOk = a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
        if (!stateOk) {
          return new Response(null, {
            status: 302,
            headers: { Location: "/?error=state", "Set-Cookie": oauthStateCookie("", 0) },
          });
        }

        if (!code) {
          return new Response(null, { status: 302, headers: { Location: "/?error=denied" } });
        }

        const clientId = process.env["DISCORD_CLIENT_ID"];
        const clientSecret = process.env["DISCORD_CLIENT_SECRET"];
        if (!clientId || !clientSecret) {
          return new Response("Discord login is not configured", { status: 500 });
        }

        try {
          const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              grant_type: "authorization_code",
              code,
              redirect_uri: `${origin}/api/public/auth/discord/callback`,
            }),
          });

          if (!tokenRes.ok) {
            const body = await tokenRes.text();
            console.error(`Discord token exchange failed [${tokenRes.status}]: ${body}`);
            return new Response(null, {
              status: 302,
              headers: { Location: "/?error=token" },
            });
          }

          const { access_token } = (await tokenRes.json()) as { access_token: string };
          const authHeaders = { Authorization: `Bearer ${access_token}` };

          const [userRes, guildRes] = await Promise.all([
            fetch("https://discord.com/api/v10/users/@me", { headers: authHeaders }),
            fetch("https://discord.com/api/v10/users/@me/guilds", { headers: authHeaders }),
          ]);

          if (!userRes.ok) {
            console.error(`Discord user fetch failed [${userRes.status}]: ${await userRes.text()}`);
            return new Response(null, { status: 302, headers: { Location: "/?error=profile" } });
          }

          const user = (await userRes.json()) as DiscordUser;
          const guilds: DiscordGuild[] = guildRes.ok
            ? ((await guildRes.json()) as DiscordGuild[])
            : [];

          const managed = guilds
            .filter((g) => {
              if (g.owner) return true;
              try {
                const perms = BigInt(g.permissions ?? "0");
                return (perms & MANAGE_GUILD) !== 0n || (perms & ADMINISTRATOR) !== 0n;
              } catch {
                return false;
              }
            })
            // The list lives inside the signed cookie, which browsers cap at ~4KB:
            // truncate names and cap the count so login can never overflow it.
            .sort((x, y) => Number(Boolean(y.owner)) - Number(Boolean(x.owner)))
            .slice(0, 30)
            .map((g) => ({
              id: g.id,
              name: g.name.slice(0, 32),
              icon: g.icon,
              owner: Boolean(g.owner),
            }));

          const token = signSession({
            id: user.id,
            username: user.username,
            globalName: user.global_name,
            avatar: user.avatar,
            guilds: managed,
          });

          return new Response(null, {
            status: 302,
            headers: [
              ["Location", "/dashboard"],
              ["Set-Cookie", sessionCookie(token)],
              ["Set-Cookie", oauthStateCookie("", 0)],
            ],
          });
        } catch (error) {
          console.error("Discord OAuth callback error", error);
          return new Response(null, { status: 302, headers: { Location: "/?error=unknown" } });
        }
      },
    },
  },
});
