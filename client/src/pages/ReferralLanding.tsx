import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "../lib/trpc";

export default function ReferralLanding() {
  const params = useParams<{ code: string }>();
  const [, navigate] = useLocation();
  const { data } = trpc.referral.validate.useQuery(params.code || "", { enabled: !!params.code });

  useEffect(() => {
    if (params.code) {
      localStorage.setItem('referralCode', params.code);
    }
  }, [params.code]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] to-[#2d5986] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="text-6xl mb-4">🌴</div>
        <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2">You've Been Invited!</h1>
        {data?.valid && data.referrerName ? (
          <p className="text-slate-600 mb-6"><strong>{data.referrerName}</strong> has invited you to join CB Travel. Sign up today and get a welcome discount!</p>
        ) : (
          <p className="text-slate-600 mb-6">Join CB Travel and start planning your dream holiday today!</p>
        )}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-amber-700 font-semibold">🎁 Special Offer</p>
          <p className="text-amber-600 text-sm">Register now and receive a welcome discount on your first booking</p>
        </div>
        <div className="space-y-2">
          <button onClick={() => navigate("/register")} className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-[#2d5986] transition-colors">Create Account</button>
          <button onClick={() => navigate("/")} className="w-full text-slate-500 text-sm hover:text-slate-700">Learn more about CB Travel</button>
        </div>
      </div>
    </div>
  );
}
