import { createFileRoute } from "@tanstack/react-router";

/**
 * Bot invite. A server route (not a component) so DISCORD_CLIENT_ID is read on the
 * server and the visitor is redirected straight to Discord's authorize screen.
 * Optional ?guild=<id> pre-selects the server and locks the picker.
 */
export const Route = createFileRoute("/invite")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env["DISCORD_CLIENT_ID"];
        if (!clientId)
          return new Response(null, { status: 302, headers: { Location: "/?error=invite" } });

        const guild = new URL(request.url).searchParams.get("guild") ?? "";
        const params = new URLSearchParams({
          client_id: clientId,
          permissions: process.env["BOT_INVITE_PERMISSIONS"] || "8",
          scope: "bot applications.commands",
        });
        if (/^\d{5,25}$/.test(guild)) {
          params.set("guild_id", guild);
          params.set("disable_guild_select", "true");
        }
        return new Response(null, {
          status: 302,
          headers: { Location: `https://discord.com/oauth2/authorize?${params.toString()}` },
        });
      },
    },
  },
});
