import { Organization } from "../../drizzle/schema";
import { normalizeAmount } from "./csvParser";

export interface ConsolidatedFinancials {
  revenue: number;
  directCosts: number;
  operatingExpenses: number;
  grossMargin: number;
  ebitda: number;
  intercompanyEliminations: number;
  minorityInterest: number;
  netIncome: number;
  details: {
    byEntity: Record<string, any>;
    eliminations: any[];
  };
}

/**
 * Consolidate financial data for a group of organizations
 */
export async function consolidateFinancials(
  organizations: Organization[],
  journalLines: any[],
  intercompanyTransactions: any[],
  period: string
): Promise<ConsolidatedFinancials> {
  
  const result: ConsolidatedFinancials = {
    revenue: 0,
    directCosts: 0,
    operatingExpenses: 0,
    grossMargin: 0,
    ebitda: 0,
    intercompanyEliminations: 0,
    minorityInterest: 0,
    netIncome: 0,
    details: {
      byEntity: {},
      eliminations: [],
    },
  };

  // Step 1: Aggregate financials by entity
  for (const org of organizations) {
    const entityLines = journalLines.filter(line => line.company === org.name);

    const entityRevenue = entityLines
      .filter(line => line.ledgerAccount?.startsWith('4') && parseFloat(normalizeAmount(line.creditAmount || '0')) > 0)
      .reduce((sum, line) => sum + parseFloat(normalizeAmount(line.creditAmount || '0')), 0);

    const entityDirectCosts = entityLines
      .filter(line => line.ledgerAccount?.startsWith('6') && parseFloat(normalizeAmount(line.debitAmount || '0')) > 0)
      .reduce((sum, line) => sum + parseFloat(normalizeAmount(line.debitAmount || '0')), 0);

    const entityOpEx = entityLines
      .filter(line => line.ledgerAccount?.startsWith('7') && parseFloat(normalizeAmount(line.debitAmount || '0')) > 0)
      .reduce((sum, line) => sum + parseFloat(normalizeAmount(line.debitAmount || '0')), 0);

    result.details.byEntity[org.name] = {
      revenue: entityRevenue,
      directCosts: entityDirectCosts,
      operatingExpenses: entityOpEx,
      grossMargin: entityRevenue - entityDirectCosts,
      ebitda: entityRevenue - entityDirectCosts - entityOpEx,
    };

    result.revenue += entityRevenue;
    result.directCosts += entityDirectCosts;
    result.operatingExpenses += entityOpEx;
  }

  // Step 2: Apply intercompany eliminations
  for (const txn of intercompanyTransactions) {
    const amount = parseFloat(normalizeAmount(txn.amount || '0'));
    
    // Eliminate revenue and cost
    result.intercompanyEliminations += amount;
    
    result.details.eliminations.push({
      fromCompany: txn.fromCompany,
      toCompany: txn.toCompany,
      amount,
      matchId: txn.matchId,
    });
  }

  // Adjust revenue for eliminations
  result.revenue -= result.intercompanyEliminations;

  // Step 3: Calculate margins
  result.grossMargin = result.revenue - result.directCosts;
  result.ebitda = result.grossMargin - result.operatingExpenses;

  // Step 4: Calculate minority interest
  for (const org of organizations) {
    if (org.ownershipPercentage < 100) {
      const entityEbitda = result.details.byEntity[org.name]?.ebitda || 0;
      const minorityShare = entityEbitda * ((100 - org.ownershipPercentage) / 100);
      result.minorityInterest += minorityShare;
    }
  }

  // Step 5: Calculate net income (after minority interest)
  result.netIncome = result.ebitda - result.minorityInterest;

  return result;
}

/**
 * Determine consolidation level for elimination
 */
export function getEliminationLevel(
  fromCompany: string,
  toCompany: string,
  organizations: Organization[]
): string | null {
  
  const fromOrg = organizations.find(o => o.name === fromCompany);
  const toOrg = organizations.find(o => o.name === toCompany);

  if (!fromOrg || !toOrg) return null;

  // Find common parent
  const getParentChain = (org: Organization): number[] => {
    const chain: number[] = [org.id];
    let current = org;
    
    while (current.parentId) {
      chain.push(current.parentId);
      const parent = organizations.find(o => o.id === current.parentId);
      if (!parent) break;
      current = parent;
    }
    
    return chain;
  };

  const fromChain = getParentChain(fromOrg);
  const toChain = getParentChain(toOrg);

  // Find first common ancestor
  for (const fromParentId of fromChain) {
    if (toChain.includes(fromParentId)) {
      const commonParent = organizations.find(o => o.id === fromParentId);
      return commonParent?.name || null;
    }
  }

  return null;
}

/**
 * Generate consolidation report
 */
export function generateConsolidationReport(
  consolidated: ConsolidatedFinancials,
  organizations: Organization[],
  period: string
): any {
  
  return {
    period,
    summary: {
      totalRevenue: consolidated.revenue,
      totalDirectCosts: consolidated.directCosts,
      totalOperatingExpenses: consolidated.operatingExpenses,
      grossMargin: consolidated.grossMargin,
      grossMarginPercentage: consolidated.revenue > 0 
        ? (consolidated.grossMargin / consolidated.revenue) * 100 
        : 0,
      ebitda: consolidated.ebitda,
      ebitdaPercentage: consolidated.revenue > 0 
        ? (consolidated.ebitda / consolidated.revenue) * 100 
        : 0,
      intercompanyEliminations: consolidated.intercompanyEliminations,
      minorityInterest: consolidated.minorityInterest,
      netIncome: consolidated.netIncome,
    },
    byEntity: consolidated.details.byEntity,
    eliminations: consolidated.details.eliminations,
    organizations: organizations.map(org => ({
      name: org.name,
      type: org.type,
      ownershipPercentage: org.ownershipPercentage,
      reportingType: org.reportingType,
    })),
  };
}

/**
 * Export consolidation report to CSV
 */
export function exportConsolidationToCSV(report: any): string {
  const lines: string[] = [];

  // Header
  lines.push(`Consolidation Report - ${report.period}`);
  lines.push('');

  // Summary
  lines.push('Summary');
  lines.push('Metric,Amount (EUR),Percentage (%)');
  lines.push(`Total Revenue,${report.summary.totalRevenue.toFixed(2)},100.00`);
  lines.push(`Direct Costs,${report.summary.totalDirectCosts.toFixed(2)},${((report.summary.totalDirectCosts / report.summary.totalRevenue) * 100).toFixed(2)}`);
  lines.push(`Gross Margin,${report.summary.grossMargin.toFixed(2)},${report.summary.grossMarginPercentage.toFixed(2)}`);
  lines.push(`Operating Expenses,${report.summary.totalOperatingExpenses.toFixed(2)},${((report.summary.totalOperatingExpenses / report.summary.totalRevenue) * 100).toFixed(2)}`);
  lines.push(`EBITDA,${report.summary.ebitda.toFixed(2)},${report.summary.ebitdaPercentage.toFixed(2)}`);
  lines.push(`Intercompany Eliminations,${report.summary.intercompanyEliminations.toFixed(2)},-`);
  lines.push(`Minority Interest,${report.summary.minorityInterest.toFixed(2)},-`);
  lines.push(`Net Income,${report.summary.netIncome.toFixed(2)},-`);
  lines.push('');

  // By Entity
  lines.push('By Entity');
  lines.push('Entity,Revenue,Direct Costs,Operating Expenses,Gross Margin,EBITDA');
  
  for (const [entity, data] of Object.entries(report.byEntity)) {
    const d = data as any;
    lines.push(`${entity},${d.revenue.toFixed(2)},${d.directCosts.toFixed(2)},${d.operatingExpenses.toFixed(2)},${d.grossMargin.toFixed(2)},${d.ebitda.toFixed(2)}`);
  }
  lines.push('');

  // Eliminations
  if (report.eliminations.length > 0) {
    lines.push('Intercompany Eliminations');
    lines.push('From Company,To Company,Amount (EUR),Match ID');
    
    for (const elim of report.eliminations) {
      lines.push(`${elim.fromCompany},${elim.toCompany},${elim.amount.toFixed(2)},${elim.matchId || '-'}`);
    }
  }

  return lines.join('\n');
}
