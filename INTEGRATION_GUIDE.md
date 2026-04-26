# CB Travel — V13 Drop-in Files

Six new admin features bolted onto your existing dashboard. Built to match your exact stack (React 19 + Vite + tRPC + Drizzle/MySQL + Resend + GROQ) and your navy/gold luxury palette.

**What's included**

| # | Feature                          | Powered by         |
| - | -------------------------------- | ------------------ |
| 1 | AI Admin Assistant               | GROQ + DB snapshot |
| 2 | Booking Email System (templates) | Resend + DB        |
| 3 | Notification & Action Centre     | Trigger detection  |
| 4 | Social Media Content Hub + Cal   | GROQ               |
| 5 | Destination Spotlight Tool       | GROQ               |
| 6 | Travel Hack Generator            | GROQ               |

**Nothing existing is touched.** Your bookings, clients, deals, loyalty, GDPR, support, etc. all keep working exactly as they do today. Auto-send is **OFF** for all client emails — every one is reviewed by you in the Notification Centre before it leaves.

---

## Step 1 — Database migration

Copy `migrations/MIGRATION_V13.sql` into your repo root (next to `MIGRATION_V12.sql`) and run it against your MySQL database.

```bash
mysql -h <host> -u <user> -p <database> < MIGRATION_V13.sql
```

Or run the contents through your existing migration tool. The script is idempotent (safe to re-run) and seeds the 6 default booking-lifecycle templates automatically.

---

## Step 2 — Drop in the server files

Copy these into your repo at the matching paths:

```
server/_groq.ts
server/booking-emails.ts
server/notification-queue.ts
server/ai-assistant.ts
server/social-hub.ts
server/admin-extensions-router.ts
```

No other server file is modified except `server/routers.ts` (see Step 3).

---

## Step 3 — Wire the routers into `server/routers.ts`

**A.** At the top of `server/routers.ts`, alongside the other imports, add:

```ts
import {
  aiAssistantRouter,
  emailTemplatesRouter,
  bookingEmailsRouter,
  socialHubRouter,
  destinationSpotlightRouter,
  travelHacksRouter,
} from "./admin-extensions-router";
```

**B.** Inside the existing `appRouter = router({ ... })` block (any spot, e.g. just before `terms: router({ ... })` near the end), add:

```ts
  aiAssistant: aiAssistantRouter,
  emailTemplates: emailTemplatesRouter,
  bookingEmails: bookingEmailsRouter,
  socialHub: socialHubRouter,
  destinationSpotlight: destinationSpotlightRouter,
  travelHacks: travelHacksRouter,
```

That's the only edit to `routers.ts`.

---

## Step 4 — (Optional) hourly trigger scan

You already run a postcard job every hour from `server/_core/index.ts`. To auto-scan for new pending notifications on the same cadence, add this next to your `runPostcardJob` setup:

```ts
async function runNotificationScan() {
  try {
    const { detectAllTriggers } = await import("../notification-queue");
    const counts = await detectAllTriggers();
    console.log("[NotificationQueue] scan:", counts);
  } catch (err) {
    console.error("[NotificationQueue] scan error:", err);
  }
}
setInterval(runNotificationScan, 60 * 60 * 1000);
setTimeout(runNotificationScan, 5 * 60 * 1000);
```

This is **optional** — admins can also click "Scan for triggers" on demand from the Notification Centre.

---

## Step 5 — Drop in the client components

Copy these into your repo at the matching paths:

```
client/src/components/admin/AdminAIAssistant.tsx
client/src/components/admin/AdminBookingEmailsHub.tsx
client/src/components/admin/AdminSocialHub.tsx
client/src/components/admin/AdminDestinationSpotlight.tsx
client/src/components/admin/AdminTravelHacks.tsx
```

They use only your existing shadcn/ui primitives, lucide-react icons, sonner toasts, and the `bg-navy-gradient` / `text-gold-gradient` utilities you already have in `client/src/index.css`.

---

## Step 6 — Add the tabs to `client/src/pages/AdminDashboard.tsx`

Two tiny edits:

**A.** Add the imports at the top of the file (alongside the existing admin component imports):

```tsx
import AdminAIAssistant from "@/components/admin/AdminAIAssistant";
import AdminBookingEmailsHub from "@/components/admin/AdminBookingEmailsHub";
import AdminSocialHub from "@/components/admin/AdminSocialHub";
import AdminDestinationSpotlight from "@/components/admin/AdminDestinationSpotlight";
import AdminTravelHacks from "@/components/admin/AdminTravelHacks";
```

**B.** Add six `TabsContent` blocks anywhere inside the `<Tabs ...>` block (e.g. just after the existing `<TabsContent value="payments">` near the bottom):

```tsx
<TabsContent value="ai-assistant">
  <AdminAIAssistant />
</TabsContent>

<TabsContent value="booking-emails">
  <AdminBookingEmailsHub />
</TabsContent>

<TabsContent value="social-hub">
  <AdminSocialHub />
</TabsContent>

<TabsContent value="spotlight">
  <AdminDestinationSpotlight />
</TabsContent>

<TabsContent value="travel-hacks">
  <AdminTravelHacks />
</TabsContent>
```

**C.** Add the matching tab triggers to your sidebar / nav. Your `AdminDashboard.tsx` already has a sidebar tab list with `setActiveTab(...)` handlers — just add five more entries to that list using the values `ai-assistant`, `booking-emails`, `social-hub`, `spotlight`, `travel-hacks` and any icons/labels you like (suggestions below).

```tsx
{ value: "ai-assistant",   label: "AI Assistant",       icon: Sparkles },
{ value: "booking-emails", label: "Booking Emails",     icon: Mail },
{ value: "social-hub",     label: "Social Hub",         icon: MessageSquare },
{ value: "spotlight",      label: "Destination Spotlight", icon: MapPinned },
{ value: "travel-hacks",   label: "Travel Hacks",       icon: Lightbulb },
```

`Sparkles`, `Mail`, `MessageSquare`, `MapPinned` and `Lightbulb` are already imported elsewhere in `AdminDashboard.tsx` or available from `lucide-react`.

---

## Step 7 — Environment

You already have `GROQ_API_KEY` configured (used by your existing AI itinerary generator and FAQ bot). No new env vars are required.

If you ever want to disable AI features globally, set the app setting `ai_features_enabled` to `false` (the same flag used by your existing AI features).

---

## Voice & rules baked in

Every AI prompt enforces:

- **Tone**: warm, aspirational, sophisticated, witty when it lands — never cheesy.
- **Voice owner**: CB Travel UK, luxury concierge.
- **CTAs default to**: WhatsApp **07495 823953**, **hello@travelcb.co.uk**, **www.travelcb.co.uk**.
- **Booking templates** use your placeholders: `{{client_name}}`, `{{destination}}`, `{{departure_date}}`, `{{return_date}}`, `{{booking_reference}}`, `{{supplier}}`, `{{balance_due}}`, `{{balance_due_date}}`, `{{number_of_travelers}}`, `{{site_url}}`.
- **Auto-send is OFF**. Triggers create *pending* queue items only; an admin reviews + clicks Send.
- All sends are written to your existing `emailLogs` table and audit log.

---

## Trigger rules (the queue scanner)

| Trigger             | Condition                                                                |
| ------------------- | ------------------------------------------------------------------------ |
| `passport_request`  | Confirmed booking, future departure, no `leadPassengerPassportNumber`     |
| `balance_reminder`  | Pending/confirmed, departure within 70 days, balance > 0                 |
| `check_in_reminder` | Confirmed, departure 24–30 hours from now                                 |
| `travel_docs`       | Confirmed, departure exactly 7 days away                                 |
| `pre_travel_reminder`| Confirmed, departure 2–3 days away                                       |
| `welcome_home`      | Confirmed/completed, return date 1–2 days ago                            |

The scanner deduplicates — it never queues the same trigger twice for the same booking while one is still pending.

---

## File list

```
migrations/
└── MIGRATION_V13.sql

server/
├── _groq.ts
├── ai-assistant.ts
├── admin-extensions-router.ts
├── booking-emails.ts
├── notification-queue.ts
└── social-hub.ts

client/src/components/admin/
├── AdminAIAssistant.tsx
├── AdminBookingEmailsHub.tsx
├── AdminDestinationSpotlight.tsx
├── AdminSocialHub.tsx
└── AdminTravelHacks.tsx
```

11 new files, 2 small edits to `routers.ts`, 3 small edits to `AdminDashboard.tsx`. Nothing else changes.
