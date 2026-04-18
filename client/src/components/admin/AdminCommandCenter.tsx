import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Plane, AlertCircle, ChevronDown, ChevronUp, Plus, User, Mail } from "lucide-react";

interface AdminCommandCenterProps {
  onTabChange: (tab: string) => void;
}

export default function AdminCommandCenter({ onTabChange }: AdminCommandCenterProps) {
  const [alertsOpen, setAlertsOpen] = useState(true);

  const bookingsQuery = trpc.bookings.getAllAdmin.useQuery();
  const quotesQuery = trpc.quotes.getAllQuoteRequests.useQuery();

  const bookings = bookingsQuery.data ?? [];
  const quotes = quotesQuery.data ?? [];

  // Today's snapshot
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookingsToday = bookings.filter((b) => {
    const created = new Date(b.createdAt ?? "");
    created.setHours(0, 0, 0, 0);
    return created.getTime() === today.getTime();
  });

  const revenueToday = bookingsToday.reduce((sum, b) => sum + (Number(b.amountPaid) || 0), 0);
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  // Alerts
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

  const awaitingQuotes = quotes.filter((q) => q.status === "new" || q.status === "pending").length;

  // Recent activity feed
  type ActivityItem = {
    id: string;
    type: "booking" | "quote" | "payment";
    label: string;
    sub: string;
    date: Date;
  };

  const activityItems: ActivityItem[] = [];

  bookings.slice(0, 20).forEach((b) => {
    const date = new Date(b.createdAt ?? "");
    activityItems.push({
      id: `booking-${b.id}`,
      type: "booking",
      label: `New booking: ${b.leadPassengerName ?? "Unknown"} → ${b.destination ?? "Unknown"}`,
      sub: b.bookingReference ?? `Ref #${b.id}`,
      date,
    });
    if (Number(b.amountPaid) > 0) {
      activityItems.push({
        id: `payment-${b.id}`,
        type: "payment",
        label: `${b.leadPassengerName ?? "Client"} paid £${Number(b.amountPaid).toLocaleString()}`,
        sub: b.destination ?? "",
        date,
      });
    }
  });

  quotes.slice(0, 10).forEach((q) => {
    activityItems.push({
      id: `quote-${q.id}`,
      type: "quote",
      label: `New quote request: ${(q as any).destination ?? (q as any).tripType ?? "Travel enquiry"}`,
      sub: `From: ${(q as any).name ?? (q as any).email ?? "Unknown"}`,
      date: new Date((q as any).createdAt ?? ""),
    });
  });

  const recentActivity = activityItems
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  const activityIcon = (type: ActivityItem["type"]) => {
    if (type === "booking") return <Plane className="w-3.5 h-3.5 text-blue-400" />;
    if (type === "payment") return <TrendingUp className="w-3.5 h-3.5 text-amber-400" />;
    return <Mail className="w-3.5 h-3.5 text-purple-400" />;
  };

  const activityDot = (type: ActivityItem["type"]) => {
    if (type === "booking") return "bg-blue-500";
    if (type === "payment") return "bg-amber-400";
    return "bg-purple-500";
  };

  return (
    <div className="space-y-6 p-1">
      {/* Today's Snapshot Strip */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Today's Snapshot
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Revenue Today */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-950/60 to-amber-900/30 border border-amber-700/40 p-5 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-amber-300/70 font-medium uppercase tracking-wide">Revenue Today</p>
                <p className="mt-1.5 text-3xl font-bold text-amber-300 tracking-tight">
                  £{revenueToday.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-400/15 border border-amber-400/20">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-amber-400/5" />
          </div>

          {/* Bookings Today */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950/60 to-blue-900/30 border border-blue-700/40 p-5 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-blue-300/70 font-medium uppercase tracking-wide">Bookings Today</p>
                <p className="mt-1.5 text-3xl font-bold text-blue-300 tracking-tight">
                  {bookingsToday.length}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-400/15 border border-blue-400/20">
                <Plane className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-blue-400/5" />
          </div>

          {/* Urgent Actions */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-950/60 to-orange-900/30 border border-red-700/40 p-5 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-red-300/70 font-medium uppercase tracking-wide">Urgent Actions</p>
                <p className="mt-1.5 text-3xl font-bold text-red-300 tracking-tight">
                  {pendingCount}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-red-400/15 border border-red-400/20">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-red-400/5" />
          </div>
        </div>
      </div>

      {/* Alerts Strip */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-700/50 overflow-hidden shadow-lg">
        <button
          onClick={() => setAlertsOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/50 transition-colors"
        >
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
            Smart Alerts
          </span>
          {alertsOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
        {alertsOpen && (
          <div className="px-5 pb-4 space-y-2.5">
            {/* Outstanding balance */}
            <div className="flex items-center justify-between rounded-xl bg-red-950/40 border border-red-800/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">🔴</span>
                <span className="text-sm text-red-200">
                  <span className="font-bold">{outstandingBalance}</span> bookings have outstanding balance
                </span>
              </div>
              <button
                onClick={() => onTabChange("bookings")}
                className="text-xs text-red-300 hover:text-red-100 font-medium transition-colors whitespace-nowrap"
              >
                View →
              </button>
            </div>

            {/* Departing soon */}
            <div className="flex items-center justify-between rounded-xl bg-yellow-950/40 border border-yellow-800/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">🟡</span>
                <span className="text-sm text-yellow-200">
                  <span className="font-bold">{departingSoon}</span> clients departing in next 7 days
                </span>
              </div>
              <button
                onClick={() => onTabChange("bookings")}
                className="text-xs text-yellow-300 hover:text-yellow-100 font-medium transition-colors whitespace-nowrap"
              >
                View →
              </button>
            </div>

            {/* Awaiting quotes */}
            <div className="flex items-center justify-between rounded-xl bg-orange-950/40 border border-orange-800/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">🟠</span>
                <span className="text-sm text-orange-200">
                  <span className="font-bold">{awaitingQuotes}</span> quote requests awaiting response
                </span>
              </div>
              <button
                onClick={() => onTabChange("quotes")}
                className="text-xs text-orange-300 hover:text-orange-100 font-medium transition-colors whitespace-nowrap"
              >
                View →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity Feed */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-700/50 overflow-hidden shadow-lg">
        <div className="px-5 py-3.5 border-b border-slate-700/50">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Recent Activity</h2>
        </div>
        <div className="divide-y divide-slate-800/60">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No recent activity</p>
          ) : (
            recentActivity.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activityDot(item.type)}`} />
                <div className="flex items-center gap-2 flex-shrink-0">
                  {activityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{item.label}</p>
                  <p className="text-xs text-slate-500 truncate">{item.sub}</p>
                </div>
                <span className="text-xs text-slate-600 flex-shrink-0">
                  {isNaN(item.date.getTime())
                    ? ""
                    : item.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions Row */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onTabChange("bookings")}
            className="flex items-center justify-center gap-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:bg-amber-900/30 hover:border-amber-700/50 transition-all duration-200 px-5 py-4 text-sm font-semibold text-slate-200 hover:text-amber-300 shadow-sm group"
          >
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            New Booking
          </button>
          <button
            onClick={() => onTabChange("accounts")}
            className="flex items-center justify-center gap-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:bg-blue-900/30 hover:border-blue-700/50 transition-all duration-200 px-5 py-4 text-sm font-semibold text-slate-200 hover:text-blue-300 shadow-sm group"
          >
            <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
            New Client
          </button>
          <button
            onClick={() => onTabChange("emails")}
            className="flex items-center justify-center gap-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:bg-purple-900/30 hover:border-purple-700/50 transition-all duration-200 px-5 py-4 text-sm font-semibold text-slate-200 hover:text-purple-300 shadow-sm group"
          >
            <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Send Broadcast
          </button>
        </div>
      </div>
    </div>
  );
}
