import { createFileRoute } from "@tanstack/react-router";

/** Liveness probe for Docker / uptime monitors. Says nothing about bot health (see /status). */
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify({ status: "ok" }), {
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        }),
    },
  },
});
