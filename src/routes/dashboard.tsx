import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { getSession } from "@/lib/dashboard.functions";
import { checkAdminAccess } from "@/lib/bot-modules.server";
import { getPublicState } from "@/lib/public.server";
import { PlatformBanner } from "@/components/site/PlatformBanner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ShyamX Control" },
      { name: "description", content: "Live bot metrics and per-server configuration for ShyamX." },
      { property: "og:title", content: "Dashboard — ShyamX Control" },
      { property: "og:description", content: "Live bot metrics and per-server configuration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    const { user } = await getSession();
    if (!user) throw redirect({ to: "/" });
    // Purely for whether to *show* the Admin Panel link — /admin re-checks this
    // itself server-side on entry, so this can never be the actual gate.
    const [access, pub] = await Promise.all([checkAdminAccess(), getPublicState()]);
    return { user, isAdmin: access.isAdmin, platform: pub.state };
  },
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard", label: "Overview", exact: true },
  { to: "/dashboard/servers", label: "Servers", exact: false },
  { to: "/dashboard/commands", label: "Commands", exact: false },
  { to: "/dashboard/settings", label: "Settings", exact: false },
] as const;

function DashboardLayout() {
  const { user, isAdmin, platform } = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : null;

  return (
    <div className="min-h-screen">
      <PlatformBanner platform={platform} />
      <div className="lg:flex">
        <aside className="border-b border-border bg-surface lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 px-5 py-5">
            <span className="grid size-8 place-items-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">
              S
            </span>
            <span className="font-display font-bold">ShyamX</span>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "whitespace-nowrap rounded-md px-3 py-2 text-sm transition",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {isAdmin ? (
            <div className="px-3 pb-3">
              <Link
                to="/admin"
                className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/15"
              >
                ⚠ Admin Panel
              </Link>
            </div>
          ) : null}
          <div className="hidden border-t border-border p-4 lg:block">
            <div className="flex items-center gap-2">
              {avatar ? (
                <img src={avatar} alt="" className="size-8 rounded-full" />
              ) : (
                <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs">
                  {user.username.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm">{user.globalName ?? user.username}</p>
                <a href="/api/public/auth/logout" className="text-xs text-primary hover:underline">
                  Sign out
                </a>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
