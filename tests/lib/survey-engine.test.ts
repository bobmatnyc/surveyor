import { describe, it, expect, beforeEach } from 'vitest';
import { SurveyEngine } from '@/lib/survey-engine';
import { SurveySchema, SurveyResponse, Question } from '@/lib/types';
import { unitTestFixtures } from '@/tests/fixtures/unit-test-fixtures';

describe('SurveyEngine', () => {
  let mockSchema: SurveySchema;
  let engine: SurveyEngine;

  beforeEach(() => {
    mockSchema = {
      id: 'test-survey',
      title: 'Test Survey',
      description: 'A test survey',
      questions: [
        {
          id: 'q1',
          type: 'rating',
          title: 'Leadership Question',
          targetStakeholders: ['ceo', 'manager'],
          targetExpertise: ['leadership'],
          domain: 'leadership',
          weight: 1,
          scoring: {
            method: 'direct',
            scale: { min: 1, max: 5 },
          },
        },
        {
          id: 'q2',
          type: 'rating',
          title: 'Tech Question',
          targetStakeholders: ['cto', 'developer'],
          targetExpertise: ['technology'],
          domain: 'technology',
          weight: 1,
          scoring: {
            method: 'direct',
            scale: { min: 1, max: 5 },
          },
        },
        {
          id: 'q3',
          type: 'rating',
          title: 'General Question',
          targetStakeholders: ['ceo', 'cto', 'manager', 'developer'],
          targetExpertise: [],
          domain: 'general',
          weight: 1,
          scoring: {
            method: 'direct',
            scale: { min: 1, max: 5 },
          },
        },
      ] as Question[],
      domains: [
        { id: 'leadership', name: 'Leadership', weight: 0.4 },
        { id: 'technology', name: 'Technology', weight: 0.4 },
        { id: 'general', name: 'General', weight: 0.2 },
      ],
      stakeholders: [
        { id: 'ceo', name: 'CEO', expertise: ['leadership'] },
        { id: 'cto', name: 'CTO', expertise: ['technology'] },
        { id: 'manager', name: 'Manager', expertise: ['leadership'] },
        { id: 'developer', name: 'Developer', expertise: ['technology'] },
      ],
      scoring: {
        method: 'weighted_average',
        stakeholderWeights: {
          ceo: 0.3,
          cto: 0.3,
          manager: 0.2,
          developer: 0.2,
        },
        domainWeights: {
          leadership: 0.4,
          technology: 0.4,
          general: 0.2,
        },
      },
    };

    engine = new SurveyEngine(mockSchema);
  });

  describe('Constructor', () => {
    it('creates engine with schema', () => {
      expect(engine).toBeInstanceOf(SurveyEngine);
    });

    it('stores schema correctly', () => {
      expect(engine['schema']).toBe(mockSchema);
    });
  });

  describe('getQuestionsForStakeholder', () => {
    it('returns questions for specific stakeholder', () => {
      const questions = engine.getQuestionsForStakeholder('ceo');
      
      expect(questions).toHaveLength(2);
      expect(questions.map(q => q.id)).toEqual(['q1', 'q3']);
    });

    it('returns questions for stakeholder with expertise', () => {
      const questions = engine.getQuestionsForStakeholder('ceo', ['leadership']);
      
      expect(questions).toHaveLength(2);
      expect(questions.map(q => q.id)).toEqual(['q1', 'q3']);
    });

    it('filters out questions requiring unavailable expertise', () => {
      const questions = engine.getQuestionsForStakeholder('ceo', []);
      
      // Should only include q3 (general question) since q1 requires leadership expertise
      expect(questions).toHaveLength(1);
      expect(questions[0].id).toBe('q3');
    });

    it('returns empty array for unknown stakeholder', () => {
      const questions = engine.getQuestionsForStakeholder('unknown');
      
      expect(questions).toHaveLength(0);
    });

    it('handles developer stakeholder', () => {
      const questions = engine.getQuestionsForStakeholder('developer', ['technology']);
      
      expect(questions).toHaveLength(2);
      expect(questions.map(q => q.id)).toEqual(['q2', 'q3']);
    });

    it('handles multiple expertise areas', () => {
      const questions = engine.getQuestionsForStakeholder('ceo', ['leadership', 'technology']);
      
      expect(questions).toHaveLength(2);
      expect(questions.map(q => q.id)).toEqual(['q1', 'q3']);
    });

    it('returns questions with no expertise requirements', () => {
      const questions = engine.getQuestionsForStakeholder('cto', []);
      
      // Should include q3 (no expertise required)
      expect(questions).toHaveLength(1);
      expect(questions[0].id).toBe('q3');
    });
  });

  describe('calculateScore', () => {
    const mockResponses: SurveyResponse[] = [
      {
        id: 'resp1',
        surveyId: 'test-survey',
        stakeholder: 'ceo',
        responses: { q1: 4, q3: 5 },
        completedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'resp2',
        surveyId: 'test-survey',
        stakeholder: 'cto',
        responses: { q2: 3, q3: 4 },
        completedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'resp3',
        surveyId: 'test-survey',
        stakeholder: 'manager',
        responses: { q1: 3, q3: 4 },
        completedAt: '2023-01-01T00:00:00Z',
      },
    ];

    it('calculates weighted average score', () => {
      const result = engine.calculateScore(mockResponses);
      
      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(5);
      expect(result.domainScores).toBeDefined();
      expect(result.stakeholderScores).toBeDefined();
    });

    it('handles empty responses', () => {
      const result = engine.calculateScore([]);
      
      expect(result).toBeDefined();
      expect(result.overallScore).toBe(0);
    });

    it('handles incomplete responses', () => {
      const incompleteResponses: SurveyResponse[] = [
        {
          id: 'resp1',
          surveyId: 'test-survey',
          stakeholder: 'ceo',
          responses: { q1: 4 }, // Missing q3
          completedAt: '2023-01-01T00:00:00Z',
        },
      ];

      const result = engine.calculateScore(incompleteResponses);
      
      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('ignores responses from unknown stakeholders', () => {
      const invalidResponses: SurveyResponse[] = [
        {
          id: 'resp1',
          surveyId: 'test-survey',
          stakeholder: 'unknown',
          responses: { q1: 5, q2: 5, q3: 5 },
          completedAt: '2023-01-01T00:00:00Z',
        },
      ];

      const result = engine.calculateScore(invalidResponses);
      
      expect(result.overallScore).toBe(0);
    });

    it('calculates domain scores correctly', () => {
      const result = engine.calculateScore(mockResponses);
      
      expect(result.domainScores).toBeDefined();
      expect(result.domainScores['leadership']).toBeGreaterThan(0);
      expect(result.domainScores['technology']).toBeGreaterThan(0);
      expect(result.domainScores['general']).toBeGreaterThan(0);
    });

    it('calculates stakeholder scores correctly', () => {
      const result = engine.calculateScore(mockResponses);
      
      expect(result.stakeholderScores).toBeDefined();
      expect(result.stakeholderScores['ceo']).toBeGreaterThan(0);
      expect(result.stakeholderScores['cto']).toBeGreaterThan(0);
      expect(result.stakeholderScores['manager']).toBeGreaterThan(0);
    });

    it('throws error for unsupported scoring method', () => {
      const invalidSchema = {
        ...mockSchema,
        scoring: {
          ...mockSchema.scoring,
          method: 'unsupported' as any,
        },
      };

      const invalidEngine = new SurveyEngine(invalidSchema);
      
      expect(() => invalidEngine.calculateScore(mockResponses)).toThrow(
        'Unsupported scoring method: unsupported'
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles questions without target stakeholders', () => {
      const schemaWithInvalidQuestions = {
        ...mockSchema,
        questions: [
          {
            id: 'invalid-q',
            type: 'rating',
            title: 'Invalid Question',
            targetStakeholders: [],
            targetExpertise: [],
            domain: 'general',
            weight: 1,
            scoring: {
              method: 'direct',
              scale: { min: 1, max: 5 },
            },
          },
        ] as Question[],
      };

      const invalidEngine = new SurveyEngine(schemaWithInvalidQuestions);
      const questions = invalidEngine.getQuestionsForStakeholder('ceo');
      
      expect(questions).toHaveLength(0);
    });

    it('handles null and undefined responses', () => {
      const responsesWithNulls: SurveyResponse[] = [
        {
          id: 'resp1',
          surveyId: 'test-survey',
          stakeholder: 'ceo',
          responses: { q1: null, q3: undefined },
          completedAt: '2023-01-01T00:00:00Z',
        },
      ];

      const result = engine.calculateScore(responsesWithNulls);
      
      expect(result).toBeDefined();
      expect(result.overallScore).toBe(0);
    });

    it('handles zero weights', () => {
      const zeroWeightSchema = {
        ...mockSchema,
        scoring: {
          ...mockSchema.scoring,
          stakeholderWeights: {
            ceo: 0,
            cto: 0,
            manager: 0,
            developer: 0,
          },
        },
      };

      const zeroEngine = new SurveyEngine(zeroWeightSchema);
      const result = zeroEngine.calculateScore(mockResponses);
      
      expect(result.overallScore).toBe(0);
    });

    it('handles missing domain configuration', () => {
      const noDomainSchema = {
        ...mockSchema,
        domains: [],
      };

      const noDomainEngine = new SurveyEngine(noDomainSchema);
      const result = noDomainEngine.calculateScore(mockResponses);
      
      expect(result.domainScores).toEqual({});
    });
  });

  describe('Performance', () => {
    it('handles large number of questions efficiently', () => {
      const largeSchema = {
        ...mockSchema,
        questions: Array.from({ length: 1000 }, (_, i) => ({
          id: `q${i}`,
          type: 'rating',
          title: `Question ${i}`,
          targetStakeholders: ['ceo'],
          targetExpertise: [],
          domain: 'general',
          weight: 1,
          scoring: {
            method: 'direct',
            scale: { min: 1, max: 5 },
          },
        })) as Question[],
      };

      const largeEngine = new SurveyEngine(largeSchema);
      const start = performance.now();
      const questions = largeEngine.getQuestionsForStakeholder('ceo');
      const end = performance.now();
      
      expect(questions).toHaveLength(1000);
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
    });

    it('handles large number of responses efficiently', () => {
      const largeResponses: SurveyResponse[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `resp${i}`,
        surveyId: 'test-survey',
        stakeholder: 'ceo',
        responses: { q1: 4, q3: 5 },
        completedAt: '2023-01-01T00:00:00Z',
      }));

      const start = performance.now();
      const result = engine.calculateScore(largeResponses);
      const end = performance.now();
      
      expect(result).toBeDefined();
      expect(end - start).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('Integration with Test Fixtures', () => {
    it('works with comprehensive survey fixture', () => {
      const fixtureEngine = new SurveyEngine(unitTestFixtures.surveys.comprehensive as any);
      
      const questions = fixtureEngine.getQuestionsForStakeholder('ceo', ['leadership']);
      expect(questions).toBeDefined();
      expect(Array.isArray(questions)).toBe(true);
    });

    it('calculates score with fixture responses', () => {
      const fixtureEngine = new SurveyEngine(unitTestFixtures.surveys.comprehensive as any);
      
      const mockResponses: SurveyResponse[] = [
        {
          id: 'test-resp',
          surveyId: 'comprehensive-survey',
          stakeholder: 'ceo',
          responses: { q1: 4, q2: 3 },
          completedAt: '2023-01-01T00:00:00Z',
        },
      ];

      // Should not throw error
      expect(() => fixtureEngine.calculateScore(mockResponses)).not.toThrow();
    });
  });
});