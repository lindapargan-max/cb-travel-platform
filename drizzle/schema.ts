import { boolean, date, decimal, int, json, mediumtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isDisabled: boolean("isDisabled").default(false).notNull(),
  dateOfBirth: date("dateOfBirth"),
  referralCode: varchar("referralCode", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["package_holiday", "cruise", "business_travel", "luxury", "adventure", "city_break", "other"]).default("package_holiday").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }),
  duration: varchar("duration", { length: 100 }),
  departureDate: varchar("departureDate", { length: 100 }),
  imageUrl: mediumtext("imageUrl"),
  highlights: text("highlights"),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId"),
  bookingReference: varchar("bookingReference", { length: 100 }).unique().notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).default("pending").notNull(),
  departureDate: varchar("departureDate", { length: 50 }),
  returnDate: varchar("returnDate", { length: 50 }),
  destination: varchar("destination", { length: 255 }),
  leadPassengerName: varchar("leadPassengerName", { length: 255 }),
  leadPassengerEmail: varchar("leadPassengerEmail", { length: 320 }),
  leadPassengerPhone: varchar("leadPassengerPhone", { length: 30 }),
  leadPassengerDob: varchar("leadPassengerDob", { length: 20 }),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }),
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).default("0"),
  numberOfTravelers: int("numberOfTravelers"),
  notes: text("notes"),
  dealId: int("dealId"),
  promoCode: varchar("promoCode", { length: 50 }),
  promoDiscount: decimal("promoDiscount", { precision: 10, scale: 2 }),
  postcardSent: boolean("postcardSent").default(false).notNull(),
  postcardSentAt: timestamp("postcardSentAt"),
  flightStatusNumber: varchar("flightStatusNumber", { length: 20 }),
  notificationsEnabled: boolean("notificationsEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  clientId: int("clientId"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: text("fileKey").notNull(),
  fileUrl: text("fileUrl").notNull(),
  documentType: mysqlEnum("documentType", ["booking_confirmation", "itinerary", "invoice", "receipt", "other"]).default("other").notNull(),
  documentLabel: varchar("documentLabel", { length: 255 }),
  isPasswordProtected: boolean("isPasswordProtected").default(false).notNull(),
  passwordHash: text("passwordHash"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export const quoteRequests = mysqlTable("quoteRequests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  quoteType: varchar("quoteType", { length: 20 }).default("new_quote").notNull(),
  travelType: varchar("travelType", { length: 100 }).notNull(),
  destination: varchar("destination", { length: 255 }),
  numberOfTravelers: int("numberOfTravelers"),
  departureDate: varchar("departureDate", { length: 100 }),
  returnDate: varchar("returnDate", { length: 100 }),
  budget: varchar("budget", { length: 100 }),
  message: text("message"),
  screenshotUrl: text("screenshotUrl"),
  screenshotKey: text("screenshotKey"),
  status: mysqlEnum("status", ["new", "contacted", "quoted", "completed", "cancelled"]).default("new").notNull(),
  userId: int("userId"),
  promoCode: varchar("promoCode", { length: 50 }),
  promoDiscount: decimal("promoDiscount", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = typeof quoteRequests.$inferInsert;

export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientImage: text("clientImage"),
  destination: varchar("destination", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  rating: int("rating").notNull(),
  isApproved: boolean("isApproved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

export const newsletterSubscriptions = mysqlTable("newsletterSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).unique().notNull(),
  name: varchar("name", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type InsertNewsletterSubscription = typeof newsletterSubscriptions.$inferInsert;

export const faqItems = mysqlTable("faqItems", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FaqItem = typeof faqItems.$inferSelect;
export type InsertFaqItem = typeof faqItems.$inferInsert;

export const flightDetails = mysqlTable("flightDetails", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  outboundFlightNumber: varchar("outboundFlightNumber", { length: 20 }),
  outboundDeparture: varchar("outboundDeparture", { length: 100 }),
  outboundArrival: varchar("outboundArrival", { length: 100 }),
  outboundDepartureTime: varchar("outboundDepartureTime", { length: 50 }),
  outboundArrivalTime: varchar("outboundArrivalTime", { length: 50 }),
  returnFlightNumber: varchar("returnFlightNumber", { length: 20 }),
  returnDeparture: varchar("returnDeparture", { length: 100 }),
  returnArrival: varchar("returnArrival", { length: 100 }),
  returnDepartureTime: varchar("returnDepartureTime", { length: 50 }),
  returnArrivalTime: varchar("returnArrivalTime", { length: 50 }),
  airline: varchar("airline", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FlightDetail = typeof flightDetails.$inferSelect;
export type InsertFlightDetail = typeof flightDetails.$inferInsert;

export const hotelDetails = mysqlTable("hotelDetails", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  hotelName: varchar("hotelName", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }),
  checkInDate: varchar("checkInDate", { length: 50 }),
  checkOutDate: varchar("checkOutDate", { length: 50 }),
  roomType: varchar("roomType", { length: 100 }),
  address: text("address"),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 500 }),
  confirmationNumber: varchar("confirmationNumber", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HotelDetail = typeof hotelDetails.$inferSelect;
export type InsertHotelDetail = typeof hotelDetails.$inferInsert;

export const checklistItems = mysqlTable("checklistItems", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  category: varchar("category", { length: 50 }).default("general").notNull(),
  dueDate: varchar("dueDate", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = typeof checklistItems.$inferInsert;

export const bookingReviews = mysqlTable("bookingReviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  destination: varchar("destination", { length: 255 }),
  loyaltyCodeId: int("loyaltyCodeId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BookingReview = typeof bookingReviews.$inferSelect;
export type InsertBookingReview = typeof bookingReviews.$inferInsert;

export const promoCodes = mysqlTable("promoCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  description: varchar("description", { length: 255 }),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).notNull(),
  codeType: mysqlEnum("codeType", ["loyalty", "manual"]).default("manual").notNull(),
  issuedToUserId: int("issuedToUserId"),
  issuedToEmail: varchar("issuedToEmail", { length: 320 }),
  isActive: boolean("isActive").default(true).notNull(),
  usedAt: timestamp("usedAt"),
  usedByBookingId: int("usedByBookingId"),
  usedByQuoteId: int("usedByQuoteId"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

export const bookingIntakeForms = mysqlTable("bookingIntakeForms", {
  id: int("id").autoincrement().primaryKey(),
  submissionRef: varchar("submissionRef", { length: 50 }),
  leadFirstName: varchar("leadFirstName", { length: 200 }).notNull(),
  leadLastName: varchar("leadLastName", { length: 200 }).notNull(),
  email: varchar("email", { length: 300 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 50 }),
  passportNumber: varchar("passportNumber", { length: 100 }),
  passportExpiry: varchar("passportExpiry", { length: 50 }),
  passportIssuingCountry: varchar("passportIssuingCountry", { length: 100 }),
  nationality: varchar("nationality", { length: 100 }),
  address: text("address"),
  destination: varchar("destination", { length: 300 }).notNull(),
  departureAirport: varchar("departureAirport", { length: 200 }),
  departureDate: varchar("departureDate", { length: 50 }),
  returnDate: varchar("returnDate", { length: 50 }),
  flexibleDates: boolean("flexibleDates").default(false),
  numberOfAdults: int("numberOfAdults").default(1),
  numberOfChildren: int("numberOfChildren").default(0),
  childAges: varchar("childAges", { length: 200 }),
  additionalTravellers: json("additionalTravellers"),
  holidayType: varchar("holidayType", { length: 100 }),
  accommodationType: varchar("accommodationType", { length: 100 }),
  boardBasis: varchar("boardBasis", { length: 100 }),
  roomType: varchar("roomType", { length: 100 }),
  budget: varchar("budget", { length: 200 }),
  dietaryRequirements: text("dietaryRequirements"),
  accessibilityNeeds: text("accessibilityNeeds"),
  specialOccasion: varchar("specialOccasion", { length: 300 }),
  otherRequests: text("otherRequests"),
  paymentMethod: varchar("paymentMethod", { length: 100 }),
  heardAboutUs: varchar("heardAboutUs", { length: 200 }),
  agreedToTerms: boolean("agreedToTerms").default(false),
  status: mysqlEnum("status", ["new", "reviewed", "converted", "archived"]).default("new"),
  linkedBookingId: int("linkedBookingId"),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BookingIntakeForm = typeof bookingIntakeForms.$inferSelect;
export type InsertBookingIntakeForm = typeof bookingIntakeForms.$inferInsert;

export const bookedDestinations = mysqlTable("bookedDestinations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  imageUrl: mediumtext("imageUrl"),
  lastBooked: varchar("lastBooked", { length: 50 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BookedDestination = typeof bookedDestinations.$inferSelect;
export type InsertBookedDestination = typeof bookedDestinations.$inferInsert;

// ─── V6 New Tables ──────────────────────────────────────────────────────────

export const bookingFeedback = mysqlTable("bookingFeedback", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(),
  overallRating: int("overallRating").notNull(),
  destinationRating: int("destinationRating").notNull(),
  serviceRating: int("serviceRating").notNull(),
  comment: text("comment"),
  promoCodeId: int("promoCodeId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BookingFeedback = typeof bookingFeedback.$inferSelect;

export const clientNotes = mysqlTable("clientNotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  note: text("note").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientNote = typeof clientNotes.$inferSelect;

export const loyaltyAccounts = mysqlTable("loyaltyAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  points: int("points").default(0).notNull(),
  lifetimePoints: int("lifetimePoints").default(0).notNull(),
  tier: mysqlEnum("tier", ["bronze", "silver", "gold"]).default("bronze").notNull(),
  pointsMultiplier: decimal("pointsMultiplier", { precision: 3, scale: 1 }).default("1.0").notNull(),
  memberNotes: text("memberNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoyaltyAccount = typeof loyaltyAccounts.$inferSelect;

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

export const loyaltyRewards = mysqlTable("loyaltyRewards", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  pointsCost: int("pointsCost").notNull(),
  category: varchar("category", { length: 100 }).default("General").notNull(),
  minTier: mysqlEnum("minTier", ["bronze", "silver", "gold"]).default("bronze").notNull(),
  stock: int("stock"),
  stockUsed: int("stockUsed").default(0).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  termsAndConditions: text("termsAndConditions"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  rewardType: varchar("rewardType", { length: 50 }).default("voucher").notNull(),
  rewardValue: varchar("rewardValue", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;

export const loyaltyRedemptions = mysqlTable("loyaltyRedemptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rewardId: int("rewardId").notNull(),
  pointsSpent: int("pointsSpent").notNull(),
  voucherCode: varchar("voucherCode", { length: 100 }),
  voucherImagePath: varchar("voucherImagePath", { length: 500 }),
  expiresAt: timestamp("expiresAt"),
  status: mysqlEnum("status", ["active", "redeemed", "expired", "cancelled"]).default("active").notNull(),
  adminNote: text("adminNote"),
  adminId: int("adminId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoyaltyRedemption = typeof loyaltyRedemptions.$inferSelect;

export const loyaltyTierHistory = mysqlTable("loyaltyTierHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fromTier: mysqlEnum("fromTier", ["bronze", "silver", "gold"]).notNull(),
  toTier: mysqlEnum("toTier", ["bronze", "silver", "gold"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoyaltyTierHistory = typeof loyaltyTierHistory.$inferSelect;

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId"),
  actorType: mysqlEnum("actorType", ["admin", "client", "system"]).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }),
  entityId: int("entityId"),
  oldValue: json("oldValue"),
  newValue: json("newValue"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;

export const notificationLog = mysqlTable("notificationLog", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  notificationType: mysqlEnum("notificationType", ["7day", "48hour", "departure_day"]).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type NotificationLog = typeof notificationLog.$inferSelect;

export const newsletterSubscribers = mysqlTable("newsletterSubscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).unique().notNull(),
  name: varchar("name", { length: 255 }),
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  unsubscribeToken: varchar("unsubscribeToken", { length: 100 }),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

export const newsletterCampaigns = mysqlTable("newsletterCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlBody: text("htmlBody").notNull(),
  status: mysqlEnum("status", ["draft", "scheduled", "sent"]).default("draft").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  sentCount: int("sentCount").default(0).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NewsletterCampaign = typeof newsletterCampaigns.$inferSelect;

export const appSettings = mysqlTable("appSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).unique().notNull(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppSetting = typeof appSettings.$inferSelect;

// ─── V7: Support Tickets ─────────────────────────────────────────────────────

export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  ticketType: mysqlEnum("ticketType", ["general_enquiry","request_extra","complaint","other"]).default("general_enquiry").notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["open","in_progress","resolved"]).default("open").notNull(),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SupportTicket = typeof supportTickets.$inferSelect;

export const ticketMessages = mysqlTable("ticketMessages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  userId: int("userId").notNull(),
  message: text("message").notNull(),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  isAdmin: boolean("isAdmin").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TicketMessage = typeof ticketMessages.$inferSelect;

// ─── V7: Booking Members (Group / Travel Party) ───────────────────────────────

export const bookingMembers = mysqlTable("bookingMembers", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(),
  addedBy: int("addedBy").notNull(),
  role: mysqlEnum("role", ["lead","member"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BookingMember = typeof bookingMembers.$inferSelect;

// ─── V8: Destination Activities (Things to Do) ────────────────────────────────

export const destinationActivities = mysqlTable("destinationActivities", {
  id: int("id").autoincrement().primaryKey(),
  destination: varchar("destination", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  rating: decimal("rating", { precision: 3, scale: 1 }),
  imageUrl: text("imageUrl"),
  wikiUrl: text("wikiUrl"),
  sortOrder: int("sortOrder").default(0),
  addedBy: int("addedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DestinationActivity = typeof destinationActivities.$inferSelect;
export type InsertDestinationActivity = typeof destinationActivities.$inferInsert;

// ─── V8: Booking Photos (Hotel Gallery) ──────────────────────────────────────

export const bookingPhotos = mysqlTable("bookingPhotos", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  imageUrl: mediumtext("imageUrl").notNull(),
  imageKey: text("imageKey"),
  caption: text("caption"),
  sortOrder: int("sortOrder").default(0),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BookingPhoto = typeof bookingPhotos.$inferSelect;
export type InsertBookingPhoto = typeof bookingPhotos.$inferInsert;

// ─── V10: Loyalty Rules ───────────────────────────────────────────────────────

export const loyaltyRules = mysqlTable("loyaltyRules", {
  id: int("id").autoincrement().primaryKey(),
  eventKey: varchar("eventKey", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 128 }).notNull(),
  description: text("description"),
  points: decimal("points", { precision: 6, scale: 2 }).notNull().default("0"),
  isActive: boolean("isActive").notNull().default(true),
  isPerPound: boolean("isPerPound").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoyaltyRule = typeof loyaltyRules.$inferSelect;

// ─── GDPR Tables ────────────────────────────────────────────────────────────

export const gdprRequests = mysqlTable("gdprRequests", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["SAR", "erasure", "complaint"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  description: text("description"),
  reason: varchar("reason", { length: 100 }),
  relationship: varchar("relationship", { length: 50 }),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).notNull().default("pending"),
  adminNotes: text("adminNotes"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type GdprRequest = typeof gdprRequests.$inferSelect;

export const deletionLogs = mysqlTable("deletionLogs", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["user", "booking", "marketingContact", "loyaltyPoints", "enquiry"]).notNull(),
  entityId: int("entityId").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  deletedAt: timestamp("deletedAt").notNull().defaultNow(),
  deletedBy: mysqlEnum("deletedBy", ["automated", "user_request", "admin"]).notNull().default("automated"),
});

export type DeletionLog = typeof deletionLogs.$inferSelect;
