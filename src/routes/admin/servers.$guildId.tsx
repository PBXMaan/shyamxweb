import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/auth.server";
import { isAdminId } from "@/lib/maintenance.server";
import { botApi, botApiConfigured } from "@/lib/bot-api.server";
import type * as T from "@/lib/zyrox-types";
import { Panel, Pill } from "@/components/ui-kit";
import { AdminHeader, ApiError } from "@/components/admin/AdminBits";

const MODULES = [
  "antinuke", "automod", "logging", "welcome", "tickets", "leveling",
  "verification", "autorole", "reactionroles", "tracking", "j2c", "joindm",
  "customroles", "autoreact", "invcrole",
] as const;

type InspectResult = {
  live: boolean;
  details: T.GuildDetails | null;
  modules: Record<string, unknown>;
  moduleErrors: Record<string, string>;
  errorMessage?: string;
};

const inspectGuild = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => {
    const guildId = (value as { guildId?: string })?.guildId;
    if (typeof guildId !== "string" || !/^\d{5,25}$/.test(guildId)) {
      throw new Error("Invalid server ID");
    }
    return { guildId };
  })
  .handler(async ({ data }): Promise<InspectResult> => {
    const user = await requireUser();
    if (!isAdminId(user.id)) throw new Error("Not authorized");

    if (!botApiConfigured()) {
      return {
        live: false,
        details: null,
        modules: {},
        moduleErrors: {},
        errorMessage: "Bot API is not configured on Vercel. Set BOT_API_BASE_URL and DASHBOARD_API_KEY.",
      };
    }

    const detailsResult = await (async () => {
      try {
        return { value: await botApi<T.GuildDetails>(`/api/v1/guilds/${data.guildId}`) };
      } catch (e) {
        return { error: (e as Error).message || "Failed to load server details." };
      }
    })();

    // Load modules independently so one broken module cannot break Inspect.
    const moduleResults = await Promise.all(
      MODULES.map(async (name) => {
        try {
          const value = await botApi<unknown>(`/api/v1/guilds/${data.guildId}/${name}`);
          return [name, { value }] as const;
        } catch (e) {
          return [name, { error: (e as Error).message || "Unavailable" }] as const;
        }
      }),
    );

    const modules: Record<string, unknown> = {};
    const moduleErrors: Record<string, string> = {};
    for (const [name, result] of moduleResults) {
      if ("value" in result) modules[name] = result.value;
      else moduleErrors[name] = result.error;
    }

    return {
      live: "value" in detailsResult,
      details: "value" in detailsResult ? detailsResult.value : null,
      modules,
      moduleErrors,
      errorMessage: "error" in detailsResult ? detailsResult.error : undefined,
    };
  });

export const Route = createFileRoute("/admin/servers/$guildId")({
  loader: ({ params }) => inspectGuild({ data: { guildId: params.guildId } }),
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
          title={r.details?.name ?? `Server ${guildId}`}
          blurb={`Read-only inspection for guild ${guildId}.`}
          live={r.live}
        />
      </div>

      <ApiError live={r.live} errorMessage={r.errorMessage} />

      {r.details ? (
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <Pill>{r.details.member_count.toLocaleString()} members</Pill>
          <Pill>{r.details.role_count} roles</Pill>
          <Pill>{r.details.channel_count} channels</Pill>
          <Pill>owner {r.details.owner_id}</Pill>
        </div>
      ) : (
        <Panel>
          <div className="text-sm font-medium">Could not load this Discord server.</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {r.errorMessage ?? "The bot API did not return guild details."}
          </div>
        </Panel>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {MODULES.map((name) => {
          const cfg = r.modules[name];
          const error = r.moduleErrors[name];
          return (
            <Panel key={name}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{name}</h3>
                <Pill tone={cfg !== undefined ? "on" : "off"}>
                  {cfg !== undefined ? "loaded" : error ? "error" : "unavailable"}
                </Pill>
              </div>
              <pre className="max-h-56 overflow-auto rounded bg-surface-2 p-3 font-mono text-[11px] text-muted-foreground">
                {cfg !== undefined
                  ? JSON.stringify(cfg, null, 2)
                  : error ?? "No data available."}
              </pre>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
