import { createFileRoute } from "@tanstack/react-router";
import { getPublicHealth, getSiteContext, type ServiceStatus } from "@/lib/public.server";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/status")({
  head: () => ({ meta: [{ title: "Status — ShyamX" }] }),
  loader: async () => {
    const [ctx, health] = await Promise.all([getSiteContext(), getPublicHealth()]);
    return { ctx, health };
  },
  component: StatusPage,
});

const ROWS = [
  { key: "website", label: "Website" },
  { key: "dashboard", label: "Dashboard" },
  { key: "api", label: "API" },
  { key: "bot", label: "Discord Bot" },
  { key: "database", label: "Database" },
] as const;

function badge(status: ServiceStatus) {
  if (status === "operational") return { icon: "🟢", label: "Operational", cls: "text-success" };
  if (status === "degraded") return { icon: "🟡", label: "Degraded", cls: "text-warning" };
  return { icon: "🔴", label: "Offline", cls: "text-destructive" };
}

function StatusPage() {
  const { ctx, health } = Route.useLoaderData();
  const all = ROWS.map((r) => health[r.key]);
  const overall: ServiceStatus = all.every((s) => s === "operational")
    ? "operational"
    : all.some((s) => s === "offline")
      ? "offline"
      : "degraded";
  const o = badge(overall);

  return (
    <SiteShell ctx={ctx}>
      <div className="mx-auto max-w-2xl px-5 py-16">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">status</p>
        <h1 className="mt-3 text-4xl font-bold">System status</h1>
        <p className={`mt-3 text-lg ${o.cls}`}>
          {o.icon} {overall === "operational" ? "All systems operational" : o.label}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Live checks run {new Date(health.checkedAt).toLocaleString()}.
          {health.latencyMs != null ? ` API round-trip ${health.latencyMs}ms.` : ""}
        </p>

        {health.maintenance ? (
          <div className="mt-6 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
            🛠️ Maintenance mode is currently on. Configuration changes are temporarily disabled.
          </div>
        ) : null}

        <div className="mt-8 divide-y divide-border rounded-lg border border-border">
          {ROWS.map((row) => {
            const d = badge(health[row.key]);
            return (
              <div key={row.key} className="flex items-center justify-between px-5 py-4">
                <span className="text-sm font-medium">{row.label}</span>
                <span className={`text-sm ${d.cls}`}>
                  {d.icon} {d.label}
                </span>
              </div>
            );
          })}
        </div>

        {ctx.platform && ctx.platform.announcements.length > 0 ? (
          <div className="mt-10">
            <h2 className="font-display text-lg font-semibold">Announcements</h2>
            <div className="mt-3 space-y-3">
              {ctx.platform.announcements.map((a) => (
                <div key={a.id} className="panel p-4">
                  <p className="font-medium">{a.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-8 text-xs text-muted-foreground">
          These are real-time checks, not a historical uptime record. ShyamX doesn't store incident
          history yet, so no uptime percentage is shown.
        </p>
      </div>
    </SiteShell>
  );
}
