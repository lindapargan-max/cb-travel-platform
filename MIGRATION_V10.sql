CREATE TABLE IF NOT EXISTS loyaltyRules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  eventKey VARCHAR(64) NOT NULL UNIQUE,
  label VARCHAR(128) NOT NULL,
  description TEXT,
  points INT NOT NULL DEFAULT 0,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  isPerPound TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO loyaltyRules (eventKey, label, description, points, isActive, isPerPound) VALUES
('referral_referrer', 'Referral — Referrer Reward', 'Points awarded to the customer who referred a new client when they sign up', 150, 1, 0),
('referral_new_user', 'Referral — New Member Bonus', 'Points awarded to a new customer who joined via a referral link', 50, 1, 0),
('feedback_submission', 'Feedback Submission', 'Points awarded when a customer submits feedback for a completed booking', 50, 1, 0),
('booking_completed', 'Booking Completed (flat)', 'Flat points awarded to the linked customer when a booking is marked as completed', 100, 0, 0),
('booking_per_pound', 'Booking Completed (per £ spent)', 'Points awarded per £1 of booking total when a booking is marked as completed. Set to 0 to disable.', 0, 0, 1)
ON DUPLICATE KEY UPDATE label=VALUES(label)
