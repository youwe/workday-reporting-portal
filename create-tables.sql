-- Create all tables manually
CREATE TABLE IF NOT EXISTS uploadTypes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  requiredFields TEXT,
  sampleHeaders TEXT,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  sortOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS journalLines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uploadId INT NOT NULL,
  journal TEXT,
  journalNumber VARCHAR(100),
  company VARCHAR(255) NOT NULL,
  status VARCHAR(50),
  accountingDate VARCHAR(50),
  source VARCHAR(100),
  ledger VARCHAR(50),
  currency VARCHAR(10),
  ledgerAccount VARCHAR(255),
  debitAmount VARCHAR(50),
  creditAmount VARCHAR(50),
  lineMemo TEXT,
  costCenter VARCHAR(255),
  customer VARCHAR(255),
  supplier VARCHAR(255),
  intercompanyMatchId VARCHAR(100),
  metadata TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS customerInvoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uploadId INT NOT NULL,
  invoice VARCHAR(100) NOT NULL,
  company VARCHAR(255) NOT NULL,
  customer VARCHAR(255),
  customerId VARCHAR(100),
  invoiceDate VARCHAR(50),
  invoiceAmount VARCHAR(50),
  amountDue VARCHAR(50),
  taxAmount VARCHAR(50),
  currency VARCHAR(10),
  dueDate VARCHAR(50),
  paymentStatus VARCHAR(50),
  invoiceType VARCHAR(50),
  metadata TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS supplierInvoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uploadId INT NOT NULL,
  supplierInvoice VARCHAR(100) NOT NULL,
  company VARCHAR(255) NOT NULL,
  supplier VARCHAR(255),
  invoiceDate VARCHAR(50),
  invoiceAmount VARCHAR(50),
  balanceDue VARCHAR(50),
  taxAmount VARCHAR(50),
  currency VARCHAR(10),
  dueDate VARCHAR(50),
  status VARCHAR(50),
  intercompany VARCHAR(10),
  metadata TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS customerContracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uploadId INT NOT NULL,
  contract VARCHAR(100) NOT NULL,
  company VARCHAR(255) NOT NULL,
  customer VARCHAR(255),
  customerId VARCHAR(100),
  contractType VARCHAR(100),
  currency VARCHAR(10),
  contractAmount VARCHAR(50),
  remainingAmount VARCHAR(50),
  effectiveDate VARCHAR(50),
  contractStatus VARCHAR(50),
  metadata TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS timeEntries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uploadId INT NOT NULL,
  worker VARCHAR(255),
  date VARCHAR(50),
  totalHours VARCHAR(50),
  billableHours VARCHAR(50),
  customerBillingStatus VARCHAR(50),
  amountToBill VARCHAR(50),
  rateToBill VARCHAR(50),
  company VARCHAR(255),
  project VARCHAR(255),
  customer VARCHAR(255),
  metadata TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS intercompanyTransactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period VARCHAR(50) NOT NULL,
  fromCompany VARCHAR(255) NOT NULL,
  toCompany VARCHAR(255) NOT NULL,
  amount VARCHAR(50) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  transactionType VARCHAR(100),
  matchId VARCHAR(100),
  eliminated BOOLEAN DEFAULT FALSE,
  eliminationLevel VARCHAR(100),
  sourceJournalLineId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
