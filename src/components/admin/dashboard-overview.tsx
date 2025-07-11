'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Users, 
  ClipboardList, 
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface KPIData {
  totalSurveys: number;
  totalResponses: number;
  completionRate: number;
  totalOrganizations: number;
  avgResponseTime: number;
  recentActivity: number;
  activeUsers: number;
  pendingReviews: number;
}

interface ChartData {
  name: string;
  value?: number;
  responses?: number;
  completion?: number;
}

interface ResponseData {
  name: string;
  responses: number;
  completion: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function DashboardOverview() {
  const [kpiData, setKpiData] = useState<KPIData>({
    totalSurveys: 0,
    totalResponses: 0,
    completionRate: 0,
    totalOrganizations: 0,
    avgResponseTime: 0,
    recentActivity: 0,
    activeUsers: 0,
    pendingReviews: 0
  });

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [responseData, setResponseData] = useState<ResponseData[]>([]);
  const [completionData, setCompletionData] = useState<ChartData[]>([]);

  useEffect(() => {
    // Simulate loading data (in real app, this would come from API)
    const mockKpiData: KPIData = {
      totalSurveys: 12,
      totalResponses: 247,
      completionRate: 78.5,
      totalOrganizations: 8,
      avgResponseTime: 12.5,
      recentActivity: 34,
      activeUsers: 156,
      pendingReviews: 23
    };

    const mockChartData: ChartData[] = [
      { name: 'Tech Maturity', value: 45, responses: 89 },
      { name: 'Digital Readiness', value: 32, responses: 67 },
      { name: 'Process Assessment', value: 28, responses: 54 },
      { name: 'Security Audit', value: 23, responses: 37 },
    ];

    const mockResponseData: ResponseData[] = [
      { name: 'Jan', responses: 65, completion: 78 },
      { name: 'Feb', responses: 78, completion: 82 },
      { name: 'Mar', responses: 90, completion: 75 },
      { name: 'Apr', responses: 81, completion: 88 },
      { name: 'May', responses: 95, completion: 85 },
      { name: 'Jun', responses: 88, completion: 79 },
    ];

    const mockCompletionData: ChartData[] = [
      { name: 'Completed', value: 78.5 },
      { name: 'In Progress', value: 15.2 },
      { name: 'Not Started', value: 6.3 },
    ];

    setKpiData(mockKpiData);
    setChartData(mockChartData);
    setResponseData(mockResponseData);
    setCompletionData(mockCompletionData);
  }, []);

  const KPICard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend, 
    trendValue,
    color = "blue" 
  }: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ComponentType<any>;
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  }) => {
    const colorClasses = {
      blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-900',
      green: 'from-green-50 to-green-100 border-green-200 text-green-900',
      purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-900',
      orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-900',
      red: 'from-red-50 to-red-100 border-red-200 text-red-900'
    };

    const iconColorClasses = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      red: 'text-red-600'
    };

    return (
      <Card className={`bg-gradient-to-br ${colorClasses[color]}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${iconColorClasses[color]}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs opacity-70">{description}</p>
          {trend && trendValue && (
            <div className="flex items-center mt-1">
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Surveys"
          value={kpiData.totalSurveys}
          description="Active survey campaigns"
          icon={ClipboardList}
          trend="up"
          trendValue="+12%"
          color="blue"
        />
        <KPICard
          title="Total Responses"
          value={kpiData.totalResponses}
          description="Survey submissions"
          icon={FileText}
          trend="up"
          trendValue="+23%"
          color="green"
        />
        <KPICard
          title="Completion Rate"
          value={`${kpiData.completionRate}%`}
          description="Response completion"
          icon={Activity}
          trend="up"
          trendValue="+5.2%"
          color="purple"
        />
        <KPICard
          title="Organizations"
          value={kpiData.totalOrganizations}
          description="Active participants"
          icon={Users}
          trend="up"
          trendValue="+3"
          color="orange"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Avg Response Time"
          value={`${kpiData.avgResponseTime}m`}
          description="Time to complete"
          icon={Clock}
          color="blue"
        />
        <KPICard
          title="Recent Activity"
          value={kpiData.recentActivity}
          description="Last 24 hours"
          icon={Activity}
          color="green"
        />
        <KPICard
          title="Active Users"
          value={kpiData.activeUsers}
          description="Currently online"
          icon={Users}
          color="purple"
        />
        <KPICard
          title="Pending Reviews"
          value={kpiData.pendingReviews}
          description="Awaiting approval"
          icon={AlertCircle}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Survey Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Survey Performance</CardTitle>
            <CardDescription>Response count by survey type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="responses" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Response Trends</CardTitle>
            <CardDescription>Monthly response and completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="responses" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="completion" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Status</CardTitle>
            <CardDescription>Distribution of response status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Survey Completion</span>
              <span className="text-sm font-medium">{kpiData.completionRate}%</span>
            </div>
            <Progress value={kpiData.completionRate} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Response Rate</span>
              <span className="text-sm font-medium">82.3%</span>
            </div>
            <Progress value={82.3} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">User Engagement</span>
              <span className="text-sm font-medium">76.8%</span>
            </div>
            <Progress value={76.8} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Data Quality</span>
              <span className="text-sm font-medium">91.2%</span>
            </div>
            <Progress value={91.2} className="h-2" />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest survey activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-gray-900">Survey completed</p>
                <p className="text-xs text-gray-500">Tech Maturity Assessment</p>
              </div>
              <span className="text-xs text-gray-500">2m ago</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-gray-900">New response</p>
                <p className="text-xs text-gray-500">Digital Readiness Survey</p>
              </div>
              <span className="text-xs text-gray-500">5m ago</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-gray-900">Survey started</p>
                <p className="text-xs text-gray-500">Process Assessment</p>
              </div>
              <span className="text-xs text-gray-500">12m ago</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-gray-900">User registered</p>
                <p className="text-xs text-gray-500">New organization</p>
              </div>
              <span className="text-xs text-gray-500">1h ago</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}