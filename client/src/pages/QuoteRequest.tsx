import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Phone, Mail, MapPin, Upload, Tag, FileText } from "lucide-react";
import { toast } from "sonner";
import { useSEO } from '@/hooks/useSEO';

const HERO_BG = "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=80&auto=format&fit=crop";

const getCurrencyForDestination = (dest: string): string => {
  const d = dest.toLowerCase();
  if (d.includes("maldives")) return "MVR";
  if (d.includes("dubai") || d.includes("uae") || d.includes("abu dhabi")) return "AED";
  if (d.includes("usa") || d.includes("america") || d.includes("new york") || d.includes("florida") || d.includes("orlando")) return "USD";
  if (d.includes("europe") || d.includes("spain") || d.includes("france") || d.includes("italy") || d.includes("greece") || d.includes("portugal") || d.includes("germany") || d.includes("amsterdam") || d.includes("paris") || d.includes("rome") || d.includes("barcelona") || d.includes("tenerife") || d.includes("lanzarote") || d.includes("mallorca") || d.includes("ibiza") || d.includes("menorca") || d.includes("fuerteventura") || d.includes("gran canaria")) return "EUR";
  if (d.includes("thailand") || d.includes("bangkok") || d.includes("phuket") || d.includes("koh samui")) return "THB";
  if (d.includes("bali") || d.includes("indonesia")) return "IDR";
  if (d.includes("mexico") || d.includes("cancun") || d.includes("tulum")) return "MXN";
  if (d.includes("caribbean") || d.includes("barbados") || d.includes("jamaica") || d.includes("bahamas") || d.includes("st lucia") || d.includes("antigua")) return "USD";
  if (d.includes("japan") || d.includes("tokyo") || d.includes("osaka")) return "JPY";
  if (d.includes("australia") || d.includes("sydney") || d.includes("melbourne")) return "AUD";
  if (d.includes("canada") || d.includes("toronto") || d.includes("vancouver")) return "CAD";
  if (d.includes("india") || d.includes("goa") || d.includes("mumbai") || d.includes("delhi")) return "INR";
  if (d.includes("turkey") || d.includes("antalya") || d.includes("istanbul") || d.includes("bodrum")) return "TRY";
  if (d.includes("egypt") || d.includes("sharm") || d.includes("hurghada")) return "EGP";
  if (d.includes("morocco") || d.includes("marrakech")) return "MAD";
  if (d.includes("kenya") || d.includes("safari") || d.includes("nairobi")) return "KES";
  if (d.includes("south africa") || d.includes("cape town") || d.includes("johannesburg")) return "ZAR";
  if (d.includes("new zealand")) return "NZD";
  if (d.includes("singapore")) return "SGD";
  return "GBP"; // default
};

const CURRENCY_FLAG: Record<string, string> = {
  GBP: "🇬🇧", EUR: "🇪🇺", USD: "🇺🇸", AED: "🇦🇪", MVR: "🇲🇻",
  THB: "🇹🇭", IDR: "🇮🇩", MXN: "🇲🇽", JPY: "🇯🇵", AUD: "🇦🇺",
  CAD: "🇨🇦", INR: "🇮🇳", TRY: "🇹🇷", EGP: "🇪🇬", MAD: "🇲🇦",
  KES: "🇰🇪", ZAR: "🇿🇦", NZD: "🇳🇿", SGD: "🇸🇬",
};

export default function QuoteRequest() {
  useSEO({
    title: 'Request a Quote',
    description: "Tell us your dream destination and we'll craft a personalised luxury travel quote just for you. No obligation, just inspiration.",
  });
  const { data: user } = trpc.auth.me.useQuery();
  const [submitted, setSubmitted] = useState(false);
  const [quoteMode, setQuoteMode] = useState<"new_quote" | "price_match">("new_quote");

  // Currency auto-detection
  const [detectedCurrency, setDetectedCurrency] = useState<string>("GBP");
  const [currencyBadgeVisible, setCurrencyBadgeVisible] = useState(false);
  const destDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoChecking, setPromoChecking] = useState(false);

  // Full quote form
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    travelType: "package_holiday",
    destination: "",
    numberOfTravelers: "2",
    departureDate: "",
    returnDate: "",
    budget: "",
    message: "",
  });

  // Price-match form
  const [pmForm, setPmForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    facility: "",
    message: "",
  });
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Destination debounce for currency detection
  useEffect(() => {
    if (destDebounceRef.current) clearTimeout(destDebounceRef.current);
    if (!form.destination.trim()) {
      setCurrencyBadgeVisible(false);
      return;
    }
    destDebounceRef.current = setTimeout(() => {
      const currency = getCurrencyForDestination(form.destination);
      setDetectedCurrency(currency);
      setCurrencyBadgeVisible(true);
    }, 500);
    return () => {
      if (destDebounceRef.current) clearTimeout(destDebounceRef.current);
    };
  }, [form.destination]);

  const createMutation = trpc.quotes.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Quote request submitted! We'll be in touch within 24 hours.");
    },
    onError: (e) => toast.error(e.message || "Failed to submit. Please try again."),
  });

  const validatePromoQuery = trpc.quotes.validatePromo.useQuery(
    { code: promoCode.trim().toUpperCase() },
    { enabled: false }
  );

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoChecking(true);
    setPromoError("");
    try {
      const result = await validatePromoQuery.refetch();
      if (result.data?.valid && result.data.discount !== undefined) {
        setAppliedPromo({ code: promoCode.trim().toUpperCase(), discount: result.data.discount });
        setPromoError("");
        toast.success(`Code applied! £${result.data.discount} off your booking 🎉`);
      } else {
        setPromoError(result.data?.message || "Invalid promotion code.");
        setAppliedPromo(null);
      }
    } catch {
      setPromoError("Unable to check code. Please try again.");
    } finally {
      setPromoChecking(false);
    }
  };

  const handleFullSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.name || !form.email) { toast.error("Please provide your name and email."); return; }
    if (!emailRegex.test(form.email)) { toast.error("Please enter a valid email address."); return; }
    createMutation.mutate({
      quoteType: "new_quote",
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      travelType: form.travelType,
      destination: form.destination || undefined,
      numberOfTravelers: form.numberOfTravelers ? parseInt(form.numberOfTravelers) : undefined,
      departureDate: form.departureDate || undefined,
      returnDate: form.returnDate || undefined,
      budget: form.budget || undefined,
      message: form.message || undefined,
      promoCode: appliedPromo?.code || undefined,
      userId: user?.id,
    });
  };

  const handlePriceMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pmForm.name || !pmForm.email) { toast.error("Please provide your name and email."); return; }
    if (!emailRegex.test(pmForm.email)) { toast.error("Please enter a valid email address."); return; }
    if (!pmForm.facility) { toast.error("Please tell us where you got your quote from."); return; }

    let screenshotData: string | undefined;
    let screenshotName: string | undefined;
    let screenshotMime: string | undefined;

    if (screenshotFile) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          screenshotData = result.split(",")[1];
          screenshotName = screenshotFile.name;
          screenshotMime = screenshotFile.type;
          resolve();
        };
        reader.readAsDataURL(screenshotFile);
      });
    }

    createMutation.mutate({
      quoteType: "price_match",
      name: pmForm.name,
      email: pmForm.email,
      travelType: "other",
      destination: pmForm.facility,
      message: pmForm.message || undefined,
      screenshotData,
      screenshotName,
      screenshotMime,
      userId: user?.id,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 pt-20">
        <div className="max-w-md w-full mx-auto text-center px-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-3">
            {quoteMode === "price_match" ? "Price Match Request Sent!" : "Quote Request Sent!"}
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-8">
            {quoteMode === "price_match"
              ? "Thank you! Our team will review your quote and get back to you within 24 hours to see if we can beat or match it."
              : "Thank you for reaching out. One of our travel specialists will review your request and contact you within 24 hours with a personalised quote."}
          </p>
          <div className="bg-white rounded-2xl border border-border p-5 mb-8 text-left space-y-3">
            <p className="text-sm font-semibold text-foreground">What happens next?</p>
            {(quoteMode === "price_match"
              ? ["We review your existing quote", "Our team searches for better pricing", "A specialist contacts you within 24 hours", "We aim to beat or match your price"]
              : ["Our team reviews your request", "We research the best options for you", "A specialist contacts you within 24 hours", "We craft your perfect itinerary"]
            ).map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">{i + 1}</div>
                <span className="text-sm text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/"><Button className="w-full rounded-full btn-gold border-0 text-foreground">Back to Home</Button></Link>
            {user && <Link href="/dashboard"><Button variant="outline" className="w-full rounded-full border-primary text-primary hover:bg-primary hover:text-white">View My Quotes</Button></Link>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img src={HERO_BG} alt="Travel" className="w-full h-full object-cover" />
        <div className="hero-overlay absolute inset-0" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center pt-20">
          <p className="text-xs font-semibold tracking-widest text-yellow-400 uppercase mb-3">Free Service</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3">Request a Quote</h1>
          <p className="text-white/80 max-w-lg text-lg font-light">
            Tell us about your dream holiday and we'll craft the perfect itinerary for you.
          </p>
        </div>
      </div>

      <div className="container py-16">
        <div className="max-w-3xl mx-auto">

          {/* Mode Toggle */}
          <div className="mb-8">
            <div className="bg-white border border-border rounded-2xl p-1.5 flex gap-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => setQuoteMode("new_quote")}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${quoteMode === "new_quote" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}
              >
                <FileText size={16} />
                Request a New Quote
              </button>
              <button
                type="button"
                onClick={() => setQuoteMode("price_match")}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${quoteMode === "price_match" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}
              >
                <Tag size={16} />
                Price Match / Beat a Quote
              </button>
            </div>
            {quoteMode === "price_match" && (
              <p className="text-sm text-muted-foreground mt-3 text-center">
                Already have a quote? Share it with us and we'll try to beat or match it — completely free.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-border shadow-sm p-8">

                {/* ── NEW QUOTE FORM ── */}
                {quoteMode === "new_quote" && (
                  <>
                    <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Your Travel Details</h2>
                    <form onSubmit={handleFullSubmit} className="space-y-5" noValidate>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Full Name <span className="text-destructive">*</span></Label>
                          <Input placeholder="John Smith" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="rounded-xl" required />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Email Address <span className="text-destructive">*</span></Label>
                          <Input type="text" inputMode="email" placeholder="hello@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Phone Number</Label>
                          <Input type="tel" placeholder="07700 900000" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Travel Type</Label>
                          <Select value={form.travelType} onValueChange={v => setForm({...form, travelType: v})}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="package_holiday">Package Holiday</SelectItem>
                              <SelectItem value="cruise">Cruise</SelectItem>
                              <SelectItem value="city_break">City Break</SelectItem>
                              <SelectItem value="luxury">Luxury Escape</SelectItem>
                              <SelectItem value="adventure">Adventure Travel</SelectItem>
                              <SelectItem value="business_travel">Business Travel</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Destination</Label>
                        <Input
                          placeholder="e.g. Maldives, Caribbean, Dubai..."
                          value={form.destination}
                          onChange={e => setForm({...form, destination: e.target.value})}
                          className="rounded-xl"
                        />
                        {currencyBadgeVisible && detectedCurrency && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-700">
                              {CURRENCY_FLAG[detectedCurrency] || "💱"} Suggested currency: <strong>{detectedCurrency}</strong>
                            </span>
                            <span className="text-xs text-muted-foreground">We'll always quote you in GBP</span>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label>Travellers</Label>
                          <Input type="number" min="1" value={form.numberOfTravelers} onChange={e => setForm({...form, numberOfTravelers: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Departure Date</Label>
                          <Input type="date" value={form.departureDate} onChange={e => setForm({...form, departureDate: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Return Date</Label>
                          <Input type="date" value={form.returnDate} onChange={e => setForm({...form, returnDate: e.target.value})} className="rounded-xl" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>
                          Approximate Budget (per person)
                          {currencyBadgeVisible && detectedCurrency !== "GBP" && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              — Budget — suggested currency: {detectedCurrency} {CURRENCY_FLAG[detectedCurrency] || ""} <span className="text-blue-600">(we'll quote in GBP)</span>
                            </span>
                          )}
                        </Label>
                        <Input placeholder="e.g. £1,000–£2,000 pp" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Additional Information</Label>
                        <Textarea
                          placeholder="Tell us more about your dream holiday — special occasions, preferences, accessibility needs, etc."
                          value={form.message}
                          onChange={e => setForm({...form, message: e.target.value})}
                          className="rounded-xl resize-none"
                          rows={4}
                        />
                      </div>
                      {/* Promo Code */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Promotion Code (optional)</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter code e.g. SAVE50"
                            value={promoCode}
                            onChange={e => { setPromoCode(e.target.value.toUpperCase()); setAppliedPromo(null); setPromoError(""); }}
                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleApplyPromo())}
                            className="rounded-xl uppercase font-mono"
                            maxLength={30}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleApplyPromo}
                            disabled={!promoCode.trim() || promoChecking}
                            className="rounded-xl shrink-0 px-4"
                          >
                            {promoChecking ? "..." : "Apply"}
                          </Button>
                        </div>
                        {appliedPromo && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                            <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                            <p className="text-sm text-green-700 font-semibold">
                              🎉 <span className="font-mono">{appliedPromo.code}</span> applied — £{appliedPromo.discount} will be taken off your booking!
                            </p>
                          </div>
                        )}
                        {promoError && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <span>✗</span> {promoError}
                          </p>
                        )}
                      </div>

                      <Button type="submit" className="w-full h-12 rounded-xl btn-gold border-0 text-foreground font-semibold text-base" disabled={createMutation.isPending}>
                        {createMutation.isPending ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />Submitting...</span> : "Submit Quote Request"}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">This service is completely free. We'll contact you within 24 hours.</p>
                    </form>
                  </>
                )}

                {/* ── PRICE MATCH FORM ── */}
                {quoteMode === "price_match" && (
                  <>
                    <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Price Match Request</h2>
                    <p className="text-sm text-muted-foreground mb-6">Share your existing quote and we'll do our best to beat or match it.</p>
                    <form onSubmit={handlePriceMatchSubmit} className="space-y-5" noValidate>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Full Name <span className="text-destructive">*</span></Label>
                          <Input placeholder="John Smith" value={pmForm.name} onChange={e => setPmForm({...pmForm, name: e.target.value})} className="rounded-xl" required />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Email Address <span className="text-destructive">*</span></Label>
                          <Input type="text" inputMode="email" placeholder="hello@example.com" value={pmForm.email} onChange={e => setPmForm({...pmForm, email: e.target.value})} className="rounded-xl" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Where did you get your quote? <span className="text-destructive">*</span></Label>
                        <Input
                          placeholder="e.g. TUI, Jet2, Thomas Cook, another travel agent..."
                          value={pmForm.facility}
                          onChange={e => setPmForm({...pmForm, facility: e.target.value})}
                          className="rounded-xl"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Upload Your Quote Screenshot <span className="text-muted-foreground text-xs font-normal">(optional but helpful)</span></Label>
                        <div
                          className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
                          onClick={() => fileRef.current?.click()}
                        >
                          <Upload size={22} className="mx-auto text-muted-foreground mb-2" />
                          {screenshotFile ? (
                            <div>
                              <p className="text-sm font-medium text-foreground">{screenshotFile.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{(screenshotFile.size / 1024).toFixed(0)} KB · Click to change</p>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-foreground">Click to upload screenshot</p>
                              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF accepted</p>
                            </>
                          )}
                          <input
                            ref={fileRef}
                            type="file"
                            className="hidden"
                            accept=".png,.jpg,.jpeg,.pdf,.webp"
                            onChange={e => setScreenshotFile(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Any other information <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                        <Textarea
                          placeholder="e.g. destination, travel dates, number of travellers, any special requirements..."
                          value={pmForm.message}
                          onChange={e => setPmForm({...pmForm, message: e.target.value})}
                          className="rounded-xl resize-none"
                          rows={4}
                        />
                      </div>
                      <Button type="submit" className="w-full h-12 rounded-xl btn-gold border-0 text-foreground font-semibold text-base" disabled={createMutation.isPending}>
                        {createMutation.isPending ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />Submitting...</span> : "Submit Price Match Request"}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">Completely free — we'll be in touch within 24 hours.</p>
                    </form>
                  </>
                )}

              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="bg-primary rounded-2xl p-6 text-white">
                <h3 className="font-serif text-lg font-semibold mb-4">Contact Us Directly</h3>
                <div className="space-y-4">
                  <a href="tel:07495823953" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0"><Phone size={15} /></div>
                    <div>
                      <p className="text-xs text-white/60">Call us</p>
                      <p className="font-semibold text-sm group-hover:text-yellow-400 transition-colors">07495 823953</p>
                    </div>
                  </a>
                  <a href="mailto:hello@travelcb.co.uk" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0"><Mail size={15} /></div>
                    <div>
                      <p className="text-xs text-white/60">Email us</p>
                      <p className="font-semibold text-sm group-hover:text-yellow-400 transition-colors">hello@travelcb.co.uk</p>
                    </div>
                  </a>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0"><MapPin size={15} /></div>
                    <div>
                      <p className="text-xs text-white/60">Based in</p>
                      <p className="font-semibold text-sm">United Kingdom</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-3 text-sm">Why use CB Travel?</h3>
                <ul className="space-y-2.5">
                  {[
                    "Completely free quote service",
                    "Response within 24 hours",
                    "300+ trusted suppliers",
                    "Personalised itineraries",
                    "Best price guarantee",
                    "ATOL protected",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {quoteMode === "price_match" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Tag size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-800 mb-1">Price Match Promise</p>
                      <p className="text-xs text-yellow-700 leading-relaxed">We'll do everything we can to beat or match any like-for-like quote. Simply share your existing quote and leave the rest to us.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ready to book? */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-5">
                <p className="text-sm font-semibold text-foreground mb-2">Ready to book?</p>
                <p className="text-xs text-muted-foreground mb-3">Already decided on your holiday? Fill in our full booking intake form and we'll confirm everything within 24 hours.</p>
                <Link href="/booking-intake">
                  <Button size="sm" className="w-full rounded-xl btn-gold border-0 text-foreground text-xs">
                    ✈️ Submit Booking Form
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
