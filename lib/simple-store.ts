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

// Simple localStorage-based state management
export class SimpleSurveyStore {
  private static readonly STORAGE_KEY = 'simple-survey-state';

  static getState(): SimpleSurveyState | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      // Convert startTime back to Date
      if (parsed.startTime) {
        parsed.startTime = new Date(parsed.startTime);
      }
      return parsed;
    } catch (error) {
      console.warn('Error loading survey state:', error);
      return null;
    }
  }

  static setState(state: Partial<SimpleSurveyState>): void {
    if (typeof window === 'undefined') return;
    
    try {
      const currentState = this.getState() || this.getDefaultState();
      const newState = { ...currentState, ...state };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.warn('Error saving survey state:', error);
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
    } catch (error) {
      console.warn('Error clearing survey state:', error);
    }
  }

  // Specific helper methods
  static setSurvey(survey: SurveySchema): void {
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
    reset: SimpleSurveyStore.reset.bind(SimpleSurveyStore)
  };
}