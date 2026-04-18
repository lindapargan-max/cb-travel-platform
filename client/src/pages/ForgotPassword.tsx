import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plane, Mail } from "lucide-react";
import { toast } from "sonner";

const HERO_BG = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80&auto=format&fit=crop";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    forgotMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16 bg-white">
        <div className="max-w-md w-full mx-auto">
          <Link href="/login">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer mb-10">
              <ArrowLeft size={15} />
              Back to sign in
            </span>
          </Link>

          <div className="mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-5">
              <Mail size={22} className="text-white" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Reset your password</h1>
            <p className="text-muted-foreground">Enter your email and we'll send you a reset code.</p>
          </div>

          {submitted ? (
            <div className="space-y-5">
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                <p className="text-green-800 font-medium mb-1">Check your email!</p>
                <p className="text-green-700 text-sm">We've sent a 6-digit reset code to <strong>{email}</strong>.</p>
              </div>
              <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
                <Button className="w-full h-12 rounded-xl btn-gold border-0 text-foreground font-semibold text-base">
                  Enter your code →
                </Button>
              </Link>
              <p className="text-center text-sm text-muted-foreground">
                Didn't receive it?{" "}
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-primary hover:underline font-medium"
                >
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email address</Label>
                <Input
                  id="email"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="hello@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-border focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl btn-gold border-0 text-foreground font-semibold text-base"
                disabled={forgotMutation.isPending}
              >
                {forgotMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : "Send Reset Code"}
              </Button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Need help? Call us on{" "}
              <a href="tel:07495823953" className="text-primary font-medium hover:underline">07495 823953</a>
            </p>
          </div>
        </div>
      </div>

      {/* Right — Image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img src={HERO_BG} alt="Travel" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-navy-gradient opacity-60" />
        <div className="absolute inset-0 flex flex-col justify-end p-16 text-white">
          <blockquote className="mb-6">
            <p className="font-serif text-2xl font-medium italic leading-relaxed text-white/90">
              "The world is a book, and those who do not travel read only one page."
            </p>
            <cite className="text-white/50 text-sm mt-3 block">— Saint Augustine</cite>
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
              <Plane size={18} className="text-yellow-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">CB Travel</p>
              <p className="text-white/50 text-xs">Luxury Travel Agency — UK</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
