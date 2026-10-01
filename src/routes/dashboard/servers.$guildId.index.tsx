import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getLeaderboard } from "@/lib/dashboard.functions";
import {
  getAntiNuke,
  getAutomod,
  getAutoRole,
  getLeveling,
  getLogging,
  getReactionRoles,
  getTickets,
  getVerification,
  getWelcome,
  setPrefix,
  getPrefix,
} from "@/lib/guild-modules.server";
import { Panel, Pill, SectionTitle } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/dashboard/servers/$guildId/")({
  loader: async ({ params }) => {
    const guildId = params.guildId;
    const [
      prefix,
      antinuke,
      automod,
      logging,
      welcome,
      tickets,
      leveling,
      verification,
      autorole,
      rr,
      leaderboard,
    ] = await Promise.all([
      getPrefix({ data: { guildId } }),
      getAntiNuke({ data: { guildId } }),
      getAutomod({ data: { guildId } }),
      getLogging({ data: { guildId } }),
      getWelcome({ data: { guildId } }),
      getTickets({ data: { guildId } }),
      getLeveling({ data: { guildId } }),
      getVerification({ data: { guildId } }),
      getAutoRole({ data: { guildId } }),
      getReactionRoles({ data: { guildId } }),
      getLeaderboard({ data: { guildId } }).catch(() => ({ live: false, entries: [] })),
    ]);
    return {
      guildId,
      prefix,
      cards: [
        {
          key: "antinuke",
          label: "AntiNuke",
          to: "protection",
          enabled: antinuke.data?.status ?? false,
        },
        {
          key: "automod",
          label: "AutoMod",
          to: "automod",
          enabled: automod.data?.enabled ?? false,
        },
        {
          key: "logging",
          label: "Logging",
          to: "logging",
          enabled: Object.values(logging.data?.log_enabled ?? {}).some(Boolean),
        },
        {
          key: "welcome",
          label: "Welcome",
          to: "welcome",
          enabled: Boolean(welcome.data?.channel_id),
        },
        {
          key: "tickets",
          label: "Tickets",
          to: "tickets",
          enabled: Boolean(tickets.data?.panel_channel),
        },
        {
          key: "leveling",
          label: "Leveling",
          to: "leveling",
          enabled: leveling.data?.enabled ?? false,
        },
        {
          key: "verification",
          label: "Verification",
          to: "verification",
          enabled: verification.data?.enabled ?? false,
        },
        {
          key: "autorole",
          label: "AutoRole",
          to: "autorole",
          enabled: (autorole.data?.bots.length ?? 0) + (autorole.data?.humans.length ?? 0) > 0,
        },
        {
          key: "reactionroles",
          label: "Reaction Roles",
          to: "reactionroles",
          enabled: (rr.data?.roles.length ?? 0) > 0,
        },
      ],
      leaderboard,
    };
  },
  component: GuildOverview,
});

function GuildOverview() {
  const { guildId, prefix, cards, leaderboard } = Route.useLoaderData();
  const savePrefix = useServerFn(setPrefix);
  const [value, setValue] = useState(prefix.data?.prefix ?? ">");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    setMessage(null);
    try {
      await savePrefix({ data: { guildId, body: { prefix: value } } });
      setMessage(`Prefix updated to ${value}`);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <Panel className="flex flex-wrap items-end gap-3">
        <div>
          <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Command prefix
          </label>
          <Input
            value={value}
            maxLength={10}
            onChange={(e) => setValue(e.target.value)}
            className="mt-2 w-28 font-mono"
          />
        </div>
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save prefix"}
        </Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </Panel>

      <div>
        <SectionTitle eyebrow="modules" title="Quick actions" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.key}
              to={`/dashboard/servers/$guildId/${card.to}` as never}
              params={{ guildId } as never}
              className="panel flex items-center justify-between p-4 transition hover:border-primary/50"
            >
              <span className="text-sm font-medium">{card.label}</span>
              <Pill tone={card.enabled ? "on" : "off"}>{card.enabled ? "enabled" : "off"}</Pill>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle eyebrow="leveling" title="Top members" />
        <Panel className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">XP</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.entries.map((row, i) => (
                <tr
                  key={String(row.user_id ?? i)}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-4 py-3 font-mono text-primary">{i + 1}</td>
                  <td className="px-4 py-3">{row.name ?? row.user_id}</td>
                  <td className="px-4 py-3">{row.level ?? "—"}</td>
                  <td className="px-4 py-3 font-mono">{Number(row.xp ?? 0).toLocaleString()}</td>
                </tr>
              ))}
              {leaderboard.entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No leveling data yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
