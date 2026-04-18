import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Plane, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const HERO_BG = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80&auto=format&fit=crop";

export default function Login() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
onSuccess: (data) => {
  toast.success(`Welcome back, ${data.user?.name || "traveller"}!`);
  setTimeout(() => {
    if (data.user?.role === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/dashboard";
    }
  }, 500);
},
    onError: (err) => {
      toast.error(err.message || "Invalid email or password.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please fill in all fields.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    loginMutation.mutate(form);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16 bg-white">
        <div className="max-w-md w-full mx-auto">
          <Link href="/">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer mb-10">
              <ArrowLeft size={15} />
              Back to home
            </span>
          </Link>

          <div className="mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-5">
              <Plane size={22} className="text-white" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to access your bookings and account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email address</Label>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                <Link href="/forgot-password">
                  <span className="text-xs text-primary hover:underline cursor-pointer">Forgot password?</span>
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-12 rounded-xl border-border focus:border-primary pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl btn-gold border-0 text-foreground font-semibold text-base"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register">
                <span className="text-primary font-semibold hover:underline cursor-pointer">Create one free</span>
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
