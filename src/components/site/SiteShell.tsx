import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { SiteContext } from "@/lib/public.server";
import { PlatformBanner } from "@/components/site/PlatformBanner";
import { AccountMenu } from "@/components/site/AccountMenu";

export const BRAND = "ShyamX";

export const PUBLIC_NAV = [
  { to: "/features", label: "Features" },
  { to: "/commands", label: "Commands" },
  { to: "/docs", label: "Docs" },
  { to: "/status", label: "Status" },
] as const;

export function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`grid place-items-center rounded-md bg-primary font-display font-bold text-primary-foreground ${
          size === "lg" ? "size-10 text-lg" : "size-8 text-sm"
        }`}
      >
        S
      </span>
      <span
        className={`font-display font-bold tracking-tight ${size === "lg" ? "text-2xl" : "text-lg"}`}
      >
        {BRAND}
      </span>
    </span>
  );
}

/** Public-site chrome: nav, platform banner (maintenance/announcements), footer. */
export function SiteShell({ ctx, children }: { ctx: SiteContext; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PlatformBanner platform={ctx.platform} />
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <Link to="/" aria-label={`${BRAND} home`}>
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="transition hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <a
              href="/invite"
              className="hidden rounded-md border border-border bg-surface px-3.5 py-2 text-sm font-medium transition hover:bg-surface-2 sm:inline-block"
            >
              Add to Discord
            </a>
            {ctx.user ? (
              <AccountMenu user={ctx.user} isAdmin={ctx.isAdmin} />
            ) : (
              <a
                href="/api/public/auth/discord/login"
                className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Login
              </a>
            )}
          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto border-t border-border/50 px-5 py-2 text-sm text-muted-foreground md:hidden">
          {PUBLIC_NAV.map((item) => (
            <Link key={item.to} to={item.to} className="whitespace-nowrap hover:text-foreground">
              {item.label}
            </Link>
          ))}
          <a href="/invite" className="whitespace-nowrap hover:text-foreground">
            Add to Discord
          </a>
        </nav>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <BrandMark />
            <p className="mt-3 text-sm text-muted-foreground">
              A Discord bot platform: moderation, security, engagement and automation, managed from
              one dashboard.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-muted-foreground transition hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <a href="/invite" className="text-muted-foreground transition hover:text-foreground">
              Invite
            </a>
            <Link
              to="/dashboard"
              className="text-muted-foreground transition hover:text-foreground"
            >
              Dashboard
            </Link>
          </div>
        </div>
        <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {BRAND}. Commands crafted by Armaan.
        </div>
      </footer>
    </div>
  );
}
