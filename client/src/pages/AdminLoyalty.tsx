import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, Check, X, Users, Gift, Award, Zap, BarChart3, Star } from "lucide-react";
import { toast } from "sonner";

const TIER_EMOJI: Record<string, string> = { bronze: "🥉", silver: "🥈", gold: "🥇" };

// ─── Field components ──────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-input rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow ${props.className || ""}`}
    />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className={`w-full border border-input rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow ${props.className || ""}`}
    >
      {children}
    </select>
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full border border-input rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-shadow ${props.className || ""}`}
    />
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    fulfilled: "bg-blue-100 text-blue-700 border-blue-200",
    cancelled: "bg-red-100 text-red-600 border-red-200",
    expired: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function AdminLoyalty() {
  const [tab, setTab] = useState<"overview" | "members" | "rewards" | "redemptions" | "events" | "referrals">("overview");
  const [editingReward, setEditingReward] = useState<any>(null);
  const [showNewReward, setShowNewReward] = useState(false);
  const [newReward, setNewReward] = useState({
    name: "", description: "", pointsCost: 100,
    rewardType: "discount", rewardValue: "", stockLimit: 0, tierRequired: "",
  });
  const [addPointsForm, setAddPointsForm] = useState<{ userId: number; userName: string; points: number; description: string; action: "add" | "deduct" } | null>(null);
  const [multiplierForm, setMultiplierForm] = useState({ multiplier: 2, label: "Double Points Weekend!" });

  const utils = trpc.useUtils();
  const { data: stats } = trpc.loyalty.getLoyaltyStats.useQuery();
  const { data: allUsers, refetch: refetchAllUsers } = trpc.admin.users.useQuery();
  const { data: loyaltyAccounts, refetch: refetchMembers } = trpc.loyalty.allAccounts.useQuery();

  // Merge: every registered user is shown; overlay loyalty data if they have an account
  const members = (allUsers || []).map((u: any) => {
    const la = (loyaltyAccounts || []).find((a: any) => a.userId === u.id);
    return {
      userId: u.id,
      name: u.name || u.fullName || "",
      email: u.email,
      tier: la?.tier || "bronze",
      currentPoints: la?.points ?? la?.currentPoints ?? 0,
      lifetimePoints: la?.lifetimePoints ?? 0,
      hasAccount: !!la,
    };
  });
  const { data: rewards, refetch: refetchRewards } = trpc.loyalty.allRewards.useQuery();
  const { data: redemptions, refetch: refetchRedemptions } = trpc.loyalty.getAllRedemptionsAdmin.useQuery();
  const { data: leaderboard } = trpc.loyalty.getLeaderboard.useQuery();
  const { data: multiplierEvent, refetch: refetchMultiplier } = trpc.loyalty.getMultiplierEvent.useQuery();

  const createRewardMut = trpc.loyalty.createReward.useMutation();
  const updateRewardMut = trpc.loyalty.updateReward.useMutation();
  const deleteRewardMut = trpc.loyalty.deleteReward.useMutation();
  const addPointsMut = trpc.loyalty.addPoints.useMutation();
  const deductPointsMut = trpc.loyalty.deductPoints.useMutation();
  const fulfillMut = trpc.loyalty.fulfillRedemption.useMutation();
  const cancelMut = trpc.loyalty.cancelRedemption.useMutation();
  const [cancelDialog, setCancelDialog] = useState<{ id: number; rewardName: string } | null>(null);
  const toggleEventMut = trpc.loyalty.toggleMultiplierEvent.useMutation();

  async function saveReward() {
    try {
      if (editingReward) {
        await updateRewardMut.mutateAsync({ id: Number(editingReward.id), ...editingReward, isActive: editingReward.isActive != null ? Boolean(editingReward.isActive) : undefined });
        toast.success("Reward updated!");
        setEditingReward(null);
      } else {
        await createRewardMut.mutateAsync({
          ...newReward,
          pointsCost: Number(newReward.pointsCost),
          stockLimit: Number(newReward.stockLimit) || undefined,
        });
        toast.success("Reward created!");
        setNewReward({ name: "", description: "", pointsCost: 100, rewardType: "discount", rewardValue: "", stockLimit: 0, tierRequired: "" });
        setShowNewReward(false);
      }
      refetchRewards();
    } catch (e: any) {
      toast.error(e.message || "Failed to save reward");
    }
  }

  async function handleAddPoints() {
    if (!addPointsForm || !addPointsForm.description) return;
    try {
      if (addPointsForm.action === "add") {
        await addPointsMut.mutateAsync({ userId: addPointsForm.userId, points: addPointsForm.points, description: addPointsForm.description });
      } else {
        await deductPointsMut.mutateAsync({ userId: addPointsForm.userId, points: addPointsForm.points, description: addPointsForm.description });
      }
      toast.success(`Points ${addPointsForm.action === "add" ? "added" : "deducted"} successfully!`);
      setAddPointsForm(null);
      // Force a fresh fetch — invalidate+refetchMembers can race, so just refetch directly
      await utils.loyalty.allAccounts.refetch();
      await utils.loyalty.getLoyaltyStats.refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to update points");
    }
  }

  const { data: referralStats } = trpc.referral.getAdminStats.useQuery();

  const navTabs = [
    { id: "overview" as const, label: "Overview", icon: <BarChart3 size={15} /> },
    { id: "members" as const, label: "Members", icon: <Users size={15} /> },
    { id: "referrals" as const, label: "Referrals", icon: <span style={{fontSize:14}}>🔗</span> },
    { id: "rewards" as const, label: "Rewards", icon: <Gift size={15} /> },
    { id: "redemptions" as const, label: "Redemptions", icon: <Award size={15} /> },
    { id: "events" as const, label: "Events", icon: <Zap size={15} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5986] rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">🏆 Loyalty Club Manager</h2>
            <p className="text-blue-200 text-sm mt-1">Manage members, rewards, and point events</p>
          </div>
          {multiplierEvent?.active && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#e8b84b] text-[#1e3a5f] rounded-full text-sm font-bold animate-pulse self-start md:self-auto">
              <Zap size={14} /> {multiplierEvent.label} — {multiplierEvent.multiplier}x Active!
            </div>
          )}
        </div>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {[
            { label: "Registered Users", value: (allUsers?.length ?? stats?.totalMembers ?? 0).toLocaleString() },
            { label: "Points Issued", value: stats?.totalPointsIssued?.toLocaleString() || "0" },
            { label: "Points Redeemed", value: stats?.totalPointsRedeemed?.toLocaleString() || "0" },
            { label: "Redemptions", value: stats?.totalRedemptions?.toLocaleString() || "0" },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm border border-white/10">
              <p className="text-2xl font-bold text-[#e8b84b]">{s.value}</p>
              <p className="text-xs text-blue-200 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl border border-border w-fit">
        {navTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? "bg-white text-[#1e3a5f] shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Tier distribution */}
          {stats?.tierCounts && (
            <div className="grid grid-cols-3 gap-4">
              {(stats.tierCounts as any[]).map((tc: any) => (
                <div key={tc.tier} className="bg-white rounded-2xl border border-border p-5 shadow-sm text-center">
                  <p className="text-3xl mb-2">{TIER_EMOJI[tc.tier] || "🏅"}</p>
                  <p className="font-bold text-foreground capitalize">{tc.tier}</p>
                  <p className="text-3xl font-black text-[#1e3a5f] mt-1">{tc.count}</p>
                  <p className="text-xs text-muted-foreground">members</p>
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Star size={16} className="text-[#e8b84b]" />
              <h3 className="font-bold text-foreground">Points Leaderboard</h3>
            </div>
            <div className="divide-y divide-border">
              {(leaderboard || []).slice(0, 10).map((m: any, i: number) => (
                <div key={m.userId} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-slate-100 text-slate-600" : i === 2 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <span className="text-xs font-medium">{TIER_EMOJI[m.tier]} {m.tier}</span>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-[#1e3a5f]">{m.currentPoints?.toLocaleString()} pts</p>
                    <p className="text-xs text-muted-foreground">{m.lifetimePoints?.toLocaleString()} lifetime</p>
                  </div>
                </div>
              ))}
              {(!leaderboard || leaderboard.length === 0) && (
                <div className="text-center py-10 text-muted-foreground">No members yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MEMBERS ─────────────────────────────────────────────────── */}
      {tab === "members" && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-bold text-foreground">All Loyalty Members</h3>
          </div>
          <div className="divide-y divide-border">
            {(members || []).map((m: any) => (
              <div key={m.userId} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                <div className="w-9 h-9 bg-[#1e3a5f]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[#1e3a5f]">
                    {(m.name || m.email || "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{m.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
                <span className="text-xs hidden sm:block">
                  {m.hasAccount ? `${TIER_EMOJI[m.tier]} ${m.tier?.charAt(0).toUpperCase() + m.tier?.slice(1)}` : (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs">No account</span>
                  )}
                </span>
                <div className="text-right hidden sm:block">
                  <p className="font-bold text-[#1e3a5f] text-sm">{m.currentPoints?.toLocaleString()} pts</p>
                  <p className="text-xs text-muted-foreground">{m.lifetimePoints?.toLocaleString()} lifetime</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setAddPointsForm({ userId: m.userId, userName: m.name || m.email, points: 100, description: "", action: "add" })}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-200 transition-colors"
                  >
                    <TrendingUp size={11} /> Add
                  </button>
                  <button
                    onClick={() => setAddPointsForm({ userId: m.userId, userName: m.name || m.email, points: 50, description: "", action: "deduct" })}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
                  >
                    <TrendingDown size={11} /> Deduct
                  </button>
                </div>
              </div>
            ))}
            {(!allUsers || allUsers.length === 0) && (
              <div className="text-center py-10 text-muted-foreground">No registered users yet</div>
            )}
          </div>
        </div>
      )}

      {/* ── REWARDS ─────────────────────────────────────────────────── */}
      {tab === "rewards" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">Reward Catalogue</h3>
            <button
              onClick={() => { setShowNewReward(true); setEditingReward(null); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3a5f] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5986] transition-colors"
            >
              <Plus size={14} /> Add Reward
            </button>
          </div>

          {/* New / Edit Form */}
          {(showNewReward || editingReward) && (() => {
            const isEditing = !!editingReward;
            const form = isEditing ? editingReward : newReward;
            const setForm = isEditing ? setEditingReward : (fn: any) => setNewReward(p => fn(p));
            return (
              <div className="bg-white rounded-2xl border-2 border-[#1e3a5f] shadow-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-[#1e3a5f]">{isEditing ? `Editing: ${editingReward.name}` : "New Reward"}</h4>
                  <button onClick={() => { setShowNewReward(false); setEditingReward(null); }} className="text-muted-foreground hover:text-foreground">
                    <X size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Reward Name *">
                    <Input placeholder="e.g. £25 Travel Voucher" value={form.name} onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))} />
                  </Field>
                  <Field label="Points Cost *">
                    <Input type="number" placeholder="500" value={form.pointsCost} onChange={(e) => setForm((p: any) => ({ ...p, pointsCost: +e.target.value }))} />
                  </Field>
                  <Field label="Description">
                    <Textarea rows={2} placeholder="What does the client get?" value={form.description || ""} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} />
                  </Field>
                  <div className="space-y-3">
                    <Field label="Reward Type">
                      <Select value={form.rewardType || "discount"} onChange={(e) => setForm((p: any) => ({ ...p, rewardType: e.target.value }))}>
                        <option value="discount">Discount</option>
                        <option value="upgrade">Upgrade</option>
                        <option value="lounge_access">Lounge Access</option>
                        <option value="transfer">Airport Transfer</option>
                        <option value="experience">Experience</option>
                        <option value="voucher">Voucher</option>
                      </Select>
                    </Field>
                    <Field label="Reward Value (shown on card)">
                      <Input placeholder="e.g. £25 off, 1 free night" value={form.rewardValue || ""} onChange={(e) => setForm((p: any) => ({ ...p, rewardValue: e.target.value }))} />
                    </Field>
                  </div>
                  <Field label="Stock Limit (0 = unlimited)">
                    <Input type="number" placeholder="0" value={form.stockLimit || 0} onChange={(e) => setForm((p: any) => ({ ...p, stockLimit: +e.target.value }))} />
                  </Field>
                  <Field label="Tier Required">
                    <Select value={form.tierRequired || ""} onChange={(e) => setForm((p: any) => ({ ...p, tierRequired: e.target.value }))}>
                      <option value="">All tiers</option>
                      <option value="silver">Silver+ only</option>
                      <option value="gold">Gold only</option>
                    </Select>
                  </Field>
                  {isEditing && (
                    <Field label="Status">
                      <label className="flex items-center gap-2 cursor-pointer mt-1">
                        <div
                          onClick={() => setForm((p: any) => ({ ...p, isActive: !p.isActive }))}
                          className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${form.isActive ? "bg-[#1e3a5f]" : "bg-muted"}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full m-1 transition-transform ${form.isActive ? "translate-x-4" : "translate-x-0"}`} />
                        </div>
                        <span className="text-sm font-medium">{form.isActive ? "Active" : "Inactive"}</span>
                      </label>
                    </Field>
                  )}
                </div>
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={saveReward}
                    disabled={!form.name || form.pointsCost < 1}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1e3a5f] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5986] disabled:opacity-50 transition-colors"
                  >
                    <Check size={14} /> {isEditing ? "Save Changes" : "Create Reward"}
                  </button>
                  <button
                    onClick={() => { setShowNewReward(false); setEditingReward(null); }}
                    className="px-5 py-2.5 border border-input rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Rewards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(rewards || []).map((r: any) => (
              <div key={r.id} className={`bg-white rounded-2xl border border-border shadow-sm overflow-hidden transition-opacity ${!r.isActive ? "opacity-50" : ""}`}>
                <div className="h-1 bg-gradient-to-r from-[#1e3a5f] to-[#e8b84b]" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground text-sm">{r.name}</h4>
                      {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-[#1e3a5f]">{r.pointsCost?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">pts</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {r.rewardType && <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs">{r.rewardType}</span>}
                    {r.rewardValue && <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs">{r.rewardValue}</span>}
                    {r.tierRequired && <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs">{r.tierRequired}+</span>}
                    {r.stockLimit > 0 && <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-full text-xs">{r.stockLimit - (r.stockUsed || 0)}/{r.stockLimit} left</span>}
                    {!r.isActive && <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-600 rounded-full text-xs">Inactive</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingReward({ ...r }); setShowNewReward(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-input rounded-lg text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Deactivate this reward?")) return;
                        await deleteRewardMut.mutateAsync(Number(r.id));
                        toast.success("Reward removed");
                        refetchRewards();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {(!rewards || rewards.length === 0) && (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                <Gift size={36} className="mx-auto mb-3 opacity-40" />
                <p>No rewards yet. Add one above to get started!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REDEMPTIONS ─────────────────────────────────────────────── */}
      {tab === "redemptions" && (
        <div className="space-y-3">
          {(redemptions || []).map((r: any) => (
            <div key={r.id} className="bg-white rounded-2xl border border-border shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-foreground">{r.rewardName}</p>
                  <StatusPill status={r.status} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span className="font-medium text-foreground">{r.clientName}</span>
                  <span>{r.clientEmail}</span>
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.voucherCode}</span>
                  <span>{r.pointsSpent?.toLocaleString()} pts</span>
                  <span>{new Date(r.redeemedAt).toLocaleDateString("en-GB")}</span>
                </div>
              </div>
              {r.status === "active" && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={async () => { await fulfillMut.mutateAsync({ id: r.id }); toast.success("Marked as fulfilled"); refetchRedemptions(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-colors"
                  >
                    <Check size={12} /> Fulfil
                  </button>
                  <button
                    onClick={() => setCancelDialog({ id: r.id, rewardName: r.rewardName || 'Reward' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
                  >
                    <X size={12} /> Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
          {/* Cancel Redemption Dialog */}
          {cancelDialog && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCancelDialog(null)}>
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">Cancel Redemption</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to cancel the redemption for <strong>{cancelDialog.rewardName}</strong>?
                </p>
                <p className="text-sm font-semibold text-gray-700 mb-3">Would you like to return the points to the customer's balance?</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={async () => {
                      await cancelMut.mutateAsync({ id: cancelDialog.id, returnPoints: true });
                      toast.success("Redemption cancelled — points returned");
                      setCancelDialog(null);
                      refetchRedemptions();
                    }}
                    className="w-full py-2.5 px-4 bg-green-100 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-200 transition-colors"
                    disabled={cancelMut.isPending}
                  >
                    ✅ Yes, return points to customer
                  </button>
                  <button
                    onClick={async () => {
                      await cancelMut.mutateAsync({ id: cancelDialog.id, returnPoints: false });
                      toast.success("Redemption cancelled — points not returned");
                      setCancelDialog(null);
                      refetchRedemptions();
                    }}
                    className="w-full py-2.5 px-4 bg-red-100 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors"
                    disabled={cancelMut.isPending}
                  >
                    ❌ No, do not return points
                  </button>
                  <button
                    onClick={() => setCancelDialog(null)}
                    className="w-full py-2 px-4 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                  >
                    Never mind
                  </button>
                </div>
              </div>
            </div>
          )}
          {(!redemptions || redemptions.length === 0) && (
            <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl border border-border">
              <Award size={36} className="mx-auto mb-3 opacity-40" />
              <p>No redemptions yet</p>
            </div>
          )}
        </div>
      )}

      {/* ── REFERRALS ───────────────────────────────────────────────── */}
      {tab === "referrals" && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Referrals Made</p>
              <p className="text-3xl font-bold text-[#1e3a5f]">{referralStats?.totalReferrals ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Clients who joined via a referral link</p>
            </div>
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Active Referrers</p>
              <p className="text-3xl font-bold text-[#1e3a5f]">{referralStats?.referrers.filter(r => r.referralCount > 0).length ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Members who have referred at least one person</p>
            </div>
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Points Awarded via Referrals</p>
              <p className="text-3xl font-bold text-[#1e3a5f]">{(referralStats?.referrers.reduce((s, r) => s + r.pointsEarned, 0) ?? 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Bonus points earned by referrers in total</p>
            </div>
          </div>

          {/* Referrer table */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <span className="text-base">🔗</span>
              <h3 className="font-bold text-foreground">All Members &amp; Their Referral Stats</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Member</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Referral Code</th>
                    <th className="text-center px-5 py-3 font-semibold text-muted-foreground">Referrals Made</th>
                    <th className="text-center px-5 py-3 font-semibold text-muted-foreground">Points Earned</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Shareable Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(referralStats?.referrers || []).map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-foreground">{r.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded-lg">{r.referralCode}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {r.referralCount > 0 ? (
                          <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 font-bold text-sm rounded-full w-8 h-8">{r.referralCount}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {r.pointsEarned > 0 ? (
                          <span className="text-[#1e3a5f] font-semibold">+{r.pointsEarned.toLocaleString()} pts</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                          onClick={() => {
                            const link = `${window.location.origin}/refer/${r.referralCode}`;
                            navigator.clipboard.writeText(link);
                          }}
                        >
                          Copy link
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!referralStats?.referrers.length && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No referral data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5986] rounded-2xl p-6 text-white">
            <h4 className="font-bold text-lg mb-3">How Refer a Friend Works</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="font-bold mb-1">1. Member shares their link</p>
                <p className="text-blue-200">Each member has a unique link they can share with friends &amp; family.</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="font-bold mb-1">2. Friend signs up</p>
                <p className="text-blue-200">The new client creates an account via the referral link — both are rewarded automatically.</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="font-bold mb-1">3. Points &amp; promo codes</p>
                <p className="text-blue-200">Referrer gets <strong>150 pts + £15 off</strong>. New client gets <strong>50 pts + £10 off</strong>.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EVENTS ──────────────────────────────────────────────────── */}
      {tab === "events" && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-[#e8b84b]" />
            <h3 className="font-bold text-foreground">Points Multiplier Event</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Run a limited-time event where members earn bonus points on all transactions.
            Great for holidays, Black Friday, or special promotions.
          </p>

          {multiplierEvent?.active && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center gap-3">
              <Zap size={20} className="text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-amber-800">{multiplierEvent.label} is LIVE</p>
                <p className="text-sm text-amber-700">{multiplierEvent.multiplier}x points on all earnings right now!</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Field label="Event Name / Label">
              <Input
                placeholder="e.g. Summer Double Points Weekend!"
                value={multiplierForm.label}
                onChange={(e) => setMultiplierForm((p) => ({ ...p, label: e.target.value }))}
              />
            </Field>
            <Field label="Point Multiplier">
              <Select
                value={multiplierForm.multiplier}
                onChange={(e) => setMultiplierForm((p) => ({ ...p, multiplier: +e.target.value }))}
              >
                <option value={1.5}>1.5× Points</option>
                <option value={2}>2× Points (Double!)</option>
                <option value={3}>3× Points (Triple!)</option>
                <option value={5}>5× Points (5× Bonus!)</option>
              </Select>
            </Field>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={async () => {
                await toggleEventMut.mutateAsync({ active: true, multiplier: multiplierForm.multiplier, label: multiplierForm.label });
                toast.success("Event started!");
                refetchMultiplier();
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              <Zap size={14} /> Start Event
            </button>
            {multiplierEvent?.active && (
              <button
                onClick={async () => {
                  await toggleEventMut.mutateAsync({ active: false });
                  toast.success("Event stopped");
                  refetchMultiplier();
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 border border-red-300 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                <X size={14} /> Stop Event
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Add/Deduct Points Dialog ──────────────────────────────── */}
      {addPointsForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${addPointsForm.action === "add" ? "text-emerald-700" : "text-red-600"}`}>
              {addPointsForm.action === "add" ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {addPointsForm.action === "add" ? "Add Points" : "Deduct Points"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">For: <span className="font-semibold text-foreground">{addPointsForm.userName}</span></p>
            <div className="space-y-3">
              <Field label="Points">
                <Input
                  type="number"
                  min={1}
                  value={addPointsForm.points}
                  onChange={(e) => setAddPointsForm((p) => p ? { ...p, points: +e.target.value } : null)}
                />
              </Field>
              <Field label="Reason *">
                <Input
                  placeholder="e.g. Compensation for issue, special reward"
                  value={addPointsForm.description}
                  onChange={(e) => setAddPointsForm((p) => p ? { ...p, description: e.target.value } : null)}
                />
              </Field>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleAddPoints}
                disabled={!addPointsForm.description || addPointsForm.points < 1}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                  addPointsForm.action === "add" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Confirm
              </button>
              <button
                onClick={() => setAddPointsForm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-input hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
