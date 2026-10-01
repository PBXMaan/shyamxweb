import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCustomRoles, patchCustomRoles } from "@/lib/guild-modules.server";
import { loadGuildBasics } from "@/lib/guild-basics.server";
import { ConfigPage, FieldRow } from "@/components/dashboard/ConfigPage";
import { RoleSelect } from "@/components/selectors/DiscordSelectors";
import { Panel } from "@/components/ui-kit";
import type { CustomRoleConfig } from "@/lib/zyrox-types";

// Field names come straight from api/schemas.py CustomRoleConfig — these are the bot's fixed role slots.
const FIELDS: Array<{ key: keyof Omit<CustomRoleConfig, "guild_id">; label: string }> = [
  { key: "staff", label: "Staff role" },
  { key: "vip", label: "VIP role" },
  { key: "guest", label: "Guest role" },
  { key: "frnd", label: "Friend role" },
  { key: "girl", label: "Girl role" },
  { key: "reqrole", label: "Required role" },
];

export const Route = createFileRoute("/dashboard/servers/$guildId/customroles")({
  loader: async ({ params }) => {
    const [cr, basics] = await Promise.all([
      getCustomRoles({ data: { guildId: params.guildId } }),
      loadGuildBasics(params.guildId),
    ]);
    return { ...cr, basics, guildId: params.guildId };
  },
  component: CustomRolesPage,
});

function CustomRolesPage() {
  const result = Route.useLoaderData();
  const patch = useServerFn(patchCustomRoles);
  const initial: Record<string, string | null> = {
    staff: result.data?.staff ?? null,
    girl: result.data?.girl ?? null,
    vip: result.data?.vip ?? null,
    guest: result.data?.guest ?? null,
    frnd: result.data?.frnd ?? null,
    reqrole: result.data?.reqrole ?? null,
  };
  const [values, setValues] = useState<Record<string, string | null>>(initial);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  return (
    <ConfigPage
      eyebrow="advanced"
      title="Custom Roles"
      description="Map named role slots used by the bot's custom-role commands."
      live={result.live}
      loadError={result.errorMessage}
      dirty={dirty}
      onReset={() => setValues(initial)}
      onSave={async () => {
        await patch({ data: { guildId: result.guildId, body: values } });
      }}
    >
      <Panel>
        {FIELDS.map((f) => (
          <FieldRow key={f.key} label={f.label}>
            <RoleSelect
              roles={result.basics.roles}
              value={values[f.key]}
              onChange={(id) => setValues((v) => ({ ...v, [f.key]: id }))}
            />
          </FieldRow>
        ))}
      </Panel>
    </ConfigPage>
  );
}
