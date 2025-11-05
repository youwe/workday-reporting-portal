import { parse } from 'csv-parse/sync';
import * as fs from 'fs';

export interface ParsedCSVData {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

/**
 * Parse CSV file and return structured data
 */
export async function parseCSV(filePath: string): Promise<ParsedCSVData> {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  // Remove BOM if present
  const cleanContent = fileContent.replace(/^\uFEFF/, '');
  
  const records = parse(cleanContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  
  return {
    headers,
    rows: records,
    rowCount: records.length,
  };
}

/**
 * Map CSV row to database fields based on upload type
 */
export function mapCSVRow(row: Record<string, string>, uploadType: string): Record<string, any> {
  switch (uploadType) {
    case 'journal_lines':
      return {
        journal: row['Journal'] || row['journal'] || '',
        journalNumber: row['Journal Number'] || row['journalNumber'] || '',
        company: row['Company'] || row['company'] || '',
        status: row['Status'] || row['status'] || '',
        accountingDate: row['Accounting Date'] || row['accountingDate'] || '',
        source: row['Source'] || row['source'] || '',
        ledger: row['Ledger'] || row['ledger'] || '',
        currency: row['Currency'] || row['currency'] || 'EUR',
        ledgerAccount: row['Ledger Account'] || row['ledgerAccount'] || '',
        debitAmount: row['Ledger Debit Amount'] || row['Debit amount base currency'] || row['debitAmount'] || '0',
        creditAmount: row['Ledger Credit Amount'] || row['Credit amount base currency'] || row['creditAmount'] || '0',
        lineMemo: row['Line Memo'] || row['lineMemo'] || '',
        costCenter: row['Cost Center'] || row['costCenter'] || '',
        customer: row['Customer'] || row['customer'] || '',
        supplier: row['Supplier as Worktag'] || row['supplier'] || '',
        intercompanyMatchId: row['Intercompany Match ID'] || row['intercompanyMatchId'] || '',
      };

    case 'customer_invoices':
      return {
        invoice: row['Invoice'] || row['invoice'] || '',
        company: row['Company'] || row['company'] || '',
        customer: row['Customer'] || row['customer'] || '',
        customerId: row['Customer ID'] || row['customerId'] || '',
        invoiceDate: row['Invoice Date'] || row['invoiceDate'] || '',
        invoiceAmount: row['Invoice Amount'] || row['invoiceAmount'] || '0',
        amountDue: row['Amount Due'] || row['amountDue'] || '0',
        taxAmount: row['Tax Amount'] || row['taxAmount'] || '0',
        currency: row['Currency'] || row['currency'] || 'EUR',
        dueDate: row['Due Date'] || row['dueDate'] || '',
        paymentStatus: row['Payment Status'] || row['paymentStatus'] || '',
        invoiceType: row['Invoice Type'] || row['invoiceType'] || '',
      };

    case 'supplier_invoices':
      return {
        supplierInvoice: row['Supplier Invoice'] || row['supplierInvoice'] || '',
        company: row['Company'] || row['company'] || '',
        supplier: row['Supplier'] || row['supplier'] || '',
        invoiceDate: row['Invoice Date'] || row['invoiceDate'] || '',
        invoiceAmount: row['Invoice Amount'] || row['invoiceAmount'] || '0',
        balanceDue: row['Balance Due'] || row['balanceDue'] || '0',
        taxAmount: row['Tax Amount'] || row['taxAmount'] || '0',
        currency: row['Currency'] || row['currency'] || 'EUR',
        dueDate: row['Due Date'] || row['dueDate'] || '',
        status: row['Status'] || row['status'] || '',
        intercompany: row['Intercompany'] || row['intercompany'] || '',
      };

    case 'customer_contracts':
      return {
        contract: row['Contract'] || row['contract'] || '',
        company: row['Company'] || row['company'] || '',
        customer: row['Sold-To Customer'] || row['Customer'] || row['customer'] || '',
        customerId: row['Customer ID'] || row['customerId'] || '',
        contractType: row['Contract Type'] || row['contractType'] || '',
        currency: row['Currency'] || row['currency'] || 'EUR',
        contractAmount: row['Contract Amount'] || row['contractAmount'] || '0',
        remainingAmount: row['Remaining Amount'] || row['remainingAmount'] || '0',
        effectiveDate: row['Effective Date'] || row['effectiveDate'] || '',
        contractStatus: row['Contract Status'] || row['contractStatus'] || '',
      };

    case 'time_entries':
      return {
        worker: row['Worker'] || row['worker'] || '',
        date: row['Date'] || row['date'] || '',
        totalHours: row['Total Reported Hours'] || row['totalHours'] || '0',
        billableHours: row['Billable Hours'] || row['billableHours'] || '0',
        customerBillingStatus: row['Customer Billing Status'] || row['customerBillingStatus'] || '',
        amountToBill: row['Amount To Bill'] || row['YW RPT CC Amount to Bill'] || row['amountToBill'] || '0',
        rateToBill: row['Rate To Bill'] || row['rateToBill'] || '0',
        company: row['Contract Company'] || row['Company'] || row['company'] || '',
        project: row['Reported Project'] || row['project'] || '',
        customer: row['Project Customer'] || row['customer'] || '',
      };

    default:
      return row;
  }
}

/**
 * Validate required fields for upload type
 */
export function validateRequiredFields(
  row: Record<string, any>,
  uploadType: string
): { valid: boolean; missingFields: string[] } {
  const requiredFieldsMap: Record<string, string[]> = {
    journal_lines: ['company', 'ledgerAccount'],
    customer_invoices: ['invoice', 'company'],
    supplier_invoices: ['supplierInvoice', 'company'],
    customer_contracts: ['contract', 'company'],
    time_entries: ['worker', 'date'],
  };

  const requiredFields = requiredFieldsMap[uploadType] || [];
  const missingFields = requiredFields.filter(field => !row[field] || row[field] === '');

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Clean and normalize amount strings
 */
export function normalizeAmount(amount: string): string {
  if (!amount) return '0';
  
  // Remove currency symbols, spaces, and quotes
  let cleaned = amount.replace(/[€$£¥\s"]/g, '');
  
  // Remove thousand separators (commas)
  cleaned = cleaned.replace(/,/g, '');
  
  // Handle negative amounts in parentheses
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }
  
  return cleaned || '0';
}

/**
 * Detect if a transaction is intercompany based on company names
 */
export function isIntercompanyTransaction(
  fromCompany: string,
  toCompany: string,
  groupCompanies: string[]
): boolean {
  if (!fromCompany || !toCompany) return false;
  
  // Normalize company names
  const normalizeCompany = (name: string) => 
    name.toLowerCase().replace(/\s+/g, '').replace(/b\.?v\.?|ltd\.?|inc\.?/gi, '');
  
  const normalizedFrom = normalizeCompany(fromCompany);
  const normalizedTo = normalizeCompany(toCompany);
  
  // Check if both companies are in the group
  const fromInGroup = groupCompanies.some(gc => normalizeCompany(gc).includes(normalizedFrom) || normalizedFrom.includes(normalizeCompany(gc)));
  const toInGroup = groupCompanies.some(gc => normalizeCompany(gc).includes(normalizedTo) || normalizedTo.includes(normalizeCompany(gc)));
  
  return fromInGroup && toInGroup && normalizedFrom !== normalizedTo;
}
