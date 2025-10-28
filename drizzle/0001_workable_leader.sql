CREATE TABLE `dataUploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` enum('csv','excel') NOT NULL,
	`fileUrl` text NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`recordCount` int,
	`errorMessage` text,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataUploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financialData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadId` int NOT NULL,
	`organizationId` int NOT NULL,
	`period` varchar(50) NOT NULL,
	`category` varchar(100) NOT NULL,
	`subcategory` varchar(100),
	`amount` varchar(50) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'EUR',
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financialData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('services','saas') NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`reportType` varchar(100) NOT NULL,
	`period` varchar(50) NOT NULL,
	`generatedBy` int NOT NULL,
	`fileUrl` text,
	`status` enum('draft','generated','sent') NOT NULL DEFAULT 'draft',
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
