import { getGuildChannels, getGuildDetails, getGuildRoles } from "@/lib/guild-modules.server";
import type { DiscordChannel, DiscordRole, GuildDetails } from "@/lib/zyrox-types";

export type GuildBasics = {
  live: boolean;
  details: GuildDetails | null;
  channels: DiscordChannel[];
  roles: DiscordRole[];
};

/** Every module page's loader calls this alongside its own module fetch. */
export async function loadGuildBasics(guildId: string): Promise<GuildBasics> {
  const [details, channels, roles] = await Promise.all([
    getGuildDetails({ data: { guildId } }),
    getGuildChannels({ data: { guildId } }),
    getGuildRoles({ data: { guildId } }),
  ]);
  return {
    live: details.live,
    details: details.data,
    channels: channels.data ?? [],
    roles: roles.data ?? [],
  };
}
