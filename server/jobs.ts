import {
  getUsersWithBirthdayTomorrow,
  getUpcomingBookingsForNotifications,
  hasNotificationBeenSent,
  logNotificationSent,
  addLoyaltyPoints,
  ensureLoyaltyAccount,
  getAppSetting,
} from "./db";
import {
  sendBirthdayEmail,
  sendNotification7Day,
  sendNotification48Hour,
  sendNotificationDeparture,
} from "./emails";
import crypto from "crypto";

async function createBirthdayPromo(userId: number, email: string): Promise<string> {
  const { getDb } = await import("./db");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();
  if (!db) return "BDAY-GIFT";
  const year = new Date().getFullYear();
  const code = `BDAY-${userId}-${year}`;
  try {
    await db.execute(sql`INSERT IGNORE INTO promoCodes (code, description, discountAmount, codeType, issuedToUserId, issuedToEmail, isActive, expiresAt) VALUES (${code}, ${"Birthday gift — £10 off your next booking"}, ${"10.00"}, ${"manual"}, ${userId}, ${email}, ${true}, ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)})`);
  } catch {}
  return code;
}

export async function runBirthdayJob(): Promise<void> {
  console.log("[Jobs] Running birthday check...");
  try {
    const users = await getUsersWithBirthdayTomorrow();
    for (const user of users) {
      if (!user.email) continue;
      try {
        const promoCode = await createBirthdayPromo(user.id, user.email);
        await addLoyaltyPoints(user.id, 50, "earn", "Birthday bonus", undefined);
        await sendBirthdayEmail(user.email, user.name || "Valued Client", promoCode, 10);
        console.log(`[Jobs] Birthday email sent to ${user.email}`);
      } catch (e) {
        console.error(`[Jobs] Birthday email failed for ${user.email}:`, e);
      }
    }
    console.log(`[Jobs] Birthday check done. Processed ${users.length} user(s).`);
  } catch (e) {
    console.error("[Jobs] Birthday job error:", e);
  }
}

export async function runSmartNotificationsJob(): Promise<void> {
  console.log("[Jobs] Running smart notifications check...");
  try {
    const enabled7day = (await getAppSetting("notifications_7day_enabled")) !== "false";
    const enabled48hr = (await getAppSetting("notifications_48hour_enabled")) !== "false";
    const enabledDep = (await getAppSetting("notifications_departure_enabled")) !== "false";

    const bookings = await getUpcomingBookingsForNotifications();
    const today = new Date().toISOString().split("T")[0];
    const in7Days = new Date(); in7Days.setDate(in7Days.getDate() + 7);
    const in2Days = new Date(); in2Days.setDate(in2Days.getDate() + 2);
    const in7DaysStr = in7Days.toISOString().split("T")[0];
    const in2DaysStr = in2Days.toISOString().split("T")[0];

    for (const booking of bookings) {
      if (!booking.userEmail || !booking.departureDate) continue;
      const dep = booking.departureDate;
      const b = { destination: booking.destination || "your destination", departureDate: dep, bookingReference: booking.bookingReference };
      const name = booking.userName || "Valued Client";

      if (dep === in7DaysStr && enabled7day) {
        if (!(await hasNotificationBeenSent(booking.id, "7day"))) {
          await sendNotification7Day(booking.userEmail, name, b);
          await logNotificationSent(booking.id, "7day");
        }
      }
      if (dep === in2DaysStr && enabled48hr) {
        if (!(await hasNotificationBeenSent(booking.id, "48hour"))) {
          await sendNotification48Hour(booking.userEmail, name, b);
          await logNotificationSent(booking.id, "48hour");
        }
      }
      if (dep === today && enabledDep) {
        if (!(await hasNotificationBeenSent(booking.id, "departure_day"))) {
          await sendNotificationDeparture(booking.userEmail, name, b);
          await logNotificationSent(booking.id, "departure_day");
        }
      }
    }
    console.log(`[Jobs] Smart notifications done. Processed ${bookings.length} booking(s).`);
  } catch (e) {
    console.error("[Jobs] Smart notifications error:", e);
  }
}

export function startJobs(): void {
  // Run 2 minutes after startup to let DB settle
  setTimeout(async () => {
    await runBirthdayJob();
    await runSmartNotificationsJob();
  }, 2 * 60 * 1000);

  // Then run every 24 hours
  setInterval(async () => {
    await runBirthdayJob();
    await runSmartNotificationsJob();
  }, 24 * 60 * 60 * 1000);

  console.log("[Jobs] Background jobs scheduled.");
}
