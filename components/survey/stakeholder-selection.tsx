'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SurveySchema } from '@/lib/types';
import { ArrowRight, User, CheckCircle, Award, Clock } from 'lucide-react';

interface StakeholderSelectionProps {
  survey: SurveySchema;
  onSelect: (stakeholder: string, expertise: string[]) => void;
}

export function StakeholderSelection({ survey, onSelect }: StakeholderSelectionProps) {
  const [selectedStakeholder, setSelectedStakeholder] = useState<string>('');
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);

  const handleStakeholderSelect = (stakeholderId: string) => {
    setSelectedStakeholder(stakeholderId);
    setSelectedExpertise([]); // Reset expertise when changing stakeholder
  };

  const handleExpertiseToggle = (expertise: string) => {
    setSelectedExpertise(prev => 
      prev.includes(expertise) 
        ? prev.filter(e => e !== expertise)
        : [...prev, expertise]
    );
  };

  const handleContinue = () => {
    if (selectedStakeholder) {
      onSelect(selectedStakeholder, selectedExpertise);
    }
  };

  const selectedStakeholderData = survey.stakeholders.find(s => s.id === selectedStakeholder);
  const expertiseOptions = ['strategy', 'governance', 'infrastructure', 'data', 'operations'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="relative min-h-screen">
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

          {/* Continue Button */}
          {selectedStakeholder && (
            <div className="mt-12 text-center">
              <Button
                onClick={handleContinue}
                size="lg"
                className="px-12 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
              >
                Continue to Survey
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
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