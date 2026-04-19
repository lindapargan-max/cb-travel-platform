import { useState } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

interface Day { day: number; title: string; morning: string; afternoon: string; evening: string; tip?: string; }
interface Itinerary { destination: string; duration: number; summary: string; days: Day[]; practicalTips?: string[]; bestTimeToVisit?: string; localCurrency?: string; language?: string; }

interface AIItineraryGeneratorProps {
  destination?: string;
  agencyName?: string;
  agencyTagline?: string;
  isProMode?: boolean;
  onLogAccess?: (destination: string) => void;
}

export default function AIItineraryGenerator({ destination: initDest, agencyName, agencyTagline, isProMode = false, onLogAccess }: AIItineraryGeneratorProps) {
  const [dest, setDest] = useState(initDest || "");
  const [duration, setDuration] = useState(7);
  const [style, setStyle] = useState<'relaxing' | 'adventurous' | 'cultural' | 'family'>('relaxing');
  const [interests, setInterests] = useState<string[]>([]);
  const [result, setResult] = useState<Itinerary | null>(null);
  const [open, setOpen] = useState(false);

  const styles = [{ id: 'relaxing', label: '🌊 Relaxing' }, { id: 'adventurous', label: '🏔️ Adventurous' }, { id: 'cultural', label: '🏛️ Cultural' }, { id: 'family', label: '👨‍👩‍👧 Family' }] as const;
  const interestOptions = ['Beach', 'History', 'Food', 'Shopping', 'Nature', 'Nightlife', 'Sports', 'Art', 'Architecture', 'Wildlife'];

  const generateMutation = trpc.ai.generateItinerary.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      toast.success("Itinerary generated! ✈️");
      if (onLogAccess && data?.destination) onLogAccess(data.destination);
    },
    onError: (e) => toast.error(e.message),
  });

  const downloadPDF = () => {
    if (!result) return;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${agencyName || 'CB Travel'} — ${result.destination} Itinerary</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #1a1a2e; background: white; }
    .cover { background: linear-gradient(135deg, #020917 0%, #1e3a5f 100%); color: white; padding: 60px 50px; min-height: 200px; }
    .cover-agency { font-size: 13px; letter-spacing: 3px; text-transform: uppercase; color: #d4af37; margin-bottom: 8px; }
    .cover-title { font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 700; margin-bottom: 8px; }
    .cover-sub { font-size: 16px; color: rgba(255,255,255,0.7); margin-bottom: 30px; }
    .cover-meta { display: flex; gap: 30px; }
    .cover-meta-item { text-align: center; }
    .cover-meta-value { font-size: 24px; font-weight: 700; color: #d4af37; }
    .cover-meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.6); }
    .summary { padding: 30px 50px; background: #f8f9fa; border-bottom: 1px solid #e5e7eb; }
    .summary-text { font-size: 15px; line-height: 1.7; color: #4a5568; }
    .day { padding: 25px 50px; border-bottom: 1px solid #f0f0f0; page-break-inside: avoid; }
    .day-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .day-number { background: #d4af37; color: #020917; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 100px; text-transform: uppercase; letter-spacing: 1px; }
    .day-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: #020917; }
    .period { margin-bottom: 12px; }
    .period-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #d4af37; margin-bottom: 4px; }
    .period-text { font-size: 14px; color: #4a5568; line-height: 1.6; }
    .tip { background: #fffbeb; border-left: 3px solid #d4af37; padding: 10px 16px; margin-top: 10px; font-size: 13px; color: #78350f; }
    .practical { padding: 30px 50px; background: #f8f9fa; }
    .practical-title { font-family: 'Playfair Display', serif; font-size: 20px; margin-bottom: 16px; color: #020917; }
    .practical-item { padding: 6px 0; font-size: 14px; color: #4a5568; border-bottom: 1px solid #e5e7eb; }
    .practical-item:before { content: '→ '; color: #d4af37; font-weight: 700; }
    .footer { padding: 20px 50px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    .footer-brand { color: #d4af37; font-weight: 600; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .day { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="cover">
    <p class="cover-agency">${agencyName || 'CB Travel'}${agencyTagline ? ' — ' + agencyTagline : ''}</p>
    <h1 class="cover-title">${result.destination}</h1>
    <p class="cover-sub">${result.summary}</p>
    <div class="cover-meta">
      <div class="cover-meta-item">
        <div class="cover-meta-value">${result.duration}</div>
        <div class="cover-meta-label">Days</div>
      </div>
      ${result.bestTimeToVisit ? `<div class="cover-meta-item"><div class="cover-meta-value" style="font-size:14px">${result.bestTimeToVisit}</div><div class="cover-meta-label">Best Time</div></div>` : ''}
      ${result.localCurrency ? `<div class="cover-meta-item"><div class="cover-meta-value" style="font-size:14px">${result.localCurrency}</div><div class="cover-meta-label">Currency</div></div>` : ''}
    </div>
  </div>
  ${result.days.map(d => `
  <div class="day">
    <div class="day-header">
      <span class="day-number">Day ${d.day}</span>
      <span class="day-title">${d.title}</span>
    </div>
    <div class="period">
      <div class="period-label">🌅 Morning</div>
      <div class="period-text">${d.morning}</div>
    </div>
    <div class="period">
      <div class="period-label">☀️ Afternoon</div>
      <div class="period-text">${d.afternoon}</div>
    </div>
    <div class="period">
      <div class="period-label">🌙 Evening</div>
      <div class="period-text">${d.evening}</div>
    </div>
    ${d.tip ? `<div class="tip">💡 Local tip: ${d.tip}</div>` : ''}
  </div>`).join('')}
  ${result.practicalTips && result.practicalTips.length > 0 ? `
  <div class="practical">
    <h2 class="practical-title">Practical Tips</h2>
    ${result.practicalTips.map(t => `<div class="practical-item">${t}</div>`).join('')}
  </div>` : ''}
  <div class="footer">
    <p>Created with <span class="footer-brand">${agencyName || 'CB Travel'}</span> AI Itinerary Studio · Powered by <span class="footer-brand">CB Travel</span> · travelcb.co.uk</p>
    <p style="margin-top:4px">All itineraries are AI-generated suggestions. Please verify all details before booking.</p>
  </div>
</body>
</html>`;

    // Wrap html with an action bar so the user can choose to save or print
    const wrappedHtml = html.replace(
      '<body>',
      `<body>
  <div id="pdf-toolbar" style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#020917;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-between;padding:12px 24px;gap:12px;box-shadow:0 2px 20px rgba(0,0,0,0.5);">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:28px;height:28px;background:linear-gradient(135deg,#d4af37,#c9a030);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px;color:#020917;">CB</div>
      <span style="color:rgba(255,255,255,0.6);font-size:13px;font-family:'Inter',sans-serif;">AI Itinerary Studio</span>
      <span style="color:rgba(255,255,255,0.2);font-size:13px;">·</span>
      <span style="color:rgba(255,255,255,0.4);font-size:13px;font-family:'Inter',sans-serif;">${agencyName || 'CB Travel'}</span>
    </div>
    <div style="display:flex;gap:10px;">
      <button onclick="window.print()" style="background:linear-gradient(135deg,#d4af37,#c9a030);color:#020917;border:none;padding:9px 20px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;letter-spacing:0.01em;box-shadow:0 2px 12px rgba(212,175,55,0.3);">⬇ Save as PDF</button>
      <button onclick="window.close()" style="background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.12);padding:9px 16px;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;">✕ Close</button>
    </div>
  </div>
  <div style="height:60px;"></div>`
    );

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(wrappedHtml);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const content = `${agencyName || 'CB TRAVEL'} — AI ITINERARY\n${result.destination} · ${result.duration} Days\n\n${result.summary}\n\n${result.days.map(d => `Day ${d.day}: ${d.title}\n🌅 Morning: ${d.morning}\n☀️ Afternoon: ${d.afternoon}\n🌙 Evening: ${d.evening}${d.tip ? `\n💡 Tip: ${d.tip}` : ''}`).join('\n\n')}${result.practicalTips ? `\n\nPRACTICAL TIPS:\n${result.practicalTips.map(t => `• ${t}`).join('\n')}` : ''}`;
    navigator.clipboard.writeText(content).then(() => toast.success("Copied to clipboard!"));
  };

  // ─── PRO MODE (public agent page) ────────────────────────────────────────────
  if (isProMode) {
    return (
      <div className="w-full">
        {!result ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#d4af37] uppercase tracking-widest mb-2 block">Destination</label>
                <input
                  value={dest}
                  onChange={e => setDest(e.target.value)}
                  placeholder="e.g. Santorini, Japan, Maldives"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#d4af37] uppercase tracking-widest mb-2 block">Duration</label>
                <select
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
                >
                  {[3,5,7,10,14,21].map(n => <option key={n} value={n} className="bg-[#020917]">{n} days</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#d4af37] uppercase tracking-widest mb-3 block">Travel Style</label>
              <div className="flex flex-wrap gap-2">
                {styles.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id as any)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${style === s.id ? 'bg-[#d4af37] text-[#020917]' : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#d4af37] uppercase tracking-widest mb-3 block">Interests <span className="text-white/40 normal-case font-normal">(optional)</span></label>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map(i => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${interests.includes(i) ? 'bg-[#d4af37] text-[#020917]' : 'bg-white/10 text-white/60 hover:bg-white/20 border border-white/20'}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => generateMutation.mutate({ destination: dest, duration, travelStyle: style, interests })}
              disabled={!dest || generateMutation.isPending}
              className="w-full bg-[#d4af37] text-[#020917] py-4 rounded-xl font-bold text-lg hover:bg-[#e8c84b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#d4af37]/20"
            >
              {generateMutation.isPending ? "✨ Crafting your itinerary..." : "✨ Generate AI Itinerary"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">{result.destination}</h2>
                <p className="text-white/60 mt-1">{result.summary}</p>
              </div>
              <button onClick={() => setResult(null)} className="shrink-0 text-white/40 hover:text-white text-sm border border-white/20 px-3 py-1.5 rounded-lg hover:border-white/40 transition-colors">
                ← New
              </button>
            </div>

            {/* Info chips */}
            {(result.bestTimeToVisit || result.localCurrency || result.language) && (
              <div className="flex flex-wrap gap-2">
                {result.bestTimeToVisit && <span className="bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full border border-white/20">📅 {result.bestTimeToVisit}</span>}
                {result.localCurrency && <span className="bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full border border-white/20">💰 {result.localCurrency}</span>}
                {result.language && <span className="bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full border border-white/20">🗣️ {result.language}</span>}
                <span className="bg-[#d4af37]/20 text-[#d4af37] text-xs px-3 py-1.5 rounded-full border border-[#d4af37]/30">✈️ {result.duration} Days</span>
              </div>
            )}

            {/* Day cards */}
            <div className="space-y-4">
              {result.days.map(d => (
                <div key={d.day} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-[#d4af37]/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-[#d4af37] text-[#020917] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Day {d.day}</span>
                    <span className="font-semibold text-white text-lg">{d.title}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-[#d4af37] uppercase tracking-widest mb-1">🌅 Morning</p>
                      <p className="text-sm text-white/70 leading-relaxed">{d.morning}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#d4af37] uppercase tracking-widest mb-1">☀️ Afternoon</p>
                      <p className="text-sm text-white/70 leading-relaxed">{d.afternoon}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#d4af37] uppercase tracking-widest mb-1">🌙 Evening</p>
                      <p className="text-sm text-white/70 leading-relaxed">{d.evening}</p>
                    </div>
                    {d.tip && (
                      <div className="bg-[#d4af37]/10 border-l-2 border-[#d4af37] pl-3 py-2 mt-2 rounded-r-lg">
                        <p className="text-xs text-[#d4af37]">💡 {d.tip}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Practical tips */}
            {result.practicalTips && result.practicalTips.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-3">📋 Practical Tips</h3>
                <ul className="space-y-2">
                  {result.practicalTips.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="text-[#d4af37] mt-0.5">→</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={downloadPDF}
                className="flex-1 bg-[#d4af37] text-[#020917] py-3 rounded-xl font-bold hover:bg-[#e8c84b] transition-colors shadow-lg shadow-[#d4af37]/20"
              >
                ⬇️ Download PDF
              </button>
              <button
                onClick={copyToClipboard}
                className="flex-1 bg-white/10 text-white py-3 rounded-xl font-medium hover:bg-white/20 transition-colors border border-white/20"
              >
                📋 Copy Text
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── STANDARD MODE (client dashboard accordion) ───────────────────────────
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div className="text-left">
            <p className="font-semibold text-[#1e3a5f]">AI Itinerary Generator</p>
            <p className="text-xs text-slate-500">Get a personalised day-by-day travel plan</p>
          </div>
        </div>
        <svg className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {open && (
        <div className="p-5 border-t border-slate-100">
          {!result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Destination</label>
                  <input value={dest} onChange={e => setDest(e.target.value)} placeholder="e.g. Santorini" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Duration (days)</label>
                  <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                    {[3,5,7,10,14,21].map(n => <option key={n} value={n}>{n} days</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Travel Style</label>
                <div className="flex flex-wrap gap-2">
                  {styles.map(s => <button key={s.id} type="button" onClick={() => setStyle(s.id as any)} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${style === s.id ? 'bg-[#1e3a5f] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s.label}</button>)}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Interests (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map(i => <button key={i} type="button" onClick={() => setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])} className={`px-2.5 py-1 rounded-full text-xs transition-colors ${interests.includes(i) ? 'bg-[#e8b84b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{i}</button>)}
                </div>
              </div>
              <button onClick={() => generateMutation.mutate({ destination: dest, duration, travelStyle: style, interests })} disabled={!dest || generateMutation.isPending}
                className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-[#2d5986] transition-colors disabled:opacity-50">
                {generateMutation.isPending ? "✨ Generating your itinerary..." : "✨ Generate AI Itinerary"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[#1e3a5f]">{result.destination} — {result.duration} Days</h3>
                  <p className="text-sm text-slate-500">{result.summary}</p>
                </div>
                <button onClick={() => setResult(null)} className="text-slate-400 hover:text-slate-600 text-xs">← New</button>
              </div>
              {(result.bestTimeToVisit || result.localCurrency || result.language) && (
                <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                  {result.bestTimeToVisit && <span>📅 Best time: {result.bestTimeToVisit}</span>}
                  {result.localCurrency && <span>💰 {result.localCurrency}</span>}
                  {result.language && <span>🗣️ {result.language}</span>}
                </div>
              )}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {result.days.map(d => (
                  <div key={d.day} className="border border-slate-200 rounded-xl p-4">
                    <p className="font-semibold text-[#1e3a5f] mb-2">Day {d.day}: {d.title}</p>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>🌅 <strong>Morning:</strong> {d.morning}</p>
                      <p>☀️ <strong>Afternoon:</strong> {d.afternoon}</p>
                      <p>🌙 <strong>Evening:</strong> {d.evening}</p>
                      {d.tip && <p className="text-xs text-amber-600 mt-1">💡 {d.tip}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={downloadPDF} className="flex-1 bg-[#e8b84b] text-white py-2 rounded-xl font-medium hover:bg-[#d4a43a] transition-colors text-sm">⬇️ Download PDF</button>
                <button onClick={copyToClipboard} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm">📋 Copy</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
