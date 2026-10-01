import { createFileRoute } from "@tanstack/react-router";
import { adminGetApiStats } from "@/lib/admin-platform.server";
import { Panel, Pill, StatCard } from "@/components/ui-kit";
import { AdminHeader, ApiError, DataTable, Empty } from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/api")({
  loader: () => adminGetApiStats(),
  component: ApiPage,
});

function ApiPage() {
  const r = Route.useLoaderData();
  const d = r.data;
  return (
    <div>
      <AdminHeader
        title="API"
        blurb={`Computed from the bot API's in-memory window of the last ${d?.window_size ?? 200} requests (resets when the bot restarts).`}
        live={r.live}
      />
      <ApiError live={r.live} errorMessage={r.errorMessage} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Requests (window)" value={d ? String(d.total_requests) : "—"} />
        <StatCard
          label="Errors (4xx/5xx)"
          value={d ? String(d.error_requests) : "—"}
          hint={d ? `${d.server_errors} server errors` : undefined}
        />
        <StatCard label="Avg latency" value={d ? `${d.avg_latency_ms}ms` : "—"} />
        <StatCard label="Max latency" value={d ? `${d.max_latency_ms}ms` : "—"} />
      </div>
      <Panel className="mt-4 flex items-center justify-between">
        <span className="text-sm">API key</span>
        <Pill tone={d?.api_key_configured ? "on" : "warn"}>
          {d ? (d.api_key_configured ? "configured" : "not set") : "unknown"}
        </Pill>
      </Panel>
      <p className="mb-2 mt-6 text-sm font-semibold">Slowest endpoints</p>
      <DataTable head={["Path", "Avg", "Requests"]}>
        {(d?.slowest_endpoints ?? []).map((e) => (
          <tr key={e.path} className="border-b border-border/50 last:border-0">
            <td className="max-w-[360px] truncate px-4 py-3 font-mono text-xs">{e.path}</td>
            <td className="px-4 py-3">{e.avg_ms}ms</td>
            <td className="px-4 py-3">{e.count}</td>
          </tr>
        ))}
      </DataTable>
      {!d || d.slowest_endpoints.length === 0 ? <Empty>No data available.</Empty> : null}
      <p className="mb-2 mt-6 text-sm font-semibold">Recent errors</p>
      <DataTable head={["Time", "Request", "Status", "Duration"]}>
        {(d?.recent_errors ?? []).map((e, i) => (
          <tr key={i} className="border-b border-border/50 last:border-0">
            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
              {e.timestamp}
            </td>
            <td className="px-4 py-3 font-mono text-xs">
              {e.method} {e.path}
            </td>
            <td className="px-4 py-3 font-mono text-xs text-destructive">{e.status_code}</td>
            <td className="px-4 py-3 font-mono text-xs">{e.duration_ms}ms</td>
          </tr>
        ))}
      </DataTable>
      {!d || d.recent_errors.length === 0 ? (
        <Empty>{r.live ? "No recent errors." : "No data available."}</Empty>
      ) : null}
    </div>
  );
}
