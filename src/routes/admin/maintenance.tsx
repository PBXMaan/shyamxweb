import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminGetMaintenance, adminSetMaintenance } from "@/lib/admin-platform.server";
import { Panel, Pill } from "@/components/ui-kit";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AdminHeader, ApiError, fmtTime } from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/maintenance")({
  loader: () => adminGetMaintenance(),
  component: MaintenancePage,
});

function MaintenancePage() {
  const r = Route.useLoaderData();
  const router = useRouter();
  const setMaint = useServerFn(adminSetMaintenance);
  const cur = r.data ?? { enabled: false, message: "", enabled_by: null, enabled_at: null };
  const [enabled, setEnabled] = useState(cur.enabled);
  const [message, setMessage] = useState(cur.message);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const dirty = enabled !== cur.enabled || message !== cur.message;

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      await setMaint({ data: { enabled, message } });
      setStatus(`✓ Maintenance ${enabled ? "enabled" : "disabled"}`);
      router.invalidate();
    } catch (e) {
      setStatus(`✕ ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <AdminHeader
        title="Maintenance mode"
        blurb="Enforced on the server, not just in the UI."
        live={r.live}
        right={
          <Pill tone={cur.enabled ? "warn" : "on"}>
            {cur.enabled ? "currently ON" : "currently off"}
          </Pill>
        }
      />
      <ApiError live={r.live} errorMessage={r.errorMessage} />

      <Panel>
        <div className="flex items-center justify-between border-b border-border/60 py-3">
          <span className="text-sm font-medium">Maintenance mode</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} disabled={!r.live} />
        </div>
        <div className="py-3">
          <label className="text-xs text-muted-foreground">Message shown to users</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="ShyamX is currently under maintenance. We'll be back shortly."
            disabled={!r.live}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" onClick={save} disabled={saving || !dirty || !r.live}>
            {saving ? "Saving…" : "Save"}
          </Button>
          {status ? <span className="text-sm text-muted-foreground">{status}</span> : null}
        </div>
      </Panel>

      <Panel className="mt-4">
        <h3 className="mb-2 text-sm font-semibold">Current state</h3>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Enabled by</dt>
            <dd>{cur.enabled ? (cur.enabled_by ?? "—") : "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Enabled at</dt>
            <dd>{cur.enabled ? fmtTime(cur.enabled_at) : "—"}</dd>
          </div>
        </dl>
      </Panel>

      <Panel className="mt-4 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">What happens while it is on</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            A banner appears on the public site and every dashboard page, and on the status page.
          </li>
          <li>The dashboard server rejects configuration saves from everyone except bot owners.</li>
          <li>
            The Discord bot only runs commands for its owners (checked on the bot, cached up to ~10
            seconds).
          </li>
          <li>
            Per-module maintenance isn't offered because the bot has no safe way to pause individual
            modules.
          </li>
        </ul>
      </Panel>
    </div>
  );
}
