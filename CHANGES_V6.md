# CB Travel v6 — Changes Log

## Overview
A comprehensive update to the CB Travel platform introducing 22 new features, 3 bug fixes, a full email template redesign, enhanced loyalty system, and production-ready deployment improvements.

---

## Bug Fixes

### BUG-01: Booked Destinations CRUD Restored
- **File changed:** `server/routers.ts` — added full CRUD routes under `destinations` router
- **File changed:** `server/db.ts` — added `getBookedDestinations`, `createBookedDestination`, `updateBookedDestination`, `deleteBookedDestination`
- **File changed:** `MIGRATION_V6.sql` — re-seeds `bookedDestinations` table defaults if empty
- **File changed:** `client/src/pages/AdminDashboard.tsx` — restored Destinations tab with add/edit/delete UI and "Last Booked" date

### BUG-02: Email Logs Not Showing
- **File changed:** `server/db.ts` — audited all `emailLogs` and `passwordResetTokens` queries; all now use Drizzle `sql` template tag correctly
- **File changed:** `server/routers.ts` — verified all email log writes use `logEmailRecord`

### BUG-03: GDPR — Secure Set Password Flow
- **File changed:** `server/routers.ts` — admin `createUser` now generates a secure 32-byte token, stores in `passwordResetTokens` (24hr expiry), emails "Set your password" link (no plain-text password)
- **File changed:** `server/emails.ts` — added `sendSetPasswordEmail` function
- **File new:** `client/src/pages/SetPassword.tsx` — `/set-password?token=XXX` page
- **File changed:** `client/src/App.tsx` — added `/set-password` route

---

## New Features

### FEAT-04: Holiday Countdown Banner
- **File new:** `client/src/components/HolidayCountdownBanner.tsx`
- **File changed:** `client/src/pages/Dashboard.tsx` — integrated banner at top of client dashboard
- Shows "Your holiday to [destination] is in X days! 🌴" using nearest upcoming booking. Hidden if no upcoming bookings.

### FEAT-05: Live Weather Widget
- **File new:** `client/src/components/WeatherWidget.tsx`
- **File changed:** `client/src/pages/Dashboard.tsx` — shown in booking details tab
- Uses Open-Meteo API (free, no key required). Shows 3-day forecast with temperature and conditions.

### FEAT-06: Currency Converter
- **File new:** `client/src/components/CurrencyConverter.tsx`
- **File changed:** `client/src/pages/Dashboard.tsx` — shown in booking details
- Uses frankfurter.app (free). Auto-detects destination currency from booking destination name.

### FEAT-07: Flight Status Tracker
- **File new:** `client/src/components/FlightStatusTracker.tsx`
- **File changed:** `client/src/pages/Dashboard.tsx` — shown in booking details tab
- **File changed:** `MIGRATION_V6.sql` — `ALTER TABLE bookings ADD COLUMN flightStatusNumber VARCHAR(20)`
- **File changed:** `drizzle/schema.ts` — added `flightStatusNumber` to bookings table
- Uses AviationStack API. Admin inputs flight number per booking. Shows times, terminal, gate, status.
- **Note:** Requires `AVIATIONSTACK_API_KEY` env var (user to add later)

### FEAT-08: Feedback Form + Promo Code
- **File new:** `client/src/components/FeedbackForm.tsx`
- **File new:** `MIGRATION_V6.sql` — creates `booking_feedback` table
- **File changed:** `drizzle/schema.ts` — added `bookingFeedback` table
- **File changed:** `server/db.ts` — added `getBookingFeedback`, `createBookingFeedback`
- **File changed:** `server/routers.ts` — added `feedback` router
- **File changed:** `server/emails.ts` — added `sendFeedbackPromoEmail`
- **File changed:** `client/src/pages/Dashboard.tsx` — "Leave Feedback" button on completed bookings
- On submit: generates `THANKS-{userId}-{random}` promo code, saves to `promoCodes`, emails client

### FEAT-09: Birthday Emails
- **File changed:** `MIGRATION_V6.sql` — `ALTER TABLE users ADD COLUMN dateOfBirth DATE NULL`
- **File changed:** `drizzle/schema.ts` — added `dateOfBirth` to users
- **File changed:** `server/db.ts` — added `getUsersWithBirthdayTomorrow`, `setUserDateOfBirth`
- **File changed:** `server/jobs.ts` — added `runBirthdayJob` (daily, runs at startup + every 24hr)
- **File changed:** `server/emails.ts` — added `sendBirthdayEmail`
- **File changed:** `server/routers.ts` — added `profileV6.setDateOfBirth`
- Generates `BDAY-{userId}-{year}` promo, awards 50 loyalty points, emails client

### FEAT-10: Testimonials System
- **File changed:** `MIGRATION_V6.sql` — creates `testimonials` table
- **File changed:** `drizzle/schema.ts` — added `testimonials` table
- **File changed:** `server/db.ts` — `createTestimonial`, `getAllTestimonials`, `getApprovedTestimonials`, `approveTestimonial`, `deleteTestimonial`
- **File changed:** `server/routers.ts` — testimonials router (submit, admin approve/reject)
- **File changed:** `client/src/pages/Home.tsx` — "What Our Clients Say" approved testimonials section
- **File changed:** `client/src/pages/AdminDashboard.tsx` — Testimonials management tab

### FEAT-11: Referral System
- **File changed:** `MIGRATION_V6.sql` — `ALTER TABLE users ADD COLUMN referralCode VARCHAR(50) NULL`
- **File changed:** `drizzle/schema.ts` — added `referralCode` to users
- **File changed:** `server/db.ts` — added `getUserByReferralCode`, `setUserReferralCode`
- **File changed:** `server/routers.ts` — `referral` router (get link, apply referral)
- **File changed:** `server/emails.ts` — added `sendReferralPromoEmail`
- **File new:** `client/src/components/ReferralSection.tsx` — referral link with copy button
- **File new:** `client/src/pages/ReferralLanding.tsx` — `/refer/{code}` landing page
- **File changed:** `client/src/App.tsx` — added `/refer/:code` route
- **File changed:** `client/src/pages/Dashboard.tsx` — added ReferralSection component

### FEAT-12: Client Notes / CRM
- **File changed:** `MIGRATION_V6.sql` — creates `client_notes` table
- **File changed:** `drizzle/schema.ts` — added `clientNotes` table
- **File changed:** `server/db.ts` — added `getClientNotes`, `createClientNote`, `deleteClientNote`
- **File changed:** `server/routers.ts` — `clientNotes` router (admin only)
- **File changed:** `client/src/pages/AdminDashboard.tsx` — Client Notes tab per client; never visible to clients

### FEAT-13: Facebook Posts Feed
- **File changed:** `client/src/pages/Home.tsx` — "Latest from Facebook" section using Facebook Page Plugin embed (iframe, no API key needed)
- URL: `https://www.facebook.com/cbtraveluk/` — responsive, scrollable, mobile-friendly

### FEAT-14: Mobile PWA
- **File new:** `client/public/manifest.json` — PWA manifest (CB Travel, theme #1e3a5f, icons)
- **File new:** `client/public/service-worker.js` — caches dashboard, bookings; offline fallback
- **File new:** `client/public/offline.html` — branded offline page
- **File changed:** `client/index.html` — added manifest link, PWA meta tags, service worker registration

### FEAT-15: WhatsApp Business Live Chat
- **File new:** `client/src/components/WhatsAppChatButton.tsx` — floating green button (bottom-right), pulsing animation, tooltip
- **File changed:** `client/src/App.tsx` — added globally
- **File changed:** `MIGRATION_V6.sql` — creates `app_settings` table
- WhatsApp number from admin settings (`live_chat_whatsapp`, default: 07495823953). Admin toggle.

### FEAT-16: Smart Travel Notifications
- **File changed:** `server/jobs.ts` — `runSmartNotificationsJob` (daily)
- **File changed:** `MIGRATION_V6.sql` — creates `notification_log` table
- **File changed:** `drizzle/schema.ts` — added `notificationLog` table
- **File changed:** `server/db.ts` — `getUpcomingBookingsForNotifications`, `hasNotificationBeenSent`, `logNotificationSent`, `setNotificationsEnabled`
- **File changed:** `server/emails.ts` — `sendNotification7Day`, `sendNotification48Hour`, `sendNotificationDeparture`
- 7-day (packing tips), 48-hour (check-in reminder), departure day (flight details). Admin toggle per setting.

### FEAT-17: Emergency SOS Button
- **File new:** `client/src/components/SOSButton.tsx` — red SOS button on active/upcoming bookings
- **File changed:** `client/src/pages/Dashboard.tsx` — added to booking details
- **File changed:** `server/routers.ts` — `sos.trigger` mutation
- **File changed:** `server/emails.ts` — `sendSOSAlertEmail` — emails hello@travelcb.co.uk with 🆘 alert
- Modal shows: local emergency number, police, British Embassy, WhatsApp tap-to-call, admin mobile
- Logs to `auditLogs` with `actorType: 'client'`

### FEAT-18: Interactive Destination Map
- **File new:** `client/src/components/DestinationMap.tsx` — world map with animated pins (react-simple-maps)
- **File changed:** `client/src/pages/Home.tsx` — full-width map section on homepage
- Click pin shows destination name, Last Booked date, trip count

### FEAT-19: Newsletter + Campaign Manager
- **File changed:** `MIGRATION_V6.sql` — creates `newsletter_subscribers` and `newsletter_campaigns` tables
- **File changed:** `drizzle/schema.ts` — `newsletterSubscribers`, `newsletterCampaigns`
- **File changed:** `server/db.ts` — subscribe, unsubscribe, get subscribers, CRUD campaigns, mark sent
- **File changed:** `server/routers.ts` — `newsletterV6` router (subscribe, campaigns, send)
- **File changed:** `server/emails.ts` — `sendCampaignEmail` with unsubscribe link
- **File changed:** `client/src/pages/Home.tsx` — email signup form in footer area
- **File changed:** `client/src/pages/AdminDashboard.tsx` — Newsletter tab with campaign builder and send

### FEAT-20 & 21: Audit Log (Admin + Client Activity)
- **File changed:** `MIGRATION_V6.sql` — creates `audit_logs` table
- **File changed:** `drizzle/schema.ts` — `auditLogs` table
- **File changed:** `server/db.ts` — `writeAuditLog`, `getAuditLogs`
- **File changed:** `server/routers.ts` — audit log writes on every admin action; `auditLogs.list` for admin
- **File changed:** `client/src/pages/AdminDashboard.tsx` — Audit Log tab (searchable, filterable, CSV export)
- Tracks: login, create/edit/delete user, bookings, documents, testimonials, SOS, feedback

### FEAT-22: Full Loyalty System ("The Best Travel Loyalty System")
- **Files new:** `client/src/pages/LoyaltyDashboard.tsx`, `client/src/pages/AdminLoyalty.tsx`
- **File new:** `client/src/components/LoyaltyWidget.tsx`
- **File new:** `server/loyalty-voucher.ts` — generates branded PNG voucher (QR code, C.Barnes signature, 3-month validity)
- **File changed:** `MIGRATION_V6.sql` — creates `loyaltyAccounts`, `loyaltyTransactions`, `loyaltyRewards`, `loyaltyRedemptions`, `loyaltyTierHistory`
- **File changed:** `drizzle/schema.ts` — all loyalty tables
- **File changed:** `server/db.ts` — full loyalty functions (account, transactions, rewards, redemptions, tiers, leaderboard)
- **File changed:** `server/routers.ts` — `loyalty` router (dashboard, claim, admin hub)
- **File changed:** `server/emails.ts` — `sendLoyaltyRewardEmail`, `sendTierUpgradeEmail`, `sendPointsExpiryWarning`
- **File changed:** `client/src/pages/Dashboard.tsx` — LoyaltyWidget in sidebar
- **File changed:** `client/src/components/Navigation.tsx` — Loyalty nav link
- **File changed:** `client/src/App.tsx` — `/loyalty` and `/admin/loyalty` routes
- Tiers: 🥉 Bronze (0-499), 🥈 Silver (500-1499), 🥇 Gold (1500+)
- Features: rewards shop, voucher generation, transaction timeline, tier upgrades, leaderboard, limited stock, tier-exclusive rewards, points multiplier

### FEAT-23: AI Itinerary Generator
- **File new:** `client/src/components/AIItineraryGenerator.tsx`
- **File changed:** `server/routers.ts` — `ai.generateItinerary` using OpenAI gpt-4o-mini
- **File changed:** `client/src/pages/Dashboard.tsx` — "Generate Itinerary" button in booking tabs
- Admin toggle via `ai_features_enabled` setting. Requires `OPENAI_API_KEY` env var.

### FEAT-24: AI Smart FAQ Chatbot
- **File new:** `client/src/components/AIChatbot.tsx` — floating chat bubble (bottom-left)
- **File changed:** `server/routers.ts` — `ai.chatbotAnswer` uses FAQ items from DB via OpenAI
- **File changed:** `client/src/App.tsx` — added globally
- Admin toggle via `ai_features_enabled`. Falls back to "email hello@travelcb.co.uk".

### FEAT-25: QR Code Generator
- **File new:** `client/src/components/QRCodeDisplay.tsx`
- **File changed:** `server/routers.ts` — `qr.generateForBooking` using `qrcode` npm
- **File changed:** `client/src/pages/Dashboard.tsx` — QR code in booking details tab with download button

---

## Email Template Redesign
- **File changed:** `server/emails.ts` — complete visual redesign
- Navy header (#1e3a5f), gold accent (#e8b84b), white card body
- Font: 'Segoe UI', Arial, sans-serif
- Footer: "CB Travel | hello@travelcb.co.uk | travelcb.co.uk | © 2026 CB Travel"
- Applied to ALL 20+ email templates including loyalty, SOS, birthday, notifications

---

## Admin Settings Panel
- **File changed:** `server/routers.ts` — `settings` router (get public settings, admin get/set all)
- **File changed:** `MIGRATION_V6.sql` — creates `app_settings` table with defaults
- **File changed:** `client/src/pages/AdminDashboard.tsx` — Settings tab
- Keys: `emergency_whatsapp`, `emergency_mobile`, `live_chat_whatsapp`, `openai_api_key`, `ai_features_enabled`, `whatsapp_chat_enabled`, `notifications_7day_enabled`, `notifications_48hour_enabled`, `notifications_departure_enabled`

---

## Database Migration
- **File new:** `MIGRATION_V6.sql`
- Idempotent: all `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- Tables created: `booking_feedback`, `testimonials`, `client_notes`, `loyalty_accounts`, `loyalty_transactions`, `loyalty_rewards`, `loyalty_redemptions`, `loyalty_tier_history`, `audit_logs`, `notification_log`, `newsletter_subscribers`, `newsletter_campaigns`, `app_settings`
- Columns added: `users.dateOfBirth`, `users.referralCode`, `bookings.flightStatusNumber`, `bookings.notificationsEnabled`
- Seeds: `bookedDestinations` defaults (if empty), `loyaltyRewards` starter pack (if empty), `app_settings` defaults, `faqItems` starter pack (if empty)

---

## Package Updates
- **File changed:** `package.json`
- Added: `qrcode`, `sharp`, `react-simple-maps`, `openai`

---

## Files Changed Summary
| File | Type |
|------|------|
| `MIGRATION_V6.sql` | NEW |
| `CHANGES_V6.md` | NEW |
| `drizzle/schema.ts` | MODIFIED |
| `server/db.ts` | MODIFIED |
| `server/emails.ts` | MODIFIED |
| `server/routers.ts` | MODIFIED |
| `server/jobs.ts` | MODIFIED |
| `server/loyalty-voucher.ts` | NEW |
| `client/src/App.tsx` | MODIFIED |
| `client/src/pages/Dashboard.tsx` | MODIFIED |
| `client/src/pages/AdminDashboard.tsx` | MODIFIED |
| `client/src/pages/Home.tsx` | MODIFIED |
| `client/src/pages/SetPassword.tsx` | NEW |
| `client/src/pages/LoyaltyDashboard.tsx` | NEW |
| `client/src/pages/AdminLoyalty.tsx` | NEW |
| `client/src/pages/ReferralLanding.tsx` | NEW |
| `client/src/components/HolidayCountdownBanner.tsx` | NEW |
| `client/src/components/WeatherWidget.tsx` | NEW |
| `client/src/components/CurrencyConverter.tsx` | NEW |
| `client/src/components/FlightStatusTracker.tsx` | NEW |
| `client/src/components/FeedbackForm.tsx` | NEW |
| `client/src/components/WhatsAppChatButton.tsx` | NEW |
| `client/src/components/LoyaltyWidget.tsx` | NEW |
| `client/src/components/ReferralSection.tsx` | NEW |
| `client/src/components/SOSButton.tsx` | NEW |
| `client/src/components/QRCodeDisplay.tsx` | NEW |
| `client/src/components/DestinationMap.tsx` | NEW |
| `client/src/components/AIChatbot.tsx` | NEW |
| `client/src/components/AIItineraryGenerator.tsx` | NEW |
| `client/src/components/Navigation.tsx` | MODIFIED |
| `client/public/manifest.json` | NEW |
| `client/public/service-worker.js` | NEW |
| `client/public/offline.html` | NEW |
| `client/index.html` | MODIFIED |
| `package.json` | MODIFIED |

---

## Deployment Instructions
1. Extract ZIP to `~/Downloads/cb-travel-project 8/`
2. Run `mysql -u root -p railway < MIGRATION_V6.sql` (or via Railway MySQL CLI)
3. Set environment variables:
   - `OPENAI_API_KEY=sk-proj-...` (already in app_settings, but also set in Railway)
   - `AVIATIONSTACK_API_KEY=` (add when available)
4. Run `pnpm install` to install new packages
5. Run `railway up`
