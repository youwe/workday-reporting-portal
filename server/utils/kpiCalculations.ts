import { JournalLine } from "../../drizzle/schema";
import { normalizeAmount } from "./csvParser";

export interface KPIResult {
  kpiType: string;
  value: string;
  unit: string;
  metadata?: any;
}

/**
 * Calculate Professional Services KPIs (for Youwe entities)
 */
export function calculateServicesKPIs(
  journalLines: JournalLine[],
  timeEntries: any[],
  customerInvoices: any[],
  supplierInvoices: any[],
  period: string
): KPIResult[] {
  const kpis: KPIResult[] = [];

  // Calculate Revenue
  const revenue = journalLines
    .filter(line => line.ledgerAccount?.startsWith('4') && parseFloat(normalizeAmount(line.creditAmount || '0')) > 0)
    .reduce((sum, line) => sum + parseFloat(normalizeAmount(line.creditAmount || '0')), 0);

  // Calculate Direct Costs (COGS)
  const directCosts = journalLines
    .filter(line => line.ledgerAccount?.startsWith('6') && parseFloat(normalizeAmount(line.debitAmount || '0')) > 0)
    .reduce((sum, line) => sum + parseFloat(normalizeAmount(line.debitAmount || '0')), 0);

  // Gross Margin
  const grossMargin = revenue - directCosts;
  const grossMarginPercentage = revenue > 0 ? (grossMargin / revenue) * 100 : 0;

  kpis.push({
    kpiType: 'gross_margin',
    value: grossMargin.toFixed(2),
    unit: 'EUR',
    metadata: JSON.stringify({ revenue, directCosts }),
  });

  kpis.push({
    kpiType: 'gross_margin_percentage',
    value: grossMarginPercentage.toFixed(2),
    unit: '%',
  });

  // Operating Expenses
  const operatingExpenses = journalLines
    .filter(line => line.ledgerAccount?.startsWith('7') && parseFloat(normalizeAmount(line.debitAmount || '0')) > 0)
    .reduce((sum, line) => sum + parseFloat(normalizeAmount(line.debitAmount || '0')), 0);

  // EBITDA (simplified - excluding D&A)
  const ebitda = grossMargin - operatingExpenses;
  const ebitdaPercentage = revenue > 0 ? (ebitda / revenue) * 100 : 0;

  kpis.push({
    kpiType: 'ebitda',
    value: ebitda.toFixed(2),
    unit: 'EUR',
    metadata: JSON.stringify({ operatingExpenses }),
  });

  kpis.push({
    kpiType: 'ebitda_percentage',
    value: ebitdaPercentage.toFixed(2),
    unit: '%',
  });

  // Billable Hours & Utilization
  const totalHours = timeEntries.reduce((sum, entry) => 
    sum + parseFloat(entry.totalHours || '0'), 0);
  
  const billableHours = timeEntries.reduce((sum, entry) => 
    sum + parseFloat(entry.billableHours || '0'), 0);

  const utilizationRate = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

  kpis.push({
    kpiType: 'billable_utilization',
    value: utilizationRate.toFixed(2),
    unit: '%',
    metadata: JSON.stringify({ totalHours, billableHours }),
  });

  // Average Hourly Rate
  const totalBillableAmount = timeEntries
    .filter(entry => parseFloat(entry.billableHours || '0') > 0)
    .reduce((sum, entry) => sum + parseFloat(normalizeAmount(entry.amountToBill || '0')), 0);

  const avgHourlyRate = billableHours > 0 ? totalBillableAmount / billableHours : 0;

  kpis.push({
    kpiType: 'average_hourly_rate',
    value: avgHourlyRate.toFixed(2),
    unit: 'EUR',
  });

  // Revenue per FTE (estimate based on unique workers)
  const uniqueWorkers = new Set(timeEntries.map(e => e.worker)).size;
  const revenuePerFTE = uniqueWorkers > 0 ? revenue / uniqueWorkers : 0;

  kpis.push({
    kpiType: 'revenue_per_fte',
    value: revenuePerFTE.toFixed(2),
    unit: 'EUR',
    metadata: JSON.stringify({ fteCount: uniqueWorkers }),
  });

  // Days Sales Outstanding (DSO)
  const totalReceivables = customerInvoices
    .filter(inv => inv.paymentStatus !== 'Paid')
    .reduce((sum, inv) => sum + parseFloat(normalizeAmount(inv.amountDue || '0')), 0);

  const dailyRevenue = revenue / 90; // Assuming quarterly period
  const dso = dailyRevenue > 0 ? totalReceivables / dailyRevenue : 0;

  kpis.push({
    kpiType: 'days_sales_outstanding',
    value: dso.toFixed(0),
    unit: 'days',
    metadata: JSON.stringify({ totalReceivables }),
  });

  // Operating Cash Flow (simplified)
  const totalPayables = supplierInvoices
    .filter(inv => parseFloat(normalizeAmount(inv.balanceDue || '0')) > 0)
    .reduce((sum, inv) => sum + parseFloat(normalizeAmount(inv.balanceDue || '0')), 0);

  const operatingCashFlow = ebitda + totalPayables - totalReceivables;

  kpis.push({
    kpiType: 'operating_cash_flow',
    value: operatingCashFlow.toFixed(2),
    unit: 'EUR',
  });

  return kpis;
}

/**
 * Calculate SaaS KPIs (for Symson)
 */
export function calculateSaaSKPIs(
  journalLines: JournalLine[],
  customerContracts: any[],
  customerInvoices: any[],
  period: string
): KPIResult[] {
  const kpis: KPIResult[] = [];

  // MRR - Monthly Recurring Revenue
  const activeContracts = customerContracts.filter(c => 
    c.contractStatus === 'Approved' || c.contractStatus === 'Active'
  );

  const totalContractValue = activeContracts.reduce((sum, contract) => 
    sum + parseFloat(normalizeAmount(contract.remainingAmount || contract.contractAmount || '0')), 0);

  // Estimate MRR (assuming contracts are annual)
  const mrr = totalContractValue / 12;

  kpis.push({
    kpiType: 'mrr',
    value: mrr.toFixed(2),
    unit: 'EUR',
    metadata: JSON.stringify({ activeContracts: activeContracts.length }),
  });

  // ARR - Annual Recurring Revenue
  const arr = mrr * 12;

  kpis.push({
    kpiType: 'arr',
    value: arr.toFixed(2),
    unit: 'EUR',
  });

  // Revenue from invoices
  const revenue = customerInvoices
    .filter(inv => inv.invoiceType === 'Subscription' || inv.invoiceType === 'Standard')
    .reduce((sum, inv) => sum + parseFloat(normalizeAmount(inv.invoiceAmount || '0')), 0);

  // Customer Count
  const uniqueCustomers = new Set(activeContracts.map(c => c.customerId)).size;

  // ARPU - Average Revenue Per User
  const arpu = uniqueCustomers > 0 ? mrr / uniqueCustomers : 0;

  kpis.push({
    kpiType: 'arpu',
    value: arpu.toFixed(2),
    unit: 'EUR',
    metadata: JSON.stringify({ customerCount: uniqueCustomers }),
  });

  // Churn Rate (estimate based on contract status)
  const terminatedContracts = customerContracts.filter(c => c.contractStatus === 'Terminated').length;
  const totalContracts = customerContracts.length;
  const churnRate = totalContracts > 0 ? (terminatedContracts / totalContracts) * 100 : 0;

  kpis.push({
    kpiType: 'customer_churn_rate',
    value: churnRate.toFixed(2),
    unit: '%',
    metadata: JSON.stringify({ terminated: terminatedContracts, total: totalContracts }),
  });

  // Gross Revenue Retention
  const grr = 100 - churnRate;

  kpis.push({
    kpiType: 'gross_revenue_retention',
    value: grr.toFixed(2),
    unit: '%',
  });

  // Net Revenue Retention (simplified - assuming no expansion)
  const nrr = grr;

  kpis.push({
    kpiType: 'net_revenue_retention',
    value: nrr.toFixed(2),
    unit: '%',
  });

  // CAC - Customer Acquisition Cost (from sales & marketing expenses)
  const salesMarketingExpenses = journalLines
    .filter(line => 
      (line.costCenter?.includes('Sales') || line.costCenter?.includes('Marketing')) &&
      parseFloat(normalizeAmount(line.debitAmount || '0')) > 0
    )
    .reduce((sum, line) => sum + parseFloat(normalizeAmount(line.debitAmount || '0')), 0);

  const newCustomers = activeContracts.filter(c => {
    const effectiveDate = new Date(c.effectiveDate || '');
    const periodStart = new Date(period);
    return effectiveDate >= periodStart;
  }).length;

  const cac = newCustomers > 0 ? salesMarketingExpenses / newCustomers : 0;

  kpis.push({
    kpiType: 'cac',
    value: cac.toFixed(2),
    unit: 'EUR',
    metadata: JSON.stringify({ salesMarketingExpenses, newCustomers }),
  });

  // LTV - Customer Lifetime Value (simplified)
  const avgContractLength = 24; // months (assumption)
  const ltv = arpu * avgContractLength;

  kpis.push({
    kpiType: 'ltv',
    value: ltv.toFixed(2),
    unit: 'EUR',
  });

  // LTV/CAC Ratio
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;

  kpis.push({
    kpiType: 'ltv_cac_ratio',
    value: ltvCacRatio.toFixed(2),
    unit: 'ratio',
  });

  // Months to Recover CAC
  const monthsToRecoverCAC = arpu > 0 ? cac / arpu : 0;

  kpis.push({
    kpiType: 'months_to_recover_cac',
    value: monthsToRecoverCAC.toFixed(1),
    unit: 'months',
  });

  // Rule of 40 (Growth Rate + Profit Margin)
  // Simplified: using revenue growth estimate
  const growthRate = 30; // Placeholder - would need historical data
  const profitMargin = revenue > 0 ? ((revenue - salesMarketingExpenses) / revenue) * 100 : 0;
  const ruleOf40 = growthRate + profitMargin;

  kpis.push({
    kpiType: 'rule_of_40',
    value: ruleOf40.toFixed(2),
    unit: 'score',
    metadata: JSON.stringify({ growthRate, profitMargin }),
  });

  return kpis;
}
