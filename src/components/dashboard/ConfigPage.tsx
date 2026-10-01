import { type ReactNode, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { LiveBadge, SectionTitle } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

/**
 * Standard shell every module page uses: eyebrow/title, live/demo badge, an
 * optional API-error banner, the form content, and a consistent
 * Reset / Save Changes bar that prevents double-submits and always reports
 * success or failure (never silently).
 */
export function ConfigPage({
  eyebrow,
  title,
  description,
  live,
  loadError,
  children,
  onSave,
  onReset,
  dirty,
  extra,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  live: boolean;
  loadError?: string | undefined;
  children: ReactNode;
  onSave: () => Promise<void>;
  onReset: () => void;
  dirty: boolean;
  extra?: ReactNode;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; message: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      await onSave();
      setStatus({ kind: "ok", message: "Configuration saved" });
      router.invalidate();
    } catch (error) {
      setStatus({
        kind: "err",
        message: (error as Error).message || "Failed to save configuration",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle eyebrow={eyebrow} title={title} />
        <div className="flex items-center gap-2">
          {extra}
          <LiveBadge live={live} />
        </div>
      </div>
      {description ? <p className="-mt-4 text-sm text-muted-foreground">{description}</p> : null}

      {loadError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not reach the bot API: {loadError}
        </div>
      ) : null}

      {children}

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface/95 px-4 py-3 backdrop-blur">
        <Button variant="outline" onClick={onReset} disabled={saving || !dirty} type="button">
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving || !dirty} type="button">
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {status ? (
          <span
            className={status.kind === "ok" ? "text-sm text-success" : "text-sm text-destructive"}
          >
            {status.kind === "ok" ? "✓ " : "✕ "}
            {status.message}
          </span>
        ) : !dirty ? (
          <span className="text-sm text-muted-foreground">No unsaved changes</span>
        ) : null}
      </div>
    </div>
  );
}

export function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2 border-b border-border/60 py-3 last:border-0 sm:grid-cols-3 sm:items-start sm:gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}
