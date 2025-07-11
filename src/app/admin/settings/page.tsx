'use client';

import { DashboardLayout } from '@/components/admin/dashboard-layout';
import { Settings } from '@/components/admin/settings';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, Download } from 'lucide-react';

export default function SettingsPage() {
  return (
    <DashboardLayout 
      title="Settings" 
      subtitle="Configure your survey platform"
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
          <Button size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      }
    >
      <Settings />
    </DashboardLayout>
  );
}