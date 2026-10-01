import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAutomod, patchAutomod } from "@/lib/guild-modules.server";
import { loadGuildBasics } from "@/lib/guild-basics.server";
import { ConfigPage, FieldRow } from "@/components/dashboard/ConfigPage";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChannelSelect,
  MultiPicker,
  channelsToItems,
  rolesToItems,
} from "@/components/selectors/DiscordSelectors";
import { Panel } from "@/components/ui-kit";

const EVENTS = [
  { key: "spam", label: "Anti-Spam" },
  { key: "caps", label: "Anti-Caps" },
  { key: "links", label: "Anti-Links" },
  { key: "invites", label: "Anti-Invites" },
  { key: "mass_mention", label: "Mass Mention Protection" },
  { key: "emoji_spam", label: "Emoji Spam" },
];
const PUNISHMENTS = ["warn", "delete", "mute", "kick", "ban"];

export const Route = createFileRoute("/dashboard/servers/$guildId/automod")({
  loader: async ({ params }) => {
    const [automod, basics] = await Promise.all([
      getAutomod({ data: { guildId: params.guildId } }),
      loadGuildBasics(params.guildId),
    ]);
    return { ...automod, basics, guildId: params.guildId };
  },
  component: AutomodPage,
});

function AutomodPage() {
  const result = Route.useLoaderData();
  const patch = useServerFn(patchAutomod);
  const initial = result.data ?? {
    guild_id: 0,
    enabled: false,
    punishments: {},
    ignored_roles: [],
    ignored_channels: [],
    logging_channel: null,
  };

  const [enabled, setEnabled] = useState(initial.enabled);
  const [punishments, setPunishments] = useState<Record<string, string>>(initial.punishments);
  const [ignoredRoles, setIgnoredRoles] = useState(initial.ignored_roles.map(String));
  const [ignoredChannels, setIgnoredChannels] = useState(initial.ignored_channels.map(String));
  const [loggingChannel, setLoggingChannel] = useState<string | null>(
    initial.logging_channel != null ? String(initial.logging_channel) : null,
  );

  const dirty =
    enabled !== initial.enabled ||
    JSON.stringify(punishments) !== JSON.stringify(initial.punishments) ||
    JSON.stringify(ignoredRoles) !== JSON.stringify(initial.ignored_roles.map(String)) ||
    JSON.stringify(ignoredChannels) !== JSON.stringify(initial.ignored_channels.map(String)) ||
    loggingChannel !== (initial.logging_channel != null ? String(initial.logging_channel) : null);

  function reset() {
    setEnabled(initial.enabled);
    setPunishments(initial.punishments);
    setIgnoredRoles(initial.ignored_roles.map(String));
    setIgnoredChannels(initial.ignored_channels.map(String));
    setLoggingChannel(initial.logging_channel != null ? String(initial.logging_channel) : null);
  }

  async function save() {
    await patch({
      data: {
        guildId: result.guildId,
        body: {
          enabled,
          punishments,
          ignored_roles: ignoredRoles.map(Number),
          ignored_channels: ignoredChannels.map(Number),
          logging_channel: loggingChannel ? Number(loggingChannel) : null,
        },
      },
    });
  }

  return (
    <ConfigPage
      eyebrow="protection"
      title="AutoMod"
      description="Automated moderation for spam, caps, invite links, mass mentions, and emoji spam."
      live={result.live}
      loadError={result.errorMessage}
      dirty={dirty}
      onReset={reset}
      onSave={save}
    >
      <Panel>
        <FieldRow label="AutoMod" hint="Master enable/disable">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </FieldRow>
        <FieldRow label="Logging channel" hint="Where AutoMod actions are reported">
          <ChannelSelect
            channels={result.basics.channels}
            value={loggingChannel}
            onChange={setLoggingChannel}
          />
        </FieldRow>
      </Panel>

      <Panel className="mt-4">
        <h3 className="mb-3 text-sm font-semibold">Punishments per trigger</h3>
        <div className="space-y-1">
          {EVENTS.map((ev) => (
            <FieldRow key={ev.key} label={ev.label}>
              <Select
                value={punishments[ev.key] ?? "warn"}
                onValueChange={(v) => setPunishments((p) => ({ ...p, [ev.key]: v }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PUNISHMENTS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          ))}
        </div>
      </Panel>

      <Panel className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Ignored roles</h3>
          <MultiPicker
            items={rolesToItems(result.basics.roles)}
            value={ignoredRoles}
            onChange={setIgnoredRoles}
            label="roles"
          />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Ignored channels</h3>
          <MultiPicker
            items={channelsToItems(result.basics.channels)}
            value={ignoredChannels}
            onChange={setIgnoredChannels}
            label="channels"
          />
        </div>
      </Panel>
    </ConfigPage>
  );
}
