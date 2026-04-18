import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Plane, AlertCircle, ChevronDown, ChevronUp, Plus, User, Mail, Clock, CreditCard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminCommandCenterProps {
  onTabChange: (tab: string) => void;
}

export default function AdminCommandCenter({ onTabChange }: AdminCommandCenterProps) {
  const [alertsOpen, setAlertsOpen] = useState(true);

  const bookingsQuery = trpc.bookings.getAllAdmin.useQuery();
  const quotesQuery = trpc.quotes.getAllQuoteRequests.useQuery();

  const bookings = bookingsQuery.data ?? [];
  const quotes = quotesQuery.data ?? [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookingsToday = bookings.filter((b) => {
    const created = new Date(b.createdAt ?? "");
    created.setHours(0, 0, 0, 0);
    return created.getTime() === today.getTime();
  });

  const revenueToday = bookingsToday.reduce((sum, b) => sum + (Number(b.amountPaid) || 0), 0);
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
      // Use updatedAt so payment updates show as recent activity
      activityItems.push({ id: `payment-${b.id}`, type: "payment", label: `Payment received — £${Number(b.amountPaid).toLocaleString()}`, sub: `${b.leadPassengerName ?? "Client"} · ${b.destination ?? ""}`, date: updatedDate });
    }
  });

  quotes.slice(0, 10).forEach((q: any) => {
    activityItems.push({ id: `quote-${q.id}`, type: "quote", label: `Quote request — ${q.destination ?? q.tripType ?? "Travel enquiry"}`, sub: `From: ${q.name ?? q.email ?? "Unknown"}`, date: new Date(q.createdAt ?? "") });
  });

  const recentActivity = activityItems.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 12);

  const activityColor = (type: ActivityItem["type"]) => {
    if (type === "booking") return "bg-blue-500";
    if (type === "payment") return "bg-emerald-500";
    return "bg-violet-500";
  };

  const activityIconColor = (type: ActivityItem["type"]) => {
    if (type === "booking") return "text-blue-600";
    if (type === "payment") return "text-emerald-600";
    return "text-violet-600";
  };

  const activityBg = (type: ActivityItem["type"]) => {
    if (type === "booking") return "bg-blue-50";
    if (type === "payment") return "bg-emerald-50";
    return "bg-violet-50";
  };

  const activityIcon = (type: ActivityItem["type"]) => {
    if (type === "booking") return <Plane className={`w-3.5 h-3.5 ${activityIconColor(type)}`} />;
    if (type === "payment") return <CreditCard className={`w-3.5 h-3.5 ${activityIconColor(type)}`} />;
    return <Mail className={`w-3.5 h-3.5 ${activityIconColor(type)}`} />;
  };

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Revenue Today</p>
              <p className="mt-2 text-3xl font-bold text-foreground tracking-tight">£{revenueToday.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{bookingsToday.length} booking{bookingsToday.length !== 1 ? "s" : ""} today</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pending Bookings</p>
              <p className="mt-2 text-3xl font-bold text-foreground tracking-tight">{pendingCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
              <Plane className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quote Requests</p>
              <p className="mt-2 text-3xl font-bold text-foreground tracking-tight">{awaitingQuotes}</p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
            </div>
            <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100">
              <Mail className="w-5 h-5 text-violet-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Strip */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setAlertsOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-foreground">Smart Alerts</span>
            {(outstandingBalance + departingSoon + awaitingQuotes) > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">{outstandingBalance + departingSoon + awaitingQuotes}</Badge>
            )}
          </div>
          {alertsOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {alertsOpen && (
          <div className="px-5 pb-4 space-y-2.5 border-t border-border pt-3">
            <div className="flex items-center justify-between rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-sm text-red-800">
                  <span className="font-semibold">{outstandingBalance}</span> bookings with outstanding balance
                </span>
              </div>
              <button onClick={() => onTabChange("bookings")} className="text-xs text-red-600 hover:text-red-800 font-semibold transition-colors">View →</button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-sm text-amber-800">
                  <span className="font-semibold">{departingSoon}</span> clients departing in the next 7 days
                </span>
              </div>
              <button onClick={() => onTabChange("bookings")} className="text-xs text-amber-600 hover:text-amber-800 font-semibold transition-colors">View →</button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-violet-50 border border-violet-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                <span className="text-sm text-violet-800">
                  <span className="font-semibold">{awaitingQuotes}</span> quote requests awaiting response
                </span>
              </div>
              <button onClick={() => onTabChange("quotes")} className="text-xs text-violet-600 hover:text-violet-800 font-semibold transition-colors">View →</button>
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
        <div className="divide-y divide-border">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            recentActivity.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className={`flex-shrink-0 w-7 h-7 rounded-lg ${activityBg(item.type)} flex items-center justify-center`}>
                  {activityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {isNaN(item.date.getTime()) ? "" : item.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button variant="outline" onClick={() => onTabChange("bookings")} className="h-12 gap-2 font-semibold hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors">
            <Plus className="w-4 h-4" /> New Booking
          </Button>
          <Button variant="outline" onClick={() => onTabChange("accounts")} className="h-12 gap-2 font-semibold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors">
            <User className="w-4 h-4" /> New Client
          </Button>
          <Button variant="outline" onClick={() => onTabChange("emails")} className="h-12 gap-2 font-semibold hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-colors">
            <Mail className="w-4 h-4" /> Send Broadcast
          </Button>
        </div>
      </div>
    </div>
  );
}
