import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

// NOTE: this project intentionally does not use Supabase. ShyamX has its own
// authentication (Discord OAuth -> a signed session cookie, see
// src/lib/session.server.ts and src/lib/auth.server.ts). The Lovable-scaffolded
// Supabase integration under src/integrations/supabase/ is unused dead code —
// left in place only because some tooling regenerates it, but it must never be
// wired into global middleware: attachSupabaseAuth throws on every request
// when SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY aren't set, which they never are
// here, and that would take down the entire site.
export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
