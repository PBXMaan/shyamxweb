import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getCommands } from "@/lib/bot-modules.server";
import { Panel, SectionTitle, LiveBadge, Pill } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/dashboard/commands")({
  loader: () => getCommands(),
  component: CommandsPage,
});

function CommandsPage() {
  const result = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | "all">("all");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(result.commands.map((c) => c.category))).sort()],
    [result.commands],
  );

  const filtered = useMemo(
    () =>
      result.commands.filter((c) => {
        if (category !== "all" && c.category !== category) return false;
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) || c.aliases.some((a) => a.toLowerCase().includes(q))
        );
      }),
    [result.commands, query, category],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle eyebrow="bot" title="Commands" />
        <LiveBadge live={result.live} />
      </div>
      {result.errorMessage ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not reach the bot API: {result.errorMessage}
        </div>
      ) : null}
      <p className="-mt-4 text-sm text-muted-foreground">
        {result.commands.length} commands loaded live from the bot's command tree. Owner-only
        commands are hidden. All commands credit:{" "}
        <span className="font-medium text-foreground">Armaan</span>.
      </p>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search commands…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
                category === c
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:bg-surface-2"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((cmd) => (
          <Panel key={cmd.name} className="space-y-2">
            <div className="flex items-center justify-between">
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
              <p className="text-xs text-muted-foreground">Aliases: {cmd.aliases.join(", ")}</p>
            ) : null}
            <p className="text-[11px] text-muted-foreground/70">Credit: Armaan</p>
          </Panel>
        ))}
        {filtered.length === 0 ? (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            No commands match.
          </p>
        ) : null}
      </div>
    </div>
  );
}
