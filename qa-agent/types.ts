export interface QATestResult {
  phase: 'A' | 'B' | 'C';
  testType: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
  timestamp: string;
  screenshot?: string;
}

export interface HTTPTestResult {
  url: string;
  status: number;
  responseTime: number;
  contentType: string;
  contentLength: number;
  headers: Record<string, string>;
  body: string;
  errors: string[];
}

export interface AccessibilityTestResult {
  violations: Array<{
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    nodes: Array<{
      target: string[];
      html: string;
      failureSummary: string;
    }>;
  }>;
  passes: number;
  incomplete: number;
  inapplicable: number;
}

export interface PerformanceTestResult {
  categories: {
    performance: { score: number; title: string };
    accessibility: { score: number; title: string };
    'best-practices': { score: number; title: string };
    seo: { score: number; title: string };
  };
  audits: Record<string, {
    score: number;
    displayValue: string;
    title: string;
    description: string;
  }>;
  timing: {
    total: number;
  };
}

export interface VisualTestResult {
  baseline: string;
  current: string;
  diff: string;
  pixelDifference: number;
  threshold: number;
  passed: boolean;
}

export interface SecurityTestResult {
  headers: {
    'x-frame-options': boolean;
    'x-content-type-options': boolean;
    'referrer-policy': boolean;
    'permissions-policy': boolean;
  };
  score: number;
  recommendations: string[];
}

export interface HTMLValidationResult {
  isValid: boolean;
  errors: Array<{
    line: number;
    column: number;
    message: string;
    type: 'error' | 'warning';
  }>;
  warnings: Array<{
    line: number;
    column: number;
    message: string;
    type: 'warning';
  }>;
}

export interface QAReport {
  timestamp: string;
  url: string;
  testResults: QATestResult[];
  httpTest: HTTPTestResult;
  accessibilityTest: AccessibilityTestResult;
  performanceTest: PerformanceTestResult;
  visualTest: VisualTestResult;
  securityTest: SecurityTestResult;
  htmlValidation: HTMLValidationResult;
  overallScore: number;
  recommendation: 'APPROVE' | 'REJECT' | 'NEEDS_REVIEW';
  summary: string;
}

export interface QAAgentConfig {
  baseUrl: string;
  testTimeout: number;
  screenshotPath: string;
  visualThreshold: number;
  browser: 'chromium' | 'firefox' | 'webkit' | 'msedge';
  viewport: {
    width: number;
    height: number;
  };
  userAgent: string;
  visualBrowserMode?: boolean;
  visualInteractionDelay?: number;
}