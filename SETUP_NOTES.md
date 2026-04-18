# CB Travel V7 — Setup Notes

## 1. Database Migration
Run `MIGRATION_V7.sql` on your MySQL database before deploying. It is safe to run multiple times.

## 2. Add the Set-Password Route to App.tsx
The welcome email sends new users to `/set-password?token=...&email=...`.
You need to add this route in your `client/src/App.tsx` (or wherever your routes are defined).

### Add this import near the top of App.tsx:
```tsx
import SetPassword from "./pages/SetPassword";
```

### Add this route inside your `<Routes>` block (alongside the other public routes like /login, /reset-password):
```tsx
<Route path="/set-password" element={<SetPassword />} />
```

That's all — the backend `auth.setPassword` procedure is already included in this update.

## 3. Files Changed in This Update
- `server/routers.ts` — Added `auth.setPassword` procedure + fixed support ticket router
- `server/db.ts` — Fixed `createSupportTicket` (Drizzle insert, proper imports, error surfacing)
- `server/emails.ts` — Fixed `emailWrapper` → `baseTemplate` in `sendLoyaltyRewardEmail`
- `client/src/pages/SetPassword.tsx` — **NEW** — Set password page for welcome email links
- `client/src/pages/AdminDashboard.tsx` — Fixed white screen (allTickets query + support TabsContent)
- `client/src/pages/Dashboard.tsx` — Support tickets + travel party UI
- `drizzle/schema.ts` — New tables (supportTickets, ticketMessages, bookingMembers)
- `MIGRATION_V7.sql` — Database migration (run this!)
