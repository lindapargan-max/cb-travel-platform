import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Sparkles, Calendar, Plus, Edit2, Trash2, Instagram, Facebook, Twitter, Linkedin,
  Music2, Send, Copy, ChevronLeft, ChevronRight, FileText, Loader2,
} from "lucide-react";

type Platform = "instagram" | "facebook" | "twitter" | "tiktok" | "linkedin";

const PLATFORM_META: Record<Platform, { icon: any; color: string; label: string }> = {
  instagram: { icon: Instagram, color: "text-pink-600 bg-pink-50 border-pink-200", label: "Instagram" },
  facebook:  { icon: Facebook,  color: "text-blue-600 bg-blue-50 border-blue-200", label: "Facebook" },
  twitter:   { icon: Twitter,   color: "text-sky-600 bg-sky-50 border-sky-200", label: "X / Twitter" },
  tiktok:    { icon: Music2,    color: "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200", label: "TikTok" },
  linkedin:  { icon: Linkedin,  color: "text-indigo-600 bg-indigo-50 border-indigo-200", label: "LinkedIn" },
};

export default function AdminSocialHub() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold flex items-center gap-2">
            <Sparkles size={22} className="text-amber-600" /> Social Media Hub
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Generate, schedule and review every social post.</p>
        </div>
      </header>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate"><Sparkles size={14} className="mr-1.5" />Generate</TabsTrigger>
          <TabsTrigger value="library"><FileText size={14} className="mr-1.5" />Library</TabsTrigger>
          <TabsTrigger value="calendar"><Calendar size={14} className="mr-1.5" />Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="generate"><GenerateTab /></TabsContent>
        <TabsContent value="library"><LibraryTab /></TabsContent>
        <TabsContent value="calendar"><CalendarTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Generate Tab ─────────────────────────────────────────────────────────────

function GenerateTab() {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    platform: "instagram" as Platform, topic: "", destination: "", tone: "", callToAction: "",
  });
  const [result, setResult] = useState<any | null>(null);
  const [scheduledFor, setScheduledFor] = useState<string>("");

  const generate = trpc.socialHub.generate.useMutation({
    onSuccess: (r) => { setResult(r); toast.success('Generated'); },
    onError: (e) => toast.error(e.message),
  });
  const create = trpc.socialHub.create.useMutation({
    onSuccess: () => {
      toast.success('Saved to library');
      utils.socialHub.list.invalidate();
      setResult(null);
      setForm({ platform: form.platform, topic: "", destination: "", tone: "", callToAction: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Brief */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h3 className="font-semibold">Brief</h3>
        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground">Platform</label>
          <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v as Platform })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(PLATFORM_META) as Platform[]).map(p => (
                <SelectItem key={p} value={p}>{PLATFORM_META[p].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground">Topic *</label>
          <Textarea value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="e.g. 5 reasons Maldives beats Bali this winter" rows={3} className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Destination (optional)</label>
            <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Tone (optional)</label>
            <Input value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} placeholder="warm, witty…" className="mt-1" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground">CTA (optional)</label>
          <Input value={form.callToAction} onChange={(e) => setForm({ ...form, callToAction: e.target.value })} placeholder="defaults to WhatsApp / email" className="mt-1" />
        </div>
        <Button
          onClick={() => generate.mutate(form)}
          disabled={!form.topic.trim() || generate.isPending}
          className="w-full bg-navy-gradient text-white"
        >
          {generate.isPending ? <><Loader2 size={14} className="mr-2 animate-spin" />Generating…</> : <><Sparkles size={14} className="mr-2" />Generate post</>}
        </Button>
      </div>

      {/* Result */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h3 className="font-semibold">Draft</h3>
        {!result ? (
          <p className="text-sm text-muted-foreground">Your generated post will appear here. Edit it freely before saving.</p>
        ) : (
          <>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Title (internal)</label>
              <Input value={result.title} onChange={(e) => setResult({ ...result, title: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Body</label>
              <Textarea value={result.body} onChange={(e) => setResult({ ...result, body: e.target.value })} rows={6} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Caption / Hook</label>
              <Input value={result.caption} onChange={(e) => setResult({ ...result, caption: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Hashtags</label>
              <Input value={result.hashtags} onChange={(e) => setResult({ ...result, hashtags: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Image prompt</label>
              <Textarea value={result.imagePrompt} onChange={(e) => setResult({ ...result, imagePrompt: e.target.value })} rows={2} className="mt-1 text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Schedule for (optional)</label>
              <Input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="mt-1" />
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(`${result.body}\n\n${result.hashtags}`).then(() => toast.success('Copied'))}>
                <Copy size={14} className="mr-1.5" /> Copy
              </Button>
              <Button
                className="flex-1 bg-navy-gradient text-white"
                onClick={() => create.mutate({
                  platform: form.platform,
                  title: result.title,
                  body: result.body,
                  caption: result.caption,
                  hashtags: result.hashtags,
                  imagePrompt: result.imagePrompt,
                  scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
                  status: scheduledFor ? "scheduled" : "draft",
                })}
              >Save to library</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Library Tab ─────────────────────────────────────────────────────────────

function LibraryTab() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<"all" | "draft" | "scheduled" | "published">("all");
  const listQ = trpc.socialHub.list.useQuery(filter === "all" ? {} : { status: filter });
  const [editing, setEditing] = useState<any | null>(null);

  const update = trpc.socialHub.update.useMutation({
    onSuccess: () => { toast.success('Updated'); utils.socialHub.list.invalidate(); setEditing(null); },
  });
  const del = trpc.socialHub.delete.useMutation({
    onSuccess: () => { toast.success('Deleted'); utils.socialHub.list.invalidate(); },
  });

  const items = listQ.data || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'draft', 'scheduled', 'published'] as const).map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No posts yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((p: any) => {
            const meta = PLATFORM_META[p.platform as Platform];
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${meta.color}`}>
                    <meta.icon size={12} /> {meta.label}
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{p.status}</Badge>
                </div>
                {p.title && <p className="font-semibold text-sm">{p.title}</p>}
                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{p.body}</p>
                {p.scheduledFor && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar size={11} />{new Date(p.scheduledFor).toLocaleString('en-GB')}</p>
                )}
                <div className="flex gap-1.5 pt-2 border-t">
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}><Edit2 size={12} className="mr-1" />Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(`${p.body}\n\n${p.hashtags || ''}`).then(() => toast.success('Copied'))}><Copy size={12} className="mr-1" />Copy</Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm('Delete post?')) del.mutate({ id: p.id }); }}><Trash2 size={12} className="text-red-600" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit post</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Title" />
              <Textarea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} rows={6} />
              <Input value={editing.hashtags || ''} onChange={(e) => setEditing({ ...editing, hashtags: e.target.value })} placeholder="Hashtags" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs">Status</label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs">Scheduled for</label>
                  <Input type="datetime-local"
                    value={editing.scheduledFor ? new Date(editing.scheduledFor).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditing({ ...editing, scheduledFor: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button className="bg-navy-gradient text-white" onClick={() => update.mutate({
                  id: editing.id, title: editing.title, body: editing.body, hashtags: editing.hashtags,
                  status: editing.status, scheduledFor: editing.scheduledFor ? new Date(editing.scheduledFor) : null,
                })}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Calendar Tab ────────────────────────────────────────────────────────────

function CalendarTab() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const calQ = trpc.socialHub.calendar.useQuery({ year, month });
  const byDay = calQ.data?.byDay || {};

  const firstDay = new Date(year, month - 1, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: Array<{ day: number; iso: string } | null> = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = new Date(year, month - 1, d).toISOString().slice(0, 10);
    cells.push({ day: d, iso });
  }

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const prev = () => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); };
  const next = () => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={prev}><ChevronLeft size={14} /></Button>
        <h3 className="font-serif text-lg font-semibold">{monthName}</h3>
        <Button variant="outline" size="sm" onClick={next}><ChevronRight size={14} /></Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-center font-semibold text-muted-foreground">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} className="py-2">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c) return <div key={i} className="min-h-[100px]" />;
          const posts = byDay[c.iso] || [];
          const isToday = c.iso === today.toISOString().slice(0, 10);
          return (
            <div key={i} className={`min-h-[100px] rounded-lg border p-2 text-xs space-y-1 ${isToday ? 'border-amber-400 bg-amber-50/50' : 'border-border bg-white'}`}>
              <div className={`font-semibold ${isToday ? 'text-amber-700' : 'text-muted-foreground'}`}>{c.day}</div>
              {posts.slice(0, 3).map((p: any) => {
                const meta = PLATFORM_META[p.platform as Platform];
                return (
                  <div key={p.id} className={`px-1.5 py-1 rounded text-[10px] truncate border ${meta.color}`} title={p.title || p.body}>
                    <meta.icon size={9} className="inline mr-0.5" />{p.title || p.body.slice(0, 20)}
                  </div>
                );
              })}
              {posts.length > 3 && <div className="text-[10px] text-muted-foreground">+{posts.length - 3} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
