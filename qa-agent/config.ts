import { QAAgentConfig } from './types';

export const DEFAULT_QA_CONFIG: QAAgentConfig = {
  baseUrl: 'http://localhost:3002',
  testTimeout: 30000,
  screenshotPath: './qa-agent/screenshots',
  visualThreshold: 0.1,
  browser: 'msedge', // MS Edge as default for Frontend QA
  viewport: {
    width: 1920,
    height: 1080
  },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
  visualBrowserMode: true, // Enable visual browser launching by default
  visualInteractionDelay: 3000 // 3 seconds for visual verification
};

export const TEST_ROUTES = [
  '/',
  '/auth',
  '/survey',
  '/admin',
  '/survey/jim-joseph-tech-maturity-v1/org_beth_shalom_community'
];

export const ACCESSIBILITY_RULES = {
  'color-contrast': true,
  'keyboard-navigation': true,
  'aria-labels': true,
  'heading-order': true,
  'alt-text': true,
  'form-labels': true,
  'focus-visible': true
};

export const PERFORMANCE_THRESHOLDS = {
  performance: 0.9,
  accessibility: 0.95,
  'best-practices': 0.9,
  seo: 0.8,
  'first-contentful-paint': 2000,
  'largest-contentful-paint': 4000,
  'cumulative-layout-shift': 0.1,
  'speed-index': 4000
};

export const SECURITY_HEADERS = [
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'strict-transport-security'
];