import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SurveySchema, Question, SurveyResponse, SurveyResult, SurveyStore, AdminStore } from './types';
import { SurveyEngine } from './survey-engine';
import { generateId } from './utils';

// Survey Store for user-facing survey interface
export const useSurveyStore = create<SurveyStore>()(
  persist(
    (set, get) => ({
      // State
      currentSurvey: null,
      currentQuestion: 0,
      responses: {},
      stakeholder: null,
      expertise: [],
      organizationId: '',
      respondentId: generateId(),
      startTime: new Date(),
      filteredQuestions: [],

      // Actions
      setSurvey: (survey) => {
        set({ currentSurvey: survey });
        const state = get();
        if (state.stakeholder) {
          const engine = new SurveyEngine(survey);
          const questions = engine.getQuestionsForStakeholder(state.stakeholder, state.expertise);
          set({ filteredQuestions: questions });
        }
      },

      setStakeholder: (stakeholder) => {
        set({ stakeholder });
        const state = get();
        if (state.currentSurvey) {
          const engine = new SurveyEngine(state.currentSurvey);
          const questions = engine.getQuestionsForStakeholder(stakeholder, state.expertise);
          set({ filteredQuestions: questions });
        }
      },

      setExpertise: (expertise) => {
        set({ expertise });
        const state = get();
        if (state.currentSurvey && state.stakeholder) {
          const engine = new SurveyEngine(state.currentSurvey);
          const questions = engine.getQuestionsForStakeholder(state.stakeholder, expertise);
          set({ filteredQuestions: questions });
        }
      },

      saveResponse: (questionId, value) => {
        set((state) => ({
          responses: { ...state.responses, [questionId]: value }
        }));
      },

      nextQuestion: () => {
        const state = get();
        if (state.currentQuestion < state.filteredQuestions.length - 1) {
          set({ currentQuestion: state.currentQuestion + 1 });
        }
      },

      previousQuestion: () => {
        const state = get();
        if (state.currentQuestion > 0) {
          set({ currentQuestion: state.currentQuestion - 1 });
        }
      },

      setCurrentQuestion: (index) => {
        set({ currentQuestion: index });
      },

      reset: () => {
        set({
          currentSurvey: null,
          currentQuestion: 0,
          responses: {},
          stakeholder: null,
          expertise: [],
          organizationId: '',
          respondentId: generateId(),
          startTime: new Date(),
          filteredQuestions: []
        });
      },

      canProceed: () => {
        const state = get();
        const currentQuestionObj = state.filteredQuestions[state.currentQuestion];
        if (!currentQuestionObj) return false;
        
        const answer = state.responses[currentQuestionObj.id];
        return answer !== undefined && answer !== null && answer !== '';
      },

      getProgress: () => {
        const state = get();
        const totalQuestions = state.filteredQuestions.length;
        if (totalQuestions === 0) return 0;
        return Math.round(((state.currentQuestion + 1) / totalQuestions) * 100);
      }
    }),
    {
      name: 'survey-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        responses: state.responses,
        stakeholder: state.stakeholder,
        expertise: state.expertise,
        currentQuestion: state.currentQuestion,
        organizationId: state.organizationId,
        respondentId: state.respondentId,
        startTime: state.startTime
      })
    }
  )
);

// Admin Store for admin dashboard
export const useAdminStore = create<AdminStore>()(
  (set, get) => ({
    // State
    surveys: [],
    selectedSurvey: null,
    responses: [],
    results: [],
    loading: false,

    // Actions
    loadSurveys: async () => {
      set({ loading: true });
      try {
        const response = await fetch('/api/surveys');
        const data = await response.json();
        set({ surveys: data, loading: false });
        
        // Set first survey as selected if none selected
        if (!get().selectedSurvey && data.length > 0) {
          set({ selectedSurvey: data[0].id });
        }
      } catch (error) {
        console.error('Failed to load surveys:', error);
        set({ loading: false });
      }
    },

    loadResponses: async (surveyId) => {
      set({ loading: true });
      try {
        const response = await fetch(`/api/surveys/${surveyId}/responses`);
        const data = await response.json();
        set({ responses: data, loading: false });
      } catch (error) {
        console.error('Failed to load responses:', error);
        set({ responses: [], loading: false });
      }
    },

    loadResults: async (surveyId) => {
      set({ loading: true });
      try {
        const response = await fetch(`/api/surveys/${surveyId}/results`);
        const data = await response.json();
        set({ results: data, loading: false });
      } catch (error) {
        console.error('Failed to load results:', error);
        set({ results: [], loading: false });
      }
    },

    setSelectedSurvey: (surveyId) => {
      set({ selectedSurvey: surveyId });
      // Auto-load data for selected survey
      get().loadResponses(surveyId);
      get().loadResults(surveyId);
    },

    refreshData: async () => {
      const state = get();
      await state.loadSurveys();
      if (state.selectedSurvey) {
        await state.loadResponses(state.selectedSurvey);
        await state.loadResults(state.selectedSurvey);
      }
    }
  })
);

// Theme Store for customization
interface ThemeStore {
  theme: 'light' | 'dark';
  primaryColor: string;
  surveyBranding: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
  };
  
  setTheme: (theme: 'light' | 'dark') => void;
  setPrimaryColor: (color: string) => void;
  setSurveyBranding: (branding: ThemeStore['surveyBranding']) => void;
  reset: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'light',
      primaryColor: '#3b82f6',
      surveyBranding: {},

      setTheme: (theme) => set({ theme }),
      setPrimaryColor: (color) => set({ primaryColor: color }),
      setSurveyBranding: (branding) => set({ surveyBranding: branding }),
      reset: () => set({
        theme: 'light',
        primaryColor: '#3b82f6',
        surveyBranding: {}
      })
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

// Progress Store for tracking survey progress
interface ProgressStore {
  timeSpent: number;
  questionsAnswered: number;
  totalQuestions: number;
  sessionId: string;
  
  updateProgress: (questionsAnswered: number, totalQuestions: number) => void;
  incrementTimeSpent: (seconds: number) => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressStore>()(
  (set) => ({
    timeSpent: 0,
    questionsAnswered: 0,
    totalQuestions: 0,
    sessionId: generateId(),

    updateProgress: (questionsAnswered, totalQuestions) => {
      set({ questionsAnswered, totalQuestions });
    },

    incrementTimeSpent: (seconds) => {
      set((state) => ({ timeSpent: state.timeSpent + seconds }));
    },

    resetProgress: () => {
      set({
        timeSpent: 0,
        questionsAnswered: 0,
        totalQuestions: 0,
        sessionId: generateId()
      });
    }
  })
);

// Validation Store for form validation
interface ValidationStore {
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  isValid: boolean;
  
  setErrors: (questionId: string, errors: string[]) => void;
  setWarnings: (questionId: string, warnings: string[]) => void;
  clearErrors: (questionId: string) => void;
  clearWarnings: (questionId: string) => void;
  clearAll: () => void;
  updateValidation: () => void;
}

export const useValidationStore = create<ValidationStore>()(
  (set, get) => ({
    errors: {},
    warnings: {},
    isValid: true,

    setErrors: (questionId, errors) => {
      set((state) => ({
        errors: { ...state.errors, [questionId]: errors }
      }));
      get().updateValidation();
    },

    setWarnings: (questionId, warnings) => {
      set((state) => ({
        warnings: { ...state.warnings, [questionId]: warnings }
      }));
    },

    clearErrors: (questionId) => {
      set((state) => {
        const newErrors = { ...state.errors };
        delete newErrors[questionId];
        return { errors: newErrors };
      });
      get().updateValidation();
    },

    clearWarnings: (questionId) => {
      set((state) => {
        const newWarnings = { ...state.warnings };
        delete newWarnings[questionId];
        return { warnings: newWarnings };
      });
    },

    clearAll: () => {
      set({ errors: {}, warnings: {}, isValid: true });
    },

    updateValidation: () => {
      const state = get();
      const hasErrors = Object.values(state.errors).some(errors => errors.length > 0);
      set({ isValid: !hasErrors });
    }
  })
);

// Export utility functions for store manipulation
export const surveyStoreUtils = {
  createSurveyResponse: (organizationId: string): SurveyResponse => {
    const state = useSurveyStore.getState();
    return {
      id: generateId(),
      surveyId: state.currentSurvey?.id || '',
      organizationId,
      respondentId: state.respondentId,
      stakeholder: state.stakeholder || '',
      expertise: state.expertise,
      responses: state.responses,
      startTime: state.startTime,
      completionTime: new Date(),
      progress: 100,
      metadata: {
        sessionId: useProgressStore.getState().sessionId,
        timeSpent: useProgressStore.getState().timeSpent
      }
    };
  },

  validateCurrentResponse: (): boolean => {
    const surveyState = useSurveyStore.getState();
    const validationState = useValidationStore.getState();
    
    if (!surveyState.currentSurvey) return false;
    
    const engine = new SurveyEngine(surveyState.currentSurvey);
    const response = surveyStoreUtils.createSurveyResponse('temp');
    const validation = engine.validateResponse(response);
    
    // Update validation store
    validationState.clearAll();
    validation.errors.forEach(error => {
      // Extract question ID from error (would need better error structure)
      const questionId = 'general'; // Simplified for now
      validationState.setErrors(questionId, [error]);
    });
    
    return validation.isValid;
  },

  resetAllStores: () => {
    useSurveyStore.getState().reset();
    useProgressStore.getState().resetProgress();
    useValidationStore.getState().clearAll();
  }
};