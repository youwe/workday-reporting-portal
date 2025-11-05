-- Complete schema voor Workday Reporting Portal

-- Organizations table
CREATE TABLE IF NOT EXISTS `organizations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL UNIQUE,
  `parentId` int,
  `type` enum('holding','services','saas') NOT NULL,
  `reportingType` enum('standalone','consolidated') NOT NULL,
  `ownershipPercentage` int NOT NULL DEFAULT 100,
  `description` text,
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);

-- Upload Types table
CREATE TABLE IF NOT EXISTS `uploadTypes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL UNIQUE,
  `description` text,
  `requiredFields` text,
  `sampleHeaders` text,
  `active` boolean NOT NULL DEFAULT true,
  `sortOrder` int DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `uploadTypes_id` PRIMARY KEY(`id`)
);

-- Update dataUploads table (check if columns exist first)
SET @dbname = DATABASE();
SET @tablename = 'dataUploads';
SET @columnname = 'uploadTypeId';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' int NOT NULL AFTER organizationId')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'period';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' varchar(50) NOT NULL AFTER uploadTypeId')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Reports table (already exists, just ensure it's there)
CREATE TABLE IF NOT EXISTS `reports` (
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

-- Journal Lines table
CREATE TABLE IF NOT EXISTS `journalLines` (
  `id` int AUTO_INCREMENT NOT NULL,
  `uploadId` int NOT NULL,
  `journal` text,
  `journalNumber` varchar(100),
  `company` varchar(255) NOT NULL,
  `status` varchar(50),
  `accountingDate` varchar(50),
  `source` varchar(100),
  `ledger` varchar(50),
  `currency` varchar(10),
  `ledgerAccount` varchar(255),
  `debitAmount` varchar(50),
  `creditAmount` varchar(50),
  `lineMemo` text,
  `costCenter` varchar(255),
  `customer` varchar(255),
  `supplier` varchar(255),
  `intercompanyMatchId` varchar(100),
  `metadata` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `journalLines_id` PRIMARY KEY(`id`)
);

-- Customer Invoices table
CREATE TABLE IF NOT EXISTS `customerInvoices` (
  `id` int AUTO_INCREMENT NOT NULL,
  `uploadId` int NOT NULL,
  `invoice` varchar(100) NOT NULL,
  `company` varchar(255) NOT NULL,
  `customer` varchar(255),
  `customerId` varchar(100),
  `invoiceDate` varchar(50),
  `invoiceAmount` varchar(50),
  `amountDue` varchar(50),
  `taxAmount` varchar(50),
  `currency` varchar(10),
  `dueDate` varchar(50),
  `paymentStatus` varchar(50),
  `invoiceType` varchar(50),
  `metadata` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `customerInvoices_id` PRIMARY KEY(`id`)
);

-- Supplier Invoices table
CREATE TABLE IF NOT EXISTS `supplierInvoices` (
  `id` int AUTO_INCREMENT NOT NULL,
  `uploadId` int NOT NULL,
  `supplierInvoice` varchar(100) NOT NULL,
  `company` varchar(255) NOT NULL,
  `supplier` varchar(255),
  `invoiceDate` varchar(50),
  `invoiceAmount` varchar(50),
  `balanceDue` varchar(50),
  `taxAmount` varchar(50),
  `currency` varchar(10),
  `dueDate` varchar(50),
  `status` varchar(50),
  `intercompany` varchar(10),
  `metadata` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `supplierInvoices_id` PRIMARY KEY(`id`)
);

-- Customer Contracts table
CREATE TABLE IF NOT EXISTS `customerContracts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `uploadId` int NOT NULL,
  `contract` varchar(100) NOT NULL,
  `company` varchar(255) NOT NULL,
  `customer` varchar(255),
  `customerId` varchar(100),
  `contractType` varchar(100),
  `currency` varchar(10),
  `contractAmount` varchar(50),
  `remainingAmount` varchar(50),
  `effectiveDate` varchar(50),
  `contractStatus` varchar(50),
  `metadata` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `customerContracts_id` PRIMARY KEY(`id`)
);

-- Time Entries table
CREATE TABLE IF NOT EXISTS `timeEntries` (
  `id` int AUTO_INCREMENT NOT NULL,
  `uploadId` int NOT NULL,
  `worker` varchar(255),
  `date` varchar(50),
  `totalHours` varchar(50),
  `billableHours` varchar(50),
  `customerBillingStatus` varchar(50),
  `amountToBill` varchar(50),
  `rateToBill` varchar(50),
  `company` varchar(255),
  `project` varchar(255),
  `customer` varchar(255),
  `metadata` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `timeEntries_id` PRIMARY KEY(`id`)
);

-- Intercompany Transactions table
CREATE TABLE IF NOT EXISTS `intercompanyTransactions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `period` varchar(50) NOT NULL,
  `fromCompany` varchar(255) NOT NULL,
  `toCompany` varchar(255) NOT NULL,
  `amount` varchar(50) NOT NULL,
  `currency` varchar(10) DEFAULT 'EUR',
  `transactionType` varchar(100),
  `matchId` varchar(100),
  `eliminated` boolean DEFAULT false,
  `eliminationLevel` varchar(100),
  `sourceJournalLineId` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `intercompanyTransactions_id` PRIMARY KEY(`id`)
);

-- KPI Data table
CREATE TABLE IF NOT EXISTS `kpiData` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `period` varchar(50) NOT NULL,
  `kpiType` varchar(100) NOT NULL,
  `value` varchar(50) NOT NULL,
  `unit` varchar(20),
  `metadata` text,
  `calculatedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `kpiData_id` PRIMARY KEY(`id`)
);
