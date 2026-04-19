import { useState } from "react";
import { Link } from "wouter";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Globe, Star, MapPin, Clock, Users, Phone, Mail, ArrowRight,
  Plane, Ship, Briefcase, Mountain, Building2, Package, ChevronRight,
  Shield, HeartHandshake, Sparkles, CheckCircle2, Calendar, Heart
} from "lucide-react";
import { toast } from "sonner";

// To use your own cover photo, place it at: client/public/cover-photo.jpg
// It will automatically be used as the hero background.
const HERO_BG = "/cover-photo.jpg";

const SERVICES = [
  { icon: Package, title: "Package Holidays", desc: "All-inclusive packages tailored to your desires, from sun-soaked beaches to cultural city breaks." },
  { icon: Ship, title: "Luxury Cruises", desc: "Sail the world's most breathtaking waterways aboard world-class cruise liners." },
  { icon: Mountain, title: "Adventure Travel", desc: "Thrilling experiences for the bold explorer — safaris, treks, and beyond." },
  { icon: Building2, title: "City Breaks", desc: "Immerse yourself in culture, cuisine, and history in the world's greatest cities." },
  { icon: Briefcase, title: "Business Travel", desc: "Seamless corporate travel solutions with premium comfort and efficiency." },
  { icon: Sparkles, title: "Bespoke Itineraries", desc: "Fully customised journeys crafted around your unique vision and preferences." },
];

const TRUST_STATS = [
  { value: "Dedicated", label: "Personal Service" },
  { value: "Worldwide", label: "Destinations" },
  { value: "300+", label: "Supplier Partners" },
];

const FAQ_ITEMS = [
  {
    q: "How do I book a holiday with CB Travel?",
    a: "Simply fill out our Request a Quote form or call us on 07495 823953. One of our travel specialists will be in touch within 24 hours to discuss your perfect holiday.",
  },
  {
    q: "What types of holidays do you specialise in?",
    a: "We specialise in package holidays but offer all types of travel — from luxury cruises and city breaks to adventure holidays and bespoke itineraries. We work with over 200 trusted suppliers worldwide.",
  },
  {
    q: "Do you offer travel insurance?",
    a: "Yes, we can arrange comprehensive travel insurance to give you complete peace of mind. We'll discuss the best options for your trip during the booking process.",
  },
  {
    q: "Can I make changes to my booking after it's confirmed?",
    a: "We'll always do our best to accommodate changes. Please contact us as soon as possible if you need to amend your booking. Charges may apply depending on the supplier's terms.",
  },
  {
    q: "How do I view my booking documents?",
    a: "Once your booking is confirmed, simply log into your account on our website. All your documents, including booking confirmations and itineraries, will be available in your 'My Bookings' section.",
  },
  {
    q: "What payment options do you accept?",
    a: "We accept all major credit and debit cards, as well as bank transfers. We can also arrange flexible payment plans — ask your travel specialist for details.",
  },
  {
    q: "Do you serve international clients?",
    a: "Absolutely. While we are based in the United Kingdom, we proudly serve clients from all over the world. We can arrange travel from any departure point globally.",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"}
        />
      ))}
    </div>
  );
}

function DealCard({ deal }: { deal: any }) {
  const price = typeof deal.price === "string" ? parseFloat(deal.price) : deal.price;
  const originalPrice = deal.originalPrice ? (typeof deal.originalPrice === "string" ? parseFloat(deal.originalPrice) : deal.originalPrice) : null;
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : null;

  const categoryLabels: Record<string, string> = {
    package_holiday: "Package Holiday",
    cruise: "Cruise",
    business_travel: "Business",
    luxury: "Luxury",
    adventure: "Adventure",
    city_break: "City Break",
    other: "Special Offer",
  };

  return (
    <Link href="/quote-request">
      <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-border cursor-pointer deal-card-hover">
        <div className="relative h-56 overflow-hidden">
          {deal.imageUrl ? (
            <img
              src={deal.imageUrl}
              alt={deal.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Globe size={40} className="text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent group-hover:from-black/70 transition-all duration-300" />
          {discount && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              -{discount}%
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
              {categoryLabels[deal.category] || deal.category}
            </span>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-1.5 text-white text-sm mb-1">
              <MapPin size={13} />
              <span className="font-medium">{deal.destination}</span>
            </div>
            <h3 className="text-white font-bold text-base leading-tight line-clamp-2">{deal.title}</h3>
          </div>
          {/* Hover CTA overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="bg-white text-primary font-semibold text-sm px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              Enquire Now <ArrowRight size={14} />
            </span>
          </div>
        </div>
        <div className="p-5">
          <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">{deal.description}</p>
          <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
            {deal.duration && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {deal.duration}
              </span>
            )}
            {deal.departureDate && (
              <span className="flex items-center gap-1">
                <Plane size={12} />
                {deal.departureDate}
              </span>
            )}
          </div>
          <div className="flex items-end justify-between">
            <div>
              {originalPrice && (
                <p className="text-xs text-muted-foreground line-through">From £{originalPrice.toLocaleString()}</p>
              )}
              <p className="text-2xl font-bold text-primary">
                £{price.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground ml-1">pp</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-full group-hover:bg-accent group-hover:text-foreground transition-colors duration-200">
              Enquire
              <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function TestimonialCard({ t }: { t: any }) {
  return (
    <div className="bg-white rounded-2xl p-7 shadow-md border border-border card-hover">
      <div className="flex items-start justify-between mb-4">
        <StarRating rating={t.rating} />
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{t.destination}</span>
      </div>
      <h4 className="font-serif text-base font-semibold text-foreground mb-2">"{t.title}"</h4>
      <p className="text-muted-foreground text-sm leading-relaxed mb-5 line-clamp-4">{t.content}</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
          {t.clientName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{t.clientName}</p>
          <p className="text-xs text-muted-foreground">Verified Client</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const { data: deals, isLoading: dealsLoading } = trpc.deals.list.useQuery();
  const { data: testimonials, isLoading: testimonialsLoading } = trpc.testimonials.list.useQuery();
  const { data: destinations, isLoading: destinationsLoading } = trpc.destinations.getActive.useQuery();
  const { data: communityFeatured = [] } = trpc.community.getFeatured.useQuery();
  const { data: allCommunityPosts = [] } = trpc.community.getPublished.useQuery();
  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      toast.success("You're subscribed! Welcome to the CB Travel family.");
      setEmail("");
      setName("");
      setSubscribing(false);
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
      setSubscribing(false);
    },
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    subscribeMutation.mutate({ email, name: name || undefined });
  };

  return (
    <div className="min-h-screen">
      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${HERO_BG}), url(https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=85&auto=format&fit=crop)` }}
        />
        <div className="hero-overlay absolute inset-0" />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative z-10 container text-center text-white pt-20">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 text-sm font-medium">
            <Sparkles size={14} className="text-yellow-400" />
            <span>UK-Based Travel Agency — Worldwide Service</span>
          </div>

          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6 text-white">
            Your World.<br />
            <span className="text-gold-gradient">Our Expertise.</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/80 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
            Crafting extraordinary travel experiences for discerning explorers. From luxury escapes to adventure holidays — we make every journey unforgettable.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/quote-request">
              <Button size="lg" className="btn-gold border-0 text-foreground rounded-full px-10 py-6 text-base font-semibold shadow-2xl gap-2">
                Get a Free Quote
                <ArrowRight size={18} />
              </Button>
            </Link>
            <a href="#deals">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/60 text-white hover:bg-white/10 rounded-full px-10 py-6 text-base font-semibold backdrop-blur-sm"
              >
                View Weekly Deals
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 max-w-3xl mx-auto">
            {TRUST_STATS.map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
                <p className="font-serif text-3xl font-bold text-yellow-400">{stat.value}</p>
                <p className="text-white/60 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 text-xs">
          <span>Scroll to explore</span>
          <div className="w-5 h-8 border border-white/30 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-white/50 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ─── DESTINATIONS BOOKED SO FAR ─────────────────────────────────────── */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="container">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest text-primary/60 uppercase mb-2">Our Clients Have Visited</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">Destinations We've Booked 🌍</h2>
          </div>

          {destinationsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="rounded-2xl bg-muted animate-pulse aspect-[4/3]" />
              ))}
            </div>
          ) : destinations && destinations.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {destinations.map((dest: any) => {
                const imgSrc = dest.imageUrl || `https://source.unsplash.com/featured/480x360/?${encodeURIComponent(dest.name + ",travel,landscape")}`;
                const lastBooked = dest.lastBooked ? new Date(dest.lastBooked).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : null;
                return (
                  <div
                    key={dest.id}
                    className="relative rounded-2xl overflow-hidden aspect-[4/3] group shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                  >
                    <img
                      src={imgSrc}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1488085061387-422e29b40080?w=480&q=80`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-bold text-sm leading-tight">{dest.name}</p>
                      {lastBooked && (
                        <p className="text-white/70 text-[11px] mt-0.5">Last booked {lastBooked}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm py-8">Destinations coming soon.</p>
          )}
        </div>
      </section>

      {/* ─── SERVICES ──────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">What We Offer</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              Travel Services
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              From package holidays to bespoke adventures, we offer a comprehensive range of travel services tailored to every type of explorer.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <div key={service.title} className="group p-7 rounded-2xl border border-border hover:border-accent/40 hover:shadow-lg transition-all duration-300 bg-white">
                <div className="w-12 h-12 bg-primary/8 rounded-xl flex items-center justify-center mb-5 group-hover:bg-accent/10 transition-colors">
                  <service.icon size={22} className="text-primary group-hover:text-accent transition-colors" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">{service.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WEEKLY DEALS ──────────────────────────────────────────────────── */}
      <section id="deals" className="py-20 md:py-28 bg-muted/20">
        <div className="container">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">Limited Time Offers</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              Weekly Deals
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Handpicked travel packages offering exceptional value. Updated every week — don't miss out.
            </p>
          </div>

          {dealsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-border" />
              ))}
            </div>
          ) : deals && deals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal: any) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-border">
              <Globe size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-light text-lg">Exciting new deals coming soon.</p>
              <p className="text-muted-foreground/60 text-sm mt-2">Subscribe to our newsletter to be the first to know.</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/quote-request">
              <Button variant="outline" className="rounded-full px-8 border-primary text-primary hover:bg-primary hover:text-white gap-2">
                Can't find what you're looking for? Request a Custom Quote
                <ChevronRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─────────────────────────────────────────────────── */}

      {/* ─── FACEBOOK FEED ─────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-border">
        <div className="container">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest text-blue-600/60 uppercase mb-3">Social Media</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">Latest from Facebook</h2>
            <p className="text-muted-foreground">Stay up to date with our latest news and travel inspiration.</p>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-[500px] overflow-hidden rounded-2xl shadow-lg border border-border">
              <iframe
                src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fcbtraveluk%2F&tabs=timeline&width=500&height=500&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false"
                width="500"
                height="500"
                style={{ border: 'none', overflow: 'hidden', maxWidth: '100%' }}
                scrolling="no"
                frameBorder="0"
                allowFullScreen={true}
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                title="CB Travel Facebook Feed"
                className="w-full"
              />
            </div>
          </div>
          <div className="text-center mt-6">
            <a href="https://www.facebook.com/cbtraveluk/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
              Follow us on Facebook →
            </a>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-navy-gradient text-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest text-yellow-400 uppercase mb-3">Why CB Travel</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Travel with Confidence.<br />Travel with Us.
              </h2>
              <p className="text-white/70 leading-relaxed mb-8">
                With over a decade of experience and partnerships with hundreds of trusted suppliers, CB Travel delivers exceptional holidays with a personal touch. We're with you every step of the way.
              </p>
              <div className="space-y-4">
                {[
                  "Access to 300+ trusted travel suppliers worldwide",
                  "Personalised service from dedicated travel specialists",
                  "Competitive pricing with no hidden fees",
                  "24/7 support throughout your journey",
                  "ATOL protected bookings",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/80 text-sm">{point}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-10">
                <Link href="/quote-request">
                  <Button className="btn-gold border-0 text-foreground rounded-full px-8">
                    Start Planning
                  </Button>
                </Link>
                <a href="tel:07495823953">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 gap-2">
                    <Phone size={15} />
                    Call Us
                  </Button>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, title: "Fully Protected", desc: "ATOL protected for your complete peace of mind" },
                { icon: Shield, title: "Trusted Agency", desc: "Independently owned with years of expertise and a personal approach" },
                { icon: HeartHandshake, title: "Personal Service", desc: "Dedicated specialists who know you by name" },
                { icon: Globe, title: "Global Reach", desc: "Destinations across all 7 continents" },
              ].map((item) => (
                <div key={item.title} className="glass-card rounded-2xl p-6">
                  <item.icon size={28} className="text-yellow-400 mb-3" />
                  <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                  <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">Client Reviews</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              What Our Clients Say
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Don't just take our word for it — hear from the travellers whose dreams we've turned into reality.
            </p>
          </div>

          {testimonialsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-56 animate-pulse border border-border" />
              ))}
            </div>
          ) : testimonials && testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t: any) => (
                <TestimonialCard key={t.id} t={t} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Client testimonials coming soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-muted/20">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">Got Questions?</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Everything you need to know about booking with CB Travel.
              </p>
            </div>
            <Accordion type="single" collapsible className="space-y-3">
              {FAQ_ITEMS.slice(0, 5).map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="bg-white rounded-xl border border-border px-6 shadow-sm"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground text-sm py-5 hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="text-center mt-8">
              <Link href="/faq">
                <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white gap-2">
                  View All FAQs
                  <ChevronRight size={15} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER ────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-navy-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl" />
        </div>
        <div className="container relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-widest text-yellow-400 uppercase mb-3">Stay Inspired</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Never Miss a Deal
            </h2>
            <p className="text-white/70 leading-relaxed mb-10">
              Subscribe to our newsletter for exclusive travel deals, destination guides, and insider tips delivered straight to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 relative z-20" noValidate>
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full px-5 h-12 focus:bg-white/20 focus:border-yellow-400 focus:ring-yellow-400/20 transition-all"
                />
              </div>
              <div className="flex-[2]">
                <Input
                  type="text"
                  inputMode="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full px-5 h-12 focus:bg-white/20 focus:border-yellow-400 focus:ring-yellow-400/20 transition-all"
                />
              </div>
              <Button
                type="submit"
                disabled={subscribing}
                className="btn-gold border-0 text-foreground rounded-full px-10 h-12 font-bold shadow-lg hover:shadow-xl transition-all flex-shrink-0"
              >
                {subscribing ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
            <p className="text-white/30 text-xs mt-4">
              We respect your privacy. Unsubscribe at any time. View our{" "}
              <Link href="/privacy-policy">
                <span className="text-yellow-400/60 hover:text-yellow-400 cursor-pointer underline">Privacy Policy</span>
              </Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ─── COMMUNITY & IMPACT TEASER ─────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[4px] uppercase font-semibold text-[#d4af37] mb-3">Community & Impact</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#1e3a5f] mb-4">
              Travelling with <span className="font-semibold">Heart</span>
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
              We believe in more than just holidays. From local charity partnerships to meaningful giveaways,
              every booking supports something bigger.
            </p>
          </div>

          {/* Total Given Back stat */}
          {(() => {
            const total = (allCommunityPosts as any[]).reduce((sum: number, p: any) => {
              const n = parseFloat((p.amountRaised || "").replace(/[^0-9.]/g, ""));
              return sum + (isNaN(n) ? 0 : n);
            }, 0);
            if (total <= 0) return null;
            return (
              <div className="flex justify-center mb-10">
                <div className="inline-flex items-center gap-4 bg-gradient-to-r from-[#1e3a5f] to-[#0f2a4a] text-white rounded-2xl px-8 py-5 shadow-lg">
                  <span className="text-2xl">✦</span>
                  <div className="text-left">
                    <p className="text-[10px] tracking-[3px] uppercase text-[#d4af37]/80 font-semibold">Total Given Back</p>
                    <p className="font-serif text-2xl font-bold text-[#d4af37] leading-tight">
                      {total >= 1000 ? `£${(total / 1000).toFixed(total % 1000 === 0 ? 0 : 1)}k` : `£${total.toLocaleString("en-GB")}`}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <p className="text-blue-200 text-xs max-w-[120px] leading-relaxed">Returned to communities &amp; causes</p>
                </div>
              </div>
            );
          })()}

          {communityFeatured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {(communityFeatured as any[]).slice(0, 3).map((post: any) => {
                const typeIcons: Record<string, string> = { charity: "❤️", partnership: "🤝", giveaway: "🎁", community: "🌍" };
                const typeColors: Record<string, string> = {
                  charity: "bg-rose-50 text-rose-700 border-rose-100",
                  partnership: "bg-blue-50 text-blue-700 border-blue-100",
                  giveaway: "bg-amber-50 text-amber-700 border-amber-100",
                  community: "bg-emerald-50 text-emerald-700 border-emerald-100",
                };
                const typeLabels: Record<string, string> = { charity: "Charity", partnership: "Partnership", giveaway: "Giveaway", community: "Community" };
                return (
                  <a key={post.id} href="/community" className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group block">
                    {post.imageUrl ? (
                      <div className="aspect-video overflow-hidden">
                        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="aspect-video bg-slate-100 flex items-center justify-center text-4xl">
                        {typeIcons[post.type] || "🌍"}
                      </div>
                    )}
                    <div className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${typeColors[post.type] || typeColors.community}`}>
                        {typeIcons[post.type]} {typeLabels[post.type] || post.type}
                      </span>
                      <h3 className="font-serif text-sm font-semibold text-foreground mt-2 leading-snug">{post.title}</h3>
                      {post.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.description}</p>}
                      {post.amountRaised && (
                        <div className="mt-2 inline-flex items-center gap-1 bg-[#d4af37]/12 border border-[#d4af37]/25 text-[#9a7c1e] text-[10px] font-bold px-2 py-1 rounded-full">
                          ✦ Given Back: £{post.amountRaised}
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
              {[
                { icon: "❤️", title: "Charity Support", desc: "A portion of every booking supports causes close to our hearts" },
                { icon: "🤝", title: "Local Partnerships", desc: "We work with local businesses and communities at every destination" },
                { icon: "🎁", title: "Client Giveaways", desc: "Regular surprises and prizes for our valued clients" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-border p-6 text-center shadow-sm">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-serif text-sm font-semibold text-foreground mb-1.5">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          <div className="text-center">
            <a href="/community" className="inline-flex items-center gap-2 text-[#1e3a5f] font-semibold text-sm border border-[#1e3a5f] px-6 py-3 rounded-xl hover:bg-[#1e3a5f] hover:text-white transition-all">
              See All Our Community Stories →
            </a>
          </div>
        </div>
      </section>

      {/* ─── CONTACT CTA ───────────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-serif text-2xl font-bold text-foreground">Ready to start your journey?</h3>
              <p className="text-muted-foreground mt-1">Our travel specialists are ready to help you plan the perfect trip.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="tel:07495823953">
                <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white gap-2 px-6">
                  <Phone size={15} />
                  07495 823953
                </Button>
              </a>
              <a href="mailto:hello@travelcb.co.uk">
                <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white gap-2 px-6">
                  <Mail size={15} />
                  hello@travelcb.co.uk
                </Button>
              </a>
              <Link href="/quote-request">
                <Button className="rounded-full btn-gold border-0 text-foreground gap-2 px-6">
                  Get a Quote
                  <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
