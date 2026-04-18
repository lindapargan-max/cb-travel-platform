# CB Travel - Project TODO

## Database & Backend
- [x] Extended schema: users with phone, bookings with lead passenger info, departure/return dates, amounts paid/remaining
- [x] Schema: deals, testimonials, quote requests, newsletter subscriptions, documents
- [x] Backend routers: auth (email+phone+password signup/login), deals, bookings (admin CRUD), quotes, testimonials, newsletter, documents
- [x] Admin procedures: create/update/delete bookings with full passenger info, upload documents, update payment amounts
- [x] File upload to S3 for booking confirmations

## Global UI
- [x] Stunning CSS theme (deep navy/gold luxury palette, Playfair Display + Inter fonts)
- [x] Responsive navigation with logo, links, auth buttons
- [x] Footer with contact info (07495 823953, hello@travelcb.co.uk), links, subscribe
- [x] Remove all Manus watermarks/branding
- [x] CB Travel logo uploaded to CDN and used in nav/footer

## Homepage
- [x] Hero section with cinematic full-screen image, headline, CTA buttons
- [x] Services/features section
- [x] Weekly deals section (dynamic from DB)
- [x] Testimonials/reviews section (dynamic from DB)
- [x] FAQ section (accordion)
- [x] Newsletter subscribe section
- [x] Trust indicators section

## Auth Pages
- [x] Register page (email, phone number, password only)
- [x] Login page (email + password)
- [x] Protected routes for dashboard and admin
- [x] Admin email auto-assignment (admin@travelcb.co.uk)

## User Dashboard
- [x] "My Bookings" tab - list of bookings with reference, status, amounts paid/remaining
- [x] "My Quotes" tab - list of quote requests with status
- [x] Booking detail view with documents/files
- [x] Nice tags/labels/badges for status

## Admin Dashboard
- [x] Overview stats
- [x] Manage Bookings: create booking with reference, departure/return dates, lead passenger (name, email, phone, DOB), amounts, notes
- [x] Upload booking confirmation file (PDF/image) to S3, link to booking
- [x] Update payment amounts (amount paid, total price, balance remaining)
- [x] Manage Deals: create/edit/delete weekly deals
- [x] Manage Quotes: view and update status of quote requests
- [x] Manage Testimonials: create/approve testimonials
- [x] View newsletter subscribers
- [x] Send booking link to client (client can view their booking)

## Additional Pages
- [x] Quote Request page (full form, sends to hello@travelcb.co.uk)
- [x] Privacy Policy page (custom, CB Travel branded)
- [x] Terms & Conditions page (with provided content, CB Travel branded)
- [x] FAQ page (dedicated page)
- [x] 404 Not Found page

## Quality & Polish
- [x] Rounded buttons, sophisticated tags/labels
- [x] Smooth animations and transitions
- [x] Mobile responsive design
- [x] Loading states and empty states
- [x] Vitest tests for key backend procedures (12 tests passing)
- [x] Remove all Manus watermarks

## Round 2 Updates
- [ ] Update fonts: replace Playfair Display + Inter with Plus Jakarta Sans (professional, Aptos/Calibri-style)
- [ ] Build About Us page with Corron's story and CB Travel details
- [ ] Add About Us link to navigation and footer
