import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createEnhancedApiTestSuite, TestDataFactory } from '../../utils/enhanced-api-test-utils';
import { ApiTestConfig } from '../../config/api-test-config';

describe('Load Testing and Performance Test Suite', () => {
  let apiTestSuite: any;
  
  beforeEach(async () => {
    const config: Partial<ApiTestConfig> = {
      performance: {
        enabled: true,
        maxResponseTime: 10000, // 10 seconds for load tests
        loadTestConcurrency: 20,
        loadTestRequests: 200
      },
      security: {
        enabled: false, // Disable security checks for pure performance testing
        checkHeaders: false,
        checkCors: false,
        checkRateLimit: false
      },
      logging: {
        enabled: true,
        level: 'info',
        logFile: './tests/logs/load-test.log'
      }
    };

    apiTestSuite = createEnhancedApiTestSuite(config);
    apiTestSuite.beforeEach();
  });

  afterEach(() => {
    apiTestSuite.afterEach();
  });

  describe('Survey Metadata Load Tests', () => {
    it('should handle high concurrent requests for survey metadata', async () => {
      const performanceResults = await apiTestSuite.performanceTest('/survey/test-minimal', {
        concurrency: 50,
        requests: 500,
        maxResponseTime: 5000
      });
      
      expect(performanceResults.totalRequests).toBe(500);
      expect(performanceResults.errorRate).toBeLessThan(0.02); // Less than 2% error rate
      expect(performanceResults.avgResponseTime).toBeLessThan(5000);
      expect(performanceResults.p95ResponseTime).toBeLessThan(8000);
      expect(performanceResults.p99ResponseTime).toBeLessThan(12000);
      expect(performanceResults.requestsPerSecond).toBeGreaterThan(25);
    });

    it('should maintain performance under sustained load', async () => {
      const testDuration = 60000; // 1 minute
      const startTime = Date.now();
      const results = [];
      
      while (Date.now() - startTime < testDuration) {
        const batchResults = await apiTestSuite.performanceTest('/survey/test-minimal', {
          concurrency: 10,
          requests: 50,
          maxResponseTime: 3000
        });
        
        results.push(batchResults);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second between batches
      }
      
      // Analyze sustained performance
      const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
      const avgResponseTime = results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length;
      
      expect(totalRequests).toBeGreaterThan(1000);
      expect(totalErrors / totalRequests).toBeLessThan(0.05); // Less than 5% error rate
      expect(avgResponseTime).toBeLessThan(5000);
    });

    it('should handle burst traffic patterns', async () => {
      // Simulate burst traffic with increasing load
      const burstSizes = [10, 50, 100, 200, 100, 50, 10];
      const burstResults = [];
      
      for (const burstSize of burstSizes) {
        const batchResults = await apiTestSuite.performanceTest('/survey/test-minimal', {
          concurrency: Math.min(burstSize, 50),
          requests: burstSize,
          maxResponseTime: 8000
        });
        
        burstResults.push(batchResults);
        await new Promise(resolve => setTimeout(resolve, 500)); // Short pause between bursts
      }
      
      // Verify system handles bursts gracefully
      burstResults.forEach((result, index) => {
        expect(result.errorRate).toBeLessThan(0.1); // Allow higher error rate for bursts
        expect(result.avgResponseTime).toBeLessThan(8000);
        
        if (index > 0) {
          // Response time should not degrade significantly between bursts
          const prevResult = burstResults[index - 1];
          expect(result.avgResponseTime).toBeLessThan(prevResult.avgResponseTime * 2);
        }
      });
    });
  });

  describe('Survey Step Load Tests', () => {
    it('should handle high concurrent GET requests for survey steps', async () => {
      const performanceResults = await apiTestSuite.performanceTest('/survey/test-minimal/step/q1?stakeholderId=ceo', {
        concurrency: 30,
        requests: 300,
        maxResponseTime: 6000
      });
      
      expect(performanceResults.totalRequests).toBe(300);
      expect(performanceResults.errorRate).toBeLessThan(0.03);
      expect(performanceResults.avgResponseTime).toBeLessThan(6000);
      expect(performanceResults.p95ResponseTime).toBeLessThan(10000);
      expect(performanceResults.requestsPerSecond).toBeGreaterThan(20);
    });

    it('should handle concurrent POST requests for step submissions', async () => {
      const testData = TestDataFactory.createSurveyResponse();
      
      const workers = Array(20).fill(0).map(async (_, workerId) => {
        const workerResults = [];
        
        for (let i = 0; i < 10; i++) {
          const startTime = performance.now();
          
          try {
            const { response, data } = await apiTestSuite.post('/survey/test-minimal/step/q1', {
              ...testData,
              responses: {
                q1: `Load test response from worker ${workerId}, request ${i}`
              }
            });
            
            const endTime = performance.now();
            workerResults.push({
              success: response.status === 200,
              responseTime: endTime - startTime,
              workerId,
              requestId: i
            });
          } catch (error) {
            const endTime = performance.now();
            workerResults.push({
              success: false,
              responseTime: endTime - startTime,
              workerId,
              requestId: i,
              error: error.message
            });
          }
        }
        
        return workerResults;
      });
      
      const allResults = (await Promise.all(workers)).flat();
      
      const successCount = allResults.filter(r => r.success).length;
      const errorCount = allResults.length - successCount;
      const avgResponseTime = allResults.reduce((sum, r) => sum + r.responseTime, 0) / allResults.length;
      
      expect(allResults.length).toBe(200);
      expect(errorCount / allResults.length).toBeLessThan(0.1); // Less than 10% error rate for POST
      expect(avgResponseTime).toBeLessThan(8000);
      expect(successCount).toBeGreaterThan(160); // At least 80% success rate
    });

    it('should handle mixed read/write workload', async () => {
      const testData = TestDataFactory.createSurveyResponse();
      const mixedWorkload = [];
      
      // 70% reads, 30% writes
      for (let i = 0; i < 100; i++) {
        if (i % 10 < 7) {
          // GET request
          mixedWorkload.push({
            type: 'GET',
            endpoint: '/survey/test-minimal/step/q1?stakeholderId=ceo'
          });
        } else {
          // POST request
          mixedWorkload.push({
            type: 'POST',
            endpoint: '/survey/test-minimal/step/q1',
            data: {
              ...testData,
              responses: { q1: `Mixed workload test ${i}` }
            }
          });
        }
      }
      
      const concurrentWorkers = Array(10).fill(0).map(async (_, workerId) => {
        const workerResults = [];
        const workerWorkload = mixedWorkload.slice(workerId * 10, (workerId + 1) * 10);
        
        for (const task of workerWorkload) {
          const startTime = performance.now();
          
          try {
            let response, data;
            if (task.type === 'GET') {
              ({ response, data } = await apiTestSuite.get(task.endpoint));
            } else {
              ({ response, data } = await apiTestSuite.post(task.endpoint, task.data));
            }
            
            const endTime = performance.now();
            workerResults.push({
              type: task.type,
              success: response.status === 200,
              responseTime: endTime - startTime
            });
          } catch (error) {
            const endTime = performance.now();
            workerResults.push({
              type: task.type,
              success: false,
              responseTime: endTime - startTime,
              error: error.message
            });
          }
        }
        
        return workerResults;
      });
      
      const allResults = (await Promise.all(concurrentWorkers)).flat();
      
      const getResults = allResults.filter(r => r.type === 'GET');
      const postResults = allResults.filter(r => r.type === 'POST');
      
      // GET requests should be faster and more reliable
      const getSuccessRate = getResults.filter(r => r.success).length / getResults.length;
      const postSuccessRate = postResults.filter(r => r.success).length / postResults.length;
      
      expect(getSuccessRate).toBeGreaterThan(0.95); // 95% success rate for reads
      expect(postSuccessRate).toBeGreaterThan(0.85); // 85% success rate for writes
      
      const avgGetResponseTime = getResults.reduce((sum, r) => sum + r.responseTime, 0) / getResults.length;
      const avgPostResponseTime = postResults.reduce((sum, r) => sum + r.responseTime, 0) / postResults.length;
      
      expect(avgGetResponseTime).toBeLessThan(3000);
      expect(avgPostResponseTime).toBeLessThan(6000);
    });
  });

  describe('Stakeholder Endpoints Load Tests', () => {
    it('should handle high concurrent requests for stakeholder lists', async () => {
      const performanceResults = await apiTestSuite.performanceTest('/survey/test-comprehensive/stakeholders', {
        concurrency: 40,
        requests: 400,
        maxResponseTime: 4000
      });
      
      expect(performanceResults.totalRequests).toBe(400);
      expect(performanceResults.errorRate).toBeLessThan(0.02);
      expect(performanceResults.avgResponseTime).toBeLessThan(4000);
      expect(performanceResults.requestsPerSecond).toBeGreaterThan(30);
    });

    it('should handle concurrent requests across multiple surveys', async () => {
      const surveys = ['test-minimal', 'test-comprehensive', 'test-edge-cases'];
      const concurrentRequests = [];
      
      for (let i = 0; i < 150; i++) {
        const surveyId = surveys[i % surveys.length];
        concurrentRequests.push(
          apiTestSuite.get(`/survey/${surveyId}/stakeholders`).catch(e => ({ error: e }))
        );
      }
      
      const results = await Promise.all(concurrentRequests);
      const successfulRequests = results.filter(r => r.response && r.response.status === 200);
      const errorRequests = results.filter(r => r.error || (r.response && r.response.status !== 200));
      
      expect(successfulRequests.length).toBeGreaterThan(135); // At least 90% success
      expect(errorRequests.length).toBeLessThan(15); // Less than 10% errors
    });
  });

  describe('Memory and Resource Usage Tests', () => {
    it('should not have memory leaks during sustained load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Run sustained load for 30 seconds
      const testDuration = 30000;
      const startTime = Date.now();
      const batches = [];
      
      while (Date.now() - startTime < testDuration) {
        const batch = await apiTestSuite.performanceTest('/survey/test-minimal', {
          concurrency: 10,
          requests: 50,
          maxResponseTime: 5000
        });
        
        batches.push(batch);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const finalMemory = process.memoryUsage();
      
      // Memory usage should not increase dramatically
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercentage = (memoryIncrease / initialMemory.heapUsed) * 100;
      
      expect(memoryIncreasePercentage).toBeLessThan(50); // Less than 50% memory increase
      expect(batches.length).toBeGreaterThan(10); // Ensure we ran multiple batches
    });
  });

  describe('Error Handling Under Load', () => {
    it('should handle graceful degradation under extreme load', async () => {
      const extremeLoadResults = await apiTestSuite.performanceTest('/survey/test-minimal', {
        concurrency: 100,
        requests: 1000,
        maxResponseTime: 15000
      });
      
      // Even under extreme load, system should respond somewhat
      expect(extremeLoadResults.totalRequests).toBe(1000);
      expect(extremeLoadResults.errorRate).toBeLessThan(0.3); // Allow up to 30% errors under extreme load
      expect(extremeLoadResults.avgResponseTime).toBeLessThan(15000);
      
      // Should still have some successful requests
      expect(extremeLoadResults.successCount).toBeGreaterThan(500);
    });

    it('should recover quickly after load spike', async () => {
      // Create load spike
      const spikeResults = await apiTestSuite.performanceTest('/survey/test-minimal', {
        concurrency: 80,
        requests: 400,
        maxResponseTime: 10000
      });
      
      // Wait for recovery
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Test normal performance after spike
      const recoveryResults = await apiTestSuite.performanceTest('/survey/test-minimal', {
        concurrency: 10,
        requests: 50,
        maxResponseTime: 3000
      });
      
      expect(recoveryResults.errorRate).toBeLessThan(0.05); // Should recover to normal error rates
      expect(recoveryResults.avgResponseTime).toBeLessThan(3000); // Should recover to normal response times
    });
  });

  describe('Concurrent User Simulation', () => {
    it('should simulate realistic user workflows under load', async () => {
      const userSimulations = Array(25).fill(0).map(async (_, userId) => {
        const userResults = [];
        
        try {
          // Simulate user workflow: get survey -> get stakeholders -> get step -> submit step
          const surveyId = userId % 2 === 0 ? 'test-minimal' : 'test-comprehensive';
          
          // 1. Get survey metadata
          const { response: surveyResponse } = await apiTestSuite.get(`/survey/${surveyId}`);
          userResults.push({ step: 'survey', success: surveyResponse.status === 200 });
          
          // 2. Get stakeholders
          const { response: stakeholderResponse } = await apiTestSuite.get(`/survey/${surveyId}/stakeholders`);
          userResults.push({ step: 'stakeholders', success: stakeholderResponse.status === 200 });
          
          // 3. Get first step
          const stakeholderId = 'ceo';
          const { response: stepResponse } = await apiTestSuite.get(`/survey/${surveyId}/step/q1?stakeholderId=${stakeholderId}`);
          userResults.push({ step: 'step', success: stepResponse.status === 200 });
          
          // 4. Submit step
          const testData = TestDataFactory.createSurveyResponse({
            surveyId,
            stakeholderId,
            responses: { q1: `User ${userId} workflow test` }
          });
          
          const { response: submitResponse } = await apiTestSuite.post(`/survey/${surveyId}/step/q1`, testData);
          userResults.push({ step: 'submit', success: submitResponse.status === 200 });
          
        } catch (error) {
          userResults.push({ step: 'error', success: false, error: error.message });
        }
        
        return userResults;
      });
      
      const allUserResults = await Promise.all(userSimulations);
      
      // Analyze workflow success rates
      const workflowSteps = ['survey', 'stakeholders', 'step', 'submit'];
      const stepSuccessRates = {};
      
      workflowSteps.forEach(stepName => {
        const stepResults = allUserResults.flat().filter(r => r.step === stepName);
        const successCount = stepResults.filter(r => r.success).length;
        stepSuccessRates[stepName] = successCount / stepResults.length;
      });
      
      // Each workflow step should have high success rate
      Object.entries(stepSuccessRates).forEach(([stepName, successRate]) => {
        expect(successRate).toBeGreaterThan(0.85); // At least 85% success rate per step
      });
      
      // Overall workflow completion rate
      const completedWorkflows = allUserResults.filter(userResult => 
        userResult.every(step => step.success)
      );
      const workflowCompletionRate = completedWorkflows.length / allUserResults.length;
      
      expect(workflowCompletionRate).toBeGreaterThan(0.7); // At least 70% complete workflows
    });
  });

  describe('Performance Regression Tests', () => {
    it('should maintain baseline performance metrics', async () => {
      const baselineTests = [
        { endpoint: '/survey/test-minimal', maxAvgResponseTime: 2000, maxP95: 4000 },
        { endpoint: '/survey/test-minimal/stakeholders', maxAvgResponseTime: 1500, maxP95: 3000 },
        { endpoint: '/survey/test-minimal/step/q1?stakeholderId=ceo', maxAvgResponseTime: 3000, maxP95: 6000 }
      ];
      
      for (const test of baselineTests) {
        const results = await apiTestSuite.performanceTest(test.endpoint, {
          concurrency: 10,
          requests: 100,
          maxResponseTime: test.maxP95
        });
        
        expect(results.avgResponseTime).toBeLessThan(test.maxAvgResponseTime);
        expect(results.p95ResponseTime).toBeLessThan(test.maxP95);
        expect(results.errorRate).toBeLessThan(0.05);
      }
    });
  });
});