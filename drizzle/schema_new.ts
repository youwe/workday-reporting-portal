import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

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
 * Organizations table with hierarchical structure
 * Supports: Smart Nes > Outstrive > Symson BV
 *           Smart Nes > Youwe Holding BV > Youwe entities
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  parentId: int("parentId"), // null for top-level (Smart Nes)
  type: mysqlEnum("type", ["holding", "services", "saas"]).notNull(),
  reportingType: mysqlEnum("reportingType", ["standalone", "consolidated"]).notNull(),
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
  code: varchar("code", { length: 50 }).notNull().unique(), // e.g., "general_ledger", "customer_invoices"
  description: text("description"),
  requiredFields: text("requiredFields"), // JSON array of required field names
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UploadType = typeof uploadTypes.$inferSelect;
export type InsertUploadType = typeof uploadTypes.$inferInsert;

/**
 * Upload requirements per organization type
 * Defines which upload types are required for each organization type
 */
export const uploadRequirements = mysqlTable("uploadRequirements", {
  id: int("id").autoincrement().primaryKey(),
  organizationType: mysqlEnum("organizationType", ["holding", "services", "saas"]).notNull(),
  uploadTypeId: int("uploadTypeId").notNull(),
  required: boolean("required").default(true).notNull(),
  frequency: mysqlEnum("frequency", ["monthly", "quarterly", "yearly"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UploadRequirement = typeof uploadRequirements.$inferSelect;
export type InsertUploadRequirement = typeof uploadRequirements.$inferInsert;

/**
 * Data uploads table
 */
export const dataUploads = mysqlTable("dataUploads", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  uploadTypeId: int("uploadTypeId").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: mysqlEnum("fileType", ["csv", "excel"]).notNull(),
  fileUrl: text("fileUrl").notNull(),
  period: varchar("period", { length: 50 }).notNull(), // e.g., "2024-Q1", "2024-01"
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  recordCount: int("recordCount"),
  errorMessage: text("errorMessage"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type DataUpload = typeof dataUploads.$inferSelect;
export type InsertDataUpload = typeof dataUploads.$inferInsert;

/**
 * Financial data table (stores parsed data from uploads)
 */
export const financialData = mysqlTable("financialData", {
  id: int("id").autoincrement().primaryKey(),
  uploadId: int("uploadId").notNull(),
  organizationId: int("organizationId").notNull(),
  period: varchar("period", { length: 50 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  amount: varchar("amount", { length: 50 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("EUR").notNull(),
  metadata: text("metadata"), // JSON string for additional fields
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FinancialData = typeof financialData.$inferSelect;
export type InsertFinancialData = typeof financialData.$inferInsert;

/**
 * KPI calculations table
 * Stores calculated KPIs for each organization and period
 */
export const kpiData = mysqlTable("kpiData", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  period: varchar("period", { length: 50 }).notNull(),
  kpiType: varchar("kpiType", { length: 100 }).notNull(), // e.g., "gross_margin", "mrr", "churn_rate"
  value: varchar("value", { length: 50 }).notNull(),
  unit: varchar("unit", { length: 20 }), // e.g., "%", "EUR", "count"
  metadata: text("metadata"), // JSON for additional calculation details
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});

export type KpiData = typeof kpiData.$inferSelect;
export type InsertKpiData = typeof kpiData.$inferInsert;

/**
 * Reports table
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
