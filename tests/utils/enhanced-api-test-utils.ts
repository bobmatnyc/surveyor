import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { ApiResponse, ApiErrorResponse } from '@/lib/api-types';
import { ApiTestConfig, DEFAULT_API_TEST_CONFIG, HTTP_STATUS_CODES, REQUIRED_SECURITY_HEADERS } from '../config/api-test-config';

// Enhanced API Test Suite with comprehensive features
export class EnhancedApiTestSuite {
  private config: ApiTestConfig;
  private server: any;
  private testMetrics: TestMetrics;
  private mockHandlers: Array<any> = [];

  constructor(config: Partial<ApiTestConfig> = {}) {
    this.config = { ...DEFAULT_API_TEST_CONFIG, ...config };
    this.testMetrics = new TestMetrics();
    this.server = setupServer(...this.mockHandlers);
  }

  // Setup and teardown methods
  beforeEach() {
    this.server.listen({ onUnhandledRequest: 'error' });
    this.testMetrics.reset();
  }

  afterEach() {
    this.server.resetHandlers();
    this.testMetrics.logSummary();
  }

  afterAll() {
    this.server.close();
  }

  // Mock server management
  addMockHandler(handler: any) {
    this.mockHandlers.push(handler);
    this.server.use(handler);
  }

  // Core API testing methods
  async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    expectedStatus: number = 200
  ): Promise<{
    response: Response;
    data: any;
    metrics: RequestMetrics;
  }> {
    const startTime = performance.now();
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.config.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, requestOptions);
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Parse response data
      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Record metrics
      const metrics: RequestMetrics = {
        url,
        method: options.method || 'GET',
        statusCode: response.status,
        responseTime,
        timestamp: new Date().toISOString(),
        contentLength: response.headers.get('content-length') || '0',
        contentType: contentType || 'unknown'
      };

      this.testMetrics.recordRequest(metrics);

      // Validate expected status
      if (expectedStatus && response.status !== expectedStatus) {
        throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
      }

      return { response, data, metrics };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Record error metrics
      const errorMetrics: RequestMetrics = {
        url,
        method: options.method || 'GET',
        statusCode: 0,
        responseTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        contentLength: '0',
        contentType: 'error'
      };

      this.testMetrics.recordRequest(errorMetrics);
      throw error;
    }
  }

  // HTTP method helpers
  async get(endpoint: string, expectedStatus: number = 200) {
    return this.makeRequest(endpoint, { method: 'GET' }, expectedStatus);
  }

  async post(endpoint: string, data: any, expectedStatus: number = 200) {
    return this.makeRequest(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      expectedStatus
    );
  }

  async put(endpoint: string, data: any, expectedStatus: number = 200) {
    return this.makeRequest(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      expectedStatus
    );
  }

  async delete(endpoint: string, expectedStatus: number = 200) {
    return this.makeRequest(endpoint, { method: 'DELETE' }, expectedStatus);
  }

  // Response validation methods
  validateSuccessResponse<T>(response: ApiResponse<T>): T {
    expect(response).toBeDefined();
    expect('error' in (response as object) && (response as any).error).toBe(false);
    return response as T;
  }

  validateErrorResponse(response: ApiResponse<any>): ApiErrorResponse {
    expect(response).toBeDefined();
    expect('error' in (response as object) && (response as any).error).toBe(true);
    const errorResponse = response as ApiErrorResponse;
    expect(errorResponse.message).toBeDefined();
    expect(errorResponse.code).toBeDefined();
    return errorResponse;
  }

  // Security testing methods
  validateSecurityHeaders(response: Response) {
    if (!this.config.security.checkHeaders) return;

    REQUIRED_SECURITY_HEADERS.forEach(header => {
      const value = response.headers.get(header);
      expect(value, `Missing security header: ${header}`).toBeTruthy();
    });
  }

  validateCorsHeaders(response: Response) {
    if (!this.config.security.checkCors) return;

    const corsHeaders = [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers'
    ];

    corsHeaders.forEach(header => {
      const value = response.headers.get(header);
      expect(value, `Missing CORS header: ${header}`).toBeTruthy();
    });
  }

  // Performance testing methods
  async performanceTest(
    endpoint: string,
    options: {
      concurrency?: number;
      requests?: number;
      maxResponseTime?: number;
    } = {}
  ) {
    const {
      concurrency = this.config.performance.loadTestConcurrency,
      requests = this.config.performance.loadTestRequests,
      maxResponseTime = this.config.performance.maxResponseTime
    } = options;

    const results: RequestMetrics[] = [];
    const requestsPerWorker = Math.ceil(requests / concurrency);

    // Create concurrent workers
    const workers = Array(concurrency).fill(0).map(async (_, workerIndex) => {
      const workerResults: RequestMetrics[] = [];
      
      for (let i = 0; i < requestsPerWorker && (workerIndex * requestsPerWorker + i) < requests; i++) {
        try {
          const { metrics } = await this.makeRequest(endpoint);
          workerResults.push(metrics);
        } catch (error) {
          workerResults.push({
            url: endpoint,
            method: 'GET',
            statusCode: 0,
            responseTime: maxResponseTime,
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
            contentLength: '0',
            contentType: 'error'
          });
        }
      }
      
      return workerResults;
    });

    // Wait for all workers to complete
    const workerResults = await Promise.all(workers);
    workerResults.forEach(workerResult => results.push(...workerResult));

    // Analyze results
    const responseTimes = results.map(r => r.responseTime);
    const successCount = results.filter(r => r.statusCode >= 200 && r.statusCode < 300).length;
    const errorCount = results.length - successCount;

    const performanceMetrics = {
      totalRequests: results.length,
      successCount,
      errorCount,
      errorRate: errorCount / results.length,
      avgResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      requestsPerSecond: results.length / (Math.max(...responseTimes) / 1000)
    };

    // Validate performance requirements
    expect(performanceMetrics.errorRate).toBeLessThan(0.05); // Less than 5% error rate
    expect(performanceMetrics.avgResponseTime).toBeLessThan(maxResponseTime);
    expect(performanceMetrics.p95ResponseTime).toBeLessThan(maxResponseTime * 1.5);

    return performanceMetrics;
  }

  // Utility methods
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sorted[lower];
    }
    
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  // Test data generators
  generateTestData(type: 'minimal' | 'comprehensive' | 'edge-cases' | 'performance' | 'security'): any {
    switch (type) {
      case 'minimal':
        return {
          surveyId: 'test-minimal',
          organizationId: 'test-org',
          stakeholderId: 'ceo',
          responses: { q1: 'Test answer', q2: 'Good' }
        };
      case 'comprehensive':
        return {
          surveyId: 'test-comprehensive',
          organizationId: 'test-org-comprehensive',
          stakeholderId: 'tech-lead',
          responses: {
            q1: 'Comprehensive test answer',
            q2: 'Cloud-based',
            q3: 4,
            q4: true,
            q5: 25
          }
        };
      case 'edge-cases':
        return {
          surveyId: 'test-edge-cases',
          organizationId: 'test-org-edge',
          stakeholderId: 'single-stakeholder',
          responses: {
            q1: 'A'.repeat(1000), // Long text
            q2: 'Option 10',
            q3: '' // Empty optional field
          }
        };
      case 'performance':
        return Array.from({ length: 100 }, (_, i) => ({
          surveyId: `test-perf-${i}`,
          organizationId: `test-org-perf-${i}`,
          stakeholderId: 'performance-test',
          responses: { q1: `Performance test ${i}`, q2: 'Good' }
        }));
      case 'security':
        return {
          surveyId: '<script>alert("xss")</script>',
          organizationId: 'test-org-security',
          stakeholderId: 'security-test',
          responses: {
            q1: '"><script>alert("xss")</script>',
            q2: 'SELECT * FROM users; DROP TABLE users;'
          }
        };
      default:
        return this.generateTestData('minimal');
    }
  }

  // Test suite builders
  buildEndpointTestSuite(
    endpoint: string,
    methods: Array<'GET' | 'POST' | 'PUT' | 'DELETE'>,
    options: {
      security?: boolean;
      performance?: boolean;
      errorHandling?: boolean;
      validation?: boolean;
    } = {}
  ) {
    const { security = true, performance = true, errorHandling = true, validation = true } = options;

    return {
      testHappyPath: async () => {
        for (const method of methods) {
          const testData = this.generateTestData('minimal');
          const { response, data } = await this.makeRequest(
            endpoint,
            {
              method,
              body: ['POST', 'PUT'].includes(method) ? JSON.stringify(testData) : undefined
            }
          );

          if (security) {
            this.validateSecurityHeaders(response);
          }

          if (validation) {
            if (response.ok) {
              this.validateSuccessResponse(data);
            } else {
              this.validateErrorResponse(data);
            }
          }
        }
      },

      testErrorHandling: async () => {
        if (!errorHandling) return;

        const errorScenarios = [
          { name: 'Invalid JSON', body: 'invalid json', expectedStatus: 400 },
          { name: 'Missing Content-Type', headers: {}, expectedStatus: 400 },
          { name: 'Invalid Parameters', endpoint: `${endpoint}/invalid`, expectedStatus: 404 }
        ];

        for (const scenario of errorScenarios) {
          const { response, data } = await this.makeRequest(
            scenario.endpoint || endpoint,
            {
              method: 'POST',
              body: scenario.body,
              headers: scenario.headers
            },
            scenario.expectedStatus
          );

          this.validateErrorResponse(data);
        }
      },

      testPerformance: async () => {
        if (!performance) return;

        const performanceResults = await this.performanceTest(endpoint, {
          concurrency: 5,
          requests: 25,
          maxResponseTime: this.config.performance.maxResponseTime
        });

        expect(performanceResults.errorRate).toBeLessThan(0.05);
        expect(performanceResults.avgResponseTime).toBeLessThan(this.config.performance.maxResponseTime);
      },

      testSecurity: async () => {
        if (!security) return;

        const securityTestData = this.generateTestData('security');
        const { response, data } = await this.makeRequest(
          endpoint,
          {
            method: 'POST',
            body: JSON.stringify(securityTestData)
          },
          400 // Expect validation error for malicious input
        );

        this.validateSecurityHeaders(response);
        this.validateErrorResponse(data);
      }
    };
  }

  // Metrics and reporting
  getMetrics() {
    return this.testMetrics.getMetrics();
  }

  generateReport() {
    return this.testMetrics.generateReport();
  }
}

// Request metrics tracking
interface RequestMetrics {
  url: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  error?: string;
  contentLength: string;
  contentType: string;
}

class TestMetrics {
  private requests: RequestMetrics[] = [];

  recordRequest(metrics: RequestMetrics) {
    this.requests.push(metrics);
  }

  reset() {
    this.requests = [];
  }

  getMetrics() {
    const successCount = this.requests.filter(r => r.statusCode >= 200 && r.statusCode < 300).length;
    const errorCount = this.requests.length - successCount;
    const avgResponseTime = this.requests.reduce((sum, r) => sum + r.responseTime, 0) / this.requests.length;

    return {
      totalRequests: this.requests.length,
      successCount,
      errorCount,
      successRate: successCount / this.requests.length,
      errorRate: errorCount / this.requests.length,
      avgResponseTime,
      minResponseTime: Math.min(...this.requests.map(r => r.responseTime)),
      maxResponseTime: Math.max(...this.requests.map(r => r.responseTime)),
      requests: this.requests
    };
  }

  generateReport() {
    const metrics = this.getMetrics();
    const report = {
      summary: {
        totalRequests: metrics.totalRequests,
        successRate: `${(metrics.successRate * 100).toFixed(2)}%`,
        errorRate: `${(metrics.errorRate * 100).toFixed(2)}%`,
        avgResponseTime: `${metrics.avgResponseTime.toFixed(2)}ms`
      },
      details: {
        requestsByStatus: this.getRequestsByStatus(),
        requestsByEndpoint: this.getRequestsByEndpoint(),
        slowestRequests: this.getSlowestRequests(10),
        failedRequests: this.getFailedRequests()
      }
    };

    return report;
  }

  private getRequestsByStatus() {
    const statusCounts: Record<number, number> = {};
    this.requests.forEach(r => {
      statusCounts[r.statusCode] = (statusCounts[r.statusCode] || 0) + 1;
    });
    return statusCounts;
  }

  private getRequestsByEndpoint() {
    const endpointCounts: Record<string, number> = {};
    this.requests.forEach(r => {
      endpointCounts[r.url] = (endpointCounts[r.url] || 0) + 1;
    });
    return endpointCounts;
  }

  private getSlowestRequests(limit: number) {
    return this.requests
      .slice()
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, limit);
  }

  private getFailedRequests() {
    return this.requests.filter(r => r.statusCode >= 400 || r.error);
  }

  logSummary() {
    const metrics = this.getMetrics();
    if (metrics.totalRequests > 0) {
      console.log(`Test Summary: ${metrics.totalRequests} requests, ${metrics.successRate.toFixed(2)}% success rate, ${metrics.avgResponseTime.toFixed(2)}ms avg response time`);
    }
  }
}

// Test data factory
export class TestDataFactory {
  static createSurveyMetadata(overrides: Partial<any> = {}) {
    return {
      id: 'test-survey-' + Math.random().toString(36).substr(2, 9),
      name: 'Test Survey',
      description: 'A test survey for API testing',
      totalSteps: 3,
      estimatedTimeMinutes: 10,
      status: 'active',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        allowMultipleResponses: true,
        requireAllStakeholders: false,
        showProgressBar: true,
        allowNavigation: true,
        timeLimit: 30
      },
      ...overrides
    };
  }

  static createStakeholder(overrides: Partial<any> = {}) {
    return {
      id: 'stakeholder-' + Math.random().toString(36).substr(2, 9),
      name: 'Test Stakeholder',
      description: 'A test stakeholder',
      color: '#3B82F6',
      expertise: ['testing', 'qa'],
      weight: 1.0,
      ...overrides
    };
  }

  static createSurveyResponse(overrides: Partial<any> = {}) {
    return {
      surveyId: 'test-survey',
      stakeholderId: 'test-stakeholder',
      organizationId: 'test-org',
      responses: {
        q1: 'Test answer',
        q2: 'Good',
        q3: 4
      },
      timestamp: new Date().toISOString(),
      ...overrides
    };
  }

  static createPerformanceTestData(count: number = 100) {
    return Array.from({ length: count }, (_, i) => ({
      id: `perf-test-${i}`,
      name: `Performance Test ${i}`,
      data: `Generated test data ${i}`,
      timestamp: new Date().toISOString()
    }));
  }
}

// Export the enhanced test suite
export const createEnhancedApiTestSuite = (config?: Partial<ApiTestConfig>) => {
  return new EnhancedApiTestSuite(config);
};

// Common test assertions
export const apiAssertions = {
  isValidSurveyMetadata: (metadata: any) => {
    expect(metadata).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      totalSteps: expect.any(Number),
      estimatedTimeMinutes: expect.any(Number),
      status: expect.stringMatching(/^(active|completed|draft)$/)
    });
  },

  isValidStakeholderList: (stakeholders: any) => {
    expect(stakeholders).toHaveProperty('stakeholders');
    expect(Array.isArray(stakeholders.stakeholders)).toBe(true);
    
    stakeholders.stakeholders.forEach((stakeholder: any) => {
      expect(stakeholder).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        color: expect.any(String),
        expertise: expect.any(Array)
      });
    });
  },

  isValidSurveyStep: (step: any) => {
    expect(step).toMatchObject({
      stepId: expect.any(String),
      stepNumber: expect.any(Number),
      totalSteps: expect.any(Number),
      questions: expect.any(Array),
      navigation: expect.objectContaining({
        canGoBack: expect.any(Boolean),
        canGoForward: expect.any(Boolean)
      })
    });
  },

  isValidApiError: (error: any) => {
    expect(error).toMatchObject({
      error: true,
      message: expect.any(String),
      code: expect.any(String)
    });
  },

  hasSecurityHeaders: (response: Response) => {
    REQUIRED_SECURITY_HEADERS.forEach(header => {
      expect(response.headers.get(header)).toBeTruthy();
    });
  }
};

export default EnhancedApiTestSuite;