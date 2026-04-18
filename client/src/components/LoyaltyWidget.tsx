import { trpc } from "../lib/trpc";

const TIERS = [
  { name: "Bronze", min: 0, max: 499, emoji: "🥉", color: "from-amber-600 to-amber-700", next: 500 },
  { name: "Silver", min: 500, max: 1499, emoji: "🥈", color: "from-slate-400 to-slate-500", next: 1500 },
  { name: "Gold", min: 1500, max: Infinity, emoji: "🥇", color: "from-yellow-500 to-amber-500", next: null },
];

function getTier(points: number) {
  return TIERS.find(t => points >= t.min && points <= t.max) || TIERS[0];
}

export default function LoyaltyWidget() {
  const { data: account } = trpc.loyalty.myAccount.useQuery();
  const { data: rewards } = trpc.loyalty.availableRewards.useQuery();
  const { data: transactions } = trpc.loyalty.myTransactions.useQuery();
  const redeemMutation = trpc.loyalty.redeem.useMutation();

  if (!account) return null;
  const tier = getTier(account.points || 0);
  const nextTier = tier.next ? TIERS.find(t => t.min === tier.next) : null;
  const progress = nextTier ? Math.min(100, ((account.points - tier.min) / (nextTier.min - tier.min)) * 100) : 100;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className={`bg-gradient-to-r ${tier.color} p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm uppercase tracking-wide">Your Tier</p>
            <p className="text-3xl font-bold">{tier.emoji} {tier.name}</p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Points Balance</p>
            <p className="text-4xl font-bold">{(account.points || 0).toLocaleString()}</p>
          </div>
        </div>
        {nextTier && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/80 mb-1">
              <span>{tier.name}</span>
              <span>{nextTier.name} in {(nextTier.min - account.points).toLocaleString()} pts</span>
            </div>
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        {!nextTier && <p className="mt-4 text-sm text-white/80 text-center">🎉 You've reached our highest tier!</p>}
      </div>
      <div className="p-6">
        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-[#1e3a5f]">{account.points?.toLocaleString() || 0}</p>
            <p className="text-xs text-slate-500">Available Points</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-[#1e3a5f]">{account.lifetimePoints?.toLocaleString() || 0}</p>
            <p className="text-xs text-slate-500">Lifetime Points</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-[#1e3a5f]">{tier.emoji}</p>
            <p className="text-xs text-slate-500">{tier.name} Member</p>
          </div>
        </div>

        {rewards && rewards.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-[#1e3a5f] mb-3">🎁 Rewards Catalogue</h3>
            <div className="space-y-2">
              {rewards.filter((r: any) => r.isActive).map((reward: any) => (
                <div key={reward.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div>
                    <p className="font-medium text-slate-800">{reward.name}</p>
                    {reward.description && <p className="text-xs text-slate-500">{reward.description}</p>}
                    <p className="text-xs text-amber-600 font-semibold">{reward.pointsCost.toLocaleString()} points</p>
                  </div>
                  <button onClick={() => redeemMutation.mutate({ rewardId: reward.id })}
                    disabled={(account.points || 0) < reward.pointsCost || redeemMutation.isPending}
                    className="bg-[#e8b84b] text-white text-sm px-3 py-1.5 rounded-lg font-medium hover:bg-[#d4a43a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    Redeem
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {transactions && transactions.length > 0 && (
          <div>
            <h3 className="font-semibold text-[#1e3a5f] mb-3">📋 Recent Transactions</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {transactions.slice(0, 10).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
                  <div>
                    <p className="font-medium text-slate-700">{tx.description}</p>
                    <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString('en-GB')}</p>
                  </div>
                  <span className={`font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
