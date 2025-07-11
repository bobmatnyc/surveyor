'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/admin/dashboard-layout';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Question {
  id: string;
  type: 'text' | 'multiple_choice' | 'scale' | 'yes_no' | 'textarea';
  text: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  stakeholders?: string[];
  domain?: string;
}

interface SurveyData {
  name: string;
  description: string;
  version: string;
  questions: Question[];
  stakeholders: string[];
  domains: string[];
}

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'scale', label: 'Scale (1-5)' },
  { value: 'yes_no', label: 'Yes/No' }
];

const DEFAULT_STAKEHOLDERS = [
  'CEO/Executive',
  'CTO/Technical Lead',
  'IT Manager',
  'Developer',
  'Business Analyst',
  'Project Manager',
  'End User'
];

const DEFAULT_DOMAINS = [
  'Technology',
  'Process',
  'People',
  'Strategy',
  'Security',
  'Compliance'
];

export default function SurveyBuilderPage() {
  const [survey, setSurvey] = useState<SurveyData>({
    name: '',
    description: '',
    version: '1.0',
    questions: [],
    stakeholders: DEFAULT_STAKEHOLDERS,
    domains: DEFAULT_DOMAINS
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type: 'text',
      text: '',
      required: true,
      stakeholders: [],
      domain: ''
    };
    setSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= survey.questions.length) return;

    setSurvey(prev => {
      const questions = [...prev.questions];
      [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];
      return { ...prev, questions };
    });
  };

  const addOption = (questionIndex: number) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { ...q, options: [...(q.options || []), ''] }
          : q
      )
    }));
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              options: q.options?.map((opt, oi) => oi === optionIndex ? value : opt) 
            }
          : q
      )
    }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              options: q.options?.filter((_, oi) => oi !== optionIndex) 
            }
          : q
      )
    }));
  };

  const saveSurvey = async () => {
    if (!survey.name.trim()) {
      setMessage({ type: 'error', text: 'Survey name is required' });
      return;
    }

    if (survey.questions.length === 0) {
      setMessage({ type: 'error', text: 'At least one question is required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const surveySchema = {
        ...survey,
        id: `survey-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        url: ''
      };

      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(surveySchema)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Survey created successfully!' });
        // Reset form after successful save
        setTimeout(() => {
          window.location.href = '/admin';
        }, 2000);
      } else {
        throw new Error('Failed to save survey');
      }
    } catch (error) {
      console.error('Error saving survey:', error);
      setMessage({ type: 'error', text: 'Failed to save survey. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const previewSurvey = () => {
    // Store survey in localStorage for preview
    localStorage.setItem('preview-survey', JSON.stringify(survey));
    window.open('/survey/preview', '_blank');
  };

  return (
    <DashboardLayout title="Survey Builder" subtitle="Create and design new surveys">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Survey Details */}
        <Card>
          <CardHeader>
            <CardTitle>Survey Information</CardTitle>
            <CardDescription>Basic details about your survey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="survey-name">Survey Name *</Label>
                <Input
                  id="survey-name"
                  value={survey.name}
                  onChange={(e) => setSurvey(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter survey name"
                />
              </div>
              <div>
                <Label htmlFor="survey-version">Version</Label>
                <Input
                  id="survey-version"
                  value={survey.version}
                  onChange={(e) => setSurvey(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="1.0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="survey-description">Description</Label>
              <Textarea
                id="survey-description"
                value={survey.description}
                onChange={(e) => setSurvey(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose of this survey"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Questions ({survey.questions.length})
              <Button onClick={addQuestion} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardTitle>
            <CardDescription>Create and manage survey questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {survey.questions.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No questions added yet. Click "Add Question" to get started.
                </AlertDescription>
              </Alert>
            ) : (
              survey.questions.map((question, index) => (
                <Card key={question.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveQuestion(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveQuestion(index, 'down')}
                          disabled={index === survey.questions.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Question Type</Label>
                        <Select
                          value={question.type}
                          onValueChange={(value) => updateQuestion(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {QUESTION_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Domain</Label>
                        <Select
                          value={question.domain || ''}
                          onValueChange={(value) => updateQuestion(index, 'domain', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select domain" />
                          </SelectTrigger>
                          <SelectContent>
                            {survey.domains.map(domain => (
                              <SelectItem key={domain} value={domain}>
                                {domain}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Question Text *</Label>
                      <Textarea
                        value={question.text}
                        onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                        placeholder="Enter your question"
                        rows={2}
                      />
                    </div>

                    {question.type === 'multiple_choice' && (
                      <div>
                        <Label className="flex items-center justify-between">
                          Options
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(index)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Option
                          </Button>
                        </Label>
                        <div className="space-y-2 mt-2">
                          {(question.options || []).map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-2">
                              <Input
                                value={option}
                                onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                placeholder={`Option ${optIndex + 1}`}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(index, optIndex)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {question.type === 'scale' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Min Value</Label>
                          <Input
                            type="number"
                            value={question.min || 1}
                            onChange={(e) => updateQuestion(index, 'min', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Max Value</Label>
                          <Input
                            type="number"
                            value={question.max || 5}
                            onChange={(e) => updateQuestion(index, 'max', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                        />
                        <span className="text-sm">Required</span>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={previewSurvey}
                  variant="outline"
                  disabled={!survey.name || survey.questions.length === 0}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
              <Button
                onClick={saveSurvey}
                disabled={saving || !survey.name || survey.questions.length === 0}
              >
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Survey
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        {message && (
          <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  );
}