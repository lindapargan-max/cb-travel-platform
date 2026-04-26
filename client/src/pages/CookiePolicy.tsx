import { Link } from "wouter";
import { Shield, Cookie, ExternalLink } from "lucide-react";
import { useSEO } from '@/hooks/useSEO';

export default function CookiePolicy() {
  useSEO({ title: 'Cookie Policy', noIndex: true });
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f6f0" }}>
      {/* Header */}
      <div className="pt-24 pb-12" style={{ backgroundColor: "#1e3a5f" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-3">
            <Cookie className="w-8 h-8" style={{ color: "#d4af37" }} />
            <h1
              className="text-3xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Cookie Policy
            </h1>
          </div>
          <p className="text-gray-300 text-sm">
            Last updated: March 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="prose prose-lg max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              1. What Are Cookies?
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Cookies are small text files that are placed on your device (computer,
              tablet, or mobile phone) when you visit a website. They are widely used
              to make websites work more efficiently, to improve your browsing
              experience, and to provide information to site owners.
            </p>
          </section>

          {/* Who we are */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              2. Who We Are
            </h2>
            <p className="text-gray-700 leading-relaxed">
              This website, <strong>cbtravel.uk</strong>, is operated by{" "}
              <strong>CB Travel (Corron Barnes T/A CB Travel)</strong>, a sole trader travel agency
              operating under JLT Group (Janine Loves Travel) as an authorised independent travel agent.
              If you have any questions about our use of cookies, please contact us
              at{" "}
              <a
                href="mailto:privacy@cbtravel.uk"
                className="underline font-medium"
                style={{ color: "#d4af37" }}
              >
                privacy@cbtravel.uk
              </a>
              .
            </p>
          </section>

          {/* Cookies We Use */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              3. Cookies We Use
            </h2>

            {/* Essential */}
            <div
              className="rounded-lg border p-5 mb-4"
              style={{ borderColor: "#1e3a5f", backgroundColor: "#f0f4f8" }}
            >
              <h3
                className="text-lg font-bold mb-2 flex items-center gap-2"
                style={{ color: "#1e3a5f" }}
              >
                <Shield className="w-5 h-5" style={{ color: "#d4af37" }} />
                Essential Cookies (Always Active)
              </h3>
              <p className="text-gray-700 text-sm mb-3">
                These cookies are necessary for the website to function and cannot be
                switched off. They are usually only set in response to actions made by
                you, such as logging in or filling in forms.
              </p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#1e3a5f" }}>
                    <th className="text-left text-white px-3 py-2 rounded-tl-md">
                      Cookie
                    </th>
                    <th className="text-left text-white px-3 py-2">Provider</th>
                    <th className="text-left text-white px-3 py-2">Purpose</th>
                    <th className="text-left text-white px-3 py-2 rounded-tr-md">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 font-mono text-xs">cb_session</td>
                    <td className="px-3 py-2">CB Travel</td>
                    <td className="px-3 py-2">
                      Maintains your logged-in session
                    </td>
                    <td className="px-3 py-2">Session</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 font-mono text-xs">
                      cb_cookie_consent
                    </td>
                    <td className="px-3 py-2">CB Travel</td>
                    <td className="px-3 py-2">
                      Stores your cookie consent preferences
                    </td>
                    <td className="px-3 py-2">1 year</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 font-mono text-xs">__cf_bm</td>
                    <td className="px-3 py-2">Cloudflare</td>
                    <td className="px-3 py-2">
                      Bot detection and security protection
                    </td>
                    <td className="px-3 py-2">30 minutes</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-xs">
                      cf_clearance
                    </td>
                    <td className="px-3 py-2">Cloudflare</td>
                    <td className="px-3 py-2">
                      Security challenge clearance
                    </td>
                    <td className="px-3 py-2">Up to 1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Analytics */}
            <div className="rounded-lg border p-5 mb-4 border-gray-300 bg-white">
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: "#1e3a5f" }}
              >
                Analytics Cookies (Off by Default)
              </h3>
              <p className="text-gray-700 text-sm mb-3">
                We do not currently use any analytics cookies. This category is
                reserved for any future analytics tools we may implement (e.g.
                privacy-friendly analytics). If we add analytics cookies, we will
                update this policy and request your consent before setting them.
              </p>
              <p className="text-gray-500 text-xs italic">
                No analytics cookies are currently in use.
              </p>
            </div>

            {/* Marketing / Social */}
            <div className="rounded-lg border p-5 mb-4 border-gray-300 bg-white">
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: "#1e3a5f" }}
              >
                Marketing / Social Media Cookies (Off by Default)
              </h3>
              <p className="text-gray-700 text-sm mb-3">
                These cookies are set by third-party services that we embed on our
                pages. They may be used by those companies to build a profile of
                your interests and show you relevant advertising on other sites.
                They are only loaded if you give your explicit consent.
              </p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#1e3a5f" }}>
                    <th className="text-left text-white px-3 py-2 rounded-tl-md">
                      Cookie
                    </th>
                    <th className="text-left text-white px-3 py-2">Provider</th>
                    <th className="text-left text-white px-3 py-2">Purpose</th>
                    <th className="text-left text-white px-3 py-2 rounded-tr-md">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 font-mono text-xs">fr</td>
                    <td className="px-3 py-2">Facebook (Meta)</td>
                    <td className="px-3 py-2">
                      Used for advertising and tracking when Facebook embed is
                      loaded
                    </td>
                    <td className="px-3 py-2">3 months</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 font-mono text-xs">_fbp</td>
                    <td className="px-3 py-2">Facebook (Meta)</td>
                    <td className="px-3 py-2">
                      Identifies browsers for advertising
                    </td>
                    <td className="px-3 py-2">3 months</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-xs">datr</td>
                    <td className="px-3 py-2">Facebook (Meta)</td>
                    <td className="px-3 py-2">
                      Browser identification for security and integrity
                    </td>
                    <td className="px-3 py-2">2 years</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-gray-500 text-xs mt-2 italic">
                Facebook cookies are only set when you accept marketing cookies.
                If you reject them, a placeholder is shown instead of the Facebook
                embed.
              </p>
            </div>
          </section>

          {/* How to manage */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              4. How to Manage Your Cookie Preferences
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you first visit our site, you will see a cookie consent banner
              where you can choose to accept all cookies, reject non-essential
              cookies, or manage your preferences individually.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              You can reset your cookie preferences at any time — simply click the button below and
              the consent banner will reappear so you can update your choices:
            </p>
            <button
              onClick={() => {
                localStorage.removeItem("cb_cookie_consent");
                window.location.reload();
              }}
              className="mb-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: "#1e3a5f" }}
            >
              Reset Cookie Preferences
            </button>
            <p className="text-gray-700 leading-relaxed mb-3">
              Alternatively, you can clear the{" "}
              <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                cb_cookie_consent
              </code>{" "}
              entry from your browser's local storage for cbtravel.uk, which will have the same effect.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You can also control and delete cookies through your browser settings.
              Most browsers allow you to refuse cookies or delete specific cookies.
              Please note that blocking essential cookies may affect the
              functionality of our site.
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1 text-sm">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "#d4af37" }}
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "#d4af37" }}
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "#d4af37" }}
                >
                  Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "#d4af37" }}
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>
          </section>

          {/* Third party */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              5. Third-Party Cookies
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Please note that third-party services (such as Facebook) may set
              their own cookies which are governed by those companies' own privacy
              policies. We have no control over the cookies set by third parties.
              We only load third-party content when you have given your explicit
              consent.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              6. Changes to This Cookie Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes
              in our use of cookies or for other operational, legal, or regulatory
              reasons. We encourage you to check this page periodically. The "Last
              updated" date at the top of this page indicates when it was last
              revised.
            </p>
          </section>

          {/* More info */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              7. More Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              For more information about how we handle your personal data, please
              read our{" "}
              <Link
                href="/privacy-policy"
                className="underline font-medium"
                style={{ color: "#d4af37" }}
              >
                Privacy Policy
              </Link>
              .
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you have any questions about our use of cookies, please contact us:
            </p>
            <div
              className="rounded-lg p-4 border"
              style={{ borderColor: "#1e3a5f", backgroundColor: "#f0f4f8" }}
            >
              <p className="font-semibold" style={{ color: "#1e3a5f" }}>
                CB Travel (Corron Barnes T/A CB Travel)
              </p>
              <p className="text-gray-700 text-sm">
                Email:{" "}
                <a
                  href="mailto:privacy@cbtravel.uk"
                  className="underline"
                  style={{ color: "#d4af37" }}
                >
                  privacy@cbtravel.uk
                </a>
              </p>
              <p className="text-gray-700 text-sm">
                Website:{" "}
                <a
                  href="https://cbtravel.uk"
                  className="underline"
                  style={{ color: "#d4af37" }}
                >
                  cbtravel.uk
                </a>
              </p>
            </div>
          </section>

          {/* ICO link */}
          <section>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: "#1e3a5f", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              8. Your Rights
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You have the right to complain to the Information Commissioner's
              Office (ICO) if you believe your data privacy rights have been
              breached. You can contact the ICO at{" "}
              <a
                href="https://ico.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="underline inline-flex items-center gap-1"
                style={{ color: "#d4af37" }}
              >
                ico.org.uk <ExternalLink className="w-3 h-3" />
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
