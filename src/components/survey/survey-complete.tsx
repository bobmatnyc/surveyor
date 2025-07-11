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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="relative min-h-screen">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)]" aria-hidden="true" />
        
        {/* Main Content */}
        <main className="relative z-10">
          <div className="max-w-4xl mx-auto px-6 py-16">
            {/* Success Header */}
            <div className="text-center pt-8 pb-12">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 mb-6">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse mr-2" />
                Survey Complete
              </Badge>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Thank You!
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Thank you for completing the {survey.name}. Your responses have been saved and analyzed.
              </p>
            </div>

            {/* Results Section */}
            {loading ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl ring-1 ring-blue-100/50">
                <CardContent className="pt-6">
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Results</h3>
                    <p className="text-gray-600">Please wait while we analyze your responses...</p>
                  </div>
                </CardContent>
              </Card>
            ) : results ? (
              <div className="space-y-8">
                {/* Results Summary */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl ring-1 ring-blue-100/50">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Award className="h-5 w-5 text-blue-600" />
                      </div>
                      Your Assessment Results
                    </CardTitle>
                    <CardDescription className="text-base">
                      Based on your responses, here's your organization's technology maturity assessment.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <span className="text-2xl font-bold text-blue-600">
                            {results.overallScore.toFixed(1)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Overall Score</h3>
                        <div className="text-sm text-gray-600">out of 5.0</div>
                      </div>
                      <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <Award className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Maturity Level</h3>
                        <Badge 
                          className="text-white text-sm px-4 py-2 mb-2"
                          style={{ backgroundColor: results.maturityLevel.color }}
                        >
                          {results.maturityLevel.name}
                        </Badge>
                        <div className="text-sm text-gray-600">
                          {results.maturityLevel.description}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Domain Scores */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl ring-1 ring-green-100/50">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                      </div>
                      Domain Scores
                    </CardTitle>
                    <CardDescription className="text-base">
                      Your performance across different technology domains.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(results.domainScores).map(([domainId, score]) => {
                        const domain = survey.domains.find(d => d.id === domainId);
                        if (!domain) return null;
                        
                        return (
                          <div key={domainId} className="flex items-center justify-between p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-5 h-5 rounded-full ring-2 ring-white shadow-sm"
                                style={{ backgroundColor: domain.color }}
                              />
                              <span className="font-medium text-gray-900">{domain.name}</span>
                            </div>
                            <Badge variant="secondary" className="text-lg font-semibold px-3 py-1">
                              {score.toFixed(1)}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl ring-1 ring-purple-100/50">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                      </div>
                      Recommendations
                    </CardTitle>
                    <CardDescription className="text-base">
                      Based on your assessment, here are some suggested next steps.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {results.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-4 p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200 shadow-sm">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-gray-700 leading-relaxed">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Results Visualization */}
                <ResultsVisualization results={results} survey={survey} />
              </div>
            ) : (
              <Alert className="bg-white/80 backdrop-blur-sm border-0 shadow-xl ring-1 ring-amber-100/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Results are being processed. Please check back later or contact your administrator.
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-4 mt-12">
              <Button
                onClick={onStartOver}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 px-8 py-3 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-md"
              >
                <RotateCcw className="h-4 w-4" />
                Take Survey Again
              </Button>
              
              {results && (
                <Button
                  onClick={handleDownloadResults}
                  size="lg"
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-200"
                >
                  <Download className="h-4 w-4" />
                  Download Results
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}