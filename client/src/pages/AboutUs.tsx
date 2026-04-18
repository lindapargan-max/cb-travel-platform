import { Link } from "wouter";
import { MapPin, Mail, Phone, Globe, Heart, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464925361/dPHKGynvhLRtUrGZhYEBQ4/CBTravel_BlackTransparent_35c2ad4d.png";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div
        className="relative pt-32 pb-24 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(135deg, oklch(0.15 0.07 255) 0%, oklch(0.22 0.07 255) 60%, oklch(0.28 0.08 255) 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative container max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-4 py-2 rounded-full mb-6 border border-white/20">
            <Heart size={12} className="text-yellow-400" />
            Independent Travel Agent · Blackpool, UK
          </span>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            About CB Travel
          </h1>
          <p className="text-white/75 text-lg max-w-2xl mx-auto leading-relaxed">
            A personal, passionate travel service built on the belief that every holiday should feel indulgent, seamless, and beautifully tailored to you.
          </p>
        </div>
      </div>

      {/* Main Story */}
      <div className="container max-w-4xl py-20">
        {/* Intro label */}
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold tracking-widest text-primary/60 uppercase mb-3">About Me: Your Travel Agent</span>
          <h2 className="font-serif text-4xl font-bold text-foreground">Who am I?</h2>
        </div>

        <div className="grid md:grid-cols-5 gap-12 items-start">
          {/* Text */}
          <div className="md:col-span-3 space-y-6 text-muted-foreground leading-relaxed text-[15px]">
            <p>
              I'm sure you'd like to know who you're speaking to — and who you're trusting with your next getaway. So, let me introduce myself properly.
            </p>
            <p>
              I'm <strong className="text-foreground font-semibold">Corron</strong>, founder of <strong className="text-foreground font-semibold">CB Travel</strong> and a firm believer that travel should feel indulgent, seamless and beautifully tailored to you. I specialise in creating holidays that are thoughtfully designed, stress-free and unforgettable.
            </p>
            <p>
              I'm based in Blackpool, working full-time in the administration sector while running CB Travel — because travel genuinely excites me. Some people hear my age and assume I'm just starting out, but I like to think I'm quietly breaking the stereotype. I may be young, but I've already planned and arranged numerous bespoke holidays for clients who trusted me with their well-earned getaways… and came home glowing with memories.
            </p>
            <p>
              This isn't just a second job — it's something I pour time, care and thought into because I love what I do. Nothing makes me happier than hearing <em>"we had the best time"</em> when my clients return.
            </p>
            <p>
              For me, travel is more than flights and hotels — it's the memory of your first sunset, the taste of that local cocktail you'll never forget, the laughter, the moments, the magic. I'm here to make your getaway feel effortless and special from the moment planning begins.
            </p>
            <p className="font-semibold text-foreground text-base">
              I'm here to make your getaway feel special from the moment we begin planning.
            </p>
          </div>

          {/* Card */}
          <div className="md:col-span-2">
            <div className="bg-muted/30 rounded-3xl border border-border p-8 space-y-6 sticky top-28">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="font-serif text-3xl font-bold text-primary">C</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-foreground">Corron</h3>
                <p className="text-sm text-muted-foreground mt-1">Founder &amp; Independent Travel Agent</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin size={15} className="text-primary flex-shrink-0" />
                  <span>Based in Blackpool, United Kingdom</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Globe size={15} className="text-primary flex-shrink-0" />
                  <span>Serving clients worldwide</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Heart size={15} className="text-primary flex-shrink-0" />
                  <span>Personalised holidays designed just for you</span>
                </div>
              </div>

              <div className="border-t border-border pt-5 space-y-3">
                <a href="tel:07495823953" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Phone size={15} className="text-primary flex-shrink-0" />
                  07495 823953
                </a>
                <a href="mailto:hello@travelcb.co.uk" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Mail size={15} className="text-primary flex-shrink-0" />
                  hello@travelcb.co.uk
                </a>
              </div>

              <Link href="/quote-request">
                <Button className="w-full rounded-full btn-gold border-0 text-foreground font-semibold">
                  Request a Free Quote
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-muted/20 border-y border-border py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-3">What Sets CB Travel Apart</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
              Every booking is handled with personal care — no call centres, no automated responses, just a dedicated agent who genuinely cares about your experience.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Star,
                title: "Truly Personal Service",
                desc: "You deal directly with me — not a team, not a bot. Every holiday is crafted around your specific needs, budget, and dreams.",
              },
              {
                icon: Users,
                title: "Hundreds of Suppliers",
                desc: "I work with hundreds of trusted suppliers to find you the very best options, from package holidays to bespoke luxury escapes.",
              },
              {
                icon: Heart,
                title: "Passion for Travel",
                desc: "Travel isn't just my business — it's my passion. I put genuine care and thought into every booking, because your memories matter.",
              },
            ].map((v) => (
              <div key={v.title} className="bg-white rounded-2xl border border-border p-7 shadow-sm">
                <div className="w-11 h-11 bg-primary/8 rounded-xl flex items-center justify-center mb-5">
                  <v.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-base">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container max-w-3xl py-20 text-center">
        <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Ready to Start Planning?</h2>
        <p className="text-muted-foreground mb-8 leading-relaxed max-w-xl mx-auto text-sm">
          Whether you have a destination in mind or need inspiration, I'm here to help you create a holiday you'll never forget. Get in touch today — it's completely free to enquire.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/quote-request">
            <Button className="rounded-full btn-gold border-0 text-foreground font-semibold px-8">
              Request a Free Quote
            </Button>
          </Link>
          <a href="tel:07495823953">
            <Button variant="outline" className="rounded-full px-8 border-primary/30 text-primary hover:bg-primary/5">
              Call 07495 823953
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
