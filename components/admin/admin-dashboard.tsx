'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SurveySchema, SurveyResponse, SurveyResult } from '@/lib/types';
import { useAdminStore } from '@/lib/store';
import { BarChart3, Users, ClipboardList, Download, Eye, RefreshCw, Activity, AlertCircle } from 'lucide-react';

export function AdminDashboard() {
  const {
    surveys,
    selectedSurvey,
    responses,
    results,
    loading,
    loadSurveys,
    loadResponses,
    loadResults,
    setSelectedSurvey,
    refreshData
  } = useAdminStore();

  const [stats, setStats] = useState({
    totalSurveys: 0,
    totalResponses: 0,
    totalOrganizations: 0,
    completionRate: 0
  });

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  useEffect(() => {
    // Calculate stats
    const totalSurveys = surveys.length;
    const totalResponses = responses.length;
    const uniqueOrganizations = new Set(responses.map(r => r.organizationId)).size;
    const completedResponses = responses.filter(r => r.completionTime).length;
    const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;

    setStats({
      totalSurveys,
      totalResponses,
      totalOrganizations: uniqueOrganizations,
      completionRate
    });
  }, [surveys, responses]);

  const handleSurveySelect = (surveyId: string) => {
    setSelectedSurvey(surveyId);
  };

  const handleExport = (format: 'csv' | 'json') => {
    const currentSurvey = surveys.find(s => s.id === selectedSurvey);
    if (!currentSurvey) return;

    const data = {
      survey: currentSurvey,
      responses: responses,
      results: results,
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      const dataStr = JSON.stringify(data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `survey-export-${selectedSurvey}-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else {
      // CSV export (simplified)
      const csvData = responses.map(r => ({
        organizationId: r.organizationId,
        stakeholder: r.stakeholder,
        expertise: r.expertise.join(';'),
        completionTime: r.completionTime,
        responseCount: Object.keys(r.responses).length
      }));

      const csvContent = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      const exportFileDefaultName = `survey-responses-${selectedSurvey}-${new Date().toISOString().split('T')[0]}.csv`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Survey management and analytics</p>
          </div>
          <Button
            onClick={refreshData}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </Button>
        </header>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" aria-label="Dashboard Statistics">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Total Surveys</CardTitle>
              <ClipboardList className="h-4 w-4 text-blue-600" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.totalSurveys}</div>
              <p className="text-xs text-blue-700">Active surveys</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900">Total Responses</CardTitle>
              <Users className="h-4 w-4 text-green-600" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.totalResponses}</div>
              <p className="text-xs text-green-700">All survey responses</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Organizations</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.totalOrganizations}</div>
              <p className="text-xs text-purple-700">Unique organizations</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-900">Completion Rate</CardTitle>
              <Activity className="h-4 w-4 text-orange-600" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{stats.completionRate.toFixed(1)}%</div>
              <p className="text-xs text-orange-700">Response completion</p>
            </CardContent>
          </Card>
        </section>

        {/* Survey Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Survey Selection</CardTitle>
            <CardDescription>Choose a survey to view detailed analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys.map((survey) => (
                <div
                  key={survey.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedSurvey === survey.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSurveySelect(survey.id)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedSurvey === survey.id}
                  aria-label={`Select survey: ${survey.name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSurveySelect(survey.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{survey.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{survey.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{survey.questions.length} questions</span>
                        <span>{survey.stakeholders.length} stakeholders</span>
                        <span>{survey.domains.length} domains</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge variant={survey.isActive ? 'default' : 'secondary'}>
                        {survey.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Survey Details */}
        {selectedSurvey && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Responses Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Responses</CardTitle>
                <CardDescription>
                  Latest survey responses for {surveys.find(s => s.id === selectedSurvey)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responses.slice(0, 10).map((response) => (
                    <div key={response.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{response.organizationId}</div>
                        <div className="text-sm text-gray-600">
                          {response.stakeholder} • {response.expertise.join(', ') || 'General'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          <Badge variant={response.completionTime ? 'default' : 'secondary'}>
                            {response.completionTime ? 'Completed' : 'In Progress'}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {response.completionTime 
                            ? new Date(response.completionTime).toLocaleDateString()
                            : `${response.progress}% complete`
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                  {responses.length === 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No responses yet for this survey.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Results Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Results Summary</CardTitle>
                <CardDescription>
                  Analysis results for completed surveys
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.slice(0, 10).map((result) => (
                    <div key={result.organizationId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{result.organizationId}</div>
                        <div className="text-sm text-gray-600">
                          {result.responseCount} responses
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-blue-600">
                          {result.overallScore.toFixed(2)}
                        </div>
                        <Badge 
                          className="text-xs text-white"
                          style={{ backgroundColor: result.maturityLevel.color }}
                        >
                          {result.maturityLevel.name}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {results.length === 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No results calculated yet. Results will appear after surveys are completed.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Export Actions */}
        {selectedSurvey && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>
                Download survey data in various formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  onClick={() => handleExport('json')}
                  className="flex items-center gap-2"
                  aria-label="Export survey data as JSON file"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Export JSON
                </Button>
                <Button
                  onClick={() => handleExport('csv')}
                  variant="outline"
                  className="flex items-center gap-2"
                  aria-label="Export survey data as CSV file"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}