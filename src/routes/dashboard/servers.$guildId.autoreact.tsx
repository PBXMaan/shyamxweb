import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAutoReact, patchAutoReact } from "@/lib/guild-modules.server";
import { ConfigPage } from "@/components/dashboard/ConfigPage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui-kit";
import type { AutoReactTrigger } from "@/lib/zyrox-types";

export const Route = createFileRoute("/dashboard/servers/$guildId/autoreact")({
  loader: async ({ params }) =>
    getAutoReact({ data: { guildId: params.guildId } }).then((r) => ({
      ...r,
      guildId: params.guildId,
    })),
  component: AutoReactPage,
});

function AutoReactPage() {
  const result = Route.useLoaderData();
  const patch = useServerFn(patchAutoReact);
  const initial = result.data?.triggers ?? [];
  const [triggers, setTriggers] = useState<AutoReactTrigger[]>(initial);
  const dirty = JSON.stringify(triggers) !== JSON.stringify(initial);

  function update(i: number, patchObj: Partial<AutoReactTrigger>) {
    setTriggers((t) => t.map((row, idx) => (idx === i ? { ...row, ...patchObj } : row)));
  }

  return (
    <ConfigPage
      eyebrow="advanced"
      title="Auto React"
      description="Automatically react with emojis whenever a message contains a matching trigger word or phrase."
      live={result.live}
      loadError={result.errorMessage}
      dirty={dirty}
      onReset={() => setTriggers(initial)}
      onSave={async () => {
        await patch({ data: { guildId: result.guildId, body: { triggers } } });
      }}
    >
      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Triggers</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setTriggers((t) => [...t, { trigger: "", emojis: "🎉" }])}
          >
            + Add trigger
          </Button>
        </div>
        <div className="space-y-2">
          {triggers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No triggers configured.</p>
          ) : (
            triggers.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="trigger word/phrase"
                  value={t.trigger}
                  onChange={(e) => update(i, { trigger: e.target.value })}
                />
                <Input
                  placeholder="emoji(s)"
                  value={t.emojis}
                  onChange={(e) => update(i, { emojis: e.target.value })}
                  className="max-w-32"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => setTriggers((rows) => rows.filter((_, idx) => idx !== i))}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </Panel>
    </ConfigPage>
  );
}
