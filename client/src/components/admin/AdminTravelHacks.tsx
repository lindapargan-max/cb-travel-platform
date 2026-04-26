import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Lightbulb, Sparkles, Save, Trash2, Edit2, Loader2, Eye, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminTravelHacks() {
  const utils = trpc.useUtils();
  const [topic, setTopic] = useState("");
  const [destination, setDestination] = useState("");
  const [audience, setAudience] = useState("");
  const [draft, setDraft] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [previewing, setPreviewing] = useState<any | null>(null);

  const listQ = trpc.travelHacks.list.useQuery();
  const generate = trpc.travelHacks.generate.useMutation({
    onSuccess: (r) => { setDraft(r); toast.success('Generated'); },
    onError: (e) => toast.error(e.message),
  });
  const save = trpc.travelHacks.save.useMutation({
    onSuccess: () => { toast.success('Saved'); utils.travelHacks.list.invalidate(); setDraft(null); setEditing(null); setTopic(""); },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.travelHacks.delete.useMutation({
    onSuccess: () => { toast.success('Deleted'); utils.travelHacks.list.invalidate(); },
  });
  const togglePub = trpc.travelHacks.togglePublish.useMutation({
    onSuccess: () => { utils.travelHacks.list.invalidate(); },
  });

  const items = listQ.data || [];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-serif text-2xl font-semibold flex items-center gap-2">
          <Lightbulb size={22} className="text-amber-600" /> Travel Hack Generator
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Build a library of premium traveller tips for newsletters, blog posts and social.
        </p>
      </header>

      {/* Generator */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h3 className="font-semibold">Generate a new hack</h3>
        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground">Topic *</label>
          <Input value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. How to upgrade to business class without paying full fare" className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Destination context (optional)</label>
            <Input value={destination} onChange={(e) => setDestination(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Audience (optional)</label>
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="luxury, family, business…" className="mt-1" />
          </div>
        </div>
        <Button
          onClick={() => generate.mutate({ topic, destination: destination || undefined, audience: audience || undefined })}
          disabled={!topic.trim() || generate.isPending}
          className="w-full bg-navy-gradient text-white"
        >
          {generate.isPending ? <><Loader2 size={14} className="mr-2 animate-spin" />Writing…</> : <><Sparkles size={14} className="mr-2" />Generate hack</>}
        </Button>

        {draft && (
          <div className="border-t pt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Title</label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Summary</label>
              <Textarea value={draft.summary || ''} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} rows={2} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Body (HTML)</label>
              <Textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={10} className="mt-1 text-xs font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Category</label>
                <Input value={draft.category || ''} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Tags (comma-sep)</label>
                <Input value={(draft.tags || []).join(', ')} onChange={(e) => setDraft({ ...draft, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })} className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setDraft(null)}>Discard</Button>
              <Button className="bg-navy-gradient text-white" disabled={save.isPending}
                onClick={() => save.mutate({
                  title: draft.title, summary: draft.summary, body: draft.body,
                  category: draft.category, tags: draft.tags, isPublished: false,
                })}>
                <Save size={14} className="mr-1.5" />Save as draft
              </Button>
              <Button className="bg-amber-500 text-white hover:bg-amber-600" disabled={save.isPending}
                onClick={() => save.mutate({
                  title: draft.title, summary: draft.summary, body: draft.body,
                  category: draft.category, tags: draft.tags, isPublished: true,
                })}>
                Save & publish
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Library */}
      <div>
        <h3 className="font-semibold mb-3">Hack library ({items.length})</h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hacks yet. Generate your first one above.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((h: any) => (
              <div key={h.id} className="bg-white rounded-2xl border border-border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{h.title}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {h.category && <Badge variant="secondary" className="text-[10px]">{h.category}</Badge>}
                      {h.isPublished
                        ? <Badge className="bg-emerald-500 text-white text-[10px]">Published</Badge>
                        : <Badge variant="outline" className="text-[10px]">Draft</Badge>}
                    </div>
                  </div>
                </div>
                {h.summary && <p className="text-sm text-muted-foreground line-clamp-2">{h.summary}</p>}
                <div className="flex gap-1.5 pt-2 border-t flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => setPreviewing(h)}><Eye size={11} className="mr-1" />Preview</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing({ ...h, tags: h.tags || [] })}><Edit2 size={11} className="mr-1" />Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => togglePub.mutate({ id: h.id, isPublished: !h.isPublished })}>
                    {h.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete "${h.title}"?`)) del.mutate({ id: h.id }); }}>
                    <Trash2 size={11} className="text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview dialog */}
      {previewing && (
        <Dialog open onOpenChange={() => setPreviewing(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{previewing.title}</DialogTitle></DialogHeader>
            {previewing.summary && <p className="text-muted-foreground italic">{previewing.summary}</p>}
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: previewing.body }} />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit dialog */}
      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit hack</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              <Textarea value={editing.summary || ''} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} rows={2} placeholder="Summary" />
              <Textarea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} rows={12} className="text-xs font-mono" />
              <div className="grid grid-cols-2 gap-3">
                <Input value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="Category" />
                <Input value={(editing.tags || []).join(', ')} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })} placeholder="Tags" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button className="bg-navy-gradient text-white" onClick={() => save.mutate({
                  id: editing.id, title: editing.title, summary: editing.summary, body: editing.body,
                  category: editing.category, tags: editing.tags, isPublished: editing.isPublished,
                })}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
