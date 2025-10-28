import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Download, FileText, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { REPORT_TYPES } from "@shared/reportTypes";
import { useAuth } from "@/_core/hooks/useAuth";

export default function PublicReports() {
  const { user, logout } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  
  const { data: organizations } = trpc.organizations.list.useQuery();
  const { data: reports, isLoading } = trpc.reports.byOrganization.useQuery(
    { organizationId: parseInt(selectedOrg) },
    { enabled: !!selectedOrg }
  );

  const getOrganizationName = (orgId: number) => {
    return organizations?.find((org) => org.id === orgId)?.name || "Onbekend";
  };

  const getReportTypeName = (type: string) => {
    return REPORT_TYPES[type as keyof typeof REPORT_TYPES]?.name || type;
  };

  const handleDownload = (report: any) => {
    if (report.fileUrl) {
      window.open(report.fileUrl, "_blank");
      toast.success("Download gestart");
    } else {
      toast.error("Geen bestand beschikbaar voor deze rapportage");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {APP_LOGO && (
                <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10" />
              )}
              <div>
                <h1 className="text-xl font-bold text-foreground">{APP_TITLE}</h1>
                <p className="text-xs text-muted-foreground">Rapportages Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                <LogOut className="h-4 w-4 mr-2" />
                Uitloggen
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Financiële Rapportages
            </h2>
            <p className="text-muted-foreground">
              Bekijk en download rapportages voor UWI en SIMSEN
            </p>
          </div>

          {/* Organization Filter */}
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-lg">Selecteer Organisatie</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies een organisatie" />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name} ({org.type === "services" ? "Services" : "SaaS"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Reports List */}
          {selectedOrg && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Beschikbare Rapportages - {getOrganizationName(parseInt(selectedOrg))}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Laden...</p>
                ) : reports && reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports
                      .filter((r) => r.status === "generated" || r.status === "sent")
                      .map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-base font-semibold text-foreground">
                                {getReportTypeName(report.reportType)}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Periode: {report.period}</span>
                                <span>
                                  Gegenereerd:{" "}
                                  {new Date(report.generatedAt).toLocaleDateString(
                                    "nl-NL"
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          {report.fileUrl && (
                            <Button onClick={() => handleDownload(report)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download CSV
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Nog geen rapportages beschikbaar voor deze organisatie
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!selectedOrg && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Selecteer een organisatie om rapportages te bekijken
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
