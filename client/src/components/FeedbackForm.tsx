import { useState } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="mb-3">
      <p className="text-sm text-slate-600 mb-1">{label}</p>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`text-2xl transition-transform hover:scale-110 ${n <= value ? 'text-amber-400' : 'text-slate-300'}`}>★</button>
        ))}
      </div>
    </div>
  );
}

export default function FeedbackForm({ bookingId, onClose }: { bookingId: number; onClose: () => void }) {
  const [overall, setOverall] = useState(5);
  const [destination, setDestination] = useState(5);
  const [service, setService] = useState(5);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);

  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: (data: any) => {
      setDone(true);
      setPromoCode(data.promoCode || null);
      toast.success("Thank you for your feedback! 🌟");
    },
    onError: (e) => toast.error(e.message),
  });

  if (done) return (
    <div className="text-center py-8">
      <div className="text-6xl mb-4">🌟</div>
      <h3 className="text-xl font-bold text-[#1e3a5f] mb-2">Thank You!</h3>
      <p className="text-slate-600 mb-4">Your feedback helps us improve for all travellers.</p>
      {promoCode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-amber-700 mb-1">🎁 Here's a thank-you discount:</p>
          <p className="text-2xl font-bold text-[#1e3a5f] font-mono">{promoCode}</p>
          <p className="text-xs text-amber-600">£5 off your next booking — we've emailed it to you too!</p>
        </div>
      )}
      <button onClick={onClose} className="bg-[#1e3a5f] text-white px-6 py-2 rounded-xl hover:bg-[#2d5986] transition-colors">Close</button>
    </div>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); submitMutation.mutate({ bookingId, overallRating: overall, destinationRating: destination, serviceRating: service, comment }); }}
      className="space-y-4">
      <StarRating value={overall} onChange={setOverall} label="Overall Experience" />
      <StarRating value={destination} onChange={setDestination} label="Destination Rating" />
      <StarRating value={service} onChange={setService} label="CB Travel Service" />
      <div>
        <p className="text-sm text-slate-600 mb-1">Comments (optional)</p>
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
          placeholder="Tell us about your experience..."
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] resize-none" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={submitMutation.isPending}
          className="flex-1 bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-[#2d5986] transition-colors disabled:opacity-50">
          {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
        </button>
        <button type="button" onClick={onClose} className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
      </div>
    </form>
  );
}
