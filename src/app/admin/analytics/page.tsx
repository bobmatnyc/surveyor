'use client';

import { DashboardLayout } from '@/components/admin/dashboard-layout';
import { AnalyticsReporting } from '@/components/admin/analytics-reporting';
import { Button } from '@/components/ui/button';
import { Download, Calendar, RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <DashboardLayout 
      title="Analytics" 
      subtitle="Comprehensive insights and reporting"
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      }
    >
      <AnalyticsReporting />
    </DashboardLayout>
  );
}