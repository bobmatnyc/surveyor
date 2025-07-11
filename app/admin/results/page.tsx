'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/admin/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  Download, 
  Filter, 
  TrendingUp, 
  FileText, 
  Database,
  PieChart,
  Users,
  Activity,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

interface SurveyStats {
  id: string;
  name: string;
  totalResponses: number;
  completedResponses: number;
  uniqueOrganizations: number;
  averageScore: number;
  completionRate: number;
  lastUpdated: string;
}

export default function ResultsPage() {
  const [surveys, setSurveys] = useState<SurveyStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [selectedSurveys, setSelectedSurveys] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSurveyStats();
  }, []);

  const loadSurveyStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/surveys');
      if (response.ok) {
        const surveysData = await response.json();
        
        // Get stats for each survey
        const statsPromises = surveysData.map(async (survey: any) => {
          try {
            const responsesRes = await fetch(`/api/admin/responses?surveyId=${survey.id}`);
            const responses = responsesRes.ok ? await responsesRes.json() : [];
            
            const resultsRes = await fetch(`/api/admin/surveys/${survey.id}/results`);
            const results = resultsRes.ok ? await resultsRes.json() : [];
            
            const completedResponses = responses.filter((r: any) => r.completionTime);
            const averageScore = results.length > 0 
              ? results.reduce((sum: number, r: any) => sum + r.overallScore, 0) / results.length 
              : 0;
            
            return {
              id: survey.id,
              name: survey.name,
              totalResponses: responses.length,
              completedResponses: completedResponses.length,
              uniqueOrganizations: new Set(responses.map((r: any) => r.organizationId)).size,
              averageScore: averageScore,
              completionRate: responses.length > 0 ? (completedResponses.length / responses.length) * 100 : 0,
              lastUpdated: new Date().toISOString()
            };
          } catch (error) {
            console.error(`Error loading stats for survey ${survey.id}:`, error);
            return {
              id: survey.id,
              name: survey.name,
              totalResponses: 0,
              completedResponses: 0,
              uniqueOrganizations: 0,
              averageScore: 0,
              completionRate: 0,
              lastUpdated: new Date().toISOString()
            };
          }
        });
        
        const stats = await Promise.all(statsPromises);
        setSurveys(stats);
      }
    } catch (error) {
      console.error('Failed to load survey stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (surveyId: string, format: 'json' | 'csv' | 'pdf') => {
    try {
      setDownloadingFormat(`${surveyId}-${format}`);
      
      const response = await fetch(`/api/admin/surveys/${surveyId}/download?format=${format}&includeResults=true&includeAnalysis=true`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `survey-${surveyId}-results.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      if (format === 'pdf') {
        const htmlContent = await response.text();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 250);
          };
        } else {
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
      setDownloadingFormat(null);
    }
  };

  const handleBulkDownload = async (format: 'json' | 'csv' | 'pdf') => {
    if (selectedSurveys.size === 0) {
      alert('Please select at least one survey to download.');
      return;
    }

    setDownloadingFormat(`bulk-${format}`);
    
    try {
      for (const surveyId of selectedSurveys) {
        await handleDownload(surveyId, format);
        // Small delay between downloads to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } finally {
      setDownloadingFormat(null);
    }
  };

  const toggleSurveySelection = (surveyId: string) => {
    const newSelection = new Set(selectedSurveys);
    if (newSelection.has(surveyId)) {
      newSelection.delete(surveyId);
    } else {
      newSelection.add(surveyId);
    }
    setSelectedSurveys(newSelection);
  };

  const selectAllSurveys = () => {
    setSelectedSurveys(new Set(surveys.map(s => s.id)));
  };

  const clearSelection = () => {
    setSelectedSurveys(new Set());
  };

  const totalStats = surveys.reduce(
    (acc, survey) => ({
      totalResponses: acc.totalResponses + survey.totalResponses,
      totalOrganizations: acc.totalOrganizations + survey.uniqueOrganizations,
      averageCompletion: acc.averageCompletion + survey.completionRate,
      averageScore: acc.averageScore + survey.averageScore
    }),
    { totalResponses: 0, totalOrganizations: 0, averageCompletion: 0, averageScore: 0 }
  );

  const avgCompletionRate = surveys.length > 0 ? totalStats.averageCompletion / surveys.length : 0;
  const avgScore = surveys.length > 0 ? totalStats.averageScore / surveys.length : 0;

  return (
    <DashboardLayout 
      title="Results & Downloads" 
      subtitle="Download survey results in multiple formats with comprehensive analysis"
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadSurveyStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {selectedSurveys.size > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{selectedSurveys.size} selected</Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleBulkDownload('json')}
                disabled={!!downloadingFormat}
              >
                <Download className="h-4 w-4 mr-2" />
                Bulk JSON
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleBulkDownload('csv')}
                disabled={!!downloadingFormat}
              >
                <Download className="h-4 w-4 mr-2" />
                Bulk CSV
              </Button>
            </div>
          )}
        </div>
      }
    >
      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Surveys</p>
                <p className="text-2xl font-bold">{surveys.length}</p>
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
                <p className="text-2xl font-bold">{totalStats.totalResponses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Completion</p>
                <p className="text-2xl font-bold">{avgCompletionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold">{avgScore.toFixed(1)}/5.0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Survey Selection and Downloads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Survey Results Download Center
            </div>
            <div className="flex items-center space-x-2">
              {surveys.length > 0 && (
                <>
                  <Button variant="ghost" size="sm" onClick={selectAllSurveys}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Download survey results in JSON, CSV, or PDF formats. All downloads include comprehensive analysis, statistics, and visualizations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 mx-auto text-gray-400 mb-4 animate-spin" />
              <p className="text-gray-500">Loading survey statistics...</p>
            </div>
          ) : surveys.length === 0 ? (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>
                No surveys found. Upload or create surveys to see download options.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {surveys.map((survey) => (
                <div key={survey.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedSurveys.has(survey.id)}
                        onChange={() => toggleSurveySelection(survey.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{survey.name}</h3>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant={survey.totalResponses > 0 ? 'default' : 'secondary'}>
                            {survey.totalResponses} responses
                          </Badge>
                          <span className="text-sm text-gray-500 flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {survey.uniqueOrganizations} organizations
                          </span>
                          <span className="text-sm text-gray-500 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {survey.completionRate.toFixed(1)}% completion
                          </span>
                          {survey.averageScore > 0 && (
                            <span className="text-sm text-gray-500 flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {survey.averageScore.toFixed(1)}/5.0 avg score
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Download Options */}
                  <div>
                    <Label className="text-sm font-medium">Download Options</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(survey.id, 'json')}
                        disabled={survey.totalResponses === 0 || downloadingFormat === `${survey.id}-json`}
                        title="Comprehensive JSON with all data, analysis, and metadata"
                      >
                        {downloadingFormat === `${survey.id}-json` ? (
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Database className="h-4 w-4 mr-1" />
                        )}
                        JSON Data
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(survey.id, 'csv')}
                        disabled={survey.totalResponses === 0 || downloadingFormat === `${survey.id}-csv`}
                        title="Spreadsheet-compatible CSV with summary statistics"
                      >
                        {downloadingFormat === `${survey.id}-csv` ? (
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <BarChart3 className="h-4 w-4 mr-1" />
                        )}
                        CSV Report
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(survey.id, 'pdf')}
                        disabled={survey.totalResponses === 0 || downloadingFormat === `${survey.id}-pdf`}
                        title="Professional PDF report with charts and analysis"
                      >
                        {downloadingFormat === `${survey.id}-pdf` ? (
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4 mr-1" />
                        )}
                        PDF Report
                      </Button>
                    </div>
                    {survey.totalResponses === 0 ? (
                      <p className="text-xs text-gray-500 mt-1">No responses available for download</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        All formats include detailed analysis, domain breakdowns, and stakeholder insights
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}