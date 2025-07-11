'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/admin/dashboard-layout';
import { 
  ClipboardList, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Link,
  Users,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface Survey {
  id: string;
  name: string;
  description: string;
  version: string;
  questions: any[];
  stakeholders: string[];
  domains: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  url?: string;
}

interface SurveyStats {
  [surveyId: string]: {
    responseCount: number;
    completionRate: number;
    lastResponse: string;
  };
}

export default function SurveyManagementPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState<SurveyStats>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/surveys');
      if (response.ok) {
        const data = await response.json();
        setSurveys(data);
        
        // Load stats for each survey
        const statsData: SurveyStats = {};
        for (const survey of data) {
          try {
            const responsesResponse = await fetch(`/api/admin/responses?surveyId=${survey.id}`);
            if (responsesResponse.ok) {
              const responses = await responsesResponse.json();
              statsData[survey.id] = {
                responseCount: responses.length,
                completionRate: responses.length > 0 ? 
                  (responses.filter((r: any) => r.completionTime).length / responses.length) * 100 : 0,
                lastResponse: responses.length > 0 ? 
                  responses[0].completionTime || responses[0].createdAt : ''
              };
            }
          } catch (error) {
            console.warn(`Failed to load stats for survey ${survey.id}:`, error);
          }
        }
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to load surveys:', error);
      setMessage({ type: 'error', text: 'Failed to load surveys' });
    } finally {
      setLoading(false);
    }
  };

  const deleteSurvey = async (surveyId: string, surveyName: string) => {
    if (!confirm(`Are you sure you want to delete "${surveyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/surveys/${surveyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Survey deleted successfully' });
        await loadSurveys();
      } else {
        throw new Error('Failed to delete survey');
      }
    } catch (error) {
      console.error('Error deleting survey:', error);
      setMessage({ type: 'error', text: 'Failed to delete survey' });
    }
  };

  const updateSurveyUrl = async (surveyId: string, url: string) => {
    try {
      const response = await fetch(`/api/admin/surveys/${surveyId}/url`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Survey URL updated successfully' });
        await loadSurveys();
      } else {
        throw new Error('Failed to update URL');
      }
    } catch (error) {
      console.error('Error updating URL:', error);
      setMessage({ type: 'error', text: 'Failed to update survey URL' });
    }
  };

  const downloadSurveyData = async (surveyId: string, format: 'json' | 'csv') => {
    try {
      const responsesResponse = await fetch(`/api/admin/responses?surveyId=${surveyId}`);
      if (!responsesResponse.ok) {
        throw new Error('Failed to fetch responses');
      }
      
      const responses = await responsesResponse.json();
      const survey = surveys.find(s => s.id === surveyId);
      
      if (format === 'json') {
        const data = {
          survey: survey,
          responses: responses,
          exportedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `survey-${surveyId}-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      } else {
        // CSV format
        if (responses.length === 0) {
          setMessage({ type: 'error', text: 'No responses available for download' });
          return;
        }

        const csvData = responses.map((r: any) => ({
          surveyId: r.surveyId,
          organizationId: r.organizationId,
          stakeholder: r.stakeholder,
          completedAt: r.completionTime,
          responseCount: Object.keys(r.responses || {}).length
        }));

        const csvContent = [
          Object.keys(csvData[0]).join(','),
          ...csvData.map(row => Object.values(row).join(','))
        ].join('\n');

        const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
        const exportFileDefaultName = `survey-responses-${surveyId}-${new Date().toISOString().split('T')[0]}.csv`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      }
    } catch (error) {
      console.error('Error downloading data:', error);
      setMessage({ type: 'error', text: 'Failed to download survey data' });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Survey Management" subtitle="Manage your surveys">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading surveys...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Survey Management" subtitle="Manage and monitor your surveys">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Surveys ({surveys.length})</h2>
            <p className="text-gray-600">Create, edit, and manage your survey collection</p>
          </div>
          <Button onClick={() => window.location.href = '/admin/surveys/create'}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Survey
          </Button>
        </div>

        {/* Messages */}
        {message && (
          <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Survey Cards */}
        {surveys.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first survey</p>
              <Button onClick={() => window.location.href = '/admin/surveys/create'}>
                <Plus className="h-4 w-4 mr-2" />
                Create Survey
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {surveys.map((survey) => {
              const surveyStats = stats[survey.id] || { responseCount: 0, completionRate: 0, lastResponse: '' };
              
              return (
                <Card key={survey.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3">
                          {survey.name}
                          <Badge variant={survey.isActive ? 'default' : 'secondary'}>
                            {survey.isActive ? 'Active' : 'Draft'}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {survey.description || 'No description provided'}
                        </CardDescription>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{survey.questions.length} questions</span>
                          <span>{survey.stakeholders.length} stakeholders</span>
                          <span>{survey.domains.length} domains</span>
                          <span>v{survey.version}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSurvey(survey.id, survey.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-600">Responses</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{surveyStats.responseCount}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <BarChart3 className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-600">Completion</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {surveyStats.completionRate.toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Clock className="h-4 w-4 text-purple-600" />
                          <span className="text-sm text-gray-600">Last Response</span>
                        </div>
                        <p className="text-sm font-medium text-purple-600">
                          {surveyStats.lastResponse ? 
                            new Date(surveyStats.lastResponse).toLocaleDateString() : 
                            'None'
                          }
                        </p>
                      </div>
                    </div>

                    {/* URL Management */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Survey URL
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          value={survey.url || ''}
                          onChange={(e) => {
                            setSurveys(prev => prev.map(s => 
                              s.id === survey.id ? { ...s, url: e.target.value } : s
                            ));
                          }}
                          placeholder="https://your-domain.com/survey"
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => updateSurveyUrl(survey.id, survey.url || '')}
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadSurveyData(survey.id, 'json')}
                          disabled={surveyStats.responseCount === 0}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          JSON
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadSurveyData(survey.id, 'csv')}
                          disabled={surveyStats.responseCount === 0}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          CSV
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}