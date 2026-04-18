import { Link } from "wouter";
import { Shield, ExternalLink, Mail, FileText } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f6f0" }}>
      {/* Header */}
      <div className="pt-24 pb-12" style={{ backgroundColor: "#1e3a5f" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-8 h-8" style={{ color: "#d4af37" }} />
            <h1
              className="text-3xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Privacy Policy
            </h1>
          </div>
          <p className="text-gray-300 text-sm">Last updated: March 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="prose prose-lg max-w-none space-y-8">
          {/* 1 — Introduction */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              1. Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed">
              CB Travel ("we", "us", "our") is committed to protecting and
              respecting your privacy. This Privacy Policy explains how we
              collect, use, store, and share your personal data when you use our
              website at{" "}
              <a
                href="https://travelcb.co.uk"
                className="underline"
                style={{ color: "#d4af37" }}
              >
                travelcb.co.uk
              </a>{" "}
              and our travel agency services.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              This policy is provided in accordance with the UK General Data
              Protection Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>
          </section>

          {/* 2 — Data Controller */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              2. Data Controller
            </h2>
            <div
              className="rounded-lg p-5 border"
              style={{ borderColor: "#1e3a5f", backgroundColor: "#f0f4f8" }}
            >
              <p className="text-gray-700 mb-1">
                <strong>Data Controller:</strong> Corron Barnes T/A CB Travel
              </p>
              <p className="text-gray-700 mb-1">
                <strong>Website:</strong>{" "}
                <a
                  href="https://travelcb.co.uk"
                  className="underline"
                  style={{ color: "#d4af37" }}
                >
                  travelcb.co.uk
                </a>
              </p>
              <p className="text-gray-700 mb-1">
                <strong>Privacy Contact:</strong>{" "}
                <a
                  href="mailto:privacy@travelcb.co.uk"
                  className="underline"
                  style={{ color: "#d4af37" }}
                >
                  privacy@travelcb.co.uk
                </a>
              </p>
              <p className="text-gray-700">
                <strong>ICO Registration Number:</strong>{" "}
                <span className="font-mono bg-yellow-100 px-2 py-0.5 rounded text-sm">
                  [ADD YOUR ICO NUMBER HERE]
                </span>
              </p>
            </div>
          </section>

          {/* 3 — Data We Collect */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              3. Personal Data We Collect
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect the following categories of personal data:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr style={{ backgroundColor: "#1e3a5f" }}>
                    <th className="text-left text-white px-3 py-2">Category</th>
                    <th className="text-left text-white px-3 py-2">Data Types</th>
                    <th className="text-left text-white px-3 py-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-3 py-2 font-medium">Account Data</td>
                    <td className="px-3 py-2">
                      Name, email address, phone number, password (hashed)
                    </td>
                    <td className="px-3 py-2">Registration form</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-3 py-2 font-medium">Booking Data</td>
                    <td className="px-3 py-2">
                      Travel dates, destinations, passenger names, passport
                      numbers, dates of birth, addresses, dietary requirements,
                      special assistance needs
                    </td>
                    <td className="px-3 py-2">Booking intake form</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-3 py-2 font-medium">Enquiry Data</td>
                    <td className="px-3 py-2">
                      Name, email, phone, travel preferences, destination
                      interests, budget
                    </td>
                    <td className="px-3 py-2">Quote request / contact form</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-3 py-2 font-medium">Marketing Data</td>
                    <td className="px-3 py-2">
                      Email address, marketing consent status, subscription date
                    </td>
                    <td className="px-3 py-2">Newsletter signup</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-3 py-2 font-medium">Loyalty Data</td>
                    <td className="px-3 py-2">
                      Points balance, earning/redemption history
                    </td>
                    <td className="px-3 py-2">Loyalty programme</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-3 py-2 font-medium">Technical Data</td>
                    <td className="px-3 py-2">
                      IP address, browser type, device information, cookies
                    </td>
                    <td className="px-3 py-2">Automatic collection</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4 — Legal Basis */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              4. Legal Basis for Processing
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We process your personal data on the following legal bases under
              Article 6 UK GDPR:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr style={{ backgroundColor: "#1e3a5f" }}>
                    <th className="text-left text-white px-3 py-2">Processing Activity</th>
                    <th className="text-left text-white px-3 py-2">Legal Basis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-3 py-2">
                      Creating and managing your account
                    </td>
                    <td className="px-3 py-2">
                      <strong>Contract</strong> — necessary to provide our services
                      to you (Art. 6(1)(b))
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-3 py-2">
                      Processing bookings and travel arrangements
                    </td>
                    <td className="px-3 py-2">
                      <strong>Contract</strong> — necessary to fulfil your booking
                      (Art. 6(1)(b))
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-3 py-2">
                      Collecting passport/travel document details
                    </td>
                    <td className="px-3 py-2">
                      <strong>Contract</strong> — required to complete travel
                      bookings (Art. 6(1)(b))
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-3 py-2">
                      Responding to enquiries and quote requests
                    </td>
                    <td className="px-3 py-2">
                      <strong>Legitimate Interest</strong> — to respond to your
                      enquiry and provide quotes (Art. 6(1)(f))
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-3 py-2">
                      Sending marketing emails and newsletters
                    </td>
                    <td className="px-3 py-2">
                      <strong>Consent</strong> — you may opt in and can withdraw at
                      any time (Art. 6(1)(a))
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-3 py-2">
                      Loyalty points programme
                    </td>
                    <td className="px-3 py-2">
                      <strong>Contract</strong> — part of the service we provide
                      (Art. 6(1)(b))
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-3 py-2">
                      Retaining financial/booking records (HMRC)
                    </td>
                    <td className="px-3 py-2">
                      <strong>Legal Obligation</strong> — tax and accounting
                      requirements (Art. 6(1)(c))
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-3 py-2">
                      Setting marketing/social media cookies (Facebook)
                    </td>
                    <td className="px-3 py-2">
                      <strong>Consent</strong> — only loaded with explicit cookie
                      consent (Art. 6(1)(a))
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-3 py-2">
                      Essential cookies and website security
                    </td>
                    <td className="px-3 py-2">
                      <strong>Legitimate Interest</strong> — necessary for website
                      operation and security (Art. 6(1)(f))
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 5 — Retention */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              5. Data Retention
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We retain your personal data only for as long as necessary for the
              purposes set out in this policy or as required by law. Specific
              retention periods are:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr style={{ backgroundColor: "#1e3a5f" }}>
                    <th className="text-left text-white px-3 py-2">Data Type</th>
                    <th className="text-left text-white px-3 py-2">Retention Period</th>
                    <th className="text-left text-white px-3 py-2">Action After</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-3 py-2">Account data</td>
                    <td className="px-3 py-2">
                      Deleted 3 years after last login (inactive accounts)
                    </td>
                    <td className="px-3 py-2">Account deleted</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-3 py-2">Booking records</td>
                    <td className="px-3 py-2">
                      7 years from travel completion date (HMRC requirement)
                    </td>
                    <td className="px-3 py-2">Anonymised or deleted</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-3 py-2">
                      Passport / travel document data
                    </td>
                    <td className="px-3 py-2">7 years after travel date</td>
                    <td className="px-3 py-2">Deleted</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-3 py-2">
                      Marketing / newsletter contacts
                    </td>
                    <td className="px-3 py-2">
                      12 months after unsubscribe or last engagement
                    </td>
                    <td className="px-3 py-2">Deleted</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-3 py-2">Loyalty points data</td>
                    <td className="px-3 py-2">
                      Deleted 3 years after last activity
                    </td>
                    <td className="px-3 py-2">Points expired and deleted</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-3 py-2">
                      Enquiry / quote request data
                    </td>
                    <td className="px-3 py-2">
                      2 years if no booking follows
                    </td>
                    <td className="px-3 py-2">Deleted</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-3 py-2">GDPR request records</td>
                    <td className="px-3 py-2">
                      3 years from completion (accountability obligation)
                    </td>
                    <td className="px-3 py-2">Deleted</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 6 — Third-party Processors */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              6. Third-Party Data Processors
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We share your personal data with the following third-party service
              providers who process it on our behalf or for their own purposes:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr style={{ backgroundColor: "#1e3a5f" }}>
                    <th className="text-left text-white px-3 py-2">Provider</th>
                    <th className="text-left text-white px-3 py-2">Role</th>
                    <th className="text-left text-white px-3 py-2">Purpose</th>
                    <th className="text-left text-white px-3 py-2">Data Shared</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-3 py-2 font-medium">Topdog IRS</td>
                    <td className="px-3 py-2">Data Processor</td>
                    <td className="px-3 py-2">
                      Booking management system
                    </td>
                    <td className="px-3 py-2">
                      Booking details, passenger names, travel dates, contact
                      information
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-3 py-2 font-medium">Cloudflare</td>
                    <td className="px-3 py-2">Data Processor</td>
                    <td className="px-3 py-2">CDN and website security</td>
                    <td className="px-3 py-2">
                      IP address, browser information (for security and
                      performance)
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-3 py-2 font-medium">Railway</td>
                    <td className="px-3 py-2">Data Processor</td>
                    <td className="px-3 py-2">Website hosting and database</td>
                    <td className="px-3 py-2">
                      All data stored in our database (hosted on Railway
                      infrastructure)
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-3 py-2 font-medium">
                      Facebook (Meta Platforms)
                    </td>
                    <td className="px-3 py-2">
                      Independent Controller
                    </td>
                    <td className="px-3 py-2">
                      Social media embed (only with marketing cookie consent)
                    </td>
                    <td className="px-3 py-2">
                      Browsing data via cookies (only when consented)
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-3 py-2 font-medium">Open-Meteo</td>
                    <td className="px-3 py-2">N/A</td>
                    <td className="px-3 py-2">Weather data API</td>
                    <td className="px-3 py-2">
                      No personal data shared (server-side API call with location
                      coordinates only)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 7 — Cookies */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              7. Cookies
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar technologies on our website. For full
              details about the cookies we use, how to manage your preferences,
              and how to opt out, please see our{" "}
              <Link
                href="/cookie-policy"
                className="underline font-medium"
                style={{ color: "#d4af37" }}
              >
                Cookie Policy
              </Link>
              .
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              We only load non-essential cookies (including Facebook marketing
              cookies) with your explicit consent, which you can give or withdraw
              at any time via our cookie consent banner.
            </p>
          </section>

          {/* 8 — International Transfers */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              8. International Transfers
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Some of our third-party service providers may process your data
              outside the United Kingdom. Where this happens, we ensure that
              appropriate safeguards are in place to protect your personal data,
              including:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>
                Transfers to countries with an adequacy decision from the UK
                Secretary of State
              </li>
              <li>
                Standard Contractual Clauses (SCCs) approved by the ICO
              </li>
              <li>
                Other appropriate safeguards as required under UK GDPR Article 46
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              Specifically, Railway (our hosting provider) and Cloudflare may
              process data in the United States. Both provide appropriate
              safeguards for international transfers.
            </p>
          </section>

          {/* 9 — Your Rights */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              9. Your Rights
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Under the UK GDPR, you have the following rights regarding your
              personal data:
            </p>
            <div className="space-y-3">
              {[
                {
                  right: "Right of Access",
                  desc: "You can request a copy of all personal data we hold about you (Subject Access Request).",
                },
                {
                  right: "Right to Rectification",
                  desc: "You can ask us to correct any inaccurate or incomplete personal data.",
                },
                {
                  right: "Right to Erasure",
                  desc: 'You can request that we delete your personal data ("right to be forgotten"), subject to legal retention obligations.',
                },
                {
                  right: "Right to Restriction",
                  desc: "You can ask us to restrict the processing of your personal data in certain circumstances.",
                },
                {
                  right: "Right to Data Portability",
                  desc: "You can request your data in a structured, commonly used, machine-readable format.",
                },
                {
                  right: "Right to Object",
                  desc: "You can object to processing based on legitimate interests or for direct marketing purposes.",
                },
                {
                  right: "Right to Withdraw Consent",
                  desc: "Where processing is based on consent, you can withdraw it at any time without affecting the lawfulness of prior processing.",
                },
              ].map(({ right, desc }) => (
                <div
                  key={right}
                  className="rounded-lg p-3 border-l-4"
                  style={{ borderLeftColor: "#d4af37", backgroundColor: "#f0f4f8" }}
                >
                  <p
                    className="font-semibold text-sm"
                    style={{ color: "#1e3a5f" }}
                  >
                    {right}
                  </p>
                  <p className="text-gray-700 text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 10 — How to Exercise Your Rights */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              10. How to Exercise Your Rights
            </h2>

            <div className="space-y-4">
              <div
                className="rounded-lg p-5 border"
                style={{ borderColor: "#1e3a5f", backgroundColor: "#f0f4f8" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5" style={{ color: "#d4af37" }} />
                  <h3 className="font-bold" style={{ color: "#1e3a5f" }}>
                    Subject Access Request (SAR)
                  </h3>
                </div>
                <p className="text-gray-700 text-sm mb-2">
                  To request a copy of the personal data we hold about you:
                </p>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>
                    Submit a request via our{" "}
                    <Link
                      href="/subject-access-request"
                      className="underline font-medium"
                      style={{ color: "#d4af37" }}
                    >
                      Subject Access Request form
                    </Link>
                  </li>
                  <li>
                    Or email{" "}
                    <a
                      href="mailto:privacy@travelcb.co.uk"
                      className="underline"
                      style={{ color: "#d4af37" }}
                    >
                      privacy@travelcb.co.uk
                    </a>
                  </li>
                </ul>
                <p className="text-gray-700 text-sm mt-2">
                  We will respond within <strong>30 days</strong> of receiving your
                  request. We may need to verify your identity before processing
                  the request.
                </p>
              </div>

              <div
                className="rounded-lg p-5 border"
                style={{ borderColor: "#1e3a5f", backgroundColor: "#f0f4f8" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5" style={{ color: "#d4af37" }} />
                  <h3 className="font-bold" style={{ color: "#1e3a5f" }}>
                    Right to Erasure
                  </h3>
                </div>
                <p className="text-gray-700 text-sm mb-2">
                  To request deletion of your personal data:
                </p>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>
                    Submit a request via our{" "}
                    <Link
                      href="/right-to-erasure"
                      className="underline font-medium"
                      style={{ color: "#d4af37" }}
                    >
                      Right to Erasure form
                    </Link>
                  </li>
                  <li>
                    Or email{" "}
                    <a
                      href="mailto:privacy@travelcb.co.uk"
                      className="underline"
                      style={{ color: "#d4af37" }}
                    >
                      privacy@travelcb.co.uk
                    </a>
                  </li>
                </ul>
                <p className="text-gray-700 text-sm mt-2">
                  Please note that we may need to retain certain data where
                  required by law (e.g. financial records for HMRC). We will
                  explain any exemptions that apply.
                </p>
              </div>

              <div
                className="rounded-lg p-5 border"
                style={{ borderColor: "#1e3a5f", backgroundColor: "#f0f4f8" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-5 h-5" style={{ color: "#d4af37" }} />
                  <h3 className="font-bold" style={{ color: "#1e3a5f" }}>
                    General Privacy Enquiries
                  </h3>
                </div>
                <p className="text-gray-700 text-sm">
                  For any other privacy-related queries or to exercise any other
                  right, please contact us at{" "}
                  <a
                    href="mailto:privacy@travelcb.co.uk"
                    className="underline"
                    style={{ color: "#d4af37" }}
                  >
                    privacy@travelcb.co.uk
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* 11 — Data Breach */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              11. Data Breach Notification
            </h2>
            <p className="text-gray-700 leading-relaxed">
              In the event of a personal data breach that is likely to result in a
              risk to your rights and freedoms, we will:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>
                Notify the Information Commissioner's Office (ICO) within{" "}
                <strong>72 hours</strong> of becoming aware of the breach
              </li>
              <li>
                Notify affected individuals <strong>without undue delay</strong>{" "}
                where the breach is likely to result in a high risk to their rights
                and freedoms
              </li>
              <li>
                Document the breach, its effects, and the remedial actions taken
              </li>
            </ul>
          </section>

          {/* 12 — Children */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              12. Children's Data
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our services are not directed at children under 16. We do not
              knowingly collect personal data from children under 16 without
              parental consent. Where booking data includes children's details
              (e.g. for family holidays), this is provided by a parent or guardian
              and processed under the same legal basis as the booking.
            </p>
          </section>

          {/* 13 — Changes */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              13. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify
              you of significant changes by email or by displaying a prominent
              notice on our website. Where changes affect processing based on
              consent, we will seek your consent again. We encourage you to review
              this page periodically.
            </p>
          </section>

          {/* 14 — Complaints */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              14. Complaints
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you are unhappy with how we have handled your personal data, you
              have the right to lodge a complaint with the Information
              Commissioner's Office (ICO):
            </p>
            <div
              className="rounded-lg p-4 border"
              style={{ borderColor: "#1e3a5f", backgroundColor: "#f0f4f8" }}
            >
              <p className="font-semibold" style={{ color: "#1e3a5f" }}>
                Information Commissioner's Office
              </p>
              <p className="text-gray-700 text-sm">
                Website:{" "}
                <a
                  href="https://ico.org.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline inline-flex items-center gap-1"
                  style={{ color: "#d4af37" }}
                >
                  ico.org.uk <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <p className="text-gray-700 text-sm">
                Helpline: 0303 123 1113
              </p>
              <p className="text-gray-700 text-sm">
                Live chat:{" "}
                <a
                  href="https://ico.org.uk/global/contact-us/live-chat/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "#d4af37" }}
                >
                  ico.org.uk/global/contact-us/live-chat/
                </a>
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mt-3">
              We would, however, appreciate the opportunity to address your
              concerns before you contact the ICO, so please get in touch with us
              first at{" "}
              <a
                href="mailto:privacy@travelcb.co.uk"
                className="underline"
                style={{ color: "#d4af37" }}
              >
                privacy@travelcb.co.uk
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
