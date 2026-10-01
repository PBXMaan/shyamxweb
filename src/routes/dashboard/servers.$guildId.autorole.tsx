import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAutoRole, patchAutoRole } from "@/lib/guild-modules.server";
import { loadGuildBasics } from "@/lib/guild-basics.server";
import { ConfigPage } from "@/components/dashboard/ConfigPage";
import { MultiPicker, rolesToItems } from "@/components/selectors/DiscordSelectors";
import { Panel } from "@/components/ui-kit";

export const Route = createFileRoute("/dashboard/servers/$guildId/autorole")({
  loader: async ({ params }) => {
    const [autorole, basics] = await Promise.all([
      getAutoRole({ data: { guildId: params.guildId } }),
      loadGuildBasics(params.guildId),
    ]);
    return { ...autorole, basics, guildId: params.guildId };
  },
  component: AutoRolePage,
});

function AutoRolePage() {
  const result = Route.useLoaderData();
  const patch = useServerFn(patchAutoRole);
  const initial = result.data ?? { guild_id: "", bots: [], humans: [] };

  const [bots, setBots] = useState(initial.bots);
  const [humans, setHumans] = useState(initial.humans);
  const dirty =
    JSON.stringify(bots) !== JSON.stringify(initial.bots) ||
    JSON.stringify(humans) !== JSON.stringify(initial.humans);

  return (
    <ConfigPage
      eyebrow="engagement"
      title="AutoRole"
      description="Automatically assign roles to new members and bots when they join."
      live={result.live}
      loadError={result.errorMessage}
      dirty={dirty}
      onReset={() => {
        setBots(initial.bots);
        setHumans(initial.humans);
      }}
      onSave={async () => {
        await patch({ data: { guildId: result.guildId, body: { bots, humans } } });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel>
          <h3 className="mb-2 text-sm font-semibold">Roles for humans</h3>
          <MultiPicker
            items={rolesToItems(result.basics.roles)}
            value={humans}
            onChange={setHumans}
            label="roles"
          />
        </Panel>
        <Panel>
          <h3 className="mb-2 text-sm font-semibold">Roles for bots</h3>
          <MultiPicker
            items={rolesToItems(result.basics.roles)}
            value={bots}
            onChange={setBots}
            label="roles"
          />
        </Panel>
      </div>
    </ConfigPage>
  );
}
