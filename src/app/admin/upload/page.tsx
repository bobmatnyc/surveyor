'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Download, 
  Eye, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  Shield,
  Users,
  BarChart3
} from 'lucide-react';

interface SurveyMetadata {
  surveyId: string;
  distributionCode: string;
  adminCode: string;
  distributionUrl: string;
  adminUrl: string;
  uploadedAt: string;
  title: string;
  description?: string;
  isActive: boolean;
}

interface AuthState {
  authenticated: boolean;
  username: string | null;
  loading: boolean;
}

export default function AdminUploadPage() {
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
    username: null,
    loading: true
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [uploadState, setUploadState] = useState({
    file: null as File | null,
    loading: false,
    error: '',
    success: false,
    result: null as any
  });
  
  const [surveys, setSurveys] = useState<SurveyMetadata[]>([]);
  const [surveysLoading, setSurveysLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Load surveys when authenticated
  useEffect(() => {
    if (authState.authenticated) {
      loadSurveys();
    }
  }, [authState.authenticated]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/admin/auth/login', {
        credentials: 'include'
      });
      const data = await response.json();
      
      setAuthState({
        authenticated: data.authenticated,
        username: data.username,
        loading: false
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        authenticated: false,
        username: null,
        loading: false
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setAuthState({
          authenticated: true,
          username: data.username || username,
          loading: false
        });
        setPassword('');
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Login system error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/login', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      setAuthState({
        authenticated: false,
        username: null,
        loading: false
      });
      setSurveys([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        setUploadState(prev => ({
          ...prev,
          error: 'Please select a JSON file',
          file: null
        }));
        return;
      }
      
      setUploadState(prev => ({
        ...prev,
        file,
        error: '',
        success: false,
        result: null
      }));
    }
  };

  const handleSurveyUpload = async () => {
    if (!uploadState.file) return;

    setUploadState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const fileContent = await uploadState.file.text();
      const surveyData = JSON.parse(fileContent);

      const response = await fetch('/api/admin/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ survey: surveyData }),
      });

      const result = await response.json();

      if (result.success) {
        setUploadState(prev => ({
          ...prev,
          loading: false,
          success: true,
          result: result.data,
          file: null
        }));
        
        // Reload surveys
        await loadSurveys();
        
        // Reset file input
        const fileInput = document.getElementById('survey-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setUploadState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Upload failed'
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }));
    }
  };

  const loadSurveys = async () => {
    setSurveysLoading(true);
    try {
      const response = await fetch('/api/admin/surveys', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setSurveys(data.data.surveys || []);
      }
    } catch (error) {
      console.error('Failed to load surveys:', error);
    } finally {
      setSurveysLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(`${type}_${text}`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (!authState.authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-6 w-6" />
              <span>Admin Login</span>
            </CardTitle>
            <CardDescription>
              Enter your admin credentials to access the survey upload interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Admin username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  required
                />
              </div>
              {loginError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <div className="text-red-800">{loginError}</div>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Survey Upload</h1>
            <p className="text-gray-600">Upload surveys and manage access codes</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, <strong>{authState.username}</strong>
            </span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Upload Survey</span>
                </CardTitle>
                <CardDescription>
                  Upload a JSON survey file to generate distribution and admin codes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="survey-file">Survey JSON File</Label>
                  <Input
                    id="survey-file"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="mt-1"
                  />
                </div>

                {uploadState.file && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        {uploadState.file.name} ({Math.round(uploadState.file.size / 1024)} KB)
                      </span>
                    </div>
                  </div>
                )}

                {uploadState.error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <div className="text-red-800">{uploadState.error}</div>
                  </Alert>
                )}

                {uploadState.success && uploadState.result && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="text-green-800">
                      Survey uploaded successfully! Codes generated below.
                    </div>
                  </Alert>
                )}

                <Button
                  onClick={handleSurveyUpload}
                  disabled={!uploadState.file || uploadState.loading}
                  className="w-full"
                >
                  {uploadState.loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Survey
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Upload Result */}
            {uploadState.result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Generated Codes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Distribution Code (Public)</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                        {uploadState.result.distributionCode}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(uploadState.result.distributionCode, 'dist')}
                      >
                        {copiedCode === `dist_${uploadState.result.distributionCode}` ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Admin Code (Private)</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                        {uploadState.result.adminCode}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(uploadState.result.adminCode, 'admin')}
                      >
                        {copiedCode === `admin_${uploadState.result.adminCode}` ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label>Distribution URL</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          value={uploadState.result.distributionUrl}
                          readOnly
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(uploadState.result.distributionUrl, 'dist_url')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Admin Results URL</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          value={uploadState.result.adminUrl}
                          readOnly
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(uploadState.result.adminUrl, 'admin_url')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Surveys List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Your Surveys</span>
                </CardTitle>
                <CardDescription>
                  Manage your uploaded surveys and access codes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {surveysLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading surveys...</span>
                  </div>
                ) : surveys.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No surveys uploaded yet</p>
                    <p className="text-sm">Upload your first survey to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {surveys.map((survey) => (
                      <div key={survey.surveyId} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{survey.title}</h3>
                            {survey.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {survey.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge variant={survey.isActive ? "default" : "secondary"}>
                                {survey.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(survey.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 mt-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Distribution:</span>
                            <div className="flex items-center space-x-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {survey.distributionCode}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(survey.distributionCode, 'survey_dist')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Admin:</span>
                            <div className="flex items-center space-x-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {survey.adminCode}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(survey.adminCode, 'survey_admin')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(survey.distributionUrl, '_blank')}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Survey
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(survey.adminUrl, '_blank')}
                          >
                            <BarChart3 className="h-3 w-3 mr-1" />
                            View Results
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}