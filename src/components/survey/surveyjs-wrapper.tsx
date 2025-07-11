'use client';

import { useEffect, useRef, useState } from 'react';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import { SurveySchema, SurveyResponse } from '@/lib/types';
import { SurveyJSConverter } from '@/lib/surveyjs-converter';
import { useSurveyStore } from '@/lib/store';

// Import SurveyJS themes and custom styling
import 'survey-core/survey-core.min.css';
import '@/styles/surveyjs-custom.css';

interface SurveyJSWrapperProps {
  survey: SurveySchema;
  organizationId: string;
  stakeholder: string;
  expertise: string[];
  onComplete?: (responses: Record<string, any>) => void;
  onPartialSave?: (responses: Record<string, any>) => void;
}

export function SurveyJSWrapper({ 
  survey, 
  organizationId, 
  stakeholder, 
  expertise, 
  onComplete,
  onPartialSave 
}: SurveyJSWrapperProps) {
  const [surveyModel, setSurveyModel] = useState<Model | null>(null);
  const { responses, saveResponse } = useSurveyStore();
  const surveyRef = useRef<Survey>(null);

  useEffect(() => {
    try {
      // Convert our schema to SurveyJS format
      const surveyJSSchema = SurveyJSConverter.convertSchema(survey, stakeholder, expertise);
      console.log('SurveyJS Schema:', surveyJSSchema);
      
      // Create SurveyJS model
      const model = new Model(surveyJSSchema);
    
    // Apply custom styling and configuration
    model.applyTheme({
      colorPalette: 'light',
      isPanelless: false,
      themeName: 'default',
      cssVariables: {
        '--sjs-general-backcolor': 'transparent',
        '--sjs-general-backcolor-dark': 'transparent',
        '--sjs-general-backcolor-dim': '#f8fafc',
        '--sjs-general-backcolor-dim-light': '#f1f5f9',
        '--sjs-general-backcolor-dim-dark': '#e2e8f0',
        '--sjs-general-forecolor': '#0f172a',
        '--sjs-general-forecolor-light': '#64748b',
        '--sjs-general-dim-forecolor': '#94a3b8',
        '--sjs-general-dim-forecolor-light': '#cbd5e1',
        '--sjs-primary-backcolor': '#2563eb',
        '--sjs-primary-backcolor-light': '#3b82f6',
        '--sjs-primary-backcolor-dark': '#1d4ed8',
        '--sjs-primary-forecolor': '#ffffff',
        '--sjs-base-unit': '8px',
        '--sjs-corner-radius': '6px',
        '--sjs-secondary-backcolor': '#f1f5f9',
        '--sjs-secondary-backcolor-light': '#f8fafc',
        '--sjs-secondary-backcolor-semi-light': '#e2e8f0',
        '--sjs-secondary-forecolor': '#475569',
        '--sjs-shadow-small': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '--sjs-shadow-medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        '--sjs-shadow-large': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        '--sjs-border-light': '#e2e8f0',
        '--sjs-border-default': '#cbd5e1',
        '--sjs-border-inside': '#e2e8f0',
        '--sjs-special-red': '#dc2626',
        '--sjs-special-red-light': '#fca5a5',
        '--sjs-special-red-forecolor': '#ffffff',
        '--sjs-special-green': '#059669',
        '--sjs-special-green-light': '#6ee7b7',
        '--sjs-special-green-forecolor': '#ffffff',
        '--sjs-special-blue': '#2563eb',
        '--sjs-special-blue-light': '#93c5fd',
        '--sjs-special-blue-forecolor': '#ffffff',
        '--sjs-special-yellow': '#d97706',
        '--sjs-special-yellow-light': '#fde68a',
        '--sjs-special-yellow-forecolor': '#ffffff',
        '--sjs-font-family': 'Inter, system-ui, -apple-system, sans-serif',
        '--sjs-font-size': '14px',
        '--sjs-question-background': '#ffffff',
        '--sjs-editor-background': '#ffffff',
        '--sjs-editorpanel-backcolor': '#ffffff',
        '--sjs-editorpanel-hovercolor': '#f8fafc',
        '--sjs-editorpanel-cornerRadius': '6px'
      }
    });

    // Load existing responses if any
    if (responses && Object.keys(responses).length > 0) {
      model.data = responses;
    }

    // Set up event handlers
    model.onValueChanged.add((sender, options) => {
      // Mark question as visited when it gets a value
      visitedQuestions.add(options.name);
      
      // Save response to our store
      saveResponse(options.name, options.value);
      
      // Clear any validation errors for this question when value changes
      const question = sender.getQuestionByName(options.name);
      if (question && options.value !== undefined && options.value !== null && options.value !== '') {
        question.clearErrors();
      }
      
      // Call partial save callback if provided
      if (onPartialSave) {
        onPartialSave(sender.data);
      }
    });

    model.onComplete.add((sender) => {
      // Handle survey completion
      const responses = sender.data;
      
      // Call completion callback if provided
      if (onComplete) {
        onComplete(responses);
      }
      
      // Save final responses
      Object.entries(responses).forEach(([questionId, value]) => {
        saveResponse(questionId, value);
      });
    });

    // Configure progress tracking
    model.onCurrentPageChanged.add((sender, options) => {
      // Update progress in our store
      const progress = ((options.newCurrentPage.visibleIndex + 1) / sender.visiblePageCount) * 100;
      // We'll integrate this with our existing progress tracking
    });

    // Track visited questions to prevent premature validation errors
    const visitedQuestions = new Set();
    
    // Configure focus tracking to know when questions are visited
    model.onFocusInQuestion.add((sender, options) => {
      visitedQuestions.add(options.question.name);
    });

    // Configure validation
    model.onValidateQuestion.add((sender, options) => {
      const question = options.question;
      const hasValue = question.value !== undefined && question.value !== null && question.value !== '';
      const hasBeenVisited = visitedQuestions.has(question.name);
      
      // If question is required but has no value and hasn't been visited, skip validation
      if (question.isRequired && !hasValue && !hasBeenVisited) {
        // Prevent validation error from showing
        options.error = '';
        return false;
      }
      
      // Let SurveyJS handle built-in validation for visited fields or fields with values
      return true;
    });

    // Configure navigation
    model.showNavigationButtons = survey.settings.allowNavigation;
    model.showProgressBar = survey.settings.showProgressBar ? 'top' : 'off';
    model.showQuestionNumbers = 'on';
    model.questionTitleLocation = 'top';
    model.questionErrorLocation = 'bottom';
    model.checkErrorsMode = 'onComplete'; // Only check errors on completion to prevent premature validation
    model.textUpdateMode = 'onBlur'; // Update values on blur to avoid constant validation
    model.clearInvisibleValues = 'onComplete';
    model.focusFirstQuestionAutomatic = false; // Disable auto-focus to prevent jumping
    model.goNextPageAutomatic = false;
    model.showBrandInfo = false;
    model.validateVisitedEmptyFields = false; // Don't validate empty fields until completion
    
    // Additional stability settings
    model.questionsOnPageMode = 'singlePage'; // Show all questions on one page to prevent jumping
    model.pagePrevText = 'Previous';
    model.pageNextText = 'Next';
    model.firstPageIsStarted = false;

    // Set custom texts
    model.completeText = 'Complete Survey';
    model.startSurveyText = 'Start Survey';
    model.pagePrevText = 'Previous';
    model.pageNextText = 'Next';
    model.requiredText = '*';

    // Configure completed page
    model.completedHtml = `
      <div style="text-align: center; padding: 2rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div style="font-size: 1.5rem; font-weight: 600; color: #059669; margin-bottom: 1rem;">
          ✅ Survey Completed Successfully!
        </div>
        <div style="font-size: 1rem; color: #64748b; margin-bottom: 1rem;">
          Thank you for completing the ${survey.name}.
        </div>
        <div style="font-size: 0.875rem; color: #94a3b8;">
          Your responses have been saved and will be included in the analysis.
        </div>
      </div>
    `;

    setSurveyModel(model);
    } catch (error) {
      console.error('Error creating SurveyJS model:', error);
      setSurveyModel(null);
    }
  }, [survey.id, stakeholder, expertise.join(','), saveResponse, onComplete, onPartialSave]);


  if (!surveyModel) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Survey</h3>
          <p className="text-gray-600 mb-4">Please wait while we prepare your survey...</p>
          <p className="text-sm text-gray-500">
            If this persists, there may be an issue with the SurveyJS integration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="surveyjs-container">
      <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
        🎯 SurveyJS Integration Active | Survey: {survey.name} | Stakeholder: {stakeholder}
      </div>
      <Survey 
        ref={surveyRef}
        model={surveyModel}
        key={`survey-${survey.id}-${stakeholder}`}
      />
    </div>
  );
}