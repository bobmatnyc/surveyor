// API Testing Framework Configuration
export interface ApiTestConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  headers: Record<string, string>;
  mockServerPort: number;
  coverage: {
    enabled: boolean;
    threshold: number;
    reportDir: string;
  };
  performance: {
    enabled: boolean;
    maxResponseTime: number;
    loadTestConcurrency: number;
    loadTestRequests: number;
  };
  security: {
    enabled: boolean;
    checkHeaders: boolean;
    checkCors: boolean;
    checkRateLimit: boolean;
  };
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    logFile: string;
  };
}

export const DEFAULT_API_TEST_CONFIG: ApiTestConfig = {
  baseUrl: 'http://localhost:3000/api',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'API-Test-Suite/1.0'
  },
  mockServerPort: 3001,
  coverage: {
    enabled: true,
    threshold: 80,
    reportDir: './tests/coverage/api'
  },
  performance: {
    enabled: true,
    maxResponseTime: 5000,
    loadTestConcurrency: 10,
    loadTestRequests: 100
  },
  security: {
    enabled: true,
    checkHeaders: true,
    checkCors: true,
    checkRateLimit: true
  },
  logging: {
    enabled: true,
    level: 'info',
    logFile: './tests/logs/api-test.log'
  }
};

export const TEST_ENVIRONMENTS = {
  development: {
    ...DEFAULT_API_TEST_CONFIG,
    baseUrl: 'http://localhost:3000/api',
    logging: { ...DEFAULT_API_TEST_CONFIG.logging, level: 'debug' as const }
  },
  staging: {
    ...DEFAULT_API_TEST_CONFIG,
    baseUrl: 'https://staging-api.surveyor.com/api',
    performance: { ...DEFAULT_API_TEST_CONFIG.performance, maxResponseTime: 10000 }
  },
  production: {
    ...DEFAULT_API_TEST_CONFIG,
    baseUrl: 'https://api.surveyor.com/api',
    performance: { ...DEFAULT_API_TEST_CONFIG.performance, maxResponseTime: 3000 },
    security: { ...DEFAULT_API_TEST_CONFIG.security, checkRateLimit: true }
  }
} as const;

export const API_ENDPOINT_CATEGORIES = {
  CORE: ['survey', 'stakeholder', 'step'],
  ADMIN: ['admin/surveys', 'admin/responses', 'admin/results'],
  DISTRIBUTION: ['distribution'],
  PROGRESS: ['progress', 'complete'],
  SECURITY: ['auth', 'middleware']
} as const;

export const TEST_DATA_SETS = {
  MINIMAL: 'minimal',
  COMPREHENSIVE: 'comprehensive',
  EDGE_CASES: 'edge-cases',
  PERFORMANCE: 'performance',
  SECURITY: 'security'
} as const;

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export const REQUIRED_SECURITY_HEADERS = [
  'X-Content-Type-Options',
  'X-Frame-Options',
  'X-XSS-Protection',
  'Cache-Control',
  'Referrer-Policy'
] as const;

export const PERFORMANCE_METRICS = {
  RESPONSE_TIME: 'response_time',
  THROUGHPUT: 'throughput',
  ERROR_RATE: 'error_rate',
  CONCURRENCY: 'concurrency'
} as const;

export const ERROR_SCENARIOS = {
  INVALID_JSON: 'invalid_json',
  MISSING_HEADERS: 'missing_headers',
  INVALID_PARAMS: 'invalid_params',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SERVER_ERROR: 'server_error',
  TIMEOUT: 'timeout'
} as const;