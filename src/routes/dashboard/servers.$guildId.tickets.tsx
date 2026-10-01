import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getTickets, patchTickets } from "@/lib/guild-modules.server";
import { loadGuildBasics } from "@/lib/guild-basics.server";
import { ConfigPage, FieldRow } from "@/components/dashboard/ConfigPage";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChannelSelect, MultiPicker, rolesToItems } from "@/components/selectors/DiscordSelectors";
import { Panel, Pill } from "@/components/ui-kit";
import type { TicketCategory } from "@/lib/zyrox-types";

function hexToInt(hex: string): number {
  return parseInt(hex.replace("#", ""), 16) || 0;
}
function intToHex(n: number | null): string {
  return n != null ? `#${n.toString(16).padStart(6, "0")}` : "#5865f2";
}

export const Route = createFileRoute("/dashboard/servers/$guildId/tickets")({
  loader: async ({ params }) => {
    const [tickets, basics] = await Promise.all([
      getTickets({ data: { guildId: params.guildId } }),
      loadGuildBasics(params.guildId),
    ]);
    return { ...tickets, basics, guildId: params.guildId };
  },
  component: TicketsPage,
});

function emptyCategory(): TicketCategory {
  return {
    name: "New category",
    emoji: "🎫",
    staff_roles: [],
    button_style: 2,
    discord_category_id: null,
  };
}

function TicketsPage() {
  const result = Route.useLoaderData();
  const patch = useServerFn(patchTickets);
  const initial = result.data ?? {
    guild_id: 0,
    panel_channel: null,
    panel_message: null,
    logging_channel: null,
    closed_category: null,
    panel_type: "button",
    embed: {
      title: "Support Department",
      description: "Open a ticket below to talk to our staff.",
      color: null,
      image_url: null,
      thumbnail_url: null,
    },
    categories: [],
    staff_roles: [],
    open_ticket_count: 0,
  };

  const [panelChannel, setPanelChannel] = useState<string | null>(
    initial.panel_channel != null ? String(initial.panel_channel) : null,
  );
  const [loggingChannel, setLoggingChannel] = useState<string | null>(
    initial.logging_channel != null ? String(initial.logging_channel) : null,
  );
  const [closedCategory, setClosedCategory] = useState<string | null>(
    initial.closed_category != null ? String(initial.closed_category) : null,
  );
  const [panelType, setPanelType] = useState(initial.panel_type ?? "button");
  const [embedTitle, setEmbedTitle] = useState(initial.embed.title ?? "");
  const [embedDesc, setEmbedDesc] = useState(initial.embed.description ?? "");
  const [embedColor, setEmbedColor] = useState(intToHex(initial.embed.color));
  const [embedImage, setEmbedImage] = useState(initial.embed.image_url ?? "");
  const [staffRoles, setStaffRoles] = useState(initial.staff_roles.map(String));
  const [categories, setCategories] = useState<TicketCategory[]>(initial.categories);

  const snapshot = () =>
    JSON.stringify({
      panelChannel,
      loggingChannel,
      closedCategory,
      panelType,
      embedTitle,
      embedDesc,
      embedColor,
      embedImage,
      staffRoles,
      categories,
    });
  const initialSnapshot = JSON.stringify({
    panelChannel: initial.panel_channel != null ? String(initial.panel_channel) : null,
    loggingChannel: initial.logging_channel != null ? String(initial.logging_channel) : null,
    closedCategory: initial.closed_category != null ? String(initial.closed_category) : null,
    panelType: initial.panel_type ?? "button",
    embedTitle: initial.embed.title ?? "",
    embedDesc: initial.embed.description ?? "",
    embedColor: intToHex(initial.embed.color),
    embedImage: initial.embed.image_url ?? "",
    staffRoles: initial.staff_roles.map(String),
    categories: initial.categories,
  });
  const dirty = snapshot() !== initialSnapshot;

  function reset() {
    setPanelChannel(initial.panel_channel != null ? String(initial.panel_channel) : null);
    setLoggingChannel(initial.logging_channel != null ? String(initial.logging_channel) : null);
    setClosedCategory(initial.closed_category != null ? String(initial.closed_category) : null);
    setPanelType(initial.panel_type ?? "button");
    setEmbedTitle(initial.embed.title ?? "");
    setEmbedDesc(initial.embed.description ?? "");
    setEmbedColor(intToHex(initial.embed.color));
    setEmbedImage(initial.embed.image_url ?? "");
    setStaffRoles(initial.staff_roles.map(String));
    setCategories(initial.categories);
  }

  async function save() {
    await patch({
      data: {
        guildId: result.guildId,
        body: {
          panel_channel: panelChannel ? Number(panelChannel) : undefined,
          logging_channel: loggingChannel ? Number(loggingChannel) : undefined,
          closed_category: closedCategory ? Number(closedCategory) : undefined,
          panel_type: panelType,
          embed_title: embedTitle,
          embed_description: embedDesc,
          embed_color: hexToInt(embedColor),
          embed_image_url: embedImage || undefined,
          staff_roles: staffRoles.map(Number),
          categories,
        },
      },
    });
  }

  function updateCategory(i: number, patchObj: Partial<TicketCategory>) {
    setCategories((cats) => cats.map((c, idx) => (idx === i ? { ...c, ...patchObj } : c)));
  }

  return (
    <ConfigPage
      eyebrow="engagement"
      title="Tickets"
      description={`Support ticket panel and categories. ${initial.open_ticket_count} ticket(s) currently open.`}
      live={result.live}
      loadError={result.errorMessage}
      dirty={dirty}
      onReset={reset}
      onSave={save}
    >
      <Panel>
        <FieldRow label="Panel channel" hint="Where the ticket panel is posted">
          <ChannelSelect
            channels={result.basics.channels}
            value={panelChannel}
            onChange={setPanelChannel}
          />
        </FieldRow>
        <FieldRow label="Panel type">
          <Select value={panelType ?? "button"} onValueChange={setPanelType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="button">Buttons</SelectItem>
              <SelectItem value="dropdown">Dropdown</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Logging channel">
          <ChannelSelect
            channels={result.basics.channels}
            value={loggingChannel}
            onChange={setLoggingChannel}
          />
        </FieldRow>
        <FieldRow
          label="Closed-ticket category"
          hint="Discord category tickets are moved to when closed"
        >
          <ChannelSelect
            channels={result.basics.channels}
            value={closedCategory}
            onChange={setClosedCategory}
            filter="category"
          />
        </FieldRow>
        <FieldRow label="Default staff roles">
          <MultiPicker
            items={rolesToItems(result.basics.roles)}
            value={staffRoles}
            onChange={setStaffRoles}
            label="roles"
          />
        </FieldRow>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h3 className="mb-3 text-sm font-semibold">Panel embed</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Title</label>
              <Input value={embedTitle} onChange={(e) => setEmbedTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Description</label>
              <Textarea value={embedDesc} onChange={(e) => setEmbedDesc(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Color</label>
              <Input
                type="color"
                value={embedColor}
                onChange={(e) => setEmbedColor(e.target.value)}
                className="h-9 w-20 p-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Image URL</label>
              <Input value={embedImage} onChange={(e) => setEmbedImage(e.target.value)} />
            </div>
          </div>
        </Panel>
        <Panel>
          <h3 className="mb-3 text-sm font-semibold">Preview</h3>
          <div
            className="rounded-md border-l-4 bg-surface-2 p-3"
            style={{ borderColor: embedColor }}
          >
            {embedTitle ? <p className="font-semibold">{embedTitle}</p> : null}
            {embedDesc ? <p className="mt-1 text-sm text-muted-foreground">{embedDesc}</p> : null}
            {embedImage ? <img src={embedImage} alt="" className="mt-2 max-h-40 rounded" /> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((c, i) => (
                <span
                  key={i}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs"
                >
                  {c.emoji} {c.name}
                </span>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Categories</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setCategories((c) => [...c, emptyCategory()])}
          >
            + Add category
          </Button>
        </div>
        <div className="space-y-4">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            categories.map((cat, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Name</label>
                    <Input
                      value={cat.name}
                      onChange={(e) => updateCategory(i, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Emoji</label>
                    <Input
                      value={cat.emoji ?? ""}
                      onChange={(e) => updateCategory(i, { emoji: e.target.value })}
                      className="max-w-24"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Discord category (where tickets are created)
                    </label>
                    <ChannelSelect
                      channels={result.basics.channels}
                      filter="category"
                      value={
                        cat.discord_category_id != null ? String(cat.discord_category_id) : null
                      }
                      onChange={(id) =>
                        updateCategory(i, { discord_category_id: id ? Number(id) : null })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Button style</label>
                    <Select
                      value={String(cat.button_style ?? 2)}
                      onValueChange={(v) => updateCategory(i, { button_style: Number(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Blue</SelectItem>
                        <SelectItem value="2">Grey</SelectItem>
                        <SelectItem value="3">Green</SelectItem>
                        <SelectItem value="4">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-xs text-muted-foreground">
                    Staff roles pinged for this category
                  </label>
                  <MultiPicker
                    items={rolesToItems(result.basics.roles)}
                    value={cat.staff_roles.map(String)}
                    onChange={(ids) => updateCategory(i, { staff_roles: ids.map(Number) })}
                    label="roles"
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setCategories((cats) => cats.filter((_, idx) => idx !== i))}
                  >
                    Delete category
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </ConfigPage>
  );
}
