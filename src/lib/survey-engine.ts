import { SurveySchema, Question, SurveyResponse, SurveyResult, QuestionType, ValidationResult, MaturityLevel } from './types';

export class SurveyEngine {
  private schema: SurveySchema;
  
  constructor(schema: SurveySchema) {
    this.schema = schema;
  }

  /**
   * Get questions filtered for a specific stakeholder and expertise
   */
  getQuestionsForStakeholder(
    stakeholderId: string, 
    expertise: string[] = []
  ): Question[] {
    return this.schema.questions.filter(question => {
      // Check if question targets this stakeholder
      const targetsStakeholder = question.targetStakeholders.includes(stakeholderId);
      
      // Check if question requires specific expertise
      const hasRequiredExpertise = !question.targetExpertise || 
        question.targetExpertise.some(exp => expertise.includes(exp));
      
      return targetsStakeholder && hasRequiredExpertise;
    });
  }

  /**
   * Calculate organization score based on all responses
   */
  calculateScore(responses: SurveyResponse[]): SurveyResult {
    const { scoring } = this.schema;
    
    if (scoring.method === 'weighted_average') {
      return this.calculateWeightedScore(responses);
    } else if (scoring.method === 'custom' && scoring.customScoringFunction) {
      return this.executeCustomScoring(responses, scoring.customScoringFunction);
    }
    
    throw new Error(`Unsupported scoring method: ${scoring.method}`);
  }

  /**
   * Calculate weighted average score
   */
  private calculateWeightedScore(responses: SurveyResponse[]): SurveyResult {
    const domainScores: Record<string, number> = {};
    const stakeholderContributions: Record<string, Record<string, number>> = {};
    
    // Initialize domain scores
    this.schema.domains.forEach(domain => {
      domainScores[domain.id] = 0;
      stakeholderContributions[domain.id] = {};
    });

    // Calculate domain scores for each stakeholder
    for (const response of responses) {
      const stakeholderWeight = this.schema.scoring.stakeholderWeights[response.stakeholder] || 0;
      
      if (stakeholderWeight === 0) continue;

      for (const domain of this.schema.domains) {
        const domainQuestions = this.schema.questions.filter(q => 
          q.domain === domain.id && 
          q.targetStakeholders.includes(response.stakeholder)
        );

        if (domainQuestions.length === 0) continue;

        let domainSum = 0;
        let questionCount = 0;

        for (const question of domainQuestions) {
          const answer = response.responses[question.id];
          if (answer !== undefined && answer !== null) {
            domainSum += Number(answer);
            questionCount++;
          }
        }

        if (questionCount > 0) {
          const avgScore = domainSum / questionCount;
          stakeholderContributions[domain.id][response.stakeholder] = avgScore * stakeholderWeight;
        }
      }
    }

    // Aggregate stakeholder contributions to domain scores
    for (const domain of this.schema.domains) {
      const contributions = Object.values(stakeholderContributions[domain.id]);
      const totalWeight = Object.keys(stakeholderContributions[domain.id])
        .reduce((sum, stakeholder) => {
          return sum + (this.schema.scoring.stakeholderWeights[stakeholder] || 0);
        }, 0);

      if (totalWeight > 0) {
        domainScores[domain.id] = contributions.reduce((sum, contrib) => sum + contrib, 0) / totalWeight;
      }
    }

    // Calculate overall score using domain weights
    let overallScore = 0;
    let totalDomainWeight = 0;

    for (const [domainId, score] of Object.entries(domainScores)) {
      const weight = this.schema.scoring.domainWeights[domainId] || 0;
      overallScore += score * weight;
      totalDomainWeight += weight;
    }

    if (totalDomainWeight > 0) {
      overallScore = overallScore / totalDomainWeight;
    }

    // Determine maturity level
    const maturityLevel = this.schema.scoring.maturityLevels.find(level => 
      overallScore >= level.minScore && overallScore <= level.maxScore
    ) || this.schema.scoring.maturityLevels[0];

    // Generate recommendations
    const recommendations = this.generateRecommendations(domainScores, maturityLevel);

    return {
      surveyId: this.schema.id,
      organizationId: responses[0]?.organizationId || '',
      overallScore,
      domainScores,
      stakeholderContributions,
      maturityLevel,
      recommendations,
      completionDate: new Date(),
      responseCount: responses.length,
      stakeholderBreakdown: this.getStakeholderBreakdown(responses)
    };
  }

  /**
   * Execute custom scoring function
   */
  private executeCustomScoring(responses: SurveyResponse[], customFunction: string): SurveyResult {
    try {
      // Create a safe execution context
      const context = {
        responses,
        schema: this.schema,
        Math,
        console: { log: () => {} }, // Disabled console for security
      };

      // Execute custom scoring function
      const func = new Function('context', `
        const { responses, schema, Math } = context;
        ${customFunction}
      `);

      return func(context);
    } catch (error) {
      console.error('Custom scoring function failed:', error);
      throw new Error('Custom scoring function execution failed');
    }
  }

  /**
   * Generate recommendations based on domain scores
   */
  private generateRecommendations(domainScores: Record<string, number>, maturityLevel: MaturityLevel): string[] {
    const recommendations: string[] = [...maturityLevel.recommendations];
    
    // Add domain-specific recommendations for low-scoring domains
    for (const [domainId, score] of Object.entries(domainScores)) {
      if (score < 2.5) {
        const domain = this.schema.domains.find(d => d.id === domainId);
        if (domain) {
          recommendations.push(`Focus on improving ${domain.name} capabilities`);
        }
      }
    }

    return recommendations;
  }

  /**
   * Get stakeholder breakdown from responses
   */
  private getStakeholderBreakdown(responses: SurveyResponse[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const response of responses) {
      breakdown[response.stakeholder] = (breakdown[response.stakeholder] || 0) + 1;
    }

    return breakdown;
  }

  /**
   * Validate a single response
   */
  validateResponse(response: SurveyResponse): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check required questions
    const requiredQuestions = this.getQuestionsForStakeholder(response.stakeholder, response.expertise)
      .filter(q => q.required);
    
    for (const question of requiredQuestions) {
      if (response.responses[question.id] === undefined) {
        errors.push(`Question "${question.text}" is required but not answered`);
      }
    }
    
    // Validate question responses
    for (const [questionId, answer] of Object.entries(response.responses)) {
      const question = this.schema.questions.find(q => q.id === questionId);
      if (!question) continue;
      
      const validation = this.validateQuestionResponse(question, answer);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a single question response
   */
  private validateQuestionResponse(question: Question, answer: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    switch (question.type) {
      case QuestionType.LIKERT_5:
        if (typeof answer !== 'number' || answer < 1 || answer > 5) {
          errors.push(`Answer must be between 1 and 5 for question: ${question.text}`);
        }
        break;
      case QuestionType.LIKERT_3:
        if (typeof answer !== 'number' || answer < 1 || answer > 3) {
          errors.push(`Answer must be between 1 and 3 for question: ${question.text}`);
        }
        break;
      case QuestionType.MULTIPLE_CHOICE:
        if (!Array.isArray(answer) || answer.length === 0) {
          errors.push(`At least one option must be selected for question: ${question.text}`);
        }
        break;
      case QuestionType.SINGLE_SELECT:
        if (answer === undefined || answer === null) {
          errors.push(`An option must be selected for question: ${question.text}`);
        }
        break;
      case QuestionType.TEXT:
        if (typeof answer !== 'string') {
          errors.push(`Text answer required for question: ${question.text}`);
        } else {
          if (question.validation?.minLength && answer.length < question.validation.minLength) {
            errors.push(`Answer too short for question: ${question.text}`);
          }
          if (question.validation?.maxLength && answer.length > question.validation.maxLength) {
            errors.push(`Answer too long for question: ${question.text}`);
          }
          if (question.validation?.pattern && !new RegExp(question.validation.pattern).test(answer)) {
            errors.push(`Answer format invalid for question: ${question.text}`);
          }
        }
        break;
      case QuestionType.NUMBER:
        if (typeof answer !== 'number' || isNaN(answer)) {
          errors.push(`Valid number required for question: ${question.text}`);
        }
        break;
      case QuestionType.BOOLEAN:
        if (typeof answer !== 'boolean') {
          errors.push(`Yes/No answer required for question: ${question.text}`);
        }
        break;
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Check if question should be shown based on conditional logic
   */
  shouldShowQuestion(question: Question, responses: Record<string, any>): boolean {
    if (!question.conditional) return true;
    
    const dependentAnswer = responses[question.conditional.dependsOn];
    if (dependentAnswer === undefined) return false;
    
    switch (question.conditional.condition) {
      case 'equals':
        return dependentAnswer === question.conditional.value;
      case 'not_equals':
        return dependentAnswer !== question.conditional.value;
      case 'greater_than':
        return Number(dependentAnswer) > Number(question.conditional.value);
      case 'less_than':
        return Number(dependentAnswer) < Number(question.conditional.value);
      default:
        return true;
    }
  }

  /**
   * Get survey statistics
   */
  getSurveyStats(): {
    totalQuestions: number;
    questionsByDomain: Record<string, number>;
    questionsByStakeholder: Record<string, number>;
    questionsByType: Record<string, number>;
  } {
    const stats = {
      totalQuestions: this.schema.questions.length,
      questionsByDomain: {} as Record<string, number>,
      questionsByStakeholder: {} as Record<string, number>,
      questionsByType: {} as Record<string, number>
    };

    for (const question of this.schema.questions) {
      // Count by domain
      stats.questionsByDomain[question.domain] = (stats.questionsByDomain[question.domain] || 0) + 1;
      
      // Count by stakeholder
      for (const stakeholder of question.targetStakeholders) {
        stats.questionsByStakeholder[stakeholder] = (stats.questionsByStakeholder[stakeholder] || 0) + 1;
      }
      
      // Count by type
      stats.questionsByType[question.type] = (stats.questionsByType[question.type] || 0) + 1;
    }

    return stats;
  }

  /**
   * Generate survey preview
   */
  generatePreview(): {
    stakeholderPreviews: Array<{
      stakeholder: string;
      questionCount: number;
      estimatedTime: number;
      domains: string[];
    }>;
  } {
    const previews = this.schema.stakeholders.map(stakeholder => {
      const questions = this.getQuestionsForStakeholder(stakeholder.id);
      const domains = [...new Set(questions.map(q => q.domain))];
      
      return {
        stakeholder: stakeholder.name,
        questionCount: questions.length,
        estimatedTime: Math.ceil(questions.length * 1.5), // 1.5 minutes per question
        domains: domains.map(domainId => {
          const domain = this.schema.domains.find(d => d.id === domainId);
          return domain?.name || domainId;
        })
      };
    });

    return { stakeholderPreviews: previews };
  }
}