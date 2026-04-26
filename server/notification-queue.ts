// ─────────────────────────────────────────────────────────────────────────────
// server/notification-queue.ts
// Booking notification queue + trigger detection.
//
// Triggers (auto-detect candidates — NEVER auto-send):
//   - passport_request   : booking confirmed but no passport details
//   - balance_reminder   : balance due in 14 days or less
//   - check_in_reminder  : 24-30 hours before departure
//   - travel_docs        : 7 days before departure
//   - pre_travel_reminder: 2-3 days before departure
//   - welcome_home       : 1-2 days after return
//
// Detected candidates are inserted into bookingNotificationQueue with status
// "pending". An admin reviews the Notification Centre and explicitly clicks
// Send (or Edit & Send) to dispatch via server/booking-emails.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { sql } from "drizzle-orm";
import { sendTemplatedBookingEmail, buildBookingTemplateData, getEmailTemplate, renderTemplate } from "./booking-emails";

export type QueueStatus = "pending" | "sent" | "dismissed" | "failed";

// ─── Queue helpers ──────────────────────────────────────────────────────────

export async function addToQueue(input: {
  bookingId: number; templateKey: string; scheduledFor?: Date | null; payload?: any;
}): Promise<void> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return;
  // De-dupe: don't add if a pending entry already exists for this booking+template
  const existing = await db.execute(sql`SELECT id FROM bookingNotificationQueue WHERE bookingId = ${input.bookingId} AND templateKey = ${input.templateKey} AND status = 'pending' LIMIT 1`);
  if (((existing as any)[0] as any[])[0]) return;
  await db.execute(sql`
    INSERT INTO bookingNotificationQueue (bookingId, templateKey, scheduledFor, payload, status)
    VALUES (${input.bookingId}, ${input.templateKey}, ${input.scheduledFor ?? null}, ${input.payload ? JSON.stringify(input.payload) : null}, 'pending')
  `);
}

export async function listQueue(opts: { status?: QueueStatus; limit?: number } = {}): Promise<any[]> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return [];
  const limit = opts.limit ?? 200;
  const status = opts.status || "pending";
  const rows = await db.execute(sql`
    SELECT q.*, b.bookingReference, b.destination, b.departureDate, b.returnDate,
           b.leadPassengerName, b.leadPassengerEmail, b.totalPrice, b.amountPaid,
           u.name AS clientName, u.email AS clientEmail
    FROM bookingNotificationQueue q
    LEFT JOIN bookings b ON q.bookingId = b.id
    LEFT JOIN users u ON b.clientId = u.id
    WHERE q.status = ${status}
    ORDER BY q.scheduledFor ASC, q.createdAt DESC
    LIMIT ${limit}
  `);
  return ((rows as any)[0] as any[]) || [];
}

export async function dismissQueueItem(id: number, adminId?: number): Promise<void> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`UPDATE bookingNotificationQueue SET status = 'dismissed', dismissedAt = NOW(), dismissedBy = ${adminId || null} WHERE id = ${id}`);
}

export async function markQueueSent(id: number, adminId?: number, errorMessage?: string): Promise<void> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return;
  if (errorMessage) {
    await db.execute(sql`UPDATE bookingNotificationQueue SET status = 'failed', errorMessage = ${errorMessage}, sentBy = ${adminId || null} WHERE id = ${id}`);
  } else {
    await db.execute(sql`UPDATE bookingNotificationQueue SET status = 'sent', sentAt = NOW(), sentBy = ${adminId || null} WHERE id = ${id}`);
  }
}

export async function getQueueItem(id: number): Promise<any | null> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return null;
  const rows = await db.execute(sql`SELECT * FROM bookingNotificationQueue WHERE id = ${id} LIMIT 1`);
  return ((rows as any)[0] as any[])[0] || null;
}

// ─── Preview rendering ──────────────────────────────────────────────────────

export async function previewQueueItem(id: number): Promise<{
  to: string; subject: string; html: string; templateKey: string; bookingId: number;
} | null> {
  const item = await getQueueItem(id);
  if (!item) return null;
  const tpl = await getEmailTemplate(item.templateKey);
  if (!tpl) return null;
  const data = await buildBookingTemplateData(item.bookingId);
  return {
    templateKey: item.templateKey,
    bookingId: item.bookingId,
    to: (data._to as string) || "(no email on file)",
    subject: renderTemplate(tpl.subject, data),
    html: renderTemplate(tpl.body, data),
  };
}

// ─── Send a queued item (called by admin) ───────────────────────────────────

export async function sendQueueItem(args: {
  id: number;
  adminId?: number;
  subjectOverride?: string;
  bodyOverride?: string;
}): Promise<{ success: boolean; error?: string }> {
  const item = await getQueueItem(args.id);
  if (!item) return { success: false, error: "Queue item not found" };
  const result = await sendTemplatedBookingEmail({
    templateKey: item.templateKey,
    bookingId: item.bookingId,
    subjectOverride: args.subjectOverride,
    bodyOverride: args.bodyOverride,
    sentBy: args.adminId,
  });
  await markQueueSent(args.id, args.adminId, result.success ? undefined : result.error);
  return result;
}

// ─── Trigger detection (call from cron/job loop) ────────────────────────────

const DAY = 24 * 60 * 60 * 1000;

export async function detectAllTriggers(): Promise<{
  passport: number; balance: number; checkin: number; docs: number; preTravel: number; welcomeHome: number;
}> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return { passport: 0, balance: 0, checkin: 0, docs: 0, preTravel: 0, welcomeHome: 0 };

  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);

  // 1. Passport requests — confirmed bookings without passport details
  //    (assumes leadPassengerPassportNumber column from existing passport manager;
  //     falls back gracefully if column doesn't exist)
  let passport = 0;
  try {
    const rows = await db.execute(sql`
      SELECT id FROM bookings
      WHERE status = 'confirmed'
        AND departureDate IS NOT NULL
        AND STR_TO_DATE(departureDate, '%Y-%m-%d') > ${todayISO}
        AND (leadPassengerPassportNumber IS NULL OR leadPassengerPassportNumber = '')
      LIMIT 100
    `);
    for (const r of ((rows as any)[0] as any[])) {
      await addToQueue({ bookingId: r.id, templateKey: "passport_request" });
      passport++;
    }
  } catch (e) { /* column may not exist yet — silently skip */ }

  // 2. Balance reminders — outstanding balance with departure within 70 days
  let balance = 0;
  try {
    const cutoff = new Date(now.getTime() + 70 * DAY).toISOString().slice(0, 10);
    const rows = await db.execute(sql`
      SELECT id FROM bookings
      WHERE status IN ('pending','confirmed')
        AND departureDate IS NOT NULL
        AND STR_TO_DATE(departureDate, '%Y-%m-%d') BETWEEN ${todayISO} AND ${cutoff}
        AND CAST(totalPrice AS DECIMAL(10,2)) > CAST(IFNULL(amountPaid,0) AS DECIMAL(10,2))
      LIMIT 100
    `);
    for (const r of ((rows as any)[0] as any[])) {
      await addToQueue({ bookingId: r.id, templateKey: "balance_reminder" });
      balance++;
    }
  } catch {}

  // 3. Check-in reminder — departure in 24-30 hours
  let checkin = 0;
  try {
    const startISO = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const endISO = new Date(now.getTime() + 30 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const rows = await db.execute(sql`
      SELECT id FROM bookings
      WHERE status = 'confirmed'
        AND departureDate IS NOT NULL
        AND STR_TO_DATE(departureDate, '%Y-%m-%d') BETWEEN ${startISO} AND ${endISO}
      LIMIT 100
    `);
    for (const r of ((rows as any)[0] as any[])) {
      await addToQueue({ bookingId: r.id, templateKey: "check_in_reminder" });
      checkin++;
    }
  } catch {}

  // 4. Travel docs — 7 days before departure
  let docs = 0;
  try {
    const targetISO = new Date(now.getTime() + 7 * DAY).toISOString().slice(0, 10);
    const rows = await db.execute(sql`
      SELECT id FROM bookings
      WHERE status = 'confirmed'
        AND departureDate = ${targetISO}
      LIMIT 100
    `);
    for (const r of ((rows as any)[0] as any[])) {
      await addToQueue({ bookingId: r.id, templateKey: "travel_docs" });
      docs++;
    }
  } catch {}

  // 5. Pre-travel reminder — 2-3 days before departure
  let preTravel = 0;
  try {
    const startISO = new Date(now.getTime() + 2 * DAY).toISOString().slice(0, 10);
    const endISO = new Date(now.getTime() + 3 * DAY).toISOString().slice(0, 10);
    const rows = await db.execute(sql`
      SELECT id FROM bookings
      WHERE status = 'confirmed'
        AND departureDate IS NOT NULL
        AND STR_TO_DATE(departureDate, '%Y-%m-%d') BETWEEN ${startISO} AND ${endISO}
      LIMIT 100
    `);
    for (const r of ((rows as any)[0] as any[])) {
      await addToQueue({ bookingId: r.id, templateKey: "pre_travel_reminder" });
      preTravel++;
    }
  } catch {}

  // 6. Welcome home — return date 1-2 days ago
  let welcomeHome = 0;
  try {
    const startISO = new Date(now.getTime() - 2 * DAY).toISOString().slice(0, 10);
    const endISO = new Date(now.getTime() - 1 * DAY).toISOString().slice(0, 10);
    const rows = await db.execute(sql`
      SELECT id FROM bookings
      WHERE status IN ('confirmed','completed')
        AND returnDate IS NOT NULL
        AND STR_TO_DATE(returnDate, '%Y-%m-%d') BETWEEN ${startISO} AND ${endISO}
      LIMIT 100
    `);
    for (const r of ((rows as any)[0] as any[])) {
      await addToQueue({ bookingId: r.id, templateKey: "welcome_home" });
      welcomeHome++;
    }
  } catch {}

  return { passport, balance, checkin, docs, preTravel, welcomeHome };
}
