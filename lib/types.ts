export interface SurveySchema {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  settings: SurveySettings;
  stakeholders: StakeholderDefinition[];
  domains: DomainDefinition[];
  questions: Question[];
  scoring: ScoringConfiguration;
}

export interface SurveySettings {
  allowMultipleResponses: boolean;
  requireAllStakeholders: boolean;
  showProgressBar: boolean;
  allowNavigation: boolean;
  timeLimit?: number; // minutes
  customStyling?: SurveyStyling;
}

export interface SurveyStyling {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  logoUrl?: string;
  fontFamily?: string;
}

export interface StakeholderDefinition {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1 for scoring weight
  color: string; // for UI theming
  requiredExpertise?: string[];
}

export interface DomainDefinition {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1 for scoring weight
  color: string;
  icon?: string;
}

export interface Question {
  id: string;
  text: string;
  description?: string;
  type: QuestionType;
  domain: string;
  targetStakeholders: string[];
  targetExpertise?: string[];
  required: boolean;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  conditional?: ConditionalLogic;
}

export enum QuestionType {
  LIKERT_5 = 'likert_5',
  LIKERT_3 = 'likert_3',
  MULTIPLE_CHOICE = 'multiple_choice',
  SINGLE_SELECT = 'single_select',
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean'
}

export interface QuestionOption {
  value: number | string;
  label: string;
  description?: string;
}

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  required?: boolean;
}

export interface ConditionalLogic {
  dependsOn: string; // question id
  condition: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
  value: any;
}

export interface ScoringConfiguration {
  method: 'weighted_average' | 'custom';
  stakeholderWeights: Record<string, number>;
  domainWeights: Record<string, number>;
  maturityLevels: MaturityLevel[];
  customScoringFunction?: string; // JavaScript function as string
}

export interface MaturityLevel {
  id: string;
  name: string;
  description: string;
  minScore: number;
  maxScore: number;
  color: string;
  recommendations: string[];
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  organizationId: string;
  respondentId: string;
  stakeholder: string;
  expertise: string[];
  responses: Record<string, any>;
  startTime: Date;
  completionTime?: Date;
  progress: number;
  metadata?: Record<string, any>;
}

export interface SurveyResult {
  surveyId: string;
  organizationId: string;
  overallScore: number;
  domainScores: Record<string, number>;
  stakeholderContributions: Record<string, Record<string, number>>;
  maturityLevel: MaturityLevel;
  recommendations: string[];
  completionDate: Date;
  responseCount: number;
  stakeholderBreakdown: Record<string, number>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface OrganizationScore {
  overall: number;
  domains: Record<string, number>;
  maturityLevel: string;
  percentile: number;
  recommendations: string[];
}

// Store types for Zustand
export interface SurveyStore {
  // Survey state
  currentSurvey: SurveySchema | null;
  currentQuestion: number;
  responses: Record<string, any>;
  stakeholder: string | null;
  expertise: string[];
  organizationId: string;
  respondentId: string;
  startTime: Date;
  filteredQuestions: Question[];
  
  // Actions
  setSurvey: (survey: SurveySchema) => void;
  setStakeholder: (stakeholder: string) => void;
  setExpertise: (expertise: string[]) => void;
  saveResponse: (questionId: string, value: any) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  setCurrentQuestion: (index: number) => void;
  reset: () => void;
  canProceed: () => boolean;
  getProgress: () => number;
}

export interface AdminStore {
  // Admin state
  surveys: SurveySchema[];
  selectedSurvey: string | null;
  responses: SurveyResponse[];
  results: SurveyResult[];
  loading: boolean;
  
  // Actions
  loadSurveys: () => Promise<void>;
  loadResponses: (surveyId: string) => Promise<void>;
  loadResults: (surveyId: string) => Promise<void>;
  setSelectedSurvey: (surveyId: string) => void;
  refreshData: () => Promise<void>;
}

// API Response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SurveyListResponse {
  surveys: SurveySchema[];
  total: number;
  page: number;
  limit: number;
}

export interface ResponseListResponse {
  responses: SurveyResponse[];
  total: number;
  organizationCounts: Record<string, number>;
  stakeholderCounts: Record<string, number>;
}

export interface ResultsResponse {
  results: SurveyResult[];
  aggregatedMetrics: {
    averageScore: number;
    completionRate: number;
    participationByStakeholder: Record<string, number>;
    domainAverages: Record<string, number>;
  };
}