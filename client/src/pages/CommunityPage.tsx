import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Heart, Handshake, Gift, Users, MapPin, Calendar, X, ArrowRight, Sparkles } from "lucide-react";
import { useSEO } from '@/hooks/useSEO';

type PostType = "charity" | "partnership" | "giveaway" | "community";

const TYPE_CONFIG: Record<PostType, { label: string; icon: typeof Heart; color: string; bg: string; accent: string; border: string; gradient: string }> = {
  charity:     { label: "Charity",           icon: Heart,     color: "text-rose-600",    bg: "bg-rose-50",    accent: "#e11d48", border: "border-rose-200",  gradient: "from-rose-500 to-pink-600" },
  partnership: { label: "Local Partnership", icon: Handshake, color: "text-blue-700",    bg: "bg-blue-50",    accent: "#1d4ed8", border: "border-blue-200",  gradient: "from-blue-500 to-indigo-600" },
  giveaway:    { label: "Giveaway",          icon: Gift,      color: "text-amber-600",   bg: "bg-amber-50",   accent: "#d97706", border: "border-amber-200", gradient: "from-amber-500 to-orange-500" },
  community:   { label: "Community",         icon: Users,     color: "text-emerald-700", bg: "bg-emerald-50", accent: "#059669", border: "border-emerald-200", gradient: "from-emerald-500 to-teal-600" },
};

function parseAmount(str: string | null | undefined): number {
  if (!str) return 0;
  const n = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatTotal(n: number): string {
  if (n >= 1000000) return `£${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `£${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `£${n.toLocaleString("en-GB")}`;
}

function normaliseAmount(str: string | null | undefined): string | null {
  if (!str) return null;
  const trimmed = str.trim();
  if (!trimmed) return null;
  if (/^[£$€]/.test(trimmed)) return trimmed;
  const n = parseFloat(trimmed.replace(/[^0-9.]/g, ""));
  if (!isNaN(n)) return `£${trimmed.replace(/[^0-9.,]/g, "")}`;
  return trimmed;
}

type FilterType = "all" | PostType;

export default function CommunityPage() {
  useSEO({
    title: 'Community & Impact',
    description: "See how CB Travel gives back — our charity partnerships, community events, and the total we've given back to causes we care about.",
  });
  const { data: posts = [], isLoading } = trpc.community.getPublished.useQuery();
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Community & Impact | CB Travel";
  }, []);

  useEffect(() => {
    if (selectedPost) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedPost]);

  const totalGiven = posts.reduce((sum: number, p: any) => sum + parseAmount(p.amountRaised), 0);
  const totalInitiatives = posts.length;
  const charityCount = posts.filter((p: any) => p.type === "charity").length;
  const partnerCount = posts.filter((p: any) => p.type === "partnership").length;

  const featured = posts.filter((p: any) => p.isFeatured);
  const filtered = filter === "all"
    ? posts.filter((p: any) => !p.isFeatured)
    : posts.filter((p: any) => !p.isFeatured && p.type === filter);

  const filterTypes: { key: FilterType; label: string }[] = [
    { key: "all", label: "All Stories" },
    { key: "charity", label: "Charity" },
    { key: "partnership", label: "Partnerships" },
    { key: "giveaway", label: "Giveaways" },
    { key: "community", label: "Community" },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8]">

      {/* ── Hero ── */}
      <section className="relative bg-[#0d2137] text-white overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 60%, rgba(212,175,55,0.12) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(212,175,55,0.08) 0%, transparent 45%),
                            radial-gradient(circle at 50% 100%, rgba(30,58,95,0.8) 0%, transparent 60%)`,
        }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />

        <div className="relative max-w-5xl mx-auto px-4 pt-28 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-[#d4af37]/15 border border-[#d4af37]/30 rounded-full px-4 py-1.5 mb-6">
            <Sparkles size={12} className="text-[#d4af37]" />
            <span className="text-[#d4af37] text-xs font-bold tracking-[3px] uppercase">Community & Impact</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl font-light leading-tight mb-5">
            Travelling with<br />
            <span className="font-semibold" style={{
              background: "linear-gradient(135deg, #d4af37 0%, #f5d97a 50%, #d4af37 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>Purpose & Heart</span>
          </h1>

          <p className="text-blue-200/80 text-lg leading-relaxed max-w-2xl mx-auto mb-12">
            At CB Travel, we believe the best journeys give back. We're proud to support the communities,
            charities, and people who make our world worth exploring.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-px bg-[#d4af37]/20 border border-[#d4af37]/25 rounded-2xl overflow-hidden max-w-2xl mx-auto">
            {[
              { label: "Given Back", value: totalGiven > 0 ? formatTotal(totalGiven) : "—", highlight: true },
              { label: "Initiatives", value: totalInitiatives > 0 ? `${totalInitiatives}+` : "—", highlight: false },
              { label: "Charities", value: charityCount > 0 ? `${charityCount}` : "—", highlight: false },
              { label: "Partners", value: partnerCount > 0 ? `${partnerCount}` : "—", highlight: false },
            ].map((stat, i) => (
              <div key={i} className="flex-1 min-w-[100px] bg-[#0d2137] px-5 py-5 text-center">
                <p className={`font-serif text-2xl font-bold mb-0.5 ${stat.highlight ? "text-[#d4af37]" : "text-white"}`}>
                  {stat.value}
                </p>
                <p className="text-[10px] tracking-[2px] uppercase text-blue-300/60 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gold rule */}
      <div className="h-[3px]" style={{ background: "linear-gradient(90deg, transparent, #d4af37 30%, #f5d97a 50%, #d4af37 70%, transparent)" }} />

      {/* ── Featured ── */}
      {!isLoading && featured.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pt-20 pb-12">
          <div className="flex items-center gap-4 mb-10">
            <div>
              <p className="text-[10px] tracking-[3px] uppercase text-[#d4af37] font-bold mb-1">Featured Stories</p>
              <h2 className="font-serif text-3xl font-light text-[#0d2137]">Making a Difference</h2>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-[#d4af37]/40 to-transparent ml-4" />
          </div>

          <div className="space-y-12">
            {featured.map((post: any, i: number) => {
              const cfg = TYPE_CONFIG[post.type as PostType] || TYPE_CONFIG.community;
              const Icon = cfg.icon;
              const isEven = i % 2 === 0;
              const amount = normaliseAmount(post.amountRaised);
              return (
                <div
                  key={post.id}
                  className={`group flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-0 rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-200/80 bg-white`}
                  onClick={() => setSelectedPost(post)}
                >
                  {/* Image */}
                  <div className="md:w-[45%] relative overflow-hidden min-h-[260px]">
                    {post.imageUrl ? (
                      <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 absolute inset-0" />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} opacity-80 flex items-center justify-center`}>
                        <Icon size={72} className="text-white/60" strokeWidth={0.8} />
                      </div>
                    )}
                    {/* Overlay gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/30 to-transparent`} />
                    {/* Type badge on image */}
                    <div className="absolute top-4 left-4">
                      <div className={`inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm shadow-sm px-3 py-1.5 rounded-full`}>
                        <Icon size={11} className={cfg.color} />
                        <span className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                    </div>
                    {/* Amount badge on image */}
                    {amount && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="inline-flex items-center gap-2 bg-[#d4af37] px-3 py-2 rounded-xl shadow-lg">
                          <span className="text-[#0d2137] text-xs font-black tracking-wide">GIVEN BACK</span>
                          <span className="text-[#0d2137] font-serif text-base font-bold">{amount}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="md:w-[55%] p-8 sm:p-10 flex flex-col justify-center">
                    <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0d2137] mb-3 leading-snug group-hover:text-[#1e4d7a] transition-colors">
                      {post.title}
                    </h3>
                    {post.subtitle && (
                      <p className="text-[#d4af37] font-medium text-sm mb-4 italic">"{post.subtitle}"</p>
                    )}
                    {post.description && (
                      <p className="text-slate-600 leading-relaxed mb-4 text-[15px]">{post.description}</p>
                    )}
                    {post.content && (
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-5">{post.content}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-auto">
                      {post.location && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                          <MapPin size={10} /> {post.location}
                        </span>
                      )}
                      {post.eventDate && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                          <Calendar size={10} /> {post.eventDate}
                        </span>
                      )}
                      {post.charityName && (
                        <span className="flex items-center gap-1 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                          <Heart size={10} /> {post.charityName}
                        </span>
                      )}
                      {post.partnerName && (
                        <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                          <Handshake size={10} /> {post.partnerName}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-[#d4af37] group-hover:gap-2.5 transition-all">
                      Read the full story <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Filter + Grid ── */}
      {!isLoading && posts.filter((p: any) => !p.isFeatured).length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-20">
          {featured.length > 0 && (
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-14" />
          )}

          {/* Section heading + filters */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
            <div>
              <p className="text-[10px] tracking-[3px] uppercase text-[#d4af37] font-bold mb-1">
                {featured.length > 0 ? "More From the Community" : "Our Stories"}
              </p>
              <h2 className="font-serif text-3xl font-light text-[#0d2137]">
                {featured.length > 0 ? "Every story matters" : "Making a Difference"}
              </h2>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
              {filterTypes.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
                    filter === key
                      ? "bg-[#0d2137] text-white border-[#0d2137]"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post: any) => {
                const cfg = TYPE_CONFIG[post.type as PostType] || TYPE_CONFIG.community;
                const Icon = cfg.icon;
                const amount = normaliseAmount(post.amountRaised);
                return (
                  <button
                    key={post.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group text-left w-full"
                    onClick={() => setSelectedPost(post)}
                  >
                    {/* Image / placeholder */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {post.imageUrl ? (
                        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
                          <Icon size={40} className="text-white/50" strokeWidth={1} />
                        </div>
                      )}
                      {/* Dim overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      {/* Type chip */}
                      <div className="absolute top-3 left-3">
                        <div className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
                          <Icon size={9} className={cfg.color} />
                          <span className={`text-[9px] font-bold ${cfg.color}`}>{cfg.label}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-serif text-[15px] font-semibold text-[#0d2137] leading-snug mb-2 line-clamp-2 group-hover:text-[#1e4d7a] transition-colors">
                        {post.title}
                      </h3>
                      {post.description && (
                        <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 mb-3">{post.description}</p>
                      )}

                      {/* Amount badge */}
                      {amount && (
                        <div className="inline-flex items-center gap-1.5 bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#8a6e1a] text-[11px] font-bold px-3 py-1.5 rounded-full mb-3">
                          ✦ Given Back: £{amount}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                        {post.location && <span className="flex items-center gap-1"><MapPin size={9} /> {post.location}</span>}
                        {post.eventDate && <span className="flex items-center gap-1"><Calendar size={9} /> {post.eventDate}</span>}
                      </div>
                    </div>

                    {/* Read more strip */}
                    <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#d4af37]">Read more</span>
                      <ArrowRight size={12} className="text-[#d4af37] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <p className="font-serif text-lg">No {filter === "all" ? "" : filter} stories yet.</p>
            </div>
          )}
        </section>
      )}

      {/* Loading shimmer */}
      {isLoading && (
        <div className="max-w-5xl mx-auto px-4 py-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-2xl h-72 animate-pulse bg-slate-100 border border-slate-200" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && posts.length === 0 && (
        <div className="text-center py-32 px-4">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Heart size={28} className="text-rose-400" strokeWidth={1.5} />
          </div>
          <p className="font-serif text-2xl text-slate-400 mb-2">Our community stories are coming soon.</p>
          <p className="text-sm text-slate-400">Check back to see how we're making a difference.</p>
        </div>
      )}

      {/* ── CTA Band ── */}
      <section className="relative bg-[#0d2137] py-20 px-4 text-center text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `radial-gradient(circle at 30% 50%, #d4af37 0%, transparent 60%), radial-gradient(circle at 70% 50%, #d4af37 0%, transparent 60%)`,
        }} />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-[10px] tracking-[4px] uppercase text-[#d4af37] font-bold mb-3">Travel With Purpose</p>
          <h2 className="font-serif text-4xl font-light mb-4 leading-tight">Every trip makes<br />a difference</h2>
          <p className="text-blue-200/70 max-w-lg mx-auto text-[15px] leading-relaxed mb-8">
            When you book with CB Travel, you're supporting local communities, independent businesses,
            and the causes close to our hearts.
          </p>
          <a
            href="/quote-request"
            className="inline-flex items-center gap-2 bg-[#d4af37] text-[#0d2137] font-bold px-8 py-3.5 rounded-xl hover:bg-[#c9a227] transition-all text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Plan Your Next Journey <ArrowRight size={15} />
          </a>
        </div>
      </section>

      {/* ── Post Detail Modal ── */}
      {selectedPost && (() => {
        const post = selectedPost;
        const cfg = TYPE_CONFIG[post.type as PostType] || TYPE_CONFIG.community;
        const Icon = cfg.icon;
        const amount = normaliseAmount(post.amountRaised);
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedPost(null)} />
            <div
              className="relative bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[95vh] overflow-y-auto z-10 shadow-2xl"
              style={{ animation: "slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 z-20 w-9 h-9 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>

              {/* Image */}
              {post.imageUrl ? (
                <div className="rounded-t-3xl sm:rounded-t-3xl overflow-hidden" style={{ aspectRatio: "16/8" }}>
                  <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={`rounded-t-3xl sm:rounded-t-3xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`} style={{ aspectRatio: "16/8" }}>
                  <Icon size={72} className="text-white/50" strokeWidth={0.8} />
                </div>
              )}

              <div className="p-6 sm:p-8">
                {/* Type badge */}
                <div className={`inline-flex items-center gap-1.5 ${cfg.bg} ${cfg.border} border px-3 py-1.5 rounded-full mb-4`}>
                  <Icon size={12} className={cfg.color} />
                  <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0d2137] mb-3 leading-snug">
                  {post.title}
                </h2>

                {post.subtitle && (
                  <p className="text-[#d4af37] font-medium text-sm mb-4 italic">"{post.subtitle}"</p>
                )}

                {/* Amount — prominent */}
                {amount && (
                  <div className="flex items-center gap-4 bg-gradient-to-r from-[#d4af37]/10 to-[#d4af37]/5 border border-[#d4af37]/30 rounded-2xl px-5 py-4 mb-5">
                    <div className="w-10 h-10 bg-[#d4af37] rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-[#0d2137] font-black text-base">£</span>
                    </div>
                    <div>
                      <p className="text-[9px] tracking-[2px] uppercase text-[#8a6e1a] font-bold">Amount Given Back</p>
                      <p className="font-serif text-2xl font-bold text-[#8a6e1a] leading-tight">{amount}</p>
                    </div>
                  </div>
                )}

                {post.description && (
                  <p className="text-slate-700 leading-relaxed mb-4 text-[15px]">{post.description}</p>
                )}
                {post.content && (
                  <p className="text-slate-500 leading-relaxed text-sm mb-5 whitespace-pre-line">{post.content}</p>
                )}

                {/* Meta chips */}
                <div className="flex flex-wrap gap-2 text-sm text-slate-500 border-t border-slate-100 pt-5">
                  {post.location && (
                    <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs">
                      <MapPin size={11} /> {post.location}
                    </span>
                  )}
                  {post.eventDate && (
                    <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs">
                      <Calendar size={11} /> {post.eventDate}
                    </span>
                  )}
                  {post.charityName && (
                    <span className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-full text-xs">
                      <Heart size={11} /> {post.charityName}
                    </span>
                  )}
                  {post.partnerName && (
                    <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-xs">
                      <Handshake size={11} /> {post.partnerName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}
