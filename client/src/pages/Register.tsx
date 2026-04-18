import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Plane, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Account created successfully! Please log in.");
      setLocation("/login");
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (!privacyConsent) {
      toast.error("You must agree to the Privacy Policy and Terms of Service to create an account.");
      return;
    }

    registerMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      password,
      marketingConsent,
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ backgroundColor: "#f8f6f0" }}
    >
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm mb-6 hover:opacity-80"
          style={{ color: "#1e3a5f" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-6">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: "#1e3a5f" }}
            >
              <Plane className="w-6 h-6" style={{ color: "#d4af37" }} />
            </div>
            <h1
              className="text-2xl font-bold"
              style={{
                color: "#1e3a5f",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              Create Your Account
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Join CB Travel to manage your bookings
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <Label
                htmlFor="register-name"
                className="text-sm font-semibold"
                style={{ color: "#1e3a5f" }}
              >
                Full Name
              </Label>
              <Input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="mt-1"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label
                htmlFor="register-email"
                className="text-sm font-semibold"
                style={{ color: "#1e3a5f" }}
              >
                Email Address
              </Label>
              <Input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-1"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <Label
                htmlFor="register-phone"
                className="text-sm font-semibold"
                style={{ color: "#1e3a5f" }}
              >
                Phone Number{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="register-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 ..."
                className="mt-1"
              />
            </div>

            {/* Password */}
            <div>
              <Label
                htmlFor="register-password"
                className="text-sm font-semibold"
                style={{ color: "#1e3a5f" }}
              >
                Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label
                htmlFor="register-confirm-password"
                className="text-sm font-semibold"
                style={{ color: "#1e3a5f" }}
              >
                Confirm Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-3 pt-2">
              {/* Privacy Policy Consent (required) */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="register-privacy-consent"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="register-privacy-consent"
                  className="text-sm text-gray-700"
                >
                  I agree to CB Travel's{" "}
                  <Link
                    href="/privacy-policy"
                    className="underline font-medium"
                    style={{ color: "#d4af37" }}
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/terms"
                    className="underline font-medium"
                    style={{ color: "#d4af37" }}
                  >
                    Terms of Service
                  </Link>{" "}
                  <span className="text-red-500">*</span>
                </label>
              </div>

              {/* Marketing Consent (optional) */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="register-marketing-consent"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="register-marketing-consent"
                  className="text-sm text-gray-600"
                >
                  I'd like to receive travel deals, offers and news by email{" "}
                  <span className="text-gray-400">
                    (optional — you can unsubscribe at any time)
                  </span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-3 text-base font-semibold rounded-lg mt-2"
              style={{ backgroundColor: "#d4af37", color: "#1e3a5f" }}
            >
              {registerMutation.isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold underline"
              style={{ color: "#1e3a5f" }}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
