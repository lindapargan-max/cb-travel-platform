import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { eq, sql, desc } from "drizzle-orm";
import {
  users,
  bookings,
  loyaltyAccounts,
  quoteRequests,
  gdprRequests,
  deletionLogs,
} from "../drizzle/schema";

// Simple email notification helper
async function sendNotificationEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  console.log(`[GDPR NOTIFICATION] To: ${to}`);
  console.log(`[GDPR NOTIFICATION] Subject: ${subject}`);
  console.log(`[GDPR NOTIFICATION] Body: ${body}`);
}

export const gdprRouter = router({
  /**
   * Submit a Subject Access Request (SAR)
   */
  submitSAR: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().max(320),
        phone: z.string().max(30).optional(),
        relationship: z.string().max(50).optional(),
        description: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(gdprRequests).values({
        type: "SAR",
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        relationship: input.relationship ?? null,
        description: input.description,
        status: "pending",
      });

      const requestId = result[0].insertId;

      await sendNotificationEmail(
        "privacy@cbtravel.uk",
        `[GDPR] New Subject Access Request #${requestId}`,
        `New SAR from ${input.name} (${input.email}). Must respond within 30 days.`
      );

      return {
        success: true,
        requestId,
        message: "Your Subject Access Request has been submitted. We will respond within 30 days.",
      };
    }),

  /**
   * Submit a Right to Erasure request
   */
  submitErasureRequest: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().max(320),
        phone: z.string().max(30).optional(),
        accountEmail: z.string().email().max(320).optional(),
        reason: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(gdprRequests).values({
        type: "erasure",
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        reason: input.reason ?? null,
        description: input.accountEmail
          ? `Account email: ${input.accountEmail}`
          : null,
        status: "pending",
      });

      const requestId = result[0].insertId;

      await sendNotificationEmail(
        "privacy@cbtravel.uk",
        `[GDPR] New Erasure Request #${requestId}`,
        `New erasure request from ${input.name} (${input.email}). Must respond within 30 days.`
      );

      return {
        success: true,
        requestId,
        message: "Your erasure request has been submitted. We will respond within 30 days.",
      };
    }),

  /**
   * Get all data held for the logged-in user (data portability / SAR self-service)
   */
  getUserData: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userId = ctx.user.id;

    const [userData, userBookings, userLoyalty, userEnquiries] =
      await Promise.all([
        db.select().from(users).where(eq(users.id, userId)).limit(1),
        db.select().from(bookings).where(eq(bookings.clientId, userId)),
        db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId, userId)),
        db.select().from(quoteRequests).where(eq(quoteRequests.userId, userId)),
      ]);

    const user = userData[0];
    if (!user) throw new Error("User not found");

    const { passwordHash: _pw, ...safeUserData } = user;

    return {
      exportDate: new Date().toISOString(),
      dataController: "Corron Barnes T/A CB Travel, cbtravel.uk",
      profile: safeUserData,
      bookings: userBookings,
      loyaltyPoints: userLoyalty,
      enquiries: userEnquiries,
    };
  }),

  /**
   * Request account deletion (soft delete — marks for deletion)
   */
  requestAccountDeletion: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userId = ctx.user.id;

    await db.insert(gdprRequests).values({
      type: "erasure",
      name: ctx.user.name || "Account holder",
      email: ctx.user.email || "",
      description: "Self-service account deletion request from dashboard",
      status: "pending",
    });

    await sendNotificationEmail(
      "privacy@cbtravel.uk",
      `[GDPR] Account Deletion Request — User #${userId}`,
      `User #${userId} (${ctx.user.email}) has requested account deletion.`
    );

    return {
      success: true,
      message: "Your account deletion request has been submitted. We will process it within 30 days.",
    };
  }),

  // ─── Admin Procedures ────────────────────────────────────────────────────

  /**
   * List all GDPR requests (admin)
   */
  listRequests: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(gdprRequests).orderBy(desc(gdprRequests.createdAt));
  }),

  /**
   * Get counts by status (admin)
   */
  getRequestCounts: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const rows = await db
      .select({
        status: gdprRequests.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(gdprRequests)
      .groupBy(gdprRequests.status);

    const counts: Record<string, number> = { pending: 0, in_progress: 0, completed: 0 };
    for (const row of rows) counts[row.status] = Number(row.count);
    return counts;
  }),

  /**
   * Update request status (admin)
   */
  updateRequestStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "completed"]),
        adminNotes: z.string().max(5000).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updates: any = { status: input.status };
      if (input.adminNotes !== undefined) updates.adminNotes = input.adminNotes;
      if (input.status === "completed") updates.completedAt = new Date();

      await db.update(gdprRequests).set(updates).where(eq(gdprRequests.id, input.id));
      return { success: true };
    }),

  /**
   * Get user data for SAR fulfilment (admin) — returns all data for a given email
   */
  getDataForEmail: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Find user by email
      const userData = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      const user = userData[0];

      let userBookings: any[] = [];
      let userLoyalty: any[] = [];
      let userEnquiries: any[] = [];

      if (user) {
        [userBookings, userLoyalty, userEnquiries] = await Promise.all([
          db.select().from(bookings).where(eq(bookings.clientId, user.id)),
          db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId, user.id)),
          db.select().from(quoteRequests).where(eq(quoteRequests.userId, user.id)),
        ]);
      }

      // Also check bookings by lead passenger email
      const bookingsByEmail = await db
        .select()
        .from(bookings)
        .where(eq(bookings.leadPassengerEmail, input.email));

      // Merge bookings, deduplicate by id
      const allBookings = [...userBookings];
      for (const b of bookingsByEmail) {
        if (!allBookings.find((ab: any) => ab.id === b.id)) allBookings.push(b);
      }

      const safeUser = user
        ? (() => { const { passwordHash: _, ...safe } = user; return safe; })()
        : null;

      return {
        exportDate: new Date().toISOString(),
        dataController: "Corron Barnes T/A CB Travel",
        dpoContact: "privacy@cbtravel.uk",
        website: "cbtravel.uk",
        email: input.email,
        hasAccount: !!user,
        profile: safeUser,
        bookings: allBookings,
        loyaltyPoints: userLoyalty,
        enquiries: userEnquiries,
      };
    }),

  /**
   * Delete request (admin)
   */
  deleteRequest: adminProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(gdprRequests).where(eq(gdprRequests.id, input));
      return { success: true };
    }),
});
