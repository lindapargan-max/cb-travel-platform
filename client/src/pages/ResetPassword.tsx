import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plane, KeyRound, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

const HERO_BG = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80&auto=format&fit=crop";

function getEmailFromSearch(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("email") || "";
  } catch {
    return "";
  }
}

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    email: getEmailFromSearch(),
    token: "",
    newPassword: "",
    confirmPassword: "",
  });

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Password reset! Please sign in.");
      setTimeout(() => navigate("/login"), 1000);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reset password. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.token || !form.newPassword || !form.confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (form.token.length !== 6 || !/^\d{6}$/.test(form.token)) {
      toast.error("Please enter a valid 6-digit reset code.");
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    resetMutation.mutate({
      email: form.email,
      token: form.token,
      newPassword: form.newPassword,
    });
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
              <KeyRound size={22} className="text-white" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Set new password</h1>
            <p className="text-muted-foreground">Enter the 6-digit code from your email and your new password.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Mail size={14} className="text-muted-foreground" />
                Email address
              </Label>
              <Input
                id="email"
                type="text"
                inputMode="email"
                autoComplete="email"
                placeholder="hello@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-12 rounded-xl border-border focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <KeyRound size={14} className="text-muted-foreground" />
                Reset code
              </Label>
              <Input
                id="token"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={form.token}
                onChange={(e) => setForm({ ...form, token: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                className="h-12 rounded-xl border-border focus:border-primary font-mono text-lg tracking-widest text-center"
              />
              <p className="text-xs text-muted-foreground">Enter the 6-digit code from your email</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Lock size={14} className="text-muted-foreground" />
                New password
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="At least 8 characters"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                className="h-12 rounded-xl border-border focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Lock size={14} className="text-muted-foreground" />
                Confirm new password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your new password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="h-12 rounded-xl border-border focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl btn-gold border-0 text-foreground font-semibold text-base"
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  Resetting...
                </span>
              ) : "Reset Password"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Need a new code?{" "}
              <Link href="/forgot-password">
                <span className="text-primary font-semibold hover:underline cursor-pointer">Request again</span>
              </Link>
            </p>
          </div>

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
