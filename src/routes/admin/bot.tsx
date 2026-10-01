import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminConfig, patchAdminConfig } from "@/lib/bot-modules.server";
import { getOverview } from "@/lib/dashboard.functions";
import { adminGetSystem } from "@/lib/admin-platform.server";
import { Panel, StatCard } from "@/components/ui-kit";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AdminHeader, ApiError, fmtDuration } from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/bot")({
  loader: async () => {
    const [config, overview, system] = await Promise.all([
      getAdminConfig().catch(() => null),
      getOverview(),
      adminGetSystem(),
    ]);
    return { config, overview, system };
  },
  component: AdminBotPage,
});

function AdminBotPage() {
  const { config, overview, system } = Route.useLoaderData();
  const patch = useServerFn(patchAdminConfig);
  const sys = system.data;
  const s = overview.status;

  return (
    <div>
      <AdminHeader
        title="Bot"
        blurb="Process health and global configuration."
        live={overview.live}
      />
      <ApiError live={overview.live} errorMessage={overview.errorMessage ?? undefined} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Discord user" value={overview.live ? s.user : "—"} />
        <StatCard label="Latency" value={sys ? `${sys.latency_ms}ms` : "—"} />
        <StatCard label="Shards" value={sys?.shard_count != null ? String(sys.shard_count) : "—"} />
        <StatCard
          label="Process uptime"
          value={sys ? fmtDuration(sys.process_uptime_seconds) : "—"}
        />
        <StatCard label="Guilds" value={sys ? String(sys.guild_count) : "—"} />
        <StatCard label="Memory" value={sys ? `${sys.memory_mb} MB` : "—"} />
        <StatCard label="CPU" value={sys ? `${sys.cpu_percent}%` : "—"} />
        <StatCard label="Ready" value={sys ? (sys.ready ? "Yes" : "No") : "—"} />
      </div>

      <Panel className="mt-4">
        <h3 className="mb-3 text-sm font-semibold">Runtime</h3>
        {sys ? (
          <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <Row k="Python" v={sys.python_version} />
            <Row k="discord.py" v={sys.discord_py_version} />
            <Row k="Platform" v={sys.platform} />
            <Row k="Threads" v={String(sys.threads)} />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No data available.</p>
        )}
      </Panel>

      {config ? (
        <GlobalNotice
          initial={config.global_notification ?? ""}
          onSave={(text) => patch({ data: { global_notification: text } })}
        />
      ) : null}

      <Panel className="mt-4 text-xs text-muted-foreground">
        This page is global bot configuration only. Per-server settings live under each server in
        the server dashboard, and maintenance mode has its own page.
      </Panel>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 py-1.5">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-mono text-xs">{v}</dd>
    </div>
  );
}

function GlobalNotice({
  initial,
  onSave,
}: {
  initial: string;
  onSave: (t: string) => Promise<unknown>;
}) {
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Panel className="mt-4">
      <h3 className="mb-1 text-sm font-semibold">Global notification text</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Stored in the bot's global config. For public banners with scheduling, use Announcements.
      </p>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} />
      <div className="mt-3 flex items-center gap-3">
        <Button
          type="button"
          disabled={saving || text === initial}
          onClick={async () => {
            setSaving(true);
            setMsg(null);
            try {
              await onSave(text);
              setMsg("✓ Saved");
            } catch (e) {
              setMsg(`✕ ${(e as Error).message}`);
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        {msg ? <span className="text-sm text-muted-foreground">{msg}</span> : null}
      </div>
    </Panel>
  );
}
