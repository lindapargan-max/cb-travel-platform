import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Helmet } from "react-helmet";

const CONTINENTS = ["All", "Europe", "Asia", "Africa", "Americas", "Middle East", "Oceania"];

const TAG_COLOURS: Record<string, string> = {
  Beach: "bg-sky-50 text-sky-700 border-sky-100",
  Culture: "bg-amber-50 text-amber-700 border-amber-100",
  Luxury: "bg-yellow-50 text-yellow-700 border-yellow-100",
  Foodie: "bg-orange-50 text-orange-700 border-orange-100",
  History: "bg-stone-50 text-stone-700 border-stone-100",
  Adventure: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Nature: "bg-green-50 text-green-700 border-green-100",
  Romance: "bg-rose-50 text-rose-700 border-rose-100",
  Family: "bg-purple-50 text-purple-700 border-purple-100",
  Winter: "bg-blue-50 text-blue-700 border-blue-100",
};

export default function DestinationsPage() {
  const { data: guides = [], isLoading } = trpc.guides.getAll.useQuery();
  const [search, setSearch] = useState("");
  const [continent, setContinent] = useState("All");
  const [tag, setTag] = useState("");

  const allTags = useMemo(() => {
    const set = new Set<string>();
    (guides as any[]).forEach((g: any) => (g.tags || []).forEach((t: string) => set.add(t)));
    return Array.from(set).sort();
  }, [guides]);

  const filtered = useMemo(() => {
    return (guides as any[]).filter((g: any) => {
      if (search && !g.destination.toLowerCase().includes(search.toLowerCase()) && !(g.country || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (continent !== "All" && g.continent !== continent) return false;
      if (tag && !(g.tags || []).includes(tag)) return false;
      return true;
    });
  }, [guides, search, continent, tag]);

  const featured = filtered.filter((g: any) => g.featured);
  const regular = filtered.filter((g: any) => !g.featured);

  return (
    <>
      <Helmet>
        <title>Destination Guides — CB Travel | Luxury Travel Inspiration</title>
        <meta name="description" content="Explore our curated luxury destination guides. From European escapes to far-flung adventures, discover the world through the eyes of CB Travel." />
        <meta property="og:title" content="Destination Guides — CB Travel" />
        <meta property="og:description" content="Curated luxury travel guides by CB Travel." />
      </Helmet>

      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden bg-[#0b2240]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b2240] via-[#0b2240]/90 to-[#0b2240]/80" />
        {/* Decorative stars */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white/20 animate-pulse" style={{ width: Math.random() * 2 + 1 + "px", height: Math.random() * 2 + 1 + "px", top: Math.random() * 100 + "%", left: Math.random() * 100 + "%", animationDelay: Math.random() * 3 + "s" }} />
          ))}
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <p className="text-xs tracking-[4px] uppercase font-semibold text-[#d4af37] mb-4 animate-fade-in">CB Travel Guides</p>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Explore the World
          </h1>
          <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-8">
            Curated destination guides crafted by our luxury travel experts. Discover hidden gems, insider tips, and handpicked experiences — then let us build your perfect trip.
          </p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search destinations…"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:bg-white/15 transition-all text-sm backdrop-blur-sm"
            />
          </div>
        </div>
        {/* Gold divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
      </section>

      {/* Filters */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Continent filter */}
          <div className="flex gap-2 flex-wrap">
            {CONTINENTS.map(c => (
              <button key={c} onClick={() => setContinent(c)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${continent === c ? "bg-[#0b2240] text-white border-[#0b2240]" : "bg-white text-muted-foreground border-border hover:border-[#0b2240]/40 hover:text-[#0b2240]"}`}>
                {c}
              </button>
            ))}
          </div>
          {/* Tag filter */}
          {allTags.length > 0 && (
            <select value={tag} onChange={e => setTag(e.target.value)} className="text-xs border border-border rounded-lg px-3 py-1.5 bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-[#0b2240]/30">
              <option value="">All styles</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border shadow-sm animate-pulse">
                <div className="h-56 bg-muted" />
                <div className="p-5 space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <p className="text-5xl mb-4">🌍</p>
            <p className="text-lg font-medium text-foreground mb-1">No guides found</p>
            <p className="text-sm">Try a different search or filter — more destinations coming soon.</p>
            <button onClick={() => { setSearch(""); setContinent("All"); setTag(""); }} className="mt-4 text-sm text-[#0b2240] underline underline-offset-2">Clear filters</button>
          </div>
        ) : (
          <>
            {/* Featured guides */}
            {featured.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[#d4af37] text-sm">★</span>
                  <h2 className="font-serif text-xl font-semibold text-foreground">Featured Destinations</h2>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {featured.map((guide: any) => (
                    <FeaturedGuideCard key={guide.id} guide={guide} />
                  ))}
                </div>
              </div>
            )}

            {/* All guides */}
            {regular.length > 0 && (
              <div>
                {featured.length > 0 && (
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="font-serif text-xl font-semibold text-foreground">All Destinations</h2>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">{regular.length} guide{regular.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regular.map((guide: any) => (
                    <GuideCard key={guide.id} guide={guide} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* CTA strip */}
        {!isLoading && (
          <div className="mt-16 rounded-3xl bg-gradient-to-r from-[#0b2240] to-[#1a3a60] px-8 py-10 text-center text-white">
            <p className="text-xs tracking-[3px] uppercase text-[#d4af37] font-semibold mb-3">Ready to Travel?</p>
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">Don't see your dream destination?</h2>
            <p className="text-white/70 text-sm md:text-base mb-6 max-w-xl mx-auto">Our concierge team specialises in crafting bespoke itineraries to any corner of the globe. Get in touch and let's create something extraordinary.</p>
            <Link href="/quote-request">
              <span className="inline-block px-8 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#0b2240] hover:opacity-90 transition-opacity cursor-pointer">
                Plan My Trip →
              </span>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function FeaturedGuideCard({ guide }: { guide: any }) {
  const imgSrc = guide.heroImageBase64 || null;
  return (
    <Link href={`/destinations/${guide.slug}`}>
      <div className="group relative rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-72">
        {imgSrc ? (
          <img src={imgSrc} alt={guide.destination} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0b2240] to-[#1a3a60]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-4 left-4">
          <span className="bg-[#d4af37] text-[#0b2240] text-xs font-bold px-2.5 py-1 rounded-full">★ Featured</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex gap-1.5 flex-wrap mb-2">
            {(guide.tags || []).slice(0, 3).map((t: string) => (
              <span key={t} className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full border border-white/20">{t}</span>
            ))}
          </div>
          <h3 className="font-serif text-2xl font-bold text-white mb-0.5">{guide.destination}</h3>
          {guide.country && <p className="text-white/70 text-sm mb-2">{guide.country}</p>}
          {guide.tagline && <p className="text-white/80 text-sm leading-snug line-clamp-2">{guide.tagline}</p>}
          <p className="text-[#d4af37] text-xs font-semibold mt-3 group-hover:translate-x-1 transition-transform">Read Guide →</p>
        </div>
      </div>
    </Link>
  );
}

function GuideCard({ guide }: { guide: any }) {
  const imgSrc = guide.heroImageBase64 || null;
  return (
    <Link href={`/destinations/${guide.slug}`}>
      <div className="group rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white">
        <div className="relative h-48 overflow-hidden bg-muted">
          {imgSrc ? (
            <img src={imgSrc} alt={guide.destination} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0b2240] to-[#1a3a60] flex items-center justify-center">
              <span className="text-5xl opacity-30">🌍</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {guide.flightTimeFromUK && (
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              ✈ {guide.flightTimeFromUK}
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex gap-1.5 flex-wrap mb-2.5">
            {(guide.tags || []).slice(0, 3).map((t: string) => (
              <span key={t} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TAG_COLOURS[t] || "bg-gray-50 text-gray-600 border-gray-100"}`}>{t}</span>
            ))}
          </div>
          <h3 className="font-serif text-lg font-bold text-foreground mb-0.5">{guide.destination}</h3>
          {guide.country && <p className="text-xs text-muted-foreground mb-2">{guide.country}{guide.continent ? ` · ${guide.continent}` : ""}</p>}
          {guide.tagline && <p className="text-sm text-muted-foreground leading-snug line-clamp-2">{guide.tagline}</p>}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">{guide.viewCount || 0} view{guide.viewCount !== 1 ? "s" : ""}</span>
            <span className="text-xs font-semibold text-[#0b2240] group-hover:text-[#d4af37] transition-colors">Explore Guide →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
