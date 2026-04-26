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

// AFTER
const generateMutation = trpc.ai.generateItinerary.useMutation({
  onSuccess: (data: any) => {
    setResult(data);
    toast.success("Itinerary generated! ✈️");
    if (onLogAccess) onLogAccess(dest);
  },
  onError: (e) => toast.error(e.message),
});

  const downloadPDF = () => {
    if (!result) return;

    // Embed the itinerary data as JSON and load jsPDF from CDN for a true PDF download
    const dataJson = JSON.stringify({
      destination: result.destination,
      duration: result.duration,
      summary: result.summary,
      days: result.days,
      practicalTips: result.practicalTips || [],
      bestTimeToVisit: result.bestTimeToVisit || '',
      localCurrency: result.localCurrency || '',
      agencyName: agencyName || 'CB Travel',
      agencyTagline: agencyTagline || '',
    }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

    const pdfScript = `
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
<script>
var __DATA__ = ${dataJson};
function savePDF() {
  var btn = document.getElementById('pdf-btn');
  if (btn) { btn.textContent = 'Generating...'; btn.disabled = true; }
  try {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var pw = 210, ph = 297, mg = 18, cw = pw - mg * 2;
    var y = mg;
    function newPage(need) { if (y + (need||10) > ph - mg) { doc.addPage(); y = mg; } }
    function wt(text, size, r, g, b, bold) {
      doc.setFontSize(size); doc.setTextColor(r,g,b);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      var lines = doc.splitTextToSize(String(text||''), cw);
      for (var i=0; i<lines.length; i++) { newPage(size*0.5); doc.text(lines[i], mg, y); y += size*0.38; }
      y += 2;
    }
    // Cover
    doc.setFillColor(2,9,23); doc.rect(0,0,pw,55,'F');
    doc.setFontSize(9); doc.setTextColor(212,175,55); doc.setFont('helvetica','bold');
    doc.text((__DATA__.agencyName||'CB TRAVEL').toUpperCase(), mg, 18);
    doc.setFontSize(24); doc.setTextColor(255,255,255);
    var dl = doc.splitTextToSize(__DATA__.destination, cw);
    for (var di=0; di<dl.length; di++) doc.text(dl[di], mg, 30 + di*10);
    doc.setFontSize(11); doc.setTextColor(180,180,180); doc.setFont('helvetica','normal');
    doc.text(__DATA__.duration+'-Day Luxury Itinerary', mg, 47);
    y = 62;
    // Summary
    wt('TRIP OVERVIEW', 8, 30,58,95, true); y -= 2;
    wt(__DATA__.summary||'', 10, 74,85,104); y += 4;
    // Days
    for (var di=0; di<__DATA__.days.length; di++) {
      var day = __DATA__.days[di];
      newPage(25);
      doc.setFillColor(30,58,95); doc.roundedRect(mg-2, y-1, cw+4, 9, 1, 1, 'F');
      doc.setFontSize(9); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
      var dayTitle = doc.splitTextToSize('Day '+day.day+': '+day.title, cw-4);
      doc.text(dayTitle[0], mg+1, y+5.5); y += 12;
      if (day.morning) { wt('Morning', 7.5, 212,175,55, true); y -= 2; wt(day.morning, 9.5, 60,70,90); }
      if (day.afternoon) { wt('Afternoon', 7.5, 212,175,55, true); y -= 2; wt(day.afternoon, 9.5, 60,70,90); }
      if (day.evening) { wt('Evening', 7.5, 212,175,55, true); y -= 2; wt(day.evening, 9.5, 60,70,90); }
      if (day.tip) {
        newPage(14);
        doc.setFillColor(255,251,235); doc.setDrawColor(212,175,55);
        var tipLines = doc.splitTextToSize('Tip: '+day.tip, cw-4);
        var tipH = Math.max(10, tipLines.length*4+5);
        doc.roundedRect(mg, y, cw, tipH, 1, 1, 'FD');
        doc.setFontSize(8.5); doc.setTextColor(120,53,15); doc.setFont('helvetica','italic');
        for (var ti=0; ti<tipLines.length; ti++) doc.text(tipLines[ti], mg+2, y+4+ti*4);
        y += tipH + 2;
      }
      y += 5;
    }
    // Practical tips
    if (__DATA__.practicalTips && __DATA__.practicalTips.length > 0) {
      newPage(20); wt('PRACTICAL TIPS', 8, 30,58,95, true);
      for (var pi=0; pi<__DATA__.practicalTips.length; pi++) wt('  - '+__DATA__.practicalTips[pi], 9.5, 60,70,90);
    }
    // Footers
    var np = doc.internal.getNumberOfPages();
    for (var pg=1; pg<=np; pg++) {
      doc.setPage(pg); doc.setFontSize(7.5); doc.setTextColor(160,160,160); doc.setFont('helvetica','normal');
      doc.setDrawColor(220,220,220); doc.line(mg, ph-10, pw-mg, ph-10);
      doc.text((__DATA__.agencyName||'CB Travel')+' — '+__DATA__.destination+' Itinerary', mg, ph-6);
      doc.text('Page '+pg+' of '+np, pw-mg-18, ph-6);
    }
    var fname = __DATA__.destination.replace(/[^a-z0-9]/gi,'-')+'-'+__DATA__.duration+'day-itinerary.pdf';
    doc.save(fname);
  } catch(e) { alert('PDF generation failed. Please try again.'); console.error(e); }
  finally { if (btn) { btn.textContent = 'Save as PDF'; btn.disabled = false; } }
}
window.addEventListener('load', function() {
  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s.onload = function() { /* ready */ };
  document.head.appendChild(s);
});
<\/script>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${agencyName || 'CB Travel'} — ${result.destination} Itinerary</title>
  ${pdfScript}
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
  </style>
</head>
<body>
  <div id="pdf-toolbar" style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#020917;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:space-between;padding:12px 24px;gap:12px;box-shadow:0 2px 20px rgba(0,0,0,0.5);">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:28px;height:28px;background:linear-gradient(135deg,#d4af37,#c9a030);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px;color:#020917;">CB</div>
      <span style="color:rgba(255,255,255,0.6);font-size:13px;font-family:'Inter',sans-serif;">AI Itinerary Studio</span>
      <span style="color:rgba(255,255,255,0.2);font-size:13px;">·</span>
      <span style="color:rgba(255,255,255,0.4);font-size:13px;font-family:'Inter',sans-serif;">${agencyName || 'CB Travel'}</span>
    </div>
    <div style="display:flex;gap:10px;">
      <button id="pdf-btn" onclick="savePDF()" style="background:linear-gradient(135deg,#d4af37,#c9a030);color:#020917;border:none;padding:9px 20px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;letter-spacing:0.01em;box-shadow:0 2px 12px rgba(212,175,55,0.3);">Save as PDF</button>
      <button onclick="window.close()" style="background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.12);padding:9px 16px;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;">✕ Close</button>
    </div>
  </div>
  <div style="height:60px;"></div>
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
      <div class="period-label">Morning</div>
      <div class="period-text">${d.morning}</div>
    </div>
    <div class="period">
      <div class="period-label">Afternoon</div>
      <div class="period-text">${d.afternoon}</div>
    </div>
    <div class="period">
      <div class="period-label">Evening</div>
      <div class="period-text">${d.evening}</div>
    </div>
    ${d.tip ? `<div class="tip">Local tip: ${d.tip}</div>` : ''}
  </div>`).join('')}
  ${result.practicalTips && result.practicalTips.length > 0 ? `
  <div class="practical">
    <h2 class="practical-title">Practical Tips</h2>
    ${result.practicalTips.map(t => `<div class="practical-item">${t}</div>`).join('')}
  </div>` : ''}
  <div class="footer">
    <p>Created with <span class="footer-brand">${agencyName || 'CB Travel'}</span> AI Itinerary Studio · Powered by <span class="footer-brand">CB Travel</span> · cbtravel.uk</p>
    <p style="margin-top:4px">All itineraries are AI-generated suggestions. Please verify all details before booking.</p>
  </div>
</body>
</html>`;

    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(html);
      previewWindow.document.close();
      previewWindow.focus();
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
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={duration}
                  onChange={e => setDuration(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
                  placeholder="e.g. 7"
                />
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
              onClick={() => generateMutation.mutate({ destination: dest, duration, travelStyle: style, interests, agencyName: agencyName || undefined, agencyTagline: agencyTagline || undefined })}
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
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={duration}
                    onChange={e => setDuration(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                    placeholder="e.g. 7"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  />
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
              <button onClick={() => generateMutation.mutate({ destination: dest, duration, travelStyle: style, interests, agencyName: agencyName || undefined, agencyTagline: agencyTagline || undefined })} disabled={!dest || generateMutation.isPending}
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
