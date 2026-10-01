import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getLogs } from "@/lib/dashboard.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminHeader, DataTable, Empty } from "@/components/admin/AdminBits";

const PAGE = 25;

export const Route = createFileRoute("/admin/logs")({
  loader: () => getLogs(),
  component: Logs,
});

type Sev = "all" | "error" | "warning" | "ok";

function sevOf(code: number): Exclude<Sev, "all"> {
  return code >= 500 ? "error" : code >= 400 ? "warning" : "ok";
}

function Logs() {
  const { logs, live } = Route.useLoaderData();
  const [q, setQ] = useState("");
  const [sev, setSev] = useState<Sev>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const code = Number(l.status_code);
      if (sev !== "all" && sevOf(code) !== sev) return false;
      if (q && !`${l.method} ${l.path}`.toLowerCase().includes(q.toLowerCase())) return false;
      const day = String(l.timestamp).slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [logs, q, sev, from, to]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const view = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const reset =
    <T,>(fn: (v: T) => void) =>
    (v: T) => {
      fn(v);
      setPage(0);
    };

  return (
    <div>
      <AdminHeader
        title="API request logs"
        blurb="The bot API's most recent 200 requests. Paths only: request bodies, headers and keys are never logged."
        live={live}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search method or path…"
          value={q}
          onChange={(e) => reset(setQ)(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={sev}
          onChange={(e) => reset(setSev)(e.target.value as Sev)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All severities</option>
          <option value="error">Errors (5xx)</option>
          <option value="warning">Warnings (4xx)</option>
          <option value="ok">Success</option>
        </select>
        <Input
          type="date"
          value={from}
          onChange={(e) => reset(setFrom)(e.target.value)}
          className="w-40"
          aria-label="From date"
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => reset(setTo)(e.target.value)}
          className="w-40"
          aria-label="To date"
        />
      </div>
      <DataTable head={["Time", "Method", "Path", "Status", "Duration"]}>
        {view.map((log, i) => {
          const code = Number(log.status_code);
          return (
            <tr key={i} className="border-b border-border/50 last:border-0">
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                {log.timestamp}
              </td>
              <td className="px-4 py-3 font-mono text-xs">{log.method}</td>
              <td className="max-w-[320px] truncate px-4 py-3 font-mono text-xs">{log.path}</td>
              <td
                className={cn(
                  "px-4 py-3 font-mono text-xs",
                  code >= 500 ? "text-destructive" : code >= 400 ? "text-warning" : "text-success",
                )}
              >
                {log.status_code}
              </td>
              <td className="px-4 py-3 font-mono text-xs">{log.duration_ms} ms</td>
            </tr>
          );
        })}
      </DataTable>
      {view.length === 0 ? (
        <Empty>{live ? "No matching requests." : "No data available."}</Empty>
      ) : null}
      <div className="mt-4 flex items-center gap-3">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {page + 1} of {pages} · {filtered.length} entries
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page + 1 >= pages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
