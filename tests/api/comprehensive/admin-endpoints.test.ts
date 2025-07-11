import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createEnhancedApiTestSuite, apiAssertions, TestDataFactory } from '../../utils/enhanced-api-test-utils';
import { ApiTestConfig } from '../../config/api-test-config';
import comprehensiveFixtures from '../../fixtures/comprehensive-api-fixtures.json';

describe('Comprehensive Admin Endpoints Tests', () => {
  let apiTestSuite: any;
  
  beforeEach(async () => {
    const config: Partial<ApiTestConfig> = {
      performance: {
        enabled: true,
        maxResponseTime: 5000, // Admin endpoints can be slower
        loadTestConcurrency: 3,
        loadTestRequests: 15
      },
      security: {
        enabled: true,
        checkHeaders: true,
        checkCors: true,
        checkRateLimit: false
      }
    };

    apiTestSuite = createEnhancedApiTestSuite(config);
    apiTestSuite.beforeEach();
  });

  afterEach(() => {
    apiTestSuite.afterEach();
  });

  describe('GET /api/admin/surveys', () => {
    describe('Happy Path Tests', () => {
      it('should return survey list for admin', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys');
        
        expect(response.status).toBe(200);
        apiAssertions.hasSecurityHeaders(response);
        
        expect(data.surveys).toBeDefined();
        expect(Array.isArray(data.surveys)).toBe(true);
        expect(data.total).toBeDefined();
        expect(data.page).toBeDefined();
        expect(data.limit).toBeDefined();
        expect(data.totalPages).toBeDefined();
      });

      it('should return survey list with pagination', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys?page=1&limit=10');
        
        expect(response.status).toBe(200);
        expect(data.page).toBe(1);
        expect(data.limit).toBe(10);
        expect(data.surveys.length).toBeLessThanOrEqual(10);
      });

      it('should return survey with complete metadata', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys');
        
        expect(response.status).toBe(200);
        
        if (data.surveys.length > 0) {
          const survey = data.surveys[0];
          expect(survey.id).toBeDefined();
          expect(survey.name).toBeDefined();
          expect(survey.description).toBeDefined();
          expect(survey.status).toBeDefined();
          expect(survey.createdAt).toBeDefined();
          expect(survey.updatedAt).toBeDefined();
          expect(survey.responseCount).toBeDefined();
          expect(survey.completionRate).toBeDefined();
          
          expect(['active', 'completed', 'draft']).toContain(survey.status);
          expect(typeof survey.responseCount).toBe('number');
          expect(typeof survey.completionRate).toBe('number');
        }
      });
    });

    describe('Filtering and Sorting Tests', () => {
      it('should filter surveys by status', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys?status=active');
        
        expect(response.status).toBe(200);
        data.surveys.forEach((survey: any) => {
          expect(survey.status).toBe('active');
        });
      });

      it('should sort surveys by creation date', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys?sort=createdAt&order=desc');
        
        expect(response.status).toBe(200);
        
        if (data.surveys.length > 1) {
          const dates = data.surveys.map((s: any) => new Date(s.createdAt).getTime());
          for (let i = 1; i < dates.length; i++) {
            expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
          }
        }
      });

      it('should search surveys by name', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys?search=test');
        
        expect(response.status).toBe(200);
        data.surveys.forEach((survey: any) => {
          expect(survey.name.toLowerCase()).toContain('test');
        });
      });
    });

    describe('Error Handling Tests', () => {
      it('should return 400 for invalid pagination parameters', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys?page=invalid&limit=abc', 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INVALID_PAGINATION_PARAMS');
      });

      it('should return 400 for invalid sort parameters', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys?sort=invalid_field', 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INVALID_SORT_FIELD');
      });

      it('should return 401 for unauthorized access', async () => {
        const { response, data } = await apiTestSuite.makeRequest('/admin/surveys', {
          headers: {} // No authorization header
        }, 401);
        
        expect(response.status).toBe(401);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('UNAUTHORIZED');
      });
    });
  });

  describe('GET /api/admin/surveys/:id', () => {
    describe('Happy Path Tests', () => {
      it('should return detailed survey information', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal');
        
        expect(response.status).toBe(200);
        apiAssertions.hasSecurityHeaders(response);
        
        expect(data.id).toBe('test-minimal');
        expect(data.name).toBeDefined();
        expect(data.description).toBeDefined();
        expect(data.stakeholders).toBeDefined();
        expect(data.questions).toBeDefined();
        expect(data.settings).toBeDefined();
        expect(data.scoring).toBeDefined();
      });

      it('should include survey analytics', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal?includeAnalytics=true');
        
        expect(response.status).toBe(200);
        expect(data.analytics).toBeDefined();
        expect(data.analytics.totalResponses).toBeDefined();
        expect(data.analytics.completionRate).toBeDefined();
        expect(data.analytics.averageTimeToComplete).toBeDefined();
      });

      it('should include response breakdown by stakeholder', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal?includeBreakdown=true');
        
        expect(response.status).toBe(200);
        expect(data.responseBreakdown).toBeDefined();
        expect(data.responseBreakdown.byStakeholder).toBeDefined();
        expect(data.responseBreakdown.byOrganization).toBeDefined();
      });
    });

    describe('Error Handling Tests', () => {
      it('should return 404 for non-existent survey', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/non-existent', 404);
        
        expect(response.status).toBe(404);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('SURVEY_NOT_FOUND');
      });

      it('should return 403 for insufficient permissions', async () => {
        const { response, data } = await apiTestSuite.makeRequest('/admin/surveys/test-minimal', {
          headers: {
            'Authorization': 'Bearer invalid-or-low-privilege-token'
          }
        }, 403);
        
        expect(response.status).toBe(403);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
      });
    });
  });

  describe('GET /api/admin/surveys/:id/responses', () => {
    describe('Happy Path Tests', () => {
      it('should return survey responses', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/responses');
        
        expect(response.status).toBe(200);
        apiAssertions.hasSecurityHeaders(response);
        
        expect(data.responses).toBeDefined();
        expect(Array.isArray(data.responses)).toBe(true);
        expect(data.total).toBeDefined();
        expect(data.organizationCounts).toBeDefined();
        expect(data.stakeholderCounts).toBeDefined();
        expect(data.completionRate).toBeDefined();
      });

      it('should return responses with pagination', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/responses?page=1&limit=5');
        
        expect(response.status).toBe(200);
        expect(data.responses.length).toBeLessThanOrEqual(5);
      });

      it('should filter responses by completion status', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/responses?completed=true');
        
        expect(response.status).toBe(200);
        data.responses.forEach((response: any) => {
          expect(response.isComplete).toBe(true);
        });
      });

      it('should filter responses by stakeholder', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/responses?stakeholder=ceo');
        
        expect(response.status).toBe(200);
        data.responses.forEach((response: any) => {
          expect(response.stakeholderId).toBe('ceo');
        });
      });

      it('should filter responses by organization', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/responses?organization=test-org');
        
        expect(response.status).toBe(200);
        data.responses.forEach((response: any) => {
          expect(response.organizationId).toBe('test-org');
        });
      });
    });

    describe('Data Validation Tests', () => {
      it('should validate response data structure', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/responses');
        
        expect(response.status).toBe(200);
        
        data.responses.forEach((response: any) => {
          expect(response.id).toBeDefined();
          expect(response.surveyId).toBeDefined();
          expect(response.organizationId).toBeDefined();
          expect(response.stakeholderId).toBeDefined();
          expect(response.responses).toBeDefined();
          expect(response.startTime).toBeDefined();
          expect(response.progress).toBeDefined();
          expect(response.isComplete).toBeDefined();
          
          expect(typeof response.progress).toBe('number');
          expect(response.progress).toBeGreaterThanOrEqual(0);
          expect(response.progress).toBeLessThanOrEqual(1);
          expect(typeof response.isComplete).toBe('boolean');
        });
      });

      it('should include response timestamps', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/responses');
        
        expect(response.status).toBe(200);
        
        data.responses.forEach((response: any) => {
          expect(response.startTime).toBeDefined();
          expect(new Date(response.startTime).toString()).not.toBe('Invalid Date');
          
          if (response.completionTime) {
            expect(new Date(response.completionTime).toString()).not.toBe('Invalid Date');
            expect(new Date(response.completionTime).getTime()).toBeGreaterThan(new Date(response.startTime).getTime());
          }
        });
      });
    });

    describe('Export Tests', () => {
      it('should export responses in CSV format', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/responses?format=csv');
        
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/csv');
        expect(response.headers.get('content-disposition')).toContain('attachment');
        expect(typeof data).toBe('string');
        expect(data).toContain('surveyId,organizationId,stakeholderId'); // CSV headers
      });

      it('should export responses in JSON format', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/responses?format=json');
        
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('application/json');
        expect(data.responses).toBeDefined();
      });

      it('should export responses in Excel format', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/responses?format=xlsx');
        
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        expect(response.headers.get('content-disposition')).toContain('attachment');
      });
    });
  });

  describe('GET /api/admin/surveys/:id/responses/partial', () => {
    describe('Happy Path Tests', () => {
      it('should return partial responses', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/responses/partial');
        
        expect(response.status).toBe(200);
        apiAssertions.hasSecurityHeaders(response);
        
        expect(data.partialResponses).toBeDefined();
        expect(Array.isArray(data.partialResponses)).toBe(true);
        
        data.partialResponses.forEach((response: any) => {
          expect(response.isComplete).toBe(false);
          expect(response.progress).toBeLessThan(1);
        });
      });

      it('should include abandonment analysis', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/responses/partial?includeAnalysis=true');
        
        expect(response.status).toBe(200);
        expect(data.abandonmentAnalysis).toBeDefined();
        expect(data.abandonmentAnalysis.commonDropoffPoints).toBeDefined();
        expect(data.abandonmentAnalysis.averageCompletionTime).toBeDefined();
        expect(data.abandonmentAnalysis.dropoffRate).toBeDefined();
      });
    });

    describe('Filtering Tests', () => {
      it('should filter by progress threshold', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/responses/partial?minProgress=0.5');
        
        expect(response.status).toBe(200);
        data.partialResponses.forEach((response: any) => {
          expect(response.progress).toBeGreaterThanOrEqual(0.5);
        });
      });

      it('should filter by time range', async () => {
        const startDate = '2024-01-01';
        const endDate = '2024-12-31';
        
        const { response, data } = await apiTestSuite.get(`/admin/surveys/test-minimal/responses/partial?startDate=${startDate}&endDate=${endDate}`);
        
        expect(response.status).toBe(200);
        data.partialResponses.forEach((response: any) => {
          const responseDate = new Date(response.startTime);
          expect(responseDate.getTime()).toBeGreaterThanOrEqual(new Date(startDate).getTime());
          expect(responseDate.getTime()).toBeLessThanOrEqual(new Date(endDate).getTime());
        });
      });
    });
  });

  describe('GET /api/admin/surveys/:id/results', () => {
    describe('Happy Path Tests', () => {
      it('should return survey results and analytics', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/results');
        
        expect(response.status).toBe(200);
        apiAssertions.hasSecurityHeaders(response);
        
        expect(data.results).toBeDefined();
        expect(Array.isArray(data.results)).toBe(true);
        expect(data.aggregatedMetrics).toBeDefined();
        expect(data.aggregatedMetrics.averageScore).toBeDefined();
        expect(data.aggregatedMetrics.completionRate).toBeDefined();
        expect(data.aggregatedMetrics.participationByStakeholder).toBeDefined();
        expect(data.aggregatedMetrics.domainAverages).toBeDefined();
      });

      it('should return detailed result breakdown', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/results');
        
        expect(response.status).toBe(200);
        
        data.results.forEach((result: any) => {
          expect(result.surveyId).toBeDefined();
          expect(result.organizationId).toBeDefined();
          expect(result.overallScore).toBeDefined();
          expect(result.domainScores).toBeDefined();
          expect(result.stakeholderContributions).toBeDefined();
          expect(result.maturityLevel).toBeDefined();
          expect(result.recommendations).toBeDefined();
          expect(result.completionDate).toBeDefined();
          expect(result.responseCount).toBeDefined();
          
          expect(typeof result.overallScore).toBe('number');
          expect(result.overallScore).toBeGreaterThanOrEqual(0);
          expect(result.overallScore).toBeLessThanOrEqual(5);
          expect(Array.isArray(result.recommendations)).toBe(true);
        });
      });

      it('should include maturity level information', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/results');
        
        expect(response.status).toBe(200);
        
        data.results.forEach((result: any) => {
          expect(result.maturityLevel.id).toBeDefined();
          expect(result.maturityLevel.name).toBeDefined();
          expect(result.maturityLevel.description).toBeDefined();
          expect(result.maturityLevel.minScore).toBeDefined();
          expect(result.maturityLevel.maxScore).toBeDefined();
          expect(result.maturityLevel.color).toBeDefined();
          
          expect(typeof result.maturityLevel.minScore).toBe('number');
          expect(typeof result.maturityLevel.maxScore).toBe('number');
          expect(result.maturityLevel.minScore).toBeLessThan(result.maturityLevel.maxScore);
          expect(result.maturityLevel.color).toMatch(/^#[0-9A-F]{6}$/i);
        });
      });
    });

    describe('Filtering and Aggregation Tests', () => {
      it('should filter results by organization', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/results?organization=test-org');
        
        expect(response.status).toBe(200);
        data.results.forEach((result: any) => {
          expect(result.organizationId).toBe('test-org');
        });
      });

      it('should filter results by date range', async () => {
        const startDate = '2024-01-01';
        const endDate = '2024-12-31';
        
        const { response, data } = await apiTestSuite.get(`/admin/surveys/test-minimal/results?startDate=${startDate}&endDate=${endDate}`);
        
        expect(response.status).toBe(200);
        data.results.forEach((result: any) => {
          const completionDate = new Date(result.completionDate);
          expect(completionDate.getTime()).toBeGreaterThanOrEqual(new Date(startDate).getTime());
          expect(completionDate.getTime()).toBeLessThanOrEqual(new Date(endDate).getTime());
        });
      });

      it('should aggregate results by maturity level', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/results?groupBy=maturityLevel');
        
        expect(response.status).toBe(200);
        expect(data.groupedResults).toBeDefined();
        expect(data.groupedResults.byMaturityLevel).toBeDefined();
        
        Object.keys(data.groupedResults.byMaturityLevel).forEach(levelId => {
          const group = data.groupedResults.byMaturityLevel[levelId];
          expect(group.count).toBeDefined();
          expect(group.percentage).toBeDefined();
          expect(group.avgScore).toBeDefined();
        });
      });
    });

    describe('Performance Tests', () => {
      it('should handle large result sets efficiently', async () => {
        const { metrics } = await apiTestSuite.get('/admin/surveys/test-comprehensive/results');
        
        expect(metrics.responseTime).toBeLessThan(5000); // 5 seconds for complex queries
      });

      it('should support result pagination', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-comprehensive/results?page=1&limit=10');
        
        expect(response.status).toBe(200);
        expect(data.results.length).toBeLessThanOrEqual(10);
        expect(data.pagination).toBeDefined();
        expect(data.pagination.page).toBe(1);
        expect(data.pagination.limit).toBe(10);
        expect(data.pagination.total).toBeDefined();
      });
    });
  });

  describe('Security Tests', () => {
    describe('Authentication Tests', () => {
      it('should require authentication for all admin endpoints', async () => {
        const endpoints = [
          '/admin/surveys',
          '/admin/surveys/test-minimal',
          '/admin/surveys/test-minimal/responses',
          '/admin/surveys/test-minimal/results'
        ];
        
        for (const endpoint of endpoints) {
          const { response, data } = await apiTestSuite.makeRequest(endpoint, {
            headers: {} // No authorization header
          }, 401);
          
          expect(response.status).toBe(401);
          apiAssertions.isValidApiError(data);
          expect(data.code).toBe('UNAUTHORIZED');
        }
      });

      it('should validate admin role permissions', async () => {
        const { response, data } = await apiTestSuite.makeRequest('/admin/surveys', {
          headers: {
            'Authorization': 'Bearer user-token-without-admin-role'
          }
        }, 403);
        
        expect(response.status).toBe(403);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
      });
    });

    describe('Data Protection Tests', () => {
      it('should not expose sensitive data in responses', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/responses');
        
        expect(response.status).toBe(200);
        
        data.responses.forEach((response: any) => {
          // Should not contain sensitive internal data
          expect(response.password).toBeUndefined();
          expect(response.token).toBeUndefined();
          expect(response.privateKey).toBeUndefined();
          expect(response.internalId).toBeUndefined();
        });
      });

      it('should sanitize response data', async () => {
        const { response, data } = await apiTestSuite.get('/admin/surveys/test-minimal/responses');
        
        expect(response.status).toBe(200);
        
        data.responses.forEach((response: any) => {
          Object.values(response.responses).forEach((value: any) => {
            if (typeof value === 'string') {
              expect(value).not.toContain('<script>');
              expect(value).not.toContain('javascript:');
              expect(value).not.toContain('onload=');
            }
          });
        });
      });
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should implement rate limiting for admin endpoints', async () => {
      const requests = Array(20).fill(0).map(() => 
        apiTestSuite.get('/admin/surveys').catch(e => ({ error: e }))
      );
      
      const results = await Promise.all(requests);
      const rateLimitedRequests = results.filter(result => 
        result.response && result.response.status === 429
      );
      
      // Should have some rate limiting in place
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });

    it('should include rate limit headers', async () => {
      const { response } = await apiTestSuite.get('/admin/surveys');
      
      expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });
  });
});