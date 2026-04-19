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
  Ticket, Users2, Send, Paperclip, UserMinus, Shield, Bell
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
import { useSEO } from '@/hooks/useSEO';


function ProfileSection({ user }: { user: any }) {
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState<'personal' | 'passport' | 'referrals'>('personal');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralCodeApplied, setReferralCodeApplied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: myReferralCode } = trpc.referral.getMyCode.useQuery();
  const { data: myReferrals } = trpc.referral.getMyReferrals.useQuery(undefined, { enabled: activeTab === 'referrals' });

  const applyReferralCode = trpc.referral.complete.useMutation({
    onSuccess: (r: any) => {
      if (r.success) {
        setReferralCodeApplied(true);
        toast.success('Referral code applied! Loyalty points added 🎉');
      } else {
        toast.error('That referral code wasn\'t found. Please check and try again.');
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  const copyReferralLink = () => {
    if (myReferralCode?.link) {
      navigator.clipboard.writeText(myReferralCode.link);
      setCopiedLink(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingPassport, setEditingPassport] = useState(false);
  const [personalForm, setPersonalForm] = useState({ name: '', phone: '', dateOfBirth: '' });
  const [passportForm, setPassportForm] = useState({
    passportNumber: '',
    passportExpiry: '',
    passportIssueDate: '',
    passportIssuingCountry: '',
    passportNationality: '',
  });

  const { data: fullProfile } = trpc.profileV6.getMyProfile.useQuery();

  const updateProfile = trpc.profileV6.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('Profile updated!');
      setEditingPersonal(false);
      utils.auth.me.invalidate();
      utils.profileV6.getMyProfile.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updatePassport = (trpc.profileV6 as any).updateMyPassport.useMutation({
    onSuccess: () => {
      toast.success('Passport details saved securely!');
      setEditingPassport(false);
      utils.profileV6.getMyProfile.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const startEditPersonal = () => {
    setPersonalForm({
      name: user?.name || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    });
    setEditingPersonal(true);
  };

  const startEditPassport = () => {
    const p = fullProfile as any;
    setPassportForm({
      passportNumber: p?.passportNumber || '',
      passportExpiry: p?.passportExpiry ? new Date(p.passportExpiry).toISOString().split('T')[0] : '',
      passportIssueDate: p?.passportIssueDate ? new Date(p.passportIssueDate).toISOString().split('T')[0] : '',
      passportIssuingCountry: p?.passportIssuingCountry || '',
      passportNationality: p?.passportNationality || '',
    });
    setEditingPassport(true);
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

  const maskPassportNumber = (num: string | null | undefined) => {
    if (!num) return '—';
    if (num.length <= 4) return num;
    return '•••• ' + num.slice(-4);
  };

  const getExpiryStatus = (expiry: string | null | undefined) => {
    if (!expiry) return null;
    const d = new Date(expiry);
    const now = new Date();
    const monthsLeft = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    if (monthsLeft < 0) return { color: 'text-red-600', icon: '🔴', label: 'Expired' };
    if (monthsLeft < 3) return { color: 'text-red-500', icon: '🔴', label: 'Expires very soon!' };
    if (monthsLeft < 12) return { color: 'text-amber-500', icon: '🟡', label: 'Expires within 12 months' };
    return { color: 'text-green-600', icon: '🟢', label: 'Valid' };
  };

  const formatDate = (val: string | null | undefined) => {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const p = fullProfile as any;

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm mb-8 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-border">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <User size={18} className="text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">My Profile</h3>
          <p className="text-xs text-muted-foreground">Manage your personal &amp; travel details</p>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'personal' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <User size={14} /> Personal Details
        </button>
        <button
          onClick={() => setActiveTab('passport')}
          className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'passport' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Shield size={14} /> Passport &amp; Travel
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'referrals' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}
        >
          🎁 Referrals
        </button>
      </div>

      <div className="p-6">
        {/* ── Personal Details Tab ── */}
        {activeTab === 'personal' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground font-medium">Your contact &amp; personal information</p>
              {!editingPersonal && (
                <button
                  onClick={startEditPersonal}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5"
                >
                  <Edit2 size={12} /> Edit
                </button>
              )}
            </div>

            {!editingPersonal ? (
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
                      value={personalForm.name}
                      onChange={e => setPersonalForm(f => ({ ...f, name: e.target.value }))}
                      className="rounded-xl"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                    <Input
                      value={personalForm.phone}
                      onChange={e => setPersonalForm(f => ({ ...f, phone: e.target.value }))}
                      className="rounded-xl"
                      placeholder="+44 7700 000000"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Date of Birth</label>
                    <Input
                      type="date"
                      value={personalForm.dateOfBirth}
                      onChange={e => setPersonalForm(f => ({ ...f, dateOfBirth: e.target.value }))}
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
                    onClick={() => updateProfile.mutate({ name: personalForm.name || undefined, phone: personalForm.phone || undefined, dateOfBirth: personalForm.dateOfBirth || undefined })}
                    disabled={updateProfile.isPending}
                    className="rounded-xl btn-gold border-0 text-foreground"
                  >
                    {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingPersonal(false)} className="rounded-xl">Cancel</Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Passport & Travel Tab ── */}
        {activeTab === 'passport' && (
          <>
            {/* Security notice */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-5">
              <Lock size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Your passport details are stored securely and only used to support your bookings. We never share this information with third parties.
              </p>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground font-medium">Travel document information</p>
              {!editingPassport && (
                <button
                  onClick={startEditPassport}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5"
                >
                  <Edit2 size={12} /> {p?.passportNumber ? 'Update' : 'Add Passport'}
                </button>
              )}
            </div>

            {!editingPassport ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Passport Number</p>
                    <p className="text-sm font-medium text-foreground font-mono">{maskPassportNumber(p?.passportNumber)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <Calendar size={14} className="text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Expiry Date</p>
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-medium ${p?.passportExpiry ? getExpiryStatus(p.passportExpiry)?.color : 'text-foreground'}`}>
                        {formatDate(p?.passportExpiry)}
                      </p>
                      {p?.passportExpiry && (
                        <span className="text-xs">{getExpiryStatus(p.passportExpiry)?.icon}</span>
                      )}
                    </div>
                    {p?.passportExpiry && getExpiryStatus(p.passportExpiry) && (
                      <p className={`text-xs ${getExpiryStatus(p.passportExpiry)?.color}`}>{getExpiryStatus(p.passportExpiry)?.label}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <Calendar size={14} className="text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Issue Date</p>
                    <p className="text-sm font-medium text-foreground">{formatDate(p?.passportIssueDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <MapPin size={14} className="text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Issuing Country</p>
                    <p className="text-sm font-medium text-foreground">{p?.passportIssuingCountry || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl sm:col-span-2">
                  <User size={14} className="text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nationality</p>
                    <p className="text-sm font-medium text-foreground">{p?.passportNationality || '—'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Passport Number</label>
                    <Input
                      value={passportForm.passportNumber}
                      onChange={e => setPassportForm(f => ({ ...f, passportNumber: e.target.value }))}
                      className="rounded-xl font-mono"
                      placeholder="e.g. 123456789"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Expiry Date</label>
                    <Input
                      type="date"
                      value={passportForm.passportExpiry}
                      onChange={e => setPassportForm(f => ({ ...f, passportExpiry: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Issue Date</label>
                    <Input
                      type="date"
                      value={passportForm.passportIssueDate}
                      onChange={e => setPassportForm(f => ({ ...f, passportIssueDate: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Issuing Country</label>
                    <Input
                      value={passportForm.passportIssuingCountry}
                      onChange={e => setPassportForm(f => ({ ...f, passportIssuingCountry: e.target.value }))}
                      className="rounded-xl"
                      placeholder="e.g. United Kingdom"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Nationality</label>
                    <Input
                      value={passportForm.passportNationality}
                      onChange={e => setPassportForm(f => ({ ...f, passportNationality: e.target.value }))}
                      className="rounded-xl"
                      placeholder="e.g. British"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => updatePassport.mutate({
                      passportNumber: passportForm.passportNumber || null,
                      passportExpiry: passportForm.passportExpiry || null,
                      passportIssueDate: passportForm.passportIssueDate || null,
                      passportIssuingCountry: passportForm.passportIssuingCountry || null,
                      passportNationality: passportForm.passportNationality || null,
                    })}
                    disabled={updatePassport.isPending}
                    className="rounded-xl btn-gold border-0 text-foreground"
                  >
                    {updatePassport.isPending ? 'Saving…' : 'Save Passport Details'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingPassport(false)} className="rounded-xl">Cancel</Button>
                </div>
              </div>
            )}
          </>
        )}


        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5986] rounded-2xl p-5 text-white">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎁</span>
                <div>
                  <h3 className="font-bold text-lg">Your Referral Link</h3>
                  <p className="text-blue-200 text-sm">Share with friends — earn loyalty points for every signup</p>
                </div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl p-3 mb-3 flex gap-2 items-center">
                <input
                  readOnly
                  value={myReferralCode?.link || ''}
                  className="flex-1 bg-transparent text-sm text-white focus:outline-none truncate"
                />
                <button
                  onClick={copyReferralLink}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${copiedLink ? 'bg-green-500 text-white' : 'bg-white text-[#1e3a5f] hover:bg-blue-50'}`}
                >
                  {copiedLink ? '\u2705 Copied!' : '\U0001F4CB Copy'}
                </button>
              </div>
              <p className="text-blue-200 text-xs text-center">Your code: <span className="font-mono font-bold text-white">{myReferralCode?.code}</span></p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-xl font-extrabold">150 pts</p>
                  <p className="text-blue-200 text-xs mt-0.5">You earn per referral</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-xl font-extrabold">50 pts</p>
                  <p className="text-blue-200 text-xs mt-0.5">Your friend receives</p>
                </div>
              </div>
            </div>

            {!referralCodeApplied ? (
              <div className="border border-border rounded-2xl p-5 bg-muted/20">
                <h4 className="font-semibold text-foreground mb-1">Have a friend&#39;s referral code?</h4>
                <p className="text-xs text-muted-foreground mb-3">Enter it below to claim your welcome bonus points.</p>
                <div className="flex gap-2">
                  <input
                    value={referralCodeInput}
                    onChange={e => setReferralCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. ABC123"
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Button
                    onClick={() => referralCodeInput && applyReferralCode.mutate({ referralCode: referralCodeInput })}
                    disabled={!referralCodeInput || applyReferralCode.isPending}
                    className="rounded-xl btn-gold border-0 text-foreground text-sm"
                  >
                    {applyReferralCode.isPending ? 'Applying\u2026' : 'Apply Code'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border border-green-200 rounded-2xl p-4 bg-green-50 text-green-800 text-sm flex items-center gap-2">
                \u2705 Referral code applied \u2014 your bonus points have been added!
              </div>
            )}

            <div>
              <h4 className="font-semibold text-foreground mb-3">People you&#39;ve referred ({myReferrals?.length ?? 0})</h4>
              {!myReferrals || myReferrals.length === 0 ? (
                <div className="border border-dashed border-border rounded-2xl p-6 text-center text-muted-foreground text-sm">
                  <p className="text-2xl mb-2">\U0001F44B</p>
                  <p>No referrals yet \u2014 share your link and start earning!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myReferrals.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between border border-border rounded-xl px-4 py-3 bg-background">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {(r.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{r.name || 'Client'}</p>
                          <p className="text-xs text-muted-foreground">{r.email || ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-600">+{r.pointsEarned || 150} pts</p>
                        <p className="text-xs text-muted-foreground">earned</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
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


function NotificationsSection() {
  const utils = trpc.useUtils();
  const { data: notifications = [] } = trpc.notifications.getMyNotifications.useQuery();
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => utils.notifications.getMyNotifications.invalidate(),
  });
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => utils.notifications.getMyNotifications.invalidate(),
  });

  const unread = (notifications as any[]).filter((n: any) => !n.isRead);
  if (notifications.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mb-8">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          {unread.length > 0 && (
            <span className="bg-[#d4af37] text-[#020917] text-[10px] font-bold px-2 py-0.5 rounded-full">{unread.length} new</span>
          )}
        </div>
        {unread.length > 0 && (
          <button onClick={() => markAllRead.mutate()} className="text-xs text-primary hover:underline">Mark all read</button>
        )}
      </div>
      <div className="divide-y divide-border max-h-64 overflow-y-auto">
        {(notifications as any[]).slice(0, 10).map((n: any) => (
          <div
            key={n.id}
            onClick={() => !n.isRead && markRead.mutate({ id: n.id })}
            className={`px-5 py-3 flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? 'bg-slate-200' : 'bg-primary'}`} />
            <div>
              <p className={`text-sm font-medium ${n.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const LOYALTY_TIERS = [
  { name: "Bronze", min: 0, max: 499, emoji: "🥉", badge: "Bronze Member" },
  { name: "Silver", min: 500, max: 1499, emoji: "🥈", badge: "Silver Member" },
  { name: "Gold", min: 1500, max: Infinity, emoji: "🥇", badge: "Gold Member" },
];
function getLoyaltyTier(points: number) {
  return LOYALTY_TIERS.find(t => points >= t.min && points <= t.max) || LOYALTY_TIERS[0];
}

export default function Dashboard() {
  useSEO({ title: 'My Account', noIndex: true });
  const { data: user } = trpc.auth.me.useQuery();
  const { data: bookings, isLoading } = trpc.bookings.myBookings.useQuery();
  const { data: sharedBookings } = trpc.travelParty.mySharedBookings.useQuery();
  const { data: myQuotes } = trpc.quotes.myQuotes.useQuery();
  const { data: myAdminQuotes } = trpc.adminQuotes.myAdminQuotes.useQuery();
  const { data: loyaltyAccount } = trpc.loyalty.myAccount.useQuery();
  const { data: fullProfile } = trpc.profileV6.getMyProfile.useQuery();
  const [expandedQuoteId, setExpandedQuoteId] = useState<number | null>(null);

  // Compute stats
  const totalBookings = bookings?.length || 0;
  const confirmedBooking = bookings?.find((b: any) => b.status === "confirmed" && b.departureDate);
  let nextTripDays: number | null = null;
  if (confirmedBooking?.departureDate) {
    const diff = new Date(confirmedBooking.departureDate).getTime() - Date.now();
    nextTripDays = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  // Loyalty tier
  const loyaltyTier = loyaltyAccount ? getLoyaltyTier(loyaltyAccount.points || 0) : null;

  // Passport expiry warning (within 12 months)
  const passportExpiry = (fullProfile as any)?.passportExpiry;
  let passportExpiryWarning: string | null = null;
  if (passportExpiry) {
    const d = new Date(passportExpiry);
    const monthsLeft = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44);
    if (monthsLeft < 0) passportExpiryWarning = 'Your passport has expired. Please renew it before travelling.';
    else if (monthsLeft < 3) passportExpiryWarning = `Your passport expires in less than 3 months (${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}). Many destinations require 6 months validity — renew soon.`;
    else if (monthsLeft < 12) passportExpiryWarning = `Your passport expires ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} — within 12 months. Consider renewing before your next trip.`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background">
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-amber-400 via-yellow-500 to-primary rounded-3xl p-8 mb-4 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=60&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="relative z-10">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
              <p className="text-white/80 text-sm font-medium">Welcome back,</p>
              {loyaltyTier && (loyaltyAccount?.points || 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30">
                  {loyaltyTier.emoji} {loyaltyTier.badge}
                </span>
              )}
            </div>
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
              {loyaltyAccount && (loyaltyAccount.points || 0) > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold">{loyaltyAccount.points?.toLocaleString()}</p>
                  <p className="text-white/70 text-xs mt-1">Loyalty Points</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Passport Expiry Warning Banner */}
        {passportExpiryWarning && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 shadow-sm">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Passport Expiry Alert</p>
              <p className="text-xs text-amber-700 mt-0.5">{passportExpiryWarning}</p>
            </div>
          </div>
        )}

        {/* spacing when no warning */}
        {!passportExpiryWarning && <div className="mb-6" />}

        {/* V6: Holiday Countdown Banner */}
        <HolidayCountdownBanner />

        {/* Notifications */}
        <NotificationsSection />

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
