import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPinned, Sparkles, Save, Trash2, Copy, Loader2, Image as ImageIcon } from "lucide-react";

export default function AdminDestinationSpotlight() {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ destination: "", country: "", season: "", angle: "" });
  const [draft, setDraft] = useState<any | null>(null);

  const listQ = trpc.destinationSpotlight.list.useQuery();
  const generate = trpc.destinationSpotlight.generate.useMutation({
    onSuccess: (r) => { setDraft(r); toast.success('Spotlight generated'); },
    onError: (e) => toast.error(e.message),
  });
  const save = trpc.destinationSpotlight.save.useMutation({
    onSuccess: () => { toast.success('Saved'); utils.destinationSpotlight.list.invalidate(); setDraft(null); setForm({ destination: "", country: "", season: "", angle: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.destinationSpotlight.delete.useMutation({
    onSuccess: () => { toast.success('Deleted'); utils.destinationSpotlight.list.invalidate(); },
  });

  const items = listQ.data || [];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-serif text-2xl font-semibold flex items-center gap-2">
          <MapPinned size={22} className="text-amber-600" /> Destination Spotlight
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Editorial-quality copy + image prompts + ready-to-post social caption — for any destination, in seconds.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brief */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h3 className="font-semibold">New spotlight</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Destination *</label>
              <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="e.g. Santorini" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Country</label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Greece" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Season</label>
              <Input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} placeholder="late summer" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Angle (optional)</label>
              <Input value={form.angle} onChange={(e) => setForm({ ...form, angle: e.target.value })} placeholder="for honeymooners" className="mt-1" />
            </div>
          </div>
          <Button
            onClick={() => generate.mutate(form)}
            disabled={!form.destination.trim() || generate.isPending}
            className="w-full bg-navy-gradient text-white"
          >
            {generate.isPending ? <><Loader2 size={14} className="mr-2 animate-spin" />Crafting…</> : <><Sparkles size={14} className="mr-2" />Generate spotlight</>}
          </Button>
        </div>

        {/* Draft */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-semibold">Draft</h3>
          {!draft ? (
            <p className="text-sm text-muted-foreground">The generated spotlight will appear here. Tweak before saving.</p>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Headline</label>
                <Input value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Short copy (banner / tile)</label>
                <Textarea value={draft.copyShort} onChange={(e) => setDraft({ ...draft, copyShort: e.target.value })} rows={2} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Long copy (feature card, HTML)</label>
                <Textarea value={draft.copyLong} onChange={(e) => setDraft({ ...draft, copyLong: e.target.value })} rows={6} className="mt-1 text-xs font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Social caption</label>
                <Textarea value={draft.socialCaption} onChange={(e) => setDraft({ ...draft, socialCaption: e.target.value })} rows={3} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5"><ImageIcon size={11} /> Image prompts</label>
                <div className="space-y-1.5 mt-1">
                  {(draft.imagePrompts || []).map((p: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <Input value={p} onChange={(e) => {
                        const arr = [...draft.imagePrompts]; arr[idx] = e.target.value;
                        setDraft({ ...draft, imagePrompts: arr });
                      }} className="text-xs" />
                      <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(p).then(() => toast.success('Copied'))}><Copy size={12} /></Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setDraft(null)}>Discard</Button>
                <Button className="bg-navy-gradient text-white" disabled={save.isPending}
                  onClick={() => save.mutate({
                    destination: form.destination, country: form.country, season: form.season,
                    headline: draft.headline, copyShort: draft.copyShort, copyLong: draft.copyLong,
                    socialCaption: draft.socialCaption, imagePrompts: draft.imagePrompts,
                    status: "ready",
                  })}>
                  <Save size={14} className="mr-1.5" />Save spotlight
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Library */}
      {items.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Saved spotlights ({items.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((s: any) => (
              <div key={s.id} className="bg-white rounded-2xl border border-border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{s.destination}{s.country && <span className="text-muted-foreground text-sm">, {s.country}</span>}</p>
                    {s.season && <Badge variant="secondary" className="text-[10px] mt-1">{s.season}</Badge>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete spotlight for ${s.destination}?`)) del.mutate({ id: s.id }); }}>
                    <Trash2 size={12} className="text-red-600" />
                  </Button>
                </div>
                {s.headline && <p className="text-sm font-medium text-amber-700">{s.headline}</p>}
                {s.copyShort && <p className="text-sm text-muted-foreground line-clamp-3">{s.copyShort}</p>}
                <div className="flex gap-1.5 pt-2 border-t">
                  <Button size="sm" variant="outline"
                    onClick={() => navigator.clipboard.writeText(s.socialCaption || '').then(() => toast.success('Caption copied'))}>
                    <Copy size={11} className="mr-1" />Caption
                  </Button>
                  <Button size="sm" variant="outline"
                    onClick={() => navigator.clipboard.writeText(s.copyLong || '').then(() => toast.success('Long copy copied'))}>
                    <Copy size={11} className="mr-1" />Long copy
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
