-- Workday Reporting Portal - PostgreSQL Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  "parentId" INTEGER REFERENCES organizations(id),
  "minorityInterest" DECIMAL(5,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Upload Types table
CREATE TABLE IF NOT EXISTS "uploadTypes" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  "requiredFields" JSON,
  "sampleHeaders" JSON,
  active BOOLEAN DEFAULT true,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Uploads table
CREATE TABLE IF NOT EXISTS "dataUploads" (
  id SERIAL PRIMARY KEY,
  "organizationId" INTEGER REFERENCES organizations(id),
  "uploadTypeId" INTEGER NOT NULL REFERENCES "uploadTypes"(id),
  "uploadedBy" INTEGER NOT NULL REFERENCES users(id),
  period VARCHAR(20),
  "fileName" VARCHAR(255),
  "fileType" VARCHAR(50),
  "fileUrl" TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  "recordCount" INTEGER DEFAULT 0,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal Lines table
CREATE TABLE IF NOT EXISTS "journalLines" (
  id SERIAL PRIMARY KEY,
  "uploadId" INTEGER NOT NULL REFERENCES "dataUploads"(id),
  journal VARCHAR(255),
  "journalNumber" VARCHAR(100),
  company VARCHAR(255) NOT NULL,
  status VARCHAR(50),
  "accountingDate" VARCHAR(50),
  source VARCHAR(100),
  ledger VARCHAR(100),
  currency VARCHAR(10),
  "ledgerAccount" VARCHAR(100),
  "ledgerDebitAmount" VARCHAR(50),
  "ledgerCreditAmount" VARCHAR(50),
  metadata JSON,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Invoices table
CREATE TABLE IF NOT EXISTS "customerInvoices" (
  id SERIAL PRIMARY KEY,
  "uploadId" INTEGER NOT NULL REFERENCES "dataUploads"(id),
  invoice VARCHAR(100),
  company VARCHAR(255) NOT NULL,
  customer VARCHAR(255),
  "customerId" VARCHAR(100),
  "invoiceDate" VARCHAR(50),
  "invoiceAmount" VARCHAR(50),
  "amountDue" VARCHAR(50),
  currency VARCHAR(10),
  "paymentStatus" VARCHAR(50),
  metadata JSON,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Invoices table
CREATE TABLE IF NOT EXISTS "supplierInvoices" (
  id SERIAL PRIMARY KEY,
  "uploadId" INTEGER NOT NULL REFERENCES "dataUploads"(id),
  "supplierInvoice" VARCHAR(100),
  company VARCHAR(255) NOT NULL,
  supplier VARCHAR(255),
  "invoiceDate" VARCHAR(50),
  "invoiceAmount" VARCHAR(50),
  "balanceDue" VARCHAR(50),
  currency VARCHAR(10),
  status VARCHAR(50),
  intercompany VARCHAR(10),
  metadata JSON,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Contracts table
CREATE TABLE IF NOT EXISTS "customerContracts" (
  id SERIAL PRIMARY KEY,
  "uploadId" INTEGER NOT NULL REFERENCES "dataUploads"(id),
  contract VARCHAR(100),
  company VARCHAR(255) NOT NULL,
  customer VARCHAR(255),
  "customerId" VARCHAR(100),
  "contractType" VARCHAR(100),
  currency VARCHAR(10),
  "contractAmount" VARCHAR(50),
  "remainingAmount" VARCHAR(50),
  "effectiveDate" VARCHAR(50),
  metadata JSON,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time Entries table
CREATE TABLE IF NOT EXISTS "timeEntries" (
  id SERIAL PRIMARY KEY,
  "uploadId" INTEGER NOT NULL REFERENCES "dataUploads"(id),
  worker VARCHAR(255),
  date VARCHAR(50),
  "totalHours" VARCHAR(20),
  "billableHours" VARCHAR(20),
  "customerBillingStatus" VARCHAR(100),
  "amountToBill" VARCHAR(50),
  "rateToBill" VARCHAR(50),
  company VARCHAR(255),
  project VARCHAR(255),
  metadata JSON,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Payments table
CREATE TABLE IF NOT EXISTS "supplierPayments" (
  id SERIAL PRIMARY KEY,
  "uploadId" INTEGER NOT NULL REFERENCES "dataUploads"(id),
  "transactionNumber" VARCHAR(100),
  company VARCHAR(255) NOT NULL,
  "paymentDate" VARCHAR(50),
  "paymentStatus" VARCHAR(50),
  supplier VARCHAR(255),
  "paymentType" VARCHAR(100),
  "amountInPaymentCurrency" VARCHAR(50),
  currency VARCHAR(10),
  "invoicesPaid" TEXT,
  metadata JSON,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Payments table
CREATE TABLE IF NOT EXISTS "customerPayments" (
  id SERIAL PRIMARY KEY,
  "uploadId" INTEGER NOT NULL REFERENCES "dataUploads"(id),
  payment VARCHAR(100),
  "transactionId" VARCHAR(100),
  "paymentDate" VARCHAR(50),
  customer VARCHAR(255),
  "customerId" VARCHAR(100),
  company VARCHAR(255) NOT NULL,
  "paymentStatus" VARCHAR(50),
  "applicationStatus" VARCHAR(50),
  currency VARCHAR(10),
  "paymentAmount" VARCHAR(50),
  "onAccountAmount" VARCHAR(50),
  "overpaymentAmount" VARCHAR(50),
  "paymentType" VARCHAR(100),
  "paymentReference" VARCHAR(255),
  memo TEXT,
  metadata JSON,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank Statements table
CREATE TABLE IF NOT EXISTS "bankStatements" (
  id SERIAL PRIMARY KEY,
  "uploadId" INTEGER NOT NULL REFERENCES "dataUploads"(id),
  "bankStatementLine" VARCHAR(100),
  "bankAccount" VARCHAR(100),
  "bankStatement" VARCHAR(100),
  "statementLineDate" VARCHAR(50),
  "typeCode" VARCHAR(200),
  "statementLineAmount" VARCHAR(50),
  "debitCredit" VARCHAR(10),
  currency VARCHAR(10),
  "referenceNumber" VARCHAR(255),
  addenda TEXT,
  "reconciliationStatus" VARCHAR(50),
  metadata JSON,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HubSpot Deals table
CREATE TABLE IF NOT EXISTS "hubspotDeals" (
  id SERIAL PRIMARY KEY,
  "uploadId" INTEGER NOT NULL REFERENCES "dataUploads"(id),
  "recordId" VARCHAR(100),
  "associatedCompany" VARCHAR(255),
  "dealName" VARCHAR(255),
  "dealStage" VARCHAR(100),
  "createDate" VARCHAR(50),
  "closeDate" VARCHAR(50),
  "amountEur" VARCHAR(50),
  "dealOwner" VARCHAR(255),
  "typeSolution" VARCHAR(100),
  "initialDealType" VARCHAR(100),
  "refinedDealType" VARCHAR(100),
  metadata JSON,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Billing Installments table
CREATE TABLE IF NOT EXISTS "billingInstallments" (
  id SERIAL PRIMARY KEY,
  "uploadId" INTEGER NOT NULL REFERENCES "dataUploads"(id),
  "billingInstallment" VARCHAR(100),
  "invoiceDate" VARCHAR(50),
  "totalAmount" VARCHAR(50),
  "billingCurrency" VARCHAR(10),
  "fromDate" VARCHAR(50),
  "toDate" VARCHAR(50),
  "installmentStatus" VARCHAR(50),
  customer VARCHAR(255),
  company VARCHAR(255),
  metadata JSON,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Intercompany Transactions table
CREATE TABLE IF NOT EXISTS "intercompanyTransactions" (
  id SERIAL PRIMARY KEY,
  "sourceEntity" VARCHAR(255),
  "targetEntity" VARCHAR(255),
  amount DECIMAL(15,2),
  currency VARCHAR(10),
  "transactionDate" VARCHAR(50),
  "transactionType" VARCHAR(100),
  "sourceRecordId" INTEGER,
  "sourceRecordType" VARCHAR(50),
  "eliminationLevel" VARCHAR(100),
  status VARCHAR(50) DEFAULT 'detected',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPI Data table
CREATE TABLE IF NOT EXISTS "kpiData" (
  id SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES organizations(id),
  period VARCHAR(20) NOT NULL,
  "kpiType" VARCHAR(100) NOT NULL,
  "kpiName" VARCHAR(255) NOT NULL,
  value DECIMAL(15,2),
  unit VARCHAR(50),
  metadata JSON,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES organizations(id),
  "reportType" VARCHAR(100) NOT NULL,
  period VARCHAR(20) NOT NULL,
  "generatedBy" INTEGER NOT NULL REFERENCES users(id),
  "reportData" JSON,
  "fileUrl" TEXT,
  status VARCHAR(50) DEFAULT 'completed',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_journalLines_uploadId" ON "journalLines"("uploadId");
CREATE INDEX IF NOT EXISTS "idx_journalLines_company" ON "journalLines"(company);
CREATE INDEX IF NOT EXISTS "idx_customerInvoices_uploadId" ON "customerInvoices"("uploadId");
CREATE INDEX IF NOT EXISTS "idx_customerInvoices_company" ON "customerInvoices"(company);
CREATE INDEX IF NOT EXISTS "idx_supplierInvoices_uploadId" ON "supplierInvoices"("uploadId");
CREATE INDEX IF NOT EXISTS "idx_timeEntries_uploadId" ON "timeEntries"("uploadId");
CREATE INDEX IF NOT EXISTS "idx_customerPayments_uploadId" ON "customerPayments"("uploadId");
CREATE INDEX IF NOT EXISTS "idx_supplierPayments_uploadId" ON "supplierPayments"("uploadId");
CREATE INDEX IF NOT EXISTS "idx_bankStatements_uploadId" ON "bankStatements"("uploadId");
CREATE INDEX IF NOT EXISTS "idx_hubspotDeals_uploadId" ON "hubspotDeals"("uploadId");
CREATE INDEX IF NOT EXISTS "idx_hubspotDeals_dealStage" ON "hubspotDeals"("dealStage");
