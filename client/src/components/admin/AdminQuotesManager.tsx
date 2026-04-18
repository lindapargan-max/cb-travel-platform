import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, Send, Copy, Trash2, Eye, RefreshCw, X, ChevronDown, ChevronUp,
  FileText, Mail, Phone, MapPin, Calendar, Users, DollarSign, CheckCircle,
  Clock, AlertTriangle, TrendingUp, ExternalLink, Edit2, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminQuote {
  id: number;
  quoteRef: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  userId?: number | null;
  destination?: string | null;
  departureDate?: string | null;
  returnDate?: string | null;
  numberOfTravelers?: number | null;
  hotels?: string | null;
  flightDetails?: string | null;
  keyInclusions?: string | null;
  totalPrice?: string | null;
  pricePerPerson?: string | null;
  priceBreakdown?: string | null;
  notes?: string | null;
  documentUrl?: string | null;
  status: "draft" | "sent" | "viewed" | "accepted" | "expired" | "intake_submitted" | "converted";
  viewCount: number;
  lastViewedAt?: Date | null;
  sentAt?: Date | null;
  acceptedAt?: Date | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface HotelEntry {
  name: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
}

interface FlightEntry {
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  type: string;
}

interface BreakdownEntry {
  label: string;
  amount: string;
}

interface QuoteForm {
  destination: string;
  departureDate: string;
  returnDate: string;
  numberOfTravelers: string;
  hotels: HotelEntry[];
  flights: FlightEntry[];
  keyInclusions: string;
  totalPrice: string;
  pricePerPerson: string;
  breakdown: BreakdownEntry[];
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
  quoteRef?: string;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function QuoteStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-slate-100 text-slate-600 border-slate-200" },
    sent: { label: "Sent", className: "bg-blue-100 text-blue-700 border-blue-200" },
    viewed: { label: "Viewed", className: "bg-amber-100 text-amber-700 border-amber-200" },
    accepted: { label: "Accepted ✓", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    expired: { label: "Expired", className: "bg-red-100 text-red-500 border-red-200" },
    intake_submitted: { label: "Intake Received", className: "bg-purple-100 text-purple-700 border-purple-200" },
    converted: { label: "Converted ✓", className: "bg-emerald-700 text-white border-emerald-700" },
  };
  const s = map[status] || map.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.className}`}>
      {s.label}
    </span>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isActive = stepNum === current;
        return (
          <div key={stepNum} className="flex items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${isDone ? "bg-emerald-500 border-emerald-500 text-white" : ""}
                ${isActive ? "bg-primary border-primary text-white shadow-md" : ""}
                ${!isDone && !isActive ? "bg-white border-slate-200 text-slate-400" : ""}
              `}
            >
              {isDone ? <CheckCircle size={18} /> : stepNum}
            </div>
            {stepNum < total && (
              <div className={`w-16 h-0.5 ${stepNum < current ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Expiry Label ─────────────────────────────────────────────────────────────

function ExpiryLabel({ expiresAt }: { expiresAt?: Date | null }) {
  if (!expiresAt) return null;
  const now = new Date();
  const exp = new Date(expiresAt);
  const diffMs = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    return <span className="text-xs text-amber-600 font-medium">Expires in {diffDays}d</span>;
  } else {
    return <span className="text-xs text-red-500 font-medium">Expired {Math.abs(diffDays)}d ago</span>;
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Loading Shimmer ─────────────────────────────────────────────────────────

function LoadingShimmer() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse bg-slate-100 rounded-2xl h-16" />
      ))}
    </div>
  );
}

// ─── Send Preview Modal ───────────────────────────────────────────────────────

function SendPreviewModal({
  quote,
  onClose,
  onConfirm,
  isSending,
}: {
  quote: AdminQuote;
  onClose: () => void;
  onConfirm: () => void;
  isSending: boolean;
}) {
  const portalUrl = `https://www.travelcb.co.uk/quote/${quote.quoteRef}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold font-serif text-foreground">Send Quote</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Preview before sending</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 border border-border p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail size={14} />
              <span className="font-medium">To:</span>
              <span>{quote.clientEmail}</span>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-sm font-semibold text-foreground mb-1">Subject: Your Tailored Travel Quote – {quote.quoteRef}</p>
              <p className="text-sm text-muted-foreground">Dear {quote.clientName},</p>
              <p className="text-sm text-muted-foreground mt-2">
                We're delighted to share your personalised travel quote
                {quote.destination ? ` for your trip to ${quote.destination}` : ""}.
              </p>
              {quote.totalPrice && (
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Total:</strong> {formatPrice(quote.totalPrice)}
                </p>
              )}
              <div className="mt-3 p-3 bg-primary/10 rounded-lg">
                <p className="text-xs font-semibold text-primary">View your quote online:</p>
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline break-all"
                >
                  {portalUrl}
                </a>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 rounded-xl"
              disabled={isSending}
            >
              {isSending ? (
                <RefreshCw size={15} className="mr-2 animate-spin" />
              ) : (
                <Send size={15} className="mr-2" />
              )}
              Confirm & Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(val: string | null | undefined): string {
  if (!val) return "—";
  const num = parseFloat(val.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return val;
  return `£${num.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(val?: Date | string | null): string {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

// ─── New Quote Modal ──────────────────────────────────────────────────────────

function NewQuoteModal({
  onClose,
  onCreate,
  onSend,
}: {
  onClose: () => void;
  onCreate: (data: QuoteForm, asDraft: boolean) => void;
  onSend: (data: QuoteForm) => void;
}) {
  const [step, setStep] = useState(1);
  const [docParsed, setDocParsed] = useState(false);
  const [docParsing, setDocParsing] = useState(false);
  const [form, setForm] = useState<QuoteForm>({
    destination: "",
    departureDate: "",
    returnDate: "",
    numberOfTravelers: "",
    hotels: [],
    flights: [],
    keyInclusions: "",
    totalPrice: "",
    pricePerPerson: "",
    breakdown: [],
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    notes: "",
    quoteRef: "",
  });

  const resetModal = () => {
    setStep(1);
    setDocParsed(false);
    setDocParsing(false);
    setForm({
      destination: "", departureDate: "", returnDate: "", numberOfTravelers: "",
      hotels: [], flights: [], keyInclusions: "", totalPrice: "", pricePerPerson: "",
      breakdown: [], clientName: "", clientEmail: "", clientPhone: "", notes: "", quoteRef: "",
    });
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocParsing(true);

    const tryExtract = (text: string) => {
      // Simple keyword extraction from text content
      // Destination: look for "destination:", "travelling to", "to:" patterns
      const destMatch = text.match(/(?:destination|travelling to|destination:|to:?)\s*[:\-]?\s*([A-Z][a-zA-Z\s,]+?)(?:\n|,|\.)/i);
      if (destMatch?.[1]?.trim()) setField("destination", destMatch[1].trim().slice(0, 100));

      // Dates: look for departure date patterns
      const depMatch = text.match(/(?:departure|depart|outbound|from)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/i);
      if (depMatch?.[1]) {
        try {
          const d = new Date(depMatch[1]);
          if (!isNaN(d.getTime())) setField("departureDate", d.toISOString().split("T")[0]);
        } catch {}
      }

      const retMatch = text.match(/(?:return|arrival|inbound)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/i);
      if (retMatch?.[1]) {
        try {
          const d = new Date(retMatch[1]);
          if (!isNaN(d.getTime())) setField("returnDate", d.toISOString().split("T")[0]);
        } catch {}
      }

      // Price: look for £ or GBP
      const priceMatch = text.match(/(?:total|price|cost|amount)[:\s£]*(\d[\d,]+(?:\.\d{2})?)/i) || text.match(/£(\d[\d,]+(?:\.\d{2})?)/);
      if (priceMatch?.[1]) setField("totalPrice", priceMatch[1].replace(/,/g, ""));

      // Travellers
      const travMatch = text.match(/(\d+)\s*(?:passenger|travell?er|adult|guest|pax)/i);
      if (travMatch?.[1]) setField("numberOfTravelers", travMatch[1]);

      // Hotel
      const hotelMatch = text.match(/(?:hotel|resort|property|accommodation)[:\s]+([A-Z][a-zA-Z\s&']+?)(?:\n|,|\.)/i);
      if (hotelMatch?.[1]?.trim()) {
        setForm(prev => ({
          ...prev,
          hotels: [{ name: hotelMatch[1].trim().slice(0, 100), checkIn: "", checkOut: "", roomType: "" }],
        }));
      }
    };

    // Try reading as text (works for .txt, sometimes .pdf text layer)
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string || "";
      if (text && text.length > 10) tryExtract(text);
      setDocParsing(false);
      setDocParsed(true);
    };
    reader.onerror = () => {
      setDocParsing(false);
      setDocParsed(true);
    };
    reader.readAsText(file);
  };

  const setField = (key: keyof QuoteForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Hotels
  const addHotel = () =>
    setForm((prev) => ({
      ...prev,
      hotels: [...prev.hotels, { name: "", checkIn: "", checkOut: "", roomType: "" }],
    }));
  const updateHotel = (idx: number, key: keyof HotelEntry, val: string) =>
    setForm((prev) => {
      const updated = [...prev.hotels];
      updated[idx] = { ...updated[idx], [key]: val };
      return { ...prev, hotels: updated };
    });
  const removeHotel = (idx: number) =>
    setForm((prev) => ({ ...prev, hotels: prev.hotels.filter((_, i) => i !== idx) }));

  // Flights
  const addFlight = () =>
    setForm((prev) => ({
      ...prev,
      flights: [
        ...prev.flights,
        { airline: "", flightNumber: "", departure: "", arrival: "", departureTime: "", arrivalTime: "", type: "outbound" },
      ],
    }));
  const updateFlight = (idx: number, key: keyof FlightEntry, val: string) =>
    setForm((prev) => {
      const updated = [...prev.flights];
      updated[idx] = { ...updated[idx], [key]: val };
      return { ...prev, flights: updated };
    });
  const removeFlight = (idx: number) =>
    setForm((prev) => ({ ...prev, flights: prev.flights.filter((_, i) => i !== idx) }));

  // Breakdown
  const addBreakdown = () =>
    setForm((prev) => ({ ...prev, breakdown: [...prev.breakdown, { label: "", amount: "" }] }));
  const updateBreakdown = (idx: number, key: keyof BreakdownEntry, val: string) =>
    setForm((prev) => {
      const updated = [...prev.breakdown];
      updated[idx] = { ...updated[idx], [key]: val };
      return { ...prev, breakdown: updated };
    });
  const removeBreakdown = (idx: number) =>
    setForm((prev) => ({ ...prev, breakdown: prev.breakdown.filter((_, i) => i !== idx) }));

  const stepLabels = ["Quote Details", "Client Details", "Review & Send"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-border max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div>
            <h2 className="text-xl font-bold font-serif text-foreground">New Quote</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{stepLabels[step - 1]}</p>
          </div>
          <button onClick={resetModal} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-6 shrink-0">
          <StepIndicator current={step} total={3} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Document Upload */}
              <div className="rounded-xl border border-dashed border-border bg-slate-50 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <FileText size={18} className="text-primary" />
                  <span className="font-semibold text-sm text-foreground">Upload Quote Document (optional)</span>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                />
                {docParsing && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw size={14} className="animate-spin" />
                    Analysing document…
                  </div>
                )}
                {docParsed && (
                  <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 font-medium">
                    ✅ Document analysed. Please review and edit the extracted details below.
                  </div>
                )}
              </div>

              {/* Core Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    Destination
                  </Label>
                  <Input
                    placeholder="e.g. Maldives, Bora Bora"
                    value={form.destination}
                    onChange={(e) => setField("destination", e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    Departure Date
                  </Label>
                  <Input
                    type="date"
                    value={form.departureDate}
                    onChange={(e) => setField("departureDate", e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    Return Date
                  </Label>
                  <Input
                    type="date"
                    value={form.returnDate}
                    onChange={(e) => setField("returnDate", e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    Number of Travellers
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="2"
                    value={form.numberOfTravelers}
                    onChange={(e) => setField("numberOfTravelers", e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Hotels */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm font-serif text-foreground">Hotels</p>
                  <Button variant="outline" size="sm" onClick={addHotel} className="rounded-lg text-xs gap-1.5">
                    <Plus size={13} /> Add Hotel
                  </Button>
                </div>
                {form.hotels.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No hotels added yet.</p>
                )}
                <div className="space-y-3">
                  {form.hotels.map((hotel, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-slate-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Hotel {idx + 1}</span>
                        <button onClick={() => removeHotel(idx)} className="text-red-400 hover:text-red-600">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Input
                            placeholder="Hotel name"
                            value={hotel.name}
                            onChange={(e) => updateHotel(idx, "name", e.target.value)}
                            className="rounded-lg text-sm"
                          />
                        </div>
                        <Input
                          type="date"
                          placeholder="Check-in"
                          value={hotel.checkIn}
                          onChange={(e) => updateHotel(idx, "checkIn", e.target.value)}
                          className="rounded-lg text-sm"
                        />
                        <Input
                          type="date"
                          placeholder="Check-out"
                          value={hotel.checkOut}
                          onChange={(e) => updateHotel(idx, "checkOut", e.target.value)}
                          className="rounded-lg text-sm"
                        />
                        <div className="col-span-2">
                          <Input
                            placeholder="Room type (e.g. Deluxe Ocean View)"
                            value={hotel.roomType}
                            onChange={(e) => updateHotel(idx, "roomType", e.target.value)}
                            className="rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flights */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm font-serif text-foreground">Flights</p>
                  <Button variant="outline" size="sm" onClick={addFlight} className="rounded-lg text-xs gap-1.5">
                    <Plus size={13} /> Add Flight
                  </Button>
                </div>
                {form.flights.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No flights added yet.</p>
                )}
                <div className="space-y-3">
                  {form.flights.map((flight, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-slate-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Flight {idx + 1}</span>
                        <button onClick={() => removeFlight(idx)} className="text-red-400 hover:text-red-600">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Airline"
                          value={flight.airline}
                          onChange={(e) => updateFlight(idx, "airline", e.target.value)}
                          className="rounded-lg text-sm"
                        />
                        <Input
                          placeholder="Flight number"
                          value={flight.flightNumber}
                          onChange={(e) => updateFlight(idx, "flightNumber", e.target.value)}
                          className="rounded-lg text-sm"
                        />
                        <Input
                          placeholder="Departure airport"
                          value={flight.departure}
                          onChange={(e) => updateFlight(idx, "departure", e.target.value)}
                          className="rounded-lg text-sm"
                        />
                        <Input
                          placeholder="Arrival airport"
                          value={flight.arrival}
                          onChange={(e) => updateFlight(idx, "arrival", e.target.value)}
                          className="rounded-lg text-sm"
                        />
                        <Input
                          type="time"
                          placeholder="Dep. time"
                          value={flight.departureTime}
                          onChange={(e) => updateFlight(idx, "departureTime", e.target.value)}
                          className="rounded-lg text-sm"
                        />
                        <Input
                          type="time"
                          placeholder="Arr. time"
                          value={flight.arrivalTime}
                          onChange={(e) => updateFlight(idx, "arrivalTime", e.target.value)}
                          className="rounded-lg text-sm"
                        />
                        <div className="col-span-2">
                          <select
                            value={flight.type}
                            onChange={(e) => updateFlight(idx, "type", e.target.value)}
                            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="outbound">Outbound</option>
                            <option value="return">Return</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Inclusions */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                  Key Inclusions
                </Label>
                <Textarea
                  placeholder="List what's included in this package…"
                  value={form.keyInclusions}
                  onChange={(e) => setField("keyInclusions", e.target.value)}
                  className="rounded-xl min-h-[80px]"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    Total Price (£)
                  </Label>
                  <Input
                    placeholder="e.g. 4500.00"
                    value={form.totalPrice}
                    onChange={(e) => setField("totalPrice", e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    Price Per Person (£)
                  </Label>
                  <Input
                    placeholder="e.g. 2250.00"
                    value={form.pricePerPerson}
                    onChange={(e) => setField("pricePerPerson", e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm font-serif text-foreground">Price Breakdown</p>
                  <Button variant="outline" size="sm" onClick={addBreakdown} className="rounded-lg text-xs gap-1.5">
                    <Plus size={13} /> Add Item
                  </Button>
                </div>
                {form.breakdown.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No breakdown items added.</p>
                )}
                <div className="space-y-2">
                  {form.breakdown.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        placeholder="Label (e.g. Flights)"
                        value={item.label}
                        onChange={(e) => updateBreakdown(idx, "label", e.target.value)}
                        className="rounded-lg text-sm flex-1"
                      />
                      <Input
                        placeholder="Amount (e.g. 1200.00)"
                        value={item.amount}
                        onChange={(e) => updateBreakdown(idx, "amount", e.target.value)}
                        className="rounded-lg text-sm w-36"
                      />
                      <button onClick={() => removeBreakdown(idx)} className="text-red-400 hover:text-red-600 shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
                <p className="font-semibold mb-0.5">Client Details</p>
                <p className="text-xs text-blue-600">
                  We'll link this quote to their account automatically when they log in.
                </p>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Jane Smith"
                  value={form.clientName}
                  onChange={(e) => setField("clientName", e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="jane@example.com"
                  value={form.clientEmail}
                  onChange={(e) => setField("clientEmail", e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  placeholder="+44 7700 900000"
                  value={form.clientPhone}
                  onChange={(e) => setField("clientPhone", e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                  Internal Notes (optional)
                </Label>
                <Textarea
                  placeholder="Any notes for the team…"
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  className="rounded-xl min-h-[80px]"
                />
              </div>
            </div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Editable Quote Reference */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                  Quote Reference <span className="text-muted-foreground/60 normal-case font-normal">(editable)</span>
                </Label>
                <Input
                  value={form.quoteRef || ""}
                  onChange={(e) => setField("quoteRef", e.target.value.toUpperCase())}
                  placeholder="CBQ-2026-XXXX"
                  className="rounded-xl font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">Auto-generated — you can customise this reference</p>
              </div>
              <div className="rounded-xl border border-border bg-slate-50 p-5 space-y-4">
                <p className="font-semibold font-serif text-foreground">Email Preview</p>
                <div className="text-sm space-y-2 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-primary shrink-0" />
                    <span><strong className="text-foreground">To:</strong> {form.clientEmail || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-primary shrink-0" />
                    <span><strong className="text-foreground">Client:</strong> {form.clientName || "—"}</span>
                  </div>
                  {form.destination && (
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-primary shrink-0" />
                      <span><strong className="text-foreground">Destination:</strong> {form.destination}</span>
                    </div>
                  )}
                  {(form.departureDate || form.returnDate) && (
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-primary shrink-0" />
                      <span>
                        <strong className="text-foreground">Dates:</strong>{" "}
                        {form.departureDate ? formatDate(form.departureDate) : "—"} →{" "}
                        {form.returnDate ? formatDate(form.returnDate) : "—"}
                      </span>
                    </div>
                  )}
                  {form.totalPrice && (
                    <div className="flex items-center gap-2">
                      <DollarSign size={13} className="text-primary shrink-0" />
                      <span><strong className="text-foreground">Total:</strong> {formatPrice(form.totalPrice)}</span>
                    </div>
                  )}
                  {form.hotels.length > 0 && (
                    <div className="flex items-start gap-2">
                      <FileText size={13} className="text-primary shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">Hotels:</strong>{" "}
                        {form.hotels.map((h) => h.name).filter(Boolean).join(", ") || "—"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-700 flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>Once sent, the client will receive an email with a link to their personalised quote portal.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="rounded-xl">
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={resetModal} className="rounded-xl text-muted-foreground">
              Cancel
            </Button>
          )}

          <div className="flex gap-2">
            {step === 3 && (
              <Button
                variant="outline"
                onClick={() => onCreate(form, true)}
                className="rounded-xl"
              >
                Save as Draft
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={() => {
                  if (step === 2 && (!form.clientName || !form.clientEmail)) {
                    toast.error("Please fill in the client's name and email.");
                    return;
                  }
                  setStep((s) => s + 1);
                }}
                className="rounded-xl gap-1.5"
              >
                Continue <ArrowRight size={15} />
              </Button>
            ) : (
              <Button onClick={() => onSend(form)} className="rounded-xl gap-1.5">
                <Send size={15} /> Send Quote
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Quote Modal ─────────────────────────────────────────────────────────

function EditQuoteModal({
  quote,
  onClose,
  onSave,
}: {
  quote: AdminQuote;
  onClose: () => void;
  onSave: (data: Partial<AdminQuote>) => void;
}) {
  const [form, setForm] = useState({
    destination: quote.destination || "",
    departureDate: quote.departureDate || "",
    returnDate: quote.returnDate || "",
    numberOfTravelers: quote.numberOfTravelers?.toString() || "",
    keyInclusions: quote.keyInclusions || "",
    totalPrice: quote.totalPrice || "",
    pricePerPerson: quote.pricePerPerson || "",
    notes: quote.notes || "",
    clientName: quote.clientName,
    clientEmail: quote.clientEmail,
    clientPhone: quote.clientPhone || "",
  });

  const setField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-border max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div>
            <h2 className="text-xl font-bold font-serif text-foreground">Edit Quote</h2>
            <p className="text-sm text-muted-foreground font-mono">{quote.quoteRef}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Client Name</Label>
              <Input value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Client Email</Label>
              <Input type="email" value={form.clientEmail} onChange={(e) => setField("clientEmail", e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Phone</Label>
              <Input value={form.clientPhone} onChange={(e) => setField("clientPhone", e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Destination</Label>
              <Input value={form.destination} onChange={(e) => setField("destination", e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Departure Date</Label>
              <Input type="date" value={form.departureDate} onChange={(e) => setField("departureDate", e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Return Date</Label>
              <Input type="date" value={form.returnDate} onChange={(e) => setField("returnDate", e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Travellers</Label>
              <Input type="number" min={1} value={form.numberOfTravelers} onChange={(e) => setField("numberOfTravelers", e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Total Price (£)</Label>
              <Input value={form.totalPrice} onChange={(e) => setField("totalPrice", e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Price Per Person (£)</Label>
              <Input value={form.pricePerPerson} onChange={(e) => setField("pricePerPerson", e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Key Inclusions</Label>
            <Textarea value={form.keyInclusions} onChange={(e) => setField("keyInclusions", e.target.value)} className="rounded-xl min-h-[70px]" />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} className="rounded-xl min-h-[70px]" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border shrink-0 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={() =>
              onSave({
                clientName: form.clientName,
                clientEmail: form.clientEmail,
                clientPhone: form.clientPhone || null,
                destination: form.destination || null,
                departureDate: form.departureDate || null,
                returnDate: form.returnDate || null,
                numberOfTravelers: form.numberOfTravelers ? parseInt(form.numberOfTravelers) : null,
                keyInclusions: form.keyInclusions || null,
                totalPrice: form.totalPrice || null,
                pricePerPerson: form.pricePerPerson || null,
                notes: form.notes || null,
              })
            }
            className="rounded-xl"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminQuotesManager() {
  const utils = trpc.useUtils();

  const { data: quotes, isLoading, error } = trpc.adminQuotes.list.useQuery();
  const { data: stats } = trpc.adminQuotes.stats.useQuery();

  const convertToBookingMutation = trpc.adminQuotes.convertToBooking.useMutation({
    onSuccess: (data) => {
      if (data.approved) {
        toast.success(`✅ Booking created! Reference: ${data.bookingRef}`);
      } else {
        toast.success('Quote returned to accepted status');
      }
      utils.adminQuotes.list.invalidate();
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });

  const createMutation = trpc.adminQuotes.create.useMutation({
    onSuccess: () => {
      utils.adminQuotes.list.invalidate();
      utils.adminQuotes.stats.invalidate();
      toast.success("Quote created successfully.");
    },
    onError: (e) => toast.error(`Failed to create quote: ${e.message}`),
  });

  const updateMutation = trpc.adminQuotes.update.useMutation({
    onSuccess: () => {
      utils.adminQuotes.list.invalidate();
      toast.success("Quote updated.");
    },
    onError: (e) => toast.error(`Failed to update quote: ${e.message}`),
  });

  const sendMutation = trpc.adminQuotes.send.useMutation({
    onSuccess: () => {
      utils.adminQuotes.list.invalidate();
      utils.adminQuotes.stats.invalidate();
      toast.success("Quote sent successfully!");
      setSendPreviewQuote(null);
    },
    onError: (e) => toast.error(`Failed to send quote: ${e.message}`),
  });

  const resendMutation = trpc.adminQuotes.resend.useMutation({
    onSuccess: () => {
      utils.adminQuotes.list.invalidate();
      toast.success("Quote resent.");
    },
    onError: (e) => toast.error(`Failed to resend: ${e.message}`),
  });

  const duplicateMutation = trpc.adminQuotes.duplicate.useMutation({
    onSuccess: () => {
      utils.adminQuotes.list.invalidate();
      utils.adminQuotes.stats.invalidate();
      toast.success("Quote duplicated.");
    },
    onError: (e) => toast.error(`Failed to duplicate: ${e.message}`),
  });

  const deleteMutation = trpc.adminQuotes.delete.useMutation({
    onSuccess: () => {
      utils.adminQuotes.list.invalidate();
      utils.adminQuotes.stats.invalidate();
      toast.success("Quote deleted.");
    },
    onError: (e) => toast.error(`Failed to delete: ${e.message}`),
  });

  const [showNewModal, setShowNewModal] = useState(false);
  const [editQuote, setEditQuote] = useState<AdminQuote | null>(null);
  const [sendPreviewQuote, setSendPreviewQuote] = useState<AdminQuote | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleCreate = async (form: QuoteForm, asDraft: boolean) => {
    const hotelsJson = form.hotels.length > 0 ? JSON.stringify(form.hotels) : null;
    const flightsJson = form.flights.length > 0 ? JSON.stringify(form.flights) : null;
    const breakdownJson = form.breakdown.length > 0 ? JSON.stringify(form.breakdown) : null;

    await createMutation.mutateAsync({
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      clientPhone: form.clientPhone || null,
      destination: form.destination || null,
      departureDate: form.departureDate || null,
      returnDate: form.returnDate || null,
      numberOfTravelers: form.numberOfTravelers ? parseInt(form.numberOfTravelers) : null,
      hotels: hotelsJson,
      flightDetails: flightsJson,
      keyInclusions: form.keyInclusions || null,
      totalPrice: form.totalPrice || null,
      pricePerPerson: form.pricePerPerson || null,
      priceBreakdown: breakdownJson,
      notes: form.notes || null,
      status: asDraft ? "draft" : "draft",
      quoteRef: form.quoteRef || undefined,
    });

    setShowNewModal(false);
  };

  const handleSendNew = async (form: QuoteForm) => {
    const hotelsJson = form.hotels.length > 0 ? JSON.stringify(form.hotels) : null;
    const flightsJson = form.flights.length > 0 ? JSON.stringify(form.flights) : null;
    const breakdownJson = form.breakdown.length > 0 ? JSON.stringify(form.breakdown) : null;

    const result = await createMutation.mutateAsync({
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      clientPhone: form.clientPhone || null,
      destination: form.destination || null,
      departureDate: form.departureDate || null,
      returnDate: form.returnDate || null,
      numberOfTravelers: form.numberOfTravelers ? parseInt(form.numberOfTravelers) : null,
      hotels: hotelsJson,
      flightDetails: flightsJson,
      keyInclusions: form.keyInclusions || null,
      totalPrice: form.totalPrice || null,
      pricePerPerson: form.pricePerPerson || null,
      priceBreakdown: breakdownJson,
      notes: form.notes || null,
      status: "draft",
      quoteRef: form.quoteRef || undefined,
    });

    if (result?.id) {
      await sendMutation.mutateAsync({ id: result.id });
    }

    setShowNewModal(false);
  };

  const handleDelete = (quote: AdminQuote) => {
    if (!confirm(`Delete quote ${quote.quoteRef} for ${quote.clientName}? This cannot be undone.`)) return;
    deleteMutation.mutate({ id: quote.id });
  };

  const handleDuplicate = (quote: AdminQuote) => {
    duplicateMutation.mutate({ id: quote.id });
  };

  const handleSendExisting = (quote: AdminQuote) => {
    setSendPreviewQuote(quote);
  };

  const handleConfirmSend = () => {
    if (!sendPreviewQuote) return;
    sendMutation.mutate({ id: sendPreviewQuote.id });
  };

  const handleResend = (quote: AdminQuote) => {
    resendMutation.mutate({ id: quote.id });
  };

  const handleUpdate = async (data: Partial<AdminQuote>) => {
    if (!editQuote) return;
    await updateMutation.mutateAsync({ id: editQuote.id, ...data });
    setEditQuote(null);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Quotes</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage tailored travel quotes sent to clients.</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="rounded-xl gap-2 shadow-sm">
          <Plus size={16} />
          New Quote
        </Button>
      </div>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Quotes"
          value={stats?.total ?? "—"}
          icon={<FileText size={20} className="text-slate-600" />}
          color="bg-slate-100"
        />
        <StatCard
          label="Awaiting Response"
          value={stats?.awaitingResponse ?? "—"}
          icon={<Clock size={20} className="text-amber-600" />}
          color="bg-amber-50"
        />
        <StatCard
          label="Accepted"
          value={stats?.accepted ?? "—"}
          icon={<CheckCircle size={20} className="text-emerald-600" />}
          color="bg-emerald-50"
        />
        <StatCard
          label="Conversion Rate"
          value={stats?.conversionRate != null ? `${stats.conversionRate}%` : "—"}
          icon={<TrendingUp size={20} className="text-primary" />}
          color="bg-primary/10"
        />
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Loading */}
        {isLoading && (
          <div className="p-6">
            <LoadingShimmer />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-10 text-center">
            <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Failed to load quotes. Please try again.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && quotes && quotes.length === 0 && (
          <div className="p-16 text-center">
            <FileText size={40} className="text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-semibold font-serif text-foreground mb-1">No quotes yet</p>
            <p className="text-sm text-muted-foreground mb-6">Create your first tailored quote to get started.</p>
            <Button onClick={() => setShowNewModal(true)} className="rounded-xl gap-2">
              <Plus size={15} /> New Quote
            </Button>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && quotes && quotes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/70">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ref</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Destination</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Price</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Created</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote: AdminQuote, idx: number) => {
                  const isExpanded = expandedId === quote.id;
                  const portalUrl = `https://www.travelcb.co.uk/quote/${quote.quoteRef}`;
                  const isSent = quote.status === "sent" || quote.status === "viewed" || quote.status === "accepted" || quote.status === "intake_submitted" || quote.status === "converted";
                  return (
                    <>
                      <tr
                        key={quote.id}
                        className={`border-b border-border hover:bg-slate-50/60 transition-colors animate-[fadeIn_0.3s_ease-in] cursor-pointer
                          ${isExpanded ? "bg-slate-50/80" : ""}
                        `}
                        style={{ animationDelay: `${idx * 30}ms` }}
                        onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                      >
                        {/* Ref */}
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-semibold text-primary">{quote.quoteRef}</span>
                        </td>

                        {/* Client */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-foreground text-sm">{quote.clientName}</p>
                          <p className="text-xs text-muted-foreground">{quote.clientEmail}</p>
                        </td>

                        {/* Destination */}
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span className="text-sm text-foreground">{quote.destination || "—"}</span>
                        </td>

                        {/* Price */}
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <span className="text-sm font-semibold text-foreground">{formatPrice(quote.totalPrice)}</span>
                          {quote.pricePerPerson && (
                            <p className="text-xs text-muted-foreground">{formatPrice(quote.pricePerPerson)} pp</p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <QuoteStatusBadge status={quote.status} />
                            {(quote.status === "sent" || quote.status === "viewed") && (
                              <ExpiryLabel expiresAt={quote.expiresAt} />
                            )}
                          </div>
                        </td>

                        {/* Created */}
                        <td className="px-5 py-4 hidden xl:table-cell text-xs text-muted-foreground">
                          {formatDate(quote.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 justify-end flex-wrap">
                            {/* View Portal */}
                            <a
                              href={portalUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="View Portal"
                              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink size={14} />
                            </a>

                            {/* Send / Resend */}
                            {!isSent ? (
                              <button
                                onClick={() => handleSendExisting(quote)}
                                title="Send Quote"
                                className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-blue-500 hover:text-blue-700"
                                disabled={sendMutation.isPending}
                              >
                                <Send size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleResend(quote)}
                                title="Resend Quote"
                                className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-blue-400 hover:text-blue-600"
                                disabled={resendMutation.isPending}
                              >
                                <RefreshCw size={14} className={resendMutation.isPending ? "animate-spin" : ""} />
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              onClick={() => setEditQuote(quote)}
                              title="Edit"
                              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 size={14} />
                            </button>

                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicate(quote)}
                              title="Duplicate"
                              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-muted-foreground hover:text-foreground"
                              disabled={duplicateMutation.isPending}
                            >
                              <Copy size={14} />
                            </button>

                            {/* Convert to Booking */}
                            {(quote.status === 'accepted' || quote.status === 'intake_submitted') && (
                              <button
                                onClick={() => {
                                  if (confirm(`Convert ${quote.quoteRef} to a booking for ${quote.clientName}?\n\nThis will create a new pending booking linked to this quote.`)) {
                                    convertToBookingMutation.mutate({ id: quote.id, approve: true });
                                  }
                                }}
                                className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center gap-1 whitespace-nowrap"
                                title="Convert to booking"
                              >
                                ✓ Convert to Booking
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(quote)}
                              title="Delete"
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 size={14} />
                            </button>

                            {/* Expand */}
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-muted-foreground"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <tr key={`${quote.id}-expanded`} className="bg-slate-50/60 border-b border-border">
                          <td colSpan={7} className="px-5 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              {/* Travel Info */}
                              <div className="space-y-2">
                                <p className="font-semibold font-serif text-foreground text-xs uppercase tracking-wide mb-2">Travel Info</p>
                                {quote.departureDate && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar size={12} />
                                    <span>{formatDate(quote.departureDate)} → {formatDate(quote.returnDate)}</span>
                                  </div>
                                )}
                                {quote.numberOfTravelers && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users size={12} />
                                    <span>{quote.numberOfTravelers} traveller{quote.numberOfTravelers > 1 ? "s" : ""}</span>
                                  </div>
                                )}
                                {quote.clientPhone && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone size={12} />
                                    <span>{quote.clientPhone}</span>
                                  </div>
                                )}
                              </div>

                              {/* Hotels & Flights */}
                              <div className="space-y-2">
                                <p className="font-semibold font-serif text-foreground text-xs uppercase tracking-wide mb-2">Hotels & Flights</p>
                                {quote.hotels && (() => {
                                  try {
                                    const h = JSON.parse(quote.hotels) as HotelEntry[];
                                    return h.map((hotel, i) => (
                                      <p key={i} className="text-xs text-muted-foreground">
                                        🏨 {hotel.name} ({hotel.roomType || "Room"}) · {formatDate(hotel.checkIn)} – {formatDate(hotel.checkOut)}
                                      </p>
                                    ));
                                  } catch { return null; }
                                })()}
                                {quote.flightDetails && (() => {
                                  try {
                                    const f = JSON.parse(quote.flightDetails) as FlightEntry[];
                                    return f.map((fl, i) => (
                                      <p key={i} className="text-xs text-muted-foreground">
                                        ✈️ {fl.airline} {fl.flightNumber} · {fl.departure} → {fl.arrival} ({fl.type})
                                      </p>
                                    ));
                                  } catch { return null; }
                                })()}
                              </div>

                              {/* Inclusions & Stats */}
                              <div className="space-y-2">
                                <p className="font-semibold font-serif text-foreground text-xs uppercase tracking-wide mb-2">Stats & Inclusions</p>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Eye size={12} />
                                  <span>{quote.viewCount} view{quote.viewCount !== 1 ? "s" : ""}</span>
                                  {quote.lastViewedAt && (
                                    <span className="text-xs">(last: {formatDate(quote.lastViewedAt)})</span>
                                  )}
                                </div>
                                {quote.sentAt && (
                                  <p className="text-xs text-muted-foreground">Sent: {formatDate(quote.sentAt)}</p>
                                )}
                                {quote.keyInclusions && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{quote.keyInclusions}</p>
                                )}
                                {quote.notes && (
                                  <p className="text-xs text-slate-400 italic">{quote.notes}</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showNewModal && (
        <NewQuoteModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreate}
          onSend={handleSendNew}
        />
      )}

      {editQuote && (
        <EditQuoteModal
          quote={editQuote}
          onClose={() => setEditQuote(null)}
          onSave={handleUpdate}
        />
      )}

      {sendPreviewQuote && (
        <SendPreviewModal
          quote={sendPreviewQuote}
          onClose={() => setSendPreviewQuote(null)}
          onConfirm={handleConfirmSend}
          isSending={sendMutation.isPending}
        />
      )}
    </div>
  );
}
