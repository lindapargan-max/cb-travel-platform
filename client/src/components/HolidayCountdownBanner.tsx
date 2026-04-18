import { useState } from "react";
import { trpc } from "../lib/trpc";
import { differenceInDays, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { Star, Send, Gift, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl transition-transform hover:scale-110 ${n <= value ? "text-amber-400" : "text-slate-300"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function PostHolidayReviewCard({ booking }: { booking: any }) {
  const [step, setStep] = useState<"thanks" | "feedback" | "review" | "done">("thanks");
  const [overall, setOverall] = useState(5);
  const [destination, setDestination] = useState(5);
  const [service, setService] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [promoCode, setPromoCode] = useState<string | null>(null);

  const submitFeedback = trpc.feedback.submit.useMutation({
    onSuccess: (data: any) => {
      setPromoCode(data?.promoCode || null);
      setStep("review");
    },
    onError: (e) => toast.error(e.message),
  });

  const submitReview = trpc.reviews.submitReview.useMutation({
    onSuccess: (data: any) => {
      if (data?.loyaltyCode && !promoCode) setPromoCode(data.loyaltyCode);
      setStep("done");
    },
    onError: (e) => {
      // If already reviewed, still advance
      setStep("done");
    },
  });

  if (step === "done") {
    return (
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-4">
          <CheckCircle2 size={40} className="flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-xl mb-1">Thank you, {booking.leadPassengerName?.split(" ")[0] || ""}! 🌟</h3>
            <p className="text-white/85 text-sm">Your feedback means the world to us. We can't wait to plan your next adventure!</p>
          </div>
        </div>
        {promoCode && (
          <div className="mt-4 bg-white/15 rounded-xl p-4 border border-white/30 text-center">
            <p className="text-white/80 text-xs uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <Gift size={12} /> Your thank-you discount
            </p>
            <p className="font-mono text-2xl font-bold tracking-widest text-[#e8b84b]">{promoCode}</p>
            <p className="text-white/70 text-xs mt-1">Use this on your next booking with CB Travel</p>
          </div>
        )}
      </div>
    );
  }

  if (step === "thanks") {
    return (
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5986] text-white rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-start gap-4">
          <span className="text-4xl flex-shrink-0">🌴</span>
          <div className="flex-1">
            <h3 className="font-bold text-xl mb-1">Welcome home from {booking.destination || "your adventure"}!</h3>
            <p className="text-blue-200 text-sm mb-4">
              We hope it was absolutely incredible. We'd love to hear how everything went —
              your feedback helps us make every journey even better.
            </p>
            <button
              onClick={() => setStep("feedback")}
              className="bg-[#e8b84b] text-[#1e3a5f] font-bold px-6 py-2.5 rounded-full text-sm hover:bg-[#d4a53b] transition-colors"
            >
              Share Your Experience
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "feedback") {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Star size={18} className="text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">How was your trip?</h3>
            <p className="text-xs text-muted-foreground">{booking.destination} · {booking.bookingReference}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-1.5">Overall Experience</p>
            <StarRating value={overall} onChange={setOverall} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1.5">Destination Rating</p>
            <StarRating value={destination} onChange={setDestination} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1.5">CB Travel Service</p>
            <StarRating value={service} onChange={setService} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1.5">Your Comments <span className="text-muted-foreground font-normal">(optional)</span></p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Tell us about your experience..."
              className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none bg-background"
            />
          </div>
          <button
            onClick={() => submitFeedback.mutate({ bookingId: booking.id, overallRating: overall, destinationRating: destination, serviceRating: service, comment })}
            disabled={submitFeedback.isPending}
            className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-[#2d5986] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitFeedback.isPending ? "Submitting..." : (<><Send size={15} /> Submit Feedback</>)}
          </button>
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Star size={18} className="text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">One more step — leave a review!</h3>
            <p className="text-xs text-muted-foreground">Help other travellers discover {booking.destination}</p>
          </div>
        </div>
        {promoCode && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-3">
            <Gift size={18} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-amber-700 font-medium">Thank you! Here's your discount code:</p>
              <p className="font-mono font-bold text-[#1e3a5f]">{promoCode}</p>
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-1.5">Overall Rating</p>
            <StarRating value={reviewRating} onChange={setReviewRating} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1.5">Your Review</p>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              placeholder={`Tell others what made ${booking.destination} special...`}
              className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none bg-background"
            />
            <p className="text-xs text-muted-foreground mt-1">Minimum 10 characters</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => submitReview.mutate({ bookingId: booking.id, rating: reviewRating, content: reviewText })}
              disabled={submitReview.isPending || reviewText.length < 10}
              className="flex-1 bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-[#2d5986] transition-colors disabled:opacity-50"
            >
              {submitReview.isPending ? "Posting..." : "Post Review"}
            </button>
            <button
              onClick={() => setStep("done")}
              className="px-4 py-3 rounded-xl border border-input text-muted-foreground hover:bg-muted transition-colors text-sm"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function HolidayCountdownBanner() {
  const { data: bookings } = trpc.booking.getAll.useQuery();
  if (!bookings?.length) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check for bookings where today is the return date or just passed (within 7 days)
  const justReturned = bookings.find((b: any) => {
    if (!b.returnDate || b.status === "cancelled") return false;
    const returnDate = parseISO(b.returnDate);
    returnDate.setHours(0, 0, 0, 0);
    return returnDate <= today && today <= addDays(returnDate, 7);
  });

  if (justReturned) {
    return <PostHolidayReviewCard booking={justReturned} />;
  }

  // Upcoming booking countdown
  const upcoming = bookings
    .filter((b: any) => b.departureDate && isAfter(parseISO(b.departureDate), today) && b.status !== "cancelled")
    .sort((a: any, b: any) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());

  const next = upcoming[0];
  if (!next) return null;

  const days = differenceInDays(parseISO(next.departureDate), today);
  if (days < 0) return null;

  const isUrgent = days <= 7;

  return (
    <div
      className={`rounded-2xl p-5 mb-6 flex items-center gap-4 shadow-sm border ${
        isUrgent
          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent"
          : "bg-gradient-to-r from-[#1e3a5f] to-[#2d5986] text-white border-transparent"
      }`}
    >
      <span className="text-4xl flex-shrink-0">{isUrgent ? "⏰" : "🌴"}</span>
      <div>
        <p className="font-bold text-lg leading-snug">
          {days === 0
            ? "Today's the day — your holiday begins! 🎉"
            : days === 1
            ? "Tomorrow is the big day! Are you packed?"
            : `Your trip to ${next.destination || "paradise"} is in ${days} days!`}
        </p>
        <p className={`text-sm mt-0.5 ${isUrgent ? "text-white/80" : "text-blue-200"}`}>
          {next.bookingReference} &bull; {next.destination}
          {next.departureDate && (
            <> &bull; Departs {new Date(next.departureDate).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</>
          )}
        </p>
      </div>
    </div>
  );
}
