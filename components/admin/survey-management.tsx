'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Download,
  Trash2,
  Play,
  Pause,
  Copy,
  Users,
  BarChart3,
  Calendar,
  Clock
} from 'lucide-react';

interface Survey {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'paused' | 'completed';
  responses: number;
  totalQuestions: number;
  organizations: number;
  createdAt: string;
  updatedAt: string;
  completionRate: number;
  stakeholders: string[];
}

const mockSurveys: Survey[] = [
  {
    id: 'jim-joseph-tech-maturity-v1',
    name: 'Tech Maturity Assessment',
    description: 'Comprehensive technology maturity evaluation for organizations',
    status: 'active',
    responses: 89,
    totalQuestions: 45,
    organizations: 8,
    createdAt: '2024-01-15',
    updatedAt: '2024-02-10',
    completionRate: 78.5,
    stakeholders: ['CEO', 'Tech Lead', 'Board', 'Staff']
  },
  {
    id: 'digital-readiness-v2',
    name: 'Digital Readiness Survey',
    description: 'Assessment of digital transformation readiness',
    status: 'active',
    responses: 67,
    totalQuestions: 32,
    organizations: 6,
    createdAt: '2024-02-01',
    updatedAt: '2024-02-15',
    completionRate: 82.3,
    stakeholders: ['CEO', 'Tech Lead', 'Staff']
  },
  {
    id: 'process-assessment-v1',
    name: 'Process Assessment',
    description: 'Evaluation of organizational processes and workflows',
    status: 'draft',
    responses: 12,
    totalQuestions: 28,
    organizations: 3,
    createdAt: '2024-02-10',
    updatedAt: '2024-02-20',
    completionRate: 45.2,
    stakeholders: ['CEO', 'Board', 'Staff']
  },
  {
    id: 'security-audit-v1',
    name: 'Security Audit',
    description: 'Comprehensive security assessment and compliance check',
    status: 'paused',
    responses: 34,
    totalQuestions: 52,
    organizations: 4,
    createdAt: '2024-01-20',
    updatedAt: '2024-02-05',
    completionRate: 67.8,
    stakeholders: ['Tech Lead', 'Board']
  },
  {
    id: 'user-experience-v1',
    name: 'User Experience Survey',
    description: 'User satisfaction and experience evaluation',
    status: 'completed',
    responses: 156,
    totalQuestions: 22,
    organizations: 12,
    createdAt: '2023-12-01',
    updatedAt: '2024-01-30',
    completionRate: 94.2,
    stakeholders: ['CEO', 'Tech Lead', 'Board', 'Staff']
  }
];

export function SurveyManagement() {
  const [surveys, setSurveys] = useState<Survey[]>(mockSurveys);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<keyof Survey>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || survey.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedSurveys = [...filteredSurveys].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const getStatusBadge = (status: Survey['status']) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      draft: { label: 'Draft', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
      paused: { label: 'Paused', variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Completed', variant: 'outline' as const, color: 'bg-blue-100 text-blue-800' }
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const handleAction = (action: string, survey: Survey) => {
    console.log(`Action: ${action} on survey: ${survey.name}`);
    // Implement actions here
  };

  const handleSort = (column: keyof Survey) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Survey Management</h1>
          <p className="text-gray-600">Manage and monitor your survey campaigns</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Survey
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Surveys</p>
                <p className="text-2xl font-bold">{surveys.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Surveys</p>
                <p className="text-2xl font-bold">{surveys.filter(s => s.status === 'active').length}</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold">{surveys.reduce((sum, s) => sum + s.responses, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Completion</p>
                <p className="text-2xl font-bold">
                  {(surveys.reduce((sum, s) => sum + s.completionRate, 0) / surveys.length).toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search surveys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Status: {statusFilter === 'all' ? 'All' : statusFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('draft')}>Draft</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('paused')}>Paused</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completed</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('name')}
                  >
                    Survey Name
                    {sortBy === 'name' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('responses')}
                  >
                    Responses
                    {sortBy === 'responses' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead>Organizations</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('completionRate')}
                  >
                    Completion Rate
                    {sortBy === 'completionRate' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('updatedAt')}
                  >
                    Last Updated
                    {sortBy === 'updatedAt' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSurveys.map((survey) => (
                  <TableRow key={survey.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{survey.name}</div>
                        <div className="text-sm text-gray-500">{survey.description}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {survey.totalQuestions} questions
                          </Badge>
                          <div className="flex items-center gap-1">
                            {survey.stakeholders.slice(0, 2).map((stakeholder) => (
                              <Badge key={stakeholder} variant="secondary" className="text-xs">
                                {stakeholder}
                              </Badge>
                            ))}
                            {survey.stakeholders.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{survey.stakeholders.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(survey.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{survey.responses}</span>
                        <Users className="h-4 w-4 text-gray-400" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{survey.organizations}</span>
                        <BarChart3 className="h-4 w-4 text-gray-400" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{survey.completionRate}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${survey.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(survey.updatedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAction('view', survey)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction('edit', survey)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Survey
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction('copy', survey)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction('download', survey)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                          </DropdownMenuItem>
                          {survey.status === 'active' ? (
                            <DropdownMenuItem onClick={() => handleAction('pause', survey)}>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause Survey
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleAction('activate', survey)}>
                              <Play className="mr-2 h-4 w-4" />
                              Activate Survey
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleAction('delete', survey)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Survey
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}