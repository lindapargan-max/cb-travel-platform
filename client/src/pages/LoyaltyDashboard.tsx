import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Check, ChevronRight, Copy, Gift, Star, TrendingUp, Zap, Clock, Award } from "lucide-react";
import { toast } from "sonner";
import { useSEO } from '@/hooks/useSEO';

// ─── Tier configuration ────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, {
  label: string; emoji: string; color: string; textColor: string;
  bg: string; border: string; gradient: string; next: string; nextAt: number;
}> = {
  bronze: {
    label: "Bronze", emoji: "🥉", color: "#b45309", textColor: "text-amber-800",
    bg: "bg-amber-50", border: "border-amber-300",
    gradient: "from-amber-600 to-amber-800", next: "Silver", nextAt: 500,
  },
  silver: {
    label: "Silver", emoji: "🥈", color: "#64748b", textColor: "text-slate-600",
    bg: "bg-slate-50", border: "border-slate-300",
    gradient: "from-slate-400 to-slate-600", next: "Gold", nextAt: 1500,
  },
  gold: {
    label: "Gold", emoji: "🥇", color: "#b45309", textColor: "text-yellow-700",
    bg: "bg-yellow-50", border: "border-yellow-300",
    gradient: "from-yellow-500 to-amber-600", next: "", nextAt: 0,
  },
};

const TIER_BENEFITS: Record<string, { icon: string; text: string }[]> = {
  bronze: [
    { icon: "✈️", text: "100 points per booking" },
    { icon: "🎂", text: "Birthday bonus points" },
    { icon: "👥", text: "Earn via referrals" },
    { icon: "⭐", text: "50 points for leaving feedback" },
  ],
  silver: [
    { icon: "✈️", text: "150 points per booking (1.5×)" },
    { icon: "🎂", text: "Double birthday bonus" },
    { icon: "👥", text: "Priority email support" },
    { icon: "💼", text: "Exclusive Silver member deals" },
    { icon: "⭐", text: "Everything in Bronze" },
  ],
  gold: [
    { icon: "✈️", text: "200 points per booking (2×)" },
    { icon: "🎩", text: "Dedicated travel manager" },
    { icon: "🛫", text: "VIP airport lounge rewards" },
    { icon: "🏥", text: "Complimentary insurance quote" },
    { icon: "💎", text: "Exclusive Gold-only rewards" },
    { icon: "⭐", text: "Everything in Silver" },
  ],
};

const HOW_TO_EARN = [
  { icon: "✈️", label: "New Booking", pts: "+100 pts" },
  { icon: "🏖️", label: "Trip Completed", pts: "+200 pts" },
  { icon: "⭐", label: "Leave Feedback", pts: "+50 pts" },
  { icon: "👥", label: "Refer a Friend", pts: "+150 pts" },
  { icon: "🎂", label: "Birthday Bonus", pts: "+50 pts" },
  { icon: "🎯", label: "Admin Reward", pts: "Varies" },
];

// ─── Sub-components ────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.border} ${cfg.textColor}`}
    >
      {cfg.emoji} {cfg.label} Member
    </span>
  );
}

function PointsProgressBar({ current, max, label }: { current: number; max: number; label: string }) {
  const pct = Math.min(100, Math.round((current / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs text-blue-200 mb-1.5">
        <span>{label}</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
        <div
          className="bg-[#e8b84b] h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RewardCard({
  reward,
  currentPoints,
  onClaim,
  claiming,
}: {
  reward: any;
  currentPoints: number;
  onClaim: (id: number, name: string, cost: number) => void;
  claiming: boolean;
}) {
  const canAfford = currentPoints >= reward.pointsCost;
  const outOfStock = reward.stockLimit > 0 && (reward.stockUsed || 0) >= reward.stockLimit;
  const pct = Math.min(100, Math.round((currentPoints / reward.pointsCost) * 100));
  const needed = reward.pointsCost - currentPoints;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${outOfStock ? "opacity-60" : ""}`}>
      {/* Card header accent */}
      <div className="h-1.5 bg-gradient-to-r from-[#1e3a5f] to-[#e8b84b]" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-sm leading-tight">{reward.name}</h3>
            {reward.description && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{reward.description}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-[#1e3a5f]">{reward.pointsCost.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground -mt-0.5">points</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {reward.rewardType && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
              {reward.rewardType}
            </span>
          )}
          {reward.rewardValue && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              {reward.rewardValue}
            </span>
          )}
          {reward.tierRequired && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
              {reward.tierRequired.charAt(0).toUpperCase() + reward.tierRequired.slice(1)}+ only
            </span>
          )}
          {outOfStock && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
              Out of stock
            </span>
          )}
          {reward.stockLimit > 0 && !outOfStock && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
              {reward.stockLimit - (reward.stockUsed || 0)} left
            </span>
          )}
        </div>

        {/* Progress bar if can't afford */}
        {!canAfford && !outOfStock && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{currentPoints.toLocaleString()} pts</span>
              <span className="font-medium text-foreground">{needed.toLocaleString()} more needed</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#1e3a5f] h-1.5 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        <button
          disabled={!canAfford || outOfStock || claiming}
          onClick={() => onClaim(reward.id, reward.name, reward.pointsCost)}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            canAfford && !outOfStock
              ? "bg-[#1e3a5f] text-white hover:bg-[#2d5986] active:scale-95"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {claiming ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Claiming...</>
          ) : canAfford && !outOfStock ? (
            <><Gift size={14} />Claim Reward</>
          ) : outOfStock ? (
            "Out of Stock"
          ) : (
            `Need ${needed.toLocaleString()} more pts`
          )}
        </button>
      </div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: any }) {
  const isEarn = tx.points > 0;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isEarn ? "bg-emerald-100" : "bg-red-100"}`}>
        {isEarn ? (
          <TrendingUp size={14} className="text-emerald-600" />
        ) : (
          <Gift size={14} className="text-red-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{tx.description || tx.transactionType}</p>
        {tx.adminNote && <p className="text-xs text-muted-foreground italic truncate">{tx.adminNote}</p>}
        <p className="text-xs text-muted-foreground">
          {new Date(tx.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${isEarn ? "text-emerald-600" : "text-red-500"}`}>
          {isEarn ? "+" : ""}{tx.points?.toLocaleString()} pts
        </p>
        {tx.balanceAfter !== undefined && (
          <p className="text-xs text-muted-foreground">{tx.balanceAfter?.toLocaleString()} total</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function LoyaltyDashboard() {
  useSEO({ title: 'My Loyalty Rewards', noIndex: true });
  const [activeTab, setActiveTab] = useState<"rewards" | "history" | "vouchers">("rewards");
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const { data: account, refetch: refetchAccount } = trpc.loyalty.myAccount.useQuery();
  const { data: rewards } = trpc.loyalty.availableRewards.useQuery();
  const { data: transactions } = trpc.loyalty.myTransactions.useQuery();
  const { data: redemptions, refetch: refetchRedemptions } = trpc.loyalty.myRedemptions.useQuery();
  const { data: multiplier } = trpc.loyalty.getMultiplierEvent.useQuery();
  const redeemMutation = trpc.loyalty.redeem.useMutation();

  const tier = (account?.tier || "bronze").toLowerCase();
  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  const currentPoints = account?.points ?? account?.currentPoints ?? 0;
  const lifetimePoints = account?.lifetimePoints || 0;

  const progressFrom = tier === "silver" ? Math.max(0, currentPoints - 500) : currentPoints;
  const progressMax = tier === "bronze" ? 500 : tier === "silver" ? 1000 : 1;
  const remaining = Math.max(0, progressMax - progressFrom);

  async function handleClaim(rewardId: number, rewardName: string, cost: number) {
    if (currentPoints < cost) return;
    setClaimingId(rewardId);
    try {
      await redeemMutation.mutateAsync({ rewardId });
      toast.success(`Reward request submitted! We'll process it within 24 hours and email your voucher.`);
      refetchAccount();
      refetchRedemptions();
    } catch (err: any) {
      toast.error(err.message || "Failed to claim reward. Please try again.");
    } finally {
      setClaimingId(null);
    }
  }

  const tabs = [
    { id: "rewards" as const, label: "Rewards Shop", icon: <Gift size={14} /> },
    { id: "history" as const, label: "Points History", icon: <Clock size={14} /> },
    { id: "vouchers" as const, label: "My Vouchers", icon: <Award size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background">
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-12 space-y-6">

      {/* ── Hero Card ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#1e3a5f] via-[#24487a] to-[#1e3a5f] rounded-3xl p-6 md:p-8 text-white shadow-2xl overflow-hidden relative">
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-blue-300 text-sm font-medium tracking-wide uppercase">CB Travel</p>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Loyalty Club</h1>
              <p className="text-blue-200 text-sm mt-1 mb-4">Your exclusive rewards membership</p>
              <TierBadge tier={tier} />
              {multiplier?.active && (
                <div className="inline-flex items-center gap-1.5 ml-2 px-3 py-1 bg-[#e8b84b] text-[#1e3a5f] rounded-full text-xs font-bold animate-pulse">
                  <Zap size={11} /> {multiplier.label} — {multiplier.multiplier}x Points!
                </div>
              )}
            </div>
            <div className="md:text-right">
              <p className="text-blue-300 text-xs uppercase tracking-wider mb-1">Available Points</p>
              <p className="text-5xl font-black text-[#e8b84b] tabular-nums">{currentPoints.toLocaleString()}</p>
              <p className="text-blue-300 text-sm mt-1">{lifetimePoints.toLocaleString()} lifetime pts</p>
            </div>
          </div>

          {/* Progress to next tier */}
          {tier !== "gold" && (
            <div className="mt-6">
              <PointsProgressBar
                current={progressFrom}
                max={progressMax}
                label={`${progressFrom.toLocaleString()} / ${progressMax.toLocaleString()} pts to ${tierCfg.next}`}
              />
              <p className="text-blue-300 text-xs mt-1.5">
                {remaining > 0
                  ? `${remaining.toLocaleString()} more points to unlock ${tierCfg.next} tier`
                  : `You've reached ${tierCfg.next}! Tier update processing...`}
              </p>
            </div>
          )}
          {tier === "gold" && (
            <div className="mt-4 flex items-center gap-2 text-[#e8b84b]">
              <Star size={16} fill="currentColor" />
              <span className="text-sm font-semibold">Maximum tier achieved — you're a VIP!</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Benefits + How to Earn ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Benefits */}
        <div className={`rounded-2xl border p-5 ${tierCfg.bg} ${tierCfg.border}`}>
          <h2 className={`font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 ${tierCfg.textColor}`}>
            {tierCfg.emoji} {tierCfg.label} Member Benefits
          </h2>
          <div className="space-y-2">
            {(TIER_BENEFITS[tier] || []).map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="flex-shrink-0">{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How to earn */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={14} /> How to Earn Points
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {HOW_TO_EARN.map((item) => (
              <div key={item.label} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight">{item.label}</p>
                  <p className="text-sm font-bold text-[#1e3a5f]">{item.pts}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tier Overview ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-bold text-foreground flex items-center gap-2"><Award size={16} className="text-[#e8b84b]" /> Tier Overview</h2>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border">
          {[
            { key: "bronze", label: "Bronze", range: "0 – 499 pts" },
            { key: "silver", label: "Silver", range: "500 – 1,499 pts" },
            { key: "gold", label: "Gold", range: "1,500+ pts" },
          ].map((t) => (
            <div
              key={t.key}
              className={`p-4 text-center transition-colors ${tier === t.key ? "bg-[#1e3a5f]/5" : ""}`}
            >
              <p className="text-2xl mb-1">{TIER_CONFIG[t.key]?.emoji}</p>
              <p className={`font-bold text-sm ${tier === t.key ? "text-[#1e3a5f]" : "text-foreground"}`}>{t.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.range}</p>
              {tier === t.key && (
                <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#e8b84b] text-[#1e3a5f] rounded-full text-xs font-bold">
                  Your tier
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm">
        {/* Tab bar */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold transition-colors relative ${
                activeTab === tab.id
                  ? "text-[#1e3a5f]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e3a5f]" />
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Rewards Shop */}
          {activeTab === "rewards" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(rewards || []).filter((r: any) => r.isActive).map((reward: any) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  currentPoints={currentPoints}
                  onClaim={handleClaim}
                  claiming={claimingId === reward.id}
                />
              ))}
              {(!rewards || rewards.filter((r: any) => r.isActive).length === 0) && (
                <div className="col-span-2 text-center py-16">
                  <Gift size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium">No rewards available right now</p>
                  <p className="text-sm text-muted-foreground mt-1">Check back soon — new rewards are added regularly!</p>
                </div>
              )}
            </div>
          )}

          {/* Points History */}
          {activeTab === "history" && (
            <div>
              {(transactions || []).length > 0 ? (
                <div className="divide-y divide-border">
                  {(transactions || []).map((tx: any, i: number) => (
                    <TransactionRow key={tx.id || i} tx={tx} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <TrendingUp size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium">No transactions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Start earning points by making a booking!</p>
                </div>
              )}
            </div>
          )}

          {/* My Vouchers */}
          {activeTab === "vouchers" && (
            <div className="space-y-3">
              {(redemptions || []).length > 0 ? (
                (redemptions || []).map((r: any) => (
                  <div key={r.id} className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{r.rewardName || "Reward"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">{r.voucherCode}</span>
                        <CopyButton text={r.voucherCode} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Claimed {new Date(r.redeemedAt).toLocaleDateString("en-GB")}
                        {r.expiresAt && ` · Expires ${new Date(r.expiresAt).toLocaleDateString("en-GB")}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        r.status === "active" ? "bg-emerald-100 text-emerald-700" :
                        r.status === "fulfilled" ? "bg-blue-100 text-blue-700" :
                        r.status === "expired" ? "bg-red-100 text-red-600" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {r.status}
                      </span>
                      {r.status === "active" && (
                        <p className="text-xs text-muted-foreground text-right">
                          Email <span className="text-foreground font-medium">hello@cbtravel.uk</span> to redeem
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <Award size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium">No vouchers yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Claim rewards from the shop to see them here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
