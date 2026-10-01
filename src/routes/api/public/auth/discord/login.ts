import { randomBytes } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { oauthStateCookie, publicOrigin } from "@/lib/session.server";

export const Route = createFileRoute("/api/public/auth/discord/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env["DISCORD_CLIENT_ID"];
        if (!clientId) {
          return new Response("Discord login is not configured", { status: 500 });
        }
        // Random per-attempt state, mirrored in an HttpOnly cookie and verified in
        // the callback — prevents login-CSRF / forced-login attacks.
        const state = randomBytes(24).toString("base64url");
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: `${publicOrigin(request)}/api/public/auth/discord/callback`,
          response_type: "code",
          scope: "identify guilds",
          prompt: "consent",
          state,
        });
        return new Response(null, {
          status: 302,
          headers: {
            Location: `https://discord.com/oauth2/authorize?${params.toString()}`,
            "Set-Cookie": oauthStateCookie(state),
          },
        });
      },
    },
  },
});
