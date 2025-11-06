import { eq, and, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from 'pg';
const { Pool } = pg;
import { 
  InsertUser, 
  users, 
  organizations,
  uploadTypes,
  dataUploads,
  journalLines,
  customerInvoices,
  supplierInvoices,
  customerContracts,
  timeEntries,
  intercompanyTransactions,
  kpiData,
  reports,
  type Organization,
  type UploadType,
  type DataUpload,
  type JournalLine,
  type InsertJournalLine,
  type InsertCustomerInvoice,
  type InsertSupplierInvoice,
  type InsertCustomerContract,
  type InsertTimeEntry,
  type InsertIntercompanyTransaction,
  type InsertKpiData,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ========== USER FUNCTIONS ==========

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ========== ORGANIZATION FUNCTIONS ==========

export async function getAllOrganizations(): Promise<Organization[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(organizations).where(eq(organizations.active, true));
  return result;
}

export async function getOrganizationById(id: number): Promise<Organization | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return result[0];
}

export async function getOrganizationsByParent(parentId: number | null): Promise<Organization[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(organizations).where(
    parentId === null 
      ? sql`${organizations.parentId} IS NULL`
      : eq(organizations.parentId, parentId)
  );
  return result;
}

// ========== UPLOAD TYPE FUNCTIONS ==========

export async function getAllUploadTypes(): Promise<UploadType[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(uploadTypes)
    .where(eq(uploadTypes.active, true))
    .orderBy(uploadTypes.sortOrder);
  return result;
}

export async function getUploadTypeByCode(code: string): Promise<UploadType | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  // Convert to uppercase for case-insensitive matching
  const upperCode = code.toUpperCase();
  const result = await db.select().from(uploadTypes).where(eq(uploadTypes.code, upperCode)).limit(1);
  return result[0];
}

// ========== DATA UPLOAD FUNCTIONS ==========

export async function createDataUpload(upload: Omit<DataUpload, 'id' | 'uploadedAt'>): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(dataUploads).values(upload as any).returning({ id: dataUploads.id });
  return result[0].id;
}

export async function getDataUploadsByPeriod(period: string): Promise<DataUpload[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(dataUploads).where(eq(dataUploads.period, period));
  return result;
}

export async function updateDataUploadStatus(
  id: number, 
  status: 'pending' | 'processing' | 'completed' | 'failed',
  recordCount?: number,
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(dataUploads)
    .set({ status, recordCount, errorMessage })
    .where(eq(dataUploads.id, id));
}

// ========== JOURNAL LINES FUNCTIONS ==========

export async function insertJournalLines(lines: InsertJournalLine[]): Promise<void> {
  const db = await getDb();
  if (!db || lines.length === 0) return;
  
  await db.insert(journalLines).values(lines as any);
}

export async function getJournalLinesByPeriod(period: string): Promise<JournalLine[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Extract period from accounting date (assuming format like "1/1/24" or "2024-01-01")
  const result = await db.select().from(journalLines)
    .where(sql`${journalLines.accountingDate} LIKE ${`%${period}%`}`);
  return result;
}

// ========== CUSTOMER INVOICE FUNCTIONS ==========

export async function insertCustomerInvoices(invoices: InsertCustomerInvoice[]): Promise<void> {
  const db = await getDb();
  if (!db || invoices.length === 0) return;
  
  await db.insert(customerInvoices).values(invoices as any);
}

// ========== SUPPLIER INVOICE FUNCTIONS ==========

export async function insertSupplierInvoices(invoices: InsertSupplierInvoice[]): Promise<void> {
  const db = await getDb();
  if (!db || invoices.length === 0) return;
  
  await db.insert(supplierInvoices).values(invoices as any);
}

// ========== CUSTOMER CONTRACT FUNCTIONS ==========

export async function insertCustomerContracts(contracts: InsertCustomerContract[]): Promise<void> {
  const db = await getDb();
  if (!db || contracts.length === 0) return;
  
  await db.insert(customerContracts).values(contracts as any);
}

// ========== TIME ENTRY FUNCTIONS ==========

export async function insertTimeEntries(entries: InsertTimeEntry[]): Promise<void> {
  const db = await getDb();
  if (!db || entries.length === 0) return;
  
  await db.insert(timeEntries).values(entries as any);
}

// ========== INTERCOMPANY TRANSACTION FUNCTIONS ==========

export async function insertIntercompanyTransactions(transactions: InsertIntercompanyTransaction[]): Promise<void> {
  const db = await getDb();
  if (!db || transactions.length === 0) return;
  
  await db.insert(intercompanyTransactions).values(transactions as any);
}

export async function getIntercompanyTransactionsByPeriod(period: string): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(intercompanyTransactions)
    .where(eq(intercompanyTransactions.period, period));
  return result;
}

// ========== KPI FUNCTIONS ==========

export async function insertKpiData(kpis: InsertKpiData[]): Promise<void> {
  const db = await getDb();
  if (!db || kpis.length === 0) return;
  
  await db.insert(kpiData).values(kpis as any);
}

export async function getKpisByOrganizationAndPeriod(organizationId: number, period: string): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(kpiData)
    .where(and(
      eq(kpiData.organizationId, organizationId),
      eq(kpiData.period, period)
    ));
  return result;
}

// ========== REPORT FUNCTIONS ==========

export async function getReportsByOrganization(organizationId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(reports)
    .where(eq(reports.organizationId, organizationId));
  return result;
}
