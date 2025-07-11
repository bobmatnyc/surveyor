'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WithSurveyErrorBoundary } from './survey-error-boundary';
import { SurveySchema } from '@/lib/types';
import { SimpleSurveyStore } from '@/lib/simple-store';
import { getActiveSurveys } from '@/lib/static-surveys';
import { ArrowRight, Building, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SurveySelection() {
  // Static survey data - no API calls needed
  const surveys: SurveySchema[] = getActiveSurveys();
  
  const [organizationId, setOrganizationId] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  
  // Set the first survey as selected when surveys load
  useEffect(() => {
    if (surveys.length > 0 && !selectedSurvey) {
      setSelectedSurvey(surveys[0].id);
    }
  }, [surveys.length, selectedSurvey]);

  // Simple function to store survey data and navigate
  const storeSurveyData = (survey: SurveySchema, orgId: string) => {
    // Use the simple store instead of direct localStorage
    SimpleSurveyStore.setSurvey(survey);
    SimpleSurveyStore.setOrganizationId(orgId);
    SimpleSurveyStore.setState({ startTime: new Date() }); // Reset start time
  };

  const handleStartSurvey = async (event?: React.FormEvent) => {
    console.log('=== HANDLE START SURVEY CALLED ===');
    console.log('Event:', event);
    console.log('Current state:', { selectedSurvey, organizationId, isSubmitting });
    
    if (event) {
      event.preventDefault();
      console.log('Event prevented');
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      // Debug logging
      console.log('Starting survey with:', {
        selectedSurvey,
        organizationId: organizationId.trim(),
        surveys: surveys.length
      });
      
      if (!selectedSurvey || !organizationId.trim()) {
        throw new Error('Please fill in all required fields');
      }
      
      const survey = surveys.find(s => s.id === selectedSurvey);
      if (!survey) {
        throw new Error('Selected survey not found');
      }

      // Store survey data locally
      console.log('Storing survey data...');
      storeSurveyData(survey, organizationId.trim());
      
      // Use the demo survey distribution code for now
      // In a real implementation, this would be dynamically generated
      const distributionCode = 'demo-showcase-2025';
      
      console.log('Navigating to survey:', { distributionCode, surveyId: survey.id, organizationId });
      
      // Add a small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Calling router.push...');
      router.push(`/survey/${distributionCode}`);
      console.log('Router.push called');
      
    } catch (error) {
      console.error('Error starting survey:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      alert('Error: ' + (error instanceof Error ? error.message : 'An unexpected error occurred'));
    } finally {
      console.log('Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  // No loading states needed with static data - surveys are immediately available
  
  // If no surveys are available, show a message and direct demo button
  if (surveys.length === 0) {
    return (
      <WithSurveyErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Begin Your Survey
              </h1>
              <p className="text-gray-600">
                No surveys are currently available. Click below to access the demo survey directly.
              </p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Demo Survey Available</CardTitle>
                <CardDescription>
                  Access the demo survey directly to test the platform functionality.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizationId">Organization ID</Label>
                    <Input
                      id="organizationId"
                      type="text"
                      placeholder="Enter your organization identifier"
                      value={organizationId}
                      onChange={(e) => setOrganizationId(e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const orgId = organizationId.trim() || 'demo-organization';
                      console.log('Direct demo access:', { orgId });
                      router.push(`/survey/demo-showcase-2025`);
                    }}
                    className="w-full"
                    size="lg"
                  >
                    Access Demo Survey
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </WithSurveyErrorBoundary>
    );
  }

  return (
    <WithSurveyErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
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
          <CardContent>
            <form onSubmit={handleStartSurvey} className="space-y-6">
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
                  required
                />
                <p className="text-sm text-gray-500">
                  This helps us track responses for your organization.
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

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
                  type="button"
                  disabled={!selectedSurvey || !organizationId.trim() || isSubmitting}
                  className="w-full"
                  size="lg"
                  onClick={(e) => {
                    console.log('Button clicked!', {
                      selectedSurvey,
                      organizationId: organizationId.trim(),
                      isSubmitting
                    });
                    e.preventDefault();
                    handleStartSurvey();
                  }}
                >
                  {isSubmitting ? 'Starting Survey...' : 'Start Survey'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              {/* Debug info (only in development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs space-y-2">
                  <p><strong>Debug Info:</strong></p>
                  <p>Selected Survey: {selectedSurvey || 'None'}</p>
                  <p>Organization ID: {organizationId || 'Empty'}</p>
                  <p>Available Surveys: {surveys.length}</p>
                  <p>Button Disabled: {(!selectedSurvey || !organizationId.trim() || isSubmitting).toString()}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      console.log('=== DEBUG BUTTON CLICKED ===');
                      console.log('State:', { selectedSurvey, organizationId, isSubmitting });
                      console.log('Surveys:', surveys);
                      alert('Debug button works! Check console for details.');
                    }}
                  >
                    Test Debug Button
                  </Button>
                </div>
              )}
            </form>
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
    </WithSurveyErrorBoundary>
  );
}