/**
 * Import remaining CSV files: payments, bank statements, deals, etc.
 */

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { dataUploads, uploadTypes } from '../drizzle/schema';
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
  if (!dateStr) return '2024-01';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '2024-01';
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
    uploadedBy: 1,
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

// Import Supplier Payments
async function importSupplierPayments() {
  console.log('\n📄 Importing Supplier Payments...');
  const filePath = '/home/ubuntu/upload/Supplier-Payments.csv';
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  
  console.log(`   Found ${records.length} records`);
  
  const period = records[0]['Payment Date'] ? getPeriod(records[0]['Payment Date']) : '2024-01';
  const uploadId = await createUpload('supplier_payments', 'Supplier-Payments.csv', period);
  
  let imported = 0;
  let batch: any[] = [];
  const BATCH_SIZE = 1000;

  for (const record of records) {
    try {
      batch.push({
        uploadId,
        transactionNumber: record['Transaction Number'] || null,
        company: record['Company'] || '',
        paymentDate: record['Payment Date'] || null,
        paymentStatus: record['Payment Status'] || null,
        supplier: record['Supplier'] || null,
        paymentType: record['Payment Type'] || null,
        amountInPaymentCurrency: record['Amount in Payment Currency'] || '0',
        currency: record['Currency'] || 'EUR',
        invoicesPaid: record['Invoices Paid'] || null,
      });

      if (batch.length >= BATCH_SIZE) {
        await connection.query(
          `INSERT INTO supplierPayments (uploadId, transactionNumber, company, paymentDate, paymentStatus, supplier, paymentType, amountInPaymentCurrency, currency, invoicesPaid) 
           VALUES ${batch.map(() => '(?,?,?,?,?,?,?,?,?,?)').join(',')}`,
          batch.flatMap(b => [b.uploadId, b.transactionNumber, b.company, b.paymentDate, b.paymentStatus, b.supplier, b.paymentType, b.amountInPaymentCurrency, b.currency, b.invoicesPaid])
        );
        imported += batch.length;
        console.log(`   Imported ${imported} records...`);
        batch = [];
      }
    } catch (error) {
      console.error('Error processing supplier payment:', error);
    }
  }

  if (batch.length > 0) {
    await connection.query(
      `INSERT INTO supplierPayments (uploadId, transactionNumber, company, paymentDate, paymentStatus, supplier, paymentType, amountInPaymentCurrency, currency, invoicesPaid) 
       VALUES ${batch.map(() => '(?,?,?,?,?,?,?,?,?,?)').join(',')}`,
      batch.flatMap(b => [b.uploadId, b.transactionNumber, b.company, b.paymentDate, b.paymentStatus, b.supplier, b.paymentType, b.amountInPaymentCurrency, b.currency, b.invoicesPaid])
    );
    imported += batch.length;
  }

  await updateUploadStatus(uploadId, 'completed', imported);
  console.log(`   ✅ Completed: ${imported} records`);
}

// Import Customer Payments
async function importCustomerPayments() {
  console.log('\n📄 Importing Customer Payments...');
  const filePath = '/home/ubuntu/upload/Customer-Payments.csv';
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  
  console.log(`   Found ${records.length} records`);
  
  const period = records[0]['Payment Date'] ? getPeriod(records[0]['Payment Date']) : '2024-01';
  const uploadId = await createUpload('customer_payments', 'Customer-Payments.csv', period);
  
  let imported = 0;
  let batch: any[] = [];
  const BATCH_SIZE = 1000;

  for (const record of records) {
    try {
      batch.push({
        uploadId,
        payment: record['Payment'] || null,
        transactionId: record['Transaction ID'] || null,
        paymentDate: record['Payment Date'] || null,
        customer: record['Customer'] || null,
        customerId: record['Customer ID'] || null,
        company: record['Company'] || '',
        paymentStatus: record['Payment Status'] || null,
        applicationStatus: record['Application Status'] || null,
        currency: record['Currency'] || 'EUR',
        paymentAmount: record['Payment Amount'] || '0',
        onAccountAmount: record['On Account Amount'] || '0',
        overpaymentAmount: record['Overpayment Amount'] || '0',
        paymentType: record['Payment Type'] || null,
        paymentReference: record['Payment Reference'] || null,
        memo: record['Memo'] || null,
      });

      if (batch.length >= BATCH_SIZE) {
        await connection.query(
          `INSERT INTO customerPayments (uploadId, payment, transactionId, paymentDate, customer, customerId, company, paymentStatus, applicationStatus, currency, paymentAmount, onAccountAmount, overpaymentAmount, paymentType, paymentReference, memo) 
           VALUES ${batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',')}`,
          batch.flatMap(b => [b.uploadId, b.payment, b.transactionId, b.paymentDate, b.customer, b.customerId, b.company, b.paymentStatus, b.applicationStatus, b.currency, b.paymentAmount, b.onAccountAmount, b.overpaymentAmount, b.paymentType, b.paymentReference, b.memo])
        );
        imported += batch.length;
        console.log(`   Imported ${imported} records...`);
        batch = [];
      }
    } catch (error) {
      console.error('Error processing customer payment:', error);
    }
  }

  if (batch.length > 0) {
    await connection.query(
      `INSERT INTO customerPayments (uploadId, payment, transactionId, paymentDate, customer, customerId, company, paymentStatus, applicationStatus, currency, paymentAmount, onAccountAmount, overpaymentAmount, paymentType, paymentReference, memo) 
       VALUES ${batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',')}`,
      batch.flatMap(b => [b.uploadId, b.payment, b.transactionId, b.paymentDate, b.customer, b.customerId, b.company, b.paymentStatus, b.applicationStatus, b.currency, b.paymentAmount, b.onAccountAmount, b.overpaymentAmount, b.paymentType, b.paymentReference, b.memo])
    );
    imported += batch.length;
  }

  await updateUploadStatus(uploadId, 'completed', imported);
  console.log(`   ✅ Completed: ${imported} records`);
}

// Import Bank Statements
async function importBankStatements() {
  console.log('\n📄 Importing Bank Statements...');
  const filePath = '/home/ubuntu/upload/Bank-Statements.csv';
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  
  console.log(`   Found ${records.length} records`);
  
  const period = records[0]['Statement Line Date'] ? getPeriod(records[0]['Statement Line Date']) : '2024-01';
  const uploadId = await createUpload('bank_statements', 'Bank-Statements.csv', period);
  
  let imported = 0;
  let batch: any[] = [];
  const BATCH_SIZE = 1000;

  for (const record of records) {
    try {
      batch.push({
        uploadId,
        bankStatementLine: record['Bank Statement Line'] || null,
        bankAccount: record['Bank Account'] || null,
        bankStatement: record['Bank Statement'] || null,
        statementLineDate: record['Statement Line Date'] || null,
        typeCode: record['Type Code'] || null,
        statementLineAmount: record['Statement Line Amount'] || '0',
        debitCredit: record['Debit/Credit'] || null,
        currency: record['Currency'] || 'EUR',
        referenceNumber: record['Reference Number'] || null,
        addenda: record['Addenda'] || null,
        reconciliationStatus: record['Reconciliation Status'] || null,
      });

      if (batch.length >= BATCH_SIZE) {
        await connection.query(
          `INSERT INTO bankStatements (uploadId, bankStatementLine, bankAccount, bankStatement, statementLineDate, typeCode, statementLineAmount, debitCredit, currency, referenceNumber, addenda, reconciliationStatus) 
           VALUES ${batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?)').join(',')}`,
          batch.flatMap(b => [b.uploadId, b.bankStatementLine, b.bankAccount, b.bankStatement, b.statementLineDate, b.typeCode, b.statementLineAmount, b.debitCredit, b.currency, b.referenceNumber, b.addenda, b.reconciliationStatus])
        );
        imported += batch.length;
        console.log(`   Imported ${imported} records...`);
        batch = [];
      }
    } catch (error) {
      console.error('Error processing bank statement:', error);
    }
  }

  if (batch.length > 0) {
    await connection.query(
      `INSERT INTO bankStatements (uploadId, bankStatementLine, bankAccount, bankStatement, statementLineDate, typeCode, statementLineAmount, debitCredit, currency, referenceNumber, addenda, reconciliationStatus) 
       VALUES ${batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?)').join(',')}`,
      batch.flatMap(b => [b.uploadId, b.bankStatementLine, b.bankAccount, b.bankStatement, b.statementLineDate, b.typeCode, b.statementLineAmount, b.debitCredit, b.currency, b.referenceNumber, b.addenda, b.reconciliationStatus])
    );
    imported += batch.length;
  }

  await updateUploadStatus(uploadId, 'completed', imported);
  console.log(`   ✅ Completed: ${imported} records`);
}

// Import HubSpot Deals
async function importHubSpotDeals() {
  console.log('\n📄 Importing HubSpot Deals...');
  const filePath = '/home/ubuntu/upload/Hubspot-Deals.csv';
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  
  console.log(`   Found ${records.length} records`);
  
  const period = records[0]['Create Date'] ? getPeriod(records[0]['Create Date']) : '2024-01';
  const uploadId = await createUpload('hubspot_deals', 'Hubspot-Deals.csv', period);
  
  let imported = 0;
  let batch: any[] = [];
  const BATCH_SIZE = 1000;

  for (const record of records) {
    try {
      batch.push({
        uploadId,
        recordId: record['Record ID'] || null,
        associatedCompany: record['Associated Company'] || null,
        dealName: record['Deal Name'] || null,
        dealStage: record['Deal Stage'] || null,
        createDate: record['Create Date'] || null,
        closeDate: record['Close Date'] || null,
        amountEur: record['Amount EUR'] || '0',
        dealOwner: record['Deal owner'] || null,
        typeSolution: record['Type Solution'] || null,
        initialDealType: record['Initial Deal Type'] || null,
        refinedDealType: record['Refined Deal Type'] || null,
      });

      if (batch.length >= BATCH_SIZE) {
        await connection.query(
          `INSERT INTO hubspotDeals (uploadId, recordId, associatedCompany, dealName, dealStage, createDate, closeDate, amountEur, dealOwner, typeSolution, initialDealType, refinedDealType) 
           VALUES ${batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?)').join(',')}`,
          batch.flatMap(b => [b.uploadId, b.recordId, b.associatedCompany, b.dealName, b.dealStage, b.createDate, b.closeDate, b.amountEur, b.dealOwner, b.typeSolution, b.initialDealType, b.refinedDealType])
        );
        imported += batch.length;
        console.log(`   Imported ${imported} records...`);
        batch = [];
      }
    } catch (error) {
      console.error('Error processing HubSpot deal:', error);
    }
  }

  if (batch.length > 0) {
    await connection.query(
      `INSERT INTO hubspotDeals (uploadId, recordId, associatedCompany, dealName, dealStage, createDate, closeDate, amountEur, dealOwner, typeSolution, initialDealType, refinedDealType) 
       VALUES ${batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?)').join(',')}`,
      batch.flatMap(b => [b.uploadId, b.recordId, b.associatedCompany, b.dealName, b.dealStage, b.createDate, b.closeDate, b.amountEur, b.dealOwner, b.typeSolution, b.initialDealType, b.refinedDealType])
    );
    imported += batch.length;
  }

  await updateUploadStatus(uploadId, 'completed', imported);
  console.log(`   ✅ Completed: ${imported} records`);
}

// Import Billing Installments
async function importBillingInstallments() {
  console.log('\n📄 Importing Billing Installments...');
  const filePath = '/home/ubuntu/upload/Billing-Installments.csv';
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  
  console.log(`   Found ${records.length} records`);
  
  const period = records[0]['Invoice Date'] ? getPeriod(records[0]['Invoice Date']) : '2024-01';
  const uploadId = await createUpload('billing_installments', 'Billing-Installments.csv', period);
  
  let imported = 0;
  let batch: any[] = [];
  const BATCH_SIZE = 1000;

  for (const record of records) {
    try {
      batch.push({
        uploadId,
        billingInstallment: record['Billing Installment'] || null,
        invoiceDate: record['Invoice Date'] || null,
        totalAmount: record['Total Amount'] || '0',
        billingCurrency: record['Billing Currency'] || 'EUR',
        fromDate: record['From Date'] || null,
        toDate: record['To Date'] || null,
        installmentStatus: record['Installment Status'] || null,
        customer: record['Customer'] || null,
        company: record['Company'] || null,
      });

      if (batch.length >= BATCH_SIZE) {
        await connection.query(
          `INSERT INTO billingInstallments (uploadId, billingInstallment, invoiceDate, totalAmount, billingCurrency, fromDate, toDate, installmentStatus, customer, company) 
           VALUES ${batch.map(() => '(?,?,?,?,?,?,?,?,?,?)').join(',')}`,
          batch.flatMap(b => [b.uploadId, b.billingInstallment, b.invoiceDate, b.totalAmount, b.billingCurrency, b.fromDate, b.toDate, b.installmentStatus, b.customer, b.company])
        );
        imported += batch.length;
        console.log(`   Imported ${imported} records...`);
        batch = [];
      }
    } catch (error) {
      console.error('Error processing billing installment:', error);
    }
  }

  if (batch.length > 0) {
    await connection.query(
      `INSERT INTO billingInstallments (uploadId, billingInstallment, invoiceDate, totalAmount, billingCurrency, fromDate, toDate, installmentStatus, customer, company) 
       VALUES ${batch.map(() => '(?,?,?,?,?,?,?,?,?,?)').join(',')}`,
      batch.flatMap(b => [b.uploadId, b.billingInstallment, b.invoiceDate, b.totalAmount, b.billingCurrency, b.fromDate, b.toDate, b.installmentStatus, b.customer, b.company])
    );
    imported += batch.length;
  }

  await updateUploadStatus(uploadId, 'completed', imported);
  console.log(`   ✅ Completed: ${imported} records`);
}

// Main function
async function main() {
  console.log('🚀 Starting Remaining CSV Imports\n');

  try {
    await importSupplierPayments();
    await importCustomerPayments();
    await importBankStatements();
    await importHubSpotDeals();
    await importBillingInstallments();

    console.log('\n✅ All remaining imports completed successfully!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    await connection.end();
    process.exit(1);
  }
}

main();
