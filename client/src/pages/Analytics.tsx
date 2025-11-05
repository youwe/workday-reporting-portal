import { useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign,
  Percent,
  Clock,
  Target
} from "lucide-react";

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];

export default function Analytics() {
  const [selectedOrg, setSelectedOrg] = useState<number>(1);
  const [selectedPeriod, setSelectedPeriod] = useState("2024-Q1");

  const { data: organizations } = trpc.organizations.list.useQuery();
  const { data: kpis } = trpc.kpis.get.useQuery(
    { organizationId: selectedOrg, period: selectedPeriod },
    { enabled: !!selectedOrg }
  );

  const selectedOrgData = organizations?.find(o => o.id === selectedOrg);
  const isServices = selectedOrgData?.type === 'services';
  const isSaaS = selectedOrgData?.type === 'saas';

  // Mock trend data
  const trendData = [
    { month: 'Jan', revenue: 45000, costs: 25000, margin: 44 },
    { month: 'Feb', revenue: 52000, costs: 28000, margin: 46 },
    { month: 'Mar', revenue: 48000, costs: 26000, margin: 45 },
  ];

  const kpiData = kpis?.map(kpi => ({
    name: kpi.kpiType.replace(/_/g, ' ').toUpperCase(),
    value: parseFloat(kpi.value),
  })) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Analytics & Insights
        </h1>
        <p className="text-muted-foreground text-lg">
          Deep dive into KPIs and performance metrics
        </p>
      </motion.div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedOrg?.toString()} 
              onValueChange={(v) => setSelectedOrg(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {organizations?.map(org => (
                  <SelectItem key={org.id} value={org.id.toString()}>
                    {org.name} ({org.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Period</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue />
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
      </div>

      {/* Tabs for different analytics views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="glass-card">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          {isSaaS && <TabsTrigger value="saas">SaaS Metrics</TabsTrigger>}
          {isServices && <TabsTrigger value="services">Services Metrics</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="kpi-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">€145K</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +12.5% from last period
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="kpi-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Gross Margin
                  </CardTitle>
                  <Percent className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">43.2%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +2.1% from last period
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="kpi-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    EBITDA
                  </CardTitle>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">€27.5K</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    -1.5% from last period
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Card className="chart-container">
            <CardHeader>
              <CardTitle>Revenue & Costs Trend</CardTitle>
              <CardDescription>Monthly breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#667eea" name="Revenue" />
                  <Bar dataKey="costs" fill="#764ba2" name="Costs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="chart-container">
            <CardHeader>
              <CardTitle>Margin Trend</CardTitle>
              <CardDescription>Gross margin percentage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="margin" 
                    stroke="#667eea" 
                    strokeWidth={3}
                    name="Gross Margin %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="chart-container">
              <CardHeader>
                <CardTitle>KPI Distribution</CardTitle>
                <CardDescription>All calculated KPIs for {selectedPeriod}</CardDescription>
              </CardHeader>
              <CardContent>
                {kpiData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={kpiData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {kpiData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    No KPI data available for this period
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="chart-container">
              <CardHeader>
                <CardTitle>KPI Values</CardTitle>
                <CardDescription>Detailed breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kpiData.map((kpi, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <span className="font-medium">{kpi.name}</span>
                      <span className="text-primary font-semibold">{kpi.value.toFixed(2)}</span>
                    </div>
                  ))}
                  {kpiData.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Upload data to see KPIs
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SaaS Metrics Tab */}
        {isSaaS && (
          <TabsContent value="saas" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="kpi-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€12.5K</div>
                </CardContent>
              </Card>
              <Card className="kpi-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">ARR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€150K</div>
                </CardContent>
              </Card>
              <Card className="kpi-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Churn Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.3%</div>
                </CardContent>
              </Card>
              <Card className="kpi-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">LTV/CAC</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.2x</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Services Metrics Tab */}
        {isServices && (
          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="kpi-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">78%</div>
                </CardContent>
              </Card>
              <Card className="kpi-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€95/hr</div>
                </CardContent>
              </Card>
              <Card className="kpi-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Revenue/FTE</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€48K</div>
                </CardContent>
              </Card>
              <Card className="kpi-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">DSO</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">32 days</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
