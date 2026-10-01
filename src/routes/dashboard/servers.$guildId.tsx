import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { loadGuildBasics } from "@/lib/guild-basics.server";
import { GuildSubNav } from "@/components/dashboard/GuildSubNav";

export const Route = createFileRoute("/dashboard/servers/$guildId")({
  loader: async ({ params }) => {
    const basics = await loadGuildBasics(params.guildId);
    return { basics, guildId: params.guildId };
  },
  component: GuildLayout,
});

function GuildLayout() {
  const { basics, guildId } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div>
        <Link to="/dashboard/servers" className="text-xs text-primary hover:underline">
          ← All servers
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{basics.details?.name ?? "Unknown server"}</h1>
        <p className="text-sm text-muted-foreground">
          {basics.details?.member_count
            ? `${basics.details.member_count.toLocaleString()} members`
            : "—"}
          {" · "}
          {guildId}
        </p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <GuildSubNav guildId={guildId} />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
