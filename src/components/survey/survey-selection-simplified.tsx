'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SurveySelectionSimplified() {
  const [organizationId, setOrganizationId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleStartSurvey = () => {
    console.log('=== SIMPLIFIED BUTTON CLICKED ===');
    console.log('Organization ID:', organizationId);
    
    setIsSubmitting(true);
    
    // Simple direct navigation
    setTimeout(() => {
      console.log('Navigating to survey...');
      router.push('/survey/demo-showcase-2025');
    }, 100);
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Simplified Survey Test
          </h1>
          <p className="text-gray-600">
            Testing simplified button implementation
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Survey Access</CardTitle>
            <CardDescription>
              Simple test to verify button functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="organizationId">Organization ID (optional)</Label>
                <Input
                  id="organizationId"
                  type="text"
                  placeholder="Enter your organization identifier"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-4">
                <Button
                  type="button"
                  onClick={handleStartSurvey}
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? 'Starting Survey...' : 'Start Survey (Simplified)'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <Button
                  type="button"
                  onClick={() => {
                    console.log('Direct navigation button clicked');
                    alert('Direct button works!');
                    router.push('/survey/demo-showcase-2025');
                  }}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Direct Navigation Test
                </Button>
                
                <Button
                  type="button"
                  onClick={() => {
                    console.log('Alert button clicked');
                    alert('Alert button works! This proves click events are working.');
                  }}
                  variant="secondary"
                  className="w-full"
                  size="lg"
                >
                  Test Alert Button
                </Button>
              </div>
              
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <p><strong>Debug Info:</strong></p>
                <p>Organization ID: {organizationId || 'Empty'}</p>
                <p>Is Submitting: {isSubmitting.toString()}</p>
                <p>Current Time: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}