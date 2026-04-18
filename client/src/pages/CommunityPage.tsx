import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Heart, Handshake, Gift, Users, MapPin, Calendar, X, ExternalLink } from "lucide-react";

type PostType = "charity" | "partnership" | "giveaway" | "community";

const TYPE_CONFIG: Record<PostType, { label: string; icon: typeof Heart; color: string; bg: string; accent: string; border: string }> = {
  charity:     { label: "Charity",           icon: Heart,     color: "text-rose-600",   bg: "bg-rose-50",   accent: "#e11d48", border: "border-rose-200" },
  partnership: { label: "Local Partnership", icon: Handshake, color: "text-blue-700",   bg: "bg-blue-50",   accent: "#1d4ed8", border: "border-blue-200" },
  giveaway:    { label: "Giveaway",          icon: Gift,      color: "text-amber-600",  bg: "bg-amber-50",  accent: "#d97706", border: "border-amber-200" },
  community:   { label: "Community",         icon: Users,     color: "text-emerald-700",bg: "bg-emerald-50",accent: "#059669", border: "border-emerald-200" },
};

function parseAmount(str: string | null | undefined): number {
  if (!str) return 0;
  const n = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatTotal(n: number): string {
  if (n >= 1000) return `£${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `£${n.toLocaleString("en-GB")}`;
}

export default function CommunityPage() {
  const { data: posts = [], isLoading } = trpc.community.getPublished.useQuery();
  const [selectedPost, setSelectedPost] = useState<any>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Community & Impact | CB Travel";
  }, []);

  // Lock scroll when modal is open
  useEffect(() => {
    if (selectedPost) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedPost]);

  const featured = posts.filter((p: any) => p.isFeatured);
  const rest = posts.filter((p: any) => !p.isFeatured);

  const totalGiven = posts.reduce((sum: number, p: any) => sum + parseAmount(p.amountRaised), 0);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-b from-[#0f2a4a] to-[#1e3a5f] text-white py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #d4af37 0%, transparent 50%), radial-gradient(circle at 70% 30%, #d4af37 0%, transparent 50%)" }} />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs tracking-[4px] uppercase text-[#d4af37] font-semibold mb-4">Community & Impact</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-light mb-6 leading-tight">
            Travelling with<br /><span className="font-semibold">Purpose & Heart</span>
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed max-w-xl mx-auto mb-8">
            At CB Travel, we believe the best journeys go beyond destinations. We're proud to support local
            communities, meaningful charities, and the people who make our world worth exploring.
          </p>

          {/* Total Given Back pill */}
          {totalGiven > 0 && (
            <div className="inline-flex items-center gap-3 bg-[#d4af37]/20 border border-[#d4af37]/40 backdrop-blur-sm rounded-2xl px-6 py-4 mt-2">
              <div className="text-left">
                <p className="text-[10px] tracking-[3px] uppercase text-[#d4af37]/80 font-semibold mb-0.5">Total Given Back</p>
                <p className="font-serif text-3xl font-bold text-[#d4af37] leading-none">{formatTotal(totalGiven)}</p>
              </div>
              <div className="w-px h-10 bg-[#d4af37]/30" />
              <p className="text-blue-200 text-xs leading-relaxed text-left max-w-[140px]">
                Returned to communities &amp; causes
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Gold divider */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

      <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">

        {/* Featured stories */}
        {featured.length > 0 && (
          <section className="mb-20">
            <div className="text-center mb-10">
              <p className="text-xs tracking-[3px] uppercase text-[#d4af37] font-semibold mb-2">Featured Stories</p>
              <h2 className="font-serif text-3xl font-light text-[#1e3a5f]">Making a Difference</h2>
            </div>
            <div className="space-y-10">
              {featured.map((post: any, i: number) => {
                const cfg = TYPE_CONFIG[post.type as PostType] || TYPE_CONFIG.community;
                const Icon = cfg.icon;
                const isEven = i % 2 === 0;
                return (
                  <div
                    key={post.id}
                    className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-8 items-center cursor-pointer group`}
                    onClick={() => setSelectedPost(post)}
                  >
                    {/* Image */}
                    <div className="md:w-1/2 w-full">
                      {post.imageUrl ? (
                        <div className="rounded-2xl overflow-hidden aspect-[4/3] shadow-lg">
                          <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className={`rounded-2xl ${cfg.bg} aspect-[4/3] flex items-center justify-center`}>
                          <Icon size={64} className={cfg.color} strokeWidth={1} />
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="md:w-1/2 w-full">
                      <div className={`inline-flex items-center gap-2 ${cfg.bg} px-3 py-1.5 rounded-full mb-4`}>
                        <Icon size={12} className={cfg.color} />
                        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <h3 className="font-serif text-2xl font-semibold text-[#1e3a5f] mb-3 leading-snug group-hover:text-[#d4af37] transition-colors">{post.title}</h3>
                      {post.subtitle && <p className="text-[#d4af37] font-semibold text-sm mb-3 italic">"{post.subtitle}"</p>}
                      {post.description && <p className="text-slate-600 leading-relaxed mb-4">{post.description}</p>}
                      {post.content && <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">{post.content}</p>}
                      <div className="flex flex-wrap gap-3 mt-5">
                        {post.amountRaised && (
                          <span className="inline-flex items-center gap-1.5 bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#9a7c1e] text-xs font-bold px-3 py-1.5 rounded-full">
                            ✦ Given Back: {post.amountRaised}
                          </span>
                        )}
                        {post.location && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={11} /> {post.location}</span>}
                        {post.eventDate && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar size={11} /> {post.eventDate}</span>}
                        {post.charityName && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Heart size={11} /> {post.charityName}</span>}
                        {post.partnerName && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Handshake size={11} /> {post.partnerName}</span>}
                      </div>
                      <p className="text-xs text-[#d4af37] font-semibold mt-4 flex items-center gap-1 group-hover:underline">
                        Read more <ExternalLink size={10} />
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Card grid */}
        {rest.length > 0 && (
          <section>
            {featured.length > 0 && (
              <div className="text-center mb-10">
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-10" />
                <p className="text-xs tracking-[3px] uppercase text-muted-foreground font-semibold mb-2">More From the Community</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post: any) => {
                const cfg = TYPE_CONFIG[post.type as PostType] || TYPE_CONFIG.community;
                const Icon = cfg.icon;
                return (
                  <button
                    key={post.id}
                    className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group text-left w-full"
                    onClick={() => setSelectedPost(post)}
                  >
                    {post.imageUrl ? (
                      <div className="aspect-video overflow-hidden">
                        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className={`aspect-video ${cfg.bg} flex items-center justify-center`}>
                        <Icon size={40} className={cfg.color} strokeWidth={1} />
                      </div>
                    )}
                    <div className="p-5">
                      <div className={`inline-flex items-center gap-1.5 ${cfg.bg} ${cfg.border} border px-2.5 py-1 rounded-full mb-3`}>
                        <Icon size={10} className={cfg.color} />
                        <span className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <h3 className="font-serif text-base font-semibold text-foreground leading-snug mb-2">{post.title}</h3>
                      {post.description && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{post.description}</p>}

                      {/* Amount Given Back badge */}
                      {post.amountRaised && (
                        <div className="mt-3 inline-flex items-center gap-1.5 bg-[#d4af37]/12 border border-[#d4af37]/25 text-[#9a7c1e] text-xs font-bold px-2.5 py-1.5 rounded-full">
                          ✦ Given Back: {post.amountRaised}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                        {post.location && <span className="flex items-center gap-1"><MapPin size={10} /> {post.location}</span>}
                        {post.eventDate && <span className="flex items-center gap-1"><Calendar size={10} /> {post.eventDate}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="rounded-2xl h-64 animate-pulse bg-slate-100 border border-border" />)}
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="text-center py-24">
            <Heart size={48} className="text-slate-300 mx-auto mb-4" strokeWidth={1} />
            <p className="font-serif text-xl text-muted-foreground">Our community stories are coming soon.</p>
            <p className="text-sm text-muted-foreground mt-2">Check back to see how we're making a difference.</p>
          </div>
        )}
      </div>

      {/* CTA band */}
      <section className="bg-gradient-to-r from-[#0f2a4a] to-[#1e3a5f] py-16 px-4 text-center text-white">
        <p className="text-xs tracking-[3px] uppercase text-[#d4af37] font-semibold mb-3">Travel With Purpose</p>
        <h2 className="font-serif text-3xl font-light mb-4">Every trip makes a difference</h2>
        <p className="text-blue-200 max-w-lg mx-auto text-sm leading-relaxed mb-8">
          When you book with CB Travel, you're supporting local communities, independent businesses, and the causes close to our hearts.
        </p>
        <a href="/quote-request" className="inline-block bg-[#d4af37] text-[#1e3a5f] font-bold px-8 py-3.5 rounded-xl hover:bg-[#c9a227] transition-all text-sm">
          Plan Your Next Journey
        </a>
      </section>

      {/* ── Post Detail Modal ── */}
      {selectedPost && (() => {
        const post = selectedPost;
        const cfg = TYPE_CONFIG[post.type as PostType] || TYPE_CONFIG.community;
        const Icon = cfg.icon;
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedPost(null)}
            />
            {/* Panel */}
            <div className="relative bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full mx-0 sm:mx-4 max-h-[92vh] overflow-y-auto z-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
              {/* Close */}
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 z-20 w-9 h-9 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>

              {/* Image */}
              {post.imageUrl ? (
                <div className="rounded-t-3xl sm:rounded-t-3xl overflow-hidden aspect-[16/9]">
                  <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={`rounded-t-3xl sm:rounded-t-3xl aspect-[16/9] ${cfg.bg} flex items-center justify-center`}>
                  <Icon size={72} className={cfg.color} strokeWidth={0.8} />
                </div>
              )}

              {/* Content */}
              <div className="p-6 sm:p-8">
                {/* Type badge */}
                <div className={`inline-flex items-center gap-1.5 ${cfg.bg} ${cfg.border} border px-3 py-1.5 rounded-full mb-4`}>
                  <Icon size={12} className={cfg.color} />
                  <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1e3a5f] mb-3 leading-snug">{post.title}</h2>

                {post.subtitle && (
                  <p className="text-[#d4af37] font-semibold text-sm mb-4 italic">"{post.subtitle}"</p>
                )}

                {/* Amount Given Back — prominent */}
                {post.amountRaised && (
                  <div className="flex items-center gap-3 bg-[#d4af37]/12 border border-[#d4af37]/30 rounded-2xl px-5 py-4 mb-6">
                    <span className="text-2xl">✦</span>
                    <div>
                      <p className="text-[10px] tracking-[2px] uppercase text-[#9a7c1e] font-semibold">Amount Given Back</p>
                      <p className="font-serif text-xl font-bold text-[#9a7c1e]">{post.amountRaised}</p>
                    </div>
                  </div>
                )}

                {post.description && (
                  <p className="text-slate-700 leading-relaxed mb-4 text-base">{post.description}</p>
                )}
                {post.content && (
                  <p className="text-slate-500 leading-relaxed text-sm mb-6 whitespace-pre-line">{post.content}</p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-sm text-slate-500 border-t border-border pt-5">
                  {post.location && (
                    <span className="flex items-center gap-1.5 bg-slate-50 border border-border px-3 py-1.5 rounded-full">
                      <MapPin size={12} /> {post.location}
                    </span>
                  )}
                  {post.eventDate && (
                    <span className="flex items-center gap-1.5 bg-slate-50 border border-border px-3 py-1.5 rounded-full">
                      <Calendar size={12} /> {post.eventDate}
                    </span>
                  )}
                  {post.charityName && (
                    <span className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-full">
                      <Heart size={12} /> {post.charityName}
                    </span>
                  )}
                  {post.partnerName && (
                    <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full">
                      <Handshake size={12} /> {post.partnerName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
