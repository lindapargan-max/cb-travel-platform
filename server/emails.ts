import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "CB Travel <noreply@travelcb.co.uk>";
const ADMIN_EMAIL = "hello@travelcb.co.uk";
const SITE_URL = process.env.SITE_URL || "https://www.travelcb.co.uk";

type Attachment = { filename: string; content: Buffer | string; contentType?: string };

async function send(
  to: string,
  subject: string,
  html: string,
  emailType: string = 'general',
  userId?: number,
  bookingId?: number,
  attachments?: Attachment[]
): Promise<{ success: boolean; error?: string }> {
  let success = false;
  let errorMessage: string | undefined;
  const unsubscribeEmail = `<mailto:${ADMIN_EMAIL}?subject=unsubscribe>`;
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("[Email] RESEND_API_KEY not set — skipping email to", to);
      success = false;
      errorMessage = "RESEND_API_KEY not set";
    } else {
      await resend.emails.send({
        from: FROM,
        to,
        subject,
        html,
        replyTo: ADMIN_EMAIL,
        headers: {
          "List-Unsubscribe": unsubscribeEmail,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "X-CB-Email-Type": emailType,
        },
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
      });
      console.log("[Email] Sent:", subject, "→", to);
      success = true;
    }
  } catch (err: any) {
    console.error("[Email] Failed to send to", to, ":", err);
    success = false;
    errorMessage = err?.message || String(err);
  }
  try {
    const { logEmailRecord } = await import("./db");
    await logEmailRecord({ toEmail: to, subject, emailType, status: success ? 'sent' : 'failed', errorMessage, userId, bookingId });
  } catch {}
  return { success, error: errorMessage };
}

function baseTemplate(content: string, plainText?: string) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>CB Travel</title>
  <style type="text/css">
    @media only screen and (max-width:600px) {
      .email-wrapper { padding: 12px !important; }
      .email-body { padding: 24px 20px !important; }
      .email-header { padding: 28px 20px !important; }
      .email-footer { padding: 20px !important; }
      .info-table td { display: block !important; width: 100% !important; }
      .btn-link { padding: 14px 24px !important; font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;">
    <tr>
      <td align="center" class="email-wrapper" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(30,58,95,0.10);">
          <!-- Header -->
          <tr>
            <td class="email-header" style="background:#1e3a5f;padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;font-family:Arial,sans-serif;letter-spacing:1px;">CB Travel</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:13px;font-family:Arial,sans-serif;">Your personal travel specialist</p>
              <div style="width:40px;height:3px;background:#e8b84b;margin:12px auto 0;border-radius:2px;"></div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="email-body" style="padding:36px 40px 28px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td class="email-footer" style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#1e3a5f;font-family:Arial,sans-serif;font-weight:700;">CB Travel</p>
              <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-family:Arial,sans-serif;">
                <a href="mailto:hello@travelcb.co.uk" style="color:#e8b84b;text-decoration:none;">hello@travelcb.co.uk</a>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="tel:07495823953" style="color:#e8b84b;text-decoration:none;">07495 823953</a>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="${SITE_URL}" style="color:#e8b84b;text-decoration:none;">travelcb.co.uk</a>
              </p>
              <p style="margin:10px 0 0;font-size:11px;color:#94a3b8;font-family:Arial,sans-serif;line-height:1.5;">
                &copy; 2026 CB Travel. Registered in England &amp; Wales.<br/>
                Your personal data is handled in accordance with UK GDPR and the Data Protection Act 2018.<br/>
                <a href="mailto:privacy@travelcb.co.uk" style="color:#94a3b8;text-decoration:underline;">privacy@travelcb.co.uk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function h2(text: string) {
  return `<h2 style="margin:0 0 16px;color:#1e3a5f;font-size:22px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">${text}</h2>`;
}
function p(text: string) {
  return `<p style="margin:0 0 14px;color:#475569;font-size:15px;line-height:1.7;font-family:'Segoe UI',Arial,sans-serif;">${text}</p>`;
}
function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 16px;font-size:13px;color:#64748b;font-family:'Segoe UI',Arial,sans-serif;white-space:nowrap;vertical-align:top;border-bottom:1px solid #f1f5f9;">${label}</td>
    <td style="padding:10px 16px;font-size:13px;color:#1e3a5f;font-family:'Segoe UI',Arial,sans-serif;font-weight:600;border-bottom:1px solid #f1f5f9;">${value}</td>
  </tr>`;
}
function infoTable(rows: string) {
  return `<div style="background:#f8fafc;border-radius:12px;margin:20px 0;border:1px solid #e2e8f0;overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;"><tbody>${rows}</tbody></table>
  </div>`;
}
function btn(text: string, href: string) {
  return `<div style="text-align:center;margin:28px 0 8px;">
    <a href="${href}" style="display:inline-block;background:#1e3a5f;color:#ffffff;padding:14px 40px;border-radius:50px;text-decoration:none;font-family:'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:600;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(30,58,95,0.3);">${text}</a>
  </div>`;
}
function promoBox(code: string, amount: string, message: string, expiry?: string) {
  return `<div style="background:linear-gradient(135deg,#fef9f0 0%,#fff8e8 100%);border-radius:16px;padding:28px;margin:24px 0;border:2px solid #e8b84b;text-align:center;">
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-family:'Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">🎁 ${message}</p>
    <div style="background:#ffffff;border:2px dashed #e8b84b;border-radius:10px;padding:14px 28px;display:inline-block;margin:8px auto;">
      <p style="margin:0;font-family:'Courier New',monospace;font-size:22px;font-weight:700;color:#1e3a5f;letter-spacing:3px;">${code}</p>
    </div>
    <p style="margin:10px 0 0;font-size:13px;color:#e8b84b;font-family:'Segoe UI',Arial,sans-serif;font-weight:600;">${amount}</p>
    ${expiry ? `<p style="margin:6px 0 0;font-size:11px;color:#94a3b8;font-family:'Segoe UI',Arial,sans-serif;">${expiry}</p>` : ''}
  </div>`;
}
function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return d; }
}
function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Welcome / Set Password (GDPR-compliant) ──────────────────────────────────

export async function sendSetPasswordEmail(to: string, name: string, setPasswordUrl: string) {
  const html = baseTemplate(`
    ${h2(`Welcome to CB Travel, ${name}! ✈️`)}
    ${p("Your account has been created by our team. To get started, please set your own password by clicking the button below.")}
    ${p("This link is valid for <strong>24 hours</strong>. If it expires, contact us and we'll send a new one.")}
    ${btn("Set Your Password", setPasswordUrl)}
    ${p("Once you've set your password, you can log in to:")}
    <ul style="color:#475569;font-size:14px;line-height:2;font-family:'Segoe UI',Arial,sans-serif;padding-left:20px;">
      <li>View your bookings and travel documents</li>
      <li>Check your pre-trip checklist</li>
      <li>Access your loyalty points and rewards</li>
    </ul>
    ${p(`Questions? Contact us at <a href="mailto:hello@travelcb.co.uk" style="color:#e8b84b;">hello@travelcb.co.uk</a> or call <a href="tel:07495823953" style="color:#e8b84b;">07495 823953</a>.`)}
  `);
  await send(to, "Welcome to CB Travel — Set Your Password", html, 'set_password');
}

export async function sendWelcomeEmail(to: string, name: string, setPasswordUrl: string) {
  return sendSetPasswordEmail(to, name, setPasswordUrl);
}

export async function sendWelcomeWithPromoEmail(to: string, name: string, setPasswordUrl: string, promoCode: string, promoAmount: number) {
  const html = baseTemplate(`
    ${h2(`Welcome to CB Travel, ${name}! ✈️`)}
    ${p("Your account has been created by our team. To get started, please set your own secure password:")}
    ${btn("Set Your Password", setPasswordUrl)}
    ${p("This link is valid for 24 hours.")}
    ${promoBox(promoCode, `£${promoAmount} off your first booking!`, "Welcome Gift", "Valid for 12 months · One use only")}
    ${p(`Questions? <a href="mailto:hello@travelcb.co.uk" style="color:#e8b84b;">hello@travelcb.co.uk</a>`)}
  `);
  await send(to, `Welcome to CB Travel — Set Your Password & £${promoAmount} Gift`, html, 'welcome_promo');
}

// ─── Booking Confirmed ────────────────────────────────────────────────────────


export async function sendBookingUpdatedEmail(
  to: string,
  name: string,
  booking: {
    bookingReference: string;
    destination?: string | null;
    departureDate?: string | null;
    returnDate?: string | null;
    status?: string | null;
    notes?: string | null;
  }
): Promise<void> {
  const html = baseTemplate(`
      <h2 style="color:#1e3a5f;margin:0 0 16px;">Booking Update Confirmation</h2>
      <p>Hi ${name},</p>
      <p>Your booking has been updated. Here are the latest details:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#666;width:40%;">Booking Reference</td><td style="padding:8px 0;font-weight:600;color:#1e3a5f;">${booking.bookingReference}</td></tr>
        ${booking.destination ? `<tr><td style="padding:8px 0;color:#666;">Destination</td><td style="padding:8px 0;font-weight:600;">${booking.destination}</td></tr>` : ''}
        ${booking.departureDate ? `<tr><td style="padding:8px 0;color:#666;">Departure</td><td style="padding:8px 0;">${booking.departureDate}</td></tr>` : ''}
        ${booking.returnDate ? `<tr><td style="padding:8px 0;color:#666;">Return</td><td style="padding:8px 0;">${booking.returnDate}</td></tr>` : ''}
        ${booking.status ? `<tr><td style="padding:8px 0;color:#666;">Status</td><td style="padding:8px 0;"><span style="background:#1e3a5f;color:#fff;padding:2px 10px;border-radius:12px;font-size:13px;">${booking.status}</span></td></tr>` : ''}
        ${booking.notes ? `<tr><td style="padding:8px 0;color:#666;">Notes</td><td style="padding:8px 0;">${booking.notes}</td></tr>` : ''}
      </table>
      <p>If you have any questions, please contact us at <a href="mailto:hello@travelcb.co.uk" style="color:#1e3a5f;">hello@travelcb.co.uk</a>.</p>
      <p>Safe travels,<br><strong>The CB Travel Team</strong></p>
  `);
  await send(to, `Booking Update — ${booking.bookingReference} | CB Travel`, html, 'booking_update', undefined, undefined);
}

export async function sendBookingConfirmationEmail(
  to: string,
  name: string,
  booking: {
    bookingReference: string;
    destination?: string | null;
    departureDate?: string | null;
    returnDate?: string | null;
    status: string;
    totalPrice?: number | null;
    numberOfTravelers?: number | null;
  }
) {
  const rows = [
    infoRow("Booking Ref", `<span style="font-family:'Courier New',monospace;">${booking.bookingReference}</span>`),
    booking.destination ? infoRow("Destination", booking.destination) : "",
    booking.departureDate ? infoRow("Departure", formatDate(booking.departureDate)) : "",
    booking.returnDate ? infoRow("Return", formatDate(booking.returnDate)) : "",
    booking.numberOfTravelers ? infoRow("Travellers", String(booking.numberOfTravelers)) : "",
    booking.totalPrice ? infoRow("Total Price", `£${Number(booking.totalPrice).toFixed(2)}`) : "",
    infoRow("Status", booking.status.charAt(0).toUpperCase() + booking.status.slice(1)),
  ].filter(Boolean).join("");

  const html = baseTemplate(`
    ${h2(`Booking Confirmed, ${name}! 🎉`)}
    ${p("Your travel booking has been created with CB Travel. Here's a summary:")}
    ${infoTable(rows)}
    ${p("You can view your full booking details, documents, and checklist through your personal portal.")}
    ${btn("View My Booking", `${SITE_URL}/dashboard`)}
    ${p("We'll be in touch with more details as your trip gets closer. Any questions — just ask!")}
  `);
  await send(to, `Booking Confirmed — ${booking.bookingReference}`, html, 'booking_confirmation');
}

// ─── Document Uploaded ────────────────────────────────────────────────────────

export async function sendDocumentUploadEmail(
  to: string,
  name: string,
  document: { fileName: string; documentType: string; bookingReference: string }
) {
  const html = baseTemplate(`
    ${h2(`New Document Available`)}
    ${p(`Hi ${name}, a new document has been added to your booking.`)}
    ${infoTable(
      infoRow("Document", document.fileName) +
      infoRow("Type", document.documentType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())) +
      infoRow("Booking", document.bookingReference)
    )}
    ${p("Log in to your portal to view and download this document.")}
    ${btn("View My Documents", `${SITE_URL}/dashboard`)}
  `);
  await send(to, `New Document: ${document.fileName}`, html, 'document_upload');
}

// ─── Quote Request ────────────────────────────────────────────────────────────

export async function sendQuoteRequestConfirmationEmail(to: string, name: string, destination: string) {
  const html = baseTemplate(`
    ${h2(`Quote Request Received! ✈️`)}
    ${p(`Hi ${name}, thank you for your quote request for <strong style="color:#1e3a5f;">${destination}</strong>.`)}
    ${p("One of our travel specialists will be in touch within 24 hours to discuss your perfect holiday.")}
    ${p("In the meantime, feel free to browse our latest deals or get in touch if you have any questions.")}
    ${btn("View Our Deals", `${SITE_URL}/#deals`)}
    ${p(`Questions? <a href="mailto:hello@travelcb.co.uk" style="color:#e8b84b;">hello@travelcb.co.uk</a> · <a href="tel:07495823953" style="color:#e8b84b;">07495 823953</a>`)}
  `);
  await send(to, "We've received your quote request — CB Travel", html, 'quote_request');
}

export async function sendNewQuoteRequestAdminEmail(
  quoteData: {
    name: string;
    email: string;
    phone?: string;
    travelType: string;
    destination?: string;
    departureDate?: string;
    budget?: string;
    message?: string;
    numberOfTravelers?: number;
  }
) {
  const rows = [
    infoRow("Name", quoteData.name),
    infoRow("Email", quoteData.email),
    quoteData.phone ? infoRow("Phone", quoteData.phone) : "",
    infoRow("Travel Type", quoteData.travelType),
    quoteData.destination ? infoRow("Destination", quoteData.destination) : "",
    quoteData.departureDate ? infoRow("Departure", quoteData.departureDate) : "",
    quoteData.numberOfTravelers ? infoRow("Travellers", String(quoteData.numberOfTravelers)) : "",
    quoteData.budget ? infoRow("Budget", quoteData.budget) : "",
    quoteData.message ? infoRow("Message", quoteData.message) : "",
  ].filter(Boolean).join("");

  const html = baseTemplate(`
    ${h2("New Quote Request 📋")}
    ${p("A new quote request has been submitted via the website.")}
    ${infoTable(rows)}
    ${btn("View in Admin", `${SITE_URL}/admin`)}
  `);
  await send(ADMIN_EMAIL, `New Quote Request — ${quoteData.name} (${quoteData.destination || quoteData.travelType})`, html, 'quote_request_admin');
}

// ─── Booking Intake Form ──────────────────────────────────────────────────────

export async function sendIntakeFormConfirmationEmail(to: string, name: string, submissionRef: string) {
  const html = baseTemplate(`
    ${h2(`Booking Form Received! 🎉`)}
    ${p(`Hi ${name}, thank you for completing your booking form. We've received everything and our team will be in touch shortly.`)}
    ${infoTable(infoRow("Reference", submissionRef))}
    ${p("We'll review your details and contact you to confirm your booking and arrange payment.")}
    ${btn("Log In to Your Portal", `${SITE_URL}/login`)}
    ${p(`Any questions? <a href="mailto:hello@travelcb.co.uk" style="color:#e8b84b;">hello@travelcb.co.uk</a>`)}
  `);
  await send(to, `Booking Form Received — Ref: ${submissionRef}`, html, 'intake_form');
}

// ─── Password Reset ────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, name: string, resetCode: string) {
  const html = baseTemplate(`
    ${h2("Password Reset Request")}
    ${p(`Hi ${name}, we received a request to reset your CB Travel account password.`)}
    ${p("Here is your 6-digit reset code. It expires in <strong>30 minutes</strong>.")}
    <div style="text-align:center;margin:32px 0;">
      <div style="display:inline-block;background:#f8fafc;border:2px solid #e8b84b;border-radius:16px;padding:24px 40px;">
        <p style="margin:0 0 6px;font-size:12px;color:#64748b;font-family:'Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">Your Reset Code</p>
        <p style="margin:0;font-family:'Courier New',monospace;font-size:36px;font-weight:700;color:#1e3a5f;letter-spacing:8px;">${resetCode}</p>
      </div>
    </div>
    ${p("Enter this code on the password reset page to set your new password.")}
    ${btn("Reset My Password", `${SITE_URL}/reset-password?email=${encodeURIComponent(to)}`)}
    ${p("<em style='color:#94a3b8;font-size:13px;'>If you didn't request a password reset, you can safely ignore this email.</em>")}
  `);
  await send(to, "CB Travel — Your Password Reset Code", html, 'password_reset');
}

// ─── Account Disabled / Enabled ──────────────────────────────────────────────

export async function sendAccountDisabledEmail(to: string, name: string) {
  const html = baseTemplate(`
    ${h2("Account Temporarily Suspended")}
    ${p(`Hi ${name}, your CB Travel account has been temporarily suspended.`)}
    ${p("If you believe this is an error, please contact our team:")}
    ${infoTable(
      infoRow("Email", `<a href="mailto:hello@travelcb.co.uk" style="color:#e8b84b;">hello@travelcb.co.uk</a>`) +
      infoRow("Phone", `<a href="tel:07495823953" style="color:#e8b84b;">07495 823953</a>`)
    )}
    ${p("We aim to resolve any issues as quickly as possible.")}
  `);
  await send(to, "CB Travel — Your Account Has Been Suspended", html, 'account_disabled');
}

export async function sendAccountEnabledEmail(to: string, name: string) {
  const html = baseTemplate(`
    ${h2("Your Account Has Been Re-Activated! 🎉")}
    ${p(`Hi ${name}, great news — your CB Travel account has been re-activated and you can now log in again.`)}
    ${btn("Log In to Your Portal", `${SITE_URL}/login`)}
    ${p(`Questions? <a href="mailto:hello@travelcb.co.uk" style="color:#e8b84b;">hello@travelcb.co.uk</a>`)}
  `);
  await send(to, "CB Travel — Your Account Has Been Re-Activated", html, 'account_enabled');
}

// ─── Custom Email ─────────────────────────────────────────────────────────────

export async function sendCustomEmail(to: string, name: string, subject: string, body: string) {
  const html = baseTemplate(`
    ${h2(`Hi ${name}`)}
    ${body.split("\n").map(line => p(line)).join("")}
    ${btn("Log In to Your Portal", `${SITE_URL}/dashboard`)}
  `);
  await send(to, subject, html, 'custom');
}

// ─── Postcard (pre-departure) ─────────────────────────────────────────────────

export async function sendPreDeparturePostcard(
  to: string,
  name: string,
  destination: string,
  booking: { bookingReference: string; departureDate?: string | null; returnDate?: string | null }
) {
  const rows = [
    infoRow("Booking Ref", booking.bookingReference),
    infoRow("Destination", destination),
    booking.departureDate ? infoRow("Departure", formatDate(booking.departureDate)) : "",
    booking.returnDate ? infoRow("Return", formatDate(booking.returnDate)) : "",
  ].filter(Boolean).join("");

  const html = baseTemplate(`
    <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5986 100%);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;color:#e8b84b;font-size:28px;">🌍✈️</p>
      <p style="margin:8px 0 0;color:#ffffff;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">A digital postcard from CB Travel</p>
    </div>
    ${h2(`Hi ${name}! Your adventure begins tomorrow! 🎉`)}
    ${p(`Tomorrow you head off to <strong style="color:#1e3a5f;">${destination}</strong>! We hope you have an absolutely wonderful trip.`)}
    ${p("Here's a quick reminder of your trip details:")}
    ${infoTable(rows)}
    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid #e8b84b;">
      <p style="margin:0 0 6px;font-size:13px;color:#1e3a5f;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">✅ Pre-departure checklist</p>
      <p style="margin:0 0 6px;font-size:13px;color:#1e3a5f;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">📄 Travel documents ready</p>
      <p style="margin:0;font-size:13px;color:#1e3a5f;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">✈️ Flight information confirmed</p>
    </div>
    ${btn("View My Trip Details", `${SITE_URL}/dashboard`)}
    ${p("From all of us at CB Travel — have a safe journey and an incredible adventure. Bon voyage! 🥂")}
    ${p("<em style='color:#94a3b8;font-size:13px;'>Need anything last minute? Call us: <a href='tel:07495823953' style='color:#e8b84b;'>07495 823953</a></em>")}
  `);
  await send(to, `Your adventure begins tomorrow — ${destination} 🌍`, html, 'postcard');
}

// ─── Birthday Email ───────────────────────────────────────────────────────────

export async function sendBirthdayEmail(to: string, name: string, promoCode: string, promoAmount: number) {
  const html = baseTemplate(`
    <div style="text-align:center;margin-bottom:24px;">
      <p style="font-size:48px;margin:0;">🎂🎉</p>
    </div>
    ${h2(`Happy Birthday, ${name}!`)}
    ${p("The whole CB Travel team is wishing you a wonderful birthday! As a little gift from us to you:")}
    ${promoBox(promoCode, `£${promoAmount} off your next booking!`, "Birthday Gift from CB Travel", "Valid for 30 days · One use only")}
    ${p("We hope you celebrate in style — and maybe start planning your next adventure!")}
    ${btn("Browse Our Deals", `${SITE_URL}`)}
    ${p("Have a magical day! 🎈")}
  `);
  await send(to, `🎂 Happy Birthday from CB Travel, ${name}!`, html, 'birthday');
}

// ─── Feedback Promo ───────────────────────────────────────────────────────────

export async function sendFeedbackPromoEmail(to: string, name: string, promoCode: string, promoAmount: number) {
  const html = baseTemplate(`
    ${h2(`Thank You for Your Feedback, ${name}! ⭐`)}
    ${p("Your review means the world to us and helps us provide an even better service to all our clients.")}
    ${p("As a thank you, here's a little something from the CB Travel team:")}
    ${promoBox(promoCode, `£${promoAmount} off your next booking!`, "Thank You Gift", "Valid for 6 months · One use only")}
    ${btn("Start Planning Your Next Trip", `${SITE_URL}`)}
    ${p("Thanks again for being such a wonderful client!")}
  `);
  await send(to, "Thank You for Your Feedback — Here's a Gift! 🎁", html, 'feedback_promo');
}

// ─── Referral Promo (for referrer) ───────────────────────────────────────────

export async function sendReferralPromoEmail(to: string, name: string, promoCode: string, friendName: string) {
  const html = baseTemplate(`
    ${h2(`Your Friend Has Joined CB Travel! 🎉`)}
    ${p(`Great news, ${name} — ${friendName} has signed up using your referral link!`)}
    ${p("As a thank you for spreading the word, here's a reward for you:")}
    ${promoBox(promoCode, "£15 off your next booking!", "Referral Reward", "Valid for 12 months · One use only")}
    ${btn("Plan Your Next Trip", `${SITE_URL}`)}
    ${p("Keep sharing your referral link — there's no limit to how many friends you can refer!")}
  `);
  await send(to, `Your referral reward — ${friendName} joined CB Travel!`, html, 'referral_promo');
}

// ─── Referral Welcome (for new user) ─────────────────────────────────────────

export async function sendReferralWelcomeEmail(to: string, name: string, promoCode: string) {
  const html = baseTemplate(`
    ${h2(`Welcome to CB Travel, ${name}! ✈️`)}
    ${p("You were referred by a friend, so we'd like to welcome you with a little extra something:")}
    ${promoBox(promoCode, "£10 off your first booking!", "Welcome Referral Discount", "Valid for 12 months · One use only")}
    ${p("We can't wait to help you plan your perfect trip. Browse our latest deals or request a bespoke quote.")}
    ${btn("Browse Our Deals", `${SITE_URL}`)}
    ${p(`Any questions? <a href="mailto:hello@travelcb.co.uk" style="color:#e8b84b;">hello@travelcb.co.uk</a>`)}
  `);
  await send(to, "Welcome to CB Travel — Here's a Gift From Your Friend!", html, 'referral_welcome');
}

// ─── Loyalty Reward Claimed ───────────────────────────────────────────────────

export async function sendLoyaltyRewardEmail(
  to: string,
  name: string,
  rewardName: string,
  voucherCode: string,
  voucherBuffer?: Buffer,
  expiryDate?: string,
  rewardType?: string,
) {
  const isDiscount = !rewardType || ["discount", "voucher", "upgrade"].includes(rewardType);
  const subject = `🎁 Your CB Travel Loyalty Reward — ${rewardName}`;

  const rewardBlock = isDiscount
    ? `<!-- Discount code block -->
      <div style="text-align:center;margin:28px 0;">
        <p style="margin:0 0 10px;font-size:13px;color:#64748b;font-family:'Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">🎁 Your Discount Code</p>
        <div style="background:linear-gradient(135deg,#fef9f0 0%,#fff8e8 100%);border-radius:16px;padding:24px 32px;border:2px solid #e8b84b;display:inline-block;min-width:260px;">
          <div style="background:#ffffff;border:2px dashed #e8b84b;border-radius:10px;padding:14px 28px;margin-bottom:10px;">
            <p style="margin:0;font-family:'Courier New',monospace;font-size:26px;font-weight:700;color:#1e3a5f;letter-spacing:4px;">${escHtml(voucherCode)}</p>
          </div>
          ${expiryDate ? `<p style="margin:0;font-size:12px;color:#94a3b8;font-family:'Segoe UI',Arial,sans-serif;">Valid until ${escHtml(expiryDate)}</p>` : ''}
        </div>
        <p style="margin:16px 0 0;font-size:14px;color:#475569;font-family:'Segoe UI',Arial,sans-serif;">
          Quote this code when booking your next trip — we'll apply the discount automatically.
        </p>
      </div>`
    : `<!-- Voucher / show-to-CB-Travel block -->
      <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5986 100%);border-radius:16px;padding:28px;text-align:center;margin:24px 0;">
        <p style="color:#93c5fd;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Your Booking Reference</p>
        <p style="color:#e8b84b;font-size:28px;font-weight:700;font-family:'Courier New',monospace;letter-spacing:4px;margin:0 0 10px;">${escHtml(voucherCode)}</p>
        ${expiryDate ? `<p style="color:rgba(255,255,255,0.6);font-size:12px;margin:0;">Valid until ${escHtml(expiryDate)}</p>` : ''}
      </div>
      <div style="background:#fef9f0;border:2px solid #e8b84b;border-radius:14px;padding:20px;margin:0 0 20px;text-align:center;">
        <p style="margin:0 0 6px;font-size:16px;color:#1e3a5f;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">📋 How to Redeem</p>
        <p style="margin:0 0 12px;font-size:14px;color:#475569;font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;">
          Simply <strong>mention your voucher code</strong> when you next contact us to book your trip.<br/>
          We'll apply your reward — no printing necessary!
        </p>
        <p style="margin:0;font-size:13px;color:#64748b;font-family:'Segoe UI',Arial,sans-serif;">
          📧 <a href="mailto:hello@travelcb.co.uk" style="color:#1e3a5f;font-weight:600;">hello@travelcb.co.uk</a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          💬 <a href="https://wa.me/447534168295" style="color:#1e3a5f;font-weight:600;">WhatsApp 07534 168295</a>
        </p>
      </div>`;

  const html = baseTemplate(`
    ${h2(`Congratulations, ${escHtml(name)}! 🎉`)}
    ${p(`Your loyalty reward request has been fulfilled. Here's what you've claimed:`)}
    <div style="background:#f8fafc;border-left:4px solid #e8b84b;padding:16px 20px;margin:20px 0;border-radius:0 12px 12px 0;">
      <p style="color:#1e3a5f;font-size:18px;font-weight:700;margin:0 0 4px;font-family:'Segoe UI',Arial,sans-serif;">${escHtml(rewardName)}</p>
      <p style="color:#94a3b8;font-size:12px;margin:0;font-family:'Segoe UI',Arial,sans-serif;">CB Travel Loyalty Reward</p>
    </div>
    ${rewardBlock}
    ${voucherBuffer ? p("Your personalised voucher image is attached — save it for easy reference!") : ""}
    ${p(`Questions? Just reply to this email or contact us at <a href="mailto:hello@travelcb.co.uk" style="color:#e8b84b;">hello@travelcb.co.uk</a> or call <a href="tel:07495823953" style="color:#e8b84b;">07495 823953</a>.`)}
  `);

  const attachments: any[] = [];
  if (voucherBuffer) {
    attachments.push({
      filename: `CB-Travel-Reward-${voucherCode}.png`,
      content: voucherBuffer,
      contentType: "image/png",
    });
  }

  return send(to, subject, html, "loyalty_reward", undefined, undefined,
    attachments.length > 0 ? attachments : undefined);
}


export async function sendSOSAlertEmail(data: {
  clientName: string;
  bookingRef: string;
  destination: string;
  clientEmail?: string;
  timestamp: Date;
}) {
  const html = baseTemplate(`
    <div style="background:#dc2626;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;color:#ffffff;font-size:24px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">🆘 EMERGENCY SOS ACTIVATED</p>
    </div>
    ${h2("Emergency Alert — Immediate Attention Required")}
    ${infoTable(
      infoRow("Client", data.clientName) +
      infoRow("Booking Ref", data.bookingRef) +
      infoRow("Destination", data.destination) +
      (data.clientEmail ? infoRow("Client Email", data.clientEmail) : "") +
      infoRow("Timestamp", data.timestamp.toLocaleString('en-GB'))
    )}
    ${p("<strong style='color:#dc2626;'>A client has pressed the Emergency SOS button. Please contact them immediately.</strong>")}
    ${btn("View Booking in Admin", `${SITE_URL}/admin`)}
  `);
  await send(
    ADMIN_EMAIL,
    `🆘 EMERGENCY SOS — ${data.clientName} — ${data.destination}`,
    html,
    'sos_alert'
  );
}

// ─── Smart Travel Notifications ───────────────────────────────────────────────

export async function sendNotification7Day(
  to: string, name: string,
  booking: { destination: string; departureDate: string; bookingReference: string }
) {
  const html = baseTemplate(`
    ${h2(`Your holiday is 1 week away! 🌍`)}
    ${p(`Hi ${name}, get ready — you're off to <strong style="color:#1e3a5f;">${booking.destination}</strong> in just 7 days!`)}
    ${infoTable(
      infoRow("Destination", booking.destination) +
      infoRow("Departure", formatDate(booking.departureDate)) +
      infoRow("Booking Ref", booking.bookingReference)
    )}
    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid #e8b84b;">
      <p style="margin:0 0 10px;font-size:14px;color:#1e3a5f;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">📋 7-Day Checklist:</p>
      <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:2;font-family:'Segoe UI',Arial,sans-serif;">
        <li>Check passport validity (6 months from return date)</li>
        <li>Confirm travel insurance is active</li>
        <li>Check visa requirements for ${booking.destination}</li>
        <li>Download airline app and check-in opens in the next few days</li>
        <li>Notify your bank of travel dates</li>
        <li>Check the weather forecast</li>
        <li>Pack according to destination climate</li>
      </ul>
    </div>
    ${btn("View My Trip Details", `${SITE_URL}/dashboard`)}
    ${p(`Questions? <a href="tel:07495823953" style="color:#e8b84b;">07495 823953</a> · <a href="mailto:hello@travelcb.co.uk" style="color:#e8b84b;">hello@travelcb.co.uk</a>`)}
  `);
  await send(to, `Your holiday to ${booking.destination} is in 7 days! 🌍`, html, 'notification_7day');
}

export async function sendNotification48Hour(
  to: string, name: string,
  booking: { destination: string; departureDate: string; bookingReference: string }
) {
  const html = baseTemplate(`
    ${h2(`You fly in 48 hours! ✈️`)}
    ${p(`Hi ${name}, the excitement is building — you're heading to <strong style="color:#1e3a5f;">${booking.destination}</strong> in just 2 days!`)}
    ${infoTable(
      infoRow("Destination", booking.destination) +
      infoRow("Departure", formatDate(booking.departureDate)) +
      infoRow("Booking Ref", booking.bookingReference)
    )}
    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid #e8b84b;">
      <p style="margin:0 0 10px;font-size:14px;color:#1e3a5f;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">⏰ 48-Hour Reminders:</p>
      <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:2;font-family:'Segoe UI',Arial,sans-serif;">
        <li>Complete online check-in (if not already done)</li>
        <li>Print or download boarding passes</li>
        <li>Confirm transfer and airport arrangements</li>
        <li>Pack all medications and essentials in hand luggage</li>
        <li>Charge all devices and download offline entertainment</li>
        <li>Set your alarm! 🔔</li>
      </ul>
    </div>
    ${btn("View My Documents", `${SITE_URL}/dashboard`)}
    ${p(`Need anything? <a href="tel:07495823953" style="color:#e8b84b;">07495 823953</a>`)}
  `);
  await send(to, `You fly in 48 hours to ${booking.destination}! ✈️`, html, 'notification_48hour');
}

export async function sendNotificationDeparture(
  to: string, name: string,
  booking: { destination: string; departureDate: string; bookingReference: string }
) {
  const html = baseTemplate(`
    ${h2(`Today's the day, ${name}! 🎉`)}
    ${p(`Your adventure to <strong style="color:#1e3a5f;">${booking.destination}</strong> starts today! The CB Travel team is wishing you an amazing trip.`)}
    ${infoTable(
      infoRow("Destination", booking.destination) +
      infoRow("Departure", "Today!") +
      infoRow("Booking Ref", booking.bookingReference)
    )}
    <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5986 100%);border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
      <p style="margin:0 0 8px;color:#e8b84b;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">CB Travel Emergency Contact</p>
      <p style="margin:0;color:#ffffff;font-size:18px;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">07495 823953</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">hello@travelcb.co.uk</p>
    </div>
    ${p("All your travel documents are available in your portal. Have a safe journey!")}
    ${btn("View My Trip Details", `${SITE_URL}/dashboard`)}
    ${p("From all of us at CB Travel — bon voyage! 🥂")}
  `);
  await send(to, `Today's the day — ${booking.destination} awaits! 🎉`, html, 'notification_departure');
}

// ─── Newsletter Campaign ───────────────────────────────────────────────────────

export async function sendCampaignEmail(to: string, subject: string, htmlBody: string, unsubscribeToken: string) {
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${unsubscribeToken}`;
  const fullHtml = baseTemplate(`
    ${htmlBody}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="font-size:11px;color:#94a3b8;font-family:'Segoe UI',Arial,sans-serif;">
        You are receiving this because you subscribed to CB Travel news.<br />
        <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  `);
  await send(to, subject, fullHtml, 'campaign');
}

// ─── Admin: New Intake Form ────────────────────────────────────────────────────

export async function sendNewIntakeFormAdminEmail(form: {
  leadFirstName: string; leadLastName: string; email: string;
  phone: string; destination: string; submissionRef: string;
}) {
  const html = baseTemplate(`
    ${h2("New Booking Form Submitted 📋")}
    ${p(`A new booking intake form has been submitted.`)}
    ${infoTable(
      infoRow("Name", `${form.leadFirstName} ${form.leadLastName}`) +
      infoRow("Email", form.email) +
      infoRow("Phone", form.phone) +
      infoRow("Destination", form.destination) +
      infoRow("Ref", form.submissionRef)
    )}
    ${btn("View in Admin", `${SITE_URL}/admin`)}
  `);
  await send(ADMIN_EMAIL, `New Booking Form — ${form.leadFirstName} ${form.leadLastName}`, html, 'intake_admin');
}


// ─── Compatibility Aliases (existing routers.ts uses these names) ────────────

export async function sendDocumentUploadedEmail(to: string, name: string, fileName: string, bookingRef: string, documentType: string) {
  return sendDocumentUploadEmail(to, name, { fileName, documentType, bookingReference: bookingRef });
}

export async function sendQuoteRequestAdminEmail(quoteData: {
  name: string; email: string; phone?: string; travelType: string;
  destination?: string; departureDate?: string; returnDate?: string;
  numberOfTravelers?: number; budget?: string; message?: string; quoteType?: string;
}) {
  return sendNewQuoteRequestAdminEmail(quoteData);
}

export async function sendQuoteConfirmationEmail(to: string, name: string, destination: string) {
  return sendQuoteRequestConfirmationEmail(to, name, destination || "your destination");
}

export async function sendIntakeFormAdminEmail(form: {
  leadFirstName: string; leadLastName: string; email: string; phone: string;
  destination: string; departureDate?: string; returnDate?: string;
  numberOfAdults?: number; numberOfChildren?: number; submissionRef: string; budget?: string;
}) {
  return sendNewIntakeFormAdminEmail(form);
}

export async function sendPostcardEmail(to: string, name: string, booking: {
  bookingReference: string; destination?: string | null; departureDate?: string | null; returnDate?: string | null;
}) {
  return sendPreDeparturePostcard(to, name, booking.destination || "your destination", booking);
}

export async function sendDocumentPasswordEmail(to: string, name: string, documentName: string, password: string) {
  const { baseTemplate, btn, p, h2, infoTable, infoRow } = { baseTemplate: null, btn: null, p: null, h2: null, infoTable: null, infoRow: null };
  // Simple inline implementation
  const html = `<!DOCTYPE html><html><body style="font-family:Segoe UI,Arial,sans-serif;background:#f0f4f8;"><div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,58,95,0.12);"><div style="background:linear-gradient(135deg,#1e3a5f,#2d5986);padding:36px 40px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">CB Travel</h1></div><div style="padding:40px;"><h2 style="color:#1e3a5f;">Document Password</h2><p style="color:#475569;">Hi ${name}, a password-protected document has been shared with you.</p><div style="background:#f8fafc;border-radius:12px;padding:20px;margin:16px 0;border:1px solid #e2e8f0;"><p style="margin:0 0 6px;color:#64748b;font-size:13px;">Document: <strong>${documentName}</strong></p><p style="margin:0;color:#64748b;font-size:13px;">Password: <strong style="color:#1e3a5f;font-family:monospace;font-size:16px;">${password}</strong></p></div></div><div style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0;font-size:11px;color:#94a3b8;">CB Travel | hello@travelcb.co.uk | travelcb.co.uk | &copy; 2026 CB Travel</p></div></div></body></html>`;
  await send(to, `Document Password — ${documentName}`, html, 'document_password', undefined, undefined);
}

// ─── LOYALTY EMAILS ────────────────────────────────────────────────────────────

// ─── Redemption Cancelled ─────────────────────────────────────────────────────

export async function sendRedemptionCancelledEmail(
  to: string,
  name: string,
  rewardName: string,
  pointsReturned: boolean,
  pointsAmount: number,
) {
  const subject = `Loyalty Redemption Update — ${rewardName}`;
  const html = baseTemplate(
    `<p style="color:#555;font-size:15px">Dear ${escHtml(name)},</p>
    <p style="color:#555;font-size:15px">We're writing to let you know that your loyalty redemption for <strong>${escHtml(rewardName)}</strong> has been cancelled by our team.</p>
    ${pointsReturned
      ? `<div style="background:#e8f5e9;border-left:4px solid #4caf50;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0">
          <p style="color:#2e7d32;font-size:15px;font-weight:bold;margin:0">✅ ${pointsAmount.toLocaleString()} points have been returned to your account</p>
          <p style="color:#555;font-size:13px;margin:6px 0 0">Your loyalty balance has been updated and the points are available to use immediately.</p>
        </div>`
      : `<div style="background:#fff3e0;border-left:4px solid #ff9800;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0">
          <p style="color:#e65100;font-size:15px;font-weight:bold;margin:0">Points were not returned for this cancellation</p>
          <p style="color:#555;font-size:13px;margin:6px 0 0">If you believe this is an error, please contact us.</p>
        </div>`
    }
    <p style="color:#555;font-size:14px">If you have any questions about this cancellation, please don't hesitate to get in touch:</p>
    <div style="background:#f0f4f8;border-radius:8px;padding:16px;margin:20px 0">
      <p style="color:#555;font-size:14px;margin:0 0 6px">📧 Email: <a href="mailto:hello@travelcb.co.uk" style="color:#1e3a5f">hello@travelcb.co.uk</a></p>
      <p style="color:#555;font-size:14px;margin:0">💬 WhatsApp: <a href="https://wa.me/447534168295" style="color:#1e3a5f">07534 168295</a></p>
    </div>`
  );
  await send(to, subject, html, 'redemption_cancelled');
}

export async function sendVoucherEmail(opts: {
  to: string;
  clientName: string;
  rewardName: string;
  rewardDescription?: string;
  voucherCode: string;
  pointsSpent: number;
  expiryDate: string;
  voucherBuffer: Buffer;
}) {
  const subject = `🎁 Your CB Travel Reward Voucher — ${opts.rewardName}`;
  const html = baseTemplate(`<h2 style="color:#1e3a5f;margin:0 0 8px">Congratulations, ${opts.clientName}!</h2>
    <p style="color:#555;font-size:15px;margin:0 0 20px">You've successfully redeemed your loyalty points for:</p>
    <div style="background:linear-gradient(135deg,#1e3a5f,#2c5282);border-radius:12px;padding:24px;text-align:center;margin:20px 0">
      <p style="color:#e8b84b;font-size:13px;letter-spacing:3px;margin:0 0 8px">YOUR REWARD</p>
      <h3 style="color:#ffffff;font-size:22px;margin:0 0 6px">${opts.rewardName}</h3>
      ${opts.rewardDescription ? `<p style="color:#c4d4e8;font-size:14px;margin:0">${opts.rewardDescription}</p>` : ""}
    </div>
    <div style="border:2px solid #1e3a5f;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
      <p style="color:#888;font-size:11px;letter-spacing:3px;margin:0 0 8px">VOUCHER CODE</p>
      <p style="font-family:'Courier New',monospace;font-size:26px;font-weight:bold;color:#1e3a5f;letter-spacing:4px;margin:0">${opts.voucherCode}</p>
    </div>
    <table style="width:100%;margin:16px 0">
      <tr>
        <td style="padding:8px;background:#f8f9fa;border-radius:6px;text-align:center">
          <p style="color:#888;font-size:11px;margin:0 0 4px">POINTS REDEEMED</p>
          <p style="color:#1e3a5f;font-size:18px;font-weight:bold;margin:0">${opts.pointsSpent.toLocaleString()}</p>
        </td>
        <td style="width:12px"></td>
        <td style="padding:8px;background:#f8f9fa;border-radius:6px;text-align:center">
          <p style="color:#888;font-size:11px;margin:0 0 4px">VALID UNTIL</p>
          <p style="color:#1e3a5f;font-size:18px;font-weight:bold;margin:0">${opts.expiryDate}</p>
        </td>
      </tr>
    </table>
    <div style="background:#fffbf0;border:1px solid #e8b84b;border-radius:8px;padding:16px;margin:20px 0">
      <p style="color:#1e3a5f;font-weight:bold;margin:0 0 8px">📋 How to Redeem</p>
      <p style="color:#555;font-size:14px;margin:0 0 6px">• Email us at <a href="mailto:hello@travelcb.co.uk" style="color:#1e3a5f">hello@travelcb.co.uk</a> with your voucher code</p>
      <p style="color:#555;font-size:14px;margin:0 0 6px">• Message us on WhatsApp: <a href="https://wa.me/447534168295" style="color:#1e3a5f">07534 168295</a></p>
      <p style="color:#555;font-size:14px;margin:0">• Your voucher image is attached to this email</p>
    </div>
    <p style="color:#888;font-size:12px;text-align:center">This voucher is valid for 3 months and is non-transferable.</p>`
  );
  return send(
    opts.to,
    subject,
    html,
    'loyalty_voucher',
    undefined,
    undefined,
    [{ filename: `cb-travel-voucher-${opts.voucherCode}.png`, content: opts.voucherBuffer, contentType: 'image/png' }]
  );
}

export async function sendTierUpgradeEmail(opts: {
  to: string;
  clientName: string;
  oldTier: string;
  newTier: string;
  currentPoints: number;
}) {
  const tierEmoji: Record<string, string> = { bronze: "🥉", silver: "🥈", gold: "🥇" };
  const tierBenefits: Record<string, string[]> = {
    silver: ["Priority customer support", "10% bonus points on bookings", "Early access to exclusive deals"],
    gold: ["Dedicated travel consultant", "25% bonus points on bookings", "Complimentary travel insurance quote", "VIP lounge access rewards", "Exclusive gold-tier rewards"],
  };
  const benefits = tierBenefits[opts.newTier] || [];
  const subject = `${tierEmoji[opts.newTier]} You've reached ${opts.newTier.charAt(0).toUpperCase() + opts.newTier.slice(1)} tier! 🎉`;
  const html = baseTemplate(`<div style="text-align:center;margin-bottom:24px">
      <div style="font-size:64px;margin-bottom:12px">${tierEmoji[opts.newTier]}</div>
      <h2 style="color:#1e3a5f;margin:0 0 8px">Congratulations, ${opts.clientName}!</h2>
      <p style="color:#555;font-size:16px;margin:0">You've been upgraded to <strong style="color:#1e3a5f">${opts.newTier.charAt(0).toUpperCase() + opts.newTier.slice(1)} Tier!</strong></p>
    </div>
    <div style="background:linear-gradient(135deg,#1e3a5f,#24487a);border-radius:12px;padding:24px;text-align:center;margin:20px 0">
      <p style="color:#e8b84b;font-size:13px;letter-spacing:2px;margin:0 0 6px">UPGRADED FROM</p>
      <p style="color:#c4d4e8;font-size:16px;margin:0">${tierEmoji[opts.oldTier]} ${opts.oldTier.charAt(0).toUpperCase() + opts.oldTier.slice(1)}</p>
      <p style="color:#e8b84b;font-size:24px;margin:8px 0">→</p>
      <p style="color:#e8b84b;font-size:13px;letter-spacing:2px;margin:0 0 6px">TO</p>
      <p style="color:#ffffff;font-size:22px;font-weight:bold;margin:0">${tierEmoji[opts.newTier]} ${opts.newTier.charAt(0).toUpperCase() + opts.newTier.slice(1)}</p>
    </div>
    ${benefits.length > 0 ? `
    <div style="margin:20px 0">
      <p style="color:#1e3a5f;font-weight:bold;font-size:16px">Your new benefits include:</p>
      ${benefits.map(b => `<p style="color:#555;font-size:14px;margin:4px 0">✅ ${b}</p>`).join("")}
    </div>` : ""}
    <div style="background:#f8f9fa;border-radius:8px;padding:16px;text-align:center;margin:20px 0">
      <p style="color:#888;font-size:12px;margin:0 0 6px">YOUR CURRENT POINTS</p>
      <p style="color:#1e3a5f;font-size:28px;font-weight:bold;margin:0">${opts.currentPoints.toLocaleString()} pts</p>
    </div>
    <p style="text-align:center"><a href="https://www.travelcb.co.uk/loyalty" style="background:#1e3a5f;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px">View My Rewards</a></p>`
  );
  return send(opts.to, subject, html, 'tier_upgrade', undefined, undefined);
}



// ─── Post-Holiday Review / Feedback Flow ─────────────────────────────────────

export async function sendPostHolidayReviewEmail(
  to: string,
  name: string,
  destination: string,
  bookingRef: string
) {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const trustpilotUrl = `https://uk.trustpilot.com/review/travelcb.co.uk`;
  const html = baseTemplate(`
    ${h2(`We hope you had a wonderful trip, ${name}! 🌴`)}
    ${p(`Your holiday to <strong>${destination}</strong> has come to an end — and we hope every moment was magical.`)}
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;color:#64748b;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">Your Booking</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#1e3a5f;font-family:Arial,sans-serif;">${destination}</p>
      ${bookingRef ? `<p style="margin:4px 0 0;font-size:13px;color:#94a3b8;font-family:Arial,sans-serif;font-family:'Courier New',monospace;">${bookingRef}</p>` : ''}
    </div>
    <p style="font-size:15px;color:#374151;font-family:Arial,sans-serif;margin:0 0 8px;">We'd love to hear how everything went — your thoughts help us make every journey better.</p>
    <p style="font-size:14px;color:#64748b;font-family:Arial,sans-serif;margin:0 0 20px;">You can leave a quick review on Trustpilot (takes 2 minutes!) and also share private feedback through your portal — as a thank you you'll receive a discount code for your next adventure.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${trustpilotUrl}" style="display:inline-block;background:#00b67a;color:#ffffff;padding:14px 32px;border-radius:8px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;margin-bottom:12px;">⭐ Leave a Trustpilot Review</a>
    </div>
    ${btn('Share Private Feedback', dashboardUrl)}
    ${p(`Already planning your next trip? <a href="mailto:hello@travelcb.co.uk" style="color:#e8b84b;">Get in touch</a> — we'd love to help.`)}
  `);
  await send(
    to,
    `How was your trip to ${destination}, ${name}?`,
    html,
    'post_holiday_review',
    undefined,
    undefined
  );
}

export async function sendLoyaltyPointsEmail(
  to: string,
  name: string,
  pointsAdded: number,
  newBalance: number,
  tier: string,
  reason: string
) {
  const tierEmoji: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇' };
  const emoji = tierEmoji[tier.toLowerCase()] || '⭐';
  const isEarn = pointsAdded > 0;
  const html = baseTemplate(`
    <div style="text-align:center;margin-bottom:28px;">
      <p style="font-size:52px;margin:0;">${emoji}</p>
      <h1 style="color:#1e3a5f;font-size:26px;margin:16px 0 8px;font-family:Georgia,serif;">
        ${isEarn ? `You've earned ${pointsAdded.toLocaleString()} points!` : `Points update for your account`}
      </h1>
      <p style="color:#64748b;font-size:15px;">Hi ${name}, here's an update on your CB Travel Loyalty Club account.</p>
    </div>

    <div style="background:linear-gradient(135deg,#1e3a5f,#2d5986);border-radius:16px;padding:28px;margin-bottom:24px;text-align:center;">
      <p style="color:#93c5fd;font-size:13px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Points ${isEarn ? 'Added' : 'Updated'}</p>
      <p style="color:#e8b84b;font-size:48px;font-weight:900;margin:0 0 4px;">${isEarn ? '+' : ''}${pointsAdded.toLocaleString()}</p>
      <p style="color:#bfdbfe;font-size:14px;margin:0;">New balance: <strong style="color:white;">${newBalance.toLocaleString()} pts</strong></p>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#64748b;font-size:14px;padding:8px 0;border-bottom:1px solid #e2e8f0;">Reason</td>
          <td style="text-align:right;font-weight:600;color:#1e293b;font-size:14px;padding:8px 0;border-bottom:1px solid #e2e8f0;">${reason}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:14px;padding:8px 0;border-bottom:1px solid #e2e8f0;">Your Tier</td>
          <td style="text-align:right;font-weight:600;color:#1e293b;font-size:14px;padding:8px 0;border-bottom:1px solid #e2e8f0;">${emoji} ${tier.charAt(0).toUpperCase() + tier.slice(1)}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:14px;padding:8px 0;">Available Balance</td>
          <td style="text-align:right;font-weight:700;color:#1e3a5f;font-size:15px;padding:8px 0;">${newBalance.toLocaleString()} pts</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${SITE_URL}/loyalty" style="background:#1e3a5f;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;display:inline-block;">
        View My Loyalty Account →
      </a>
    </div>

    <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
      Use your points to claim rewards in the CB Travel Loyalty Club shop.<br/>
      Questions? Reply to this email or contact <a href="mailto:hello@travelcb.co.uk" style="color:#1e3a5f;">hello@travelcb.co.uk</a>
    </p>
  `);
  return send(to, isEarn ? `🎉 You've earned ${pointsAdded.toLocaleString()} loyalty points!` : `Your loyalty points have been updated`, html, 'loyalty_points');
}

// ─── V7: Support Ticket Reply Notification ────────────────────────────────────

export async function sendTicketReplyEmail(
  to: string,
  clientName: string,
  ticketSubject: string,
  adminMessage: string,
  ticketId: number
) {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const html = baseTemplate(`
    <div style="text-align:center;margin-bottom:24px;">
      <p style="font-size:40px;margin:0;">🎫</p>
      <h1 style="color:#1e3a5f;font-size:24px;margin:16px 0 8px;font-family:Georgia,serif;">New reply on your support ticket</h1>
      <p style="color:#64748b;font-size:15px;">Hi ${clientName}, our team has responded to your support ticket.</p>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Subject</p>
      <p style="color:#1e293b;font-size:16px;font-weight:600;margin:0;">${ticketSubject}</p>
    </div>
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#94a3b8;font-size:12px;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;">Team Reply</p>
      <p style="color:#1e293b;font-size:15px;line-height:1.7;margin:0;white-space:pre-wrap;">${adminMessage}</p>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${dashboardUrl}" style="background:#1e3a5f;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;display:inline-block;">
        View Full Thread →
      </a>
    </div>
    <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
      Reply directly in your dashboard, or contact us at <a href="mailto:hello@travelcb.co.uk" style="color:#1e3a5f;">hello@travelcb.co.uk</a>
    </p>
  `);
  return send(
    to,
    `Re: ${ticketSubject} — CB Travel Support`,
    html,
    'ticket_reply'
  );
}

export async function sendPassportReminderEmail(
  to: string,
  clientName: string,
  passportExpiry: string,
  destination: string,
  departureDate: string,
  bookingRef: string,
  bookingId?: number
): Promise<{ success: boolean; error?: string }> {
  const subject = `⚠️ Passport Renewal Required — ${destination}`;
  const html = baseTemplate(`
    <div style="text-align:center;padding:32px 0 24px;">
      <div style="display:inline-block;background:#FEF3C7;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:36px;margin-bottom:16px;">⚠️</div>
      <h1 style="font-size:24px;font-weight:700;color:#1a1a2e;margin:0 0 8px;">Passport Action Required</h1>
      <p style="color:#64748b;font-size:15px;margin:0;">Booking Reference: <strong>${bookingRef}</strong></p>
    </div>
    <div style="background:#FFF8F0;border:1px solid #FED7AA;border-radius:12px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0;font-size:15px;color:#92400e;line-height:1.6;">
        Dear <strong>${clientName}</strong>, your passport expires on <strong>${passportExpiry}</strong>. 
        For your upcoming trip to <strong>${destination}</strong> departing <strong>${departureDate}</strong>, 
        your passport must be valid for at least <strong>6 months beyond your return date</strong>.
      </p>
    </div>
    <h2 style="font-size:17px;font-weight:600;color:#1a1a2e;margin:28px 0 16px;">What you need to do</h2>
    <div style="background:#F8FAFC;border-radius:12px;padding:20px 24px;">
      <ol style="margin:0;padding:0 0 0 20px;color:#475569;font-size:14px;line-height:2;">
        <li>Check your passport expiry date</li>
        <li>Apply for a new passport immediately if needed (allow 10+ weeks)</li>
        <li>Ensure 6+ months validity from your return date</li>
        <li>Contact us once renewed so we can update your booking</li>
      </ol>
    </div>
    <div style="text-align:center;margin:32px 0 8px;">
      <a href="https://www.gov.uk/renew-adult-passport" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">Renew Your Passport</a>
    </div>
    <p style="text-align:center;font-size:13px;color:#94a3b8;margin-top:16px;">Questions? Reply to this email or call us — we're here to help.</p>
  `);
  return send(to, subject, html, 'passport_reminder', undefined, bookingId);
}

// ─── Admin Quote Email (Luxury Travel Version) ────────────────────────────────

export async function sendAdminQuoteEmail(
  to: string,
  firstName: string,
  destination: string,
  quoteRef: string,
  totalPrice: string | null,
  quoteLink: string,
  departureDate?: string | null,
  returnDate?: string | null,
  expiresAt?: Date | null,
): Promise<{ success: boolean; error?: string }> {
  const daysUntilExpiry = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 30;

  const departureLine = departureDate
    ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Departure</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e293b;">${departureDate}</td></tr>`
    : "";
  const returnLine = returnDate
    ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Return</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e293b;">${returnDate}</td></tr>`
    : "";
  const priceLine = totalPrice
    ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Total Investment</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#1e40af;">${totalPrice}</td></tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Your Tailored Travel Quote | CB Travel</title></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#0f2a4a 100%);border-radius:16px 16px 0 0;padding:40px 40px 32px;text-align:center;">
          <p style="margin:0 0 8px;color:#d4af37;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">CB Travel · Luxury Concierge</p>
          <h1 style="margin:0 0 8px;color:#ffffff;font-size:28px;font-weight:300;letter-spacing:1px;">Your Tailored Quote</h1>
          <p style="margin:0;color:#93c5fd;font-size:18px;font-weight:600;">${destination}</p>
        </td></tr>

        <!-- Gold divider -->
        <tr><td style="background:#1e3a5f;padding:0 40px;">
          <div style="height:2px;background:linear-gradient(90deg,transparent,#d4af37,transparent);"></div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:40px;">
          <p style="margin:0 0 24px;font-size:16px;color:#334155;line-height:1.7;">Dear ${firstName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.8;">Thank you for allowing us to design your upcoming journey. We are delighted to present your personalised travel quotation, carefully tailored to your requirements.</p>

          <!-- Quote summary box -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:0 0 28px;">
            <p style="margin:0 0 16px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;font-weight:600;">Quote Summary</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Reference</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#1e3a5f;font-family:monospace;">${quoteRef}</td></tr>
              ${departureLine}
              ${returnLine}
              ${priceLine}
              <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Valid For</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e293b;">${daysUntilExpiry} days</td></tr>
            </table>
          </div>

          <!-- CTA -->
          <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.8;">You can view your full quotation at any time via your private client portal:</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${quoteLink}" style="display:inline-block;background:linear-gradient(135deg,#1e3a5f,#2d5a8a);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:16px 36px;border-radius:50px;letter-spacing:0.5px;">View Your Quote →</a>
          </div>

          <!-- Features list -->
          <div style="background:#fafaf7;border-left:3px solid #d4af37;border-radius:0 8px 8px 0;padding:20px 24px;margin:0 0 28px;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Within your portal, you'll be able to:</p>
            <ul style="margin:0;padding:0 0 0 16px;color:#475569;font-size:14px;line-height:2;">
              <li>Review your full itinerary and pricing</li>
              <li>Accept your quote instantly</li>
              <li>Begin your booking process seamlessly</li>
            </ul>
          </div>

          <!-- Important info -->
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px 20px;margin:0 0 28px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:1px;">⚠️ Important Information</p>
            <ul style="margin:0;padding:0 0 0 16px;color:#7c2d12;font-size:13px;line-height:1.9;">
              <li>Your quotation is valid for <strong>${daysUntilExpiry} days</strong></li>
              <li>Pricing is <strong>live and subject to change</strong> until your booking is confirmed</li>
              <li>No arrangements are secured until your booking is confirmed with us</li>
            </ul>
          </div>

          <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.8;">If you have any questions or would like us to refine any part of your trip, we would be delighted to assist.</p>
          <p style="margin:0 0 8px;font-size:15px;color:#475569;">We look forward to creating something unforgettable for you.</p>
          <p style="margin:0;font-size:14px;color:#64748b;font-style:italic;">Warm regards,<br/><strong style="color:#1e3a5f;font-style:normal;">CB Travel Concierge Team</strong></p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#1e3a5f;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 8px;color:#93c5fd;font-size:13px;">📞 07495 823953 &nbsp;·&nbsp; 🌐 <a href="https://www.travelcb.co.uk" style="color:#d4af37;text-decoration:none;">www.travelcb.co.uk</a></p>
          <p style="margin:0;color:#475569;font-size:11px;">CB Travel · Luxury Travel Concierge</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return send(to, `Your Tailored Travel Quote – ${destination} | CB Travel`, html, 'admin_quote');
}

// ─── Payment Reminder Email ────────────────────────────────────────────────────

export async function sendPaymentReminderEmail(
  to: string,
  clientName: string,
  bookingRef: string,
  destination: string,
  totalPrice: string | null,
  amountPaid: string | null,
  outstanding: string | null,
): Promise<{ success: boolean; error?: string }> {
  const firstName = clientName.split(" ")[0] || "Valued Client";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Payment Reminder | CB Travel</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr><td style="background:linear-gradient(135deg,#1e3a5f,#0f2a4a);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
          <p style="margin:0 0 8px;color:#d4af37;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">CB Travel · Payment Reminder</p>
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:300;">Balance Due</h1>
        </td></tr>

        <tr><td style="background:#1e3a5f;padding:0 40px;"><div style="height:2px;background:linear-gradient(90deg,transparent,#d4af37,transparent);"></div></td></tr>

        <tr><td style="background:#ffffff;padding:40px;">
          <p style="margin:0 0 20px;font-size:16px;color:#334155;line-height:1.7;">Dear ${firstName},</p>
          <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.8;">We hope you're looking forward to your upcoming trip. This is a friendly reminder that there is a balance outstanding on your booking.</p>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:0 0 24px;">
            <p style="margin:0 0 16px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;font-weight:600;">Booking Summary</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Reference</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#1e3a5f;font-family:monospace;">${bookingRef}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Destination</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e293b;">${destination}</td></tr>
              ${totalPrice ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Total</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e293b;">${totalPrice}</td></tr>` : ""}
              ${amountPaid ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Paid</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#16a34a;">${amountPaid}</td></tr>` : ""}
              ${outstanding ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Outstanding</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#dc2626;">${outstanding}</td></tr>` : ""}
            </table>
          </div>

          <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.8;">If you'd like to make a payment or have any questions about your balance, please don't hesitate to contact us. We're here to help make your travel experience as seamless as possible.</p>

          <div style="text-align:center;margin:24px 0;">
            <a href="https://www.travelcb.co.uk/dashboard" style="display:inline-block;background:linear-gradient(135deg,#1e3a5f,#2d5a8a);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 32px;border-radius:50px;">View My Booking &rarr;</a>
          </div>

          <p style="margin:0;font-size:14px;color:#64748b;font-style:italic;">Warm regards,<br/><strong style="color:#1e3a5f;font-style:normal;">CB Travel Concierge Team</strong></p>
        </td></tr>

        <tr><td style="background:#1e3a5f;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#93c5fd;font-size:13px;">📞 07495 823953 &nbsp;·&nbsp; 🌐 <a href="https://www.travelcb.co.uk" style="color:#d4af37;text-decoration:none;">www.travelcb.co.uk</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return send(to, `Payment Reminder — ${destination} | CB Travel`, html, 'payment_reminder');
}
