-- CB Travel — Missing Tables Migration
-- Creates flightDetails, hotelDetails, and checklistItems tables
-- which exist in the schema but were missing from all migration files.
-- Safe to run multiple times (IF NOT EXISTS).
-- Run this on your Railway MySQL database before (re)deploying.

-- ─── Flight Details ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `flightDetails` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bookingId` int NOT NULL,
  `outboundFlightNumber` varchar(20) DEFAULT NULL,
  `outboundDeparture` varchar(100) DEFAULT NULL,
  `outboundArrival` varchar(100) DEFAULT NULL,
  `outboundDepartureTime` varchar(50) DEFAULT NULL,
  `outboundArrivalTime` varchar(50) DEFAULT NULL,
  `returnFlightNumber` varchar(20) DEFAULT NULL,
  `returnDeparture` varchar(100) DEFAULT NULL,
  `returnArrival` varchar(100) DEFAULT NULL,
  `returnDepartureTime` varchar(50) DEFAULT NULL,
  `returnArrivalTime` varchar(50) DEFAULT NULL,
  `airline` varchar(100) DEFAULT NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_flight_booking` (`bookingId`)
);

-- ─── Hotel Details ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `hotelDetails` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bookingId` int NOT NULL,
  `hotelName` varchar(255) NOT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `checkInDate` varchar(50) DEFAULT NULL,
  `checkOutDate` varchar(50) DEFAULT NULL,
  `roomType` varchar(100) DEFAULT NULL,
  `address` text,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(320) DEFAULT NULL,
  `website` varchar(500) DEFAULT NULL,
  `confirmationNumber` varchar(100) DEFAULT NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hotel_booking` (`bookingId`)
);

-- ─── Checklist Items ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `checklistItems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bookingId` int NOT NULL,
  `userId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `isCompleted` tinyint(1) NOT NULL DEFAULT '0',
  `category` varchar(100) DEFAULT NULL,
  `dueDate` varchar(50) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_checklist_booking` (`bookingId`),
  KEY `idx_checklist_user` (`userId`)
);
