'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Calendar,
  Filter,
  Target,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';

// Mock data for analytics
const responseData = [
  { month: 'Jan', responses: 145, completed: 120, inProgress: 25 },
  { month: 'Feb', responses: 167, completed: 145, inProgress: 22 },
  { month: 'Mar', responses: 189, completed: 156, inProgress: 33 },
  { month: 'Apr', responses: 203, completed: 178, inProgress: 25 },
  { month: 'May', responses: 235, completed: 201, inProgress: 34 },
  { month: 'Jun', responses: 247, completed: 215, inProgress: 32 },
];

const surveyPerformanceData = [
  { survey: 'Tech Maturity', responses: 89, completion: 78.5, satisfaction: 4.2 },
  { survey: 'Digital Readiness', responses: 67, completion: 82.3, satisfaction: 4.1 },
  { survey: 'Process Assessment', responses: 54, completion: 65.8, satisfaction: 3.9 },
  { survey: 'Security Audit', responses: 37, completion: 71.2, satisfaction: 4.0 },
  { survey: 'User Experience', responses: 156, completion: 94.2, satisfaction: 4.5 },
];

const organizationData = [
  { organization: 'Beth Shalom', surveys: 4, responses: 32, completion: 85.2 },
  { organization: 'Hillel University', surveys: 3, responses: 28, completion: 78.9 },
  { organization: 'Chabad Center', surveys: 2, responses: 18, completion: 72.1 },
  { organization: 'Jewish Federation', surveys: 5, responses: 41, completion: 89.3 },
  { organization: 'Jewish Museum', surveys: 3, responses: 22, completion: 68.7 },
  { organization: 'Temple Emanuel', surveys: 4, responses: 35, completion: 81.4 },
];

const stakeholderData = [
  { name: 'CEO', value: 35, responses: 89 },
  { name: 'Tech Lead', value: 28, responses: 72 },
  { name: 'Board', value: 22, responses: 56 },
  { name: 'Staff', value: 15, responses: 38 },
];

const maturityLevels = [
  { level: 'Initial', organizations: 2, percentage: 25 },
  { level: 'Developing', organizations: 3, percentage: 37.5 },
  { level: 'Defined', organizations: 2, percentage: 25 },
  { level: 'Managed', organizations: 1, percentage: 12.5 },
  { level: 'Optimizing', organizations: 0, percentage: 0 },
];

const timeSeriesData = [
  { date: '2024-01-01', activeUsers: 45, responses: 12, completions: 8 },
  { date: '2024-01-08', activeUsers: 52, responses: 18, completions: 15 },
  { date: '2024-01-15', activeUsers: 48, responses: 22, completions: 19 },
  { date: '2024-01-22', activeUsers: 61, responses: 28, completions: 24 },
  { date: '2024-01-29', activeUsers: 58, responses: 31, completions: 26 },
  { date: '2024-02-05', activeUsers: 67, responses: 35, completions: 29 },
  { date: '2024-02-12', activeUsers: 72, responses: 42, completions: 38 },
  { date: '2024-02-19', activeUsers: 69, responses: 39, completions: 33 },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function AnalyticsReporting() {
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('responses');

  const exportData = (format: 'csv' | 'pdf' | 'xlsx') => {
    console.log(`Exporting data as ${format}`);
    // Implement export functionality
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    trend,
    icon: Icon,
    color = 'blue'
  }: {
    title: string;
    value: string | number;
    change: string;
    trend: 'up' | 'down';
    icon: React.ComponentType<any>;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-${color}-100`}>
              <Icon className={`h-5 w-5 text-${color}-600`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {change}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reporting</h1>
          <p className="text-gray-600">Comprehensive insights into survey performance and user engagement</p>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {timeRange === '6months' ? 'Last 6 months' : 
                 timeRange === '3months' ? 'Last 3 months' : 
                 timeRange === '1month' ? 'Last month' : 'Last week'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTimeRange('1week')}>Last week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('1month')}>Last month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('3months')}>Last 3 months</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('6months')}>Last 6 months</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportData('csv')}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportData('xlsx')}>Export as Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportData('pdf')}>Export as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Responses"
          value="1,247"
          change="+12.3%"
          trend="up"
          icon={BarChart3}
          color="blue"
        />
        <MetricCard
          title="Completion Rate"
          value="78.5%"
          change="+5.2%"
          trend="up"
          icon={CheckCircle}
          color="green"
        />
        <MetricCard
          title="Avg Response Time"
          value="12.5m"
          change="-2.1m"
          trend="up"
          icon={Clock}
          color="purple"
        />
        <MetricCard
          title="Active Users"
          value="156"
          change="+8.7%"
          trend="up"
          icon={Users}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Response Trends</CardTitle>
            <CardDescription>Monthly survey responses and completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={responseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="completed" stackId="1" stroke="#10B981" fill="#10B981" />
                <Area type="monotone" dataKey="inProgress" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Survey Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Survey Performance</CardTitle>
            <CardDescription>Response volume and completion rates by survey</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={surveyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="survey" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="responses" fill="#3B82F6" />
                <Bar dataKey="completion" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stakeholder Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Stakeholder Distribution</CardTitle>
            <CardDescription>Response distribution by stakeholder type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stakeholderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stakeholderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Organization Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Performance</CardTitle>
            <CardDescription>Completion rates by organization</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={organizationData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="organization" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="completion" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity Timeline</CardTitle>
            <CardDescription>Daily active users and response activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="activeUsers" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="responses" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="completions" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Maturity Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Maturity Level Distribution</CardTitle>
            <CardDescription>Organization distribution across maturity levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {maturityLevels.map((level, index) => (
                <div key={level.level} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full bg-${COLORS[index]}`} style={{backgroundColor: COLORS[index]}} />
                    <span className="text-sm font-medium">{level.level}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${level.percentage}%`,
                          backgroundColor: COLORS[index]
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12">{level.percentage}%</span>
                    <Badge variant="outline" className="text-xs">
                      {level.organizations}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Surveys */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Surveys</CardTitle>
            <CardDescription>Surveys with highest completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {surveyPerformanceData
                .sort((a, b) => b.completion - a.completion)
                .slice(0, 5)
                .map((survey, index) => (
                  <div key={survey.survey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{survey.survey}</p>
                        <p className="text-xs text-gray-500">{survey.responses} responses</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{survey.completion}%</p>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                        <span className="text-xs text-gray-500">{survey.satisfaction}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest survey activities and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-gray-900">High completion rate achieved</p>
                  <p className="text-xs text-gray-500">Tech Maturity Assessment reached 85% completion</p>
                </div>
                <span className="text-xs text-gray-500">2h ago</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-gray-900">New organization onboarded</p>
                  <p className="text-xs text-gray-500">Temple Emanuel joined the platform</p>
                </div>
                <span className="text-xs text-gray-500">1d ago</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-gray-900">Survey milestone reached</p>
                  <p className="text-xs text-gray-500">1000+ total responses collected</p>
                </div>
                <span className="text-xs text-gray-500">3d ago</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-gray-900">Performance improvement</p>
                  <p className="text-xs text-gray-500">Average response time decreased by 15%</p>
                </div>
                <span className="text-xs text-gray-500">5d ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}