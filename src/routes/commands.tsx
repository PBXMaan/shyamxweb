import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getPublicCommands, getSiteContext } from "@/lib/public.server";
import { SiteShell } from "@/components/site/SiteShell";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui-kit";

export const Route = createFileRoute("/commands")({
  head: () => ({ meta: [{ title: "Commands — ShyamX" }] }),
  loader: async () => {
    const [ctx, cmds] = await Promise.all([getSiteContext(), getPublicCommands()]);
    return { ctx, cmds };
  },
  component: CommandsPage,
});

function CommandsPage() {
  const { ctx, cmds } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(cmds.commands.map((c) => c.category))).sort()],
    [cmds.commands],
  );
  const filtered = useMemo(
    () =>
      cmds.commands.filter((c) => {
        if (category !== "all" && c.category !== category) return false;
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.aliases.some((a) => a.toLowerCase().includes(q)) ||
          (c.description ?? "").toLowerCase().includes(q)
        );
      }),
    [cmds.commands, query, category],
  );

  return (
    <SiteShell ctx={ctx}>
      <section className="grid-backdrop border-b border-border">
        <div className="mx-auto max-w-4xl px-5 py-14 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">commands</p>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Command reference</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Loaded live from the running bot, so this list is always what is actually available.
            Every command is credited to <span className="font-medium text-foreground">Armaan</span>
            .
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10">
        {!cmds.live ? (
          <div className="panel p-8 text-center text-sm text-muted-foreground">
            No data available. The command list is not yet collected because the bot API is offline
            or not configured.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                placeholder="Search commands…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="max-w-xs"
              />
              <span className="text-sm text-muted-foreground">
                {filtered.length} of {cmds.commands.length}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    category === c
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:bg-surface-2"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((cmd) => (
                <div key={cmd.name} className="panel space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-sm font-semibold">{cmd.name}</p>
                    <div className="flex gap-1">
                      {cmd.is_prefix ? <Pill>prefix</Pill> : null}
                      {cmd.is_slash ? <Pill tone="on">slash</Pill> : null}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{cmd.category}</p>
                  {cmd.description ? <p className="text-sm">{cmd.description}</p> : null}
                  {cmd.usage ? (
                    <p className="font-mono text-xs text-muted-foreground">{cmd.usage}</p>
                  ) : null}
                  {cmd.aliases.length ? (
                    <p className="text-xs text-muted-foreground">
                      Aliases: {cmd.aliases.join(", ")}
                    </p>
                  ) : null}
                  <p className="text-[11px] text-muted-foreground/70">Credit: Armaan</p>
                </div>
              ))}
              {filtered.length === 0 ? (
                <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                  No commands match.
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </SiteShell>
  );
}
