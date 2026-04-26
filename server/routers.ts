import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { gdprRouter } from "./gdpr-router";
import { getJLTTerms, clearJLTTermsCache } from "./jlt-terms";
import {
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendBookingUpdatedEmail,
  sendDocumentUploadedEmail,
  sendDocumentPasswordEmail,
  sendQuoteRequestAdminEmail,
  sendQuoteConfirmationEmail,
  sendIntakeFormAdminEmail,
  sendIntakeFormConfirmationEmail,
  sendCustomEmail,
  sendPostcardEmail,
  sendWelcomeWithPromoEmail,
  sendPasswordResetEmail,
  sendAccountDisabledEmail,
  sendAccountEnabledEmail,
  sendSOSAlertEmail,
  sendFeedbackPromoEmail,
  sendReferralPromoEmail,
  sendLoyaltyRewardEmail,
  sendLoyaltyPointsEmail,
  sendCampaignEmail,
  sendTicketReplyEmail,
  sendSetPasswordEmail
} from "./emails";

import {
  adminCreateUser,
  approveTestimonial,
  changeUserPassword,
  createBooking,
  createBookingReview,
  createDocument,
  createFaqItem,
  createPromoCode,
  createQuoteRequest,
  createTestimonial,
  createUserWithPassword,
  deleteDeal,
  deletePromoCode,
  deleteFaqItem,
  deleteTestimonial,
  deleteUser,
  getAllBookings,
  getAllDeals,
  getAllDealsAdmin,
  getAllFaqItems,
  getAllNewsletterSubscriptions,
  getAllPromoCodes,
  getAllQuoteRequests,
  getAllTestimonials,
  getAllUsers,
  getActiveFaqItems,
  getActivePromoCodes,
  getApprovedTestimonials,
  getBookingById,
  getBookingDocuments,
  getDocumentById,
  getClientBookings,
  getClientDocuments,
  getDealById,
  getPromoCodeByCode,
  getQuotesByUserId,
  getReviewByBookingId,
  getUserByEmail,
  getUserById,
  hashPassword,
  markPromoCodeUsed,
  setUserDisabled,
  subscribeNewsletter,
  updateBooking,
  updateDeal,
  updateFaqItem,
  updatePromoCode,
  updateQuoteStatus,
  validatePromoCode,
  verifyPassword,
  createDeal,
  setDocumentPassword,
  removeDocumentPassword,
  verifyDocumentPassword,
  getFlightDetailsByBookingId,
  createOrUpdateFlightDetails,
  getHotelDetailsByBookingId,
  createOrUpdateHotelDetails,
  deleteHotelDetails,
  getChecklistItemsByBookingId,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  toggleChecklistItem,
  getBookingsDueForPostcard,
  markPostcardSent,
  getIntakeSubmissions,
  getIntakeSubmissionById,
  createIntakeSubmission,
  updateIntakeStatus,
  updateBookingReference,
  logEmailRecord,
  getEmailLogs,
  logLoginHistory,
  getLoginHistoryForUser,
  getEmailLogsForUser,
  getUpcomingBirthdays,
  getClientReferrals,
  createPasswordResetToken,
  createSetPasswordToken,
  verifyPasswordResetToken,
  markPasswordResetTokenUsed,
  updateLastSignedIn,
  getUserSetPasswordLinkStatus,
  createWelcomePromoCode,
  cancelRedemption,
  fulfillRedemption,
  deleteLoyaltyReward,
  getLoyaltyLeaderboard,
  getAllRedemptionsAdmin,
  getAllLoyaltyAccounts,
  getAllLoyaltyRewards,
  getLoyaltyStats,
  addLoyaltyPoints,
  redeemLoyaltyReward,
  setAppSetting,
  getCampaigns,
  createCampaign,
  markCampaignSent,
  subscribeNewsletterV6,
  unsubscribeNewsletter,
  getNewsletterSubscribers,
  getAuditLogs,
  writeAuditLog,
  getClientNotes,
  createClientNote,
  deleteClientNote,
  getBookedDestinations,
  getAllBookedDestinations,
  deleteAllBookedDestinations,
  createBookedDestination,
  updateBookedDestination,
  deleteBookedDestination,
  getUserByReferralCode,
  getLoyaltyAccount,
  getLoyaltyTransactions,
  getLoyaltyRewards,
  createLoyaltyReward,
  updateLoyaltyReward,
  getBookingFeedback,
  createBookingFeedback,
  setNotificationsEnabled,
  setUserDateOfBirth,
  getAppSetting,
  getAppSettings,
  getAllFaqItemsForAI,
  createSupportTicket,
  getSupportTicketsByUserId,
  getAllSupportTickets,
  getSupportTicketById,
  updateSupportTicketStatus,
  addTicketMessage,
  getTicketMessages,
  getBookingMembers,
  addBookingMember,
  removeBookingMember,
  getSharedBookingsByUserId,
  getActivitiesByDestination,
  upsertActivity,
  deleteActivity,
  clearActivitiesForDestination,
  getPhotosByBooking,
  addBookingPhoto,
  deleteBookingPhoto,
  updateBookingPhotoCaption,
  getLoyaltyRules,
  updateLoyaltyRule,
  getPointsForEvent,
  deleteBooking,
} from "./db";

const adminMiddleware = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── V8: Activities (Things to Do) ────────────────────────────────────────────
const activitiesRouter = router({
  getByDestination: protectedProcedure
    .input(z.object({ destination: z.string() }))
    .query(async ({ input }) => {
      return getActivitiesByDestination(input.destination);
    }),
  autofetch: adminMiddleware
    .input(z.object({ destination: z.string() }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.OPENTRIPMAP_API_KEY || (await getAppSetting("opentripmap_api_key"));
      if (!apiKey) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "OpenTripMap API key not configured. Add OPENTRIPMAP_API_KEY to your environment variables or set opentripmap_api_key in App Settings." });
      }
      // Step 1: Geocode destination
      const geoRes = await fetch(`https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(input.destination)}&apikey=${apiKey}`);
      const geoData = await geoRes.json() as any;
      if (!geoData.lat || !geoData.lon) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Could not find location: ${input.destination}` });
      }
      // Step 2: Get nearby attractions (rate>=2 filters for quality results)
      const placesRes = await fetch(`https://api.opentripmap.com/0.1/en/places/radius?radius=20000&lon=${geoData.lon}&lat=${geoData.lat}&kinds=interesting_places&rate=2&limit=20&format=json&apikey=${apiKey}`);
      if (!placesRes.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Places fetch failed (${placesRes.status}). Please try again.` });
      const placesRaw = await placesRes.json() as any;
      // Handle both plain array (format=json) and GeoJSON FeatureCollection formats
      const places: any[] = Array.isArray(placesRaw)
        ? placesRaw
        : (placesRaw?.features?.map((f: any) => ({ ...f.properties, xid: f.properties?.xid })) || []);
      if (!places.length) throw new TRPCError({ code: "NOT_FOUND", message: `No attractions found near ${input.destination}. Try a slightly different destination name.` });
      // Step 3: Fetch details for each with small delay to respect API rate limits
      const activities: any[] = [];
      for (const place of places.slice(0, 12)) {
        if (!place?.xid) continue;
        try {
          await new Promise(r => setTimeout(r, 120));
          const detailRes = await fetch(`https://api.opentripmap.com/0.1/en/places/xid/${place.xid}?apikey=${apiKey}`);
          if (!detailRes.ok) continue;
          const detail = await detailRes.json() as any;
          const name = detail.name || place.name;
          if (!name?.trim()) continue;
          activities.push({
            name: name.trim(),
            category: detail.kinds?.split(",")[0]?.replace(/_/g, " ") || "",
            description: detail.wikipedia_extracts?.text?.slice(0, 500) || detail.info?.descr || "",
            rating: detail.rate ? String(detail.rate) : null,
            imageUrl: detail.preview?.source || null,
            wikiUrl: detail.url || null,
          });
        } catch { /* skip individual fetch failures */ }
      }
      if (!activities.length) throw new TRPCError({ code: "NOT_FOUND", message: `Couldn't retrieve activity details for ${input.destination}. The API may be rate-limited — please try again in a moment.` });
      await clearActivitiesForDestination(input.destination);
      for (let i = 0; i < activities.length; i++) {
        await upsertActivity({ ...activities[i], destination: input.destination, sortOrder: i });
      }
      return getActivitiesByDestination(input.destination);
    }),
  save: adminMiddleware
    .input(z.object({
      id: z.number().optional(),
      destination: z.string(),
      name: z.string(),
      category: z.string().optional(),
      description: z.string().optional(),
      rating: z.string().optional(),
      imageUrl: z.string().optional(),
      wikiUrl: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return upsertActivity({ ...input, addedBy: ctx.user.id });
    }),
  delete: adminMiddleware
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteActivity(input.id);
      return { ok: true };
    }),
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    register: publicProcedure
      .input(z.object({ email: z.string().email(), phone: z.string().min(7), password: z.string().min(8), name: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
        const passwordHash = hashPassword(input.password);
        const user = await createUserWithPassword(input.email, input.name, input.phone, passwordHash);
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create account" });
        const { sdk } = await import("./_core/sdk");
        const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || input.name });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
        return { success: true, user };
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        if ((user as any).isDisabled) throw new TRPCError({ code: "FORBIDDEN", message: "This account has been disabled. Please contact support." });
        if (!verifyPassword(input.password, user.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        const { sdk } = await import("./_core/sdk");
        const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || user.email || "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
        updateLastSignedIn(user.id).catch(console.error);
        const loginIp = (ctx.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || ctx.req.socket?.remoteAddress || null;
        const loginUa = ctx.req.headers['user-agent'] as string || null;
        logLoginHistory(user.id, loginIp, loginUa).catch(console.error);
        return { success: true, user };
      }),
    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const user = await getUserByEmail(input.email);
        if (!user) {
          // Don't reveal if user exists
          return { success: true };
        }
        const token = await createPasswordResetToken(user.id, input.email);
        await sendPasswordResetEmail(input.email, user.name || 'there', token);
        return { success: true };
      }),
    resetPassword: publicProcedure
      .input(z.object({ email: z.string().email(), token: z.string(), newPassword: z.string().min(8) }))
      .mutation(async ({ input }) => {
        const result = await verifyPasswordResetToken(input.email, input.token);
        if (!result.valid || !result.userId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid or expired reset code. Please request a new one.' });
        }
        await changeUserPassword(result.userId, input.newPassword);
        await markPasswordResetTokenUsed(result.tokenId!);
        return { success: true };
      }),
    // Used when admin creates a new account — user clicks the welcome email link to set their own password
    setPassword: publicProcedure
      .input(z.object({ email: z.string().email(), token: z.string(), newPassword: z.string().min(8) }))
      .mutation(async ({ input }) => {
        const result = await verifyPasswordResetToken(input.email, input.token);
        if (!result.valid || !result.userId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'This link is invalid or has expired. Please ask an admin to resend your welcome email.' });
        }
        await changeUserPassword(result.userId, input.newPassword);
        await markPasswordResetTokenUsed(result.tokenId!);
        return { success: true };
      }),
  }),

  deals: router({
    list: publicProcedure.query(() => getAllDeals()),
    listAdmin: adminMiddleware.query(() => getAllDealsAdmin()),
    getById: publicProcedure.input(z.number()).query(({ input }) => getDealById(input)),
    create: adminMiddleware
      .input(z.object({ title: z.string(), destination: z.string(), category: z.enum(["package_holiday","cruise","business_travel","luxury","adventure","city_break","other"]), description: z.string(), price: z.string(), originalPrice: z.string().optional(), duration: z.string().optional(), departureDate: z.string().optional(), imageUrl: z.string().optional(), images: z.array(z.string()).optional(), highlights: z.string().optional(), isFeatured: z.boolean().optional() }))
      .mutation(({ input }) => { const { images, ...rest } = input; return createDeal({ ...rest, price: parseFloat(rest.price), originalPrice: rest.originalPrice ? parseFloat(rest.originalPrice) : undefined }); }),
    update: adminMiddleware
      .input(z.object({ id: z.number(), title: z.string().optional(), destination: z.string().optional(), category: z.enum(["package_holiday","cruise","business_travel","luxury","adventure","city_break","other"]).optional(), description: z.string().optional(), price: z.string().optional(), originalPrice: z.string().optional(), duration: z.string().optional(), departureDate: z.string().optional(), imageUrl: z.string().optional(), images: z.array(z.string()).optional(), highlights: z.string().optional(), isActive: z.boolean().optional(), isFeatured: z.boolean().optional() }))
      .mutation(({ input }) => { const { id, ...data } = input; const u: any = { ...data }; if (data.price) u.price = parseFloat(data.price); if (data.originalPrice) u.originalPrice = parseFloat(data.originalPrice); return updateDeal(id, u); }),
    delete: adminMiddleware.input(z.number()).mutation(({ input }) => deleteDeal(input)),
  }),

  bookings: router({
    myBookings: protectedProcedure.query(({ ctx }) => getClientBookings(ctx.user.id)),
    getById: protectedProcedure.input(z.number()).query(async ({ input, ctx }) => {
      const booking = await getBookingById(input);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && booking.clientId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return booking;
    }),
    getDocuments: protectedProcedure.input(z.number()).query(async ({ input, ctx }) => {
      const booking = await getBookingById(input);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && booking.clientId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getBookingDocuments(input);
    }),
    getAllAdmin: adminMiddleware.query(() => getAllBookings()),
    checkClientEmail: adminMiddleware
      .input(z.string().email())
      .query(async ({ input }) => {
        const user = await getUserByEmail(input);
        return { exists: !!user, user: user ? { id: user.id, name: user.name, email: user.email } : null };
      }),
    getLinkedClient: adminMiddleware
      .input(z.number())
      .query(async ({ input }) => {
        const booking = await getBookingById(input);
        if (!booking) return null;
        // Try clientId first
        let user = booking.clientId ? await getUserById(booking.clientId) : null;
        // Fallback: match by leadPassengerEmail and auto-link the booking
        if (!user && booking.leadPassengerEmail) {
          user = await getUserByEmail(booking.leadPassengerEmail);
          if (user) {
            await updateBooking(input, { clientId: user.id });
          }
        }
        if (!user) return null;
        let loyaltyPoints = 0;
        try {
          const loyalty = await getLoyaltyAccount(user.id);
          loyaltyPoints = loyalty?.points ?? 0;
        } catch {}
        return { id: user.id, name: user.name, email: user.email, phone: user.phone, loyaltyPoints };
      }),
    delete: adminMiddleware
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const booking = await getBookingById(input);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
        await deleteBooking(input);
        const adminId = (ctx as any).user?.id;
        await writeAuditLog({
          actorId: adminId,
          actorType: 'admin',
          action: "booking_deleted",
          entityType: "booking",
          entityId: input,
          newValue: { bookingReference: booking.bookingReference, destination: booking.destination },
        }).catch(console.error);
        return { success: true };
      }),
    create: adminMiddleware
      .input(z.object({ bookingReference: z.string().optional(), clientId: z.number().optional(), clientEmail: z.string().email().optional(), status: z.enum(["pending","confirmed","cancelled","completed"]).optional(), departureDate: z.string().optional(), returnDate: z.string().optional(), destination: z.string().optional(), leadPassengerName: z.string().optional(), leadPassengerEmail: z.string().email().optional(), leadPassengerPhone: z.string().optional(), leadPassengerDob: z.string().optional(), totalPrice: z.string().optional(), amountPaid: z.string().optional(), numberOfTravelers: z.number().optional(), notes: z.string().optional(), dealId: z.number().optional() }))
      .mutation(async ({ input }) => {
        let clientId = input.clientId;
        if (!clientId && input.clientEmail) { const u = await getUserByEmail(input.clientEmail); if (u) clientId = u.id; }
        const bookingReference = input.bookingReference?.trim().toUpperCase() || `CBT-${nanoid(8).toUpperCase()}`;
        const newBooking = await createBooking({ bookingReference, clientId, status: input.status || "pending", departureDate: input.departureDate, returnDate: input.returnDate, destination: input.destination, leadPassengerName: input.leadPassengerName, leadPassengerEmail: input.leadPassengerEmail, leadPassengerPhone: input.leadPassengerPhone, leadPassengerDob: input.leadPassengerDob, totalPrice: input.totalPrice ? parseFloat(input.totalPrice) : undefined, amountPaid: input.amountPaid ? parseFloat(input.amountPaid) : 0, numberOfTravelers: input.numberOfTravelers, notes: input.notes, dealId: input.dealId });
        // Send booking confirmation email
        const emailTo = input.leadPassengerEmail || (clientId ? (await getUserById(clientId))?.email : null);
        if (emailTo) {
          const emailName = input.leadPassengerName || input.clientEmail?.split("@")[0] || "there";
          sendBookingConfirmationEmail(emailTo, emailName, {
            bookingReference,
            destination: input.destination,
            departureDate: input.departureDate,
            returnDate: input.returnDate,
            status: input.status || "pending",
            totalPrice: input.totalPrice ? parseFloat(input.totalPrice) : null,
            numberOfTravelers: input.numberOfTravelers,
          }).catch(console.error);
        }
        return newBooking;
      }),
    duplicate: adminMiddleware
      .input(z.object({
        sourceBookingId: z.number(),
        bookingReference: z.string().optional(),
        clientEmail: z.string().email().optional(),
        status: z.enum(["pending","confirmed","cancelled","completed"]).optional(),
        departureDate: z.string().optional(),
        returnDate: z.string().optional(),
        destination: z.string().optional(),
        leadPassengerName: z.string().optional(),
        leadPassengerEmail: z.string().email().optional(),
        leadPassengerPhone: z.string().optional(),
        leadPassengerDob: z.string().optional(),
        totalPrice: z.string().optional(),
        amountPaid: z.string().optional(),
        numberOfTravelers: z.number().optional(),
        notes: z.string().optional(),
        copyFlightDetails: z.boolean().optional(),
        copyHotelDetails: z.boolean().optional(),
        copyDocuments: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        let clientId: number | undefined;
        if (input.clientEmail) { const u = await getUserByEmail(input.clientEmail); if (u) clientId = u.id; }
        const bookingReference = input.bookingReference?.trim().toUpperCase() || `CBT-${nanoid(8).toUpperCase()}`;
        const newBooking = await createBooking({ bookingReference, clientId, status: input.status || "pending", departureDate: input.departureDate, returnDate: input.returnDate, destination: input.destination, leadPassengerName: input.leadPassengerName, leadPassengerEmail: input.leadPassengerEmail, leadPassengerPhone: input.leadPassengerPhone, leadPassengerDob: input.leadPassengerDob, totalPrice: input.totalPrice ? parseFloat(input.totalPrice) : undefined, amountPaid: input.amountPaid ? parseFloat(input.amountPaid) : 0, numberOfTravelers: input.numberOfTravelers, notes: input.notes });
        const newId = newBooking.id;
        // Copy flight details
        if (input.copyFlightDetails !== false) {
          const flight = await getFlightDetailsByBookingId(input.sourceBookingId);
          if (flight) {
            const { id: _id, bookingId: _bid, createdAt: _ca, updatedAt: _ua, ...flightData } = flight as any;
            await createOrUpdateFlightDetails(newId, flightData);
          }
        }
        // Copy hotel details
        if (input.copyHotelDetails !== false) {
          const hotels = await getHotelDetailsByBookingId(input.sourceBookingId);
          for (const hotel of hotels) {
            const { id: _id, bookingId: _bid, createdAt: _ca, updatedAt: _ua, ...hotelData } = hotel as any;
            await createOrUpdateHotelDetails(newId, hotelData);
          }
        }
        // Copy document records (same files, new booking association)
        if (input.copyDocuments !== false) {
          const docs = await getBookingDocuments(input.sourceBookingId);
          for (const doc of docs) {
            await createDocument({ bookingId: newId, clientId: clientId ?? (doc as any).clientId, fileName: doc.fileName, fileKey: (doc as any).fileKey, fileUrl: doc.fileUrl, documentType: doc.documentType, documentLabel: doc.documentLabel ?? undefined });
          }
        }
        return newBooking;
      }),
    update: adminMiddleware
      .input(z.object({ id: z.number(), bookingReference: z.string().optional(), clientId: z.number().optional(), status: z.enum(["pending","confirmed","cancelled","completed"]).optional(), departureDate: z.string().optional(), returnDate: z.string().optional(), destination: z.string().optional(), leadPassengerName: z.string().optional(), leadPassengerEmail: z.string().optional(), leadPassengerPhone: z.string().optional(), leadPassengerDob: z.string().optional(), totalPrice: z.string().optional(), amountPaid: z.string().optional(), numberOfTravelers: z.number().optional(), notes: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const u: any = { ...data };
        if (data.totalPrice !== undefined) u.totalPrice = parseFloat(data.totalPrice);
        if (data.amountPaid !== undefined) u.amountPaid = parseFloat(data.amountPaid);
        if (data.bookingReference) u.bookingReference = data.bookingReference.trim().toUpperCase();
        const updated = await updateBooking(id, u);
        // Award loyalty points when booking is marked completed
        if (input.status === 'completed' && updated?.clientId) {
          try {
            const flatRule = await getPointsForEvent('booking_completed');
            if (flatRule.isActive && flatRule.points > 0) {
              await addLoyaltyPoints(updated.clientId, flatRule.points, 'earn', `Booking completed: ${updated.bookingReference || 'booking'}`, id);
            }
            const perPoundRule = await getPointsForEvent('booking_per_pound');
            if (perPoundRule.isActive && perPoundRule.points > 0 && updated.totalPrice) {
              const total = parseFloat(updated.totalPrice as any);
              if (!isNaN(total) && total > 0) {
                const pts = Math.floor(total * perPoundRule.points);
                if (pts > 0) await addLoyaltyPoints(updated.clientId, pts, 'earn', `Spend reward: £${total.toFixed(0)} booking`, id);
              }
            }
          } catch (e) { console.error('Loyalty points award error:', e); }
        }
        writeAuditLog({
          actorId: (ctx as any).user?.id,
          actorType: 'admin',
          action: 'booking_updated',
          entityType: 'booking',
          entityId: id,
          newValue: u,
        }).catch(console.error);
        // Send update email to client
        if (updated) {
          const emailTo = updated.leadPassengerEmail || (updated.clientId ? (await getUserById(updated.clientId))?.email : null);
          if (emailTo) {
            const emailName = updated.leadPassengerName || emailTo.split("@")[0];
            sendBookingUpdatedEmail(emailTo, emailName, {
              bookingReference: updated.bookingReference,
              destination: updated.destination,
              departureDate: updated.departureDate,
              returnDate: updated.returnDate,
              status: updated.status,
              totalPrice: updated.totalPrice ? parseFloat(updated.totalPrice as any) : null,
            }).catch(console.error);
          }
        }
        return updated;
      }),
    uploadDocument: adminMiddleware
      .input(z.object({ bookingId: z.number(), clientId: z.number().optional(), fileName: z.string(), fileData: z.string(), mimeType: z.string(), documentType: z.enum(["booking_confirmation","itinerary","invoice","receipt","other"]), documentLabel: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.fileData, "base64");
        const fileKey = `bookings/${input.bookingId}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        await createDocument({ bookingId: input.bookingId, clientId: input.clientId, fileName: input.fileName, fileKey, fileUrl: url, documentType: input.documentType, documentLabel: input.documentLabel });
        writeAuditLog({
          actorId: (ctx as any).user?.id,
          actorType: 'admin',
          action: 'document_uploaded',
          entityType: 'booking',
          entityId: input.bookingId,
          newValue: { fileName: input.fileName, documentType: input.documentType, documentLabel: input.documentLabel },
        }).catch(console.error);
        // Send document notification email to client
        const docBooking = await getBookingById(input.bookingId);
        if (docBooking) {
          const docEmailTo = docBooking.leadPassengerEmail || (docBooking.clientId ? (await getUserById(docBooking.clientId))?.email : null);
          if (docEmailTo) {
            const docName = docBooking.leadPassengerName || docEmailTo.split("@")[0];
            sendDocumentUploadedEmail(docEmailTo, docName, docBooking.bookingReference, docBooking.destination, input.documentLabel || input.documentType.replace(/_/g, " ")).catch(console.error);
          }
        }
        return { fileKey, url, fileName: input.fileName };
      }),
    setDocumentPassword: adminMiddleware
      .input(z.object({ documentId: z.number(), password: z.string().min(6), sendEmail: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        const result = await setDocumentPassword(input.documentId, input.password);
        // Always email the client their password so they can open the document
        try {
          const doc = await getDocumentById(input.documentId);
          if (doc?.bookingId) {
            const booking = await getBookingById(doc.bookingId);
            const clientEmail = booking?.leadPassengerEmail;
            const clientName = booking?.leadPassengerName || "Valued Client";
            if (clientEmail) {
              sendDocumentPasswordEmail(clientEmail, clientName, doc.fileName, input.password).catch(console.error);
            }
          }
        } catch (e) {
          console.error("[DocumentPassword] Failed to send email:", e);
        }
        return result;
      }),
    removeDocumentPassword: adminMiddleware
      .input(z.number())
      .mutation(({ input }) => removeDocumentPassword(input)),
    verifyDocumentPassword: publicProcedure
      .input(z.object({ documentId: z.number(), password: z.string() }))
      .query(({ input }) => verifyDocumentPassword(input.documentId, input.password)),
    getFlightDetails: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const booking = await getBookingById(input);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && booking.clientId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return getFlightDetailsByBookingId(input);
      }),
    setFlightDetails: adminMiddleware
      .input(z.object({ bookingId: z.number(), outboundFlightNumber: z.string().optional(), outboundDeparture: z.string().optional(), outboundArrival: z.string().optional(), outboundDepartureTime: z.string().optional(), outboundArrivalTime: z.string().optional(), returnFlightNumber: z.string().optional(), returnDeparture: z.string().optional(), returnArrival: z.string().optional(), returnDepartureTime: z.string().optional(), returnArrivalTime: z.string().optional(), airline: z.string().optional(), notes: z.string().optional() }))
      .mutation(({ input }) => createOrUpdateFlightDetails(input.bookingId, input)),
    getHotelDetails: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const booking = await getBookingById(input);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && booking.clientId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return getHotelDetailsByBookingId(input);
      }),
    setHotelDetails: adminMiddleware
      .input(z.object({ bookingId: z.number(), id: z.number().optional(), hotelName: z.string(), destination: z.string().optional(), checkInDate: z.string().optional(), checkOutDate: z.string().optional(), roomType: z.string().optional(), address: z.string().optional(), phone: z.string().optional(), email: z.string().optional(), website: z.string().optional(), confirmationNumber: z.string().optional(), notes: z.string().optional() }))
      .mutation(({ input }) => createOrUpdateHotelDetails(input.bookingId, input)),
    deleteHotel: adminMiddleware
      .input(z.number())
      .mutation(({ input }) => deleteHotelDetails(input)),

    // ─── V8: Booking Photos ─────────────────────────────────────────────────
    getPhotos: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return getPhotosByBooking(input);
      }),
    addPhoto: adminMiddleware
      .input(z.object({ bookingId: z.number(), imageBase64: z.string(), mimeType: z.string().default("image/jpeg"), caption: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import("./storage");
        // Strip data URI prefix if present (FileReader.readAsDataURL includes "data:image/jpeg;base64,...")
        const base64Data = input.imageBase64.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = input.mimeType.split("/")[1] || "jpg";
        const key = `booking-photos/${input.bookingId}/${Date.now()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return addBookingPhoto({ bookingId: input.bookingId, imageUrl: url, imageKey: key, caption: input.caption, uploadedBy: ctx.user.id });
      }),
    deletePhoto: adminMiddleware
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteBookingPhoto(input.id);
      }),
    updatePhotoCaption: adminMiddleware
      .input(z.object({ id: z.number(), caption: z.string() }))
      .mutation(async ({ input }) => {
        await updateBookingPhotoCaption(input.id, input.caption);
      }),

    getChecklist: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const booking = await getBookingById(input);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && booking.clientId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return getChecklistItemsByBookingId(input);
      }),
    addChecklistItem: protectedProcedure
      .input(z.object({ bookingId: z.number(), title: z.string(), description: z.string().optional(), category: z.string().optional(), dueDate: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && booking.clientId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return createChecklistItem({ bookingId: input.bookingId, userId: ctx.user.id, title: input.title, description: input.description, category: input.category, dueDate: input.dueDate });
      }),
    updateChecklistItem: protectedProcedure
      .input(z.object({ id: z.number(), title: z.string().optional(), description: z.string().optional(), isCompleted: z.boolean().optional(), category: z.string().optional(), dueDate: z.string().optional() }))
      .mutation(({ input }) => updateChecklistItem(input.id, input)),
    deleteChecklistItem: protectedProcedure
      .input(z.number())
      .mutation(({ input }) => deleteChecklistItem(input)),
    toggleChecklistItem: protectedProcedure
      .input(z.number())
      .mutation(({ input }) => toggleChecklistItem(input)),

    updatePassport: adminMiddleware
      .input(z.object({
        id: z.number(),
        passportNumber: z.string().nullable().optional(),
        passportExpiry: z.string().nullable().optional(),
        passportIssueDate: z.string().nullable().optional(),
        passportIssuingCountry: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateBookingPassport } = await import("./db");
        await updateBookingPassport(input.id, {
          passportNumber: input.passportNumber,
          passportExpiry: input.passportExpiry,
          passportIssueDate: input.passportIssueDate,
          passportIssuingCountry: input.passportIssuingCountry,
        });
        return { success: true };
      }),

    sendPassportReminder: adminMiddleware
      .input(z.object({
        bookingId: z.number(),
        previewOnly: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getAllBookings } = await import("./db");
        const allBookings = await getAllBookings();
        const booking = allBookings.find((b: any) => b.id === input.bookingId);
        if (!booking) throw new Error("Booking not found");
        const to = booking.leadPassengerEmail || "";
        const clientName = booking.leadPassengerName || "Valued Client";
        const passportExpiry = (booking as any).passportExpiry || "unknown date";
        const destination = booking.destination || "your destination";
        const departureDate = booking.departureDate || "your departure date";
        const bookingRef = booking.bookingReference || String(booking.id);
        if (input.previewOnly) {
          return {
            preview: {
              to,
              subject: `⚠️ Passport Renewal Required — ${destination}`,
              clientName,
              passportExpiry,
              destination,
              departureDate,
              bookingRef,
            }
          };
        }
        if (!to) throw new Error("No email address for this booking");
        const { sendPassportReminderEmail } = await import("./emails");
        const result = await sendPassportReminderEmail(to, clientName, passportExpiry, destination, departureDate, bookingRef, booking.id);
        return { success: result.success, error: result.error };
      }),
  }),

  quotes: router({
    create: publicProcedure
      .input(z.object({ name: z.string(), email: z.string().email(), phone: z.string().optional(), quoteType: z.enum(["new_quote","price_match"]).optional(), travelType: z.string(), destination: z.string().optional(), numberOfTravelers: z.number().optional(), departureDate: z.string().optional(), returnDate: z.string().optional(), budget: z.string().optional(), message: z.string().optional(), screenshotData: z.string().optional(), screenshotName: z.string().optional(), screenshotMime: z.string().optional(), userId: z.number().optional(), promoCode: z.string().optional() }))
      .mutation(async ({ input }) => {
        let screenshotUrl: string | undefined;
        let screenshotKey: string | undefined;
        let promoDiscount: number | undefined;
        if (input.screenshotData && input.screenshotName) {
          try {
            const { storagePut } = await import("./storage");
            const buffer = Buffer.from(input.screenshotData, "base64");
            const fileKey = `quotes/price-match/${Date.now()}-${input.screenshotName}`;
            const { url } = await storagePut(fileKey, buffer, input.screenshotMime || "image/jpeg");
            screenshotUrl = url;
            screenshotKey = fileKey;
          } catch (e) { console.warn("Screenshot upload failed:", e); }
        }
        if (input.promoCode) {
          const validation = await validatePromoCode(input.promoCode);
          if (!validation.valid) throw new TRPCError({ code: "BAD_REQUEST", message: validation.message });
          promoDiscount = validation.discount;
        }
        try {
          const quoteResult = await createQuoteRequest({ name: input.name, email: input.email, phone: input.phone, quoteType: input.quoteType || "new_quote", travelType: input.travelType || "other", destination: input.destination, numberOfTravelers: input.numberOfTravelers, departureDate: input.departureDate, returnDate: input.returnDate, budget: input.budget, message: input.message, screenshotUrl, screenshotKey, userId: input.userId, promoCode: input.promoCode, promoDiscount });
          // Send emails (non-blocking)
          sendQuoteRequestAdminEmail({ name: input.name, email: input.email, phone: input.phone, destination: input.destination, travelType: input.travelType || "other", departureDate: input.departureDate, returnDate: input.returnDate, numberOfTravelers: input.numberOfTravelers, budget: input.budget, message: input.message, quoteType: input.quoteType }).catch(console.error);
          sendQuoteConfirmationEmail(input.email, input.name, input.destination).catch(console.error);
          return quoteResult;
        } catch (dbErr: any) {
          console.error("[Quote create error]", dbErr?.message || dbErr);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to save quote request: ${dbErr?.message || "unknown error"}` });
        }
      }),
    myQuotes: protectedProcedure.query(({ ctx }) => getQuotesByUserId(ctx.user.id)),
    getAllAdmin: adminMiddleware.query(() => getAllQuoteRequests()),
    updateStatus: adminMiddleware
      .input(z.object({ id: z.number(), status: z.enum(["new","contacted","quoted","completed","cancelled"]) }))
      .mutation(({ input }) => updateQuoteStatus(input.id, input.status)),
    validatePromo: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(({ input }) => validatePromoCode(input.code)),
  }),

  reviews: router({
    submitReview: protectedProcedure
      .input(z.object({ bookingId: z.number(), rating: z.number().min(1).max(5), title: z.string().optional(), content: z.string().min(10) }))
      .mutation(async ({ input, ctx }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (booking.clientId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const existing = await getReviewByBookingId(input.bookingId);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Review already submitted for this booking" });
        const review = await createBookingReview({ bookingId: input.bookingId, userId: ctx.user.id, rating: input.rating, title: input.title, content: input.content, destination: booking.destination });
        const loyaltyCode = `LOYALTY-${ctx.user.id}-${nanoid(6).toUpperCase()}`;
        const promoCode = await createPromoCode({ code: loyaltyCode, description: `Loyalty code for ${ctx.user.id} after review`, discountAmount: 50, codeType: "loyalty", issuedToUserId: ctx.user.id, issuedToEmail: ctx.user.email, expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) });
        return { review, loyaltyCode: promoCode.code, discount: 50 };
      }),
    getReviewByBooking: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const booking = await getBookingById(input);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && booking.clientId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return getReviewByBookingId(input);
      }),
    // Admin can manually trigger the post-holiday review flow for a booking
    adminTriggerReviewFlow: adminProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
        const clientUser = booking.clientId ? await getUserById(booking.clientId) : null;
        const toEmail = clientUser?.email || booking.leadPassengerEmail;
        if (!toEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "No email address found for this booking" });
        const clientName = clientUser?.name || booking.leadPassengerName || "there";
        const destination = booking.destination || "your destination";
        // Import sendFeedbackPromoEmail or a dedicated post-holiday email
        const { sendPostHolidayReviewEmail } = await import("./emails");
        await sendPostHolidayReviewEmail(toEmail, clientName, destination, booking.bookingReference || "");
        await writeAuditLog({
          actorId: (ctx as any).user?.id,
          actorType: 'admin',
          action: 'review_flow_triggered',
          entityType: 'booking',
          entityId: input.bookingId,
          newValue: { destination, toEmail },
        }).catch(console.error);
        return { success: true };
      }),
  }),

  promoCodes: router({
    list: adminMiddleware.query(() => getAllPromoCodes()),
    listActive: publicProcedure.query(() => getActivePromoCodes()),
    create: adminMiddleware
      .input(z.object({ code: z.string().min(3), description: z.string().optional(), discountAmount: z.number().min(0.01), expiresAt: z.string().optional() }))
      .mutation(({ input }) => createPromoCode({ code: input.code, description: input.description, discountAmount: input.discountAmount, expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined })),
    update: adminMiddleware
      .input(z.object({ id: z.number(), description: z.string().optional(), discountAmount: z.number().optional(), isActive: z.boolean().optional(), expiresAt: z.string().optional() }))
      .mutation(({ input }) => { const { id, ...data } = input; const u: any = { ...data }; if (data.expiresAt) u.expiresAt = new Date(data.expiresAt); return updatePromoCode(id, u); }),
    delete: adminMiddleware.input(z.number()).mutation(({ input }) => deletePromoCode(input)),
    validate: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(({ input }) => validatePromoCode(input.code)),
  }),

  testimonials: router({
    list: publicProcedure.query(() => getApprovedTestimonials()),
    getAllAdmin: adminMiddleware.query(() => getAllTestimonials()),
    create: adminMiddleware
      .input(z.object({ clientName: z.string(), clientImage: z.string().optional(), destination: z.string(), title: z.string(), content: z.string(), rating: z.number().min(1).max(5) }))
      .mutation(({ input }) => createTestimonial(input)),
    approve: adminMiddleware.input(z.number()).mutation(({ input }) => approveTestimonial(input)),
    delete: adminMiddleware.input(z.number()).mutation(({ input }) => deleteTestimonial(input)),
  }),

  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({ email: z.string().email(), name: z.string().optional() }))
      .mutation(({ input }) => subscribeNewsletter(input)),
    getAll: adminMiddleware.query(() => getAllNewsletterSubscriptions()),
  }),

  faq: router({
    list: publicProcedure.query(() => getActiveFaqItems()),
    listAdmin: adminMiddleware.query(() => getAllFaqItems()),
    create: adminMiddleware
      .input(z.object({ category: z.string().min(1), question: z.string().min(1), answer: z.string().min(1), sortOrder: z.number().optional() }))
      .mutation(({ input }) => createFaqItem(input)),
    update: adminMiddleware
      .input(z.object({ id: z.number(), category: z.string().optional(), question: z.string().optional(), answer: z.string().optional(), sortOrder: z.number().optional(), isActive: z.boolean().optional() }))
      .mutation(({ input }) => { const { id, ...data } = input; return updateFaqItem(id, data); }),
    delete: adminMiddleware.input(z.number()).mutation(({ input }) => deleteFaqItem(input)),
  }),

  admin: router({
    users: adminMiddleware.query(() => getAllUsers()),
    getUserById: adminMiddleware.input(z.number()).query(({ input }) => getUserById(input)),
    getUserDocuments: adminMiddleware.input(z.number()).query(({ input }) => getClientDocuments(input)),
    getUserBookings: adminMiddleware.input(z.number()).query(({ input }) => getClientBookings(input)),
    createUser: adminMiddleware
      .input(z.object({ email: z.string().email(), name: z.string().min(1), phone: z.string().optional(), role: z.enum(["user","admin"]).optional(), bookingId: z.number().optional() }))
      .mutation(async ({ input }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) {
          // Account already exists — just link the booking if a bookingId was provided
          if (input.bookingId) {
            await updateBooking(input.bookingId, { clientId: existing.id });
          }
          return { ...existing, alreadyExisted: true as const };
        }
        // GDPR fix: generate random temporary password — never sent to user
        const { randomBytes } = await import("crypto");
        const tempPassword = randomBytes(32).toString("hex");
        const newUser = await adminCreateUser({ ...input, password: tempPassword });
        // Link booking if provided
        if (input.bookingId) {
          await updateBooking(input.bookingId, { clientId: newUser.id });
        }
        // Generate a secure set-password link (24h expiry) — user sets their own password
        const token = await createSetPasswordToken(newUser.id, input.email);
        const SITE_URL = process.env.SITE_URL || "https://www.travelcb.co.uk";
        const setPasswordUrl = `${SITE_URL}/set-password?token=${token}&email=${encodeURIComponent(input.email)}`;
        try {
          const promoCode = await createWelcomePromoCode(newUser.id, input.email);
          sendWelcomeWithPromoEmail(input.email, input.name, setPasswordUrl, promoCode, 10).catch(console.error);
        } catch {
          sendWelcomeEmail(input.email, input.name, setPasswordUrl).catch(console.error);
        }
        return newUser;
      }),
    disableUser: adminMiddleware
      .input(z.object({ id: z.number(), disabled: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        await setUserDisabled(input.id, input.disabled);
        const user = await getUserById(input.id);
        const adminId = (ctx as any).user?.id;
        if (user?.email) {
          if (input.disabled) {
            sendAccountDisabledEmail(user.email, user.name || 'there').catch(console.error);
          } else {
            sendAccountEnabledEmail(user.email, user.name || 'there').catch(console.error);
          }
        }
        // Audit log for account enable/disable
        await writeAuditLog({
          actorId: adminId,
          actorType: 'admin',
          action: input.disabled ? 'account_disabled' : 'account_reinstated',
          entityType: 'user',
          entityId: input.id,
          newValue: { disabled: input.disabled, userEmail: user?.email, userName: user?.name },
        }).catch(console.error);
        return { success: true };
      }),
    deleteUser: adminMiddleware.input(z.number()).mutation(({ input }) => deleteUser(input)),
    changePassword: adminMiddleware
      .input(z.object({ id: z.number(), newPassword: z.string().min(8) }))
      .mutation(({ input }) => changeUserPassword(input.id, input.newPassword)),
    sendSetPasswordLink: adminMiddleware
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        const user = await getUserById(input.userId);
        if (!user || !user.email) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found or has no email address' });
        const SITE_URL = process.env.SITE_URL || 'https://www.travelcb.co.uk';
        const token = await createPasswordResetToken(user.id, user.email);
        const url = `${SITE_URL}/set-password?token=${token}&email=${encodeURIComponent(user.email)}`;
        await sendSetPasswordEmail(user.email, user.name || 'there', url);
        return { success: true };
      }),
    getSetPasswordLinkStatus: adminMiddleware
      .input(z.number())
      .query(({ input }) => getUserSetPasswordLinkStatus(input)),
    checkPostcards: adminMiddleware.query(() => getBookingsDueForPostcard()),
    markPostcardSent: adminMiddleware.input(z.number()).mutation(({ input }) => markPostcardSent(input)),
    sendEmail: adminMiddleware
      .input(z.object({
        to: z.string().email(),
        subject: z.string().min(1),
        message: z.string().min(1),
        clientName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await sendCustomEmail(input.to, input.subject, input.message, input.clientName);
        return { success: true };
      }),
    sendDocumentPassword: adminMiddleware
      .input(z.object({
        to: z.string().email(),
        clientName: z.string().optional(),
        documentLabel: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        await sendDocumentPasswordEmail(input.to, input.clientName || "there", input.documentLabel, input.password);
        return { success: true };
      }),
    sendPostcard: adminMiddleware
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ input }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: 'NOT_FOUND' });
        const user = booking.clientId ? await getUserById(booking.clientId) : null;
        const email = user?.email || booking.leadPassengerEmail;
        const name = user?.name || booking.leadPassengerName || 'Traveller';
        if (!email) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No email address for this booking' });
        await sendPostcardEmail(email, name, {
          bookingReference: booking.bookingReference,
          destination: booking.destination,
          departureDate: booking.departureDate,
          returnDate: booking.returnDate,
          numberOfTravelers: booking.numberOfTravelers,
        });
        await markPostcardSent(booking.id);
        return { success: true };
      }),
    getEmailLogs: adminMiddleware
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(({ input }) => getEmailLogs(input?.limit || 200)),
    resetUserPassword: adminMiddleware
      .input(z.object({ id: z.number(), newPassword: z.string().min(8) }))
      .mutation(async ({ input }) => {
        await changeUserPassword(input.id, input.newPassword);
        const user = await getUserById(input.id);
        if (user?.email) {
          sendCustomEmail(user.email, 'Your CB Travel Password Has Been Changed', `Hi ${user.name || 'there'},

Your account password has been changed by the CB Travel team. If you did not request this, please contact us immediately.

Your new temporary password: ${input.newPassword}

Please log in and update your password as soon as possible.`, user.name).catch(console.error);
        }
        return { success: true };
      }),
    sendPaymentReminder: adminMiddleware
      .input(z.object({
        bookingId: z.number(),
        previewOnly: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getAllBookings } = await import("./db");
        const allBookings = await getAllBookings();
        const booking = allBookings.find((b: any) => b.id === input.bookingId);
        if (!booking) throw new Error("Booking not found");

        const to = booking.leadPassengerEmail || "";
        const clientName = booking.leadPassengerName || "Valued Client";
        const bookingRef = booking.bookingReference || String(booking.id);
        const destination = booking.destination || "your booking";
        const totalPrice = booking.totalPrice ? `£${parseFloat(booking.totalPrice).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null;
        const amountPaid = booking.amountPaid ? `£${parseFloat(booking.amountPaid).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null;
        const outstanding = (booking.totalPrice && booking.amountPaid)
          ? `£${(parseFloat(booking.totalPrice) - parseFloat(booking.amountPaid)).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : null;

        if (input.previewOnly) {
          return {
            preview: {
              to,
              subject: `Payment Reminder — ${destination} | CB Travel`,
              clientName,
              bookingRef,
              destination,
              totalPrice,
              amountPaid,
              outstanding,
            }
          };
        }

        if (!to) throw new Error("No email address for this booking");

        const { sendPaymentReminderEmail } = await import("./emails");
        const result = await sendPaymentReminderEmail(to, clientName, bookingRef, destination, totalPrice, amountPaid, outstanding);
        if (result.success) {
          // Find userId by email for logging
          const { getUserByEmail } = await import("./db");
          const recipient = await getUserByEmail(to);
          logEmailRecord({ toEmail: to, subject: `Payment Reminder — ${destination} | CB Travel`, emailType: 'payment_reminder', status: 'sent', userId: recipient?.id, bookingId: input.bookingId }).catch(console.error);
        }
        return { success: result.success, error: result.error };
      }),
    updateUserProfile: adminMiddleware
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().nullable().optional(),
        dateOfBirth: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateUserAdmin } = await import("./db");
        const { id, ...data } = input;
        await updateUserAdmin(id, data);
        return { success: true };
      }),

    updateUserPassport: adminMiddleware
      .input(z.object({
        id: z.number(),
        passportNumber: z.string().nullable().optional(),
        passportExpiry: z.string().nullable().optional(),
        passportIssueDate: z.string().nullable().optional(),
        passportIssuingCountry: z.string().nullable().optional(),
        passportNationality: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { updateUserPassport } = await import('./db');
        const { id, ...data } = input;
        await updateUserPassport(id, data);
        writeAuditLog({
          actorId: (ctx as any).user?.id,
          actorType: 'admin',
          action: 'passport_updated',
          entityType: 'user',
          entityId: id,
        }).catch(console.error);
        return { success: true };
      }),

    // ─── Client detail routes (new) ───────────────────────────────────────
    getClientEmailLogs: adminMiddleware
      .input(z.object({ userId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => getEmailLogsForUser(input.userId, input.limit || 50)),

    getClientLoginHistory: adminMiddleware
      .input(z.object({ userId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => getLoginHistoryForUser(input.userId, input.limit || 20)),

    getUpcomingBirthdays: adminMiddleware
      .input(z.object({ daysAhead: z.number().optional() }).optional())
      .query(async ({ input }) => getUpcomingBirthdays(input?.daysAhead || 14)),

    getClientReferrals: adminMiddleware
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => getClientReferrals(input.userId)),
  }),

  emergency: router({
    getEmergencyInfo: protectedProcedure
      .input(z.object({ destination: z.string() }))
      .query(async ({ input }) => {
        const emergencyData: Record<string, any> = {
          "Thailand": { police: "191", ambulance: "1669", embassy: "+66 2-205-4000", embassyName: "British Embassy Bangkok", embassyAddress: "14 Wireless Road, Bangkok" },
          "France": { police: "17", ambulance: "15", embassy: "+33 1-44-51-31-00", embassyName: "British Embassy Paris", embassyAddress: "35 Rue du Faubourg Saint-Honoré, 75008 Paris" },
          "Spain": { police: "091", ambulance: "061", embassy: "+34 91-714-6300", embassyName: "British Embassy Madrid", embassyAddress: "Paseo de la Castellana 259D, Madrid" },
          "Italy": { police: "112", ambulance: "118", embassy: "+39 06-4220-0001", embassyName: "British Embassy Rome", embassyAddress: "Via XX Settembre 80a, 00187 Rome" },
          "Germany": { police: "110", ambulance: "112", embassy: "+49 30-204-570", embassyName: "British Embassy Berlin", embassyAddress: "Wilhelmstrasse 70, 10117 Berlin" },
          "USA": { police: "911", ambulance: "911", embassy: "+1 202-588-6500", embassyName: "British Embassy Washington", embassyAddress: "3100 Massachusetts Avenue NW, Washington DC" },
          "Australia": { police: "000", ambulance: "000", embassy: "+61 2-6270-6666", embassyName: "British High Commission Sydney", embassyAddress: "Commonwealth Avenue, Canberra" },
          "Japan": { police: "110", ambulance: "119", embassy: "+81 3-5211-1100", embassyName: "British Embassy Tokyo", embassyAddress: "1 Ichibancho, Chiyoda-ku, Tokyo" },
          "Canada": { police: "911", ambulance: "911", embassy: "+1 613-237-1530", embassyName: "British High Commission Ottawa", embassyAddress: "80 Elgin Street, Ottawa" },
          "Mexico": { police: "066", ambulance: "065", embassy: "+52 55-1670-3200", embassyName: "British Embassy Mexico City", embassyAddress: "Calle Lerma 71, Mexico City" },
        };
        return emergencyData[input.destination] || { police: "Emergency", ambulance: "Emergency", embassy: "Contact local authorities", embassyName: "British Embassy", embassyAddress: "Check your travel documents" };
      }),
  }),

  weather: router({
    getWeather: publicProcedure
      .input(z.object({ destination: z.string(), lat: z.number().optional(), lon: z.number().optional() }))
      .query(async ({ input }) => {
        try {
          const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input.destination)}&count=1&language=en&format=json`);
          const geoData = await res.json();
          if (!geoData.results || geoData.results.length === 0) return null;
          const { latitude, longitude } = geoData.results[0];
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,uv_index&temperature_unit=celsius&timezone=auto`);
          const weather = await weatherRes.json();
          return weather.current;
        } catch (e) {
          console.error("Weather fetch error:", e);
          return null;
        }
      }),
  }),

  currency: router({
    getExchangeRate: publicProcedure
      .input(z.object({ from: z.string().default("GBP"), to: z.string() }))
      .query(async ({ input }) => {
        try {
          const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${input.from}`);
          const data = await res.json();
          if (data.rates && data.rates[input.to]) {
            return { rate: data.rates[input.to], from: input.from, to: input.to, timestamp: new Date() };
          }
          return null;
        } catch (e) {
          console.error("Currency fetch error:", e);
          return null;
        }
      }),
  }),

  intake: router({
    list: adminMiddleware.query(async () => {
      return getIntakeSubmissions();
    }),
    getById: adminMiddleware.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getIntakeSubmissionById(input.id);
    }),
    submit: publicProcedure.input(z.object({
      leadFirstName: z.string(),
      leadLastName: z.string(),
      email: z.string().email(),
      phone: z.string(),
      dateOfBirth: z.string().optional(),
      passportNumber: z.string().optional(),
      passportExpiry: z.string().optional(),
      passportIssuingCountry: z.string().optional(),
      nationality: z.string().optional(),
      address: z.string().optional(),
      destination: z.string(),
      departureAirport: z.string().optional(),
      departureDate: z.string().optional(),
      returnDate: z.string().optional(),
      flexibleDates: z.boolean().optional(),
      numberOfAdults: z.number().optional(),
      numberOfChildren: z.number().optional(),
      childAges: z.string().optional(),
      additionalTravellers: z.any().optional(),
      holidayType: z.string().optional(),
      accommodationType: z.string().optional(),
      boardBasis: z.string().optional(),
      roomType: z.string().optional(),
      budget: z.string().optional(),
      dietaryRequirements: z.string().optional(),
      accessibilityNeeds: z.string().optional(),
      specialOccasion: z.string().optional(),
      otherRequests: z.string().optional(),
      paymentMethod: z.string().optional(),
      heardAboutUs: z.string().optional(),
      agreedToTerms: z.boolean(),
    })).mutation(async ({ input }) => {
      try {
        const result = await createIntakeSubmission(input as any);
        // Send emails (non-blocking)
        sendIntakeFormAdminEmail({ leadFirstName: input.leadFirstName, leadLastName: input.leadLastName, email: input.email, phone: input.phone, destination: input.destination, departureDate: input.departureDate, returnDate: input.returnDate, numberOfAdults: input.numberOfAdults, numberOfChildren: input.numberOfChildren, submissionRef: result.submissionRef, budget: input.budget }).catch(console.error);
        sendIntakeFormConfirmationEmail(input.email, input.leadFirstName, input.destination, result.submissionRef).catch(console.error);
        return { success: true, submissionRef: result.submissionRef };
      } catch (e: any) {
        throw new Error("Failed to save intake form: " + e.message);
      }
    }),
    updateStatus: adminMiddleware.input(z.object({
      id: z.number(),
      status: z.enum(["new", "reviewed", "converted", "archived"]),
      adminNotes: z.string().optional(),
    })).mutation(async ({ input }) => {
      await updateIntakeStatus(input.id, input.status, input.adminNotes);
      return { success: true };
    }),
  }),

  // ─── V6: Booked Destinations CRUD ────────────────────────────────────────────
  destinations: router({
    getAll: adminProcedure.query(async () => getAllBookedDestinations()),
    list: publicProcedure.query(async () => {
      const all = await getAllBookedDestinations();
      return all.filter((d: any) => d.isActive);
    }),
    getActive: publicProcedure.query(async () => {
      const all = await getAllBookedDestinations();
      return all.filter((d: any) => d.isActive);
    }),
    create: adminProcedure
      .input(z.object({ name: z.string(), imageUrl: z.string().optional(), imageBase64: z.string().optional(), imageMimeType: z.string().optional(), lastBooked: z.string().optional(), sortOrder: z.number().optional() }))
      .mutation(async ({ input }) => {
        let imageUrl = input.imageUrl;
        if (input.imageBase64 && !imageUrl) {
          try {
            const { storagePut } = await import('./storage');
            const { nanoid } = await import('nanoid');
            const base64Data = input.imageBase64.replace(/^data:[^;]+;base64,/, ''); // strip data URI prefix
            const buffer = Buffer.from(base64Data, 'base64');
            const mime = input.imageMimeType || 'image/jpeg';
            const ext = mime.split('/')[1]?.split('+')[0] || 'jpg';
            const key = `destinations/${nanoid()}.${ext}`;
            const result = await storagePut(key, buffer, mime);
            imageUrl = result.url;
          } catch (e) {
            console.warn('[Destinations] Image upload failed:', e);
          }
        }
        await createBookedDestination({ name: input.name, imageUrl, lastBooked: input.lastBooked, sortOrder: input.sortOrder });
        return { success: true };
      }),
    update: adminProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), imageUrl: z.string().optional(), lastBooked: z.string().optional(), sortOrder: z.number().optional(), isActive: z.boolean().optional() }))
      .mutation(async ({ input }) => { const { id, ...data } = input; await updateBookedDestination(id, data); return { success: true }; }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteBookedDestination(input.id); return { success: true }; }),
    deleteAll: adminProcedure
      .mutation(async () => { await deleteAllBookedDestinations(); return { success: true }; }),
    fetchImage: adminProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        // Use Wikimedia Commons categories — curated by editors, so images are always
        // actually of the destination (no random wildlife, flags, or satellite maps).
        const baseName = input.name.replace(/,.*/, '').trim();

        const BAD_WORDS = [
          'flag', 'coat', 'logo', 'icon', 'seal', 'emblem', 'map', 'locator',
          'badge', 'crest', 'shield', 'banner', 'heraldry', 'symbol', 'diagram',
          'chart', 'schema', 'plan', 'drawing', 'illustration', 'portrait', 'bust',
          'stamp', 'coin', 'postage', 'currency', 'banknote', 'wappen', 'blason',
          'relief', 'topographic', 'orthographic', 'location', 'administrative',
          'political', 'blank', 'outline', 'weather', 'climate', 'graph',
          'population', 'fire', 'fires', '3d_view', 'satellite',
        ];

        const allImages: { url: string; area: number }[] = [];

        // Helper: fetch files from a Commons category and collect good landscape JPEGs
        const fetchCategoryImages = async (catTitle: string) => {
          const listRes = await fetch(
            `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(catTitle)}&cmtype=file&cmlimit=50&format=json&origin=*`,
            { headers: { 'User-Agent': 'CBTravel/1.0' } }
          );
          const listData = await listRes.json() as any;
          const files: string[] = (listData.query?.categorymembers || []).map((m: any) => m.title as string);
          if (files.length === 0) return;

          // Batch-fetch image info in one round-trip
          const titlesParam = files.slice(0, 40).join('|');
          const infoRes = await fetch(
            `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titlesParam)}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1200&format=json&origin=*`,
            { headers: { 'User-Agent': 'CBTravel/1.0' } }
          );
          const infoData = await infoRes.json() as any;
          const pages = Object.values(infoData.query?.pages || {}) as any[];

          for (const p of pages) {
            const info = p.imageinfo?.[0];
            if (!info) continue;
            const mime: string = info.mime || '';
            if (!mime.includes('jpeg')) continue;
            const w: number = info.thumbwidth || info.width || 0;
            const h: number = info.thumbheight || info.height || 0;
            if (w < 800 || h < 400 || w <= h) continue; // must be landscape and big
            const url: string = info.thumburl || info.url;
            const fname = (p.title || '').toLowerCase();
            if (BAD_WORDS.some(b => fname.includes(b))) continue;
            if (!allImages.find(i => i.url === url)) {
              allImages.push({ url, area: w * h });
            }
          }
        };

        // Try the main destination category + a few travel-specific sub-categories
        const categoriesToTry = [
          `Category:${baseName}`,
          `Category:Tourism in ${baseName}`,
          `Category:Landscapes of ${baseName}`,
          `Category:Beaches of ${baseName}`,
          `Category:Skylines of ${baseName}`,
        ];

        for (const cat of categoriesToTry) {
          await fetchCategoryImages(cat).catch(() => { /* skip missing categories */ });
          if (allImages.length >= 15) break; // enough, stop early
        }

        // Sort largest (most prominent) first, cap at 20
        allImages.sort((a, b) => b.area - a.area);
        const images = allImages.slice(0, 20).map(i => i.url);

        if (images.length === 0) {
          throw new Error(`No suitable travel photos found for "${baseName}" — try uploading one manually`);
        }

        return { images };
      }),
  }),

  // ─── V6: Client Notes ────────────────────────────────────────────────────────
  clientNotes: router({
    get: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => getClientNotes(input.userId)),
    // Alias used by the frontend: trpc.clientNotes.getForClient.useQuery(userId)
    getForClient: adminProcedure
      .input(z.number())
      .query(async ({ input }) => getClientNotes(input)),
    create: adminProcedure
      .input(z.object({ userId: z.number(), note: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const adminUser = await getUserById((ctx as any).user?.id);
        await createClientNote(input.userId, input.note, (ctx as any).user?.id || 0);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteClientNote(input.id); return { success: true }; }),
  }),

  // ─── V6: Loyalty ─────────────────────────────────────────────────────────────
  loyalty: router({
    myAccount: protectedProcedure.query(async ({ ctx }) => {
      const userId = (ctx as any).user?.id;
      if (!userId) return null;
      return getLoyaltyAccount(userId);
    }),
    myTransactions: protectedProcedure.query(async ({ ctx }) => {
      const userId = (ctx as any).user?.id;
      if (!userId) return [];
      return getLoyaltyTransactions(userId);
    }),
    myRedemptions: protectedProcedure.query(async ({ ctx }) => {
      const userId = (ctx as any).user?.id;
      if (!userId) return [];
      return getLoyaltyRedemptions(userId);
    }),
    availableRewards: protectedProcedure.query(async () => getLoyaltyRewards()),
    redeem: protectedProcedure
      .input(z.object({ rewardId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const userId = (ctx as any).user?.id;
        if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
        const result = await redeemLoyaltyReward(userId, input.rewardId);
        return result;
      }),
    // Admin loyalty management
    allAccounts: adminProcedure.query(async () => getAllLoyaltyAccounts()),
    allRewards: adminProcedure.query(async () => getAllLoyaltyRewards()),
    allRedemptions: adminProcedure.query(async () => getLoyaltyRedemptions()),
    createReward: adminProcedure
      .input(z.object({ name: z.string(), description: z.string().optional(), pointsCost: z.number(), rewardType: z.string().optional(), rewardValue: z.string().optional() }))
      .mutation(async ({ input }) => { await createLoyaltyReward(input); return { success: true }; }),
    updateReward: adminProcedure
      .input(z.object({ id: z.coerce.number(), name: z.string().optional(), description: z.string().optional(), pointsCost: z.coerce.number().optional(), isActive: z.boolean().optional() }))
      .mutation(async ({ input }) => { const { id, ...data } = input; await updateLoyaltyReward(id, data); return { success: true }; }),
    addPoints: adminProcedure
      .input(z.object({ userId: z.number(), points: z.number(), description: z.string(), adminNote: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        await addLoyaltyPoints(input.userId, input.points, input.points > 0 ? 'earn' : 'adjustment', input.description, undefined, input.adminNote);
        writeAuditLog({
          actorId: (ctx as any).user?.id,
          actorType: 'admin',
          action: 'loyalty_points_added',
          entityType: 'user',
          entityId: input.userId,
          newValue: { points: input.points, description: input.description, adminNote: input.adminNote },
        }).catch(console.error);
        // Send email notification to user — read balance AFTER mutation via raw SQL
        try {
          const user = await getUserById(input.userId);
          if (user?.email) {
            let currentPoints = input.points;
            let tier = 'bronze';
            try {
              const { getDb } = await import('./db');
              const { sql } = await import('drizzle-orm');
              const db = await getDb();
              if (db) {
                const rows = await db.execute(sql`
                  SELECT la.tier, COALESCE(SUM(lt.points), 0) AS currentPoints
                  FROM loyaltyAccounts la
                  LEFT JOIN loyaltyTransactions lt ON lt.userId = la.userId
                  WHERE la.userId = ${input.userId}
                  GROUP BY la.userId, la.tier
                `);
                const arr = Array.isArray(rows) ? rows : (rows as any).rows || [];
                if (arr[0]) { currentPoints = Number(arr[0].currentPoints) || 0; tier = arr[0].tier || 'bronze'; }
              }
            } catch { /* fall through with defaults */ }
            await sendLoyaltyPointsEmail(user.email, user.name || 'there', input.points, currentPoints, tier, input.description);
          }
        } catch (e) {
          console.error('[addPoints] Failed to send email notification:', e);
        }
        return { success: true };
      }),
    fulfillRedemption: adminProcedure
      .input(z.object({ id: z.number(), adminNote: z.string().optional() }))
      .mutation(async ({ input }) => {
        await fulfillRedemption(input.id, input.adminNote);
        // Send voucher email to customer
        try {
          const db = await (await import('./db')).getDb();
          if (db) {
            const { sql } = await import('drizzle-orm');
            const rows = await db.execute(sql`
              SELECT lr.*, u.email, u.name, lrw.name as rewardName, lrw.description as rewardDesc, lrw.pointsCost
              FROM loyaltyRedemptions lr
              JOIN users u ON lr.userId = u.id
              LEFT JOIN loyaltyRewards lrw ON lr.rewardId = lrw.id
              WHERE lr.id = ${input.id}
            `);
            const arr = Array.isArray(rows) ? rows : (rows as any).rows || [];
            const redemption = arr[0];
            if (redemption?.email && redemption?.voucherCode) {
              const { generateVoucherImage } = await import('./loyalty-voucher');
              const issuedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
              const expiryDate = redemption.expiresAt
                ? new Date(redemption.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
                : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
              const voucherBuffer = await generateVoucherImage({
                voucherCode: redemption.voucherCode,
                clientName: redemption.name || 'Valued Client',
                rewardName: redemption.rewardName || 'Reward',
                rewardDescription: redemption.rewardDesc || undefined,
                pointsSpent: redemption.pointsCost || 0,
                issuedDate,
                expiryDate,
                verifyUrl: 'https://www.travelcb.co.uk/dashboard',
              }).catch(() => null);
              await sendLoyaltyRewardEmail(
                redemption.email,
                redemption.name || 'Valued Client',
                redemption.rewardName || 'Reward',
                redemption.voucherCode,
                voucherBuffer || undefined,
                expiryDate,
              );
            }
          }
        } catch (e) { console.error('Failed to send fulfillment email:', e); }
        return { success: true };
      }),
    cancelRedemption: adminProcedure
      .input(z.object({ id: z.number(), returnPoints: z.boolean().default(true) }))
      .mutation(async ({ input }) => {
        await cancelRedemption(input.id, input.returnPoints);
        // Send cancellation email to customer
        try {
          const db = await (await import('./db')).getDb();
          if (db) {
            const { sql } = await import('drizzle-orm');
            const rows = await db.execute(sql`
              SELECT lr.*, u.email, u.name, lrw.name as rewardName
              FROM loyaltyRedemptions lr
              JOIN users u ON lr.userId = u.id
              LEFT JOIN loyaltyRewards lrw ON lr.rewardId = lrw.id
              WHERE lr.id = ${input.id}
            `);
            const arr = Array.isArray(rows) ? rows : (rows as any).rows || [];
            const redemption = arr[0];
            if (redemption?.email) {
              const { sendRedemptionCancelledEmail } = await import('./emails');
              await sendRedemptionCancelledEmail(
                redemption.email,
                redemption.name || 'Valued Client',
                redemption.rewardName || 'Reward',
                input.returnPoints,
                redemption.pointsSpent || 0,
              );
            }
          }
        } catch (e) { console.error('Failed to send cancellation email:', e); }
        return { success: true };
      }),
    deleteReward: adminProcedure
      .input(z.coerce.number())
      .mutation(async ({ input }) => { await deleteLoyaltyReward(input); return { success: true }; }),
    getLoyaltyStats: adminProcedure.query(async () => getLoyaltyStats()),
    getLeaderboard: adminProcedure.query(async () => {
      // Override db.ts which selects non-existent column 'currentPoints' — actual column is 'points'
      try {
        const { getDb } = await import('./db');
        const { sql } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) return [];
        const rows = await db.execute(sql`
          SELECT la.userId, la.points AS currentPoints, la.lifetimePoints, la.tier,
                 u.name, u.email
          FROM loyaltyAccounts la
          JOIN users u ON u.id = la.userId
          ORDER BY la.lifetimePoints DESC
          LIMIT 10
        `);
        return (rows as any)[0] || [];
      } catch { return getLoyaltyLeaderboard(); }
    }),
    getAllRedemptionsAdmin: adminProcedure.query(async () => getAllRedemptionsAdmin()),
    getTaskCentre: adminProcedure.query(async () => {
      try {
        const { getDb } = await import('./db');
        const { sql } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) return { pendingRedemptions: 0, openTickets: 0, newQuotes: 0, newIntake: 0, pendingBookings: 0 };
        const [[redemptions], [tickets], [quotes], [intake], [bookings]] = await Promise.all([
          db.execute(sql`SELECT COUNT(*) as count FROM loyaltyRedemptions WHERE status = 'active'`),
          db.execute(sql`SELECT COUNT(*) as count FROM supportTickets WHERE status = 'open'`),
          db.execute(sql`SELECT COUNT(*) as count FROM quoteRequests WHERE status = 'new'`),
          db.execute(sql`SELECT COUNT(*) as count FROM bookingIntakeForms WHERE status = 'new'`),
          db.execute(sql`SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'`),
        ]);
        const extract = (r: any) => {
          const arr = Array.isArray(r) ? r : (r as any).rows || [];
          return Number(arr[0]?.count ?? 0);
        };
        return {
          pendingRedemptions: extract(redemptions),
          openTickets: extract(tickets),
          newQuotes: extract(quotes),
          newIntake: extract(intake),
          pendingBookings: extract(bookings),
        };
      } catch (e) {
        console.error('Task centre query failed:', e);
        return { pendingRedemptions: 0, openTickets: 0, newQuotes: 0, newIntake: 0, pendingBookings: 0 };
      }
    }),
    deductPoints: adminProcedure
      .input(z.object({ userId: z.number(), points: z.number().positive(), description: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await addLoyaltyPoints(input.userId, -Math.abs(input.points), 'adjustment', input.description);
        writeAuditLog({
          actorId: (ctx as any).user?.id,
          actorType: 'admin',
          action: 'loyalty_points_deducted',
          entityType: 'user',
          entityId: input.userId,
          newValue: { points: input.points, description: input.description },
        }).catch(console.error);
        return { success: true };
      }),
    toggleMultiplierEvent: adminProcedure
      .input(z.object({ active: z.boolean(), multiplier: z.number().optional(), label: z.string().optional() }))
      .mutation(async ({ input }) => {
        await setAppSetting('points_multiplier_active', input.active ? 'true' : 'false');
        if (input.multiplier) await setAppSetting('points_multiplier_value', String(input.multiplier));
        if (input.label) await setAppSetting('points_multiplier_label', input.label);
        return { success: true };
      }),
    getMultiplierEvent: publicProcedure.query(async () => {
      const active = (await getAppSetting('points_multiplier_active')) === 'true';
      const multiplier = parseFloat((await getAppSetting('points_multiplier_value')) || '2');
      const label = (await getAppSetting('points_multiplier_label')) || 'Double Points Event';
      return { active, multiplier, label };
    }),
    getLoyaltyRules: adminProcedure.query(async () => {
      return await getLoyaltyRules();
    }),
    updateLoyaltyRule: adminProcedure
      .input(z.object({
        id: z.number(),
        points: z.number().min(0).max(10000).optional(),
        isActive: z.boolean().optional(),
        label: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateLoyaltyRule(id, data);
        return { success: true };
      }),
  }),

  // ─── V6: Feedback ────────────────────────────────────────────────────────────
  feedback: router({
    submit: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        overallRating: z.number().min(1).max(5),
        destinationRating: z.number().min(1).max(5),
        serviceRating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = (ctx as any).user?.id;
        if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
        const existing = await getBookingFeedback(input.bookingId);
        if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Feedback already submitted for this booking" });
        await createBookingFeedback({ ...input, userId });
        // Loyalty points for feedback (configurable)
        const feedbackRule = await getPointsForEvent('feedback_submission');
        if (feedbackRule.isActive && feedbackRule.points > 0) {
          await addLoyaltyPoints(userId, feedbackRule.points, 'earn', 'Feedback submitted', input.bookingId);
        }
        // Generate promo code
        const promoCode = `THANKS-${userId}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
        const { getDb } = await import("./db");
        const { sql } = await import("drizzle-orm");
        const db = await getDb();
        if (db) {
          await db.execute(sql`INSERT IGNORE INTO promoCodes (code, description, discountAmount, codeType, issuedToUserId, isActive, expiresAt) VALUES (${promoCode}, ${'Thank you for your feedback — £5 off your next booking'}, ${'5.00'}, ${'manual'}, ${userId}, ${true}, ${new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)})`);
        }
        const user = await getUserById(userId);
        if (user?.email) {
          sendFeedbackPromoEmail(user.email, user.name || 'Valued Client', promoCode, 5).catch(console.error);
        }
        return { success: true, promoCode };
      }),
    getByBooking: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => getBookingFeedback(input)),
    adminGetAll: adminProcedure.query(async () => getAllFeedback()),
  }),

  // ─── V6: Referral ────────────────────────────────────────────────────────────
  referral: router({
    getAdminStats: adminProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return { referrers: [], totalReferrals: 0 };

      // Get all users with a referral code
      const rows = await db.execute(sql`
        SELECT
          u.id,
          u.name,
          u.email,
          u.referralCode,
          COUNT(DISTINCT lt.userId) AS referralCount,
          COALESCE(SUM(CASE WHEN lt.description LIKE 'Referral:%' THEN lt.points ELSE 0 END), 0) AS pointsEarned
        FROM users u
        LEFT JOIN loyaltyTransactions lt
          ON lt.userId = u.id
          AND lt.description LIKE 'Referral:%'
        WHERE u.referralCode IS NOT NULL AND u.referralCode != ''
        GROUP BY u.id, u.name, u.email, u.referralCode
        ORDER BY referralCount DESC, u.name ASC
      `);

      // Count users who joined via referral (have "Joined via referral link" transaction)
      const joinedRows = await db.execute(sql`
        SELECT COUNT(DISTINCT userId) AS cnt FROM loyaltyTransactions WHERE description = 'Joined via referral link'
      `);

      const referrers = (Array.isArray(rows) ? rows : (rows as any).rows || []).map((r: any) => ({
        id: Number(r.id),
        name: r.name || '',
        email: r.email || '',
        referralCode: r.referralCode || '',
        referralCount: Number(r.referralCount) || 0,
        pointsEarned: Number(r.pointsEarned) || 0,
      }));

      const joinedArr = Array.isArray(joinedRows) ? joinedRows : (joinedRows as any).rows || [];
      const totalReferrals = Number(joinedArr[0]?.cnt || 0);

      return { referrers, totalReferrals };
    }),
    getMyCode: protectedProcedure.query(async ({ ctx }) => {
      const userId = (ctx as any).user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const code = await ensureReferralCode(userId);
      return { code, link: `${process.env.SITE_URL || 'https://www.travelcb.co.uk'}/refer/${code}` };
    }),
    validate: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        const referrer = await getUserByReferralCode(input);
        return referrer ? { valid: true, referrerName: referrer.name } : { valid: false };
      }),
    complete: protectedProcedure
      .input(z.object({ referralCode: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const userId = (ctx as any).user?.id;
        if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
        const referrer = await getUserByReferralCode(input.referralCode);
        if (!referrer) return { success: false };
        const newUser = await getUserById(userId);
        // Points to referrer (configurable)
        const referralReferrerRule = await getPointsForEvent('referral_referrer');
        if (referralReferrerRule.isActive && referralReferrerRule.points > 0) {
          await addLoyaltyPoints(referrer.id, referralReferrerRule.points, 'earn', `Referral: ${newUser?.name || 'new client'} signed up`);
        }
        // Points to new user (configurable)
        const referralNewUserRule = await getPointsForEvent('referral_new_user');
        if (referralNewUserRule.isActive && referralNewUserRule.points > 0) {
          await addLoyaltyPoints(userId, referralNewUserRule.points, 'earn', 'Joined via referral link');
        }
        // Promo codes
        const refPromo = `REF-REWARD-${referrer.id}-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
        const newPromo = `REF-WELCOME-${userId}-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
        const { getDb } = await import("./db");
        const { sql } = await import("drizzle-orm");
        const db = await getDb();
        if (db) {
          await db.execute(sql`INSERT IGNORE INTO promoCodes (code, description, discountAmount, codeType, issuedToUserId, isActive, expiresAt) VALUES (${refPromo}, ${'Referral reward — £15 off'}, ${'15.00'}, ${'manual'}, ${referrer.id}, ${true}, ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)})`);
          await db.execute(sql`INSERT IGNORE INTO promoCodes (code, description, discountAmount, codeType, issuedToUserId, isActive, expiresAt) VALUES (${newPromo}, ${'Welcome referral discount — £10 off'}, ${'10.00'}, ${'manual'}, ${userId}, ${true}, ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)})`);
        }
        if (referrer.email) sendReferralPromoEmail(referrer.email, referrer.name || 'Valued Client', refPromo, newUser?.name || 'a new client').catch(console.error);
        if (newUser?.email) sendReferralWelcomeEmail(newUser.email, newUser.name || 'Valued Client', newPromo).catch(console.error);
        return { success: true };
      }),

    // Client can see who they referred
    getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
      const userId = (ctx as any).user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getClientReferrals(userId);
    }),
  }),

  // ─── V6: Audit Logs ──────────────────────────────────────────────────────────
  auditLogs: router({
    get: adminProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        // Override db.ts which returns (rows)[0] — wrong for most drivers (returns first row not full array)
        try {
          const { getDb } = await import('./db');
          const { sql } = await import('drizzle-orm');
          const db = await getDb();
          if (!db) return [];
          const lim = input?.limit || 500;
          const rows = await db.execute(sql`
            SELECT al.*, u.name AS actorName, u.email AS actorEmail
            FROM auditLogs al
            LEFT JOIN users u ON al.actorId = u.id
            ORDER BY al.createdAt DESC
            LIMIT ${lim}
          `);
          return (rows as any)[0] || [];
        } catch { return getAuditLogs(input?.limit || 500); }
      }),
  }),

  // ─── V6: Newsletter (extended) ────────────────────────────────────────────────
  newsletterV6: router({
    subscribe: publicProcedure
      .input(z.object({ email: z.string().email(), name: z.string().optional() }))
      .mutation(async ({ input }) => {
        await subscribeNewsletterV6(input.email, input.name);
        return { success: true };
      }),
    unsubscribe: publicProcedure
      .input(z.string())
      .mutation(async ({ input }) => { await unsubscribeNewsletter(input); return { success: true }; }),
    getSubscribers: adminProcedure.query(async () => getNewsletterSubscribers(false)),
    getCampaigns: adminProcedure.query(async () => getCampaigns()),
    createCampaign: adminProcedure
      .input(z.object({ subject: z.string(), htmlBody: z.string(), scheduledAt: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const id = await createCampaign({ subject: input.subject, htmlBody: input.htmlBody, scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined, createdBy: (ctx as any).user?.id });
        return { success: true, id };
      }),
    sendCampaign: adminProcedure
      .input(z.object({ campaignId: z.number() }))
      .mutation(async ({ input }) => {
        const campaigns = await getCampaigns();
        const campaign = campaigns.find((c: any) => c.id === input.campaignId);
        if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
        const subscribers = await getNewsletterSubscribers(true);
        let sent = 0;
        for (const sub of subscribers) {
          try {
            await sendCampaignEmail(sub.email, campaign.subject, campaign.htmlBody, sub.unsubscribeToken || sub.id.toString());
            sent++;
          } catch (e) { console.error(`Campaign send failed for ${sub.email}:`, e); }
        }
        await markCampaignSent(input.campaignId, sent);
        return { success: true, sent };
      }),
  }),

  // ─── V6: AI (Groq) ───────────────────────────────────────────────────────────
  ai: router({
    generateItinerary: protectedProcedure
      .input(z.object({
        destination: z.string(),
        duration: z.number().min(1).max(30),
        travelStyle: z.enum(['relaxing', 'adventurous', 'cultural', 'family']),
        interests: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        const aiEnabled = (await getAppSetting('ai_features_enabled')) !== 'false';
        if (!aiEnabled) throw new TRPCError({ code: "BAD_REQUEST", message: "AI features are currently disabled." });
        const apiKey = process.env.GROQ_API_KEY || (await getAppSetting('groq_api_key'));
        if (!apiKey) throw new TRPCError({ code: "BAD_REQUEST", message: "AI not configured. Please contact support." });
        const prompt = `You are a luxury travel expert at CB Travel (UK travel agency). Create a detailed ${input.duration}-day itinerary for ${input.destination}.

Travel style: ${input.travelStyle}
Interests: ${input.interests.join(', ')}

Return a JSON response with this structure:
{
  "destination": "${input.destination}",
  "duration": ${input.duration},
  "summary": "Brief overview",
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "morning": "Morning activity description",
      "afternoon": "Afternoon activity description",
      "evening": "Evening activity/dinner suggestion",
      "tip": "Practical tip for the day"
    }
  ],
  "practicalTips": ["tip1", "tip2", "tip3"],
  "bestTimeToVisit": "When to go",
  "localCurrency": "Currency name",
  "language": "Local language"
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`;

        const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 4096,
          }),
        });
        if (!resp.ok) {
          const err = await resp.text();
          console.error("[AI] Groq error:", err);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI service error. Please try again." });
        }
        const data = await resp.json() as any;
        const text = data.choices?.[0]?.message?.content || "";
        if (!text) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
        return JSON.parse(cleaned);
      }),

    askFaq: publicProcedure
      .input(z.object({
        question: z.string(),
        conversationHistory: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
      }))
      .mutation(async ({ input }) => {
        const aiEnabled = (await getAppSetting('ai_features_enabled')) !== 'false';
        if (!aiEnabled) return { answer: "Our team is here to help! Please email hello@travelcb.co.uk or call 07495 823953.", canAnswer: false };
        const apiKey = process.env.GROQ_API_KEY || (await getAppSetting('groq_api_key'));
        if (!apiKey) return { answer: "Please contact us at hello@travelcb.co.uk or call 07495 823953.", canAnswer: false };
        const faqItems = await getAllFaqItemsForAI();
        const faqContext = faqItems.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
        const systemPrompt = `You are a helpful assistant for CB Travel, a UK travel agency based at travelcb.co.uk. Answer questions helpfully and concisely based on the FAQ data below.

If you cannot answer confidently from the FAQ data, suggest the user emails hello@travelcb.co.uk or calls 07495 823953.

Key facts:
- Company: CB Travel
- Email: hello@travelcb.co.uk
- Phone: 07495 823953
- Website: travelcb.co.uk

FAQ Data:
${faqContext}`;

        const conversationContext = (input.conversationHistory || [])
          .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n');
        const userMsg = `${conversationContext ? 'Previous conversation:\n' + conversationContext + '\n\n' : ''}User question: ${input.question}`;

        const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMsg },
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });
        if (!resp.ok) {
          console.error("[AI] Groq error:", await resp.text());
          return { answer: "Please contact us at hello@travelcb.co.uk or call 07495 823953.", canAnswer: false };
        }
        const data = await resp.json() as any;
        const answer = data.choices?.[0]?.message?.content || "Please contact us at hello@travelcb.co.uk";
        return { answer, canAnswer: true };
      }),

    // Public itinerary tool — log access
    logItineraryAccess: publicProcedure
      .input(z.object({
        agencyName: z.string().optional(),
        agencyTagline: z.string().optional(),
        destination: z.string().optional(),
        eventType: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { getDb } = await import('./db');
          const { sql } = await import('drizzle-orm');
          const db = await getDb();
          if (!db) return { success: true };
          // Ensure table exists
          await db.execute(sql`CREATE TABLE IF NOT EXISTS itineraryAccessLog (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ipAddress VARCHAR(45),
            agencyName VARCHAR(255),
            agencyTagline VARCHAR(500),
            destination VARCHAR(255),
            userAgent TEXT,
            eventType VARCHAR(50) DEFAULT 'access',
            accessedAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);
          const ip = (ctx as any).req?.headers['x-forwarded-for'] as string || (ctx as any).req?.socket?.remoteAddress || 'unknown';
          const ua = (ctx as any).req?.headers['user-agent'] as string || '';
          const evType = input.eventType || 'access';
          await db.execute(sql`INSERT INTO itineraryAccessLog (ipAddress, agencyName, agencyTagline, destination, userAgent, eventType) VALUES (${ip}, ${input.agencyName || null}, ${input.agencyTagline || null}, ${input.destination || null}, ${ua}, ${evType})`);
        } catch(e) { console.error('Failed to log itinerary access:', e); }
        return { success: true };
      }),

    // Public: verify itinerary password
    verifyItineraryPassword: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input }) => {
        const storedPassword = (await getAppSetting('itinerary_password')) || 'CBTRAVEL2025';
        return { valid: input.password === storedPassword };
      }),

    // Admin: get current itinerary password
    getItineraryPassword: adminMiddleware.query(async () => {
      const password = (await getAppSetting('itinerary_password')) || 'CBTRAVEL2025';
      return { password };
    }),

    // Admin: set itinerary password
    setItineraryPassword: adminMiddleware
      .input(z.object({ password: z.string().min(6) }))
      .mutation(async ({ input }) => {
        await setAppSetting('itinerary_password', input.password);
        return { success: true };
      }),

    // Admin: get access logs
    getItineraryAccessLogs: adminMiddleware.query(async () => {
      try {
        const { getDb } = await import('./db');
        const { sql } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) return [];
        // Ensure table exists before querying
        await db.execute(sql`CREATE TABLE IF NOT EXISTS itineraryAccessLog (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ipAddress VARCHAR(45),
          agencyName VARCHAR(255),
          agencyTagline VARCHAR(500),
          destination VARCHAR(255),
          userAgent TEXT,
          eventType VARCHAR(50) DEFAULT 'access',
          accessedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        const rows = await db.execute(sql`SELECT * FROM itineraryAccessLog ORDER BY accessedAt DESC LIMIT 500`);
        return (rows as any)[0] || [];
      } catch(e) { console.error('getItineraryAccessLogs error:', e); return []; }
    }),
  }),

  // ─── V6: QR Codes ────────────────────────────────────────────────────────────
  qr: router({
    generate: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input, ctx }) => {
        const userId = (ctx as any).user?.id;
        const isAdmin = (ctx as any).user?.role === 'admin';
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (!isAdmin && booking.clientId !== userId) throw new TRPCError({ code: "FORBIDDEN" });
        const QRCode = await import("qrcode");
        const url = `${process.env.SITE_URL || 'https://www.travelcb.co.uk'}/dashboard`;
        const dataUrl = await QRCode.default.toDataURL(url, { width: 300, margin: 2, color: { dark: '#1e3a5f', light: '#ffffff' } });
        return { dataUrl, url };
      }),
  }),

  // ─── V6: SOS ─────────────────────────────────────────────────────────────────
  sos: router({
    trigger: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const userId = (ctx as any).user?.id;
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (booking.clientId !== userId) throw new TRPCError({ code: "FORBIDDEN" });
        const user = await getUserById(userId);
        await sendSOSAlertEmail({
          clientName: user?.name || 'Unknown Client',
          bookingRef: booking.bookingReference,
          destination: booking.destination || 'Unknown',
          clientEmail: user?.email || undefined,
          timestamp: new Date(),
        });
        await writeAuditLog({
          actorId: userId, actorType: 'client',
          action: 'sos_triggered', entityType: 'booking', entityId: input.bookingId,
          newValue: { destination: booking.destination, bookingRef: booking.bookingReference },
        });
        return { success: true };
      }),
  }),

  // ─── V6: Booking notifications toggle ────────────────────────────────────────
  bookingNotifications: router({
    toggle: adminProcedure
      .input(z.object({ bookingId: z.number(), enabled: z.boolean() }))
      .mutation(async ({ input }) => {
        await setNotificationsEnabled(input.bookingId, input.enabled);
        return { success: true };
      }),
  }),

  // ─── V6: Profile (date of birth) ─────────────────────────────────────────────
  profileV6: router({
    setDateOfBirth: protectedProcedure
      .input(z.object({ dateOfBirth: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const userId = (ctx as any).user?.id;
        if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
        await setUserDateOfBirth(userId, input.dateOfBirth);
        return { success: true };
      }),
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      const userId = (ctx as any).user?.id;
      if (!userId) return null;
      const user = await getUserById(userId);
      return user;
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1).optional(),
        phone: z.string().optional(),
        dateOfBirth: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = (ctx as any).user?.id;
        if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const { getDb } = await import('./db');
        const { sql } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        if (input.name !== undefined) {
          await db.execute(sql`UPDATE users SET name = ${input.name} WHERE id = ${userId}`);
        }
        if (input.phone !== undefined) {
          await db.execute(sql`UPDATE users SET phone = ${input.phone || null} WHERE id = ${userId}`);
        }
        if (input.dateOfBirth !== undefined) {
          await setUserDateOfBirth(userId, input.dateOfBirth);
        }
        // Audit log
        try {
          const fields = Object.keys(input).filter(k => (input as any)[k] !== undefined).join(', ');
          writeAuditLog({ actorId: userId, actorType: 'client', action: 'profile_updated', entityType: 'user', entityId: userId, newValue: { fields } });
        } catch {}
        return { success: true };
      }),
    updateMyPassport: protectedProcedure
      .input(z.object({
        passportNumber: z.string().nullable().optional(),
        passportExpiry: z.string().nullable().optional(),
        passportIssueDate: z.string().nullable().optional(),
        passportIssuingCountry: z.string().nullable().optional(),
        passportNationality: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = (ctx as any).user?.id;
        if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const { getDb } = await import('./db');
        const { sql } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db.execute(sql`UPDATE users SET 
          passportNumber = ${input.passportNumber ?? null},
          passportExpiry = ${input.passportExpiry ?? null},
          passportIssueDate = ${input.passportIssueDate ?? null},
          passportIssuingCountry = ${input.passportIssuingCountry ?? null},
          passportNationality = ${input.passportNationality ?? null}
          WHERE id = ${userId}`);
        try {
          writeAuditLog({ actorId: userId, actorType: 'client', action: 'passport_updated', entityType: 'user', entityId: userId, newValue: { updated: true } });
        } catch {}
        return { success: true };
      }),
  }),

  // ─── V7: Support Tickets ──────────────────────────────────────────────────
  support: router({
    // Customer: create a new ticket
    create: protectedProcedure
      .input(z.object({
        subject: z.string().min(1).max(255),
        ticketType: z.enum(["general_enquiry","request_extra","complaint","other"]),
        message: z.string().min(1),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        return createSupportTicket({ ...input, userId: ctx.user.id });
      }),

    // Customer: get own tickets
    myTickets: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getSupportTicketsByUserId(ctx.user.id);
    }),

    // Customer: get single ticket (own only)
    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const ticket = await getSupportTicketById(input);
        if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
        if (ticket.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return ticket;
      }),

    // Customer: reply to own ticket
    reply: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
        message: z.string().min(1),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const ticket = await getSupportTicketById(input.ticketId);
        if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
        if (ticket.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return addTicketMessage({ ...input, userId: ctx.user.id, isAdmin: false });
      }),

    // Customer: get ticket messages
    getMessages: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const ticket = await getSupportTicketById(input);
        if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
        if (ticket.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getTicketMessages(input);
      }),

    // Admin: get all tickets
    adminGetAll: adminMiddleware.query(() => getAllSupportTickets()),

    // Admin: update ticket status
    adminUpdateStatus: adminMiddleware
      .input(z.object({ ticketId: z.number(), status: z.enum(["open","in_progress","resolved"]) }))
      .mutation(async ({ input }) => {
        await updateSupportTicketStatus(input.ticketId, input.status);
        return { success: true };
      }),

    // Admin: reply to ticket + notify customer
    adminReply: adminMiddleware
      .input(z.object({
        ticketId: z.number(),
        message: z.string().min(1),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
        newStatus: z.enum(["open","in_progress","resolved"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ticket = await getSupportTicketById(input.ticketId);
        if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
        const adminUserId = (ctx as any).user?.id;
        const msg = await addTicketMessage({
          ticketId: input.ticketId,
          userId: adminUserId,
          message: input.message,
          fileUrl: input.fileUrl,
          fileKey: input.fileKey,
          isAdmin: true,
        });
        if (input.newStatus) {
          await updateSupportTicketStatus(input.ticketId, input.newStatus);
        }
        // Send email notification to customer
        if (ticket.userEmail) {
          sendTicketReplyEmail(ticket.userEmail, ticket.userName || "there", ticket.subject, input.message, input.ticketId).catch(console.error);
        }
        return msg;
      }),
  }),

  // ─── V7: Group Bookings / Travel Party ───────────────────────────────────
  travelParty: router({
    // Customer / Admin: get members for a booking
    getMembers: protectedProcedure
      .input(z.number())
      .query(({ input }) => getBookingMembers(input)),

    // Customer: invite another registered user by email to a booking they own
    addMemberByEmail: protectedProcedure
      .input(z.object({ bookingId: z.number(), email: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        // Verify requester owns the booking
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        const userBookings = await getClientBookings(ctx.user.id);
        const ownsBooking = userBookings.some((b: any) => b.id === input.bookingId);
        if (!ownsBooking && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this booking." });
        }
        const invitee = await getUserByEmail(input.email);
        if (!invitee) throw new TRPCError({ code: "NOT_FOUND", message: "No account found with that email address." });
        if (invitee.id === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot add yourself." });
        await addBookingMember(input.bookingId, invitee.id, ctx.user.id);
        return { success: true, userName: invitee.name };
      }),

    // Customer: remove a member from own booking
    removeMember: protectedProcedure
      .input(z.object({ bookingId: z.number(), userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const userBookings = await getClientBookings(ctx.user.id);
        const ownsBooking = userBookings.some((b: any) => b.id === input.bookingId);
        if (!ownsBooking && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await removeBookingMember(input.bookingId, input.userId);
        return { success: true };
      }),

    // Customer: get bookings shared with me
    mySharedBookings: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getSharedBookingsByUserId(ctx.user.id);
    }),

    // Admin: add member by email to any booking
    adminAddMember: adminMiddleware
      .input(z.object({ bookingId: z.number(), email: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        const adminId = (ctx as any).user?.id;
        const invitee = await getUserByEmail(input.email);
        if (!invitee) throw new TRPCError({ code: "NOT_FOUND", message: "No account found with that email address." });
        await addBookingMember(input.bookingId, invitee.id, adminId);
        return { success: true, userName: invitee.name };
      }),

    // Admin: remove member from any booking
    adminRemoveMember: adminMiddleware
      .input(z.object({ bookingId: z.number(), userId: z.number() }))
      .mutation(async ({ input }) => {
        await removeBookingMember(input.bookingId, input.userId);
        return { success: true };
      }),
  }),

  activities: activitiesRouter,

  adminQuotes: router({
    // ─── Admin: list all quotes ───────────────────────────────────────────
    list: adminMiddleware.query(async () => {
      const { getAllAdminQuotes } = await import("./db");
      return getAllAdminQuotes();
    }),

    // ─── Admin: get single quote ─────────────────────────────────────────
    getById: adminMiddleware
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getAdminQuoteById } = await import("./db");
        return getAdminQuoteById(input.id);
      }),

    // ─── Admin: create quote (draft) ─────────────────────────────────────
    create: adminMiddleware
      .input(z.object({
        clientName: z.string().min(1),
        clientEmail: z.string().email(),
        clientPhone: z.string().optional().nullable(),
        userId: z.number().optional().nullable(),
        destination: z.string().optional().nullable(),
        departureDate: z.string().optional().nullable(),
        returnDate: z.string().optional().nullable(),
        numberOfTravelers: z.number().optional().nullable(),
        hotels: z.string().optional().nullable(),
        flightDetails: z.string().optional().nullable(),
        keyInclusions: z.string().optional().nullable(),
        totalPrice: z.string().optional().nullable(),
        pricePerPerson: z.string().optional().nullable(),
        priceBreakdown: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        documentUrl: z.string().optional().nullable(),
        documentKey: z.string().optional().nullable(),
        quoteRef: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createAdminQuote } = await import("./db");
        const result = await createAdminQuote({
          ...input,
          createdBy: (ctx.user as any).id,
        });
        return result;
      }),

    // ─── Admin: update quote ──────────────────────────────────────────────
    update: adminMiddleware
      .input(z.object({
        id: z.number(),
        clientName: z.string().optional(),
        clientEmail: z.string().email().optional(),
        clientPhone: z.string().nullable().optional(),
        userId: z.number().nullable().optional(),
        destination: z.string().nullable().optional(),
        departureDate: z.string().nullable().optional(),
        returnDate: z.string().nullable().optional(),
        numberOfTravelers: z.number().nullable().optional(),
        hotels: z.string().nullable().optional(),
        flightDetails: z.string().nullable().optional(),
        keyInclusions: z.string().nullable().optional(),
        totalPrice: z.string().nullable().optional(),
        pricePerPerson: z.string().nullable().optional(),
        priceBreakdown: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        status: z.enum(["draft","sent","viewed","accepted","expired","intake_submitted","converted"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateAdminQuote } = await import("./db");
        const { id, ...rest } = input;
        await updateAdminQuote(id, rest as any);
        return { success: true };
      }),

    // ─── Admin: send quote (email + mark as sent) ─────────────────────────
    send: adminMiddleware
      .input(z.object({
        id: z.number(),
        previewOnly: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getAdminQuoteById, updateAdminQuote } = await import("./db");
        const quote = await getAdminQuoteById(input.id);
        if (!quote) throw new Error("Quote not found");

        const quoteLink = `${process.env.SITE_URL || "https://www.travelcb.co.uk"}/quote/${quote.quoteRef}`;
        const firstName = (quote.clientName || "").split(" ")[0] || "Valued Client";

        if (input.previewOnly) {
          return {
            preview: {
              to: quote.clientEmail,
              subject: `Your Tailored Travel Quote – ${quote.destination || "Your Journey"} | CB Travel`,
              firstName,
              destination: quote.destination,
              totalPrice: quote.totalPrice,
              quoteRef: quote.quoteRef,
              quoteLink,
              departureDate: quote.departureDate,
              returnDate: quote.returnDate,
              expiresAt: quote.expiresAt,
            }
          };
        }

        const { sendAdminQuoteEmail } = await import("./emails");
        const result = await sendAdminQuoteEmail(
          quote.clientEmail,
          firstName,
          quote.destination || "Your Destination",
          quote.quoteRef,
          quote.totalPrice ? `£${parseFloat(quote.totalPrice).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
          quoteLink,
          quote.departureDate,
          quote.returnDate,
          quote.expiresAt,
        );

        if (result.success) {
          const sentAt = new Date();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
          await updateAdminQuote(input.id, { status: "sent", sentAt, expiresAt });
        }

        return { success: result.success, error: result.error };
      }),

    // ─── Admin: resend quote ──────────────────────────────────────────────
    resend: adminMiddleware
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { getAdminQuoteById, updateAdminQuote } = await import("./db");
        const quote = await getAdminQuoteById(input.id);
        if (!quote) throw new Error("Quote not found");

        const quoteLink = `${process.env.SITE_URL || "https://www.travelcb.co.uk"}/quote/${quote.quoteRef}`;
        const firstName = (quote.clientName || "").split(" ")[0] || "Valued Client";

        const { sendAdminQuoteEmail } = await import("./emails");
        const result = await sendAdminQuoteEmail(
          quote.clientEmail, firstName,
          quote.destination || "Your Destination",
          quote.quoteRef,
          quote.totalPrice ? `£${parseFloat(quote.totalPrice).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
          quoteLink, quote.departureDate, quote.returnDate, quote.expiresAt,
        );

        if (result.success) {
          const sentAt = new Date();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
          await updateAdminQuote(input.id, { status: "sent", sentAt, expiresAt });
        }

        return { success: result.success, error: result.error };
      }),

    // ─── Admin: duplicate quote ───────────────────────────────────────────
    duplicate: adminMiddleware
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getAdminQuoteById, createAdminQuote } = await import("./db");
        const quote = await getAdminQuoteById(input.id);
        if (!quote) throw new Error("Quote not found");
        return createAdminQuote({
          clientName: quote.clientName,
          clientEmail: quote.clientEmail,
          clientPhone: quote.clientPhone,
          userId: quote.userId,
          destination: quote.destination,
          departureDate: quote.departureDate,
          returnDate: quote.returnDate,
          numberOfTravelers: quote.numberOfTravelers,
          hotels: quote.hotels,
          flightDetails: quote.flightDetails,
          keyInclusions: quote.keyInclusions,
          totalPrice: quote.totalPrice,
          pricePerPerson: quote.pricePerPerson,
          priceBreakdown: quote.priceBreakdown,
          notes: quote.notes,
          createdBy: (ctx.user as any).id,
        });
      }),

    // ─── Admin: delete quote ──────────────────────────────────────────────
    delete: adminMiddleware
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteAdminQuote } = await import("./db");
        await deleteAdminQuote(input.id);
        return { success: true };
      }),

    // ─── Public: get quote by reference (for portal page) ─────────────────
    getByRef: publicProcedure
      .input(z.object({ ref: z.string() }))
      .query(async ({ input }) => {
        const { getAdminQuoteByRef } = await import("./db");
        const quote = await getAdminQuoteByRef(input.ref);
        if (!quote) return null;
        // Return limited data for public access (no internal notes etc)
        return {
          id: quote.id,
          quoteRef: quote.quoteRef,
          clientName: quote.clientName,
          clientEmail: quote.clientEmail,
          destination: quote.destination,
          departureDate: quote.departureDate,
          returnDate: quote.returnDate,
          numberOfTravelers: quote.numberOfTravelers,
          hotels: quote.hotels,
          flightDetails: quote.flightDetails,
          keyInclusions: quote.keyInclusions,
          totalPrice: quote.totalPrice,
          pricePerPerson: quote.pricePerPerson,
          priceBreakdown: quote.priceBreakdown,
          status: quote.status,
          viewCount: quote.viewCount,
          lastViewedAt: quote.lastViewedAt,
          sentAt: quote.sentAt,
          acceptedAt: quote.acceptedAt,
          expiresAt: quote.expiresAt,
          createdAt: quote.createdAt,
        };
      }),

    // ─── Public: track quote view ──────────────────────────────────────────
    trackView: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { incrementAdminQuoteView } = await import("./db");
        await incrementAdminQuoteView(input.id);
        return { success: true };
      }),

    // ─── Protected: accept quote ──────────────────────────────────────────
    accept: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getAdminQuoteById, updateAdminQuote } = await import("./db");
        const quote = await getAdminQuoteById(input.id);
        if (!quote) throw new Error("Quote not found");
        if (quote.status === "expired") throw new Error("This quote has expired");
        if (quote.status === "accepted") return { success: true };
        await updateAdminQuote(input.id, { status: "accepted", acceptedAt: new Date() });
        return { success: true };
      }),

    // ─── Protected: get my quotes (client dashboard) ──────────────────────
    myAdminQuotes: protectedProcedure.query(async ({ ctx }) => {
      const { getAdminQuotesByEmail, getAdminQuotesByUserId } = await import("./db");
      const user = ctx.user as any;
      // Get by userId first, then also by email (in case userId wasn't linked at send time)
      const byUserId = user.id ? await getAdminQuotesByUserId(user.id) : [];
      const byEmail = user.email ? await getAdminQuotesByEmail(user.email) : [];
      // Merge, deduplicate by id
      const seen = new Set<number>();
      const all = [...byUserId, ...byEmail].filter(q => {
        if (seen.has(q.id)) return false;
        seen.add(q.id);
        return true;
      });
      // Sort by createdAt desc
      return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }),

    // ─── Admin: get stats for command centre ─────────────────────────────
    stats: adminMiddleware.query(async () => {
      const { getAllAdminQuotes } = await import("./db");
      const all = await getAllAdminQuotes();
      const sent = all.filter((q: any) => q.status === "sent").length;
      const viewed = all.filter((q: any) => q.status === "viewed").length;
      const accepted = all.filter((q: any) => q.status === "accepted").length;
      const total = all.length;
      const conversionRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
      const awaitingResponse = all.filter((q: any) => ["sent","viewed"].includes(q.status)).length;
      return { total, sent, viewed, accepted, conversionRate, awaitingResponse };
    }),

    // ─── Mark intake submitted (client completed intake form via quote link) ──
    markIntakeSubmitted: adminMiddleware
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { updateAdminQuote } = await import('./db');
        await updateAdminQuote(input.id, { status: 'intake_submitted' as any });
        return { success: true };
      }),

    // ─── Convert accepted quote to booking ────────────────────────────────
    convertToBooking: adminMiddleware
      .input(z.object({
        id: z.number(),
        approve: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getAdminQuoteById, updateAdminQuote, createBooking, getUserByEmail } = await import('./db');
        const quote = await getAdminQuoteById(input.id);
        if (!quote) throw new Error('Quote not found');

        if (!input.approve) {
          // Rejected — just update status back to accepted
          await updateAdminQuote(input.id, { status: 'accepted' });
          return { success: true, approved: false };
        }

        // Create a booking from the quote
        const ref = `CB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const clientId = quote.userId || (quote.clientEmail ? (await getUserByEmail(quote.clientEmail))?.id : undefined);

        await createBooking({
          bookingReference: ref,
          clientId: clientId || undefined,
          status: 'pending',
          destination: quote.destination || undefined,
          departureDate: quote.departureDate || undefined,
          returnDate: quote.returnDate || undefined,
          leadPassengerName: quote.clientName || undefined,
          leadPassengerEmail: quote.clientEmail || undefined,
          leadPassengerPhone: quote.clientPhone || undefined,
          totalPrice: quote.totalPrice ? parseFloat(quote.totalPrice) : undefined,
          notes: `Converted from quote ${quote.quoteRef}. ${quote.notes || ''}`.trim(),
        });

        await updateAdminQuote(input.id, { status: 'converted' as any });

        writeAuditLog({
          actorId: (ctx as any).user?.id,
          actorType: 'admin',
          action: 'quote_converted_to_booking',
          entityType: 'booking',
          newValue: { quoteRef: quote.quoteRef, bookingRef: ref },
        }).catch(console.error);

        return { success: true, approved: true, bookingRef: ref };
      }),
  }),

  // ─── App Settings ─────────────────────────────────────────────────────────
  gdpr: gdprRouter,

  settings: router({
    // Admin: get all settings as a key/value record
    getAll: adminMiddleware.query(() => getAppSettings()),

    // Admin: set a single setting
    set: adminMiddleware
      .input(z.object({ key: z.string().min(1), value: z.string() }))
      .mutation(async ({ input }) => {
        await setAppSetting(input.key, input.value);
        return { success: true };
      }),

    // Public: return only the settings needed for public-facing components
    getPublic: publicProcedure.query(async () => {
      const all = await getAppSettings();
      return {
        whatsapp_chat_enabled: all['whatsapp_chat_enabled'] ?? 'false',
        live_chat_whatsapp: all['live_chat_whatsapp'] ?? '07495823953',
        ai_features_enabled: all['ai_features_enabled'] ?? 'true',
      };
    }),
  }),

  // ─── Destination Guides ───────────────────────────────────────────────────────
  guides: router({
    getAll: publicProcedure.query(async () => {
      const { getDb } = await import('./db');
      const { sql } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) return [];
      const rows = (await db.execute(sql`SELECT id, slug, destination, country, region, continent, heroImageBase64, heroImageMimeType, tagline, bestTimeToVisit, climate, currency, language, flightTimeFromUK, tags, featured, published, viewCount, aiGenerated, createdAt FROM destinationGuides WHERE published = true ORDER BY featured DESC, destination ASC`) as any)[0] as any[];
      return rows.map((r: any) => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [] }));
    }),

    getAllAdmin: adminProcedure.query(async () => {
      const { getDb } = await import('./db');
      const { sql } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) return [];
      const rows = (await db.execute(sql`SELECT id, slug, destination, country, region, continent, heroImageBase64, heroImageMimeType, tagline, bestTimeToVisit, currency, language, flightTimeFromUK, tags, featured, published, viewCount, aiGenerated, createdAt FROM destinationGuides ORDER BY createdAt DESC`) as any)[0] as any[];
      return rows.map((r: any) => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [] }));
    }),

    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const { getDb } = await import('./db');
      const { sql } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) return null;
      const rows = (await db.execute(sql`SELECT * FROM destinationGuides WHERE slug = ${input.slug} AND published = true LIMIT 1`) as any)[0] as any[];
      if (!rows.length) return null;
      const r = rows[0];
      await db.execute(sql`UPDATE destinationGuides SET viewCount = viewCount + 1 WHERE id = ${r.id}`);
      return {
        ...r,
        attractions: r.attractions ? JSON.parse(r.attractions) : [],
        dining: r.dining ? JSON.parse(r.dining) : [],
        accommodation: r.accommodation ? JSON.parse(r.accommodation) : [],
        insiderTips: r.insiderTips ? JSON.parse(r.insiderTips) : [],
        curatedItinerary: r.curatedItinerary ? JSON.parse(r.curatedItinerary) : null,
        tags: r.tags ? JSON.parse(r.tags) : [],
      };
    }),

    create: adminProcedure.input(z.object({
      destination: z.string(),
      country: z.string().optional(),
      region: z.string().optional(),
      continent: z.string().optional(),
      tagline: z.string().optional(),
      overview: z.string().optional(),
      bestTimeToVisit: z.string().optional(),
      climate: z.string().optional(),
      currency: z.string().optional(),
      language: z.string().optional(),
      timezone: z.string().optional(),
      flightTimeFromUK: z.string().optional(),
      attractions: z.array(z.any()).optional(),
      dining: z.array(z.any()).optional(),
      accommodation: z.array(z.any()).optional(),
      insiderTips: z.array(z.string()).optional(),
      gettingThere: z.string().optional(),
      visaInfo: z.string().optional(),
      curatedItinerary: z.any().optional(),
      tags: z.array(z.string()).optional(),
      heroImageBase64: z.string().optional(),
      heroImageMimeType: z.string().optional(),
      featured: z.boolean().optional(),
      published: z.boolean().optional(),
      aiGenerated: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      try {
        const { getDb } = await import('./db');
        const { sql } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const slug = input.destination.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
        await db.execute(sql`
          INSERT INTO destinationGuides (slug, destination, country, region, continent, tagline, overview, bestTimeToVisit, climate, currency, language, timezone, flightTimeFromUK, attractions, dining, accommodation, insiderTips, gettingThere, visaInfo, curatedItinerary, tags, heroImageBase64, heroImageMimeType, featured, published, aiGenerated, createdBy)
          VALUES (${slug}, ${input.destination}, ${input.country||null}, ${input.region||null}, ${input.continent||null}, ${input.tagline||null}, ${input.overview||null}, ${input.bestTimeToVisit||null}, ${input.climate||null}, ${input.currency||null}, ${input.language||null}, ${input.timezone||null}, ${input.flightTimeFromUK||null}, ${JSON.stringify(input.attractions||[])}, ${JSON.stringify(input.dining||[])}, ${JSON.stringify(input.accommodation||[])}, ${JSON.stringify(input.insiderTips||[])}, ${input.gettingThere||null}, ${input.visaInfo||null}, ${input.curatedItinerary ? JSON.stringify(input.curatedItinerary) : null}, ${JSON.stringify(input.tags||[])}, ${input.heroImageBase64||null}, ${input.heroImageMimeType||null}, ${input.featured??false}, ${input.published??false}, ${input.aiGenerated??false}, ${(ctx as any).user?.id||null})
        `);
        return { ok: true };
      } catch (e: any) {
        console.error('[Guides Create] Error:', e);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: e?.message || 'Failed to create guide' });
      }
    }),

    update: adminProcedure.input(z.object({
      id: z.number(),
      destination: z.string().optional(),
      country: z.string().optional(),
      region: z.string().optional(),
      continent: z.string().optional(),
      tagline: z.string().optional(),
      overview: z.string().optional(),
      bestTimeToVisit: z.string().optional(),
      climate: z.string().optional(),
      currency: z.string().optional(),
      language: z.string().optional(),
      timezone: z.string().optional(),
      flightTimeFromUK: z.string().optional(),
      attractions: z.array(z.any()).optional(),
      dining: z.array(z.any()).optional(),
      accommodation: z.array(z.any()).optional(),
      insiderTips: z.array(z.string()).optional(),
      gettingThere: z.string().optional(),
      visaInfo: z.string().optional(),
      curatedItinerary: z.any().optional(),
      tags: z.array(z.string()).optional(),
      heroImageBase64: z.string().optional(),
      heroImageMimeType: z.string().optional(),
      featured: z.boolean().optional(),
      published: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { getDb } = await import('./db');
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const fields: string[] = [];
      const vals: any[] = [];
      if (input.destination !== undefined) { fields.push('destination = ?'); vals.push(input.destination); }
      if (input.country !== undefined) { fields.push('country = ?'); vals.push(input.country); }
      if (input.region !== undefined) { fields.push('region = ?'); vals.push(input.region); }
      if (input.continent !== undefined) { fields.push('continent = ?'); vals.push(input.continent); }
      if (input.tagline !== undefined) { fields.push('tagline = ?'); vals.push(input.tagline); }
      if (input.overview !== undefined) { fields.push('overview = ?'); vals.push(input.overview); }
      if (input.bestTimeToVisit !== undefined) { fields.push('bestTimeToVisit = ?'); vals.push(input.bestTimeToVisit); }
      if (input.climate !== undefined) { fields.push('climate = ?'); vals.push(input.climate); }
      if (input.currency !== undefined) { fields.push('currency = ?'); vals.push(input.currency); }
      if (input.language !== undefined) { fields.push('language = ?'); vals.push(input.language); }
      if (input.timezone !== undefined) { fields.push('timezone = ?'); vals.push(input.timezone); }
      if (input.flightTimeFromUK !== undefined) { fields.push('flightTimeFromUK = ?'); vals.push(input.flightTimeFromUK); }
      if (input.attractions !== undefined) { fields.push('attractions = ?'); vals.push(JSON.stringify(input.attractions)); }
      if (input.dining !== undefined) { fields.push('dining = ?'); vals.push(JSON.stringify(input.dining)); }
      if (input.accommodation !== undefined) { fields.push('accommodation = ?'); vals.push(JSON.stringify(input.accommodation)); }
      if (input.insiderTips !== undefined) { fields.push('insiderTips = ?'); vals.push(JSON.stringify(input.insiderTips)); }
      if (input.gettingThere !== undefined) { fields.push('gettingThere = ?'); vals.push(input.gettingThere); }
      if (input.visaInfo !== undefined) { fields.push('visaInfo = ?'); vals.push(input.visaInfo); }
      if (input.curatedItinerary !== undefined) { fields.push('curatedItinerary = ?'); vals.push(JSON.stringify(input.curatedItinerary)); }
      if (input.tags !== undefined) { fields.push('tags = ?'); vals.push(JSON.stringify(input.tags)); }
      if (input.heroImageBase64 !== undefined) { fields.push('heroImageBase64 = ?'); vals.push(input.heroImageBase64); }
      if (input.heroImageMimeType !== undefined) { fields.push('heroImageMimeType = ?'); vals.push(input.heroImageMimeType); }
      if (input.featured !== undefined) { fields.push('featured = ?'); vals.push(input.featured); }
      if (input.published !== undefined) { fields.push('published = ?'); vals.push(input.published); }
      if (!fields.length) return { ok: true };
      vals.push(input.id);
      await db.execute(`UPDATE destinationGuides SET ${fields.join(', ')} WHERE id = ?`, vals);
      return { ok: true };
    }),

    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const { getDb } = await import('./db');
      const { sql } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      await db.execute(sql`DELETE FROM destinationGuides WHERE id = ${input.id}`);
      return { ok: true };
    }),

    generateContent: adminProcedure.input(z.object({
      destination: z.string(),
      country: z.string().optional(),
    })).mutation(async ({ input }) => {
      const apiKey = process.env.GROQ_API_KEY || (await getAppSetting('groq_api_key'));
      if (!apiKey) throw new TRPCError({ code: 'BAD_REQUEST', message: 'AI not configured.' });

      const prompt = `You are a senior luxury travel writer for CB Travel, a premium UK travel concierge agency. Write a comprehensive, beautifully crafted destination guide for ${input.destination}${input.country ? `, ${input.country}` : ''}.

The tone must be: warm, aspirational, sophisticated — like a private members travel club. Avoid clichés. Be specific and evocative.

Return ONLY valid JSON (no markdown code blocks) matching this exact structure:
{
  "country": "Country name",
  "region": "Region or area name",
  "continent": "Continent",
  "tagline": "One stunning original sentence that captures the soul of this destination max 12 words",
  "overview": "3-4 sentences. Paint a picture of what makes this place extraordinary. Specific, sensory, evocative.",
  "bestTimeToVisit": "Detailed paragraph on optimal travel months and what each season offers.",
  "climate": "Brief climate summary 1-2 sentences",
  "currency": "Local currency name and code",
  "language": "Primary languages",
  "timezone": "Timezone e.g. GMT+2",
  "flightTimeFromUK": "Approximate flight duration from London",
  "attractions": [
    { "name": "Attraction name", "description": "2-3 sentences why it is unmissable and what to expect", "type": "Landmark" }
  ],
  "dining": [
    { "name": "Restaurant or dining experience", "description": "What makes it special and a specific dish worth having", "priceRange": "£££", "cuisine": "Cuisine type" }
  ],
  "accommodation": [
    { "tier": "Boutique Luxury", "name": "Property name or type", "description": "What sets this apart views service unique features", "priceRange": "Price guide per night in GBP" },
    { "tier": "Ultra-Premium", "name": "Property name or type", "description": "The pinnacle option butler service extraordinary features", "priceRange": "Price guide per night in GBP" },
    { "tier": "Classic Elegance", "name": "Property name or type", "description": "Timeless choice heritage charm impeccable service", "priceRange": "Price guide per night in GBP" }
  ],
  "insiderTips": ["Specific actionable insider tip", "Another tip", "Another tip", "Another tip", "Another tip"],
  "gettingThere": "Paragraph on flights from UK best airlines airports transfers and how CB Travel can arrange private transfers.",
  "visaInfo": "UK passport holders visa requirements entry conditions passport validity rules. Note requirements change.",
  "curatedItinerary": {
    "title": "A CB Travel Curated Journey",
    "duration": 7,
    "days": [
      { "day": 1, "title": "Day title", "morning": "Morning activity", "afternoon": "Afternoon activity", "evening": "Evening experience or dinner", "tip": "Practical tip" }
    ]
  },
  "tags": ["Beach", "Culture", "Luxury"]
}

Include 6-8 attractions, 4-5 dining experiences, exactly 3 accommodation tiers, 5 insider tips, and 7 itinerary days. All specific to ${input.destination}.`;

      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.75,
          max_tokens: 6000,
        }),
      });
      if (!resp.ok) {
        const err = await resp.text();
        console.error('[AI] Groq guides error:', err);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'AI generation failed. Please try again.' });
      }
      const data = await resp.json() as any;
      const text = data.choices?.[0]?.message?.content || '';
      if (!text) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
      return JSON.parse(cleaned);
    }),
  }),

  // ─── Community & Impact ────────────────────────────────────────────────────
  community: router({
    getPublished: publicProcedure.query(async () => {
      const { getPublishedCommunityPosts } = await import('./db');
      return getPublishedCommunityPosts();
    }),

    getFeatured: publicProcedure.query(async () => {
      const { getFeaturedCommunityPosts } = await import('./db');
      return getFeaturedCommunityPosts(4);
    }),

    getAll: adminMiddleware.query(async () => {
      const { getAllCommunityPosts } = await import('./db');
      return getAllCommunityPosts();
    }),

    create: adminMiddleware
      .input(z.object({
        type: z.enum(['charity', 'partnership', 'giveaway', 'community']),
        title: z.string().min(1),
        subtitle: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        content: z.string().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
        partnerName: z.string().nullable().optional(),
        charityName: z.string().nullable().optional(),
        amountRaised: z.string().nullable().optional(),
        location: z.string().nullable().optional(),
        eventDate: z.string().nullable().optional(),
        isFeatured: z.boolean().optional(),
        isPublished: z.boolean().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createCommunityPost } = await import('./db');
        return createCommunityPost(input);
      }),

    update: adminMiddleware
      .input(z.object({
        id: z.number(),
        type: z.enum(['charity', 'partnership', 'giveaway', 'community']).optional(),
        title: z.string().optional(),
        subtitle: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        content: z.string().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
        partnerName: z.string().nullable().optional(),
        charityName: z.string().nullable().optional(),
        amountRaised: z.string().nullable().optional(),
        location: z.string().nullable().optional(),
        eventDate: z.string().nullable().optional(),
        isFeatured: z.boolean().optional(),
        isPublished: z.boolean().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateCommunityPost } = await import('./db');
        const { id, ...data } = input;
        await updateCommunityPost(id, data);
        return { success: true };
      }),

    delete: adminMiddleware
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteCommunityPost } = await import('./db');
        await deleteCommunityPost(input.id);
        return { success: true };
      }),

    togglePublished: adminMiddleware
      .input(z.object({ id: z.number(), isPublished: z.boolean() }))
      .mutation(async ({ input }) => {
        const { updateCommunityPost } = await import('./db');
        await updateCommunityPost(input.id, { isPublished: input.isPublished });
        return { success: true };
      }),

    toggleFeatured: adminMiddleware
      .input(z.object({ id: z.number(), isFeatured: z.boolean() }))
      .mutation(async ({ input }) => {
        const { updateCommunityPost } = await import('./db');
        await updateCommunityPost(input.id, { isFeatured: input.isFeatured });
        return { success: true };
      }),
  }),

  // ─── Notifications ────────────────────────────────────────────────────────
  notifications: router({
    // Get my notifications
    getMyNotifications: protectedProcedure.query(async ({ ctx }) => {
      const userId = (ctx as any).user?.id;
      if (!userId) return [];
      const { getNotificationsForUser } = await import('./db');
      return getNotificationsForUser(userId);
    }),

    // Get unread count
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      const userId = (ctx as any).user?.id;
      if (!userId) return { count: 0 };
      const { getUnreadCountForUser } = await import('./db');
      const count = await getUnreadCountForUser(userId);
      return { count };
    }),

    // Mark one as read
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const userId = (ctx as any).user?.id;
        if (!userId) return;
        const { markNotificationRead } = await import('./db');
        await markNotificationRead(input.id, userId);
        return { success: true };
      }),

    // Mark all as read
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      const userId = (ctx as any).user?.id;
      if (!userId) return;
      const { markAllNotificationsRead } = await import('./db');
      await markAllNotificationsRead(userId);
      return { success: true };
    }),

    // Admin: broadcast to all users
    broadcast: adminMiddleware
      .input(z.object({
        title: z.string().min(1).max(255),
        message: z.string().min(1),
        type: z.enum(['info', 'success', 'warning', 'alert']).default('info'),
        link: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const adminId = (ctx as any).user?.id;
        const { getAllUsersForBroadcast, createNotification } = await import('./db');
        const allUsers = await getAllUsersForBroadcast();
        let count = 0;
        for (const user of allUsers) {
          await createNotification({
            userId: user.id,
            title: input.title,
            message: input.message,
            type: input.type,
            link: input.link,
            createdBy: adminId,
            isBroadcast: true,
          });
          count++;
        }
        return { success: true, count };
      }),

    // Admin: send to specific user
    sendToUser: adminMiddleware
      .input(z.object({
        userId: z.number(),
        title: z.string().min(1),
        message: z.string().min(1),
        type: z.enum(['info', 'success', 'warning', 'alert']).default('info'),
        link: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const adminId = (ctx as any).user?.id;
        const { createNotification } = await import('./db');
        await createNotification({
          userId: input.userId,
          title: input.title,
          message: input.message,
          type: input.type,
          link: input.link,
          createdBy: adminId,
          isBroadcast: false,
        });
        return { success: true };
      }),
  }),

  // ─── JLT Terms & Conditions (auto-fetched from hub.thejltgroup.co.uk) ────────
  terms: router({
    /**
     * Returns the current JLT Booking Terms & Conditions.
     * Content is fetched live from hub.thejltgroup.co.uk and cached for 6 hours.
     * Falls back to hardcoded known-good content if the live fetch fails.
     */
    get: publicProcedure.query(async () => {
      return getJLTTerms();
    }),
    /**
     * Admin-only: force-refresh the terms cache immediately.
     * Useful after JLT publishes updated terms.
     */
    refresh: adminMiddleware.mutation(async () => {
      clearJLTTermsCache();
      return getJLTTerms();
    }),
  }),

});

export type AppRouter = typeof appRouter;
