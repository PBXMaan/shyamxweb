import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getAllGuilds } from "@/lib/bot-modules.server";
import { Input } from "@/components/ui/input";
import { AdminHeader, ApiError, DataTable, Empty } from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/servers")({
  loader: () => getAllGuilds(),
  component: AdminServersPage,
});

function AdminServersPage() {
  const result = Route.useLoaderData();
  const [q, setQ] = useState("");
  const rows = useMemo(
    () =>
      result.guilds.filter(
        (g) => g.name.toLowerCase().includes(q.toLowerCase()) || g.id.includes(q),
      ),
    [result.guilds, q],
  );

  return (
    <div>
      <AdminHeader
        title={`Servers (${result.guilds.length})`}
        blurb="Every guild the bot is in. Inspecting a server is read-only, audited, and never impersonates its owner."
        live={result.live}
      />
      <ApiError live={result.live} errorMessage={result.errorMessage} />
      <Input
        placeholder="Search by name or ID…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 max-w-xs"
      />
      <DataTable head={["Server", "Guild ID", "Owner ID", "Members", ""]}>
        {rows.map((g) => (
          <tr key={g.id} className="border-b border-border/50 last:border-0">
            <td className="px-4 py-3">
              <span className="flex items-center gap-2">
                {g.icon_url ? (
                  <img src={g.icon_url} alt="" className="size-6 rounded-full" />
                ) : (
                  <span className="grid size-6 place-items-center rounded-full bg-secondary text-[10px]">
                    {g.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                {g.name}
              </span>
            </td>
            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{g.id}</td>
            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
              {g.owner_id ?? "—"}
            </td>
            <td className="px-4 py-3">{g.member_count.toLocaleString()}</td>
            <td className="px-4 py-3 text-right">
              <Link
                to="/admin/servers/$guildId"
                params={{ guildId: g.id }}
                className="text-primary hover:underline"
              >
                Inspect
              </Link>
            </td>
          </tr>
        ))}
      </DataTable>
      {rows.length === 0 ? (
        <Empty>{result.live ? "No servers match." : "No data available."}</Empty>
      ) : null}
    </div>
  );
}
