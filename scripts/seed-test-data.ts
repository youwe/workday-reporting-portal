import { drizzle } from "drizzle-orm/mysql2";
import { organizations, dataUploads, financialData, reports } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function seedTestData() {
  const db = drizzle(process.env.DATABASE_URL!);

  console.log("Getting organizations...");
  const orgs = await db.select().from(organizations);
  
  if (orgs.length === 0) {
    console.error("No organizations found. Run seed-data.ts first!");
    process.exit(1);
  }

  const uwiOrg = orgs.find(o => o.name === "UWI");
  const simsenOrg = orgs.find(o => o.name === "SIMSEN");

  if (!uwiOrg || !simsenOrg) {
    console.error("UWI or SIMSEN organization not found!");
    process.exit(1);
  }

  console.log("Creating test uploads...");
  
  // Create test upload for UWI
  const [uwiUpload] = await db.insert(dataUploads).values({
    organizationId: uwiOrg.id,
    uploadedBy: 1, // Assuming admin user ID is 1
    fileName: "uwi-q1-2024.csv",
    fileType: "csv",
    fileUrl: "https://example.com/uwi-q1-2024.csv",
    status: "completed",
    recordCount: 15,
  });

  // Create test upload for SIMSEN
  const [simsenUpload] = await db.insert(dataUploads).values({
    organizationId: simsenOrg.id,
    uploadedBy: 1,
    fileName: "simsen-q1-2024.csv",
    fileType: "csv",
    fileUrl: "https://example.com/simsen-q1-2024.csv",
    status: "completed",
    recordCount: 20,
  });

  console.log("Creating test financial data...");

  // UWI Financial Data (Services)
  await db.insert(financialData).values([
    // Balance Sheet
    { uploadId: uwiUpload.insertId, organizationId: uwiOrg.id, period: "2024-Q1", category: "assets", subcategory: "current_assets", amount: "500000", currency: "EUR" },
    { uploadId: uwiUpload.insertId, organizationId: uwiOrg.id, period: "2024-Q1", category: "assets", subcategory: "fixed_assets", amount: "1200000", currency: "EUR" },
    { uploadId: uwiUpload.insertId, organizationId: uwiOrg.id, period: "2024-Q1", category: "liabilities", subcategory: "current_liabilities", amount: "300000", currency: "EUR" },
    { uploadId: uwiUpload.insertId, organizationId: uwiOrg.id, period: "2024-Q1", category: "equity", subcategory: "share_capital", amount: "1400000", currency: "EUR" },
    
    // Income Statement
    { uploadId: uwiUpload.insertId, organizationId: uwiOrg.id, period: "2024-Q1", category: "revenue", subcategory: "services", amount: "850000", currency: "EUR" },
    { uploadId: uwiUpload.insertId, organizationId: uwiOrg.id, period: "2024-Q1", category: "cost_of_sales", subcategory: "direct_costs", amount: "400000", currency: "EUR" },
    { uploadId: uwiUpload.insertId, organizationId: uwiOrg.id, period: "2024-Q1", category: "operating_expenses", subcategory: "salaries", amount: "200000", currency: "EUR" },
    
    // KPIs
    { uploadId: uwiUpload.insertId, organizationId: uwiOrg.id, period: "2024-Q1", category: "gross_margin", amount: "52.94", currency: "EUR", metadata: JSON.stringify({ unit: "%" }) },
    { uploadId: uwiUpload.insertId, organizationId: uwiOrg.id, period: "2024-Q1", category: "ebitda", amount: "250000", currency: "EUR", metadata: JSON.stringify({ unit: "EUR" }) },
  ]);

  // SIMSEN Financial Data (SaaS)
  await db.insert(financialData).values([
    // Balance Sheet
    { uploadId: simsenUpload.insertId, organizationId: simsenOrg.id, period: "2024-Q1", category: "assets", subcategory: "current_assets", amount: "800000", currency: "EUR" },
    { uploadId: simsenUpload.insertId, organizationId: simsenOrg.id, period: "2024-Q1", category: "assets", subcategory: "fixed_assets", amount: "400000", currency: "EUR" },
    { uploadId: simsenUpload.insertId, organizationId: simsenOrg.id, period: "2024-Q1", category: "liabilities", subcategory: "current_liabilities", amount: "200000", currency: "EUR" },
    { uploadId: simsenUpload.insertId, organizationId: simsenOrg.id, period: "2024-Q1", category: "equity", subcategory: "share_capital", amount: "1000000", currency: "EUR" },
    
    // Income Statement
    { uploadId: simsenUpload.insertId, organizationId: simsenOrg.id, period: "2024-Q1", category: "revenue", subcategory: "subscription", amount: "450000", currency: "EUR" },
    { uploadId: simsenUpload.insertId, organizationId: simsenOrg.id, period: "2024-Q1", category: "cost_of_sales", subcategory: "hosting", amount: "50000", currency: "EUR" },
    { uploadId: simsenUpload.insertId, organizationId: simsenOrg.id, period: "2024-Q1", category: "operating_expenses", subcategory: "r_and_d", amount: "180000", currency: "EUR" },
    
    // SaaS KPIs
    { uploadId: simsenUpload.insertId, organizationId: simsenOrg.id, period: "2024-Q1", category: "mrr", amount: "150000", currency: "EUR", metadata: JSON.stringify({ unit: "EUR/month" }) },
    { uploadId: simsenUpload.insertId, organizationId: simsenOrg.id, period: "2024-Q1", category: "arr", amount: "1800000", currency: "EUR", metadata: JSON.stringify({ unit: "EUR/year" }) },
    { uploadId: simsenUpload.insertId, organizationId: simsenOrg.id, period: "2024-Q1", category: "churn", amount: "2.5", currency: "EUR", metadata: JSON.stringify({ unit: "%" }) },
    { uploadId: simsenUpload.insertId, organizationId: simsenOrg.id, period: "2024-Q1", category: "cac", amount: "1200", currency: "EUR", metadata: JSON.stringify({ unit: "EUR" }) },
    { uploadId: simsenUpload.insertId, organizationId: simsenOrg.id, period: "2024-Q1", category: "ltv", amount: "36000", currency: "EUR", metadata: JSON.stringify({ unit: "EUR" }) },
    { uploadId: simsenUpload.insertId, organizationId: simsenOrg.id, period: "2024-Q1", category: "ltv_cac", amount: "30", currency: "EUR", metadata: JSON.stringify({ unit: "ratio" }) },
  ]);

  console.log("Test data seeding completed!");
  process.exit(0);
}

seedTestData().catch((error) => {
  console.error("Test data seeding failed:", error);
  process.exit(1);
});
