import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { checkAdminAccess } from "@/lib/bot-modules.server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — ShyamX Platform" }, { name: "robots", content: "noindex" }],
  }),
  loader: async () => {
    // Real server-side gate (createServerFn always runs on the server, even for SPA navigation).
    // Logged out -> public site. Logged in but not a bot owner -> their own dashboard.
    const access = await checkAdminAccess();
    if (!access.authed) throw redirect({ to: "/" });
    if (!access.isAdmin) throw redirect({ to: "/dashboard" });
    return { user: access.user! };
  },
  component: AdminLayout,
});

const GROUPS = [
  {
    label: "Platform",
    items: [
      { to: "/admin", label: "Overview", exact: true },
      { to: "/admin/servers", label: "Servers" },
      { to: "/admin/users", label: "Users & admins" },
      { to: "/admin/activity", label: "Audit log" },
    ],
  },
  {
    label: "Bot",
    items: [
      { to: "/admin/bot", label: "Bot status" },
      { to: "/admin/modules", label: "Modules" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/maintenance", label: "Maintenance" },
      { to: "/admin/api", label: "API" },
      { to: "/admin/database", label: "Database" },
      { to: "/admin/logs", label: "Logs" },
      { to: "/admin/settings", label: "Settings & security" },
    ],
  },
  {
    label: "Tools",
    items: [{ to: "/admin/announcements", label: "Announcements" }],
  },
] as const;

function AdminLayout() {
  const { user } = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="space-y-4 px-3 pb-4">
      {GROUPS.map((g) => (
        <div key={g.label}>
          <p className="mb-1 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {g.label}
          </p>
          {g.items.map((item) => {
            const exact = "exact" in item && item.exact;
            const active = exact
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-sm transition",
                  active
                    ? "bg-destructive/15 text-destructive"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0d] lg:flex">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <span className="font-display text-sm font-bold">ShyamX Admin</span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border border-border px-3 py-1.5 text-sm"
          aria-expanded={open}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      <aside
        className={cn(
          "border-b border-border bg-surface lg:sticky lg:top-0 lg:block lg:h-screen lg:w-60 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r",
          open ? "block" : "hidden",
        )}
      >
        <div className="hidden items-center gap-2 px-5 py-5 lg:flex">
          <span className="grid size-8 place-items-center rounded-md bg-destructive font-display text-sm font-bold text-white">
            A
          </span>
          <div>
            <p className="font-display text-sm font-bold leading-tight">ShyamX Admin</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              platform control
            </p>
          </div>
        </div>
        {nav}
        <div className="border-t border-border p-4">
          <p className="truncate text-sm">{user.globalName ?? user.username}</p>
          <div className="mt-1 flex items-center gap-3 text-xs">
            <Link to="/dashboard" className="text-primary hover:underline">
              Server dashboard
            </Link>
            <a href="/api/public/auth/logout" className="text-muted-foreground hover:underline">
              Sign out
            </a>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
