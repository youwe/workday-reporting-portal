import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { organizations, uploadTypes } from "../drizzle/schema";

async function seedComplete() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'workday_user',
    password: 'workday_pass',
    database: 'workday_reporting'
  });
  const db = drizzle(connection);

  console.log("🌱 Seeding organizations...");

  // Clear existing data
  await db.delete(organizations);
  await db.delete(uploadTypes);

  // Seed organizations with correct hierarchy
  const [smartNes] = await db.insert(organizations).values({
    name: "Smart Nes Holding B.V.",
    code: "SMART_NES",
    parentId: null,
    type: "holding",
    reportingType: "consolidated",
    ownershipPercentage: 100,
    description: "Top-level holding company",
    active: true,
  });

  const [outstrive] = await db.insert(organizations).values({
    name: "Outstrive B.V.",
    code: "OUTSTRIVE",
    parentId: smartNes.insertId,
    type: "holding",
    reportingType: "standalone",
    ownershipPercentage: 100,
    description: "Holding company for Symson",
    active: true,
  });

  const [symson] = await db.insert(organizations).values({
    name: "Symson B.V.",
    code: "SYMSON_BV",
    parentId: outstrive.insertId,
    type: "saas",
    reportingType: "standalone",
    ownershipPercentage: 76, // 76% ownership, 24% minority interest
    description: "SaaS pricing optimization platform",
    active: true,
  });

  const [youweHolding] = await db.insert(organizations).values({
    name: "Youwe Holding B.V.",
    code: "YOUWE_HOLDING",
    parentId: smartNes.insertId,
    type: "holding",
    reportingType: "consolidated",
    ownershipPercentage: 100,
    description: "Holding company for Youwe entities",
    active: true,
  });

  // Youwe entities
  await db.insert(organizations).values([
    {
      name: "Youwe Concept B.V.",
      code: "YOUWE_CONCEPT",
      parentId: youweHolding.insertId,
      type: "services",
      reportingType: "standalone",
      ownershipPercentage: 70, // 70% ownership, 30% minority interest
      description: "Professional services - Concept development",
      active: true,
    },
    {
      name: "Youwe Commerce B.V.",
      code: "YOUWE_COMMERCE",
      parentId: youweHolding.insertId,
      type: "services",
      reportingType: "standalone",
      ownershipPercentage: 100,
      description: "Professional services - E-commerce",
      active: true,
    },
    {
      name: "Youwe Digital B.V.",
      code: "YOUWE_DIGITAL",
      parentId: youweHolding.insertId,
      type: "services",
      reportingType: "standalone",
      ownershipPercentage: 100,
      description: "Professional services - Digital transformation",
      active: true,
    },
    {
      name: "Youwe Hosting B.V.",
      code: "YOUWE_HOSTING",
      parentId: youweHolding.insertId,
      type: "services",
      reportingType: "standalone",
      ownershipPercentage: 100,
      description: "Professional services - Hosting",
      active: true,
    },
    {
      name: "Youwe UK Ltd.",
      code: "YOUWE_UK",
      parentId: youweHolding.insertId,
      type: "services",
      reportingType: "standalone",
      ownershipPercentage: 100,
      description: "Professional services - UK operations",
      active: true,
    },
  ]);

  console.log("✅ Organizations seeded successfully");

  console.log("🌱 Seeding upload types...");

  await db.insert(uploadTypes).values([
    {
      name: "Journal Lines",
      code: "journal_lines",
      description: "General Ledger entries with all financial transactions",
      requiredFields: JSON.stringify(["Journal", "Company", "Accounting Date", "Ledger Account", "Debit Amount", "Credit Amount"]),
      sampleHeaders: JSON.stringify(["Journal", "Journal Number", "Company", "Status", "Accounting Date", "Source", "Ledger", "Currency", "Ledger Account", "Ledger Debit Amount", "Ledger Credit Amount"]),
      sortOrder: 1,
      active: true,
    },
    {
      name: "Customer Invoices",
      code: "customer_invoices",
      description: "Accounts Receivable - Customer invoices",
      requiredFields: JSON.stringify(["Invoice", "Company", "Customer", "Invoice Date", "Invoice Amount"]),
      sampleHeaders: JSON.stringify(["Invoice", "Company", "Customer", "Customer ID", "Invoice Date", "Invoice Amount", "Amount Due", "Currency", "Payment Status"]),
      sortOrder: 2,
      active: true,
    },
    {
      name: "Supplier Invoices",
      code: "supplier_invoices",
      description: "Accounts Payable - Supplier invoices",
      requiredFields: JSON.stringify(["Supplier Invoice", "Company", "Supplier", "Invoice Date", "Invoice Amount"]),
      sampleHeaders: JSON.stringify(["Supplier Invoice", "Company", "Supplier", "Invoice Date", "Invoice Amount", "Balance Due", "Currency", "Status", "Intercompany"]),
      sortOrder: 3,
      active: true,
    },
    {
      name: "Customer Contracts",
      code: "customer_contracts",
      description: "Customer contracts for recurring revenue tracking",
      requiredFields: JSON.stringify(["Contract", "Company", "Customer", "Contract Amount"]),
      sampleHeaders: JSON.stringify(["Contract", "Company", "Customer", "Customer ID", "Contract Type", "Currency", "Contract Amount", "Remaining Amount", "Effective Date"]),
      sortOrder: 4,
      active: true,
    },
    {
      name: "Time Entries",
      code: "time_entries",
      description: "Billable and non-billable time tracking",
      requiredFields: JSON.stringify(["Worker", "Date", "Total Hours", "Billable Hours"]),
      sampleHeaders: JSON.stringify(["Worker", "Date", "Total Hours", "Billable Hours", "Customer Billing Status", "Amount To Bill", "Rate To Bill", "Company", "Project"]),
      sortOrder: 5,
      active: true,
    },
    {
      name: "Bank Statements",
      code: "bank_statements",
      description: "Bank transactions for cash flow analysis",
      requiredFields: JSON.stringify(["Bank Account", "Statement Line Date", "Statement Line Amount"]),
      sampleHeaders: JSON.stringify(["Bank Statement Line", "Bank Account", "Statement Line Date", "Type Code", "Statement Line Amount", "Currency"]),
      sortOrder: 6,
      active: true,
    },
    {
      name: "Customer Payments",
      code: "customer_payments",
      description: "Customer payment transactions",
      requiredFields: JSON.stringify(["Payment", "Customer", "Payment Date", "Payment Amount"]),
      sampleHeaders: JSON.stringify(["Payment", "Payment Date", "Customer", "Customer ID", "Company", "Payment Amount", "Currency", "Payment Status"]),
      sortOrder: 7,
      active: true,
    },
    {
      name: "Supplier Payments",
      code: "supplier_payments",
      description: "Supplier payment transactions",
      requiredFields: JSON.stringify(["Transaction Number", "Supplier", "Payment Date", "Amount in Payment Currency"]),
      sampleHeaders: JSON.stringify(["Transaction Number", "Company", "Payment Date", "Supplier", "Amount in Payment Currency", "Currency"]),
      sortOrder: 8,
      active: true,
    },
    {
      name: "Billing Installments",
      code: "billing_installments",
      description: "Revenue recognition and billing schedules",
      requiredFields: JSON.stringify(["Billing Installment", "Invoice Date", "Total Amount"]),
      sampleHeaders: JSON.stringify(["Billing Installment", "Invoice Date", "Total Amount", "Billing Currency", "From Date", "To Date", "Installment Status"]),
      sortOrder: 9,
      active: true,
    },
    {
      name: "Tax Declaration Lines",
      code: "tax_declarations",
      description: "Tax reporting data",
      requiredFields: JSON.stringify(["Tax Declaration Result Line"]),
      sampleHeaders: JSON.stringify(["Tax Declaration Result Line"]),
      sortOrder: 10,
      active: true,
    },
    {
      name: "HubSpot Deals",
      code: "hubspot_deals",
      description: "Sales pipeline and deal tracking from HubSpot",
      requiredFields: JSON.stringify(["Record ID", "Deal Name", "Amount EUR"]),
      sampleHeaders: JSON.stringify(["Record ID", "Associated Company", "Deal Name", "Deal Stage", "Create Date", "Close Date", "Amount EUR"]),
      sortOrder: 11,
      active: true,
    },
  ]);

  console.log("✅ Upload types seeded successfully");
  console.log("\n🎉 Seed completed!");
  
  process.exit(0);
}

seedComplete().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
