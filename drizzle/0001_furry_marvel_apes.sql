CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int,
	`bookingReference` varchar(100) NOT NULL,
	`status` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
	`departureDate` varchar(50),
	`returnDate` varchar(50),
	`destination` varchar(255),
	`leadPassengerName` varchar(255),
	`leadPassengerEmail` varchar(320),
	`leadPassengerPhone` varchar(30),
	`leadPassengerDob` varchar(20),
	`totalPrice` decimal(10,2),
	`amountPaid` decimal(10,2) DEFAULT '0',
	`numberOfTravelers` int,
	`notes` text,
	`dealId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookings_bookingReference_unique` UNIQUE(`bookingReference`)
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`destination` varchar(255) NOT NULL,
	`category` enum('package_holiday','cruise','business_travel','luxury','adventure','city_break','other') NOT NULL DEFAULT 'package_holiday',
	`description` text NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`originalPrice` decimal(10,2),
	`duration` varchar(100),
	`departureDate` varchar(100),
	`imageUrl` text,
	`highlights` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`clientId` int,
	`fileName` varchar(255) NOT NULL,
	`fileKey` text NOT NULL,
	`fileUrl` text NOT NULL,
	`documentType` enum('booking_confirmation','itinerary','invoice','receipt','other') NOT NULL DEFAULT 'booking_confirmation',
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletterSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsletterSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletterSubscriptions_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `quoteRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(30),
	`travelType` varchar(100) NOT NULL,
	`destination` varchar(255),
	`numberOfTravelers` int,
	`departureDate` varchar(100),
	`returnDate` varchar(100),
	`budget` varchar(100),
	`message` text,
	`status` enum('new','contacted','quoted','completed','cancelled') NOT NULL DEFAULT 'new',
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quoteRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientImage` text,
	`destination` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`rating` int NOT NULL,
	`isApproved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(30);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` text;