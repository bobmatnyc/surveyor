import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  API_ERROR_CODES, 
  validateStakeholderRequest, 
  createApiError 
} from '@/lib/api-types';
import { 
  validateStakeholderSelection, 
  getStakeholderRecommendations 
} from '@/lib/stakeholder-utils';

// Mock the storage manager
vi.mock('@/lib/storage', () => ({
  SurveyDataManager: {
    getInstance: vi.fn(() => ({
      getSchema: vi.fn()
    }))
  }
}));

// Mock the utils
vi.mock('@/lib/utils', () => ({
  isValidId: vi.fn()
}));

describe('Stakeholder API Types and Validation', () => {
  describe('API Error Codes', () => {
    it('should have all required error codes', () => {
      expect(API_ERROR_CODES.INVALID_SURVEY_ID).toBe('INVALID_SURVEY_ID');
      expect(API_ERROR_CODES.STAKEHOLDER_NOT_FOUND).toBe('STAKEHOLDER_NOT_FOUND');
      expect(API_ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    });
  });

  describe('API Validation Functions', () => {
    it('should validate stakeholder request correctly', () => {
      const validRequest = {
        organizationId: 'test-org',
        selectedStakeholderId: 'ceo',
        selectedExpertise: ['strategy']
      };

      const result = validateStakeholderRequest(validRequest);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid request', () => {
      const invalidRequest = {
        selectedExpertise: 'not-an-array' // Should be array
      };

      const result = validateStakeholderRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should create API error correctly', () => {
      const error = createApiError(
        'Test error message',
        API_ERROR_CODES.VALIDATION_ERROR,
        { field: 'testField' }
      );

      expect(error.error).toBe(true);
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'testField' });
    });
  });
});

describe('Stakeholder Utility Functions', () => {
  describe('validateStakeholderSelection', () => {
    it('should validate correct stakeholder selection', () => {
      const stakeholders = [
        { id: 'ceo', name: 'CEO', description: 'Chief Executive Officer', color: '#3B82F6', requiredExpertise: ['strategy'] }
      ];

      const result = validateStakeholderSelection('ceo', ['strategy'], stakeholders);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid selection', () => {
      const stakeholders = [
        { id: 'ceo', name: 'CEO', description: 'Chief Executive Officer', color: '#3B82F6', requiredExpertise: ['strategy'] }
      ];

      const result = validateStakeholderSelection(null, [], stakeholders);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Please select a stakeholder role');
    });
  });

  describe('getStakeholderRecommendations', () => {
    it('should return recommendations based on expertise', () => {
      const stakeholders = [
        { id: 'ceo', name: 'CEO', description: 'Chief Executive Officer', color: '#3B82F6', requiredExpertise: ['strategy'] },
        { id: 'tech-lead', name: 'Tech Lead', description: 'Technical Leadership', color: '#10B981', requiredExpertise: ['infrastructure'] }
      ];

      const recommendations = getStakeholderRecommendations(['strategy'], stakeholders);
      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].stakeholderId).toBe('ceo');
      expect(recommendations[0].confidence).toBeGreaterThan(0);
    });
  });
});