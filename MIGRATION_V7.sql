-- CB Travel V7 Migration
-- New features: Support Tickets + Group Bookings
-- Run this BEFORE deploying V7 code. Safe to run multiple times (IF NOT EXISTS).

-- ─── Support Tickets ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS supportTickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  ticketType ENUM('general_enquiry','request_extra','complaint','other') DEFAULT 'general_enquiry' NOT NULL,
  message TEXT NOT NULL,
  status ENUM('open','in_progress','resolved') DEFAULT 'open' NOT NULL,
  fileUrl TEXT,
  fileKey TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_st_user (userId),
  INDEX idx_st_status (status),
  INDEX idx_st_type (ticketType),
  INDEX idx_st_created (createdAt)
);

-- ─── Ticket Messages (thread) ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticketMessages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticketId INT NOT NULL,
  userId INT NOT NULL,
  message TEXT NOT NULL,
  fileUrl TEXT,
  fileKey TEXT,
  isAdmin BOOLEAN DEFAULT false NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_tm_ticket (ticketId),
  INDEX idx_tm_user (userId)
);

-- ─── Booking Members (group / travel party) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS bookingMembers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bookingId INT NOT NULL,
  userId INT NOT NULL,
  addedBy INT NOT NULL,
  role ENUM('lead','member') DEFAULT 'member' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY uq_booking_member (bookingId, userId),
  INDEX idx_bm_booking (bookingId),
  INDEX idx_bm_user (userId)
);
