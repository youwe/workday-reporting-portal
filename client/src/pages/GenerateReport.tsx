import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { REPORT_TYPES, getReportTypesForOrganization } from "@shared/reportTypes";

export default function GenerateReport() {
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [selectedReportType, setSelectedReportType] = useState<string>("");
  const [period, setPeriod] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const { data: organizations } = trpc.organizations.list.useQuery();
  const generateReport = trpc.reports.generate.useMutation();
  const utils = trpc.useUtils();

  const selectedOrgData = organizations?.find(
    (org) => org.id.toString() === selectedOrg
  );

  const availableReportTypes = selectedOrgData
    ? getReportTypesForOrganization(selectedOrgData.type)
    : [];

  const handleGenerate = async () => {
    if (!selectedOrg || !selectedReportType || !period) {
      toast.error("Vul alle velden in");
      return;
    }

    setGenerating(true);
    try {
      const result = await generateReport.mutateAsync({
        organizationId: parseInt(selectedOrg),
        reportType: selectedReportType,
        period,
      });

      toast.success("Rapportage succesvol gegenereerd!");
      utils.reports.list.invalidate();

      // Reset form
      setSelectedOrg("");
      setSelectedReportType("");
      setPeriod("");
    } catch (error: any) {
      toast.error(error.message || "Fout bij genereren rapportage");
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Rapportage Genereren
          </h1>
          <p className="text-muted-foreground mt-2">
            Genereer een nieuwe rapportage op basis van geüploade data
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Nieuwe Rapportage</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="organization">Organisatie *</Label>
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger id="organization">
                  <SelectValue placeholder="Selecteer organisatie" />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name} ({org.type === "services" ? "Services" : "SaaS"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportType">Rapportage Type *</Label>
              <Select
                value={selectedReportType}
                onValueChange={setSelectedReportType}
                disabled={!selectedOrg}
              >
                <SelectTrigger id="reportType">
                  <SelectValue placeholder="Selecteer rapportage type" />
                </SelectTrigger>
                <SelectContent>
                  {availableReportTypes.map((rt) => (
                    <SelectItem key={rt.id} value={rt.id}>
                      {rt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedReportType && REPORT_TYPES[selectedReportType as keyof typeof REPORT_TYPES] && (
                <p className="text-xs text-muted-foreground">
                  {REPORT_TYPES[selectedReportType as keyof typeof REPORT_TYPES].description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Periode *</Label>
              <Input
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Bijv. 2024-Q1, 2024-01, 2024"
              />
              <p className="text-xs text-muted-foreground">
                Gebruik formaat: YYYY-QX voor kwartaal, YYYY-MM voor maand, of YYYY voor jaar
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating || !selectedOrg || !selectedReportType || !period}
              className="w-full"
            >
              {generating ? "Genereren..." : "Genereer Rapportage"}
            </Button>
          </CardContent>
        </Card>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Beschikbare Rapportages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Financiële Rapportages</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Balans - Overzicht van activa en passiva</li>
                  <li>• Winst- en Verliesrekening - Opbrengsten en kosten</li>
                  <li>• Cashflow - Geldstromen overzicht</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">UWI KPI's (Services)</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Gross Margin - Brutomarge percentage</li>
                  <li>• EBITDA Performance - Operationele winst</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">SIMSEN KPI's (SaaS)</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• MRR - Maandelijks terugkerende omzet</li>
                  <li>• ARR - Jaarlijks terugkerende omzet</li>
                  <li>• Churn Rate - Klantverloop percentage</li>
                  <li>• CAC - Kosten per nieuwe klant</li>
                  <li>• LTV - Lifetime value per klant</li>
                  <li>• LTV/CAC Ratio - Efficiëntie acquisitie</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
