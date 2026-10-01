import { createFileRoute, Link } from "@tanstack/react-router";
import { getAdminStats } from "@/lib/bot-modules.server";
import { getOverview } from "@/lib/dashboard.functions";
import {
  adminGetGuildEvents,
  adminGetAudit,
  adminGetApiStats,
  adminGetMaintenance,
} from "@/lib/admin-platform.server";
import { Panel, StatCard, Pill } from "@/components/ui-kit";
import { AdminHeader, ApiError, Empty, fmtTime, fmtDuration } from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/")({
  loader: async () => {
    const [stats, overview, events, audit, api, maint] = await Promise.all([
      getAdminStats(),
      getOverview(),
      adminGetGuildEvents({ data: { limit: 8 } }),
      adminGetAudit({ data: { limit: 8 } }),
      adminGetApiStats(),
      adminGetMaintenance(),
    ]);
    return { stats, overview, events, audit, api, maint };
  },
  component: AdminOverview,
});

function AdminOverview() {
  const { stats, overview, events, audit, api, maint } = Route.useLoaderData();
  const live = overview.live;
  const s = overview.status;
  const db = stats.stats?.nodes.find((n) => n.name.toLowerCase().includes("database"));

  return (
    <div>
      <AdminHeader
        title="Platform overview"
        blurb="Real-time health and activity for the whole ShyamX platform."
        live={live}
      />
      <ApiError live={live} errorMessage={overview.errorMessage ?? undefined} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bot status" value={live ? "Online" : "Offline"} />
        <StatCard label="Uptime" value={live && s.uptime ? fmtDuration(s.uptime) : "—"} />
        <StatCard label="Discord latency" value={live ? `${Math.round(s.latency)}ms` : "—"} />
        <StatCard label="Servers" value={live ? s.guild_count.toLocaleString() : "—"} />
        <StatCard label="Users" value={live ? s.user_count.toLocaleString() : "—"} />
        <StatCard label="Commands" value={live ? String(s.commands) : "—"} />
        <StatCard
          label="API"
          value={api.live ? "Online" : "Offline"}
          hint={
            api.data
              ? `${api.data.error_requests} errors / ${api.data.total_requests} recent requests`
              : undefined
          }
        />
        <StatCard label="Database" value={db ? db.status : "—"} hint={db?.load} />
      </div>

      <Panel className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Maintenance</span>
          <Pill tone={maint.data?.enabled ? "warn" : "on"}>
            {maint.data ? (maint.data.enabled ? "ON" : "off") : "unknown"}
          </Pill>
          {maint.data?.enabled && maint.data.enabled_by ? (
            <span className="text-xs text-muted-foreground">
              by {maint.data.enabled_by} · {fmtTime(maint.data.enabled_at)}
            </span>
          ) : null}
        </div>
        <Link to="/admin/maintenance" className="text-sm text-primary hover:underline">
          Manage
        </Link>
      </Panel>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-0">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">
            Recent server joins & leaves
          </div>
          {events.data && events.data.length > 0 ? (
            <ul className="divide-y divide-border/60">
              {events.data.map((e, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="truncate">
                    <Pill tone={e.kind === "join" ? "on" : "off"}>{e.kind}</Pill>{" "}
                    <span className="ml-1">{e.guild_name}</span>
                  </span>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {fmtTime(e.ts)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Not yet collected. Joins and leaves are recorded from now on.</Empty>
          )}
        </Panel>

        <Panel className="p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm font-semibold">
            Recent admin & configuration activity
            <Link
              to="/admin/activity"
              search={{ q: "", page: 0 }}
              className="text-xs font-normal text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          {audit.data && audit.data.length > 0 ? (
            <ul className="divide-y divide-border/60">
              {audit.data.map((a) => (
                <li key={a.id} className="px-4 py-2.5 text-sm">
                  <p className="truncate">
                    <span className="font-medium">{a.actor_name || a.actor_id}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.target} · {fmtTime(a.ts)} · {a.result}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No activity recorded yet.</Empty>
          )}
        </Panel>

        <Panel className="p-0 lg:col-span-2">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">
            Recent API errors
          </div>
          {api.data && api.data.recent_errors.length > 0 ? (
            <ul className="divide-y divide-border/60">
              {api.data.recent_errors.slice(0, 6).map((e, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 font-mono text-xs"
                >
                  <span>
                    {e.method} {e.path}
                  </span>
                  <span className="text-destructive">{e.status_code}</span>
                  <span className="text-muted-foreground">{e.timestamp}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{api.live ? "No recent API errors." : "No data available."}</Empty>
          )}
        </Panel>
      </div>
    </div>
  );
}
