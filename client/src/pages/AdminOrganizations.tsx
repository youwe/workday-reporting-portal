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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Building2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminOrganizations() {
  const { data: organizations, isLoading } = trpc.organizations.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "" as "services" | "saas" | "",
    description: "",
  });

  const createOrg = trpc.organizations.create.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type) {
      toast.error("Naam en type zijn verplicht");
      return;
    }

    try {
      await createOrg.mutateAsync({
        name: formData.name,
        type: formData.type as "services" | "saas",
        description: formData.description || undefined,
      });
      toast.success("Organisatie aangemaakt");
      setDialogOpen(false);
      setFormData({ name: "", type: "", description: "" });
      utils.organizations.list.invalidate();
    } catch (error) {
      toast.error("Fout bij aanmaken organisatie");
      console.error(error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Organisaties
            </h1>
            <p className="text-muted-foreground mt-2">
              Beheer organisaties en hun configuraties
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe Organisatie
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Organisatie Toevoegen</DialogTitle>
                <DialogDescription>
                  Voeg een nieuwe organisatie toe aan het systeem
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Naam *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Bijv. UWI, SIMSEN"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "services" | "saas") =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="saas">SaaS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Beschrijving</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Optionele beschrijving"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={createOrg.isPending}>
                    {createOrg.isPending ? "Aanmaken..." : "Aanmaken"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Laden...</p>
          ) : organizations && organizations.length > 0 ? (
            organizations.map((org) => (
              <Card key={org.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {org.type === "services" ? "Services" : "SaaS"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                {org.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {org.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Nog geen organisaties beschikbaar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Klik op "Nieuwe Organisatie" om te beginnen
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
