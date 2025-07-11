'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SurveySchema } from '@/lib/types';
import { 
  validateStakeholderSelection, 
  getStakeholderRecommendations, 
  getExpertiseOptions,
  formatExpertise,
  stakeholderSelectionManager
} from '@/lib/stakeholder-utils';
import { ArrowRight, ArrowLeft, User, CheckCircle, Award, Clock, AlertCircle, RefreshCw } from 'lucide-react';

interface StakeholderSelectionProps {
  survey: SurveySchema;
  onSelect: (stakeholder: string, expertise: string[]) => void;
  onBack?: () => void;
}

export function StakeholderSelection({ survey, onSelect, onBack }: StakeholderSelectionProps) {
  const [selectedStakeholder, setSelectedStakeholder] = useState<string>('');
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<{ stakeholderId: string; confidence: number; reason: string }[]>([]);

  // Debug component mount and load saved state
  useEffect(() => {
    console.log('[StakeholderSelection] Component mounted', {
      surveyId: survey.id,
      stakeholderCount: survey.stakeholders.length,
      stakeholders: survey.stakeholders.map(s => ({ id: s.id, name: s.name }))
    });

    // Validate survey data
    if (!survey.stakeholders || survey.stakeholders.length === 0) {
      console.error('[StakeholderSelection] No stakeholders found in survey data!', survey);
      return;
    }

    // Load saved state from localStorage
    const savedState = stakeholderSelectionManager.getState();
    if (savedState.selectedStakeholderId && stakeholderSelectionManager.isStakeholderValid(survey.stakeholders)) {
      setSelectedStakeholder(savedState.selectedStakeholderId);
      setSelectedExpertise(savedState.selectedExpertise);
      console.log('[StakeholderSelection] Restored saved state:', savedState);
    }

    // Generate recommendations
    const recs = getStakeholderRecommendations(selectedExpertise, survey.stakeholders);
    setRecommendations(recs);
  }, [survey, selectedExpertise]);

  const handleStakeholderSelect = (stakeholderId: string) => {
    console.log('[StakeholderSelection] Stakeholder selected:', stakeholderId);
    setSelectedStakeholder(stakeholderId);
    setSelectedExpertise([]); // Reset expertise when changing stakeholder
    
    // Save to persistent state
    stakeholderSelectionManager.setStakeholder(stakeholderId);
    
    // Clear validation errors
    setValidationErrors([]);
    
    // Generate new recommendations
    const recs = getStakeholderRecommendations([], survey.stakeholders);
    setRecommendations(recs);
  };

  const handleExpertiseToggle = (expertise: string) => {
    const newExpertise = selectedExpertise.includes(expertise) 
      ? selectedExpertise.filter(e => e !== expertise)
      : [...selectedExpertise, expertise];
    
    setSelectedExpertise(newExpertise);
    
    // Save to persistent state
    stakeholderSelectionManager.setExpertise(newExpertise);
    
    // Update recommendations
    const recs = getStakeholderRecommendations(newExpertise, survey.stakeholders);
    setRecommendations(recs);
  };

  const handleContinue = async () => {
    setIsLoading(true);
    
    try {
      // Validate selection
      const validation = validateStakeholderSelection(selectedStakeholder, selectedExpertise, survey.stakeholders);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        console.warn('[StakeholderSelection] Validation failed:', validation.errors);
        return;
      }
      
      // Clear any previous errors
      setValidationErrors([]);
      
      console.log('[StakeholderSelection] Continuing with:', {
        stakeholder: selectedStakeholder,
        expertise: selectedExpertise,
        validation
      });
      
      onSelect(selectedStakeholder, selectedExpertise);
    } catch (error) {
      console.error('[StakeholderSelection] Error during continue:', error);
      setValidationErrors(['An error occurred while processing your selection. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedStakeholder('');
    setSelectedExpertise([]);
    setValidationErrors([]);
    stakeholderSelectionManager.reset();
    console.log('[StakeholderSelection] Reset stakeholder selection');
  };

  const selectedStakeholderData = survey.stakeholders.find(s => s.id === selectedStakeholder);
  const expertiseOptions = getExpertiseOptions();

  // Error boundary for missing stakeholders
  if (!survey.stakeholders || survey.stakeholders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Survey Data Issue</h2>
            <p className="text-gray-600 mb-6">
              No stakeholder roles are available for this survey. This may be due to a browser cache issue.
            </p>
            <div className="space-y-4">
              <Button 
                onClick={() => {
                  console.log('[StakeholderSelection] Clearing browser cache');
                  // Clear localStorage and reload
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear Cache & Reload
              </Button>
              {onBack && (
                <Button 
                  onClick={onBack}
                  variant="outline"
                  className="w-full"
                >
                  Back to Survey Selection
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="relative min-h-screen">
        {/* Back Button */}
        {onBack && (
          <div className="absolute top-6 left-6 z-10">
            <Button
              variant="outline"
              onClick={onBack}
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-md"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Survey Selection
            </Button>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center pt-16 pb-12">
          <div className="max-w-4xl mx-auto px-6">
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 mb-6">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2" />
              Survey Setup
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {survey.name}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {survey.description}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 pb-16">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Stakeholder Selection */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl ring-1 ring-blue-100/50">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  Select Your Role
                </CardTitle>
                <CardDescription className="text-base">
                  Choose the role that best describes your position in the organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {survey.stakeholders.map((stakeholder) => (
                  <div
                    key={stakeholder.id}
                    className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedStakeholder === stakeholder.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200/50 transform scale-[1.02]'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md'
                    }`}
                    onClick={() => handleStakeholderSelect(stakeholder.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-5 h-5 rounded-full ring-2 ring-white shadow-sm"
                            style={{ backgroundColor: stakeholder.color }}
                          />
                          <h3 className="font-semibold text-gray-900 text-lg">{stakeholder.name}</h3>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{stakeholder.description}</p>
                      </div>
                      <div className="flex items-center ml-4">
                        {selectedStakeholder === stakeholder.id ? (
                          <CheckCircle className="h-6 w-6 text-blue-500" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Expertise Selection */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl ring-1 ring-blue-100/50">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 bg-green-600 rounded-full" />
                  </div>
                  Areas of Expertise
                </CardTitle>
                <CardDescription className="text-base">
                  {selectedStakeholderData
                    ? `Select areas where you have expertise (optional for ${selectedStakeholderData.name})`
                    : 'Select a role first to see relevant expertise areas'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedStakeholderData ? (
                  <div className="space-y-4">
                    {expertiseOptions.map((expertise) => (
                      <div 
                        key={expertise} 
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                          selectedExpertise.includes(expertise)
                            ? 'border-green-500 bg-green-50 shadow-md'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                        }`}
                        onClick={() => handleExpertiseToggle(expertise)}
                      >
                        <Checkbox
                          id={expertise}
                          checked={selectedExpertise.includes(expertise)}
                          onCheckedChange={() => handleExpertiseToggle(expertise)}
                          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                        <label
                          htmlFor={expertise}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                        >
                          {expertise}
                        </label>
                      </div>
                    ))}
                    {selectedExpertise.length === 0 && (
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertDescription className="text-blue-700">
                          No expertise areas selected. You'll receive general questions for your role.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <User className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Select your role first to see expertise options</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-8">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  <ul className="space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Continue Button */}
          {selectedStakeholder && (
            <div className="mt-12 text-center">
              <Button
                onClick={handleContinue}
                size="lg"
                disabled={isLoading}
                className="px-12 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-3 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Survey
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Debug Information Panel - Only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-12 bg-gray-100 p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-4">Debug Information</h3>
              <div className="space-y-2 text-sm">
                <div>Survey ID: {survey.id}</div>
                <div>Stakeholder Count: {survey.stakeholders.length}</div>
                <div>Selected Stakeholder: {selectedStakeholder || 'None'}</div>
                <div>Selected Expertise: {selectedExpertise.join(', ') || 'None'}</div>
              </div>
              <div className="mt-4 space-x-2">
                <Button
                  onClick={() => {
                    console.log('[Debug] Current survey data:', survey);
                    console.log('[Debug] Stakeholders:', survey.stakeholders);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Log Survey Data
                </Button>
                <Button
                  onClick={() => {
                    localStorage.clear();
                    console.log('[Debug] Cleared localStorage');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Clear Cache
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                >
                  Reset Selection
                </Button>
              </div>
            </div>
          )}

          {/* Preview Information */}
          {selectedStakeholderData && (
            <Card className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-xl ring-1 ring-blue-100/50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  Survey Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-3 shadow-sm">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Your Role</h4>
                    <Badge variant="secondary">{selectedStakeholderData.name}</Badge>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-3 shadow-sm">
                      <Award className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Expertise Areas</h4>
                    <Badge variant="secondary">
                      {selectedExpertise.length > 0 
                        ? selectedExpertise.join(', ') 
                        : 'General questions'
                      }
                    </Badge>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-3 shadow-sm">
                      <Clock className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Estimated Time</h4>
                    <Badge variant="secondary">15-25 minutes</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}