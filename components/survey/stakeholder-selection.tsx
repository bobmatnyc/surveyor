'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { SurveySchema } from '@/lib/types';
import { ArrowRight, User, CheckCircle } from 'lucide-react';

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
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {survey.name}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {survey.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Stakeholder Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Select Your Role
              </CardTitle>
              <CardDescription>
                Choose the role that best describes your position in the organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {survey.stakeholders.map((stakeholder) => (
                <div
                  key={stakeholder.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedStakeholder === stakeholder.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleStakeholderSelect(stakeholder.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: stakeholder.color }}
                        />
                        <h3 className="font-semibold text-gray-900">{stakeholder.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{stakeholder.description}</p>
                    </div>
                    <div className="flex items-center">
                      {selectedStakeholder === stakeholder.id ? (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Expertise Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Areas of Expertise</CardTitle>
              <CardDescription>
                {selectedStakeholderData
                  ? `Select areas where you have expertise (optional for ${selectedStakeholderData.name})`
                  : 'Select a role first to see relevant expertise areas'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedStakeholderData ? (
                <div className="space-y-3">
                  {expertiseOptions.map((expertise) => (
                    <div key={expertise} className="flex items-center space-x-2">
                      <Checkbox
                        id={expertise}
                        checked={selectedExpertise.includes(expertise)}
                        onCheckedChange={() => handleExpertiseToggle(expertise)}
                      />
                      <label
                        htmlFor={expertise}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                      >
                        {expertise}
                      </label>
                    </div>
                  ))}
                  {selectedExpertise.length === 0 && (
                    <p className="text-sm text-gray-500 mt-4">
                      No expertise areas selected. You'll receive general questions for your role.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select your role first to see expertise options</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Continue Button */}
        {selectedStakeholder && (
          <div className="mt-8 text-center">
            <Button
              onClick={handleContinue}
              size="lg"
              className="px-8"
            >
              Continue to Survey
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Preview Information */}
        {selectedStakeholderData && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Survey Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900">Your Role</h4>
                  <p className="text-gray-600 mt-1">{selectedStakeholderData.name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Expertise Areas</h4>
                  <p className="text-gray-600 mt-1">
                    {selectedExpertise.length > 0 
                      ? selectedExpertise.join(', ') 
                      : 'General questions'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Estimated Time</h4>
                  <p className="text-gray-600 mt-1">15-25 minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}