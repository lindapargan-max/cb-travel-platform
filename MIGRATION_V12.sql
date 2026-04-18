-- MIGRATION V12
-- 1. deals.imageUrl: TEXT -> MEDIUMTEXT (base64 images exceed 65KB TEXT limit)
ALTER TABLE deals MODIFY COLUMN imageUrl MEDIUMTEXT;

-- 2. loyaltyRules.points: INT -> DECIMAL(6,2) to support fractional earn rates (e.g. 0.10 per £1)
ALTER TABLE loyaltyRules MODIFY COLUMN points DECIMAL(6,2) NOT NULL DEFAULT 0.00;
