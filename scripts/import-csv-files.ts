/**
 * Import CSV files directly from /home/ubuntu/upload directory
 * This script processes the uploaded Workday CSV files and imports them into the database
 */

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { drizzle } from 'drizzle-orm/mysql2';
import { 
  journalLines, 
  customerInvoices, 
  supplierInvoices,
  customerContracts,
  timeEntries,
  bankStatements,
  customerPayments,
  supplierPayments,
  billingInstallments,
  taxDeclarations,
  hubspotDeals,
  organizations,
  uploads,
  uploadTypes
} from '../drizzle/schema';
import { CSV_MAPPINGS, findColumn, parseDate, parseAmount } from '../shared/csvMappings';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL!);

// Entity name normalization
const ENTITY_MAPPINGS: Record<string, string> = {
  'Outstrive B.V.': 'Outstrive',
  'Symson B.V.': 'Symson',
  'Youwe Commerce B.V.': 'Youwe Commerce',
  'Youwe Concept B.V.': 'Youwe Concept',
  'Youwe Sweden AB': 'Youwe Sweden',
  'Youwe ConnectiT B.V.': 'Youwe ConnectiT',
  'Youwe Digital B.V.': 'Youwe Digital',
  'Youwe Holding B.V.': 'Youwe Holding',
  'Smart Nes B.V.': 'Smart Nes',
};

function normalizeEntityName(name: string): string {
  const trimmed = name.trim();
  return ENTITY_MAPPINGS[trimmed] || trimmed.replace(/ B\.V\.$| AB$| Ltd\.$| Inc\.$/, '').trim();
}

// Get or create organization
async function getOrCreateOrganization(name: string): Promise<number> {
  const normalized = normalizeEntityName(name);
  
  const existing = await db.select().from(organizations).where(eq(organizations.name, normalized)).limit(1);
  if (existing.length > 0) {
    return existing[0].id;
  }

  // Determine organization type
  let type: 'holding' | 'operating' | 'subsidiary' = 'operating';
  if (normalized.includes('Holding')) type = 'holding';
  if (normalized === 'Symson' || normalized === 'Outstrive') type = 'subsidiary';

  const result = await db.insert(organizations).values({
    name: normalized,
    code: normalized.toUpperCase().replace(/\s+/g, '_'),
    type,
    isActive: true,
  });

  return result[0].insertId;
}

// Extract period from date (YYYY-MM format)
function getPeriodFromDate(date: Date | null): string {
  if (!date) return '2024-01'; // fallback
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

// Process Journal Lines
async function importJournalLines() {
  console.log('\n=== Importing Journal Lines ===');
  const content = readFileSync('/home/ubuntu/upload/Journal-Lines.csv', 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true });
  
  const mapping = CSV_MAPPINGS.journal_lines;
  let imported = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      const company = record[findColumn(Object.keys(record), mapping.mappings.find(m => m.field === 'company')!.aliases)!];
      const accountingDate = parseDate(record[findColumn(Object.keys(record), mapping.mappings.find(m => m.field === 'accountingDate')!.aliases)!]);
      
      if (!company || !accountingDate) {
        skipped++;
        continue;
      }

      const organizationId = await getOrCreateOrganization(company);
      const period = getPeriodFromDate(accountingDate);

      await db.insert(journalLines).values({
        organizationId,
        period,
        journal: record['Journal'] || '',
        journalNumber: record['Journal Number'] || null,
        intercompanyInitiatingCompany: record['Intercompany Initiating Company'] || null,
        status: record['Status'] || 'Posted',
        accountingDate,
        source: record['Source'] || null,
        ledger: record['Ledger'] || null,
        currency: record['Currency'] || 'EUR',
        ledgerAccount: record['Ledger Account'] || '',
        debitAmount: parseAmount(record['Ledger Debit Amount'] || '0'),
        creditAmount: parseAmount(record['Ledger Credit Amount'] || '0'),
        lineMemo: record['Line Memo'] || null,
        revenueCategory: record['Revenue Category'] || null,
        spendCategory: record['Spend Category as Worktag'] || null,
        costCenter: record['Cost Center'] || null,
        customer: record['Customer'] || null,
        project: record['Project'] || null,
        worker: record['Worker'] || null,
        supplier: record['Supplier as Worktag'] || null,
        intercompanyMatchId: record['Intercompany Match ID'] || null,
      });

      imported++;
    } catch (error) {
      console.error('Error importing journal line:', error);
      skipped++;
    }
  }

  console.log(`Imported: ${imported}, Skipped: ${skipped}`);
}

// Process Customer Invoices
async function importCustomerInvoices() {
  console.log('\n=== Importing Customer Invoices ===');
  const content = readFileSync('/home/ubuntu/upload/Customer-Invoices.csv', 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true });
  
  let imported = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      const company = record['Company'];
      const invoiceDate = parseDate(record['Invoice Date']);
      
      if (!company || !invoiceDate) {
        skipped++;
        continue;
      }

      const organizationId = await getOrCreateOrganization(company);
      const period = getPeriodFromDate(invoiceDate);

      await db.insert(customerInvoices).values({
        organizationId,
        period,
        invoice: record['Invoice'] || '',
        customer: record['Customer'] || '',
        customerId: record['Customer ID'] || null,
        invoiceStatus: record['Invoice Status'] || '',
        invoiceType: record['Invoice Type'] || null,
        invoiceDate,
        invoiceAmount: parseAmount(record['Invoice Amount'] || '0'),
        amountDue: parseAmount(record['Amount Due'] || '0'),
        taxAmount: parseAmount(record['Tax Amount'] || '0'),
        currency: record['Currency'] || 'EUR',
        dueDate: parseDate(record['Due Date']),
        paymentStatus: record['Payment Status'] || null,
        paymentType: record['Payment Type'] || null,
        memo: record['Memo'] || null,
      });

      imported++;
    } catch (error) {
      console.error('Error importing customer invoice:', error);
      skipped++;
    }
  }

  console.log(`Imported: ${imported}, Skipped: ${skipped}`);
}

// Process Supplier Invoices
async function importSupplierInvoices() {
  console.log('\n=== Importing Supplier Invoices ===');
  const content = readFileSync('/home/ubuntu/upload/Supplier-Invoices.csv', 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true });
  
  let imported = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      const company = record['Company'];
      const invoiceDate = parseDate(record['Invoice Date']);
      
      if (!company || !invoiceDate) {
        skipped++;
        continue;
      }

      const organizationId = await getOrCreateOrganization(company);
      const period = getPeriodFromDate(invoiceDate);

      await db.insert(supplierInvoices).values({
        organizationId,
        period,
        supplierInvoice: record['Supplier Invoice'] || '',
        invoiceNumber: record['Invoice Number'] || null,
        intercompany: record['Intercompany'] === 'Yes' || record['Direct Intercompany'] === 'Yes',
        status: record['Status'] || '',
        supplier: record['Supplier'] || '',
        supplierInvoiceNumber: record["Supplier's Invoice Number"] || null,
        invoiceDate,
        accountingDate: parseDate(record['Accounting Date']),
        dueDate: parseDate(record['Due Date']),
        invoiceAmount: parseAmount(record['Invoice Amount'] || '0'),
        balanceDue: parseAmount(record['Balance Due'] || '0'),
        taxAmount: parseAmount(record['Tax Amount'] || '0'),
        currency: record['Currency'] || 'EUR',
        memo: record['Memo'] || null,
        paymentType: record['Payment Type'] || null,
      });

      imported++;
    } catch (error) {
      console.error('Error importing supplier invoice:', error);
      skipped++;
    }
  }

  console.log(`Imported: ${imported}, Skipped: ${skipped}`);
}

// Process Time Entries
async function importTimeEntries() {
  console.log('\n=== Importing Time Entries ===');
  const content = readFileSync('/home/ubuntu/upload/All-Time-Entries.csv', 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true });
  
  let imported = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      const company = record['Company'];
      const date = parseDate(record['Date']);
      
      if (!company || !date) {
        skipped++;
        continue;
      }

      const organizationId = await getOrCreateOrganization(company);
      const period = getPeriodFromDate(date);

      await db.insert(timeEntries).values({
        organizationId,
        period,
        worker: record['Worker'] || '',
        date,
        hours: parseAmount(record['Hours'] || '0'),
        billableHours: parseAmount(record['Billable Hours'] || '0'),
        customer: record['Customer'] || null,
        project: record['Project'] || null,
        billingStatus: record['Customer Billing Status'] || null,
        rate: parseAmount(record['Rate'] || '0'),
      });

      imported++;
    } catch (error) {
      console.error('Error importing time entry:', error);
      skipped++;
    }
  }

  console.log(`Imported: ${imported}, Skipped: ${skipped}`);
}

// Main import function
async function main() {
  console.log('Starting CSV import...\n');
  console.log('Database URL:', process.env.DATABASE_URL ? 'Connected' : 'Not set');

  try {
    await importJournalLines();
    await importCustomerInvoices();
    await importSupplierInvoices();
    await importTimeEntries();
    
    // TODO: Add other import functions
    // await importCustomerContracts();
    // await importBankStatements();
    // await importCustomerPayments();
    // await importSupplierPayments();
    // await importBillingInstallments();
    // await importTaxDeclarations();
    // await importHubspotDeals();

    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

main();
