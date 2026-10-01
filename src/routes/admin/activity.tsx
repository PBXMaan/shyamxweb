import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { adminGetAudit } from "@/lib/admin-platform.server";
import { Pill } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminHeader, ApiError, DataTable, Empty, fmtTime } from "@/components/admin/AdminBits";

const PAGE = 25;

export const Route = createFileRoute("/admin/activity")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s["q"] === "string" ? s["q"].slice(0, 100) : "",
    page: Math.max(0, Number(s["page"]) || 0),
  }),
  loaderDeps: ({ search }) => ({ q: search.q, page: search.page }),
  loader: ({ deps }) =>
    adminGetAudit({ data: { q: deps.q, limit: PAGE + 1, offset: deps.page * PAGE } }),
  component: AuditPage,
});

function AuditPage() {
  const r = Route.useLoaderData();
  const { q, page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [text, setText] = useState(q);
  const rows = (r.data ?? []).slice(0, PAGE);
  const hasMore = (r.data?.length ?? 0) > PAGE;

  return (
    <div>
      <AdminHeader
        title="Audit log"
        blurb="Every sensitive action: who did it, what, on which target, when, and whether it worked. Secrets are never stored."
        live={r.live}
      />
      <ApiError live={r.live} errorMessage={r.errorMessage} />
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search action, target or person…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && navigate({ search: { q: text, page: 0 } })}
          className="max-w-sm"
        />
        <Button
          variant="outline"
          type="button"
          onClick={() => navigate({ search: { q: text, page: 0 } })}
        >
          Search
        </Button>
      </div>
      <DataTable head={["Time", "Actor", "Action", "Target", "Result"]}>
        {rows.map((a) => (
          <tr key={a.id} className="border-b border-border/50 last:border-0">
            <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
              {fmtTime(a.ts)}
            </td>
            <td className="px-4 py-3">{a.actor_name || a.actor_id}</td>
            <td className="px-4 py-3 font-mono text-xs">{a.action}</td>
            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.target}</td>
            <td className="px-4 py-3">
              <Pill tone={a.result === "success" ? "on" : "warn"}>{a.result}</Pill>
            </td>
          </tr>
        ))}
      </DataTable>
      {rows.length === 0 ? (
        <Empty>{r.live ? "No matching entries." : "No data available."}</Empty>
      ) : null}
      <div className="mt-4 flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => navigate({ search: { q, page: page - 1 } })}
        >
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">Page {page + 1}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasMore}
          onClick={() => navigate({ search: { q, page: page + 1 } })}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
