import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getJ2C, patchJ2C } from "@/lib/guild-modules.server";
import { loadGuildBasics } from "@/lib/guild-basics.server";
import { ConfigPage, FieldRow } from "@/components/dashboard/ConfigPage";
import { ChannelSelect } from "@/components/selectors/DiscordSelectors";
import { Panel } from "@/components/ui-kit";

export const Route = createFileRoute("/dashboard/servers/$guildId/j2c")({
  loader: async ({ params }) => {
    const [j2c, basics] = await Promise.all([
      getJ2C({ data: { guildId: params.guildId } }),
      loadGuildBasics(params.guildId),
    ]);
    return { ...j2c, basics, guildId: params.guildId };
  },
  component: J2CPage,
});

function J2CPage() {
  const result = Route.useLoaderData();
  const patch = useServerFn(patchJ2C);
  const initial = result.data ?? {
    guild_id: "",
    join_channel_id: null,
    control_channel_id: null,
    category_id: null,
  };

  const [joinChannel, setJoinChannel] = useState(initial.join_channel_id);
  const [controlChannel, setControlChannel] = useState(initial.control_channel_id);
  const [category, setCategory] = useState(initial.category_id);

  const dirty =
    joinChannel !== initial.join_channel_id ||
    controlChannel !== initial.control_channel_id ||
    category !== initial.category_id;

  return (
    <ConfigPage
      eyebrow="advanced"
      title="Join 2 Create"
      description="Members joining the trigger voice channel get their own temporary channel, with a control panel posted to manage it."
      live={result.live}
      loadError={result.errorMessage}
      dirty={dirty}
      onReset={() => {
        setJoinChannel(initial.join_channel_id);
        setControlChannel(initial.control_channel_id);
        setCategory(initial.category_id);
      }}
      onSave={async () => {
        await patch({
          data: {
            guildId: result.guildId,
            body: {
              join_channel_id: joinChannel,
              control_channel_id: controlChannel,
              category_id: category,
            },
          },
        });
      }}
    >
      <Panel>
        <FieldRow label="Trigger voice channel" hint="Joining this VC creates a new temp channel">
          <ChannelSelect
            channels={result.basics.channels}
            filter="voice"
            value={joinChannel}
            onChange={setJoinChannel}
          />
        </FieldRow>
        <FieldRow
          label="Control panel channel"
          hint="Where the manage-channel control panel is posted"
        >
          <ChannelSelect
            channels={result.basics.channels}
            value={controlChannel}
            onChange={setControlChannel}
          />
        </FieldRow>
        <FieldRow label="Category" hint="Discord category new temp channels are created under">
          <ChannelSelect
            channels={result.basics.channels}
            filter="category"
            value={category}
            onChange={setCategory}
          />
        </FieldRow>
      </Panel>
    </ConfigPage>
  );
}
