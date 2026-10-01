/**
 * TypeScript mirrors of api/schemas.py in the bot repo. Keep these in sync with
 * that file — field names here are copied verbatim from the Pydantic models,
 * not invented. IDs are typed as string on the frontend regardless of whether
 * the bot stores them as int or str; conversion happens at the call site for
 * the handful of endpoints whose Update schema expects an int.
 */

export interface DiscordChannel {
  id: string;
  name: string;
  type: string; // discord.ChannelType value as a string, e.g. "0" = text, "2" = voice, "4" = category
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

export interface GuildDetails {
  id: string;
  name: string;
  icon: string | null;
  owner_id: string;
  member_count: number;
  role_count: number;
  channel_count: number;
}

export interface PrefixConfig {
  guild_id: number;
  prefix: string;
}

export interface AutomodConfig {
  guild_id: number;
  enabled: boolean;
  punishments: Record<string, string>;
  ignored_roles: number[];
  ignored_channels: number[];
  logging_channel: number | null;
}

export interface TicketCategory {
  name: string;
  emoji: string | null;
  staff_roles: number[];
  button_style: number | null;
  discord_category_id: number | null;
}

export interface TicketEmbed {
  title: string | null;
  description: string | null;
  color: number | null;
  image_url: string | null;
  thumbnail_url: string | null;
}

export interface TicketConfig {
  guild_id: number;
  panel_channel: number | null;
  panel_message: number | null;
  logging_channel: number | null;
  closed_category: number | null;
  panel_type: string | null;
  embed: TicketEmbed;
  categories: TicketCategory[];
  staff_roles: number[];
  open_ticket_count: number;
}

export interface LevelingEmbedStyle {
  color: string; // hex, e.g. "#5865f2"
  thumbnail: boolean;
  image: string | null;
}

export interface LevelingConfig {
  guild_id: number;
  enabled: boolean;
  xp_per_message: number;
  cooldown: number;
  level_up_channel: number | null;
  embed_style: LevelingEmbedStyle;
}

export interface LoggingConfig {
  guild_id: number;
  log_enabled: Record<string, boolean>;
  log_channels: Record<string, number>;
  ignore_channels: number[];
  ignore_roles: number[];
  ignore_users: number[];
  auto_delete_duration: number | null;
}

export interface WelcomeEmbedData {
  message?: string | null;
  title?: string | null;
  description?: string | null;
  color?: string | null;
  footer_text?: string | null;
  footer_icon?: string | null;
  author_name?: string | null;
  author_icon?: string | null;
  thumbnail?: string | null;
  image?: string | null;
}

export interface WelcomeConfig {
  guild_id: number;
  welcome_type: string | null;
  welcome_message: string | null;
  channel_id: string | null;
  embed_data: WelcomeEmbedData | null;
  auto_delete_duration: number | null;
}

export interface AntiNukeConfig {
  guild_id: number;
  status: boolean;
  whitelisted_users: string[];
}

export interface VerificationConfig {
  guild_id: number;
  verification_channel_id: string | null;
  verified_role_id: string | null;
  log_channel_id: string | null;
  verification_method: string | null;
  enabled: boolean | null;
}

export interface TrackingConfig {
  guild_id: number;
  channel_id: number | null;
}

export interface J2CConfig {
  guild_id: string;
  join_channel_id: string | null;
  control_channel_id: string | null;
  category_id: string | null;
}

export interface JoinDMConfig {
  guild_id: string;
  message: string | null;
}

export interface CustomRoleConfig {
  guild_id: string;
  staff: string | null;
  girl: string | null;
  vip: string | null;
  guest: string | null;
  frnd: string | null;
  reqrole: string | null;
}

export interface AutoReactTrigger {
  trigger: string;
  emojis: string;
}

export interface AutoReactConfig {
  guild_id: string;
  triggers: AutoReactTrigger[];
}

export interface InvcConfig {
  guild_id: string;
  role_id: string | null;
  enabled: boolean;
}

export interface ReactionRoleEntry {
  message_id: string;
  emoji: string;
  role_id: string;
}

export interface RRConfig {
  guild_id: string;
  dm_enabled: boolean;
  roles: ReactionRoleEntry[];
}

export interface InviteStat {
  user_id: string;
  total: number;
  fake: number;
  left: number;
  rejoin: number;
}

export interface InvitesLeaderboard {
  guild_id: string;
  data: InviteStat[];
}

export interface VanityRoleSetup {
  vanity: string;
  role_id: string;
  log_channel_id: string;
}

export interface AutoRoleConfig {
  guild_id: string;
  bots: string[];
  humans: string[];
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  level: number;
  xp: number;
}

export interface AdminNodeStatus {
  name: string;
  status: string;
  load: string;
  icon: string;
}

export interface AdminStats {
  total_users: string;
  active_servers: string;
  api_latency: string;
  db_size: string;
  nodes: AdminNodeStatus[];
}

export interface AdminConfig {
  maintenance_mode: boolean;
  global_notification: string | null;
}

export interface BotStatus {
  user: string;
  id: string | null;
  latency: number;
  guild_count: number;
  user_count: number;
  shards: number | null;
  uptime: number | null;
}

export interface BotInfo {
  name: string;
  id: string | null;
  guilds: number;
  users: number;
  commands: number;
  latency: string;
}

export interface CommandInfo {
  name: string;
  aliases: string[];
  description: string | null;
  category: string;
  usage: string | null;
  is_slash: boolean;
  is_prefix: boolean;
}

// ---------- Platform (bot-owner) types — mirror api/routes/platform.py ----------
export interface SystemInfo {
  python_version: string;
  discord_py_version: string;
  platform: string;
  pid: number;
  process_uptime_seconds: number;
  memory_mb: number;
  cpu_percent: number;
  threads: number;
  shard_count: number | null;
  guild_count: number;
  ready: boolean;
  latency_ms: number;
}

export interface ModuleInfo {
  name: string;
  loaded: boolean;
  commands: number;
  listeners: number;
}

export interface ModulesResponse {
  cogs: ModuleInfo[];
  extensions: { name: string; loaded: boolean }[];
}

export interface DbFile {
  name: string;
  size_bytes: number;
  healthy: boolean;
  error: string | null;
  modified: number;
}

export interface DatabaseResponse {
  directory: string;
  total_bytes: number;
  files: DbFile[];
}

export interface ApiStats {
  window_size: number;
  total_requests: number;
  error_requests: number;
  server_errors: number;
  avg_latency_ms: number;
  max_latency_ms: number;
  recent_errors: Array<{
    timestamp: string;
    method: string;
    path: string;
    status_code: number;
    duration_ms: number;
  }>;
  slowest_endpoints: Array<{ path: string; avg_ms: number; count: number }>;
  api_key_configured: boolean;
}

export interface AuditEntry {
  id: number;
  ts: number;
  actor_id: string;
  actor_name: string;
  action: string;
  target: string;
  result: string;
}

export interface Announcement {
  id: number;
  title: string;
  message: string;
  type: "info" | "update" | "maintenance" | "outage" | "feature";
  active: boolean;
  starts_at: number | null;
  expires_at: number | null;
  created_by: string;
  created_at: number;
}

export interface MaintenanceState {
  enabled: boolean;
  message: string;
  enabled_by: string | null;
  enabled_at: number | null;
}

export interface GuildEvent {
  ts: number;
  kind: "join" | "leave";
  guild_id: string;
  guild_name: string;
  member_count: number;
}

export interface PublicState {
  maintenance: MaintenanceState;
  announcements: Announcement[];
  bot_online: boolean;
  guild_count: number;
  user_count: number;
  command_count: number;
}

export type AdminResult<T> = { live: boolean; data: T | null; errorMessage?: string };

/** Standard shape every module server-fn returns so pages render one way. */
// NOTE: field is `errorMessage`, not `error` — TanStack Start's createServerFn runtime
// treats any returned object with a truthy `.error` property as an internal error
// envelope and re-throws it (see result.error handling in its own runtime), even when
// the handler caught the failure and returned normally. Never name a result field `error`.
export type ModuleResult<T> = { live: boolean; data: T | null; errorMessage?: string };
