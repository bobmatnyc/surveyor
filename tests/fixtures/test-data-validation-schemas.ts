// Test Data Validation Schemas
import { z } from 'zod';

// Base validation schemas
export const StakeholderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  weight: z.number().min(0).max(1).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  expertise: z.array(z.string()).optional(),
  requiredExpertise: z.array(z.string()).optional()
});

export const DomainSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  weight: z.number().min(0).max(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().optional()
});

export const ValidationRulesSchema = z.object({
  minLength: z.number().min(0).optional(),
  maxLength: z.number().min(0).optional(),
  pattern: z.string().optional(),
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional()
});

export const ConditionalLogicSchema = z.object({
  dependsOn: z.string().min(1),
  condition: z.enum(['equals', 'not_equals', 'greater_than', 'less_than']),
  value: z.any()
});

export const QuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['text', 'multipleChoice', 'likert', 'boolean', 'number']),
  domain: z.string().optional(),
  required: z.boolean(),
  targetStakeholders: z.array(z.string().min(1)),
  options: z.array(z.string()).optional(),
  scale: z.object({
    min: z.number(),
    max: z.number(),
    labels: z.array(z.string()).optional()
  }).optional(),
  validation: ValidationRulesSchema.optional(),
  conditional: ConditionalLogicSchema.optional(),
  step: z.number().optional()
});

export const SurveySettingsSchema = z.object({
  allowMultipleResponses: z.boolean(),
  requireAllStakeholders: z.boolean(),
  showProgressBar: z.boolean(),
  allowNavigation: z.boolean(),
  timeLimit: z.number().optional(),
  customStyling: z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    logoUrl: z.string().optional(),
    fontFamily: z.string().optional()
  }).optional()
});

export const SurveySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  isActive: z.boolean(),
  estimatedTimeMinutes: z.number().min(1),
  category: z.string().min(1),
  complexity: z.enum(['simple', 'medium', 'complex']),
  settings: SurveySettingsSchema,
  stakeholders: z.array(StakeholderSchema).min(1),
  domains: z.array(DomainSchema).optional(),
  questions: z.array(QuestionSchema).min(1)
});

export const TestScenarioSchema = z.object({
  description: z.string().min(1),
  surveyId: z.string().min(1),
  stakeholderId: z.string().min(1),
  organizationId: z.string().min(1),
  responses: z.record(z.string(), z.any()).optional(),
  stepId: z.string().optional()
});

export const TestSurveyPackageSchema = z.object({
  metadata: z.object({
    version: z.string().min(1),
    created: z.string().datetime(),
    description: z.string().min(1),
    author: z.string().min(1),
    compatibleWith: z.object({
      surveyorVersion: z.string().min(1),
      apiVersion: z.string().min(1)
    }).optional(),
    categories: z.array(z.string()).optional()
  }),
  testSurveys: z.record(z.string(), SurveySchema)
});

// Error scenario validation schemas
export const ErrorResponseSchema = z.object({
  code: z.string().min(1),
  status: z.number().min(100).max(599),
  message: z.string().min(1),
  details: z.record(z.string(), z.any()).optional()
});

export const ErrorScenarioSchema = z.object({
  description: z.string().min(1),
  scenario: z.string().min(1),
  testData: z.any(),
  requestHeaders: z.record(z.string(), z.string()).optional(),
  simulatedError: z.string().optional(),
  expectedError: ErrorResponseSchema
});

export const ErrorTestPackageSchema = z.object({
  metadata: z.object({
    version: z.string().min(1),
    created: z.string().datetime(),
    description: z.string().min(1),
    author: z.string().min(1),
    errorCategories: z.array(z.string())
  }),
  errorScenarios: z.record(z.string(), z.record(z.string(), ErrorScenarioSchema))
});

// Performance test validation schemas
export const PerformanceMetricsSchema = z.object({
  avgResponseTime: z.string().optional(),
  maxResponseTime: z.string().optional(),
  errorRate: z.string().optional(),
  throughput: z.string().optional()
});

export const PerformanceScenarioSchema = z.object({
  description: z.string().min(1),
  concurrentUsers: z.number().min(1),
  duration: z.string().min(1),
  rampUpTime: z.string().min(1),
  surveyId: z.string().min(1),
  expectedMetrics: PerformanceMetricsSchema.optional()
});

export const PerformanceTestPackageSchema = z.object({
  metadata: z.object({
    version: z.string().min(1),
    created: z.string().datetime(),
    description: z.string().min(1),
    author: z.string().min(1),
    performanceCategories: z.array(z.string())
  }),
  performanceTestSurveys: z.record(z.string(), SurveySchema),
  performanceTestData: z.object({
    loadTestScenarios: z.record(z.string(), PerformanceScenarioSchema).optional(),
    stressTestScenarios: z.record(z.string(), PerformanceScenarioSchema).optional(),
    volumeTestScenarios: z.record(z.string(), z.any()).optional(),
    memoryTestScenarios: z.record(z.string(), z.any()).optional()
  })
});

// Edge case validation schemas
export const EdgeCaseTestPackageSchema = z.object({
  metadata: z.object({
    version: z.string().min(1),
    created: z.string().datetime(),
    description: z.string().min(1),
    author: z.string().min(1),
    testCategories: z.array(z.string())
  }),
  testSurveys: z.record(z.string(), SurveySchema),
  testScenarios: z.record(z.string(), z.record(z.string(), TestScenarioSchema))
});

// Validation utility functions
export class TestDataValidator {
  static validateSurvey(survey: any): z.SafeParseResult<any> {
    return SurveySchema.safeParse(survey);
  }

  static validateTestSurveyPackage(package: any): z.SafeParseResult<any> {
    return TestSurveyPackageSchema.safeParse(package);
  }

  static validateErrorTestPackage(package: any): z.SafeParseResult<any> {
    return ErrorTestPackageSchema.safeParse(package);
  }

  static validatePerformanceTestPackage(package: any): z.SafeParseResult<any> {
    return PerformanceTestPackageSchema.safeParse(package);
  }

  static validateEdgeCaseTestPackage(package: any): z.SafeParseResult<any> {
    return EdgeCaseTestPackageSchema.safeParse(package);
  }

  static validateTestScenario(scenario: any): z.SafeParseResult<any> {
    return TestScenarioSchema.safeParse(scenario);
  }

  static validateErrorScenario(scenario: any): z.SafeParseResult<any> {
    return ErrorScenarioSchema.safeParse(scenario);
  }

  static validatePerformanceScenario(scenario: any): z.SafeParseResult<any> {
    return PerformanceScenarioSchema.safeParse(scenario);
  }

  static validateStakeholder(stakeholder: any): z.SafeParseResult<any> {
    return StakeholderSchema.safeParse(stakeholder);
  }

  static validateQuestion(question: any): z.SafeParseResult<any> {
    return QuestionSchema.safeParse(question);
  }

  static validateSurveySettings(settings: any): z.SafeParseResult<any> {
    return SurveySettingsSchema.safeParse(settings);
  }

  // Custom validation rules
  static validateQuestionTargetStakeholders(
    question: any,
    availableStakeholders: string[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!question.targetStakeholders || !Array.isArray(question.targetStakeholders)) {
      errors.push('Question must have targetStakeholders array');
      return { isValid: false, errors };
    }

    const invalidStakeholders = question.targetStakeholders.filter(
      (stakeholderId: string) => !availableStakeholders.includes(stakeholderId)
    );

    if (invalidStakeholders.length > 0) {
      errors.push(`Invalid stakeholder IDs: ${invalidStakeholders.join(', ')}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateConditionalLogic(
    question: any,
    allQuestions: any[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!question.conditional) {
      return { isValid: true, errors };
    }

    const { dependsOn, condition, value } = question.conditional;

    // Check if the referenced question exists
    const dependentQuestion = allQuestions.find(q => q.id === dependsOn);
    if (!dependentQuestion) {
      errors.push(`Conditional logic references non-existent question: ${dependsOn}`);
      return { isValid: false, errors };
    }

    // Check if the condition is valid for the question type
    const validConditions = {
      'text': ['equals', 'not_equals'],
      'multipleChoice': ['equals', 'not_equals'],
      'likert': ['equals', 'not_equals', 'greater_than', 'less_than'],
      'boolean': ['equals', 'not_equals'],
      'number': ['equals', 'not_equals', 'greater_than', 'less_than']
    };

    const questionType = dependentQuestion.type;
    if (!validConditions[questionType]?.includes(condition)) {
      errors.push(`Invalid condition '${condition}' for question type '${questionType}'`);
    }

    // Validate the value based on question type
    if (questionType === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Conditional value must be boolean for boolean questions`);
    } else if (questionType === 'number' && typeof value !== 'number') {
      errors.push(`Conditional value must be number for number questions`);
    } else if (questionType === 'multipleChoice' && dependentQuestion.options) {
      if (!dependentQuestion.options.includes(value)) {
        errors.push(`Conditional value must be one of the question options`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateSurveyIntegrity(survey: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate that all stakeholder IDs are unique
    const stakeholderIds = survey.stakeholders.map((s: any) => s.id);
    const uniqueStakeholderIds = [...new Set(stakeholderIds)];
    if (stakeholderIds.length !== uniqueStakeholderIds.length) {
      errors.push('Stakeholder IDs must be unique');
    }

    // Validate that all question IDs are unique
    const questionIds = survey.questions.map((q: any) => q.id);
    const uniqueQuestionIds = [...new Set(questionIds)];
    if (questionIds.length !== uniqueQuestionIds.length) {
      errors.push('Question IDs must be unique');
    }

    // Validate that all questions reference valid stakeholders
    for (const question of survey.questions) {
      const validation = this.validateQuestionTargetStakeholders(question, stakeholderIds);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }

    // Validate conditional logic
    for (const question of survey.questions) {
      const validation = this.validateConditionalLogic(question, survey.questions);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }

    // Validate domain references
    if (survey.domains) {
      const domainIds = survey.domains.map((d: any) => d.id);
      const questionsWithDomains = survey.questions.filter((q: any) => q.domain);
      
      for (const question of questionsWithDomains) {
        if (!domainIds.includes(question.domain)) {
          errors.push(`Question '${question.id}' references invalid domain '${question.domain}'`);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // Batch validation methods
  static validateAllTestPackages(packages: {
    comprehensive?: any;
    edgeCases?: any;
    errorScenarios?: any;
    performance?: any;
  }): { isValid: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {};

    if (packages.comprehensive) {
      const result = this.validateTestSurveyPackage(packages.comprehensive);
      if (!result.success) {
        errors.comprehensive = result.error.errors.map(e => e.message);
      }
    }

    if (packages.edgeCases) {
      const result = this.validateEdgeCaseTestPackage(packages.edgeCases);
      if (!result.success) {
        errors.edgeCases = result.error.errors.map(e => e.message);
      }
    }

    if (packages.errorScenarios) {
      const result = this.validateErrorTestPackage(packages.errorScenarios);
      if (!result.success) {
        errors.errorScenarios = result.error.errors.map(e => e.message);
      }
    }

    if (packages.performance) {
      const result = this.validatePerformanceTestPackage(packages.performance);
      if (!result.success) {
        errors.performance = result.error.errors.map(e => e.message);
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }
}

// Export validation utilities
export const validateTestData = TestDataValidator;
export default TestDataValidator;