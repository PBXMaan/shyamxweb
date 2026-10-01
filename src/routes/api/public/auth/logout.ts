import { createFileRoute } from "@tanstack/react-router";
import { sessionCookie } from "@/lib/session.server";

export const Route = createFileRoute("/api/public/auth/logout")({
  server: {
    handlers: {
      GET: async () =>
        new Response(null, {
          status: 302,
          headers: { Location: "/", "Set-Cookie": sessionCookie("", 0) },
        }),
    },
  },
});
