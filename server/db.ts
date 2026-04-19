import { and, asc, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  InsertBookingIntakeForm,
  bookingIntakeForms,
  bookings,
  bookingReviews,
  deals,
  documents,
  faqItems,
  newsletterSubscriptions,
  promoCodes,
  quoteRequests,
  testimonials,
  users,
  flightDetails,
  hotelDetails,
  checklistItems,
  supportTickets,
  ticketMessages,
  bookingMembers,
  destinationActivities,
  bookingPhotos,
  DestinationActivity,
  InsertDestinationActivity,
  BookingPhoto,
  InsertBookingPhoto,
  loyaltyRules,
  bookedDestinations,
  adminQuotes,
  AdminQuote,
  InsertAdminQuote,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import crypto from "crypto";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [salt, originalHash] = hash.split(":");
  if (!salt || !originalHash) return false;
  const newHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return newHash === originalHash;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "phone"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

const ADMIN_EMAILS = ["admin@travelcb.co.uk"];

export async function createUserWithPassword(email: string, name: string, phone: string, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `local_${crypto.randomBytes(16).toString("hex")}`;
  const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
  await db.insert(users).values({ openId, email, name, phone, passwordHash, loginMethod: "password", role });
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function adminCreateUser(data: { email: string; name: string; phone?: string; password: string; role?: "user" | "admin" }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `local_${crypto.randomBytes(16).toString("hex")}`;
  const passwordHash = hashPassword(data.password);
  const role = data.role || "user";
  await db.insert(users).values({ openId, email: data.email, name: data.name, phone: data.phone || null, passwordHash, loginMethod: "password", role });
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function setUserDisabled(id: number, disabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ isDisabled: disabled } as any).where(eq(users.id, id));
  return { success: true };
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, id));
  return { success: true };
}

export async function updateUserAdmin(id: number, data: {
  name?: string;
  email?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updates: Record<string, any> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.email !== undefined) updates.email = data.email;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.dateOfBirth !== undefined) {
    updates.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  }
  if (Object.keys(updates).length === 0) return;
  await db.update(users).set(updates).where(eq(users.id, id));
}

export async function changeUserPassword(id: number, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const passwordHash = hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
  return { success: true };
}

export async function updateLastSignedIn(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function getUserSetPasswordLinkStatus(userId: number): Promise<{ generatedAt: Date | null; usedAt: Date | null }> {
  const db = await getDb();
  if (!db) return { generatedAt: null, usedAt: null };
  const result = await db.execute(sql`SELECT createdAt, usedAt FROM passwordResetTokens WHERE userId = ${userId} ORDER BY createdAt DESC LIMIT 1`);
  const rows = (result as any).rows ?? (Array.isArray(result) ? result : []);
  const row = rows[0];
  if (!row) return { generatedAt: null, usedAt: null };
  return { generatedAt: row.createdAt ? new Date(row.createdAt) : null, usedAt: row.usedAt ? new Date(row.usedAt) : null };
}

export async function getAllDeals() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deals).where(eq(deals.isActive, true)).orderBy(desc(deals.createdAt));
}

export async function getAllDealsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deals).orderBy(desc(deals.createdAt));
}

export async function getDealById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDeal(data: { title: string; destination: string; category: "package_holiday" | "cruise" | "business_travel" | "luxury" | "adventure" | "city_break" | "other"; description: string; price: number; originalPrice?: number; duration?: string; departureDate?: string; imageUrl?: string; highlights?: string; isFeatured?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deals).values({ ...data, price: data.price.toString() as any, originalPrice: data.originalPrice ? data.originalPrice.toString() as any : undefined });
  return result;
}

export async function updateDeal(id: number, data: Partial<{ title: string; destination: string; category: "package_holiday" | "cruise" | "business_travel" | "luxury" | "adventure" | "city_break" | "other"; description: string; price: number; originalPrice: number; duration: string; departureDate: string; imageUrl: string; highlights: string; isActive: boolean; isFeatured: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { ...data };
  if (data.price !== undefined) updateData.price = data.price.toString();
  if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice.toString();
  await db.update(deals).set(updateData).where(eq(deals.id, id));
  return getDealById(id);
}

export async function deleteDeal(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deals).set({ isActive: false }).where(eq(deals.id, id));
  return { success: true };
}

export async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).orderBy(desc(bookings.createdAt));
}

export async function getClientBookings(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.clientId, clientId)).orderBy(desc(bookings.createdAt));
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createBooking(data: { bookingReference: string; clientId?: number; status?: "pending" | "confirmed" | "cancelled" | "completed"; departureDate?: string; returnDate?: string; destination?: string; leadPassengerName?: string; leadPassengerEmail?: string; leadPassengerPhone?: string; leadPassengerDob?: string; totalPrice?: number; amountPaid?: number; numberOfTravelers?: number; notes?: string; dealId?: number; promoCode?: string; promoDiscount?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData: any = {
    ...data,
    totalPrice: data.totalPrice !== undefined ? data.totalPrice.toString() : undefined,
    amountPaid: data.amountPaid !== undefined ? data.amountPaid.toString() : "0",
    promoDiscount: data.promoDiscount !== undefined ? data.promoDiscount.toString() : undefined,
  };
  await db.insert(bookings).values(insertData);
  const result = await db.select().from(bookings).where(eq(bookings.bookingReference, data.bookingReference)).limit(1);
  return result[0];
}

export async function updateBooking(id: number, data: Partial<{ clientId: number; status: "pending" | "confirmed" | "cancelled" | "completed"; departureDate: string; returnDate: string; destination: string; leadPassengerName: string; leadPassengerEmail: string; leadPassengerPhone: string; leadPassengerDob: string; totalPrice: number; amountPaid: number; numberOfTravelers: number; notes: string; promoCode: string; promoDiscount: number; postcardSent: boolean; postcardSentAt: Date }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { ...data };
  if (data.totalPrice !== undefined) updateData.totalPrice = data.totalPrice.toString();
  if (data.amountPaid !== undefined) updateData.amountPaid = data.amountPaid.toString();
  if (data.promoDiscount !== undefined) updateData.promoDiscount = data.promoDiscount.toString();
  await db.update(bookings).set(updateData).where(eq(bookings.id, id));
  return getBookingById(id);
}


export async function updateBookingReference(id: number, bookingReference: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set({ bookingReference: bookingReference.trim().toUpperCase() }).where(eq(bookings.id, id));
  return getBookingById(id);
}

export async function deleteBooking(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(bookings).where(eq(bookings.id, id));
}

export async function getBookingDocuments(bookingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.bookingId, bookingId)).orderBy(desc(documents.createdAt));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return results[0] || null;
}

export async function getClientDocuments(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.clientId, clientId)).orderBy(desc(documents.createdAt));
}

export async function createDocument(data: { bookingId: number; clientId?: number; fileName: string; fileKey: string; fileUrl: string; documentType: "booking_confirmation" | "itinerary" | "invoice" | "receipt" | "other"; documentLabel?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(data as any);
  return result;
}

export async function setDocumentPassword(id: number, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const passwordHash = hashPassword(password);
  await db.update(documents).set({ isPasswordProtected: true, passwordHash }).where(eq(documents.id, id));
  return { success: true };
}

export async function removeDocumentPassword(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(documents).set({ isPasswordProtected: false, passwordHash: null }).where(eq(documents.id, id));
  return { success: true };
}

export async function verifyDocumentPassword(id: number, password: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!result.length || !result[0].passwordHash) return false;
  return verifyPassword(password, result[0].passwordHash);
}

export async function getAllQuoteRequests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt));
}

export async function getQuotesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quoteRequests).where(eq(quoteRequests.userId, userId)).orderBy(desc(quoteRequests.createdAt));
}

export async function createQuoteRequest(data: { name: string; email: string; phone?: string; quoteType?: string; travelType: string; destination?: string; numberOfTravelers?: number; departureDate?: string; returnDate?: string; budget?: string; message?: string; screenshotUrl?: string; screenshotKey?: string; userId?: number; promoCode?: string; promoDiscount?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData: any = {
    name: data.name,
    email: data.email,
    travelType: data.travelType || "other",
    quoteType: data.quoteType || "new_quote",
  };
  if (data.phone !== undefined && data.phone !== null) insertData.phone = data.phone;
  if (data.destination !== undefined && data.destination !== null) insertData.destination = data.destination;
  if (data.numberOfTravelers !== undefined && data.numberOfTravelers !== null) insertData.numberOfTravelers = data.numberOfTravelers;
  if (data.departureDate !== undefined && data.departureDate !== null) insertData.departureDate = data.departureDate;
  if (data.returnDate !== undefined && data.returnDate !== null) insertData.returnDate = data.returnDate;
  if (data.budget !== undefined && data.budget !== null) insertData.budget = data.budget;
  if (data.message !== undefined && data.message !== null) insertData.message = data.message;
  if (data.screenshotUrl !== undefined && data.screenshotUrl !== null) insertData.screenshotUrl = data.screenshotUrl;
  if (data.screenshotKey !== undefined && data.screenshotKey !== null) insertData.screenshotKey = data.screenshotKey;
  if (data.userId !== undefined && data.userId !== null) insertData.userId = data.userId;
  if (data.promoCode !== undefined && data.promoCode !== null) insertData.promoCode = data.promoCode;
  if (data.promoDiscount !== undefined && data.promoDiscount !== null) insertData.promoDiscount = data.promoDiscount.toString();
  const result = await db.insert(quoteRequests).values(insertData);
  return result;
}

export async function updateQuoteStatus(id: number, status: "new" | "contacted" | "quoted" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(quoteRequests).set({ status }).where(eq(quoteRequests.id, id));
  return { success: true };
}

export async function getApprovedTestimonials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(testimonials).where(eq(testimonials.isApproved, true)).orderBy(desc(testimonials.createdAt));
}

export async function getAllTestimonials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(testimonials).orderBy(desc(testimonials.createdAt));
}

export async function createTestimonial(data: { clientName: string; clientImage?: string; destination: string; title: string; content: string; rating: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(testimonials).values(data);
  return result;
}

export async function approveTestimonial(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(testimonials).set({ isApproved: true }).where(eq(testimonials.id, id));
  return { success: true };
}

export async function deleteTestimonial(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(testimonials).where(eq(testimonials.id, id));
  return { success: true };
}

export async function subscribeNewsletter(data: { email: string; name?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.insert(newsletterSubscriptions).values(data);
    return { success: true };
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") return { success: true, alreadySubscribed: true };
    throw error;
  }
}

export async function getAllNewsletterSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(newsletterSubscriptions).where(eq(newsletterSubscriptions.isActive, true)).orderBy(desc(newsletterSubscriptions.createdAt));
}

// ─── FAQ helpers ──────────────────────────────────────────────────────────────

export async function getAllFaqItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(faqItems).orderBy(faqItems.category, faqItems.sortOrder);
}

export async function getActiveFaqItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(faqItems).where(eq(faqItems.isActive, true)).orderBy(faqItems.category, faqItems.sortOrder);
}

export async function createFaqItem(data: { category: string; question: string; answer: string; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(faqItems).values({ category: data.category, question: data.question, answer: data.answer, sortOrder: data.sortOrder ?? 0, isActive: true });
  return { success: true };
}

export async function updateFaqItem(id: number, data: Partial<{ category: string; question: string; answer: string; sortOrder: number; isActive: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(faqItems).set(data as any).where(eq(faqItems.id, id));
  return { success: true };
}

export async function deleteFaqItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(faqItems).where(eq(faqItems.id, id));
  return { success: true };
}

// ─── Flight Details helpers ───────────────────────────────────────────────────

export async function getFlightDetailsByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(flightDetails).where(eq(flightDetails.bookingId, bookingId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createOrUpdateFlightDetails(bookingId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getFlightDetailsByBookingId(bookingId);
  if (existing) {
    await db.update(flightDetails).set(data).where(eq(flightDetails.bookingId, bookingId));
    return { success: true };
  } else {
    await db.insert(flightDetails).values({ bookingId, ...data });
    return { success: true };
  }
}

// ─── Hotel Details helpers ────────────────────────────────────────────────────

export async function getHotelDetailsByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hotelDetails).where(eq(hotelDetails.bookingId, bookingId));
}

export async function createOrUpdateHotelDetails(bookingId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.id) {
    await db.update(hotelDetails).set(data).where(eq(hotelDetails.id, data.id));
  } else {
    await db.insert(hotelDetails).values({ bookingId, ...data });
  }
  return { success: true };
}

export async function deleteHotelDetails(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(hotelDetails).where(eq(hotelDetails.id, id));
  return { success: true };
}

// ─── Checklist Items helpers ──────────────────────────────────────────────────

export async function getChecklistItemsByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checklistItems).where(eq(checklistItems.bookingId, bookingId)).orderBy(checklistItems.category, checklistItems.createdAt);
}

export async function createChecklistItem(data: { bookingId: number; userId: number; title: string; description?: string; category?: string; dueDate?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(checklistItems).values(data);
  return { success: true };
}

export async function updateChecklistItem(id: number, data: Partial<{ title: string; description: string; isCompleted: boolean; category: string; dueDate: string }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(checklistItems).set(data).where(eq(checklistItems.id, id));
  return { success: true };
}

export async function deleteChecklistItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(checklistItems).where(eq(checklistItems.id, id));
  return { success: true };
}

export async function toggleChecklistItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(checklistItems).where(eq(checklistItems.id, id)).limit(1);
  if (!result.length) throw new Error("Checklist item not found");
  const item = result[0];
  await db.update(checklistItems).set({ isCompleted: !item.isCompleted }).where(eq(checklistItems.id, id));
  return { success: true, isCompleted: !item.isCompleted };
}

// ─── Booking Reviews helpers ──────────────────────────────────────────────────

export async function getReviewByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(bookingReviews).where(eq(bookingReviews.bookingId, bookingId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createBookingReview(data: { bookingId: number; userId: number; rating: number; title?: string; content: string; destination?: string; loyaltyCodeId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(bookingReviews).values(data as any);
  const result = await db.select().from(bookingReviews).where(eq(bookingReviews.bookingId, data.bookingId)).limit(1);
  return result[0];
}

// ─── Promo Codes helpers ──────────────────────────────────────────────────────

export async function getAllPromoCodes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
}

export async function getActivePromoCodes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promoCodes).where(eq(promoCodes.isActive, true)).orderBy(desc(promoCodes.createdAt));
}

export async function getPromoCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase())).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function validatePromoCode(code: string): Promise<{ valid: boolean; discount?: number; message?: string; promoId?: number }> {
  const db = await getDb();
  if (!db) return { valid: false, message: "Service unavailable" };
  const result = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase())).limit(1);
  if (!result.length) return { valid: false, message: "Invalid promotion code." };
  const promo = result[0];
  if (!promo.isActive) return { valid: false, message: "This promotion code is no longer active." };
  if (promo.usedAt) return { valid: false, message: "This promotion code has already been used." };
  if (promo.expiresAt && new Date() > promo.expiresAt) return { valid: false, message: "This promotion code has expired." };
  return { valid: true, discount: parseFloat(promo.discountAmount as any), promoId: promo.id };
}

export async function createPromoCode(data: { code: string; description?: string; discountAmount: number; codeType?: "loyalty" | "manual"; issuedToUserId?: number; issuedToEmail?: string; expiresAt?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData: any = {
    ...data,
    code: data.code.toUpperCase(),
    discountAmount: data.discountAmount.toString(),
    codeType: data.codeType || "manual",
  };
  await db.insert(promoCodes).values(insertData);
  const result = await db.select().from(promoCodes).where(eq(promoCodes.code, data.code.toUpperCase())).limit(1);
  return result[0];
}

export async function updatePromoCode(id: number, data: Partial<{ description: string; discountAmount: number; isActive: boolean; expiresAt: Date }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { ...data };
  if (data.discountAmount !== undefined) updateData.discountAmount = data.discountAmount.toString();
  await db.update(promoCodes).set(updateData).where(eq(promoCodes.id, id));
  return { success: true };
}

export async function deletePromoCode(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(promoCodes).where(eq(promoCodes.id, id));
  return { success: true };
}

export async function markPromoCodeUsed(id: number, bookingId?: number, quoteId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(promoCodes).set({
    usedAt: new Date(),
    usedByBookingId: bookingId || null,
    usedByQuoteId: quoteId || null,
    isActive: false,
  } as any).where(eq(promoCodes.id, id));
  return { success: true };
}

// ─── Postcard helpers ─────────────────────────────────────────────────────────

export async function getBookingsDueForPostcard(): Promise<Array<typeof bookings.$inferSelect>> {
  const db = await getDb();
  if (!db) return [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const result = await db.select().from(bookings).where(
    and(
      eq(bookings.postcardSent, false),
      eq(bookings.status, "confirmed"),
      eq(bookings.departureDate, tomorrowStr)
    )
  );
  return result;
}

export async function markPostcardSent(bookingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set({ postcardSent: true, postcardSentAt: new Date() } as any).where(eq(bookings.id, bookingId));
  return { success: true };
}

// ── BOOKING INTAKE FORMS ──────────────────────────────────────────────────────

export async function getIntakeSubmissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookingIntakeForms).orderBy(desc(bookingIntakeForms.createdAt));
}

export async function getIntakeSubmissionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(bookingIntakeForms).where(eq(bookingIntakeForms.id, id));
  return row || null;
}

export async function createIntakeSubmission(data: Omit<InsertBookingIntakeForm, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const ref = data.submissionRef || `CBT-INT-${Date.now().toString(36).toUpperCase()}`;
  const result = await db.insert(bookingIntakeForms).values({ ...data, submissionRef: ref });
  return { id: (result as any)[0]?.insertId, submissionRef: ref };
}

export async function updateIntakeStatus(id: number, status: "new" | "reviewed" | "converted" | "archived", adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const upd: any = { status };
  if (adminNotes !== undefined) upd.adminNotes = adminNotes;
  await db.update(bookingIntakeForms).set(upd).where(eq(bookingIntakeForms.id, id));
}

// ─── Email Logs ────────────────────────────────────────────────────────────────

export async function logEmailRecord(data: {
  toEmail: string;
  subject: string;
  emailType: string;
  status: 'sent' | 'failed';
  errorMessage?: string;
  userId?: number;
  bookingId?: number;
}) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(
      sql`INSERT INTO emailLogs (toEmail, subject, emailType, status, errorMessage, userId, bookingId) VALUES (${data.toEmail}, ${data.subject}, ${data.emailType}, ${data.status}, ${data.errorMessage || null}, ${data.userId || null}, ${data.bookingId || null})`
    );
  } catch (e) {
    console.error('[EmailLog] Failed to log email:', e);
  }
}

export async function getEmailLogs(limit: number = 200): Promise<Array<{
  id: number; toEmail: string; subject: string; emailType: string;
  status: string; errorMessage: string | null; userId: number | null;
  bookingId: number | null; sentAt: Date;
}>> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.execute(
    sql`SELECT * FROM emailLogs ORDER BY sentAt DESC LIMIT ${limit}`
  );
  return (result as any)[0] as any[];
}

// ─── Password Reset Tokens ─────────────────────────────────────────────────────

export async function createPasswordResetToken(userId: number, email: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Generate a 6-digit code
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  
  // Invalidate existing tokens for this email
  await db.execute(sql`UPDATE passwordResetTokens SET usedAt = NOW() WHERE email = ${email} AND usedAt IS NULL`);
  
  await db.execute(sql`INSERT INTO passwordResetTokens (userId, email, token, expiresAt) VALUES (${userId}, ${email}, ${token}, ${expiresAt})`);
  return token;
}

export async function verifyPasswordResetToken(email: string, token: string): Promise<{ valid: boolean; userId?: number; tokenId?: number }> {
  const db = await getDb();
  if (!db) return { valid: false };
  const result = await db.execute(sql`SELECT * FROM passwordResetTokens WHERE email = ${email} AND token = ${token} AND usedAt IS NULL AND expiresAt > NOW() ORDER BY createdAt DESC LIMIT 1`);
  const rows = (result as any)[0] as any[];
  if (!rows || rows.length === 0) return { valid: false };
  return { valid: true, userId: rows[0].userId, tokenId: rows[0].id };
}

export async function markPasswordResetTokenUsed(tokenId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.execute(sql`UPDATE passwordResetTokens SET usedAt = NOW() WHERE id = ${tokenId}`);
}

// ─── Welcome Promo Code ────────────────────────────────────────────────────────

export async function createWelcomePromoCode(userId: number, email: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const code = `WELCOME-${userId}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  await db.insert(promoCodes).values({
    code,
    description: 'Welcome gift — £10 off your first booking',
    discountAmount: '10.00' as any,
    codeType: 'manual',
    issuedToUserId: userId,
    issuedToEmail: email,
    isActive: true,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  });
  return code;
}

// ─── V6: App Settings ──────────────────────────────────────────────────────────

export async function getAppSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};
  try {
    const rows = await db.execute(sql`SELECT settingKey, settingValue FROM appSettings`);
    const result: Record<string, string> = {};
    ((rows as any)[0] as any[]).forEach((r: any) => { result[r.settingKey] = r.settingValue || ''; });
    return result;
  } catch { return {}; }
}

export async function getAppSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const rows = await db.execute(sql`SELECT settingValue FROM appSettings WHERE settingKey = ${key} LIMIT 1`);
    const r = ((rows as any)[0] as any[])[0];
    return r ? r.settingValue : null;
  } catch { return null; }
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`INSERT INTO appSettings (settingKey, settingValue) VALUES (${key}, ${value}) ON DUPLICATE KEY UPDATE settingValue = ${value}, updatedAt = NOW()`);
}

// ─── V6: Set Password Token ────────────────────────────────────────────────────

export async function createSetPasswordToken(userId: number, email: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.execute(sql`UPDATE passwordResetTokens SET usedAt = NOW() WHERE email = ${email} AND usedAt IS NULL`);
  await db.execute(sql`INSERT INTO passwordResetTokens (userId, email, token, expiresAt) VALUES (${userId}, ${email}, ${token}, ${expiresAt})`);
  return token;
}

// ─── V6: Audit Logs ────────────────────────────────────────────────────────────

export async function writeAuditLog(data: {
  actorId?: number;
  actorType: 'admin' | 'client' | 'system';
  action: string;
  entityType?: string;
  entityId?: number;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const oldVal = data.oldValue ? JSON.stringify(data.oldValue) : null;
    const newVal = data.newValue ? JSON.stringify(data.newValue) : null;
    await db.execute(sql`INSERT INTO auditLogs (actorId, actorType, action, entityType, entityId, oldValue, newValue, ipAddress, userAgent) VALUES (${data.actorId || null}, ${data.actorType}, ${data.action}, ${data.entityType || null}, ${data.entityId || null}, ${oldVal ? sql.raw(`'${oldVal.replace(/'/g, "\'")}'`) : sql`NULL`}, ${newVal ? sql.raw(`'${newVal.replace(/'/g, "\'")}'`) : sql`NULL`}, ${data.ipAddress || null}, ${data.userAgent || null})`);
  } catch (e) { console.error('[AuditLog] Failed:', e); }
}

export async function getAuditLogs(limit = 500): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(sql`SELECT al.*, u.name as actorName, u.email as actorEmail FROM auditLogs al LEFT JOIN users u ON al.actorId = u.id ORDER BY al.createdAt DESC LIMIT ${limit}`);
    return (rows as any)[0] as any[];
  } catch { return []; }
}

// ─── V6: Loyalty System ────────────────────────────────────────────────────────

export async function getLoyaltyAccount(userId: number): Promise<any> {
  const db = await getDb();
  if (!db) return null;
  try {
    const rows = await db.execute(sql`SELECT * FROM loyaltyAccounts WHERE userId = ${userId} LIMIT 1`);
    return ((rows as any)[0] as any[])[0] || null;
  } catch { return null; }
}

export async function ensureLoyaltyAccount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`INSERT IGNORE INTO loyaltyAccounts (userId, points, lifetimePoints, tier) VALUES (${userId}, 0, 0, 'bronze')`);
}

export async function addLoyaltyPoints(
  userId: number, points: number,
  type: 'earn' | 'redeem' | 'expire' | 'adjustment',
  description: string, bookingId?: number, adminNote?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await ensureLoyaltyAccount(userId);
  await db.execute(sql`INSERT INTO loyaltyTransactions (userId, points, type, description, bookingId, adminNote) VALUES (${userId}, ${points}, ${type}, ${description}, ${bookingId || null}, ${adminNote || null})`);
  await db.execute(sql`UPDATE loyaltyAccounts SET points = GREATEST(0, points + ${points}), updatedAt = NOW() WHERE userId = ${userId}`);
  if (type === 'earn' && points > 0) {
    await db.execute(sql`UPDATE loyaltyAccounts SET lifetimePoints = lifetimePoints + ${points}, updatedAt = NOW() WHERE userId = ${userId}`);
  }
  await db.execute(sql`UPDATE loyaltyAccounts SET tier = CASE WHEN lifetimePoints >= 1500 THEN 'gold' WHEN lifetimePoints >= 500 THEN 'silver' ELSE 'bronze' END WHERE userId = ${userId}`);
}

export async function getLoyaltyTransactions(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(sql`SELECT * FROM loyaltyTransactions WHERE userId = ${userId} ORDER BY createdAt DESC LIMIT 50`);
    return (rows as any)[0] as any[];
  } catch { return []; }
}

export async function getLoyaltyRewards(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(sql`SELECT * FROM loyaltyRewards WHERE isActive = true ORDER BY pointsCost ASC`);
    return (rows as any)[0] as any[];
  } catch { return []; }
}

export async function getAllLoyaltyRewards(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(sql`SELECT * FROM loyaltyRewards ORDER BY pointsCost ASC`);
    return (rows as any)[0] as any[];
  } catch { return []; }
}

export async function createLoyaltyReward(data: { name: string; description?: string; pointsCost: number; rewardType?: string; rewardValue?: string }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.execute(sql`INSERT INTO loyaltyRewards (name, description, pointsCost, rewardType, rewardValue) VALUES (${data.name}, ${data.description || null}, ${data.pointsCost}, ${data.rewardType || 'voucher'}, ${data.rewardValue || null})`);
}

export async function updateLoyaltyReward(id: number, data: { name?: string; description?: string; pointsCost?: number; isActive?: boolean }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (data.name !== undefined) await db.execute(sql`UPDATE loyaltyRewards SET name = ${data.name} WHERE id = ${id}`);
  if (data.description !== undefined) await db.execute(sql`UPDATE loyaltyRewards SET description = ${data.description} WHERE id = ${id}`);
  if (data.pointsCost !== undefined) await db.execute(sql`UPDATE loyaltyRewards SET pointsCost = ${data.pointsCost} WHERE id = ${id}`);
  if (data.isActive !== undefined) await db.execute(sql`UPDATE loyaltyRewards SET isActive = ${data.isActive} WHERE id = ${id}`);
}

export async function redeemLoyaltyReward(userId: number, rewardId: number): Promise<{ voucherCode: string }> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const rewardRows = await db.execute(sql`SELECT * FROM loyaltyRewards WHERE id = ${rewardId} AND isActive = true LIMIT 1`);
  const reward = ((rewardRows as any)[0] as any[])[0];
  if (!reward) throw new Error("Reward not found");
  const account = await getLoyaltyAccount(userId);
  if (!account || account.points < reward.pointsCost) throw new Error("Insufficient points");
  const voucherCode = `REWARD-${userId}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  await db.execute(sql`INSERT INTO loyaltyRedemptions (userId, rewardId, pointsSpent, voucherCode) VALUES (${userId}, ${rewardId}, ${reward.pointsCost}, ${voucherCode})`);
  await addLoyaltyPoints(userId, -reward.pointsCost, 'redeem', `Redeemed: ${reward.name}`);
  return { voucherCode };
}

export async function getLoyaltyRedemptions(userId?: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = userId
      ? await db.execute(sql`SELECT lr.*, lrw.name as rewardName FROM loyaltyRedemptions lr LEFT JOIN loyaltyRewards lrw ON lr.rewardId = lrw.id WHERE lr.userId = ${userId} ORDER BY lr.createdAt DESC`)
      : await db.execute(sql`SELECT lr.*, lrw.name as rewardName, u.name as userName, u.email as userEmail FROM loyaltyRedemptions lr LEFT JOIN loyaltyRewards lrw ON lr.rewardId = lrw.id LEFT JOIN users u ON lr.userId = u.id ORDER BY lr.createdAt DESC LIMIT 200`);
    return (rows as any)[0] as any[];
  } catch { return []; }
}

export async function fulfillRedemption(id: number, adminNote?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.execute(sql`UPDATE loyaltyRedemptions SET status = 'redeemed', adminNote = ${adminNote || null} WHERE id = ${id}`);
}

export async function getAllLoyaltyAccounts(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(sql`SELECT la.*, u.name, u.email FROM loyaltyAccounts la JOIN users u ON la.userId = u.id ORDER BY la.lifetimePoints DESC`);
    return (rows as any)[0] as any[];
  } catch { return []; }
}

// ─── V6: Client Notes ──────────────────────────────────────────────────────────

export async function getClientNotes(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(sql`SELECT cn.*, u.name as creatorName FROM clientNotes cn LEFT JOIN users u ON cn.createdBy = u.id WHERE cn.userId = ${userId} ORDER BY cn.createdAt DESC`);
    return (rows as any)[0] as any[];
  } catch { return []; }
}

export async function createClientNote(userId: number, note: string, createdBy: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.execute(sql`INSERT INTO clientNotes (userId, note, createdBy) VALUES (${userId}, ${note}, ${createdBy})`);
}

export async function deleteClientNote(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.execute(sql`DELETE FROM clientNotes WHERE id = ${id}`);
}

// ─── V6: Booking Feedback ──────────────────────────────────────────────────────

export async function getBookingFeedback(bookingId: number): Promise<any> {
  const db = await getDb();
  if (!db) return null;
  try {
    const rows = await db.execute(sql`SELECT * FROM bookingFeedback WHERE bookingId = ${bookingId} LIMIT 1`);
    return ((rows as any)[0] as any[])[0] || null;
  } catch { return null; }
}

export async function createBookingFeedback(data: { bookingId: number; userId: number; overallRating: number; destinationRating: number; serviceRating: number; comment?: string }): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.execute(sql`INSERT INTO bookingFeedback (bookingId, userId, overallRating, destinationRating, serviceRating, comment) VALUES (${data.bookingId}, ${data.userId}, ${data.overallRating}, ${data.destinationRating}, ${data.serviceRating}, ${data.comment || null})`);
  const rows = await db.execute(sql`SELECT * FROM bookingFeedback WHERE bookingId = ${data.bookingId} ORDER BY createdAt DESC LIMIT 1`);
  return ((rows as any)[0] as any[])[0];
}

// ─── V6: Referral System ──────────────────────────────────────────────────────

export async function ensureReferralCode(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const rows = await db.execute(sql`SELECT referralCode FROM users WHERE id = ${userId} LIMIT 1`);
  const user = ((rows as any)[0] as any[])[0];
  if (user?.referralCode) return user.referralCode;
  const code = `REF-${userId}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  await db.execute(sql`UPDATE users SET referralCode = ${code} WHERE id = ${userId}`);
  return code;
}

export async function getUserByReferralCode(code: string): Promise<any> {
  const db = await getDb();
  if (!db) return null;
  try {
    const rows = await db.execute(sql`SELECT id, name, email FROM users WHERE referralCode = ${code} LIMIT 1`);
    return ((rows as any)[0] as any[])[0] || null;
  } catch { return null; }
}

// ─── V6: Booked Destinations ──────────────────────────────────────────────────

export async function getAllBookedDestinations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookedDestinations).orderBy(desc(bookedDestinations.lastBooked), asc(bookedDestinations.name));
}

export async function createBookedDestination(data: { name: string; imageUrl?: string; lastBooked?: string; sortOrder?: number }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(bookedDestinations).values({
    name: data.name,
    imageUrl: data.imageUrl ?? null,
    lastBooked: data.lastBooked ?? null,
    sortOrder: data.sortOrder ?? 0,
    isActive: true,
  });
}

export async function updateBookedDestination(id: number, data: { name?: string; imageUrl?: string; lastBooked?: string; sortOrder?: number; isActive?: boolean }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const updates: Partial<typeof bookedDestinations.$inferInsert> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;
  if (data.lastBooked !== undefined) updates.lastBooked = data.lastBooked;
  if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;
  if (data.isActive !== undefined) updates.isActive = data.isActive;
  if (Object.keys(updates).length > 0) {
    await db.update(bookedDestinations).set(updates).where(eq(bookedDestinations.id, id));
  }
}

export async function deleteBookedDestination(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(bookedDestinations).where(eq(bookedDestinations.id, id));
}

export async function deleteAllBookedDestinations(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(bookedDestinations);
}

// ─── V6: Notification Log ──────────────────────────────────────────────────────

export async function hasNotificationBeenSent(bookingId: number, type: '7day' | '48hour' | 'departure_day'): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const rows = await db.execute(sql`SELECT id FROM notificationLog WHERE bookingId = ${bookingId} AND notificationType = ${type} LIMIT 1`);
    return ((rows as any)[0] as any[]).length > 0;
  } catch { return false; }
}

export async function logNotificationSent(bookingId: number, type: '7day' | '48hour' | 'departure_day'): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql`INSERT IGNORE INTO notificationLog (bookingId, notificationType) VALUES (${bookingId}, ${type})`);
  } catch {}
}

export async function getUpcomingBookingsForNotifications(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const today = new Date();
    const in7Days = new Date(today); in7Days.setDate(today.getDate() + 7);
    const in2Days = new Date(today); in2Days.setDate(today.getDate() + 2);
    const todayStr = today.toISOString().split('T')[0];
    const in2DaysStr = in2Days.toISOString().split('T')[0];
    const in7DaysStr = in7Days.toISOString().split('T')[0];
    const rows = await db.execute(sql`SELECT b.*, u.email as userEmail, u.name as userName FROM bookings b LEFT JOIN users u ON b.clientId = u.id WHERE b.status = 'confirmed' AND b.departureDate IN (${todayStr}, ${in2DaysStr}, ${in7DaysStr}) AND (b.notificationsEnabled = true OR b.notificationsEnabled IS NULL) AND u.email IS NOT NULL`);
    return (rows as any)[0] as any[];
  } catch { return []; }
}

// ─── V6: Newsletter Subscribers ───────────────────────────────────────────────

export async function subscribeNewsletterV6(email: string, name?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const token = crypto.randomBytes(16).toString('hex');
  await db.execute(sql`INSERT INTO newsletterSubscribers (email, name, unsubscribeToken) VALUES (${email}, ${name || null}, ${token}) ON DUPLICATE KEY UPDATE isActive = true, name = COALESCE(${name || null}, name)`);
}

export async function getNewsletterSubscribers(activeOnly = true): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = activeOnly
      ? await db.execute(sql`SELECT * FROM newsletterSubscribers WHERE isActive = true ORDER BY subscribedAt DESC`)
      : await db.execute(sql`SELECT * FROM newsletterSubscribers ORDER BY subscribedAt DESC`);
    return (rows as any)[0] as any[];
  } catch { return []; }
}

export async function unsubscribeNewsletter(token: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`UPDATE newsletterSubscribers SET isActive = false WHERE unsubscribeToken = ${token}`);
}

// ─── V6: Newsletter Campaigns ─────────────────────────────────────────────────

export async function getCampaigns(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(sql`SELECT c.*, u.name as creatorName FROM newsletterCampaigns c LEFT JOIN users u ON c.createdBy = u.id ORDER BY c.createdAt DESC`);
    return (rows as any)[0] as any[];
  } catch { return []; }
}

export async function createCampaign(data: { subject: string; htmlBody: string; scheduledAt?: Date; createdBy?: number }): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.execute(sql`INSERT INTO newsletterCampaigns (subject, htmlBody, scheduledAt, createdBy) VALUES (${data.subject}, ${data.htmlBody}, ${data.scheduledAt || null}, ${data.createdBy || null})`);
  return (result as any)[0].insertId;
}

export async function markCampaignSent(id: number, sentCount: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`UPDATE newsletterCampaigns SET status = 'sent', sentAt = NOW(), sentCount = ${sentCount} WHERE id = ${id}`);
}

// ─── V6: Birthday helpers ─────────────────────────────────────────────────────

export async function getUsersWithBirthdayTomorrow(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(sql`SELECT * FROM users WHERE dateOfBirth IS NOT NULL AND MONTH(dateOfBirth) = MONTH(DATE_ADD(NOW(), INTERVAL 1 DAY)) AND DAY(dateOfBirth) = DAY(DATE_ADD(NOW(), INTERVAL 1 DAY)) AND email IS NOT NULL AND isDisabled = false`);
    return (rows as any)[0] as any[];
  } catch { return []; }
}

export async function setUserDateOfBirth(userId: number, dob: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`UPDATE users SET dateOfBirth = ${dob} WHERE id = ${userId}`);
}

export async function getAllFaqItemsForAI(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(sql`SELECT question, answer FROM faqItems WHERE isActive = true ORDER BY sortOrder ASC`);
    return (rows as any)[0] as any[];
  } catch { return []; }
}

export async function getAllFeedback(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(sql`SELECT bf.*, u.name as userName, b.bookingReference, b.destination FROM bookingFeedback bf LEFT JOIN users u ON bf.userId = u.id LEFT JOIN bookings b ON bf.bookingId = b.id ORDER BY bf.createdAt DESC`);
    return (rows as any)[0] as any[];
  } catch { return []; }
}

// ─── LOYALTY SYSTEM ────────────────────────────────────────────────────────────

const TIER_THRESHOLDS = { bronze: 0, silver: 500, gold: 1500 };
const TIER_ORDER = ["bronze", "silver", "gold"] as const;
type Tier = "bronze" | "silver" | "gold";

function calculateTier(lifetimePoints: number): Tier {
  if (lifetimePoints >= 1500) return "gold";
  if (lifetimePoints >= 500) return "silver";
  return "bronze";
}

export async function getOrCreateLoyaltyAccount(userId: number) {
  const [existing] = await db
    .select()
    .from(schema.loyaltyAccounts)
    .where(sql`${schema.loyaltyAccounts.userId} = ${userId}`)
    .limit(1);
  if (existing) return existing;
  await db.insert(schema.loyaltyAccounts).values({
    userId,
    points: 0,
    lifetimePoints: 0,
    tier: "bronze",
    pointsMultiplier: "1.0" as any,
  });
  const [created] = await db
    .select()
    .from(schema.loyaltyAccounts)
    .where(sql`${schema.loyaltyAccounts.userId} = ${userId}`)
    .limit(1);
  return created;
}

export async function getAllLoyaltyTransactions(limit = 200) {
  return db
    .select({
      id: schema.loyaltyTransactions.id,
      userId: schema.loyaltyTransactions.userId,
      points: schema.loyaltyTransactions.points,
      type: schema.loyaltyTransactions.type,
      description: schema.loyaltyTransactions.description,
      reason: schema.loyaltyTransactions.reason,
      adminNote: schema.loyaltyTransactions.adminNote,
      createdAt: schema.loyaltyTransactions.createdAt,
      userName: schema.users.name,
      userEmail: schema.users.email,
    })
    .from(schema.loyaltyTransactions)
    .innerJoin(schema.users, sql`${schema.loyaltyTransactions.userId} = ${schema.users.id}`)
    .orderBy(sql`${schema.loyaltyTransactions.createdAt} DESC`)
    .limit(limit);
}

export async function deductLoyaltyPoints(
  userId: number,
  points: number,
  description: string,
  reason?: string
) {
  const account = await getOrCreateLoyaltyAccount(userId);
  if (account.points < points) {
    throw new Error(`Insufficient points (have ${account.points}, need ${points})`);
  }
  const newPoints = account.points - points;
  await db
    .update(schema.loyaltyAccounts)
    .set({ points: newPoints })
    .where(sql`${schema.loyaltyAccounts.userId} = ${userId}`);

  await db.insert(schema.loyaltyTransactions).values({
    userId,
    points: -points,
    type: "redeem",
    description,
    reason,
  });
}

export async function adminAdjustLoyaltyPoints(
  userId: number,
  points: number,
  reason: string,
  adminId: number
) {
  const account = await getOrCreateLoyaltyAccount(userId);
  const isAdd = points > 0;
  const absPoints = Math.abs(points);

  if (!isAdd && account.points < absPoints) {
    throw new Error(`Cannot deduct ${absPoints} pts — client only has ${account.points}`);
  }

  const newPoints = account.points + points;
  const newLifetime = isAdd ? account.lifetimePoints + points : account.lifetimePoints;
  const newTier = calculateTier(newLifetime);
  const oldTier = account.tier;

  await db
    .update(schema.loyaltyAccounts)
    .set({ points: Math.max(0, newPoints), lifetimePoints: Math.max(0, newLifetime), tier: newTier })
    .where(sql`${schema.loyaltyAccounts.userId} = ${userId}`);

  await db.insert(schema.loyaltyTransactions).values({
    userId,
    points,
    type: "adjustment",
    description: isAdd ? `Points added by admin` : `Points deducted by admin`,
    reason,
    adminId,
    adminNote: reason,
  });

  if (newTier !== oldTier && isAdd) {
    await db.insert(schema.loyaltyTierHistory).values({ userId, fromTier: oldTier, toTier: newTier });
    return { tierUpgraded: true, newTier, oldTier };
  }
  return { tierUpgraded: false, newTier };
}

export async function updateLoyaltyMemberNotes(userId: number, notes: string) {
  await db
    .update(schema.loyaltyAccounts)
    .set({ memberNotes: notes })
    .where(sql`${schema.loyaltyAccounts.userId} = ${userId}`);
}

export async function setPointsMultiplier(userId: number, multiplier: number) {
  await db
    .update(schema.loyaltyAccounts)
    .set({ pointsMultiplier: String(multiplier) as any })
    .where(sql`${schema.loyaltyAccounts.userId} = ${userId}`);
}

// ─── REWARDS SHOP ───────────────────────────────────────────────────────────

export async function getLoyaltyReward(id: number) {
  const [reward] = await db
    .select()
    .from(schema.loyaltyRewards)
    .where(sql`${schema.loyaltyRewards.id} = ${id}`)
    .limit(1);
  return reward;
}

export async function deleteLoyaltyReward(id: number) {
  await db.update(schema.loyaltyRewards).set({ isActive: false }).where(sql`${schema.loyaltyRewards.id} = ${id}`);
}

// ─── REDEMPTIONS / VOUCHERS ─────────────────────────────────────────────────

export async function getAllRedemptions(status?: string) {
  return db
    .select({
      id: schema.loyaltyRedemptions.id,
      userId: schema.loyaltyRedemptions.userId,
      rewardId: schema.loyaltyRedemptions.rewardId,
      pointsSpent: schema.loyaltyRedemptions.pointsSpent,
      voucherCode: schema.loyaltyRedemptions.voucherCode,
      expiresAt: schema.loyaltyRedemptions.expiresAt,
      status: schema.loyaltyRedemptions.status,
      adminNote: schema.loyaltyRedemptions.adminNote,
      createdAt: schema.loyaltyRedemptions.createdAt,
      rewardName: schema.loyaltyRewards.name,
      userName: schema.users.name,
      userEmail: schema.users.email,
    })
    .from(schema.loyaltyRedemptions)
    .innerJoin(schema.loyaltyRewards, sql`${schema.loyaltyRedemptions.rewardId} = ${schema.loyaltyRewards.id}`)
    .innerJoin(schema.users, sql`${schema.loyaltyRedemptions.userId} = ${schema.users.id}`)
    .where(status ? sql`${schema.loyaltyRedemptions.status} = ${status}` : sql`1=1`)
    .orderBy(sql`${schema.loyaltyRedemptions.createdAt} DESC`)
    .limit(200);
}

export async function claimLoyaltyReward(
  userId: number,
  rewardId: number
): Promise<{ voucherCode: string; expiresAt: Date }> {
  const reward = await getLoyaltyReward(rewardId);
  if (!reward) throw new Error("Reward not found");
  if (!reward.isActive) throw new Error("Reward is no longer available");

  // Check stock
  if (reward.stock !== null && reward.stock !== undefined) {
    if ((reward.stockUsed || 0) >= reward.stock) throw new Error("This reward is out of stock");
  }

  // Check tier eligibility
  const account = await getOrCreateLoyaltyAccount(userId);
  const tierIdx = TIER_ORDER.indexOf(account.tier);
  const reqIdx = TIER_ORDER.indexOf(reward.minTier);
  if (tierIdx < reqIdx) {
    throw new Error(`This reward requires ${reward.minTier} tier or higher`);
  }

  // Check balance
  if (account.points < reward.pointsCost) {
    throw new Error(`Insufficient points (need ${reward.pointsCost}, have ${account.points})`);
  }

  // Generate unique voucher code
  const { nanoid } = await import("nanoid");
  const voucherCode = `CBT-${nanoid(4).toUpperCase()}-${nanoid(4).toUpperCase()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 3 months

  // Deduct points
  await deductLoyaltyPoints(userId, reward.pointsCost, `Redeemed: ${reward.name}`, `Reward claim #${rewardId}`);

  // Update stock used
  if (reward.stock !== null && reward.stock !== undefined) {
    await db
      .update(schema.loyaltyRewards)
      .set({ stockUsed: (reward.stockUsed || 0) + 1 })
      .where(sql`${schema.loyaltyRewards.id} = ${rewardId}`);
  }

  // Create redemption record
  await db.insert(schema.loyaltyRedemptions).values({
    userId,
    rewardId,
    pointsSpent: reward.pointsCost,
    voucherCode,
    expiresAt,
    status: "active",
  });

  return { voucherCode, expiresAt };
}

export async function adminMarkVoucherRedeemed(redemptionId: number, adminId: number, note?: string) {
  await db
    .update(schema.loyaltyRedemptions)
    .set({ status: "redeemed", adminNote: note, adminId })
    .where(sql`${schema.loyaltyRedemptions.id} = ${redemptionId}`);
}

export async function adminCancelVoucher(redemptionId: number, adminId: number) {
  const [redemption] = await db
    .select()
    .from(schema.loyaltyRedemptions)
    .where(sql`${schema.loyaltyRedemptions.id} = ${redemptionId}`)
    .limit(1);
  if (!redemption) throw new Error("Redemption not found");
  if (redemption.status !== "active") throw new Error("Can only cancel active vouchers");

  // Refund points
  await addLoyaltyPoints(
    redemption.userId,
    redemption.pointsSpent,
    "adjustment" as any,
    `Voucher cancelled – points refunded`,
    undefined,
    `Voucher #${redemptionId} cancelled by admin`
  );

  await db
    .update(schema.loyaltyRedemptions)
    .set({ status: "cancelled", adminId })
    .where(sql`${schema.loyaltyRedemptions.id} = ${redemptionId}`);
}


export async function getLoyaltyStats() {
  const [totals] = await db
    .select({
      totalMembers: sql<number>`COUNT(DISTINCT ${schema.loyaltyAccounts.userId})`,
      totalPointsIssued: sql<number>`COALESCE(SUM(CASE WHEN ${schema.loyaltyTransactions.points} > 0 THEN ${schema.loyaltyTransactions.points} ELSE 0 END), 0)`,
      totalPointsRedeemed: sql<number>`COALESCE(SUM(CASE WHEN ${schema.loyaltyTransactions.points} < 0 THEN ABS(${schema.loyaltyTransactions.points}) ELSE 0 END), 0)`,
    })
    .from(schema.loyaltyAccounts)
    .leftJoin(schema.loyaltyTransactions, sql`${schema.loyaltyAccounts.userId} = ${schema.loyaltyTransactions.userId}`);

  const [redemptionCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.loyaltyRedemptions);

  const tierCounts = await db
    .select({ tier: schema.loyaltyAccounts.tier, count: sql<number>`COUNT(*)` })
    .from(schema.loyaltyAccounts)
    .groupBy(schema.loyaltyAccounts.tier);

  return { ...totals, totalRedemptions: redemptionCount.count, tierCounts };
}

export async function expireLoyaltyVouchers() {
  const now = new Date();
  await db
    .update(schema.loyaltyRedemptions)
    .set({ status: "expired" })
    .where(sql`${schema.loyaltyRedemptions.status} = 'active' AND ${schema.loyaltyRedemptions.expiresAt} < ${now}`);
}


export async function cancelRedemption(id: number, returnPoints: boolean = true): Promise<void> {
  const db = await getDb();
  if (!db) return;
  if (returnPoints) {
    const rows = await db.execute(sql`SELECT userId, pointsSpent FROM loyaltyRedemptions WHERE id = ${id} LIMIT 1`);
    const r = (rows as any).rows?.[0] || rows[0];
    if (r) {
      await addLoyaltyPoints(r.userId, r.pointsSpent, 'adjustment', 'Redemption cancelled — points refunded');
    }
  }
  await db.execute(sql`UPDATE loyaltyRedemptions SET status = 'cancelled' WHERE id = ${id}`);
}

export async function getLoyaltyLeaderboard(limit = 10): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`
    SELECT la.userId, la.currentPoints, la.lifetimePoints, la.tier,
           u.name, u.email
    FROM loyaltyAccounts la
    JOIN users u ON u.id = la.userId
    ORDER BY la.lifetimePoints DESC
    LIMIT ${limit}
  `);
  return (rows as any).rows || rows;
}

export async function getAllRedemptionsAdmin(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`
    SELECT lr.*, u.name as clientName, u.email as clientEmail, rw.name as rewardName
    FROM loyaltyRedemptions lr
    JOIN users u ON u.id = lr.userId
    LEFT JOIN loyaltyRewards rw ON rw.id = lr.rewardId
    ORDER BY lr.createdAt DESC
    LIMIT 200
  `);
  return (rows as any)[0] as any[];
}

export async function setNotificationsEnabled(bookingId: number, enabled: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`UPDATE bookings SET notificationsEnabled = ${enabled} WHERE id = ${bookingId}`);
}

// ─── Booked Destinations: list ─────────────────────────────────────────────────
export async function getBookedDestinations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookedDestinations)
    .where(eq(bookedDestinations.isActive, true))
    .orderBy(asc(bookedDestinations.sortOrder), asc(bookedDestinations.name));
}

// ─── User referral code setter ──────────────────────────────────────────────────
export async function setUserReferralCode(userId: number, code: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`UPDATE users SET referralCode = ${code} WHERE id = ${userId}`);
}

// ─── Newsletter campaigns ────────────────────────────────────────────────────────
export async function createNewsletterCampaign(data: {
  subject: string;
  htmlBody: string;
  status?: string;
  scheduledAt?: Date | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`INSERT INTO newsletterCampaigns (subject, htmlBody, status, scheduledAt) VALUES (${data.subject}, ${data.htmlBody}, ${data.status || 'draft'}, ${data.scheduledAt || null})`);
}

export async function getNewsletterCampaigns(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(sql`SELECT * FROM newsletterCampaigns ORDER BY createdAt DESC LIMIT 100`);
    return Array.isArray(rows) ? rows : (rows as any).rows || [];
  } catch {
    return [];
  }
}

export async function updateNewsletterCampaign(id: number, data: { status?: string; sentAt?: Date; sentCount?: number }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const sets: string[] = [];
  if (data.status !== undefined) sets.push(`status = '${data.status}'`);
  if (data.sentAt !== undefined) sets.push(`sentAt = '${data.sentAt.toISOString().slice(0,19).replace('T',' ')}'`);
  if (data.sentCount !== undefined) sets.push(`sentCount = ${data.sentCount}`);
  if (!sets.length) return;
  await db.execute(sql`UPDATE newsletterCampaigns SET ${sql.raw(sets.join(', '))} WHERE id = ${id}`);
}

// ─── V7: Support Tickets ─────────────────────────────────────────────────────

export async function createSupportTicket(data: {
  userId: number;
  subject: string;
  ticketType: string;
  message: string;
  fileUrl?: string;
  fileKey?: string;
}): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let ticketId: number;
  try {
    const insertResult = await db.insert(supportTickets).values({
      userId: data.userId,
      subject: data.subject,
      ticketType: data.ticketType as any,
      message: data.message,
      fileUrl: data.fileUrl ?? null,
      fileKey: data.fileKey ?? null,
    });
    ticketId = (insertResult as any)[0]?.insertId ?? (insertResult as any).insertId;
    if (!ticketId) throw new Error("INSERT did not return an insertId — check the supportTickets table exists (run MIGRATION_V7.sql)");
  } catch (err: any) {
    throw new Error(`Failed to create support ticket: ${err?.message || String(err)}`);
  }
  try {
    await db.insert(ticketMessages).values({
      ticketId,
      userId: data.userId,
      message: data.message,
      fileUrl: data.fileUrl ?? null,
      fileKey: data.fileKey ?? null,
      isAdmin: false,
    });
  } catch (err: any) {
    // Non-fatal — ticket was created, just the opening message failed
    console.error("[createSupportTicket] ticketMessages insert failed:", err?.message);
  }
  const rows = await db.execute(sql`SELECT * FROM supportTickets WHERE id = ${ticketId} LIMIT 1`);
  return ((rows as any)[0] as any[])[0];
}

export async function getSupportTicketsByUserId(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(
      sql`SELECT st.*, u.name as userName, u.email as userEmail,
          (SELECT COUNT(*) FROM ticketMessages WHERE ticketId = st.id) as messageCount,
          (SELECT createdAt FROM ticketMessages WHERE ticketId = st.id ORDER BY createdAt DESC LIMIT 1) as lastMessageAt
          FROM supportTickets st
          LEFT JOIN users u ON st.userId = u.id
          WHERE st.userId = ${userId}
          ORDER BY st.updatedAt DESC`
    );
    return (rows as any)[0] as any[];
  } catch { return []; }
}

export async function getAllSupportTickets(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(
      sql`SELECT st.*, u.name as userName, u.email as userEmail,
          (SELECT COUNT(*) FROM ticketMessages WHERE ticketId = st.id) as messageCount,
          (SELECT createdAt FROM ticketMessages WHERE ticketId = st.id ORDER BY createdAt DESC LIMIT 1) as lastMessageAt
          FROM supportTickets st
          LEFT JOIN users u ON st.userId = u.id
          ORDER BY st.updatedAt DESC`
    );
    return (rows as any)[0] as any[];
  } catch { return []; }
}

export async function getSupportTicketById(id: number): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const rows = await db.execute(
      sql`SELECT st.*, u.name as userName, u.email as userEmail
          FROM supportTickets st LEFT JOIN users u ON st.userId = u.id
          WHERE st.id = ${id} LIMIT 1`
    );
    return ((rows as any)[0] as any[])[0] || null;
  } catch { return null; }
}

export async function updateSupportTicketStatus(id: number, status: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`UPDATE supportTickets SET status = ${status}, updatedAt = NOW() WHERE id = ${id}`);
}

export async function addTicketMessage(data: {
  ticketId: number;
  userId: number;
  message: string;
  fileUrl?: string;
  fileKey?: string;
  isAdmin: boolean;
}): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.execute(
    sql`INSERT INTO ticketMessages (ticketId, userId, message, fileUrl, fileKey, isAdmin) VALUES (${data.ticketId}, ${data.userId}, ${data.message}, ${data.fileUrl || null}, ${data.fileKey || null}, ${data.isAdmin})`
  );
  // Update ticket updatedAt
  await db.execute(sql`UPDATE supportTickets SET updatedAt = NOW() WHERE id = ${data.ticketId}`);
  const id = (result as any)[0]?.insertId;
  const rows = await db.execute(sql`SELECT tm.*, u.name as senderName FROM ticketMessages tm LEFT JOIN users u ON tm.userId = u.id WHERE tm.id = ${id} LIMIT 1`);
  return ((rows as any)[0] as any[])[0];
}

export async function getTicketMessages(ticketId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(
      sql`SELECT tm.*, u.name as senderName FROM ticketMessages tm LEFT JOIN users u ON tm.userId = u.id WHERE tm.ticketId = ${ticketId} ORDER BY tm.createdAt ASC`
    );
    return (rows as any)[0] as any[];
  } catch { return []; }
}

// ─── V7: Booking Members (Group / Travel Party) ───────────────────────────────

export async function getBookingMembers(bookingId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(
      sql`SELECT bm.*, u.name as userName, u.email as userEmail FROM bookingMembers bm LEFT JOIN users u ON bm.userId = u.id WHERE bm.bookingId = ${bookingId} ORDER BY bm.role ASC, bm.createdAt ASC`
    );
    return (rows as any)[0] as any[];
  } catch { return []; }
}

export async function addBookingMember(bookingId: number, userId: number, addedBy: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.execute(
    sql`INSERT IGNORE INTO bookingMembers (bookingId, userId, addedBy) VALUES (${bookingId}, ${userId}, ${addedBy})`
  );
}

export async function removeBookingMember(bookingId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.execute(sql`DELETE FROM bookingMembers WHERE bookingId = ${bookingId} AND userId = ${userId}`);
}

export async function getSharedBookingsByUserId(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(
      sql`SELECT b.* FROM bookings b INNER JOIN bookingMembers bm ON b.id = bm.bookingId WHERE bm.userId = ${userId} ORDER BY b.departureDate ASC`
    );
    return (rows as any)[0] as any[];
  } catch { return []; }
}

// ─── V8: Destination Activities ───────────────────────────────────────────────

export async function getActivitiesByDestination(destination: string): Promise<DestinationActivity[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(destinationActivities)
      .where(eq(destinationActivities.destination, destination))
      .orderBy(destinationActivities.sortOrder, destinationActivities.id) as DestinationActivity[];
  } catch { return []; }
}

export async function upsertActivity(data: Omit<InsertDestinationActivity, 'id'> & { id?: number }): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.id) {
    const { id, ...rest } = data;
    await db.update(destinationActivities).set(rest as any).where(eq(destinationActivities.id, id));
    return id;
  }
  const [result] = await db.insert(destinationActivities).values(data as InsertDestinationActivity) as any;
  return result.insertId;
}

export async function deleteActivity(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(destinationActivities).where(eq(destinationActivities.id, id));
}

export async function clearActivitiesForDestination(destination: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(destinationActivities).where(eq(destinationActivities.destination, destination));
}

// ─── V8: Booking Photos ───────────────────────────────────────────────────────

export async function getPhotosByBooking(bookingId: number): Promise<BookingPhoto[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(bookingPhotos)
      .where(eq(bookingPhotos.bookingId, bookingId))
      .orderBy(bookingPhotos.sortOrder, bookingPhotos.id) as BookingPhoto[];
  } catch { return []; }
}

export async function addBookingPhoto(data: InsertBookingPhoto): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(bookingPhotos).values(data) as any;
  return result.insertId;
}

export async function deleteBookingPhoto(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(bookingPhotos).where(eq(bookingPhotos.id, id));
}

export async function updateBookingPhotoCaption(id: number, caption: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookingPhotos).set({ caption }).where(eq(bookingPhotos.id, id));
}

// ─── LOYALTY RULES ──────────────────────────────────────────────────────────

export async function getLoyaltyRules() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(loyaltyRules).orderBy(loyaltyRules.id);
  return rows;
}

export async function updateLoyaltyRule(id: number, data: { points?: number; isActive?: boolean; label?: string; description?: string }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(loyaltyRules).set({ ...data }).where(sql`${loyaltyRules.id} = ${id}`);
}

export async function getPointsForEvent(eventKey: string): Promise<{ points: number; isActive: boolean; isPerPound: boolean }> {
  const db = await getDb();
  if (!db) return { points: 0, isActive: false, isPerPound: false };
  const rows = await db.select().from(loyaltyRules).where(sql`${loyaltyRules.eventKey} = ${eventKey}`).limit(1);
  if (!rows.length) return { points: 0, isActive: false, isPerPound: false };
  const r = rows[0];
  return { points: r.points, isActive: !!r.isActive, isPerPound: !!r.isPerPound };
}

// ─── Passport Column Migration ─────────────────────────────────────────────
export async function ensurePassportColumns() {
  const db = await getDb();
  if (!db) return;
  const alterStatements = [
    "ALTER TABLE bookings ADD COLUMN passportNumber VARCHAR(100)",
    "ALTER TABLE bookings ADD COLUMN passportExpiry VARCHAR(50)",
    "ALTER TABLE bookings ADD COLUMN passportIssueDate VARCHAR(50)",
    "ALTER TABLE bookings ADD COLUMN passportIssuingCountry VARCHAR(100)",
  ];
  for (const stmt of alterStatements) {
    try {
      await db.execute(sql`${sql.raw(stmt)}`);
    } catch (e: any) {
      // Ignore "Duplicate column" errors (column already exists)
      const msg = e?.message || String(e);
      if (!msg.includes("Duplicate column") && !msg.includes("ER_DUP_FIELDNAME") && !msg.includes("already exists")) {
        console.warn("[DB] Passport migration warning:", msg);
      }
    }
  }
}

// ─── Update Booking Passport Info ─────────────────────────────────────────
export async function updateBookingPassport(id: number, data: {
  passportNumber?: string | null;
  passportExpiry?: string | null;
  passportIssueDate?: string | null;
  passportIssuingCountry?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updates: Record<string, any> = {};
  if (data.passportNumber !== undefined) updates.passportNumber = data.passportNumber;
  if (data.passportExpiry !== undefined) updates.passportExpiry = data.passportExpiry;
  if (data.passportIssueDate !== undefined) updates.passportIssueDate = data.passportIssueDate;
  if (data.passportIssuingCountry !== undefined) updates.passportIssuingCountry = data.passportIssuingCountry;
  if (Object.keys(updates).length === 0) return;
  await db.update(bookings).set(updates).where(eq(bookings.id, id));
}

// ─── Admin Quotes (Quotes Portal) ─────────────────────────────────────────────

export async function ensureAdminQuotesTable(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    // Use raw SQL to ensure the table exists - handles cold-start with new schema
    const conn = (db as any).session?.client || (db as any)._client;
    if (conn) {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS adminQuotes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          quoteRef VARCHAR(50) UNIQUE NOT NULL,
          clientName VARCHAR(255) NOT NULL,
          clientEmail VARCHAR(320) NOT NULL,
          clientPhone VARCHAR(30),
          userId INT,
          destination VARCHAR(255),
          departureDate VARCHAR(50),
          returnDate VARCHAR(50),
          numberOfTravelers INT,
          hotels TEXT,
          flightDetails TEXT,
          keyInclusions TEXT,
          totalPrice DECIMAL(10,2),
          pricePerPerson DECIMAL(10,2),
          priceBreakdown TEXT,
          notes TEXT,
          documentUrl TEXT,
          documentKey TEXT,
          status ENUM('draft','sent','viewed','accepted','expired','intake_submitted','converted') DEFAULT 'draft' NOT NULL,
          viewCount INT DEFAULT 0 NOT NULL,
          lastViewedAt TIMESTAMP NULL,
          sentAt TIMESTAMP NULL,
          acceptedAt TIMESTAMP NULL,
          expiresAt TIMESTAMP NULL,
          createdBy INT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
        )
      `);
    }
  } catch (_e) {
    // Ignore - table may already exist or raw access not available
  }
}

export async function ensureUserPassportColumns() {
  const db = await getDb();
  if (!db) return;
  const alterStatements = [
    "ALTER TABLE users ADD COLUMN passportNumber VARCHAR(100)",
    "ALTER TABLE users ADD COLUMN passportExpiry VARCHAR(50)",
    "ALTER TABLE users ADD COLUMN passportIssueDate VARCHAR(50)",
    "ALTER TABLE users ADD COLUMN passportIssuingCountry VARCHAR(100)",
    "ALTER TABLE users ADD COLUMN passportNationality VARCHAR(100)",
  ];
  for (const stmt of alterStatements) {
    try {
      await db.execute(sql`${sql.raw(stmt)}`);
    } catch (e: any) {
      // Ignore "Duplicate column" errors (column already exists)
      const msg = e?.message || String(e);
      if (!msg.includes("Duplicate column") && !msg.includes("ER_DUP_FIELDNAME") && !msg.includes("already exists")) {
        console.warn("[DB] User passport migration warning:", msg);
      }
    }
  }
}

export async function updateUserPassport(userId: number, data: {
  passportNumber?: string | null;
  passportExpiry?: string | null;
  passportIssueDate?: string | null;
  passportIssuingCountry?: string | null;
  passportNationality?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const updateData: Record<string, any> = {};
  if (data.passportNumber !== undefined) updateData.passportNumber = data.passportNumber;
  if (data.passportExpiry !== undefined) updateData.passportExpiry = data.passportExpiry;
  if (data.passportIssueDate !== undefined) updateData.passportIssueDate = data.passportIssueDate;
  if (data.passportIssuingCountry !== undefined) updateData.passportIssuingCountry = data.passportIssuingCountry;
  if (data.passportNationality !== undefined) updateData.passportNationality = data.passportNationality;
  if (Object.keys(updateData).length === 0) return;
  await db.update(users).set(updateData).where(eq(users.id, userId));
}

function generateQuoteRef(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CBQ-${year}-${rand}`;
}

export async function createAdminQuote(data: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  userId?: number | null;
  destination?: string | null;
  departureDate?: string | null;
  returnDate?: string | null;
  numberOfTravelers?: number | null;
  hotels?: string | null;
  flightDetails?: string | null;
  keyInclusions?: string | null;
  totalPrice?: string | null;
  pricePerPerson?: string | null;
  priceBreakdown?: string | null;
  notes?: string | null;
  documentUrl?: string | null;
  documentKey?: string | null;
  createdBy?: number | null;
  quoteRef?: string | null;
}): Promise<{ id: number; quoteRef: string }> {
  await ensureAdminQuotesTable();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let quoteRef = (data as any).quoteRef || generateQuoteRef();
  // Ensure uniqueness
  for (let i = 0; i < 5; i++) {
    const existing = await db.select({ id: adminQuotes.id }).from(adminQuotes).where(eq(adminQuotes.quoteRef, quoteRef)).limit(1);
    if (existing.length === 0) break;
    quoteRef = generateQuoteRef();
  }

  // Set expiry 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await db.insert(adminQuotes).values({
    quoteRef,
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    clientPhone: data.clientPhone ?? null,
    userId: data.userId ?? null,
    destination: data.destination ?? null,
    departureDate: data.departureDate ?? null,
    returnDate: data.returnDate ?? null,
    numberOfTravelers: data.numberOfTravelers ?? null,
    hotels: data.hotels ?? null,
    flightDetails: data.flightDetails ?? null,
    keyInclusions: data.keyInclusions ?? null,
    totalPrice: data.totalPrice ?? null,
    pricePerPerson: data.pricePerPerson ?? null,
    priceBreakdown: data.priceBreakdown ?? null,
    notes: data.notes ?? null,
    documentUrl: data.documentUrl ?? null,
    documentKey: data.documentKey ?? null,
    status: "draft",
    expiresAt,
    createdBy: data.createdBy ?? null,
  });

  const created = await db.select({ id: adminQuotes.id, quoteRef: adminQuotes.quoteRef })
    .from(adminQuotes)
    .where(eq(adminQuotes.quoteRef, quoteRef))
    .limit(1);
  
  return created[0] || { id: 0, quoteRef };
}

export async function updateAdminQuote(id: number, data: Partial<{
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  userId: number | null;
  destination: string | null;
  departureDate: string | null;
  returnDate: string | null;
  numberOfTravelers: number | null;
  hotels: string | null;
  flightDetails: string | null;
  keyInclusions: string | null;
  totalPrice: string | null;
  pricePerPerson: string | null;
  priceBreakdown: string | null;
  notes: string | null;
  documentUrl: string | null;
  documentKey: string | null;
  status: "draft" | "sent" | "viewed" | "accepted" | "expired" | "intake_submitted" | "converted";
  sentAt: Date | null;
  acceptedAt: Date | null;
  expiresAt: Date | null;
}>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updates: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) updates[k] = v;
  }
  if (Object.keys(updates).length === 0) return;
  await db.update(adminQuotes).set(updates).where(eq(adminQuotes.id, id));
}

export async function getAllAdminQuotes(): Promise<any[]> {
  await ensureAdminQuotesTable();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminQuotes).orderBy(desc(adminQuotes.createdAt));
}

export async function getAdminQuoteById(id: number): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(adminQuotes).where(eq(adminQuotes.id, id)).limit(1);
  return rows[0] || null;
}

export async function getAdminQuoteByRef(quoteRef: string): Promise<any | null> {
  await ensureAdminQuotesTable();
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(adminQuotes).where(eq(adminQuotes.quoteRef, quoteRef)).limit(1);
  return rows[0] || null;
}

export async function getAdminQuotesByUserId(userId: number): Promise<any[]> {
  await ensureAdminQuotesTable();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminQuotes)
    .where(eq(adminQuotes.userId, userId))
    .orderBy(desc(adminQuotes.createdAt));
}

export async function getAdminQuotesByEmail(email: string): Promise<any[]> {
  await ensureAdminQuotesTable();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminQuotes)
    .where(eq(adminQuotes.clientEmail, email))
    .orderBy(desc(adminQuotes.createdAt));
}

export async function incrementAdminQuoteView(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(adminQuotes)
    .set({ 
      viewCount: sql`viewCount + 1`,
      lastViewedAt: new Date(),
      status: sql`CASE WHEN status = 'sent' THEN 'viewed' ELSE status END`,
    })
    .where(eq(adminQuotes.id, id));
}

export async function deleteAdminQuote(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(adminQuotes).where(eq(adminQuotes.id, id));
}

// ─── Community Posts ──────────────────────────────────────────────────────────

export async function ensureCommunityPostsTable() {
  try {
    const db = await getDb();
    if (!db) return;
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS communityPosts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('charity','partnership','giveaway','community') NOT NULL DEFAULT 'community',
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        description TEXT,
        content MEDIUMTEXT,
        imageUrl MEDIUMTEXT,
        partnerName VARCHAR(255),
        charityName VARCHAR(255),
        amountRaised VARCHAR(100),
        location VARCHAR(255),
        eventDate VARCHAR(50),
        isFeatured BOOLEAN NOT NULL DEFAULT false,
        isPublished BOOLEAN NOT NULL DEFAULT false,
        displayOrder INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW()
      )
    `);
  } catch (e) {
    console.error('[DB] ensureCommunityPostsTable error:', e);
  }
}

export async function getAllCommunityPosts(): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.execute(sql`SELECT * FROM communityPosts ORDER BY displayOrder ASC, createdAt DESC`);
    return ((rows as any)[0] as any[]) || [];
  } catch { return []; }
}

export async function getPublishedCommunityPosts(): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.execute(sql`SELECT * FROM communityPosts WHERE isPublished = true ORDER BY displayOrder ASC, createdAt DESC`);
    return ((rows as any)[0] as any[]) || [];
  } catch { return []; }
}

export async function getFeaturedCommunityPosts(limit = 3): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.execute(sql`SELECT * FROM communityPosts WHERE isPublished = true AND isFeatured = true ORDER BY displayOrder ASC, createdAt DESC LIMIT ${limit}`);
    return ((rows as any)[0] as any[]) || [];
  } catch { return []; }
}

export async function getCommunityPostById(id: number): Promise<any | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.execute(sql`SELECT * FROM communityPosts WHERE id = ${id} LIMIT 1`);
    const arr = ((rows as any)[0] as any[]) || [];
    return arr[0] || null;
  } catch { return null; }
}

export async function createCommunityPost(data: {
  type: 'charity' | 'partnership' | 'giveaway' | 'community';
  title: string;
  subtitle?: string | null;
  description?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  partnerName?: string | null;
  charityName?: string | null;
  amountRaised?: string | null;
  location?: string | null;
  eventDate?: string | null;
  isFeatured?: boolean;
  isPublished?: boolean;
  displayOrder?: number;
}): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.execute(sql`
    INSERT INTO communityPosts (type, title, subtitle, description, content, imageUrl, partnerName, charityName, amountRaised, location, eventDate, isFeatured, isPublished, displayOrder)
    VALUES (${data.type}, ${data.title}, ${data.subtitle || null}, ${data.description || null}, ${data.content || null}, ${data.imageUrl || null}, ${data.partnerName || null}, ${data.charityName || null}, ${data.amountRaised || null}, ${data.location || null}, ${data.eventDate || null}, ${data.isFeatured ?? false}, ${data.isPublished ?? false}, ${data.displayOrder ?? 0})
  `);
  const rows = await db.execute(sql`SELECT * FROM communityPosts ORDER BY id DESC LIMIT 1`);
  const arr = ((rows as any)[0] as any[]) || [];
  return arr[0];
}

export async function updateCommunityPost(id: number, data: Partial<{
  type: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  content: string | null;
  imageUrl: string | null;
  partnerName: string | null;
  charityName: string | null;
  amountRaised: string | null;
  location: string | null;
  eventDate: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  displayOrder: number;
}>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updates: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) updates[k] = v;
  }
  if (Object.keys(updates).length === 0) return;
  const { communityPosts } = await import('../drizzle/schema');
  await db.update(communityPosts).set(updates).where(eq(communityPosts.id, id));
}

export async function deleteCommunityPost(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const { communityPosts } = await import('../drizzle/schema');
  await db.delete(communityPosts).where(eq(communityPosts.id, id));
}

// ─── Notifications ──────────────────────────────────────────────────────────

export async function createNotification(data: {
  userId: number;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'alert';
  link?: string;
  createdBy?: number;
  isBroadcast?: boolean;
}) {
  const db = await getDb();
  if (!db) return;
  const { notifications } = await import('../drizzle/schema');
  await db.insert(notifications).values({
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: data.type || 'info',
    link: data.link || null,
    createdBy: data.createdBy || null,
    isBroadcast: data.isBroadcast || false,
  });
}

export async function getNotificationsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { notifications } = await import('../drizzle/schema');
  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  return result;
}

export async function getUnreadCountForUser(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const { notifications } = await import('../drizzle/schema');
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number((result as any)[0]?.count ?? 0);
}

export async function markNotificationRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const { notifications } = await import('../drizzle/schema');
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  const { notifications } = await import('../drizzle/schema');
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function getAllUsersForBroadcast(): Promise<{ id: number }[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ id: users.id }).from(users).where(eq(users.isDisabled, false));
  return result as any;
}

export async function getAdminNotificationsSent(adminId: number) {
  const db = await getDb();
  if (!db) return [];
  const { notifications } = await import('../drizzle/schema');
  const result = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.createdBy, adminId), eq(notifications.isBroadcast, true)))
    .orderBy(desc(notifications.createdAt))
    .limit(20);
  return result;
}

// ─── Email Logs Table ──────────────────────────────────────────────────────────

export async function ensureEmailLogsTable() {
  try {
    const db = await getDb();
    if (!db) return;
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS emailLogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        toEmail VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        emailType VARCHAR(100) NOT NULL,
        status ENUM('sent','failed') NOT NULL DEFAULT 'sent',
        errorMessage TEXT NULL,
        userId INT NULL,
        bookingId INT NULL,
        sentAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    console.error('[DB] ensureEmailLogsTable error:', e);
  }
}

export async function getEmailLogsForUser(userId: number, limit = 50): Promise<Array<{
  id: number; toEmail: string; subject: string; emailType: string;
  status: string; errorMessage: string | null; bookingId: number | null; sentAt: Date;
}>> {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.execute(sql`SELECT * FROM emailLogs WHERE userId = ${userId} ORDER BY sentAt DESC LIMIT ${limit}`);
    return (result as any)[0] as any[];
  } catch { return []; }
}

// ─── Login History Table ───────────────────────────────────────────────────────

export async function ensureLoginHistoryTable() {
  try {
    const db = await getDb();
    if (!db) return;
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS loginHistory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        ipAddress VARCHAR(45) NULL,
        userAgent VARCHAR(500) NULL,
        loggedInAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_userId (userId)
      )
    `);
  } catch (e) {
    console.error('[DB] ensureLoginHistoryTable error:', e);
  }
}

export async function logLoginHistory(userId: number, ipAddress: string | null, userAgent: string | null): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql`INSERT INTO loginHistory (userId, ipAddress, userAgent) VALUES (${userId}, ${ipAddress}, ${userAgent})`);
  } catch (e) {
    console.error('[LoginHistory] Failed to log:', e);
  }
}

export async function getLoginHistoryForUser(userId: number, limit = 20): Promise<Array<{
  id: number; userId: number; ipAddress: string | null; userAgent: string | null; loggedInAt: Date;
}>> {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.execute(sql`SELECT * FROM loginHistory WHERE userId = ${userId} ORDER BY loggedInAt DESC LIMIT ${limit}`);
    return (result as any)[0] as any[];
  } catch { return []; }
}

// ─── Birthday & Anniversary Helpers ───────────────────────────────────────────

export async function getUpcomingBirthdays(daysAhead = 14): Promise<Array<{
  id: number; name: string | null; email: string | null; dateOfBirth: string | null; daysUntil: number;
}>> {
  const db = await getDb();
  if (!db) return [];
  try {
    // Fetch all clients with DOB, then filter in JS (avoids MySQL year-wrap complexity)
    const result = await db.execute(sql`SELECT id, name, email, dateOfBirth FROM users WHERE dateOfBirth IS NOT NULL AND role != 'admin' AND isDisabled = false LIMIT 500`);
    const rows = (result as any)[0] as Array<{ id: number; name: string | null; email: string | null; dateOfBirth: string | Date | null }>;
    const today = new Date();
    const upcoming: Array<{ id: number; name: string | null; email: string | null; dateOfBirth: string | null; daysUntil: number }> = [];
    for (const row of rows) {
      if (!row.dateOfBirth) continue;
      const dob = new Date(row.dateOfBirth);
      // Next birthday this year
      const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
      const msUntil = nextBirthday.getTime() - today.getTime();
      const daysUntil = Math.ceil(msUntil / 86400000);
      if (daysUntil >= 0 && daysUntil <= daysAhead) {
        upcoming.push({ id: row.id, name: row.name, email: row.email, dateOfBirth: row.dateOfBirth ? String(row.dateOfBirth) : null, daysUntil });
      }
    }
    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
    return upcoming;
  } catch { return []; }
}

export async function getClientReferrals(userId: number): Promise<Array<{
  id: number; name: string | null; email: string | null; joinedAt: Date | null; pointsEarned: number;
}>> {
  const db = await getDb();
  if (!db) return [];
  try {
    // Get users who joined via this user's referral code
    const userResult = await db.execute(sql`SELECT referralCode FROM users WHERE id = ${userId} LIMIT 1`);
    const userRow = ((userResult as any)[0] as any[])[0];
    if (!userRow?.referralCode) return [];
    const code = userRow.referralCode;
    const result = await db.execute(sql`
      SELECT u.id, u.name, u.email, u.lastSignedIn AS joinedAt,
        COALESCE((SELECT SUM(lt.points) FROM loyaltyTransactions lt WHERE lt.userId = ${userId} AND lt.description LIKE CONCAT('Referral: ', u.name, '%')), 0) AS pointsEarned
      FROM users u
      INNER JOIN loyaltyTransactions lt2 ON lt2.userId = u.id AND lt2.description = 'Joined via referral link'
      WHERE u.id != ${userId}
      ORDER BY u.lastSignedIn DESC
      LIMIT 50
    `);
    return (result as any)[0] as any[];
  } catch { return []; }
}

// Run on module load
ensureUserPassportColumns().catch(console.error);
ensureCommunityPostsTable().catch(console.error);
ensureEmailLogsTable().catch(console.error);
ensureLoginHistoryTable().catch(console.error);
