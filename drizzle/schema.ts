import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Organizations with hierarchical structure and ownership percentages
 * Structure:
 * - Smart Nes (parent: null, ownership: 100%)
 *   - Outstrive (parent: Smart Nes, ownership: 100%)
 *     - Symson BV (parent: Outstrive, ownership: 76%)
 *   - Youwe Holding BV (parent: Smart Nes, ownership: 100%)
 *     - Youwe Concept (parent: Youwe Holding, ownership: 70%)
 *     - Youwe Commerce, Youwe Digital, etc.
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(), // e.g., "SMART_NES", "SYMSON_BV"
  parentId: int("parentId"), // null for top-level (Smart Nes)
  type: mysqlEnum("type", ["holding", "services", "saas"]).notNull(),
  reportingType: mysqlEnum("reportingType", ["standalone", "consolidated"]).notNull(),
  ownershipPercentage: int("ownershipPercentage").default(100).notNull(), // Percentage owned by parent
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Upload types (Workday export types)
 */
export const uploadTypes = mysqlTable("uploadTypes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  requiredFields: text("requiredFields"), // JSON array of required field names
  sampleHeaders: text("sampleHeaders"), // JSON array of expected CSV headers
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UploadType = typeof uploadTypes.$inferSelect;
export type InsertUploadType = typeof uploadTypes.$inferInsert;

/**
 * Data uploads table
 */
export const dataUploads = mysqlTable("dataUploads", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  uploadTypeId: int("uploadTypeId").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  period: varchar("period", { length: 50 }).notNull(), // e.g., "2024-Q1", "2024-01"
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: mysqlEnum("fileType", ["csv", "excel"]).notNull(),
  fileUrl: text("fileUrl").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  recordCount: int("recordCount"),
  errorMessage: text("errorMessage"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type DataUpload = typeof dataUploads.$inferSelect;
export type InsertDataUpload = typeof dataUploads.$inferInsert;

/**
 * Journal Lines (General Ledger entries)
 */
export const journalLines = mysqlTable("journalLines", {
  id: int("id").autoincrement().primaryKey(),
  uploadId: int("uploadId").notNull(),
  journal: text("journal"),
  journalNumber: varchar("journalNumber", { length: 100 }),
  company: varchar("company", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }),
  accountingDate: varchar("accountingDate", { length: 50 }),
  source: varchar("source", { length: 100 }),
  ledger: varchar("ledger", { length: 50 }),
  currency: varchar("currency", { length: 10 }),
  ledgerAccount: varchar("ledgerAccount", { length: 255 }),
  debitAmount: varchar("debitAmount", { length: 50 }),
  creditAmount: varchar("creditAmount", { length: 50 }),
  lineMemo: text("lineMemo"),
  costCenter: varchar("costCenter", { length: 255 }),
  customer: varchar("customer", { length: 255 }),
  supplier: varchar("supplier", { length: 255 }),
  intercompanyMatchId: varchar("intercompanyMatchId", { length: 100 }),
  metadata: text("metadata"), // JSON for additional fields
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JournalLine = typeof journalLines.$inferSelect;
export type InsertJournalLine = typeof journalLines.$inferInsert;

/**
 * Customer Invoices
 */
export const customerInvoices = mysqlTable("customerInvoices", {
  id: int("id").autoincrement().primaryKey(),
  uploadId: int("uploadId").notNull(),
  invoice: varchar("invoice", { length: 100 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  customer: varchar("customer", { length: 255 }),
  customerId: varchar("customerId", { length: 100 }),
  invoiceDate: varchar("invoiceDate", { length: 50 }),
  invoiceAmount: varchar("invoiceAmount", { length: 50 }),
  amountDue: varchar("amountDue", { length: 50 }),
  taxAmount: varchar("taxAmount", { length: 50 }),
  currency: varchar("currency", { length: 10 }),
  dueDate: varchar("dueDate", { length: 50 }),
  paymentStatus: varchar("paymentStatus", { length: 50 }),
  invoiceType: varchar("invoiceType", { length: 50 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerInvoice = typeof customerInvoices.$inferSelect;
export type InsertCustomerInvoice = typeof customerInvoices.$inferInsert;

/**
 * Supplier Invoices
 */
export const supplierInvoices = mysqlTable("supplierInvoices", {
  id: int("id").autoincrement().primaryKey(),
  uploadId: int("uploadId").notNull(),
  supplierInvoice: varchar("supplierInvoice", { length: 100 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  supplier: varchar("supplier", { length: 255 }),
  invoiceDate: varchar("invoiceDate", { length: 50 }),
  invoiceAmount: varchar("invoiceAmount", { length: 50 }),
  balanceDue: varchar("balanceDue", { length: 50 }),
  taxAmount: varchar("taxAmount", { length: 50 }),
  currency: varchar("currency", { length: 10 }),
  dueDate: varchar("dueDate", { length: 50 }),
  status: varchar("status", { length: 50 }),
  intercompany: varchar("intercompany", { length: 10 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupplierInvoice = typeof supplierInvoices.$inferSelect;
export type InsertSupplierInvoice = typeof supplierInvoices.$inferInsert;

/**
 * Customer Contracts
 */
export const customerContracts = mysqlTable("customerContracts", {
  id: int("id").autoincrement().primaryKey(),
  uploadId: int("uploadId").notNull(),
  contract: varchar("contract", { length: 100 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  customer: varchar("customer", { length: 255 }),
  customerId: varchar("customerId", { length: 100 }),
  contractType: varchar("contractType", { length: 100 }),
  currency: varchar("currency", { length: 10 }),
  contractAmount: varchar("contractAmount", { length: 50 }),
  remainingAmount: varchar("remainingAmount", { length: 50 }),
  effectiveDate: varchar("effectiveDate", { length: 50 }),
  contractStatus: varchar("contractStatus", { length: 50 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerContract = typeof customerContracts.$inferSelect;
export type InsertCustomerContract = typeof customerContracts.$inferInsert;

/**
 * Time Entries
 */
export const timeEntries = mysqlTable("timeEntries", {
  id: int("id").autoincrement().primaryKey(),
  uploadId: int("uploadId").notNull(),
  worker: varchar("worker", { length: 255 }),
  date: varchar("date", { length: 50 }),
  totalHours: varchar("totalHours", { length: 50 }),
  billableHours: varchar("billableHours", { length: 50 }),
  customerBillingStatus: varchar("customerBillingStatus", { length: 50 }),
  amountToBill: varchar("amountToBill", { length: 50 }),
  rateToBill: varchar("rateToBill", { length: 50 }),
  company: varchar("company", { length: 255 }),
  project: varchar("project", { length: 255 }),
  customer: varchar("customer", { length: 255 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;

/**
 * Intercompany transactions for elimination
 */
export const intercompanyTransactions = mysqlTable("intercompanyTransactions", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 50 }).notNull(),
  fromCompany: varchar("fromCompany", { length: 255 }).notNull(),
  toCompany: varchar("toCompany", { length: 255 }).notNull(),
  amount: varchar("amount", { length: 50 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("EUR"),
  transactionType: varchar("transactionType", { length: 100 }), // e.g., "invoice", "payment"
  matchId: varchar("matchId", { length: 100 }),
  eliminated: boolean("eliminated").default(false),
  eliminationLevel: varchar("eliminationLevel", { length: 100 }), // e.g., "SMART_NES", "YOUWE_HOLDING"
  sourceJournalLineId: int("sourceJournalLineId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IntercompanyTransaction = typeof intercompanyTransactions.$inferSelect;
export type InsertIntercompanyTransaction = typeof intercompanyTransactions.$inferInsert;

/**
 * KPI calculations
 */
export const kpiData = mysqlTable("kpiData", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  period: varchar("period", { length: 50 }).notNull(),
  kpiType: varchar("kpiType", { length: 100 }).notNull(),
  value: varchar("value", { length: 50 }).notNull(),
  unit: varchar("unit", { length: 20 }),
  metadata: text("metadata"),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});

export type KpiData = typeof kpiData.$inferSelect;
export type InsertKpiData = typeof kpiData.$inferInsert;

/**
 * Reports
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  reportType: varchar("reportType", { length: 100 }).notNull(),
  period: varchar("period", { length: 50 }).notNull(),
  generatedBy: int("generatedBy").notNull(),
  fileUrl: text("fileUrl"),
  status: mysqlEnum("status", ["draft", "generated", "sent"]).default("draft").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
