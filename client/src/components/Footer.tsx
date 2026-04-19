import { Link } from "wouter";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, MessageCircle, Shield } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464925361/dPHKGynvhLRtUrGZhYEBQ4/CBTravel_BlackTransparent_35c2ad4d.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy-gradient text-white">
      {/* Top divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />

      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
          {/* Brand */}
          <div className="space-y-5 lg:col-span-1">
            <img src={LOGO_URL} alt="CB Travel" className="h-12 w-auto brightness-0 invert" />
            <p className="text-white/65 text-sm leading-relaxed font-light">
              Crafting extraordinary travel experiences for discerning explorers worldwide. Based in the United Kingdom, serving clients globally.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a href="https://www.facebook.com/cbtraveluk/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Facebook size={15} />
              </a>
              <a href="https://wa.me/07495823953" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <MessageCircle size={15} />
              </a>
              <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Instagram size={15} />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div className="space-y-5">
            <h3 className="text-xs font-semibold tracking-widest text-yellow-400 uppercase">Explore</h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About Us" },
                { href: "/faq", label: "FAQ" },
                { href: "/quote-request", label: "Request a Quote" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-white/65 hover:text-yellow-400 text-sm font-light transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-5">
            <h3 className="text-xs font-semibold tracking-widest text-yellow-400 uppercase">Services</h3>
            <ul className="space-y-3">
              {[
                "Package Holidays",
                "Luxury Cruises",
                "City Breaks",
                "Adventure Travel",
                "Business Travel",
                "Bespoke Itineraries",
              ].map((service) => (
                <li key={service}>
                  <span className="text-white/65 text-sm font-light">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <h3 className="text-xs font-semibold tracking-widest text-yellow-400 uppercase">Contact Us</h3>
            <ul className="space-y-4">
              <li>
                <a href="tel:07495823953" className="flex items-start gap-3 group">
                  <Phone size={15} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/65 group-hover:text-white text-sm font-light transition-colors">
                    07495 823953
                  </span>
                </a>
              </li>
              <li>
                <a href="mailto:hello@travelcb.co.uk" className="flex items-start gap-3 group">
                  <Mail size={15} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/65 group-hover:text-white text-sm font-light transition-colors">
                    hello@travelcb.co.uk
                  </span>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/65 text-sm font-light">
                  United Kingdom<br />
                  <span className="text-white/40 text-xs">Serving clients worldwide</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Agent & Protection Disclosure */}
        <div className="border-t border-white/10 pt-8 mb-6">
          <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
            <div className="flex items-start gap-2">
              <Shield size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-white/50 text-xs font-light leading-relaxed max-w-xl">
                <span className="text-white/70 font-medium">CB Travel (Corron Barnes)</span> acts as an authorised independent travel agent operating under{" "}
                <span className="text-white/70 font-medium">JLT Group (Janine Loves Travel)</span>. Your contract for travel services is directly with the travel supplier.{" "}
                ATOL protected holidays via JLT Group — <span className="text-yellow-400 font-medium">ATOL No. 12564</span>.
              </p>
            </div>
          </div>
          <p className="text-white/35 text-xs font-light mt-3">
            Enquiries via WhatsApp are handled in accordance with our{" "}
            <Link href="/privacy-policy">
              <span className="text-white/50 hover:text-yellow-400 transition-colors cursor-pointer underline">Privacy Policy</span>
            </Link>. We never ask for card details via WhatsApp, SMS or email — payments are processed securely via Protected Trust Services using a secure payment link.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs font-light">
            © {currentYear} CB Travel (Corron Barnes T/A CB Travel). All rights reserved. United Kingdom.
          </p>
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <Link href="/privacy-policy">
              <span className="text-white/40 hover:text-yellow-400 text-xs font-light transition-colors cursor-pointer">
                Privacy Policy
              </span>
            </Link>
            <Link href="/cookie-policy">
              <span className="text-white/40 hover:text-yellow-400 text-xs font-light transition-colors cursor-pointer">
                Cookie Policy
              </span>
            </Link>
            <button
              onClick={() => { localStorage.removeItem("cb_cookie_consent"); window.location.reload(); }}
              className="text-white/40 hover:text-yellow-400 text-xs font-light transition-colors bg-transparent border-0 p-0 cursor-pointer"
            >
              Cookie Preferences
            </button>
            <Link href="/terms-conditions">
              <span className="text-white/40 hover:text-yellow-400 text-xs font-light transition-colors cursor-pointer">
                Terms &amp; Conditions
              </span>
            </Link>
            <Link href="/faq">
              <span className="text-white/40 hover:text-yellow-400 text-xs font-light transition-colors cursor-pointer">
                FAQ
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
