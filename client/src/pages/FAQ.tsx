import { useState } from "react";
import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Phone, Mail, MessageCircle } from "lucide-react";
import { useSEO } from '@/hooks/useSEO';

const HERO_BG = "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=1200&q=80&auto=format&fit=crop";

const FAQ_CATEGORIES = [
  {
    category: "Booking & Planning",
    items: [
      {
        q: "How do I book a holiday with CB Travel?",
        a: "Simply fill out our Request a Quote form online or call us directly on 07495 823953. One of our dedicated travel specialists will be in touch within 24 hours to discuss your requirements and begin crafting your perfect holiday.",
      },
      {
        q: "Is there a fee for using CB Travel's services?",
        a: "Our quote and consultation service is completely free of charge. We earn a commission from our supplier partners, which means you benefit from our expertise at no extra cost to you.",
      },
      {
        q: "How far in advance should I book?",
        a: "We recommend booking as early as possible to secure the best prices and availability, particularly for popular destinations and peak travel periods. However, we can also arrange last-minute holidays — just give us a call.",
      },
      {
        q: "Can you arrange travel for large groups?",
        a: "Absolutely. We specialise in group travel arrangements, from family holidays to corporate retreats. Please contact us directly to discuss your group's requirements.",
      },
    ],
  },
  {
    category: "Payments & Pricing",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit and debit cards, as well as bank transfers. We can also arrange flexible payment plans for many bookings — ask your travel specialist for details.",
      },
      {
        q: "Is a deposit required to secure my booking?",
        a: "Most bookings require a deposit to secure your reservation, with the balance due closer to your departure date. The exact deposit amount varies by supplier and holiday type. Your specialist will advise you of the specific terms.",
      },
      {
        q: "Are your prices per person or total?",
        a: "All prices quoted are per person unless otherwise stated. We will always make the pricing structure clear before you commit to any booking.",
      },
      {
        q: "Do you offer price matching?",
        a: "We strive to offer the most competitive prices possible through our extensive supplier network. If you find a like-for-like holiday at a lower price, please let us know and we'll do our best to match it.",
      },
    ],
  },
  {
    category: "Your Booking & Account",
    items: [
      {
        q: "How do I view my booking documents?",
        a: "Once your booking is confirmed, log into your CB Travel account and navigate to 'My Bookings'. All your documents — including booking confirmations, itineraries, and invoices — will be available to view and download.",
      },
      {
        q: "Can I make changes to my booking after confirmation?",
        a: "We'll always do our best to accommodate amendments. Please contact us as soon as possible if you need to make changes. Please note that amendment fees may apply depending on the supplier's terms and conditions.",
      },
      {
        q: "What happens if I need to cancel my holiday?",
        a: "Cancellation policies vary by supplier. We recommend taking out comprehensive travel insurance at the time of booking to protect against unforeseen circumstances. Contact us immediately if you need to cancel and we'll guide you through the process.",
      },
      {
        q: "How do I create an account?",
        a: "Click 'Create Account' in the top navigation. You'll need to provide your name, email address, phone number, and create a password. Account creation is free and allows you to manage your bookings online.",
      },
    ],
  },
  {
    category: "Travel & Destinations",
    items: [
      {
        q: "What types of holidays do you offer?",
        a: "We offer a comprehensive range of travel services including package holidays, luxury cruises, city breaks, adventure travel, business travel, and fully bespoke itineraries. We work with over 200 trusted suppliers worldwide.",
      },
      {
        q: "Do you serve international clients?",
        a: "Yes, absolutely. While we are based in the United Kingdom, we proudly serve clients from all over the world and can arrange travel from any departure point globally.",
      },
      {
        q: "Can you arrange travel insurance?",
        a: "Yes, we can arrange comprehensive travel insurance to give you complete peace of mind. We strongly recommend taking out insurance at the time of booking. Your specialist will discuss the best options for your trip.",
      },
      {
        q: "Do you offer ATOL protection?",
        a: "Yes. CB Travel operates as an authorised agent under JLT Group (Janine Loves Travel), and ATOL-protected package holidays are covered under JLT Group's ATOL licence (ATOL No. 12564). This means your money is financially protected if an ATOL holder fails. Your specialist will confirm whether ATOL protection applies to your specific booking and provide you with an ATOL certificate where applicable.",
      },
    ],
  },
  {
    category: "Support",
    items: [
      {
        q: "What support is available during my holiday?",
        a: "We provide support throughout your journey. If you experience any issues while travelling, contact us directly on 07495 823953 or email hello@travelcb.co.uk and we'll do everything we can to assist.",
      },
      {
        q: "What should I do in an emergency while abroad?",
        a: "In a genuine emergency, always contact local emergency services first (112 is the international emergency number). Then contact your travel insurance provider, followed by us. We'll provide all relevant emergency contact details with your booking documents.",
      },
      {
        q: "How do I make a complaint?",
        a: "We take all feedback seriously. If you're unhappy with any aspect of our service, please contact us at hello@travelcb.co.uk with full details. We aim to acknowledge all complaints within 48 hours and resolve them within 14 days.",
      },
    ],
  },
];

export default function FAQ() {
  useSEO({
    title: 'Frequently Asked Questions',
    description: 'Got questions about booking with CB Travel? Find answers about our services, payment options, cancellation policies, and more.',
  });
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? FAQ_CATEGORIES.map(cat => ({
        ...cat,
        items: cat.items.filter(
          item =>
            item.q.toLowerCase().includes(search.toLowerCase()) ||
            item.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(cat => cat.items.length > 0)
    : FAQ_CATEGORIES;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img src={HERO_BG} alt="FAQ" className="w-full h-full object-cover" />
        <div className="hero-overlay absolute inset-0" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center pt-20">
          <p className="text-xs font-semibold tracking-widest text-yellow-400 uppercase mb-3">Help Centre</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3">Frequently Asked Questions</h1>
          <p className="text-white/80 max-w-lg font-light">Everything you need to know about booking and travelling with CB Travel.</p>
        </div>
      </div>

      <div className="container py-16">
        {/* Search */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-11 h-12 rounded-full border-border shadow-sm text-base"
            />
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          {filtered.length > 0 ? (
            <div className="space-y-10">
              {filtered.map((cat) => (
                <div key={cat.category}>
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-5">{cat.category}</h2>
                  <Accordion type="single" collapsible className="space-y-3">
                    {cat.items.map((item, i) => (
                      <AccordionItem
                        key={i}
                        value={`${cat.category}-${i}`}
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
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No results found for "{search}"</p>
              <p className="text-muted-foreground/60 text-sm mt-2">Try a different search term or contact us directly.</p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 bg-navy-gradient rounded-2xl p-10 text-white text-center">
            <h3 className="font-serif text-2xl font-bold mb-3">Still have questions?</h3>
            <p className="text-white/70 mb-8">Our travel specialists are here to help. Get in touch and we'll answer any questions you have.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:07495823953">
                <Button className="rounded-full border-2 border-white/30 text-white hover:bg-white/10 gap-2 px-8 bg-transparent">
                  <Phone size={15} />
                  07495 823953
                </Button>
              </a>
              <a href="mailto:hello@travelcb.co.uk">
                <Button className="rounded-full border-2 border-white/30 text-white hover:bg-white/10 gap-2 px-8 bg-transparent">
                  <Mail size={15} />
                  hello@travelcb.co.uk
                </Button>
              </a>
              <Link href="/quote-request">
                <Button className="rounded-full btn-gold border-0 text-foreground gap-2 px-8">
                  <MessageCircle size={15} />
                  Request a Quote
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
