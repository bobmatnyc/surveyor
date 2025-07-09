'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SurveySchema, SurveyResult } from '@/lib/types';
import { CheckCircle, RotateCcw, Download, BarChart3 } from 'lucide-react';
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
      const response = await fetch(`/api/surveys/${survey.id}/results`);
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Your Assessment Results
                </CardTitle>
                <CardDescription>
                  Based on your responses, here's your organization's technology maturity assessment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Overall Score</h3>
                    <div className="text-3xl font-bold text-blue-600">
                      {results.overallScore.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">out of 5.0</div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Maturity Level</h3>
                    <div
                      className="inline-block px-3 py-1 rounded-full text-white font-medium"
                      style={{ backgroundColor: results.maturityLevel.color }}
                    >
                      {results.maturityLevel.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {results.maturityLevel.description}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Domain Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Domain Scores</CardTitle>
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
                      <div key={domainId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: domain.color }}
                          />
                          <span className="font-medium">{domain.name}</span>
                        </div>
                        <span className="text-lg font-semibold text-gray-900">
                          {score.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Based on your assessment, here are some suggested next steps.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {results.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Results Visualization */}
            <ResultsVisualization results={results} survey={survey} />
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  Results are being processed. Please check back later or contact your administrator.
                </p>
              </div>
            </CardContent>
          </Card>
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