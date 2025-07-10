import { SurveySchema, SurveyResponse, SurveyResult, ValidationResult } from './types';
import { OrganizationProfile } from './sample-data-generator';

export class DataValidator {
  private static instance: DataValidator;
  
  static getInstance(): DataValidator {
    if (!DataValidator.instance) {
      DataValidator.instance = new DataValidator();
    }
    return DataValidator.instance;
  }

  validateSurveySchema(schema: SurveySchema): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic schema validation
    if (!schema.id || schema.id.trim() === '') {
      errors.push('Survey schema must have a valid ID');
    }

    if (!schema.name || schema.name.trim() === '') {
      errors.push('Survey schema must have a valid name');
    }

    if (!schema.version || schema.version.trim() === '') {
      errors.push('Survey schema must have a valid version');
    }

    // Validate stakeholders
    if (!schema.stakeholders || schema.stakeholders.length === 0) {
      errors.push('Survey schema must have at least one stakeholder');
    } else {
      const stakeholderIds = new Set<string>();
      let totalWeight = 0;

      for (const stakeholder of schema.stakeholders) {
        if (!stakeholder.id || stakeholder.id.trim() === '') {
          errors.push('All stakeholders must have valid IDs');
        } else if (stakeholderIds.has(stakeholder.id)) {
          errors.push(`Duplicate stakeholder ID: ${stakeholder.id}`);
        } else {
          stakeholderIds.add(stakeholder.id);
        }

        if (!stakeholder.name || stakeholder.name.trim() === '') {
          errors.push(`Stakeholder ${stakeholder.id} must have a valid name`);
        }

        if (stakeholder.weight < 0 || stakeholder.weight > 1) {
          errors.push(`Stakeholder ${stakeholder.id} weight must be between 0 and 1`);
        }

        totalWeight += stakeholder.weight;
      }

      if (Math.abs(totalWeight - 1) > 0.01) {
        warnings.push(`Stakeholder weights sum to ${totalWeight.toFixed(2)}, should sum to 1.0`);
      }
    }

    // Validate domains
    if (!schema.domains || schema.domains.length === 0) {
      errors.push('Survey schema must have at least one domain');
    } else {
      const domainIds = new Set<string>();
      let totalWeight = 0;

      for (const domain of schema.domains) {
        if (!domain.id || domain.id.trim() === '') {
          errors.push('All domains must have valid IDs');
        } else if (domainIds.has(domain.id)) {
          errors.push(`Duplicate domain ID: ${domain.id}`);
        } else {
          domainIds.add(domain.id);
        }

        if (!domain.name || domain.name.trim() === '') {
          errors.push(`Domain ${domain.id} must have a valid name`);
        }

        if (domain.weight < 0 || domain.weight > 1) {
          errors.push(`Domain ${domain.id} weight must be between 0 and 1`);
        }

        totalWeight += domain.weight;
      }

      if (Math.abs(totalWeight - 1) > 0.01) {
        warnings.push(`Domain weights sum to ${totalWeight.toFixed(2)}, should sum to 1.0`);
      }
    }

    // Validate questions
    if (!schema.questions || schema.questions.length === 0) {
      errors.push('Survey schema must have at least one question');
    } else {
      const questionIds = new Set<string>();
      const stakeholderIds = new Set(schema.stakeholders.map(s => s.id));
      const domainIds = new Set(schema.domains.map(d => d.id));

      for (const question of schema.questions) {
        if (!question.id || question.id.trim() === '') {
          errors.push('All questions must have valid IDs');
        } else if (questionIds.has(question.id)) {
          errors.push(`Duplicate question ID: ${question.id}`);
        } else {
          questionIds.add(question.id);
        }

        if (!question.text || question.text.trim() === '') {
          errors.push(`Question ${question.id} must have valid text`);
        }

        if (!question.type) {
          errors.push(`Question ${question.id} must have a valid type`);
        }

        if (!domainIds.has(question.domain)) {
          errors.push(`Question ${question.id} references unknown domain: ${question.domain}`);
        }

        if (!question.targetStakeholders || question.targetStakeholders.length === 0) {
          errors.push(`Question ${question.id} must target at least one stakeholder`);
        } else {
          for (const stakeholder of question.targetStakeholders) {
            if (!stakeholderIds.has(stakeholder)) {
              errors.push(`Question ${question.id} targets unknown stakeholder: ${stakeholder}`);
            }
          }
        }

        // Validate question options for choice questions
        if (['likert_5', 'likert_3', 'multiple_choice', 'single_select'].includes(question.type)) {
          if (!question.options || question.options.length === 0) {
            errors.push(`Question ${question.id} of type ${question.type} must have options`);
          } else {
            const optionValues = new Set();
            for (const option of question.options) {
              if (option.value === undefined || option.value === null) {
                errors.push(`Question ${question.id} has option with undefined value`);
              } else if (optionValues.has(option.value)) {
                errors.push(`Question ${question.id} has duplicate option value: ${option.value}`);
              } else {
                optionValues.add(option.value);
              }

              if (!option.label || option.label.trim() === '') {
                errors.push(`Question ${question.id} has option with empty label`);
              }
            }
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateSurveyResponse(response: SurveyResponse, schema: SurveySchema): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic response validation
    if (!response.id || response.id.trim() === '') {
      errors.push('Survey response must have a valid ID');
    }

    if (!response.surveyId || response.surveyId !== schema.id) {
      errors.push('Survey response must reference the correct survey ID');
    }

    if (!response.organizationId || response.organizationId.trim() === '') {
      errors.push('Survey response must have a valid organization ID');
    }

    if (!response.respondentId || response.respondentId.trim() === '') {
      errors.push('Survey response must have a valid respondent ID');
    }

    // Validate stakeholder
    const stakeholderIds = schema.stakeholders.map(s => s.id);
    if (!stakeholderIds.includes(response.stakeholder)) {
      errors.push(`Invalid stakeholder type: ${response.stakeholder}`);
    }

    // Validate responses
    if (!response.responses || typeof response.responses !== 'object') {
      errors.push('Survey response must have a valid responses object');
    } else {
      const relevantQuestions = schema.questions.filter(q => 
        q.targetStakeholders.includes(response.stakeholder)
      );

      // Check for missing required responses
      for (const question of relevantQuestions) {
        if (question.required && !(question.id in response.responses)) {
          errors.push(`Missing required response for question: ${question.id}`);
        }
      }

      // Validate each response
      for (const [questionId, answer] of Object.entries(response.responses)) {
        const question = schema.questions.find(q => q.id === questionId);
        if (!question) {
          warnings.push(`Response for unknown question: ${questionId}`);
          continue;
        }

        if (!question.targetStakeholders.includes(response.stakeholder)) {
          errors.push(`Response for question ${questionId} not allowed for stakeholder ${response.stakeholder}`);
        }

        // Validate answer based on question type
        const validationResult = this.validateAnswer(answer, question);
        if (!validationResult.isValid) {
          errors.push(...validationResult.errors.map(e => `Question ${questionId}: ${e}`));
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateSurveyResult(result: SurveyResult, schema: SurveySchema): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic result validation
    if (!result.surveyId || result.surveyId !== schema.id) {
      errors.push('Survey result must reference the correct survey ID');
    }

    if (!result.organizationId || result.organizationId.trim() === '') {
      errors.push('Survey result must have a valid organization ID');
    }

    // Validate overall score
    if (result.overallScore < 1 || result.overallScore > 5) {
      errors.push('Overall score must be between 1 and 5');
    }

    // Validate domain scores
    if (!result.domainScores || typeof result.domainScores !== 'object') {
      errors.push('Survey result must have valid domain scores');
    } else {
      const domainIds = schema.domains.map(d => d.id);
      for (const domainId of domainIds) {
        if (!(domainId in result.domainScores)) {
          errors.push(`Missing domain score for: ${domainId}`);
        } else {
          const score = result.domainScores[domainId];
          if (score < 1 || score > 5) {
            errors.push(`Domain score for ${domainId} must be between 1 and 5`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateOrganizationProfile(profile: OrganizationProfile): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!profile.id || profile.id.trim() === '') {
      errors.push('Organization profile must have a valid ID');
    }

    if (!profile.name || profile.name.trim() === '') {
      errors.push('Organization profile must have a valid name');
    }

    if (!['small', 'medium', 'large'].includes(profile.type)) {
      errors.push('Organization type must be small, medium, or large');
    }

    if (!profile.sector || profile.sector.trim() === '') {
      errors.push('Organization profile must have a valid sector');
    }

    if (!['building', 'emerging', 'thriving'].includes(profile.maturityTarget)) {
      errors.push('Organization maturity target must be building, emerging, or thriving');
    }

    if (profile.staffSize < 1) {
      errors.push('Organization staff size must be at least 1');
    }

    if (profile.annualBudget < 0) {
      errors.push('Organization annual budget must be non-negative');
    }

    if (!profile.location || profile.location.trim() === '') {
      errors.push('Organization profile must have a valid location');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateAnswer(answer: any, question: any): ValidationResult {
    const errors: string[] = [];

    switch (question.type) {
      case 'likert_5':
      case 'likert_3':
        if (!Number.isInteger(answer) || answer < 1 || answer > 5) {
          errors.push('Likert scale answer must be integer between 1 and 5');
        }
        break;

      case 'multiple_choice':
        if (!Array.isArray(answer)) {
          errors.push('Multiple choice answer must be an array');
        } else {
          const validValues = question.options.map((opt: any) => opt.value);
          for (const value of answer) {
            if (!validValues.includes(value)) {
              errors.push(`Invalid multiple choice value: ${value}`);
            }
          }
        }
        break;

      case 'single_select':
        const validValues = question.options.map((opt: any) => opt.value);
        if (!validValues.includes(answer)) {
          errors.push(`Invalid single select value: ${answer}`);
        }
        break;

      case 'text':
        if (typeof answer !== 'string') {
          errors.push('Text answer must be a string');
        }
        break;

      case 'number':
        if (typeof answer !== 'number' || isNaN(answer)) {
          errors.push('Number answer must be a valid number');
        }
        break;

      case 'boolean':
        if (typeof answer !== 'boolean') {
          errors.push('Boolean answer must be true or false');
        }
        break;

      default:
        errors.push(`Unknown question type: ${question.type}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }
}