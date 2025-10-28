import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
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

// Organizations table
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["services", "saas"]).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// Data uploads table
export const dataUploads = mysqlTable("dataUploads", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
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

// Financial data table (stores parsed data from uploads)
export const financialData = mysqlTable("financialData", {
  id: int("id").autoincrement().primaryKey(),
  uploadId: int("uploadId").notNull(),
  organizationId: int("organizationId").notNull(),
  period: varchar("period", { length: 50 }).notNull(), // e.g., "2024-Q1", "2024-01"
  category: varchar("category", { length: 100 }).notNull(), // e.g., "revenue", "expenses", "assets"
  subcategory: varchar("subcategory", { length: 100 }),
  amount: varchar("amount", { length: 50 }).notNull(), // stored as string to preserve precision
  currency: varchar("currency", { length: 10 }).default("EUR").notNull(),
  metadata: text("metadata"), // JSON string for additional fields
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FinancialData = typeof financialData.$inferSelect;
export type InsertFinancialData = typeof financialData.$inferInsert;

// Reports table
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  reportType: varchar("reportType", { length: 100 }).notNull(), // e.g., "balance_sheet", "income_statement"
  period: varchar("period", { length: 50 }).notNull(),
  generatedBy: int("generatedBy").notNull(),
  fileUrl: text("fileUrl"),
  status: mysqlEnum("status", ["draft", "generated", "sent"]).default("draft").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;