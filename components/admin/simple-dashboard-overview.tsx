'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Plus, 
  Link, 
  Users, 
  ClipboardList, 
  Trash2,
  BarChart3,
  Download,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';

interface SurveyData {
  id: string;
  name: string;
  description: string;
  url: string;
  responseCount: number;
  status: 'active' | 'draft' | 'completed';
  createdAt: string;
}

interface ResponseData {
  surveyId: string;
  organizationId: string;
  completedAt: string;
  stakeholder: string;
  responses: Record<string, any>;
}

export function SimpleDashboardOverview() {
  const [surveys, setSurveys] = useState<SurveyData[]>([]);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newSurveyUrl, setNewSurveyUrl] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');

  // Load surveys and responses
  useEffect(() => {
    loadSurveys();
    loadResponses();
  }, []);

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/surveys');
      if (response.ok) {
        const data = await response.json();
        setSurveys(data);
      }
    } catch (error) {
      console.error('Failed to load surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResponses = async () => {
    try {
      const response = await fetch('/api/admin/responses');
      if (response.ok) {
        const data = await response.json();
        setResponses(data);
      }
    } catch (error) {
      console.error('Failed to load responses:', error);
    }
  };

  // Function 1: Upload new surveys (JSON/file upload)
  const handleFileUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('survey', selectedFile);

    setLoading(true);
    try {
      const response = await fetch('/api/admin/surveys/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await loadSurveys();
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('survey-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function 3: Set URLs for surveys
  const handleUpdateSurveyUrl = async (surveyId: string, url: string) => {
    try {
      const response = await fetch(`/api/admin/surveys/${surveyId}/url`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        await loadSurveys();
      }
    } catch (error) {
      console.error('Failed to update URL:', error);
    }
  };

  // Function 5: Delete surveys
  const handleDeleteSurvey = async (surveyId: string) => {
    if (!confirm('Are you sure you want to delete this survey?')) return;

    try {
      const response = await fetch(`/api/admin/surveys/${surveyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadSurveys();
      }
    } catch (error) {
      console.error('Failed to delete survey:', error);
    }
  };

  // Function 4 & 6: Download response data with enhanced API
  const handleDownloadResponses = async (surveyId: string, format: 'json' | 'csv' | 'pdf') => {
    try {
      setLoading(true);
      
      // Use the new download API endpoint
      const response = await fetch(`/api/admin/surveys/${surveyId}/download?format=${format}&includeResults=true&includeAnalysis=true`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `survey-${surveyId}-results-${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Handle different formats
      if (format === 'pdf') {
        // For PDF, we get HTML content that needs to be printed/converted
        const htmlContent = await response.text();
        
        // Create a new window with the HTML content for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          
          // Wait for content to load, then trigger print dialog
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 250);
          };
        } else {
          // Fallback: download as HTML file
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename.replace('.html', '.html');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      } else {
        // For JSON and CSV, download as file
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalSurveys = surveys.length;
  const totalResponses = responses.length;
  const activeSurveys = surveys.filter(s => s.status === 'active').length;
  const uniqueOrganizations = new Set(responses.map(r => r.organizationId)).size;

  return (
    <div className="space-y-6">
      {/* Header with Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Surveys</p>
                <p className="text-2xl font-bold">{totalSurveys}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold">{totalResponses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Active Surveys</p>
                <p className="text-2xl font-bold">{activeSurveys}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Organizations</p>
                <p className="text-2xl font-bold">{uniqueOrganizations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Function 1: Upload New Surveys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Survey
            </CardTitle>
            <CardDescription>Upload a new survey from JSON file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="survey-file">Survey File (JSON)</Label>
              <Input
                id="survey-file"
                type="file"
                accept=".json"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleFileUpload} 
              disabled={!selectedFile || loading}
              className="w-full"
            >
              {loading ? 'Uploading...' : 'Upload Survey'}
            </Button>
          </CardContent>
        </Card>

        {/* Function 2: Survey Builder (Link to builder page) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Survey
            </CardTitle>
            <CardDescription>Design surveys using the built-in builder</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = '/admin/surveys/create'}>
              <Plus className="h-4 w-4 mr-2" />
              Open Survey Builder
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Create surveys with our intuitive drag-and-drop interface
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Survey Management Table */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Management</CardTitle>
          <CardDescription>Manage your surveys, set URLs, view responses, and download data</CardDescription>
        </CardHeader>
        <CardContent>
          {surveys.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No surveys found. Upload or create your first survey to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {surveys.map((survey) => {
                const surveyResponses = responses.filter(r => r.surveyId === survey.id);
                return (
                  <div key={survey.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{survey.name}</h3>
                        <p className="text-sm text-gray-600">{survey.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant={survey.status === 'active' ? 'default' : 'secondary'}>
                            {survey.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {surveyResponses.length} responses
                          </span>
                          <span className="text-sm text-gray-500">
                            Created: {new Date(survey.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSurvey(survey.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <Separator />

                    {/* Function 3: URL Management */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`url-${survey.id}`} className="text-sm font-medium">
                          Survey URL
                        </Label>
                        <div className="flex space-x-2 mt-1">
                          <Input
                            id={`url-${survey.id}`}
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
                            onClick={() => handleUpdateSurveyUrl(survey.id, survey.url)}
                          >
                            <Link className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Function 4 & 6: Download Options */}
                      <div>
                        <Label className="text-sm font-medium">Download Results</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadResponses(survey.id, 'json')}
                            disabled={surveyResponses.length === 0 || loading}
                            title="Download comprehensive JSON data with analysis"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            JSON
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadResponses(survey.id, 'csv')}
                            disabled={surveyResponses.length === 0 || loading}
                            title="Download spreadsheet-compatible CSV file"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            CSV
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadResponses(survey.id, 'pdf')}
                            disabled={surveyResponses.length === 0 || loading}
                            title="Generate formatted PDF report"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                        {surveyResponses.length === 0 && (
                          <p className="text-xs text-gray-500 mt-1">No responses available</p>
                        )}
                        {surveyResponses.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            All formats include detailed analysis and statistics
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Function 4: Response Data Preview */}
                    {surveyResponses.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Recent Responses</Label>
                        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                          {surveyResponses.slice(0, 5).map((response, index) => (
                            <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                              <span>{response.organizationId}</span>
                              <span className="text-gray-500">{response.stakeholder}</span>
                              <span className="text-gray-500">
                                {new Date(response.completedAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                          {surveyResponses.length > 5 && (
                            <p className="text-xs text-gray-500 text-center">
                              ... and {surveyResponses.length - 5} more responses
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}