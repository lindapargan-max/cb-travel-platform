/**
 * CB Travel — GDPR Data Retention Jobs
 *
 * Automated data retention and deletion jobs for UK GDPR compliance.
 * These functions should be called on a schedule (e.g. daily cron via Railway,
 * or a setInterval on server startup).
 *
 * Example usage in your server entry point:
 *
 *   import { runAllRetentionJobs } from "./retention-jobs";
 *
 *   // Run daily at 3am (or use Railway cron / node-cron)
 *   import cron from "node-cron";
 *   cron.schedule("0 3 * * *", () => {
 *     runAllRetentionJobs().then(report => console.log(report));
 *   });
 *
 *   // OR: simple interval (runs every 24 hours)
 *   setInterval(() => {
 *     runAllRetentionJobs().then(report => console.log(report));
 *   }, 24 * 60 * 60 * 1000);
 */

import { db } from "../db";
import {
  users,
  bookings,
  loyaltyPoints,
  enquiries,
  deletionLogs,
} from "../db/schema";
import { sql, lt, lte, and, or, isNull, eq } from "drizzle-orm";

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────

function yearsAgo(years: number): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
}

function monthsAgo(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

async function logDeletion(
  entityType: "user" | "booking" | "marketingContact" | "loyaltyPoints" | "enquiry",
  entityId: number,
  reason: string,
  deletedBy: "automated" | "user_request" | "admin" = "automated"
): Promise<void> {
  await db.insert(deletionLogs).values({
    entityType,
    entityId,
    reason,
    deletedBy,
  });
}

// ─────────────────────────────────────────────────────
// 1. Delete Inactive Users
// Delete users with lastLoginAt > 3 years ago
// (or createdAt > 3 years ago if they never logged in)
// ─────────────────────────────────────────────────────
export async function deleteInactiveUsers(): Promise<{
  deleted: number;
  errors: string[];
}> {
  const cutoff = yearsAgo(3);
  const errors: string[] = [];
  let deleted = 0;

  console.log(
    `[Retention] Checking for inactive users (last login before ${cutoff.toISOString()})...`
  );

  try {
    // Find users who:
    // - Last logged in more than 3 years ago, OR
    // - Never logged in AND account created more than 3 years ago
    // Exclude users with deletionRequestedAt already set (being processed separately)
    const inactiveUsers = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(
        and(
          isNull(users.deletionRequestedAt),
          or(
            and(
              isNull(users.lastLoginAt),
              lt(users.createdAt, cutoff)
            ),
            lt(users.lastLoginAt, cutoff)
          )
        )
      );

    console.log(
      `[Retention] Found ${inactiveUsers.length} inactive user(s) to delete.`
    );

    for (const user of inactiveUsers) {
      try {
        await db.delete(users).where(eq(users.id, user.id));
        await logDeletion(
          "user",
          user.id,
          `Inactive account deleted — no login since before ${cutoff.toISOString()}`
        );
        deleted++;
        console.log(
          `[Retention] Deleted inactive user #${user.id} (${user.email})`
        );
      } catch (err) {
        const msg = `Failed to delete user #${user.id}: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(msg);
        console.error(`[Retention] ${msg}`);
      }
    }
  } catch (err) {
    const msg = `Failed to query inactive users: ${err instanceof Error ? err.message : String(err)}`;
    errors.push(msg);
    console.error(`[Retention] ${msg}`);
  }

  return { deleted, errors };
}

// ─────────────────────────────────────────────────────
// 2. Anonymise Old Bookings
// Bookings completed > 7 years ago: anonymise personal fields,
// keep financial data for HMRC
// ─────────────────────────────────────────────────────
export async function anonymiseOldBookings(): Promise<{
  anonymised: number;
  errors: string[];
}> {
  const cutoff = yearsAgo(7);
  const errors: string[] = [];
  let anonymised = 0;

  console.log(
    `[Retention] Checking for bookings to anonymise (completed before ${cutoff.toISOString()})...`
  );

  try {
    // Find bookings completed more than 7 years ago that haven't been anonymised yet
    const oldBookings = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          lt(bookings.completedAt, cutoff),
          sql`${bookings.name} != 'ANONYMISED'`
        )
      );

    console.log(
      `[Retention] Found ${oldBookings.length} booking(s) to anonymise.`
    );

    for (const booking of oldBookings) {
      try {
        await db
          .update(bookings)
          .set({
            name: "ANONYMISED",
            email: "ANONYMISED",
            phone: "ANONYMISED",
            passport: "ANONYMISED",
            address: "ANONYMISED",
            dateOfBirth: null,
            specialRequirements: "ANONYMISED",
          } as any)
          .where(eq(bookings.id, booking.id));

        await logDeletion(
          "booking",
          booking.id,
          `Booking anonymised — completed more than 7 years ago (HMRC retention expired)`
        );
        anonymised++;
        console.log(`[Retention] Anonymised booking #${booking.id}`);
      } catch (err) {
        const msg = `Failed to anonymise booking #${booking.id}: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(msg);
        console.error(`[Retention] ${msg}`);
      }
    }
  } catch (err) {
    const msg = `Failed to query old bookings: ${err instanceof Error ? err.message : String(err)}`;
    errors.push(msg);
    console.error(`[Retention] ${msg}`);
  }

  return { anonymised, errors };
}

// ─────────────────────────────────────────────────────
// 3. Purge Inactive Newsletter Contacts
// Unsubscribed or no engagement > 12 months
// ─────────────────────────────────────────────────────
export async function purgeInactiveNewsletterContacts(): Promise<{
  purged: number;
  errors: string[];
}> {
  const cutoff = monthsAgo(12);
  const errors: string[] = [];
  let purged = 0;

  console.log(
    `[Retention] Checking for inactive newsletter contacts (inactive since ${cutoff.toISOString()})...`
  );

  try {
    // This uses raw SQL as the newsletter table name may vary
    // Adjust the table and column names to match your schema
    const result = await db.execute(
      sql`SELECT id FROM newsletterSubscribers 
          WHERE (unsubscribedAt IS NOT NULL AND unsubscribedAt < ${cutoff})
             OR (lastEngagedAt IS NOT NULL AND lastEngagedAt < ${cutoff})
             OR (lastEngagedAt IS NULL AND subscribedAt < ${cutoff})`
    );

    const contacts = (result[0] as any[]) || [];
    console.log(
      `[Retention] Found ${contacts.length} inactive newsletter contact(s) to purge.`
    );

    for (const contact of contacts) {
      try {
        await db.execute(
          sql`DELETE FROM newsletterSubscribers WHERE id = ${contact.id}`
        );
        await logDeletion(
          "marketingContact",
          contact.id,
          `Newsletter contact purged — inactive for more than 12 months`
        );
        purged++;
        console.log(
          `[Retention] Purged newsletter contact #${contact.id}`
        );
      } catch (err) {
        const msg = `Failed to purge contact #${contact.id}: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(msg);
        console.error(`[Retention] ${msg}`);
      }
    }
  } catch (err) {
    // Table might not exist yet — that's okay
    const msg = `Newsletter purge skipped or failed: ${err instanceof Error ? err.message : String(err)}`;
    errors.push(msg);
    console.warn(`[Retention] ${msg}`);
  }

  return { purged, errors };
}

// ─────────────────────────────────────────────────────
// 4. Expire Inactive Loyalty Points
// Users with no loyalty activity > 3 years
// ─────────────────────────────────────────────────────
export async function expireInactiveLoyaltyPoints(): Promise<{
  expired: number;
  errors: string[];
}> {
  const cutoff = yearsAgo(3);
  const errors: string[] = [];
  let expired = 0;

  console.log(
    `[Retention] Checking for inactive loyalty points (no activity since ${cutoff.toISOString()})...`
  );

  try {
    // Find loyalty point records with no recent activity
    const inactiveRecords = await db
      .select({ id: loyaltyPoints.id, userId: loyaltyPoints.userId })
      .from(loyaltyPoints)
      .where(
        and(
          lt(loyaltyPoints.updatedAt, cutoff),
          sql`${loyaltyPoints.points} > 0`
        )
      );

    console.log(
      `[Retention] Found ${inactiveRecords.length} inactive loyalty record(s) to expire.`
    );

    for (const record of inactiveRecords) {
      try {
        // Zero out points rather than delete the record
        await db
          .update(loyaltyPoints)
          .set({
            points: 0,
            updatedAt: new Date(),
          } as any)
          .where(eq(loyaltyPoints.id, record.id));

        await logDeletion(
          "loyaltyPoints",
          record.id,
          `Loyalty points expired — no activity for more than 3 years (user #${record.userId})`
        );
        expired++;
        console.log(
          `[Retention] Expired loyalty points for record #${record.id} (user #${record.userId})`
        );
      } catch (err) {
        const msg = `Failed to expire loyalty #${record.id}: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(msg);
        console.error(`[Retention] ${msg}`);
      }
    }
  } catch (err) {
    const msg = `Loyalty points expiry failed: ${err instanceof Error ? err.message : String(err)}`;
    errors.push(msg);
    console.error(`[Retention] ${msg}`);
  }

  return { expired, errors };
}

// ─────────────────────────────────────────────────────
// 5. Purge Old Enquiries
// Enquiry/quote data deleted after 2 years if no booking follows
// ─────────────────────────────────────────────────────
export async function purgeOldEnquiries(): Promise<{
  purged: number;
  errors: string[];
}> {
  const cutoff = yearsAgo(2);
  const errors: string[] = [];
  let purged = 0;

  console.log(
    `[Retention] Checking for old enquiries (created before ${cutoff.toISOString()} with no booking)...`
  );

  try {
    // Find enquiries older than 2 years that didn't convert to a booking
    const oldEnquiries = await db
      .select({ id: enquiries.id })
      .from(enquiries)
      .where(
        and(
          lt(enquiries.createdAt, cutoff),
          or(
            isNull(enquiries.bookingId),
            eq(enquiries.bookingId, 0)
          )
        )
      );

    console.log(
      `[Retention] Found ${oldEnquiries.length} old enquiry(ies) to purge.`
    );

    for (const enquiry of oldEnquiries) {
      try {
        await db.delete(enquiries).where(eq(enquiries.id, enquiry.id));
        await logDeletion(
          "enquiry",
          enquiry.id,
          `Enquiry deleted — older than 2 years with no booking`
        );
        purged++;
        console.log(`[Retention] Purged enquiry #${enquiry.id}`);
      } catch (err) {
        const msg = `Failed to purge enquiry #${enquiry.id}: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(msg);
        console.error(`[Retention] ${msg}`);
      }
    }
  } catch (err) {
    const msg = `Enquiry purge failed: ${err instanceof Error ? err.message : String(err)}`;
    errors.push(msg);
    console.error(`[Retention] ${msg}`);
  }

  return { purged, errors };
}

// ─────────────────────────────────────────────────────
// Run All Retention Jobs
// ─────────────────────────────────────────────────────
export async function runAllRetentionJobs(): Promise<string> {
  const startTime = new Date();
  console.log(
    `\n════════════════════════════════════════════════`
  );
  console.log(
    `[Retention] Starting all GDPR retention jobs at ${startTime.toISOString()}`
  );
  console.log(
    `════════════════════════════════════════════════\n`
  );

  const results = {
    inactiveUsers: await deleteInactiveUsers(),
    oldBookings: await anonymiseOldBookings(),
    newsletterContacts: await purgeInactiveNewsletterContacts(),
    loyaltyPoints: await expireInactiveLoyaltyPoints(),
    oldEnquiries: await purgeOldEnquiries(),
  };

  const endTime = new Date();
  const durationMs = endTime.getTime() - startTime.getTime();

  const allErrors = [
    ...results.inactiveUsers.errors,
    ...results.oldBookings.errors,
    ...results.newsletterContacts.errors,
    ...results.loyaltyPoints.errors,
    ...results.oldEnquiries.errors,
  ];

  const report = [
    `\n════════════════════════════════════════════════`,
    `[Retention] GDPR Retention Jobs Report`,
    `════════════════════════════════════════════════`,
    `Run at: ${startTime.toISOString()}`,
    `Duration: ${durationMs}ms`,
    ``,
    `Results:`,
    `  Inactive users deleted:      ${results.inactiveUsers.deleted}`,
    `  Old bookings anonymised:     ${results.oldBookings.anonymised}`,
    `  Newsletter contacts purged:  ${results.newsletterContacts.purged}`,
    `  Loyalty points expired:      ${results.loyaltyPoints.expired}`,
    `  Old enquiries purged:        ${results.oldEnquiries.purged}`,
    ``,
    `Errors: ${allErrors.length}`,
    ...allErrors.map((e) => `  - ${e}`),
    `════════════════════════════════════════════════\n`,
  ].join("\n");

  console.log(report);

  return report;
}
