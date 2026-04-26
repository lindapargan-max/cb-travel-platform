import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  MapPin, Calendar, Users, CheckCircle, Clock, AlertTriangle,
  ArrowRight, Lock, Hotel, Plane, Star, ChevronDown, ChevronUp, ExternalLink,
  CheckCircle2, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

function ShimmerSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#0f2a4a] h-64 w-full" />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="bg-white rounded-2xl h-48 border border-border" />
        <div className="bg-white rounded-2xl h-32 border border-border" />
        <div className="bg-white rounded-2xl h-32 border border-border" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-slate-100 text-slate-600 border-slate-300" },
    sent: { label: "Sent", className: "bg-blue-100 text-blue-700 border-blue-300" },
    viewed: { label: "Viewed", className: "bg-amber-100 text-amber-700 border-amber-300" },
    accepted: { label: "Accepted ✓", className: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    expired: { label: "Expired", className: "bg-red-100 text-red-600 border-red-300" },
  };
  const b = map[status] || map.draft;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${b.className}`}>
      {b.label}
    </span>
  );
}

function AccordionSection({ title, icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-2xl overflow-hidden mb-3">
      <button
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2 font-semibold text-foreground">
          {icon}
          {title}
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-2 bg-white border-t border-border text-sm text-foreground">
          {children}
        </div>
      )}
    </div>
  );
}

export default function QuotePage() {
  const params = useParams();
  const ref = (params as any).ref as string;

  const { data: quote, isLoading } = trpc.adminQuotes.getByRef.useQuery(
    { ref },
    { enabled: !!ref }
  );

  const { data: user } = trpc.auth.me.useQuery();
  const trackView = trpc.adminQuotes.trackView.useMutation();
  const acceptMutation = trpc.adminQuotes.accept.useMutation({
    onSuccess: () => {
      setAccepted(true);
      setShowAcceptModal(false);
      toast.success("Quote accepted! Our team will be in touch within 24 hours.");
    },
    onError: (e) => toast.error(e.message || "Failed to accept quote"),
  });

  const [hasTracked, setHasTracked] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (quote && !hasTracked) {
      trackView.mutate({ id: quote.id });
      setHasTracked(true);
    }
  }, [quote, hasTracked]);

  if (isLoading) {
    return <ShimmerSkeleton />;
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={36} className="text-gray-400" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-3">Quote Not Found</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            We couldn't find this quote. This quote reference may be invalid or the link may have expired.
          </p>
          <Link href="/">
            <Button className="rounded-xl">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Compute expiry
  const daysLeft = quote.expiresAt
    ? Math.ceil((new Date(quote.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpired = quote.status === "expired" || (daysLeft !== null && daysLeft <= 0);
  const isAccepted = quote.status === "accepted" || accepted;

  // Parse JSON fields
  let hotels: any[] = [];
  let flights: any[] = [];
  try { hotels = JSON.parse((quote as any).hotels || "[]"); } catch {}
  try { flights = JSON.parse((quote as any).flightDetails || "[]"); } catch {}

  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Expired Banner */}
      {isExpired && !isAccepted && (
        <div className="bg-red-600 text-white text-center py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2">
          <AlertTriangle size={16} />
          This quote has expired. Please contact us for an updated quote.
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#0f2a4a] px-4 pt-20 pb-12">
        <div className="max-w-3xl mx-auto">
          {(quote as any).destination && (
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
              {(quote as any).destination}
            </h1>
          )}
          {((quote as any).departureDate || (quote as any).returnDate) && (
            <p className="text-blue-200 text-base mb-4 flex items-center gap-2">
              <Calendar size={15} />
              {(quote as any).departureDate && <span>{(quote as any).departureDate}</span>}
              {(quote as any).departureDate && (quote as any).returnDate && <span>→</span>}
              {(quote as any).returnDate && <span>{(quote as any).returnDate}</span>}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="font-mono text-[#f5c842] text-sm border border-[#f5c842]/40 px-3 py-1 rounded-full bg-[#f5c842]/10">
              {quote.quoteRef}
            </span>
            <StatusBadge status={isAccepted ? "accepted" : quote.status} />
            {daysLeft !== null && !isExpired && !isAccepted && (
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${daysLeft <= 5 ? "bg-red-100 text-red-600 border border-red-200" : "bg-amber-100 text-amber-700 border border-amber-200"}`}>
                <Clock size={11} className="inline mr-1" />
                Expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
              </span>
            )}
            {isExpired && !isAccepted && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-600 text-white border border-red-700">
                EXPIRED
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Not Logged In — Login Prompt */}
        {!isLoggedIn && (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock size={22} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-base mb-1">Log in to view your full quote</h3>
                <p className="text-sm text-muted-foreground mb-3">Including:</p>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li className="flex items-center gap-2"><CheckCircle size={13} className="text-primary flex-shrink-0" /> Complete itinerary</li>
                  <li className="flex items-center gap-2"><CheckCircle size={13} className="text-primary flex-shrink-0" /> Hotel &amp; flight information</li>
                  <li className="flex items-center gap-2"><CheckCircle size={13} className="text-primary flex-shrink-0" /> Accept and begin booking</li>
                </ul>
                <div className="flex items-center gap-3">
                  <a href="/login">
                    <Button size="sm" className="rounded-xl">Log In</Button>
                  </a>
                  <a href="/register">
                    <Button size="sm" variant="outline" className="rounded-xl">Create Account</Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Price Summary Card */}
        <div className={`bg-white rounded-2xl border border-border shadow-sm p-6 mb-6 ${!isLoggedIn ? "opacity-60 pointer-events-none" : ""}`}>
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">Price Summary</h2>
          {(quote as any).totalPrice && (
            <div className="mb-3">
              <p className="font-serif text-4xl font-bold text-[#1e3a5f]">
                £{parseFloat((quote as any).totalPrice).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {(quote as any).pricePerPerson && (
                <p className="text-muted-foreground text-sm mt-1">
                  From £{parseFloat((quote as any).pricePerPerson).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per person
                </p>
              )}
            </div>
          )}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4">
            <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Prices are live and subject to availability</strong> — not guaranteed until booking is confirmed with a deposit.
            </p>
          </div>
        </div>

        {/* Trip Overview — only show if logged in */}
        {isLoggedIn && (
          <div className={`mb-6 ${isExpired ? "opacity-60" : ""}`}>
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Trip Overview</h2>

            {flights.length > 0 && (
              <AccordionSection title="Flights" icon={<Plane size={16} className="text-primary" />} defaultOpen={true}>
                <div className="space-y-2">
                  {flights.map((f: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                      <Plane size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        {f.route && <p className="font-medium">{f.route}</p>}
                        {f.airline && <p className="text-muted-foreground text-xs">{f.airline}</p>}
                        {f.departure && <p className="text-muted-foreground text-xs">Dep: {f.departure}</p>}
                        {f.arrival && <p className="text-muted-foreground text-xs">Arr: {f.arrival}</p>}
                        {typeof f === "string" && <p>{f}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionSection>
            )}

            {hotels.length > 0 && (
              <AccordionSection title="Hotels" icon={<Hotel size={16} className="text-primary" />} defaultOpen={true}>
                <div className="space-y-2">
                  {hotels.map((h: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                      <Hotel size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        {h.name && <p className="font-medium">{h.name}</p>}
                        {h.location && <p className="text-muted-foreground text-xs flex items-center gap-1"><MapPin size={10} /> {h.location}</p>}
                        {h.nights && <p className="text-muted-foreground text-xs">{h.nights} nights</p>}
                        {h.roomType && <p className="text-muted-foreground text-xs">Room: {h.roomType}</p>}
                        {typeof h === "string" && <p>{h}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionSection>
            )}

            {(quote as any).keyInclusions && (
              <AccordionSection title="Key Inclusions" icon={<CheckCircle size={16} className="text-emerald-600" />} defaultOpen={true}>
                <div className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {(quote as any).keyInclusions}
                </div>
              </AccordionSection>
            )}

            {(quote as any).notes && (
              <AccordionSection title="Notes from Your Concierge" icon={<Star size={16} className="text-amber-500" />}>
                <div className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {(quote as any).notes}
                </div>
              </AccordionSection>
            )}
          </div>
        )}

        {/* Greyed out placeholder when not logged in */}
        {!isLoggedIn && (
          <div className="opacity-40 pointer-events-none select-none mb-6">
            <div className="bg-white rounded-2xl border border-border h-24 mb-3 flex items-center justify-center text-muted-foreground text-sm">✈️ Flight details hidden — log in to view</div>
            <div className="bg-white rounded-2xl border border-border h-24 mb-3 flex items-center justify-center text-muted-foreground text-sm">🏨 Hotel details hidden — log in to view</div>
          </div>
        )}

        {/* Action Buttons */}
        {isLoggedIn && !isExpired && !isAccepted && (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">Ready to Book?</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 rounded-xl bg-[#1e3a5f] hover:bg-[#0f2a4a] text-white"
                onClick={() => setShowAcceptModal(true)}
              >
                Accept This Quote <ArrowRight size={16} className="ml-1" />
              </Button>
              <a href={`mailto:info@cbtravel.uk?subject=Quote Changes - ${quote.quoteRef}`} className="flex-1">
                <Button variant="outline" className="w-full rounded-xl">
                  Request Changes
                </Button>
              </a>
            </div>
            <div className="flex justify-center mt-3">
              <a href="tel:07495823953" className="text-sm text-primary font-medium underline underline-offset-2">
                📞 Speak to Concierge: 07495 823953
              </a>
            </div>
          </div>
        )}

        {/* Expired CTA */}
        {isExpired && !isAccepted && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-center">
            <p className="text-red-700 font-semibold mb-3">This quote has expired</p>
            <p className="text-red-600 text-sm mb-4">Please contact us for an updated quote for your trip.</p>
            <a href="/quote-request">
              <Button variant="outline" className="rounded-xl border-red-300 text-red-700 hover:bg-red-100">
                Request New Quote
              </Button>
            </a>
          </div>
        )}

        {/* Accepted State */}
        {isAccepted && (
          <div className="mb-6">
            {/* Success banner */}
            <div className="bg-gradient-to-br from-[#1e3a5f] to-[#0f2a4a] rounded-2xl p-8 mb-5 text-center text-white">
              <CheckCircle2 size={52} className="text-emerald-400 mx-auto mb-4" />
              <h2 className="font-serif text-2xl font-bold mb-2">Your journey begins here…</h2>
              <p className="text-blue-200 text-sm leading-relaxed max-w-sm mx-auto">
                {user?.name ? `Thank you, ${user.name.split(" ")[0]}. ` : ""}
                You've accepted your quote for{(quote as any).destination ? ` ${(quote as any).destination}` : " your trip"}.
              </p>
            </div>

            {/* Intake form required — prominent CTA */}
            <div className="bg-white border-2 border-amber-300 rounded-2xl p-6 mb-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📋</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-lg font-bold text-foreground mb-1">
                    Complete your Booking Form — required next step
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    To confirm your reservation and begin arrangements, please complete our booking form now.
                    This allows us to finalise all the details for your trip. A final confirmed price will be
                    sent to you before any payment is taken.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-700 leading-relaxed">
                    <strong>Note on pricing:</strong> As travel prices are live and can change at any time, your final price
                    will be confirmed in writing by our concierge team before your booking is secured.
                    No payment will be taken without your explicit approval.
                  </div>
                  <a href={`/booking-intake?quoteRef=${(quote as any).quoteRef || ""}&destination=${encodeURIComponent((quote as any).destination || "")}`}>
                    <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1e3a5f] hover:bg-[#0f2a4a] text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg text-sm">
                      Complete Booking Form →
                    </button>
                  </a>
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-slate-50 rounded-2xl border border-border p-5">
              <h3 className="font-semibold text-sm text-foreground mb-3">What happens next:</h3>
              <ol className="space-y-2.5">
                {[
                  { n: "1", label: "You complete the booking form below", done: false, highlight: true },
                  { n: "2", label: "Our team reviews and confirms availability", done: false },
                  { n: "3", label: "We send you final pricing confirmation in writing", done: false },
                  { n: "4", label: "You approve — then we collect your deposit", done: false },
                  { n: "5", label: "Your adventure is confirmed! 🌍", done: false },
                ].map((step) => (
                  <li key={step.n} className={`flex items-start gap-3 text-sm ${step.highlight ? "font-semibold text-[#1e3a5f]" : "text-muted-foreground"}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${step.highlight ? "bg-amber-400 text-amber-900" : "bg-slate-200 text-slate-600"}`}>{step.n}</span>
                    {step.label}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Accept Confirmation Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="font-serif text-xl font-bold text-foreground mb-2">Accept this quote?</h2>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              By accepting, you confirm you'd like CB Travel to proceed with your trip
              {(quote as any).destination ? ` to ${(quote as any).destination}` : ""}. You'll then complete a short booking form — your final price will be confirmed before any payment is taken.
            </p>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Pricing may change — final price confirmed when booking is secured with a deposit.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowAcceptModal(false)}
                disabled={acceptMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl bg-[#1e3a5f] hover:bg-[#0f2a4a] text-white"
                onClick={() => acceptMutation.mutate({ id: quote.id })}
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending ? "Accepting…" : <>Yes, Accept Quote <ArrowRight size={14} className="ml-1" /></>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
