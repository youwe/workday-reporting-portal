import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}

function KPICard({ title, value, change, icon, trend }: KPICardProps) {
  return (
    <motion.div variants={item}>
      <Card className="kpi-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="text-primary">{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{value}</div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm mt-2 ${
              trend === 'up' ? 'text-green-500' : 'text-red-500'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{Math.abs(change)}% vs last period</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: organizations, isLoading: orgsLoading } = trpc.organizations.list.useQuery();
  const { data: kpis, isLoading: kpisLoading } = trpc.kpis.get.useQuery(
    { organizationId: 1, period: '2024-Q1' },
    { enabled: !!organizations }
  );

  // Mock data for charts
  const revenueData = [
    { month: 'Jan', revenue: 45000, target: 50000 },
    { month: 'Feb', revenue: 52000, target: 50000 },
    { month: 'Mar', revenue: 48000, target: 50000 },
  ];

  const kpiTrendData = [
    { month: 'Jan', grossMargin: 42, ebitda: 18 },
    { month: 'Feb', grossMargin: 45, ebitda: 20 },
    { month: 'Mar', grossMargin: 43, ebitda: 19 },
  ];

  if (orgsLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold gradient-text">
          Financial Intelligence Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Real-time insights across all entities
        </p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <KPICard
          title="Total Revenue"
          value="€145K"
          change={12.5}
          trend="up"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KPICard
          title="Gross Margin"
          value="43.2%"
          change={2.1}
          trend="up"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KPICard
          title="EBITDA"
          value="€27.5K"
          change={-1.5}
          trend="down"
          icon={<BarChart3 className="w-5 h-5" />}
        />
        <KPICard
          title="Billable Hours"
          value="1,247"
          change={5.3}
          trend="up"
          icon={<Clock className="w-5 h-5" />}
        />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="chart-container">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue vs target</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#667eea" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#888" 
                    strokeDasharray="5 5" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* KPI Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="chart-container">
            <CardHeader>
              <CardTitle>Margin Performance</CardTitle>
              <CardDescription>Gross Margin & EBITDA %</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={kpiTrendData}>
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
                    dataKey="grossMargin" 
                    stroke="#667eea" 
                    strokeWidth={2}
                    name="Gross Margin %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ebitda" 
                    stroke="#764ba2" 
                    strokeWidth={2}
                    name="EBITDA %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Organization Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Organization Overview</CardTitle>
            <CardDescription>Performance by entity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organizations?.slice(0, 5).map((org, index) => (
                <motion.div
                  key={org.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{org.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {org.type} • {org.reportingType}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">€{(Math.random() * 100000).toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
