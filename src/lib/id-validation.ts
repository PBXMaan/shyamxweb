export function isValidGuildId(guildId: unknown): guildId is string {
  return typeof guildId === "string" && /^\d{5,25}$/.test(guildId);
}
