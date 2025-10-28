import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminUploads() {
  const { data: uploads, isLoading } = trpc.uploads.list.useQuery();
  const { data: organizations } = trpc.organizations.list.useQuery();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const createUpload = trpc.uploads.create.useMutation();
  const utils = trpc.useUtils();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension === "csv" || extension === "xlsx" || extension === "xls") {
        setSelectedFile(file);
      } else {
        toast.error("Alleen CSV en Excel bestanden zijn toegestaan");
        e.target.value = "";
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedOrg) {
      toast.error("Selecteer een organisatie en bestand");
      return;
    }

    setUploading(true);
    try {
      // In een echte implementatie zou je hier het bestand naar S3 uploaden
      // Voor nu simuleren we dit met een placeholder URL
      const fileType = selectedFile.name.endsWith(".csv") ? "csv" : "excel";
      const mockFileUrl = `https://storage.example.com/${selectedOrg}/${selectedFile.name}`;

      await createUpload.mutateAsync({
        organizationId: parseInt(selectedOrg),
        fileName: selectedFile.name,
        fileType,
        fileUrl: mockFileUrl,
      });

      toast.success("Upload succesvol aangemaakt");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedOrg("");
      utils.uploads.list.invalidate();
    } catch (error) {
      toast.error("Upload mislukt");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Uploads
            </h1>
            <p className="text-muted-foreground mt-2">
              Beheer Workday data uploads
            </p>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Nieuwe Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Workday Data Uploaden</DialogTitle>
                <DialogDescription>
                  Upload een CSV of Excel bestand met financiële data
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Organisatie
                  </label>
                  <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer organisatie" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations?.map((org) => (
                        <SelectItem key={org.id} value={org.id.toString()}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Bestand
                  </label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      Geselecteerd: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setUploadDialogOpen(false)}
                  disabled={uploading}
                >
                  Annuleren
                </Button>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? "Uploaden..." : "Upload"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Geschiedenis</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Laden...</p>
            ) : uploads && uploads.length > 0 ? (
              <div className="space-y-4">
                {uploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {upload.fileName}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {new Date(upload.uploadedAt).toLocaleString("nl-NL")}
                        </span>
                        <span className="capitalize">{upload.fileType}</span>
                        {upload.recordCount && (
                          <span>{upload.recordCount} records</span>
                        )}
                      </div>
                      {upload.errorMessage && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {upload.errorMessage}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        upload.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : upload.status === "failed"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : upload.status === "processing"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {upload.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nog geen uploads beschikbaar
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
