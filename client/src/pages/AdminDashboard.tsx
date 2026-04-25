import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package, FileText, Star, Users, Plus, Edit2, Trash2, Upload,
  CheckCircle2, XCircle, Eye, Mail, Phone, Calendar, MapPin,
  CreditCard, Download, Globe, Plane, BarChart3, TrendingUp, Hotel, Clock, AlertCircle as AlertIcon,
  AlertCircle, RefreshCw, Shield, Lock, UserX, UserCheck, HelpCircle,
  KeyRound, UserPlus, Tag, Copy, Percent, ClipboardList, ExternalLink, ArrowRight,
  ChevronDown, ChevronRight, ChevronLeft, Send, MessageSquare, MailCheck, Ticket, Users2, UserMinus, UserRound,
  Settings, Info, Check, User, CopyPlus, LayoutDashboard, Heart, Bell, Search, SlidersHorizontal, Monitor, MapPinned
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { BookingCard } from "@/components/BookingCard";
import AdminCommandCenter from "@/components/admin/AdminCommandCenter";
import AdminPassportManager from "@/components/admin/AdminPassportManager";
import AdminPaymentPlans from "@/components/admin/AdminPaymentPlans";
import AdminQuotesManager from "@/components/admin/AdminQuotesManager";
import AdminCommunityManager from "@/components/admin/AdminCommunityManager";
import AdminDestinationGuides from "@/components/admin/AdminDestinationGuides";
import AdminNotificationsManager from "@/components/admin/AdminNotificationsManager";
import { useSEO } from '@/hooks/useSEO';

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending:   { label: "Pending",   className: "badge-pending" },
    confirmed: { label: "Confirmed", className: "badge-confirmed" },
    cancelled: { label: "Cancelled", className: "badge-cancelled" },
    completed: { label: "Completed", className: "badge-completed" },
    new:       { label: "New",       className: "badge-new" },
    contacted: { label: "Contacted", className: "badge-contacted" },
    quoted:    { label: "Quoted",    className: "badge-quoted" },
  };
  const c = config[status] || { label: status, className: "badge-new" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.className}`}>{c.label}</span>;
}

// ADD BOOKING MODAL
// ─── LOYALTY RULES SECTION ────────────────────────────────────────────────────

function LoyaltyRulesSection() {
  const { data: rules, refetch } = trpc.loyalty.getLoyaltyRules.useQuery();
  const updateMutation = trpc.loyalty.updateLoyaltyRule.useMutation({
    onSuccess: () => { toast.success('Rule updated!'); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const [editing, setEditing] = useState<Record<number, { points: string; isActive: boolean }>>({});

  const getEdit = (rule: any) => editing[rule.id] ?? { points: String(rule.points), isActive: rule.isActive };

  const handleSave = (rule: any) => {
    const e = getEdit(rule);
    const pts = parseFloat(e.points);
    if (isNaN(pts) || pts < 0) { toast.error('Invalid points value'); return; }
    updateMutation.mutate({ id: rule.id, points: pts, isActive: e.isActive });
    setEditing(prev => { const n = { ...prev }; delete n[rule.id]; return n; });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold">Earn Rules</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure what actions earn loyalty points and how many points each action is worth.</p>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/40 px-5 py-3 border-b border-border">
          <span>Event</span>
          <span className="w-32 text-center">Points</span>
          <span className="w-20 text-center">Active</span>
          <span className="w-20 text-center">Save</span>
        </div>
        {(rules || []).map((rule: any) => {
          const e = getEdit(rule);
          const isDirty = editing[rule.id] !== undefined;
          return (
            <div key={rule.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-0 items-center px-5 py-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
              <div className="min-w-0 pr-4">
                <p className="font-medium text-sm text-foreground">{rule.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                {rule.isPerPound && <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Per £1 spent</span>}
              </div>
              <div className="w-32 flex justify-center">
                <Input
                  type="number"
                  min={0}
                  max={10000}
                  step="any"
                  value={e.points}
                  onChange={ev => setEditing(prev => ({ ...prev, [rule.id]: { ...getEdit(rule), points: ev.target.value } }))}
                  className="rounded-lg text-center w-20 h-8 text-sm"
                />
              </div>
              <div className="w-20 flex justify-center">
                <button
                  onClick={() => setEditing(prev => ({ ...prev, [rule.id]: { ...getEdit(rule), isActive: !e.isActive } }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${e.isActive ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${e.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="w-20 flex justify-center">
                <Button
                  size="sm"
                  variant={isDirty ? 'default' : 'ghost'}
                  className={`rounded-lg h-8 text-xs ${isDirty ? 'btn-gold border-0 text-foreground' : ''}`}
                  disabled={!isDirty || updateMutation.isPending}
                  onClick={() => handleSave(rule)}
                >
                  Save
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-muted/20 p-5">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Info size={15} className="text-muted-foreground" /> How earn rules work</h3>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>Rules marked <span className="font-medium text-foreground">Inactive</span> will not award any points when triggered.</li>
          <li>Set points to <span className="font-medium text-foreground">0</span> to effectively disable a rule without deactivating it.</li>
          <li>The <span className="font-medium text-foreground">Per £1 spent</span> rule awards points × booking value (e.g. 2 pts/£ on a £500 booking = 1,000 points).</li>
          <li>Changes take effect immediately for all future events.</li>
        </ul>
      </div>
    </div>
  );
}

// ─── DUPLICATE BOOKING MODAL ──────────────────────────────────────────────────
function DuplicateBookingModal({ booking, onSuccess }: { booking: any; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    bookingReference: booking.bookingReference ? `${booking.bookingReference}-COPY` : "",
    clientEmail: booking.clientEmail || "",
    destination: booking.destination || "",
    status: "pending" as string,
    departureDate: booking.departureDate || "",
    returnDate: booking.returnDate || "",
    leadPassengerName: booking.leadPassengerName || "",
    leadPassengerEmail: booking.leadPassengerEmail || "",
    leadPassengerPhone: booking.leadPassengerPhone || "",
    leadPassengerDob: booking.leadPassengerDob || "",
    totalPrice: booking.totalPrice ? String(booking.totalPrice) : "",
    amountPaid: "",
    numberOfTravelers: booking.numberOfTravelers ? String(booking.numberOfTravelers) : "",
    notes: booking.notes || "",
  });

  const duplicateMutation = trpc.bookings.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Booking duplicated! ✓");
      setOpen(false);
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    duplicateMutation.mutate({
      sourceBookingId: booking.id,
      bookingReference: form.bookingReference || undefined,
      clientEmail: form.clientEmail || undefined,
      destination: form.destination || undefined,
      status: form.status as any,
      departureDate: form.departureDate || undefined,
      returnDate: form.returnDate || undefined,
      leadPassengerName: form.leadPassengerName || undefined,
      leadPassengerEmail: form.leadPassengerEmail || undefined,
      leadPassengerPhone: form.leadPassengerPhone || undefined,
      leadPassengerDob: form.leadPassengerDob || undefined,
      totalPrice: form.totalPrice || undefined,
      amountPaid: form.amountPaid || undefined,
      numberOfTravelers: form.numberOfTravelers ? parseInt(form.numberOfTravelers) : undefined,
      notes: form.notes || undefined,
      copyFlightDetails: true,
      copyHotelDetails: true,
      copyDocuments: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs text-indigo-600 hover:bg-indigo-50">
          <CopyPlus size={13} /> Duplicate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-t-2xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">Duplicate Booking</p>
              <h2 className="text-white font-serif text-xl font-bold">Copy of {booking.bookingReference}</h2>
            </div>
            <span className="bg-white/15 text-white font-mono text-sm font-bold px-3 py-1.5 rounded-lg border border-white/20">
              {booking.destination || "—"}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5 space-y-5">
          {/* Reference */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2.5 border-b border-border">
              <Copy size={14} className="text-indigo-600" />
              <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Booking Reference</span>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-xs text-muted-foreground">Pre-filled with a suggested reference — edit or leave blank to auto-generate.</p>
              <Input
                placeholder="Leave blank to auto-generate"
                value={form.bookingReference}
                onChange={e => setForm({ ...form, bookingReference: e.target.value.toUpperCase() })}
                className="rounded-xl font-mono uppercase"
              />
            </div>
          </div>

          {/* Client + Lead Passenger */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 bg-purple-50 px-4 py-2.5 border-b border-border">
              <User size={14} className="text-purple-600" />
              <span className="text-xs font-semibold uppercase tracking-wide text-purple-700">Client & Lead Passenger</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">Portal Account Email (links to a user account)</Label>
                <Input
                  type="email"
                  placeholder="client@example.com"
                  value={form.clientEmail}
                  onChange={e => setForm({ ...form, clientEmail: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Lead Passenger Name</Label>
                <Input value={form.leadPassengerName} onChange={e => setForm({ ...form, leadPassengerName: e.target.value })} className="rounded-xl" placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Lead Passenger Email</Label>
                <Input type="email" value={form.leadPassengerEmail} onChange={e => setForm({ ...form, leadPassengerEmail: e.target.value })} className="rounded-xl" placeholder="email@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <Input value={form.leadPassengerPhone} onChange={e => setForm({ ...form, leadPassengerPhone: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                <Input type="date" value={form.leadPassengerDob} onChange={e => setForm({ ...form, leadPassengerDob: e.target.value })} className="rounded-xl" />
              </div>
            </div>
          </div>

          {/* Trip details */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2.5 border-b border-border">
              <Plane size={14} className="text-blue-600" />
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">Trip Details</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">Destination</Label>
                <Input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className="rounded-xl" placeholder="e.g. Maldives" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Departure Date</Label>
                <Input type="date" value={form.departureDate} onChange={e => setForm({ ...form, departureDate: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Return Date</Label>
                <Input type="date" value={form.returnDate} onChange={e => setForm({ ...form, returnDate: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">No. of Travellers</Label>
                <Input type="number" min="1" value={form.numberOfTravelers} onChange={e => setForm({ ...form, numberOfTravelers: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="confirmed">✅ Confirmed</SelectItem>
                    <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                    <SelectItem value="completed">🏁 Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2.5 border-b border-border">
              <CreditCard size={14} className="text-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Pricing</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Total Price (£)</Label>
                <Input type="number" step="0.01" value={form.totalPrice} onChange={e => setForm({ ...form, totalPrice: e.target.value })} className="rounded-xl" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Amount Paid (£)</Label>
                <Input type="number" step="0.01" value={form.amountPaid} onChange={e => setForm({ ...form, amountPaid: e.target.value })} className="rounded-xl" placeholder="0.00" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="rounded-xl resize-none text-sm" rows={2} placeholder="Any notes for this duplicate…" />
          </div>

          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 text-xs text-indigo-700 flex items-start gap-2">
            <Info size={13} className="mt-0.5 flex-shrink-0" />
            <span><strong>Copied from original:</strong> flight details, hotel details, documents. <strong>Not copied:</strong> photos, checklist items, loyalty points.</span>
          </div>

          <Button
            className="w-full rounded-xl btn-gold border-0 text-foreground h-11 text-sm font-semibold gap-2"
            onClick={handleSubmit}
            disabled={duplicateMutation.isPending}
          >
            {duplicateMutation.isPending ? (
              <><div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" /> Creating…</>
            ) : (
              <><CopyPlus size={15} /> Create Duplicate Booking</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function BookingDetailModal({ booking, onClose, onSuccess }: { booking: any; onClose: () => void; onSuccess: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [viewingAsUser, setViewingAsUser] = useState(false);
  const utils = trpc.useUtils();

  const { data: linkedClient, refetch: refetchLinkedClient } = trpc.bookings.getLinkedClient.useQuery(booking.id, {
    retry: false,
  });

  const deleteMutation = trpc.bookings.delete.useMutation({
    onSuccess: () => {
      toast.success("Booking deleted");
      onClose();
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const createAccountMutation = trpc.admin.createUser.useMutation({
    onSuccess: (data) => {
      if ((data as any).alreadyExisted) {
        toast.success("Account found & linked to this booking! ✓");
      } else {
        toast.success("Account created & welcome email sent! 🎉");
      }
      setCreatingAccount(false);
      refetchLinkedClient();
      utils.bookings.getAllAdmin.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreateAccount = () => {
    const email = booking.leadPassengerEmail || booking.clientEmail;
    const name = booking.leadPassengerName || "Valued Client";
    if (!email) return;
    createAccountMutation.mutate({ email, name, phone: booking.leadPassengerPhone || undefined, bookingId: booking.id });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Plane size={18} className="text-primary" />
            Booking {booking.bookingReference}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div className="flex items-center gap-3"><StatusBadge status={booking.status} /><span className="text-sm text-muted-foreground">{booking.destination}</span></div>

          {/* Linked Account Card */}
          {linkedClient ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5 mb-2"><UserCheck size={13} /> Linked Portal Account</p>
              <p className="font-semibold text-sm text-emerald-900">{linkedClient.name}</p>
              <p className="text-sm text-emerald-700">{linkedClient.email}</p>
              {linkedClient.phone && <p className="text-xs text-emerald-600">{linkedClient.phone}</p>}
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-emerald-200">
                <Star size={13} className="text-amber-500" />
                <span className="text-xs text-emerald-700 font-medium">{linkedClient.loyaltyPoints} loyalty points</span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1.5 mb-2"><AlertCircle size={13} /> No Linked Account</p>
              <p className="text-sm text-amber-800 mb-3">This booking isn't linked to a portal account. The client can't see their booking online and won't earn loyalty points.</p>
              {(booking.leadPassengerEmail || booking.clientEmail) ? (
                <Button
                  size="sm"
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  onClick={handleCreateAccount}
                  disabled={createAccountMutation.isPending || creatingAccount}
                >
                  {createAccountMutation.isPending ? "Creating..." : <><UserPlus size={14} /> Create Account & Send Invite</>}
                </Button>
              ) : (
                <p className="text-xs text-amber-600 italic">Add a lead passenger email first (via Edit Booking) to create an account.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lead Passenger</p>
              <p className="font-semibold">{booking.leadPassengerName || "—"}</p>
              <p className="text-sm text-muted-foreground">{booking.leadPassengerEmail}</p>
              <p className="text-sm text-muted-foreground">{booking.leadPassengerPhone}</p>
              {booking.leadPassengerDob && <p className="text-xs text-muted-foreground">DOB: {booking.leadPassengerDob}</p>}
            </div>
            <div className="bg-muted/30 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Travel Details</p>
              <p className="text-sm"><Calendar size={13} className="inline mr-1" />{booking.departureDate} – {booking.returnDate}</p>
              <p className="text-sm"><Users size={13} className="inline mr-1" />{booking.numberOfTravelers} traveller{booking.numberOfTravelers !== 1 ? "s" : ""}</p>
              {booking.totalPrice && <p className="text-sm font-semibold text-primary">£{parseFloat(booking.totalPrice).toFixed(2)} total{booking.amountPaid && ` (£${parseFloat(booking.amountPaid).toFixed(2)} paid)`}</p>}
            </div>
          </div>

          {booking.flightDetails && (
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1"><Plane size={12} /> Flight Details</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-900">
                {booking.flightDetails.outboundFlightNumber && <span>✈️ Out: {booking.flightDetails.outboundFlightNumber}</span>}
                {booking.flightDetails.returnFlightNumber && <span>✈️ Return: {booking.flightDetails.returnFlightNumber}</span>}
                {booking.flightDetails.airline && <span>Airline: {booking.flightDetails.airline}</span>}
                {booking.flightDetails.departureAirport && <span>From: {booking.flightDetails.departureAirport}</span>}
                {booking.flightDetails.arrivalAirport && <span>To: {booking.flightDetails.arrivalAirport}</span>}
                {booking.flightDetails.cabinClass && <span>Class: {booking.flightDetails.cabinClass}</span>}
              </div>
            </div>
          )}

          {booking.hotelDetails && (
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1"><Hotel size={12} /> Hotel Details</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-amber-900">
                {booking.hotelDetails.hotelName && <span>🏨 {booking.hotelDetails.hotelName}</span>}
                {booking.hotelDetails.roomType && <span>Room: {booking.hotelDetails.roomType}</span>}
                {booking.hotelDetails.boardBasis && <span>Board: {booking.hotelDetails.boardBasis}</span>}
                {booking.hotelDetails.starRating && <span>⭐ {booking.hotelDetails.starRating} stars</span>}
              </div>
            </div>
          )}

          {booking.notes && (
            <div className="bg-muted/30 rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-foreground">{booking.notes}</p>
            </div>
          )}

          {/* V8: Hotel Photos */}
          <div className="border border-border rounded-xl p-4">
            <AdminBookingPhotos bookingId={booking.id} />
          </div>

          {/* V8: Things to Do */}
          {booking.destination && (
            <div className="border border-border rounded-xl p-4">
              <AdminThingsToDo destination={booking.destination} />
            </div>
          )}

          <div className="flex gap-2 flex-wrap pt-2 border-t border-border" onClick={e => e.stopPropagation()}>
            <EditBookingModal booking={booking} onSuccess={() => { utils.bookings.getAllAdmin.invalidate(); onClose(); }} />
            <FlightHotelModal booking={booking} onSuccess={() => { utils.bookings.getAllAdmin.invalidate(); onClose(); }} />
            <UploadDocumentModal booking={booking} onSuccess={() => utils.bookings.getAllAdmin.invalidate()} />
            <BookingDocumentsModal booking={booking} onSuccess={() => utils.bookings.getAllAdmin.invalidate()} />
            <TriggerReviewButton booking={booking} />
            <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs text-cyan-600 hover:bg-cyan-50" onClick={() => setViewingAsUser(true)}>
              <User size={13} /> View as User
            </Button>
            <DuplicateBookingModal booking={booking} onSuccess={() => { utils.bookings.getAllAdmin.invalidate(); }} />

            {/* Delete booking */}
            {!confirmDelete ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 gap-2 ml-auto"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={14} /> Delete
              </Button>
            ) : (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-destructive font-medium">Sure? This can't be undone.</span>
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-xl gap-1"
                  onClick={() => deleteMutation.mutate(booking.id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Yes, delete"}
                </Button>
                <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      {/* ── View as User overlay ── */}
      {viewingAsUser && (
        <div className="fixed inset-0 z-[200] bg-black/70 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setViewingAsUser(false); }}>
          <div className="min-h-screen py-8 px-4 flex flex-col items-center">
            <div className="w-full max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Client View Preview</p>
                    <p className="text-white/60 text-xs">{linkedClient?.name || booking.leadPassengerName || "Client"} · {booking.bookingReference}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingAsUser(false)}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                >
                  ✕ Close Preview
                </button>
              </div>
              <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-background rounded-2xl p-4">
                <BookingCard booking={booking} user={linkedClient} />
              </div>
              <p className="text-white/40 text-xs text-center mt-4">This is exactly what the client sees on their dashboard. Changes made in the admin panel reflect here.</p>
            </div>
          </div>
        </div>
      )}
      </DialogContent>
    </Dialog>
  );
}

function AddBookingModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [debouncedClientEmail, setDebouncedClientEmail] = useState("");
  const emailCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: emailCheck } = trpc.bookings.checkClientEmail.useQuery(debouncedClientEmail, {
    enabled: debouncedClientEmail.length > 3 && /\S+@\S+\.\S+/.test(debouncedClientEmail),
    retry: false,
  });

  const [form, setForm] = useState({
    bookingReference: "", clientEmail: "", destination: "", status: "pending",
    departureDate: "", returnDate: "",
    leadPassengerName: "", leadPassengerEmail: "", leadPassengerPhone: "", leadPassengerDob: "",
    totalPrice: "", amountPaid: "", numberOfTravelers: "", notes: "",
  });

  const createMutation = trpc.bookings.create.useMutation({
    onSuccess: () => {
      toast.success("Booking created!");
      setOpen(false);
      setStep(1);
      setForm({ bookingReference: "", clientEmail: "", destination: "", status: "pending", departureDate: "", returnDate: "", leadPassengerName: "", leadPassengerEmail: "", leadPassengerPhone: "", leadPassengerDob: "", totalPrice: "", amountPaid: "", numberOfTravelers: "", notes: "" });
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    createMutation.mutate({
      bookingReference: form.bookingReference || undefined,
      clientEmail: form.clientEmail || undefined,
      destination: form.destination || undefined,
      status: form.status as any,
      departureDate: form.departureDate || undefined,
      returnDate: form.returnDate || undefined,
      leadPassengerName: form.leadPassengerName || undefined,
      leadPassengerEmail: form.leadPassengerEmail || undefined,
      leadPassengerPhone: form.leadPassengerPhone || undefined,
      leadPassengerDob: form.leadPassengerDob || undefined,
      totalPrice: form.totalPrice || undefined,
      amountPaid: form.amountPaid || undefined,
      numberOfTravelers: form.numberOfTravelers ? parseInt(form.numberOfTravelers) : undefined,
      notes: form.notes || undefined,
    });
  };

  const stepLabels = ["Trip Details", "Lead Passenger", "Pricing & Notes"];
  const stepIcons = [MapPin, User, CreditCard];

  const canProceed = () => {
    if (step === 1) return form.destination.trim().length > 0;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep(1); }}>
      <DialogTrigger asChild>
        <Button className="rounded-full btn-gold border-0 text-foreground gap-2"><Plus size={16} /> New Booking</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Create New Booking</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-2">
          {stepLabels.map((label, i) => {
            const num = i + 1;
            const Icon = stepIcons[i];
            const isActive = step === num;
            const isDone = step > num;
            return (
              <React.Fragment key={num}>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {isDone ? <Check size={14} /> : <Icon size={14} />}
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`h-px flex-1 mb-4 transition-colors ${step > num ? 'bg-green-400' : 'bg-border'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step 1 — Trip Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Destination <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Maldives, Dubai, Santorini" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className="rounded-xl" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="confirmed">✅ Confirmed</SelectItem>
                    <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                    <SelectItem value="completed">🏁 Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Number of Travellers</Label>
                <Input type="number" min="1" placeholder="2" value={form.numberOfTravelers} onChange={e => setForm({ ...form, numberOfTravelers: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Departure Date</Label>
                <Input type="date" value={form.departureDate} onChange={e => setForm({ ...form, departureDate: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Return Date</Label>
                <Input type="date" value={form.returnDate} onChange={e => setForm({ ...form, returnDate: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Client Account Email <span className="text-muted-foreground font-normal text-xs">(links booking to a portal account)</span></Label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={form.clientEmail}
                onChange={e => {
                  setForm({ ...form, clientEmail: e.target.value });
                  if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
                  emailCheckTimer.current = setTimeout(() => setDebouncedClientEmail(e.target.value), 600);
                }}
                className="rounded-xl"
              />
              {form.clientEmail && emailCheck && !emailCheck.exists && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                  <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-600" />
                  <span>No account found for this email. The client won't have portal access. You can create an account from the booking detail after saving.</span>
                </div>
              )}
              {form.clientEmail && emailCheck?.exists && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Account found — booking will be linked to <strong>{emailCheck.user?.name}</strong></span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2 — Lead Passenger */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter the details for the primary traveller on this booking.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Full Name</Label>
                <Input placeholder="John Smith" value={form.leadPassengerName} onChange={e => setForm({ ...form, leadPassengerName: e.target.value })} className="rounded-xl" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input type="email" placeholder="john@example.com" value={form.leadPassengerEmail} onChange={e => setForm({ ...form, leadPassengerEmail: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input placeholder="+44 7700 900000" value={form.leadPassengerPhone} onChange={e => setForm({ ...form, leadPassengerPhone: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.leadPassengerDob} onChange={e => setForm({ ...form, leadPassengerDob: e.target.value })} className="rounded-xl" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Pricing & Notes */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Total Price (£)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
                  <Input type="number" placeholder="2,499" value={form.totalPrice} onChange={e => setForm({ ...form, totalPrice: e.target.value })} className="rounded-xl pl-7" autoFocus />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Amount Paid (£)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
                  <Input type="number" placeholder="0" value={form.amountPaid} onChange={e => setForm({ ...form, amountPaid: e.target.value })} className="rounded-xl pl-7" />
                </div>
              </div>
            </div>
            {form.totalPrice && form.amountPaid && parseFloat(form.totalPrice) > 0 && (
              <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm flex items-center justify-between">
                <span className="text-muted-foreground">Outstanding balance</span>
                <span className="font-semibold text-foreground">£{(parseFloat(form.totalPrice) - parseFloat(form.amountPaid || "0")).toFixed(2)}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Booking Reference <span className="text-muted-foreground font-normal text-xs">(auto-generated if left blank)</span></Label>
              <Input placeholder="CBT-MALDIVES25" value={form.bookingReference} onChange={e => setForm({ ...form, bookingReference: e.target.value.toUpperCase() })} className="rounded-xl font-mono uppercase" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Any special requests, internal notes, or reminders..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="rounded-xl resize-none" rows={3} />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
          {step > 1 ? (
            <Button variant="ghost" className="rounded-xl gap-2" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={16} /> Back
            </Button>
          ) : <div />}
          {step < totalSteps ? (
            <Button className="rounded-xl btn-gold border-0 text-foreground gap-2" disabled={!canProceed()} onClick={() => setStep(s => s + 1)}>
              Next <ChevronRight size={16} />
            </Button>
          ) : (
            <Button className="rounded-xl btn-gold border-0 text-foreground gap-2" onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : <><Check size={16} /> Create Booking</>}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// EDIT BOOKING MODAL
function EditBookingModal({ booking, onSuccess }: { booking: any; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ bookingReference: booking.bookingReference || "", status: booking.status || "pending", destination: booking.destination || "", departureDate: booking.departureDate || "", returnDate: booking.returnDate || "", leadPassengerName: booking.leadPassengerName || "", leadPassengerEmail: booking.leadPassengerEmail || "", leadPassengerPhone: booking.leadPassengerPhone || "", leadPassengerDob: booking.leadPassengerDob || "", totalPrice: booking.totalPrice ? String(booking.totalPrice) : "", amountPaid: booking.amountPaid ? String(booking.amountPaid) : "", numberOfTravelers: booking.numberOfTravelers ? String(booking.numberOfTravelers) : "", notes: booking.notes || "" });
  const updateMutation = trpc.bookings.update.useMutation({ onSuccess: () => { toast.success("Booking updated!"); setOpen(false); onSuccess(); }, onError: (e) => toast.error(e.message) });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); updateMutation.mutate({ id: booking.id, bookingReference: form.bookingReference || undefined, status: form.status as any, destination: form.destination || undefined, departureDate: form.departureDate || undefined, returnDate: form.returnDate || undefined, leadPassengerName: form.leadPassengerName || undefined, leadPassengerEmail: form.leadPassengerEmail || undefined, leadPassengerPhone: form.leadPassengerPhone || undefined, leadPassengerDob: form.leadPassengerDob || undefined, totalPrice: form.totalPrice || undefined, amountPaid: form.amountPaid || undefined, numberOfTravelers: form.numberOfTravelers ? parseInt(form.numberOfTravelers) : undefined, notes: form.notes || undefined }); };

  const statusConfig: Record<string, { label: string; dot: string }> = {
    pending:   { label: "Pending",   dot: "bg-amber-400" },
    confirmed: { label: "Confirmed", dot: "bg-emerald-500" },
    cancelled: { label: "Cancelled", dot: "bg-red-500" },
    completed: { label: "Completed", dot: "bg-blue-500" },
  };

  const remaining = form.totalPrice && form.amountPaid
    ? (parseFloat(form.totalPrice) - parseFloat(form.amountPaid)).toFixed(2)
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs"><Edit2 size={13} /> Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5986] rounded-t-2xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">Edit Booking</p>
              <h2 className="text-white font-serif text-xl font-bold">{booking.leadPassengerName || "Guest"}</h2>
            </div>
            <span className="bg-white/15 text-white font-mono text-sm font-bold px-3 py-1.5 rounded-lg border border-white/20">
              {form.bookingReference || "—"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-5">
          {/* Booking Reference + Status Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Booking Reference</Label>
              <Input value={form.bookingReference} onChange={e => setForm({...form, bookingReference: e.target.value.toUpperCase()})} className="rounded-xl font-mono uppercase text-sm" placeholder="e.g. CBT-MALDIVES24" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger className="rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusConfig[form.status]?.dot || "bg-gray-400"}`} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([val, cfg]) => (
                    <SelectItem key={val} value={val}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Trip Details Section */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2.5 border-b border-border">
              <Plane size={14} className="text-blue-600" />
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">Trip Details</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">Destination</Label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} className="rounded-xl pl-8" placeholder="e.g. Maldives" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Departure Date</Label>
                <Input type="date" value={form.departureDate} onChange={e => setForm({...form, departureDate: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Return Date</Label>
                <Input type="date" value={form.returnDate} onChange={e => setForm({...form, returnDate: e.target.value})} className="rounded-xl" />
              </div>
            </div>
          </div>

          {/* Lead Passenger Section */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 bg-purple-50 px-4 py-2.5 border-b border-border">
              <User size={14} className="text-purple-600" />
              <span className="text-xs font-semibold uppercase tracking-wide text-purple-700">Lead Passenger</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <Input value={form.leadPassengerName} onChange={e => setForm({...form, leadPassengerName: e.target.value})} className="rounded-xl" placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email Address</Label>
                <Input type="email" value={form.leadPassengerEmail} onChange={e => setForm({...form, leadPassengerEmail: e.target.value})} className="rounded-xl" placeholder="email@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <Input value={form.leadPassengerPhone} onChange={e => setForm({...form, leadPassengerPhone: e.target.value})} className="rounded-xl" placeholder="+44 7700 000000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                <Input type="date" value={form.leadPassengerDob} onChange={e => setForm({...form, leadPassengerDob: e.target.value})} className="rounded-xl" />
              </div>
            </div>
          </div>

          {/* Financials Section */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2.5 border-b border-border">
              <CreditCard size={14} className="text-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Financials</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Total Price (£)</Label>
                <Input type="number" step="0.01" value={form.totalPrice} onChange={e => setForm({...form, totalPrice: e.target.value})} className="rounded-xl" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Amount Paid (£)</Label>
                <Input type="number" step="0.01" value={form.amountPaid} onChange={e => setForm({...form, amountPaid: e.target.value})} className="rounded-xl" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Balance Due</Label>
                <div className={`h-10 rounded-xl border flex items-center px-3 text-sm font-semibold ${remaining && parseFloat(remaining) > 0 ? "bg-red-50 border-red-200 text-red-700" : remaining !== null ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-muted/40 text-muted-foreground"}`}>
                  {remaining !== null ? `£${remaining}` : "—"}
                </div>
              </div>
              <div className="space-y-1.5 col-span-1">
                <Label className="text-xs text-muted-foreground">No. of Travellers</Label>
                <Input type="number" min="1" value={form.numberOfTravelers} onChange={e => setForm({...form, numberOfTravelers: e.target.value})} className="rounded-xl" placeholder="1" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Internal Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="rounded-xl resize-none text-sm" rows={3} placeholder="Any notes visible only to admins…" />
          </div>

          <Button type="submit" className="w-full rounded-xl btn-gold border-0 text-foreground h-11 text-sm font-semibold" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <><div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin mr-2" /> Saving Changes…</>
            ) : (
              <><Check size={15} className="mr-1.5" /> Save Changes</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// UPLOAD DOCUMENT MODAL
function UploadDocumentModal({ booking, onSuccess }: { booking: any; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState("other");
  const [customLabel, setCustomLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.bookings.uploadDocument.useMutation({
    onSuccess: () => { toast.success("Document uploaded!"); setOpen(false); setFile(null); setCustomLabel(""); setUploading(false); onSuccess(); },
    onError: (e) => { toast.error(e.message); setUploading(false); },
  });
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Please select a file."); return; }
    if (!customLabel.trim()) { toast.error("Please enter a label for this document."); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      uploadMutation.mutate({ bookingId: booking.id, clientId: booking.clientId || undefined, fileName: file.name, fileData: base64, mimeType: file.type, documentType: docType as any, documentLabel: customLabel.trim() });
    };
    reader.readAsDataURL(file);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs"><Upload size={13} /> Upload Doc</Button></DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle className="font-serif text-xl">Upload Document</DialogTitle></DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4">
          <p className="text-sm text-muted-foreground">Booking: <span className="font-mono font-bold text-primary">{booking.bookingReference}</span></p>
          <div className="space-y-1.5">
            <Label>Document Label *</Label>
            <Input
              placeholder="e.g. Booking Confirmation, Flight Ticket, Insurance..."
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              className="rounded-xl"
              required
            />
            <p className="text-xs text-muted-foreground">This label is shown to the client when they view their documents.</p>
          </div>
          <div className="space-y-1.5"><Label>Category</Label><Select value={docType} onValueChange={setDocType}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="booking_confirmation">Booking Confirmation</SelectItem><SelectItem value="itinerary">Itinerary</SelectItem><SelectItem value="invoice">Invoice</SelectItem><SelectItem value="receipt">Receipt</SelectItem><SelectItem value="other">Other / Custom</SelectItem></SelectContent></Select></div>
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors" onClick={() => fileRef.current?.click()}>
            <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
            {file ? <p className="text-sm font-medium text-foreground">{file.name}</p> : <><p className="text-sm font-medium text-foreground">Click to select file</p><p className="text-xs text-muted-foreground mt-1">PDF, images, or documents</p></>}
            <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          </div>
          <Button type="submit" className="w-full rounded-xl btn-gold border-0 text-foreground" disabled={uploading || !file}>{uploading ? "Uploading..." : "Upload Document"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ADD DEAL MODAL
function AddDealModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", destination: "", category: "package_holiday", description: "", price: "", originalPrice: "", duration: "", departureDate: "", imageUrl: "", highlights: "", isFeatured: false });
  const [dealImages, setDealImages] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const handleDealImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (dealImages.length >= 6) return;
      const reader = new FileReader();
      reader.onload = (ev) => setDealImages(prev => prev.length < 6 ? [...prev, ev.target?.result as string] : prev);
      reader.readAsDataURL(file);
    });
  };
  const createMutation = trpc.deals.create.useMutation({ onSuccess: () => { toast.success("Deal created!"); setOpen(false); setForm({ title: "", destination: "", category: "package_holiday", description: "", price: "", originalPrice: "", duration: "", departureDate: "", imageUrl: "", highlights: "", isFeatured: false }); setDealImages([]); onSuccess(); }, onError: (e) => toast.error(e.message) });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!form.title || !form.destination || !form.price) { toast.error("Title, destination, and price are required."); return; } const primaryImage = dealImages[0] || form.imageUrl || undefined; createMutation.mutate({ ...form, category: form.category as any, originalPrice: form.originalPrice || undefined, duration: form.duration || undefined, departureDate: form.departureDate || undefined, imageUrl: primaryImage, images: dealImages.length > 0 ? dealImages : undefined, highlights: form.highlights || undefined }); };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="rounded-full btn-gold border-0 text-foreground gap-2"><Plus size={16} /> Add Deal</Button></DialogTrigger>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-serif text-xl">New Weekly Deal</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2"><Label>Title *</Label><Input placeholder="7 Nights in Santorini" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="rounded-xl" required /></div>
            <div className="space-y-1.5"><Label>Destination *</Label><Input placeholder="Santorini, Greece" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} className="rounded-xl" required /></div>
            <div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onValueChange={v => setForm({...form, category: v})}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="package_holiday">Package Holiday</SelectItem><SelectItem value="cruise">Cruise</SelectItem><SelectItem value="business_travel">Business Travel</SelectItem><SelectItem value="luxury">Luxury</SelectItem><SelectItem value="adventure">Adventure</SelectItem><SelectItem value="city_break">City Break</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
          </div>
          <div className="space-y-1.5"><Label>Description *</Label><Textarea placeholder="Describe this amazing deal..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="rounded-xl resize-none" rows={3} required /></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label>Price pp (£) *</Label><Input type="number" placeholder="999" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="rounded-xl" required /></div>
            <div className="space-y-1.5"><Label>Original Price (£)</Label><Input type="number" placeholder="1299" value={form.originalPrice} onChange={e => setForm({...form, originalPrice: e.target.value})} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Duration</Label><Input placeholder="7 nights" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="rounded-xl" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Departure Date</Label><Input placeholder="e.g. From June 2025" value={form.departureDate} onChange={e => setForm({...form, departureDate: e.target.value})} className="rounded-xl" /></div>
            <div className="space-y-1.5 col-span-2">
              <Label>Images (up to 6) — <span className="text-muted-foreground font-normal">first image is the main photo</span></Label>
              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleDealImageUpload} />
              {dealImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {dealImages.map((img, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden h-20 bg-muted">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      {i === 0 && <span className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">Main</span>}
                      <button type="button" onClick={() => setDealImages(prev => prev.filter((_,j) => j !== i))} className="absolute top-1 right-1 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                    </div>
                  ))}
                </div>
              )}
              <Button type="button" variant="outline" className="rounded-xl w-full" onClick={() => imageInputRef.current?.click()} disabled={dealImages.length >= 6}>
                <Upload size={14} className="mr-2" /> {dealImages.length === 0 ? "Upload Images" : `Add More (${dealImages.length}/6)`}
              </Button>
              {dealImages.length === 0 && <Input placeholder="Or paste image URL: https://..." value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="rounded-xl mt-1.5" />}
            </div>
          </div>
          <div className="space-y-1.5"><Label>Highlights</Label><Textarea placeholder="Comma-separated highlights..." value={form.highlights} onChange={e => setForm({...form, highlights: e.target.value})} className="rounded-xl resize-none" rows={2} /></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="featured" checked={form.isFeatured} onChange={e => setForm({...form, isFeatured: e.target.checked})} className="rounded" /><Label htmlFor="featured" className="cursor-pointer">Mark as featured deal</Label></div>
          <Button type="submit" className="w-full rounded-xl btn-gold border-0 text-foreground" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Deal"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ADD TESTIMONIAL MODAL
function AddTestimonialModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ clientName: "", destination: "", title: "", content: "", rating: "5" });
  const createMutation = trpc.testimonials.create.useMutation({ onSuccess: () => { toast.success("Testimonial added!"); setOpen(false); setForm({ clientName: "", destination: "", title: "", content: "", rating: "5" }); onSuccess(); }, onError: (e) => toast.error(e.message) });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate({ ...form, rating: parseInt(form.rating) }); };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="rounded-full btn-gold border-0 text-foreground gap-2"><Plus size={16} /> Add Review</Button></DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader><DialogTitle className="font-serif text-xl">Add Client Testimonial</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Client Name *</Label><Input placeholder="Sarah Johnson" value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} className="rounded-xl" required /></div>
            <div className="space-y-1.5"><Label>Destination *</Label><Input placeholder="Maldives" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} className="rounded-xl" required /></div>
          </div>
          <div className="space-y-1.5"><Label>Review Title *</Label><Input placeholder="An unforgettable experience" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="rounded-xl" required /></div>
          <div className="space-y-1.5"><Label>Review Content *</Label><Textarea placeholder="The client's experience..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="rounded-xl resize-none" rows={4} required /></div>
          <div className="space-y-1.5"><Label>Rating</Label><Select value={form.rating} onValueChange={v => setForm({...form, rating: v})}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{[5,4,3,2,1].map(r => <SelectItem key={r} value={String(r)}>{r} Stars</SelectItem>)}</SelectContent></Select></div>
          <Button type="submit" className="w-full rounded-xl btn-gold border-0 text-foreground" disabled={createMutation.isPending}>{createMutation.isPending ? "Adding..." : "Add Testimonial"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// CREATE USER MODAL (GDPR-compliant: no plaintext password — user receives secure set-password link)
function CreateUserModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", phone: "", role: "user" });
  const createMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success("Account created! A secure password-setup link has been emailed to the user.");
      setOpen(false);
      setForm({ email: "", name: "", phone: "", role: "user" });
      onSuccess();
    },
    onError: (e) => toast.error(e.message)
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.name) { toast.error("Email and name are required."); return; }
    createMutation.mutate({ email: form.email, name: form.name, phone: form.phone || undefined, role: form.role as any });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="rounded-full btn-gold border-0 text-foreground gap-2"><UserPlus size={16} /> Create Account</Button></DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle className="font-serif text-xl">Create New Account</DialogTitle></DialogHeader>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 flex items-start gap-2">
          <Shield size={14} className="flex-shrink-0 mt-0.5" />
          <span>GDPR compliant — no password is required here. The user will receive a secure link by email to set their own password.</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label>Full Name *</Label><Input placeholder="Jane Smith" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="rounded-xl" required /></div>
          <div className="space-y-1.5"><Label>Email Address *</Label><Input type="email" placeholder="jane@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-xl" required /></div>
          <div className="space-y-1.5"><Label>Phone Number</Label><Input placeholder="+44 7700 900000" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="rounded-xl" /></div>
          <div className="space-y-1.5"><Label>Role</Label><Select value={form.role} onValueChange={v => setForm({...form, role: v})}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">Client / User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div>
          <Button type="submit" className="w-full rounded-xl btn-gold border-0 text-foreground" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Account & Send Invite"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// CHANGE PASSWORD MODAL
function ChangePasswordModal({ user, onSuccess }: { user: any; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const changeMutation = trpc.admin.changePassword.useMutation({ onSuccess: () => { toast.success("Password changed!"); setOpen(false); setPassword(""); setConfirm(""); onSuccess(); }, onError: (e) => toast.error(e.message) });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; } if (password !== confirm) { toast.error("Passwords do not match."); return; } changeMutation.mutate({ id: user.id, newPassword: password }); };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs text-blue-600 hover:bg-blue-50"><KeyRound size={13} /> Password</Button></DialogTrigger>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle className="font-serif text-xl">Change Password</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Changing password for <strong>{user.name || user.email}</strong></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label>New Password</Label><Input type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} className="rounded-xl" required minLength={8} /></div>
          <div className="space-y-1.5"><Label>Confirm Password</Label><Input type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} className="rounded-xl" required /></div>
          <Button type="submit" className="w-full rounded-xl btn-gold border-0 text-foreground" disabled={changeMutation.isPending}>{changeMutation.isPending ? "Saving..." : "Update Password"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// SEND SET-PASSWORD LINK MODAL
function SendSetPasswordLinkModal({ user, onSuccess }: { user: any; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { data: linkStatus, refetch } = trpc.admin.getSetPasswordLinkStatus.useQuery(user.id, { enabled: open });
  const sendLink = trpc.admin.sendSetPasswordLink.useMutation({
    onSuccess: () => { toast.success("Password setup link sent!"); refetch(); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const fmtDate = (d: Date | string | null | undefined) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs text-purple-600 hover:bg-purple-50"><ExternalLink size={13} /> Send Link</Button></DialogTrigger>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle className="font-serif text-xl">Password Setup Link</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Send <strong>{user.name || user.email}</strong> a secure link to set their own password. The link expires after 24 hours.</p>
          {linkStatus !== undefined && (
            <div className="rounded-xl border border-border bg-slate-50 p-3 space-y-1.5 text-sm">
              {linkStatus.generatedAt ? (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground"><Clock size={13} /><span>Generated: <span className="text-foreground font-medium">{fmtDate(linkStatus.generatedAt)}</span></span></div>
                  <div className="flex items-center gap-2">
                    {linkStatus.usedAt
                      ? <><CheckCircle2 size={13} className="text-green-600" /><span className="text-green-700 font-medium">Used on {fmtDate(linkStatus.usedAt)}</span></>
                      : <><Clock size={13} className="text-amber-500" /><span className="text-amber-700 font-medium">Not yet used</span></>
                    }
                  </div>
                </>
              ) : <p className="text-muted-foreground italic">No link has been sent yet.</p>}
            </div>
          )}
          <Button className="w-full rounded-xl btn-gold border-0 text-foreground" onClick={() => sendLink.mutate({ userId: user.id })} disabled={sendLink.isPending}>
            {sendLink.isPending ? "Sending..." : linkStatus?.generatedAt ? "Send New Link" : "Send Setup Link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// FAQ ITEM MODAL
function FaqItemModal({ item, onSuccess }: { item?: any; onSuccess: () => void }) {
  const isEdit = !!item;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: item?.category || "General", question: item?.question || "", answer: item?.answer || "", sortOrder: item?.sortOrder !== undefined ? String(item.sortOrder) : "0", isActive: item?.isActive !== undefined ? item.isActive : true });
  const createMutation = trpc.faq.create.useMutation({ onSuccess: () => { toast.success("FAQ item added!"); setOpen(false); onSuccess(); }, onError: (e) => toast.error(e.message) });
  const updateMutation = trpc.faq.update.useMutation({ onSuccess: () => { toast.success("FAQ item updated!"); setOpen(false); onSuccess(); }, onError: (e) => toast.error(e.message) });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!form.category || !form.question || !form.answer) { toast.error("Category, question and answer are required."); return; } if (isEdit) { updateMutation.mutate({ id: item.id, category: form.category, question: form.question, answer: form.answer, sortOrder: parseInt(form.sortOrder) || 0, isActive: form.isActive }); } else { createMutation.mutate({ category: form.category, question: form.question, answer: form.answer, sortOrder: parseInt(form.sortOrder) || 0 }); } };
  const isPending = createMutation.isPending || updateMutation.isPending;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{isEdit ? <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs"><Edit2 size={13} /> Edit</Button> : <Button className="rounded-full btn-gold border-0 text-foreground gap-2"><Plus size={16} /> Add FAQ</Button>}</DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-serif text-xl">{isEdit ? "Edit FAQ Item" : "Add FAQ Item"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Category *</Label><Input placeholder="e.g. Booking, Payments" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="rounded-xl" required /></div>
            <div className="space-y-1.5"><Label>Sort Order</Label><Input type="number" min="0" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: e.target.value})} className="rounded-xl" /></div>
          </div>
          <div className="space-y-1.5"><Label>Question *</Label><Input placeholder="What is your cancellation policy?" value={form.question} onChange={e => setForm({...form, question: e.target.value})} className="rounded-xl" required /></div>
          <div className="space-y-1.5"><Label>Answer *</Label><Textarea placeholder="Our cancellation policy..." value={form.answer} onChange={e => setForm({...form, answer: e.target.value})} className="rounded-xl resize-none" rows={5} required /></div>
          {isEdit && (<div className="flex items-center gap-2"><input type="checkbox" id="faqActive" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="rounded" /><Label htmlFor="faqActive" className="cursor-pointer">Active (visible on FAQ page)</Label></div>)}
          <Button type="submit" className="w-full rounded-xl btn-gold border-0 text-foreground" disabled={isPending}>{isPending ? "Saving..." : isEdit ? "Save Changes" : "Add FAQ Item"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// QUOTES LIST WITH EXPANDABLE CARDS
function QuotesList({ quotes, updateQuoteStatus }: { quotes: any[]; updateQuoteStatus: any }) {
  const [expandedQuoteId, setExpandedQuoteId] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {quotes.map((q: any) => {
        const isExpanded = expandedQuoteId === q.id;
        return (
          <div key={q.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div
              className="p-5 cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => setExpandedQuoteId(isExpanded ? null : q.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {isExpanded ? <ChevronDown size={15} className="text-muted-foreground shrink-0" /> : <ChevronRight size={15} className="text-muted-foreground shrink-0" />}
                    <p className="font-semibold text-foreground">{q.name}</p>
                    <StatusBadge status={q.status} />
                    {q.quoteType === "price_match" && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">Price Match</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground ml-5">
                    <span className="flex items-center gap-1"><Mail size={11} />{q.email}</span>
                    {q.phone && <span className="flex items-center gap-1"><Phone size={11} />{q.phone}</span>}
                    {q.destination && <span className="flex items-center gap-1"><MapPin size={11} />{q.destination}</span>}
                    <span className="flex items-center gap-1"><Calendar size={11} />{new Date(q.createdAt).toLocaleDateString("en-GB")}</span>
                  </div>
                </div>
                <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <Select value={q.status} onValueChange={v => updateQuoteStatus.mutate({ id: q.id, status: v as any })}>
                    <SelectTrigger className="rounded-xl text-xs h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {isExpanded && (
              <div className="border-t border-border px-5 pb-5 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {q.travelType && <div><span className="text-muted-foreground text-xs">Travel Type:</span> <span className="font-medium">{q.travelType}</span></div>}
                  {q.departureDate && <div><span className="text-muted-foreground text-xs">Departure:</span> <span className="font-medium">{q.departureDate}</span></div>}
                  {q.returnDate && <div><span className="text-muted-foreground text-xs">Return:</span> <span className="font-medium">{q.returnDate}</span></div>}
                  {q.numberOfTravellers && <div><span className="text-muted-foreground text-xs">Travellers:</span> <span className="font-medium">{q.numberOfTravellers}</span></div>}
                  {q.budget && <div><span className="text-muted-foreground text-xs">Budget:</span> <span className="font-medium">{q.budget}</span></div>}
                </div>
                {q.message && (
                  <div className="bg-muted/20 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1 font-semibold">Message:</p>
                    <p className="text-sm text-foreground italic">"{q.message}"</p>
                  </div>
                )}
                {q.screenshotUrl && (
                  <a href={q.screenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <Eye size={11} /> View uploaded quote screenshot
                  </a>
                )}
                <ReplyEmailButton quote={q} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// REPLY VIA EMAIL BUTTON FOR QUOTES
function ReplyEmailButton({ quote }: { quote: any }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(`Re: Your Quote Request - ${quote.destination || 'CB Travel'}`);
  const [message, setMessage] = useState('');
  const sendEmail = trpc.admin.sendEmail.useMutation({
    onSuccess: () => { toast.success('Email sent!'); setOpen(false); setMessage(''); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
          <Send size={12} /> Reply via Email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle className="font-serif text-xl">Reply to {quote.name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>To</Label>
            <Input value={quote.email} readOnly className="rounded-xl bg-muted/30" />
          </div>
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your reply..."
              className="rounded-xl resize-none"
              rows={6}
            />
          </div>
          <Button
            className="w-full rounded-xl btn-gold border-0 text-foreground gap-2"
            disabled={!message || sendEmail.isPending}
            onClick={() => sendEmail.mutate({ to: quote.email, subject, message, clientName: quote.name })}
          >
            <Send size={14} /> {sendEmail.isPending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// SEND EMAIL MODAL (for accounts tab)
function SendEmailModal({ recipient }: { recipient: any }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const sendEmail = trpc.admin.sendEmail.useMutation({
    onSuccess: () => { toast.success('Email sent!'); setOpen(false); setSubject(''); setMessage(''); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs text-purple-600 hover:bg-purple-50">
          <Send size={13} /> Email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle className="font-serif text-xl">Send Email to {recipient.name || recipient.email}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>To</Label>
            <Input value={recipient.email} readOnly className="rounded-xl bg-muted/30" />
          </div>
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Message from CB Travel" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your message..."
              className="rounded-xl resize-none"
              rows={5}
            />
          </div>
          <Button
            className="w-full rounded-xl btn-gold border-0 text-foreground gap-2"
            disabled={!subject || !message || sendEmail.isPending}
            onClick={() => sendEmail.mutate({ to: recipient.email, subject, message, clientName: recipient.name })}
          >
            <Send size={14} /> {sendEmail.isPending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// TRIGGER REVIEW FLOW BUTTON
function TriggerReviewButton({ booking }: { booking: any }) {
  const [open, setOpen] = useState(false);
  const trigger = trpc.reviews.adminTriggerReviewFlow.useMutation({
    onSuccess: () => { toast.success(`Review flow triggered for ${booking.leadPassengerName || booking.destination}! 📧`); setOpen(false); },
    onError: (e) => toast.error(e.message || 'Failed to trigger review flow'),
  });
  return (
    <>
      <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs text-emerald-700 hover:bg-emerald-50" onClick={() => setOpen(true)}>
        <Star size={13} /> Trigger Review
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="font-serif text-xl">Trigger Review Flow</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>This will send a post-holiday thank-you email to the client inviting them to leave feedback and a review.</p>
            <div className="bg-muted/40 rounded-xl p-3 space-y-1">
              <p><span className="font-semibold text-foreground">Booking:</span> {booking.bookingReference}</p>
              <p><span className="font-semibold text-foreground">Destination:</span> {booking.destination}</p>
              <p><span className="font-semibold text-foreground">Client:</span> {booking.leadPassengerName}</p>
              <p><span className="font-semibold text-foreground">Email:</span> {booking.leadPassengerEmail}</p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              disabled={trigger.isPending}
              onClick={() => trigger.mutate({ bookingId: booking.id })}
            >
              {trigger.isPending ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</> : <><Star size={13} /> Send Email</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// POSTCARD PREVIEW + SEND BUTTON
function SendPostcardButton({ bookingId, booking, postcardSent, onSuccess }: { bookingId: number; booking: any; postcardSent: boolean; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const sendPostcard = trpc.admin.sendPostcard.useMutation({
    onSuccess: () => { toast.success('Postcard sent! 📬'); setOpen(false); onSuccess(); },
    onError: (e) => toast.error(e.message || 'Failed to send postcard'),
  });

  const destination = booking?.destination || 'Your Destination';
  const passengerName = booking?.leadPassengerName || 'Traveller';
  const departureDate = booking?.departureDate ? new Date(booking.departureDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const returnDate = booking?.returnDate ? new Date(booking.returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const ref = booking?.bookingReference || '';

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={`rounded-lg gap-1 text-xs ${postcardSent ? 'text-green-600 hover:bg-green-50' : 'text-blue-600 hover:bg-blue-50'}`}
        onClick={() => setOpen(true)}
        title={postcardSent ? 'Postcard sent — click to preview/resend' : 'Preview & send digital postcard'}
      >
        {postcardSent ? <MailCheck size={13} /> : <Mail size={13} />}
        {postcardSent ? 'Resend Postcard' : 'Send Postcard'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Digital Postcard Preview</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">This is what the client will receive by email.</p>

          {/* Postcard Preview */}
          <div className="rounded-2xl overflow-hidden border border-border shadow-lg">
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-rose-500 p-6 text-white text-center relative">
              <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">✈️ CB Travel</p>
              <h2 className="text-2xl font-bold mb-0.5">Your adventure awaits!</h2>
              <p className="text-sm opacity-90">Time to pack your bags, {passengerName.split(' ')[0]}! 🌍</p>
            </div>

            {/* Destination card */}
            <div className="bg-white p-5 space-y-4">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1">Your Destination</p>
                <p className="text-2xl font-bold text-foreground">{destination} 🌴</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {departureDate && (
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground font-medium mb-1">✈️ Departing</p>
                    <p className="text-sm font-semibold text-foreground">{departureDate}</p>
                  </div>
                )}
                {returnDate && (
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground font-medium mb-1">🏠 Returning</p>
                    <p className="text-sm font-semibold text-foreground">{returnDate}</p>
                  </div>
                )}
              </div>

              {ref && (
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                  <span>Booking Reference</span>
                  <span className="font-mono font-bold text-primary">{ref}</span>
                </div>
              )}

              <div className="bg-primary/5 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">Log into your <strong>CB Travel</strong> portal to view your full itinerary, documents, and more.</p>
              </div>
            </div>
          </div>

          {postcardSent && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
              <MailCheck size={14} /> Postcard was already sent to this client.
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              className="flex-1 rounded-xl btn-gold border-0 text-foreground gap-2"
              disabled={sendPostcard.isPending}
              onClick={() => sendPostcard.mutate({ bookingId })}
            >
              {sendPostcard.isPending ? (
                <><div className="w-3 h-3 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" /> Sending...</>
              ) : (
                <><Send size={14} /> {postcardSent ? 'Resend Postcard' : 'Send Postcard'}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// COMPOSE EMAIL SECTION (for emails tab)
function ComposeEmailSection({ allUsers }: { allUsers: any[] }) {
  const [useManual, setUseManual] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const sendEmail = trpc.admin.sendEmail.useMutation({
    onSuccess: () => { toast.success('Email sent successfully!'); setSubject(''); setMessage(''); setManualEmail(''); setSelectedUserId(''); setClientName(''); },
    onError: (e) => toast.error(e.message),
  });
  const selectedUser = allUsers?.find((u: any) => String(u.id) === selectedUserId);
  const recipientEmail = useManual ? manualEmail : selectedUser?.email || '';
  const recipientName = useManual ? clientName : selectedUser?.name || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-xl font-semibold">Email Composer</h2>
        <span className="text-xs text-muted-foreground flex items-center gap-1.5"><MessageSquare size={12} /> Sent via CB Travel</span>
      </div>
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <input type="checkbox" id="manualEmail" checked={useManual} onChange={e => setUseManual(e.target.checked)} className="rounded" />
          <Label htmlFor="manualEmail" className="cursor-pointer text-sm">Enter email address manually</Label>
        </div>
        {useManual ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Email Address *</Label>
              <Input type="email" placeholder="client@example.com" value={manualEmail} onChange={e => setManualEmail(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Recipient Name</Label>
              <Input placeholder="Client Name" value={clientName} onChange={e => setClientName(e.target.value)} className="rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>Recipient *</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a client..." /></SelectTrigger>
              <SelectContent>
                {allUsers?.filter((u: any) => u.email).map((u: any) => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.name ? `${u.name} (${u.email})` : u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Subject *</Label>
          <Input placeholder="Message from CB Travel" value={subject} onChange={e => setSubject(e.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>Message *</Label>
          <Textarea
            placeholder="Write your message here..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="rounded-xl resize-none"
            rows={8}
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail size={12} /> Emails are sent via CB Travel using noreply@travelcb.co.uk</p>
          <Button
            className="rounded-xl btn-gold border-0 text-foreground gap-2"
            disabled={!recipientEmail || !subject || !message || sendEmail.isPending}
            onClick={() => sendEmail.mutate({ to: recipientEmail, subject, message, clientName: recipientName || undefined })}
          >
            <Send size={14} /> {sendEmail.isPending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── GDPR ADMIN SECTION ───────────────────────────────────────────────────
function GdprAdminSection() {
  const { data: requests, refetch } = trpc.gdpr.listRequests.useQuery();
  const { data: counts } = trpc.gdpr.getRequestCounts.useQuery();
  const updateStatus = trpc.gdpr.updateRequestStatus.useMutation({
    onSuccess: () => { toast.success("Request updated"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteRequest = trpc.gdpr.deleteRequest.useMutation({
    onSuccess: () => { toast.success("Request deleted"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [exportingEmail, setExportingEmail] = useState<string | null>(null);
  const sarPrintWinRef = React.useRef<Window | null>(null);

  const { data: sarData, isFetching: sarLoading } = trpc.gdpr.getDataForEmail.useQuery(
    { email: exportingEmail || "" },
    { enabled: !!exportingEmail }
  );

  const filtered = (requests || []).filter((r: any) => filter === "all" || r.status === filter);

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    in_progress: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
  };

  const typeColors: Record<string, string> = {
    SAR: "bg-purple-100 text-purple-800",
    erasure: "bg-red-100 text-red-800",
    complaint: "bg-orange-100 text-orange-800",
  };

  // Generate branded PDF for SAR data
  const generateSarPdf = (data: any, printWin: Window) => {

    const bookingRows = (data.bookings || []).map((b: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:13px;">${b.bookingReference || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${b.destination || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${b.departureDate || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${b.status || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${b.leadPassengerName || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">£${b.totalPrice ? parseFloat(b.totalPrice).toFixed(2) : "0.00"}</td>
      </tr>
    `).join("");

    const loyaltyRows = (data.loyaltyPoints || []).map((lp: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${lp.reason || lp.description || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${lp.points || 0}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${lp.createdAt ? new Date(lp.createdAt).toLocaleDateString("en-GB") : "—"}</td>
      </tr>
    `).join("");

    const enquiryRows = (data.enquiries || []).map((e: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${e.subject || e.destination || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${e.status || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-GB") : "—"}</td>
      </tr>
    `).join("");

    const profile = data.profile;

    const html = `<!DOCTYPE html>
<html><head><title>CB Travel — Subject Access Request Data Export</title>
<style>
  @page { margin: 20mm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; line-height: 1.6; }
  .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5986 100%); padding: 40px; text-align: center; }
  .header h1 { color: #d4af37; font-size: 28px; font-weight: 700; letter-spacing: 2px; margin-bottom: 4px; }
  .header p { color: rgba(255,255,255,0.8); font-size: 13px; }
  .gold-bar { height: 4px; background: linear-gradient(90deg, #d4af37, #f0d060, #d4af37); }
  .content { padding: 30px 40px; }
  .section { margin-bottom: 30px; }
  .section-title { font-size: 16px; font-weight: 700; color: #1e3a5f; border-bottom: 2px solid #d4af37; padding-bottom: 6px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .info-item { display: flex; gap: 8px; }
  .info-label { color: #6b7280; font-size: 13px; min-width: 120px; }
  .info-value { font-weight: 600; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f0f4f8; color: #1e3a5f; padding: 10px 12px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-account { background: #d1fae5; color: #065f46; }
  .badge-no-account { background: #fef3c7; color: #92400e; }
  .footer { background: #f8f9fa; border-top: 1px solid #e5e7eb; padding: 20px 40px; text-align: center; font-size: 11px; color: #6b7280; }
  .footer strong { color: #1e3a5f; }
  .watermark { color: #e5e7eb; font-size: 10px; text-align: center; margin-top: 10px; }
  .empty-state { background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 8px; padding: 20px; text-align: center; color: #9ca3af; font-size: 13px; }
</style></head><body>

<div class="header">
  <h1>✈ CB TRAVEL</h1>
  <p>Subject Access Request — Data Export</p>
</div>
<div class="gold-bar"></div>

<div class="content">
  <div class="section">
    <div class="section-title">Request Information</div>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">Data Controller:</span><span class="info-value">Corron Barnes T/A CB Travel</span></div>
      <div class="info-item"><span class="info-label">Website:</span><span class="info-value">travelcb.co.uk</span></div>
      <div class="info-item"><span class="info-label">DPO Contact:</span><span class="info-value">privacy@travelcb.co.uk</span></div>
      <div class="info-item"><span class="info-label">Export Date:</span><span class="info-value">${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span></div>
      <div class="info-item"><span class="info-label">Data Subject:</span><span class="info-value">${data.email}</span></div>
      <div class="info-item"><span class="info-label">Account Status:</span><span class="info-value"><span class="badge ${data.hasAccount ? "badge-account" : "badge-no-account"}">${data.hasAccount ? "Registered Account" : "No Account Found"}</span></span></div>
    </div>
  </div>

  ${profile ? `
  <div class="section">
    <div class="section-title">Account Profile</div>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">Name:</span><span class="info-value">${profile.name || "—"}</span></div>
      <div class="info-item"><span class="info-label">Email:</span><span class="info-value">${profile.email || "—"}</span></div>
      <div class="info-item"><span class="info-label">Phone:</span><span class="info-value">${profile.phone || "—"}</span></div>
      <div class="info-item"><span class="info-label">Date of Birth:</span><span class="info-value">${profile.dateOfBirth || "—"}</span></div>
      <div class="info-item"><span class="info-label">Role:</span><span class="info-value">${profile.role || "user"}</span></div>
      <div class="info-item"><span class="info-label">Account Created:</span><span class="info-value">${profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-GB") : "Never logged in"}</span></div>
      <div class="info-item"><span class="info-label">Last Sign In:</span><span class="info-value">${profile.lastSignedIn ? new Date(profile.lastSignedIn).toLocaleDateString("en-GB") : "—"}</span></div>
      <div class="info-item"><span class="info-label">Referral Code:</span><span class="info-value">${profile.referralCode || "—"}</span></div>
    </div>
  </div>` : ""}

  <div class="section">
    <div class="section-title">Booking History (${data.bookings?.length || 0} records)</div>
    ${data.bookings?.length > 0 ? `
    <table>
      <thead><tr><th>Reference</th><th>Destination</th><th>Departure</th><th>Status</th><th>Lead Passenger</th><th>Total</th></tr></thead>
      <tbody>${bookingRows}</tbody>
    </table>` : '<div class="empty-state">No booking records found for this email address.</div>'}
  </div>

  <div class="section">
    <div class="section-title">Loyalty Points (${data.loyaltyPoints?.length || 0} records)</div>
    ${data.loyaltyPoints?.length > 0 ? `
    <table>
      <thead><tr><th>Reason</th><th>Points</th><th>Date</th></tr></thead>
      <tbody>${loyaltyRows}</tbody>
    </table>` : '<div class="empty-state">No loyalty point records found.</div>'}
  </div>

  <div class="section">
    <div class="section-title">Enquiries (${data.enquiries?.length || 0} records)</div>
    ${data.enquiries?.length > 0 ? `
    <table>
      <thead><tr><th>Subject</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>${enquiryRows}</tbody>
    </table>` : '<div class="empty-state">No enquiry records found.</div>'}
  </div>
</div>

<div class="footer">
  <p><strong>Corron Barnes T/A CB Travel</strong> · travelcb.co.uk · privacy@travelcb.co.uk</p>
  <p style="margin-top:4px;">This document has been produced in response to a Subject Access Request under UK GDPR Article 15.</p>
  <p>It contains all personal data held by CB Travel for the data subject identified above as of the export date.</p>
</div>
<div class="watermark">CB Travel SAR Export · Generated ${new Date().toISOString()}</div>

</body></html>`;

    printWin.document.write(html);
    printWin.document.close();
    setTimeout(() => { printWin.print(); }, 500);
  };

  // When SAR data loads, write to the already-opened window
  React.useEffect(() => {
    if (sarData && exportingEmail && sarPrintWinRef.current) {
      generateSarPdf(sarData, sarPrintWinRef.current);
      sarPrintWinRef.current = null;
      setExportingEmail(null);
    }
  }, [sarData, exportingEmail]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-semibold flex items-center gap-2">
            <Shield size={20} className="text-primary" /> GDPR Requests
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage Subject Access Requests, erasure requests, and complaints. All requests must be responded to within 30 days.</p>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { key: "pending", label: "Pending", icon: "⏳", color: "bg-amber-50 border-amber-200", textColor: "text-amber-700" },
          { key: "in_progress", label: "In Progress", icon: "🔄", color: "bg-blue-50 border-blue-200", textColor: "text-blue-700" },
          { key: "completed", label: "Completed", icon: "✅", color: "bg-green-50 border-green-200", textColor: "text-green-700" },
        ].map(s => (
          <div
            key={s.key}
            onClick={() => setFilter(filter === s.key ? "all" : s.key)}
            className={`rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md ${s.color} ${filter === s.key ? "ring-2 ring-primary" : ""}`}
          >
            <p className="text-2xl font-bold">{s.icon} {counts?.[s.key] || 0}</p>
            <p className={`text-sm font-medium ${s.textColor}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      {filter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Showing: <strong className="text-foreground">{filter.replace("_", " ")}</strong></span>
          <button onClick={() => setFilter("all")} className="text-xs text-primary hover:underline">Show all</button>
        </div>
      )}

      {/* Request list */}
      {filtered.length === 0 ? (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-8 text-center">
          <div className="text-4xl mb-2">🛡️</div>
          <p className="text-lg font-semibold text-green-700">No {filter !== "all" ? filter.replace("_", " ") + " " : ""}requests</p>
          <p className="text-sm text-green-600 mt-1">{filter === "all" ? "No GDPR requests have been submitted yet." : "No requests with this status."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req: any) => (
            <div key={req.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeColors[req.type] || "bg-gray-100 text-gray-800"}`}>
                        {req.type === "SAR" ? "📋 Subject Access Request" : req.type === "erasure" ? "🗑️ Right to Erasure" : "⚠️ Complaint"}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[req.status] || ""}`}>
                        {req.status === "pending" ? "⏳ Pending" : req.status === "in_progress" ? "🔄 In Progress" : "✅ Completed"}
                      </span>
                      <span className="text-xs text-muted-foreground">#{req.id}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><User size={12} /> {req.name}</span>
                      <span className="flex items-center gap-1"><Mail size={12} /> {req.email}</span>
                      {req.phone && <span className="flex items-center gap-1"><Phone size={12} /> {req.phone}</span>}
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(req.createdAt).toLocaleDateString("en-GB")}</span>
                    </div>
                    {req.description && (
                      <p className="text-sm text-foreground mt-2 bg-muted/20 rounded-lg px-3 py-2 italic">"{req.description}"</p>
                    )}
                    {req.reason && (
                      <p className="text-xs text-muted-foreground mt-1">Reason: {req.reason}</p>
                    )}
                    {req.adminNotes && (
                      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <p className="text-xs font-semibold text-blue-700 mb-0.5">Admin Notes</p>
                        <p className="text-sm text-blue-800">{req.adminNotes}</p>
                      </div>
                    )}
                    {req.completedAt && (
                      <p className="text-xs text-green-600 mt-1">✅ Completed: {new Date(req.completedAt).toLocaleDateString("en-GB")}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Select
                      value={req.status}
                      onValueChange={(v: string) => updateStatus.mutate({ id: req.id, status: v as any })}
                    >
                      <SelectTrigger className="rounded-xl text-xs h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">⏳ Pending</SelectItem>
                        <SelectItem value="in_progress">🔄 In Progress</SelectItem>
                        <SelectItem value="completed">✅ Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    {req.type === "SAR" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1.5 text-xs"
                        disabled={sarLoading && exportingEmail === req.email}
                        onClick={() => {
                          const win = window.open("", "_blank");
                          if (!win) { toast.error("Please allow popups to export PDF"); return; }
                          sarPrintWinRef.current = win;
                          win.document.write("<html><body style='font-family:sans-serif;padding:40px;color:#333'><h2>Generating SAR export…</h2><p>Please wait, this should only take a moment.</p></body></html>");
                          win.document.close();
                          setExportingEmail(req.email);
                        }}
                      >
                        <Download size={12} />
                        {sarLoading && exportingEmail === req.email ? "Loading..." : "Export PDF"}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl gap-1 text-xs"
                      onClick={() => { setSelectedRequest(req); setAdminNotes(req.adminNotes || ""); }}
                    >
                      <Edit2 size={12} /> Notes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Notes Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(v) => { if (!v) setSelectedRequest(null); }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Admin Notes — #{selectedRequest?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-xl p-3 text-sm">
              <p><strong>From:</strong> {selectedRequest?.name} ({selectedRequest?.email})</p>
              <p><strong>Type:</strong> {selectedRequest?.type}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Admin Notes</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes on how this request was processed..."
                className="rounded-xl resize-none"
                rows={4}
              />
            </div>
            <Button
              className="w-full rounded-xl btn-gold border-0 text-foreground"
              disabled={updateStatus.isPending}
              onClick={() => {
                updateStatus.mutate({
                  id: selectedRequest.id,
                  status: selectedRequest.status,
                  adminNotes,
                });
                setSelectedRequest(null);
              }}
            >
              Save Notes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Info box */}
      <div className="rounded-2xl border border-border bg-muted/20 p-5">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Info size={15} className="text-muted-foreground" /> GDPR Compliance Info</h3>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>All requests must be responded to within <strong className="text-foreground">30 calendar days</strong> of receipt.</li>
          <li>For SAR requests, click <strong className="text-foreground">Export PDF</strong> to generate a branded data export document containing all personal data held.</li>
          <li>For erasure requests, verify the data subject has no active bookings before processing deletion.</li>
          <li>Data Controller: <strong className="text-foreground">Corron Barnes T/A CB Travel</strong> · DPO: privacy@travelcb.co.uk</li>
        </ul>
      </div>
    </div>
  );
}

// MAIN ADMIN DASHBOARD

// BOOKING DOCUMENTS MODAL
function BookingDocumentsModal({ booking, onSuccess }: { booking: any; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { data: docs, refetch } = trpc.bookings.getDocuments.useQuery(booking.id, { enabled: open });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs"><FileText size={13} /> Docs</Button></DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-serif text-xl">Documents — {booking.bookingReference}</DialogTitle></DialogHeader>
        {docs && docs.length > 0 ? (
          <div className="space-y-2">
            {docs.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={15} className="text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.documentLabel || doc.documentType.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground truncate">{doc.fileName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {doc.isPasswordProtected ? <Lock size={13} className="text-amber-600" /> : (
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80"><Download size={14} /></a>
                  )}
                  <DocumentPasswordModal document={doc} onSuccess={refetch} />
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-center text-muted-foreground py-8 text-sm">No documents uploaded yet.</p>}
      </DialogContent>
    </Dialog>
  );
}

// FLIGHT & HOTEL DETAILS MODAL
function FlightHotelModal({ booking, onSuccess }: { booking: any; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("flight");
  const { data: flight, refetch: refetchFlight } = trpc.bookings.getFlightDetails.useQuery(booking.id, { enabled: open });
  const { data: hotels, refetch: refetchHotels } = trpc.bookings.getHotelDetails.useQuery(booking.id, { enabled: open });
  const [fForm, setFForm] = useState({ airline: "", outboundFlightNumber: "", outboundDeparture: "", outboundArrival: "", outboundDepartureTime: "", outboundArrivalTime: "", returnFlightNumber: "", returnDeparture: "", returnArrival: "", returnDepartureTime: "", returnArrivalTime: "", notes: "" });
  const [hForm, setHForm] = useState({ hotelName: "", destination: "", checkInDate: "", checkOutDate: "", roomType: "", address: "", phone: "", email: "", website: "", confirmationNumber: "", notes: "" });

  const flightMutation = trpc.bookings.setFlightDetails.useMutation({ onSuccess: () => { toast.success("Flight details saved!"); refetchFlight(); } });
  const hotelMutation = trpc.bookings.setHotelDetails.useMutation({ onSuccess: () => { toast.success("Hotel added!"); setHForm({ hotelName: "", destination: "", checkInDate: "", checkOutDate: "", roomType: "", address: "", phone: "", email: "", website: "", confirmationNumber: "", notes: "" }); refetchHotels(); onSuccess(); } });
  const deleteHotel = trpc.bookings.deleteHotel.useMutation({ onSuccess: () => { toast.success("Hotel removed."); refetchHotels(); } });

  // Pre-fill flight form when data loads
  const handleOpenFlight = () => {
    if (flight) setFForm({ airline: flight.airline || "", outboundFlightNumber: flight.outboundFlightNumber || "", outboundDeparture: flight.outboundDeparture || "", outboundArrival: flight.outboundArrival || "", outboundDepartureTime: flight.outboundDepartureTime || "", outboundArrivalTime: flight.outboundArrivalTime || "", returnFlightNumber: flight.returnFlightNumber || "", returnDeparture: flight.returnDeparture || "", returnArrival: flight.returnArrival || "", returnDepartureTime: flight.returnDepartureTime || "", returnArrivalTime: flight.returnArrivalTime || "", notes: flight.notes || "" });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setTimeout(handleOpenFlight, 500); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs text-blue-600 hover:bg-blue-50"><Plane size={13} /> Details</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-serif text-xl">Flight &amp; Hotel Details — {booking.bookingReference}</DialogTitle></DialogHeader>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("flight")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "flight" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>✈️ Flight</button>
          <button onClick={() => setTab("hotel")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "hotel" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>🏨 Hotel</button>
        </div>
        {tab === "flight" && (
          <div className="space-y-4">
            {flight && <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">✅ Flight details saved. Update the form below to change them.</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="col-span-3 space-y-1.5"><Label>Airline</Label><Input placeholder="e.g. British Airways" value={fForm.airline} onChange={e => setFForm({...fForm, airline: e.target.value})} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Outbound Flight No.</Label><Input placeholder="BA123" value={fForm.outboundFlightNumber} onChange={e => setFForm({...fForm, outboundFlightNumber: e.target.value})} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Departs From</Label><Input placeholder="London Heathrow (LHR)" value={fForm.outboundDeparture} onChange={e => setFForm({...fForm, outboundDeparture: e.target.value})} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Arrives At</Label><Input placeholder="Dubai (DXB)" value={fForm.outboundArrival} onChange={e => setFForm({...fForm, outboundArrival: e.target.value})} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Dep. Time</Label><Input placeholder="09:30" value={fForm.outboundDepartureTime} onChange={e => setFForm({...fForm, outboundDepartureTime: e.target.value})} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Arr. Time</Label><Input placeholder="19:45" value={fForm.outboundArrivalTime} onChange={e => setFForm({...fForm, outboundArrivalTime: e.target.value})} className="rounded-xl" /></div>
              <div className="space-y-1.5 col-span-3 border-t border-border pt-3"><Label className="text-muted-foreground text-xs font-semibold uppercase">Return Flight</Label></div>
              <div className="space-y-1.5"><Label>Return Flight No.</Label><Input placeholder="BA456" value={fForm.returnFlightNumber} onChange={e => setFForm({...fForm, returnFlightNumber: e.target.value})} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Departs From</Label><Input placeholder="Dubai (DXB)" value={fForm.returnDeparture} onChange={e => setFForm({...fForm, returnDeparture: e.target.value})} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Arrives At</Label><Input placeholder="London (LHR)" value={fForm.returnArrival} onChange={e => setFForm({...fForm, returnArrival: e.target.value})} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Dep. Time</Label><Input placeholder="22:00" value={fForm.returnDepartureTime} onChange={e => setFForm({...fForm, returnDepartureTime: e.target.value})} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Arr. Time</Label><Input placeholder="02:30+1" value={fForm.returnArrivalTime} onChange={e => setFForm({...fForm, returnArrivalTime: e.target.value})} className="rounded-xl" /></div>
              <div className="space-y-1.5 col-span-3"><Label>Notes</Label><Input placeholder="e.g. Seats 14A & 14B" value={fForm.notes} onChange={e => setFForm({...fForm, notes: e.target.value})} className="rounded-xl" /></div>
            </div>
            <Button onClick={() => flightMutation.mutate({ bookingId: booking.id, ...fForm })} className="w-full rounded-xl btn-gold border-0 text-foreground" disabled={flightMutation.isPending}>{flightMutation.isPending ? "Saving..." : "Save Flight Details"}</Button>
          </div>
        )}
        {tab === "hotel" && (
          <div className="space-y-4">
            {hotels && hotels.length > 0 && (
              <div className="space-y-2">
                {hotels.map((h: any) => (
                  <div key={h.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start justify-between gap-2">
                    <div className="text-xs space-y-0.5">
                      <p className="font-semibold text-foreground">{h.hotelName}</p>
                      {h.destination && <p className="text-muted-foreground">{h.destination}</p>}
                      {h.checkInDate && <p>Check-in: {h.checkInDate} → {h.checkOutDate}</p>}
                      {h.confirmationNumber && <p>Ref: {h.confirmationNumber}</p>}
                    </div>
                    <button onClick={() => { if (confirm("Remove this hotel?")) deleteHotel.mutate(h.id); }} className="text-destructive hover:text-destructive/80 shrink-0"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-border pt-3">
              <p className="text-sm font-semibold mb-3">Add Hotel</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2"><Label>Hotel Name *</Label><Input placeholder="Atlantis The Palm" value={hForm.hotelName} onChange={e => setHForm({...hForm, hotelName: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-1.5 col-span-2"><Label>Destination</Label><Input placeholder="Dubai, UAE" value={hForm.destination} onChange={e => setHForm({...hForm, destination: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Check-In Date</Label><Input type="date" value={hForm.checkInDate} onChange={e => setHForm({...hForm, checkInDate: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Check-Out Date</Label><Input type="date" value={hForm.checkOutDate} onChange={e => setHForm({...hForm, checkOutDate: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Room Type</Label><Input placeholder="Deluxe Ocean View" value={hForm.roomType} onChange={e => setHForm({...hForm, roomType: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Confirmation No.</Label><Input placeholder="HTL-123456" value={hForm.confirmationNumber} onChange={e => setHForm({...hForm, confirmationNumber: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Hotel Phone</Label><Input placeholder="+971 4 426 2000" value={hForm.phone} onChange={e => setHForm({...hForm, phone: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Hotel Website</Label><Input placeholder="https://..." value={hForm.website} onChange={e => setHForm({...hForm, website: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-1.5 col-span-2"><Label>Address</Label><Input placeholder="Crescent Road, The Palm Jumeirah" value={hForm.address} onChange={e => setHForm({...hForm, address: e.target.value})} className="rounded-xl" /></div>
              </div>
              <Button onClick={() => hotelMutation.mutate({ bookingId: booking.id, ...hForm })} className="w-full mt-3 rounded-xl btn-gold border-0 text-foreground" disabled={hotelMutation.isPending || !hForm.hotelName}>{hotelMutation.isPending ? "Adding..." : "Add Hotel"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// DOCUMENT PASSWORD MODAL
function DocumentPasswordModal({ document, onSuccess }: { document: any; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const setPasswordMutation = trpc.bookings.setDocumentPassword.useMutation({
    onSuccess: () => { toast.success("Password set!"); setOpen(false); setPassword(""); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const removePasswordMutation = trpc.bookings.removeDocumentPassword.useMutation({
    onSuccess: () => { toast.success("Password removed!"); setOpen(false); setPassword(""); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setPassword(pwd);
  };
  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { toast.error("Password cannot be empty."); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setPasswordMutation.mutate({ documentId: document.id, password });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {document.isPasswordProtected ? (
          <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs text-blue-600"><Lock size={13} /> Protected</Button>
        ) : (
          <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs text-muted-foreground hover:text-foreground"><Lock size={13} /> Protect</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle className="font-serif text-xl">{document.isPasswordProtected ? "Update" : "Set"} Document Password</DialogTitle></DialogHeader>
        {document.isPasswordProtected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            This document is currently password protected. Clients must enter a password to access it.
          </div>
        )}
        <form onSubmit={handleSetPassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Password</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <Button type="button" variant="outline" className="rounded-xl" onClick={generatePassword}>Generate</Button>
            </div>
            <p className="text-xs text-muted-foreground">Minimum 6 characters. Use Generate for a secure random password.</p>
          </div>
          {password && (
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <code className="text-xs font-mono flex-1 break-all">{password}</code>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(password); toast.success("Password copied!"); }}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 shrink-0 font-medium"
              >
                <Copy size={12} /> Copy
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="showPwd" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} className="rounded" />
            <Label htmlFor="showPwd" className="cursor-pointer text-xs">Show password</Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 rounded-xl btn-gold border-0 text-foreground" disabled={setPasswordMutation.isPending}>
              {setPasswordMutation.isPending ? "Setting..." : "Set Password"}
            </Button>
            {document.isPasswordProtected && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl text-destructive"
                onClick={() => { if (confirm("Remove password protection?")) removePasswordMutation.mutate(document.id); }}
                disabled={removePasswordMutation.isPending}
              >
                {removePasswordMutation.isPending ? "Removing..." : "Remove"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



// EMAIL LOGS SECTION
function EmailLogsSection() {
  const { data: logs, isLoading, refetch } = trpc.admin.getEmailLogs.useQuery({ limit: 100 });

  const typeColors: Record<string, string> = {
    welcome: 'bg-green-50 text-green-700',
    welcome_promo: 'bg-emerald-50 text-emerald-700',
    booking_confirmation: 'bg-blue-50 text-blue-700',
    booking_update: 'bg-indigo-50 text-indigo-700',
    document_upload: 'bg-purple-50 text-purple-700',
    document_password: 'bg-violet-50 text-violet-700',
    postcard: 'bg-orange-50 text-orange-700',
    password_reset: 'bg-yellow-50 text-yellow-700',
    account_disabled: 'bg-red-50 text-red-700',
    account_enabled: 'bg-green-50 text-green-700',
    quote_admin: 'bg-cyan-50 text-cyan-700',
    quote_confirmation: 'bg-sky-50 text-sky-700',
    custom: 'bg-gray-50 text-gray-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-xl font-semibold flex items-center gap-2">
          <MailCheck size={20} className="text-primary" />
          Email Logs
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{logs?.length || 0} recent emails</span>
          <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs" onClick={() => refetch()}>
            <RefreshCw size={12} /> Refresh
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-muted/40 rounded-xl animate-pulse" />)}</div>
      ) : logs && logs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Time</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">To</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Subject</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Type</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.sentAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3 text-xs font-medium truncate max-w-[160px]">{log.toEmail}</td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground truncate max-w-[200px]">{log.subject}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[log.emailType] || 'bg-gray-50 text-gray-600'}`}>
                      {log.emailType?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {log.status === 'sent' ? (
                      <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 size={12} /> Sent</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-600"><XCircle size={12} /> Failed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <Mail size={36} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No emails sent yet.</p>
        </div>
      )}
    </div>
  );
}


function ClientNotesList({ userId }: { userId: number }) {
  const { data: notes, refetch } = trpc.clientNotes.getForClient.useQuery(userId);
  const deleteMut = trpc.clientNotes.delete.useMutation();
  if (!notes || notes.length === 0) return <p className="text-sm text-muted-foreground italic">No notes for this client yet.</p>;
  return (
    <div className="space-y-2">
      {notes.map((n: any) => (
        <div key={n.id} className="flex items-start justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm">
          <div>
            <p className="text-foreground">{n.note}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(n.createdAt).toLocaleDateString('en-GB')}
              {n.creatorName && ` · by ${n.creatorName}`}
            </p>
          </div>
          <button className="text-red-400 hover:text-red-600 ml-3 shrink-0" onClick={async () => { await deleteMut.mutateAsync(n.id); refetch(); }}>🗑</button>
        </div>
      ))}
    </div>
  );
}


// ─── V7: Booking list group badge ────────────────────────────────────────────
function AdminBookingGroupBadge({ bookingId }: { bookingId: number }) {
  const { data: members } = trpc.travelParty.getMembers.useQuery(bookingId);
  if (!members || members.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium" title="Group booking">
      <Users2 size={11} /> {members.length + 1}
    </span>
  );
}

// ─── V7: Admin Support Tickets Component ─────────────────────────────────────
function AdminSupportTab({ tickets, refetch }: { tickets: any[]; refetch: () => void }) {
  const utils = trpc.useUtils();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [filter, setFilter] = useState<string>("all");

  const { data: messages } = trpc.support.getMessages.useQuery(selectedTicket?.id ?? 0, {
    enabled: !!selectedTicket,
  });

  const replyMutation = trpc.support.adminReply.useMutation({
    onSuccess: () => {
      toast.success("Reply sent & customer notified by email.");
      setReplyText("");
      utils.support.adminGetAll.invalidate();
      utils.support.getMessages.invalidate(selectedTicket?.id);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const statusMutation = trpc.support.adminUpdateStatus.useMutation({
    onSuccess: () => { utils.support.adminGetAll.invalidate(); refetch(); toast.success("Status updated."); },
    onError: (e) => toast.error(e.message),
  });

  const ticketTypeLabel: Record<string, string> = {
    general_enquiry: "General Enquiry",
    request_extra: "Request an Extra",
    complaint: "Complaint",
    other: "Other",
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: "bg-blue-100 text-blue-700" },
    in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-700" },
    resolved: { label: "Resolved", className: "bg-green-100 text-green-700" },
  };

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  if (selectedTicket) {
    return (
      <div>
        <button
          onClick={() => setSelectedTicket(null)}
          className="flex items-center gap-1.5 text-sm text-primary mb-5 hover:underline"
        >
          ← Back to all tickets
        </button>
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <h3 className="font-bold text-foreground text-lg mb-1">{selectedTicket.subject}</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full font-semibold ${statusConfig[selectedTicket.status]?.className}`}>{statusConfig[selectedTicket.status]?.label}</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">{ticketTypeLabel[selectedTicket.ticketType] || selectedTicket.ticketType}</span>
                <span className="text-muted-foreground">From: {selectedTicket.userName || selectedTicket.userEmail}</span>
                <span className="text-muted-foreground">{new Date(selectedTicket.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedTicket.status}
                onChange={(e) => {
                  statusMutation.mutate({ ticketId: selectedTicket.id, status: e.target.value as any });
                  setSelectedTicket({ ...selectedTicket, status: e.target.value });
                }}
                className="border border-input rounded-lg px-3 py-1.5 text-sm bg-background"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Thread */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto mb-4">
            {messages?.map((msg: any) => (
              <div key={msg.id} className={`flex gap-3 ${msg.isAdmin ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${msg.isAdmin ? "bg-primary" : "bg-slate-400"}`}>
                  {msg.isAdmin ? "CB" : (msg.senderName || "?").charAt(0).toUpperCase()}
                </div>
                <div className={`flex-1 max-w-[80%] ${msg.isAdmin ? "items-end" : ""}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm ${msg.isAdmin ? "bg-primary text-white" : "bg-muted/40 text-foreground"}`}>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    {msg.fileUrl && (
                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`text-xs underline mt-1 block ${msg.isAdmin ? "text-white/70" : "text-primary"}`}>
                        📎 Attachment
                      </a>
                    )}
                  </div>
                  <p className={`text-xs text-muted-foreground mt-1 ${msg.isAdmin ? "text-right" : ""}`}>
                    {msg.senderName || (msg.isAdmin ? "CB Travel" : "Customer")} · {new Date(msg.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply box */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Reply to customer</p>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply…"
              rows={4}
              className="w-full border border-input rounded-xl px-3 py-2 text-sm resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  if (!replyText.trim()) return;
                  replyMutation.mutate({ ticketId: selectedTicket.id, message: replyText, newStatus: newStatus as any || undefined });
                }}
                disabled={!replyText.trim() || replyMutation.isPending}
                className="rounded-xl btn-gold border-0 text-foreground"
              >
                {replyMutation.isPending ? "Sending…" : <><Send size={14} className="mr-1" />Send Reply & Notify Customer</>}
              </Button>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="border border-input rounded-lg px-3 py-1.5 text-sm bg-background"
              >
                <option value="">Keep status</option>
                <option value="open">Set to Open</option>
                <option value="in_progress">Set to In Progress</option>
                <option value="resolved">Set to Resolved</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="font-serif text-xl font-semibold">Support Tickets</h2>
        <div className="flex gap-2">
          {["all","open","in_progress","resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === f ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/60"}`}
            >
              {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && <span className="ml-1">({tickets.filter((t) => t.status === f).length})</span>}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <span className="text-4xl block mb-3">🎫</span>
          <p className="text-muted-foreground">No tickets yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket: any) => {
            const sc = statusConfig[ticket.status] || statusConfig.open;
            return (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-border shadow-sm p-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
                onClick={() => { setSelectedTicket(ticket); setNewStatus(""); }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-sm truncate">{ticket.subject}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sc.className}`}>{sc.label}</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">{ticketTypeLabel[ticket.ticketType] || ticket.ticketType}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{ticket.userName || ticket.userEmail || "Unknown"}</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {ticket.messageCount > 1 && <span>{ticket.messageCount} messages</span>}
                    </div>
                  </div>
                  <span className="text-xs text-primary flex items-center gap-1 flex-shrink-0">View thread <ArrowRight size={11} /></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── V7: Admin Travel Party Modal (for booking detail) ────────────────────────
function AdminTravelPartySection({ booking, onSuccess }: { booking: any; onSuccess: () => void }) {
  const utils = trpc.useUtils();
  const [emailInput, setEmailInput] = useState("");
  const { data: members, refetch: refetchMembers } = trpc.travelParty.getMembers.useQuery(booking.id);

  const addMutation = trpc.travelParty.adminAddMember.useMutation({
    onSuccess: (res) => {
      toast.success(`${res.userName || "User"} added to travel party!`);
      setEmailInput("");
      refetchMembers();
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMutation = trpc.travelParty.adminRemoveMember.useMutation({
    onSuccess: () => { toast.success("Member removed."); refetchMembers(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="mt-4">
      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Users2 size={15} className="text-primary" /> Travel Party</h4>
      {members && members.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-3">
          {members.map((m: any) => (
            <div key={m.id} className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-1.5">
              <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                {(m.userName || m.userEmail || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold">{m.userName || "—"}</p>
                <p className="text-[10px] text-muted-foreground">{m.userEmail}</p>
              </div>
              <button
                onClick={() => removeMutation.mutate({ bookingId: booking.id, userId: m.userId })}
                className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <UserMinus size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-3">No extra party members yet.</p>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="Add by email address…"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && emailInput.trim()) addMutation.mutate({ bookingId: booking.id, email: emailInput.trim() }); }}
          className="rounded-xl text-sm"
        />
        <Button
          onClick={() => { if (emailInput.trim()) addMutation.mutate({ bookingId: booking.id, email: emailInput.trim() }); }}
          disabled={!emailInput.trim() || addMutation.isPending}
          className="rounded-xl btn-gold border-0 text-foreground shrink-0"
        >
          {addMutation.isPending ? "…" : <Plus size={14} />}
        </Button>
      </div>
    </div>
  );
}


// ─── V8: Admin Booking Photos ─────────────────────────────────────────────────
function AdminBookingPhotos({ bookingId }: { bookingId: number }) {
  const utils = trpc.useUtils();
  const { data: photos, refetch } = trpc.bookings.getPhotos.useQuery(bookingId);
  const addPhoto = trpc.bookings.addPhoto.useMutation({ onSuccess: () => { toast.success("Photo uploaded!"); refetch(); } });
  const deletePhoto = trpc.bookings.deletePhoto.useMutation({ onSuccess: () => { toast.success("Photo removed."); refetch(); } });
  const updateCaption = trpc.bookings.updatePhotoCaption.useMutation({ onSuccess: () => refetch() });

  const [editingCaption, setEditingCaption] = useState<{ id: number; caption: string } | null>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      addPhoto.mutate({ bookingId, imageBase64: base64, mimeType: file.type, caption: "" });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hotel Photos</p>
        <label className="cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={addPhoto.isPending} />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
            {addPhoto.isPending ? "Uploading…" : "+ Upload Photo"}
          </span>
        </label>
      </div>
      {photos && photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {photos.map((photo: any) => (
            <div key={photo.id} className="relative group">
              <img src={photo.imageUrl} alt={photo.caption || "Photo"} className="w-full aspect-video object-cover rounded-lg" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <button onClick={() => setEditingCaption({ id: photo.id, caption: photo.caption || "" })} className="bg-white/90 text-xs px-2 py-1 rounded font-medium">Caption</button>
                <button onClick={() => deletePhoto.mutate({ id: photo.id })} className="bg-red-500 text-white text-xs px-2 py-1 rounded font-medium">Delete</button>
              </div>
              {photo.caption && <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-4">No photos yet. Upload photos to show a gallery on the customer's booking page.</p>
      )}
      {editingCaption && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={editingCaption.caption}
            onChange={e => setEditingCaption({ ...editingCaption, caption: e.target.value })}
            className="flex-1 border border-input rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Photo caption..."
          />
          <button onClick={() => { updateCaption.mutate({ id: editingCaption.id, caption: editingCaption.caption }); setEditingCaption(null); }} className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg font-medium">Save</button>
          <button onClick={() => setEditingCaption(null)} className="border border-input text-xs px-3 py-1.5 rounded-lg">Cancel</button>
        </div>
      )}
    </div>
  );
}

// ─── V8: Admin Destination Activities (Things to Do) ─────────────────────────
function AdminThingsToDo({ destination }: { destination: string }) {
  const { data: activities, refetch } = trpc.activities.getByDestination.useQuery({ destination });
  const autofetch = trpc.activities.autofetch.useMutation({ onSuccess: () => { toast.success("Activities fetched!"); refetch(); }, onError: e => toast.error(e.message) });
  const saveActivity = trpc.activities.save.useMutation({ onSuccess: () => { toast.success("Saved!"); refetch(); setEditing(null); } });
  const deleteActivity = trpc.activities.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Removed."); } });

  const [editing, setEditing] = useState<any | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Things to Do — {destination}</p>
        <div className="flex gap-2">
          <button onClick={() => autofetch.mutate({ destination })} disabled={autofetch.isPending} className="text-xs font-medium bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors">
            {autofetch.isPending ? "Fetching…" : "✨ Auto-fetch"}
          </button>
          <button onClick={() => setEditing({ destination, name: "", category: "", description: "" })} className="text-xs font-medium bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
            + Add
          </button>
        </div>
      </div>

      {editing && (
        <div className="border border-border rounded-xl p-3 space-y-2 bg-muted/20">
          <input type="text" placeholder="Activity name *" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full border border-input rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="text" placeholder="Category (e.g. Museum, Beach, Restaurant)" value={editing.category || ""} onChange={e => setEditing({ ...editing, category: e.target.value })} className="w-full border border-input rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <textarea placeholder="Description" value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} className="w-full border border-input rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20" />
          <input type="text" placeholder="Image URL (optional)" value={editing.imageUrl || ""} onChange={e => setEditing({ ...editing, imageUrl: e.target.value })} className="w-full border border-input rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="flex gap-2">
            <button onClick={() => { if (editing.name) saveActivity.mutate(editing); }} disabled={!editing.name || saveActivity.isPending} className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50">Save</button>
            <button onClick={() => setEditing(null)} className="border border-input text-xs px-3 py-1.5 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {activities && activities.length > 0 ? (
        <div className="space-y-2">
          {activities.map((a: any) => (
            <div key={a.id} className="flex items-start gap-3 p-2.5 bg-teal-50 border border-teal-100 rounded-lg">
              {a.imageUrl && <img src={a.imageUrl} alt={a.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{a.name}</p>
                {a.category && <p className="text-xs text-teal-600 capitalize">{a.category}</p>}
                {a.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.description}</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setEditing({ id: a.id, destination, name: a.name, category: a.category || "", description: a.description || "", imageUrl: a.imageUrl || "" })} className="text-xs text-primary hover:underline">Edit</button>
                <button onClick={() => deleteActivity.mutate({ id: a.id })} className="text-xs text-destructive hover:underline ml-1">Del</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-3">No activities yet. Use Auto-fetch or add manually.</p>
      )}
    </div>
  );
}

function ClientProfilePanel({ user, userBookings, onUpdate }: { user: any; userBookings: any[]; onUpdate: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview'|'personal'|'passport'|'bookings'|'referrals'|'comms'|'logins'>('overview');
  const [editForm, setEditForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
  });
  const [passportForm, setPassportForm] = useState({
    passportNumber: user.passportNumber || '',
    passportExpiry: user.passportExpiry || '',
    passportIssueDate: user.passportIssueDate || '',
    passportIssuingCountry: user.passportIssuingCountry || '',
    passportNationality: user.passportNationality || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingPassport, setSavingPassport] = useState(false);
  const [savedPassport, setSavedPassport] = useState(false);

  const { data: emailLogs, isLoading: emailLogsLoading } = trpc.admin.getClientEmailLogs.useQuery({ userId: user.id }, { enabled: activeTab === 'comms' });
  const { data: loginHistory, isLoading: loginHistoryLoading } = trpc.admin.getClientLoginHistory.useQuery({ userId: user.id }, { enabled: activeTab === 'logins' });
  const { data: clientReferrals, isLoading: referralsLoading } = trpc.admin.getClientReferrals.useQuery({ userId: user.id }, { enabled: activeTab === 'referrals' });

  const updateProfile = trpc.admin.updateUserProfile.useMutation({
    onSuccess: () => { setSaved(true); setSaving(false); setTimeout(() => setSaved(false), 2500); onUpdate(); },
    onError: (e) => { toast.error('Failed to update: ' + e.message); setSaving(false); }
  });
  const updatePassport = trpc.admin.updateUserPassport.useMutation({
    onSuccess: () => { setSavedPassport(true); setSavingPassport(false); setTimeout(() => setSavedPassport(false), 2500); onUpdate(); },
    onError: (e) => { toast.error('Failed to save passport: ' + e.message); setSavingPassport(false); }
  });

  const loyaltyPoints = (user as any).loyaltyPoints ?? 0;
  const loyaltyTier = loyaltyPoints >= 10000 ? 'Platinum' : loyaltyPoints >= 5000 ? 'Gold' : loyaltyPoints >= 1000 ? 'Silver' : 'Bronze';
  const tierColor = loyaltyTier === 'Platinum' ? 'text-purple-700 bg-purple-50 border-purple-200' : loyaltyTier === 'Gold' ? 'text-amber-700 bg-amber-50 border-amber-200' : loyaltyTier === 'Silver' ? 'text-slate-600 bg-slate-100 border-slate-200' : 'text-orange-700 bg-orange-50 border-orange-200';
  const tierGradient = loyaltyTier === 'Platinum' ? 'from-purple-500 to-indigo-600' : loyaltyTier === 'Gold' ? 'from-amber-400 to-orange-500' : loyaltyTier === 'Silver' ? 'from-slate-400 to-slate-500' : 'from-orange-400 to-amber-500';

  const totalSpend = userBookings.reduce((sum: number, b: any) => sum + (parseFloat(b.amountPaid) || 0), 0);
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Unknown';
  const lastSeen = user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never';

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
  const labelCls = 'text-xs text-muted-foreground font-medium block mb-1.5';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'personal', label: 'Personal', icon: '👤' },
    { id: 'passport', label: 'Passport', icon: '🛂' },
    { id: 'bookings', label: `Bookings (${userBookings.length})`, icon: '✈️' },
    { id: 'referrals', label: 'Referrals', icon: '🔗' },
    { id: 'comms', label: 'Comms Log', icon: '📧' },
    { id: 'logins', label: 'Login History', icon: '🔐' },
  ] as const;

  const passportDays = passportForm.passportExpiry ? Math.ceil((new Date(passportForm.passportExpiry).getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="border-t border-border bg-gradient-to-b from-slate-50 to-white animate-in slide-in-from-top-2 duration-200">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 pt-6 pb-0">
        <div className="flex items-start gap-4 mb-5">
          {/* Avatar */}
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tierGradient} flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0`}>
            {(user.name || user.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-bold text-lg">{user.name || '—'}</h3>
              {user.role === 'admin' && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/30">Admin</span>}
              {user.isDisabled && <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-medium">Disabled</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${tierColor}`}>{loyaltyTier}</span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">{user.email}</p>
            {user.phone && <p className="text-slate-500 text-xs mt-0.5">{user.phone}</p>}
          </div>
          {/* Quick stats */}
          <div className="hidden md:flex items-center gap-6 text-center">
            <div>
              <p className="text-white font-bold text-lg">{userBookings.length}</p>
              <p className="text-slate-400 text-xs">Bookings</p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <p className="text-white font-bold text-lg">£{totalSpend.toLocaleString('en-GB', {minimumFractionDigits: 0})}</p>
              <p className="text-slate-400 text-xs">Total Spend</p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <p className="text-white font-bold text-lg">{loyaltyPoints.toLocaleString()}</p>
              <p className="text-slate-400 text-xs">Points</p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <p className="text-slate-300 text-sm font-medium">{lastSeen}</p>
              <p className="text-slate-400 text-xs">Last seen</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-xl whitespace-nowrap transition-all border-t border-x ${
                activeTab === tab.id
                  ? 'bg-white text-foreground border-border border-b-white -mb-px relative z-10'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/10'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-5 border-t border-border bg-white">

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Bookings', value: userBookings.length, icon: '✈️', color: 'bg-blue-50 text-blue-700' },
                { label: 'Total Spend', value: `£${totalSpend.toLocaleString('en-GB', {minimumFractionDigits: 0})}`, icon: '💷', color: 'bg-emerald-50 text-emerald-700' },
                { label: 'Loyalty Points', value: loyaltyPoints.toLocaleString(), icon: '⭐', color: 'bg-amber-50 text-amber-700' },
                { label: 'Member Since', value: memberSince, icon: '📅', color: 'bg-purple-50 text-purple-700' },
              ].map(stat => (
                <div key={stat.label} className={`rounded-2xl p-4 ${stat.color}`}>
                  <p className="text-2xl mb-0.5">{stat.icon}</p>
                  <p className="font-bold text-lg leading-tight">{stat.value}</p>
                  <p className="text-xs opacity-70 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Passport status */}
            {passportDays !== null && (
              <div className={`rounded-2xl p-4 flex items-center gap-3 ${passportDays < 0 ? 'bg-red-50 border border-red-200' : passportDays < 90 ? 'bg-red-50 border border-red-200' : passportDays < 365 ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                <span className="text-2xl">🛂</span>
                <div>
                  <p className={`font-semibold text-sm ${passportDays < 0 ? 'text-red-700' : passportDays < 90 ? 'text-red-700' : passportDays < 365 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {passportDays < 0 ? `Passport expired ${Math.abs(passportDays)} days ago` : passportDays < 90 ? `Passport expires in ${passportDays} days — needs renewal` : passportDays < 365 ? `Passport expires in ${passportDays} days` : `Passport valid — ${passportDays} days remaining`}
                  </p>
                  <p className="text-xs text-muted-foreground">Expiry: {passportForm.passportExpiry}</p>
                </div>
              </div>
            )}

            {/* Upcoming bookings */}
            {userBookings.filter((b: any) => b.departureDate && new Date(b.departureDate) > new Date()).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-50 rounded-lg flex items-center justify-center text-xs">✈</span>
                  Upcoming Trips
                </h4>
                <div className="space-y-2">
                  {userBookings.filter((b: any) => b.departureDate && new Date(b.departureDate) > new Date()).slice(0, 3).map((b: any) => {
                    const daysUntil = Math.ceil((new Date(b.departureDate).getTime() - Date.now()) / 86400000);
                    return (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{b.destination || 'Trip'}</p>
                          <p className="text-xs text-muted-foreground">{b.bookingReference} · {b.departureDate}</p>
                        </div>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                          {daysUntil === 0 ? 'Today!' : `${daysUntil}d away`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DOB */}
            {user.dateOfBirth && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-border">
                <span className="text-xl">🎂</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Date of Birth</p>
                  <p className="text-xs text-muted-foreground">{new Date(user.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Personal ── */}
        {activeTab === 'personal' && (
          <div className="max-w-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({...f, email: e.target.value}))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({...f, phone: e.target.value}))} placeholder="Not provided" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input type="date" value={editForm.dateOfBirth} onChange={e => setEditForm(f => ({...f, dateOfBirth: e.target.value}))} className={inputCls} />
              </div>
            </div>
            <button
              onClick={() => { setSaving(true); updateProfile.mutate({ id: user.id, name: editForm.name || undefined, email: editForm.email || undefined, phone: editForm.phone || null, dateOfBirth: editForm.dateOfBirth || null }); }}
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : saved ? '✓ Saved Successfully' : 'Save Personal Details'}
            </button>
          </div>
        )}

        {/* ── Passport ── */}
        {activeTab === 'passport' && (
          <div className="max-w-lg space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              🔒 Passport data is sensitive. Only edit when directly confirmed with the client.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Passport Number</label>
                <input type="text" value={passportForm.passportNumber} onChange={e => setPassportForm(f => ({...f, passportNumber: e.target.value}))} placeholder="e.g. 123456789" className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label className={labelCls}>Nationality</label>
                <input type="text" value={passportForm.passportNationality} onChange={e => setPassportForm(f => ({...f, passportNationality: e.target.value}))} placeholder="e.g. British" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Issuing Country</label>
                <input type="text" value={passportForm.passportIssuingCountry} onChange={e => setPassportForm(f => ({...f, passportIssuingCountry: e.target.value}))} placeholder="e.g. United Kingdom" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Issue Date</label>
                <input type="date" value={passportForm.passportIssueDate} onChange={e => setPassportForm(f => ({...f, passportIssueDate: e.target.value}))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Expiry Date</label>
                <input type="date" value={passportForm.passportExpiry} onChange={e => setPassportForm(f => ({...f, passportExpiry: e.target.value}))} className={inputCls} />
                {passportDays !== null && (
                  <p className={`text-xs mt-1 ${passportDays < 0 ? 'text-red-600' : passportDays < 180 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {passportDays < 0 ? `⚠️ Expired ${Math.abs(passportDays)} days ago` : passportDays < 180 ? `⚠️ Expires in ${passportDays} days — may be invalid for travel` : `✓ Valid (${passportDays} days remaining)`}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => { setSavingPassport(true); updatePassport.mutate({ id: user.id, passportNumber: passportForm.passportNumber || null, passportExpiry: passportForm.passportExpiry || null, passportIssueDate: passportForm.passportIssueDate || null, passportIssuingCountry: passportForm.passportIssuingCountry || null, passportNationality: passportForm.passportNationality || null }); }}
              disabled={savingPassport}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {savingPassport ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : savedPassport ? '✓ Passport Saved' : 'Save Passport Details'}
            </button>
          </div>
        )}

        {/* ── Bookings ── */}
        {activeTab === 'bookings' && (
          <div>
            {userBookings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-4xl mb-3">✈️</p>
                <p className="text-muted-foreground text-sm">No bookings yet for this client</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userBookings.map((b: any) => {
                  const total = parseFloat(b.totalPrice) || 0;
                  const paid = parseFloat(b.amountPaid) || 0;
                  const outstanding = total - paid;
                  const isPast = b.departureDate && new Date(b.departureDate) < new Date();
                  return (
                    <div key={b.id} className={`rounded-2xl border p-4 transition-all ${isPast ? 'bg-slate-50 border-slate-200' : 'bg-white border-border shadow-sm'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-sm font-bold text-primary">{b.bookingReference}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{b.status}</span>
                            {isPast && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Past</span>}
                          </div>
                          {b.destination && <p className="text-sm font-semibold text-foreground">{b.destination}</p>}
                          {b.departureDate && <p className="text-xs text-muted-foreground mt-0.5">{b.departureDate}{b.returnDate ? ` → ${b.returnDate}` : ''}</p>}
                        </div>
                        {total > 0 && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-foreground">£{total.toLocaleString('en-GB', {minimumFractionDigits: 2})}</p>
                            {outstanding > 0.01 ? (
                              <p className="text-xs text-amber-600 font-medium">£{outstanding.toLocaleString('en-GB', {minimumFractionDigits: 2})} outstanding</p>
                            ) : (
                              <p className="text-xs text-emerald-600 font-medium">Fully paid ✓</p>
                            )}
                          </div>
                        )}
                      </div>
                      {total > 0 && (
                        <div className="mt-3">
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, (paid/total)*100)}%` }} />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">{Math.round((paid/total)*100)}% paid</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Referrals ── */}
        {activeTab === 'referrals' && (
          <div className="space-y-4">
            {/* Referral code */}
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-4">
              <p className="text-xs text-muted-foreground font-medium mb-1">This client's referral code</p>
              <div className="flex items-center gap-3">
                <code className="text-xl font-bold font-mono text-primary tracking-wider">{user.referralCode || 'Not assigned'}</code>
                {user.referralCode && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(`https://www.travelcb.co.uk/?ref=${user.referralCode}`); toast.success('Referral link copied!'); }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Copy link
                  </button>
                )}
              </div>
            </div>

            {referralsLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : clientReferrals && clientReferrals.length > 0 ? (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">People referred ({clientReferrals.length})</h4>
                <div className="space-y-2">
                  {clientReferrals.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                          {(r.name || r.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{r.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{r.email}</p>
                        </div>
                      </div>
                      {r.joinedAt && <p className="text-xs text-muted-foreground">{new Date(r.joinedAt).toLocaleDateString('en-GB')}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-3xl mb-2">🔗</p>
                <p className="text-sm text-muted-foreground">No referrals made yet</p>
              </div>
            )}
          </div>
        )}

        {/* ── Comms Log ── */}
        {activeTab === 'comms' && (
          <div>
            {emailLogsLoading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : emailLogs && emailLogs.length > 0 ? (
              <div className="space-y-2">
                {emailLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-white hover:bg-slate-50/50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${log.status === 'sent' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {log.status === 'sent' ? '✓' : '✗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{log.subject}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{log.emailType?.replace(/_/g, ' ')}</span>
                        <p className="text-xs text-muted-foreground">{new Date(log.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {log.errorMessage && <p className="text-xs text-red-600 mt-1">{log.errorMessage}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-4xl mb-3">📧</p>
                <p className="text-sm text-muted-foreground">No emails logged for this client yet</p>
                <p className="text-xs text-muted-foreground mt-1">Emails sent going forward will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* ── Login History ── */}
        {activeTab === 'logins' && (
          <div>
            {loginHistoryLoading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : loginHistory && loginHistory.length > 0 ? (
              <div className="space-y-2">
                {loginHistory.map((entry: any, i: number) => (
                  <div key={entry.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-white">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${i === 0 ? 'bg-emerald-100 text-emerald-600 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                      {i === 0 ? '●' : i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{new Date(entry.loggedInAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        {i === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">Most recent</span>}
                      </div>
                      {entry.ipAddress && <p className="text-xs text-muted-foreground font-mono mt-0.5">{entry.ipAddress}</p>}
                      {entry.userAgent && <p className="text-[10px] text-muted-foreground truncate mt-0.5 max-w-md">{entry.userAgent}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-4xl mb-3">🔐</p>
                <p className="text-sm text-muted-foreground">No login history recorded yet</p>
                <p className="text-xs text-muted-foreground mt-1">Login events going forward will be tracked here</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}


export default function AdminDashboard() {
  useSEO({ title: 'Admin Dashboard', noIndex: true });
  const utils = trpc.useUtils();
  const { data: bookings, isLoading: bookingsLoading } = trpc.bookings.getAllAdmin.useQuery();
  const { data: deals, isLoading: dealsLoading } = trpc.deals.listAdmin.useQuery();
  const { data: quotes, isLoading: quotesLoading } = trpc.quotes.getAllAdmin.useQuery();
  const { data: testimonials, isLoading: testimonialsLoading } = trpc.testimonials.getAllAdmin.useQuery();
  const { data: subscribers } = trpc.newsletter.getAll.useQuery();
  const { data: allUsers, isLoading: usersLoading } = trpc.admin.users.useQuery();
  const { data: upcomingBirthdays } = trpc.admin.getUpcomingBirthdays.useQuery({ daysAhead: 14 });
  const { data: faqItems, isLoading: faqLoading } = trpc.faq.listAdmin.useQuery();
  const { data: promoCodes, isLoading: promoLoading } = trpc.promoCodes.list.useQuery();
  const [promoForm, setPromoForm] = useState({ code: "", description: "", discountAmount: "", expiresAt: "" });
  const { data: intakeSubmissions, isLoading: intakeLoading } = trpc.intake.list.useQuery();

  // V6 queries
  const { data: bookedDestinations, refetch: refetchDestinations } = trpc.destinations.getAll.useQuery();
  const { data: auditLogs } = trpc.auditLogs.get.useQuery({ limit: 200 });
  const { data: itineraryLogs, refetch: refetchItineraryLogs } = trpc.ai.getItineraryAccessLogs.useQuery();
  const { data: itineraryPasswordData, refetch: refetchItineraryPassword } = trpc.ai.getItineraryPassword.useQuery();
  const setItineraryPasswordMutation = trpc.ai.setItineraryPassword.useMutation({
    onSuccess: () => { toast.success("Access password updated! ✓"); refetchItineraryPassword(); setItineraryPasswordEdit(''); },
    onError: (e) => toast.error(e.message),
  });
  const [itineraryPasswordEdit, setItineraryPasswordEdit] = useState('');
  const { data: campaigns, refetch: refetchCampaigns } = trpc.newsletterV6.getCampaigns.useQuery();
  const { data: allSettings, refetch: refetchSettings } = trpc.settings.getAll.useQuery();
  const { data: allTickets, refetch: refetchTickets } = trpc.support.adminGetAll.useQuery();
  const { data: taskCentre } = trpc.loyalty.getTaskCentre.useQuery();
  const [destForm, setDestForm] = useState({ name: '', lastBooked: '' });
  const [editingDest, setEditingDest] = useState<any>(null);
  const [showAddDestModal, setShowAddDestModal] = useState(false);
  const [newDestForm, setNewDestForm] = useState({ name: '', lastBooked: '', imageBase64: '', imageMimeType: '', imageUrl: '' });
  const [destImageName, setDestImageName] = useState('');
  const [destFetchedImages, setDestFetchedImages] = useState<string[]>([]);
  const [destImageIndex, setDestImageIndex] = useState(0);
  const [noteClientId, setNoteClientId] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [campaignForm, setCampaignForm] = useState({ subject: '', htmlBody: '' });
  const [settingsForm, setSettingsForm] = useState<Record<string,string>>({});
  const [auditSearch, setAuditSearch] = useState('');
  const createDestMut = trpc.destinations.create.useMutation({
    onSuccess: () => { utils.destinations.getAll.invalidate(); utils.destinations.list.invalidate(); utils.destinations.getActive?.invalidate(); toast.success('Destination added!'); setShowAddDestModal(false); setNewDestForm({ name: '', lastBooked: '', imageBase64: '', imageMimeType: '', imageUrl: '' }); setDestImageName(''); setDestFetchedImages([]); setDestImageIndex(0); },
    onError: (e) => toast.error('Failed to add destination: ' + e.message),
  });
  const updateDestMut = trpc.destinations.update.useMutation({
    onSuccess: () => { utils.destinations.getAll.invalidate(); utils.destinations.list.invalidate(); utils.destinations.getActive?.invalidate(); },
    onError: (e) => toast.error('Failed to update: ' + e.message),
  });
  const deleteDestMut = trpc.destinations.delete.useMutation({
    onSuccess: () => { utils.destinations.getAll.invalidate(); utils.destinations.list.invalidate(); utils.destinations.getActive?.invalidate(); },
    onError: (e) => toast.error('Failed to delete: ' + e.message),
  });
  const deleteAllDestMut = trpc.destinations.deleteAll.useMutation({
    onSuccess: () => { utils.destinations.getAll.invalidate(); utils.destinations.list.invalidate(); utils.destinations.getActive?.invalidate(); toast.success('All destinations deleted'); },
    onError: (e) => toast.error('Failed to delete all: ' + e.message),
  });
  const fetchDestImageMut = trpc.destinations.fetchImage.useMutation({
    onSuccess: (data) => {
      const imgs = data.images;
      setDestFetchedImages(imgs);
      setDestImageIndex(0);
      setNewDestForm(p => ({ ...p, imageUrl: imgs[0], imageBase64: '', imageMimeType: '' }));
      setDestImageName('');
      toast.success(`Found ${imgs.length} photo${imgs.length > 1 ? 's' : ''} — press again to cycle through them`);
    },
    onError: (e) => toast.error(e.message),
  });
  const createNoteMut = trpc.clientNotes.create.useMutation();
  const createCampaignMut = trpc.newsletterV6.createCampaign.useMutation();
  const sendCampaignMut = trpc.newsletterV6.sendCampaign.useMutation();
  const setSettingMut = trpc.settings.set.useMutation();
  const updateIntakeStatus = trpc.intake.updateStatus.useMutation({ onSuccess: () => { toast.success("Status updated!"); utils.intake.list.invalidate(); }, onError: (e) => toast.error(e.message) });
  const [activeTab, setActiveTab] = useState('command');
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [selectedIntake, setSelectedIntake] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [intakeAdminNotes, setIntakeAdminNotes] = useState("");
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');

  const approveTestimonial = trpc.testimonials.approve.useMutation({ onSuccess: () => { toast.success("Testimonial approved!"); utils.testimonials.getAllAdmin.invalidate(); } });
  const deleteTestimonial = trpc.testimonials.delete.useMutation({ onSuccess: () => { toast.success("Testimonial deleted."); utils.testimonials.getAllAdmin.invalidate(); } });
  const updateQuoteStatus = trpc.quotes.updateStatus.useMutation({ onSuccess: () => { toast.success("Quote status updated!"); utils.quotes.getAllAdmin.invalidate(); } });
  const deleteDeal = trpc.deals.delete.useMutation({ onSuccess: () => { toast.success("Deal deleted."); utils.deals.listAdmin.invalidate(); } });
  const disableUser = trpc.admin.disableUser.useMutation({ onSuccess: () => { toast.success("Account status updated!"); utils.admin.users.invalidate(); }, onError: (e) => toast.error(e.message) });
  const deleteUser = trpc.admin.deleteUser.useMutation({ onSuccess: () => { toast.success("Account deleted."); utils.admin.users.invalidate(); }, onError: (e) => toast.error(e.message) });
  const deleteFaq = trpc.faq.delete.useMutation({ onSuccess: () => { toast.success("FAQ item deleted."); utils.faq.listAdmin.invalidate(); }, onError: (e) => toast.error(e.message) });
  const createPromo = trpc.promoCodes.create.useMutation({ onSuccess: () => { toast.success("Promo code created!"); utils.promoCodes.list.invalidate(); setPromoForm({ code: "", description: "", discountAmount: "", expiresAt: "" }); }, onError: (e) => toast.error(e.message) });
  const updatePromo = trpc.promoCodes.update.useMutation({ onSuccess: () => { toast.success("Updated!"); utils.promoCodes.list.invalidate(); }, onError: (e) => toast.error(e.message) });
  const deletePromo = trpc.promoCodes.delete.useMutation({ onSuccess: () => { toast.success("Code deleted."); utils.promoCodes.list.invalidate(); } });

  const stats = [
    { label: "Total Bookings", value: bookings?.length || 0, icon: Package, color: "text-primary", bg: "bg-primary/8" },
    { label: "Active Deals", value: deals?.filter((d: any) => d.isActive).length || 0, icon: Globe, color: "text-accent", bg: "bg-accent/10" },
    { label: "Quote Requests", value: quotes?.length || 0, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Subscribers", value: subscribers?.length || 0, icon: Mail, color: "text-green-600", bg: "bg-green-50" },
  ];

  // Nav sections definition
  const newIntakeCount = intakeSubmissions?.filter((s:any)=>s.status==="new").length || 0;
  const openSupportCount = allTickets?.filter((t:any)=>t.status==="open").length || 0;
  const currentNavLabel = [
    { value: 'bookings', label: 'Bookings' }, { value: 'deals', label: 'Deals' },
    { value: 'quotes', label: 'Quote Requests' }, { value: 'quotes-manager', label: 'Quotes Manager' }, { value: 'intake', label: 'Intake' },
    { value: 'accounts', label: 'Accounts' }, { value: 'client-notes', label: 'CRM Notes' },
    { value: 'support', label: 'Support Tickets' }, { value: 'emails', label: 'Email Builder' },
    { value: 'campaigns', label: 'Campaigns' }, { value: 'subscribers', label: 'Subscribers' },
    { value: 'promos', label: 'Promo Codes' }, { value: 'faq', label: 'FAQ' },
    { value: 'testimonials', label: 'Reviews' }, { value: 'destinations', label: 'Destinations' },
    { value: 'loyalty-admin', label: 'Loyalty Programme' }, { value: 'gdpr', label: 'GDPR Requests' }, { value: 'audit', label: 'Audit Log' },
    { value: 'itinerary-logs', label: 'Itinerary Tool Logs' },
    { value: 'settings', label: 'Settings' },
    { value: 'command', label: 'Command Centre' },
    { value: 'passports', label: 'Passport Manager' },
    { value: 'payments', label: 'Payment Plans' },
  ].find(n => n.value === activeTab)?.label || 'Dashboard';

  const navSections = [
    {
      label: 'Overview',
      items: [
        { value: 'command', label: 'Command Centre', icon: LayoutDashboard },
      ]
    },
    {
      label: 'Bookings & Sales',
      items: [
        { value: 'bookings', label: 'Bookings', icon: Plane },
        { value: 'deals', label: 'Deals', icon: Tag },
        { value: 'quotes', label: 'Quote Requests', icon: FileText },
        { value: 'quotes-manager', label: 'Quotes Manager', icon: Send },
        { value: 'intake', label: 'Intake', icon: ClipboardList, badge: newIntakeCount || null },
      ]
    },
    {
      label: 'Clients',
      items: [
        { value: 'accounts', label: 'Accounts', icon: Users },
        { value: 'client-notes', label: 'CRM Notes', icon: MessageSquare },
        { value: 'support', label: 'Support', icon: Ticket, badge: openSupportCount || null },
      ]
    },
    {
      label: 'Marketing',
      items: [
        { value: 'emails', label: 'Email Builder', icon: Mail },
        { value: 'campaigns', label: 'Campaigns', icon: Send },
        { value: 'subscribers', label: 'Subscribers', icon: MailCheck },
        { value: 'promos', label: 'Promos', icon: Percent },
      ]
    },
    {
      label: 'Content',
      items: [
        { value: 'faq', label: 'FAQ', icon: HelpCircle },
        { value: 'testimonials', label: 'Reviews', icon: Star },
        { value: 'destinations', label: 'Destinations', icon: Globe },
        { value: 'destination-guides', label: 'Destination Guides', icon: Globe },
        { value: 'community', label: 'Community & Impact', icon: Heart },
        { value: 'notifications', label: 'Notifications', icon: Bell },
      ]
    },
    {
      label: 'System',
      items: [
        { value: 'loyalty-admin', label: 'Loyalty', icon: TrendingUp },
        { value: 'loyalty-rules', label: 'Earn Rules', icon: Settings },
        { value: 'passports', label: 'Passports', icon: Shield },
        { value: 'payments', label: 'Payments', icon: CreditCard },
        { value: 'gdpr', label: 'GDPR', icon: Lock },
        { value: 'audit', label: 'Audit Log', icon: BarChart3 },
        { value: 'itinerary-logs', label: 'Itinerary Logs', icon: Monitor },
        { value: 'settings', label: 'Settings', icon: RefreshCw },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="flex pt-[4.5rem]">

        {/* ─── Sidebar ─── */}
        <aside className="hidden lg:flex flex-col w-56 xl:w-60 shrink-0 border-r border-border bg-white sticky top-[4.5rem] h-[calc(100vh-4.5rem)] overflow-y-auto">
          <div className="px-4 py-5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <Plane size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-none">CB Travel</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Admin Panel</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-2.5 py-4 space-y-4">
            {navSections.map(section => (
              <div key={section.label}>
                <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest px-2.5 mb-1.5">{section.label}</p>
                <div className="space-y-0.5">
                  {section.items.map((item: any) => (
                    <button
                      key={item.value}
                      onClick={() => setActiveTab(item.value)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all ${
                        activeTab === item.value
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <item.icon size={14} className="shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge ? (
                        <span className="bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="px-4 py-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground/60">CB Travel Admin v2</p>
          </div>
        </aside>

        {/* ─── Main ─── */}
        <main className="flex-1 min-w-0">

          {/* Mobile nav bar */}
          <div className="lg:hidden bg-white border-b border-border overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1 px-3 py-2.5 min-w-max">
              {navSections.flatMap(s => s.items).map((item: any) => (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === item.value ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon size={12} />
                  {item.label}
                  {item.badge ? <span className="bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">{item.badge}</span> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 sm:px-6 xl:px-8 py-6">

            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield size={12} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Admin</span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">{currentNavLabel}</h1>
              </div>
            </div>

            {/* Stats cards - only on bookings tab */}
            {activeTab === 'bookings' && (
              <>
                {/* ─── Task Centre ─── */}
                {(() => {
                  const tasks = [
                    { key: 'pendingRedemptions', label: 'Loyalty Redemptions', desc: 'Pending fulfillment', icon: '🎟️', tab: 'loyalty-admin', color: 'bg-purple-50 border-purple-200', iconBg: 'bg-purple-100', textColor: 'text-purple-700' },
                    { key: 'openTickets', label: 'Support Tickets', desc: 'Open / unread', icon: '💬', tab: 'support', color: 'bg-blue-50 border-blue-200', iconBg: 'bg-blue-100', textColor: 'text-blue-700' },
                    { key: 'newQuotes', label: 'Quote Requests', desc: 'Awaiting response', icon: '📋', tab: 'quotes', color: 'bg-amber-50 border-amber-200', iconBg: 'bg-amber-100', textColor: 'text-amber-700' },
                    { key: 'newIntake', label: 'Intake Submissions', desc: 'New submissions', icon: '📦', tab: 'intake', color: 'bg-green-50 border-green-200', iconBg: 'bg-green-100', textColor: 'text-green-700' },
                    { key: 'pendingBookings', label: 'Pending Bookings', desc: 'Awaiting confirmation', icon: '⚠️', tab: 'bookings', color: 'bg-orange-50 border-orange-200', iconBg: 'bg-orange-100', textColor: 'text-orange-700' },
                  ];
                  const tc = taskCentre || { pendingRedemptions: 0, openTickets: 0, newQuotes: 0, newIntake: 0, pendingBookings: 0 };
                  const activeTasks = tasks.filter(t => (tc as any)[t.key] > 0);
                  const allClear = activeTasks.length === 0;
                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <h2 className="font-serif text-lg font-semibold text-foreground">Your Tasks</h2>
                        {!allClear && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">{activeTasks.length} action{activeTasks.length !== 1 ? 's' : ''} needed</span>}
                      </div>
                      {allClear ? (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-8 text-center">
                          <div className="text-4xl mb-2">✅</div>
                          <p className="text-lg font-semibold text-green-700">All caught up!</p>
                          <p className="text-sm text-green-600 mt-1">No pending tasks right now. Enjoy the calm.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                          {activeTasks.map(t => (
                            <div key={t.key} className={`rounded-2xl border p-4 ${t.color} flex items-center gap-4 group hover:shadow-md transition-all`}>
                              <div className={`w-11 h-11 ${t.iconBg} rounded-xl flex items-center justify-center text-xl shrink-0`}>{t.icon}</div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold ${t.textColor}`}>{t.label}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span className={`text-2xl font-bold ${t.textColor}`}>{(tc as any)[t.key]}</span>
                                <button onClick={() => setActiveTab(t.tab)} className={`text-xs font-semibold ${t.textColor} hover:underline flex items-center gap-0.5`}>
                                  View <ArrowRight size={10} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                  {stats.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        </div>
                        <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
                          <stat.icon size={16} className={stat.color} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Tab content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="hidden" />
          <TabsContent value="bookings">
            {/* Bookings mini stats */}
            {bookings && bookings.length > 0 && (() => {
              const totalVal = (bookings as any[]).reduce((s: number, b: any) => s + (parseFloat(b.totalPrice) || 0), 0);
              const confirmedCount = (bookings as any[]).filter((b: any) => b.status === 'confirmed').length;
              const pendingBCount = (bookings as any[]).filter((b: any) => b.status === 'pending').length;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Total Bookings</p>
                    <p className="text-2xl font-bold text-foreground">{(bookings as any[]).length}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 shadow-sm">
                    <p className="text-xs text-emerald-700/70 mb-1">Confirmed</p>
                    <p className="text-2xl font-bold text-emerald-800">{confirmedCount}</p>
                  </div>
                  <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 shadow-sm">
                    <p className="text-xs text-amber-700/70 mb-1">Pending</p>
                    <p className="text-2xl font-bold text-amber-800">{pendingBCount}</p>
                  </div>
                  <div className="bg-primary/5 rounded-2xl border border-primary/10 p-4 shadow-sm">
                    <p className="text-xs text-primary/70 mb-1">Total Value</p>
                    <p className="text-2xl font-bold text-primary">£{totalVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              );
            })()}

            {/* Search + Filter bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search bookings by reference, name, destination…"
                  value={bookingSearch}
                  onChange={e => setBookingSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setBookingStatusFilter(s)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all capitalize ${bookingStatusFilter === s ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-white border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}
                  >
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <AddBookingModal onSuccess={() => utils.bookings.getAllAdmin.invalidate()} />
            </div>

            {bookingsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-border" />)}</div>
            ) : (() => {
              const filteredBookings = (bookings as any[] || []).filter((b: any) => {
                const matchSearch = !bookingSearch ||
                  b.bookingReference?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                  b.leadPassengerName?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                  b.destination?.toLowerCase().includes(bookingSearch.toLowerCase());
                const matchStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
                return matchSearch && matchStatus;
              });

              if (filteredBookings.length === 0) {
                return (
                  <div className="bg-white rounded-2xl border border-border p-12 text-center">
                    <Package size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-medium">{bookingSearch || bookingStatusFilter !== 'all' ? 'No bookings match your filters.' : 'No bookings yet.'}</p>
                    {(bookingSearch || bookingStatusFilter !== 'all') && (
                      <button onClick={() => { setBookingSearch(''); setBookingStatusFilter('all'); }} className="mt-3 text-xs text-primary hover:underline font-semibold">Clear filters</button>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredBookings.map((b: any) => {
                    const total = b.totalPrice ? parseFloat(b.totalPrice) : 0;
                    const paid = b.amountPaid ? parseFloat(b.amountPaid) : 0;
                    const outstanding = total - paid;
                    const isFullyPaid = outstanding <= 0.01;
                    return (
                      <div
                        key={b.id}
                        className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer"
                        onClick={() => setSelectedBooking(b)}
                      >
                        {/* Top row: reference, destination, status */}
                        <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                              <Plane size={16} className="text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="font-mono font-bold text-primary text-sm">{b.bookingReference || `#${b.id}`}</span>
                                <StatusBadge status={b.status} />
                                {!isFullyPaid && outstanding > 0 && (
                                  <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                                    £{outstanding.toFixed(0)} outstanding
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground ml-auto group-hover:text-primary transition-colors flex items-center gap-1 hidden sm:flex">View details <ArrowRight size={11} /></span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1 font-medium text-foreground">{b.destination || 'No destination'}</span>
                                {b.leadPassengerName && <span className="flex items-center gap-1"><User size={10} />{b.leadPassengerName}</span>}
                                {b.departureDate && <span className="flex items-center gap-1"><Calendar size={10} />{b.departureDate}</span>}
                              </div>
                            </div>
                          </div>
                          {/* Price */}
                          <div className="text-right flex-shrink-0">
                            {total > 0 && <p className="font-bold text-foreground text-sm">£{total.toLocaleString()}</p>}
                            {paid > 0 && <p className="text-xs text-muted-foreground">£{paid.toLocaleString()} paid</p>}
                          </div>
                          <AdminBookingGroupBadge bookingId={b.id} />
                        </div>
                        {/* Bottom row: date + actions */}
                        <div className="px-5 pb-3 flex items-center justify-between border-t border-border/50 pt-2.5" onClick={e => e.stopPropagation()}>
                          <p className="text-xs text-muted-foreground">
                            {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          </p>
                          <div className="flex items-center gap-1">
                            <EditBookingModal booking={b} onSuccess={() => utils.bookings.getAllAdmin.invalidate()} />
                            <FlightHotelModal booking={b} onSuccess={() => utils.bookings.getAllAdmin.invalidate()} />
                            <UploadDocumentModal booking={b} onSuccess={() => utils.bookings.getAllAdmin.invalidate()} />
                            <BookingDocumentsModal booking={b} onSuccess={() => utils.bookings.getAllAdmin.invalidate()} />
                            <SendPostcardButton bookingId={b.id} booking={b} postcardSent={!!b.postcardSent} onSuccess={() => utils.bookings.getAllAdmin.invalidate()} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </TabsContent>

          {/* DEALS */}
          <TabsContent value="deals">
            <div className="flex items-center justify-between mb-5"><h2 className="font-serif text-xl font-semibold">Weekly Deals</h2><AddDealModal onSuccess={() => utils.deals.listAdmin.invalidate()} /></div>
            {dealsLoading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-border" />)}</div> : deals && deals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{deals.map((d: any) => (
                <div key={d.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${!d.isActive ? "opacity-60" : ""} border-border`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1"><p className="font-semibold text-foreground truncate">{d.title}</p>{d.isFeatured && <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Featured</span>}{!d.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}</div>
                      <p className="text-xs text-muted-foreground">{d.destination} · {d.category?.replace(/_/g, " ")}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0"><p className="font-bold text-primary">£{parseFloat(d.price).toFixed(0)}pp</p>{d.originalPrice && <p className="text-xs text-muted-foreground line-through">£{parseFloat(d.originalPrice).toFixed(0)}</p>}</div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{d.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 text-xs text-muted-foreground">{d.duration && <span>{d.duration}</span>}{d.departureDate && <span>· {d.departureDate}</span>}</div>
                    <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs text-destructive hover:bg-destructive/5" onClick={() => { if (confirm("Delete this deal?")) deleteDeal.mutate(d.id); }}><Trash2 size={13} /> Delete</Button>
                  </div>
                </div>
              ))}</div>
            ) : <div className="bg-white rounded-2xl border border-border p-12 text-center"><Globe size={40} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No deals yet.</p></div>}
          </TabsContent>

          {/* QUOTES */}
          <TabsContent value="quotes">
            <div className="flex items-center justify-between mb-5"><h2 className="font-serif text-xl font-semibold">Quote Requests</h2><span className="text-sm text-muted-foreground">{quotes?.length || 0} total</span></div>
            {quotesLoading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-border" />)}</div> : quotes && quotes.length > 0 ? (
              <QuotesList quotes={quotes} updateQuoteStatus={updateQuoteStatus} />
            ) : <div className="bg-white rounded-2xl border border-border p-12 text-center"><FileText size={40} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No quote requests yet.</p></div>}
          </TabsContent>

          {/* QUOTES MANAGER */}
          <TabsContent value="quotes-manager">
            <AdminQuotesManager />
          </TabsContent>

          {/* ACCOUNTS */}
          <TabsContent value="accounts">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold">User Accounts</h2>
              <CreateUserModal onSuccess={() => utils.admin.users.invalidate()} />
            </div>
            {usersLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-border" />)}</div>
            ) : allUsers && allUsers.length > 0 ? (
              <div className="space-y-2">
                {allUsers.map((u: any) => {
                  const isExpanded = expandedUserId === u.id;
                  const userBookings = (bookings || []).filter((b: any) =>
                    b.clientId === u.id ||
                    (b.leadPassengerEmail && b.leadPassengerEmail.toLowerCase() === (u.email || '').toLowerCase())
                  );
                  return (
                    <div key={u.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${u.isDisabled ? "opacity-60" : "border-border"}`}>
                      {/* Row header */}
                      <div className="flex items-center justify-between px-5 py-4">
                        <button
                          className="flex items-center gap-3 min-w-0 flex-1 text-left"
                          onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${u.role === "admin" ? "bg-primary" : "bg-slate-400"}`}>
                            {(u.name || u.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-foreground truncate">{u.name || "—"}</p>
                              {u.role === "admin" && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Admin</span>}
                              {u.isDisabled && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">Disabled</span>}
                              {userBookings.length > 0 && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{userBookings.length} booking{userBookings.length !== 1 ? "s" : ""}</span>}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                          </div>
                          <span className="ml-2 text-muted-foreground shrink-0 text-xs">{isExpanded ? "▲" : "▼"}</span>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-3" onClick={e => e.stopPropagation()}>
                          <ChangePasswordModal user={u} onSuccess={() => utils.admin.users.invalidate()} />
                          <SendSetPasswordLinkModal user={u} onSuccess={() => utils.admin.users.invalidate()} />
                          <SendEmailModal recipient={u} />
                          <Button variant="ghost" size="sm" className={`rounded-lg gap-1 text-xs ${u.isDisabled ? "text-green-600 hover:bg-green-50" : "text-orange-600 hover:bg-orange-50"}`} onClick={() => disableUser.mutate({ id: u.id, disabled: !u.isDisabled })}>{u.isDisabled ? <><UserCheck size={13} /> Enable</> : <><UserX size={13} /> Disable</>}</Button>
                          <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs text-destructive hover:bg-destructive/5" onClick={() => { if (confirm(`Delete account for ${u.name || u.email}? This cannot be undone.`)) deleteUser.mutate(u.id); }}><Trash2 size={13} /> Delete</Button>
                        </div>
                      </div>
                      {/* Expanded profile panel */}
                      {isExpanded && (
                        <ClientProfilePanel
                          user={u}
                          userBookings={userBookings}
                          onUpdate={() => utils.admin.users.invalidate()}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-border p-12 text-center">
                <Users size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No accounts yet.</p>
              </div>
            )}
          </TabsContent>

          {/* EMAILS */}
          <TabsContent value="emails">
            <div className="space-y-8">
              <ComposeEmailSection allUsers={allUsers} />
              <EmailLogsSection />
            </div>
          </TabsContent>


          {/* FAQ */}
          <TabsContent value="faq">
            <div className="flex items-center justify-between mb-5"><h2 className="font-serif text-xl font-semibold">Frequently Asked Questions</h2><FaqItemModal onSuccess={() => utils.faq.listAdmin.invalidate()} /></div>
            {faqLoading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-border" />)}</div> : faqItems && faqItems.length > 0 ? (
              <div className="space-y-3">{faqItems.map((f: any) => (
                <div key={f.id} className={`bg-white rounded-2xl border border-border shadow-sm p-5 ${!f.isActive ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap"><span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{f.category}</span>{!f.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Hidden</span>}<span className="text-xs text-muted-foreground">Order: {f.sortOrder}</span></div>
                      <p className="font-semibold text-foreground text-sm mb-1">{f.question}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{f.answer}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <FaqItemModal item={f} onSuccess={() => utils.faq.listAdmin.invalidate()} />
                      <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs text-destructive hover:bg-destructive/5" onClick={() => { if (confirm("Delete this FAQ item?")) deleteFaq.mutate(f.id); }}><Trash2 size={13} /> Delete</Button>
                    </div>
                  </div>
                </div>
              ))}</div>
            ) : <div className="bg-white rounded-2xl border border-border p-12 text-center"><HelpCircle size={40} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No FAQ items yet. Add your first question above.</p></div>}
          </TabsContent>

          {/* TESTIMONIALS */}
          <TabsContent value="testimonials">
            <div className="flex items-center justify-between mb-5"><h2 className="font-serif text-xl font-semibold">Client Reviews</h2><AddTestimonialModal onSuccess={() => utils.testimonials.getAllAdmin.invalidate()} /></div>
            {testimonialsLoading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2].map(i => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-border" />)}</div> : testimonials && testimonials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{testimonials.map((t: any) => (
                <div key={t.id} className="bg-white rounded-2xl border border-border shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div><p className="font-semibold text-foreground">{t.clientName}</p><p className="text-xs text-muted-foreground">{t.destination}</p></div>
                    <div className="flex items-center gap-1">
                      {!t.isApproved && <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs text-green-600 hover:bg-green-50" onClick={() => approveTestimonial.mutate(t.id)}><CheckCircle2 size={13} /> Approve</Button>}
                      <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs text-destructive hover:bg-destructive/5" onClick={() => { if (confirm("Delete this review?")) deleteTestimonial.mutate(t.id); }}><Trash2 size={13} /> Delete</Button>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-2">{[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"} />)}</div>
                  <p className="text-sm font-medium text-foreground mb-1">"{t.title}"</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.content}</p>
                  {!t.isApproved && <span className="inline-flex items-center gap-1 mt-2 text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full"><AlertCircle size={11} /> Pending approval</span>}
                </div>
              ))}</div>
            ) : <div className="bg-white rounded-2xl border border-border p-12 text-center"><Star size={40} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No testimonials yet.</p></div>}
          </TabsContent>

          {/* SUBSCRIBERS */}
          <TabsContent value="subscribers">
            <div className="flex items-center justify-between mb-5"><h2 className="font-serif text-xl font-semibold">Newsletter Subscribers</h2><span className="text-sm text-muted-foreground">{subscribers?.length || 0} total</span></div>
            {subscribers && subscribers.length > 0 ? (
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="divide-y divide-border">{subscribers.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/8 rounded-full flex items-center justify-center text-primary font-semibold text-xs">{(s.name || s.email).charAt(0).toUpperCase()}</div>
                      <div>{s.name && <p className="text-sm font-medium text-foreground">{s.name}</p>}<p className="text-xs text-muted-foreground">{s.email}</p></div>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString("en-GB")}</span>
                  </div>
                ))}</div>
              </div>
            ) : <div className="bg-white rounded-2xl border border-border p-12 text-center"><Mail size={40} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No subscribers yet.</p></div>}
          </TabsContent>
          {/* PROMO CODES */}
          <TabsContent value="promos">
            <div className="flex items-center justify-between mb-5"><h2 className="font-serif text-xl font-semibold">Promotion Codes</h2><span className="text-sm text-muted-foreground">{promoCodes?.length || 0} codes</span></div>
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-5 space-y-4">
              <p className="font-semibold text-sm">Create New Promo Code</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5 col-span-2 md:col-span-1"><Label>Code *</Label><Input placeholder="SUMMER50" value={promoForm.code} onChange={e => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})} className="rounded-xl font-mono uppercase" maxLength={30} /></div>
                <div className="space-y-1.5"><Label>Description</Label><Input placeholder="Summer sale" value={promoForm.description} onChange={e => setPromoForm({...promoForm, description: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Discount (£) *</Label><Input type="number" min="0.01" step="0.01" placeholder="50.00" value={promoForm.discountAmount} onChange={e => setPromoForm({...promoForm, discountAmount: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Expires (optional)</Label><Input type="date" value={promoForm.expiresAt} onChange={e => setPromoForm({...promoForm, expiresAt: e.target.value})} className="rounded-xl" /></div>
              </div>
              <Button onClick={() => { if (!promoForm.code || !promoForm.discountAmount) { toast.error("Code and discount amount are required."); return; } createPromo.mutate({ code: promoForm.code, description: promoForm.description || undefined, discountAmount: parseFloat(promoForm.discountAmount), expiresAt: promoForm.expiresAt || undefined }); }} className="rounded-xl btn-gold border-0 text-foreground gap-2" disabled={createPromo.isPending}><Tag size={14} /> {createPromo.isPending ? "Creating..." : "Create Code"}</Button>
            </div>
            {promoLoading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-border" />)}</div> : promoCodes && promoCodes.length > 0 ? (
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="divide-y divide-border">{promoCodes.map((p: any) => (
                  <div key={p.id} className={`flex items-center justify-between px-5 py-4 ${!p.isActive ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 bg-primary/8 rounded-xl flex items-center justify-center flex-shrink-0"><Percent size={16} className="text-primary" /></div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-primary text-sm">{p.code}</span>
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">£{parseFloat(p.discountAmount).toFixed(0)} off</span>
                          {!p.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                          {p.usedAt && <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">Used</span>}
                          {p.codeType === "loyalty" && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Loyalty</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{p.description || "No description"}{p.expiresAt && ` · Expires ${new Date(p.expiresAt).toLocaleDateString("en-GB")}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                      <Button variant="ghost" size="sm" className={`rounded-lg gap-1 text-xs ${p.isActive ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`} onClick={() => updatePromo.mutate({ id: p.id, isActive: !p.isActive })}>{p.isActive ? "Disable" : "Enable"}</Button>
                      <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-xs text-destructive hover:bg-destructive/5" onClick={() => { if (confirm(`Delete promo code ${p.code}?`)) deletePromo.mutate(p.id); }}><Trash2 size={13} /> Delete</Button>
                    </div>
                  </div>
                ))}</div>
              </div>
            ) : <div className="bg-white rounded-2xl border border-border p-12 text-center"><Tag size={40} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No promo codes yet. Create your first one above.</p></div>}
          </TabsContent>

          {/* INTAKE FORMS */}
          <TabsContent value="intake">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h2 className="font-serif text-xl font-semibold">Booking Intake Forms</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs" onClick={() => {
                  const origin = window.location.origin;
                  navigator.clipboard.writeText(origin + "/booking-intake");
                  toast.success("Intake form link copied!");
                }}>
                  <Copy size={13} /> Copy Intake Form Link
                </Button>
                {intakeSubmissions && intakeSubmissions.length > 0 && (
                  <Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs" onClick={() => {
                    const headers = ["Ref","Name","Email","Phone","Destination","Departure","Return","Adults","Children","Status","Submitted"];
                    const rows = intakeSubmissions.map((s: any) => [
                      s.submissionRef, `${s.leadFirstName} ${s.leadLastName}`, s.email, s.phone,
                      s.destination, s.departureDate || "", s.returnDate || "",
                      s.numberOfAdults, s.numberOfChildren, s.status,
                      new Date(s.createdAt).toLocaleDateString("en-GB")
                    ]);
                    const csv = [headers, ...rows].map((r: any[]) => r.map((c: any) => `"${c}"`).join(",")).join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = "booking-intake-submissions.csv"; a.click();
                  }}>
                    <Download size={13} /> Export CSV
                  </Button>
                )}
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Submissions", value: intakeSubmissions?.length || 0, color: "text-primary", bg: "bg-primary/8" },
                { label: "New (Unreviewed)", value: intakeSubmissions?.filter((s:any)=>s.status==="new").length || 0, color: "text-red-600", bg: "bg-red-50" },
                { label: "Converted", value: intakeSubmissions?.filter((s:any)=>s.status==="converted").length || 0, color: "text-green-600", bg: "bg-green-50" },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl p-4 border border-border shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            {intakeLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-border" />)}</div>
            ) : intakeSubmissions && intakeSubmissions.length > 0 ? (
              <div className="space-y-3">
                {intakeSubmissions.map((s: any) => (
                  <div key={s.id} className="bg-white rounded-2xl border border-border shadow-sm p-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group" onClick={() => { setSelectedIntake(s); setIntakeAdminNotes(s.adminNotes || ""); }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono font-bold text-primary text-sm">{s.submissionRef}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.status==="new"?"bg-red-50 text-red-700":s.status==="reviewed"?"bg-blue-50 text-blue-700":s.status==="converted"?"bg-green-50 text-green-700":"bg-gray-100 text-gray-600"}`}>
                            {s.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users size={11} />{s.leadFirstName} {s.leadLastName}</span>
                          <span className="flex items-center gap-1"><Mail size={11} />{s.email}</span>
                          <span className="flex items-center gap-1"><MapPin size={11} />{s.destination}</span>
                          {s.departureDate && <span className="flex items-center gap-1"><Calendar size={11} />{s.departureDate} – {s.returnDate}</span>}
                          <span className="flex items-center gap-1 text-muted-foreground/60"><Clock size={11} />{new Date(s.createdAt).toLocaleDateString("en-GB")}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Eye size={13} /> View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-border p-12 text-center">
                <ClipboardList size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No intake form submissions yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Share the booking intake form link with clients who are ready to book.</p>
                <Button variant="outline" className="mt-4 rounded-xl gap-2 text-sm" onClick={() => { navigator.clipboard.writeText(window.location.origin + "/booking-intake"); toast.success("Link copied!"); }}>
                  <Copy size={14} /> Copy Intake Form Link
                </Button>
              </div>
            )}
          </TabsContent>

          {selectedBooking && (
            <BookingDetailModal
              booking={selectedBooking}
              onClose={() => setSelectedBooking(null)}
              onSuccess={() => utils.bookings.getAllAdmin.invalidate()}
            />
          )}

                    {/* INTAKE DETAIL MODAL */}
          {selectedIntake && (
            <Dialog open={!!selectedIntake} onOpenChange={() => setSelectedIntake(null)}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl flex items-center gap-2">
                    <ClipboardList size={18} className="text-primary" />
                    Intake Form — {selectedIntake.submissionRef}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 mt-2">
                  {/* Status */}
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Select value={selectedIntake.status} onValueChange={v => {
                        updateIntakeStatus.mutate({ id: selectedIntake.id, status: v as any, adminNotes: intakeAdminNotes });
                        setSelectedIntake({ ...selectedIntake, status: v });
                      }}>
                        <SelectTrigger className="rounded-xl h-9 mt-1 w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      Submitted {new Date(selectedIntake.createdAt).toLocaleDateString("en-GB")}
                    </div>
                  </div>

                  {/* Lead Traveller */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Lead Traveller</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedIntake.leadFirstName} {selectedIntake.leadLastName}</span></div>
                      <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedIntake.email}</span></div>
                      <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selectedIntake.phone}</span></div>
                      {selectedIntake.dateOfBirth && <div><span className="text-muted-foreground">DOB:</span> <span>{selectedIntake.dateOfBirth}</span></div>}
                      {selectedIntake.nationality && <div><span className="text-muted-foreground">Nationality:</span> <span>{selectedIntake.nationality}</span></div>}
                      {selectedIntake.passportNumber && <div><span className="text-muted-foreground">Passport:</span> <span>{selectedIntake.passportNumber}</span></div>}
                      {selectedIntake.passportExpiry && <div><span className="text-muted-foreground">Passport Expiry:</span> <span>{selectedIntake.passportExpiry}</span></div>}
                      {selectedIntake.passportIssuingCountry && <div><span className="text-muted-foreground">Issuing Country:</span> <span>{selectedIntake.passportIssuingCountry}</span></div>}
                      {selectedIntake.address && <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <span>{selectedIntake.address}</span></div>}
                    </div>
                  </div>

                  {/* Holiday Details */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Holiday Details</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="col-span-2"><span className="text-muted-foreground">Destination:</span> <span className="font-semibold text-primary">{selectedIntake.destination}</span></div>
                      {selectedIntake.departureAirport && <div><span className="text-muted-foreground">Departure Airport:</span> <span>{selectedIntake.departureAirport}</span></div>}
                      {selectedIntake.departureDate && <div><span className="text-muted-foreground">Departure:</span> <span>{selectedIntake.departureDate}</span></div>}
                      {selectedIntake.returnDate && <div><span className="text-muted-foreground">Return:</span> <span>{selectedIntake.returnDate}</span></div>}
                      <div><span className="text-muted-foreground">Flexible Dates:</span> <span>{selectedIntake.flexibleDates ? "Yes" : "No"}</span></div>
                      <div><span className="text-muted-foreground">Adults:</span> <span>{selectedIntake.numberOfAdults}</span></div>
                      {selectedIntake.numberOfChildren > 0 && <div><span className="text-muted-foreground">Children:</span> <span>{selectedIntake.numberOfChildren} (ages: {selectedIntake.childAges})</span></div>}
                    </div>
                  </div>

                  {/* Additional Travellers */}
                  {selectedIntake.additionalTravellers && Array.isArray(selectedIntake.additionalTravellers) && selectedIntake.additionalTravellers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Additional Travellers ({selectedIntake.additionalTravellers.length})</p>
                      <div className="space-y-2">
                        {selectedIntake.additionalTravellers.map((t: any, i: number) => (
                          <div key={i} className="bg-muted/20 rounded-xl p-3 text-sm grid grid-cols-2 gap-2">
                            <div><span className="text-muted-foreground">Name:</span> <span>{t.firstName} {t.lastName}</span></div>
                            {t.dateOfBirth && <div><span className="text-muted-foreground">DOB:</span> <span>{t.dateOfBirth}</span></div>}
                            {t.passportNumber && <div><span className="text-muted-foreground">Passport:</span> <span>{t.passportNumber}</span></div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferences */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Preferences & Requirements</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedIntake.holidayType && <div><span className="text-muted-foreground">Holiday Type:</span> <span>{selectedIntake.holidayType}</span></div>}
                      {selectedIntake.accommodationType && <div><span className="text-muted-foreground">Accommodation:</span> <span>{selectedIntake.accommodationType}</span></div>}
                      {selectedIntake.boardBasis && <div><span className="text-muted-foreground">Board Basis:</span> <span>{selectedIntake.boardBasis}</span></div>}
                      {selectedIntake.roomType && <div><span className="text-muted-foreground">Room Type:</span> <span>{selectedIntake.roomType}</span></div>}
                      {selectedIntake.budget && <div><span className="text-muted-foreground">Budget:</span> <span className="font-semibold">{selectedIntake.budget}</span></div>}
                      {selectedIntake.paymentMethod && <div><span className="text-muted-foreground">Payment:</span> <span>{selectedIntake.paymentMethod}</span></div>}
                      {selectedIntake.specialOccasion && <div className="col-span-2"><span className="text-muted-foreground">Special Occasion:</span> <span className="font-semibold text-pink-600">🎉 {selectedIntake.specialOccasion}</span></div>}
                      {selectedIntake.dietaryRequirements && <div className="col-span-2"><span className="text-muted-foreground">Dietary:</span> <span>{selectedIntake.dietaryRequirements}</span></div>}
                      {selectedIntake.accessibilityNeeds && <div className="col-span-2"><span className="text-muted-foreground">Accessibility:</span> <span>{selectedIntake.accessibilityNeeds}</span></div>}
                      {selectedIntake.otherRequests && <div className="col-span-2"><span className="text-muted-foreground">Other Requests:</span> <span>{selectedIntake.otherRequests}</span></div>}
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Admin Notes</Label>
                    <Textarea
                      value={intakeAdminNotes}
                      onChange={e => setIntakeAdminNotes(e.target.value)}
                      placeholder="Add internal notes about this submission..."
                      className="rounded-xl resize-none mt-2"
                      rows={3}
                    />
                    <Button size="sm" className="mt-2 rounded-xl btn-gold border-0 text-foreground" onClick={() => {
                      updateIntakeStatus.mutate({ id: selectedIntake.id, status: selectedIntake.status, adminNotes: intakeAdminNotes });
                    }}>Save Notes</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* V6: BOOKED DESTINATIONS */}
          <TabsContent value="destinations">
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-serif text-xl font-semibold">🗺 Booked Destinations</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Manage destination cards shown on the homepage</p>
                </div>
                <div className="flex gap-2">
                  {bookedDestinations && bookedDestinations.length > 0 && (
                    <Button
                      variant="outline"
                      className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                      onClick={async () => {
                        if (confirm(`Delete all ${bookedDestinations.length} destination${bookedDestinations.length !== 1 ? 's' : ''}? This cannot be undone.`)) {
                          await deleteAllDestMut.mutateAsync();
                        }
                      }}
                      disabled={deleteAllDestMut.isPending}
                    >
                      {deleteAllDestMut.isPending ? 'Deleting…' : '🗑 Delete All'}
                    </Button>
                  )}
                  <Button
                    onClick={() => { setNewDestForm({ name: '', lastBooked: '', imageBase64: '', imageMimeType: '', imageUrl: '' }); setDestImageName(''); setDestFetchedImages([]); setDestImageIndex(0); setShowAddDestModal(true); }}
                    className="rounded-xl btn-gold border-0 text-foreground"
                  >
                    + Add New Destination
                  </Button>
                </div>
              </div>

              {/* Destination cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(bookedDestinations || []).map((d: any) => (
                  <div key={d.id} className="rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Image */}
                    <div className="relative h-36 bg-muted overflow-hidden">
                      {d.imageUrl ? (
                        <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl">🌍</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <p className="absolute bottom-2 left-3 text-white font-bold text-sm drop-shadow">{d.name}</p>
                    </div>
                    {/* Details */}
                    <div className="p-3">
                      {editingDest?.id === d.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingDest.name}
                            onChange={e => setEditingDest((p: any) => ({ ...p, name: e.target.value }))}
                            className="h-7 rounded text-sm"
                            placeholder="Destination name"
                          />
                          <Input
                            type="date"
                            value={editingDest.lastBooked || ''}
                            onChange={e => setEditingDest((p: any) => ({ ...p, lastBooked: e.target.value }))}
                            className="h-7 rounded text-sm"
                          />
                          <div className="flex gap-1">
                            <Button size="sm" variant="default" className="h-7 rounded px-2 text-xs flex-1" onClick={async () => { await updateDestMut.mutateAsync({ id: d.id, name: editingDest.name, lastBooked: editingDest.lastBooked }); setEditingDest(null); refetchDestinations(); toast.success("Updated!"); }}>Save</Button>
                            <Button size="sm" variant="ghost" className="h-7 rounded px-2 text-xs" onClick={() => setEditingDest(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {d.lastBooked ? `Last booked: ${d.lastBooked}` : 'No date set'}
                            </p>
                            {d.tripCount > 0 && <p className="text-xs text-muted-foreground">{d.tripCount} trip{d.tripCount !== 1 ? 's' : ''}</p>}
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 rounded p-0 text-xs" onClick={() => setEditingDest({ ...d })}>✏️</Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 rounded p-0 text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={async () => { if (confirm('Delete ' + d.name + '?')) { await deleteDestMut.mutateAsync({ id: d.id }); refetchDestinations(); toast.success("Deleted"); } }}>🗑</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(!bookedDestinations || bookedDestinations.length === 0) && (
                  <div className="col-span-3 text-center py-12 text-muted-foreground">
                    <p className="text-3xl mb-2">🗺</p>
                    <p>No destinations yet. Add one to get started!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Add Destination Modal */}
            {showAddDestModal && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowAddDestModal(false); }}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                  <h3 className="font-bold text-lg text-foreground mb-1">Add New Destination</h3>
                  <p className="text-sm text-muted-foreground mb-5">Fill in the details below to add a destination card.</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Destination Name *</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. Santorini, Greece"
                          value={newDestForm.name}
                          onChange={e => setNewDestForm(p => ({ ...p, name: e.target.value }))}
                          className="rounded-xl flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl shrink-0 text-sm px-3"
                          disabled={!newDestForm.name.trim() || fetchDestImageMut.isPending}
                          onClick={() => {
                            if (destFetchedImages.length > 1) {
                              // Cycle locally — no server call needed
                              const next = (destImageIndex + 1) % destFetchedImages.length;
                              setDestImageIndex(next);
                              setNewDestForm(p => ({ ...p, imageUrl: destFetchedImages[next], imageBase64: '', imageMimeType: '' }));
                            } else {
                              // First fetch — hit the server
                              setDestFetchedImages([]);
                              setDestImageIndex(0);
                              fetchDestImageMut.mutate({ name: newDestForm.name.trim() });
                            }
                          }}
                          title="Auto-find travel photos for this destination"
                        >
                          {fetchDestImageMut.isPending ? '⏳ Searching…' : destFetchedImages.length > 1 ? `🔄 Next photo (${destImageIndex + 1}/${destFetchedImages.length})` : '🔍 Find Image'}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Enter a name then click <strong>Find Image</strong> to search for travel photos — press again to cycle through results.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Date Last Booked</label>
                      <Input
                        type="date"
                        value={newDestForm.lastBooked}
                        onChange={e => setNewDestForm(p => ({ ...p, lastBooked: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Destination Image</label>
                      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                        {(newDestForm.imageUrl || newDestForm.imageBase64) ? (
                          <>
                            <img
                              src={newDestForm.imageUrl || newDestForm.imageBase64}
                              alt="Preview"
                              className="h-28 w-full object-cover rounded-lg"
                            />
                            <p className="text-xs text-muted-foreground">
                              {newDestForm.imageUrl ? `🌐 Travel photo${destFetchedImages.length > 1 ? ` (${destImageIndex + 1}/${destFetchedImages.length}) — press Find Image to cycle` : ''} — click to replace with upload` : `${destImageName} — click to change`}
                            </p>
                          </>
                        ) : (
                          <>
                            <span className="text-3xl">📷</span>
                            <p className="text-sm text-muted-foreground">Click to upload an image</p>
                            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP up to 5MB</p>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
                            setDestImageName(file.name);
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setNewDestForm(p => ({ ...p, imageBase64: ev.target?.result as string, imageMimeType: file.type, imageUrl: '' }));
                            setDestFetchedImages([]); setDestImageIndex(0);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button
                      className="flex-1 rounded-xl btn-gold border-0 text-foreground"
                      disabled={!newDestForm.name.trim() || createDestMut.isPending}
                      onClick={() => {
                        if (!newDestForm.name.trim()) { toast.error("Please enter a destination name"); return; }
                        createDestMut.mutate({
                          name: newDestForm.name.trim(),
                          lastBooked: newDestForm.lastBooked || undefined,
                          imageUrl: newDestForm.imageUrl || undefined,
                          imageBase64: newDestForm.imageBase64 || undefined,
                          imageMimeType: newDestForm.imageMimeType || undefined,
                        });
                      }}
                    >
                      {createDestMut.isPending ? "Adding…" : "Add Destination"}
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowAddDestModal(false)}>Cancel</Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* V6: CLIENT CRM NOTES */}
          <TabsContent value="client-notes">
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-serif text-xl font-semibold mb-5">📋 Client CRM Notes</h2>
              <p className="text-sm text-muted-foreground mb-4">Admin-only notes — never visible to clients. Record preferences, pet names, anniversaries, special requirements.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <select className="select select-bordered select-sm rounded-xl" value={noteClientId} onChange={e => setNoteClientId(e.target.value)}>
                  <option value="">Select client...</option>
                  {(allUsers || []).map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
                <Input placeholder="Note content..." value={noteContent} onChange={e => setNoteContent(e.target.value)} className="rounded-xl md:col-span-2" />
              </div>
              <Button size="sm" className="rounded-xl mb-6" disabled={!noteClientId || !noteContent} onClick={async () => {
                await createNoteMut.mutateAsync({ userId: Number(noteClientId), note: noteContent });
                setNoteContent('');
                toast.success('Note saved');
              }}>+ Add Note</Button>
              {noteClientId && (
                <ClientNotesList userId={Number(noteClientId)} />
              )}
            </div>
          </TabsContent>

          {/* V7: SUPPORT TICKETS */}
          <TabsContent value="support">
            <AdminSupportTab tickets={allTickets || []} refetch={refetchTickets} />
          </TabsContent>


          {/* V6: NEWSLETTER CAMPAIGNS */}
          <TabsContent value="campaigns">
            <div className="bg-white rounded-2xl border border-border p-6 space-y-6">
              <h2 className="font-serif text-xl font-semibold">📧 Newsletter Campaigns</h2>
              <div className="space-y-3 border rounded-xl p-4 bg-muted/10">
                <h3 className="font-semibold text-sm">Create New Campaign</h3>
                <Input placeholder="Subject line" value={campaignForm.subject} onChange={e=>setCampaignForm(p=>({...p,subject:e.target.value}))} className="rounded-xl" />
                <Textarea placeholder="HTML body (or plain text)" value={campaignForm.htmlBody} onChange={e=>setCampaignForm(p=>({...p,htmlBody:e.target.value}))} className="rounded-xl resize-none" rows={5} />
                <Button size="sm" className="rounded-xl" disabled={!campaignForm.subject || !campaignForm.htmlBody} onClick={async () => {
                  await createCampaignMut.mutateAsync(campaignForm);
                  setCampaignForm({subject:'',htmlBody:''});
                  refetchCampaigns();
                  toast.success('Campaign saved!');
                }}>Save Campaign</Button>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-3">Campaigns</h3>
                <div className="space-y-2">
                  {(campaigns || []).map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-3 border rounded-xl bg-white">
                      <div>
                        <p className="font-medium text-sm">{c.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(c.createdAt).toLocaleDateString('en-GB')}
                          {c.sentAt && ` · Sent: ${new Date(c.sentAt).toLocaleDateString('en-GB')} (${c.recipientCount} recipients)`}
                        </p>
                      </div>
                      {!c.sentAt && (
                        <Button size="sm" className="rounded-xl" onClick={async () => {
                          if (confirm('Send this campaign to all active subscribers?')) {
                            const res = await sendCampaignMut.mutateAsync({ campaignId: c.id });
                            toast.success(`Sent to ${res.sent} subscribers!`);
                            refetchCampaigns();
                          }
                        }}>Send Now</Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* V6: AUDIT LOG */}
          <TabsContent value="audit">
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-xl font-semibold">📊 Audit Log</h2>
                <Input placeholder="Search logs..." value={auditSearch} onChange={e=>setAuditSearch(e.target.value)} className="rounded-xl w-64" />
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white"><tr className="border-b"><th className="text-left py-2 px-3">Time</th><th className="text-left py-2 px-3">Actor</th><th className="text-left py-2 px-3">Action</th><th className="text-left py-2 px-3">Entity</th><th className="text-left py-2 px-3">Details</th></tr></thead>
                  <tbody>
                    {(auditLogs || []).filter((l:any) =>
                      !auditSearch || JSON.stringify(l).toLowerCase().includes(auditSearch.toLowerCase())
                    ).map((l: any) => (
                      <tr key={l.id} className="border-b hover:bg-muted/10">
                        <td className="py-1.5 px-3 whitespace-nowrap text-muted-foreground">{new Date(l.createdAt).toLocaleString('en-GB', {dateStyle:'short',timeStyle:'short'})}</td>
                        <td className="py-1.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${l.actorType==='admin'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>{l.actorType}</span>
                          <span className="ml-1 text-muted-foreground">#{l.actorId}</span>
                        </td>
                        <td className="py-1.5 px-3 font-medium">{l.action}</td>
                        <td className="py-1.5 px-3 text-muted-foreground">{l.entityType} {l.entityId ? `#${l.entityId}` : ''}</td>
                        <td className="py-1.5 px-3 text-muted-foreground max-w-xs truncate">{l.newValue ? JSON.stringify(l.newValue) : l.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ITINERARY TOOL LOGS */}
          <TabsContent value="itinerary-logs">
            <div className="space-y-5">
              {/* Password Management */}
              <div className="bg-white rounded-2xl border border-amber-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Lock size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">Access Password</h3>
                    <p className="text-xs text-muted-foreground">Controls who can enter the AI Itinerary Generator at <code className="bg-muted px-1 rounded text-xs">travelcb.co.uk/itinerarygenerator</code></p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex-1">
                    <span className="text-xs text-amber-700 font-medium">Current password:</span>
                    <code className="text-sm font-mono text-amber-900 font-bold">{itineraryPasswordData?.password || 'CBTRAVEL2025'}</code>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      placeholder="New password (min. 6 chars)"
                      value={itineraryPasswordEdit}
                      onChange={e => setItineraryPasswordEdit(e.target.value)}
                      className="rounded-xl text-sm font-mono"
                    />
                    <Button
                      onClick={() => { if (itineraryPasswordEdit.length >= 6) setItineraryPasswordMutation.mutate({ password: itineraryPasswordEdit }); else toast.error("Password must be at least 6 characters"); }}
                      disabled={setItineraryPasswordMutation.isPending || !itineraryPasswordEdit}
                      className="rounded-xl btn-gold border-0 text-foreground shrink-0"
                      size="sm"
                    >
                      {setItineraryPasswordMutation.isPending ? 'Saving…' : 'Update'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Header */}
              <div className="bg-white rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Monitor size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl font-semibold text-[#1e3a5f]">Itinerary Generator Logs</h2>
                      <p className="text-sm text-muted-foreground">Every login and generation at <code className="bg-muted px-1 rounded text-xs">travelcb.co.uk/itinerarygenerator</code></p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-center px-4 py-2 bg-indigo-50 rounded-xl">
                      <div className="text-2xl font-bold text-indigo-700">{(itineraryLogs || []).length}</div>
                      <div className="text-xs text-muted-foreground">Total Events</div>
                    </div>
                    <div className="text-center px-4 py-2 bg-green-50 rounded-xl">
                      <div className="text-2xl font-bold text-green-700">{new Set((itineraryLogs || []).map((l:any) => l.agencyName).filter(Boolean)).size}</div>
                      <div className="text-xs text-muted-foreground">Agencies</div>
                    </div>
                    <div className="text-center px-4 py-2 bg-amber-50 rounded-xl">
                      <div className="text-2xl font-bold text-amber-700">{(itineraryLogs || []).filter((l:any) => l.eventType === 'generation').length}</div>
                      <div className="text-xs text-muted-foreground">Itineraries Generated</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logs table */}
              <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 border-b border-border">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Time</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Event</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Agency</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Agent Name</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Destination</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(itineraryLogs || []).length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No access logs yet. They'll appear here once someone uses the tool.</td></tr>
                      ) : (itineraryLogs || []).map((l: any, i: number) => (
                        <tr key={l.id || i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap text-muted-foreground text-xs">
                            {new Date(l.accessedAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              l.eventType === 'generation' ? 'bg-green-100 text-green-700' :
                              l.eventType === 'login' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {l.eventType === 'generation' ? '✨' : l.eventType === 'login' ? '🔑' : '👁️'}
                              {l.eventType || 'visit'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-[#1e3a5f]">{l.agencyName || '—'}</td>
                          <td className="py-3 px-4 text-muted-foreground">{l.agentName || '—'}</td>
                          <td className="py-3 px-4">
                            {l.destination ? (
                              <span className="flex items-center gap-1.5 text-sm">
                                <MapPinned size={13} className="text-muted-foreground" />
                                {l.destination}
                              </span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{l.ipAddress || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* V6: LOYALTY HUB LINK */}
          <TabsContent value="loyalty-admin">
            <div className="bg-white rounded-2xl border border-border p-8 text-center">
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="font-serif text-2xl font-bold text-[#1e3a5f] mb-2">Loyalty Hub</h2>
              <p className="text-muted-foreground mb-6">Manage the full loyalty programme, rewards, member points, vouchers, and multiplier events from the dedicated Loyalty Hub.</p>
              <a href="/admin/loyalty" className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#24487a] transition-colors">
                Open Loyalty Hub →
              </a>
            </div>
          </TabsContent>

          {/* V10: LOYALTY EARN RULES */}
          <TabsContent value="loyalty-rules">
            <div className="bg-white rounded-2xl border border-border p-6">
              <LoyaltyRulesSection />
            </div>
          </TabsContent>

          {/* GDPR REQUESTS */}
          <TabsContent value="gdpr">
            <GdprAdminSection />
          </TabsContent>

          {/* V6: SETTINGS */}
          <TabsContent value="settings">
            <div className="bg-white rounded-2xl border border-border p-6 space-y-6">
              <h2 className="font-serif text-xl font-semibold">⚙️ Site Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'sos_whatsapp_number', label: '🆘 SOS Emergency WhatsApp Number', placeholder: '07534168295' },
                  { key: 'sos_mobile_number', label: '🆘 SOS Emergency Mobile Number', placeholder: '07534168295' },
                  { key: 'live_chat_whatsapp', label: '💬 Live Chat WhatsApp Number', placeholder: '07495823953' },
                  { key: 'openai_api_key', label: '🤖 OpenAI API Key', placeholder: 'sk-proj-...' },
                  { key: 'aviationstack_api_key', label: '✈️ AviationStack API Key', placeholder: 'Your API key' },
                  { key: 'admin_email', label: '📧 Admin Email', placeholder: 'hello@travelcb.co.uk' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-sm">{label}</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder={placeholder}
                        defaultValue={(allSettings as any)?.[key] || ''}
                        onChange={e => setSettingsForm(p => ({ ...p, [key]: e.target.value }))}
                        className="rounded-xl"
                      />
                      <Button size="sm" className="rounded-xl shrink-0" onClick={async () => {
                        if (settingsForm[key] !== undefined) {
                          await setSettingMut.mutateAsync({ key, value: settingsForm[key] });
                          toast.success('Saved!');
                          refetchSettings();
                        }
                      }}>Save</Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'ai_features_enabled', label: '🤖 AI Features' },
                  { key: 'whatsapp_chat_enabled', label: '💬 WhatsApp Chat Button' },
                  { key: 'smart_notifications_7day', label: '📬 7-Day Notifications' },
                  { key: 'smart_notifications_48hr', label: '⏰ 48hr Notifications' },
                  { key: 'smart_notifications_dayof', label: '🌅 Day-of Notifications' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-xl bg-muted/10">
                    <Label className="text-xs font-medium">{label}</Label>
                    <input
                      type="checkbox"
                      className="toggle toggle-sm toggle-primary"
                      defaultChecked={(allSettings as any)?.[key] !== 'false'}
                      onChange={async e => {
                        await setSettingMut.mutateAsync({ key, value: e.target.checked ? 'true' : 'false' });
                        toast.success('Updated!');
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>


          <TabsContent value="destination-guides">
            <AdminDestinationGuides />
          </TabsContent>

          <TabsContent value="community">
            <AdminCommunityManager />
          </TabsContent>

          <TabsContent value="notifications">
            <AdminNotificationsManager />
          </TabsContent>

<TabsContent value="command">
  <AdminCommandCenter onTabChange={setActiveTab} />
</TabsContent>

<TabsContent value="passports">
  <div>
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="font-serif text-xl font-semibold">Passport Manager</h2>
        <p className="text-sm text-muted-foreground mt-1">Monitor passport validity and risk for all clients</p>
      </div>
    </div>
    <AdminPassportManager />
  </div>
</TabsContent>

<TabsContent value="payments">
  <div>
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="font-serif text-xl font-semibold">Payment Plans</h2>
        <p className="text-sm text-muted-foreground mt-1">Financial control centre — track balances, risks, and cash flow</p>
      </div>
    </div>
    <AdminPaymentPlans />
  </div>
</TabsContent>

            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

