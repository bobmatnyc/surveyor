'use client';

import { track } from '@vercel/analytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsTestPage() {
  const handleTestEvent = () => {
    track('test_button_clicked', {
      page: 'analytics-test',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    alert('Analytics event sent! Check Vercel Analytics dashboard to see the event.');
  };

  const handleCustomEvent = (eventName: string) => {
    track(eventName, {
      page: 'analytics-test',
      category: 'user_interaction',
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Vercel Analytics Test Page
          </h1>
          <p className="text-lg text-gray-600">
            Test Vercel Analytics integration and custom event tracking
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Automatic Tracking</CardTitle>
              <CardDescription>
                These events are tracked automatically by Vercel Analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Page Views</h3>
                <p className="text-green-700 text-sm">
                  Automatically tracked when users visit any page
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Core Web Vitals</h3>
                <p className="text-green-700 text-sm">
                  Performance metrics like LCP, FID, CLS are tracked automatically
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Route Changes</h3>
                <p className="text-green-700 text-sm">
                  Navigation between pages is tracked in single-page applications
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Event Tracking</CardTitle>
              <CardDescription>
                Test custom events for specific user interactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleTestEvent} 
                className="w-full"
              >
                Send Test Analytics Event
              </Button>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => handleCustomEvent('survey_started')} 
                  variant="outline" 
                  className="w-full"
                >
                  Track: Survey Started
                </Button>
                
                <Button 
                  onClick={() => handleCustomEvent('survey_completed')} 
                  variant="outline" 
                  className="w-full"
                >
                  Track: Survey Completed
                </Button>
                
                <Button 
                  onClick={() => handleCustomEvent('admin_login')} 
                  variant="outline" 
                  className="w-full"
                >
                  Track: Admin Login
                </Button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">📊 Analytics Dashboard</h4>
                <p className="text-blue-700 text-sm">
                  After deployment to Vercel, visit your Vercel dashboard to see these events 
                  in the Analytics section.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>
              Current status of Vercel Analytics integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">✅</div>
                <h3 className="font-semibold text-green-800">Package Installed</h3>
                <p className="text-green-700 text-sm">@vercel/analytics v1.5.0</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">✅</div>
                <h3 className="font-semibold text-green-800">Component Added</h3>
                <p className="text-green-700 text-sm">Analytics component in layout</p>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl mb-2">⏳</div>
                <h3 className="font-semibold text-yellow-800">Deployment Required</h3>
                <p className="text-yellow-700 text-sm">Deploy to Vercel to see data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => window.history.back()}>
            ← Back to Application
          </Button>
        </div>
      </div>
    </div>
  );
}