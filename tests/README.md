# Unit Testing Framework with Vitest

This comprehensive testing framework provides robust unit testing capabilities for the Surveyor application using Vitest, React Testing Library, and other modern testing tools.

## 🚀 Quick Start

### Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI interface
npm run test:ui

# Run only component tests
npm run test:components

# Run API tests
npm run test:api

# Run bundled test packages
npm run test:bundled
```

### Test Structure

```
tests/
├── components/         # Component tests
│   ├── ui/            # UI component tests
│   ├── survey/        # Survey component tests
│   └── admin/         # Admin component tests
├── lib/               # Utility function tests
├── fixtures/          # Test data and fixtures
├── mocks/             # Mock implementations
├── utils/             # Test utilities and helpers
├── config/            # Test configuration
├── integration/       # Integration tests
├── performance/       # Performance tests
└── setup.ts           # Global test setup
```

## 🧪 Writing Tests

### Component Testing

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Utility Function Testing

```typescript
import { describe, it, expect } from 'vitest';
import { formatDate, calculateProgress } from '@/lib/utils';

describe('Utils Functions', () => {
  describe('formatDate', () => {
    it('formats dates correctly', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const formatted = formatDate(date);
      
      expect(formatted).toMatch(/Jan 1, 2023/);
    });
  });

  describe('calculateProgress', () => {
    it('calculates progress correctly', () => {
      expect(calculateProgress(5, 10)).toBe(50);
      expect(calculateProgress(0, 10)).toBe(0);
      expect(calculateProgress(10, 10)).toBe(100);
    });
  });
});
```

### Using Test Utilities

```typescript
import { testUtils } from '@/tests/utils/unit-test-helpers';
import { unitTestFixtures } from '@/tests/fixtures/unit-test-fixtures';

// Use custom render with providers
const { renderWithProviders } = testUtils;

// Use mock data
const mockSurvey = unitTestFixtures.surveys.comprehensive;

// Use form helpers
const { fillInput, selectRadio, submitForm } = testUtils.createFormTestHelpers();
```

## 🔧 Test Configuration

### Environment-Specific Configurations

The framework supports multiple test environments:

- **Unit Tests**: Fast, isolated component and function tests
- **Integration Tests**: Tests that verify component interactions
- **Performance Tests**: Tests that measure rendering and execution performance
- **Watch Mode**: Continuous testing during development
- **CI/CD**: Optimized for continuous integration pipelines
- **Debug Mode**: Single-threaded execution for debugging

### Coverage Thresholds

```typescript
// Global coverage requirements
global: {
  branches: 80,
  functions: 80,
  lines: 80,
  statements: 80,
},

// Critical component requirements
'components/survey/**': {
  branches: 90,
  functions: 90,
  lines: 90,
  statements: 90,
},

// Core utility requirements
'lib/survey-engine.ts': {
  branches: 95,
  functions: 95,
  lines: 95,
  statements: 95,
},
```

## 📦 Test Fixtures and Mocks

### Using Test Fixtures

```typescript
import { unitTestFixtures } from '@/tests/fixtures/unit-test-fixtures';

// Get mock survey data
const mockSurvey = unitTestFixtures.surveys.comprehensive;

// Get mock user data
const mockUser = unitTestFixtures.users.admin;

// Get mock responses
const mockResponses = unitTestFixtures.responses.comprehensive;
```

### Creating Custom Mocks

```typescript
import { vi } from 'vitest';
import { testUtils } from '@/tests/utils/unit-test-helpers';

// Mock API client
const mockApiClient = testUtils.createMockApiClient();

// Mock localStorage
const mockStorage = testUtils.createMockLocalStorage();

// Mock Next.js router
const mockRouter = testUtils.createMockRouter({
  pathname: '/test',
  query: { id: '123' },
});
```

## 🎭 Mock System

### Automatic Mocks

The framework automatically mocks:

- **Next.js modules** (router, navigation, image, link)
- **External libraries** (Vercel Analytics, SurveyJS, React Hook Form)
- **Icons** (Lucide React)
- **Charts** (Recharts)
- **UI libraries** (Framer Motion, Radix UI)

### Manual Mocks

```typescript
// Mock a specific module
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock with implementation
vi.mock('@/lib/survey-engine', () => ({
  SurveyEngine: vi.fn().mockImplementation(() => ({
    getQuestionsForStakeholder: vi.fn(),
    calculateScore: vi.fn(),
  })),
}));
```

## 🔍 Testing Patterns

### Testing React Components

```typescript
// Basic rendering test
it('renders without crashing', () => {
  render(<Component />);
  expect(screen.getByRole('button')).toBeInTheDocument();
});

// Props testing
it('accepts and displays props', () => {
  render(<Component title="Test Title" />);
  expect(screen.getByText('Test Title')).toBeInTheDocument();
});

// Event handling
it('handles user interactions', () => {
  const handleClick = vi.fn();
  render(<Component onClick={handleClick} />);
  
  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalled();
});

// State changes
it('updates state correctly', async () => {
  render(<Component />);
  
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'new value' } });
  
  await waitFor(() => {
    expect(input).toHaveValue('new value');
  });
});
```

### Testing Forms

```typescript
import { testUtils } from '@/tests/utils/unit-test-helpers';

const { fillInput, selectRadio, submitForm } = testUtils.createFormTestHelpers();

it('submits form with correct data', () => {
  const handleSubmit = vi.fn();
  render(<Form onSubmit={handleSubmit} />);
  
  const nameInput = screen.getByLabelText('Name');
  const emailInput = screen.getByLabelText('Email');
  
  fillInput(nameInput, 'John Doe');
  fillInput(emailInput, 'john@example.com');
  
  const submitButton = screen.getByRole('button', { name: 'Submit' });
  fireEvent.click(submitButton);
  
  expect(handleSubmit).toHaveBeenCalledWith({
    name: 'John Doe',
    email: 'john@example.com',
  });
});
```

### Testing Async Operations

```typescript
import { waitFor } from '@testing-library/react';

it('handles async data loading', async () => {
  const mockData = { id: 1, name: 'Test' };
  vi.mocked(apiClient.get).mockResolvedValue(mockData);
  
  render(<AsyncComponent />);
  
  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  
  expect(apiClient.get).toHaveBeenCalledWith('/api/data');
});
```

### Testing Error Scenarios

```typescript
it('handles errors gracefully', async () => {
  const mockError = new Error('Network error');
  vi.mocked(apiClient.get).mockRejectedValue(mockError);
  
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText('Error loading data')).toBeInTheDocument();
  });
});
```

## 🚨 Testing Best Practices

### 1. Test Organization

```typescript
describe('Component/Function Name', () => {
  describe('specific feature or method', () => {
    it('should do something specific', () => {
      // Test implementation
    });
  });
  
  describe('edge cases', () => {
    it('handles edge case scenario', () => {
      // Edge case test
    });
  });
});
```

### 2. Test Naming

- Use descriptive test names that explain what is being tested
- Follow the pattern: "should [expected behavior] when [condition]"
- Be specific about the scenario being tested

### 3. Test Independence

- Each test should be independent and not rely on other tests
- Use `beforeEach` and `afterEach` for setup and cleanup
- Mock external dependencies to isolate the unit being tested

### 4. Assertion Quality

```typescript
// Good: Specific assertions
expect(screen.getByRole('button')).toBeInTheDocument();
expect(screen.getByText('Submit')).toBeEnabled();

// Bad: Generic assertions
expect(component).toBeTruthy();
expect(result).toBeDefined();
```

### 5. Mock Management

```typescript
// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Mock return values appropriately
vi.mocked(mockFunction).mockReturnValue(expectedValue);
vi.mocked(mockFunction).mockResolvedValue(expectedAsyncValue);
```

## 📊 Coverage Reports

### Generating Coverage

```bash
# Generate coverage reports
npm run test:coverage

# View coverage in browser
open coverage/index.html

# Generate specific coverage format
npm run test:coverage -- --reporter=lcov
```

### Coverage Thresholds

The framework enforces coverage thresholds:

- **Global**: 80% minimum coverage
- **Critical Components**: 90% minimum coverage
- **Core Utilities**: 95% minimum coverage

### Interpreting Coverage

- **Lines**: Percentage of executable lines covered
- **Functions**: Percentage of functions called
- **Branches**: Percentage of decision branches taken
- **Statements**: Percentage of statements executed

## 🔄 Integration with Existing Tests

### API Testing Integration

The unit testing framework integrates with the existing API testing infrastructure:

```typescript
// Use existing API test utilities
import { createApiTestSuite } from '@/tests/utils/api-test-utils';
import { apiTestFixtures } from '@/tests/fixtures/api-mock-responses.json';

// Leverage existing test data
const apiTest = createApiTestSuite();
const mockSurvey = apiTest.testSurveys.minimal;
```

### Test Data Packages

```typescript
// Use bundled test packages
import { BundledTestUtilities } from '@/tests/utils/bundled-test-utilities';

// Execute comprehensive test suites
const results = await BundledTestUtilities.executeComprehensiveTestSuite();
```

## 🛠️ Debugging Tests

### Using the UI Interface

```bash
# Launch Vitest UI
npm run test:ui
```

### Debugging Individual Tests

```bash
# Run specific test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --grep "Button Component"

# Run tests in debug mode
npm run test:debug
```

### Console Debugging

```typescript
// Add debug output to tests
it('debugs component behavior', () => {
  render(<Component />);
  
  // Debug DOM structure
  screen.debug();
  
  // Debug specific element
  const button = screen.getByRole('button');
  console.log('Button element:', button);
});
```

## 📈 Performance Testing

### Component Performance

```typescript
import { testUtils } from '@/tests/utils/unit-test-helpers';

it('renders quickly', async () => {
  const renderTime = await testUtils.createPerformanceTestHelpers().measureRenderTime(
    () => render(<Component />)
  );
  
  expect(renderTime).toBeLessThan(100); // Should render in under 100ms
});
```

### Memory Leak Detection

```typescript
it('does not leak memory', () => {
  const beforeMemory = performance.memory?.usedJSHeapSize || 0;
  
  render(<Component />);
  cleanup();
  
  const afterMemory = performance.memory?.usedJSHeapSize || 0;
  const memoryDiff = afterMemory - beforeMemory;
  
  expect(memoryDiff).toBeLessThan(1000000); // Less than 1MB
});
```

## 🎯 Accessibility Testing

### Basic Accessibility

```typescript
it('has proper accessibility attributes', () => {
  render(<Component />);
  
  const button = screen.getByRole('button');
  expect(button).toHaveAttribute('aria-label');
  expect(button).toBeVisible();
});
```

### Keyboard Navigation

```typescript
it('supports keyboard navigation', () => {
  render(<Component />);
  
  const button = screen.getByRole('button');
  button.focus();
  
  expect(button).toHaveFocus();
  
  fireEvent.keyDown(button, { key: 'Enter' });
  // Assert expected behavior
});
```

## 🔧 Troubleshooting

### Common Issues

1. **Module Not Found**: Ensure all aliases are properly configured in `vitest.config.ts`
2. **Mock Not Working**: Check that mocks are imported in the correct order
3. **Timeout Errors**: Increase timeout for async operations using `waitFor`
4. **Coverage Issues**: Ensure all files are included in coverage configuration

### Debug Configuration

```typescript
// Enable debug mode
export default defineConfig({
  test: {
    logLevel: 'info',
    reporter: 'verbose',
    testTimeout: 0, // No timeout for debugging
  },
});
```

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🤝 Contributing

When adding new tests:

1. Follow the established patterns and conventions
2. Ensure tests are comprehensive and cover edge cases
3. Update documentation when adding new utilities or patterns
4. Run the full test suite before submitting changes
5. Maintain or improve coverage thresholds

## 📄 License

This testing framework is part of the Surveyor project and follows the same license terms.