import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Users, BarChart3, Settings, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Surveyor
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            A comprehensive multi-stakeholder survey platform that enables organizations 
            to gather insights from different perspectives and generate actionable results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/survey" aria-label="Take Survey - Begin your assessment">
                Take Survey
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/admin" aria-label="Admin Dashboard - Access administrative controls">
                Admin Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <section aria-label="Platform Features">
          <h2 className="sr-only">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <ClipboardList className="h-12 w-12 mx-auto text-blue-600 mb-4" aria-hidden="true" />
              <CardTitle>Dynamic Surveys</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create and manage surveys with configurable JSON schemas that adapt to different stakeholder roles.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-green-600 mb-4" aria-hidden="true" />
              <CardTitle>Multi-Stakeholder</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Support multiple stakeholder types with role-based question filtering and weighted responses.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-12 w-12 mx-auto text-purple-600 mb-4" aria-hidden="true" />
              <CardTitle>Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Sophisticated scoring engine with domain-based analysis and maturity level assessment.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Settings className="h-12 w-12 mx-auto text-orange-600 mb-4" aria-hidden="true" />
              <CardTitle>Easy Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive admin dashboard for survey management, response tracking, and data export.
              </CardDescription>
            </CardContent>
          </Card>
          </div>
        </section>

        {/* How it works */}
        <section className="text-center mb-16" aria-label="How It Works">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto text-xl font-bold" aria-label="Step 1">
                1
              </div>
              <h3 className="text-xl font-semibold">Select Your Role</h3>
              <p className="text-gray-600">
                Choose your stakeholder role and expertise areas to receive personalized questions.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto text-xl font-bold" aria-label="Step 2">
                2
              </div>
              <h3 className="text-xl font-semibold">Complete Survey</h3>
              <p className="text-gray-600">
                Answer questions tailored to your role using our intuitive interface with progress tracking.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto text-xl font-bold" aria-label="Step 3">
                3
              </div>
              <h3 className="text-xl font-semibold">View Results</h3>
              <p className="text-gray-600">
                Get comprehensive results with domain scores, maturity levels, and actionable recommendations.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-white rounded-lg p-12 shadow-lg" aria-label="Get Started">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 mb-8">
            Begin your assessment journey and unlock insights for your organization.
          </p>
          <Button size="lg" asChild>
            <Link href="/survey" aria-label="Start Your Survey - Begin assessment process">
              Start Your Survey
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}