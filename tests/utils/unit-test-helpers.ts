import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';

// Types for test utilities
export interface TestWrapperProps {
  children: ReactNode;
}

export interface MockApiResponse {
  data?: any;
  error?: string;
  status?: number;
}

export interface MockFunctionSetup {
  fn: ReturnType<typeof vi.fn>;
  mockReturnValue?: any;
  mockResolvedValue?: any;
  mockRejectedValue?: any;
  mockImplementation?: (...args: any[]) => any;
}

// Custom render function with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  // For now, we'll use the basic render
  // In future, we can add providers like React Query, Context providers, etc.
  return render(ui, options);
}

// Mock API client functions
export const createMockApiClient = () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
});

// Mock localStorage utilities
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: Object.keys(store).length,
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
};

// Mock Next.js router
export const createMockRouter = (overrides?: Partial<any>) => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  reload: vi.fn(),
  prefetch: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  isReady: true,
  isFallback: false,
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
  ...overrides,
});

// Survey-specific test utilities
export const createMockSurvey = (overrides?: Partial<any>) => ({
  id: 'test-survey',
  title: 'Test Survey',
  description: 'A test survey for unit testing',
  questions: [
    {
      id: 'q1',
      type: 'text',
      title: 'What is your primary challenge?',
      isRequired: true,
    },
    {
      id: 'q2',
      type: 'rating',
      title: 'How would you rate your experience?',
      isRequired: true,
      choices: [
        { value: 1, text: 'Poor' },
        { value: 2, text: 'Fair' },
        { value: 3, text: 'Good' },
        { value: 4, text: 'Very Good' },
        { value: 5, text: 'Excellent' },
      ],
    },
  ],
  stakeholders: [
    {
      id: 'ceo',
      name: 'CEO',
      description: 'Chief Executive Officer',
      expertise: ['leadership', 'strategy'],
    },
    {
      id: 'tech-lead',
      name: 'Tech Lead',
      description: 'Technical Leadership',
      expertise: ['technology', 'development'],
    },
  ],
  ...overrides,
});

// Component testing utilities
export const createMockComponent = (name: string, props?: any) => {
  const MockComponent = vi.fn().mockImplementation(({ children, ...rest }) => (
    <div data-testid={`mock-${name.toLowerCase()}`} {...rest}>
      {children}
    </div>
  ));
  MockComponent.displayName = `Mock${name}`;
  return MockComponent;
};

// Form testing utilities
export const createFormTestHelpers = () => ({
  // Helper to fill form inputs
  fillInput: (input: HTMLElement, value: string) => {
    if (input instanceof HTMLInputElement) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
  
  // Helper to select radio button
  selectRadio: (radio: HTMLElement) => {
    if (radio instanceof HTMLInputElement && radio.type === 'radio') {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
  
  // Helper to check checkbox
  checkCheckbox: (checkbox: HTMLElement, checked: boolean = true) => {
    if (checkbox instanceof HTMLInputElement && checkbox.type === 'checkbox') {
      checkbox.checked = checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
  
  // Helper to submit form
  submitForm: (form: HTMLElement) => {
    if (form instanceof HTMLFormElement) {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    }
  },
});

// Mock data generators
export const generateMockData = {
  // Generate mock survey responses
  surveyResponse: (overrides?: Partial<any>) => ({
    id: `response-${Date.now()}`,
    surveyId: 'test-survey',
    organizationId: 'test-org',
    stakeholder: 'ceo',
    responses: {
      q1: 'Digital transformation',
      q2: 4,
    },
    completedAt: new Date().toISOString(),
    ...overrides,
  }),
  
  // Generate mock user data
  user: (overrides?: Partial<any>) => ({
    id: `user-${Date.now()}`,
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
    ...overrides,
  }),
  
  // Generate mock organization data
  organization: (overrides?: Partial<any>) => ({
    id: `org-${Date.now()}`,
    name: 'Test Organization',
    description: 'A test organization',
    ...overrides,
  }),
};

// API response helpers
export const createMockApiResponse = (data: any, status: number = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(data),
  text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  headers: new Headers(),
  statusText: status === 200 ? 'OK' : 'Error',
});

// Error testing utilities
export const createErrorScenarios = () => ({
  networkError: new Error('Network Error'),
  apiError: { message: 'API Error', status: 500 },
  validationError: { message: 'Validation Error', field: 'email' },
  authError: { message: 'Unauthorized', status: 401 },
});

// Timer utilities for testing
export const createTimerTestHelpers = () => ({
  // Fast-forward time
  fastForwardTime: (ms: number) => {
    vi.advanceTimersByTime(ms);
  },
  
  // Run all timers
  runAllTimers: () => {
    vi.runAllTimers();
  },
  
  // Setup fake timers
  setupFakeTimers: () => {
    vi.useFakeTimers();
  },
  
  // Restore real timers
  restoreTimers: () => {
    vi.useRealTimers();
  },
});

// Accessibility testing helpers
export const createA11yTestHelpers = () => ({
  // Check for accessible name
  hasAccessibleName: (element: HTMLElement) => {
    return element.hasAttribute('aria-label') || 
           element.hasAttribute('aria-labelledby') || 
           element.textContent?.trim();
  },
  
  // Check for proper heading structure
  hasProperHeadingStructure: (container: HTMLElement) => {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    for (const heading of headings) {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        return false;
      }
      previousLevel = level;
    }
    
    return true;
  },
  
  // Check for keyboard navigation
  isKeyboardNavigable: (element: HTMLElement) => {
    return element.tabIndex >= 0 || 
           ['button', 'input', 'select', 'textarea', 'a'].includes(element.tagName.toLowerCase());
  },
});

// Performance testing utilities
export const createPerformanceTestHelpers = () => ({
  // Measure render time
  measureRenderTime: async (renderFn: () => Promise<RenderResult> | RenderResult) => {
    const start = performance.now();
    await renderFn();
    const end = performance.now();
    return end - start;
  },
  
  // Check for memory leaks
  checkMemoryLeaks: (beforeMemory: number, afterMemory: number) => {
    return afterMemory - beforeMemory;
  },
});

// Test data cleanup utilities
export const createCleanupHelpers = () => ({
  // Clear all test data
  clearAllTestData: () => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  },
  
  // Reset DOM state
  resetDOMState: () => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  },
  
  // Reset global state
  resetGlobalState: () => {
    // Reset any global variables or state
    (window as any).testGlobalState = undefined;
  },
});

// Export all utilities
export const testUtils = {
  renderWithProviders,
  createMockApiClient,
  createMockLocalStorage,
  createMockRouter,
  createMockSurvey,
  createMockComponent,
  createFormTestHelpers,
  generateMockData,
  createMockApiResponse,
  createErrorScenarios,
  createTimerTestHelpers,
  createA11yTestHelpers,
  createPerformanceTestHelpers,
  createCleanupHelpers,
};

export default testUtils;