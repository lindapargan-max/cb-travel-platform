import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Heart, Handshake, Gift, Users, MapPin, Calendar } from "lucide-react";

type PostType = "charity" | "partnership" | "giveaway" | "community";

const TYPE_CONFIG: Record<PostType, { label: string; icon: typeof Heart; color: string; bg: string; accent: string }> = {
  charity: { label: "Charity", icon: Heart, color: "text-rose-600", bg: "bg-rose-50", accent: "#e11d48" },
  partnership: { label: "Local Partnership", icon: Handshake, color: "text-blue-700", bg: "bg-blue-50", accent: "#1d4ed8" },
  giveaway: { label: "Giveaway", icon: Gift, color: "text-amber-600", bg: "bg-amber-50", accent: "#d97706" },
  community: { label: "Community", icon: Users, color: "text-emerald-700", bg: "bg-emerald-50", accent: "#059669" },
};

export default function CommunityPage() {
  const { data: posts = [], isLoading } = trpc.community.getPublished.useQuery();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Community & Impact | CB Travel";
  }, []);

  const featured = posts.filter((p: any) => p.isFeatured);
  const rest = posts.filter((p: any) => !p.isFeatured);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[#0f2a4a] to-[#1e3a5f] text-white py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #d4af37 0%, transparent 50%), radial-gradient(circle at 70% 30%, #d4af37 0%, transparent 50%)" }} />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs tracking-[4px] uppercase text-[#d4af37] font-semibold mb-4">Community & Impact</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-light mb-6 leading-tight">
            Travelling with<br /><span className="font-semibold">Purpose & Heart</span>
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed max-w-xl mx-auto">
            At CB Travel, we believe the best journeys go beyond destinations. We're proud to support local
            communities, meaningful charities, and the people who make our world worth exploring.
          </p>
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
                    className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-8 items-center`}
                  >
                    {/* Image */}
                    <div className="md:w-1/2 w-full">
                      {post.imageUrl ? (
                        <div className="rounded-2xl overflow-hidden aspect-[4/3] shadow-lg">
                          <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
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
                      <h3 className="font-serif text-2xl font-semibold text-[#1e3a5f] mb-3 leading-snug">{post.title}</h3>
                      {post.subtitle && <p className="text-[#d4af37] font-semibold text-sm mb-3 italic">"{post.subtitle}"</p>}
                      {post.description && <p className="text-slate-600 leading-relaxed mb-4">{post.description}</p>}
                      {post.content && <p className="text-slate-500 text-sm leading-relaxed">{post.content}</p>}
                      <div className="flex flex-wrap gap-4 mt-5 text-xs text-muted-foreground">
                        {post.location && <span className="flex items-center gap-1"><MapPin size={11} /> {post.location}</span>}
                        {post.eventDate && <span className="flex items-center gap-1"><Calendar size={11} /> {post.eventDate}</span>}
                        {post.charityName && <span className="flex items-center gap-1"><Heart size={11} /> {post.charityName}</span>}
                        {post.amountRaised && <span className="flex items-center gap-1 text-[#d4af37] font-semibold">✦ {post.amountRaised}</span>}
                        {post.partnerName && <span className="flex items-center gap-1"><Handshake size={11} /> {post.partnerName}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Rest of posts — card grid */}
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
                  <div key={post.id} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden group">
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
                      <div className={`inline-flex items-center gap-1.5 ${cfg.bg} px-2.5 py-1 rounded-full mb-3`}>
                        <Icon size={10} className={cfg.color} />
                        <span className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <h3 className="font-serif text-base font-semibold text-foreground leading-snug mb-2">{post.title}</h3>
                      {post.description && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{post.description}</p>}
                      {post.amountRaised && <p className="text-sm font-bold text-[#d4af37] mt-2">✦ {post.amountRaised}</p>}
                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                        {post.location && <span className="flex items-center gap-1"><MapPin size={10} /> {post.location}</span>}
                        {post.eventDate && <span className="flex items-center gap-1"><Calendar size={10} /> {post.eventDate}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="rounded-2xl h-64 animate-pulse bg-slate-100 border border-border" />)}
          </div>
        )}

        {/* Empty */}
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
    </div>
  );
}
