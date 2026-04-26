// ─────────────────────────────────────────────────────────────────────────────
// server/booking-emails.ts
// Booking-lifecycle email rendering & sending. Builds on top of the existing
// Resend pattern in server/emails.ts and the new emailTemplates table.
//
// Templates use {{placeholder}} syntax. Built-in placeholders:
//   {{client_name}}, {{destination}}, {{departure_date}}, {{return_date}},
//   {{booking_reference}}, {{supplier}}, {{balance_due}}, {{balance_due_date}},
//   {{number_of_travelers}}, {{site_url}}
// ─────────────────────────────────────────────────────────────────────────────

import { Resend } from "resend";
import { sql } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "CB Travel <noreply@travelcb.co.uk>";
const ADMIN_EMAIL = "hello@travelcb.co.uk";
const SITE_URL = process.env.SITE_URL || "https://www.travelcb.co.uk";

export type TemplateData = Record<string, string | number | null | undefined>;

// ─── Placeholder rendering ──────────────────────────────────────────────────

export function renderTemplate(template: string, data: TemplateData): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const v = data[key];
    if (v === undefined || v === null || v === "") return "";
    return String(v);
  });
}

export function listPlaceholders(template: string): string[] {
  const out = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) out.add(m[1]);
  return Array.from(out);
}

// ─── Template fetching ──────────────────────────────────────────────────────

export async function getEmailTemplate(key: string): Promise<{
  id: number; key: string; name: string; subject: string; body: string; isActive: boolean;
} | null> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return null;
  const rows = await db.execute(sql`SELECT id, \`key\`, name, subject, body, isActive FROM emailTemplates WHERE \`key\` = ${key} LIMIT 1`);
  const row = ((rows as any)[0] as any[])[0];
  return row || null;
}

export async function getAllEmailTemplates(): Promise<Array<{
  id: number; key: string; name: string; subject: string; body: string; category: string; isActive: boolean; updatedAt: Date;
}>> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`SELECT id, \`key\`, name, subject, body, category, isActive, updatedAt FROM emailTemplates ORDER BY category, name`);
  return ((rows as any)[0] as any[]) || [];
}

export async function upsertEmailTemplate(input: {
  key: string; name: string; subject: string; body: string; category?: string; isActive?: boolean;
}): Promise<void> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`
    INSERT INTO emailTemplates (\`key\`, name, subject, body, category, isActive)
    VALUES (${input.key}, ${input.name}, ${input.subject}, ${input.body}, ${input.category || 'booking'}, ${input.isActive ?? true})
    ON DUPLICATE KEY UPDATE
      name = VALUES(name), subject = VALUES(subject), body = VALUES(body),
      category = VALUES(category), isActive = VALUES(isActive)
  `);
}

// ─── Build template data from a booking ─────────────────────────────────────

export async function buildBookingTemplateData(bookingId: number): Promise<TemplateData & { _to?: string; _name?: string; _bookingId?: number }> {
  const { getBookingById, getUserById } = await import("./db");
  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error(`Booking ${bookingId} not found`);
  const user = booking.clientId ? await getUserById(booking.clientId) : null;

  const totalPrice = Number(booking.totalPrice || 0);
  const amountPaid = Number(booking.amountPaid || 0);
  const balanceDue = Math.max(totalPrice - amountPaid, 0);

  // Default balance due date = 70 days before departure (typical industry)
  let balanceDueDate = "";
  if (booking.departureDate) {
    const dep = new Date(booking.departureDate);
    if (!isNaN(dep.getTime())) {
      const due = new Date(dep);
      due.setDate(due.getDate() - 70);
      balanceDueDate = due.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    }
  }

  const fmt = (d?: string | null) => {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  };

  return {
    client_name: user?.name || booking.leadPassengerName || "Traveller",
    destination: booking.destination || "your destination",
    departure_date: fmt(booking.departureDate),
    return_date: fmt(booking.returnDate),
    booking_reference: booking.bookingReference,
    supplier: (booking as any).supplier || "your airline",
    balance_due: balanceDue > 0 ? balanceDue.toFixed(2) : "0.00",
    balance_due_date: balanceDueDate,
    number_of_travelers: booking.numberOfTravelers ?? "",
    site_url: SITE_URL,
    _to: user?.email || booking.leadPassengerEmail || undefined,
    _name: user?.name || booking.leadPassengerName || undefined,
    _bookingId: booking.id,
  };
}

// ─── Send a templated email ─────────────────────────────────────────────────

export async function sendTemplatedBookingEmail(args: {
  templateKey: string;
  bookingId: number;
  toOverride?: string;
  subjectOverride?: string;
  bodyOverride?: string;       // fully-rendered HTML if admin edited preview
  sentBy?: number;
}): Promise<{ success: boolean; error?: string }> {
  const tpl = await getEmailTemplate(args.templateKey);
  if (!tpl && !args.bodyOverride) {
    return { success: false, error: `Template "${args.templateKey}" not found` };
  }
  const data = await buildBookingTemplateData(args.bookingId);
  const to = args.toOverride || data._to;
  if (!to) return { success: false, error: "No recipient email on file" };

  const subject = args.subjectOverride || (tpl ? renderTemplate(tpl.subject, data) : "Update from CB Travel");
  const html = wrapInBaseTemplate(args.bodyOverride || (tpl ? renderTemplate(tpl.body, data) : ""));

  let success = false;
  let errorMessage: string | undefined;
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("[BookingEmail] RESEND_API_KEY not set — skipping send to", to);
      errorMessage = "RESEND_API_KEY not set";
    } else {
      await resend.emails.send({
        from: FROM, to, subject, html, replyTo: ADMIN_EMAIL,
        headers: {
          "List-Unsubscribe": `<mailto:${ADMIN_EMAIL}?subject=unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "X-CB-Email-Type": args.templateKey,
        },
      });
      success = true;
    }
  } catch (err: any) {
    errorMessage = err?.message || String(err);
    console.error("[BookingEmail] Failed:", errorMessage);
  }

  // Log
  try {
    const { logEmailRecord } = await import("./db");
    await logEmailRecord({
      toEmail: to, subject, emailType: args.templateKey,
      status: success ? "sent" : "failed", errorMessage,
      bookingId: args.bookingId,
    });
  } catch {}

  return { success, error: errorMessage };
}

// ─── Branded HTML wrapper (matches navy/gold luxury palette) ────────────────

function wrapInBaseTemplate(content: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>CB Travel</title></head>
<body style="margin:0;padding:0;background:#f4f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a2540;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(15,30,60,0.08);">
        <tr><td style="background:linear-gradient(135deg,#0f1e3c 0%,#1a2540 100%);padding:32px 28px;color:#ffffff;text-align:center;">
          <div style="font-family:'Outfit','Plus Jakarta Sans',Helvetica,Arial,sans-serif;font-size:26px;font-weight:600;letter-spacing:0.5px;background:linear-gradient(135deg,#d4af37 0%,#f0cf60 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">CB Travel</div>
          <div style="font-size:12px;color:#c9d4e8;margin-top:6px;letter-spacing:1px;text-transform:uppercase;">Your luxury travel concierge</div>
        </td></tr>
        <tr><td style="padding:32px 28px;font-size:15px;line-height:1.65;color:#1a2540;">${content}</td></tr>
        <tr><td style="background:#fafbfd;padding:24px 28px;border-top:1px solid #e6ebf3;font-size:12px;color:#5a7090;text-align:center;">
          <div style="margin-bottom:8px;"><a href="tel:07495823953" style="color:#d4af37;text-decoration:none;font-weight:600;">07495 823953</a> &nbsp;·&nbsp; <a href="mailto:hello@travelcb.co.uk" style="color:#d4af37;text-decoration:none;font-weight:600;">hello@travelcb.co.uk</a></div>
          <div><a href="${SITE_URL}" style="color:#5a7090;text-decoration:none;">www.travelcb.co.uk</a></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
