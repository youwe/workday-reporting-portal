/**
 * Import all CSV files from /home/ubuntu/upload
 * Compatible with current database schema
 */

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { 
  journalLines, 
  customerInvoices, 
  supplierInvoices,
  customerContracts,
  timeEntries,
  dataUploads,
  uploadTypes
} from '../drizzle/schema';
import { parseDate, parseAmount } from '../shared/csvMappings';
import { eq } from 'drizzle-orm';

// Create database connection
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'workday_user',
  password: 'workday_pass',
  database: 'workday_reporting',
});
const db = drizzle(connection);

// Get period from date
function getPeriod(dateStr: string): string {
  const date = parseDate(dateStr);
  if (!date) return '2024-01';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Create upload record
async function createUpload(typeCode: string, fileName: string, period: string): Promise<number> {
  const uploadType = await db.select().from(uploadTypes).where(eq(uploadTypes.code, typeCode)).limit(1);
  if (!uploadType || uploadType.length === 0) {
    throw new Error(`Upload type not found: ${typeCode}`);
  }

  const result = await db.insert(dataUploads).values({
    organizationId: null,
    uploadTypeId: uploadType[0].id,
    uploadedBy: 1, // Dev user
    period,
    fileName,
    fileType: 'csv',
    fileUrl: '',
    status: 'processing',
  });

  return result[0].insertId;
}

// Update upload status
async function updateUploadStatus(uploadId: number, status: 'completed' | 'failed', recordCount: number, error?: string) {
  await db.update(dataUploads)
    .set({ 
      status, 
      recordCount: recordCount || 0,
      errorMessage: error || null 
    })
    .where(eq(dataUploads.id, uploadId));
}

// Import Journal Lines
async function importJournalLines() {
  console.log('\n📄 Importing Journal Lines...');
  const filePath = '/home/ubuntu/upload/Journal-Lines.csv';
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  
  console.log(`   Found ${records.length} records`);
  
  // Get period from first record
  const period = records[0]['Accounting Date'] ? getPeriod(records[0]['Accounting Date']) : '2024-01';
  const uploadId = await createUpload('journal_lines', 'Journal-Lines.csv', period);
  
  let imported = 0;
  let batch: any[] = [];
  const BATCH_SIZE = 1000;

  for (const record of records) {
    try {
      batch.push({
        uploadId,
        journal: record['Journal'] || '',
        journalNumber: record['Journal Number'] || null,
        company: record['Company'] || '',
        status: record['Status'] || 'Posted',
        accountingDate: record['Accounting Date'] || null,
        source: record['Source'] || null,
        ledger: record['Ledger'] || null,
        currency: record['Currency'] || 'EUR',
        ledgerAccount: record['Ledger Account'] || '',
        debitAmount: record['Ledger Debit Amount'] || '0',
        creditAmount: record['Ledger Credit Amount'] || '0',
        lineMemo: record['Line Memo'] || null,
        costCenter: record['Cost Center'] || null,
        customer: record['Customer'] || null,
        supplier: record['Supplier as Worktag'] || null,
        intercompanyMatchId: record['Intercompany Match ID'] || null,
      });

      if (batch.length >= BATCH_SIZE) {
        await db.insert(journalLines).values(batch);
        imported += batch.length;
        console.log(`   Imported ${imported} records...`);
        batch = [];
      }
    } catch (error) {
      console.error('Error processing journal line:', error);
    }
  }

  // Insert remaining records
  if (batch.length > 0) {
    await db.insert(journalLines).values(batch);
    imported += batch.length;
  }

  await updateUploadStatus(uploadId, 'completed', imported);
  console.log(`   ✅ Completed: ${imported} records`);
}

// Import Customer Invoices
async function importCustomerInvoices() {
  console.log('\n📄 Importing Customer Invoices...');
  const filePath = '/home/ubuntu/upload/Customer-Invoices.csv';
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  
  console.log(`   Found ${records.length} records`);
  
  const period = records[0]['Invoice Date'] ? getPeriod(records[0]['Invoice Date']) : '2024-01';
  const uploadId = await createUpload('customer_invoices', 'Customer-Invoices.csv', period);
  
  let imported = 0;
  let batch: any[] = [];
  const BATCH_SIZE = 1000;

  for (const record of records) {
    try {
      batch.push({
        uploadId,
        invoice: record['Invoice'] || '',
        company: record['Company'] || '',
        customer: record['Customer'] || '',
        customerId: record['Customer ID'] || null,
        invoiceDate: record['Invoice Date'] || null,
        invoiceAmount: record['Invoice Amount'] || '0',
        amountDue: record['Amount Due'] || '0',
        taxAmount: record['Tax Amount'] || '0',
        currency: record['Currency'] || 'EUR',
        dueDate: record['Due Date'] || null,
        paymentStatus: record['Payment Status'] || null,
        invoiceType: record['Invoice Type'] || null,
      });

      if (batch.length >= BATCH_SIZE) {
        await db.insert(customerInvoices).values(batch);
        imported += batch.length;
        console.log(`   Imported ${imported} records...`);
        batch = [];
      }
    } catch (error) {
      console.error('Error processing customer invoice:', error);
    }
  }

  if (batch.length > 0) {
    await db.insert(customerInvoices).values(batch);
    imported += batch.length;
  }

  await updateUploadStatus(uploadId, 'completed', imported);
  console.log(`   ✅ Completed: ${imported} records`);
}

// Import Supplier Invoices
async function importSupplierInvoices() {
  console.log('\n📄 Importing Supplier Invoices...');
  const filePath = '/home/ubuntu/upload/Supplier-Invoices.csv';
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  
  console.log(`   Found ${records.length} records`);
  
  const period = records[0]['Invoice Date'] ? getPeriod(records[0]['Invoice Date']) : '2024-01';
  const uploadId = await createUpload('supplier_invoices', 'Supplier-Invoices.csv', period);
  
  let imported = 0;
  let batch: any[] = [];
  const BATCH_SIZE = 1000;

  for (const record of records) {
    try {
      batch.push({
        uploadId,
        supplierInvoice: record['Supplier Invoice'] || '',
        company: record['Company'] || '',
        supplier: record['Supplier'] || '',
        invoiceDate: record['Invoice Date'] || null,
        invoiceAmount: record['Invoice Amount'] || '0',
        balanceDue: record['Balance Due'] || '0',
        taxAmount: record['Tax Amount'] || '0',
        currency: record['Currency'] || 'EUR',
        dueDate: record['Due Date'] || null,
        status: record['Status'] || '',
        intercompany: record['Intercompany'] || '',
      });

      if (batch.length >= BATCH_SIZE) {
        await db.insert(supplierInvoices).values(batch);
        imported += batch.length;
        console.log(`   Imported ${imported} records...`);
        batch = [];
      }
    } catch (error) {
      console.error('Error processing supplier invoice:', error);
    }
  }

  if (batch.length > 0) {
    await db.insert(supplierInvoices).values(batch);
    imported += batch.length;
  }

  await updateUploadStatus(uploadId, 'completed', imported);
  console.log(`   ✅ Completed: ${imported} records`);
}

// Import Customer Contracts
async function importCustomerContracts() {
  console.log('\n📄 Importing Customer Contracts...');
  const filePath = '/home/ubuntu/upload/Customer-Contracts.csv';
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  
  console.log(`   Found ${records.length} records`);
  
  const period = records[0]['Effective Date'] ? getPeriod(records[0]['Effective Date']) : '2024-01';
  const uploadId = await createUpload('customer_contracts', 'Customer-Contracts.csv', period);
  
  let imported = 0;
  let batch: any[] = [];
  const BATCH_SIZE = 1000;

  for (const record of records) {
    try {
      batch.push({
        uploadId,
        contract: record['Contract'] || '',
        company: record['Company'] || '',
        customer: record['Sold-To Customer'] || record['Customer'] || '',
        customerId: record['Customer ID'] || null,
        contractType: record['Contract Type'] || null,
        currency: record['Currency'] || 'EUR',
        contractAmount: record['Contract Amount'] || '0',
        remainingAmount: record['Remaining Amount'] || '0',
        effectiveDate: record['Effective Date'] || null,
        contractStatus: record['Contract Status'] || '',
      });

      if (batch.length >= BATCH_SIZE) {
        await db.insert(customerContracts).values(batch);
        imported += batch.length;
        console.log(`   Imported ${imported} records...`);
        batch = [];
      }
    } catch (error) {
      console.error('Error processing customer contract:', error);
    }
  }

  if (batch.length > 0) {
    await db.insert(customerContracts).values(batch);
    imported += batch.length;
  }

  await updateUploadStatus(uploadId, 'completed', imported);
  console.log(`   ✅ Completed: ${imported} records`);
}

// Import Time Entries
async function importTimeEntries() {
  console.log('\n📄 Importing Time Entries...');
  const filePath = '/home/ubuntu/upload/All-Time-Entries.csv';
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  
  console.log(`   Found ${records.length} records`);
  
  // Find date column
  const dateCol = records[0]['Date'] || records[0]['Time Block'] || '';
  const period = dateCol ? getPeriod(dateCol) : '2024-01';
  const uploadId = await createUpload('time_entries', 'All-Time-Entries.csv', period);
  
  let imported = 0;
  let batch: any[] = [];
  const BATCH_SIZE = 1000;

  for (const record of records) {
    try {
      batch.push({
        uploadId,
        worker: record['Worker'] || '',
        date: record['Date'] || record['Time Block'] || null,
        totalHours: record['Total Reported Hours'] || '0',
        billableHours: record['Billable Hours'] || '0',
        customerBillingStatus: record['Customer Billing Status'] || null,
        amountToBill: record['Amount To Bill'] || record['YW RPT CC Amount to Bill'] || '0',
        rateToBill: record['Rate To Bill'] || '0',
        company: record['Contract Company'] || record['Company'] || '',
        project: record['Reported Project'] || null,
        customer: record['Project Customer'] || null,
      });

      if (batch.length >= BATCH_SIZE) {
        await db.insert(timeEntries).values(batch);
        imported += batch.length;
        console.log(`   Imported ${imported} records...`);
        batch = [];
      }
    } catch (error) {
      console.error('Error processing time entry:', error);
    }
  }

  if (batch.length > 0) {
    await db.insert(timeEntries).values(batch);
    imported += batch.length;
  }

  await updateUploadStatus(uploadId, 'completed', imported);
  console.log(`   ✅ Completed: ${imported} records`);
}

// Main function
async function main() {
  console.log('🚀 Starting CSV Import\n');
  console.log('Database: workday_reporting');

  try {
    await importJournalLines();
    await importCustomerInvoices();
    await importSupplierInvoices();
    await importCustomerContracts();
    await importTimeEntries();

    console.log('\n✅ All imports completed successfully!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    await connection.end();
    process.exit(1);
  }
}

main();
