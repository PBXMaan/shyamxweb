import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminCreateAnnouncement,
  adminDeleteAnnouncement,
  adminGetAnnouncements,
  adminToggleAnnouncement,
} from "@/lib/admin-platform.server";
import { Panel, Pill } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AdminHeader, ApiError, Empty, fmtTime } from "@/components/admin/AdminBits";
import type { Announcement } from "@/lib/zyrox-types";

export const Route = createFileRoute("/admin/announcements")({
  loader: () => adminGetAnnouncements(),
  component: AnnouncementsPage,
});

const TYPES: Announcement["type"][] = ["info", "update", "feature", "maintenance", "outage"];

function toTs(v: string): number | null {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : t / 1000;
}

function AnnouncementsPage() {
  const r = Route.useLoaderData();
  const router = useRouter();
  const create = useServerFn(adminCreateAnnouncement);
  const toggle = useServerFn(adminToggleAnnouncement);
  const del = useServerFn(adminDeleteAnnouncement);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<Announcement["type"]>("info");
  const [starts, setStarts] = useState("");
  const [expires, setExpires] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>, ok?: string) {
    setBusy(true);
    setStatus(null);
    try {
      await fn();
      if (ok) setStatus(ok);
      router.invalidate();
    } catch (e) {
      setStatus(`✕ ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AdminHeader
        title="Announcements"
        blurb="Notices shown as a banner on the public site, dashboard and status page. They are website notices only; nothing is posted to Discord."
        live={r.live}
      />
      <ApiError live={r.live} errorMessage={r.errorMessage} />

      <Panel className="mb-6">
        <h3 className="mb-3 text-sm font-semibold">New announcement</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Title"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Announcement["type"])}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <Textarea
          className="mt-3"
          placeholder="Message"
          rows={3}
          value={message}
          maxLength={2000}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-muted-foreground">
            Starts (optional)
            <Input
              type="datetime-local"
              value={starts}
              onChange={(e) => setStarts(e.target.value)}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Expires (optional)
            <Input
              type="datetime-local"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button
            type="button"
            disabled={busy || !title.trim() || !message.trim() || !r.live}
            onClick={() =>
              run(async () => {
                await create({
                  data: {
                    title: title.trim(),
                    message: message.trim(),
                    type,
                    active: true,
                    starts_at: toTs(starts),
                    expires_at: toTs(expires),
                    created_by: "",
                  },
                });
                setTitle("");
                setMessage("");
                setStarts("");
                setExpires("");
              }, "✓ Announcement created")
            }
          >
            Publish
          </Button>
          {status ? <span className="text-sm text-muted-foreground">{status}</span> : null}
        </div>
      </Panel>

      <div className="space-y-3">
        {(r.data ?? []).map((a) => (
          <Panel key={a.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{a.title}</p>
                  <Pill>{a.type}</Pill>
                  <Pill tone={a.active ? "on" : "off"}>{a.active ? "active" : "inactive"}</Pill>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Starts {fmtTime(a.starts_at)} · Expires {fmtTime(a.expires_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(() => toggle({ data: { id: a.id, active: !a.active } }))}
                >
                  {a.active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`Delete announcement "${a.title}"? This can't be undone.`)) {
                      void run(() => del({ data: { id: a.id } }));
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Panel>
        ))}
        {(r.data ?? []).length === 0 ? (
          <Empty>{r.live ? "No announcements yet." : "No data available."}</Empty>
        ) : null}
      </div>
    </div>
  );
}
