import { ReportType } from "@shared/reportTypes";

export interface CSVRow {
  [key: string]: string | number;
}

export function generateCSV(headers: string[], rows: CSVRow[]): string {
  const csvHeaders = headers.join(",");
  const csvRows = rows.map((row) => {
    return headers.map((header) => {
      const value = row[header];
      // Escape values that contain commas or quotes
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(",");
  });

  return [csvHeaders, ...csvRows].join("\n");
}

export function generateBalanceSheetCSV(data: any[], period: string): string {
  const headers = ["Categorie", "Subcategorie", "Bedrag (EUR)", "Periode"];
  const rows: CSVRow[] = data.map((item) => ({
    Categorie: item.category,
    Subcategorie: item.subcategory || "-",
    "Bedrag (EUR)": item.amount,
    Periode: period,
  }));

  return generateCSV(headers, rows);
}

export function generateIncomeStatementCSV(data: any[], period: string): string {
  const headers = ["Categorie", "Subcategorie", "Bedrag (EUR)", "Periode"];
  const rows: CSVRow[] = data.map((item) => ({
    Categorie: item.category,
    Subcategorie: item.subcategory || "-",
    "Bedrag (EUR)": item.amount,
    Periode: period,
  }));

  return generateCSV(headers, rows);
}

export function generateCashflowCSV(data: any[], period: string): string {
  const headers = ["Categorie", "Subcategorie", "Bedrag (EUR)", "Periode"];
  const rows: CSVRow[] = data.map((item) => ({
    Categorie: item.category,
    Subcategorie: item.subcategory || "-",
    "Bedrag (EUR)": item.amount,
    Periode: period,
  }));

  return generateCSV(headers, rows);
}

export function generateKPIReportCSV(
  reportType: ReportType,
  data: any[],
  period: string
): string {
  const headers = ["KPI", "Waarde", "Eenheid", "Periode"];
  const rows: CSVRow[] = data.map((item) => ({
    KPI: item.category,
    Waarde: item.amount,
    Eenheid: item.metadata ? JSON.parse(item.metadata).unit || "-" : "-",
    Periode: period,
  }));

  return generateCSV(headers, rows);
}

export function generateReportCSV(
  reportType: ReportType,
  data: any[],
  period: string
): string {
  switch (reportType) {
    case "balance_sheet":
      return generateBalanceSheetCSV(data, period);
    case "income_statement":
      return generateIncomeStatementCSV(data, period);
    case "cashflow":
      return generateCashflowCSV(data, period);
    case "gross_margin":
    case "ebitda":
    case "mrr":
    case "arr":
    case "churn":
    case "cac":
    case "ltv":
    case "ltv_cac":
      return generateKPIReportCSV(reportType, data, period);
    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }
}
