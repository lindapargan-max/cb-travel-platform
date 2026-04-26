import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { WeatherPackingAssistant } from "@/components/WeatherPackingAssistant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar, FileText, MapPin, Phone, Mail, User, CreditCard,
  Download, Clock, Plane, ChevronRight, ChevronDown, AlertCircle, CheckCircle2, Lock,
  XCircle, Star, ArrowRight, Package, Hotel, Briefcase, CheckSquare,
  Plus, Trash2, Edit2, Zap, Heart, MapPinIcon, AlertTriangle, MessageSquare,
  Ticket, Users2, Send, Paperclip, UserMinus, Shield
} from "lucide-react";
import { Link } from "wouter";
import HolidayCountdownBanner from "@/components/HolidayCountdownBanner";
import LoyaltyWidget from "@/components/LoyaltyWidget";
import ReferralSection from "@/components/ReferralSection";
import FeedbackForm from "@/components/FeedbackForm";
import FlightStatusTracker from "@/components/FlightStatusTracker";
import WeatherWidget from "@/components/WeatherWidget";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import SOSButton from "@/components/SOSButton";
import AIItineraryGenerator from "@/components/AIItineraryGenerator";


function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending:   { label: "Pending",   className: "badge-pending" },
    confirmed: { label: "Confirmed", className: "badge-confirmed" },
    cancelled: { label: "Cancelled", className: "badge-cancelled" },
    completed: { label: "Completed", className: "badge-completed" },
  };
  const c = config[status] || { label: status, className: "badge-new" };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${c.className}`}>
      {c.label}
    </span>
  );
}

function QuoteStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    new:       { label: "New",       className: "bg-blue-50 text-blue-700" },
    contacted: { label: "Contacted", className: "bg-yellow-50 text-yellow-700" },
    quoted:    { label: "Quoted",    className: "bg-purple-50 text-purple-700" },
    completed: { label: "Completed", className: "bg-green-50 text-green-700" },
    cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700" },
  };
  const c = config[status] || { label: status, className: "bg-gray-50 text-gray-700" };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${c.className}`}>
      {c.label}
    </span>
  );
}

function CountdownTimer({ departureDate }: { departureDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateCountdown = () => {
      const target = new Date(departureDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [departureDate]);

  if (!timeLeft) return null;

  const isUrgent = timeLeft.days <= 7;

  return (
    <div className={`rounded-2xl p-6 border-2 ${isUrgent ? 'border-orange-300 bg-orange-50' : 'border-primary/20 bg-primary/5'}`}>
      <p className={`text-xs font-semibold mb-3 ${isUrgent ? 'text-orange-700' : 'text-muted-foreground'}`}>
        {isUrgent ? '⏰ DEPARTURE SOON' : '✈️ COUNTDOWN TO YOUR HOLIDAY'}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Days', value: timeLeft.days },
          { label: 'Hours', value: timeLeft.hours },
          { label: 'Mins', value: timeLeft.minutes },
          { label: 'Secs', value: timeLeft.seconds },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="bg-white rounded-lg p-2 mb-1 border border-border">
              <p className="font-bold text-lg text-primary">{String(item.value).padStart(2, '0')}</p>
            </div>
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistSection({ booking }: { booking: any }) {
  const [checklist, setChecklist] = useState<any[]>([]);
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState("travel");
  const utils = trpc.useUtils();

  const { data: checklistData, isLoading: checklistLoading } = trpc.bookings.getChecklist.useQuery(booking.id, {
    staleTime: 0,
  });

  const addMutation = trpc.bookings.addChecklistItem.useMutation({
    onSuccess: () => {
      setNewItem("");
      utils.bookings.getChecklist.invalidate(booking.id);
    },
  });

  const toggleMutation = trpc.bookings.toggleChecklistItem.useMutation({
    onMutate: async (itemId) => {
      setChecklist(prev => prev.map(i => i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i));
    },
    onError: () => {
      if (checklistData) setChecklist(checklistData);
      toast.error("Couldn't update checklist. Please try again.");
    },
    onSettled: () => {
      utils.bookings.getChecklist.invalidate(booking.id);
    },
  });

  const deleteMutation = trpc.bookings.deleteChecklistItem.useMutation({
    onMutate: async (itemId) => {
      setChecklist(prev => prev.filter(i => i.id !== itemId));
    },
    onSettled: () => {
      utils.bookings.getChecklist.invalidate(booking.id);
    },
  });

  useEffect(() => {
    if (checklistData) setChecklist(checklistData);
  }, [checklistData]);

  const handleAddItem = () => {
    if (newItem.trim()) {
      addMutation.mutate({ bookingId: booking.id, title: newItem, category: newCategory });
    }
  };

  const categories = [
    { id: "travel", label: "🧳 Travel Prep", color: "bg-green-50 border-green-200" },
    { id: "documents", label: "📄 Documents", color: "bg-blue-50 border-blue-200" },
    { id: "health", label: "💊 Health & Insurance", color: "bg-red-50 border-red-200" },
    { id: "payments", label: "💳 Payments", color: "bg-purple-50 border-purple-200" },
    { id: "extras", label: "⭐ Extras", color: "bg-yellow-50 border-yellow-200" },
    { id: "general", label: "📋 General", color: "bg-gray-50 border-gray-200" },
  ];

  const completedCount = checklist.filter(i => i.isCompleted).length;
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;
  const knownCatIds = categories.map(c => c.id);
  const uncategorised = checklist.filter(i => !knownCatIds.includes(i.category));

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground">Pre-Trip Checklist</h3>
          <span className="text-xs font-medium text-muted-foreground">{completedCount}/{checklist.length} done</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        {checklist.length > 0 && progress === 100 && (
          <p className="text-xs text-green-600 font-semibold mt-1">🎉 All done — you're ready to go!</p>
        )}
      </div>

      {checklistLoading && <p className="text-xs text-muted-foreground">Loading checklist...</p>}

      <div className="space-y-2">
        {categories.map(cat => {
          const items = checklist.filter(i => i.category === cat.id);
          return items.length > 0 ? (
            <div key={cat.id} className={`rounded-lg border p-3 ${cat.color}`}>
              <p className="text-xs font-semibold mb-2">{cat.label}</p>
              <div className="space-y-1">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      onChange={() => toggleMutation.mutate(item.id)}
                      className="rounded cursor-pointer w-4 h-4 accent-green-600"
                    />
                    <span className={item.isCompleted ? "line-through text-muted-foreground" : "text-foreground"}>{item.title}</span>
                    <button
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })}
        {uncategorised.length > 0 && (
          <div className="rounded-lg border bg-gray-50 border-gray-200 p-3">
            <p className="text-xs font-semibold mb-2">📋 Other</p>
            <div className="space-y-1">
              {uncategorised.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => toggleMutation.mutate(item.id)}
                    className="rounded cursor-pointer w-4 h-4 accent-green-600"
                  />
                  <span className={item.isCompleted ? "line-through text-muted-foreground" : "text-foreground"}>{item.title}</span>
                  <button onClick={() => deleteMutation.mutate(item.id)} className="ml-auto text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {checklist.length === 0 && !checklistLoading && (
          <p className="text-xs text-muted-foreground text-center py-4">Add your first item below to get started!</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Category</p>
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
          >
            <option value="travel">🧳 Travel Prep</option>
            <option value="documents">📄 Documents</option>
            <option value="health">💊 Health &amp; Insurance</option>
            <option value="payments">💳 Payments</option>
            <option value="extras">⭐ Extras</option>
            <option value="general">📋 General</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add checklist item..."
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddItem()}
            className="rounded-lg text-sm"
          />
          <Button
            onClick={handleAddItem}
            disabled={!newItem.trim() || addMutation.isPending}
            className="rounded-lg btn-gold border-0 text-foreground shrink-0"
          >
            {addMutation.isPending ? "..." : <Plus size={16} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── V7: Travel Party Section (inside BookingCard) ───────────────────────────
function TravelPartySection({ booking, currentUser }: { booking: any; currentUser: any }) {
  const utils = trpc.useUtils();
  const [emailInput, setEmailInput] = useState("");
  const { data: members, refetch } = trpc.travelParty.getMembers.useQuery(booking.id);

  const addMutation = trpc.travelParty.addMemberByEmail.useMutation({
    onSuccess: (res) => {
      toast.success(`${res.userName || "User"} added to your travel party!`);
      setEmailInput("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMutation = trpc.travelParty.removeMember.useMutation({
    onSuccess: () => { toast.success("Member removed."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
      <h4 className="font-semibold text-indigo-900 text-sm mb-3 flex items-center gap-2">
        <Users2 size={16} className="text-indigo-600" /> Travel Party
      </h4>
      {/* Lead (current user) */}
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-indigo-200">
          <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs">
            {(currentUser?.name || currentUser?.email || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{currentUser?.name || "You"}</p>
            <p className="text-[10px] text-muted-foreground">Lead</p>
          </div>
        </div>
        {members?.map((m: any) => (
          <div key={m.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-indigo-200">
            <div className="w-7 h-7 bg-indigo-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
              {(m.userName || m.userEmail || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{m.userName || "—"}</p>
              <p className="text-[10px] text-muted-foreground">{m.userEmail}</p>
            </div>
            <button
              onClick={() => removeMutation.mutate({ bookingId: booking.id, userId: m.userId })}
              className="ml-1 text-indigo-300 hover:text-red-500 transition-colors"
              title="Remove from party"
            >
              <UserMinus size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="Invite by email address…"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && emailInput.trim()) addMutation.mutate({ bookingId: booking.id, email: emailInput.trim() }); }}
          className="flex-1 border border-indigo-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
        <button
          onClick={() => { if (emailInput.trim()) addMutation.mutate({ bookingId: booking.id, email: emailInput.trim() }); }}
          disabled={!emailInput.trim() || addMutation.isPending}
          className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
        >
          {addMutation.isPending ? "…" : <Plus size={14} />}
        </button>
      </div>
      <p className="text-xs text-indigo-500 mt-2">Invited users must already have a CB Travel account.</p>
    </div>
  );
}


function getStatusGradient(status: string) {
  switch (status) {
    case "confirmed":  return "from-blue-600 to-indigo-700";
    case "pending":    return "from-amber-500 to-orange-600";
    case "completed":  return "from-emerald-500 to-green-700";
    case "cancelled":  return "from-red-500 to-rose-700";
    default:           return "from-slate-500 to-slate-700";
  }
}

function BookingCard({ booking, user }: { booking: any; user?: any }) {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [docUnlock, setDocUnlock] = useState<{ id: number; url: string; name: string } | null>(null);
  const [docPassword, setDocPassword] = useState("");
  const [docChecking, setDocChecking] = useState(false);
  const utils = trpc.useUtils();
  const { data: documents } = trpc.bookings.getDocuments.useQuery(booking.id);
  const { data: flightDetails } = trpc.bookings.getFlightDetails.useQuery(booking.id);
  const { data: hotelDetails } = trpc.bookings.getHotelDetails.useQuery(booking.id);
  const { data: bookingPhotosData } = trpc.bookings.getPhotos.useQuery(booking.id);
  const { data: activitiesData } = trpc.activities.getByDestination.useQuery(
    { destination: booking.destination || "" },
    { enabled: !!booking.destination }
  );
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  async function handleDocUnlock() {
    if (!docUnlock || !docPassword) return;
    setDocChecking(true);
    try {
      const valid = await utils.bookings.verifyDocumentPassword.fetch({ documentId: docUnlock.id, password: docPassword });
      if (valid) {
        window.open(docUnlock.url, "_blank");
        setDocUnlock(null);
        setDocPassword("");
        toast.success("Document unlocked!");
      } else {
        toast.error("Incorrect password — please try again.");
      }
    } catch {
      toast.error("Could not verify password. Please try again.");
    } finally {
      setDocChecking(false);
    }
  }

  const total = booking.totalPrice ? parseFloat(booking.totalPrice) : 0;
  const paid = booking.amountPaid ? parseFloat(booking.amountPaid) : 0;
  const remaining = Math.max(0, total - paid);
  const gradient = getStatusGradient(booking.status);

  // ── Booking Confirmation PDF ──────────────────────────────────────────────
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const downloadBookingPDF = () => {
    if (pdfGenerating) return;
    setPdfGenerating(true);

    const fmtDate = (d: string | null | undefined) =>
      d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
    const fmtCurrency = (n: number) => `£${n.toFixed(2)}`;

    const data = {
      ref: booking.bookingReference || '—',
      destination: booking.destination || '—',
      status: (booking.status || 'pending').toUpperCase(),
      departure: fmtDate(booking.departureDate),
      returnDate: fmtDate(booking.returnDate),
      total: fmtCurrency(total),
      paid: fmtCurrency(paid),
      remaining: fmtCurrency(remaining),
      clientName: user?.name || user?.email || '—',
      issueDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      airline: flightDetails?.airline || '',
      outbound: flightDetails?.outboundFlightNumber || '',
      outboundTime: flightDetails?.outboundDepartureTime || '',
      inbound: flightDetails?.returnFlightNumber || '',
      inboundTime: flightDetails?.returnDepartureTime || '',
      hotels: (hotelDetails || []).map((h: any) => ({
        name: h.hotelName || '',
        location: h.destination || '',
        checkIn: h.checkInDate || '',
        checkOut: h.checkOutDate || '',
        conf: h.confirmationNumber || '',
      })),
      notes: booking.notes || '',
    };

    const safeData = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Booking Confirmation</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
<style>body{margin:0;background:#1e3a5f;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Arial,sans-serif;}</style>
</head><body>
<script>
var D = ${safeData};
window.addEventListener('load', function(){
  try {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    var W = 210, PL = 18, PR = 192;

    // ── Cover / header block ────────────────────────────────────────────────
    // Navy gradient background (simulated with fill)
    doc.setFillColor(11, 34, 64);
    doc.rect(0, 0, W, 60, 'F');
    doc.setFillColor(26, 58, 96);
    doc.rect(0, 45, W, 15, 'F');

    // Gold rule
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.8);
    doc.line(PL, 58, PR, 58);

    // CB Travel logo text
    doc.setFont('helvetica','bold');
    doc.setFontSize(22);
    doc.setTextColor(212, 175, 55);
    doc.text('CB Travel', PL, 22);

    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 200, 220);
    doc.text('Luxury Travel Concierge', PL, 29);

    // "Booking Confirmation" label
    doc.setFont('helvetica','bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('Booking Confirmation', PL, 46);

    // Booking reference top-right
    doc.setFont('courier','bold');
    doc.setFontSize(13);
    doc.setTextColor(212, 175, 55);
    doc.text(D.ref, PR, 22, { align:'right' });
    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 200, 220);
    doc.text('Booking Reference', PR, 27, { align:'right' });

    // ── Status badge ────────────────────────────────────────────────────────
    var statusColors = { CONFIRMED:[39,174,96], PENDING:[230,162,20], COMPLETED:[39,174,96], CANCELLED:[231,76,60] };
    var sc = statusColors[D.status] || [100,100,100];
    doc.setFillColor(sc[0], sc[1], sc[2]);
    doc.roundedRect(PR - 36, 36, 38, 9, 2, 2, 'F');
    doc.setFont('helvetica','bold');
    doc.setFontSize(8);
    doc.setTextColor(255,255,255);
    doc.text(D.status, PR - 17, 41.5, { align:'center' });

    // ── Issue date ──────────────────────────────────────────────────────────
    var y = 70;
    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.setTextColor(100,100,100);
    doc.text('Issued: ' + D.issueDate, PL, y);
    doc.text('Prepared for: ' + D.clientName, PR, y, { align:'right' });

    // ── Section helper ──────────────────────────────────────────────────────
    function sectionHeader(title, yPos) {
      doc.setFillColor(245, 247, 250);
      doc.rect(PL, yPos - 5, PR - PL, 10, 'F');
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.4);
      doc.line(PL, yPos - 5, PL + 3, yPos - 5);
      doc.line(PL, yPos - 5, PL, yPos + 5);
      doc.setFont('helvetica','bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 58, 96);
      doc.text(title, PL + 5, yPos + 1);
      return yPos + 12;
    }

    function row(label, value, yPos, highlight) {
      doc.setFont('helvetica','normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100,100,100);
      doc.text(label, PL + 2, yPos);
      doc.setFont('helvetica', highlight ? 'bold' : 'normal');
      doc.setTextColor(highlight ? 30 : 50, highlight ? 58 : 50, highlight ? 96 : 50);
      doc.text(value || '—', PL + 65, yPos);
      doc.setDrawColor(220,220,220);
      doc.setLineWidth(0.2);
      doc.line(PL, yPos + 2, PR, yPos + 2);
      return yPos + 9;
    }

    // ── Trip Details ────────────────────────────────────────────────────────
    y = sectionHeader('Trip Details', y + 8);
    y = row('Destination', D.destination, y, true);
    y = row('Departure Date', D.departure, y, false);
    y = row('Return Date', D.returnDate, y, false);
    y += 4;

    // ── Payment Summary ─────────────────────────────────────────────────────
    y = sectionHeader('Payment Summary', y);
    y = row('Total Holiday Price', D.total, y, false);
    y = row('Amount Paid', D.paid, y, false);

    // Balance row — highlight if outstanding
    var balLabel = parseFloat(D.remaining.replace('£','')) > 0 ? 'Balance Due' : 'Balance Due';
    var balColor = parseFloat(D.remaining.replace('£','')) > 0 ? [200,80,20] : [39,174,96];
    doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(100,100,100);
    doc.text(balLabel, PL + 2, y);
    doc.setFont('helvetica','bold'); doc.setTextColor(balColor[0], balColor[1], balColor[2]);
    doc.text(D.remaining, PL + 65, y);
    doc.setDrawColor(220,220,220); doc.setLineWidth(0.2); doc.line(PL, y + 2, PR, y + 2);
    y += 13;

    // ── Flight Details ──────────────────────────────────────────────────────
    if (D.airline || D.outbound || D.inbound) {
      y = sectionHeader('Flight Details', y);
      if (D.airline) y = row('Airline', D.airline, y, false);
      if (D.outbound) y = row('Outbound Flight', D.outbound + (D.outboundTime ? '  @  ' + D.outboundTime : ''), y, false);
      if (D.inbound) y = row('Return Flight', D.inbound + (D.inboundTime ? '  @  ' + D.inboundTime : ''), y, false);
      y += 4;
    }

    // ── Hotel Details ───────────────────────────────────────────────────────
    if (D.hotels && D.hotels.length > 0) {
      y = sectionHeader('Accommodation', y);
      D.hotels.forEach(function(h) {
        if (h.name) y = row('Hotel', h.name, y, true);
        if (h.location) y = row('Location', h.location, y, false);
        if (h.checkIn) y = row('Check-in', h.checkIn, y, false);
        if (h.checkOut) y = row('Check-out', h.checkOut, y, false);
        if (h.conf) y = row('Confirmation No.', h.conf, y, false);
        y += 4;
      });
    }

    // ── Notes ───────────────────────────────────────────────────────────────
    if (D.notes && D.notes.trim()) {
      y = sectionHeader('Notes', y);
      doc.setFont('helvetica','italic');
      doc.setFontSize(9);
      doc.setTextColor(80,80,80);
      var lines = doc.splitTextToSize(D.notes, PR - PL - 4);
      doc.text(lines, PL + 2, y);
      y += lines.length * 5 + 6;
    }

    // ── Footer ──────────────────────────────────────────────────────────────
    var footerY = 280;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(PL, footerY, PR, footerY);
    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    doc.setTextColor(120,120,120);
    doc.text('CB Travel — hello@cbtravel.uk — cbtravel.uk', W/2, footerY + 5, { align:'center' });
    doc.text('This confirmation is subject to our full booking terms & conditions.', W/2, footerY + 10, { align:'center' });
    doc.text('Page 1', PR, footerY + 10, { align:'right' });

    // ── Save ─────────────────────────────────────────────────────────────────
    doc.save('CB-Travel-Booking-' + D.ref + '.pdf');
    setTimeout(function(){ window.close(); }, 800);
  } catch(e) {
    document.body.innerHTML = '<p style="color:white;text-align:center;padding:40px;">Error generating PDF: ' + e.message + '</p>';
  }
});
<\/script>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;';
    document.body.appendChild(iframe);
    iframe.src = url;
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
      setPdfGenerating(false);
    }, 15000);
    // Also reset generating state after a timeout just in case
    setTimeout(() => setPdfGenerating(false), 16000);
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Rich gradient header */}
      <div className={`bg-gradient-to-r ${gradient} p-6 text-white`}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">Booking Reference</p>
            <p className="font-mono font-bold text-2xl">{booking.bookingReference}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={booking.status} />
            <button
              onClick={downloadBookingPDF}
              disabled={pdfGenerating}
              title="Download booking confirmation PDF"
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 disabled:opacity-60"
            >
              {pdfGenerating ? (
                <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full" /> Generating…</>
              ) : (
                <><Download size={12} /> Download Confirmation</>
              )}
            </button>
          </div>
        </div>
        {booking.destination && (
          <p className="text-white/90 font-semibold text-lg flex items-center gap-2 mt-3">
            <MapPin size={16} className="opacity-70" /> {booking.destination}
          </p>
        )}
        <div className="flex flex-wrap gap-3 mt-4">
          {booking.departureDate && (
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">
              <Plane size={11} /> {new Date(booking.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {booking.returnDate && (
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">
              ↩ {new Date(booking.returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {documents && documents.length > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">
              <FileText size={11} /> {documents.length} doc{documents.length !== 1 ? "s" : ""}
            </span>
          )}
          {flightDetails && (
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">
              ✈️ {flightDetails.airline || "Flight added"}
            </span>
          )}
          {hotelDetails && hotelDetails.length > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">
              🏨 {hotelDetails[0].hotelName}
            </span>
          )}
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="p-6">
        {/* Pill-style colorful tab bar */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { value: "overview", label: "Overview", color: "bg-blue-500 text-white", inactive: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
            { value: "details", label: "Details", color: "bg-purple-500 text-white", inactive: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
            { value: "documents", label: "Docs", color: "bg-green-500 text-white", inactive: "bg-green-50 text-green-700 hover:bg-green-100" },
            { value: "checklist", label: "Checklist", color: "bg-orange-500 text-white", inactive: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
            { value: "weather", label: "🌤 Weather", color: "bg-sky-500 text-white", inactive: "bg-sky-50 text-sky-700 hover:bg-sky-100" },
            { value: "flight", label: "✈️ Flight", color: "bg-indigo-500 text-white", inactive: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
            { value: "extras", label: "⚡ Extras", color: "bg-rose-500 text-white", inactive: "bg-rose-50 text-rose-700 hover:bg-rose-100" },
            { value: "party", label: "👥 Travel Party", color: "bg-indigo-500 text-white", inactive: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
            { value: "explore", label: "🗺️ Explore", color: "bg-teal-500 text-white", inactive: "bg-teal-50 text-teal-700 hover:bg-teal-100" },
            { value: "photos", label: "📸 Photos", color: "bg-pink-500 text-white", inactive: "bg-pink-50 text-pink-700 hover:bg-pink-100" },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setSelectedTab(tab.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedTab === tab.value ? tab.color : tab.inactive}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <TabsContent value="overview" className="space-y-4">
          {booking.departureDate && <CountdownTimer departureDate={booking.departureDate} />}

          {booking.postcardSent && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl border border-orange-200 text-sm text-orange-700">
              <span className="text-lg">📬</span>
              <div>
                <span className="font-semibold">Your departure postcard was sent!</span>
                <span className="text-orange-600 text-xs block">Check your email for your pre-trip message from CB Travel.</span>
              </div>
            </div>
          )}
          {!booking.postcardSent && booking.departureDate && (() => {
            const daysUntil = Math.ceil((new Date(booking.departureDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysUntil > 0 && daysUntil <= 7) {
              return (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200 text-sm text-blue-700">
                  <span className="text-lg">✈️</span>
                  <span>Your departure postcard will be emailed to you 24 hours before you fly!</span>
                </div>
              );
            }
            return null;
          })()}

          <div className="grid grid-cols-2 gap-4">
            {booking.departureDate && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-muted-foreground mb-1">Departure</p>
                <p className="font-semibold text-foreground">{new Date(booking.departureDate).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              </div>
            )}
            {booking.returnDate && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-muted-foreground mb-1">Return</p>
                <p className="font-semibold text-foreground">{new Date(booking.returnDate).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <p className="text-xs font-semibold text-green-700 mb-3">Payment Summary</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">Total Price</span>
                <span className="font-bold text-primary">£{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Amount Paid</span>
                <span className="font-bold text-green-600">£{paid.toFixed(2)}</span>
              </div>
              <div className="border-t border-green-200 pt-2 flex justify-between text-sm">
                <span className="font-semibold text-foreground">Balance Due</span>
                <span className={`font-bold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>£{remaining.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-3 h-2 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-green-600" style={{ width: `${total > 0 ? (paid / total) * 100 : 0}%` }} />
            </div>
          </div>

          {/* Trip Tools */}
          <div className="space-y-4">
            {booking.destination && (
              <>
                <WeatherPackingAssistant destination={booking.destination} departureDate={booking.departureDate} />
                <CurrencyConverter destination={booking.destination} />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {flightDetails && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Plane size={16} className="text-blue-600" /> Flight Details</h4>
              <div className="space-y-2 text-sm">
                {flightDetails.airline && <p><span className="text-muted-foreground">Airline:</span> {flightDetails.airline}</p>}
                {flightDetails.outboundFlightNumber && <p><span className="text-muted-foreground">Outbound:</span> {flightDetails.outboundFlightNumber} {flightDetails.outboundDepartureTime && `@ ${flightDetails.outboundDepartureTime}`}</p>}
                {flightDetails.returnFlightNumber && <p><span className="text-muted-foreground">Return:</span> {flightDetails.returnFlightNumber} {flightDetails.returnDepartureTime && `@ ${flightDetails.returnDepartureTime}`}</p>}
              </div>
            </div>
          )}

          {hotelDetails && hotelDetails.length > 0 && (
            <div className="space-y-2">
              {hotelDetails.map((hotel: any) => (
                <div key={hotel.id} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Hotel size={16} className="text-amber-600" /> {hotel.hotelName}</h4>
                  <div className="space-y-1 text-sm">
                    {hotel.destination && <p><span className="text-muted-foreground">Location:</span> {hotel.destination}</p>}
                    {hotel.checkInDate && <p><span className="text-muted-foreground">Check-in:</span> {hotel.checkInDate}</p>}
                    {hotel.checkOutDate && <p><span className="text-muted-foreground">Check-out:</span> {hotel.checkOutDate}</p>}
                    {hotel.confirmationNumber && <p><span className="text-muted-foreground">Confirmation:</span> {hotel.confirmationNumber}</p>}
                    {hotel.phone && <p><span className="text-muted-foreground">Phone:</span> {hotel.phone}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!flightDetails && (!hotelDetails || hotelDetails.length === 0) && (
            <div className="p-8 text-center bg-muted/20 rounded-lg">
              <Briefcase size={32} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Flight and hotel details will appear here once added by CB Travel.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-3">
          {documents && documents.length > 0 ? (
            documents.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border hover:border-primary/40 transition-all">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{doc.documentLabel || doc.documentType.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                {doc.isPasswordProtected ? (
                  <button
                    onClick={() => setDocUnlock({ id: doc.id, url: doc.fileUrl, name: doc.fileName })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors"
                  >
                    <Lock size={12} /> Enter Password
                  </button>
                ) : (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                    <Download size={16} />
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-muted/20 rounded-lg">
              <FileText size={32} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="checklist">
          <ChecklistSection booking={booking} />
        </TabsContent>

        {/* V6: Weather Tab */}
        <TabsContent value="weather" className="space-y-4">
          {booking.destination ? (
            <WeatherWidget destination={booking.destination} />
          ) : (
            <p className="text-muted-foreground text-sm">No destination set for this booking.</p>
          )}
        </TabsContent>

        {/* V6: Flight Status Tab */}
        <TabsContent value="flight" className="space-y-4">
          {booking.flightStatusNumber ? (
            <FlightStatusTracker flightNumber={booking.flightStatusNumber} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-4xl mb-2">✈️</p>
              <p className="text-sm">Flight tracking number not set for this booking.</p>
              <p className="text-xs mt-1">Contact hello@cbtravel.uk to add it.</p>
            </div>
          )}
        </TabsContent>

        {/* V6: Extras Tab — QR Code + SOS + Feedback */}
        <TabsContent value="extras" className="space-y-6">
          {/* QR Code */}
          <QRCodeDisplay bookingId={booking.id} />

          {/* SOS Button for active/confirmed bookings */}
          {(booking.status === "confirmed" || booking.status === "pending") && (
            <SOSButton booking={{ bookingId: booking.id, destination: booking.destination }} />
          )}

          {/* Feedback Form for completed bookings */}
          {booking.status === "completed" && (
            <FeedbackForm bookingId={booking.id} />
          )}
        </TabsContent>

        {/* V7: Travel Party */}
        <TabsContent value="party" className="space-y-4">
          <TravelPartySection booking={booking} currentUser={user} />
        </TabsContent>

        {/* V8: Explore (Things to Do) */}
        <TabsContent value="explore" className="space-y-4">
          {booking.destination ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                  <span className="text-lg">🗺️</span> Top Things to Do in {booking.destination}
                </h3>
              </div>
              {activitiesData && activitiesData.length > 0 ? (
                <div className="space-y-3">
                  {activitiesData.map((activity: any) => (
                    <div key={activity.id} className="flex gap-3 p-3 bg-teal-50 border border-teal-100 rounded-xl">
                      {activity.imageUrl && (
                        <img src={activity.imageUrl} alt={activity.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-foreground">{activity.name}</p>
                          {activity.rating && (
                            <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5 flex-shrink-0">⭐ {parseFloat(activity.rating).toFixed(1)}</span>
                          )}
                        </div>
                        {activity.category && (
                          <p className="text-xs text-teal-600 capitalize mt-0.5">{activity.category}</p>
                        )}
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{activity.description}</p>
                        )}
                        {activity.wikiUrl && (
                          <a href={activity.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary mt-1 inline-block hover:underline">Learn more →</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-teal-50 rounded-xl border border-teal-100">
                  <p className="text-3xl mb-2">🗺️</p>
                  <p className="text-sm font-medium text-foreground">Activity guide coming soon</p>
                  <p className="text-xs text-muted-foreground mt-1">CB Travel will add top things to do at your destination.</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">No destination set for this booking.</div>
          )}
        </TabsContent>

        {/* V8: Photos */}
        <TabsContent value="photos" className="space-y-4">
          {bookingPhotosData && bookingPhotosData.length > 0 ? (
            <>
              <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                <span className="text-lg">📸</span> Hotel &amp; Destination Photos
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {bookingPhotosData.map((photo: any) => (
                  <div key={photo.id} className="group cursor-pointer" onClick={() => setLightboxPhoto(photo.imageUrl)}>
                    <div className="aspect-video rounded-xl overflow-hidden bg-muted/30 relative">
                      <img src={photo.imageUrl} alt={photo.caption || "Photo"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    {photo.caption && <p className="text-xs text-muted-foreground mt-1 truncate px-1">{photo.caption}</p>}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 bg-pink-50 rounded-xl border border-pink-100">
              <p className="text-3xl mb-2">📸</p>
              <p className="text-sm font-medium text-foreground">Photos coming soon</p>
              <p className="text-xs text-muted-foreground mt-1">CB Travel will add photos of your hotel and destination here.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightboxPhoto(null)}>
          <img src={lightboxPhoto} alt="Photo" className="max-w-full max-h-full rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
          <button className="absolute top-4 right-4 text-white text-2xl font-bold" onClick={() => setLightboxPhoto(null)}>✕</button>
        </div>
      )}

      {/* V7: Travel Party tab */}

      {/* Password-protected document unlock modal */}
      {docUnlock && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setDocUnlock(null); setDocPassword(""); } }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Password Protected</h3>
                <p className="text-xs text-muted-foreground truncate max-w-48">{docUnlock.name}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              This document is password protected. Enter the password provided by CB Travel to open it.
            </p>
            <input
              type="password"
              placeholder="Enter document password"
              value={docPassword}
              onChange={(e) => setDocPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDocUnlock()}
              className="w-full border border-input rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleDocUnlock}
                disabled={!docPassword || docChecking}
                className="flex-1 bg-[#1e3a5f] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2d5986] disabled:opacity-50 transition-colors"
              >
                {docChecking ? "Checking…" : "Open Document"}
              </button>
              <button
                onClick={() => { setDocUnlock(null); setDocPassword(""); }}
                className="flex-1 border border-input py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Password was sent in your document email from CB Travel.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export everything so Dashboard and AdminDashboard can import from here
export { StatusBadge, QuoteStatusBadge, CountdownTimer, ChecklistSection, TravelPartySection, getStatusGradient, BookingCard };
