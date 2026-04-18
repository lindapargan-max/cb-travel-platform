-- CB Travel V6 Migration
-- Run this BEFORE deploying the new code.
-- Safe to run multiple times (IF NOT EXISTS / ON DUPLICATE KEY).

-- ─── Users table additions ──────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS dateOfBirth DATE NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referralCode VARCHAR(50) NULL;

-- ─── Bookings table additions ───────────────────────────────────────────────
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS flightStatusNumber VARCHAR(20) NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notificationsEnabled BOOLEAN DEFAULT true;

-- ─── Booking Feedback ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookingFeedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bookingId INT NOT NULL,
  userId INT NOT NULL,
  overallRating INT NOT NULL,
  destinationRating INT NOT NULL,
  serviceRating INT NOT NULL,
  comment TEXT,
  promoCodeId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_bf_booking (bookingId),
  INDEX idx_bf_user (userId)
);

-- ─── Client Notes (CRM) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientNotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  note TEXT NOT NULL,
  createdBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_cn_user (userId)
);

-- ─── Loyalty Accounts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyaltyAccounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  points INT DEFAULT 0 NOT NULL,
  lifetimePoints INT DEFAULT 0 NOT NULL,
  tier ENUM('bronze','silver','gold') DEFAULT 'bronze' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_la_user (userId)
);

-- ─── Loyalty Transactions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyaltyTransactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  points INT NOT NULL,
  type ENUM('earn','redeem','expire','adjustment','bonus','referral','birthday') NOT NULL,
  description VARCHAR(500) NOT NULL,
  reason VARCHAR(500),
  bookingId INT,
  adminId INT,
  adminNote TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_lt_user (userId)
);

-- ─── Loyalty Rewards ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyaltyRewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pointsCost INT NOT NULL,
  category VARCHAR(100) DEFAULT 'General' NOT NULL,
  minTier ENUM('bronze','silver','gold') DEFAULT 'bronze' NOT NULL,
  stock INT,
  stockUsed INT DEFAULT 0 NOT NULL,
  imageUrl VARCHAR(500),
  termsAndConditions TEXT,
  isFeatured BOOLEAN DEFAULT false NOT NULL,
  sortOrder INT DEFAULT 0 NOT NULL,
  rewardType VARCHAR(50) DEFAULT 'voucher' NOT NULL,
  rewardValue VARCHAR(100),
  isActive BOOLEAN DEFAULT true NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Loyalty Tier History
CREATE TABLE IF NOT EXISTS loyaltyTierHistory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  fromTier ENUM('bronze','silver','gold') NOT NULL,
  toTier ENUM('bronze','silver','gold') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_lth_user (userId)
);

-- ─── Loyalty Redemptions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyaltyRedemptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  rewardId INT NOT NULL,
  pointsSpent INT NOT NULL,
  voucherCode VARCHAR(100),
  voucherImagePath VARCHAR(500),
  expiresAt TIMESTAMP,
  status ENUM('active','redeemed','expired','cancelled') DEFAULT 'active' NOT NULL,
  adminNote TEXT,
  adminId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_lr_user (userId)
);

-- ─── Audit Logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auditLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actorId INT,
  actorType ENUM('admin','client','system') NOT NULL,
  action VARCHAR(100) NOT NULL,
  entityType VARCHAR(50),
  entityId INT,
  oldValue JSON,
  newValue JSON,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_al_actor (actorId),
  INDEX idx_al_action (action),
  INDEX idx_al_created (createdAt)
);

-- ─── Notification Log ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificationLog (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bookingId INT NOT NULL,
  notificationType ENUM('7day','48hour','departure_day') NOT NULL,
  sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY unique_booking_notification (bookingId, notificationType)
);

-- ─── Newsletter Subscribers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletterSubscribers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  name VARCHAR(255),
  subscribedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  isActive BOOLEAN DEFAULT true NOT NULL,
  unsubscribeToken VARCHAR(100),
  INDEX idx_ns_email (email)
);

-- ─── Newsletter Campaigns ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletterCampaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  htmlBody LONGTEXT NOT NULL,
  status ENUM('draft','scheduled','sent') DEFAULT 'draft' NOT NULL,
  scheduledAt TIMESTAMP NULL,
  sentAt TIMESTAMP NULL,
  sentCount INT DEFAULT 0 NOT NULL,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- ─── App Settings ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appSettings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  settingKey VARCHAR(100) NOT NULL UNIQUE,
  settingValue TEXT,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- ─── Seed: App Settings ─────────────────────────────────────────────────────
INSERT IGNORE INTO appSettings (settingKey, settingValue) VALUES
  ('emergency_whatsapp', '07534168295'),
  ('emergency_mobile', '07534168295'),
  ('live_chat_whatsapp', '07495823953'),
  ('openai_api_key', ''),
  ('ai_features_enabled', 'true'),
  ('whatsapp_chat_enabled', 'true'),
  ('notifications_7day_enabled', 'true'),
  ('notifications_48hour_enabled', 'true'),
  ('notifications_departure_enabled', 'true');

-- ─── Seed: Loyalty Rewards (if empty) ──────────────────────────────────────
INSERT INTO loyaltyRewards (name, description, pointsCost, rewardType, rewardValue, isActive)
SELECT '£10 Discount Voucher', 'Get £10 off your next booking with CB Travel.', 200, 'voucher', '10.00', true
WHERE NOT EXISTS (SELECT 1 FROM loyaltyRewards LIMIT 1);

INSERT INTO loyaltyRewards (name, description, pointsCost, rewardType, rewardValue, isActive)
SELECT 'Priority Support', 'Jump to the front of the queue — dedicated priority service.', 300, 'service', 'priority', true
WHERE NOT EXISTS (SELECT 1 FROM loyaltyRewards WHERE name = 'Priority Support');

INSERT INTO loyaltyRewards (name, description, pointsCost, rewardType, rewardValue, isActive)
SELECT 'Room Upgrade Request', 'We will request a complimentary room upgrade on your behalf.', 400, 'service', 'upgrade', true
WHERE NOT EXISTS (SELECT 1 FROM loyaltyRewards WHERE name = 'Room Upgrade Request');

INSERT INTO loyaltyRewards (name, description, pointsCost, rewardType, rewardValue, isActive)
SELECT 'Airport Lounge Access', 'Relax before your flight in premium airport lounge comfort.', 500, 'voucher', 'lounge', true
WHERE NOT EXISTS (SELECT 1 FROM loyaltyRewards WHERE name = 'Airport Lounge Access');

INSERT INTO loyaltyRewards (name, description, pointsCost, rewardType, rewardValue, isActive)
SELECT '£25 Discount Voucher', 'Get £25 off your next booking with CB Travel.', 500, 'voucher', '25.00', true
WHERE NOT EXISTS (SELECT 1 FROM loyaltyRewards WHERE name = '£25 Discount Voucher');

-- ─── Seed: Booked Destinations (if empty) ───────────────────────────────────
INSERT INTO bookedDestinations (name, imageUrl, lastBooked, sortOrder, isActive)
SELECT 'Maldives', 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800', 'March 2025', 1, true
WHERE NOT EXISTS (SELECT 1 FROM bookedDestinations LIMIT 1);

INSERT INTO bookedDestinations (name, imageUrl, lastBooked, sortOrder, isActive)
SELECT 'Tenerife', 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800', 'February 2025', 2, true
WHERE NOT EXISTS (SELECT 1 FROM bookedDestinations WHERE name = 'Tenerife');

INSERT INTO bookedDestinations (name, imageUrl, lastBooked, sortOrder, isActive)
SELECT 'Dubai', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', 'January 2025', 3, true
WHERE NOT EXISTS (SELECT 1 FROM bookedDestinations WHERE name = 'Dubai');

INSERT INTO bookedDestinations (name, imageUrl, lastBooked, sortOrder, isActive)
SELECT 'Bali', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', 'March 2025', 4, true
WHERE NOT EXISTS (SELECT 1 FROM bookedDestinations WHERE name = 'Bali');

INSERT INTO bookedDestinations (name, imageUrl, lastBooked, sortOrder, isActive)
SELECT 'New York', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800', 'February 2025', 5, true
WHERE NOT EXISTS (SELECT 1 FROM bookedDestinations WHERE name = 'New York');

INSERT INTO bookedDestinations (name, imageUrl, lastBooked, sortOrder, isActive)
SELECT 'Paris', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', 'January 2025', 6, true
WHERE NOT EXISTS (SELECT 1 FROM bookedDestinations WHERE name = 'Paris');

INSERT INTO bookedDestinations (name, imageUrl, lastBooked, sortOrder, isActive)
SELECT 'Santorini', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800', 'July 2025', 7, true
WHERE NOT EXISTS (SELECT 1 FROM bookedDestinations WHERE name = 'Santorini');

INSERT INTO bookedDestinations (name, imageUrl, lastBooked, sortOrder, isActive)
SELECT 'Thailand', 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800', 'March 2025', 8, true
WHERE NOT EXISTS (SELECT 1 FROM bookedDestinations WHERE name = 'Thailand');

INSERT INTO bookedDestinations (name, imageUrl, lastBooked, sortOrder, isActive)
SELECT 'Barbados', 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800', 'February 2025', 9, true
WHERE NOT EXISTS (SELECT 1 FROM bookedDestinations WHERE name = 'Barbados');

INSERT INTO bookedDestinations (name, imageUrl, lastBooked, sortOrder, isActive)
SELECT 'Cancun', 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800', 'January 2025', 10, true
WHERE NOT EXISTS (SELECT 1 FROM bookedDestinations WHERE name = 'Cancun');


-- ─── Email Logs (missing from original schema) ──────────────────────────────
CREATE TABLE IF NOT EXISTS emailLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  toEmail VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  emailType VARCHAR(100) NOT NULL,
  status ENUM('sent','failed') DEFAULT 'sent' NOT NULL,
  errorMessage TEXT,
  userId INT,
  bookingId INT,
  sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_el_user (userId),
  INDEX idx_el_type (emailType),
  INDEX idx_el_sent (sentAt)
);

-- ─── Password Reset Tokens ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS passwordResetTokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expiresAt TIMESTAMP NOT NULL,
  usedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_prt_token (token),
  INDEX idx_prt_email (email),
  INDEX idx_prt_user (userId)
);
