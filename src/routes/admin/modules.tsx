import { createFileRoute } from "@tanstack/react-router";
import { adminGetModules } from "@/lib/admin-platform.server";
import { Panel, Pill } from "@/components/ui-kit";
import { AdminHeader, ApiError, DataTable, Empty } from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/modules")({
  loader: () => adminGetModules(),
  component: ModulesPage,
});

function ModulesPage() {
  const r = Route.useLoaderData();
  const cogs = r.data?.cogs ?? [];
  const exts = r.data?.extensions ?? [];
  return (
    <div>
      <AdminHeader
        title="Modules"
        blurb="Every cog currently loaded in the running bot, with command and listener counts."
        live={r.live}
      />
      <ApiError live={r.live} errorMessage={r.errorMessage} />
      <Panel className="mb-4 text-xs text-muted-foreground">
        This page is read-only by design: unloading or reloading a live cog can break other modules
        that depend on it, so module state is changed by editing the bot and restarting it, not from
        the browser. Load errors appear in the bot's console output.
      </Panel>
      <DataTable head={["Module", "Status", "Commands", "Listeners"]}>
        {cogs.map((c) => (
          <tr key={c.name} className="border-b border-border/50 last:border-0">
            <td className="px-4 py-3 font-medium">{c.name}</td>
            <td className="px-4 py-3">
              <Pill tone="on">loaded</Pill>
            </td>
            <td className="px-4 py-3">{c.commands}</td>
            <td className="px-4 py-3">{c.listeners}</td>
          </tr>
        ))}
      </DataTable>
      {cogs.length === 0 ? (
        <Empty>{r.live ? "No cogs loaded." : "No data available."}</Empty>
      ) : null}
      {exts.length > 0 ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            {exts.length} loaded extensions
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {exts.map((e) => (
              <span key={e.name} className="rounded bg-secondary px-2 py-0.5 font-mono text-[11px]">
                {e.name}
              </span>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
