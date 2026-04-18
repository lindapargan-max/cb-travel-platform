import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, ChevronRight, ChevronLeft, Plane, MapPin, Users, Settings2, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

const STEPS = [
  { id: 1, label: "Lead Traveller", icon: Users },
  { id: 2, label: "Your Holiday", icon: Plane },
  { id: 3, label: "Extra Travellers", icon: Users },
  { id: 4, label: "Preferences", icon: Settings2 },
  { id: 5, label: "Final Details", icon: FileText },
];

const AIRPORTS = [
  "London Heathrow (LHR)",
  "London Gatwick (LGW)",
  "Manchester (MAN)",
  "Birmingham (BHX)",
  "Edinburgh (EDI)",
  "Glasgow (GLA)",
  "Bristol (BRS)",
  "Leeds Bradford (LBA)",
  "Other",
];

interface AdditionalTraveller {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber: string;
  passportExpiry: string;
}

export default function BookingIntakeForm() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submissionRef, setSubmissionRef] = useState("");
  const [leadFirstName, setLeadFirstName] = useState("");

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [passportIssuingCountry, setPassportIssuingCountry] = useState("");
  const [address, setAddress] = useState("");

  // Step 2
  const [destination, setDestination] = useState("");
  const [departureAirport, setDepartureAirport] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [flexibleDates, setFlexibleDates] = useState(false);
  const [numberOfAdults, setNumberOfAdults] = useState(1);
  const [numberOfChildren, setNumberOfChildren] = useState(0);
  const [childAges, setChildAges] = useState("");

  // Step 3 — additional travellers
  const [additionalTravellers, setAdditionalTravellers] = useState<AdditionalTraveller[]>([]);

  // Step 4
  const [holidayType, setHolidayType] = useState("");
  const [accommodationType, setAccommodationType] = useState("");
  const [boardBasis, setBoardBasis] = useState("");
  const [roomType, setRoomType] = useState("");
  const [budget, setBudget] = useState("");
  const [dietaryRequirements, setDietaryRequirements] = useState("");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("");
  const [specialOccasion, setSpecialOccasion] = useState("");
  const [otherRequests, setOtherRequests] = useState("");

  // Step 5
  const [paymentMethod, setPaymentMethod] = useState("");
  const [heardAboutUs, setHeardAboutUs] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const submitMutation = trpc.intake.submit.useMutation({
    onSuccess: (data) => {
      setSubmissionRef(data.submissionRef || "");
      setLeadFirstName(firstName);
      setSubmitted(true);
    },
    onError: (e) => {
      toast.error("Failed to submit: " + e.message);
    },
  });

  const totalSteps = numberOfAdults > 1 ? 5 : 5; // always 5, step 3 shown if adults > 1

  const validateStep = () => {
    if (step === 1) {
      if (!firstName.trim()) { toast.error("First name is required"); return false; }
      if (!lastName.trim()) { toast.error("Last name is required"); return false; }
      if (!email.trim()) { toast.error("Email is required"); return false; }
      if (!phone.trim()) { toast.error("Phone number is required"); return false; }
    }
    if (step === 2) {
      if (!destination.trim()) { toast.error("Destination is required"); return false; }
      if (numberOfAdults < 1) { toast.error("At least 1 adult is required"); return false; }
    }
    if (step === 5) {
      if (!agreedToTerms) { toast.error("Please agree to the terms and conditions"); return false; }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    if (step === 2 && numberOfAdults <= 1) {
      // skip step 3 if only 1 adult
      setStep(4);
    } else {
      setStep(s => Math.min(s + 1, 5));
    }
  };

  const prevStep = () => {
    if (step === 4 && numberOfAdults <= 1) {
      setStep(2);
    } else {
      setStep(s => Math.max(s - 1, 1));
    }
  };

  const addTraveller = () => {
    if (additionalTravellers.length >= numberOfAdults - 1) return;
    setAdditionalTravellers(prev => [...prev, { firstName: "", lastName: "", dateOfBirth: "", passportNumber: "", passportExpiry: "" }]);
  };

  const removeTraveller = (idx: number) => {
    setAdditionalTravellers(prev => prev.filter((_, i) => i !== idx));
  };

  const updateTraveller = (idx: number, field: keyof AdditionalTraveller, value: string) => {
    setAdditionalTravellers(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const handleSubmit = () => {
    if (!agreedToTerms) { toast.error("Please agree to the terms and conditions"); return; }
    submitMutation.mutate({
      leadFirstName: firstName,
      leadLastName: lastName,
      email,
      phone,
      dateOfBirth: dateOfBirth || undefined,
      passportNumber: passportNumber || undefined,
      passportExpiry: passportExpiry || undefined,
      passportIssuingCountry: passportIssuingCountry || undefined,
      nationality: nationality || undefined,
      address: address || undefined,
      destination,
      departureAirport: departureAirport || undefined,
      departureDate: departureDate || undefined,
      returnDate: returnDate || undefined,
      flexibleDates,
      numberOfAdults,
      numberOfChildren,
      childAges: childAges || undefined,
      additionalTravellers: additionalTravellers.length > 0 ? additionalTravellers : undefined,
      holidayType: holidayType || undefined,
      accommodationType: accommodationType || undefined,
      boardBasis: boardBasis || undefined,
      roomType: roomType || undefined,
      budget: budget || undefined,
      dietaryRequirements: dietaryRequirements || undefined,
      accessibilityNeeds: accessibilityNeeds || undefined,
      specialOccasion: specialOccasion || undefined,
      otherRequests: otherRequests || undefined,
      paymentMethod: paymentMethod || undefined,
      heardAboutUs: heardAboutUs || undefined,
      agreedToTerms,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary to-slate-800 flex items-center justify-center p-4 pt-24">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Thank you, {leadFirstName}!
          </h1>
          <p className="text-muted-foreground mb-4">Your booking request has been received.</p>
          <div className="bg-primary/8 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-1">Your reference number</p>
            <p className="font-mono font-bold text-primary text-xl">{submissionRef}</p>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            A member of our team will be in touch within <strong>24 hours</strong> to confirm your booking and discuss the next steps.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
            <span>📧</span>
            <a href="mailto:info@travelcb.co.uk" className="text-primary hover:underline font-medium">info@travelcb.co.uk</a>
          </div>
          <Link href="/">
            <Button className="w-full rounded-xl btn-gold border-0 text-foreground">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const progressPct = ((step - 1) / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary/90 to-slate-800 pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-primary/30 text-sm font-medium tracking-widest uppercase mb-2">CB Travel</p>
          <h1 className="font-serif text-4xl font-bold text-white mb-2">Booking Form</h1>
          <p className="text-white/70">Fill in your details and our team will confirm your booking within 24 hours.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {STEPS.map((s) => {
              const isActive = s.id === step;
              const isDone = s.id < step || (s.id === 3 && numberOfAdults <= 1);
              const isSkipped = s.id === 3 && numberOfAdults <= 1;
              return (
                <div key={s.id} className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isActive ? "bg-white text-primary shadow-lg scale-110" :
                    isDone && !isSkipped ? "bg-green-400 text-white" :
                    isSkipped ? "bg-white/20 text-white/30" :
                    "bg-white/20 text-white/50"
                  }`}>
                    {isDone && !isSkipped && s.id !== step ? <CheckCircle2 size={16} /> : s.id}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isActive ? "text-white" : "text-white/50"}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
          <div className="w-full bg-white/20 rounded-full h-1.5">
            <div className="bg-white rounded-full h-1.5 transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-1">Lead Traveller Details</h2>
                <p className="text-muted-foreground text-sm">Tell us about the main person on the booking.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="Smith" value={lastName} onChange={e => setLastName(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Address <span className="text-red-500">*</span></Label>
                  <Input type="email" placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number <span className="text-red-500">*</span></Label>
                  <Input type="tel" placeholder="+44 7700 900000" value={phone} onChange={e => setPhone(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Nationality</Label>
                  <Input placeholder="British" value={nationality} onChange={e => setNationality(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Passport Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Passport Number</Label>
                    <Input placeholder="123456789" value={passportNumber} onChange={e => setPassportNumber(e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Expiry Date</Label>
                    <Input type="date" value={passportExpiry} onChange={e => setPassportExpiry(e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Issuing Country</Label>
                    <Input placeholder="United Kingdom" value={passportIssuingCountry} onChange={e => setPassportIssuingCountry(e.target.value)} className="rounded-xl" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Home Address</Label>
                <Textarea placeholder="123 High Street, London, SW1A 1AA" value={address} onChange={e => setAddress(e.target.value)} className="rounded-xl resize-none" rows={2} />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-1">Your Holiday</h2>
                <p className="text-muted-foreground text-sm">Tell us where you'd like to go and when.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Destination <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. Maldives, Dubai, Bali" value={destination} onChange={e => setDestination(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Departure Airport</Label>
                <Select value={departureAirport} onValueChange={setDepartureAirport}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select airport" /></SelectTrigger>
                  <SelectContent>
                    {AIRPORTS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Departure Date</Label>
                  <Input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Return Date</Label>
                  <Input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                <input
                  type="checkbox"
                  id="flexDates"
                  checked={flexibleDates}
                  onChange={e => setFlexibleDates(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <Label htmlFor="flexDates" className="cursor-pointer">I'm flexible with my travel dates</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Number of Adults <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={numberOfAdults}
                    onChange={e => setNumberOfAdults(parseInt(e.target.value) || 1)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Number of Children</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={numberOfChildren}
                    onChange={e => setNumberOfChildren(parseInt(e.target.value) || 0)}
                    className="rounded-xl"
                  />
                </div>
              </div>
              {numberOfChildren > 0 && (
                <div className="space-y-1.5">
                  <Label>Child Ages</Label>
                  <Input
                    placeholder="e.g. 3, 7, 12"
                    value={childAges}
                    onChange={e => setChildAges(e.target.value)}
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">Enter ages separated by commas</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-1">Additional Travellers</h2>
                <p className="text-muted-foreground text-sm">
                  You have {numberOfAdults} adults. Add details for the other {numberOfAdults - 1} traveller{numberOfAdults - 1 !== 1 ? "s" : ""}.
                </p>
              </div>
              {additionalTravellers.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No additional travellers added yet.</p>
                </div>
              )}
              {additionalTravellers.map((t, idx) => (
                <div key={idx} className="p-4 bg-muted/20 rounded-2xl border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">Traveller {idx + 2}</p>
                    <button onClick={() => removeTraveller(idx)} className="text-destructive hover:text-destructive/80"><Trash2 size={15} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>First Name</Label>
                      <Input placeholder="First name" value={t.firstName} onChange={e => updateTraveller(idx, "firstName", e.target.value)} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Last Name</Label>
                      <Input placeholder="Last name" value={t.lastName} onChange={e => updateTraveller(idx, "lastName", e.target.value)} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date of Birth</Label>
                      <Input type="date" value={t.dateOfBirth} onChange={e => updateTraveller(idx, "dateOfBirth", e.target.value)} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Passport Number</Label>
                      <Input placeholder="123456789" value={t.passportNumber} onChange={e => updateTraveller(idx, "passportNumber", e.target.value)} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label>Passport Expiry</Label>
                      <Input type="date" value={t.passportExpiry} onChange={e => updateTraveller(idx, "passportExpiry", e.target.value)} className="rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
              {additionalTravellers.length < numberOfAdults - 1 && (
                <Button variant="outline" onClick={addTraveller} className="w-full rounded-xl gap-2">
                  <Plus size={15} /> Add Traveller {additionalTravellers.length + 2}
                </Button>
              )}
              {additionalTravellers.length >= numberOfAdults - 1 && numberOfAdults > 1 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                  <CheckCircle2 size={15} /> All {numberOfAdults - 1} additional traveller{numberOfAdults - 1 !== 1 ? "s" : ""} added!
                </div>
              )}
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-1">Preferences & Requirements</h2>
                <p className="text-muted-foreground text-sm">Help us tailor your perfect holiday.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Holiday Type</Label>
                  <Select value={holidayType} onValueChange={setHolidayType}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {["Package Holiday","Cruise","City Break","Beach Holiday","Adventure","Safari","Ski","Other"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Accommodation Type</Label>
                  <Select value={accommodationType} onValueChange={setAccommodationType}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {["Hotel","Resort","Villa","Apartment","Cabin/Lodge","Other"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Board Basis</Label>
                  <Select value={boardBasis} onValueChange={setBoardBasis}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select basis" /></SelectTrigger>
                    <SelectContent>
                      {["Room Only","Bed & Breakfast","Half Board","Full Board","All Inclusive"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Room Type</Label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select room" /></SelectTrigger>
                    <SelectContent>
                      {["Standard","Superior","Deluxe","Suite","Family Room"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Approximate Budget</Label>
                  <Select value={budget} onValueChange={setBudget}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select budget range" /></SelectTrigger>
                    <SelectContent>
                      {["Under £1,000","£1,000-£2,500","£2,500-£5,000","£5,000-£10,000","£10,000+","Flexible"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Dietary Requirements</Label>
                <Textarea placeholder="e.g. Vegetarian, Gluten-free, Halal..." value={dietaryRequirements} onChange={e => setDietaryRequirements(e.target.value)} className="rounded-xl resize-none" rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Accessibility / Mobility Needs</Label>
                <Textarea placeholder="e.g. Wheelchair accessible room, ground floor..." value={accessibilityNeeds} onChange={e => setAccessibilityNeeds(e.target.value)} className="rounded-xl resize-none" rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Special Occasion</Label>
                <Input placeholder="e.g. Honeymoon, Anniversary, Birthday..." value={specialOccasion} onChange={e => setSpecialOccasion(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Any Other Requests</Label>
                <Textarea placeholder="Anything else you'd like us to know..." value={otherRequests} onChange={e => setOtherRequests(e.target.value)} className="rounded-xl resize-none" rows={3} />
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-1">Final Details</h2>
                <p className="text-muted-foreground text-sm">Almost done! Just a few last questions.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Preferred Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select payment method" /></SelectTrigger>
                  <SelectContent>
                    {["Bank Transfer","Credit/Debit Card","Instalment Plan"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>How did you hear about us?</Label>
                <Select value={heardAboutUs} onValueChange={setHeardAboutUs}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent>
                    {["Google","Social Media","Recommendation","Returning Client","Other"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="p-4 bg-muted/20 rounded-2xl border border-border space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="w-4 h-4 rounded mt-0.5"
                  />
                  <Label htmlFor="terms" className="cursor-pointer text-sm leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms-conditions">
                      <a className="text-primary hover:underline font-medium" target="_blank">Terms & Conditions</a>
                    </Link>
                    {" "}and consent to CB Travel contacting me about this booking. <span className="text-red-500">*</span>
                  </Label>
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-800">
                <p className="font-semibold mb-1">📋 What happens next?</p>
                <p>By submitting this form, you agree our team will contact you to confirm your booking. We'll review your details and get back to you within 24 hours.</p>
              </div>
              {submitMutation.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {submitMutation.error.message}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <Button variant="outline" onClick={prevStep} className="rounded-xl gap-2">
                <ChevronLeft size={16} /> Back
              </Button>
            ) : <div />}
            {step < 5 ? (
              <Button onClick={nextStep} className="rounded-xl btn-gold border-0 text-foreground gap-2">
                Next <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="rounded-xl btn-gold border-0 text-foreground gap-2 px-8"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Booking Request ✈️"}
              </Button>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-white/50 text-xs mt-6">
          Questions? Email us at{" "}
          <a href="mailto:info@travelcb.co.uk" className="text-white/80 hover:text-white underline">
            info@travelcb.co.uk
          </a>
        </p>
      </div>
    </div>
  );
}
