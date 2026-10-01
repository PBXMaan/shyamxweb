import type { ReactNode } from "react";
import { LiveBadge, Panel } from "@/components/ui-kit";

export function AdminHeader({
  title,
  blurb,
  live,
  right,
}: {
  title: string;
  blurb?: string;
  live?: boolean;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-destructive">admin</p>
        <h1 className="text-2xl font-bold">{title}</h1>
        {blurb ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{blurb}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        {right}
        {live !== undefined ? <LiveBadge live={live} /> : null}
      </div>
    </div>
  );
}

export function ApiError({
  errorMessage,
  live,
}: {
  errorMessage?: string | undefined;
  live: boolean;
}) {
  if (live) return null;
  return (
    <Panel className="mb-4 border-destructive/40 text-sm text-muted-foreground">
      {errorMessage
        ? `Could not load this data: ${errorMessage}`
        : "No data available. The bot API isn't configured or isn't reachable."}
    </Panel>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

/** Responsive table: horizontal scroll on small screens, never breaks the page layout. */
export function DataTable({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <Panel className="overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </Panel>
  );
}

export function fmtTime(ts: number | null | undefined): string {
  return ts ? new Date(ts * 1000).toLocaleString() : "—";
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function fmtDuration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}
