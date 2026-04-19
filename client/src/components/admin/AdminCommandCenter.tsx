import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp, Plane, AlertCircle, ChevronDown, ChevronUp, Plus, User, Mail,
  Clock, CreditCard, Zap, FileText, Bell, BarChart3, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminCommandCenterProps {
  onTabChange: (tab: string) => void;
}

function getRelativeTime(date: Date): string {
  if (isNaN(date.getTime())) return "";
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function AdminCommandCenter({ onTabChange }: AdminCommandCenterProps) {
  const [alertsOpen, setAlertsOpen] = useState(true);

  const bookingsQuery = trpc.bookings.getAllAdmin.useQuery();
  const quotesQuery = trpc.quotes.getAllQuoteRequests.useQuery();

  const bookings = bookingsQuery.data ?? [];
  const quotes = quotesQuery.data ?? [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.amountPaid) || 0), 0);
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const outstandingBalance = bookings.filter(
    (b) => Number(b.totalPrice) > Number(b.amountPaid) && b.status !== "cancelled"
  ).length;

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const departingSoon = bookings.filter((b) => {
    if (!b.departureDate) return false;
    const dep = new Date(b.departureDate);
    return dep >= today && dep <= sevenDaysFromNow;
  }).length;

  const awaitingQuotes = quotes.filter((q: any) => q.status === "new" || q.status === "pending").length;

  type ActivityItem = { id: string; type: "booking" | "quote" | "payment"; label: string; sub: string; date: Date };
  const activityItems: ActivityItem[] = [];

  bookings.slice(0, 20).forEach((b) => {
    const createdDate = new Date(b.createdAt ?? "");
    const updatedDate = new Date(b.updatedAt ?? b.createdAt ?? "");
    activityItems.push({ id: `booking-${b.id}`, type: "booking", label: `New booking — ${b.leadPassengerName ?? "Unknown"} → ${b.destination ?? "Unknown"}`, sub: b.bookingReference ?? `Ref #${b.id}`, date: createdDate });
    if (Number(b.amountPaid) > 0) {
      activityItems.push({ id: `payment-${b.id}`, type: "payment", label: `Payment received — £${Number(b.amountPaid).toLocaleString()}`, sub: `${b.leadPassengerName ?? "Client"} · ${b.destination ?? ""}`, date: updatedDate });
    }
  });

  quotes.slice(0, 10).forEach((q: any) => {
    activityItems.push({ id: `quote-${q.id}`, type: "quote", label: `Quote request — ${q.destination ?? q.tripType ?? "Travel enquiry"}`, sub: `From: ${q.name ?? q.email ?? "Unknown"}`, date: new Date(q.createdAt ?? "") });
  });

  const recentActivity = activityItems.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 12);

  const activityIconColor = (type: ActivityItem["type"]) => {
    if (type === "booking") return "text-blue-600";
    if (type === "payment") return "text-emerald-600";
    return "text-violet-600";
  };

  const activityBg = (type: ActivityItem["type"]) => {
    if (type === "booking") return "bg-blue-50 ring-1 ring-blue-200";
    if (type === "payment") return "bg-emerald-50 ring-1 ring-emerald-200";
    return "bg-violet-50 ring-1 ring-violet-200";
  };

  const activityDot = (type: ActivityItem["type"]) => {
    if (type === "booking") return "bg-blue-400";
    if (type === "payment") return "bg-emerald-400";
    return "bg-violet-400";
  };

  const activityIcon = (type: ActivityItem["type"]) => {
    if (type === "booking") return <Plane className={`w-3.5 h-3.5 ${activityIconColor(type)}`} />;
    if (type === "payment") return <CreditCard className={`w-3.5 h-3.5 ${activityIconColor(type)}`} />;
    return <Mail className={`w-3.5 h-3.5 ${activityIconColor(type)}`} />;
  };

  // Fake sparkline points for decoration
  const sparkline = (values: number[]) => {
    const max = Math.max(...values, 1);
    const pts = values.map((v, i) => `${(i / (values.length - 1)) * 60},${20 - (v / max) * 16}`).join(" ");
    return pts;
  };
  const revSparkValues = [60, 75, 55, 90, 80, 95, totalRevenue > 0 ? 100 : 70];
  const pendingSparkValues = [3, 5, 2, 8, 6, pendingCount + 2, pendingCount];
  const quotesSparkValues = [2, 4, 3, 6, 5, awaitingQuotes + 1, awaitingQuotes];

  const totalAlerts = outstandingBalance + departingSoon + awaitingQuotes;

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-sm hover:shadow-md transition-all overflow-hidden relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-amber-700/70 uppercase tracking-wide">Total Revenue</p>
              <p className="mt-1.5 text-3xl font-extrabold text-amber-900 tracking-tight">£{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-amber-700/60 mt-1">{bookings.length} total booking{bookings.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-100 ring-4 ring-amber-50 border border-amber-200 shadow-sm">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <svg viewBox="0 0 60 20" className="w-full h-8 mt-1 opacity-50" preserveAspectRatio="none">
            <polyline points={sparkline(revSparkValues)} fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Pending Bookings */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-5 shadow-sm hover:shadow-md transition-all overflow-hidden relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-blue-700/70 uppercase tracking-wide">Pending Bookings</p>
              <p className="mt-1.5 text-3xl font-extrabold text-blue-900 tracking-tight">{pendingCount}</p>
              <p className="text-xs text-blue-700/60 mt-1">Awaiting confirmation</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-blue-100 ring-4 ring-blue-50 border border-blue-200 shadow-sm">
              <Plane className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <svg viewBox="0 0 60 20" className="w-full h-8 mt-1 opacity-50" preserveAspectRatio="none">
            <polyline points={sparkline(pendingSparkValues)} fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Quote Requests */}
        <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-purple-50 p-5 shadow-sm hover:shadow-md transition-all overflow-hidden relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-violet-700/70 uppercase tracking-wide">Quote Requests</p>
              <p className="mt-1.5 text-3xl font-extrabold text-violet-900 tracking-tight">{awaitingQuotes}</p>
              <p className="text-xs text-violet-700/60 mt-1">Awaiting response</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-violet-100 ring-4 ring-violet-50 border border-violet-200 shadow-sm">
              <Mail className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <svg viewBox="0 0 60 20" className="w-full h-8 mt-1 opacity-50" preserveAspectRatio="none">
            <polyline points={sparkline(quotesSparkValues)} fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button
            onClick={() => onTabChange("bookings")}
            className="h-12 gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> New Booking
          </Button>
          <Button
            variant="outline"
            onClick={() => onTabChange("quotes-manager")}
            className="h-12 gap-2 font-semibold hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-colors"
          >
            <FileText className="w-4 h-4" /> Create Quote
          </Button>
          <Button
            variant="outline"
            onClick={() => onTabChange("notifications")}
            className="h-12 gap-2 font-semibold hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
          >
            <Bell className="w-4 h-4" /> Send Notification
          </Button>
          <Button
            variant="outline"
            onClick={() => onTabChange("analytics")}
            className="h-12 gap-2 font-semibold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
          >
            <BarChart3 className="w-4 h-4" /> View Reports
          </Button>
        </div>
      </div>

      {/* Smart Alerts Strip */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setAlertsOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Zap className="w-4 h-4 text-amber-500" />
              {totalAlerts > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-sm font-semibold text-foreground">Smart Alerts</span>
            {totalAlerts > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">{totalAlerts}</Badge>
            )}
          </div>
          {alertsOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {alertsOpen && (
          <div className="px-5 pb-5 pt-1 border-t border-border">
            <div className="flex flex-wrap gap-3 pt-3">
              {/* Outstanding balances — amber */}
              <div className="flex items-center gap-3 flex-1 min-w-[200px] rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                  </div>
                  {outstandingBalance > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-800 leading-tight">Unpaid Balances</p>
                  <p className="text-lg font-extrabold text-amber-900 leading-tight">{outstandingBalance}</p>
                </div>
                <button
                  onClick={() => onTabChange("bookings")}
                  className="flex items-center gap-1 text-xs text-amber-700 font-semibold bg-amber-100 hover:bg-amber-200 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  View <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Departing soon — blue */}
              <div className="flex items-center gap-3 flex-1 min-w-[200px] rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
                    <Plane className="w-4 h-4 text-blue-600" />
                  </div>
                  {departingSoon > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-800 leading-tight">Departing Soon</p>
                  <p className="text-lg font-extrabold text-blue-900 leading-tight">{departingSoon}</p>
                </div>
                <button
                  onClick={() => onTabChange("bookings")}
                  className="flex items-center gap-1 text-xs text-blue-700 font-semibold bg-blue-100 hover:bg-blue-200 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  View <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Awaiting quotes — violet */}
              <div className="flex items-center gap-3 flex-1 min-w-[200px] rounded-xl bg-violet-50 border border-violet-200 px-4 py-3">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-violet-600" />
                  </div>
                  {awaitingQuotes > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-violet-800 leading-tight">Awaiting Quotes</p>
                  <p className="text-lg font-extrabold text-violet-900 leading-tight">{awaitingQuotes}</p>
                </div>
                <button
                  onClick={() => onTabChange("quotes")}
                  className="flex items-center gap-1 text-xs text-violet-700 font-semibold bg-violet-100 hover:bg-violet-200 border border-violet-200 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  View <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity Feed */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          </div>
          <span className="text-xs text-muted-foreground">{recentActivity.length} events</span>
        </div>

        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
        ) : (
          <div className="px-5 py-4">
            <div className="relative">
              {/* Timeline vertical line */}
              <div className="absolute left-3.5 top-3 bottom-3 w-px bg-border" />
              <div className="space-y-1">
                {recentActivity.map((item, idx) => (
                  <div key={item.id} className="relative flex items-start gap-3 py-2.5 group">
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex-shrink-0 w-7 h-7 rounded-lg ${activityBg(item.type)} flex items-center justify-center shadow-sm`}>
                      {activityIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm text-foreground truncate font-medium leading-tight">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{item.sub}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 pt-0.5 font-medium">
                      {getRelativeTime(item.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="px-5 pb-4 pt-1 border-t border-border">
          <button
            onClick={() => onTabChange("bookings")}
            className="w-full text-xs font-semibold text-primary hover:text-primary/80 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-primary/5 transition-colors"
          >
            See all activity <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
