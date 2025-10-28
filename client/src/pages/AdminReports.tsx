import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

export default function AdminReports() {
  const { data: reports, isLoading } = trpc.reports.list.useQuery();
  const { data: organizations } = trpc.organizations.list.useQuery();

  const getOrganizationName = (orgId: number) => {
    return organizations?.find((org) => org.id === orgId)?.name || "Onbekend";
  };

  const getReportTypeName = (type: string) => {
    const types: Record<string, string> = {
      balance_sheet: "Balans",
      income_statement: "Winst- en Verliesrekening",
      cashflow: "Cashflow",
      gross_margin: "Gross Margin",
      ebitda: "EBITDA",
      mrr: "MRR",
      arr: "ARR",
      churn: "Churn Rate",
      cac: "CAC",
      ltv: "LTV",
      ltv_cac: "LTV/CAC Ratio",
    };
    return types[type] || type;
  };

  const handleDownload = (report: any) => {
    if (report.fileUrl) {
      window.open(report.fileUrl, "_blank");
    } else {
      toast.error("Geen bestand beschikbaar voor deze rapportage");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Rapportages
          </h1>
          <p className="text-muted-foreground mt-2">
            Overzicht van gegenereerde rapportages
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alle Rapportages</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Laden...</p>
            ) : reports && reports.length > 0 ? (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {getReportTypeName(report.reportType)}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{getOrganizationName(report.organizationId)}</span>
                          <span>Periode: {report.period}</span>
                          <span>
                            {new Date(report.generatedAt).toLocaleDateString(
                              "nl-NL"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${
                          report.status === "generated"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : report.status === "sent"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {report.status}
                      </span>
                      {report.fileUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(report)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Nog geen rapportages beschikbaar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload eerst data om rapportages te kunnen genereren
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
