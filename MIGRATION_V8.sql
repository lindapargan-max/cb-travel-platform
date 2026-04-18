-- V8 Migration: Things to Do + Hotel Photos
-- Run this on your Railway MySQL database

CREATE TABLE IF NOT EXISTS `destinationActivities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `destination` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text,
  `rating` decimal(3,1) DEFAULT NULL,
  `imageUrl` text,
  `wikiUrl` text,
  `sortOrder` int DEFAULT 0,
  `addedBy` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_destination_activities_destination` (`destination`)
);

CREATE TABLE IF NOT EXISTS `bookingPhotos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bookingId` int NOT NULL,
  `imageUrl` text NOT NULL,
  `imageKey` text,
  `caption` text,
  `sortOrder` int DEFAULT 0,
  `uploadedBy` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_booking_photos_booking` (`bookingId`)
);

-- OPTIONAL: Add OpenTripMap API key to app settings
-- INSERT INTO appSettings (settingKey, settingValue) VALUES ('opentripmap_api_key', 'YOUR_KEY_HERE')
-- ON DUPLICATE KEY UPDATE settingValue = settingValue;
