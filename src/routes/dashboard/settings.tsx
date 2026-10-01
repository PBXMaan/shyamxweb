import { createFileRoute } from "@tanstack/react-router";
import { Panel, SectionTitle } from "@/components/ui-kit";

export const Route = createFileRoute("/dashboard/settings")({
  component: Settings,
});

function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">settings</p>
        <h1 className="text-2xl font-bold">Connection</h1>
      </div>

      <Panel className="space-y-3 text-sm text-muted-foreground">
        <SectionTitle title="Connect this dashboard to your bot" />
        <p>Two values are needed so the dashboard reads real data instead of the sample numbers:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            The public address where your bot's API is reachable (the FastAPI backend that starts
            with the bot).
          </li>
          <li>
            The dashboard API key your bot uses — the same value set as{" "}
            <code>DASHBOARD_API_KEY</code> on the bot.
          </li>
        </ol>
        <p>
          Send both to me in chat and I'll store them securely; every page then switches from demo
          data to live data automatically.
        </p>
      </Panel>

      <Panel className="space-y-3 text-sm text-muted-foreground">
        <SectionTitle title="Discord login setup" />
        <p>
          In your Discord application's OAuth2 settings, add these redirect URLs so login works on
          both the preview and the published site:
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-xs text-foreground">
          {`https://id-preview--81e7f6b0-dabc-486b-828f-b21f436cd4d6.lovable.app/api/public/auth/discord/callback
https://project--81e7f6b0-dabc-486b-828f-b21f436cd4d6.lovable.app/api/public/auth/discord/callback`}
        </pre>
        <p>Add your custom domain the same way if you connect one later.</p>
      </Panel>
    </div>
  );
}
