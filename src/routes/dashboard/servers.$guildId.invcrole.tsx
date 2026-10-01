import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getInvcRole, patchInvcRole } from "@/lib/guild-modules.server";
import { loadGuildBasics } from "@/lib/guild-basics.server";
import { ConfigPage, FieldRow } from "@/components/dashboard/ConfigPage";
import { Switch } from "@/components/ui/switch";
import { RoleSelect } from "@/components/selectors/DiscordSelectors";
import { Panel } from "@/components/ui-kit";

export const Route = createFileRoute("/dashboard/servers/$guildId/invcrole")({
  loader: async ({ params }) => {
    const [invc, basics] = await Promise.all([
      getInvcRole({ data: { guildId: params.guildId } }),
      loadGuildBasics(params.guildId),
    ]);
    return { ...invc, basics, guildId: params.guildId };
  },
  component: InvcRolePage,
});

function InvcRolePage() {
  const result = Route.useLoaderData();
  const patch = useServerFn(patchInvcRole);
  const initial = result.data ?? { guild_id: "", role_id: null, enabled: false };
  const [enabled, setEnabled] = useState(initial.enabled);
  const [roleId, setRoleId] = useState(initial.role_id);
  const dirty = enabled !== initial.enabled || roleId !== initial.role_id;

  return (
    <ConfigPage
      eyebrow="advanced"
      title="Invite Role"
      description="Grant a role to members while they are in a voice channel."
      live={result.live}
      loadError={result.errorMessage}
      dirty={dirty}
      onReset={() => {
        setEnabled(initial.enabled);
        setRoleId(initial.role_id);
      }}
      onSave={async () => {
        await patch({ data: { guildId: result.guildId, body: { enabled, role_id: roleId } } });
      }}
    >
      <Panel>
        <FieldRow label="Voice role" hint="Master enable/disable">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </FieldRow>
        <FieldRow label="Role to grant">
          <RoleSelect roles={result.basics.roles} value={roleId} onChange={setRoleId} />
        </FieldRow>
      </Panel>
    </ConfigPage>
  );
}
