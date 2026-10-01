import { createFileRoute } from "@tanstack/react-router";
import { adminGetUsers } from "@/lib/admin-platform.server";
import { Panel, Pill } from "@/components/ui-kit";
import { AdminHeader, DataTable, Empty, fmtTime } from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/users")({
  loader: () => adminGetUsers(),
  component: UsersPage,
});

function UsersPage() {
  const r = Route.useLoaderData();
  return (
    <div>
      <AdminHeader
        title="Users & admins"
        blurb="ShyamX doesn't keep a user database: server owners sign in with Discord and their access is derived from Discord itself. What exists is the admin list and the admins seen in the audit log."
        live={r.live}
      />
      <Panel className="mb-6">
        <h3 className="mb-3 text-sm font-semibold">Configured platform admins</h3>
        {r.configuredAdmins.length ? (
          <div className="flex flex-wrap gap-2">
            {r.configuredAdmins.map((id) => (
              <Pill key={id} tone={id === r.currentUserId ? "on" : "neutral"}>
                {id}
                {id === r.currentUserId ? " (you)" : ""}
              </Pill>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">None configured.</p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Edit ADMIN_DISCORD_IDS (or OWNER_IDS) in the server's .env and restart. Admin rights can't
          be granted from the browser.
        </p>
      </Panel>

      <h3 className="mb-2 text-sm font-semibold">Admin activity</h3>
      <DataTable head={["Discord ID", "Name", "Actions recorded", "Last active"]}>
        {r.actors.map((a) => (
          <tr key={a.id} className="border-b border-border/50 last:border-0">
            <td className="px-4 py-3 font-mono text-xs">{a.id}</td>
            <td className="px-4 py-3">{a.name || "—"}</td>
            <td className="px-4 py-3">{a.actions}</td>
            <td className="px-4 py-3 text-xs text-muted-foreground">{fmtTime(a.last)}</td>
          </tr>
        ))}
      </DataTable>
      {r.actors.length === 0 ? <Empty>No activity recorded yet.</Empty> : null}
    </div>
  );
}
