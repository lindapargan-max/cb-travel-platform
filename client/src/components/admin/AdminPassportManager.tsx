import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertTriangle, CheckCircle2, Clock, Edit2, Mail, Search,
  ShieldAlert, ShieldCheck, X, Eye, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

type PassportStatus = "critical" | "warning" | "ok" | "missing";

interface PassportClient {
  bookingId: number;
  bookingRef: string;
  clientName: string;
  clientEmail: string;
  destination: string;
  departureDate: string | null;
  passportNumber: string | null;
  passportExpiry: string | null;
  passportIssueDate: string | null;
  passportIssuingCountry: string | null;
  status: PassportStatus;
  daysUntilExpiry: number | null;
  daysUntilDeparture: number | null;
}

function getPassportStatus(passportExpiry: string | null, departureDate: string | null): { status: PassportStatus; daysUntilExpiry: number | null } {
  if (!passportExpiry) return { status: "missing", daysUntilExpiry: null };
  const expiry = new Date(passportExpiry);
  if (isNaN(expiry.getTime())) return { status: "missing", daysUntilExpiry: null };
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  // Check validity for 6 months beyond return date
  const checkDate = departureDate ? new Date(new Date(departureDate).getTime() + (180 * 24 * 60 * 60 * 1000)) : new Date(now.getTime() + (180 * 24 * 60 * 60 * 1000));
  if (expiry < checkDate) {
    if (daysUntilExpiry < 0) return { status: "critical", daysUntilExpiry };
    if (daysUntilExpiry < 90) return { status: "critical", daysUntilExpiry };
    return { status: "warning", daysUntilExpiry };
  }
  return { status: "ok", daysUntilExpiry };
}

function StatusBadgeComp({ status }: { status: PassportStatus }) {
  const config: Record<PassportStatus, { label: string; className: string }> = {
    critical: { label: "Critical", className: "bg-red-100 text-red-800 border-red-200" },
    warning:  { label: "Expiring Soon", className: "bg-amber-100 text-amber-800 border-amber-200" },
    ok:       { label: "Valid", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    missing:  { label: "Missing", className: "bg-slate-100 text-slate-600 border-slate-200" },
  };
  const c = config[status];
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.className}`}>{c.label}</span>;
}

export default function AdminPassportManager() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PassportStatus | "all">("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ passportNumber: "", passportExpiry: "", passportIssueDate: "", passportIssuingCountry: "" });
  const [previewData, setPreviewData] = useState<any>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);

  const bookingsQuery = trpc.bookings.getAllAdmin.useQuery();
  const updatePassportMut = trpc.bookings.updatePassport.useMutation({
    onSuccess: () => { toast.success("Passport details saved"); setEditingId(null); bookingsQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const sendReminderMut = trpc.bookings.sendPassportReminder.useMutation({
    onSuccess: (data: any) => {
      if (data?.preview) {
        setPreviewData(data.preview);
      } else {
        toast.success("Reminder email sent!");
        setSendingId(null);
      }
    },
    onError: (e) => { toast.error(e.message); setSendingId(null); },
  });

  const clients = useMemo<PassportClient[]>(() => {
    const allBookings = bookingsQuery.data ?? [];
    return allBookings
      .filter((b) => b.status !== "cancelled")
      .map((b) => {
        const pp = (b as any).passportExpiry || null;
        const dep = b.departureDate || null;
        const { status, daysUntilExpiry } = getPassportStatus(pp, dep);
        const daysUntilDeparture = dep ? Math.floor((new Date(dep).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
        return {
          bookingId: b.id,
          bookingRef: b.bookingReference ?? `BK${b.id}`,
          clientName: b.leadPassengerName ?? "Unknown",
          clientEmail: b.leadPassengerEmail ?? "",
          destination: b.destination ?? "Unknown",
          departureDate: dep,
          passportNumber: (b as any).passportNumber || null,
          passportExpiry: pp,
          passportIssueDate: (b as any).passportIssueDate || null,
          passportIssuingCountry: (b as any).passportIssuingCountry || null,
          status,
          daysUntilExpiry,
          daysUntilDeparture,
        };
      });
  }, [bookingsQuery.data]);

  const filtered = useMemo(() => {
    return clients
      .filter((c) => filterStatus === "all" || c.status === filterStatus)
      .filter((c) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return c.clientName.toLowerCase().includes(q) || c.destination.toLowerCase().includes(q) || c.bookingRef.toLowerCase().includes(q) || (c.passportNumber || "").toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const order: Record<PassportStatus, number> = { critical: 0, missing: 1, warning: 2, ok: 3 };
        return order[a.status] - order[b.status];
      });
  }, [clients, search, filterStatus]);

  const stats = useMemo(() => ({
    critical: clients.filter((c) => c.status === "critical").length,
    warning: clients.filter((c) => c.status === "warning").length,
    missing: clients.filter((c) => c.status === "missing").length,
    ok: clients.filter((c) => c.status === "ok").length,
  }), [clients]);

  const openEdit = (c: PassportClient) => {
    setEditForm({
      passportNumber: c.passportNumber || "",
      passportExpiry: c.passportExpiry || "",
      passportIssueDate: c.passportIssueDate || "",
      passportIssuingCountry: c.passportIssuingCountry || "",
    });
    setEditingId(c.bookingId);
  };

  const handlePreviewReminder = (c: PassportClient) => {
    setSendingId(c.bookingId);
    sendReminderMut.mutate({ bookingId: c.bookingId, previewOnly: true });
  };

  const handleConfirmSend = () => {
    if (!previewData || !sendingId) return;
    sendReminderMut.mutate({ bookingId: sendingId, previewOnly: false });
    setPreviewData(null);
  };

  if (bookingsQuery.isLoading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Critical", count: stats.critical, icon: <ShieldAlert className="w-5 h-5 text-red-600" />, bg: "bg-red-50", border: "border-red-100", text: "text-red-700", id: "critical" as PassportStatus },
          { label: "Expiring Soon", count: stats.warning, icon: <AlertTriangle className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700", id: "warning" as PassportStatus },
          { label: "Missing Data", count: stats.missing, icon: <Clock className="w-5 h-5 text-slate-500" />, bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", id: "missing" as PassportStatus },
          { label: "All Clear", count: stats.ok, icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", id: "ok" as PassportStatus },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setFilterStatus(filterStatus === s.id ? "all" : s.id)}
            className={`rounded-2xl border p-4 text-left transition-all hover:shadow-md ${s.bg} ${s.border} ${filterStatus === s.id ? "ring-2 ring-offset-1 ring-current" : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              {s.icon}
              <span className={`text-2xl font-bold ${s.text}`}>{s.count}</span>
            </div>
            <p className={`text-xs font-semibold ${s.text}`}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, destination, reference, passport number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {filterStatus !== "all" && (
          <Button variant="outline" onClick={() => setFilterStatus("all")} className="gap-2">
            <X className="w-4 h-4" /> Clear filter
          </Button>
        )}
      </div>

      {/* Results */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            {filtered.length} {filtered.length === 1 ? "client" : "clients"}
            {filterStatus !== "all" && <span className="text-muted-foreground font-normal"> · filtered</span>}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No clients found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((c) => (
              <div key={c.bookingId} className="px-5 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-foreground text-sm">{c.clientName}</p>
                      <StatusBadgeComp status={c.status} />
                      {c.daysUntilDeparture !== null && c.daysUntilDeparture <= 30 && c.daysUntilDeparture >= 0 && (
                        <Badge variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50">Departing in {c.daysUntilDeparture}d</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                      <span>✈ {c.destination}</span>
                      {c.departureDate && <span>Dep: {new Date(c.departureDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                      <span className="font-mono text-xs">{c.bookingRef}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2">
                      <span className="text-muted-foreground">
                        Passport: <span className="text-foreground font-medium">{c.passportNumber || <span className="text-slate-400 italic">not recorded</span>}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Expires: <span className={`font-medium ${c.status === "critical" ? "text-red-600" : c.status === "warning" ? "text-amber-600" : "text-foreground"}`}>
                          {c.passportExpiry ? new Date(c.passportExpiry).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : <span className="text-slate-400 italic">not recorded</span>}
                        </span>
                      </span>
                      {c.passportIssuingCountry && <span className="text-muted-foreground">Country: <span className="text-foreground font-medium">{c.passportIssuingCountry}</span></span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)} className="gap-1.5 text-xs">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </Button>
                    {c.clientEmail && (c.status === "critical" || c.status === "warning" || c.status === "missing") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewReminder(c)}
                        disabled={sendReminderMut.isPending && sendingId === c.bookingId}
                        className="gap-1.5 text-xs hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview Reminder
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Passport Modal */}
      <Dialog open={editingId !== null} onOpenChange={(o) => !o && setEditingId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Passport Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Passport Number</Label>
              <Input
                placeholder="e.g. 123456789"
                value={editForm.passportNumber}
                onChange={(e) => setEditForm((f) => ({ ...f, passportNumber: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={editForm.passportIssueDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, passportIssueDate: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={editForm.passportExpiry}
                  onChange={(e) => setEditForm((f) => ({ ...f, passportExpiry: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Issuing Country</Label>
              <Input
                placeholder="e.g. United Kingdom"
                value={editForm.passportIssuingCountry}
                onChange={(e) => setEditForm((f) => ({ ...f, passportIssuingCountry: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (!editingId) return;
                  updatePassportMut.mutate({
                    id: editingId,
                    passportNumber: editForm.passportNumber || null,
                    passportExpiry: editForm.passportExpiry || null,
                    passportIssueDate: editForm.passportIssueDate || null,
                    passportIssuingCountry: editForm.passportIssuingCountry || null,
                  });
                }}
                disabled={updatePassportMut.isPending}
              >
                Save Passport Details
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Preview Modal */}
      <Dialog open={previewData !== null} onOpenChange={(o) => { if (!o) { setPreviewData(null); setSendingId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preview Reminder Email</DialogTitle>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 border border-border p-4 text-sm space-y-2">
                <div className="flex gap-2"><span className="text-muted-foreground font-medium w-16">To:</span><span className="text-foreground">{previewData.to}</span></div>
                <div className="flex gap-2"><span className="text-muted-foreground font-medium w-16">Subject:</span><span className="text-foreground">{previewData.subject}</span></div>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm space-y-2">
                <p className="font-semibold text-amber-900">Email will contain:</p>
                <ul className="list-disc list-inside text-amber-800 space-y-1 text-xs">
                  <li>Dear <strong>{previewData.clientName}</strong></li>
                  <li>Passport expires: <strong>{previewData.passportExpiry}</strong></li>
                  <li>Upcoming trip to: <strong>{previewData.destination}</strong></li>
                  <li>Departure date: <strong>{previewData.departureDate}</strong></li>
                  <li>Link to renew passport on gov.uk</li>
                </ul>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setPreviewData(null); setSendingId(null); }}>Cancel</Button>
                <Button
                  onClick={handleConfirmSend}
                  disabled={sendReminderMut.isPending}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" /> Send Reminder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
