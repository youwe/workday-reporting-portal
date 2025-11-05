import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  X
} from "lucide-react";
import { toast } from "sonner";

const UPLOAD_TYPES = [
  { id: 'journal_lines', name: 'Journal Lines', description: 'General ledger entries' },
  { id: 'customer_invoices', name: 'Customer Invoices', description: 'AR transactions' },
  { id: 'supplier_invoices', name: 'Supplier Invoices', description: 'AP transactions' },
  { id: 'customer_contracts', name: 'Customer Contracts', description: 'Revenue contracts' },
  { id: 'time_entries', name: 'Time Entries', description: 'Billable hours' },
  { id: 'bank_statements', name: 'Bank Statements', description: 'Cash positions' },
  { id: 'customer_payments', name: 'Customer Payments', description: 'AR payments' },
  { id: 'supplier_payments', name: 'Supplier Payments', description: 'AP payments' },
  { id: 'billing_installments', name: 'Billing Installments', description: 'Revenue recognition' },
  { id: 'tax_declarations', name: 'Tax Declarations', description: 'Tax filings' },
  { id: 'hubspot_deals', name: 'HubSpot Deals', description: 'Sales pipeline' },
];

interface UploadStatus {
  type: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
  recordsProcessed?: number;
  entitiesFound?: string[];
}

export default function UploadWizard() {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = trpc.uploads.create.useMutation();

  const handleDrop = (e: React.DragEvent, uploadType?: string) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files, uploadType);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, uploadType: string) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files, uploadType);
  };

  const handleFiles = (files: File[], uploadType?: string) => {
    files.forEach(file => {
      // Determine upload type from filename if not specified
      let type = uploadType;
      if (!type) {
        const filename = file.name.toLowerCase();
        const matchedType = UPLOAD_TYPES.find(t => 
          filename.includes(t.id.replace(/_/g, '-')) || 
          filename.includes(t.id.replace(/_/g, ' '))
        );
        type = matchedType?.id || 'journal_lines';
      }

      const newUpload: UploadStatus = {
        type,
        file,
        status: 'pending',
        progress: 0,
      };

      setUploads(prev => [...prev, newUpload]);
      processUpload(newUpload);
    });
  };

  const processUpload = async (upload: UploadStatus) => {
    try {
      // Update to uploading
      setUploads(prev => prev.map(u => 
        u.file === upload.file ? { ...u, status: 'uploading', progress: 30 } : u
      ));

      // Read file content
      const content = await readFileContent(upload.file);

      // Update to processing
      setUploads(prev => prev.map(u => 
        u.file === upload.file ? { ...u, status: 'processing', progress: 60 } : u
      ));

      // Upload to server
      const result = await uploadMutation.mutateAsync({
        uploadType: upload.type,
        filename: upload.file.name,
        content,
      });

      // Update to success
      setUploads(prev => prev.map(u => 
        u.file === upload.file ? { 
          ...u, 
          status: 'success', 
          progress: 100,
          recordsProcessed: result.recordsProcessed,
          entitiesFound: result.entitiesFound,
        } : u
      ));

      toast.success(`${upload.file.name} processed successfully!`);
    } catch (error: any) {
      setUploads(prev => prev.map(u => 
        u.file === upload.file ? { 
          ...u, 
          status: 'error', 
          progress: 0,
          error: error.message || 'Upload failed',
        } : u
      ));
      toast.error(`Failed to process ${upload.file.name}`);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const removeUpload = (file: File) => {
    setUploads(prev => prev.filter(u => u.file !== file));
  };

  const getStatusIcon = (status: UploadStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
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
          Upload Workday Data
        </h1>
        <p className="text-muted-foreground text-lg">
          Upload CSV files from Workday exports. All entities and periods are automatically detected.
        </p>
      </motion.div>

      {/* Global Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => handleDrop(e)}
        className={`p-12 rounded-xl border-2 border-dashed transition-all cursor-pointer mb-8 ${
          isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-border hover:border-primary/50 hover:bg-secondary/30'
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h3 className="text-xl font-semibold mb-2 text-center">Drop files here</h3>
        <p className="text-muted-foreground mb-4 text-center">
          Or click below to select files for specific types
        </p>
        <p className="text-sm text-muted-foreground text-center">
          Supports CSV files • All entities included • Dates auto-detected
        </p>
      </motion.div>

      {/* Upload Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {UPLOAD_TYPES.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
          >
            <Card className="glass-card hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {type.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  {type.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => handleFileInput(e, type.id)}
                  />
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Select File
                    </span>
                  </Button>
                </label>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Upload Queue */}
      {uploads.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Upload Queue</CardTitle>
              <CardDescription>
                {uploads.filter(u => u.status === 'success').length} / {uploads.length} completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {uploads.map((upload, index) => (
                  <motion.div
                    key={`${upload.file.name}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30"
                  >
                    {getStatusIcon(upload.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium truncate">{upload.file.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {UPLOAD_TYPES.find(t => t.id === upload.type)?.name}
                          </Badge>
                          {upload.status !== 'uploading' && upload.status !== 'processing' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeUpload(upload.file)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {(upload.status === 'uploading' || upload.status === 'processing') && (
                        <Progress value={upload.progress} className="h-2 mb-2" />
                      )}

                      {upload.status === 'success' && upload.recordsProcessed && (
                        <div className="text-sm text-muted-foreground">
                          ✓ {upload.recordsProcessed} records processed
                          {upload.entitiesFound && upload.entitiesFound.length > 0 && (
                            <span className="ml-2">
                              • Entities: {upload.entitiesFound.join(', ')}
                            </span>
                          )}
                        </div>
                      )}

                      {upload.status === 'error' && (
                        <div className="text-sm text-red-500">
                          {upload.error}
                        </div>
                      )}

                      {upload.status === 'pending' && (
                        <div className="text-sm text-muted-foreground">
                          Waiting to process...
                        </div>
                      )}

                      {upload.status === 'uploading' && (
                        <div className="text-sm text-muted-foreground">
                          Uploading file...
                        </div>
                      )}

                      {upload.status === 'processing' && (
                        <div className="text-sm text-muted-foreground">
                          Processing data...
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">1</span>
                  Upload Files
                </div>
                <p className="text-muted-foreground">
                  Drag & drop or select CSV files from Workday. No need to select period or entity - it's all automatic.
                </p>
              </div>
              <div>
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">2</span>
                  Auto-Detection
                </div>
                <p className="text-muted-foreground">
                  System automatically detects all entities and periods from the data. Dates are parsed and categorized.
                </p>
              </div>
              <div>
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">3</span>
                  Ready to Report
                </div>
                <p className="text-muted-foreground">
                  View dashboards, generate reports, and analyze KPIs with proper consolidation and eliminations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
