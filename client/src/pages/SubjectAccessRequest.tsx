import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle2, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function SubjectAccessRequest() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState<string>("customer");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitSAR = trpc.gdpr.submitSAR.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit your request. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    submitSAR.mutate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      relationship,
      description: description.trim(),
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
            Request Submitted Successfully
          </h1>
          <p className="text-gray-700 leading-relaxed mb-4">
            Thank you for your Subject Access Request. We have received your
            request and will respond within <strong>30 days</strong> as required
            under the UK GDPR.
          </p>
          <p className="text-gray-600 text-sm mb-6">
            A confirmation will be sent to <strong>{email}</strong>. We may
            contact you to verify your identity before processing your request.
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
              Subject Access Request
            </h1>
          </div>
          <p className="text-gray-300 text-sm">
            Request a copy of all personal data we hold about you
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Info box */}
        <div
          className="rounded-lg p-5 border mb-8"
          style={{ borderColor: "#1e3a5f", backgroundColor: "#f0f4f8" }}
        >
          <h2
            className="font-bold text-lg mb-2"
            style={{ color: "#1e3a5f" }}
          >
            About Subject Access Requests
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed mb-2">
            Under the UK General Data Protection Regulation (UK GDPR), you have
            the right to obtain a copy of all personal data we hold about you.
            This is known as a Subject Access Request (SAR).
          </p>
          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
            <li>
              We will respond to your request within <strong>30 days</strong>
            </li>
            <li>
              We may need to verify your identity before processing the request
            </li>
            <li>This service is provided free of charge</li>
            <li>
              In complex cases, we may extend the response time by a further two
              months (we will inform you if this is necessary)
            </li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label
              htmlFor="sar-name"
              className="text-sm font-semibold"
              style={{ color: "#1e3a5f" }}
            >
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sar-name"
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
              htmlFor="sar-email"
              className="text-sm font-semibold"
              style={{ color: "#1e3a5f" }}
            >
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sar-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-1"
              required
            />
            <p className="text-gray-500 text-xs mt-1">
              We will use this email to respond to your request and to verify
              your identity.
            </p>
          </div>

          <div>
            <Label
              htmlFor="sar-phone"
              className="text-sm font-semibold"
              style={{ color: "#1e3a5f" }}
            >
              Phone Number{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="sar-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+44 ..."
              className="mt-1"
            />
          </div>

          <div>
            <Label
              htmlFor="sar-relationship"
              className="text-sm font-semibold"
              style={{ color: "#1e3a5f" }}
            >
              Your Relationship with CB Travel{" "}
              <span className="text-red-500">*</span>
            </Label>
            <select
              id="sar-relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="customer">Current Customer</option>
              <option value="former_customer">Former Customer</option>
              <option value="enquirer">Made an Enquiry / Requested a Quote</option>
              <option value="newsletter">Newsletter Subscriber</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label
              htmlFor="sar-description"
              className="text-sm font-semibold"
              style={{ color: "#1e3a5f" }}
            >
              Description of Data Requested{" "}
              <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="sar-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Please describe the personal data you would like a copy of. For example: 'All data you hold about me', 'My booking history', 'Any marketing data', etc."
              className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            />
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
              process your Subject Access Request. We will retain a record of
              this request for 3 years as part of our accountability obligations
              under UK GDPR. Your data will not be shared with any third
              parties except as necessary to fulfil your request. For more
              details, please see our{" "}
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
            disabled={submitSAR.isPending}
            className="w-full py-3 text-base font-semibold rounded-lg"
            style={{ backgroundColor: "#d4af37", color: "#1e3a5f" }}
          >
            {submitSAR.isPending ? (
              "Submitting..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Subject Access Request
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
