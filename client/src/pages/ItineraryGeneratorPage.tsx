import { useState, useEffect, useRef } from "react";
import { trpc } from "../lib/trpc";
import AIItineraryGenerator from "../components/AIItineraryGenerator";

type Step = 'password' | 'setup' | 'generator';

export default function ItineraryGeneratorPage() {
  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Agency setup fields
  const [agencyName, setAgencyName] = useState('');
  const [yourName, setYourName] = useState('');
  const [tagline, setTagline] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const logAccessMutation = trpc.ai.logItineraryAccess.useMutation();
  const verifyPasswordMutation = trpc.ai.verifyItineraryPassword.useMutation();

  useEffect(() => {
    document.title = "AI Itinerary Studio | CB Travel";
    setTimeout(() => setFadeIn(true), 50);
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await verifyPasswordMutation.mutateAsync({ password });
      if (result.valid) {
        setError('');
        setStep('setup');
      } else {
        setError('Incorrect access code. Please try again.');
        setShake(true);
        setPassword('');
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      setError('Unable to verify. Please try again.');
    }
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim()) return;
    logAccessMutation.mutate({
      agencyName: agencyName + (yourName ? ` (${yourName})` : ''),
      agencyTagline: tagline || undefined,
      eventType: 'access',
    });
    setStep('generator');
  };

  const displayName = yourName ? `${agencyName} · ${yourName}` : agencyName;

  const inputCls = "w-full bg-white/[0.06] border border-white/[0.12] rounded-2xl px-4 py-3.5 text-white placeholder-white/25 focus:outline-none focus:border-[#d4af37]/70 focus:ring-2 focus:ring-[#d4af37]/20 transition-all text-[15px]";
  const labelCls = "text-[11px] font-semibold text-[#d4af37]/80 uppercase tracking-[0.15em] mb-2 block";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #020b18 0%, #071525 40%, #0d2040 100%)',
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .shake { animation: shake 0.5s ease; }
      `}</style>

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#d4af37] to-[#b8963a] rounded-lg flex items-center justify-center text-[#020b18] font-black text-[13px] shadow-lg">
            CB
          </div>
          <span className="text-white/40 text-sm font-medium">CB Travel</span>
          <span className="text-white/20 text-sm">·</span>
          <span className="text-white/30 text-[13px]">Travel Agent Portal</span>
        </div>
        {step === 'generator' && (
          <div className="text-right">
            <p className="text-white/80 text-sm font-semibold">{displayName}</p>
            {tagline && <p className="text-white/30 text-xs mt-0.5">{tagline}</p>}
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">

        {/* ─── STEP 1: Password Gate ─── */}
        {step === 'password' && (
          <div className={`w-full max-w-[420px] fade-up ${shake ? 'shake' : ''}`}>
            {/* Branding */}
            <div className="text-center mb-10">
              <div className="relative inline-flex mb-7">
                <div className="w-[72px] h-[72px] bg-gradient-to-br from-[#d4af37] to-[#b8963a] rounded-[20px] flex items-center justify-center text-[#020b18] font-black text-2xl shadow-2xl shadow-[#d4af37]/20">
                  CB
                </div>
                <div className="absolute -inset-1 bg-[#d4af37]/20 rounded-[22px] -z-10 blur-md" />
              </div>
              <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight mb-2">
                AI Itinerary Studio
              </h1>
              <p className="text-white/40 text-[14px]">
                Exclusive access for travel industry professionals
              </p>
            </div>

            {/* Card */}
            <div className="bg-white/[0.04] border border-white/[0.1] rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <label className={labelCls}>Access Code</label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your access code"
                      className={`${inputCls} pr-12 text-center tracking-[0.2em]`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPass ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                  {error && (
                    <p className="text-red-400 text-[12px] mt-2 text-center font-medium">{error}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!password}
                  className="w-full bg-gradient-to-r from-[#d4af37] to-[#c9a030] text-[#020b18] py-3.5 rounded-2xl font-bold text-[15px] hover:from-[#e0bc44] hover:to-[#d4af37] transition-all disabled:opacity-35 shadow-lg shadow-[#d4af37]/20 active:scale-[0.98]"
                >
                  Unlock Access →
                </button>
              </form>

              <p className="text-center text-white/25 text-[12px] mt-6 leading-relaxed">
                Don't have access?{' '}
                <a href="mailto:hello@travelcb.co.uk" className="text-[#d4af37]/60 hover:text-[#d4af37] transition-colors">
                  hello@travelcb.co.uk
                </a>
              </p>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Agency Setup ─── */}
        {step === 'setup' && (
          <div className="w-full max-w-[440px] fade-up">
            <div className="text-center mb-10">
              <div className="relative inline-flex mb-6">
                <div className="w-[64px] h-[64px] bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[18px] flex items-center justify-center text-white text-2xl shadow-xl">
                  ✓
                </div>
                <div className="absolute -inset-1 bg-emerald-400/20 rounded-[20px] -z-10 blur-md" />
              </div>
              <h2 className="text-[26px] font-bold text-white tracking-tight mb-2">
                Access Granted
              </h2>
              <p className="text-white/40 text-[14px]">
                Set up your agency branding to personalise itineraries
              </p>
            </div>

            <div className="bg-white/[0.04] border border-white/[0.1] rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
              <form onSubmit={handleSetupSubmit} className="space-y-5">
                <div>
                  <label className={labelCls}>
                    Agency Name <span className="text-red-400 normal-case">*</span>
                  </label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={e => setAgencyName(e.target.value)}
                    placeholder="e.g. Sunshine Travels"
                    className={inputCls}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Your Name{' '}
                    <span className="text-white/25 normal-case font-normal tracking-normal">— optional</span>
                  </label>
                  <input
                    type="text"
                    value={yourName}
                    onChange={e => setYourName(e.target.value)}
                    placeholder="e.g. Sarah"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Tagline{' '}
                    <span className="text-white/25 normal-case font-normal tracking-normal">— optional</span>
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    placeholder="e.g. Your Dream Holiday Awaits"
                    className={inputCls}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!agencyName.trim()}
                  className="w-full bg-gradient-to-r from-[#d4af37] to-[#c9a030] text-[#020b18] py-3.5 rounded-2xl font-bold text-[15px] hover:from-[#e0bc44] hover:to-[#d4af37] transition-all disabled:opacity-35 shadow-lg shadow-[#d4af37]/20 active:scale-[0.98] mt-2"
                >
                  Start Creating ✨
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Generator ─── */}
        {step === 'generator' && (
          <div className="w-full max-w-3xl fade-up">
            <div className="text-center mb-10">
              <p className="text-[#d4af37]/70 text-[11px] font-semibold uppercase tracking-[0.2em] mb-3">
                {displayName}
              </p>
              <h1 className="text-[38px] font-bold text-white tracking-tight leading-none mb-3">
                AI Itinerary Studio
              </h1>
              {tagline && (
                <p className="text-white/40 text-[15px]">{tagline}</p>
              )}
            </div>

            <div className="bg-white/[0.04] border border-white/[0.1] rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
<AIItineraryGenerator
  agencyName={displayName}
  agencyTagline={tagline || undefined}
  onLogAccess={(destination) => {
    logAccessMutation.mutate({
      agencyName: agencyName + (yourName ? ` (${yourName})` : ''),
      agencyTagline: tagline || undefined,
      destination,
      eventType: 'generate',
    });
  }}
/>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-5 border-t border-white/[0.05] text-center">
        <p className="text-white/20 text-[12px]">
          Powered by{' '}
          <a
            href="https://travelcb.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d4af37]/50 hover:text-[#d4af37] transition-colors"
          >
            CB Travel · travelcb.co.uk
          </a>
        </p>
      </footer>
    </div>
  );
}
