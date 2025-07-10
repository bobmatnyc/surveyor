'use client';

import { DashboardLayout } from '@/components/admin/dashboard-layout';
import { UserManagement } from '@/components/admin/user-management';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Download } from 'lucide-react';

export default function UsersPage() {
  return (
    <DashboardLayout 
      title="Users" 
      subtitle="Manage system users and permissions"
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
            Add User
          </Button>
        </div>
      }
    >
      <UserManagement />
    </DashboardLayout>
  );
}