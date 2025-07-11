'use client';

import { DashboardLayout } from '@/components/admin/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Filter, Search } from 'lucide-react';

export default function ResponsesPage() {
  return (
    <DashboardLayout 
      title="Responses" 
      subtitle="View and manage survey responses"
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Survey Responses
          </CardTitle>
          <CardDescription>
            This page will show detailed survey responses and allow for filtering, searching, and exporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Responses Management</h3>
            <p className="text-gray-500 mb-6">
              Detailed response management functionality will be implemented here.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline">View All Responses</Button>
              <Button>Export Responses</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}