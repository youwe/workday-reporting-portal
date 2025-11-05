/**
 * CSV Column Mappings for Workday Exports
 * 
 * This file defines how to map CSV columns to our database schema.
 * Supports multiple column name variations (aliases) for flexibility.
 */

export interface ColumnMapping {
  field: string;           // Our internal field name
  required: boolean;       // Is this field mandatory?
  aliases: string[];       // Possible column names in CSV (case-insensitive)
  type: 'string' | 'number' | 'date' | 'boolean';
  transform?: (value: string) => any;  // Optional transformation function
}

export interface CSVMappingConfig {
  uploadType: string;
  description: string;
  entityColumn: string;    // Which column contains the company/entity name
  dateColumn: string;      // Primary date column for period detection
  mappings: ColumnMapping[];
}

// Helper function to parse Workday amounts (e.g., "24,200.000" or "24.200,00")
export const parseAmount = (value: string): number => {
  if (!value || value === '') return 0;
  // Remove quotes and spaces
  const cleaned = value.replace(/["'\s]/g, '');
  // Handle European format (comma as decimal separator)
  if (cleaned.match(/^\d+\.\d{3},\d+$/)) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  // Handle US format (comma as thousand separator)
  return parseFloat(cleaned.replace(/,/g, ''));
};

// Helper function to parse Workday dates (various formats)
export const parseDate = (value: string): Date | null => {
  if (!value || value === '') return null;
  
  // Try ISO format first
  if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(value);
  }
  
  // Try M/D/YY format (e.g., "1/1/24")
  if (value.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
    const parts = value.split('/');
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    let year = parseInt(parts[2]);
    
    // Convert 2-digit year to 4-digit
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    return new Date(year, month - 1, day);
  }
  
  // Fallback to Date constructor
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export const CSV_MAPPINGS: Record<string, CSVMappingConfig> = {
  journal_lines: {
    uploadType: 'journal_lines',
    description: 'General Ledger Journal Entries',
    entityColumn: 'Company',
    dateColumn: 'Accounting Date',
    mappings: [
      {
        field: 'journal',
        required: true,
        aliases: ['Journal', 'Journal Entry', 'Journal ID'],
        type: 'string',
      },
      {
        field: 'journalNumber',
        required: false,
        aliases: ['Journal Number', 'Document Number'],
        type: 'string',
      },
      {
        field: 'company',
        required: true,
        aliases: ['Company', 'Entity', 'Legal Entity'],
        type: 'string',
      },
      {
        field: 'intercompanyInitiatingCompany',
        required: false,
        aliases: ['Intercompany Initiating Company', 'IC Company'],
        type: 'string',
      },
      {
        field: 'status',
        required: true,
        aliases: ['Status', 'Journal Status'],
        type: 'string',
      },
      {
        field: 'accountingDate',
        required: true,
        aliases: ['Accounting Date', 'Date', 'Transaction Date'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'source',
        required: false,
        aliases: ['Source', 'Journal Source'],
        type: 'string',
      },
      {
        field: 'ledger',
        required: false,
        aliases: ['Ledger', 'Ledger Type'],
        type: 'string',
      },
      {
        field: 'currency',
        required: true,
        aliases: ['Currency', 'Currency Code'],
        type: 'string',
      },
      {
        field: 'ledgerAccount',
        required: true,
        aliases: ['Ledger Account', 'Account', 'GL Account'],
        type: 'string',
      },
      {
        field: 'debitAmount',
        required: false,
        aliases: ['Ledger Debit Amount', 'Debit Amount', 'Debit'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'creditAmount',
        required: false,
        aliases: ['Ledger Credit Amount', 'Credit Amount', 'Credit'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'lineMemo',
        required: false,
        aliases: ['Line Memo', 'Memo', 'Description'],
        type: 'string',
      },
      {
        field: 'revenueCategory',
        required: false,
        aliases: ['Revenue Category'],
        type: 'string',
      },
      {
        field: 'spendCategory',
        required: false,
        aliases: ['Spend Category as Worktag', 'Spend Category'],
        type: 'string',
      },
      {
        field: 'costCenter',
        required: false,
        aliases: ['Cost Center'],
        type: 'string',
      },
      {
        field: 'customer',
        required: false,
        aliases: ['Customer'],
        type: 'string',
      },
      {
        field: 'project',
        required: false,
        aliases: ['Project'],
        type: 'string',
      },
      {
        field: 'worker',
        required: false,
        aliases: ['Worker', 'Employee'],
        type: 'string',
      },
      {
        field: 'supplier',
        required: false,
        aliases: ['Supplier as Worktag', 'Supplier'],
        type: 'string',
      },
      {
        field: 'intercompanyMatchId',
        required: false,
        aliases: ['Intercompany Match ID', 'IC Match ID'],
        type: 'string',
      },
    ],
  },

  customer_invoices: {
    uploadType: 'customer_invoices',
    description: 'Customer Invoices (AR)',
    entityColumn: 'Company',
    dateColumn: 'Invoice Date',
    mappings: [
      {
        field: 'invoice',
        required: true,
        aliases: ['Invoice', 'Invoice Number', 'Invoice ID'],
        type: 'string',
      },
      {
        field: 'company',
        required: true,
        aliases: ['Company', 'Entity'],
        type: 'string',
      },
      {
        field: 'customer',
        required: true,
        aliases: ['Customer', 'Customer Name'],
        type: 'string',
      },
      {
        field: 'customerId',
        required: false,
        aliases: ['Customer ID', 'Customer Code'],
        type: 'string',
      },
      {
        field: 'invoiceStatus',
        required: true,
        aliases: ['Invoice Status', 'Status'],
        type: 'string',
      },
      {
        field: 'invoiceType',
        required: false,
        aliases: ['Invoice Type', 'Type'],
        type: 'string',
      },
      {
        field: 'invoiceDate',
        required: true,
        aliases: ['Invoice Date', 'Date'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'invoiceAmount',
        required: true,
        aliases: ['Invoice Amount', 'Amount', 'Total Amount'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'amountDue',
        required: false,
        aliases: ['Amount Due', 'Outstanding Amount'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'taxAmount',
        required: false,
        aliases: ['Tax Amount', 'VAT Amount'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'currency',
        required: true,
        aliases: ['Currency', 'Currency Code'],
        type: 'string',
      },
      {
        field: 'dueDate',
        required: false,
        aliases: ['Due Date', 'Payment Due Date'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'paymentStatus',
        required: false,
        aliases: ['Payment Status'],
        type: 'string',
      },
      {
        field: 'paymentType',
        required: false,
        aliases: ['Payment Type'],
        type: 'string',
      },
      {
        field: 'memo',
        required: false,
        aliases: ['Memo', 'Description'],
        type: 'string',
      },
    ],
  },

  supplier_invoices: {
    uploadType: 'supplier_invoices',
    description: 'Supplier Invoices (AP)',
    entityColumn: 'Company',
    dateColumn: 'Invoice Date',
    mappings: [
      {
        field: 'supplierInvoice',
        required: true,
        aliases: ['Supplier Invoice', 'Invoice', 'Invoice Number'],
        type: 'string',
      },
      {
        field: 'invoiceNumber',
        required: false,
        aliases: ['Invoice Number', 'Supplier Invoice Number'],
        type: 'string',
      },
      {
        field: 'company',
        required: true,
        aliases: ['Company', 'Entity'],
        type: 'string',
      },
      {
        field: 'intercompany',
        required: false,
        aliases: ['Intercompany', 'Direct Intercompany'],
        type: 'boolean',
      },
      {
        field: 'status',
        required: true,
        aliases: ['Status', 'Invoice Status'],
        type: 'string',
      },
      {
        field: 'supplier',
        required: true,
        aliases: ['Supplier', 'Vendor', 'Supplier Name'],
        type: 'string',
      },
      {
        field: 'supplierInvoiceNumber',
        required: false,
        aliases: ["Supplier's Invoice Number", 'Supplier Invoice Number'],
        type: 'string',
      },
      {
        field: 'invoiceDate',
        required: true,
        aliases: ['Invoice Date', 'Date'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'accountingDate',
        required: false,
        aliases: ['Accounting Date'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'dueDate',
        required: false,
        aliases: ['Due Date', 'Payment Due Date'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'invoiceAmount',
        required: true,
        aliases: ['Invoice Amount', 'Amount', 'Total Amount'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'balanceDue',
        required: false,
        aliases: ['Balance Due', 'Amount Due'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'taxAmount',
        required: false,
        aliases: ['Tax Amount', 'VAT Amount'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'currency',
        required: true,
        aliases: ['Currency', 'Currency Code'],
        type: 'string',
      },
      {
        field: 'memo',
        required: false,
        aliases: ['Memo', 'Description'],
        type: 'string',
      },
      {
        field: 'paymentType',
        required: false,
        aliases: ['Payment Type'],
        type: 'string',
      },
    ],
  },

  customer_contracts: {
    uploadType: 'customer_contracts',
    description: 'Customer Contracts (Revenue Recognition)',
    entityColumn: 'Company',
    dateColumn: 'Contract Start Date',
    mappings: [
      {
        field: 'contract',
        required: true,
        aliases: ['Contract', 'Contract Number', 'Contract ID'],
        type: 'string',
      },
      {
        field: 'company',
        required: true,
        aliases: ['Company', 'Entity'],
        type: 'string',
      },
      {
        field: 'customer',
        required: true,
        aliases: ['Customer', 'Customer Name'],
        type: 'string',
      },
      {
        field: 'customerId',
        required: false,
        aliases: ['Customer ID', 'Customer Code'],
        type: 'string',
      },
      {
        field: 'contractStatus',
        required: true,
        aliases: ['Contract Status', 'Status'],
        type: 'string',
      },
      {
        field: 'contractStartDate',
        required: true,
        aliases: ['Contract Start Date', 'Start Date'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'contractEndDate',
        required: false,
        aliases: ['Contract End Date', 'End Date'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'contractAmount',
        required: true,
        aliases: ['Contract Amount', 'Amount', 'Total Contract Value'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'currency',
        required: true,
        aliases: ['Currency', 'Currency Code'],
        type: 'string',
      },
      {
        field: 'billingFrequency',
        required: false,
        aliases: ['Billing Frequency', 'Frequency'],
        type: 'string',
      },
    ],
  },

  time_entries: {
    uploadType: 'time_entries',
    description: 'Time Tracking Entries',
    entityColumn: 'Company',
    dateColumn: 'Date',
    mappings: [
      {
        field: 'worker',
        required: true,
        aliases: ['Worker', 'Employee', 'Employee Name'],
        type: 'string',
      },
      {
        field: 'company',
        required: true,
        aliases: ['Company', 'Entity'],
        type: 'string',
      },
      {
        field: 'date',
        required: true,
        aliases: ['Date', 'Entry Date', 'Work Date'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'hours',
        required: true,
        aliases: ['Hours', 'Time', 'Duration'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'billableHours',
        required: false,
        aliases: ['Billable Hours', 'Billable Time'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'customer',
        required: false,
        aliases: ['Customer', 'Client'],
        type: 'string',
      },
      {
        field: 'project',
        required: false,
        aliases: ['Project', 'Project Name'],
        type: 'string',
      },
      {
        field: 'billingStatus',
        required: false,
        aliases: ['Customer Billing Status', 'Billing Status'],
        type: 'string',
      },
      {
        field: 'rate',
        required: false,
        aliases: ['Rate', 'Hourly Rate', 'Billing Rate'],
        type: 'number',
        transform: parseAmount,
      },
    ],
  },

  bank_statements: {
    uploadType: 'bank_statements',
    description: 'Bank Statement Transactions',
    entityColumn: 'Company',
    dateColumn: 'Transaction Date',
    mappings: [
      {
        field: 'company',
        required: true,
        aliases: ['Company', 'Entity'],
        type: 'string',
      },
      {
        field: 'transactionDate',
        required: true,
        aliases: ['Transaction Date', 'Date', 'Value Date'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'amount',
        required: true,
        aliases: ['Amount', 'Transaction Amount'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'currency',
        required: true,
        aliases: ['Currency', 'Currency Code'],
        type: 'string',
      },
      {
        field: 'description',
        required: false,
        aliases: ['Description', 'Memo', 'Transaction Description'],
        type: 'string',
      },
      {
        field: 'bankAccount',
        required: false,
        aliases: ['Bank Account', 'Account'],
        type: 'string',
      },
    ],
  },

  customer_payments: {
    uploadType: 'customer_payments',
    description: 'Customer Payment Transactions',
    entityColumn: 'Company',
    dateColumn: 'Payment Date',
    mappings: [
      {
        field: 'payment',
        required: true,
        aliases: ['Payment', 'Payment ID', 'Transaction ID'],
        type: 'string',
      },
      {
        field: 'company',
        required: true,
        aliases: ['Company', 'Entity'],
        type: 'string',
      },
      {
        field: 'customer',
        required: true,
        aliases: ['Customer', 'Customer Name'],
        type: 'string',
      },
      {
        field: 'customerId',
        required: false,
        aliases: ['Customer ID', 'Customer Code'],
        type: 'string',
      },
      {
        field: 'paymentDate',
        required: true,
        aliases: ['Payment Date', 'Date'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'paymentAmount',
        required: true,
        aliases: ['Payment Amount', 'Amount'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'currency',
        required: true,
        aliases: ['Currency', 'Currency Code'],
        type: 'string',
      },
      {
        field: 'paymentStatus',
        required: false,
        aliases: ['Payment Status', 'Status'],
        type: 'string',
      },
      {
        field: 'paymentType',
        required: false,
        aliases: ['Payment Type'],
        type: 'string',
      },
    ],
  },

  supplier_payments: {
    uploadType: 'supplier_payments',
    description: 'Supplier Payment Transactions',
    entityColumn: 'Company',
    dateColumn: 'Payment Date',
    mappings: [
      {
        field: 'transactionNumber',
        required: false,
        aliases: ['Transaction Number', 'Payment ID'],
        type: 'string',
      },
      {
        field: 'company',
        required: true,
        aliases: ['Company', 'Entity'],
        type: 'string',
      },
      {
        field: 'paymentDate',
        required: true,
        aliases: ['Payment Date', 'Date'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'paymentStatus',
        required: false,
        aliases: ['Payment Status', 'Status'],
        type: 'string',
      },
      {
        field: 'supplier',
        required: true,
        aliases: ['Supplier', 'Vendor', 'Supplier Name'],
        type: 'string',
      },
      {
        field: 'paymentType',
        required: false,
        aliases: ['Payment Type'],
        type: 'string',
      },
      {
        field: 'amount',
        required: true,
        aliases: ['Amount in Payment Currency', 'Amount', 'Payment Amount'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'currency',
        required: true,
        aliases: ['Currency', 'Currency Code'],
        type: 'string',
      },
    ],
  },

  billing_installments: {
    uploadType: 'billing_installments',
    description: 'Billing Installments (Revenue Recognition)',
    entityColumn: 'Company',
    dateColumn: 'Installment Date',
    mappings: [
      {
        field: 'company',
        required: true,
        aliases: ['Company', 'Entity'],
        type: 'string',
      },
      {
        field: 'customer',
        required: true,
        aliases: ['Customer', 'Customer Name'],
        type: 'string',
      },
      {
        field: 'contract',
        required: false,
        aliases: ['Contract', 'Contract Number'],
        type: 'string',
      },
      {
        field: 'installmentDate',
        required: true,
        aliases: ['Installment Date', 'Date', 'Recognition Date'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'amount',
        required: true,
        aliases: ['Amount', 'Installment Amount'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'currency',
        required: true,
        aliases: ['Currency', 'Currency Code'],
        type: 'string',
      },
    ],
  },

  tax_declarations: {
    uploadType: 'tax_declarations',
    description: 'Tax Declaration Lines',
    entityColumn: 'Companies',
    dateColumn: 'Start Date',
    mappings: [
      {
        field: 'companies',
        required: true,
        aliases: ['Companies', 'Company', 'Entity'],
        type: 'string',
      },
      {
        field: 'startDate',
        required: true,
        aliases: ['Start Date', 'Period Start'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'endDate',
        required: true,
        aliases: ['End Date', 'Period End'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'lineDescription',
        required: true,
        aliases: ['Line Description', 'Description'],
        type: 'string',
      },
      {
        field: 'lineAmount',
        required: true,
        aliases: ['Line Amount', 'Amount'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'taxDeclarationComponent',
        required: false,
        aliases: ['Tax Declaration Component', 'Component'],
        type: 'string',
      },
    ],
  },

  hubspot_deals: {
    uploadType: 'hubspot_deals',
    description: 'HubSpot Sales Pipeline Deals',
    entityColumn: 'Associated Company',
    dateColumn: 'Create Date',
    mappings: [
      {
        field: 'recordId',
        required: true,
        aliases: ['Record ID', 'Deal ID'],
        type: 'string',
      },
      {
        field: 'associatedCompany',
        required: true,
        aliases: ['Associated Company', 'Company'],
        type: 'string',
      },
      {
        field: 'dealName',
        required: true,
        aliases: ['Deal Name', 'Name'],
        type: 'string',
      },
      {
        field: 'dealStage',
        required: true,
        aliases: ['Deal Stage', 'Stage'],
        type: 'string',
      },
      {
        field: 'createDate',
        required: true,
        aliases: ['Create Date', 'Created Date'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'closeDate',
        required: false,
        aliases: ['Close Date', 'Closed Date'],
        type: 'date',
        transform: parseDate,
      },
      {
        field: 'amount',
        required: false,
        aliases: ['Amount EUR', 'Amount', 'Deal Amount'],
        type: 'number',
        transform: parseAmount,
      },
      {
        field: 'dealOwner',
        required: false,
        aliases: ['Deal owner', 'Owner'],
        type: 'string',
      },
      {
        field: 'dealType',
        required: false,
        aliases: ['Initial Deal Type', 'Deal Type', 'Type'],
        type: 'string',
      },
    ],
  },
};

/**
 * Get the mapping configuration for a specific upload type
 */
export function getMappingConfig(uploadType: string): CSVMappingConfig | undefined {
  return CSV_MAPPINGS[uploadType];
}

/**
 * Find a column in CSV headers using aliases (case-insensitive)
 */
export function findColumn(headers: string[], aliases: string[]): string | undefined {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase().replace(/^\ufeff/, ''));
  const normalizedAliases = aliases.map(a => a.toLowerCase());
  
  for (const alias of normalizedAliases) {
    const index = normalizedHeaders.findIndex(h => h === alias);
    if (index !== -1) {
      return headers[index].trim().replace(/^\ufeff/, '');
    }
  }
  
  return undefined;
}
