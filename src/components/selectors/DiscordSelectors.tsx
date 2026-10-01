import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { DiscordChannel, DiscordRole } from "@/lib/zyrox-types";

// discord.ChannelType values we care about for filtering.
const TEXT_LIKE = new Set(["0", "5", "15"]); // text, announcement, forum
const VOICE_LIKE = new Set(["2", "13"]); // voice, stage
const CATEGORY = "4";

export function channelIcon(type: string): string {
  if (type === CATEGORY) return "📁";
  if (VOICE_LIKE.has(type)) return "🔊";
  if (TEXT_LIKE.has(type)) return "#";
  return "•";
}

type ChannelFilter = "text" | "voice" | "category" | "all";

function filterChannels(channels: DiscordChannel[], filter: ChannelFilter): DiscordChannel[] {
  if (filter === "all") return channels;
  if (filter === "text") return channels.filter((c) => TEXT_LIKE.has(c.type));
  if (filter === "voice") return channels.filter((c) => VOICE_LIKE.has(c.type));
  return channels.filter((c) => c.type === CATEGORY);
}

/** Single-channel picker. Empty string value means "none selected". */
export function ChannelSelect({
  channels,
  value,
  onChange,
  filter = "text",
  placeholder = "Select a channel",
  allowNone = true,
  disabled,
}: {
  channels: DiscordChannel[];
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  filter?: ChannelFilter;
  placeholder?: string;
  allowNone?: boolean;
  disabled?: boolean;
}) {
  const options = useMemo(() => filterChannels(channels, filter), [channels, filter]);
  return (
    <Select
      value={value ?? "__none__"}
      onValueChange={(v) => onChange(v === "__none__" ? null : v)}
      disabled={disabled ?? false}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone ? <SelectItem value="__none__">None</SelectItem> : null}
        {options.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">No matching channels found.</div>
        ) : (
          options.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {channelIcon(c.type)} {c.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

/** Single-role picker. Empty string value means "none selected". */
export function RoleSelect({
  roles,
  value,
  onChange,
  placeholder = "Select a role",
  allowNone = true,
  disabled,
}: {
  roles: DiscordRole[];
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  placeholder?: string;
  allowNone?: boolean;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value ?? "__none__"}
      onValueChange={(v) => onChange(v === "__none__" ? null : v)}
      disabled={disabled ?? false}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone ? <SelectItem value="__none__">None</SelectItem> : null}
        {roles.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">No roles found.</div>
        ) : (
          roles.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              <span
                className="mr-1.5 inline-block size-2 rounded-full align-middle"
                style={{
                  backgroundColor: r.color ? `#${r.color.toString(16).padStart(6, "0")}` : "#99a",
                }}
              />
              {r.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

/** Searchable multi-select for roles or channels, rendered as chips. */
export function MultiPicker({
  items,
  value,
  onChange,
  label,
  emptyLabel = "None selected",
}: {
  items: Array<{ id: string; label: string }>;
  value: string[];
  onChange: (ids: string[]) => void;
  label: string;
  emptyLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );
  const selectedSet = new Set(value);

  function toggle(id: string) {
    onChange(selectedSet.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.length === 0 ? (
          <span className="text-xs text-muted-foreground">{emptyLabel}</span>
        ) : (
          value.map((id) => {
            const item = items.find((i) => i.id === id);
            return (
              <Badge
                key={id}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggle(id)}
              >
                {item?.label ?? id} ×
              </Badge>
            );
          })
        )}
      </div>
      <Input
        placeholder={`Search ${label.toLowerCase()}…`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-8 text-xs"
      />
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-1.5">
        {filtered.length === 0 ? (
          <p className="px-2 py-1 text-xs text-muted-foreground">No matches.</p>
        ) : (
          filtered.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-surface-2"
            >
              <Checkbox
                checked={selectedSet.has(item.id)}
                onCheckedChange={() => toggle(item.id)}
              />
              {item.label}
            </label>
          ))
        )}
      </div>
    </div>
  );
}

export function channelsToItems(channels: DiscordChannel[]) {
  return channels.map((c) => ({ id: c.id, label: `${channelIcon(c.type)} ${c.name}` }));
}

export function rolesToItems(roles: DiscordRole[]) {
  return roles.map((r) => ({ id: r.id, label: r.name }));
}
