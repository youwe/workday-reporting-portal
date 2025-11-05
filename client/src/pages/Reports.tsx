import { useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Calendar,
  Building2,
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

const reportTypes = [
  {
    id: 'pl',
    name: 'Profit & Loss',
    description: 'Income statement with revenue, costs, and profitability',
    icon: TrendingUp,
    color: 'text-blue-500'
  },
  {
    id: 'balance',
    name: 'Balance Sheet',
    description: 'Assets, liabilities, and equity overview',
    icon: FileSpreadsheet,
    color: 'text-green-500'
  },
  {
    id: 'cashflow',
    name: 'Cash Flow',
    description: 'Operating, investing, and financing activities',
    icon: DollarSign,
    color: 'text-purple-500'
  },
  {
    id: 'consolidation',
    name: 'Consolidation Report',
    description: 'Multi-entity consolidation with eliminations',
    icon: Building2,
    color: 'text-orange-500'
  },
];

export default function Reports() {
  const [selectedOrg, setSelectedOrg] = useState<number>();
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedReport, setSelectedReport] = useState("");
  const [generating, setGenerating] = useState(false);

  const { data: organizations } = trpc.organizations.list.useQuery();
  const generateReport = trpc.reports.generate.useMutation();

  const handleGenerateReport = async () => {
    if (!selectedOrg || !selectedPeriod || !selectedReport) {
      toast.error("Please select organization, period, and report type");
      return;
    }

    setGenerating(true);
    try {
      const result = await generateReport.mutateAsync({
        organizationId: selectedOrg,
        period: selectedPeriod,
        reportType: selectedReport,
      });

      // Create CSV download
      const blob = new Blob([result.csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}_${selectedPeriod}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Report generated and downloaded!");
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Financial Reports
        </h1>
        <p className="text-muted-foreground text-lg">
          Generate and export financial reports for stakeholders
        </p>
      </motion.div>

      {/* Report Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedOrg?.toString()} 
                onValueChange={(v) => setSelectedOrg(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.map(org => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-Q1">2024 Q1</SelectItem>
                  <SelectItem value="2024-Q2">2024 Q2</SelectItem>
                  <SelectItem value="2024-Q3">2024 Q3</SelectItem>
                  <SelectItem value="2024-Q4">2024 Q4</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Report Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {reportTypes.map((type, index) => {
          const Icon = type.icon;
          const isSelected = selectedReport === type.id;
          
          return (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card 
                className={`glass-card cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedReport(type.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center ${type.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{type.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {type.description}
                        </CardDescription>
                      </div>
                    </div>
                    {isSelected && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Generate Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex justify-center"
      >
        <Button
          size="lg"
          onClick={handleGenerateReport}
          disabled={!selectedOrg || !selectedPeriod || !selectedReport || generating}
          className="min-w-[200px]"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Generate & Download CSV
            </>
          )}
        </Button>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8"
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Report Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold mb-2">Included in Reports:</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Revenue breakdown by entity</li>
                  <li>• Cost analysis and margins</li>
                  <li>• Intercompany eliminations</li>
                  <li>• Minority interest adjustments</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold mb-2">Export Format:</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• CSV format for easy import</li>
                  <li>• Compatible with Excel/Sheets</li>
                  <li>• Suitable for stakeholder distribution</li>
                  <li>• Includes period and entity metadata</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
