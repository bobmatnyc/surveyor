'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon,
  Mail,
  Shield,
  Database,
  Palette,
  Bell,
  Users,
  Globe,
  Key,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface SettingsState {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    timezone: string;
    language: string;
  };
  security: {
    requireEmailVerification: boolean;
    passwordMinLength: number;
    enableTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    adminPassword: string;
  };
  notifications: {
    emailNotifications: boolean;
    surveyCompletionNotifications: boolean;
    userRegistrationNotifications: boolean;
    systemAlerts: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
  };
  appearance: {
    darkMode: boolean;
    primaryColor: string;
    logoUrl: string;
    customCSS: string;
  };
  data: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionPeriod: number;
    dataEncryption: boolean;
  };
}

export function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    general: {
      siteName: 'Surveyor Admin',
      siteDescription: 'Professional survey management platform',
      contactEmail: 'admin@surveyor.com',
      timezone: 'UTC',
      language: 'English'
    },
    security: {
      requireEmailVerification: true,
      passwordMinLength: 8,
      enableTwoFactor: false,
      sessionTimeout: 30,
      maxLoginAttempts: 3,
      adminPassword: ''
    },
    notifications: {
      emailNotifications: true,
      surveyCompletionNotifications: true,
      userRegistrationNotifications: true,
      systemAlerts: true,
      weeklyReports: false,
      monthlyReports: true
    },
    appearance: {
      darkMode: false,
      primaryColor: '#3B82F6',
      logoUrl: '',
      customCSS: ''
    },
    data: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionPeriod: 30,
      dataEncryption: true
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (section: keyof SettingsState, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Implement save functionality
    console.log('Saving settings:', settings);
    setHasChanges(false);
  };

  const handleReset = () => {
    // Reset to default settings
    setHasChanges(false);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Backup', icon: Database }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your survey platform settings</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={!hasChanges}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Changes Alert */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-700">
              You have unsaved changes. Don't forget to save your settings.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                        : 'text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic configuration for your survey platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={settings.general.siteName}
                      onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings.general.contactEmail}
                      onChange={(e) => handleSettingChange('general', 'contactEmail', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input
                    id="siteDescription"
                    value={settings.general.siteDescription}
                    onChange={(e) => handleSettingChange('general', 'siteDescription', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={settings.general.timezone}
                      onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                      <option value="CST">Central Time</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      value={settings.general.language}
                      onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security and authentication settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireEmailVerification"
                    checked={settings.security.requireEmailVerification}
                    onCheckedChange={(checked) => handleSettingChange('security', 'requireEmailVerification', checked)}
                  />
                  <Label htmlFor="requireEmailVerification">Require email verification for new users</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableTwoFactor"
                    checked={settings.security.enableTwoFactor}
                    onCheckedChange={(checked) => handleSettingChange('security', 'enableTwoFactor', checked)}
                  />
                  <Label htmlFor="enableTwoFactor">Enable two-factor authentication</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxLoginAttempts">Maximum Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="adminPassword">Admin Password</Label>
                  <div className="space-y-2">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-yellow-600" />
                        <p className="text-sm text-yellow-700">
                          <strong>Security Notice:</strong> Admin password is configured via environment variables (ADMIN_PASSWORD). 
                          This cannot be changed through the web interface for security reasons.
                        </p>
                      </div>
                    </div>
                    <Input
                      id="adminPassword"
                      type="password"
                      value="●●●●●●●●●●●●●●●"
                      className="bg-gray-100"
                      disabled
                      placeholder="Configured via environment"
                    />
                    <p className="text-xs text-gray-500">
                      To change the admin password, update the ADMIN_PASSWORD environment variable and restart the application.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure email and system notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emailNotifications"
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'emailNotifications', checked)}
                    />
                    <Label htmlFor="emailNotifications">Enable email notifications</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="surveyCompletionNotifications"
                      checked={settings.notifications.surveyCompletionNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'surveyCompletionNotifications', checked)}
                    />
                    <Label htmlFor="surveyCompletionNotifications">Survey completion notifications</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="userRegistrationNotifications"
                      checked={settings.notifications.userRegistrationNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'userRegistrationNotifications', checked)}
                    />
                    <Label htmlFor="userRegistrationNotifications">User registration notifications</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="systemAlerts"
                      checked={settings.notifications.systemAlerts}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'systemAlerts', checked)}
                    />
                    <Label htmlFor="systemAlerts">System alerts and warnings</Label>
                  </div>

                  <Separator />

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="weeklyReports"
                      checked={settings.notifications.weeklyReports}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'weeklyReports', checked)}
                    />
                    <Label htmlFor="weeklyReports">Weekly activity reports</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="monthlyReports"
                      checked={settings.notifications.monthlyReports}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'monthlyReports', checked)}
                    />
                    <Label htmlFor="monthlyReports">Monthly summary reports</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of your admin interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="darkMode"
                    checked={settings.appearance.darkMode}
                    onCheckedChange={(checked) => handleSettingChange('appearance', 'darkMode', checked)}
                  />
                  <Label htmlFor="darkMode">Enable dark mode</Label>
                </div>

                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.appearance.primaryColor}
                      onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      value={settings.appearance.primaryColor}
                      onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={settings.appearance.logoUrl}
                    onChange={(e) => handleSettingChange('appearance', 'logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <Label htmlFor="customCSS">Custom CSS</Label>
                  <textarea
                    id="customCSS"
                    value={settings.appearance.customCSS}
                    onChange={(e) => handleSettingChange('appearance', 'customCSS', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    placeholder="/* Add your custom CSS here */"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data & Backup Settings */}
          {activeTab === 'data' && (
            <Card>
              <CardHeader>
                <CardTitle>Data & Backup Settings</CardTitle>
                <CardDescription>Configure data management and backup options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoBackup"
                    checked={settings.data.autoBackup}
                    onCheckedChange={(checked) => handleSettingChange('data', 'autoBackup', checked)}
                  />
                  <Label htmlFor="autoBackup">Enable automatic backups</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dataEncryption"
                    checked={settings.data.dataEncryption}
                    onCheckedChange={(checked) => handleSettingChange('data', 'dataEncryption', checked)}
                  />
                  <Label htmlFor="dataEncryption">Enable data encryption</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <select
                      id="backupFrequency"
                      value={settings.data.backupFrequency}
                      onChange={(e) => handleSettingChange('data', 'backupFrequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="retentionPeriod">Retention Period (days)</Label>
                    <Input
                      id="retentionPeriod"
                      type="number"
                      value={settings.data.retentionPeriod}
                      onChange={(e) => handleSettingChange('data', 'retentionPeriod', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Backup Actions</h3>
                  <div className="flex space-x-2">
                    <Button variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      Create Backup Now
                    </Button>
                    <Button variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Restore from Backup
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}