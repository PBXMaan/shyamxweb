import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { deleteWelcome, getWelcome, patchWelcome } from "@/lib/guild-modules.server";
import { loadGuildBasics } from "@/lib/guild-basics.server";
import { ConfigPage, FieldRow } from "@/components/dashboard/ConfigPage";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChannelSelect } from "@/components/selectors/DiscordSelectors";
import { Panel } from "@/components/ui-kit";

export const Route = createFileRoute("/dashboard/servers/$guildId/welcome")({
  loader: async ({ params }) => {
    const [welcome, basics] = await Promise.all([
      getWelcome({ data: { guildId: params.guildId } }),
      loadGuildBasics(params.guildId),
    ]);
    return { ...welcome, basics, guildId: params.guildId };
  },
  component: WelcomePage,
});

function WelcomePage() {
  const result = Route.useLoaderData();
  const patch = useServerFn(patchWelcome);
  const del = useServerFn(deleteWelcome);
  const initial = result.data ?? {
    guild_id: 0,
    welcome_type: "embed",
    welcome_message: null,
    channel_id: null,
    embed_data: null,
    auto_delete_duration: null,
  };

  const [type, setType] = useState(initial.welcome_type ?? "embed");
  const [message, setMessage] = useState(initial.welcome_message ?? "Welcome {user} to {server}!");
  const [channelId, setChannelId] = useState<string | null>(initial.channel_id);
  const [embed, setEmbed] = useState(
    initial.embed_data ?? {
      title: "Welcome!",
      description: "Glad to have you here, {user}.",
      color: "#5865f2",
    },
  );
  const [enabled, setEnabled] = useState(Boolean(initial.channel_id));

  const dirty =
    type !== (initial.welcome_type ?? "embed") ||
    message !== (initial.welcome_message ?? "") ||
    channelId !== initial.channel_id ||
    JSON.stringify(embed) !== JSON.stringify(initial.embed_data ?? {}) ||
    enabled !== Boolean(initial.channel_id);

  function reset() {
    setType(initial.welcome_type ?? "embed");
    setMessage(initial.welcome_message ?? "Welcome {user} to {server}!");
    setChannelId(initial.channel_id);
    setEmbed(
      initial.embed_data ?? {
        title: "Welcome!",
        description: "Glad to have you here, {user}.",
        color: "#5865f2",
      },
    );
    setEnabled(Boolean(initial.channel_id));
  }

  async function save() {
    if (!enabled) {
      await del({ data: { guildId: result.guildId, body: {} } });
      return;
    }
    await patch({
      data: {
        guildId: result.guildId,
        body: {
          welcome_type: type,
          welcome_message: message,
          channel_id: channelId,
          embed_data: type === "embed" ? embed : undefined,
        },
      },
    });
  }

  const previewName = "NewMember";

  return (
    <ConfigPage
      eyebrow="engagement"
      title="Welcome"
      description="Greet new members with a plain message or a rich embed. Use {user} and {server} as placeholders."
      live={result.live}
      loadError={result.errorMessage}
      dirty={dirty}
      onReset={reset}
      onSave={save}
    >
      <Panel>
        <FieldRow label="Welcome messages" hint="Master enable/disable">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </FieldRow>
        <FieldRow label="Channel">
          <ChannelSelect
            channels={result.basics.channels}
            value={channelId}
            onChange={setChannelId}
            disabled={!enabled}
          />
        </FieldRow>
        <FieldRow label="Message type">
          <Select value={type ?? "embed"} onValueChange={setType} disabled={!enabled}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="embed">Embed</SelectItem>
              <SelectItem value="text">Plain text</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h3 className="mb-3 text-sm font-semibold">Content</h3>
          {type === "text" ? (
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              disabled={!enabled}
            />
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Title</label>
                <Input
                  value={embed.title ?? ""}
                  onChange={(e) => setEmbed((v) => ({ ...v, title: e.target.value }))}
                  disabled={!enabled}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Description</label>
                <Textarea
                  value={embed.description ?? ""}
                  onChange={(e) => setEmbed((v) => ({ ...v, description: e.target.value }))}
                  rows={3}
                  disabled={!enabled}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Color</label>
                <Input
                  type="color"
                  value={embed.color ?? "#5865f2"}
                  onChange={(e) => setEmbed((v) => ({ ...v, color: e.target.value }))}
                  className="h-9 w-20 p-1"
                  disabled={!enabled}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Image URL</label>
                <Input
                  value={embed.image ?? ""}
                  onChange={(e) => setEmbed((v) => ({ ...v, image: e.target.value }))}
                  disabled={!enabled}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Thumbnail URL</label>
                <Input
                  value={embed.thumbnail ?? ""}
                  onChange={(e) => setEmbed((v) => ({ ...v, thumbnail: e.target.value }))}
                  disabled={!enabled}
                />
              </div>
            </div>
          )}
        </Panel>

        <Panel>
          <h3 className="mb-3 text-sm font-semibold">Preview</h3>
          {!enabled ? (
            <p className="text-sm text-muted-foreground">Welcome messages are disabled.</p>
          ) : type === "text" ? (
            <div className="rounded-md bg-surface-2 p-3 text-sm">
              {message
                .replaceAll("{user}", `@${previewName}`)
                .replaceAll("{server}", "This Server")}
            </div>
          ) : (
            <div
              className="rounded-md border-l-4 bg-surface-2 p-3"
              style={{ borderColor: embed.color || "#5865f2" }}
            >
              {embed.title ? (
                <p className="font-semibold">{embed.title.replaceAll("{user}", previewName)}</p>
              ) : null}
              {embed.description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {embed.description
                    .replaceAll("{user}", `@${previewName}`)
                    .replaceAll("{server}", "This Server")}
                </p>
              ) : null}
              {embed.image ? (
                <img src={embed.image} alt="" className="mt-2 max-h-40 rounded" />
              ) : null}
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <Button
          variant="destructive"
          size="sm"
          type="button"
          onClick={async () => {
            await del({ data: { guildId: result.guildId, body: {} } });
          }}
        >
          Remove welcome configuration
        </Button>
      </div>
    </ConfigPage>
  );
}
