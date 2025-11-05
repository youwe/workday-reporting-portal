import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Calendar,
  Building2,
  ArrowRight,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

const steps = [
  { id: 1, title: "Select Period", description: "Choose reporting period" },
  { id: 2, title: "Select Organization", description: "Choose entity" },
  { id: 3, title: "Upload Files", description: "Upload Workday exports" },
  { id: 4, title: "Review & Process", description: "Confirm and process" },
];

export default function UploadWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [period, setPeriod] = useState("");
  const [organizationId, setOrganizationId] = useState<number>();
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [processing, setProcessing] = useState(false);

  const { data: organizations } = trpc.organizations.list.useQuery();
  const { data: uploadTypes } = trpc.uploadTypes.list.useQuery();
  const createUpload = trpc.uploads.create.useMutation();

  const handleFileUpload = useCallback((uploadTypeCode: string, file: File) => {
    setUploadedFiles(prev => ({ ...prev, [uploadTypeCode]: file }));
    toast.success(`${file.name} uploaded`);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, uploadTypeCode: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      handleFileUpload(uploadTypeCode, file);
    } else {
      toast.error("Please upload CSV or Excel files only");
    }
  }, [handleFileUpload]);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      // Upload files and create upload records
      for (const [typeCode, file] of Object.entries(uploadedFiles)) {
        const uploadType = uploadTypes?.find(t => t.code === typeCode);
        if (!uploadType) continue;

        await createUpload.mutateAsync({
          organizationId,
          uploadTypeId: uploadType.id,
          period,
          fileName: file.name,
          fileType: file.name.endsWith('.csv') ? 'csv' : 'excel',
          fileUrl: `/uploads/${file.name}`, // In real app, upload to S3 first
        });
      }

      toast.success("All files processed successfully!");
      setCurrentStep(1);
      setUploadedFiles({});
      setPeriod("");
      setOrganizationId(undefined);
    } catch (error) {
      toast.error("Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return period !== "";
    if (currentStep === 2) return organizationId !== undefined;
    if (currentStep === 3) return Object.keys(uploadedFiles).length > 0;
    return true;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Upload Workday Data
        </h1>
        <p className="text-muted-foreground text-lg">
          Follow the steps to upload and process your financial data
        </p>
      </motion.div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <motion.div
                  initial={false}
                  animate={{
                    scale: currentStep === step.id ? 1.1 : 1,
                    backgroundColor: currentStep >= step.id ? '#667eea' : '#333'
                  }}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mb-2"
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    step.id
                  )}
                </motion.div>
                <div className="text-center">
                  <div className="font-semibold text-sm">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 bg-secondary mx-4 mt-[-40px]">
                  <motion.div
                    initial={false}
                    animate={{
                      width: currentStep > step.id ? '100%' : '0%'
                    }}
                    className="h-full bg-primary"
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{steps[currentStep - 1].title}</CardTitle>
              <CardDescription>{steps[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[400px]">
              {/* Step 1: Select Period */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-6 rounded-lg bg-secondary/50">
                    <Calendar className="w-8 h-8 text-primary" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">
                        Reporting Period
                      </label>
                      <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024-Q1">2024 Q1</SelectItem>
                          <SelectItem value="2024-Q2">2024 Q2</SelectItem>
                          <SelectItem value="2024-Q3">2024 Q3</SelectItem>
                          <SelectItem value="2024-Q4">2024 Q4</SelectItem>
                          <SelectItem value="2024-01">January 2024</SelectItem>
                          <SelectItem value="2024-02">February 2024</SelectItem>
                          <SelectItem value="2024-03">March 2024</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Select Organization */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-6 rounded-lg bg-secondary/50">
                    <Building2 className="w-8 h-8 text-primary" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">
                        Organization / Entity
                      </label>
                      <Select 
                        value={organizationId?.toString()} 
                        onValueChange={(v) => setOrganizationId(parseInt(v))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations?.map(org => (
                            <SelectItem key={org.id} value={org.id.toString()}>
                              {org.name} ({org.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Upload Files */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploadTypes?.map(type => (
                      <div
                        key={type.id}
                        className={`upload-zone ${uploadedFiles[type.code] ? 'active' : ''}`}
                        onDrop={(e) => handleDrop(e, type.code)}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.csv,.xlsx';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleFileUpload(type.code, file);
                          };
                          input.click();
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {uploadedFiles[type.code] ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          ) : (
                            <FileText className="w-6 h-6 text-muted-foreground" />
                          )}
                          <div className="flex-1">
                            <div className="font-semibold">{type.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {uploadedFiles[type.code]?.name || 'Click or drag to upload'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground text-center mt-4">
                    Upload at least one file to continue
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                      <span className="font-medium">Period:</span>
                      <Badge variant="secondary">{period}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                      <span className="font-medium">Organization:</span>
                      <Badge variant="secondary">
                        {organizations?.find(o => o.id === organizationId)?.name}
                      </Badge>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <div className="font-medium mb-2">Files to process:</div>
                      <div className="space-y-2">
                        {Object.entries(uploadedFiles).map(([code, file]) => (
                          <div key={code} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>{uploadTypes?.find(t => t.code === code)?.name}</span>
                            <span className="text-muted-foreground">({file.name})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1 || processing}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!canProceed()}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleProcess}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Process Files
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
