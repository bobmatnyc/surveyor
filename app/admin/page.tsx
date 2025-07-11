'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/admin/dashboard-layout';
import { SimpleDashboardOverview } from '@/components/admin/simple-dashboard-overview';
import { BarChart3, Users, ClipboardList, Download } from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: username.trim(),
          password: password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setError('');
      } else {
        setError(data.message || 'Authentication failed');
        if (data.lockedOut) {
          setError(`Account locked. ${data.message}`);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Enter your admin credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="admin-username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
                aria-describedby={error ? "auth-error" : undefined}
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <p id="auth-error" className="text-red-600 text-sm" role="alert" aria-live="polite">
                {error}
              </p>
            )}
            <Button 
              onClick={handleLogin} 
              className="w-full" 
              disabled={isLoading || !username.trim() || !password}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Survey Management Dashboard" 
      subtitle="Simple and focused survey administration"
    >
      <SimpleDashboardOverview />
    </DashboardLayout>
  );
}