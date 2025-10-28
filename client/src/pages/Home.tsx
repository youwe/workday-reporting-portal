import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Building2, FileText, LayoutDashboard } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

/**
 * All content in this page are only for example, replace with your own feature implementation
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  // If theme is switchable in App.tsx, we can implement theme toggling like this:
  // const { theme, toggleTheme } = useTheme();

  // Use APP_LOGO (as image src) and APP_TITLE if needed

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center space-y-6 p-8">
          {APP_LOGO && (
            <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 mx-auto" />
          )}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {APP_TITLE}
            </h1>
            <p className="text-muted-foreground">
              Workday financiële rapportages voor UWI en SIMSEN
            </p>
          </div>
          <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
            Inloggen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          {APP_LOGO && (
            <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 mx-auto mb-4" />
          )}
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welkom bij {APP_TITLE}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Beheer en genereer financiële rapportages voor UWI (Services) en SIMSEN (SaaS)
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          <Link href="/admin">
            <a className="block p-6 bg-card rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-border">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <LayoutDashboard className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Admin Dashboard
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Overzicht van uploads en rapportages
                  </p>
                </div>
              </div>
            </a>
          </Link>

          <Link href="/admin/organizations">
            <a className="block p-6 bg-card rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-border">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Organisaties
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Beheer UWI en SIMSEN configuraties
                  </p>
                </div>
              </div>
            </a>
          </Link>

          <Link href="/reports">
            <a className="block p-6 bg-card rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-border">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Rapportages
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Bekijk en download rapportages
                  </p>
                </div>
              </div>
            </a>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <Button variant="outline" onClick={() => logout()}>
            Uitloggen
          </Button>
        </div>
      </div>
    </div>
  );
}
