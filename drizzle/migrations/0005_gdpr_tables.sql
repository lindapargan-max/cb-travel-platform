-- GDPR Requests table
CREATE TABLE IF NOT EXISTS `gdprRequests` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('SAR', 'erasure', 'complaint') NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `phone` VARCHAR(30),
  `description` TEXT,
  `reason` VARCHAR(100),
  `relationship` VARCHAR(50),
  `status` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
  `adminNotes` TEXT,
  `completedAt` TIMESTAMP NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Deletion Logs table (audit trail for GDPR deletions)
CREATE TABLE IF NOT EXISTS `deletionLogs` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `entityType` ENUM('user', 'booking', 'marketingContact', 'loyaltyPoints', 'enquiry') NOT NULL,
  `entityId` INT NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `deletedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedBy` ENUM('automated', 'user_request', 'admin') NOT NULL DEFAULT 'automated'
);
