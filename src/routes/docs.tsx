import { createFileRoute, Link } from "@tanstack/react-router";
import { getSiteContext } from "@/lib/public.server";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/docs")({
  head: () => ({ meta: [{ title: "Docs — ShyamX" }] }),
  loader: () => getSiteContext(),
  component: DocsPage,
});

const TOC = [
  ["getting-started", "Getting started"],
  ["access", "Who can manage what"],
  ["modules", "Configuring modules"],
  ["maintenance", "Maintenance mode"],
  ["activity", "Activity & audit"],
  ["owners", "For bot owners"],
  ["faq", "FAQ"],
] as const;

function DocsPage() {
  const ctx = Route.useLoaderData();
  return (
    <SiteShell ctx={ctx}>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            On this page
          </p>
          <nav className="flex gap-3 overflow-x-auto text-sm lg:flex-col lg:gap-1.5">
            {TOC.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="whitespace-nowrap text-muted-foreground hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <article className="max-w-3xl space-y-12">
          <header>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
              documentation
            </p>
            <h1 className="mt-3 text-4xl font-bold">ShyamX documentation</h1>
            <p className="mt-3 text-muted-foreground">
              Everything you need to add the bot, manage your server and understand how the platform
              is put together.
            </p>
          </header>

          <Section id="getting-started" title="Getting started">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Use{" "}
                <a className="text-primary hover:underline" href="/invite">
                  Add to Discord
                </a>{" "}
                to invite the bot. You need the <em>Manage Server</em> permission on the server.
              </li>
              <li>
                <a className="text-primary hover:underline" href="/api/public/auth/discord/login">
                  Log in with Discord
                </a>
                . ShyamX only requests your identity and your server list.
              </li>
              <li>
                Open{" "}
                <Link className="text-primary hover:underline" to="/dashboard/servers">
                  My Servers
                </Link>{" "}
                and choose
                <em> Manage Server</em> on any server where the bot is installed.
              </li>
              <li>
                Pick a module, adjust the settings and press <em>Save changes</em>.
              </li>
            </ol>
          </Section>

          <Section id="access" title="Who can manage what">
            <p>Access is decided on the server, never in your browser. Three levels exist:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Public</strong>: the website, features, commands, docs, status and invite
                pages.
              </li>
              <li>
                <strong>Server owner / admin</strong>: anyone who owns a server or holds{" "}
                <em>Manage Server</em> or
                <em> Administrator</em> on it. They can configure only those servers, and only where
                the bot is present.
              </li>
              <li>
                <strong>Bot owner</strong>: platform operators listed in the deployment
                configuration. They alone can open the admin panel, change global settings or enable
                maintenance.
              </li>
            </ul>
            <p>
              Trying to open another server's settings, or the admin area without being a bot owner,
              is refused by the server.
            </p>
          </Section>

          <Section id="modules" title="Configuring modules">
            <p>
              Modules with a dashboard page: AntiNuke, AutoMod, Logging, Welcome, Tickets, Leveling,
              Reaction Roles, AutoRole, Invites, Tracking, Verification, Vanity Roles, Custom Roles,
              Join 2 Create, Join DM, AutoReact and Invite Role.
            </p>
            <p>
              Channel and role fields are dropdowns filled from your real server, so you never paste
              IDs. Changes apply to the bot immediately after saving. Some advanced options (for
              example Logging ignore lists and Leveling rank card images) are set through commands
              and shown read-only in the dashboard.
            </p>
            <p>
              Everything else, such as music, games, giveaways and moderation actions, is used
              through Discord commands. See the{" "}
              <Link className="text-primary hover:underline" to="/commands">
                command reference
              </Link>
              .
            </p>
          </Section>

          <Section id="maintenance" title="Maintenance mode">
            <p>
              When the platform is under maintenance, a banner appears on the site and dashboard,
              configuration changes are rejected by the server, and the bot only accepts commands
              from its owners. Normal operation resumes as soon as maintenance is turned off.
            </p>
          </Section>

          <Section id="activity" title="Activity & audit">
            <p>
              Each server's overview shows its recent configuration changes (who changed which
              setting). Bot owners also get a platform-wide audit log covering every sensitive owner
              action, including who, what, when and whether it succeeded. Secrets are never
              recorded.
            </p>
          </Section>

          <Section id="owners" title="For bot owners">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                The website, dashboard and admin panel are one application; the bot and its API run
                beside it.
              </li>
              <li>
                The browser never talks to the bot API. The dashboard server does, using a private
                API key.
              </li>
              <li>
                Bot owners are identified by Discord ID from <code>ADMIN_DISCORD_IDS</code> (or the
                bot's <code>OWNER_IDS</code>).
              </li>
              <li>
                The deployment guide ships with the project as <code>DEPLOY.md</code>.
              </li>
            </ul>
          </Section>

          <Section id="faq" title="FAQ">
            <Faq q="I don't see my server.">
              You need to own it or hold Manage Server / Administrator. Log out and back in after
              your permissions change.
            </Faq>
            <Faq q="It says the bot isn't installed.">
              Use the Invite button next to the server. Configuration unlocks once the bot has
              joined.
            </Faq>
            <Faq q="Why can't I save right now?">
              The platform may be in maintenance mode. Check the banner at the top of the page or
              the{" "}
              <Link className="text-primary hover:underline" to="/status">
                status page
              </Link>
              .
            </Faq>
          </Section>
        </article>
      </div>
    </SiteShell>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 space-y-3 text-[15px] leading-relaxed text-muted-foreground"
    >
      <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="panel p-4">
      <p className="font-medium text-foreground">{q}</p>
      <p className="mt-1 text-sm">{children}</p>
    </div>
  );
}
