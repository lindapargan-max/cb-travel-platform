import { useState } from "react";
import { Star, Gift } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ReviewForm({ bookingId, onSuccess }: { bookingId: number; onSuccess?: () => void }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loyaltyCode, setLoyaltyCode] = useState("");

  const submitReview = trpc.reviews.submitReview.useMutation({
    onSuccess: (data) => {
      setLoyaltyCode(data.loyaltyCode);
      setShowCode(true);
      toast.success("Thank you for your review! Your loyalty code is ready.");
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit review");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.length < 10) {
      toast.error("Review must be at least 10 characters");
      return;
    }
    submitReview.mutate({ bookingId, rating, title, content });
  };

  if (showCode) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="text-yellow-600" size={24} />
          <h3 className="font-bold text-lg text-yellow-900">Your Loyalty Reward!</h3>
        </div>
        <p className="text-sm text-gray-700 mb-4">Thank you for choosing CB Travel! Here's your exclusive loyalty discount code:</p>
        <div className="bg-white border-2 border-dashed border-yellow-400 rounded-lg p-4 mb-4">
          <p className="text-center font-mono font-bold text-xl text-yellow-700">{loyaltyCode}</p>
          <p className="text-center text-sm text-gray-600 mt-2">Save £50 on your next booking</p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(loyaltyCode);
            toast.success("Code copied to clipboard!");
          }}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 rounded-lg"
        >
          Copy Code
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border">
      <h3 className="font-bold text-lg">How was your trip?</h3>
      <div className="space-y-2">
        <Label>Rating</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRating(r)}
              className={`p-2 rounded ${rating >= r ? "text-yellow-400" : "text-gray-300"}`}
            >
              <Star size={24} fill="currentColor" />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Review Title (optional)</Label>
        <Input
          id="title"
          placeholder="e.g., Amazing experience!"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Your Review</Label>
        <textarea
          id="content"
          placeholder="Tell us about your experience..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border rounded-lg p-3 min-h-32"
        />
      </div>
      <Button type="submit" disabled={submitReview.isPending} className="w-full">
        {submitReview.isPending ? "Submitting..." : "Submit Review & Get Loyalty Code"}
      </Button>
    </form>
  );
}
