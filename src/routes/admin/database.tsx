import { createFileRoute } from "@tanstack/react-router";
import { adminGetDatabase } from "@/lib/admin-platform.server";
import { Panel, Pill, StatCard } from "@/components/ui-kit";
import {
  AdminHeader,
  ApiError,
  DataTable,
  Empty,
  fmtBytes,
  fmtTime,
} from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/database")({
  loader: () => adminGetDatabase(),
  component: DatabasePage,
});

function DatabasePage() {
  const r = Route.useLoaderData();
  const d = r.data;
  const unhealthy = d?.files.filter((f) => !f.healthy).length ?? 0;
  return (
    <div>
      <AdminHeader
        title="Database"
        blurb="Diagnostics for the bot's SQLite files. Read-only: files are opened in read-only mode for an integrity check."
        live={r.live}
      />
      <ApiError live={r.live} errorMessage={r.errorMessage} />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Files" value={d ? String(d.files.length) : "—"} />
        <StatCard label="Total size" value={d ? fmtBytes(d.total_bytes) : "—"} />
        <StatCard
          label="Health"
          value={d ? (unhealthy === 0 ? "All OK" : `${unhealthy} issue(s)`) : "—"}
        />
      </div>
      <div className="mt-4">
        <DataTable head={["File", "Size", "Integrity", "Last modified"]}>
          {(d?.files ?? []).map((f) => (
            <tr key={f.name} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-3 font-mono text-xs">{f.name}</td>
              <td className="px-4 py-3">{fmtBytes(f.size_bytes)}</td>
              <td className="px-4 py-3">
                <Pill tone={f.healthy ? "on" : "warn"}>
                  {f.healthy ? "ok" : (f.error ?? "error")}
                </Pill>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{fmtTime(f.modified)}</td>
            </tr>
          ))}
        </DataTable>
        {!d || d.files.length === 0 ? (
          <Empty>{r.live ? "No database files found." : "No data available."}</Empty>
        ) : null}
      </div>
      <Panel className="mt-4 text-xs text-muted-foreground">
        There is intentionally no delete, reset or raw-query control here. Back up the{" "}
        <code>db/</code> folder (see DEPLOY.md) before any risky change.
      </Panel>
    </div>
  );
}
