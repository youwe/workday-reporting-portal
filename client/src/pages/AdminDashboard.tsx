import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Building2, FileText, FileUp, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { data: organizations, isLoading: orgsLoading } = trpc.organizations.list.useQuery();
  const { data: uploads, isLoading: uploadsLoading } = trpc.uploads.list.useQuery();
  const { data: reports, isLoading: reportsLoading } = trpc.reports.list.useQuery();

  const stats = [
    {
      title: "Organisaties",
      value: organizations?.length || 0,
      icon: Building2,
      loading: orgsLoading,
    },
    {
      title: "Uploads",
      value: uploads?.length || 0,
      icon: FileUp,
      loading: uploadsLoading,
    },
    {
      title: "Rapportages",
      value: reports?.length || 0,
      icon: FileText,
      loading: reportsLoading,
    },
    {
      title: "Recente Uploads",
      value: uploads?.filter(u => {
        const uploadDate = new Date(u.uploadedAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return uploadDate > weekAgo;
      }).length || 0,
      icon: TrendingUp,
      loading: uploadsLoading,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Overzicht van het Workday Reporting Portal
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.loading ? "..." : stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recente Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              {uploadsLoading ? (
                <p className="text-sm text-muted-foreground">Laden...</p>
              ) : uploads && uploads.length > 0 ? (
                <div className="space-y-3">
                  {uploads.slice(0, 5).map((upload) => (
                    <div
                      key={upload.id}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {upload.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(upload.uploadedAt).toLocaleDateString("nl-NL")}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          upload.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : upload.status === "failed"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
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

          <Card>
            <CardHeader>
              <CardTitle>Organisaties</CardTitle>
            </CardHeader>
            <CardContent>
              {orgsLoading ? (
                <p className="text-sm text-muted-foreground">Laden...</p>
              ) : organizations && organizations.length > 0 ? (
                <div className="space-y-3">
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {org.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Type: {org.type === "services" ? "Services" : "SaaS"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nog geen organisaties beschikbaar
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
