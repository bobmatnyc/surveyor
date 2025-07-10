'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSurveyStore } from '@/lib/store';
import { SurveySchema } from '@/lib/types';
import { ArrowRight, Building, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SurveySelection() {
  const [surveys, setSurveys] = useState<SurveySchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  const { setSurvey } = useSurveyStore();

  // Hardcoded fallback survey data to ensure the page works
  const fallbackSurvey: SurveySchema = {
    id: "demo-survey-showcase",
    name: "Technology Assessment Demo Survey",
    description: "A comprehensive demonstration survey showcasing all available question types and survey capabilities",
    version: "1.0.0",
    createdAt: "2025-07-10T00:00:00.000Z",
    updatedAt: "2025-07-10T00:00:00.000Z",
    isActive: true,
    settings: {
      allowMultipleResponses: true,
      requireAllStakeholders: false,
      showProgressBar: true,
      allowNavigation: true,
      customStyling: {
        primaryColor: "#059669",
        secondaryColor: "#047857",
        logoUrl: "/logos/demo-logo.png"
      }
    },
    stakeholders: [
      {
        id: "manager",
        name: "Manager/Executive",
        description: "Team lead or executive responsible for technology decisions",
        weight: 0.4,
        color: "#dc2626",
        requiredExpertise: ["strategy", "operations"]
      },
      {
        id: "developer",
        name: "Developer/Technical Lead",
        description: "Software developer or technical team member",
        weight: 0.35,
        color: "#2563eb",
        requiredExpertise: ["technical", "development"]
      },
      {
        id: "user",
        name: "End User",
        description: "Person who regularly uses the technology solutions",
        weight: 0.25,
        color: "#059669",
        requiredExpertise: ["user_experience"]
      }
    ],
    domains: [
      {
        id: "usability",
        name: "Usability & User Experience",
        description: "How user-friendly and intuitive the technology is",
        weight: 0.3,
        color: "#059669",
        icon: "user"
      },
      {
        id: "performance",
        name: "Performance & Reliability",
        description: "Speed, stability, and dependability of systems",
        weight: 0.25,
        color: "#2563eb",
        icon: "zap"
      },
      {
        id: "security",
        name: "Security & Privacy",
        description: "Data protection and system security measures",
        weight: 0.25,
        color: "#dc2626",
        icon: "shield"
      },
      {
        id: "integration",
        name: "Integration & Compatibility",
        description: "How well systems work together and with external tools",
        weight: 0.2,
        color: "#7c3aed",
        icon: "link"
      }
    ],
    questions: [],
    scoring: {
      method: "weighted_average",
      stakeholderWeights: {
        "manager": 0.4,
        "developer": 0.35,
        "user": 0.25
      },
      domainWeights: {
        "usability": 0.3,
        "performance": 0.25,
        "security": 0.25,
        "integration": 0.2
      },
      maturityLevels: []
    }
  };

  const loadSurveys = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to fetch from API first
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('/api/surveys', {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid API response format');
      }
      
      if (data.length === 0) {
        throw new Error('No surveys available from API');
      }
      
      setSurveys(data);
      setSelectedSurvey(data[0].id);
      
    } catch (error) {
      console.warn('API failed, using fallback:', error);
      
      // Use fallback survey if API fails
      setSurveys([fallbackSurvey]);
      setSelectedSurvey(fallbackSurvey.id);
      
      // Only set error message if we're past maximum retries
      if (retryCount >= 2) {
        setError(`Unable to load surveys from server (tried ${retryCount + 1} times). Using demo survey.`);
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  useEffect(() => {
    // Ensure hydration is complete before loading
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        loadSurveys();
      }, 200 + (retryCount * 1000)); // Increase delay with retries
      
      return () => clearTimeout(timer);
    }
  }, [loadSurveys, retryCount]);

  // Auto-retry mechanism
  useEffect(() => {
    if (error && retryCount < 2 && surveys.length === 0) {
      const retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 2000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [error, retryCount, surveys.length]);

  const handleStartSurvey = () => {
    if (!selectedSurvey || !organizationId) return;
    
    const survey = surveys.find(s => s.id === selectedSurvey);
    if (!survey) return;

    setSurvey(survey);
    // Set organization ID using the store's internal set method
    useSurveyStore.setState({ organizationId });
    
    // Use the demo survey distribution code for now
    // In a real implementation, this would be dynamically generated
    const distributionCode = 'demo-showcase-2025';
    router.push(`/survey/${distributionCode}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Loading surveys...
            {retryCount > 0 && ` (attempt ${retryCount + 1})`}
          </p>
          {retryCount > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Having trouble connecting to server, trying fallback...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-red-600 mb-4">
            <h2 className="text-xl font-semibold">Error Loading Surveys</h2>
            <p className="mt-2">{error}</p>
            <details className="mt-4 text-left text-sm">
              <summary className="cursor-pointer">Debug Information</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify({
                  error,
                  location: window.location.href,
                  userAgent: navigator.userAgent,
                  timestamp: new Date().toISOString()
                }, null, 2)}
              </pre>
            </details>
          </div>
          <Button onClick={() => loadSurveys()} className="mt-4">
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()} 
            className="mt-4 ml-2"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">No Surveys Available</h2>
          <p className="text-gray-600 mb-4">No active surveys were found.</p>
          <Button onClick={() => loadSurveys()} className="mt-4">
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Begin Your Survey
          </h1>
          <p className="text-gray-600">
            Select a survey and provide your organization information to get started.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Survey Selection
            </CardTitle>
            <CardDescription>
              Choose the survey you'd like to complete and provide your organization details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Organization ID */}
            <div className="space-y-2">
              <Label htmlFor="organizationId">Organization ID</Label>
              <Input
                id="organizationId"
                type="text"
                placeholder="Enter your organization identifier"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-gray-500">
                This helps us track responses for your organization.
              </p>
            </div>

            {/* Survey Selection */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-700">Available Surveys</legend>
              <div className="space-y-3" role="radiogroup" aria-label="Survey selection">
                {surveys.map((survey) => (
                  <label
                    key={survey.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors block ${
                      selectedSurvey === survey.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    htmlFor={`survey-${survey.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            id={`survey-${survey.id}`}
                            name="survey-selection"
                            value={survey.id}
                            checked={selectedSurvey === survey.id}
                            onChange={(e) => setSelectedSurvey(e.target.value)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                            aria-describedby={`survey-${survey.id}-description`}
                          />
                          <h3 className="font-semibold text-gray-900">{survey.name}</h3>
                        </div>
                        <p id={`survey-${survey.id}-description`} className="text-sm text-gray-600 mt-1 ml-7">
                          {survey.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 ml-7">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {survey.stakeholders.length} stakeholder types
                          </span>
                          <span>{survey.questions.length} questions</span>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Start Button */}
            <div className="pt-4">
              <Button
                onClick={handleStartSurvey}
                disabled={!selectedSurvey || !organizationId}
                className="w-full"
                size="lg"
              >
                Start Survey
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Survey Preview */}
        {selectedSurvey && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Survey Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const survey = surveys.find(s => s.id === selectedSurvey);
                if (!survey) return null;
                
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900">Stakeholder Types</h4>
                        <ul className="mt-2 text-sm text-gray-600">
                          {survey.stakeholders.map((stakeholder) => (
                            <li key={stakeholder.id} className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: stakeholder.color }}
                              />
                              {stakeholder.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Assessment Domains</h4>
                        <ul className="mt-2 text-sm text-gray-600">
                          {survey.domains.map((domain) => (
                            <li key={domain.id} className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: domain.color }}
                              />
                              {domain.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 pt-2 border-t">
                      Estimated completion time: 15-30 minutes depending on your role
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}