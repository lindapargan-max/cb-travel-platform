import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { X, Shield, ChevronDown, ChevronUp } from "lucide-react";

// --- Types ---
interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const CONSENT_KEY = "cb_cookie_consent";

// --- Hook: useCookieConsent ---
export function useCookieConsent(): CookieConsent | null {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored) {
        setConsent(JSON.parse(stored));
      }
    } catch {
      setConsent(null);
    }
  }, []);

  return consent;
}

/**
 * Helper to check if a specific cookie category is consented.
 * Returns false if no consent has been given yet.
 */
export function hasConsent(category: keyof Omit<CookieConsent, "timestamp">): boolean {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return false;
    const consent: CookieConsent = JSON.parse(stored);
    return consent[category] === true;
  } catch {
    return false;
  }
}

// --- Facebook Embed Placeholder ---
export function FacebookEmbed({
  pageUrl,
  width = 340,
  height = 500,
}: {
  pageUrl: string;
  width?: number;
  height?: number;
}) {
  const consent = useCookieConsent();
  const marketingAllowed = consent?.marketing === true;

  if (!marketingAllowed) {
    return (
      <div
        className="rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center p-6"
        style={{
          width,
          minHeight: height,
          borderColor: "#1e3a5f",
          backgroundColor: "#f0f4f8",
        }}
      >
        <Shield className="w-8 h-8 mb-3" style={{ color: "#1e3a5f" }} />
        <p className="text-sm font-semibold mb-1" style={{ color: "#1e3a5f" }}>
          Facebook Content Blocked
        </p>
        <p className="text-xs text-gray-600 mb-3">
          This content is blocked because it uses cookies that require your
          consent. To view our Facebook page feed, please accept marketing
          cookies.
        </p>
        <button
          onClick={() => {
            // Scroll to bottom / re-show banner by clearing consent
            localStorage.removeItem(CONSENT_KEY);
            window.location.reload();
          }}
          className="text-xs underline font-medium"
          style={{ color: "#d4af37" }}
        >
          Manage Cookie Preferences
        </button>
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-xs underline"
          style={{ color: "#1e3a5f" }}
        >
          Visit our Facebook page directly →
        </a>
      </div>
    );
  }

  return (
    <iframe
      src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(pageUrl)}&tabs=timeline&width=${width}&height=${height}&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true`}
      width={width}
      height={height}
      style={{ border: "none", overflow: "hidden" }}
      scrolling="no"
      frameBorder="0"
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      title="CB Travel Facebook Page"
    />
  );
}

// --- Cookie Banner Component ---
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const saveConsent = useCallback(
    (consent: CookieConsent) => {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
      setVisible(false);

      // If marketing consent was revoked, remove any Facebook cookies
      if (!consent.marketing) {
        // Remove known Facebook cookies
        document.cookie.split(";").forEach((c) => {
          const name = c.trim().split("=")[0];
          if (
            name.startsWith("_fb") ||
            name.startsWith("fr") ||
            name.startsWith("datr")
          ) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      }

      // Reload so that embeds respect the new consent
      window.location.reload();
    },
    []
  );

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSavePreferences = () => {
    saveConsent({
      essential: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
    });
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] shadow-2xl border-t-2"
      style={{
        backgroundColor: "#1e3a5f",
        borderTopColor: "#d4af37",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-5 sm:px-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 flex-shrink-0" style={{ color: "#d4af37" }} />
            <h2 className="text-white font-semibold text-base">
              Your Privacy Matters
            </h2>
          </div>
          <button
            onClick={handleRejectNonEssential}
            className="text-gray-300 hover:text-white p-1"
            aria-label="Close and reject non-essential cookies"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-200 text-sm leading-relaxed mb-4">
          We use essential cookies to make our site work. We'd also like to use
          non-essential cookies to improve your experience and show social media
          content. You can choose which cookies you'd like to allow. For more
          information, please read our{" "}
          <Link
            href="/privacy-policy"
            className="underline font-medium"
            style={{ color: "#d4af37" }}
          >
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link
            href="/cookie-policy"
            className="underline font-medium"
            style={{ color: "#d4af37" }}
          >
            Cookie Policy
          </Link>
          .
        </p>

        {/* Preference toggles */}
        {showPreferences && (
          <div className="mb-4 rounded-lg p-4" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <div className="space-y-3">
              {/* Essential */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-medium text-sm">
                    Essential Cookies
                  </span>
                  <p className="text-gray-300 text-xs">
                    Required for the site to function (authentication, security).
                    Always active.
                  </p>
                </div>
                <div
                  className="w-11 h-6 rounded-full flex items-center px-0.5 cursor-not-allowed opacity-70"
                  style={{ backgroundColor: "#d4af37" }}
                >
                  <div className="w-5 h-5 rounded-full bg-white ml-auto" />
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-medium text-sm">
                    Analytics Cookies
                  </span>
                  <p className="text-gray-300 text-xs">
                    Help us understand how visitors use our site. Currently none
                    in use but reserved for future use.
                  </p>
                </div>
                <button
                  onClick={() => setAnalytics(!analytics)}
                  className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors"
                  style={{
                    backgroundColor: analytics ? "#d4af37" : "#4b5563",
                  }}
                  role="switch"
                  aria-checked={analytics}
                  aria-label="Toggle analytics cookies"
                >
                  <div
                    className="w-5 h-5 rounded-full bg-white transition-transform"
                    style={{
                      transform: analytics
                        ? "translateX(20px)"
                        : "translateX(0px)",
                    }}
                  />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-medium text-sm">
                    Marketing / Social Media Cookies
                  </span>
                  <p className="text-gray-300 text-xs">
                    Used by Facebook to display our social media feed and for
                    advertising. Enabling this loads third-party content.
                  </p>
                </div>
                <button
                  onClick={() => setMarketing(!marketing)}
                  className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors"
                  style={{
                    backgroundColor: marketing ? "#d4af37" : "#4b5563",
                  }}
                  role="switch"
                  aria-checked={marketing}
                  aria-label="Toggle marketing cookies"
                >
                  <div
                    className="w-5 h-5 rounded-full bg-white transition-transform"
                    style={{
                      transform: marketing
                        ? "translateX(20px)"
                        : "translateX(0px)",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleAcceptAll}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors hover:opacity-90"
            style={{ backgroundColor: "#d4af37", color: "#1e3a5f" }}
          >
            Accept All
          </button>
          <button
            onClick={handleRejectNonEssential}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm border transition-colors hover:bg-white/10"
            style={{ borderColor: "#d4af37", color: "#d4af37" }}
          >
            Reject Non-Essential
          </button>
          <button
            onClick={() => {
              if (showPreferences) {
                handleSavePreferences();
              } else {
                setShowPreferences(true);
              }
            }}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1 transition-colors hover:bg-white/10"
            style={{ color: "#d4af37" }}
          >
            {showPreferences ? (
              <>Save Preferences</>
            ) : (
              <>
                Manage Preferences{" "}
                {showPreferences ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
