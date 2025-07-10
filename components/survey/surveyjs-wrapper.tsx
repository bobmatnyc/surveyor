'use client';

import { useEffect, useRef, useState } from 'react';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import { SurveySchema, SurveyResponse } from '@/lib/types';
import { SurveyJSConverter } from '@/lib/surveyjs-converter';
import { useSurveyStore } from '@/lib/store';

// Import SurveyJS themes
// import 'survey-core/defaultV2.min.css';

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
      themeName: 'defaultV2',
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
      // Save response to our store
      saveResponse(options.name, options.value);
      
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

    // Configure validation
    model.onValidateQuestion.add((sender, options) => {
      // Custom validation logic can be added here
      // For now, we'll rely on SurveyJS's built-in validation
    });

    // Configure navigation
    model.showNavigationButtons = survey.settings.allowNavigation;
    model.showProgressBar = survey.settings.showProgressBar ? 'top' : 'off';
    model.showQuestionNumbers = 'on';
    model.questionTitleLocation = 'top';
    model.questionErrorLocation = 'bottom';
    model.checkErrorsMode = 'onNextPage';
    model.textUpdateMode = 'onBlur';
    model.clearInvisibleValues = 'onComplete';
    model.focusFirstQuestionAutomatic = true;
    model.goNextPageAutomatic = false;
    model.showBrandInfo = false;

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
  }, [survey, stakeholder, expertise, responses, saveResponse, onComplete, onPartialSave]);

  // Custom CSS for better integration with shadcn/ui
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .sd-root-modern {
        --background: 0 0% 100%;
        --foreground: 222.2 84% 4.9%;
        --card: 0 0% 100%;
        --card-foreground: 222.2 84% 4.9%;
        --popover: 0 0% 100%;
        --popover-foreground: 222.2 84% 4.9%;
        --primary: 221.2 83.2% 53.3%;
        --primary-foreground: 210 40% 98%;
        --secondary: 210 40% 96%;
        --secondary-foreground: 222.2 84% 4.9%;
        --muted: 210 40% 96%;
        --muted-foreground: 215.4 16.3% 46.9%;
        --accent: 210 40% 96%;
        --accent-foreground: 222.2 84% 4.9%;
        --destructive: 0 84.2% 60.2%;
        --destructive-foreground: 210 40% 98%;
        --border: 214.3 31.8% 91.4%;
        --input: 214.3 31.8% 91.4%;
        --ring: 221.2 83.2% 53.3%;
        --radius: 0.5rem;
        font-family: Inter, system-ui, -apple-system, sans-serif;
      }

      .sd-root-modern .sd-page {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }

      .sd-root-modern .sd-page__title {
        font-size: 1.5rem !important;
        font-weight: 600 !important;
        color: hsl(var(--foreground)) !important;
        margin-bottom: 0.5rem !important;
      }

      .sd-root-modern .sd-page__description {
        font-size: 0.875rem !important;
        color: hsl(var(--muted-foreground)) !important;
        margin-bottom: 2rem !important;
      }

      .sd-root-modern .sd-question {
        background: hsl(var(--card)) !important;
        border: 1px solid hsl(var(--border)) !important;
        border-radius: var(--radius) !important;
        padding: 1.5rem !important;
        margin-bottom: 1.5rem !important;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important;
      }

      .sd-root-modern .sd-question__title {
        font-size: 1rem !important;
        font-weight: 500 !important;
        color: hsl(var(--foreground)) !important;
        margin-bottom: 0.5rem !important;
      }

      .sd-root-modern .sd-question__description {
        font-size: 0.875rem !important;
        color: hsl(var(--muted-foreground)) !important;
        margin-bottom: 1rem !important;
      }

      .sd-root-modern .sd-input {
        background: hsl(var(--background)) !important;
        border: 1px solid hsl(var(--border)) !important;
        border-radius: var(--radius) !important;
        padding: 0.5rem 0.75rem !important;
        font-size: 0.875rem !important;
        color: hsl(var(--foreground)) !important;
        transition: border-color 0.2s ease !important;
      }

      .sd-root-modern .sd-input:focus {
        outline: none !important;
        border-color: hsl(var(--ring)) !important;
        box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2) !important;
      }

      .sd-root-modern .sd-navigation {
        background: hsl(var(--card)) !important;
        border: 1px solid hsl(var(--border)) !important;
        border-radius: var(--radius) !important;
        padding: 1rem !important;
        margin-top: 2rem !important;
      }

      .sd-root-modern .sd-btn {
        background: hsl(var(--primary)) !important;
        color: hsl(var(--primary-foreground)) !important;
        border: none !important;
        border-radius: var(--radius) !important;
        padding: 0.5rem 1rem !important;
        font-size: 0.875rem !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        transition: background-color 0.2s ease !important;
      }

      .sd-root-modern .sd-btn:hover {
        background: hsl(var(--primary) / 0.9) !important;
      }

      .sd-root-modern .sd-btn--navigation-prev {
        background: hsl(var(--secondary)) !important;
        color: hsl(var(--secondary-foreground)) !important;
        margin-right: 0.5rem !important;
      }

      .sd-root-modern .sd-btn--navigation-prev:hover {
        background: hsl(var(--secondary) / 0.8) !important;
      }

      .sd-root-modern .sd-progress {
        background: hsl(var(--secondary)) !important;
        border-radius: var(--radius) !important;
        height: 0.5rem !important;
        margin-bottom: 2rem !important;
      }

      .sd-root-modern .sd-progress__bar {
        background: hsl(var(--primary)) !important;
        border-radius: var(--radius) !important;
        transition: width 0.3s ease !important;
      }

      .sd-root-modern .sd-matrix {
        border: 1px solid hsl(var(--border)) !important;
        border-radius: var(--radius) !important;
        overflow: hidden !important;
      }

      .sd-root-modern .sd-matrix__cell {
        background: hsl(var(--background)) !important;
        border: 1px solid hsl(var(--border)) !important;
        padding: 0.75rem !important;
        text-align: center !important;
      }

      .sd-root-modern .sd-matrix__cell--header {
        background: hsl(var(--muted)) !important;
        font-weight: 500 !important;
        color: hsl(var(--foreground)) !important;
      }

      .sd-root-modern .sd-radio {
        accent-color: hsl(var(--primary)) !important;
      }

      .sd-root-modern .sd-checkbox {
        accent-color: hsl(var(--primary)) !important;
      }

      .sd-root-modern .sd-radiogroup {
        gap: 0.5rem !important;
      }

      .sd-root-modern .sd-radiogroup-item {
        background: hsl(var(--card)) !important;
        border: 1px solid hsl(var(--border)) !important;
        border-radius: var(--radius) !important;
        padding: 0.75rem 1rem !important;
        margin: 0.25rem !important;
        transition: all 0.2s ease !important;
        cursor: pointer !important;
        font-size: 0.875rem !important;
      }

      .sd-root-modern .sd-radiogroup-item:hover {
        background: hsl(var(--accent)) !important;
        border-color: hsl(var(--primary)) !important;
      }

      .sd-root-modern .sd-radiogroup-item.sd-item--selected {
        background: hsl(var(--primary)) !important;
        color: hsl(var(--primary-foreground)) !important;
        border-color: hsl(var(--primary)) !important;
      }

      .sd-root-modern .sd-radiogroup-item label {
        cursor: pointer !important;
        font-weight: 500 !important;
        color: inherit !important;
      }

      .sd-root-modern .sd-completedpage {
        background: hsl(var(--card)) !important;
        border: 1px solid hsl(var(--border)) !important;
        border-radius: var(--radius) !important;
        padding: 2rem !important;
        text-align: center !important;
        margin-top: 2rem !important;
      }

      .sd-root-modern .sd-question--error {
        border-color: hsl(var(--destructive)) !important;
      }

      .sd-root-modern .sd-question__erros {
        color: hsl(var(--destructive)) !important;
        font-size: 0.875rem !important;
        margin-top: 0.5rem !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!surveyModel) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey...</p>
          <p className="text-sm text-gray-500 mt-2">
            If this persists, there may be an issue with the SurveyJS integration. 
            Check the browser console for errors.
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
      />
    </div>
  );
}