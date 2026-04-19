import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Compass, Home, MessageCircle } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

export default function NotFound() {
  useSEO({ title: 'Page Not Found', noIndex: true });

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center pt-20">
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg, #020917 0%, #08142a 40%, #0d2137 70%, #071520 100%)',
        }}
      />

      {/* Decorative orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl z-0"
        style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl z-0"
        style={{ background: 'radial-gradient(circle, #1e4d7a, transparent)' }}
      />

      {/* Stars */}
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white z-0"
          style={{
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            top: `${Math.random() * 80}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.2,
            animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-xl mx-auto animate-fade-in">
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#d4af37]/30"
          style={{ background: 'rgba(212, 175, 55, 0.08)' }}
        >
          <Compass size={36} className="text-[#d4af37]" style={{ animation: 'spin 8s linear infinite' }} />
        </div>

        {/* 404 */}
        <p className="text-[#d4af37]/60 text-xs tracking-[6px] uppercase font-semibold mb-3">Error 404</p>
        <h1
          className="font-serif text-7xl md:text-8xl font-bold mb-4 leading-none"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #d4af37 50%, #ffffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Lost at Sea
        </h1>

        <p className="text-white/50 text-xs tracking-[4px] uppercase mb-6">This page has sailed away</p>

        <p className="text-white/70 text-base leading-relaxed mb-10 font-light max-w-sm mx-auto">
          It seems this destination doesn't exist on our map. Let us guide you back to somewhere spectacular.
        </p>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10 justify-center">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#d4af37]/40" />
          <span className="text-[#d4af37]/60 text-xs">✦</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#d4af37]/40" />
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button
              className="rounded-full px-8 gap-2 text-sm font-semibold border-0"
              style={{
                background: 'linear-gradient(135deg, #d4af37, #b8942e)',
                color: '#020917',
              }}
            >
              <Home size={15} />
              Return Home
            </Button>
          </Link>
          <Link href="/quote-request">
            <Button
              variant="outline"
              className="rounded-full px-8 gap-2 text-sm font-semibold border-[#d4af37]/40 text-white hover:bg-white/10 hover:border-[#d4af37]/60"
            >
              Plan a Trip
            </Button>
          </Link>
          <a href="tel:07495823953">
            <Button
              variant="ghost"
              className="rounded-full px-8 gap-2 text-sm text-white/60 hover:text-white hover:bg-white/10"
            >
              <MessageCircle size={15} />
              Contact Us
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
