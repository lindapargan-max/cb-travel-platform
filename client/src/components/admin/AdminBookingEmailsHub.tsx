import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Mail, Send, Edit2, Eye, Trash2, RefreshCw, Plus, Inbox,
  CheckCircle2, XCircle, Clock, AlertTriangle, FileText, X,
} from "lucide-react";

const TEMPLATE_KEYS = [
  { key: "passport_request",   label: "Passport request" },
  { key: "balance_reminder",   label: "Balance reminder" },
  { key: "check_in_reminder",  label: "Check-in reminder" },
  { key: "travel_docs",        label: "Travel documents" },
  { key: "pre_travel_reminder", label: "Pre-travel reminder" },
  { key: "welcome_home",       label: "Welcome home" },
];

export default function AdminBookingEmailsHub() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-serif text-2xl font-semibold flex items-center gap-2">
          <Mail size={22} className="text-amber-600" />
          Booking Email System
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Templates, triggers and the action queue for every email that goes out about a booking.
        </p>
      </header>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue"><Inbox size={14} className="mr-1.5" />Pending queue</TabsTrigger>
          <TabsTrigger value="templates"><FileText size={14} className="mr-1.5" />Templates</TabsTrigger>
          <TabsTrigger value="history"><CheckCircle2 size={14} className="mr-1.5" />History</TabsTrigger>
        </TabsList>

        <TabsContent value="queue"><QueueTab /></TabsContent>
        <TabsContent value="templates"><TemplatesTab /></TabsContent>
        <TabsContent value="history"><HistoryTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Queue Tab ───────────────────────────────────────────────────────────────

function QueueTab() {
  const utils = trpc.useUtils();
  const [previewId, setPreviewId] = useState<number | null>(null);

  const queueQ = trpc.bookingEmails.listQueue.useQuery({ status: "pending" });
  const detect = trpc.bookingEmails.detectTriggers.useMutation({
    onSuccess: (counts) => {
      const total = Object.values(counts).reduce((a: number, b: any) => a + Number(b), 0);
      toast.success(total > 0 ? `${total} new notification${total !== 1 ? 's' : ''} queued` : 'All caught up — no new triggers.');
      utils.bookingEmails.listQueue.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const dismiss = trpc.bookingEmails.dismissQueueItem.useMutation({
    onSuccess: () => { toast.success('Dismissed'); utils.bookingEmails.listQueue.invalidate(); },
  });

  const items = queueQ.data || [];

  const labelFor = (k: string) => TEMPLATE_KEYS.find(t => t.key === k)?.label || k;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-amber-50/50 border border-amber-200 rounded-xl p-4">
        <div>
          <p className="font-semibold text-sm">Notification & Action Centre</p>
          <p className="text-xs text-muted-foreground mt-0.5">Auto-send is OFF. Every email is reviewed and sent by you.</p>
        </div>
        <Button
          onClick={() => detect.mutate()}
          disabled={detect.isPending}
          className="bg-navy-gradient text-white hover:opacity-90"
        >
          <RefreshCw size={14} className={`mr-2 ${detect.isPending ? 'animate-spin' : ''}`} />
          Scan for triggers
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-12 text-center">
          <CheckCircle2 size={36} className="text-emerald-600 mx-auto mb-3" />
          <p className="text-lg font-semibold text-emerald-700">No pending notifications</p>
          <p className="text-sm text-emerald-600 mt-1">Press "Scan for triggers" to look for new ones.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it: any) => (
            <div key={it.id} className="bg-white rounded-2xl border border-border p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <Mail size={16} className="text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{labelFor(it.templateKey)}</span>
                    <Badge variant="outline" className="text-[10px]">{it.bookingReference || `#${it.bookingId}`}</Badge>
                    {it.scheduledFor && <Badge variant="secondary" className="text-[10px]"><Clock size={10} className="mr-1" />{new Date(it.scheduledFor).toLocaleString('en-GB')}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium text-foreground">{it.clientName || it.leadPassengerName || 'Client'}</span>
                    {" · "}{it.destination || '—'}
                    {it.departureDate && <> · departs {new Date(it.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">→ {it.clientEmail || it.leadPassengerEmail || '(no email)'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setPreviewId(it.id)}>
                    <Eye size={13} className="mr-1.5" />Preview & send
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm('Dismiss this notification?')) dismiss.mutate({ id: it.id }); }}>
                    <X size={13} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewId !== null && <QueuePreviewDialog id={previewId} onClose={() => setPreviewId(null)} />}
    </div>
  );
}

function QueuePreviewDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const previewQ = trpc.bookingEmails.previewQueueItem.useQuery({ id });
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const send = trpc.bookingEmails.sendQueueItem.useMutation({
    onSuccess: () => {
      toast.success("Email sent");
      utils.bookingEmails.listQueue.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const data = previewQ.data;
  const initialised = data && (subject === "" && !editing);
  if (initialised) { setSubject(data.subject); setBody(data.html); }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview & send</DialogTitle>
        </DialogHeader>
        {!data ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-4">
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">To:</span> <strong>{data.to}</strong></p>
            </div>

            {editing ? (
              <>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Subject</label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Body (HTML)</label>
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} className="mt-1 font-mono text-xs" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Subject</p>
                  <p className="font-semibold">{subject || data.subject}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Preview</p>
                  <div className="border border-border rounded-xl p-5 bg-white max-h-[400px] overflow-y-auto" dangerouslySetInnerHTML={{ __html: body || data.html }} />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setEditing(!editing)}>
                <Edit2 size={14} className="mr-1.5" /> {editing ? "Done editing" : "Edit"}
              </Button>
              <Button
                className="bg-navy-gradient text-white"
                disabled={send.isPending}
                onClick={() => send.mutate({ id, subjectOverride: subject || undefined, bodyOverride: body || undefined })}
              >
                <Send size={14} className="mr-1.5" /> Send now
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Templates Tab ───────────────────────────────────────────────────────────

function TemplatesTab() {
  const utils = trpc.useUtils();
  const listQ = trpc.emailTemplates.list.useQuery();
  const [editing, setEditing] = useState<any | null>(null);

  const upsert = trpc.emailTemplates.upsert.useMutation({
    onSuccess: () => { toast.success('Template saved'); utils.emailTemplates.list.invalidate(); setEditing(null); },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.emailTemplates.delete.useMutation({
    onSuccess: () => { toast.success('Deleted'); utils.emailTemplates.list.invalidate(); },
  });

  const templates = listQ.data || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Use <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{'{{client_name}}'}</code>, <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{'{{destination}}'}</code>, <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{'{{booking_reference}}'}</code> etc. as placeholders.</p>
        <Button onClick={() => setEditing({ key: '', name: '', subject: '', body: '', category: 'booking', isActive: true, _new: true })} className="bg-navy-gradient text-white">
          <Plus size={14} className="mr-1.5" /> New template
        </Button>
      </div>

      <div className="space-y-2">
        {templates.map((t: any) => (
          <div key={t.id} className="bg-white rounded-xl border border-border p-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{t.name}</span>
                <Badge variant="outline" className="text-[10px]">{t.key}</Badge>
                <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
                {!t.isActive && <Badge variant="destructive" className="text-[10px]">Disabled</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1 truncate">{t.subject}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(t)}><Edit2 size={13} /></Button>
            <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete "${t.name}"?`)) del.mutate({ key: t.key }); }}><Trash2 size={13} className="text-red-600" /></Button>
          </div>
        ))}
      </div>

      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing._new ? "New template" : "Edit template"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Key (stable id, lowercase + underscore)</label>
                  <Input value={editing.key} onChange={(e) => setEditing({ ...editing, key: e.target.value })} disabled={!editing._new} placeholder="e.g. passport_request" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Display name</label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Subject</label>
                <Input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Body (HTML)</label>
                <Textarea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} rows={14} className="mt-1 font-mono text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button
                  className="bg-navy-gradient text-white"
                  disabled={upsert.isPending}
                  onClick={() => upsert.mutate({ key: editing.key, name: editing.name, subject: editing.subject, body: editing.body, category: editing.category, isActive: editing.isActive })}
                >Save template</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── History Tab ─────────────────────────────────────────────────────────────

function HistoryTab() {
  const sentQ = trpc.bookingEmails.listQueue.useQuery({ status: "sent" });
  const failedQ = trpc.bookingEmails.listQueue.useQuery({ status: "failed" });
  const dismissedQ = trpc.bookingEmails.listQueue.useQuery({ status: "dismissed" });

  const sections = [
    { title: "Sent", icon: CheckCircle2, color: "text-emerald-600", items: sentQ.data || [] },
    { title: "Failed", icon: XCircle, color: "text-red-600", items: failedQ.data || [] },
    { title: "Dismissed", icon: AlertTriangle, color: "text-muted-foreground", items: dismissedQ.data || [] },
  ];

  return (
    <div className="space-y-6">
      {sections.map(s => (
        <div key={s.title}>
          <div className={`flex items-center gap-2 mb-3 ${s.color}`}>
            <s.icon size={16} /><h3 className="font-semibold text-sm">{s.title} ({s.items.length})</h3>
          </div>
          {s.items.length === 0 ? (
            <p className="text-xs text-muted-foreground">None.</p>
          ) : (
            <div className="space-y-2">
              {s.items.slice(0, 50).map((it: any) => (
                <div key={it.id} className="bg-white rounded-xl border border-border p-3 text-sm flex items-center justify-between">
                  <div>
                    <span className="font-medium">{it.templateKey}</span>
                    <span className="text-muted-foreground"> · {it.bookingReference || `#${it.bookingId}`} · {it.clientName || it.leadPassengerName || '—'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(it.sentAt || it.dismissedAt || it.createdAt).toLocaleString('en-GB')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
