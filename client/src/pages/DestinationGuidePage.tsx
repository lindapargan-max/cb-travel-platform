import { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSEO } from "@/hooks/useSEO";

function GuidePageSEO({ guide }: { guide: any }) {
  useSEO({
    title: `${guide.destination} Travel Guide — CB Travel`,
    description: guide.tagline || `Luxury travel guide to ${guide.destination} by CB Travel.`,
    ogImage: guide.heroImageBase64 || undefined,
  });
  return null;
}

const ATTR_TYPE_ICON: Record<string, string> = {
  Landmark: "🏛", Nature: "🌿", Culture: "🎭", Experience: "✨",
  Beach: "🏖", Food: "🍽", Museum: "🏛", Default: "📍",
};

const PRICE_COLOUR: Record<string, string> = {
  "£": "text-emerald-600",
  "££": "text-amber-600",
  "£££": "text-orange-600",
  "££££": "text-red-600",
};

export default function DestinationGuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: guide, isLoading } = trpc.guides.getBySlug.useQuery({ slug: slug || "" }, { enabled: !!slug });
  const [activeSection, setActiveSection] = useState("overview");
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  if (isLoading) return <GuidePageSkeleton />;
  if (!guide) return <GuideNotFound />;

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "attractions", label: "Attractions", hide: !guide.attractions?.length },
    { id: "dining", label: "Dining", hide: !guide.dining?.length },
    { id: "stays", label: "Where to Stay", hide: !guide.accommodation?.length },
    { id: "tips", label: "Insider Tips", hide: !guide.insiderTips?.length },
    { id: "itinerary", label: "CB Travel Itinerary", hide: !guide.curatedItinerary },
    { id: "practical", label: "Practical Info" },
  ].filter(s => !s.hide);

  return (
    <>
      <GuidePageSEO guide={guide} />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-end overflow-hidden">
        {guide.heroImageBase64 ? (
          <img src={guide.heroImageBase64} alt={guide.destination} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0b2240] to-[#1a3a60]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute top-6 left-6 flex items-center gap-2 text-white/70 text-sm">
          <Link href="/destinations"><span className="hover:text-white transition-colors cursor-pointer">Destinations</span></Link>
          <span>/</span>
          <span className="text-white">{guide.destination}</span>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-12">
          <div className="flex flex-wrap gap-2 mb-4">
            {(guide.tags || []).map((t: string) => (
              <span key={t} className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20">{t}</span>
            ))}
            {guide.aiGenerated && (
              <span className="bg-purple-500/80 text-white text-xs px-3 py-1 rounded-full">✨ AI-Curated Guide</span>
            )}
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-2">{guide.destination}</h1>
          {guide.country && <p className="text-white/70 text-lg mb-3">{guide.country}{guide.continent ? ` · ${guide.continent}` : ""}</p>}
          {guide.tagline && <p className="text-white/90 text-lg md:text-xl max-w-2xl leading-relaxed italic">"{guide.tagline}"</p>}

          {/* Quick facts row */}
          <div className="flex flex-wrap gap-4 mt-6">
            {guide.flightTimeFromUK && <QuickFact icon="✈" label="From London" value={guide.flightTimeFromUK} />}
            {guide.currency && <QuickFact icon="💷" label="Currency" value={guide.currency} />}
            {guide.language && <QuickFact icon="🗣" label="Language" value={guide.language} />}
            {guide.timezone && <QuickFact icon="🕐" label="Timezone" value={guide.timezone} />}
          </div>
        </div>
      </section>

      {/* Sticky nav */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => { setActiveSection(s.id); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeSection === s.id ? "border-[#d4af37] text-[#0b2240] font-semibold" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-14">

            {/* Overview */}
            <section id="overview">
              <SectionHeader icon="🌍" title="Overview" />
              {guide.overview && <p className="text-muted-foreground leading-relaxed text-[15px]">{guide.overview}</p>}
              {guide.bestTimeToVisit && (
                <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-5">
                  <p className="font-semibold text-amber-900 mb-1.5">🗓 Best Time to Visit</p>
                  <p className="text-amber-800 text-sm leading-relaxed">{guide.bestTimeToVisit}</p>
                </div>
              )}
              {guide.climate && (
                <div className="mt-4 bg-sky-50 border border-sky-100 rounded-2xl p-5">
                  <p className="font-semibold text-sky-900 mb-1.5">🌤 Climate</p>
                  <p className="text-sky-800 text-sm">{guide.climate}</p>
                </div>
              )}
            </section>

            {/* Attractions */}
            {guide.attractions?.length > 0 && (
              <section id="attractions">
                <SectionHeader icon="🏛" title="Must-See Attractions" />
                <div className="space-y-4">
                  {guide.attractions.map((a: any, i: number) => (
                    <div key={i} className="bg-white border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#0b2240]/10 flex items-center justify-center text-xl shrink-0">
                          {ATTR_TYPE_ICON[a.type] || ATTR_TYPE_ICON.Default}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{a.name}</h3>
                            {a.type && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{a.type}</span>}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{a.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Dining */}
            {guide.dining?.length > 0 && (
              <section id="dining">
                <SectionHeader icon="🍽" title="Where to Dine" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {guide.dining.map((d: any, i: number) => (
                    <div key={i} className="bg-white border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-foreground text-sm">{d.name}</h3>
                        <span className={`text-xs font-bold ${PRICE_COLOUR[d.priceRange] || "text-muted-foreground"}`}>{d.priceRange}</span>
                      </div>
                      {d.cuisine && <p className="text-xs text-[#d4af37] font-medium mb-2">{d.cuisine}</p>}
                      <p className="text-xs text-muted-foreground leading-relaxed">{d.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Accommodation */}
            {guide.accommodation?.length > 0 && (
              <section id="stays">
                <SectionHeader icon="🏨" title="Where to Stay" />
                <div className="space-y-4">
                  {guide.accommodation.map((a: any, i: number) => (
                    <div key={i} className="bg-white border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-xl shrink-0">🛎</div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{a.name}</h3>
                            <span className="text-xs bg-[#d4af37]/10 text-[#b8962e] px-2 py-0.5 rounded-full font-medium">{a.tier}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-2">{a.description}</p>
                          {a.priceRange && <p className="text-xs text-[#0b2240] font-semibold">From {a.priceRange} per night</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Insider Tips */}
            {guide.insiderTips?.length > 0 && (
              <section id="tips">
                <SectionHeader icon="💡" title="Insider Tips" />
                <div className="bg-gradient-to-br from-[#0b2240] to-[#1a3a60] rounded-2xl p-6">
                  <div className="space-y-3">
                    {guide.insiderTips.map((tip: string, i: number) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="w-6 h-6 rounded-full bg-[#d4af37] text-[#0b2240] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <p className="text-white/85 text-sm leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* CB Travel Curated Itinerary */}
            {guide.curatedItinerary && (
              <section id="itinerary">
                <SectionHeader icon="✈" title="A CB Travel Curated Journey" />
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground font-medium px-3 py-1.5 bg-muted rounded-full">
                    {guide.curatedItinerary.duration || guide.curatedItinerary.days?.length || 7} Days · Personally Curated
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {guide.curatedItinerary.title && (
                  <p className="text-center font-serif text-lg font-semibold text-foreground mb-6">
                    {guide.curatedItinerary.title}
                  </p>
                )}
                <div className="space-y-3">
                  {(guide.curatedItinerary.days || []).map((day: any) => (
                    <div key={day.day} className="border border-border rounded-2xl overflow-hidden">
                      <button
                        className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
                        onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#b8962e] flex items-center justify-center text-[#0b2240] font-bold text-sm shrink-0">
                          {day.day}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-sm">Day {day.day}: {day.title}</p>
                        </div>
                        <span className={`text-muted-foreground transition-transform duration-200 ${expandedDay === day.day ? "rotate-180" : ""}`}>▾</span>
                      </button>
                      {expandedDay === day.day && (
                        <div className="px-4 pb-5 pt-1 bg-muted/10">
                          <div className="space-y-3 pl-14">
                            {day.morning && <DayPart icon="🌅" label="Morning" text={day.morning} />}
                            {day.afternoon && <DayPart icon="☀" label="Afternoon" text={day.afternoon} />}
                            {day.evening && <DayPart icon="🌙" label="Evening" text={day.evening} />}
                            {day.tip && (
                              <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-2">
                                <span className="text-amber-600 text-xs font-bold shrink-0 mt-0.5">💡 TIP</span>
                                <p className="text-amber-800 text-xs leading-relaxed">{day.tip}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Practical info */}
            <section id="practical">
              <SectionHeader icon="📋" title="Practical Information" />
              <div className="space-y-4">
                {guide.gettingThere && (
                  <div className="bg-white border border-border rounded-2xl p-5">
                    <p className="font-semibold text-foreground mb-2">✈ Getting There</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{guide.gettingThere}</p>
                  </div>
                )}
                {guide.visaInfo && (
                  <div className="bg-white border border-border rounded-2xl p-5">
                    <p className="font-semibold text-foreground mb-2">🛂 Visa & Entry Requirements</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{guide.visaInfo}</p>
                    <p className="text-xs text-amber-600 mt-3 border-t border-border pt-3">⚠ Visa and entry requirements can change without notice. Always check current requirements with the official embassy or gov.uk before travel.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20 space-y-5">
              {/* Plan CTA */}
              <div className="bg-gradient-to-br from-[#0b2240] to-[#1a3a60] rounded-2xl p-6 text-white">
                <p className="font-serif text-xl font-bold mb-1">Plan This Trip</p>
                <p className="text-white/70 text-xs leading-relaxed mb-4">Let our concierge team craft your perfect {guide.destination} experience — tailored to you.</p>
                <Link href="/quote-request">
                  <span className="block w-full text-center py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#0b2240] hover:opacity-90 transition-opacity cursor-pointer">
                    Get a Personalised Quote →
                  </span>
                </Link>
                <p className="text-white/40 text-[10px] text-center mt-3">No obligation · Reply within 24 hours</p>
              </div>

              {/* Quick facts */}
              <div className="bg-white border border-border rounded-2xl p-5">
                <p className="font-semibold text-foreground mb-4 text-sm">Quick Facts</p>
                <div className="space-y-3">
                  {guide.country && <Fact icon="🌍" label="Country" value={guide.country} />}
                  {guide.region && <Fact icon="📍" label="Region" value={guide.region} />}
                  {guide.currency && <Fact icon="💷" label="Currency" value={guide.currency} />}
                  {guide.language && <Fact icon="🗣" label="Language" value={guide.language} />}
                  {guide.timezone && <Fact icon="🕐" label="Timezone" value={guide.timezone} />}
                  {guide.flightTimeFromUK && <Fact icon="✈" label="Flight from UK" value={guide.flightTimeFromUK} />}
                </div>
              </div>

              {/* Tags */}
              {guide.tags?.length > 0 && (
                <div className="bg-white border border-border rounded-2xl p-5">
                  <p className="font-semibold text-foreground mb-3 text-sm">Trip Style</p>
                  <div className="flex flex-wrap gap-2">
                    {guide.tags.map((t: string) => (
                      <Link key={t} href={`/destinations`}>
                        <span className="bg-muted hover:bg-muted/80 text-foreground text-xs px-3 py-1.5 rounded-full cursor-pointer transition-colors">{t}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Back to all */}
              <Link href="/destinations">
                <span className="block text-center text-sm text-muted-foreground hover:text-foreground py-2 cursor-pointer transition-colors">
                  ← All Destinations
                </span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function QuickFact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/15">
      <p className="text-white/50 text-[10px] uppercase tracking-wide">{label}</p>
      <p className="text-white font-semibold text-sm">{icon} {value}</p>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function DayPart({ icon, label, text }: { icon: string; label: string; text: string }) {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-sm shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-2xl">{icon}</span>
      <h2 className="font-serif text-xl font-bold text-foreground">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
    </div>
  );
}

function GuidePageSkeleton() {
  return (
    <div>
      <div className="h-[70vh] bg-muted animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`h-${i === 0 ? 48 : 32} bg-muted rounded-2xl animate-pulse`} />)}
          </div>
          <div className="space-y-4">
            <div className="h-48 bg-muted rounded-2xl animate-pulse" />
            <div className="h-32 bg-muted rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function GuideNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b2240] text-white text-center px-4">
      <div>
        <p className="text-6xl mb-6">🗺</p>
        <h1 className="font-serif text-3xl font-bold mb-3">Guide Not Found</h1>
        <p className="text-white/70 mb-6">This destination guide doesn't exist or hasn't been published yet.</p>
        <Link href="/destinations">
          <span className="inline-block px-6 py-3 rounded-xl bg-[#d4af37] text-[#0b2240] font-semibold cursor-pointer hover:opacity-90 transition-opacity">
            Browse All Destinations
          </span>
        </Link>
      </div>
    </div>
  );
}
