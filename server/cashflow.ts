/**
 * Cashflow Forecast Module
 * 
 * Generates 12-month cashflow projections based on:
 * - Customer payments (historical payment behavior)
 * - Supplier payments (payment terms and patterns)
 * - Bank statements (actual cash positions)
 * - Customer invoices (outstanding receivables)
 * - Supplier invoices (outstanding payables)
 * - Billing installments (scheduled future revenue)
 */

import { db } from './db';

export interface CashflowProjection {
  month: string;
  openingBalance: number;
  inflows: {
    customerPayments: number;
    expectedPayments: number;
    otherInflows: number;
    total: number;
  };
  outflows: {
    supplierPayments: number;
    scheduledPayments: number;
    otherOutflows: number;
    total: number;
  };
  netCashflow: number;
  closingBalance: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface PaymentBehaviorAnalysis {
  customer: string;
  averagePaymentDays: number;
  paymentReliability: number; // 0-1 score
  totalPaid: number;
  paymentCount: number;
}

/**
 * Analyze customer payment behavior
 */
export async function analyzeCustomerPaymentBehavior(): Promise<PaymentBehaviorAnalysis[]> {
  const query = `
    SELECT 
      cp.customer,
      AVG(DATEDIFF(STR_TO_DATE(cp.paymentDate, '%m/%d/%y'), STR_TO_DATE(ci.invoiceDate, '%m/%d/%y'))) as avgDays,
      COUNT(cp.id) as paymentCount,
      SUM(CAST(REPLACE(REPLACE(cp.paymentAmount, ',', ''), '"', '') AS DECIMAL(15,2))) as totalPaid
    FROM customerPayments cp
    LEFT JOIN customerInvoices ci ON cp.customer = ci.customer
    WHERE cp.paymentStatus = 'Completed'
      AND ci.invoiceDate IS NOT NULL
      AND cp.paymentDate IS NOT NULL
    GROUP BY cp.customer
    HAVING paymentCount > 0
    ORDER BY totalPaid DESC
  `;

  const [rows] = await db.execute(query);
  
  return (rows as any[]).map(row => ({
    customer: row.customer,
    averagePaymentDays: Math.round(row.avgDays || 30),
    paymentReliability: Math.min(1, Math.max(0, 1 - (row.avgDays - 30) / 60)), // Score based on deviation from 30 days
    totalPaid: parseFloat(row.totalPaid || '0'),
    paymentCount: parseInt(row.paymentCount || '0'),
  }));
}

/**
 * Get current cash position from bank statements
 */
export async function getCurrentCashPosition(): Promise<number> {
  const query = `
    SELECT 
      SUM(
        CASE 
          WHEN debitCredit = 'CR' THEN CAST(REPLACE(REPLACE(statementLineAmount, ',', ''), '"', '') AS DECIMAL(15,2))
          WHEN debitCredit = 'DR' THEN -CAST(REPLACE(REPLACE(statementLineAmount, ',', ''), '"', '') AS DECIMAL(15,2))
          ELSE 0
        END
      ) as cashPosition
    FROM bankStatements
    WHERE currency = 'EUR'
  `;

  const [rows] = await db.execute(query);
  return parseFloat((rows as any[])[0]?.cashPosition || '0');
}

/**
 * Get outstanding receivables (unpaid customer invoices)
 */
export async function getOutstandingReceivables(): Promise<{ total: number; aged: any[] }> {
  const query = `
    SELECT 
      ci.customer,
      SUM(CAST(REPLACE(REPLACE(ci.amountDue, ',', ''), '"', '') AS DECIMAL(15,2))) as amountDue,
      AVG(DATEDIFF(CURDATE(), STR_TO_DATE(ci.invoiceDate, '%m/%d/%y'))) as avgAge,
      COUNT(*) as invoiceCount
    FROM customerInvoices ci
    WHERE ci.paymentStatus != 'Paid'
      AND CAST(REPLACE(REPLACE(ci.amountDue, ',', ''), '"', '') AS DECIMAL(15,2)) > 0
    GROUP BY ci.customer
    ORDER BY amountDue DESC
  `;

  const [rows] = await db.execute(query);
  const aged = rows as any[];
  const total = aged.reduce((sum, row) => sum + parseFloat(row.amountDue || '0'), 0);

  return { total, aged };
}

/**
 * Get outstanding payables (unpaid supplier invoices)
 */
export async function getOutstandingPayables(): Promise<{ total: number; aged: any[] }> {
  const query = `
    SELECT 
      si.supplier,
      SUM(CAST(REPLACE(REPLACE(si.balanceDue, ',', ''), '"', '') AS DECIMAL(15,2))) as balanceDue,
      AVG(DATEDIFF(CURDATE(), STR_TO_DATE(si.invoiceDate, '%m/%d/%y'))) as avgAge,
      COUNT(*) as invoiceCount
    FROM supplierInvoices si
    WHERE si.status != 'Paid'
      AND CAST(REPLACE(REPLACE(si.balanceDue, ',', ''), '"', '') AS DECIMAL(15,2)) > 0
    GROUP BY si.supplier
    ORDER BY balanceDue DESC
  `;

  const [rows] = await db.execute(query);
  const aged = rows as any[];
  const total = aged.reduce((sum, row) => sum + parseFloat(row.balanceDue || '0'), 0);

  return { total, aged };
}

/**
 * Get scheduled billing installments (future revenue)
 */
export async function getScheduledBillingInstallments(): Promise<any[]> {
  const query = `
    SELECT 
      DATE_FORMAT(STR_TO_DATE(invoiceDate, '%m/%d/%y'), '%Y-%m') as month,
      SUM(CAST(REPLACE(REPLACE(totalAmount, ',', ''), '"', '') AS DECIMAL(15,2))) as amount,
      COUNT(*) as count
    FROM billingInstallments
    WHERE installmentStatus IN ('Scheduled', 'Pending')
      AND STR_TO_DATE(invoiceDate, '%m/%d/%y') >= CURDATE()
    GROUP BY month
    ORDER BY month
    LIMIT 12
  `;

  const [rows] = await db.execute(query);
  return rows as any[];
}

/**
 * Calculate historical monthly cashflow
 */
export async function getHistoricalCashflow(months: number = 6): Promise<any[]> {
  const query = `
    SELECT 
      DATE_FORMAT(STR_TO_DATE(paymentDate, '%m/%d/%y'), '%Y-%m') as month,
      SUM(CAST(REPLACE(REPLACE(paymentAmount, ',', ''), '"', '') AS DECIMAL(15,2))) as inflow
    FROM customerPayments
    WHERE paymentStatus = 'Completed'
      AND STR_TO_DATE(paymentDate, '%m/%d/%y') >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
    GROUP BY month
    ORDER BY month DESC
  `;

  const [rows] = await db.execute(query, [months]);
  return rows as any[];
}

/**
 * Generate 12-month cashflow forecast
 */
export async function generate12MonthForecast(): Promise<CashflowProjection[]> {
  // Get base data
  const currentCash = await getCurrentCashPosition();
  const receivables = await getOutstandingReceivables();
  const payables = await getOutstandingPayables();
  const scheduledBilling = await getScheduledBillingInstallments();
  const paymentBehavior = await analyzeCustomerPaymentBehavior();
  const historical = await getHistoricalCashflow(6);

  // Calculate average monthly inflows and outflows from historical data
  const avgMonthlyInflow = historical.length > 0
    ? historical.reduce((sum, m) => sum + parseFloat(m.inflow || '0'), 0) / historical.length
    : 0;

  // Get average monthly supplier payments
  const supplierQuery = `
    SELECT AVG(monthly_total) as avgOutflow
    FROM (
      SELECT 
        DATE_FORMAT(STR_TO_DATE(paymentDate, '%m/%d/%y'), '%Y-%m') as month,
        SUM(CAST(REPLACE(REPLACE(amountInPaymentCurrency, ',', ''), '"', '') AS DECIMAL(15,2))) as monthly_total
      FROM supplierPayments
      WHERE paymentStatus = 'Paid'
        AND STR_TO_DATE(paymentDate, '%m/%d/%y') >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month
    ) monthly_data
  `;

  const [supplierRows] = await db.execute(supplierQuery);
  const avgMonthlyOutflow = parseFloat((supplierRows as any[])[0]?.avgOutflow || '0');

  // Generate forecast for next 12 months
  const forecast: CashflowProjection[] = [];
  let runningBalance = currentCash;

  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const forecastDate = new Date(today.getFullYear(), today.getMonth() + i + 1, 1);
    const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;

    // Find scheduled billing for this month
    const scheduledForMonth = scheduledBilling.find(s => s.month === monthKey);
    const scheduledAmount = scheduledForMonth ? parseFloat(scheduledForMonth.amount || '0') : 0;

    // Calculate expected inflows
    // Month 1-2: High confidence (scheduled + historical average)
    // Month 3-6: Medium confidence (historical average with growth adjustment)
    // Month 7-12: Low confidence (historical average)
    let expectedInflow = avgMonthlyInflow;
    let confidence: 'high' | 'medium' | 'low' = 'low';

    if (i < 2) {
      // First 2 months: include scheduled billing and outstanding receivables (partial)
      expectedInflow = scheduledAmount + (avgMonthlyInflow * 1.1) + (receivables.total * 0.3 / 2);
      confidence = 'high';
    } else if (i < 6) {
      // Months 3-6: historical average with slight growth
      expectedInflow = avgMonthlyInflow * 1.05 + (scheduledAmount * 0.8);
      confidence = 'medium';
    } else {
      // Months 7-12: conservative estimate
      expectedInflow = avgMonthlyInflow;
      confidence = 'low';
    }

    // Calculate expected outflows
    let expectedOutflow = avgMonthlyOutflow;
    if (i < 2) {
      // First 2 months: include portion of outstanding payables
      expectedOutflow = avgMonthlyOutflow + (payables.total * 0.4 / 2);
    }

    const netCashflow = expectedInflow - expectedOutflow;
    const closingBalance = runningBalance + netCashflow;

    forecast.push({
      month: monthKey,
      openingBalance: runningBalance,
      inflows: {
        customerPayments: avgMonthlyInflow,
        expectedPayments: scheduledAmount,
        otherInflows: 0,
        total: expectedInflow,
      },
      outflows: {
        supplierPayments: avgMonthlyOutflow,
        scheduledPayments: 0,
        otherOutflows: 0,
        total: expectedOutflow,
      },
      netCashflow,
      closingBalance,
      confidence,
    });

    runningBalance = closingBalance;
  }

  return forecast;
}

/**
 * Get cashflow summary
 */
export async function getCashflowSummary() {
  const currentCash = await getCurrentCashPosition();
  const receivables = await getOutstandingReceivables();
  const payables = await getOutstandingPayables();
  const forecast = await generate12MonthForecast();

  return {
    current: {
      cashPosition: currentCash,
      receivables: receivables.total,
      payables: payables.total,
      netPosition: currentCash + receivables.total - payables.total,
    },
    forecast: forecast.slice(0, 3), // Next 3 months
    fullForecast: forecast, // All 12 months
    aging: {
      receivables: receivables.aged.slice(0, 10),
      payables: payables.aged.slice(0, 10),
    },
  };
}
