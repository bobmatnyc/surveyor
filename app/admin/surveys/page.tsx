'use client';

import { DashboardLayout } from '@/components/admin/dashboard-layout';
import { SurveyManagement } from '@/components/admin/survey-management';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Download } from 'lucide-react';

export default function SurveysPage() {
  return (
    <DashboardLayout 
      title="Surveys" 
      subtitle="Manage your survey campaigns and monitor performance"
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Survey
          </Button>
        </div>
      }
    >
      <SurveyManagement />
    </DashboardLayout>
  );
}