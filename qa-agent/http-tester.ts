import { HTTPTestResult, QATestResult } from './types';

export class HTTPTester {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string, timeout: number = 30000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  async testUrl(path: string = ''): Promise<HTTPTestResult> {
    const url = `${this.baseUrl}${path}`;
    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Frontend-QA-Agent/1.0.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      const contentType = response.headers.get('content-type') || '';
      const contentLength = parseInt(response.headers.get('content-length') || '0');
      
      // Convert headers to object
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      // Read response body
      const body = await response.text();
      
      // Validate response
      if (!response.ok) {
        errors.push(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (responseTime > 5000) {
        errors.push(`Slow response time: ${responseTime}ms`);
      }
      
      if (!contentType.includes('text/html') && path === '') {
        errors.push(`Unexpected content type: ${contentType}`);
      }
      
      if (body.length === 0) {
        errors.push('Empty response body');
      }
      
      return {
        url,
        status: response.status,
        responseTime,
        contentType,
        contentLength,
        headers,
        body,
        errors
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errors.push(`Request timeout after ${this.timeout}ms`);
        } else {
          errors.push(`Network error: ${error.message}`);
        }
      } else {
        errors.push('Unknown network error');
      }
      
      return {
        url,
        status: 0,
        responseTime,
        contentType: '',
        contentLength: 0,
        headers: {},
        body: '',
        errors
      };
    }
  }

  async validateHTTPResponse(result: HTTPTestResult): Promise<QATestResult[]> {
    const testResults: QATestResult[] = [];
    
    // Status code validation
    if (result.status >= 200 && result.status < 400) {
      testResults.push({
        phase: 'A',
        testType: 'HTTP Status',
        status: 'PASS',
        message: `HTTP ${result.status} - Success`,
        details: { status: result.status, url: result.url },
        timestamp: new Date().toISOString()
      });
    } else {
      testResults.push({
        phase: 'A',
        testType: 'HTTP Status',
        status: 'FAIL',
        message: `HTTP ${result.status} - ${result.status === 0 ? 'Connection failed' : 'Error response'}`,
        details: { status: result.status, url: result.url },
        timestamp: new Date().toISOString()
      });
    }
    
    // Response time validation
    if (result.responseTime < 2000) {
      testResults.push({
        phase: 'A',
        testType: 'Response Time',
        status: 'PASS',
        message: `Response time: ${result.responseTime}ms`,
        details: { responseTime: result.responseTime },
        timestamp: new Date().toISOString()
      });
    } else if (result.responseTime < 5000) {
      testResults.push({
        phase: 'A',
        testType: 'Response Time',
        status: 'WARNING',
        message: `Slow response time: ${result.responseTime}ms`,
        details: { responseTime: result.responseTime },
        timestamp: new Date().toISOString()
      });
    } else {
      testResults.push({
        phase: 'A',
        testType: 'Response Time',
        status: 'FAIL',
        message: `Very slow response time: ${result.responseTime}ms`,
        details: { responseTime: result.responseTime },
        timestamp: new Date().toISOString()
      });
    }
    
    // Content type validation
    if (result.contentType.includes('text/html')) {
      testResults.push({
        phase: 'A',
        testType: 'Content Type',
        status: 'PASS',
        message: `Valid HTML content type: ${result.contentType}`,
        details: { contentType: result.contentType },
        timestamp: new Date().toISOString()
      });
    } else {
      testResults.push({
        phase: 'A',
        testType: 'Content Type',
        status: 'WARNING',
        message: `Unexpected content type: ${result.contentType}`,
        details: { contentType: result.contentType },
        timestamp: new Date().toISOString()
      });
    }
    
    // Content length validation
    if (result.contentLength > 0) {
      testResults.push({
        phase: 'A',
        testType: 'Content Length',
        status: 'PASS',
        message: `Content length: ${result.contentLength} bytes`,
        details: { contentLength: result.contentLength },
        timestamp: new Date().toISOString()
      });
    } else {
      testResults.push({
        phase: 'A',
        testType: 'Content Length',
        status: 'WARNING',
        message: 'Empty or unknown content length',
        details: { contentLength: result.contentLength },
        timestamp: new Date().toISOString()
      });
    }
    
    // Additional errors
    result.errors.forEach(error => {
      testResults.push({
        phase: 'A',
        testType: 'HTTP Error',
        status: 'FAIL',
        message: error,
        details: { error },
        timestamp: new Date().toISOString()
      });
    });
    
    return testResults;
  }
}