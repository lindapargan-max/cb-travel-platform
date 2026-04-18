import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle2, Trash2, ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function RightToErasure() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [reason, setReason] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitErasure = trpc.gdpr.submitErasureRequest.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit your request. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!confirmed) {
      toast.error("Please confirm that you understand the consequences of data erasure.");
      return;
    }

    submitErasure.mutate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      accountEmail: accountEmail.trim() || undefined,
      reason: reason || undefined,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f8f6f0" }}>
        <div className="max-w-lg mx-auto px-4 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#1e3a5f" }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: "#d4af37" }} />
          </div>
          <h1
            className="text-2xl font-bold mb-3"
            style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Erasure Request Submitted
          </h1>
          <p className="text-gray-700 leading-relaxed mb-4">
            Thank you. We have received your request for data erasure and will
            process it within <strong>30 days</strong> as required under the UK
            GDPR.
          </p>
          <p className="text-gray-600 text-sm mb-4">
            A confirmation will be sent to <strong>{email}</strong>. We may
            contact you to verify your identity before processing the request.
          </p>
          <p className="text-gray-600 text-sm mb-6">
            Please note that certain data may be exempt from erasure where we
            have a legal obligation to retain it (e.g. financial records for
            HMRC). We will inform you of any exemptions that apply.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/">
              <Button
                variant="outline"
                className="border-2"
                style={{ borderColor: "#1e3a5f", color: "#1e3a5f" }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f6f0" }}>
      {/* Header */}
      <div className="pt-24 pb-12" style={{ backgroundColor: "#1e3a5f" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link
            href="/privacy-policy"
            className="text-gray-300 hover:text-white text-sm flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Privacy Policy
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-8 h-8" style={{ color: "#d4af37" }} />
            <h1
              className="text-3xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Right to Erasure
            </h1>
          </div>
          <p className="text-gray-300 text-sm">
            Request deletion of your personal data ("Right to be Forgotten")
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Info box */}
        <div
          className="rounded-lg p-5 border mb-6"
          style={{ borderColor: "#1e3a5f", backgroundColor: "#f0f4f8" }}
        >
          <h2
            className="font-bold text-lg mb-2"
            style={{ color: "#1e3a5f" }}
          >
            About Your Right to Erasure
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed mb-2">
            Under the UK GDPR (Article 17), you have the right to request that
            we delete your personal data. We will comply with your request unless
            we have a lawful reason to retain it.
          </p>
          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
            <li>We will respond within <strong>30 days</strong></li>
            <li>
              We may need to verify your identity before processing the request
            </li>
            <li>
              Some data may be exempt (e.g. financial records retained for HMRC
              compliance)
            </li>
          </ul>
        </div>

        {/* Warning */}
        <div
          className="rounded-lg p-4 border mb-8 flex items-start gap-3"
          style={{ borderColor: "#b45309", backgroundColor: "#fef3c7" }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800 text-sm mb-1">
              Important: Active Bookings
            </p>
            <p className="text-amber-700 text-sm leading-relaxed">
              If you have any active or upcoming bookings, requesting data
              erasure may affect our ability to provide travel services to you.
              We may need to retain certain booking data until after your travel
              is complete. We will contact you to discuss any implications before
              proceeding with deletion.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label
              htmlFor="erasure-name"
              className="text-sm font-semibold"
              style={{ color: "#1e3a5f" }}
            >
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="erasure-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label
              htmlFor="erasure-email"
              className="text-sm font-semibold"
              style={{ color: "#1e3a5f" }}
            >
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="erasure-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-1"
              required
            />
            <p className="text-gray-500 text-xs mt-1">
              We will use this email to confirm receipt and to verify your
              identity.
            </p>
          </div>

          <div>
            <Label
              htmlFor="erasure-phone"
              className="text-sm font-semibold"
              style={{ color: "#1e3a5f" }}
            >
              Phone Number{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="erasure-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+44 ..."
              className="mt-1"
            />
          </div>

          <div>
            <Label
              htmlFor="erasure-account-email"
              className="text-sm font-semibold"
              style={{ color: "#1e3a5f" }}
            >
              Account Email (if different from above){" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="erasure-account-email"
              type="email"
              value={accountEmail}
              onChange={(e) => setAccountEmail(e.target.value)}
              placeholder="account@email.com"
              className="mt-1"
            />
            <p className="text-gray-500 text-xs mt-1">
              If the email on your CB Travel account is different from the one
              above, please enter it here so we can locate your data.
            </p>
          </div>

          <div>
            <Label
              htmlFor="erasure-reason"
              className="text-sm font-semibold"
              style={{ color: "#1e3a5f" }}
            >
              Reason for Request{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <select
              id="erasure-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Please select a reason (optional)</option>
              <option value="no_longer_customer">
                I am no longer a customer
              </option>
              <option value="withdraw_consent">
                I wish to withdraw my consent
              </option>
              <option value="data_not_necessary">
                My data is no longer necessary
              </option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Confirmation checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="erasure-confirm"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="erasure-confirm" className="text-sm text-gray-700">
              I understand that requesting erasure of my data may result in the
              deletion of my CB Travel account and that this action may not be
              fully reversible. I also understand that some data may need to be
              retained where there is a legal obligation to do so.{" "}
              <span className="text-red-500">*</span>
            </label>
          </div>

          {/* Privacy Notice */}
          <div
            className="rounded-lg p-4 border text-sm"
            style={{ borderColor: "#1e3a5f", backgroundColor: "#f0f4f8" }}
          >
            <p className="font-semibold mb-1" style={{ color: "#1e3a5f" }}>
              Privacy Notice for this Form
            </p>
            <p className="text-gray-700 leading-relaxed">
              The information you provide in this form will be used solely to
              process your erasure request. We will retain a record of this
              request for 3 years as part of our accountability obligations
              under UK GDPR (to demonstrate that we processed your request
              lawfully). For more details, please see our{" "}
              <Link
                href="/privacy-policy"
                className="underline font-medium"
                style={{ color: "#d4af37" }}
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <Button
            type="submit"
            disabled={submitErasure.isPending || !confirmed}
            className="w-full py-3 text-base font-semibold rounded-lg disabled:opacity-50"
            style={{ backgroundColor: "#d4af37", color: "#1e3a5f" }}
          >
            {submitErasure.isPending ? (
              "Submitting..."
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Submit Erasure Request
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
