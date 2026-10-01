import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getLeveling, getLevelingLeaderboard, patchLeveling } from "@/lib/guild-modules.server";
import { loadGuildBasics } from "@/lib/guild-basics.server";
import { ConfigPage, FieldRow } from "@/components/dashboard/ConfigPage";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ChannelSelect } from "@/components/selectors/DiscordSelectors";
import { Panel } from "@/components/ui-kit";

export const Route = createFileRoute("/dashboard/servers/$guildId/leveling")({
  loader: async ({ params }) => {
    const [leveling, leaderboard, basics] = await Promise.all([
      getLeveling({ data: { guildId: params.guildId } }),
      getLevelingLeaderboard({ data: { guildId: params.guildId } }),
      loadGuildBasics(params.guildId),
    ]);
    return { ...leveling, leaderboard: leaderboard.data ?? [], basics, guildId: params.guildId };
  },
  component: LevelingPage,
});

function LevelingPage() {
  const result = Route.useLoaderData();
  const patch = useServerFn(patchLeveling);
  const initial = result.data ?? {
    guild_id: 0,
    enabled: false,
    xp_per_message: 20,
    cooldown: 60,
    level_up_channel: null,
    embed_style: { color: "#5865f2", thumbnail: false, image: null },
  };

  const [enabled, setEnabled] = useState(initial.enabled);
  const [xp, setXp] = useState(initial.xp_per_message);
  const [cooldown, setCooldown] = useState(initial.cooldown);
  const [channel, setChannel] = useState<string | null>(
    initial.level_up_channel != null ? String(initial.level_up_channel) : null,
  );
  const [color, setColor] = useState(initial.embed_style.color);

  const dirty =
    enabled !== initial.enabled ||
    xp !== initial.xp_per_message ||
    cooldown !== initial.cooldown ||
    channel !== (initial.level_up_channel != null ? String(initial.level_up_channel) : null) ||
    color !== initial.embed_style.color;

  function reset() {
    setEnabled(initial.enabled);
    setXp(initial.xp_per_message);
    setCooldown(initial.cooldown);
    setChannel(initial.level_up_channel != null ? String(initial.level_up_channel) : null);
    setColor(initial.embed_style.color);
  }

  async function save() {
    await patch({
      data: {
        guildId: result.guildId,
        body: {
          enabled,
          xp_per_message: xp,
          cooldown,
          level_up_channel: channel ? Number(channel) : undefined,
          embed_color: color,
        },
      },
    });
  }

  return (
    <ConfigPage
      eyebrow="engagement"
      title="Leveling"
      description="Award XP for messages and post level-up notifications. Rank-card thumbnail/image are set via bot commands."
      live={result.live}
      loadError={result.errorMessage}
      dirty={dirty}
      onReset={reset}
      onSave={save}
    >
      <Panel>
        <FieldRow label="Leveling system" hint="Master enable/disable">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </FieldRow>
        <FieldRow label="XP per message">
          <Input
            type="number"
            min={1}
            value={xp}
            onChange={(e) => setXp(Number(e.target.value))}
            className="max-w-32"
          />
        </FieldRow>
        <FieldRow label="Cooldown (seconds)" hint="Minimum time between XP awards per member">
          <Input
            type="number"
            min={1}
            value={cooldown}
            onChange={(e) => setCooldown(Number(e.target.value))}
            className="max-w-32"
          />
        </FieldRow>
        <FieldRow
          label="Level-up channel"
          hint="Leave unset to announce in the channel the message was sent"
        >
          <ChannelSelect channels={result.basics.channels} value={channel} onChange={setChannel} />
        </FieldRow>
        <FieldRow label="Embed color">
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-20 p-1"
          />
        </FieldRow>
      </Panel>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold">Leaderboard</h3>
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
              {result.leaderboard.map((row, i) => (
                <tr key={row.user_id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-mono text-primary">{i + 1}</td>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">{row.level}</td>
                  <td className="px-4 py-3 font-mono">{row.xp.toLocaleString()}</td>
                </tr>
              ))}
              {result.leaderboard.length === 0 ? (
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
    </ConfigPage>
  );
}
