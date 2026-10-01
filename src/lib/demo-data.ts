// Fallback data used until the bot API URL + key are configured.

export const demoStatus = {
  user: "ShyamX#0001",
  id: "0",
  latency: 42.7,
  guild_count: 128,
  user_count: 486_320,
  shards: 2,
  uptime: 372_940,
  commands: 214,
};

export const demoGuilds = [
  { id: "1001", name: "ShyamX Support", icon: null, member_count: 18420, owner: true },
  { id: "1002", name: "Neon Arcade", icon: null, member_count: 9312, owner: false },
  { id: "1003", name: "Crimson Gaming", icon: null, member_count: 4218, owner: false },
  { id: "1004", name: "Dev Lounge", icon: null, member_count: 1207, owner: false },
];

export const demoLeaderboard = Array.from({ length: 10 }, (_, i) => ({
  user_id: `${900000 + i}`,
  name: ["Kai", "Riven", "Nova", "Ash", "Vex", "Juno", "Rook", "Lyra", "Onyx", "Sable"][i]!,
  level: 60 - i * 4,
  xp: 182_000 - i * 14_300,
  messages: 24_000 - i * 1_900,
}));

export const demoLogs = Array.from({ length: 14 }, (_, i) => ({
  timestamp: new Date(Date.now() - i * 63_000).toISOString().slice(0, 19).replace("T", " "),
  method: ["GET", "GET", "PATCH", "POST"][i % 4]!,
  path: [
    "/api/v1/bot/status",
    "/api/v1/guilds/",
    "/api/v1/guilds/1001/automod",
    "/api/v1/guilds/1001/prefix",
  ][i % 4]!,
  status_code: i % 7 === 3 ? 429 : 200,
  duration_ms: Math.round(8 + Math.random() * 90),
  client_ip: "10.0.0." + (10 + (i % 5)),
}));

export const demoModules = {
  prefix: "!",
  automod: {
    antispam: true,
    anticaps: false,
    antilink: true,
    antiinvite: true,
    mass_mention: true,
    emoji_spam: false,
  },
  antinuke: { enabled: true, whitelist: 6, punishment: "ban" },
  leveling: { enabled: true, xp_rate: 15, cooldown: 60, channel: "#level-ups" },
  welcome: { enabled: true, channel: "#welcome" },
  logging: { enabled: true, channel: "#mod-logs" },
  tickets: { enabled: false, categories: 3 },
};
