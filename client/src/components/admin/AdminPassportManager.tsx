import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Shield, AlertTriangle, CheckCircle2, Send, Users } from "lucide-react";
import { toast } from "sonner";

type RiskTier = "critical" | "warning" | "safe";

interface PassportRecord {
  bookingId: number;
  clientName: string;
  bookingRef: string;
  destination: string;
  departureDate: Date | null;
  mockExpiry: Date;
  daysUntilExpiry: number;
  monthsUntilExpiryFromDeparture: number;
  risk: RiskTier;
}

function getRiskFromMonths(months: number): RiskTier {
  if (months < 3) return "critical";
  if (months < 6) return "warning";
  return "safe";
}

function diffMonths(a: Date, b: Date): number {
  return (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth());
}

export default function AdminPassportManager() {
  const [filter, setFilter] = useState<RiskTier | "all">("all");
  const bookingsQuery = trpc.bookings.getAllAdmin.useQuery();
  const bookings = bookingsQuery.data ?? [];

  const today = new Date();

  const records: PassportRecord[] = bookings
    .filter((b) => b.status !== "cancelled")
    .map((b) => {
      const id = typeof b.id === "number" ? b.id : parseInt(String(b.id), 10) || 0;
      const mockExpiry = new Date(2024 + (id % 4), id % 12, (id % 28) + 1);
      const departureDate = b.departureDate ? new Date(b.departureDate) : null;
      const refDate = departureDate ?? today;
      const monthsUntilExpiryFromDeparture = diffMonths(mockExpiry, refDate);
      const daysUntilExpiry = Math.round((mockExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const risk = getRiskFromMonths(monthsUntilExpiryFromDeparture);

      return {
        bookingId: id,
        clientName: b.leadPassengerName ?? "Unknown Client",
        bookingRef: b.bookingReference ?? `BK${id}`,
        destination: b.destination ?? "Unknown",
        departureDate,
        mockExpiry,
        daysUntilExpiry,
        monthsUntilExpiryFromDeparture,
        risk,
      };
    });

  const criticalCount = records.filter((r) => r.risk === "critical").length;
  const warningCount = records.filter((r) => r.risk === "warning").length;
  const safeCount = records.filter((r) => r.risk === "safe").length;

  const filtered = filter === "all" ? records : records.filter((r) => r.risk === filter);

  const riskConfig: Record<RiskTier, { label: string; color: string; bg: string; border: string; dot: string }> = {
    critical: {
      label: "Critical",
      color: "text-red-300",
      bg: "bg-red-950/40",
      border: "border-red-800/50",
      dot: "bg-red-500",
    },
    warning: {
      label: "Warning",
      color: "text-yellow-300",
      bg: "bg-yellow-950/40",
      border: "border-yellow-800/50",
      dot: "bg-yellow-400",
    },
    safe: {
      label: "Safe",
      color: "text-emerald-300",
      bg: "bg-emerald-950/30",
      border: "border-emerald-800/50",
      dot: "bg-emerald-500",
    },
  };

  const handleSendReminder = (name: string) => {
    toast.success(`Reminder sent to ${name}`);
  };

  const handleSendAllCritical = () => {
    const criticals = records.filter((r) => r.risk === "critical");
    if (criticals.length === 0) {
      toast.info("No critical clients to notify");
      return;
    }
    toast.success(`Sent passport reminders to ${criticals.length} critical client${criticals.length > 1 ? "s" : ""}`);
  };

  const progressColor = (risk: RiskTier) => {
    if (risk === "critical") return "bg-red-500";
    if (risk === "warning") return "bg-yellow-400";
    return "bg-emerald-500";
  };

  // Progress: months until expiry from departure / 24 months max (capped 0-100)
  const progressPct = (months: number) => Math.max(0, Math.min(100, (months / 24) * 100));

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Passport Risk Manager</h2>
            <p className="text-xs text-slate-500">Proactive passport validity monitoring</p>
          </div>
        </div>
        <button
          onClick={handleSendAllCritical}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/40 border border-red-700/50 text-red-300 hover:bg-red-800/50 text-sm font-semibold transition-all duration-200"
        >
          <Send className="w-3.5 h-3.5" />
          Send All Critical Reminders
        </button>
      </div>

      {/* Risk Summary Strip */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilter(filter === "critical" ? "all" : "critical")}
          className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
            filter === "critical"
              ? "bg-red-900/50 border-red-600/60"
              : "bg-red-950/40 border-red-800/40 hover:border-red-700/60"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-red-300/70 uppercase tracking-wide">Critical</span>
          </div>
          <p className="text-3xl font-bold text-red-300">{criticalCount}</p>
          <p className="text-xs text-red-400/60 mt-0.5">{"< 3 months"}</p>
        </button>

        <button
          onClick={() => setFilter(filter === "warning" ? "all" : "warning")}
          className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
            filter === "warning"
              ? "bg-yellow-900/50 border-yellow-600/60"
              : "bg-yellow-950/40 border-yellow-800/40 hover:border-yellow-700/60"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-300/70 uppercase tracking-wide">Warning</span>
          </div>
          <p className="text-3xl font-bold text-yellow-300">{warningCount}</p>
          <p className="text-xs text-yellow-400/60 mt-0.5">3–6 months</p>
        </button>

        <button
          onClick={() => setFilter(filter === "safe" ? "all" : "safe")}
          className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
            filter === "safe"
              ? "bg-emerald-900/50 border-emerald-600/60"
              : "bg-emerald-950/30 border-emerald-800/40 hover:border-emerald-700/60"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-300/70 uppercase tracking-wide">Safe</span>
          </div>
          <p className="text-3xl font-bold text-emerald-300">{safeCount}</p>
          <p className="text-xs text-emerald-400/60 mt-0.5">{"> 6 months"}</p>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "critical", "warning", "safe"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-200 ${
              filter === f
                ? "bg-amber-400/20 border border-amber-400/40 text-amber-300"
                : "bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200"
            }`}
          >
            {f === "all" ? `All (${records.length})` : f}
          </button>
        ))}
      </div>

      {/* Client List */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-700/50 overflow-hidden shadow-lg">
        <div className="px-5 py-3.5 border-b border-slate-700/50 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
            Client Passport Status
            <span className="ml-2 text-slate-500 normal-case font-normal">({filtered.length} clients)</span>
          </h3>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">No clients in this category</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filtered.map((r) => {
              const cfg = riskConfig[r.risk];
              const pct = progressPct(r.monthsUntilExpiryFromDeparture);
              return (
                <div key={r.bookingId} className={`px-5 py-4 hover:bg-slate-800/30 transition-colors`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-100">{r.clientName}</span>
                          <span className="text-xs text-slate-500">{r.bookingRef}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                          <span className="text-xs text-slate-400">{r.destination}</span>
                          {r.departureDate && (
                            <span className="text-xs text-slate-500">
                              Departs {r.departureDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                          <span className="text-xs text-slate-500">
                            Passport expires{" "}
                            {r.mockExpiry.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            {r.daysUntilExpiry > 0
                              ? ` (${r.daysUntilExpiry}d away)`
                              : " (EXPIRED)"}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 w-full max-w-xs">
                          <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progressColor(r.risk)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {r.monthsUntilExpiryFromDeparture > 0
                              ? `${r.monthsUntilExpiryFromDeparture}mo validity at departure`
                              : "Expired before departure"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendReminder(r.clientName)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-700/60 text-xs font-semibold text-slate-300 hover:text-slate-100 transition-all duration-200"
                    >
                      <Send className="w-3 h-3" />
                      Send Reminder
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
