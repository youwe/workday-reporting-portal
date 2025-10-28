import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, organizations, InsertOrganization, dataUploads, InsertDataUpload, financialData, InsertFinancialData, reports, InsertReport } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

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

// Organization queries
export async function getAllOrganizations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(organizations);
}

export async function getOrganizationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrganization(org: InsertOrganization) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(organizations).values(org);
  return result;
}

// Data upload queries
export async function createDataUpload(upload: InsertDataUpload) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dataUploads).values(upload);
  return result;
}

export async function getDataUploadsByOrganization(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dataUploads).where(eq(dataUploads.organizationId, organizationId)).orderBy(dataUploads.uploadedAt);
}

export async function getAllDataUploads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dataUploads).orderBy(dataUploads.uploadedAt);
}

export async function updateDataUploadStatus(id: number, status: "pending" | "processing" | "completed" | "failed", errorMessage?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(dataUploads).set({ status, errorMessage }).where(eq(dataUploads.id, id));
}

// Financial data queries
export async function createFinancialData(data: InsertFinancialData[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(financialData).values(data);
}

export async function getFinancialDataByUpload(uploadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(financialData).where(eq(financialData.uploadId, uploadId));
}

export async function getFinancialDataByOrganizationAndPeriod(organizationId: number, period: string) {
  const db = await getDb();
  if (!db) return [];
  const { and } = await import("drizzle-orm");
  return db.select().from(financialData).where(and(eq(financialData.organizationId, organizationId), eq(financialData.period, period)));
}

// Report queries
export async function createReport(report: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(reports).values(report);
}

export async function getReportsByOrganization(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).where(eq(reports.organizationId, organizationId)).orderBy(reports.generatedAt);
}

export async function getAllReports() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).orderBy(reports.generatedAt);
}
