import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { TrendingUp, AlertTriangle, CreditCard, Send, Layers } from "lucide-react";
import { toast } from "sonner";

type SortKey = "outstanding" | "progress" | "name" | "departure";
type SortDir = "asc" | "desc";

interface PaymentRow {
  id: number;
  bookingRef: string;
  clientName: string;
  destination: string;
  totalPrice: number;
  amountPaid: number;
  outstanding: number;
  progress: number;
  status: string;
  departureDate: Date | null;
  isHighRisk: boolean;
  isOverdue: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  };
  const cls = map[status] ?? "bg-slate-100 text-slate-500 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls} capitalize`}>
      {status}
    </span>
  );
}

function getBookingTags(row: PaymentRow): Array<{ label: string; className: string }> {
  const tags: Array<{ label: string; className: string }> = [];
  if (row.status === "cancelled") return [{ label: "Cancelled", className: "bg-slate-100 text-slate-600 border-slate-200" }];
  if (row.outstanding <= 0 && row.totalPrice > 0) {
    tags.push({ label: "Fully Paid", className: "bg-emerald-100 text-emerald-800 border-emerald-200" });
  } else if (row.outstanding > 0) {
    tags.push({ label: "Outstanding Balance", className: "bg-red-100 text-red-800 border-red-200" });
  }
  if (row.isOverdue) tags.push({ label: "Overdue", className: "bg-red-200 text-red-900 border-red-300" });
  if (row.isHighRisk) tags.push({ label: "High Risk", className: "bg-orange-100 text-orange-800 border-orange-200" });
  if (row.progress > 0 && row.progress < 50) tags.push({ label: "Advance Deposit", className: "bg-blue-100 text-blue-800 border-blue-200" });
  if (row.progress >= 50 && row.progress < 100) tags.push({ label: "Part Paid", className: "bg-sky-100 text-sky-800 border-sky-200" });
  if (row.status === "confirmed" && row.outstanding > 0) tags.push({ label: "Confirmed", className: "bg-violet-100 text-violet-800 border-violet-200" });
  return tags;
}

export default function AdminPaymentPlans() {
  const [sortKey, setSortKey] = useState<SortKey>("outstanding");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const bookingsQuery = trpc.bookings.getAllAdmin.useQuery();
  const bookings = bookingsQuery.data ?? [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows: PaymentRow[] = bookings.map((b) => {
    const id = typeof b.id === "number" ? b.id : parseInt(String(b.id), 10) || 0;
    const totalPrice = Number(b.totalPrice) || 0;
    const amountPaid = Number(b.amountPaid) || 0;
    const outstanding = totalPrice - amountPaid;
    const progress = totalPrice > 0 ? Math.round((amountPaid / totalPrice) * 100) : 0;
    const departureDate = b.departureDate ? new Date(b.departureDate) : null;
    const isHighRisk = outstanding > 3000 && b.status !== "completed" && b.status !== "cancelled";
    const isOverdue =
      departureDate !== null &&
      departureDate < today &&
      outstanding > 0 &&
      b.status !== "cancelled";

    return {
      id,
      bookingRef: b.bookingReference ?? `BK${id}`,
      clientName: b.leadPassengerName ?? "Unknown",
      destination: b.destination ?? "Unknown",
      totalPrice,
      amountPaid,
      outstanding,
      progress,
      status: b.status ?? "pending",
      departureDate,
      isHighRisk,
      isOverdue,
    };
  });

  // Summary totals
  const activeRows = rows.filter((r) => r.status !== "cancelled");
  const totalCollected = activeRows.reduce((s, r) => s + r.amountPaid, 0);
  const totalOutstanding = activeRows.reduce((s, r) => s + r.outstanding, 0);
  const grandTotal = totalCollected + totalOutstanding;
  const collectedPct = grandTotal > 0 ? Math.round((totalCollected / grandTotal) * 100) : 0;

  // Risk flags
  const highRisk = rows.filter((r) => r.isHighRisk);
  const overdue = rows.filter((r) => r.isOverdue);

  // Top 3 most at risk (highest outstanding, non-cancelled)
  const topRisk = [...activeRows]
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 3);

  // Sorted table
  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "outstanding") cmp = a.outstanding - b.outstanding;
    else if (sortKey === "progress") cmp = a.progress - b.progress;
    else if (sortKey === "name") cmp = a.clientName.localeCompare(b.clientName);
    else if (sortKey === "departure") {
      const ad = a.departureDate?.getTime() ?? 0;
      const bd = b.departureDate?.getTime() ?? 0;
      cmp = ad - bd;
    }
    return sortDir === "desc" ? -cmp : cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleReminder = (name: string) => toast.success(`Reminder sent to ${name}`);
  const handleSplitPayment = (name: string) => toast.success(`Split payment offer sent to ${name}`);

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
          <CreditCard className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Payment Plans & Financial Control</h2>
          <p className="text-xs text-muted-foreground">Real-time payment monitoring and risk management</p>
        </div>
      </div>

      {/* Cash Flow Summary */}
      <div className="rounded-2xl bg-white border border-border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Cash Flow Overview</h3>
        </div>

        <div className="space-y-3">
          {/* Collected bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-28 flex-shrink-0">Collected</span>
            <div className="flex-1 h-7 rounded-lg bg-muted/40 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg transition-all duration-700 flex items-center pl-3"
                style={{ width: `${collectedPct}%` }}
              >
                {collectedPct > 15 && (
                  <span className="text-xs font-bold text-white">{collectedPct}%</span>
                )}
              </div>
              {collectedPct <= 15 && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">
                  {collectedPct}%
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-emerald-600 w-24 text-right flex-shrink-0">
              £{totalCollected.toLocaleString()}
            </span>
          </div>

          {/* Outstanding bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-28 flex-shrink-0">Outstanding</span>
            <div className="flex-1 h-7 rounded-lg bg-muted/40 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-lg transition-all duration-700 flex items-center pl-3"
                style={{ width: `${100 - collectedPct}%` }}
              >
                {100 - collectedPct > 15 && (
                  <span className="text-xs font-bold text-white">{100 - collectedPct}%</span>
                )}
              </div>
              {100 - collectedPct <= 15 && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-red-500">
                  {100 - collectedPct}%
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-red-600 w-24 text-right flex-shrink-0">
              £{totalOutstanding.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Total Portfolio</span>
          <span className="text-sm font-bold text-foreground">£{grandTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Risk Flags Panel */}
      {(highRisk.length > 0 || overdue.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            Risk Flags
          </h3>

          {/* High Risk */}
          {highRisk.map((r) => (
            <div
              key={`hr-${r.id}`}
              className="flex items-center justify-between rounded-xl bg-red-50 border border-red-100 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🔴</span>
                <div>
                  <p className="text-sm font-semibold text-red-800">HIGH RISK: {r.clientName}</p>
                  <p className="text-xs text-red-600/70">
                    {r.bookingRef} · {r.destination} · £{r.outstanding.toLocaleString()} outstanding
                  </p>
                </div>
              </div>
              {r.departureDate && (
                <span className="text-xs text-red-500">
                  Departs {r.departureDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          ))}

          {/* Overdue */}
          {overdue.map((r) => (
            <div
              key={`od-${r.id}`}
              className="flex items-center justify-between rounded-xl bg-orange-50 border border-orange-100 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🟠</span>
                <div>
                  <p className="text-sm font-semibold text-orange-800">OVERDUE: {r.clientName}</p>
                  <p className="text-xs text-orange-600/70">
                    {r.bookingRef} · {r.destination} · £{r.outstanding.toLocaleString()} still owed
                  </p>
                </div>
              </div>
              {r.departureDate && (
                <span className="text-xs text-orange-500">
                  Departed {r.departureDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Smart Nudge Strip */}
      {topRisk.length > 0 && (
        <div className="rounded-2xl bg-white border border-border overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Smart Nudge — Top 3 At Risk
            </h3>
          </div>
          <div className="divide-y divide-border">
            {topRisk.map((r) => (
              <div key={`nudge-${r.id}`} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{r.clientName}</p>
                  <p className="text-xs text-muted-foreground">{r.bookingRef} · £{r.outstanding.toLocaleString()} outstanding</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleReminder(r.clientName)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 text-xs font-semibold transition-all duration-200"
                  >
                    <Send className="w-3 h-3" />
                    Remind
                  </button>
                  <button
                    onClick={() => handleSplitPayment(r.clientName)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-all duration-200"
                  >
                    <CreditCard className="w-3 h-3" />
                    Split Pay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Status Table */}
      <div className="rounded-2xl bg-white border border-border overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            All Bookings — Payment Status
          </h3>
          <div className="flex gap-2">
            {(["outstanding", "progress", "name", "departure"] as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => toggleSort(k)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all duration-200 ${
                  sortKey === k
                    ? "bg-amber-50 border border-amber-200 text-amber-700"
                    : "bg-muted/40 border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {k} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </button>
            ))}
          </div>
        </div>

        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No bookings found</p>
        ) : (
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {sorted.map((r) => (
              <div key={r.id} className="px-5 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-foreground">{r.clientName}</span>
                      <span className="text-xs text-muted-foreground">{r.bookingRef}</span>
                      <StatusBadge status={r.status} />
                    </div>

                    <p className="text-xs text-muted-foreground mb-2">
                      {r.destination}
                      {r.departureDate &&
                        ` · Departs ${r.departureDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                    </p>

                    {/* Booking Tags */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {getBookingTags(r).map((tag) => (
                        <span key={tag.label} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${tag.className}`}>
                          {tag.label}
                        </span>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden max-w-xs">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            r.progress >= 100
                              ? "bg-emerald-500"
                              : r.progress >= 50
                              ? "bg-amber-400"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${Math.min(100, r.progress)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        £{r.amountPaid.toLocaleString()} / £{r.totalPrice.toLocaleString()}
                        <span className="ml-1.5 text-muted-foreground/60">({r.progress}%)</span>
                      </span>
                    </div>
                    {r.outstanding > 0 && r.status !== "cancelled" && (
                      <p className="text-xs text-red-600">£{r.outstanding.toLocaleString()} outstanding</p>
                    )}
                  </div>

                  {r.status !== "cancelled" && r.outstanding > 0 && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleReminder(r.clientName)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border hover:bg-amber-50 hover:border-amber-200 text-xs font-semibold text-foreground hover:text-amber-700 transition-all duration-200 whitespace-nowrap"
                      >
                        <Send className="w-3 h-3" />
                        Send Reminder
                      </button>
                      <button
                        onClick={() => handleSplitPayment(r.clientName)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border hover:bg-blue-50 hover:border-blue-200 text-xs font-semibold text-foreground hover:text-blue-700 transition-all duration-200 whitespace-nowrap"
                      >
                        <CreditCard className="w-3 h-3" />
                        Offer Split Payment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
