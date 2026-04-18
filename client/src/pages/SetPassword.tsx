import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

export default function SetPassword() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  const setPasswordMutation = trpc.auth.setPassword.useMutation({
    onSuccess: () => { setDone(true); },
    onError: (e) => toast.error(e.message),
  });

  if (!token || !email) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-3">Invalid Link</h1>
        <p className="text-slate-600">This link is invalid or has expired. Please contact <a href="mailto:hello@travelcb.co.uk" className="text-[#1e3a5f] underline">hello@travelcb.co.uk</a> for a new one.</p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-[#1e3a5f] mb-3">Password Set!</h1>
        <p className="text-slate-600 mb-6">Your password has been set successfully. You can now log in.</p>
        <button onClick={() => navigate("/login")} className="bg-[#1e3a5f] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2d5986] transition-colors">Go to Login</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#1e3a5f] mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Set Your Password</h1>
          <p className="text-slate-500 mt-1">Welcome to CB Travel! Please create your password to get started.</p>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (password !== confirm) { toast.error("Passwords do not match"); return; }
          if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
          setPasswordMutation.mutate({ token, email, newPassword: password });
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-slate-800" placeholder="At least 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-slate-800" placeholder="Repeat password" />
          </div>
          <button type="submit" disabled={setPasswordMutation.isPending}
            className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-[#2d5986] transition-colors disabled:opacity-50">
            {setPasswordMutation.isPending ? "Setting Password..." : "Set Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
