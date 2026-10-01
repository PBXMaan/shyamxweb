import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getJoinDM, patchJoinDM } from "@/lib/guild-modules.server";
import { ConfigPage, FieldRow } from "@/components/dashboard/ConfigPage";
import { Textarea } from "@/components/ui/textarea";
import { Panel } from "@/components/ui-kit";

export const Route = createFileRoute("/dashboard/servers/$guildId/joindm")({
  loader: async ({ params }) =>
    getJoinDM({ data: { guildId: params.guildId } }).then((r) => ({
      ...r,
      guildId: params.guildId,
    })),
  component: JoinDMPage,
});

function JoinDMPage() {
  const result = Route.useLoaderData();
  const patch = useServerFn(patchJoinDM);
  const initial = result.data ?? { guild_id: "", message: null };
  const [message, setMessage] = useState(initial.message ?? "");
  const dirty = message !== (initial.message ?? "");

  return (
    <ConfigPage
      eyebrow="advanced"
      title="Join DM"
      description="Message sent to a member's DMs when they join the server. Use {user} and {server} as placeholders. Leave blank to disable."
      live={result.live}
      loadError={result.errorMessage}
      dirty={dirty}
      onReset={() => setMessage(initial.message ?? "")}
      onSave={async () => {
        await patch({ data: { guildId: result.guildId, body: { message: message || null } } });
      }}
    >
      <Panel>
        <FieldRow label="DM message">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Welcome to {server}, {user}!"
          />
        </FieldRow>
      </Panel>
    </ConfigPage>
  );
}
