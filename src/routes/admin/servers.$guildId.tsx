import { createFileRoute, Link } from "@tanstack/react-router";
import { adminInspectGuild } from "@/lib/admin-platform.server";
import { Panel, Pill } from "@/components/ui-kit";
import { AdminHeader, ApiError } from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/servers/$guildId")({
  loader: ({ params }) => adminInspectGuild({ data: { guildId: params.guildId } }),
  component: InspectPage,
});

function InspectPage() {
  const r = Route.useLoaderData();
  const { guildId } = Route.useParams();
  return (
    <div>
      <Link to="/admin/servers" className="text-xs text-primary hover:underline">
        ← All servers
      </Link>
      <div className="mt-2">
        <AdminHeader
          title={r.details?.name ?? "Unknown server"}
          blurb={`Read-only view of this server's configuration. Opening this page was recorded in the audit log. Guild ${guildId}.`}
          live={r.live}
        />
      </div>
      <ApiError live={r.live} />
      {r.details ? (
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <Pill>{r.details.member_count.toLocaleString()} members</Pill>
          <Pill>{r.details.role_count} roles</Pill>
          <Pill>{r.details.channel_count} channels</Pill>
          <Pill>owner {r.details.owner_id}</Pill>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(r.modules).map(([name, cfg]) => (
          <Panel key={name}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{name}</h3>
              <Pill tone={cfg ? "on" : "off"}>{cfg ? "loaded" : "unavailable"}</Pill>
            </div>
            <pre className="max-h-56 overflow-auto rounded bg-surface-2 p-3 font-mono text-[11px] text-muted-foreground">
              {cfg ? JSON.stringify(cfg, null, 2) : "No data available."}
            </pre>
          </Panel>
        ))}
      </div>
    </div>
  );
}
