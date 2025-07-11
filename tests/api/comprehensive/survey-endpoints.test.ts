import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createEnhancedApiTestSuite, apiAssertions, TestDataFactory } from '../../utils/enhanced-api-test-utils';
import { ApiTestConfig } from '../../config/api-test-config';
import comprehensiveFixtures from '../../fixtures/comprehensive-api-fixtures.json';

describe('Comprehensive Survey Endpoints Tests', () => {
  let apiTestSuite: any;
  
  beforeEach(async () => {
    const config: Partial<ApiTestConfig> = {
      performance: {
        enabled: true,
        maxResponseTime: 3000,
        loadTestConcurrency: 5,
        loadTestRequests: 25
      },
      security: {
        enabled: true,
        checkHeaders: true,
        checkCors: true,
        checkRateLimit: false // Disable for unit tests
      }
    };

    apiTestSuite = createEnhancedApiTestSuite(config);
    apiTestSuite.beforeEach();
  });

  afterEach(() => {
    apiTestSuite.afterEach();
  });

  describe('GET /api/surveys/:surveyId', () => {
    describe('Happy Path Tests', () => {
      it('should return survey metadata for valid survey ID', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-minimal');
        
        expect(response.status).toBe(200);
        apiAssertions.isValidSurveyMetadata(data);
        apiAssertions.hasSecurityHeaders(response);
        
        expect(data.id).toBe('test-minimal');
        expect(data.name).toBe('Minimal Test Survey');
        expect(data.status).toBe('active');
        expect(data.totalSteps).toBeGreaterThan(0);
        expect(data.estimatedTimeMinutes).toBeGreaterThan(0);
      });

      it('should return comprehensive survey metadata', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-comprehensive');
        
        expect(response.status).toBe(200);
        apiAssertions.isValidSurveyMetadata(data);
        
        expect(data.id).toBe('test-comprehensive');
        expect(data.name).toBe('Comprehensive Test Survey');
        expect(data.totalSteps).toBeGreaterThan(1);
        expect(data.settings).toBeDefined();
        expect(data.settings.allowMultipleResponses).toBeDefined();
        expect(data.settings.showProgressBar).toBeDefined();
      });

      it('should handle survey metadata with custom settings', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-comprehensive');
        
        expect(response.status).toBe(200);
        expect(data.settings.requireAllStakeholders).toBe(false);
        expect(data.settings.timeLimit).toBeDefined();
        expect(data.version).toBeDefined();
        expect(data.createdAt).toBeDefined();
        expect(data.updatedAt).toBeDefined();
      });
    });

    describe('Error Handling Tests', () => {
      it('should return 404 for non-existent survey ID', async () => {
        const { response, data } = await apiTestSuite.get('/survey/non-existent-survey', 404);
        
        expect(response.status).toBe(404);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('SURVEY_NOT_FOUND');
        expect(data.message).toContain('Survey not found');
      });

      it('should return 400 for invalid survey ID format', async () => {
        const { response, data } = await apiTestSuite.get('/survey/', 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INVALID_SURVEY_ID');
      });

      it('should return 403 for inactive survey', async () => {
        // This test would require a mock survey with isActive: false
        // Implementation depends on your mock server setup
        const { response, data } = await apiTestSuite.get('/survey/test-inactive', 403);
        
        expect(response.status).toBe(403);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('SURVEY_INACTIVE');
      });
    });

    describe('Security Tests', () => {
      it('should include all required security headers', async () => {
        const { response } = await apiTestSuite.get('/survey/test-minimal');
        
        apiAssertions.hasSecurityHeaders(response);
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
        expect(response.headers.get('X-Frame-Options')).toBe('DENY');
        expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
        expect(response.headers.get('Cache-Control')).toContain('no-store');
        expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
      });

      it('should handle XSS attempts in survey ID', async () => {
        const maliciousId = '<script>alert("xss")</script>';
        const encodedId = encodeURIComponent(maliciousId);
        
        const { response, data } = await apiTestSuite.get(`/survey/${encodedId}`, 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INVALID_SURVEY_ID');
      });

      it('should handle SQL injection attempts', async () => {
        const maliciousId = "'; DROP TABLE surveys; --";
        const encodedId = encodeURIComponent(maliciousId);
        
        const { response, data } = await apiTestSuite.get(`/survey/${encodedId}`, 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INVALID_SURVEY_ID');
      });
    });

    describe('Performance Tests', () => {
      it('should respond within acceptable time limits', async () => {
        const { metrics } = await apiTestSuite.get('/survey/test-minimal');
        
        expect(metrics.responseTime).toBeLessThan(3000); // 3 seconds max
      });

      it('should handle concurrent requests efficiently', async () => {
        const performanceResults = await apiTestSuite.performanceTest('/survey/test-minimal', {
          concurrency: 5,
          requests: 25,
          maxResponseTime: 3000
        });
        
        expect(performanceResults.errorRate).toBeLessThan(0.05); // Less than 5% error rate
        expect(performanceResults.avgResponseTime).toBeLessThan(3000);
        expect(performanceResults.p95ResponseTime).toBeLessThan(4500); // 95th percentile
      });

      it('should maintain performance under load', async () => {
        const performanceResults = await apiTestSuite.performanceTest('/survey/test-comprehensive', {
          concurrency: 10,
          requests: 50,
          maxResponseTime: 5000
        });
        
        expect(performanceResults.successCount).toBeGreaterThan(45); // At least 90% success
        expect(performanceResults.requestsPerSecond).toBeGreaterThan(5);
      });
    });

    describe('Edge Cases', () => {
      it('should handle very long survey IDs', async () => {
        const longId = 'a'.repeat(100);
        const { response, data } = await apiTestSuite.get(`/survey/${longId}`, 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
      });

      it('should handle unicode characters in survey ID', async () => {
        const unicodeId = 'survey-测试-🎉';
        const encodedId = encodeURIComponent(unicodeId);
        
        const { response, data } = await apiTestSuite.get(`/survey/${encodedId}`, 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
      });

      it('should handle empty survey ID', async () => {
        const { response, data } = await apiTestSuite.get('/survey/', 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INVALID_SURVEY_ID');
      });
    });
  });

  describe('GET /api/surveys/:surveyId/stakeholders', () => {
    describe('Happy Path Tests', () => {
      it('should return stakeholder list for valid survey', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-minimal/stakeholders');
        
        expect(response.status).toBe(200);
        apiAssertions.isValidStakeholderList(data);
        apiAssertions.hasSecurityHeaders(response);
        
        expect(data.stakeholders).toHaveLength(2);
        expect(data.stakeholders[0].id).toBeDefined();
        expect(data.stakeholders[0].name).toBeDefined();
        expect(data.stakeholders[0].expertise).toBeDefined();
      });

      it('should return comprehensive stakeholder list', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-comprehensive/stakeholders');
        
        expect(response.status).toBe(200);
        apiAssertions.isValidStakeholderList(data);
        
        expect(data.stakeholders).toHaveLength(4);
        
        const stakeholderIds = data.stakeholders.map((s: any) => s.id);
        expect(stakeholderIds).toContain('board');
        expect(stakeholderIds).toContain('ceo');
        expect(stakeholderIds).toContain('tech-lead');
        expect(stakeholderIds).toContain('staff');
      });

      it('should include all required stakeholder properties', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-minimal/stakeholders');
        
        expect(response.status).toBe(200);
        
        data.stakeholders.forEach((stakeholder: any) => {
          expect(stakeholder).toHaveProperty('id');
          expect(stakeholder).toHaveProperty('name');
          expect(stakeholder).toHaveProperty('description');
          expect(stakeholder).toHaveProperty('color');
          expect(stakeholder).toHaveProperty('expertise');
          expect(Array.isArray(stakeholder.expertise)).toBe(true);
        });
      });
    });

    describe('Error Handling Tests', () => {
      it('should return 404 for non-existent survey', async () => {
        const { response, data } = await apiTestSuite.get('/survey/invalid-survey/stakeholders', 404);
        
        expect(response.status).toBe(404);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('SURVEY_NOT_FOUND');
      });

      it('should handle surveys with no stakeholders', async () => {
        // This test depends on your mock implementation
        const { response, data } = await apiTestSuite.get('/survey/test-no-stakeholders/stakeholders');
        
        expect(response.status).toBe(200);
        expect(data.stakeholders).toEqual([]);
      });
    });

    describe('Security Tests', () => {
      it('should include CORS headers', async () => {
        const { response } = await apiTestSuite.get('/survey/test-minimal/stakeholders');
        
        expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
        expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
        expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
      });

      it('should validate survey ID format', async () => {
        const maliciousId = '<script>alert("xss")</script>';
        const encodedId = encodeURIComponent(maliciousId);
        
        const { response, data } = await apiTestSuite.get(`/survey/${encodedId}/stakeholders`, 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INVALID_SURVEY_ID');
      });
    });

    describe('Performance Tests', () => {
      it('should handle high-volume stakeholder requests', async () => {
        const performanceResults = await apiTestSuite.performanceTest('/survey/test-comprehensive/stakeholders', {
          concurrency: 8,
          requests: 40,
          maxResponseTime: 2000
        });
        
        expect(performanceResults.errorRate).toBeLessThan(0.05);
        expect(performanceResults.avgResponseTime).toBeLessThan(2000);
      });
    });
  });

  describe('OPTIONS /api/surveys/:surveyId/stakeholders', () => {
    it('should handle OPTIONS requests for CORS preflight', async () => {
      const { response } = await apiTestSuite.makeRequest('/survey/test-minimal/stakeholders', {
        method: 'OPTIONS'
      }, 200);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });
  });

  describe('Integration Tests', () => {
    it('should maintain consistency between survey metadata and stakeholder list', async () => {
      const { data: surveyData } = await apiTestSuite.get('/survey/test-minimal');
      const { data: stakeholderData } = await apiTestSuite.get('/survey/test-minimal/stakeholders');
      
      expect(surveyData.id).toBe('test-minimal');
      expect(stakeholderData.stakeholders).toBeDefined();
      expect(stakeholderData.stakeholders.length).toBeGreaterThan(0);
    });

    it('should handle concurrent requests to different endpoints', async () => {
      const concurrentRequests = [
        apiTestSuite.get('/survey/test-minimal'),
        apiTestSuite.get('/survey/test-minimal/stakeholders'),
        apiTestSuite.get('/survey/test-comprehensive'),
        apiTestSuite.get('/survey/test-comprehensive/stakeholders')
      ];
      
      const results = await Promise.all(concurrentRequests);
      
      results.forEach(({ response }) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Data Validation Tests', () => {
    it('should validate survey metadata structure', async () => {
      const { data } = await apiTestSuite.get('/survey/test-minimal');
      
      // Required fields
      expect(data.id).toBeDefined();
      expect(data.name).toBeDefined();
      expect(data.description).toBeDefined();
      expect(data.totalSteps).toBeDefined();
      expect(data.estimatedTimeMinutes).toBeDefined();
      expect(data.status).toBeDefined();
      
      // Data types
      expect(typeof data.id).toBe('string');
      expect(typeof data.name).toBe('string');
      expect(typeof data.description).toBe('string');
      expect(typeof data.totalSteps).toBe('number');
      expect(typeof data.estimatedTimeMinutes).toBe('number');
      expect(typeof data.status).toBe('string');
      
      // Valid values
      expect(['active', 'completed', 'draft']).toContain(data.status);
      expect(data.totalSteps).toBeGreaterThan(0);
      expect(data.estimatedTimeMinutes).toBeGreaterThan(0);
    });

    it('should validate stakeholder data structure', async () => {
      const { data } = await apiTestSuite.get('/survey/test-minimal/stakeholders');
      
      expect(Array.isArray(data.stakeholders)).toBe(true);
      
      data.stakeholders.forEach((stakeholder: any) => {
        // Required fields
        expect(stakeholder.id).toBeDefined();
        expect(stakeholder.name).toBeDefined();
        expect(stakeholder.description).toBeDefined();
        expect(stakeholder.color).toBeDefined();
        expect(stakeholder.expertise).toBeDefined();
        
        // Data types
        expect(typeof stakeholder.id).toBe('string');
        expect(typeof stakeholder.name).toBe('string');
        expect(typeof stakeholder.description).toBe('string');
        expect(typeof stakeholder.color).toBe('string');
        expect(Array.isArray(stakeholder.expertise)).toBe(true);
        
        // Valid values
        expect(stakeholder.id.length).toBeGreaterThan(0);
        expect(stakeholder.name.length).toBeGreaterThan(0);
        expect(stakeholder.color).toMatch(/^#[0-9A-F]{6}$/i); // Hex color
      });
    });
  });

  describe('Caching Tests', () => {
    it('should include appropriate cache headers', async () => {
      const { response } = await apiTestSuite.get('/survey/test-minimal');
      
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toBeTruthy();
      expect(cacheControl).toContain('no-store');
      expect(cacheControl).toContain('no-cache');
      expect(cacheControl).toContain('must-revalidate');
    });

    it('should handle conditional requests appropriately', async () => {
      const { response: firstResponse } = await apiTestSuite.get('/survey/test-minimal');
      
      // For API endpoints, we typically don't want caching
      // But we should test that the headers are consistent
      expect(firstResponse.headers.get('Cache-Control')).toContain('no-cache');
      expect(firstResponse.headers.get('Pragma')).toBe('no-cache');
      expect(firstResponse.headers.get('Expires')).toBe('0');
    });
  });
});