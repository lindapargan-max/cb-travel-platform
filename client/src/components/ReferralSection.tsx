import { useState } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

export default function ReferralSection() {
  const { data } = trpc.referral.getMyCode.useQuery();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!data?.link) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      toast.success("Referral link copied! 🎉");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for browsers that block clipboard API (e.g. non-HTTPS or restricted permissions)
      try {
        const textarea = document.createElement("textarea");
        textarea.value = data.link;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        toast.success("Referral link copied! 🎉");
        setTimeout(() => setCopied(false), 3000);
      } catch {
        toast.error("Could not copy — please copy the link manually.");
      }
    }
  };

  if (!data) return null;

  return (
    <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5986] rounded-2xl p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🎁</span>
        <div>
          <h3 className="font-bold text-lg">Share the Travel Love!</h3>
          <p className="text-blue-200 text-sm">Refer friends & earn loyalty points for every signup</p>
        </div>
      </div>
      <div className="bg-white/10 rounded-xl p-4 mb-4">
        <p className="text-blue-200 text-xs mb-2">Your unique referral link:</p>
        <div className="flex gap-2">
          <input readOnly value={data.link} className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none truncate" />
          <button onClick={copy} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white text-[#1e3a5f] hover:bg-blue-50'}`}>
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-center text-sm">
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-2xl font-bold">150</p>
          <p className="text-blue-200 text-xs">Points you earn per referral</p>
        </div>
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-2xl font-bold">50</p>
          <p className="text-blue-200 text-xs">Points your friend gets</p>
        </div>
      </div>
      <p className="text-blue-200 text-xs mt-3 text-center">Your code: <strong className="font-mono text-white">{data.code}</strong></p>
    </div>
  );
}
