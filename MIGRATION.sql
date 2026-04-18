-- ─────────────────────────────────────────────────────────────────────────────
-- CB Travel — Incremental Migration: Booked Destinations
-- Run this against your Railway MySQL database.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create bookedDestinations table (homepage "Destinations Booked So Far" section)
CREATE TABLE IF NOT EXISTS bookedDestinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  imageUrl TEXT,
  lastBooked VARCHAR(50),
  sortOrder INT NOT NULL DEFAULT 0,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Seed with the six destinations that were previously hardcoded on the homepage
INSERT INTO bookedDestinations (name, imageUrl, lastBooked, sortOrder) VALUES
  ('Santorini, Greece',  'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=600&q=80', NULL, 1),
  ('Dubai, UAE',         'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80', NULL, 2),
  ('Maldives',           'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80', NULL, 3),
  ('New York, USA',      'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&q=80', NULL, 4),
  ('Bali, Indonesia',    'https://images.unsplash.com/photo-1549693578-d683be217e58?w=600&q=80', NULL, 5),
  ('Venice, Italy',      'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=600&q=80', NULL, 6);
