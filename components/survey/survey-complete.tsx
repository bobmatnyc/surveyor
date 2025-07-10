'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { SurveySchema, SurveyResult } from '@/lib/types';
import { CheckCircle, RotateCcw, Download, BarChart3, Award, AlertCircle } from 'lucide-react';
import { ResultsVisualization } from './results-visualization';

interface SurveyCompleteProps {
  survey: SurveySchema;
  organizationId: string;
  onStartOver: () => void;
}

export function SurveyComplete({ survey, organizationId, onStartOver }: SurveyCompleteProps) {
  const [results, setResults] = useState<SurveyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [survey.id, organizationId]);

  const loadResults = async () => {
    try {
      const response = await fetch(`/api/admin/surveys/${survey.id}/results`);
      if (response.ok) {
        const allResults = await response.json();
        const organizationResult = allResults.find((r: SurveyResult) => r.organizationId === organizationId);
        setResults(organizationResult || null);
      }
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResults = () => {
    if (!results) return;
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `survey-results-${organizationId}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Survey Complete!
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Thank you for completing the {survey.name}. Your responses have been saved and analyzed.
          </p>
        </div>

        {/* Results Section */}
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Processing your results...</p>
              </div>
            </CardContent>
          </Card>
        ) : results ? (
          <div className="space-y-6">
            {/* Results Summary */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Award className="h-5 w-5" />
                  Your Assessment Results
                </CardTitle>
                <CardDescription>
                  Based on your responses, here's your organization's technology maturity assessment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center md:text-left">
                    <h3 className="font-semibold text-gray-900 mb-2">Overall Score</h3>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {results.overallScore.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">out of 5.0</div>
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="font-semibold text-gray-900 mb-2">Maturity Level</h3>
                    <div className="mb-2">
                      <Badge 
                        className="text-white text-sm px-4 py-2"
                        style={{ backgroundColor: results.maturityLevel.color }}
                      >
                        {results.maturityLevel.name}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {results.maturityLevel.description}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Domain Scores */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-900">Domain Scores</CardTitle>
                <CardDescription>
                  Your performance across different technology domains.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(results.domainScores).map(([domainId, score]) => {
                    const domain = survey.domains.find(d => d.id === domainId);
                    if (!domain) return null;
                    
                    return (
                      <div key={domainId} className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm"
                            style={{ backgroundColor: domain.color }}
                          />
                          <span className="font-medium text-gray-900">{domain.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-lg font-semibold">
                          {score.toFixed(2)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900">Recommendations</CardTitle>
                <CardDescription>
                  Based on your assessment, here are some suggested next steps.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-200 shadow-sm">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Results Visualization */}
            <ResultsVisualization results={results} survey={survey} />
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Results are being processed. Please check back later or contact your administrator.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            onClick={onStartOver}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Take Survey Again
          </Button>
          
          {results && (
            <Button
              onClick={handleDownloadResults}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Results
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}