import { createFileRoute } from "@tanstack/react-router";
import { adminGetEnvStatus } from "@/lib/admin-platform.server";
import { Panel, Pill } from "@/components/ui-kit";
import { AdminHeader } from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/settings")({
  loader: () => adminGetEnvStatus(),
  component: SettingsPage,
});

function SettingsPage() {
  const e = Route.useLoaderData();
  const checks: Array<{ label: string; ok: boolean; hint: string }> = [
    {
      label: "Session secret is 32+ characters",
      ok: e.sessionSecretLength >= 32,
      hint: "Generate with: openssl rand -hex 32",
    },
    {
      label: "API key is 24+ characters",
      ok: e.apiKeyLength >= 24,
      hint: "Generate with: openssl rand -hex 24",
    },
    {
      label: "Bot API traffic is private or encrypted",
      ok: e.baseUrlIsHttps || e.baseUrlIsInternal,
      hint: "Use http://127.0.0.1:8000 on a single host, or an https:// URL.",
    },
  ];
  return (
    <div>
      <AdminHeader
        title="Settings & security"
        blurb="Which configuration values are present. Only set / not set is shown: values, tokens and keys are never sent to the browser."
      />
      <Panel className="mb-4">
        <h3 className="mb-3 text-sm font-semibold">Environment</h3>
        <ul className="divide-y divide-border/60">
          {e.vars.map((v) => (
            <li key={v.key} className="flex items-center justify-between py-2 text-sm">
              <span className="font-mono text-xs">{v.key}</span>
              <Pill tone={v.set ? "on" : "warn"}>{v.set ? "set" : "missing"}</Pill>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel>
        <h3 className="mb-3 text-sm font-semibold">Security checks</h3>
        <ul className="space-y-3">
          {checks.map((c) => (
            <li key={c.label} className="flex items-start gap-3 text-sm">
              <span>{c.ok ? "🟢" : "🟡"}</span>
              <span>
                {c.label}
                {!c.ok ? (
                  <span className="block text-xs text-muted-foreground">{c.hint}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel className="mt-4 text-xs text-muted-foreground">
        Settings are changed in the server's <code>.env</code> and applied by restarting. That keeps
        secrets out of the browser and out of the database.
      </Panel>
    </div>
  );
}
