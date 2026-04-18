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

import { BookingCard, StatusBadge, QuoteStatusBadge, getStatusGradient, CountdownTimer, ChecklistSection, TravelPartySection } from "@/components/BookingCard";


function ProfileSection({ user }: { user: any }) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', dateOfBirth: '' });

  const updateProfile = trpc.profileV6.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('Profile updated!');
      setEditing(false);
      utils.auth.me.invalidate();
      utils.profileV6.getMyProfile.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const startEdit = () => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    });
    setEditing(true);
  };

  const formatDob = (dob: any) => {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const isBirthdayToday = (dob: any) => {
    if (!dob) return false;
    const d = new Date(dob);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <User size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">My Profile</h3>
            <p className="text-xs text-muted-foreground">Your personal details</p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5"
          >
            <Edit2 size={12} /> Edit
          </button>
        )}
      </div>

      {!editing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
            <User size={14} className="text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="text-sm font-medium text-foreground">{user?.name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
            <Mail size={14} className="text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{user?.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
            <Phone size={14} className="text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium text-foreground">{user?.phone || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
            <Calendar size={14} className="text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Date of Birth</p>
              <p className="text-sm font-medium text-foreground">
                {formatDob(user?.dateOfBirth) || '—'}
                {isBirthdayToday(user?.dateOfBirth) && <span className="ml-2 text-base">🎂</span>}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="rounded-xl"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
              <Input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="rounded-xl"
                placeholder="+44 7700 000000"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date of Birth</label>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <Input value={user?.email || ''} disabled className="rounded-xl bg-muted/30 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here — contact support</p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => updateProfile.mutate({ name: form.name || undefined, phone: form.phone || undefined, dateOfBirth: form.dateOfBirth || undefined })}
              disabled={updateProfile.isPending}
              className="rounded-xl btn-gold border-0 text-foreground"
            >
              {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)} className="rounded-xl">Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── V7: Support Tickets Section ─────────────────────────────────────────────
function SupportSection() {
  const utils = trpc.useUtils();
  const [view, setView] = useState<"list" | "new" | "thread">("list");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [newForm, setNewForm] = useState({ subject: "", ticketType: "general_enquiry", message: "" });
  const [replyText, setReplyText] = useState("");

  const { data: tickets, refetch: refetchTickets } = trpc.support.myTickets.useQuery();
  const { data: messages } = trpc.support.getMessages.useQuery(selectedTicket?.id ?? 0, {
    enabled: !!selectedTicket,
  });

  const createMutation = trpc.support.create.useMutation({
    onSuccess: () => {
      toast.success("Ticket submitted! We'll be in touch soon.");
      setNewForm({ subject: "", ticketType: "general_enquiry", message: "" });
      setView("list");
      refetchTickets();
    },
    onError: (e) => toast.error(e.message),
  });

  const replyMutation = trpc.support.reply.useMutation({
    onSuccess: () => {
      setReplyText("");
      utils.support.getMessages.invalidate(selectedTicket?.id);
    },
    onError: (e) => toast.error(e.message),
  });

  const statusConfig: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: "bg-blue-100 text-blue-700" },
    in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-700" },
    resolved: { label: "Resolved", className: "bg-green-100 text-green-700" },
  };

  const ticketTypeLabel: Record<string, string> = {
    general_enquiry: "General Enquiry",
    request_extra: "Request an Extra",
    complaint: "Complaint",
    other: "Other",
  };

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ticket size={20} className="text-primary" />
          <h3 className="font-serif text-xl font-bold text-foreground">Support</h3>
          {tickets && tickets.length > 0 && (
            <span className="text-xs text-muted-foreground ml-1">({tickets.length})</span>
          )}
        </div>
        {view === "list" && (
          <button
            onClick={() => setView("new")}
            className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} /> New Ticket
          </button>
        )}
        {view !== "list" && (
          <button
            onClick={() => { setView("list"); setSelectedTicket(null); }}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            ← Back
          </button>
        )}
      </div>

      {/* New Ticket Form */}
      {view === "new" && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <h4 className="font-semibold text-foreground mb-4">Open a New Support Ticket</h4>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject *</label>
              <input
                type="text"
                placeholder="Brief description of your issue"
                value={newForm.subject}
                onChange={(e) => setNewForm({ ...newForm, subject: e.target.value })}
                className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Ticket Type *</label>
              <select
                value={newForm.ticketType}
                onChange={(e) => setNewForm({ ...newForm, ticketType: e.target.value })}
                className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="general_enquiry">General Enquiry</option>
                <option value="request_extra">Request an Extra (airport transfer, room upgrade, special meal…)</option>
                <option value="complaint">Complaint</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Message *</label>
              <textarea
                placeholder="Describe your request in detail…"
                rows={5}
                value={newForm.message}
                onChange={(e) => setNewForm({ ...newForm, message: e.target.value })}
                className="w-full border border-input rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <Button
              onClick={() => {
                if (!newForm.subject || !newForm.message) { toast.error("Please fill in all required fields."); return; }
                createMutation.mutate(newForm as any);
              }}
              disabled={createMutation.isPending}
              className="w-full rounded-xl btn-gold border-0 text-foreground"
            >
              {createMutation.isPending ? "Submitting…" : "Submit Ticket"}
            </Button>
          </div>
        </div>
      )}

      {/* Ticket Thread */}
      {view === "thread" && selectedTicket && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <div className="mb-4">
            <h4 className="font-bold text-foreground text-base mb-1">{selectedTicket.subject}</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded-full font-semibold ${statusConfig[selectedTicket.status]?.className}`}>
                {statusConfig[selectedTicket.status]?.label}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                {ticketTypeLabel[selectedTicket.ticketType] || selectedTicket.ticketType}
              </span>
            </div>
          </div>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto mb-4">
            {messages?.map((msg: any) => (
              <div key={msg.id} className={`flex gap-3 ${msg.isAdmin ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${msg.isAdmin ? "bg-primary" : "bg-slate-400"}`}>
                  {msg.isAdmin ? "CB" : (msg.senderName || "?").charAt(0).toUpperCase()}
                </div>
                <div className={`flex-1 max-w-[85%]`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm ${msg.isAdmin ? "bg-primary text-white" : "bg-muted/40 text-foreground"}`}>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    {msg.fileUrl && (
                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`text-xs underline mt-1 block ${msg.isAdmin ? "text-white/70" : "text-primary"}`}>
                        📎 Attachment
                      </a>
                    )}
                  </div>
                  <p className={`text-xs text-muted-foreground mt-1 ${msg.isAdmin ? "text-right" : ""}`}>
                    {msg.isAdmin ? "CB Travel Team" : (msg.senderName || "You")} · {new Date(msg.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {selectedTicket.status !== "resolved" && (
            <div className="border-t border-border pt-4">
              <div className="flex gap-2">
                <textarea
                  placeholder="Add a reply…"
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 border border-input rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button
                  onClick={() => { if (replyText.trim()) replyMutation.mutate({ ticketId: selectedTicket.id, message: replyText }); }}
                  disabled={!replyText.trim() || replyMutation.isPending}
                  className="rounded-xl btn-gold border-0 text-foreground self-end"
                >
                  {replyMutation.isPending ? "…" : <Send size={14} />}
                </Button>
              </div>
            </div>
          )}
          {selectedTicket.status === "resolved" && (
            <p className="text-xs text-green-600 font-semibold text-center py-2">✅ This ticket has been resolved.</p>
          )}
        </div>
      )}

      {/* Ticket List */}
      {view === "list" && (
        <>
          {!tickets || tickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-8 text-center">
              <span className="text-4xl block mb-3">🎫</span>
              <p className="text-muted-foreground text-sm">No support tickets yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Have a question or need help? Open a new ticket above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket: any) => {
                const sc = statusConfig[ticket.status] || statusConfig.open;
                return (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-2xl border border-border shadow-sm p-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
                    onClick={() => { setSelectedTicket(ticket); setView("thread"); }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground text-sm truncate">{ticket.subject}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sc.className}`}>{sc.label}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>{ticketTypeLabel[ticket.ticketType] || ticket.ticketType}</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                          {ticket.messageCount > 1 && <span>{ticket.messageCount} messages</span>}
                        </div>
                      </div>
                      <span className="text-xs text-primary flex items-center gap-1 flex-shrink-0">View <ArrowRight size={11} /></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}


export default function Dashboard() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: bookings, isLoading } = trpc.bookings.myBookings.useQuery();
  const { data: sharedBookings } = trpc.travelParty.mySharedBookings.useQuery();
  const { data: myQuotes } = trpc.quotes.myQuotes.useQuery();
  const { data: myAdminQuotes } = trpc.adminQuotes.myAdminQuotes.useQuery();
  const [expandedQuoteId, setExpandedQuoteId] = useState<number | null>(null);

  // Compute stats
  const totalBookings = bookings?.length || 0;
  const confirmedBooking = bookings?.find((b: any) => b.status === "confirmed" && b.departureDate);
  let nextTripDays: number | null = null;
  if (confirmedBooking?.departureDate) {
    const diff = new Date(confirmedBooking.departureDate).getTime() - Date.now();
    nextTripDays = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background">
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-amber-400 via-yellow-500 to-primary rounded-3xl p-8 mb-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=60&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="relative z-10">
            <p className="text-white/80 text-sm font-medium mb-1">Welcome back,</p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">
              {user?.name?.split(" ")[0] || "Traveller"} ✈️
            </h1>
            <div className="flex flex-wrap gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{totalBookings}</p>
                <p className="text-white/70 text-xs mt-1">Total Booking{totalBookings !== 1 ? "s" : ""}</p>
              </div>
              {nextTripDays !== null && (
                <div className="text-center">
                  <p className="text-3xl font-bold">{nextTripDays}</p>
                  <p className="text-white/70 text-xs mt-1">Days to Next Trip</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* V6: Holiday Countdown Banner */}
        <HolidayCountdownBanner />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Link href="/quote-request">
            <div className="group bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/40">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-all">
                <FileText size={18} className="text-primary group-hover:text-white" />
              </div>
              <p className="font-semibold text-foreground text-sm">Get a Quote</p>
              <p className="text-xs text-muted-foreground mt-1">Request a free personalised travel quote</p>
            </div>
          </Link>
          <a href="mailto:hello@travelcb.co.uk">
            <div className="group bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/40">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-500 transition-all">
                <MessageSquare size={18} className="text-green-600 group-hover:text-white" />
              </div>
              <p className="font-semibold text-foreground text-sm">Contact Us</p>
              <p className="text-xs text-muted-foreground mt-1">Email our team at hello@travelcb.co.uk</p>
            </div>
          </a>
          <Link href="/booking-intake">
            <div className="group bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-amber-400/60">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-400 transition-all">
                <Plane size={18} className="text-amber-600 group-hover:text-white" />
              </div>
              <p className="font-semibold text-foreground text-sm">Submit Booking Form</p>
              <p className="text-xs text-muted-foreground mt-1">Ready to book? Fill in the full intake form</p>
            </div>
          </Link>
        </div>

        {/* V6: Loyalty + Referral + AI Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <LoyaltyWidget />
          <ReferralSection />
        </div>

        {/* V6: AI Itinerary Generator */}
        <div className="mb-8">
          <AIItineraryGenerator />
        </div>

        {/* Profile Section */}
        {user && <ProfileSection user={user} />}

        {/* Bookings Header */}
        <div className="mb-6">
          <h2 className="font-serif text-3xl font-bold text-foreground">My Bookings</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage your travel plans and stay organized</p>
        </div>

        {/* My Tailored Quotes — from admin-created quotes portal */}
        {myAdminQuotes && myAdminQuotes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star size={20} className="text-amber-500" />
              <h3 className="font-serif text-xl font-bold text-foreground">My Tailored Quotes</h3>
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold ml-1">{myAdminQuotes.length}</span>
            </div>
            <div className="space-y-3">
              {myAdminQuotes.map((q: any) => {
                const statusMap: Record<string, { label: string; className: string }> = {
                  draft: { label: "Draft", className: "bg-slate-100 text-slate-600 border-slate-200" },
                  sent: { label: "Sent", className: "bg-blue-100 text-blue-700 border-blue-200" },
                  viewed: { label: "Viewed", className: "bg-amber-100 text-amber-700 border-amber-200" },
                  accepted: { label: "Accepted ✓", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
                  expired: { label: "Expired", className: "bg-red-100 text-red-500 border-red-200" },
                };
                const badge = statusMap[q.status] || statusMap.draft;
                const daysLeft = q.expiresAt
                  ? Math.ceil((new Date(q.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;
                const isExpired = q.status === "expired" || (daysLeft !== null && daysLeft <= 0);

                return (
                  <div key={q.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isExpired ? "opacity-70" : "border-border"}`}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">✈️</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {q.destination && (
                                <span className="font-bold text-foreground text-sm">{q.destination}</span>
                              )}
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.className}`}>
                                {badge.label}
                              </span>
                              <span className="text-xs font-mono text-muted-foreground">{q.quoteRef}</span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {q.departureDate && <span>✈ {q.departureDate}</span>}
                              {q.returnDate && <span>↩ {q.returnDate}</span>}
                              {q.totalPrice && <span className="font-semibold text-foreground">£{parseFloat(q.totalPrice).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                            </div>
                            {daysLeft !== null && !isExpired && q.status !== "accepted" && (
                              <p className={`text-xs mt-1 font-medium ${daysLeft <= 5 ? "text-red-500" : "text-amber-600"}`}>
                                {daysLeft <= 0 ? "Expired" : `Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {q.status !== "expired" && q.status !== "accepted" && (
                            <a
                              href={`/quote/${q.quoteRef}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors"
                            >
                              View Quote <ArrowRight size={12} />
                            </a>
                          )}
                          {q.status === "accepted" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200">
                              ✓ Accepted
                            </span>
                          )}
                          {isExpired && q.status !== "accepted" && (
                            <a href="/quote-request" className="text-xs text-primary underline">Request New Quote</a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* My Quote Requests Section */}
        {myQuotes && myQuotes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} className="text-primary" />
              <h3 className="font-serif text-xl font-bold text-foreground">My Quote Requests</h3>
              <span className="text-xs text-muted-foreground ml-1">({myQuotes.length})</span>
            </div>
            <div className="space-y-3">
              {myQuotes.map((q: any) => {
                const isExpanded = expandedQuoteId === q.id;
                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
                  >
                    {/* Card Header — always visible, clickable */}
                    <button
                      className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                      onClick={() => setExpandedQuoteId(isExpanded ? null : q.id)}
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-primary/8 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText size={16} className="text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {q.destination && (
                              <span className="font-semibold text-foreground text-sm flex items-center gap-1">
                                <MapPin size={13} className="text-primary" /> {q.destination}
                              </span>
                            )}
                            <QuoteStatusBadge status={q.status} />
                            {q.travelType && (
                              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{q.travelType}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Submitted {new Date(q.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-muted-foreground">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-border bg-muted/10">
                        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {q.departureDate && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Departure:</span>
                              <span className="font-medium">{new Date(q.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                          )}
                          {q.returnDate && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Return:</span>
                              <span className="font-medium">{new Date(q.returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                          )}
                          {q.numberOfTravellers && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Travellers:</span>
                              <span className="font-medium">{q.numberOfTravellers}</span>
                            </div>
                          )}
                          {q.budget && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Budget:</span>
                              <span className="font-medium">{q.budget}</span>
                            </div>
                          )}
                          {q.travelType && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Travel Type:</span>
                              <span className="font-medium">{q.travelType}</span>
                            </div>
                          )}
                        </div>
                        {q.message && (
                          <div className="mt-3 p-3 bg-white rounded-xl border border-border">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">Your Message</p>
                            <p className="text-sm text-foreground italic">"{q.message}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* V7: Support Tickets Section */}
        <SupportSection />

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-96 bg-white rounded-2xl border border-border animate-pulse" />)}
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-6">
            {bookings.map((booking: any) => (
              <BookingCard key={booking.id} booking={booking} user={user} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <Package size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="font-serif text-xl font-semibold text-foreground mb-2">No Bookings Yet</h2>
            <p className="text-muted-foreground mb-6">Once you book a trip with CB Travel, it will appear here with all your details.</p>
            <Link href="/quote-request">
              <Button className="rounded-full btn-gold border-0 text-foreground">Request a Quote</Button>
            </Link>
          </div>
        )}

        {/* V7: Shared Bookings (Travel Party) */}
        {sharedBookings && sharedBookings.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Users2 size={20} className="text-indigo-600" />
              <h3 className="font-serif text-xl font-bold text-foreground">Shared Bookings</h3>
              <span className="text-xs text-muted-foreground ml-1">(added to by another traveller)</span>
            </div>
            <div className="space-y-4">
              {sharedBookings.map((booking: any) => (
                <div key={booking.id} className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono font-bold text-indigo-800">{booking.bookingReference}</span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold capitalize">{booking.status}</span>
                  </div>
                  {booking.destination && <p className="text-sm text-indigo-700 flex items-center gap-1"><MapPin size={13} /> {booking.destination}</p>}
                  {booking.departureDate && (
                    <p className="text-xs text-indigo-500 mt-1">Departure: {new Date(booking.departureDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  )}
                  <p className="text-xs text-indigo-400 mt-2 italic">Read-only — you were added to this booking by the lead traveller.</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GDPR / Privacy Footer */}
        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Your personal data is processed securely in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
            CB Travel acts as the data controller for information held within this portal. Your data is used solely to manage your travel bookings and communicate
            relevant updates to you. You have the right to access, rectify, or request deletion of your personal data at any time.
            For privacy enquiries, contact us at{" "}
            <a href="mailto:privacy@travelcb.co.uk" className="text-primary underline hover:text-primary/80">
              privacy@travelcb.co.uk
            </a>
            . We will never sell or share your data with third parties for marketing purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
