import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type NavGroup = { label: string; items: Array<{ to: string; label: string }> };

function groups(guildId: string): NavGroup[] {
  const base = `/dashboard/servers/${guildId}`;
  return [
    {
      label: "Server",
      items: [
        { to: `${base}`, label: "Overview" },
        { to: `${base}/protection`, label: "Protection" },
        { to: `${base}/automod`, label: "AutoMod" },
        { to: `${base}/logging`, label: "Logging" },
      ],
    },
    {
      label: "Engagement",
      items: [
        { to: `${base}/welcome`, label: "Welcome" },
        { to: `${base}/tickets`, label: "Tickets" },
        { to: `${base}/leveling`, label: "Leveling" },
        { to: `${base}/reactionroles`, label: "Reaction Roles" },
        { to: `${base}/autorole`, label: "AutoRole" },
        { to: `${base}/invites`, label: "Invites" },
        { to: `${base}/tracking`, label: "Tracking" },
      ],
    },
    {
      label: "Advanced",
      items: [
        { to: `${base}/verification`, label: "Verification" },
        { to: `${base}/vanityroles`, label: "Vanity Roles" },
        { to: `${base}/customroles`, label: "Custom Roles" },
        { to: `${base}/j2c`, label: "Join 2 Create" },
        { to: `${base}/joindm`, label: "Join DM" },
        { to: `${base}/autoreact`, label: "Auto React" },
        { to: `${base}/invcrole`, label: "Invite Role" },
      ],
    },
  ];
}

export function GuildSubNav({ guildId }: { guildId: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="w-full space-y-4 lg:w-52 lg:shrink-0">
      {groups(guildId).map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-sm transition",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
