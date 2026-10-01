import { createFileRoute } from "@tanstack/react-router";
import { getInvitesLeaderboard } from "@/lib/guild-modules.server";
import { SectionTitle, LiveBadge, Panel } from "@/components/ui-kit";

export const Route = createFileRoute("/dashboard/servers/$guildId/invites")({
  loader: async ({ params }) => getInvitesLeaderboard({ data: { guildId: params.guildId } }),
  component: InvitesPage,
});

function InvitesPage() {
  const result = Route.useLoaderData();
  const rows = result.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle eyebrow="engagement" title="Invite tracking" />
        <LiveBadge live={result.live} />
      </div>
      {result.errorMessage ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not reach the bot API: {result.errorMessage}
        </div>
      ) : null}
      <p className="-mt-4 text-sm text-muted-foreground">
        Top 20 inviters by valid invites. Configure the invite log channel under Tracking.
      </p>
      <Panel className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Fake</th>
              <th className="px-4 py-3">Left</th>
              <th className="px-4 py-3">Rejoins</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.user_id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3 font-mono text-primary">{i + 1}</td>
                <td className="px-4 py-3 font-mono">{row.user_id}</td>
                <td className="px-4 py-3">{row.total}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.fake}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.left}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.rejoin}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No invite tracking data yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
