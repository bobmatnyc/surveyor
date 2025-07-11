import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Base configuration shared across all environments
const baseConfig = {
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '../..'),
      '@/components': resolve(__dirname, '../../components'),
      '@/lib': resolve(__dirname, '../../lib'),
      '@/styles': resolve(__dirname, '../../styles'),
      '@/public': resolve(__dirname, '../../public'),
      '@/app': resolve(__dirname, '../../app'),
      '@/tests': resolve(__dirname, '../../tests'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
    'process.env.VITEST': JSON.stringify('true'),
  },
};

// Unit test configuration
export const unitTestConfig = defineConfig({
  ...baseConfig,
  test: {
    name: 'unit',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/components/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/lib/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/utils/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage',
      'tests/fixtures/**',
      'tests/config/**',
      'tests/api/**',
      'tests/integration/**',
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/unit',
      include: [
        'components/**/*.{js,ts,jsx,tsx}',
        'lib/**/*.{js,ts}',
      ],
      exclude: [
        'node_modules/**',
        'tests/**',
        'coverage/**',
        'dist/**',
        '.next/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/types.ts',
        'scripts/**',
        'qa-agent/**',
        'archive/**',
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'components/survey/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'lib/survey-engine.ts': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },
    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './coverage/unit/results.json',
      html: './coverage/unit/results.html',
    },
  },
});

// Integration test configuration
export const integrationTestConfig = defineConfig({
  ...baseConfig,
  test: {
    name: 'integration',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/integration/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage',
      'tests/fixtures/**',
      'tests/config/**',
      'tests/components/**',
      'tests/lib/**',
    ],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/integration',
      include: [
        'components/**/*.{js,ts,jsx,tsx}',
        'lib/**/*.{js,ts}',
        'app/**/*.{js,ts,jsx,tsx}',
      ],
      exclude: [
        'node_modules/**',
        'tests/**',
        'coverage/**',
        'dist/**',
        '.next/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/types.ts',
        'scripts/**',
        'qa-agent/**',
        'archive/**',
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75,
        },
      },
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 2,
        minThreads: 1,
      },
    },
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './coverage/integration/results.json',
    },
  },
});

// Performance test configuration
export const performanceTestConfig = defineConfig({
  ...baseConfig,
  test: {
    name: 'performance',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/performance/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage',
      'tests/fixtures/**',
      'tests/config/**',
      'tests/components/**',
      'tests/lib/**',
      'tests/integration/**',
    ],
    testTimeout: 60000,
    hookTimeout: 60000,
    coverage: {
      enabled: false, // Skip coverage for performance tests
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Run performance tests in single thread
        maxThreads: 1,
        minThreads: 1,
      },
    },
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './coverage/performance/results.json',
    },
  },
});

// Watch mode configuration for development
export const watchConfig = defineConfig({
  ...baseConfig,
  test: {
    name: 'watch',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/components/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/lib/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage',
      'tests/fixtures/**',
      'tests/config/**',
      'tests/api/**',
      'tests/integration/**',
      'tests/performance/**',
    ],
    testTimeout: 5000,
    hookTimeout: 5000,
    coverage: {
      enabled: false, // Skip coverage in watch mode for speed
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 2,
        minThreads: 1,
      },
    },
    reporter: ['verbose'],
    watch: true,
    watchExclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'coverage/**',
    ],
  },
});

// CI/CD configuration
export const ciConfig = defineConfig({
  ...baseConfig,
  test: {
    name: 'ci',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/components/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/lib/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/integration/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage',
      'tests/fixtures/**',
      'tests/config/**',
      'tests/api/**',
      'tests/performance/**',
    ],
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov', 'cobertura'],
      reportsDirectory: './coverage/ci',
      include: [
        'components/**/*.{js,ts,jsx,tsx}',
        'lib/**/*.{js,ts}',
        'app/**/*.{js,ts,jsx,tsx}',
      ],
      exclude: [
        'node_modules/**',
        'tests/**',
        'coverage/**',
        'dist/**',
        '.next/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/types.ts',
        'scripts/**',
        'qa-agent/**',
        'archive/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },
    reporter: ['verbose', 'json', 'junit'],
    outputFile: {
      json: './coverage/ci/results.json',
      junit: './coverage/ci/junit.xml',
    },
  },
});

// Debug configuration
export const debugConfig = defineConfig({
  ...baseConfig,
  test: {
    name: 'debug',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/components/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/lib/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage',
      'tests/fixtures/**',
      'tests/config/**',
      'tests/api/**',
      'tests/integration/**',
      'tests/performance/**',
    ],
    testTimeout: 0, // No timeout for debugging
    hookTimeout: 0,
    coverage: {
      enabled: false,
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Single thread for debugging
        maxThreads: 1,
        minThreads: 1,
      },
    },
    reporter: ['verbose'],
    logLevel: 'info',
  },
});

// Configuration selector based on environment
export function getTestConfig(env: string = 'unit') {
  switch (env) {
    case 'unit':
      return unitTestConfig;
    case 'integration':
      return integrationTestConfig;
    case 'performance':
      return performanceTestConfig;
    case 'watch':
      return watchConfig;
    case 'ci':
      return ciConfig;
    case 'debug':
      return debugConfig;
    default:
      return unitTestConfig;
  }
}

export default unitTestConfig;