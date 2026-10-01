import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("panel p-5", className)}>{children}</div>;
}

export function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-4">
      {eyebrow ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      ) : null}
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string | undefined;
}) {
  return (
    <div className="panel relative overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "on" | "off" | "warn";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-secondary text-secondary-foreground",
    on: "bg-success/15 text-success",
    off: "bg-muted text-muted-foreground",
    warn: "bg-warning/15 text-warning",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export type BadgeMode = "live" | "demo" | "offline" | "unconfigured";

/** 🟢 LIVE / 🟡 DEMO / 🔴 OFFLINE. Pass `mode` when known, otherwise `live` maps to live/offline. */
export function LiveBadge({ live, mode }: { live?: boolean; mode?: BadgeMode }) {
  const m: BadgeMode = mode ?? (live ? "live" : "offline");
  const cfg = {
    live: { dot: "bg-success animate-pulse", label: "Live" },
    demo: { dot: "bg-warning", label: "Demo data" },
    offline: { dot: "bg-destructive", label: "Offline" },
    unconfigured: { dot: "bg-destructive", label: "Not configured" },
  }[m];
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs">
      <span className={cn("size-2 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function ToggleRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2.5 last:border-0">
      <span className="text-sm capitalize">{label.replace(/_/g, " ")}</span>
      <Pill tone={enabled ? "on" : "off"}>{enabled ? "enabled" : "off"}</Pill>
    </div>
  );
}
