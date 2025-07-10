'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/admin/dashboard-layout';
import { DashboardOverview } from '@/components/admin/dashboard-overview';
import { BarChart3, Users, ClipboardList, Download } from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    // Simple password check (in real app, use proper authentication)
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Enter the admin password to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Password
              </label>
              <input
                id="admin-password"
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                aria-describedby={error ? "password-error" : undefined}
                required
              />
            </div>
            {error && (
              <p id="password-error" className="text-red-600 text-sm" role="alert" aria-live="polite">
                {error}
              </p>
            )}
            <Button onClick={handleLogin} className="w-full">
              Login
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Demo password: admin123
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Welcome to your survey management dashboard"
    >
      <DashboardOverview />
    </DashboardLayout>
  );
}