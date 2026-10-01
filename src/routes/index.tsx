import { createFileRoute, Link } from "@tanstack/react-router";
import { getSiteContext } from "@/lib/public.server";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShyamX — Powerful Discord Server Management" },
      {
        name: "description",
        content:
          "ShyamX is a Discord bot platform with AntiNuke, AutoMod, tickets, leveling, verification and a full web dashboard.",
      },
    ],
  }),
  loader: () => getSiteContext(),
  component: Landing,
});

const FEATURES = [
  {
    title: "Advanced moderation",
    copy: "Ban, kick, timeout, warn, lock, hide, snipe and role tools with detailed logging.",
  },
  {
    title: "AntiNuke",
    copy: "Guards against mass bans, kicks, prunes, webhook abuse, @everyone spam and channel or role wipes.",
  },
  {
    title: "AutoMod",
    copy: "Spam, caps, links, invites, mass mentions and emoji spam, each with its own punishment.",
  },
  {
    title: "Tickets",
    copy: "Panels with categories, staff roles, custom embeds and a closed-ticket archive.",
  },
  {
    title: "Leveling",
    copy: "XP, level-up announcements, rank card styling and a live server leaderboard.",
  },
  {
    title: "Welcome & Join DM",
    copy: "Embed or text greetings with placeholders, plus optional DMs to new members.",
  },
  {
    title: "Reaction Roles & AutoRole",
    copy: "Self-assignable roles and automatic roles for humans and bots on join.",
  },
  {
    title: "Verification",
    copy: "Gate new members behind button or captcha verification with a dedicated role.",
  },
  {
    title: "Custom & Vanity Roles",
    copy: "Role slots and vanity-status rewards, managed without touching a command.",
  },
  {
    title: "Automation",
    copy: "AutoReact triggers, Join 2 Create voice channels, invite tracking and more.",
  },
  {
    title: "Logging",
    copy: "Route message, member, voice, channel, role and system events to your own channels.",
  },
  {
    title: "Analytics",
    copy: "Leaderboards, invite stats and a per-server activity trail of configuration changes.",
  },
];

const PLATFORM = [
  {
    title: "REST API",
    copy: "A FastAPI backend, authenticated server-to-server. Secrets never reach the browser.",
  },
  {
    title: "Central administration",
    copy: "A separate owner-only control center for the whole platform.",
  },
  {
    title: "Monitoring",
    copy: "Live bot, API and database health, with request logs and error tracking.",
  },
  {
    title: "Maintenance & announcements",
    copy: "Enforced server-side maintenance mode and scheduled platform notices.",
  },
  {
    title: "Audit trail",
    copy: "Every sensitive owner action is recorded with who, what, when and the result.",
  },
  {
    title: "One deployment",
    copy: "Website, dashboard, API and bot run together on a single host.",
  },
];

const STEPS = [
  { n: "01", title: "Add ShyamX", copy: "Invite the bot to your server with one click." },
  {
    n: "02",
    title: "Sign in with Discord",
    copy: "Only servers you own or manage appear. Nothing else is reachable.",
  },
  {
    n: "03",
    title: "Configure visually",
    copy: "Pick real channels and roles from dropdowns and save. The bot applies it.",
  },
];

function Landing() {
  const ctx = Route.useLoaderData();
  const platform = ctx.platform;
  const stats = platform
    ? [
        { label: "Servers", value: platform.guild_count },
        { label: "Members reached", value: platform.user_count },
        { label: "Commands", value: platform.command_count },
      ]
    : [];

  return (
    <SiteShell ctx={ctx}>
      <section className="grid-backdrop border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
              Discord bot platform
            </p>
            <h1 className="mt-5 text-5xl font-bold leading-[1.04] sm:text-6xl">
              Powerful Discord
              <br />
              <span className="text-primary">Server Management</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Moderation, security, tickets, leveling and automation, all configured from one fast
              dashboard and enforced by the bot in real time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/invite"
                className="glow-red rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90"
              >
                Add ShyamX to Discord
              </a>
              <Link
                to="/dashboard"
                className="rounded-md border border-border bg-surface px-6 py-3 font-medium transition hover:bg-surface-2"
              >
                Manage Your Server
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free to sign in. You only ever see servers you own or manage.
            </p>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {stats.length > 0 ? (
        <section className="border-b border-border bg-surface/40">
          <div className="mx-auto grid max-w-6xl grid-cols-3 gap-4 px-5 py-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl font-bold">{s.value.toLocaleString()}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-5 py-20">
        <SectionHead
          eyebrow="for server owners"
          title="Everything your server needs, in one place"
          copy="Each module below has a real settings page in the dashboard, backed by the live bot."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="panel p-6 transition hover:border-primary/60">
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.copy}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/features" className="text-sm text-primary hover:underline">
            See every feature →
          </Link>
        </div>
      </section>

      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">security</p>
            <h2 className="mt-3 text-3xl font-bold">Protection that acts before damage is done</h2>
            <p className="mt-4 text-muted-foreground">
              AntiNuke watches for destructive actions, while AutoMod handles day-to-day spam and
              abuse. Whitelist your trusted admins, log everything, and keep an emergency mode in
              reserve.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "Granular AntiNuke guards with a user whitelist",
                "Six AutoMod detectors with configurable punishments",
                "Verification gate for new members",
                "Detailed event logging to channels you choose",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-primary">▸</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              access model
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <Row
                a="Server owners & admins"
                b="Manage only the servers they own or hold Manage Server / Administrator on"
              />
              <Row
                a="Bot owners"
                b="A separate admin panel, checked server-side on every request"
              />
              <Row a="Everyone else" b="Public site only: features, commands, docs and status" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <SectionHead eyebrow="how it works" title="From invite to configured in minutes" />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="panel p-6">
              <p className="font-mono text-sm text-primary">{s.n}</p>
              <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHead
            eyebrow="for platform owners"
            title="Run ShyamX like a product"
            copy="A dedicated control center gives bot owners visibility and control over the entire platform."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM.map((f) => (
              <div key={f.title} className="panel p-6">
                <h3 className="font-display text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h2 className="text-4xl font-bold">Ready to take control of your server?</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Add the bot, sign in, and start configuring.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="/invite"
            className="glow-red rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90"
          >
            Add ShyamX to Discord
          </a>
          <Link
            to="/docs"
            className="rounded-md border border-border bg-surface px-6 py-3 font-medium transition hover:bg-surface-2"
          >
            Read the docs
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}

function SectionHead({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold">{title}</h2>
      {copy ? <p className="mt-3 text-muted-foreground">{copy}</p> : null}
    </div>
  );
}

function Row({ a, b }: { a: string; b: string }) {
  return (
    <div className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <p className="font-medium">{a}</p>
      <p className="text-muted-foreground">{b}</p>
    </div>
  );
}

/** Purely illustrative UI mock (no data), labelled as a preview. */
function DashboardPreview() {
  const rows = ["AntiNuke", "AutoMod", "Logging", "Welcome", "Tickets", "Leveling"];
  return (
    <div className="panel relative overflow-hidden p-0" aria-hidden="true">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-primary/70" />
        <span className="size-2.5 rounded-full bg-warning/70" />
        <span className="size-2.5 rounded-full bg-success/70" />
        <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          interface preview
        </span>
      </div>
      <div className="grid grid-cols-[110px_1fr]">
        <div className="space-y-1 border-r border-border p-3 text-xs text-muted-foreground">
          {["Overview", "Protection", "Engagement", "Automation", "Roles"].map((l, i) => (
            <div
              key={l}
              className={`rounded px-2 py-1.5 ${i === 1 ? "bg-primary/15 text-primary" : ""}`}
            >
              {l}
            </div>
          ))}
        </div>
        <div className="space-y-2 p-4">
          {rows.map((r, i) => (
            <div
              key={r}
              className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2.5"
            >
              <span className="text-sm">{r}</span>
              <span className={`h-5 w-9 rounded-full p-0.5 ${i < 4 ? "bg-primary" : "bg-muted"}`}>
                <span
                  className={`block size-4 rounded-full bg-white transition ${i < 4 ? "translate-x-4" : ""}`}
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
