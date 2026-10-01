import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getVerification, patchVerification } from "@/lib/guild-modules.server";
import { loadGuildBasics } from "@/lib/guild-basics.server";
import { ConfigPage, FieldRow } from "@/components/dashboard/ConfigPage";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChannelSelect, RoleSelect } from "@/components/selectors/DiscordSelectors";
import { Panel } from "@/components/ui-kit";

export const Route = createFileRoute("/dashboard/servers/$guildId/verification")({
  loader: async ({ params }) => {
    const [verification, basics] = await Promise.all([
      getVerification({ data: { guildId: params.guildId } }),
      loadGuildBasics(params.guildId),
    ]);
    return { ...verification, basics, guildId: params.guildId };
  },
  component: VerificationPage,
});

function VerificationPage() {
  const result = Route.useLoaderData();
  const patch = useServerFn(patchVerification);
  const initial = result.data ?? {
    guild_id: 0,
    verification_channel_id: null,
    verified_role_id: null,
    log_channel_id: null,
    verification_method: "both",
    enabled: true,
  };

  const [enabled, setEnabled] = useState(initial.enabled ?? true);
  const [channel, setChannel] = useState(initial.verification_channel_id);
  const [role, setRole] = useState(initial.verified_role_id);
  const [logChannel, setLogChannel] = useState(initial.log_channel_id);
  const [method, setMethod] = useState(initial.verification_method ?? "both");

  const dirty =
    enabled !== (initial.enabled ?? true) ||
    channel !== initial.verification_channel_id ||
    role !== initial.verified_role_id ||
    logChannel !== initial.log_channel_id ||
    method !== (initial.verification_method ?? "both");

  function reset() {
    setEnabled(initial.enabled ?? true);
    setChannel(initial.verification_channel_id);
    setRole(initial.verified_role_id);
    setLogChannel(initial.log_channel_id);
    setMethod(initial.verification_method ?? "both");
  }

  async function save() {
    await patch({
      data: {
        guildId: result.guildId,
        body: {
          enabled,
          verification_channel_id: channel ?? undefined,
          verified_role_id: role ?? undefined,
          log_channel_id: logChannel ?? undefined,
          verification_method: method,
        },
      },
    });
  }

  return (
    <ConfigPage
      eyebrow="advanced"
      title="Verification"
      description="Require new members to verify (button, captcha, or both) before they can access the server."
      live={result.live}
      loadError={result.errorMessage}
      dirty={dirty}
      onReset={reset}
      onSave={save}
    >
      <Panel>
        <FieldRow label="Verification" hint="Master enable/disable">
          <Switch checked={enabled ?? true} onCheckedChange={setEnabled} />
        </FieldRow>
        <FieldRow label="Verification channel">
          <ChannelSelect channels={result.basics.channels} value={channel} onChange={setChannel} />
        </FieldRow>
        <FieldRow label="Verified role" hint="Granted once a member passes verification">
          <RoleSelect roles={result.basics.roles} value={role} onChange={setRole} />
        </FieldRow>
        <FieldRow label="Log channel">
          <ChannelSelect
            channels={result.basics.channels}
            value={logChannel}
            onChange={setLogChannel}
          />
        </FieldRow>
        <FieldRow label="Method">
          <Select value={method ?? "both"} onValueChange={setMethod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="button">Button only</SelectItem>
              <SelectItem value="captcha">Captcha only</SelectItem>
              <SelectItem value="both">Button + captcha</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      </Panel>
    </ConfigPage>
  );
}
