import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAntiNuke, patchAntiNuke } from "@/lib/guild-modules.server";
import { ConfigPage, FieldRow } from "@/components/dashboard/ConfigPage";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui-kit";

export const Route = createFileRoute("/dashboard/servers/$guildId/protection")({
  loader: async ({ params }) =>
    getAntiNuke({ data: { guildId: params.guildId } }).then((r) => ({
      ...r,
      guildId: params.guildId,
    })),
  component: ProtectionPage,
});

function ProtectionPage() {
  const result = Route.useLoaderData();
  const patch = useServerFn(patchAntiNuke);
  const initial = result.data ?? { guild_id: 0, status: false, whitelisted_users: [] };
  const [status, setStatus] = useState(initial.status);
  const [whitelist, setWhitelist] = useState(initial.whitelisted_users);
  const [newUserId, setNewUserId] = useState("");
  const dirty = status !== initial.status;

  async function save() {
    if (status !== initial.status) {
      await patch({ data: { guildId: result.guildId, body: { status } } });
    }
  }

  async function addWhitelist() {
    if (!/^\d{5,25}$/.test(newUserId)) return;
    await patch({ data: { guildId: result.guildId, body: { add_whitelist: newUserId } } });
    setWhitelist((w) => [...w, newUserId]);
    setNewUserId("");
  }

  async function removeWhitelist(id: string) {
    await patch({ data: { guildId: result.guildId, body: { remove_whitelist: id } } });
    setWhitelist((w) => w.filter((u) => u !== id));
  }

  return (
    <ConfigPage
      eyebrow="protection"
      title="AntiNuke"
      description="Blocks mass-destructive actions (bans, channel/role deletion, webhook spam, etc.) from unauthorized accounts. Whitelisted users bypass all AntiNuke checks."
      live={result.live}
      loadError={result.errorMessage}
      dirty={dirty}
      onReset={() => setStatus(initial.status)}
      onSave={save}
    >
      <Panel>
        <FieldRow label="AntiNuke protection" hint="Master enable/disable for this guild">
          <Switch checked={status} onCheckedChange={setStatus} />
        </FieldRow>
      </Panel>

      <Panel className="mt-4">
        <h3 className="mb-3 text-sm font-semibold">Whitelisted users</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Whitelisted users are exempt from every AntiNuke trigger (bans, kicks, channel/role
          changes, webhook and emoji management). Add trusted admins only — this is granted
          immediately, not on save.
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {whitelist.length === 0 ? (
            <span className="text-xs text-muted-foreground">No users whitelisted.</span>
          ) : (
            whitelist.map((id) => (
              <Badge key={id} variant="secondary" className="gap-1">
                {id}
                <button
                  onClick={() => removeWhitelist(id)}
                  className="ml-1 text-destructive"
                  type="button"
                >
                  ×
                </button>
              </Badge>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Discord user ID"
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            className="max-w-xs font-mono"
          />
          <Button type="button" variant="outline" onClick={addWhitelist}>
            Add
          </Button>
        </div>
      </Panel>
    </ConfigPage>
  );
}
