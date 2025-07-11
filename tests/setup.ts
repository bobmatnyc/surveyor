import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Import all mocks to ensure they are applied globally
import './mocks';

// Make vi available globally
// @ts-ignore
global.vi = vi;

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
  // Clear all mocks
  vi.clearAllMocks();
  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  // Reset any timers
  vi.useRealTimers();
});

// Global test setup
beforeAll(() => {
  // Setup global test environment
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  // Mock window.location
  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      protocol: 'http:',
      reload: vi.fn(),
      replace: vi.fn(),
      assign: vi.fn(),
    },
  });

  // Mock window.navigator
  Object.defineProperty(window, 'navigator', {
    writable: true,
    value: {
      userAgent: 'Mozilla/5.0 (jsdom)',
      language: 'en-US',
      languages: ['en-US'],
      platform: 'jsdom',
      cookieEnabled: true,
      onLine: true,
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
      },
    },
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock fetch for API calls
  global.fetch = vi.fn();

  // Mock console methods for cleaner test output
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });

  // Mock URL constructor
  global.URL = class URL {
    constructor(public href: string, base?: string) {
      this.href = href;
    }
    toString() {
      return this.href;
    }
  } as any;

  // Mock URLSearchParams
  global.URLSearchParams = class URLSearchParams {
    private params: Map<string, string> = new Map();
    
    constructor(init?: string | URLSearchParams | Record<string, string>) {
      if (typeof init === 'string') {
        // Simple parsing for test purposes
        init.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key && value) {
            this.params.set(decodeURIComponent(key), decodeURIComponent(value));
          }
        });
      }
    }
    
    get(key: string) {
      return this.params.get(key);
    }
    
    set(key: string, value: string) {
      this.params.set(key, value);
    }
    
    has(key: string) {
      return this.params.has(key);
    }
    
    toString() {
      return Array.from(this.params.entries())
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    }
  } as any;
});

// Global test teardown
afterAll(() => {
  // Clean up global test environment
  vi.restoreAllMocks();
});