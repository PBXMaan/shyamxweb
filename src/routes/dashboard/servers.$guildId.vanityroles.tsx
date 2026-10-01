import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { deleteVanityRole, getVanityRoles, upsertVanityRole } from "@/lib/guild-modules.server";
import { loadGuildBasics } from "@/lib/guild-basics.server";
import { SectionTitle, LiveBadge, Panel } from "@/components/ui-kit";
import { ChannelSelect, RoleSelect } from "@/components/selectors/DiscordSelectors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/servers/$guildId/vanityroles")({
  loader: async ({ params }) => {
    const [list, basics] = await Promise.all([
      getVanityRoles({ data: { guildId: params.guildId } }),
      loadGuildBasics(params.guildId),
    ]);
    return { ...list, basics, guildId: params.guildId };
  },
  component: VanityRolesPage,
});

function VanityRolesPage() {
  const result = Route.useLoaderData();
  const router = useRouter();
  const upsert = useServerFn(upsertVanityRole);
  const del = useServerFn(deleteVanityRole);

  const [vanity, setVanity] = useState("");
  const [roleId, setRoleId] = useState<string | null>(null);
  const [logChannel, setLogChannel] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!vanity.trim() || !roleId || !logChannel) {
      setStatus("Vanity code, role, and log channel are all required.");
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await upsert({
        data: {
          guildId: result.guildId,
          body: { vanity: vanity.trim(), role_id: roleId, log_channel_id: logChannel },
        },
      });
      setVanity("");
      setRoleId(null);
      setLogChannel(null);
      router.invalidate();
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(v: string) {
    try {
      await del({ data: { guildId: result.guildId, vanity: v } });
      router.invalidate();
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle eyebrow="advanced" title="Vanity Roles" />
        <LiveBadge live={result.live} />
      </div>
      <p className="-mt-4 text-sm text-muted-foreground">
        Automatically grant a role to any member whose status includes a specific vanity/invite code
        (e.g. "discord.gg/yourcode").
      </p>
      {result.errorMessage ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not reach the bot API: {result.errorMessage}
        </div>
      ) : null}

      <Panel>
        <h3 className="mb-3 text-sm font-semibold">Add setup</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs text-muted-foreground">Vanity code</label>
            <Input
              value={vanity}
              onChange={(e) => setVanity(e.target.value)}
              placeholder="yourcode"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Role to grant</label>
            <RoleSelect
              roles={result.basics.roles}
              value={roleId}
              onChange={setRoleId}
              allowNone={false}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Log channel</label>
            <ChannelSelect
              channels={result.basics.channels}
              value={logChannel}
              onChange={setLogChannel}
              allowNone={false}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" onClick={add} disabled={saving}>
            {saving ? "Saving…" : "Add setup"}
          </Button>
          {status ? <span className="text-sm text-muted-foreground">{status}</span> : null}
        </div>
      </Panel>

      <Panel className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Vanity</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Log channel</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(result.data ?? []).map((row) => {
              const roleName =
                result.basics.roles.find((r) => r.id === row.role_id)?.name ?? row.role_id;
              const chanName =
                result.basics.channels.find((c) => c.id === row.log_channel_id)?.name ??
                row.log_channel_id;
              return (
                <tr key={row.vanity} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-mono">{row.vanity}</td>
                  <td className="px-4 py-3">{roleName}</td>
                  <td className="px-4 py-3">#{chanName}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="destructive" onClick={() => remove(row.vanity)}>
                      Remove
                    </Button>
                  </td>
                </tr>
              );
            })}
            {(result.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  No vanity role setups yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
