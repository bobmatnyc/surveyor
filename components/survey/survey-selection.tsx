'use client';

import { useState, useEffect } from 'react';
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
  const [organizationId, setOrganizationId] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const router = useRouter();

  const { setSurvey } = useSurveyStore();

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      const response = await fetch('/api/surveys');
      const data = await response.json();
      setSurveys(data);
      if (data.length > 0) {
        setSelectedSurvey(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSurvey = () => {
    if (!selectedSurvey || !organizationId) return;
    
    const survey = surveys.find(s => s.id === selectedSurvey);
    if (!survey) return;

    setSurvey(survey);
    useSurveyStore.getState().organizationId = organizationId;
    
    router.push(`/survey/${selectedSurvey}/${organizationId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading surveys...</p>
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