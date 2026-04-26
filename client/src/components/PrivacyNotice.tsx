import { Link } from "wouter";
import { Shield } from "lucide-react";

type PrivacyContext = "quote" | "booking" | "newsletter" | "contact" | "account";

interface PrivacyNoticeProps {
  context: PrivacyContext;
  compact?: boolean;
}

const NOTICE_CONFIG: Record<
  PrivacyContext,
  { title: string; dataCollected: string; retention: string; extra?: string }
> = {
  quote: {
    title: "Privacy Notice — Quote Request",
    dataCollected:
      "your name, email address, phone number, and travel preferences",
    retention:
      "We will retain this data for up to 2 years if no booking follows. If a booking is made, the data becomes part of your booking record.",
  },
  booking: {
    title: "Privacy Notice — Booking Information",
    dataCollected:
      "passenger names, dates of birth, passport numbers, addresses, contact details, and travel requirements",
    retention:
      "Booking and travel document data is retained for 7 years after your travel date as required by HMRC. After this period, personal data is anonymised or deleted.",
    extra:
      "Passport and travel document data is stored securely and only used for the purpose of arranging your travel. It will not be shared with any party other than those directly involved in your booking.",
  },
  newsletter: {
    title: "Privacy Notice — Newsletter",
    dataCollected: "your email address",
    retention:
      "Your email address will be retained for as long as you remain subscribed. If you unsubscribe or are inactive for 12 months, your data will be deleted.",
    extra:
      "Subscribing to our newsletter is entirely optional. You can unsubscribe at any time by clicking the unsubscribe link in any email or by contacting us at privacy@cbtravel.uk.",
  },
  contact: {
    title: "Privacy Notice — Contact Form",
    dataCollected: "your name, email address, phone number, and your message",
    retention:
      "Enquiry data is retained for up to 2 years. If a booking follows, the data becomes part of your booking record.",
  },
  account: {
    title: "Privacy Notice — Account Registration",
    dataCollected: "your name, email address, phone number, and password (stored securely in hashed form)",
    retention:
      "Account data is retained for as long as your account is active. Inactive accounts (no login for 3 years) are deleted automatically.",
  },
};

export default function PrivacyNotice({ context, compact = false }: PrivacyNoticeProps) {
  const config = NOTICE_CONFIG[context];

  if (compact) {
    return (
      <p className="text-xs text-gray-500 mt-2">
        <Shield className="w-3 h-3 inline-block mr-1 -mt-0.5" style={{ color: "#1e3a5f" }} />
        We collect {config.dataCollected} to process your request. {config.retention.split(".")[0]}.{" "}
        <Link
          href="/privacy-policy"
          className="underline"
          style={{ color: "#d4af37" }}
        >
          Privacy Policy
        </Link>
      </p>
    );
  }

  return (
    <div
      className="rounded-lg p-4 border text-sm"
      style={{ borderColor: "#1e3a5f", backgroundColor: "#f0f4f8" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 flex-shrink-0" style={{ color: "#d4af37" }} />
        <p className="font-semibold" style={{ color: "#1e3a5f" }}>
          {config.title}
        </p>
      </div>
      <p className="text-gray-700 leading-relaxed mb-1">
        <strong>Data collected:</strong> {config.dataCollected}.
      </p>
      <p className="text-gray-700 leading-relaxed mb-1">
        <strong>Retention:</strong> {config.retention}
      </p>
      {config.extra && (
        <p className="text-gray-700 leading-relaxed mb-1">{config.extra}</p>
      )}
      <p className="text-gray-700 leading-relaxed mt-2">
        For full details on how we handle your data, please read our{" "}
        <Link
          href="/privacy-policy"
          className="underline font-medium"
          style={{ color: "#d4af37" }}
        >
          Privacy Policy
        </Link>
        . To exercise your rights, contact us at{" "}
        <a
          href="mailto:privacy@cbtravel.uk"
          className="underline"
          style={{ color: "#d4af37" }}
        >
          privacy@cbtravel.uk
        </a>
        .
      </p>
    </div>
  );
}
