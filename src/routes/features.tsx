import { createFileRoute } from "@tanstack/react-router";
import { getSiteContext } from "@/lib/public.server";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/features")({
  head: () => ({ meta: [{ title: "Features — ShyamX" }] }),
  loader: () => getSiteContext(),
  component: FeaturesPage,
});

// "dash: true" means the module has a real settings page in the dashboard (it is backed by an
// API endpoint). Everything else works through Discord commands only, and is labelled as such.
type Item = { name: string; copy: string; dash?: boolean };
type Group = { title: string; blurb: string; items: Item[] };

const GROUPS: Group[] = [
  {
    title: "Protection",
    blurb: "Stop raids, nukes and spam before they spread.",
    items: [
      {
        name: "AntiNuke",
        copy: "Guards against mass bans, kicks, prunes, webhook abuse, @everyone spam, bot adds, and channel or role tampering. Whitelist trusted users.",
        dash: true,
      },
      {
        name: "AutoMod",
        copy: "Anti-spam, caps, links, invites, mass mentions and emoji spam with per-trigger punishments and ignore lists.",
        dash: true,
      },
      {
        name: "Emergency & Night mode",
        copy: "Lock down quickly during an incident or restrict activity on a schedule.",
      },
      { name: "Honeypot", copy: "Trap channels that catch bots and compromised accounts." },
    ],
  },
  {
    title: "Moderation",
    blurb: "The everyday toolkit moderators expect.",
    items: [
      {
        name: "Moderation commands",
        copy: "Ban, unban, kick, timeout, unmute, warn, jail, lock, unlock, hide, unhide, snipe and role management.",
      },
      {
        name: "Logging",
        copy: "Nine event categories: messages, joins and leaves, member moderation, voice, channels, roles, emojis, reactions and system events.",
        dash: true,
      },
      {
        name: "Blacklist & ignore",
        copy: "Block users from the bot or exempt channels and roles.",
      },
    ],
  },
  {
    title: "Engagement",
    blurb: "Keep your community active and welcomed.",
    items: [
      {
        name: "Welcome",
        copy: "Embed or plain-text greetings with placeholders, images and auto-delete.",
        dash: true,
      },
      {
        name: "Tickets",
        copy: "Button or dropdown panels, categories, staff roles, per-category Discord categories and a log channel.",
        dash: true,
      },
      {
        name: "Leveling",
        copy: "XP per message, cooldowns, level-up channel, rank card color and a leaderboard.",
        dash: true,
      },
      {
        name: "Reaction Roles",
        copy: "Attach roles to emoji reactions on any message, with optional DM confirmation.",
        dash: true,
      },
      {
        name: "AutoRole",
        copy: "Assign roles to humans and bots automatically when they join.",
        dash: true,
      },
      {
        name: "Invite tracking",
        copy: "See who is bringing members in, including fakes, leaves and rejoins.",
        dash: true,
      },
      {
        name: "Giveaways, birthdays & counting",
        copy: "Community events and games run by commands.",
      },
    ],
  },
  {
    title: "Automation",
    blurb: "Let the bot handle the repetitive work.",
    items: [
      {
        name: "AutoReact",
        copy: "React with chosen emojis whenever a trigger phrase appears.",
        dash: true,
      },
      {
        name: "Join DM",
        copy: "Send a custom message to members' DMs when they join.",
        dash: true,
      },
      {
        name: "Tracking",
        copy: "Choose where invite join and leave events are announced.",
        dash: true,
      },
      {
        name: "Join 2 Create",
        copy: "Temporary voice channels created on demand, with a control panel.",
        dash: true,
      },
      {
        name: "AutoResponder & sticky messages",
        copy: "Canned replies and messages that stay at the bottom of a channel.",
      },
    ],
  },
  {
    title: "Roles & verification",
    blurb: "Structure access with less manual work.",
    items: [
      {
        name: "Verification",
        copy: "Button, captcha or both, with a verified role and a log channel.",
        dash: true,
      },
      {
        name: "Custom Roles",
        copy: "Named role slots (staff, VIP, guest, friend and more) used by role commands.",
        dash: true,
      },
      {
        name: "Vanity Roles",
        copy: "Reward members for advertising your vanity link in their status.",
        dash: true,
      },
      {
        name: "Invite Role",
        copy: "Grant a role while members are in a voice channel.",
        dash: true,
      },
    ],
  },
  {
    title: "Fun & utility",
    blurb: "The extras that make a server feel alive.",
    items: [
      {
        name: "Music",
        copy: "Play music in voice channels through Lavalink. Controlled with Discord commands.",
      },
      { name: "Games", copy: "Blackjack, slots, Black Tea and more." },
      { name: "AI tools", copy: "AI chat, image generation and support helpers." },
      { name: "Utilities", copy: "AFK, translate, QR codes, calculator and timers." },
    ],
  },
];

function FeaturesPage() {
  const ctx = Route.useLoaderData();
  return (
    <SiteShell ctx={ctx}>
      <section className="grid-backdrop border-b border-border">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">features</p>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Everything ShyamX can do</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Modules marked <Tag dash /> have a full settings page in the dashboard. Modules marked{" "}
            <Tag /> are used through Discord commands.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl space-y-16 px-5 py-16">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="text-2xl font-bold">{g.title}</h2>
            <p className="mt-1 text-muted-foreground">{g.blurb}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {g.items.map((i) => (
                <div key={i.name} className="panel p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-base font-semibold">{i.name}</h3>
                    <Tag dash={i.dash ?? false} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{i.copy}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SiteShell>
  );
}

function Tag({ dash }: { dash?: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
        dash ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
      }`}
    >
      {dash ? "Dashboard" : "Commands"}
    </span>
  );
}
