import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  timestamp,
  json,
  mediumtext,
  mysqlEnum,
  uniqueIndex,
  decimal,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).notNull().default("user"),
  isDisabled: boolean("isDisabled").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Destinations ─────────────────────────────────────────────────────────────

export const destinations = mysqlTable(
  "destinations",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    imageUrl: varchar("imageUrl", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("slugIdx").on(table.slug),
  })
);

export type Destination = typeof destinations.$inferSelect;
export type InsertDestination = typeof destinations.$inferInsert;

// ─── Quote Requests ───────────────────────────────────────────────────────────

export const quoteRequests = mysqlTable("quoteRequests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  travelType: varchar("travelType", { length: 100 }).notNull(),
  quoteType: varchar("quoteType", { length: 100 }),
  destination: varchar("destination", { length: 255 }),
  numberOfTravelers: int("numberOfTravelers"),
  departureDate: varchar("departureDate", { length: 100 }),
  returnDate: varchar("returnDate", { length: 100 }),
  budget: varchar("budget", { length: 100 }),
  message: text("message"),
  screenshotUrl: text("screenshotUrl"),
  screenshotKey: text("screenshotKey"),
  status: mysqlEnum("status", ["new", "contacted", "quoted", "completed", "cancelled"]).notNull().default("new"),
  userId: int("userId"),
  promoCode: varchar("promoCode", { length: 50 }),
  promoDiscount: decimal("promoDiscount", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = typeof quoteRequests.$inferInsert;

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export const blogPosts = mysqlTable(
  "blogPosts",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    content: mediumtext("content"),
    excerpt: text("excerpt"),
    imageUrl: varchar("imageUrl", { length: 255 }),
    published: boolean("published").default(false),
    authorId: int("authorId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("blogPostsSlugIdx").on(table.slug),
  })
);

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// ─── Destination Guides ───────────────────────────────────────────────────────

export const destinationGuides = mysqlTable(
  "destinationGuides",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    destination: varchar("destination", { length: 255 }).notNull(),
    country: varchar("country", { length: 255 }),
    region: varchar("region", { length: 255 }),
    continent: varchar("continent", { length: 255 }),
    heroImageBase64: mediumtext("heroImageBase64"),
    heroImageMimeType: varchar("heroImageMimeType", { length: 100 }),
    tagline: text("tagline"),
    overview: mediumtext("overview"),
    bestTimeToVisit: mediumtext("bestTimeToVisit"),
    climate: mediumtext("climate"),
    currency: varchar("currency", { length: 50 }),
    language: text("language"),
    timezone: varchar("timezone", { length: 50 }),
    flightTimeFromUK: varchar("flightTimeFromUK", { length: 100 }),
    attractions: json("attractions"),
    dining: json("dining"),
    accommodation: json("accommodation"),
    insiderTips: json("insiderTips"),
    gettingThere: mediumtext("gettingThere"),
    visaInfo: mediumtext("visaInfo"),
    curatedItinerary: json("curatedItinerary"),
    tags: json("tags"),
    featured: boolean("featured").default(false).notNull(),
    published: boolean("published").default(false).notNull(),
    viewCount: int("viewCount").default(0).notNull(),
    aiGenerated: boolean("aiGenerated").default(false).notNull(),
    createdBy: int("createdBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("destinationGuidesSlugIdx").on(table.slug),
  })
);

export type DestinationGuide = typeof destinationGuides.$inferSelect;
export type InsertDestinationGuide = typeof destinationGuides.$inferInsert;

// ─── Deals ────────────────────────────────────────────────────────────────────

export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["package_holiday", "cruise", "business_travel", "luxury", "adventure", "city_break", "other"]).notNull().default("package_holiday"),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }),
  duration: varchar("duration", { length: 100 }),
  departureDate: varchar("departureDate", { length: 100 }),
  imageUrl: text("imageUrl"),
  highlights: text("highlights"),
  isActive: boolean("isActive").notNull().default(true),
  isFeatured: boolean("isFeatured").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId"),
  bookingReference: varchar("bookingReference", { length: 100 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).notNull().default("pending"),
  departureDate: varchar("departureDate", { length: 50 }),
  returnDate: varchar("returnDate", { length: 50 }),
  destination: varchar("destination", { length: 255 }),
  leadPassengerName: varchar("leadPassengerName", { length: 255 }),
  leadPassengerEmail: varchar("leadPassengerEmail", { length: 320 }),
  leadPassengerPhone: varchar("leadPassengerPhone", { length: 30 }),
  leadPassengerDob: varchar("leadPassengerDob", { length: 20 }),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }),
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).default("0" as any),
  numberOfTravelers: int("numberOfTravelers"),
  notes: text("notes"),
  dealId: int("dealId"),
  promoCode: varchar("promoCode", { length: 50 }),
  promoDiscount: decimal("promoDiscount", { precision: 10, scale: 2 }),
  postcardSent: boolean("postcardSent").notNull().default(false),
  postcardSentAt: timestamp("postcardSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ─── Documents ────────────────────────────────────────────────────────────────

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  clientId: int("clientId"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: text("fileKey").notNull(),
  fileUrl: text("fileUrl").notNull(),
  documentType: mysqlEnum("documentType", ["booking_confirmation", "itinerary", "invoice", "receipt", "other"]).notNull().default("booking_confirmation"),
  documentLabel: varchar("documentLabel", { length: 255 }),
  isPasswordProtected: boolean("isPasswordProtected").notNull().default(false),
  passwordHash: text("passwordHash"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ─── Testimonials ─────────────────────────────────────────────────────────────

export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientImage: text("clientImage"),
  destination: varchar("destination", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  rating: int("rating").notNull(),
  isApproved: boolean("isApproved").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

// ─── Newsletter Subscriptions ─────────────────────────────────────────────────

export const newsletterSubscriptions = mysqlTable("newsletterSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type InsertNewsletterSubscription = typeof newsletterSubscriptions.$inferInsert;

// ─── FAQ Items ────────────────────────────────────────────────────────────────

export const faqItems = mysqlTable("faqItems", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: int("sortOrder").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FaqItem = typeof faqItems.$inferSelect;
export type InsertFaqItem = typeof faqItems.$inferInsert;

// ─── Promo Codes ──────────────────────────────────────────────────────────────

export const promoCodes = mysqlTable("promoCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  description: text("description"),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).notNull(),
  codeType: mysqlEnum("codeType", ["loyalty", "manual"]).notNull().default("manual"),
  issuedToUserId: int("issuedToUserId"),
  issuedToEmail: varchar("issuedToEmail", { length: 320 }),
  isActive: boolean("isActive").notNull().default(true),
  usedAt: timestamp("usedAt"),
  usedByBookingId: int("usedByBookingId"),
  usedByQuoteId: int("usedByQuoteId"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

// ─── Flight Details ───────────────────────────────────────────────────────────

export const flightDetails = mysqlTable("flightDetails", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  outboundFlightNumber: varchar("outboundFlightNumber", { length: 50 }),
  outboundDepartureAirport: varchar("outboundDepartureAirport", { length: 100 }),
  outboundArrivalAirport: varchar("outboundArrivalAirport", { length: 100 }),
  outboundDepartureTime: varchar("outboundDepartureTime", { length: 50 }),
  outboundArrivalTime: varchar("outboundArrivalTime", { length: 50 }),
  outboundAirline: varchar("outboundAirline", { length: 100 }),
  returnFlightNumber: varchar("returnFlightNumber", { length: 50 }),
  returnDepartureAirport: varchar("returnDepartureAirport", { length: 100 }),
  returnArrivalAirport: varchar("returnArrivalAirport", { length: 100 }),
  returnDepartureTime: varchar("returnDepartureTime", { length: 50 }),
  returnArrivalTime: varchar("returnArrivalTime", { length: 50 }),
  returnAirline: varchar("returnAirline", { length: 100 }),
  cabinClass: varchar("cabinClass", { length: 50 }),
  baggageAllowance: varchar("baggageAllowance", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FlightDetail = typeof flightDetails.$inferSelect;
export type InsertFlightDetail = typeof flightDetails.$inferInsert;

// ─── Hotel Details ────────────────────────────────────────────────────────────

export const hotelDetails = mysqlTable("hotelDetails", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  hotelName: varchar("hotelName", { length: 255 }),
  hotelAddress: text("hotelAddress"),
  checkInDate: varchar("checkInDate", { length: 50 }),
  checkOutDate: varchar("checkOutDate", { length: 50 }),
  roomType: varchar("roomType", { length: 100 }),
  boardBasis: varchar("boardBasis", { length: 100 }),
  confirmationNumber: varchar("confirmationNumber", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HotelDetail = typeof hotelDetails.$inferSelect;
export type InsertHotelDetail = typeof hotelDetails.$inferInsert;

// ─── Checklist Items ──────────────────────────────────────────────────────────

export const checklistItems = mysqlTable("checklistItems", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isCompleted: boolean("isCompleted").notNull().default(false),
  category: varchar("category", { length: 100 }),
  dueDate: varchar("dueDate", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = typeof checklistItems.$inferInsert;

// ─── Booking Reviews ──────────────────────────────────────────────────────────

export const bookingReviews = mysqlTable("bookingReviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  destination: varchar("destination", { length: 255 }),
  loyaltyCodeId: int("loyaltyCodeId"),
  isApproved: boolean("isApproved").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BookingReview = typeof bookingReviews.$inferSelect;
export type InsertBookingReview = typeof bookingReviews.$inferInsert;

// ─── Support Tickets ──────────────────────────────────────────────────────────

export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  ticketType: varchar("ticketType", { length: 100 }).notNull(),
  message: text("message").notNull(),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).notNull().default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

// ─── Ticket Messages ──────────────────────────────────────────────────────────

export const ticketMessages = mysqlTable("ticketMessages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  userId: int("userId").notNull(),
  message: text("message").notNull(),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  isAdmin: boolean("isAdmin").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = typeof ticketMessages.$inferInsert;

// ─── Booking Members ──────────────────────────────────────────────────────────

export const bookingMembers = mysqlTable("bookingMembers", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  addedBy: int("addedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BookingMember = typeof bookingMembers.$inferSelect;
export type InsertBookingMember = typeof bookingMembers.$inferInsert;

// ─── Destination Activities ───────────────────────────────────────────────────

export const destinationActivities = mysqlTable("destinationActivities", {
  id: int("id").autoincrement().primaryKey(),
  destination: varchar("destination", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  imageUrl: text("imageUrl"),
  duration: varchar("duration", { length: 100 }),
  priceRange: varchar("priceRange", { length: 100 }),
  sortOrder: int("sortOrder").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DestinationActivity = typeof destinationActivities.$inferSelect;
export type InsertDestinationActivity = typeof destinationActivities.$inferInsert;

// ─── Booking Photos ───────────────────────────────────────────────────────────

export const bookingPhotos = mysqlTable("bookingPhotos", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  caption: text("caption"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BookingPhoto = typeof bookingPhotos.$inferSelect;
export type InsertBookingPhoto = typeof bookingPhotos.$inferInsert;

// ─── Loyalty Rules ────────────────────────────────────────────────────────────

export const loyaltyRules = mysqlTable("loyaltyRules", {
  id: int("id").autoincrement().primaryKey(),
  eventKey: varchar("eventKey", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  points: int("points").notNull().default(0),
  isPerPound: boolean("isPerPound").notNull().default(false),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoyaltyRule = typeof loyaltyRules.$inferSelect;
export type InsertLoyaltyRule = typeof loyaltyRules.$inferInsert;

// ─── Booked Destinations ──────────────────────────────────────────────────────

export const bookedDestinations = mysqlTable("bookedDestinations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  imageUrl: text("imageUrl"),
  lastBooked: varchar("lastBooked", { length: 50 }),
  sortOrder: int("sortOrder").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BookedDestination = typeof bookedDestinations.$inferSelect;
export type InsertBookedDestination = typeof bookedDestinations.$inferInsert;

// ─── Admin Quotes ─────────────────────────────────────────────────────────────

export const adminQuotes = mysqlTable("adminQuotes", {
  id: int("id").autoincrement().primaryKey(),
  quoteRef: varchar("quoteRef", { length: 50 }).notNull().unique(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 30 }),
  userId: int("userId"),
  destination: varchar("destination", { length: 255 }),
  departureDate: varchar("departureDate", { length: 50 }),
  returnDate: varchar("returnDate", { length: 50 }),
  numberOfTravelers: int("numberOfTravelers"),
  hotels: text("hotels"),
  flightDetails: text("flightDetails"),
  keyInclusions: text("keyInclusions"),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }),
  pricePerPerson: decimal("pricePerPerson", { precision: 10, scale: 2 }),
  priceBreakdown: text("priceBreakdown"),
  notes: text("notes"),
  documentUrl: text("documentUrl"),
  documentKey: text("documentKey"),
  status: mysqlEnum("status", ["draft", "sent", "viewed", "accepted", "expired", "intake_submitted", "converted"]).notNull().default("draft"),
  viewCount: int("viewCount").notNull().default(0),
  lastViewedAt: timestamp("lastViewedAt"),
  sentAt: timestamp("sentAt"),
  acceptedAt: timestamp("acceptedAt"),
  expiresAt: timestamp("expiresAt"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminQuote = typeof adminQuotes.$inferSelect;
export type InsertAdminQuote = typeof adminQuotes.$inferInsert;

// ─── Booking Intake Forms ─────────────────────────────────────────────────────

export const bookingIntakeForms = mysqlTable("bookingIntakeForms", {
  id: int("id").autoincrement().primaryKey(),
  submissionRef: varchar("submissionRef", { length: 100 }).notNull().unique(),
  quoteId: int("quoteId"),
  bookingId: int("bookingId"),
  userId: int("userId"),
  clientName: varchar("clientName", { length: 255 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientPhone: varchar("clientPhone", { length: 30 }),
  destination: varchar("destination", { length: 255 }),
  departureDate: varchar("departureDate", { length: 50 }),
  returnDate: varchar("returnDate", { length: 50 }),
  numberOfTravelers: int("numberOfTravelers"),
  travelersDetails: json("travelersDetails"),
  specialRequests: text("specialRequests"),
  dietaryRequirements: text("dietaryRequirements"),
  medicalRequirements: text("medicalRequirements"),
  emergencyContactName: varchar("emergencyContactName", { length: 255 }),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 30 }),
  status: mysqlEnum("status", ["new", "reviewed", "converted", "archived"]).notNull().default("new"),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BookingIntakeForm = typeof bookingIntakeForms.$inferSelect;
export type InsertBookingIntakeForm = typeof bookingIntakeForms.$inferInsert;

// ─── Loyalty Accounts (for schema namespace access) ───────────────────────────

export const loyaltyAccounts = mysqlTable("loyaltyAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  points: int("points").notNull().default(0),
  lifetimePoints: int("lifetimePoints").notNull().default(0),
  tier: mysqlEnum("tier", ["bronze", "silver", "gold"]).notNull().default("bronze"),
  pointsMultiplier: decimal("pointsMultiplier", { precision: 3, scale: 1 }).notNull().default("1.0" as any),
  memberNotes: text("memberNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoyaltyAccount = typeof loyaltyAccounts.$inferSelect;
export type InsertLoyaltyAccount = typeof loyaltyAccounts.$inferInsert;

// ─── Loyalty Transactions ─────────────────────────────────────────────────────

export const loyaltyTransactions = mysqlTable("loyaltyTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  points: int("points").notNull(),
  type: mysqlEnum("type", ["earn", "redeem", "expire", "adjustment", "bonus", "referral", "birthday"]).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  reason: varchar("reason", { length: 500 }),
  bookingId: int("bookingId"),
  adminId: int("adminId"),
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertLoyaltyTransaction = typeof loyaltyTransactions.$inferInsert;

// ─── Loyalty Rewards ──────────────────────────────────────────────────────────

export const loyaltyRewards = mysqlTable("loyaltyRewards", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  pointsCost: int("pointsCost").notNull(),
  category: varchar("category", { length: 100 }).notNull().default("General"),
  minTier: mysqlEnum("minTier", ["bronze", "silver", "gold"]).notNull().default("bronze"),
  stock: int("stock"),
  stockUsed: int("stockUsed").notNull().default(0),
  imageUrl: varchar("imageUrl", { length: 500 }),
  termsAndConditions: text("termsAndConditions"),
  isFeatured: boolean("isFeatured").notNull().default(false),
  sortOrder: int("sortOrder").notNull().default(0),
  rewardType: varchar("rewardType", { length: 50 }).notNull().default("voucher"),
  rewardValue: varchar("rewardValue", { length: 100 }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;
export type InsertLoyaltyReward = typeof loyaltyRewards.$inferInsert;

// ─── Loyalty Redemptions ──────────────────────────────────────────────────────

export const loyaltyRedemptions = mysqlTable("loyaltyRedemptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rewardId: int("rewardId").notNull(),
  pointsSpent: int("pointsSpent").notNull(),
  voucherCode: varchar("voucherCode", { length: 100 }),
  voucherImagePath: varchar("voucherImagePath", { length: 500 }),
  expiresAt: timestamp("expiresAt"),
  status: mysqlEnum("status", ["active", "redeemed", "expired", "cancelled"]).notNull().default("active"),
  adminNote: text("adminNote"),
  adminId: int("adminId"),
  redeemedAt: timestamp("redeemedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoyaltyRedemption = typeof loyaltyRedemptions.$inferSelect;
export type InsertLoyaltyRedemption = typeof loyaltyRedemptions.$inferInsert;

// ─── Loyalty Tier History ─────────────────────────────────────────────────────

export const loyaltyTierHistory = mysqlTable("loyaltyTierHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fromTier: mysqlEnum("fromTier", ["bronze", "silver", "gold"]).notNull(),
  toTier: mysqlEnum("toTier", ["bronze", "silver", "gold"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoyaltyTierHistory = typeof loyaltyTierHistory.$inferSelect;
export type InsertLoyaltyTierHistory = typeof loyaltyTierHistory.$inferInsert;

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "success", "warning", "alert"]).notNull().default("info"),
  link: varchar("link", { length: 512 }),
  isRead: boolean("isRead").notNull().default(false),
  createdBy: int("createdBy"),
  isBroadcast: boolean("isBroadcast").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── Community Posts ──────────────────────────────────────────────────────────

export const communityPosts = mysqlTable("communityPosts", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["charity", "partnership", "giveaway", "community"]).notNull().default("community"),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 255 }),
  description: text("description"),
  content: mediumtext("content"),
  imageUrl: mediumtext("imageUrl"),
  partnerName: varchar("partnerName", { length: 255 }),
  charityName: varchar("charityName", { length: 255 }),
  amountRaised: varchar("amountRaised", { length: 100 }),
  location: varchar("location", { length: 255 }),
  eventDate: varchar("eventDate", { length: 50 }),
  isFeatured: boolean("isFeatured").notNull().default(false),
  isPublished: boolean("isPublished").notNull().default(false),
  displayOrder: int("displayOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;

// ─── GDPR Requests ────────────────────────────────────────────────────────────

export const gdprRequests = mysqlTable("gdprRequests", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["SAR", "erasure"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  relationship: varchar("relationship", { length: 50 }),
  reason: varchar("reason", { length: 100 }),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  adminNotes: text("adminNotes"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GdprRequest = typeof gdprRequests.$inferSelect;
export type InsertGdprRequest = typeof gdprRequests.$inferInsert;

// ─── Deletion Logs ────────────────────────────────────────────────────────────

export const deletionLogs = mysqlTable("deletionLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  deletedBy: int("deletedBy").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeletionLog = typeof deletionLogs.$inferSelect;

// ─── Social Posts ─────────────────────────────────────────────────────────

export const socialPosts = mysqlTable("socialPosts", {
  id: int("id").autoincrement().primaryKey(),
  platform: mysqlEnum("platform", ["instagram", "facebook", "twitter", "tiktok", "linkedin"]).notNull(),
  title: varchar("title", { length: 255 }),
  body: mediumtext("body").notNull(),
  caption: text("caption"),
  hashtags: varchar("hashtags", { length: 500 }),
  imagePrompt: text("imagePrompt"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  scheduledFor: timestamp("scheduledFor"),
  status: mysqlEnum("status", ["draft", "scheduled", "published", "archived"]).notNull().default("draft"),
  tags: json("tags"),
  publishedAt: timestamp("publishedAt"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = typeof socialPosts.$inferInsert;
