-- ─────────────────────────────────────────────────────────────────────────────
-- CB Travel — Migration V13
-- Adds: AI Admin Assistant, Booking Email System, Notification & Action Centre,
--       Social Media Hub, Destination Spotlights, Travel Hacks
--
-- Safe to re-run: every CREATE uses IF NOT EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Email Templates ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emailTemplates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body MEDIUMTEXT NOT NULL,
  category ENUM('booking','marketing','system') NOT NULL DEFAULT 'booking',
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Seed default booking lifecycle templates
INSERT IGNORE INTO emailTemplates (`key`, name, subject, body, category) VALUES
('passport_request',
 'Passport Details Request',
 'Action needed: passport details for {{destination}} ({{booking_reference}})',
 '<p>Hi {{client_name}},</p><p>We''re getting your trip to <strong>{{destination}}</strong> ready (booking <strong>{{booking_reference}}</strong>) and we just need your passport details to complete the booking with our supplier.</p><p>Please reply to this email with:</p><ul><li>Full name as on passport</li><li>Passport number</li><li>Issue date and expiry date</li><li>Country of issue</li><li>Date of birth</li></ul><p>If easier, send a clear photo of the photo page.</p><p>Any questions just WhatsApp us on 07495 823953 or reply here.</p><p>Warm wishes,<br>CB Travel</p>',
 'booking'),

('balance_reminder',
 'Friendly balance reminder for {{destination}} ({{booking_reference}})',
 'Just a quick balance reminder for {{destination}}',
 '<p>Hi {{client_name}},</p><p>A friendly heads-up that the balance for your trip to <strong>{{destination}}</strong> (booking <strong>{{booking_reference}}</strong>) is due by <strong>{{balance_due_date}}</strong>.</p><p>Outstanding balance: <strong>£{{balance_due}}</strong></p><p>You can pay online, by card over the phone, or by bank transfer — whatever''s easiest. Just reply to this email or WhatsApp us on 07495 823953 and we''ll guide you through.</p><p>Looking forward to getting you away!</p><p>Warm wishes,<br>CB Travel</p>',
 'booking'),

('check_in_reminder',
 'Online check-in reminder for {{destination}} ({{booking_reference}})',
 'Time to check in for {{destination}}',
 '<p>Hi {{client_name}},</p><p>Online check-in for your flight to <strong>{{destination}}</strong> opens 24 hours before departure on <strong>{{departure_date}}</strong>.</p><p>Booking reference: <strong>{{booking_reference}}</strong><br>Airline: <strong>{{supplier}}</strong></p><p>Top tip: download your boarding passes to your phone wallet so you''ve got them offline at the airport.</p><p>Have a wonderful trip — and please send us a postcard (a digital one will do!).</p><p>Warm wishes,<br>CB Travel</p>',
 'booking'),

('travel_docs',
 'Your travel documents for {{destination}} are ready',
 'Your travel documents — {{destination}} ({{booking_reference}})',
 '<p>Hi {{client_name}},</p><p>Exciting times — your travel documents for <strong>{{destination}}</strong> are ready!</p><p>Booking reference: <strong>{{booking_reference}}</strong><br>Departure: <strong>{{departure_date}}</strong><br>Return: <strong>{{return_date}}</strong></p><p>Please find your e-tickets, hotel vouchers, and pre-travel info attached. Save them to your phone and print a backup copy if you can.</p><p>If anything looks off or you have questions, just reply or WhatsApp 07495 823953.</p><p>Warm wishes,<br>CB Travel</p>',
 'booking'),

('pre_travel_reminder',
 'Pre-travel checklist for {{destination}}',
 'Almost time! Your pre-travel checklist for {{destination}}',
 '<p>Hi {{client_name}},</p><p>You''re off to <strong>{{destination}}</strong> on <strong>{{departure_date}}</strong> — how exciting!</p><p>A quick pre-travel checklist:</p><ul><li>✅ Passport valid for at least 6 months after return</li><li>✅ Travel insurance documents saved</li><li>✅ Local currency or travel card sorted</li><li>✅ Adapter and chargers packed</li><li>✅ Online check-in completed (opens 24 hours before)</li></ul><p>Booking reference: <strong>{{booking_reference}}</strong></p><p>Have an amazing time, and remember we''re only a WhatsApp away on 07495 823953 if you need anything while you''re out there.</p><p>Warm wishes,<br>CB Travel</p>',
 'booking'),

('welcome_home',
 'Welcome home from {{destination}}!',
 'Welcome home — how was {{destination}}?',
 '<p>Hi {{client_name}},</p><p>Welcome home! We hope <strong>{{destination}}</strong> was everything you hoped for and more.</p><p>If you''ve got 30 seconds, we''d love to hear how it went — a quick reply with a star rating (1–5) or a sentence or two would absolutely make our day, and helps future travellers too.</p><p>And if you''re already daydreaming about the next one… you know where to find us. WhatsApp 07495 823953 or hello@travelcb.co.uk.</p><p>Warm wishes,<br>CB Travel</p>',
 'booking');


-- ─── 2. Booking Notification Queue ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookingNotificationQueue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bookingId INT NOT NULL,
  templateKey VARCHAR(64) NOT NULL,
  status ENUM('pending','sent','dismissed','failed') NOT NULL DEFAULT 'pending',
  scheduledFor TIMESTAMP NULL,
  payload JSON NULL,
  errorMessage TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  sentAt TIMESTAMP NULL,
  dismissedAt TIMESTAMP NULL,
  dismissedBy INT NULL,
  sentBy INT NULL,
  INDEX idx_bnq_status (status),
  INDEX idx_bnq_booking (bookingId)
);


-- ─── 3. Social Media Posts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS socialPosts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  platform ENUM('instagram','facebook','twitter','tiktok','linkedin') NOT NULL,
  title VARCHAR(255) NULL,
  body MEDIUMTEXT NOT NULL,
  caption TEXT NULL,
  hashtags TEXT NULL,
  imagePrompt TEXT NULL,
  imageUrl TEXT NULL,
  scheduledFor TIMESTAMP NULL,
  status ENUM('draft','scheduled','published','archived') NOT NULL DEFAULT 'draft',
  tags JSON NULL,
  createdBy INT NULL,
  publishedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_sp_status (status),
  INDEX idx_sp_scheduled (scheduledFor)
);


-- ─── 4. AI Admin Assistant ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aiAssistantConversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'New conversation',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_aac_user (userId)
);

CREATE TABLE IF NOT EXISTS aiAssistantMessages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversationId INT NOT NULL,
  role ENUM('user','assistant','system') NOT NULL,
  content MEDIUMTEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_aam_conv (conversationId)
);


-- ─── 5. Travel Hacks ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS travelHacks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  summary TEXT NULL,
  body MEDIUMTEXT NOT NULL,
  category VARCHAR(100) NULL,
  tags JSON NULL,
  isPublished BOOLEAN NOT NULL DEFAULT FALSE,
  createdBy INT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);


-- ─── 6. Destination Spotlights ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS destinationSpotlights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destination VARCHAR(255) NOT NULL,
  country VARCHAR(255) NULL,
  season VARCHAR(100) NULL,
  headline VARCHAR(500) NULL,
  copyShort TEXT NULL,
  copyLong MEDIUMTEXT NULL,
  imagePrompts JSON NULL,
  socialCaption TEXT NULL,
  status ENUM('draft','ready','published') NOT NULL DEFAULT 'draft',
  createdBy INT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
