import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getTracking, patchTracking } from "@/lib/guild-modules.server";
import { loadGuildBasics } from "@/lib/guild-basics.server";
import { ConfigPage, FieldRow } from "@/components/dashboard/ConfigPage";
import { ChannelSelect } from "@/components/selectors/DiscordSelectors";
import { Panel } from "@/components/ui-kit";

export const Route = createFileRoute("/dashboard/servers/$guildId/tracking")({
  loader: async ({ params }) => {
    const [tracking, basics] = await Promise.all([
      getTracking({ data: { guildId: params.guildId } }),
      loadGuildBasics(params.guildId),
    ]);
    return { ...tracking, basics, guildId: params.guildId };
  },
  component: TrackingPage,
});

function TrackingPage() {
  const result = Route.useLoaderData();
  const patch = useServerFn(patchTracking);
  const initial = result.data ?? { guild_id: 0, channel_id: null };
  const [channel, setChannel] = useState<string | null>(
    initial.channel_id != null ? String(initial.channel_id) : null,
  );
  const dirty = channel !== (initial.channel_id != null ? String(initial.channel_id) : null);

  return (
    <ConfigPage
      eyebrow="engagement"
      title="Tracking"
      description="Channel where invite join/leave events are logged."
      live={result.live}
      loadError={result.errorMessage}
      dirty={dirty}
      onReset={() => setChannel(initial.channel_id != null ? String(initial.channel_id) : null)}
      onSave={async () => {
        await patch({
          data: { guildId: result.guildId, body: { channel_id: channel ? Number(channel) : null } },
        });
      }}
    >
      <Panel>
        <FieldRow label="Tracking channel">
          <ChannelSelect channels={result.basics.channels} value={channel} onChange={setChannel} />
        </FieldRow>
      </Panel>
    </ConfigPage>
  );
}
