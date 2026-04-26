import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "CB Travel <noreply@cbtravel.uk>";
const ADMIN_EMAIL = "hello@cbtravel.uk";
const SITE_URL = process.env.SITE_URL || "https://www.travelcb.co.uk";

type Attachment = { filename: string; content: Buffer | string; contentType?: string };

// ─── Core Send Function ───────────────────────────────────────────────────────

async function send(
  to: string,
  subject: string,
  html: string,
  emailType: string = "general",
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
    await logEmailRecord({ toEmail: to, subject, emailType, status: success ? "sent" : "failed", errorMessage, userId, bookingId });
  } catch {}
  return { success, error: errorMessage };
}

// ─── Template Engine ──────────────────────────────────────────────────────────

function baseTemplate(content: string, preheader?: string) {
  const pre = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#eef2f7;mso-hide:all;">${escHtml(preheader)}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;</div>`
    : "";
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>CB Travel</title>
  <style type="text/css">
    @media only screen and (max-width:600px) {
      .ew { padding: 8px !important; }
      .eb { padding: 28px 20px 24px !important; }
      .eh { padding: 32px 20px 28px !important; }
      .ef { padding: 24px 20px !important; }
      .it td { display: block !important; width: 100% !important; }
      .bc { padding: 14px 28px !important; font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eaf0f8;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${pre}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eaf0f8;">
    <tr>
      <td align="center" class="ew" style="padding:36px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 6px 32px rgba(13,39,68,0.13);">

          <!-- HEADER -->
          <tr>
            <td class="eh" style="background:linear-gradient(150deg,#0b2240 0%,#1a3a60 50%,#0f2e52 100%);padding:40px 40px 36px;text-align:center;">
              <p style="margin:0 0 6px;font-size:10px;color:#d4af37;letter-spacing:5px;text-transform:uppercase;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">Luxury Travel Concierge</p>
              <h1 style="margin:0 0 16px;color:#ffffff;font-size:34px;font-weight:700;font-family:Georgia,'Times New Roman',serif;letter-spacing:3px;line-height:1.1;">CB Travel</h1>
              <div style="width:60px;height:2px;background:linear-gradient(90deg,transparent 0%,#d4af37 30%,#f2d878 60%,#d4af37 80%,transparent 100%);margin:0 auto;border-radius:2px;"></div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td class="eb" style="padding:42px 40px 34px;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="ef" style="background:#0b2240;padding:28px 40px 24px;text-align:center;border-radius:0 0 20px 20px;">
              <p style="margin:0 0 10px;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">
                <a href="tel:07495823953" style="color:#d4af37;text-decoration:none;font-weight:600;">07495 823953</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="mailto:hello@cbtravel.uk" style="color:#d4af37;text-decoration:none;font-weight:600;">hello@cbtravel.uk</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="${SITE_URL}" style="color:#d4af37;text-decoration:none;font-weight:600;">travelcb.co.uk</a>
              </p>
              <p style="margin:0 0 14px;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">
                <a href="https://wa.me/447534168295" style="color:#4ade80;text-decoration:none;font-weight:600;">💬 WhatsApp Us</a>
              </p>
              <p style="margin:0;font-size:11px;color:#4a6080;font-family:'Segoe UI',Arial,sans-serif;line-height:1.7;">
                &copy; 2026 CB Travel. Registered in England &amp; Wales.<br/>
                Your personal data is handled in accordance with UK GDPR and the Data Protection Act 2018.<br/>
                <a href="mailto:privacy@cbtravel.uk" style="color:#5a7090;text-decoration:underline;">privacy@cbtravel.uk</a>
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
  return `<h2 style="margin:0 0 18px;color:#0b2240;font-size:22px;font-weight:700;font-family:Georgia,'Times New Roman',serif;line-height:1.3;">${text}</h2>`;
}

function p(text: string) {
  return `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.8;font-family:'Segoe UI',Arial,sans-serif;">${text}</p>`;
}

function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:11px 16px;font-size:13px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;white-space:nowrap;vertical-align:top;border-bottom:1px solid #f1f5f9;width:40%;">${label}</td>
    <td style="padding:11px 16px;font-size:13px;color:#0b2240;font-family:'Segoe UI',Arial,sans-serif;font-weight:600;border-bottom:1px solid #f1f5f9;">${value}</td>
  </tr>`;
}

function infoTable(rows: string) {
  return `<div style="background:#f8fafc;border-radius:12px;margin:22px 0;border:1px solid #e2e8f0;overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;" class="it"><tbody>${rows}</tbody></table>
  </div>`;
}

function btn(text: string, href: string) {
  return `<div style="text-align:center;margin:30px 0 8px;">
    <a href="${href}" class="bc" style="display:inline-block;background:linear-gradient(135deg,#0b2240 0%,#1e3a5f 100%);color:#ffffff;padding:15px 44px;border-radius:50px;text-decoration:none;font-family:'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:600;letter-spacing:0.5px;box-shadow:0 4px 18px rgba(11,34,64,0.32);">${text}</a>
  </div>`;
}

function goldBtn(text: string, href: string) {
  return `<div style="text-align:center;margin:30px 0 8px;">
    <a href="${href}" class="bc" style="display:inline-block;background:linear-gradient(135deg,#c9a227 0%,#e8cc5a 50%,#c9a227 100%);color:#0b2240;padding:15px 44px;border-radius:50px;text-decoration:none;font-family:'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 18px rgba(201,162,39,0.40);">${text}</a>
  </div>`;
}

function promoBox(code: string, amount: string, message: string, expiry?: string) {
  return `<div style="background:linear-gradient(135deg,#fdf8ee 0%,#fffbf2 100%);border-radius:16px;padding:28px;margin:24px 0;border:2px solid #d4af37;text-align:center;">
    <p style="margin:0 0 10px;font-size:10px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:2px;font-weight:700;">🎁 ${message}</p>
    <div style="background:#ffffff;border:2px dashed #d4af37;border-radius:10px;padding:14px 28px;display:inline-block;margin:8px auto;">
      <p style="margin:0;font-family:'Courier New',monospace;font-size:24px;font-weight:700;color:#0b2240;letter-spacing:4px;">${code}</p>
    </div>
    <p style="margin:12px 0 0;font-size:14px;color:#b8860b;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">${amount}</p>
    ${expiry ? `<p style="margin:6px 0 0;font-size:11px;color:#9ca3af;font-family:'Segoe UI',Arial,sans-serif;">${expiry}</p>` : ""}
  </div>`;
}

function alertBox(text: string, color: "amber" | "red" | "green" | "blue" = "amber") {
  const palette = {
    amber: { bg: "#fffbeb", border: "#f59e0b", text: "#92400e" },
    red:   { bg: "#fff1f2", border: "#ef4444", text: "#991b1b" },
    green: { bg: "#f0fdf4", border: "#22c55e", text: "#14532d" },
    blue:  { bg: "#eff6ff", border: "#3b82f6", text: "#1e3a8a" },
  };
  const c = palette[color];
  return `<div style="background:${c.bg};border-left:4px solid ${c.border};border-radius:0 10px 10px 0;padding:16px 20px;margin:20px 0;">
    <p style="margin:0;font-size:14px;color:${c.text};font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;">${text}</p>
  </div>`;
}

function divider() {
  return `<div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);margin:24px 0;"></div>`;
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

// ─── Welcome / Set Password ───────────────────────────────────────────────────

export async function sendSetPasswordEmail(to: string, name: string, setPasswordUrl: string) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2(`Welcome aboard, ${firstName}! ✈️`)}
    ${p(`Your CB Travel account has been created. To get started, please set your own secure password by clicking the button below.`)}
    ${p(`This link is valid for <strong>24 hours</strong>. If it expires, simply contact us and we'll send a fresh one.`)}
    ${btn("Set My Password →", setPasswordUrl)}
    ${divider()}
    ${p(`Once you're in, you'll have access to:`)}
    <ul style="color:#374151;font-size:14px;line-height:2.2;font-family:'Segoe UI',Arial,sans-serif;padding-left:22px;margin:0 0 16px;">
      <li>Your personal booking dashboard &amp; travel documents</li>
      <li>AI-powered itinerary generator</li>
      <li>Loyalty rewards programme</li>
      <li>Tailored quotes &amp; passport manager</li>
    </ul>
    ${p(`Questions? Reach us at <a href="mailto:hello@cbtravel.uk" style="color:#d4af37;font-weight:600;">hello@cbtravel.uk</a> or call <a href="tel:07495823953" style="color:#d4af37;font-weight:600;">07495 823953</a>.`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `Welcome to CB Travel — set your password to access your personal travel portal`);
  await send(to, `Welcome to CB Travel — Set Your Password ✈️`, html, "set_password");
}

export async function sendWelcomeEmail(to: string, name: string, setPasswordUrl: string) {
  return sendSetPasswordEmail(to, name, setPasswordUrl);
}

export async function sendWelcomeWithPromoEmail(to: string, name: string, setPasswordUrl: string, promoCode: string, promoAmount: number) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2(`Welcome to CB Travel, ${firstName}! ✈️`)}
    ${p(`Your account has been created. Set your password below to unlock your private travel portal.`)}
    ${btn("Set My Password →", setPasswordUrl)}
    ${p(`<em style="font-size:13px;color:#9ca3af;">Link valid for 24 hours.</em>`)}
    ${divider()}
    ${promoBox(promoCode, `£${promoAmount} off your first booking`, "Your Welcome Gift", "Valid for 12 months · One use only")}
    ${p(`Any questions? <a href="mailto:hello@cbtravel.uk" style="color:#d4af37;font-weight:600;">hello@cbtravel.uk</a>`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `Welcome to CB Travel — your £${promoAmount} gift is waiting inside`);
  await send(to, `Welcome to CB Travel — Set Your Password & Your £${promoAmount} Gift 🎁`, html, "welcome_promo");
}

// ─── Booking Confirmed ────────────────────────────────────────────────────────

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
  const firstName = name.split(" ")[0];
  const rows = [
    infoRow("Booking Ref", `<span style="font-family:'Courier New',monospace;">${booking.bookingReference}</span>`),
    booking.destination ? infoRow("Destination", booking.destination) : "",
    booking.departureDate ? infoRow("Departure", formatDate(booking.departureDate)) : "",
    booking.returnDate ? infoRow("Return", formatDate(booking.returnDate)) : "",
    booking.numberOfTravelers ? infoRow("Travellers", String(booking.numberOfTravelers)) : "",
    booking.totalPrice ? infoRow("Total", `£${Number(booking.totalPrice).toFixed(2)}`) : "",
    infoRow("Status", `<span style="background:#dcfce7;color:#14532d;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700;">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>`),
  ].filter(Boolean).join("");

  const html = baseTemplate(`
    ${h2(`Booking confirmed, ${firstName}! 🎉`)}
    ${p(`Everything is in order. Here's a summary of your upcoming trip with CB Travel:`)}
    ${infoTable(rows)}
    ${p(`All your documents, checklists and updates will appear in your personal portal as your trip approaches.`)}
    ${btn("View My Booking →", `${SITE_URL}/dashboard`)}
    ${p(`We'll be in touch as your departure gets closer. If you have any questions at all, just reply to this email — we're here.`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `Your booking is confirmed — ${booking.destination || "your trip"} is locked in`);
  await send(to, `Booking Confirmed — ${booking.bookingReference} | CB Travel`, html, "booking_confirmation");
}

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
  const firstName = name.split(" ")[0];
  const rows = [
    infoRow("Booking Ref", `<span style="font-family:'Courier New',monospace;">${booking.bookingReference}</span>`),
    booking.destination ? infoRow("Destination", booking.destination) : "",
    booking.departureDate ? infoRow("Departure", formatDate(booking.departureDate)) : "",
    booking.returnDate ? infoRow("Return", formatDate(booking.returnDate)) : "",
    booking.status ? infoRow("Status", `<span style="background:#dbeafe;color:#1e3a8a;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700;">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>`) : "",
    booking.notes ? infoRow("Notes", booking.notes) : "",
  ].filter(Boolean).join("");

  const html = baseTemplate(`
    ${h2(`Booking update — ${firstName}`)}
    ${p(`We've made an update to your booking. Here are the latest details:`)}
    ${infoTable(rows)}
    ${btn("View My Booking →", `${SITE_URL}/dashboard`)}
    ${p(`If anything looks unexpected or you have questions, just reply to this email and we'll sort it straight away.`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `Your booking ${booking.bookingReference} has been updated`);
  await send(to, `Booking Update — ${booking.bookingReference} | CB Travel`, html, "booking_update");
}

// ─── Document Uploaded ────────────────────────────────────────────────────────

export async function sendDocumentUploadEmail(
  to: string,
  name: string,
  document: { fileName: string; documentType: string; bookingReference: string }
) {
  const firstName = name.split(" ")[0];
  const docTypeLabel = document.documentType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const html = baseTemplate(`
    ${h2(`New document ready, ${firstName} 📄`)}
    ${p(`A new document has been added to your booking and is ready to view in your portal.`)}
    ${infoTable(
      infoRow("Document", document.fileName) +
      infoRow("Type", docTypeLabel) +
      infoRow("Booking", `<span style="font-family:'Courier New',monospace;">${document.bookingReference}</span>`)
    )}
    ${btn("View My Documents →", `${SITE_URL}/dashboard`)}
    ${p(`Log in any time to download and save your travel documents.`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `A new ${docTypeLabel} is ready for your booking`);
  await send(to, `New Document Ready — ${document.fileName} | CB Travel`, html, "document_upload");
}

// ─── Quote Request ────────────────────────────────────────────────────────────

export async function sendQuoteRequestConfirmationEmail(to: string, name: string, destination: string) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2(`Quote request received, ${firstName}! ✈️`)}
    ${p(`Thank you for reaching out — we're delighted you're thinking of travelling to <strong style="color:#0b2240;">${destination}</strong>.`)}
    ${p(`One of our travel specialists will be in touch within 24 hours to begin designing your perfect trip.`)}
    ${alertBox(`In the meantime, feel free to explore our <a href="${SITE_URL}" style="color:#92400e;font-weight:600;">website</a> for inspiration, or reply to this email with any additional details you'd like us to know.`, "amber")}
    ${btn("Explore CB Travel →", SITE_URL)}
    ${p(`Questions? <a href="mailto:hello@cbtravel.uk" style="color:#d4af37;font-weight:600;">hello@cbtravel.uk</a> · <a href="tel:07495823953" style="color:#d4af37;font-weight:600;">07495 823953</a>`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `We've received your quote request for ${destination} — watch your inbox`);
  await send(to, `Quote Request Received — ${destination} | CB Travel`, html, "quote_request");
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
    ${p("A new quote request has been submitted via the website. Details below:")}
    ${infoTable(rows)}
    ${btn("View in Admin →", `${SITE_URL}/admin`)}
  `, `New quote from ${quoteData.name} — ${quoteData.destination || quoteData.travelType}`);
  await send(ADMIN_EMAIL, `New Quote Request — ${quoteData.name} · ${quoteData.destination || quoteData.travelType}`, html, "quote_request_admin");
}

// ─── Booking Intake Form ──────────────────────────────────────────────────────

export async function sendIntakeFormConfirmationEmail(to: string, name: string, submissionRef: string) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2(`Booking form received, ${firstName}! 🎉`)}
    ${p(`Thank you for completing your booking form — we've got everything we need and our team will be reviewing your details shortly.`)}
    ${infoTable(infoRow("Reference", `<span style="font-family:'Courier New',monospace;">${submissionRef}</span>`))}
    ${p(`We'll be in touch to confirm your booking, answer any questions, and arrange payment. You'll hear from us very soon.`)}
    ${btn("Log In to Your Portal →", `${SITE_URL}/login`)}
    ${p(`Any questions? Just reply to this email. <a href="mailto:hello@cbtravel.uk" style="color:#d4af37;font-weight:600;">hello@cbtravel.uk</a>`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `We've received your booking form — ref ${submissionRef}`);
  await send(to, `Booking Request Received — Ref: ${submissionRef} | CB Travel`, html, "intake_form");
}

// ─── Password Reset ────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, name: string, resetCode: string) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2("Password Reset Request")}
    ${p(`Hi ${firstName}, we received a request to reset your CB Travel account password.`)}
    ${p(`Here is your 6-digit reset code — it expires in <strong>30 minutes</strong>:`)}
    <div style="text-align:center;margin:32px 0;">
      <div style="display:inline-block;background:#f8fafc;border:2px solid #d4af37;border-radius:16px;padding:24px 44px;">
        <p style="margin:0 0 6px;font-size:10px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Your Reset Code</p>
        <p style="margin:0;font-family:'Courier New',monospace;font-size:38px;font-weight:700;color:#0b2240;letter-spacing:10px;">${resetCode}</p>
      </div>
    </div>
    ${p(`Enter this code on the password reset page to create your new password.`)}
    ${btn("Reset My Password →", `${SITE_URL}/reset-password?email=${encodeURIComponent(to)}`)}
    ${alertBox(`If you did not request a password reset, you can safely ignore this email. Your account remains secure.`, "blue")}
  `, `Your CB Travel password reset code — expires in 30 minutes`);
  await send(to, `CB Travel — Your Password Reset Code`, html, "password_reset");
}

// ─── Account Status ───────────────────────────────────────────────────────────

export async function sendAccountDisabledEmail(to: string, name: string) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2("Account Temporarily Suspended")}
    ${p(`Hi ${firstName}, your CB Travel account has been temporarily suspended.`)}
    ${p(`If you believe this is an error, or would like to understand more, please get in touch with us directly:`)}
    ${infoTable(
      infoRow("Email", `<a href="mailto:hello@cbtravel.uk" style="color:#d4af37;font-weight:600;">hello@cbtravel.uk</a>`) +
      infoRow("Phone", `<a href="tel:07495823953" style="color:#d4af37;font-weight:600;">07495 823953</a>`)
    )}
    ${p(`We aim to resolve any account issues as quickly as possible.`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Regards,<br/><strong style="color:#0b2240;font-style:normal;">CB Travel</strong></p>
  `, `Important update regarding your CB Travel account`);
  await send(to, `CB Travel — Your Account Has Been Suspended`, html, "account_disabled");
}

export async function sendAccountEnabledEmail(to: string, name: string) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2(`Great news, ${firstName}! 🎉`)}
    ${p(`Your CB Travel account has been re-activated — you can now log in and access everything as normal.`)}
    ${btn("Log In to Your Portal →", `${SITE_URL}/login`)}
    ${p(`Welcome back! If you have any questions, we're always here. <a href="mailto:hello@cbtravel.uk" style="color:#d4af37;font-weight:600;">hello@cbtravel.uk</a>`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `Your CB Travel account has been re-activated`);
  await send(to, `CB Travel — Your Account Has Been Re-Activated`, html, "account_enabled");
}

// ─── Custom Email ─────────────────────────────────────────────────────────────

export async function sendCustomEmail(to: string, name: string, subject: string, body: string) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2(`Hi ${firstName},`)}
    ${body.split("\n").filter(l => l.trim()).map(line => p(line)).join("")}
    ${divider()}
    ${p(`Questions? Reply to this email or contact us at <a href="mailto:hello@cbtravel.uk" style="color:#d4af37;font-weight:600;">hello@cbtravel.uk</a>`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `);
  await send(to, subject, html, "custom");
}

// ─── Postcard (pre-departure) ─────────────────────────────────────────────────

export async function sendPreDeparturePostcard(
  to: string,
  name: string,
  destination: string,
  booking: { bookingReference: string; departureDate?: string | null; returnDate?: string | null }
) {
  const firstName = name.split(" ")[0];
  const rows = [
    infoRow("Destination", destination),
    infoRow("Booking Ref", `<span style="font-family:'Courier New',monospace;">${booking.bookingReference}</span>`),
    booking.departureDate ? infoRow("Departure", formatDate(booking.departureDate)) : "",
    booking.returnDate ? infoRow("Return", formatDate(booking.returnDate)) : "",
  ].filter(Boolean).join("");

  const html = baseTemplate(`
    <div style="background:linear-gradient(160deg,#0b2240 0%,#1a3a60 100%);border-radius:14px;padding:24px;margin:0 0 28px;text-align:center;">
      <p style="margin:0 0 4px;font-size:32px;">🌍✈️</p>
      <p style="margin:0;color:#d4af37;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;font-weight:600;letter-spacing:1px;">A digital postcard from CB Travel</p>
    </div>
    ${h2(`Your adventure begins tomorrow, ${firstName}!`)}
    ${p(`You're heading to <strong style="color:#0b2240;">${destination}</strong> — and we hope every single moment is incredible.`)}
    ${infoTable(rows)}
    <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin:20px 0;border-left:4px solid #d4af37;">
      <p style="margin:0 0 8px;font-size:13px;color:#0b2240;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">Last-minute checklist:</p>
      <p style="margin:0 0 4px;font-size:13px;color:#374151;font-family:'Segoe UI',Arial,sans-serif;">✅ &nbsp;Travel documents all packed</p>
      <p style="margin:0 0 4px;font-size:13px;color:#374151;font-family:'Segoe UI',Arial,sans-serif;">✅ &nbsp;Boarding pass saved or printed</p>
      <p style="margin:0;font-size:13px;color:#374151;font-family:'Segoe UI',Arial,sans-serif;">✅ &nbsp;Emergency contact saved: <a href="tel:07495823953" style="color:#d4af37;font-weight:600;">07495 823953</a></p>
    </div>
    ${btn("View My Trip Details →", `${SITE_URL}/dashboard`)}
    ${p(`From all of us at CB Travel — have the most wonderful time. Bon voyage! 🥂`)}
  `, `Tomorrow's the day — ${destination} awaits you!`);
  await send(to, `Your adventure begins tomorrow — ${destination} 🌍 | CB Travel`, html, "postcard");
}

// ─── Birthday Email ───────────────────────────────────────────────────────────

export async function sendBirthdayEmail(to: string, name: string, promoCode: string, promoAmount: number) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    <div style="text-align:center;margin:0 0 28px;">
      <p style="font-size:52px;margin:0;">🎂🎉</p>
    </div>
    ${h2(`Happy Birthday, ${firstName}!`)}
    ${p(`The whole CB Travel team is sending you birthday wishes today! As a small token of appreciation:`)}
    ${promoBox(promoCode, `£${promoAmount} off your next booking`, "Your Birthday Gift from CB Travel", "Valid for 30 days · One use only")}
    ${p(`We hope you celebrate in style — and maybe start planning your next adventure while you're at it! 🥂`)}
    ${goldBtn("Browse Our Latest Deals →", SITE_URL)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Have a magical day,<br/><strong style="color:#0b2240;font-style:normal;">Corron &amp; the CB Travel Team</strong></p>
  `, `Happy Birthday from CB Travel — a gift is waiting for you inside! 🎂`);
  await send(to, `🎂 Happy Birthday, ${firstName}! A gift from CB Travel`, html, "birthday");
}

// ─── Feedback Promo ───────────────────────────────────────────────────────────

export async function sendFeedbackPromoEmail(to: string, name: string, promoCode: string, promoAmount: number) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2(`Thank you so much, ${firstName}! ⭐`)}
    ${p(`Your review means more than you know — it helps us raise the bar and provide an even better service for every client.`)}
    ${p(`As a heartfelt thank you from the CB Travel team:`)}
    ${promoBox(promoCode, `£${promoAmount} off your next booking`, "A Thank-You Gift from CB Travel", "Valid for 6 months · One use only")}
    ${goldBtn("Start Planning Your Next Trip →", SITE_URL)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Thank you again,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `Your review made our day — here's a little thank-you gift 🎁`);
  await send(to, `Thank You for Your Review — Here's a Gift 🎁 | CB Travel`, html, "feedback_promo");
}

// ─── Referral Emails ──────────────────────────────────────────────────────────

export async function sendReferralPromoEmail(to: string, name: string, promoCode: string, friendName: string) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2(`Your friend has joined CB Travel! 🎉`)}
    ${p(`Great news, ${firstName} — <strong style="color:#0b2240;">${friendName}</strong> just signed up using your referral link.`)}
    ${p(`As a thank you for spreading the word, here's your reward:`)}
    ${promoBox(promoCode, `£15 off your next booking`, "Referral Reward from CB Travel", "Valid for 12 months · One use only")}
    ${btn("Plan Your Next Trip →", SITE_URL)}
    ${p(`Keep sharing your referral link — there's no limit to how many friends you can refer!`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `${friendName} joined CB Travel using your link — your reward is inside`);
  await send(to, `Your Referral Reward — ${friendName} Joined CB Travel! 🎁`, html, "referral_promo");
}

export async function sendReferralWelcomeEmail(to: string, name: string, promoCode: string) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2(`Welcome to CB Travel, ${firstName}! ✈️`)}
    ${p(`You were referred by a friend — so we'd like to welcome you with a little something extra:`)}
    ${promoBox(promoCode, `£10 off your first booking`, "Welcome Gift — From Your Friend", "Valid for 12 months · One use only")}
    ${p(`We can't wait to help you plan your perfect trip. Browse our latest deals or request a bespoke quote — we'll take it from there.`)}
    ${goldBtn("Explore CB Travel →", SITE_URL)}
    ${p(`Any questions? <a href="mailto:hello@cbtravel.uk" style="color:#d4af37;font-weight:600;">hello@cbtravel.uk</a>`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `Welcome to CB Travel — your welcome gift from a friend is waiting`);
  await send(to, `Welcome to CB Travel — A Gift from Your Friend! 🎁`, html, "referral_welcome");
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
  const firstName = name.split(" ")[0];
  const isDiscount = !rewardType || ["discount", "voucher", "upgrade"].includes(rewardType);
  const subject = `🎁 Your CB Travel Loyalty Reward — ${rewardName}`;

  const rewardBlock = isDiscount
    ? `<div style="text-align:center;margin:28px 0;">
        <p style="margin:0 0 10px;font-size:10px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:2px;font-weight:700;">🎁 Your Discount Code</p>
        <div style="background:linear-gradient(135deg,#fdf8ee 0%,#fffbf2 100%);border-radius:16px;padding:24px 32px;border:2px solid #d4af37;display:inline-block;min-width:260px;">
          <div style="background:#ffffff;border:2px dashed #d4af37;border-radius:10px;padding:14px 28px;margin-bottom:10px;">
            <p style="margin:0;font-family:'Courier New',monospace;font-size:26px;font-weight:700;color:#0b2240;letter-spacing:4px;">${escHtml(voucherCode)}</p>
          </div>
          ${expiryDate ? `<p style="margin:0;font-size:12px;color:#9ca3af;font-family:'Segoe UI',Arial,sans-serif;">Valid until ${escHtml(expiryDate)}</p>` : ""}
        </div>
        <p style="margin:16px 0 0;font-size:14px;color:#374151;font-family:'Segoe UI',Arial,sans-serif;">Quote this code when booking — we'll apply the discount automatically.</p>
      </div>`
    : `<div style="background:linear-gradient(160deg,#0b2240 0%,#1a3a60 100%);border-radius:16px;padding:28px;text-align:center;margin:24px 0;">
        <p style="color:#93c5fd;font-size:10px;margin:0 0 8px;text-transform:uppercase;letter-spacing:3px;font-weight:700;">Your Reference</p>
        <p style="color:#d4af37;font-size:28px;font-weight:700;font-family:'Courier New',monospace;letter-spacing:4px;margin:0 0 10px;">${escHtml(voucherCode)}</p>
        ${expiryDate ? `<p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;">Valid until ${escHtml(expiryDate)}</p>` : ""}
      </div>
      <div style="background:#fdf8ee;border:2px solid #d4af37;border-radius:14px;padding:20px;margin:0 0 20px;text-align:center;">
        <p style="margin:0 0 8px;font-size:15px;color:#0b2240;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">📋 How to Redeem</p>
        <p style="margin:0 0 10px;font-size:14px;color:#374151;font-family:'Segoe UI',Arial,sans-serif;line-height:1.7;">Simply <strong>mention your voucher reference</strong> when you next contact us to book. No printing needed!</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">📧 <a href="mailto:hello@cbtravel.uk" style="color:#0b2240;font-weight:600;">hello@cbtravel.uk</a> &nbsp;·&nbsp; 💬 <a href="https://wa.me/447534168295" style="color:#0b2240;font-weight:600;">WhatsApp</a></p>
      </div>`;

  const html = baseTemplate(`
    ${h2(`Congratulations, ${escHtml(firstName)}! 🎉`)}
    ${p(`Your loyalty reward has been fulfilled. Here's what you've claimed:`)}
    <div style="background:#f8fafc;border-left:4px solid #d4af37;padding:16px 20px;margin:20px 0;border-radius:0 12px 12px 0;">
      <p style="color:#0b2240;font-size:18px;font-weight:700;margin:0 0 4px;font-family:Georgia,serif;">${escHtml(rewardName)}</p>
      <p style="color:#9ca3af;font-size:12px;margin:0;font-family:'Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">CB Travel Loyalty Reward</p>
    </div>
    ${rewardBlock}
    ${voucherBuffer ? p("Your personalised voucher is attached — save it for easy reference!") : ""}
    ${p(`Questions? Reply to this email or call us on <a href="tel:07495823953" style="color:#d4af37;font-weight:600;">07495 823953</a>.`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `Your loyalty reward — ${rewardName} — is confirmed`);

  const attachments: any[] = [];
  if (voucherBuffer) {
    attachments.push({ filename: `CB-Travel-Reward-${voucherCode}.png`, content: voucherBuffer, contentType: "image/png" });
  }

  return send(to, subject, html, "loyalty_reward", undefined, undefined, attachments.length > 0 ? attachments : undefined);
}

// ─── SOS Alert ────────────────────────────────────────────────────────────────

export async function sendSOSAlertEmail(data: {
  clientName: string;
  bookingRef: string;
  destination: string;
  clientEmail?: string;
  timestamp: Date;
}) {
  const html = baseTemplate(`
    <div style="background:#dc2626;border-radius:12px;padding:20px;margin:0 0 28px;text-align:center;">
      <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;letter-spacing:1px;">🆘 EMERGENCY SOS ACTIVATED</p>
    </div>
    ${h2("Emergency Alert — Immediate Attention Required")}
    ${infoTable(
      infoRow("Client", data.clientName) +
      infoRow("Booking Ref", data.bookingRef) +
      infoRow("Destination", data.destination) +
      (data.clientEmail ? infoRow("Client Email", data.clientEmail) : "") +
      infoRow("Timestamp", data.timestamp.toLocaleString("en-GB"))
    )}
    ${alertBox(`<strong>A client has activated the Emergency SOS button. Please contact them immediately.</strong>`, "red")}
    ${btn("View Booking in Admin →", `${SITE_URL}/admin`)}
  `, `🆘 EMERGENCY — ${data.clientName} — ${data.destination}`);
  await send(ADMIN_EMAIL, `🆘 EMERGENCY SOS — ${data.clientName} · ${data.destination}`, html, "sos_alert");
}

// ─── Smart Travel Notifications ───────────────────────────────────────────────

export async function sendNotification7Day(
  to: string, name: string,
  booking: { destination: string; departureDate: string; bookingReference: string }
) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2(`Your holiday is one week away! 🌍`)}
    ${p(`Hi ${firstName} — get excited! You're heading to <strong style="color:#0b2240;">${booking.destination}</strong> in just 7 days.`)}
    ${infoTable(
      infoRow("Destination", booking.destination) +
      infoRow("Departure", formatDate(booking.departureDate)) +
      infoRow("Booking Ref", `<span style="font-family:'Courier New',monospace;">${booking.bookingReference}</span>`)
    )}
    <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin:20px 0;border-left:4px solid #d4af37;">
      <p style="margin:0 0 10px;font-size:14px;color:#0b2240;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">📋 Your 7-Day Checklist:</p>
      <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2.1;font-family:'Segoe UI',Arial,sans-serif;">
        <li>Check passport validity (6 months from your return date)</li>
        <li>Confirm travel insurance is active</li>
        <li>Check visa requirements for ${booking.destination}</li>
        <li>Download your airline app — check-in opens soon</li>
        <li>Notify your bank of travel dates</li>
        <li>Check the weather forecast &amp; pack accordingly</li>
      </ul>
    </div>
    ${btn("View My Trip →", `${SITE_URL}/dashboard`)}
    ${p(`Questions? <a href="tel:07495823953" style="color:#d4af37;font-weight:600;">07495 823953</a> · <a href="mailto:hello@cbtravel.uk" style="color:#d4af37;font-weight:600;">hello@cbtravel.uk</a>`)}
  `, `Your ${booking.destination} holiday is just 7 days away — check your checklist`);
  await send(to, `Your Holiday to ${booking.destination} is in 7 Days! 🌍 | CB Travel`, html, "notification_7day");
}

export async function sendNotification48Hour(
  to: string, name: string,
  booking: { destination: string; departureDate: string; bookingReference: string }
) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2(`You fly in 48 hours! ✈️`)}
    ${p(`The countdown is on, ${firstName} — <strong style="color:#0b2240;">${booking.destination}</strong> is just 2 days away!`)}
    ${infoTable(
      infoRow("Destination", booking.destination) +
      infoRow("Departure", formatDate(booking.departureDate)) +
      infoRow("Booking Ref", `<span style="font-family:'Courier New',monospace;">${booking.bookingReference}</span>`)
    )}
    <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin:20px 0;border-left:4px solid #d4af37;">
      <p style="margin:0 0 10px;font-size:14px;color:#0b2240;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">⏰ 48-Hour Reminders:</p>
      <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2.1;font-family:'Segoe UI',Arial,sans-serif;">
        <li>Complete online check-in (if not already done)</li>
        <li>Download or print your boarding passes</li>
        <li>Confirm transfers and airport arrangements</li>
        <li>Pack medications and essentials in hand luggage</li>
        <li>Charge all devices &amp; download offline entertainment</li>
        <li>Set your alarm! 🔔</li>
      </ul>
    </div>
    ${btn("View My Documents →", `${SITE_URL}/dashboard`)}
    ${p(`Need anything last minute? <a href="tel:07495823953" style="color:#d4af37;font-weight:600;">07495 823953</a>`)}
  `, `You fly to ${booking.destination} in 48 hours — final reminders inside`);
  await send(to, `You Fly in 48 Hours — ${booking.destination} Awaits! ✈️ | CB Travel`, html, "notification_48hour");
}

export async function sendNotificationDeparture(
  to: string, name: string,
  booking: { destination: string; departureDate: string; bookingReference: string }
) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2(`Today's the day, ${firstName}! 🎉`)}
    ${p(`Your adventure to <strong style="color:#0b2240;">${booking.destination}</strong> starts today. The entire CB Travel team is wishing you the most incredible trip.`)}
    ${infoTable(
      infoRow("Destination", booking.destination) +
      infoRow("Departure", "Today! 🛫") +
      infoRow("Booking Ref", `<span style="font-family:'Courier New',monospace;">${booking.bookingReference}</span>`)
    )}
    <div style="background:linear-gradient(160deg,#0b2240 0%,#1a3a60 100%);border-radius:12px;padding:20px 24px;margin:20px 0;text-align:center;">
      <p style="margin:0 0 6px;color:#d4af37;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;letter-spacing:1px;">CB Travel — Emergency Contact</p>
      <p style="margin:0;color:#ffffff;font-size:20px;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;"><a href="tel:07495823953" style="color:#ffffff;text-decoration:none;">07495 823953</a></p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:12px;">hello@cbtravel.uk</p>
    </div>
    ${p(`All your travel documents are in your portal. Have the most wonderful journey — bon voyage! 🥂`)}
    ${btn("View My Documents →", `${SITE_URL}/dashboard`)}
  `, `Today's the day — ${booking.destination} is waiting for you!`);
  await send(to, `Today's the Day — ${booking.destination} Awaits! 🎉 | CB Travel`, html, "notification_departure");
}

// ─── Newsletter Campaign ───────────────────────────────────────────────────────

export async function sendCampaignEmail(to: string, subject: string, htmlBody: string, unsubscribeToken: string) {
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${unsubscribeToken}`;
  const fullHtml = baseTemplate(`
    ${htmlBody}
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="font-size:11px;color:#9ca3af;font-family:'Segoe UI',Arial,sans-serif;">
        You're receiving this because you subscribed to CB Travel updates.<br />
        <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  `);
  await send(to, subject, fullHtml, "campaign");
}

// ─── Admin: New Intake Form ────────────────────────────────────────────────────

export async function sendNewIntakeFormAdminEmail(form: {
  leadFirstName: string; leadLastName: string; email: string;
  phone: string; destination: string; submissionRef: string;
}) {
  const html = baseTemplate(`
    ${h2("New Booking Form Submitted 📋")}
    ${p("A new booking intake form has been submitted. Details below:")}
    ${infoTable(
      infoRow("Name", `${form.leadFirstName} ${form.leadLastName}`) +
      infoRow("Email", form.email) +
      infoRow("Phone", form.phone) +
      infoRow("Destination", form.destination) +
      infoRow("Reference", `<span style="font-family:'Courier New',monospace;">${form.submissionRef}</span>`)
    )}
    ${btn("View in Admin →", `${SITE_URL}/admin`)}
  `, `New booking form from ${form.leadFirstName} ${form.leadLastName} — ${form.destination}`);
  await send(ADMIN_EMAIL, `New Booking Form — ${form.leadFirstName} ${form.leadLastName} · ${form.destination}`, html, "intake_admin");
}

// ─── Document Password ────────────────────────────────────────────────────────

export async function sendDocumentPasswordEmail(to: string, name: string, documentName: string, password: string) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2(`Secure Document — ${firstName} 🔐`)}
    ${p(`A password-protected document has been shared with you via your CB Travel portal.`)}
    ${infoTable(
      infoRow("Document", documentName) +
      infoRow("Access Password", `<span style="font-family:'Courier New',monospace;font-size:15px;color:#0b2240;font-weight:700;letter-spacing:2px;">${escHtml(password)}</span>`)
    )}
    ${alertBox(`Keep this password safe. Do not share it with anyone. It is unique to your document.`, "blue")}
    ${btn("View My Documents →", `${SITE_URL}/dashboard`)}
    ${p(`Questions? Reply to this email or contact us at <a href="mailto:hello@cbtravel.uk" style="color:#d4af37;font-weight:600;">hello@cbtravel.uk</a>`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `Your secure document password for ${documentName}`);
  await send(to, `Your Secure Document Password — ${documentName} | CB Travel`, html, "document_password");
}

// ─── Loyalty: Redemption Cancelled ───────────────────────────────────────────

export async function sendRedemptionCancelledEmail(
  to: string,
  name: string,
  rewardName: string,
  pointsReturned: boolean,
  pointsAmount: number,
) {
  const firstName = name.split(" ")[0];
  const html = baseTemplate(`
    ${h2(`Loyalty Reward Update — ${escHtml(firstName)}`)}
    ${p(`We're writing to let you know that your loyalty redemption for <strong style="color:#0b2240;">${escHtml(rewardName)}</strong> has been cancelled by our team.`)}
    ${pointsReturned
      ? alertBox(`<strong>✅ ${pointsAmount.toLocaleString()} points have been returned to your account.</strong> Your loyalty balance has been updated and the points are available to use immediately.`, "green")
      : alertBox(`Points were not returned for this cancellation. If you believe this is an error, please contact us directly.`, "amber")
    }
    ${p(`If you have any questions about this cancellation, we're always happy to help:`)}
    ${infoTable(
      infoRow("Email", `<a href="mailto:hello@cbtravel.uk" style="color:#d4af37;font-weight:600;">hello@cbtravel.uk</a>`) +
      infoRow("WhatsApp", `<a href="https://wa.me/447534168295" style="color:#d4af37;font-weight:600;">07534 168295</a>`)
    )}
    ${btn("View My Loyalty Account →", `${SITE_URL}/loyalty`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `Update on your ${rewardName} loyalty redemption`);
  await send(to, `Loyalty Reward Update — ${rewardName} | CB Travel`, html, "redemption_cancelled");
}

// ─── Loyalty: Voucher ─────────────────────────────────────────────────────────

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
  const firstName = opts.clientName.split(" ")[0];
  const html = baseTemplate(`
    ${h2(`Congratulations, ${escHtml(firstName)}! 🎉`)}
    ${p(`You've successfully redeemed your loyalty points. Here's your reward:`)}
    <div style="background:linear-gradient(160deg,#0b2240 0%,#1a3a60 100%);border-radius:14px;padding:28px;text-align:center;margin:20px 0;">
      <p style="color:#d4af37;font-size:10px;letter-spacing:4px;margin:0 0 8px;text-transform:uppercase;font-weight:700;">Your Reward</p>
      <h3 style="color:#ffffff;font-size:22px;margin:0 0 6px;font-family:Georgia,serif;">${escHtml(opts.rewardName)}</h3>
      ${opts.rewardDescription ? `<p style="color:#93c5fd;font-size:14px;margin:0;">${escHtml(opts.rewardDescription)}</p>` : ""}
    </div>
    <div style="border:2px solid #d4af37;border-radius:12px;padding:20px;text-align:center;margin:20px 0;background:#fdf8ee;">
      <p style="color:#6b7280;font-size:10px;letter-spacing:3px;margin:0 0 8px;text-transform:uppercase;font-weight:700;">Voucher Code</p>
      <p style="font-family:'Courier New',monospace;font-size:28px;font-weight:700;color:#0b2240;letter-spacing:4px;margin:0;">${escHtml(opts.voucherCode)}</p>
    </div>
    ${infoTable(
      infoRow("Points Redeemed", `${opts.pointsSpent.toLocaleString()} pts`) +
      infoRow("Valid Until", opts.expiryDate)
    )}
    <div style="background:#fdf8ee;border:2px solid #d4af37;border-radius:12px;padding:20px 24px;margin:20px 0;">
      <p style="margin:0 0 10px;font-size:14px;color:#0b2240;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">📋 How to Redeem</p>
      <p style="margin:0 0 6px;font-size:13px;color:#374151;font-family:'Segoe UI',Arial,sans-serif;">• Email <a href="mailto:hello@cbtravel.uk" style="color:#0b2240;font-weight:600;">hello@cbtravel.uk</a> with your voucher code</p>
      <p style="margin:0 0 6px;font-size:13px;color:#374151;font-family:'Segoe UI',Arial,sans-serif;">• Or message us on <a href="https://wa.me/447534168295" style="color:#0b2240;font-weight:600;">WhatsApp</a></p>
      <p style="margin:0;font-size:13px;color:#374151;font-family:'Segoe UI',Arial,sans-serif;">• Your voucher image is attached to this email</p>
    </div>
    <p style="font-size:12px;color:#9ca3af;text-align:center;font-family:'Segoe UI',Arial,sans-serif;">This voucher is valid for 3 months and is non-transferable.</p>
  `, `Your ${opts.rewardName} reward voucher is attached`);
  return send(
    opts.to,
    `🎁 Your CB Travel Reward Voucher — ${opts.rewardName}`,
    html,
    "loyalty_voucher",
    undefined,
    undefined,
    [{ filename: `cb-travel-voucher-${opts.voucherCode}.png`, content: opts.voucherBuffer, contentType: "image/png" }]
  );
}

// ─── Loyalty: Tier Upgrade ────────────────────────────────────────────────────

export async function sendTierUpgradeEmail(opts: {
  to: string;
  clientName: string;
  oldTier: string;
  newTier: string;
  currentPoints: number;
}) {
  const firstName = opts.clientName.split(" ")[0];
  const tierEmoji: Record<string, string> = { bronze: "🥉", silver: "🥈", gold: "🥇" };
  const tierBenefits: Record<string, string[]> = {
    silver: ["Priority customer support", "10% bonus points on every booking", "Early access to exclusive deals"],
    gold: ["Dedicated travel consultant", "25% bonus points on every booking", "Complimentary travel insurance quote", "VIP lounge access rewards", "Exclusive gold-tier rewards catalogue"],
  };
  const benefits = tierBenefits[opts.newTier] || [];
  const tierLabel = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

  const html = baseTemplate(`
    <div style="text-align:center;margin:0 0 28px;">
      <div style="font-size:60px;margin:0 0 12px;">${tierEmoji[opts.newTier]}</div>
      ${h2(`Congratulations, ${escHtml(firstName)}!`)}
      <p style="margin:0;font-size:16px;color:#374151;font-family:'Segoe UI',Arial,sans-serif;">You've been upgraded to <strong style="color:#0b2240;">${tierLabel(opts.newTier)} Tier!</strong></p>
    </div>
    <div style="background:linear-gradient(160deg,#0b2240 0%,#1a3a60 100%);border-radius:14px;padding:28px;text-align:center;margin:20px 0;">
      <p style="color:#d4af37;font-size:10px;letter-spacing:4px;margin:0 0 10px;text-transform:uppercase;font-weight:700;">Upgraded From → To</p>
      <p style="color:#93c5fd;font-size:16px;margin:0 0 6px;">${tierEmoji[opts.oldTier]} ${tierLabel(opts.oldTier)}</p>
      <p style="color:#d4af37;font-size:22px;margin:4px 0;">↓</p>
      <p style="color:#ffffff;font-size:22px;font-weight:700;margin:6px 0 0;font-family:Georgia,serif;">${tierEmoji[opts.newTier]} ${tierLabel(opts.newTier)}</p>
    </div>
    ${benefits.length > 0 ? `
    <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin:20px 0;border:1px solid #e2e8f0;">
      <p style="margin:0 0 12px;font-size:14px;color:#0b2240;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">Your new ${tierLabel(opts.newTier)} tier benefits:</p>
      ${benefits.map(b => `<p style="margin:0 0 8px;font-size:14px;color:#374151;font-family:'Segoe UI',Arial,sans-serif;">✅ &nbsp;${b}</p>`).join("")}
    </div>` : ""}
    ${infoTable(
      infoRow("Current Points", `${opts.currentPoints.toLocaleString()} pts`) +
      infoRow("Tier", `${tierEmoji[opts.newTier]} ${tierLabel(opts.newTier)}`)
    )}
    ${goldBtn("View My Loyalty Account →", `${SITE_URL}/loyalty`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Congratulations again,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `You've reached ${tierLabel(opts.newTier)} tier — your new benefits are inside`);
  return send(opts.to, `${tierEmoji[opts.newTier]} You've Reached ${tierLabel(opts.newTier)} Tier — CB Travel Loyalty 🎉`, html, "tier_upgrade");
}

// ─── Post-Holiday Review ──────────────────────────────────────────────────────

export async function sendPostHolidayReviewEmail(
  to: string,
  name: string,
  destination: string,
  bookingRef: string
) {
  const firstName = name.split(" ")[0];
  const trustpilotUrl = `https://uk.trustpilot.com/review/travelcb.co.uk`;
  const html = baseTemplate(`
    ${h2(`We hope ${destination} was everything you dreamed of! 🌴`)}
    ${p(`Hi ${firstName}, your holiday has come to an end — and we truly hope every single moment was magical.`)}
    <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin:24px 0;border:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0 0 4px;font-size:10px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Your Trip</p>
      <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#0b2240;font-family:Georgia,serif;">${escHtml(destination)}</p>
      ${bookingRef ? `<p style="margin:0;font-size:12px;color:#9ca3af;font-family:'Courier New',monospace;">${escHtml(bookingRef)}</p>` : ""}
    </div>
    ${p(`We'd love to hear how everything went. Your thoughts help us make every journey even better.`)}
    ${p(`If you'd like to leave a public review on Trustpilot, it takes just 2 minutes and means the world to us:`)}
    <div style="text-align:center;margin:24px 0;">
      <a href="${trustpilotUrl}" style="display:inline-block;background:#00b67a;color:#ffffff;padding:14px 32px;border-radius:50px;font-family:'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(0,182,122,0.35);">⭐ Leave a Trustpilot Review</a>
    </div>
    ${p(`You can also share private feedback through your portal — as a thank you, you'll receive a discount towards your next adventure.`)}
    ${btn("Share Private Feedback →", `${SITE_URL}/dashboard`)}
    ${p(`Already thinking about your next trip? <a href="mailto:hello@cbtravel.uk" style="color:#d4af37;font-weight:600;">Get in touch</a> — we'd love to help.`)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
  `, `Welcome home from ${destination} — we'd love to hear about your trip`);
  await send(to, `How Was ${destination}, ${firstName}? We'd Love to Hear | CB Travel`, html, "post_holiday_review");
}

// ─── Loyalty Points Notification ─────────────────────────────────────────────

export async function sendLoyaltyPointsEmail(
  to: string,
  name: string,
  pointsAdded: number,
  newBalance: number,
  tier: string,
  reason: string
) {
  const firstName = name.split(" ")[0];
  const tierEmoji: Record<string, string> = { bronze: "🥉", silver: "🥈", gold: "🥇" };
  const emoji = tierEmoji[tier.toLowerCase()] || "⭐";
  const isEarn = pointsAdded > 0;
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  const html = baseTemplate(`
    <div style="text-align:center;margin:0 0 28px;">
      <p style="font-size:50px;margin:0;">${emoji}</p>
      <h2 style="color:#0b2240;font-size:24px;margin:16px 0 8px;font-family:Georgia,'Times New Roman',serif;">
        ${isEarn ? `You've earned ${pointsAdded.toLocaleString()} points!` : `Loyalty points update`}
      </h2>
      <p style="color:#6b7280;font-size:15px;margin:0;font-family:'Segoe UI',Arial,sans-serif;">Hi ${escHtml(firstName)}, here's your CB Travel Loyalty update.</p>
    </div>
    <div style="background:linear-gradient(160deg,#0b2240 0%,#1a3a60 100%);border-radius:14px;padding:28px;margin:0 0 24px;text-align:center;">
      <p style="color:#93c5fd;font-size:10px;margin:0 0 6px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Points ${isEarn ? "Added" : "Updated"}</p>
      <p style="color:#d4af37;font-size:48px;font-weight:900;margin:0 0 4px;font-family:'Segoe UI',Arial,sans-serif;">${isEarn ? "+" : ""}${pointsAdded.toLocaleString()}</p>
      <p style="color:#93c5fd;font-size:14px;margin:0;">New balance: <strong style="color:#ffffff;">${newBalance.toLocaleString()} pts</strong></p>
    </div>
    ${infoTable(
      infoRow("Reason", reason) +
      infoRow("Your Tier", `${emoji} ${tierLabel}`) +
      infoRow("Available Balance", `<strong style="color:#0b2240;">${newBalance.toLocaleString()} pts</strong>`)
    )}
    ${goldBtn("View My Loyalty Account →", `${SITE_URL}/loyalty`)}
    <p style="color:#9ca3af;font-size:12px;text-align:center;font-family:'Segoe UI',Arial,sans-serif;">
      Use your points to claim rewards in the CB Travel Loyalty Club.<br/>
      Questions? <a href="mailto:hello@cbtravel.uk" style="color:#6b7280;">hello@cbtravel.uk</a>
    </p>
  `, `${isEarn ? `+${pointsAdded.toLocaleString()} points added to your CB Travel account` : "Your CB Travel loyalty points have been updated"}`);
  return send(
    to,
    isEarn ? `🎉 +${pointsAdded.toLocaleString()} Loyalty Points — CB Travel` : `Your CB Travel Loyalty Points Have Been Updated`,
    html,
    "loyalty_points"
  );
}

// ─── Support Ticket Reply ─────────────────────────────────────────────────────

export async function sendTicketReplyEmail(
  to: string,
  clientName: string,
  ticketSubject: string,
  adminMessage: string,
  ticketId: number
) {
  const firstName = clientName.split(" ")[0];
  const html = baseTemplate(`
    <div style="text-align:center;margin:0 0 28px;">
      <p style="font-size:40px;margin:0;">🎫</p>
      <h2 style="color:#0b2240;font-size:22px;margin:16px 0 8px;font-family:Georgia,serif;">New reply on your support ticket</h2>
      <p style="color:#6b7280;font-size:15px;margin:0;font-family:'Segoe UI',Arial,sans-serif;">Hi ${escHtml(firstName)}, our team has responded to your ticket.</p>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin:0 0 20px;">
      <p style="color:#9ca3af;font-size:10px;margin:0 0 6px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Ticket Subject</p>
      <p style="color:#0b2240;font-size:16px;font-weight:600;margin:0;font-family:'Segoe UI',Arial,sans-serif;">${escHtml(ticketSubject)}</p>
    </div>
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <p style="color:#9ca3af;font-size:10px;margin:0 0 12px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Team Reply</p>
      <p style="color:#374151;font-size:15px;line-height:1.75;margin:0;white-space:pre-wrap;font-family:'Segoe UI',Arial,sans-serif;">${escHtml(adminMessage)}</p>
    </div>
    ${btn("View Full Thread →", `${SITE_URL}/dashboard`)}
    ${p(`You can reply directly from your dashboard, or contact us at <a href="mailto:hello@cbtravel.uk" style="color:#d4af37;font-weight:600;">hello@cbtravel.uk</a>`)}
  `, `Our team has replied to your support ticket — ${ticketSubject}`);
  return send(to, `Re: ${ticketSubject} — CB Travel Support`, html, "ticket_reply");
}

// ─── Passport Reminder ────────────────────────────────────────────────────────

export async function sendPassportReminderEmail(
  to: string,
  clientName: string,
  passportExpiry: string,
  destination: string,
  departureDate: string,
  bookingRef: string,
  bookingId?: number
): Promise<{ success: boolean; error?: string }> {
  const firstName = clientName.split(" ")[0];
  const html = baseTemplate(`
    <div style="text-align:center;padding:24px 0 20px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;background:#fff7ed;border-radius:50%;width:72px;height:72px;font-size:34px;margin:0 0 16px;">⚠️</div>
      <h2 style="margin:0 0 8px;color:#0b2240;font-size:22px;font-weight:700;font-family:Georgia,serif;">Passport Action Required</h2>
      <p style="color:#6b7280;font-size:14px;margin:0;font-family:'Segoe UI',Arial,sans-serif;">Booking Reference: <strong style="font-family:'Courier New',monospace;">${escHtml(bookingRef)}</strong></p>
    </div>
    ${alertBox(`Dear <strong>${escHtml(firstName)}</strong>, your passport expires on <strong>${escHtml(passportExpiry)}</strong>. For your upcoming trip to <strong>${escHtml(destination)}</strong> departing <strong>${escHtml(departureDate)}</strong>, your passport must remain valid for at least <strong>6 months beyond your return date</strong>.`, "amber")}
    <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin:24px 0;border:1px solid #e2e8f0;">
      <p style="margin:0 0 12px;font-size:14px;color:#0b2240;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">What to do next:</p>
      <ol style="margin:0;padding:0 0 0 20px;color:#374151;font-size:14px;line-height:2.1;font-family:'Segoe UI',Arial,sans-serif;">
        <li>Check your current passport expiry date</li>
        <li>Apply for a renewal immediately if needed — allow <strong>10+ weeks</strong></li>
        <li>Ensure 6+ months validity from your return date</li>
        <li>Contact us once renewed so we can update your booking</li>
      </ol>
    </div>
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="https://www.gov.uk/renew-adult-passport" style="display:inline-block;background:linear-gradient(135deg,#0b2240 0%,#1e3a5f 100%);color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:50px;font-weight:600;font-size:15px;font-family:'Segoe UI',Arial,sans-serif;box-shadow:0 4px 16px rgba(11,34,64,0.30);">Renew Your Passport →</a>
    </div>
    ${p(`<em style="font-size:13px;color:#9ca3af;">Questions? Just reply to this email — we're always here to help.</em>`)}
  `, `Action required: passport check for your ${destination} trip`);
  return send(to, `⚠️ Passport Check Required — ${destination} | CB Travel`, html, "passport_reminder", undefined, bookingId);
}

// ─── Admin Quote Email (Custom Premium Design) ────────────────────────────────

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
    ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">Departure</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:#0b2240;font-family:'Segoe UI',Arial,sans-serif;">${departureDate}</td></tr>`
    : "";
  const returnLine = returnDate
    ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">Return</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:#0b2240;font-family:'Segoe UI',Arial,sans-serif;">${returnDate}</td></tr>`
    : "";
  const priceLine = totalPrice
    ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">Total Investment</td><td style="padding:8px 0;font-size:15px;font-weight:700;color:#d4af37;font-family:'Segoe UI',Arial,sans-serif;">${totalPrice}</td></tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Your Tailored Quote | CB Travel</title></head>
<body style="margin:0;padding:0;background-color:#eaf0f8;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#eaf0f8;mso-hide:all;">Your tailored quote for ${escHtml(destination)} is ready to view — exclusively prepared for you by CB Travel.&nbsp;‌&nbsp;‌&nbsp;‌</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eaf0f8;padding:36px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 6px 32px rgba(11,34,64,0.15);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(150deg,#0b2240 0%,#1a3a60 55%,#0f2e52 100%);border-radius:20px 20px 0 0;padding:44px 40px 36px;text-align:center;">
          <p style="margin:0 0 6px;color:#d4af37;font-size:10px;letter-spacing:5px;text-transform:uppercase;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">Luxury Travel Concierge</p>
          <h1 style="margin:0 0 10px;color:#ffffff;font-size:30px;font-weight:700;font-family:Georgia,'Times New Roman',serif;letter-spacing:3px;">CB Travel</h1>
          <div style="width:60px;height:2px;background:linear-gradient(90deg,transparent,#d4af37,#f2d878,#d4af37,transparent);margin:0 auto 16px;border-radius:2px;"></div>
          <p style="margin:0 0 6px;color:#93c5fd;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">Your Tailored Quote</p>
          <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;font-family:Georgia,serif;">${escHtml(destination)}</p>
        </td></tr>

        <!-- Gold rule -->
        <tr><td style="background:#0b2240;padding:0 40px;"><div style="height:2px;background:linear-gradient(90deg,transparent 0%,#d4af37 30%,#f2d878 60%,#d4af37 80%,transparent 100%);"></div></td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:44px 40px;">
          <p style="margin:0 0 20px;font-size:16px;color:#1e293b;line-height:1.7;font-family:'Segoe UI',Arial,sans-serif;">Dear ${escHtml(firstName)},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.85;font-family:'Segoe UI',Arial,sans-serif;">Thank you for allowing us to design your upcoming journey. We're delighted to present your personalised travel quotation, carefully prepared to your specifications.</p>

          <!-- Summary box -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:24px;margin:0 0 28px;">
            <p style="margin:0 0 16px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#9ca3af;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">Quote Summary</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:8px 0;color:#64748b;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">Reference</td><td style="padding:8px 0;font-size:14px;font-weight:700;color:#0b2240;font-family:'Courier New',monospace;">${escHtml(quoteRef)}</td></tr>
              ${departureLine}${returnLine}${priceLine}
              <tr><td style="padding:8px 0;color:#64748b;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">Valid For</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:#0b2240;font-family:'Segoe UI',Arial,sans-serif;">${daysUntilExpiry} days</td></tr>
            </table>
          </div>

          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.85;font-family:'Segoe UI',Arial,sans-serif;">View your full quotation at any time via your private client portal:</p>

          <!-- CTA Button -->
          <div style="text-align:center;margin:28px 0;">
            <a href="${quoteLink}" style="display:inline-block;background:linear-gradient(135deg,#0b2240 0%,#1e3a5f 100%);color:#ffffff;text-decoration:none;font-family:'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:600;padding:16px 44px;border-radius:50px;letter-spacing:0.5px;box-shadow:0 4px 18px rgba(11,34,64,0.32);">View Your Quote &rarr;</a>
          </div>

          <!-- Features -->
          <div style="background:#fdf8ee;border-left:3px solid #d4af37;border-radius:0 10px 10px 0;padding:20px 24px;margin:0 0 28px;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#0b2240;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Within your portal you can:</p>
            <ul style="margin:0;padding:0 0 0 18px;color:#374151;font-size:14px;line-height:2.1;font-family:'Segoe UI',Arial,sans-serif;">
              <li>Review your full itinerary and pricing</li>
              <li>Accept your quote in a single click</li>
              <li>Begin your booking process seamlessly</li>
            </ul>
          </div>

          <!-- Important notice -->
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin:0 0 28px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">⚠️ Important Information</p>
            <ul style="margin:0;padding:0 0 0 18px;color:#7c2d12;font-size:13px;line-height:2;font-family:'Segoe UI',Arial,sans-serif;">
              <li>Your quotation is valid for <strong>${daysUntilExpiry} days</strong></li>
              <li>Pricing is <strong>live and subject to change</strong> until your booking is confirmed</li>
              <li>No arrangements are secured until your booking is confirmed with us</li>
            </ul>
          </div>

          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.85;font-family:'Segoe UI',Arial,sans-serif;">If you have any questions or would like to refine any part of your trip, we would be delighted to assist.</p>
          <p style="margin:0 0 6px;font-size:15px;color:#374151;font-family:'Segoe UI',Arial,sans-serif;">We look forward to creating something truly unforgettable.</p>
          <p style="margin:0;font-size:14px;color:#6b7280;font-style:italic;font-family:'Segoe UI',Arial,sans-serif;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0b2240;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">
            <a href="tel:07495823953" style="color:#d4af37;text-decoration:none;font-weight:600;">07495 823953</a>
            &nbsp;·&nbsp;
            <a href="mailto:hello@cbtravel.uk" style="color:#d4af37;text-decoration:none;font-weight:600;">hello@cbtravel.uk</a>
            &nbsp;·&nbsp;
            <a href="https://www.travelcb.co.uk" style="color:#d4af37;text-decoration:none;font-weight:600;">travelcb.co.uk</a>
          </p>
          <p style="margin:0;color:#4a6080;font-size:11px;font-family:'Segoe UI',Arial,sans-serif;">&copy; 2026 CB Travel &nbsp;·&nbsp; Luxury Travel Concierge</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set — skipping quote email");
    return { success: false, error: "RESEND_API_KEY not set" };
  }
  let success = false;
  let errorMessage: string | undefined;
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Your Tailored Quote — ${destination} | CB Travel`,
      html,
      replyTo: ADMIN_EMAIL,
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        "Importance": "High",
        "X-CB-Email-Type": "admin_quote",
      },
    });
    console.log("[Email] Quote sent to", to);
    success = true;
  } catch (err: any) {
    console.error("[Email] Failed to send quote email:", err);
    errorMessage = err?.message || String(err);
  }
  try {
    const { logEmailRecord } = await import("./db");
    await logEmailRecord({ toEmail: to, subject: `Your Tailored Quote — ${destination} | CB Travel`, emailType: "admin_quote", status: success ? "sent" : "failed", errorMessage });
  } catch {}
  return { success, error: errorMessage };
}

// ─── Payment Reminder (Custom Premium Design) ────────────────────────────────

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
<body style="margin:0;padding:0;background:#eaf0f8;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#eaf0f8;mso-hide:all;">Friendly reminder: there is an outstanding balance on your ${escHtml(destination)} booking with CB Travel.&nbsp;‌&nbsp;‌&nbsp;‌</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eaf0f8;padding:36px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 6px 32px rgba(11,34,64,0.14);">

        <tr><td style="background:linear-gradient(150deg,#0b2240 0%,#1a3a60 55%,#0f2e52 100%);border-radius:20px 20px 0 0;padding:40px 40px 34px;text-align:center;">
          <p style="margin:0 0 6px;color:#d4af37;font-size:10px;letter-spacing:5px;text-transform:uppercase;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">CB Travel · Payment Reminder</p>
          <h1 style="margin:0 0 10px;color:#ffffff;font-size:26px;font-weight:300;font-family:Georgia,'Times New Roman',serif;letter-spacing:2px;">Balance Due</h1>
          <div style="width:60px;height:2px;background:linear-gradient(90deg,transparent,#d4af37,#f2d878,#d4af37,transparent);margin:0 auto;border-radius:2px;"></div>
        </td></tr>

        <tr><td style="background:#ffffff;padding:44px 40px;">
          <p style="margin:0 0 20px;font-size:16px;color:#1e293b;line-height:1.7;font-family:'Segoe UI',Arial,sans-serif;">Dear ${escHtml(firstName)},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.85;font-family:'Segoe UI',Arial,sans-serif;">We hope you're looking forward to your upcoming trip. This is a friendly reminder that there is a balance outstanding on your booking.</p>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:24px;margin:0 0 24px;">
            <p style="margin:0 0 16px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#9ca3af;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">Booking Summary</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:8px 0;color:#64748b;font-size:14px;border-bottom:1px solid #f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">Reference</td><td style="padding:8px 0;font-size:14px;font-weight:700;color:#0b2240;border-bottom:1px solid #f1f5f9;font-family:'Courier New',monospace;">${escHtml(bookingRef)}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:14px;border-bottom:1px solid #f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">Destination</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:#0b2240;border-bottom:1px solid #f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">${escHtml(destination)}</td></tr>
              ${totalPrice ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;border-bottom:1px solid #f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">Total</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:#0b2240;border-bottom:1px solid #f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">${escHtml(totalPrice)}</td></tr>` : ""}
              ${amountPaid ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;border-bottom:1px solid #f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">Paid</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:#16a34a;border-bottom:1px solid #f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">${escHtml(amountPaid)}</td></tr>` : ""}
              ${outstanding ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">Outstanding</td><td style="padding:8px 0;font-size:15px;font-weight:700;color:#dc2626;font-family:'Segoe UI',Arial,sans-serif;">${escHtml(outstanding)}</td></tr>` : ""}
            </table>
          </div>

          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.85;font-family:'Segoe UI',Arial,sans-serif;">To make a payment or if you have any questions about your balance, please don't hesitate to get in touch — we're here to make your travel experience as seamless as possible.</p>

          <div style="text-align:center;margin:24px 0;">
            <a href="https://www.travelcb.co.uk/dashboard" style="display:inline-block;background:linear-gradient(135deg,#0b2240 0%,#1e3a5f 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:15px 44px;border-radius:50px;font-family:'Segoe UI',Arial,sans-serif;box-shadow:0 4px 18px rgba(11,34,64,0.30);">View My Booking &rarr;</a>
          </div>

          <p style="margin:0;font-size:14px;color:#6b7280;font-style:italic;font-family:'Segoe UI',Arial,sans-serif;">Warm regards,<br/><strong style="color:#0b2240;font-style:normal;">Corron at CB Travel</strong></p>
        </td></tr>

        <tr><td style="background:#0b2240;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">
            <a href="tel:07495823953" style="color:#d4af37;text-decoration:none;font-weight:600;">07495 823953</a>
            &nbsp;·&nbsp;
            <a href="mailto:hello@cbtravel.uk" style="color:#d4af37;text-decoration:none;font-weight:600;">hello@cbtravel.uk</a>
            &nbsp;·&nbsp;
            <a href="https://www.travelcb.co.uk" style="color:#d4af37;text-decoration:none;font-weight:600;">travelcb.co.uk</a>
          </p>
          <p style="margin:0;color:#4a6080;font-size:11px;font-family:'Segoe UI',Arial,sans-serif;">&copy; 2026 CB Travel &nbsp;·&nbsp; Luxury Travel Concierge</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return send(to, `Payment Reminder — ${destination} | CB Travel`, html, "payment_reminder");
}

// ─── Compatibility Aliases ────────────────────────────────────────────────────

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
