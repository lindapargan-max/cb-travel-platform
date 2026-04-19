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

  // Agency setup fields
  const [agencyName, setAgencyName] = useState('');
  const [yourName, setYourName] = useState('');
  const [tagline, setTagline] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const logAccessMutation = trpc.ai.logItineraryAccess.useMutation();

  useEffect(() => {
    document.title = "Travel Agent Itinerary Studio | CB Travel";
    setTimeout(() => setFadeIn(true), 50);
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'CBTRAVEL2025') {
      setError('');
      setStep('setup');
    } else {
      setError('Incorrect password. Please try again.');
      setShake(true);
      setPassword('');
      setTimeout(() => setShake(false), 600);
    }
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim()) return;
    // Log access
    logAccessMutation.mutate({
      agencyName: agencyName + (yourName ? ` (${yourName})` : ''),
      agencyTagline: tagline || undefined,
    });
    setStep('generator');
  };

  const handleLogDestination = (destination: string) => {
    logAccessMutation.mutate({
      agencyName: agencyName + (yourName ? ` (${yourName})` : ''),
      agencyTagline: tagline || undefined,
      destination,
    });
  };

  const displayName = yourName
    ? `${agencyName} · ${yourName}`
    : agencyName;

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #020917 0%, #0a1628 50%, #1e3a5f 100%)',
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    >
      {/* Header bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#d4af37] rounded-lg flex items-center justify-center text-[#020917] font-bold text-sm">CB</div>
          <span className="text-white/60 text-sm">CB Travel · Travel Agent Portal</span>
        </div>
        {step === 'generator' && (
          <div className="text-right">
            <p className="text-white text-sm font-semibold">{displayName}</p>
            {tagline && <p className="text-white/40 text-xs">{tagline}</p>}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center px-4 py-12">

        {/* ─── STEP 1: Password Gate ─── */}
        {step === 'password' && (
          <div
            className={`w-full max-w-md ${shake ? 'animate-shake' : ''}`}
            style={{ animation: shake ? 'shake 0.5s ease' : undefined }}
          >
            <style>{`
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                20% { transform: translateX(-10px); }
                40% { transform: translateX(10px); }
                60% { transform: translateX(-6px); }
                80% { transform: translateX(6px); }
              }
              .animate-shake { animation: shake 0.5s ease; }
            `}</style>
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-[#d4af37] rounded-2xl flex items-center justify-center text-[#020917] font-bold text-3xl mx-auto mb-6 shadow-lg shadow-[#d4af37]/30">
                CB
              </div>
              <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Travel Agent Itinerary Studio
              </h1>
              <p className="text-white/50 text-sm">
                Exclusive access for travel industry professionals
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#d4af37] uppercase tracking-widest mb-2 block">
                    Access Password
                  </label>
                  <input
                    ref={inputRef}
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your access code"
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors text-center text-lg tracking-widest"
                    autoComplete="current-password"
                  />
                  {error && (
                    <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!password}
                  className="w-full bg-[#d4af37] text-[#020917] py-3 rounded-xl font-bold text-base hover:bg-[#e8c84b] transition-colors disabled:opacity-40 shadow-lg shadow-[#d4af37]/20"
                >
                  Enter →
                </button>
              </form>

              <p className="text-center text-white/30 text-xs mt-6">
                Don't have access? Contact us at{' '}
                <a href="mailto:hello@travelcb.co.uk" className="text-[#d4af37] hover:underline">hello@travelcb.co.uk</a>
              </p>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Agency Setup ─── */}
        {step === 'setup' && (
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-[#d4af37] rounded-2xl flex items-center justify-center text-[#020917] font-bold text-2xl mx-auto mb-4 shadow-lg shadow-[#d4af37]/30">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                Welcome!
              </h2>
              <p className="text-white/50 text-sm">Set up your agency branding before generating itineraries</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <form onSubmit={handleSetupSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-[#d4af37] uppercase tracking-widest mb-2 block">
                    Agency Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={e => setAgencyName(e.target.value)}
                    placeholder="e.g. Sunshine Travels"
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#d4af37] uppercase tracking-widest mb-2 block">
                    Your Name <span className="text-white/30 font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={yourName}
                    onChange={e => setYourName(e.target.value)}
                    placeholder="e.g. James"
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#d4af37] uppercase tracking-widest mb-2 block">
                    Tagline <span className="text-white/30 font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    placeholder="e.g. Your Dream Holiday Awaits"
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!agencyName.trim()}
                  className="w-full bg-[#d4af37] text-[#020917] py-4 rounded-xl font-bold text-base hover:bg-[#e8c84b] transition-colors disabled:opacity-40 shadow-lg shadow-[#d4af37]/20"
                >
                  Start Creating ✨
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Generator ─── */}
        {step === 'generator' && (
          <div className="w-full max-w-3xl">
            <div className="text-center mb-10">
              <p className="text-[#d4af37] text-xs font-semibold uppercase tracking-widest mb-2">{displayName}</p>
              <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                AI Itinerary Studio
              </h1>
              {tagline && <p className="text-white/50 text-base">{tagline}</p>}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <AIItineraryGenerator
                agencyName={displayName}
                agencyTagline={tagline}
                isProMode={true}
                onLogAccess={handleLogDestination}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t border-white/5">
        <p className="text-white/25 text-xs">
          Powered by{' '}
          <a href="https://travelcb.co.uk" target="_blank" rel="noopener noreferrer" className="text-[#d4af37]/60 hover:text-[#d4af37] transition-colors">
            CB Travel · travelcb.co.uk
          </a>
        </p>
      </div>
    </div>
  );
}
