import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getLogging, patchLogging } from "@/lib/guild-modules.server";
import { loadGuildBasics } from "@/lib/guild-basics.server";
import { ConfigPage, FieldRow } from "@/components/dashboard/ConfigPage";
import { Switch } from "@/components/ui/switch";
import { ChannelSelect } from "@/components/selectors/DiscordSelectors";
import { Panel, Pill } from "@/components/ui-kit";

// Real categories from cogs/commands/logging.py LOG_CATEGORIES — do not invent extra ones.
const CATEGORIES = [
  { key: "message_events", label: "Message Events", hint: "Edits, deletes, bulk deletes" },
  { key: "join_leave_events", label: "Join / Leave Events", hint: "Member joins and leaves" },
  { key: "member_moderation", label: "Member Moderation", hint: "Bans, kicks, timeouts, warns" },
  { key: "voice_events", label: "Voice Events", hint: "VC join/leave/move" },
  { key: "channel_events", label: "Channel Events", hint: "Create, delete, update" },
  { key: "role_events", label: "Role Events", hint: "Create, delete, update" },
  { key: "emoji_events", label: "Emoji Events", hint: "Server emoji changes" },
  { key: "reaction_events", label: "Reaction Events", hint: "Reaction add/remove" },
  { key: "system_events", label: "System Events", hint: "Server-level changes" },
];

export const Route = createFileRoute("/dashboard/servers/$guildId/logging")({
  loader: async ({ params }) => {
    const [logging, basics] = await Promise.all([
      getLogging({ data: { guildId: params.guildId } }),
      loadGuildBasics(params.guildId),
    ]);
    return { ...logging, basics, guildId: params.guildId };
  },
  component: LoggingPage,
});

function LoggingPage() {
  const result = Route.useLoaderData();
  const patch = useServerFn(patchLogging);
  const initial = result.data ?? {
    guild_id: 0,
    log_enabled: {},
    log_channels: {},
    ignore_channels: [],
    ignore_roles: [],
    ignore_users: [],
    auto_delete_duration: null,
  };

  const [enabled, setEnabled] = useState<Record<string, boolean>>(initial.log_enabled);
  const [channels, setChannels] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(initial.log_channels).map(([k, v]) => [k, String(v)])),
  );

  const dirty =
    JSON.stringify(enabled) !== JSON.stringify(initial.log_enabled) ||
    JSON.stringify(channels) !==
      JSON.stringify(
        Object.fromEntries(Object.entries(initial.log_channels).map(([k, v]) => [k, String(v)])),
      );

  function reset() {
    setEnabled(initial.log_enabled);
    setChannels(
      Object.fromEntries(Object.entries(initial.log_channels).map(([k, v]) => [k, String(v)])),
    );
  }

  async function save() {
    await patch({
      data: {
        guildId: result.guildId,
        body: {
          log_enabled: enabled,
          log_channels: Object.fromEntries(
            Object.entries(channels)
              .filter(([, v]) => v)
              .map(([k, v]) => [k, Number(v)]),
          ),
        },
      },
    });
  }

  return (
    <ConfigPage
      eyebrow="protection"
      title="Logging"
      description="Route server events to specific channels. Ignore lists and auto-delete are configured via bot commands and shown here read-only."
      live={result.live}
      loadError={result.errorMessage}
      dirty={dirty}
      onReset={reset}
      onSave={save}
    >
      <Panel className="p-0">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="grid gap-2 border-b border-border/60 p-4 last:border-0 sm:grid-cols-3 sm:items-center"
          >
            <div>
              <p className="text-sm font-medium">{cat.label}</p>
              <p className="text-xs text-muted-foreground">{cat.hint}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={enabled[cat.key] ?? false}
                onCheckedChange={(v) => setEnabled((e) => ({ ...e, [cat.key]: v }))}
              />
              <span className="text-xs text-muted-foreground">
                {enabled[cat.key] ? "on" : "off"}
              </span>
            </div>
            <ChannelSelect
              channels={result.basics.channels}
              value={channels[cat.key] ?? null}
              onChange={(id) => setChannels((c) => ({ ...c, [cat.key]: id ?? "" }))}
            />
          </div>
        ))}
      </Panel>

      {initial.ignore_channels.length ||
      initial.ignore_roles.length ||
      initial.ignore_users.length ||
      initial.auto_delete_duration ? (
        <Panel className="mt-4">
          <h3 className="mb-2 text-sm font-semibold">Configured elsewhere (read-only)</h3>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Pill>{initial.ignore_channels.length} ignored channels</Pill>
            <Pill>{initial.ignore_roles.length} ignored roles</Pill>
            <Pill>{initial.ignore_users.length} ignored users</Pill>
            {initial.auto_delete_duration ? (
              <Pill>auto-delete after {initial.auto_delete_duration}s</Pill>
            ) : null}
          </div>
        </Panel>
      ) : null}
    </ConfigPage>
  );
}
