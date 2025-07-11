'use client';

import { DashboardLayout } from '@/components/admin/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Download, FileText, Archive } from 'lucide-react';

export default function ExportPage() {
  return (
    <DashboardLayout 
      title="Data Export" 
      subtitle="Export and backup your survey data"
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Export
          </CardTitle>
          <CardDescription>
            Export survey data, responses, and results in various formats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Database className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Export Management</h3>
            <p className="text-gray-500 mb-6">
              Comprehensive data export and backup functionality will be implemented here.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}