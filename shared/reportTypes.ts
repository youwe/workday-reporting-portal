export type ReportType = 
  | "balance_sheet"
  | "income_statement"
  | "cashflow"
  | "gross_margin"
  | "ebitda"
  | "mrr"
  | "arr"
  | "churn"
  | "cac"
  | "ltv"
  | "ltv_cac";

export interface ReportTypeConfig {
  id: ReportType;
  name: string;
  description: string;
  applicableFor: ("services" | "saas")[];
  category: "financial" | "kpi";
}

export const REPORT_TYPES: Record<ReportType, ReportTypeConfig> = {
  balance_sheet: {
    id: "balance_sheet",
    name: "Balans",
    description: "Overzicht van activa, passiva en eigen vermogen",
    applicableFor: ["services", "saas"],
    category: "financial",
  },
  income_statement: {
    id: "income_statement",
    name: "Winst- en Verliesrekening",
    description: "Overzicht van opbrengsten en kosten",
    applicableFor: ["services", "saas"],
    category: "financial",
  },
  cashflow: {
    id: "cashflow",
    name: "Cashflow",
    description: "Overzicht van geldstromen",
    applicableFor: ["services", "saas"],
    category: "financial",
  },
  gross_margin: {
    id: "gross_margin",
    name: "Gross Margin",
    description: "Brutomarge percentage",
    applicableFor: ["services"],
    category: "kpi",
  },
  ebitda: {
    id: "ebitda",
    name: "EBITDA Performance",
    description: "Winst voor rente, belastingen, afschrijvingen en amortisatie",
    applicableFor: ["services"],
    category: "kpi",
  },
  mrr: {
    id: "mrr",
    name: "MRR (Monthly Recurring Revenue)",
    description: "Maandelijks terugkerende omzet",
    applicableFor: ["saas"],
    category: "kpi",
  },
  arr: {
    id: "arr",
    name: "ARR (Annual Recurring Revenue)",
    description: "Jaarlijks terugkerende omzet",
    applicableFor: ["saas"],
    category: "kpi",
  },
  churn: {
    id: "churn",
    name: "Churn Rate",
    description: "Percentage klanten dat stopt",
    applicableFor: ["saas"],
    category: "kpi",
  },
  cac: {
    id: "cac",
    name: "CAC (Customer Acquisition Cost)",
    description: "Kosten per nieuwe klant",
    applicableFor: ["saas"],
    category: "kpi",
  },
  ltv: {
    id: "ltv",
    name: "LTV (Lifetime Value)",
    description: "Totale waarde van een klant over de tijd",
    applicableFor: ["saas"],
    category: "kpi",
  },
  ltv_cac: {
    id: "ltv_cac",
    name: "LTV/CAC Ratio",
    description: "Verhouding tussen lifetime value en acquisitiekosten",
    applicableFor: ["saas"],
    category: "kpi",
  },
};

export function getReportTypesForOrganization(orgType: "services" | "saas"): ReportTypeConfig[] {
  return Object.values(REPORT_TYPES).filter((rt) =>
    rt.applicableFor.includes(orgType)
  );
}
