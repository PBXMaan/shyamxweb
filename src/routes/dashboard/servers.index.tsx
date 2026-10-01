import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getGuilds } from "@/lib/dashboard.functions";
import { LiveBadge, Panel, Pill } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/dashboard/servers/")({
  loader: () => getGuilds(),
  component: Servers,
});

function Servers() {
  const { guilds, mode } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => guilds.filter((g) => g.name.toLowerCase().includes(query.toLowerCase())),
    [guilds, query],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">servers</p>
          <h1 className="text-2xl font-bold">My servers</h1>
          <p className="text-sm text-muted-foreground">
            Servers you own or hold Manage Server / Administrator on. Nothing else is reachable.
          </p>
        </div>
        <LiveBadge mode={mode} />
      </div>

      {mode === "offline" ? (
        <Panel className="border-destructive/40 text-sm text-muted-foreground">
          The bot API is not responding, so we can't tell which servers have the bot installed right
          now.
        </Panel>
      ) : null}
      {mode === "unconfigured" ? (
        <Panel className="border-warning/40 text-sm text-muted-foreground">
          The dashboard isn't connected to the bot yet. Set BOT_API_BASE_URL and DASHBOARD_API_KEY
          (see DEPLOY.md).
        </Panel>
      ) : null}

      {guilds.length > 6 ? (
        <Input
          placeholder="Search servers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((g) => {
          const card = (
            <div className="space-y-3 p-5">
              <div className="flex items-center gap-3">
                {g.icon ? (
                  <img
                    src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64`}
                    alt=""
                    className="size-11 rounded-xl"
                  />
                ) : (
                  <span className="grid size-11 place-items-center rounded-xl bg-secondary font-display">
                    {g.name.slice(0, 1)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{g.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.botPresent && g.member_count
                      ? `${g.member_count.toLocaleString()} members`
                      : "Members unknown"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={g.owner ? "warn" : "neutral"}>{g.owner ? "owner" : "admin"}</Pill>
                <Pill tone={g.botPresent ? "on" : "off"}>
                  {g.botPresent ? "bot installed" : "bot not installed"}
                </Pill>
              </div>
              {g.botPresent ? (
                <span className="inline-block rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
                  Manage Server
                </span>
              ) : (
                <a
                  href={`/invite?guild=${g.id}`}
                  className="inline-block rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm font-medium hover:bg-secondary"
                >
                  Invite ShyamX
                </a>
              )}
            </div>
          );
          return g.botPresent ? (
            <Link
              key={g.id}
              to="/dashboard/servers/$guildId"
              params={{ guildId: g.id }}
              className="panel block transition hover:border-primary/60"
            >
              {card}
            </Link>
          ) : (
            <div key={g.id} className="panel">
              {card}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Panel className="text-sm text-muted-foreground">
          {guilds.length === 0
            ? "You don't own or manage any Discord servers yet. Log out and back in if your permissions just changed."
            : "No servers match your search."}
        </Panel>
      ) : null}
    </div>
  );
}
