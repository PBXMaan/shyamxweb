import type { PublicState } from "@/lib/zyrox-types";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  info: "border-primary/30 bg-primary/10 text-foreground",
  feature: "border-success/30 bg-success/10 text-foreground",
  update: "border-primary/30 bg-primary/10 text-foreground",
  maintenance: "border-warning/40 bg-warning/10 text-foreground",
  outage: "border-destructive/50 bg-destructive/15 text-foreground",
};

/** Maintenance notice + active announcements. Renders nothing when there is nothing real to show. */
export function PlatformBanner({ platform }: { platform: PublicState | null }) {
  if (!platform) return null;
  const items: Array<{ key: string; type: string; title: string; message: string }> = [];
  if (platform.maintenance.enabled) {
    items.push({
      key: "maintenance",
      type: "maintenance",
      title: "Under maintenance",
      message: platform.maintenance.message || "ShyamX is currently under maintenance.",
    });
  }
  for (const a of platform.announcements) {
    items.push({ key: `a${a.id}`, type: a.type, title: a.title, message: a.message });
  }
  if (items.length === 0) return null;
  return (
    <div role="status" className="space-y-px">
      {items.map((i) => (
        <div
          key={i.key}
          className={cn("border-b px-5 py-2.5 text-center text-sm", TONE[i.type] ?? TONE["info"])}
        >
          <span className="font-semibold">{i.title}</span>
          <span className="text-muted-foreground"> — {i.message}</span>
        </div>
      ))}
    </div>
  );
}
