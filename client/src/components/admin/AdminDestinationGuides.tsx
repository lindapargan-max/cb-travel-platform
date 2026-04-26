import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const CONTINENTS = ["Europe", "Asia", "Africa", "Americas", "Middle East", "Oceania", "Antarctica"];

export default function AdminDestinationGuides() {
  const { data: guides = [], isLoading, refetch } = trpc.guides.getAllAdmin.useQuery();
  const createMut = trpc.guides.create.useMutation({
    onSuccess: () => { refetch(); setShowModal(false); toast.success("Guide created!"); },
    onError: (e) => toast.error(e.message || "Failed to create guide"),
  });
  const updateMut = trpc.guides.update.useMutation({
    onSuccess: () => { refetch(); setEditing(null); toast.success("Guide updated!"); },
    onError: (e) => toast.error(e.message || "Failed to update guide"),
  });
  const deleteMut = trpc.guides.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Guide deleted."); },
    onError: (e) => toast.error(e.message || "Failed to delete guide"),
  });
  const generateMut = trpc.guides.generateContent.useMutation({
    onError: (e) => toast.error(e.message || "AI generation failed"),
  });

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState("");

  const emptyForm = {
    destination: "", country: "", region: "", continent: "Europe",
    tagline: "", overview: "", bestTimeToVisit: "", climate: "",
    currency: "", language: "", timezone: "", flightTimeFromUK: "",
    attractions: [] as any[], dining: [] as any[], accommodation: [] as any[],
    insiderTips: [] as string[], gettingThere: "", visaInfo: "",
    curatedItinerary: null as any,
    tags: [] as string[], heroImageBase64: "", heroImageMimeType: "",
    featured: false, published: false, aiGenerated: false,
  };
  const [form, setForm] = useState({ ...emptyForm });

  function openCreate() { setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(g: any) { setEditing(g); setForm({ ...emptyForm, ...g, tags: g.tags || [], insiderTips: g.insiderTips || [], attractions: g.attractions || [], dining: g.dining || [], accommodation: g.accommodation || [] }); setShowModal(true); }

  async function handleGenerate() {
    if (!form.destination.trim()) { toast.error("Enter a destination name first"); return; }
    setGenerating(true);
    setGenProgress("Contacting AI…");
    try {
      setGenProgress("Generating guide content — this may take 15-30 seconds…");
      const result = await generateMut.mutateAsync({ destination: form.destination, country: form.country || undefined });
      setForm(prev => ({
        ...prev,
        country: result.country || prev.country,
        region: result.region || prev.region,
        continent: result.continent || prev.continent,
        tagline: result.tagline || prev.tagline,
        overview: result.overview || prev.overview,
        bestTimeToVisit: result.bestTimeToVisit || prev.bestTimeToVisit,
        climate: result.climate || prev.climate,
        currency: result.currency || prev.currency,
        language: result.language || prev.language,
        timezone: result.timezone || prev.timezone,
        flightTimeFromUK: result.flightTimeFromUK || prev.flightTimeFromUK,
        attractions: result.attractions || prev.attractions,
        dining: result.dining || prev.dining,
        accommodation: result.accommodation || prev.accommodation,
        insiderTips: result.insiderTips || prev.insiderTips,
        gettingThere: result.gettingThere || prev.gettingThere,
        visaInfo: result.visaInfo || prev.visaInfo,
        curatedItinerary: result.curatedItinerary || prev.curatedItinerary,
        tags: result.tags || prev.tags,
        aiGenerated: true,
      }));
      toast.success("✨ AI guide generated! Review and save when ready.");
    } catch (e: any) {
      toast.error(e?.message || "AI generation failed. Please try again.");
    } finally {
      setGenerating(false);
      setGenProgress("");
    }
  }

  async function handleSave() {
    if (!form.destination.trim()) { toast.error("Destination name required"); return; }
    const payload = {
      destination: form.destination, country: form.country || undefined,
      region: form.region || undefined, continent: form.continent || undefined,
      tagline: form.tagline || undefined, overview: form.overview || undefined,
      bestTimeToVisit: form.bestTimeToVisit || undefined, climate: form.climate || undefined,
      currency: form.currency || undefined, language: form.language || undefined,
      timezone: form.timezone || undefined, flightTimeFromUK: form.flightTimeFromUK || undefined,
      attractions: form.attractions, dining: form.dining, accommodation: form.accommodation,
      insiderTips: form.insiderTips, gettingThere: form.gettingThere || undefined,
      visaInfo: form.visaInfo || undefined, curatedItinerary: form.curatedItinerary || undefined,
      tags: form.tags, heroImageBase64: form.heroImageBase64 || undefined,
      heroImageMimeType: form.heroImageMimeType || undefined,
      featured: form.featured, published: form.published, aiGenerated: form.aiGenerated,
    };
    try {
      if (editing) { await updateMut.mutateAsync({ id: editing.id, ...payload }); }
      else { await createMut.mutateAsync(payload); }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong — please try again");
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(p => ({ ...p, heroImageBase64: ev.target?.result as string, heroImageMimeType: file.type }));
    };
    reader.readAsDataURL(file);
  }

  function addTag(t: string) { if (!form.tags.includes(t)) setForm(p => ({ ...p, tags: [...p.tags, t] })); }
  function removeTag(t: string) { setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) })); }
  const [tagInput, setTagInput] = useState("");

  const published = (guides as any[]).filter((g: any) => g.published).length;
  const featured = (guides as any[]).filter((g: any) => g.featured).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground">🗺 Destination Guides</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Create AI-powered luxury travel guides shown on the public website</p>
          </div>
          <Button onClick={openCreate} className="rounded-xl btn-gold border-0 text-foreground font-semibold">+ New Guide</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: "Total Guides", value: (guides as any[]).length, icon: "📖" },
            { label: "Published", value: published, icon: "✅" },
            { label: "Featured", value: featured, icon: "⭐" },
          ].map(s => (
            <div key={s.label} className="bg-muted/30 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0b2240] to-[#1a3a60] p-5 text-white flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="text-3xl">✨</div>
        <div className="flex-1">
          <p className="font-semibold text-sm">AI-Powered Guide Generation</p>
          <p className="text-white/70 text-xs mt-0.5">Enter a destination, click "AI Generate" and Groq will write a complete luxury guide — overview, attractions, dining, accommodation, insider tips, a 7-day itinerary and more. Review and publish in minutes.</p>
        </div>
        <Button onClick={openCreate} variant="outline" className="rounded-xl border-white/30 text-white hover:bg-white/10 shrink-0 text-sm">Create with AI</Button>
      </div>

      {/* Guides grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : (guides as any[]).length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-4xl mb-3">🌍</p>
          <p className="font-medium text-foreground mb-1">No guides yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create your first destination guide — use AI to generate rich content in seconds.</p>
          <Button onClick={openCreate} className="rounded-xl btn-gold border-0 text-foreground">+ Create First Guide</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(guides as any[]).map((g: any) => (
            <div key={g.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="relative h-32 bg-muted overflow-hidden">
                {g.heroImageBase64 ? (
                  <img src={g.heroImageBase64} alt={g.destination} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0b2240] to-[#1a3a60] flex items-center justify-center">
                    <span className="text-3xl opacity-30">🌍</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {g.published && <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Live</span>}
                  {g.featured && <span className="bg-[#d4af37] text-[#0b2240] text-[10px] font-bold px-2 py-0.5 rounded-full">★ Featured</span>}
                  {g.aiGenerated && <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✨ AI</span>}
                </div>
                <p className="absolute bottom-2 left-3 text-white font-bold text-sm drop-shadow">{g.destination}</p>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{g.country}{g.continent ? ` · ${g.continent}` : ""}</p>
                {g.tagline && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{g.tagline}</p>}
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {(g.tags || []).slice(0, 3).map((t: string) => <span key={t} className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full">{t}</span>)}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">👁 {g.viewCount || 0} views</p>
                  <div className="flex gap-1.5">
                    <button onClick={() => window.open(`/destinations/${g.slug}`, '_blank')} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors">Preview</button>
                    <button onClick={() => openEdit(g)} className="text-xs text-[#0b2240] hover:text-[#d4af37] px-2 py-1 rounded hover:bg-muted transition-colors font-semibold">Edit</button>
                    <button onClick={() => { if (confirm(`Delete "${g.destination}"?`)) deleteMut.mutate({ id: g.id }); }} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto flex items-start justify-center p-4 pt-8" onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setEditing(null); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-[#0b2240] to-[#1a3a60] rounded-t-2xl px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">{editing ? "Edit Destination Guide" : "New Destination Guide"}</h3>
                <p className="text-white/60 text-xs mt-0.5">Fill in manually or use AI to generate full content</p>
              </div>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="text-white/60 hover:text-white text-xl leading-none">✕</button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Destination + AI button */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Destination Name *</Label>
                  <Input value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))} placeholder="e.g. Santorini" className="rounded-xl mt-1" />
                </div>
                <div className="flex-1">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Country</Label>
                  <Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="e.g. Greece" className="rounded-xl mt-1" />
                </div>
              </div>

              {/* AI Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generating || !form.destination.trim()}
                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#0b2240] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-[#0b2240]/30 border-t-[#0b2240] rounded-full animate-spin" />
                    {genProgress || "Generating…"}
                  </>
                ) : (
                  <>✨ AI Generate Full Guide</>
                )}
              </button>
              {generating && (
                <p className="text-xs text-muted-foreground text-center -mt-2">Groq is writing your luxury guide — this takes about 20 seconds…</p>
              )}

              {/* Form fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Region</Label>
                  <Input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} placeholder="e.g. Greek Islands" className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Continent</Label>
                  <select value={form.continent} onChange={e => setForm(p => ({ ...p, continent: e.target.value }))} className="w-full border border-border rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#0b2240]/30">
                    {CONTINENTS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tagline</Label>
                <Input value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))} placeholder="A short, evocative sentence about this destination" className="rounded-xl mt-1" />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overview</Label>
                <textarea value={form.overview} onChange={e => setForm(p => ({ ...p, overview: e.target.value }))} rows={3} placeholder="Describe what makes this destination extraordinary…" className="w-full border border-border rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#0b2240]/30 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Currency</Label>
                  <Input value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} placeholder="e.g. Euro (EUR)" className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Language</Label>
                  <Input value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))} placeholder="e.g. Greek" className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Flight Time from UK</Label>
                  <Input value={form.flightTimeFromUK} onChange={e => setForm(p => ({ ...p, flightTimeFromUK: e.target.value }))} placeholder="e.g. ~3.5 hours" className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timezone</Label>
                  <Input value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))} placeholder="e.g. GMT+3" className="rounded-xl mt-1" />
                </div>
              </div>

              {/* Best time to visit */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Best Time to Visit</Label>
                <textarea value={form.bestTimeToVisit} onChange={e => setForm(p => ({ ...p, bestTimeToVisit: e.target.value }))} rows={2} placeholder="When to go and what each season offers…" className="w-full border border-border rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#0b2240]/30 resize-none" />
              </div>

              {/* Tags */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {form.tags.map((t: string) => (
                    <span key={t} className="bg-[#0b2240] text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      {t} <button onClick={() => removeTag(t)} className="hover:text-red-300">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && tagInput.trim()) { addTag(tagInput.trim()); setTagInput(""); e.preventDefault(); } }} placeholder="Add tag + Enter" className="rounded-xl flex-1 text-sm" />
                  {["Beach", "Culture", "Luxury", "Foodie", "History", "Adventure", "Romance", "Family"].filter(t => !form.tags.includes(t)).slice(0, 4).map(t => (
                    <button key={t} onClick={() => addTag(t)} className="text-xs border border-border rounded-lg px-2 py-1 hover:bg-muted transition-colors shrink-0">{t}</button>
                  ))}
                </div>
              </div>

              {/* AI content preview */}
              {form.attractions.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-700 mb-2">✅ AI Content Generated</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-emerald-700">
                    <span>• {form.attractions.length} attractions</span>
                    <span>• {form.dining.length} dining picks</span>
                    <span>• {form.accommodation.length} stays</span>
                    <span>• {form.insiderTips.length} insider tips</span>
                    {form.curatedItinerary?.days && <span>• {form.curatedItinerary.days.length}-day itinerary</span>}
                    {form.gettingThere && <span>• Getting there section</span>}
                    {form.visaInfo && <span>• Visa information</span>}
                  </div>
                </div>
              )}

              {/* Hero image */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hero Image</Label>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-5 cursor-pointer hover:border-[#0b2240]/40 hover:bg-muted/30 transition-colors mt-1">
                  {form.heroImageBase64 ? (
                    <>
                      <img src={form.heroImageBase64} alt="Preview" className="h-28 w-full object-cover rounded-lg" />
                      <p className="text-xs text-muted-foreground">Click to change image</p>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl">📷</span>
                      <p className="text-sm text-muted-foreground">Upload a hero image</p>
                      <p className="text-xs text-muted-foreground">JPEG, PNG, WebP up to 5MB</p>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} className="rounded" />
                  <span className="text-sm font-medium">Published (visible on site)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="rounded" />
                  <span className="text-sm font-medium">★ Featured</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex gap-3">
              <Button
                onClick={handleSave}
                disabled={createMut.isPending || updateMut.isPending}
                className="flex-1 rounded-xl btn-gold border-0 text-foreground font-semibold"
              >
                {createMut.isPending || updateMut.isPending ? "Saving…" : editing ? "Save Changes" : "Create Guide"}
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setShowModal(false); setEditing(null); }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
