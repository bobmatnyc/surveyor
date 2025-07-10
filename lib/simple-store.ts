// Simple static-first state management without complex dependencies
import { SurveySchema } from './types';

export interface SimpleSurveyState {
  currentSurvey: SurveySchema | null;
  organizationId: string;
  currentQuestion: number;
  responses: Record<string, any>;
  stakeholder: string | null;
  expertise: string[];
  startTime: Date;
}

// Simple localStorage-based state management with enhanced debugging
export class SimpleSurveyStore {
  private static readonly STORAGE_KEY = 'simple-survey-state';
  private static readonly DEBUG_PREFIX = '[SimpleSurveyStore]';

  static getState(): SimpleSurveyState | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        console.log(`${this.DEBUG_PREFIX} No stored state found`);
        return null;
      }
      
      const parsed = JSON.parse(stored);
      // Convert startTime back to Date
      if (parsed.startTime) {
        parsed.startTime = new Date(parsed.startTime);
      }
      
      console.log(`${this.DEBUG_PREFIX} Loaded state:`, {
        ...parsed,
        hasStakeholder: !!parsed.stakeholder,
        hasSurvey: !!parsed.currentSurvey,
        surveyId: parsed.currentSurvey?.id,
        stakeholderCount: parsed.currentSurvey?.stakeholders?.length || 0
      });
      
      return parsed;
    } catch (error) {
      console.warn(`${this.DEBUG_PREFIX} Error loading survey state:`, error);
      // Clear corrupted state
      this.clearCorruptedState();
      return null;
    }
  }

  private static clearCorruptedState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log(`${this.DEBUG_PREFIX} Cleared corrupted state`);
    } catch (error) {
      console.warn(`${this.DEBUG_PREFIX} Error clearing corrupted state:`, error);
    }
  }

  static setState(state: Partial<SimpleSurveyState>): void {
    if (typeof window === 'undefined') return;
    
    try {
      const currentState = this.getState() || this.getDefaultState();
      const newState = { ...currentState, ...state };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newState));
      
      console.log(`${this.DEBUG_PREFIX} State updated:`, {
        updatedFields: Object.keys(state),
        hasStakeholder: !!newState.stakeholder,
        hasSurvey: !!newState.currentSurvey,
        surveyId: newState.currentSurvey?.id,
        stakeholderCount: newState.currentSurvey?.stakeholders?.length || 0
      });
    } catch (error) {
      console.warn(`${this.DEBUG_PREFIX} Error saving survey state:`, error);
    }
  }

  static getDefaultState(): SimpleSurveyState {
    return {
      currentSurvey: null,
      organizationId: '',
      currentQuestion: 0,
      responses: {},
      stakeholder: null,
      expertise: [],
      startTime: new Date()
    };
  }

  static reset(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log(`${this.DEBUG_PREFIX} State reset successfully`);
    } catch (error) {
      console.warn(`${this.DEBUG_PREFIX} Error clearing survey state:`, error);
    }
  }

  // New method to force a fresh state with debugging
  static forceReset(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Clear all survey-related items from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('survey') || key.includes('simple-survey'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log(`${this.DEBUG_PREFIX} Force reset completed. Cleared keys:`, keysToRemove);
    } catch (error) {
      console.warn(`${this.DEBUG_PREFIX} Error during force reset:`, error);
    }
  }

  // Debug method to inspect current localStorage state
  static debugStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const surveyKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('survey')) {
          surveyKeys.push({
            key,
            value: localStorage.getItem(key)
          });
        }
      }
      
      console.log(`${this.DEBUG_PREFIX} Current localStorage survey keys:`, surveyKeys);
    } catch (error) {
      console.warn(`${this.DEBUG_PREFIX} Error debugging storage:`, error);
    }
  }

  // Specific helper methods
  static setSurvey(survey: SurveySchema): void {
    console.log(`${this.DEBUG_PREFIX} Setting survey:`, {
      surveyId: survey.id,
      stakeholderCount: survey.stakeholders.length,
      stakeholders: survey.stakeholders.map(s => ({ id: s.id, name: s.name }))
    });
    this.setState({ currentSurvey: survey });
  }

  static setOrganizationId(organizationId: string): void {
    this.setState({ organizationId });
  }

  static setStakeholder(stakeholder: string): void {
    this.setState({ stakeholder });
  }

  static setExpertise(expertise: string[]): void {
    this.setState({ expertise });
  }

  static saveResponse(questionId: string, value: any): void {
    const currentState = this.getState() || this.getDefaultState();
    const newResponses = { ...currentState.responses, [questionId]: value };
    this.setState({ responses: newResponses });
  }

  static setCurrentQuestion(questionIndex: number): void {
    this.setState({ currentQuestion: questionIndex });
  }

  static nextQuestion(): void {
    const currentState = this.getState();
    if (currentState) {
      this.setState({ currentQuestion: currentState.currentQuestion + 1 });
    }
  }

  static previousQuestion(): void {
    const currentState = this.getState();
    if (currentState && currentState.currentQuestion > 0) {
      this.setState({ currentQuestion: currentState.currentQuestion - 1 });
    }
  }

  // Progress calculation
  static getProgress(totalQuestions: number): number {
    const currentState = this.getState();
    if (!currentState || totalQuestions === 0) return 0;
    return Math.round(((currentState.currentQuestion + 1) / totalQuestions) * 100);
  }

  // Check if current question is answered
  static canProceed(currentQuestionId: string): boolean {
    const currentState = this.getState();
    if (!currentState) return false;
    
    const answer = currentState.responses[currentQuestionId];
    return answer !== undefined && answer !== null && answer !== '';
  }
}

// Simple hook-like function for React components
export function useSimpleSurveyState() {
  // This is a simple getter - components should handle state updates via setState calls
  const getState = () => SimpleSurveyStore.getState() || SimpleSurveyStore.getDefaultState();
  
  return {
    getState,
    setState: SimpleSurveyStore.setState.bind(SimpleSurveyStore),
    setSurvey: SimpleSurveyStore.setSurvey.bind(SimpleSurveyStore),
    setOrganizationId: SimpleSurveyStore.setOrganizationId.bind(SimpleSurveyStore),
    setStakeholder: SimpleSurveyStore.setStakeholder.bind(SimpleSurveyStore),
    setExpertise: SimpleSurveyStore.setExpertise.bind(SimpleSurveyStore),
    saveResponse: SimpleSurveyStore.saveResponse.bind(SimpleSurveyStore),
    setCurrentQuestion: SimpleSurveyStore.setCurrentQuestion.bind(SimpleSurveyStore),
    nextQuestion: SimpleSurveyStore.nextQuestion.bind(SimpleSurveyStore),
    previousQuestion: SimpleSurveyStore.previousQuestion.bind(SimpleSurveyStore),
    getProgress: SimpleSurveyStore.getProgress.bind(SimpleSurveyStore),
    canProceed: SimpleSurveyStore.canProceed.bind(SimpleSurveyStore),
    reset: SimpleSurveyStore.reset.bind(SimpleSurveyStore),
    forceReset: SimpleSurveyStore.forceReset.bind(SimpleSurveyStore),
    debugStorage: SimpleSurveyStore.debugStorage.bind(SimpleSurveyStore)
  };
}