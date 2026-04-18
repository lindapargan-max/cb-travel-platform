import { useState } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

interface Day { day: number; title: string; morning: string; afternoon: string; evening: string; tip?: string; }
interface Itinerary { destination: string; duration: number; summary: string; days: Day[]; practicalTips?: string[]; bestTimeToVisit?: string; localCurrency?: string; language?: string; }

export default function AIItineraryGenerator({ destination: initDest }: { destination?: string }) {
  const [dest, setDest] = useState(initDest || "");
  const [duration, setDuration] = useState(7);
  const [style, setStyle] = useState<'relaxing' | 'adventurous' | 'cultural' | 'family'>('relaxing');
  const [interests, setInterests] = useState<string[]>([]);
  const [result, setResult] = useState<Itinerary | null>(null);
  const [open, setOpen] = useState(false);

  const styles = [{ id: 'relaxing', label: '🌊 Relaxing' }, { id: 'adventurous', label: '🏔️ Adventurous' }, { id: 'cultural', label: '🏛️ Cultural' }, { id: 'family', label: '👨‍👩‍👧 Family' }] as const;
  const interestOptions = ['Beach', 'History', 'Food', 'Shopping', 'Nature', 'Nightlife', 'Sports', 'Art', 'Architecture', 'Wildlife'];

  const generateMutation = trpc.ai.generateItinerary.useMutation({
    onSuccess: (data: any) => { setResult(data); toast.success("Itinerary generated! ✈️"); },
    onError: (e) => toast.error(e.message),
  });

  const downloadPDF = () => {
    if (!result) return;
    const content = `CB TRAVEL — AI ITINERARY\n${result.destination} · ${result.duration} Days\n\n${result.summary}\n\n${result.days.map(d => `Day ${d.day}: ${d.title}\n🌅 Morning: ${d.morning}\n☀️ Afternoon: ${d.afternoon}\n🌙 Evening: ${d.evening}${d.tip ? `\n💡 Tip: ${d.tip}` : ''}`).join('\n\n')}${result.practicalTips ? `\n\nPRACTICAL TIPS:\n${result.practicalTips.map(t => `• ${t}`).join('\n')}` : ''}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `itinerary-${result.destination.replace(/\s+/g,'-').toLowerCase()}.txt`; a.click();
  };

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
                <div><h3 className="font-bold text-lg text-[#1e3a5f]">{result.destination} — {result.duration} Days</h3><p className="text-sm text-slate-500">{result.summary}</p></div>
                <button onClick={() => setResult(null)} className="text-slate-400 hover:text-slate-600 text-xs">← New</button>
              </div>
              {result.bestTimeToVisit && <div className="flex gap-4 text-sm text-slate-600"><span>📅 Best time: {result.bestTimeToVisit}</span>{result.localCurrency && <span>💰 {result.localCurrency}</span>}{result.language && <span>🗣️ {result.language}</span>}</div>}
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
              <button onClick={downloadPDF} className="w-full bg-[#e8b84b] text-white py-2 rounded-xl font-medium hover:bg-[#d4a43a] transition-colors text-sm">⬇️ Download Itinerary</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
