import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getReactionRoles, patchReactionRoles } from "@/lib/guild-modules.server";
import { loadGuildBasics } from "@/lib/guild-basics.server";
import { SectionTitle, LiveBadge, Panel } from "@/components/ui-kit";
import { RoleSelect } from "@/components/selectors/DiscordSelectors";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/servers/$guildId/reactionroles")({
  loader: async ({ params }) => {
    const [rr, basics] = await Promise.all([
      getReactionRoles({ data: { guildId: params.guildId } }),
      loadGuildBasics(params.guildId),
    ]);
    return { ...rr, basics, guildId: params.guildId };
  },
  component: ReactionRolesPage,
});

function ReactionRolesPage() {
  const result = Route.useLoaderData();
  const patch = useServerFn(patchReactionRoles);
  const router = useRouter();
  const initial = result.data ?? { guild_id: "", dm_enabled: true, roles: [] };

  const [dmEnabled, setDmEnabled] = useState(initial.dm_enabled);
  const [messageId, setMessageId] = useState("");
  const [emoji, setEmoji] = useState("");
  const [roleId, setRoleId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function saveDm(value: boolean) {
    setDmEnabled(value);
    try {
      await patch({ data: { guildId: result.guildId, body: { dm_enabled: value } } });
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  async function addEntry() {
    if (!messageId || !emoji || !roleId) {
      setStatus("Message ID, emoji, and role are all required.");
      return;
    }
    try {
      await patch({
        data: {
          guildId: result.guildId,
          body: { add_role: { message_id: messageId, emoji, role_id: roleId } },
        },
      });
      setMessageId("");
      setEmoji("");
      setRoleId(null);
      setStatus(null);
      router.invalidate();
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  async function removeEntry(msgId: string, emo: string) {
    try {
      await patch({
        data: {
          guildId: result.guildId,
          body: { remove_role_message_id: msgId, remove_role_emoji: emo },
        },
      });
      router.invalidate();
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle eyebrow="engagement" title="Reaction Roles" />
        <LiveBadge live={result.live} />
      </div>
      {result.errorMessage ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not reach the bot API: {result.errorMessage}
        </div>
      ) : null}

      <Panel className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">DM confirmation on role grant/removal</p>
          <p className="text-xs text-muted-foreground">
            Send members a DM when a reaction role is added or removed
          </p>
        </div>
        <Switch checked={dmEnabled} onCheckedChange={saveDm} />
      </Panel>

      <Panel>
        <h3 className="mb-3 text-sm font-semibold">Add reaction role</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs text-muted-foreground">Message ID</label>
            <Input
              value={messageId}
              onChange={(e) => setMessageId(e.target.value)}
              className="font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Emoji</label>
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🎉" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Role</label>
            <RoleSelect
              roles={result.basics.roles}
              value={roleId}
              onChange={setRoleId}
              allowNone={false}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" onClick={addEntry}>
            Add
          </Button>
          {status ? <span className="text-sm text-muted-foreground">{status}</span> : null}
        </div>
      </Panel>

      <Panel className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Message ID</th>
              <th className="px-4 py-3">Emoji</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {initial.roles.map((entry, i) => {
              const roleName =
                result.basics.roles.find((r) => r.id === entry.role_id)?.name ?? entry.role_id;
              return (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-mono">{entry.message_id}</td>
                  <td className="px-4 py-3">{entry.emoji}</td>
                  <td className="px-4 py-3">{roleName}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeEntry(entry.message_id, entry.emoji)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              );
            })}
            {initial.roles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  No reaction roles configured yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
