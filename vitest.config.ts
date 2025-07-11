import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // Include patterns for different test types
    include: [
      'tests/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/components/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/lib/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/utils/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage',
      'tests/fixtures/**',
      'tests/config/**'
    ],
    // Test timeout settings
    testTimeout: 10000,
    hookTimeout: 10000,
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
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
        'archive/**'
      ],
      include: [
        'components/**/*.{js,ts,jsx,tsx}',
        'lib/**/*.{js,ts}',
        'app/**/*.{js,ts,jsx,tsx}'
      ],
      // Coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Specific thresholds for critical components
        'components/survey/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'lib/survey-engine.ts': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    },
    // Concurrent test execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@/components': resolve(__dirname, './components'),
      '@/lib': resolve(__dirname, './lib'),
      '@/styles': resolve(__dirname, './styles'),
      '@/public': resolve(__dirname, './public'),
      '@/app': resolve(__dirname, './app'),
      '@/tests': resolve(__dirname, './tests')
    },
  },
  // Define constants for test environment
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
    'process.env.VITEST': JSON.stringify('true')
  }
});