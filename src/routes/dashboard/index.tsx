import { createFileRoute, Link } from "@tanstack/react-router";
import { getGuilds, getOverview } from "@/lib/dashboard.functions";
import { LiveBadge, Panel, SectionTitle, StatCard } from "@/components/ui-kit";

export const Route = createFileRoute("/dashboard/")({
  loader: async () => {
    const [overview, guilds] = await Promise.all([getOverview(), getGuilds()]);
    return { overview, guilds };
  },
  component: Overview,
});

function formatUptime(seconds: number | null | undefined) {
  if (!seconds) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
}

function Overview() {
  const { overview, guilds } = Route.useLoaderData();
  const s = overview.status;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">overview</p>
          <h1 className="text-2xl font-bold">{s.user ?? "ShyamX"}</h1>
        </div>
        <LiveBadge mode={overview.mode} />
      </div>

      {overview.errorMessage ? (
        <Panel className="border-destructive/40 text-sm text-muted-foreground">
          Could not reach the bot API: {overview.errorMessage}
        </Panel>
      ) : null}
      {overview.mode === "unconfigured" ? (
        <Panel className="border-warning/40 text-sm text-muted-foreground">
          The dashboard isn't connected to the bot yet. Set BOT_API_BASE_URL and DASHBOARD_API_KEY
          (see DEPLOY.md).
        </Panel>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Servers"
          value={overview.live ? (s.guild_count?.toLocaleString() ?? "—") : "—"}
        />
        <StatCard
          label="Members reached"
          value={overview.live ? (s.user_count?.toLocaleString() ?? "—") : "—"}
        />
        <StatCard
          label="Latency"
          value={overview.live ? `${Math.round(Number(s.latency ?? 0))} ms` : "—"}
        />
        <StatCard
          label="Uptime"
          value={overview.live ? formatUptime(s.uptime) : "—"}
          hint={`${s.shards ?? 1} shard(s)`}
        />
      </div>

      <div>
        <SectionTitle eyebrow="your servers" title="Servers you manage" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {guilds.guilds.slice(0, 6).map((g) => (
            <Link
              key={g.id}
              to="/dashboard/servers/$guildId"
              params={{ guildId: g.id }}
              className="panel flex items-center justify-between p-4 transition hover:border-primary/60"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{g.name}</p>
                <p className="text-xs text-muted-foreground">
                  {g.botPresent ? `${g.member_count.toLocaleString()} members` : "Bot not added"}
                </p>
              </div>
              <span className="text-primary">→</span>
            </Link>
          ))}
          {guilds.guilds.length === 0 ? (
            <Panel className="text-sm text-muted-foreground">
              No servers found where you have Manage Server permission.
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
