# Bundled Test Survey JSON Packages Documentation

## Overview

This document describes the comprehensive test survey JSON packages created for the Surveyor platform's API testing framework. These packages provide thorough coverage for all testing scenarios and API endpoints.

## Package Structure

### 1. Comprehensive Test Survey Packages (`comprehensive-test-survey-packages.json`)

**Purpose**: Primary test data for standard API testing scenarios

**Contents**:
- **Simple Survey**: Basic two-question survey for fundamental testing
- **Stakeholder Survey**: Multi-stakeholder assessment with domain-based questions
- **Technical Assessment**: Complex technical capability evaluation
- **Feedback Form**: Customer feedback collection form

**Key Features**:
- Multiple survey types (basic, stakeholder, technical, feedback)
- Various complexity levels (simple, medium, complex)
- Different stakeholder configurations
- Domain-based question organization
- Comprehensive settings configurations

### 2. Edge Case Test Packages (`edge-case-test-packages.json`)

**Purpose**: Testing boundary conditions and edge cases

**Contents**:
- **Single Stakeholder Survey**: Boundary testing with minimal configuration
- **Unicode Support Survey**: International characters and emoji testing
- **Maximum Length Survey**: Testing maximum field lengths and large data
- **Conditional Logic Survey**: Complex conditional question logic
- **Validation Limits Survey**: Testing all validation edge cases

**Key Features**:
- Boundary condition testing
- Unicode and internationalization support
- Maximum length field testing
- Conditional logic scenarios
- Validation limit testing

### 3. Error Scenario Test Packages (`error-scenario-test-packages.json`)

**Purpose**: Comprehensive error handling testing

**Contents**:
- **Validation Errors**: Missing fields, invalid types, exceeding limits
- **Not Found Errors**: Invalid IDs, non-existent resources
- **Authentication Errors**: Missing tokens, invalid credentials
- **Malformed Requests**: Invalid JSON, missing headers
- **Server Errors**: Database failures, service unavailable
- **Rate Limiting**: Too many requests, concurrent limits

**Key Features**:
- All HTTP error codes covered
- Detailed error response validation
- Authentication and authorization testing
- Request format validation
- Server-side error simulation

### 4. Performance Test Packages (`performance-test-packages.json`)

**Purpose**: Load, stress, and performance testing

**Contents**:
- **Lightweight Survey**: Minimal survey for baseline performance
- **Medium Survey**: Standard-sized survey for typical load testing
- **Heavy Survey**: Large survey for stress testing
- **Load Test Scenarios**: Various user load configurations
- **Stress Test Scenarios**: Breaking point testing
- **Volume Test Scenarios**: Large data volume handling

**Key Features**:
- Multiple performance test configurations
- Concurrent user simulations
- Response time targets
- Throughput measurements
- Resource usage monitoring

## Usage Examples

### Loading Test Data

```typescript
import { TestDataLoader } from '../utils/test-data-loader';

// Load comprehensive test packages
const testData = await TestDataLoader.loadComprehensiveTestPackages({
  validateOnLoad: true,
  filterByComplexity: ['simple', 'medium']
});

// Load specific survey by ID
const survey = await TestDataLoader.loadSurveyById('test-stakeholder-survey');

// Load surveys by category
const technicalSurveys = await TestDataLoader.loadSurveysByCategory('technical');
```

### Validation

```typescript
import { TestDataValidator } from '../fixtures/test-data-validation-schemas';

// Validate survey structure
const validationResult = TestDataValidator.validateSurvey(survey);
if (!validationResult.success) {
  console.error('Validation failed:', validationResult.error);
}

// Validate survey integrity
const integrityResult = TestDataValidator.validateSurveyIntegrity(survey);
if (!integrityResult.isValid) {
  console.error('Integrity check failed:', integrityResult.errors);
}
```

### Test Execution

```typescript
import { BundledTestUtilities } from '../utils/bundled-test-utilities';

// Execute comprehensive test suite
const results = await BundledTestUtilities.executeComprehensiveTestSuite({
  baseUrl: 'http://localhost:3000/api',
  environment: 'development'
});

// Execute all test suites
const allResults = await BundledTestUtilities.executeAllTestSuites();
console.log(`Overall success rate: ${allResults.overall.overallSuccessRate}%`);
```

## Test Coverage

### API Endpoints Covered

1. **Survey Metadata**
   - `GET /api/survey/{surveyId}`
   - Survey information retrieval
   - Metadata validation

2. **Stakeholder Management**
   - `GET /api/survey/{surveyId}/stakeholders`
   - Stakeholder list retrieval
   - Stakeholder-specific data

3. **Survey Steps**
   - `GET /api/survey/{surveyId}/step/{stepId}`
   - Step-by-step survey navigation
   - Question rendering

4. **Survey Submission**
   - `POST /api/survey/{surveyId}/step/{stepId}`
   - Response validation
   - Partial submissions

5. **Survey Completion**
   - `POST /api/survey/{surveyId}/complete`
   - Final submission
   - Result generation

6. **Progress Tracking**
   - `GET /api/survey/{surveyId}/progress`
   - Progress monitoring
   - State management

7. **Admin Endpoints**
   - `GET /api/admin/surveys`
   - `GET /api/admin/responses`
   - `GET /api/admin/results`

### Question Types Covered

1. **Text Questions**
   - Single-line text
   - Multi-line text
   - Validation rules (length, pattern)

2. **Multiple Choice Questions**
   - Single selection
   - Multiple options
   - Custom option validation

3. **Likert Scale Questions**
   - Various scale ranges (1-5, 1-7, 1-10)
   - Custom labels
   - Numeric validation

4. **Boolean Questions**
   - Yes/No responses
   - True/False validation

5. **Number Questions**
   - Integer validation
   - Range validation
   - Decimal support

### Validation Rules Covered

1. **Required Fields**
   - Missing required responses
   - Conditional requirements

2. **Length Validation**
   - Minimum length
   - Maximum length
   - Empty string handling

3. **Pattern Validation**
   - Email format
   - Custom regex patterns
   - Special characters

4. **Range Validation**
   - Numeric ranges
   - Date ranges
   - Scale boundaries

5. **Type Validation**
   - Data type checking
   - Format validation
   - Enum validation

## Configuration Options

### Test Data Loader Options

```typescript
interface TestDataLoaderOptions {
  validateOnLoad?: boolean;          // Validate data on load
  throwOnValidationError?: boolean;  // Throw on validation errors
  includeMetadata?: boolean;         // Include metadata in results
  filterByCategory?: string[];       // Filter by survey category
  filterByComplexity?: string[];     // Filter by complexity level
}
```

### Test Suite Configuration

```typescript
interface TestSuiteConfiguration {
  name: string;                      // Test suite name
  description: string;               // Test suite description
  baseUrl: string;                   // API base URL
  timeout: number;                   // Request timeout
  retries: number;                   // Retry attempts
  parallel: boolean;                 // Parallel execution
  tags: string[];                    // Test tags
  environment: string;               // Environment name
}
```

## Best Practices

### 1. Test Data Management

- Use validation schemas to ensure data integrity
- Organize tests by complexity and scenario
- Maintain backward compatibility with existing tests

### 2. Test Execution

- Run comprehensive tests before deployment
- Use performance tests for load validation
- Execute edge case tests for boundary conditions

### 3. Error Handling

- Test all error scenarios thoroughly
- Validate error response formats
- Check proper HTTP status codes

### 4. Performance Testing

- Establish baseline performance metrics
- Test under various load conditions
- Monitor resource usage during tests

## Integration with Existing Framework

### Compatibility

- Compatible with existing API testing framework (TSK-0015)
- Integrates with Vitest testing framework
- Supports existing test utilities and configurations

### Migration Path

1. **Existing Tests**: Continue using existing test packages
2. **New Tests**: Use new bundled test packages
3. **Gradual Migration**: Migrate tests incrementally

### Dependencies

- Zod for validation schemas
- Existing API client utilities
- Enhanced test utilities

## Test Scenarios by Category

### 1. Happy Path Scenarios

- Complete survey with all required fields
- Multi-stakeholder survey completion
- Progress tracking throughout survey
- Successful result generation

### 2. Edge Case Scenarios

- Single stakeholder surveys
- Unicode character handling
- Maximum field length testing
- Conditional logic evaluation

### 3. Error Scenarios

- Invalid survey IDs
- Missing required fields
- Authentication failures
- Server error conditions

### 4. Performance Scenarios

- Concurrent user testing
- Large data volume handling
- Response time measurement
- Resource usage monitoring

## Maintenance and Updates

### Adding New Test Cases

1. Create new survey data following existing schema
2. Add validation rules using Zod schemas
3. Update test utilities if needed
4. Document new test scenarios

### Updating Existing Tests

1. Maintain backward compatibility
2. Update validation schemas as needed
3. Preserve existing test scenarios
4. Update documentation

### Version Management

- Use semantic versioning for test packages
- Maintain compatibility metadata
- Document breaking changes
- Provide migration guides

## Troubleshooting

### Common Issues

1. **Validation Errors**
   - Check survey schema compliance
   - Verify stakeholder ID references
   - Validate question target stakeholders

2. **Test Execution Failures**
   - Verify API endpoint availability
   - Check network connectivity
   - Validate authentication tokens

3. **Performance Issues**
   - Monitor resource usage
   - Check concurrent request limits
   - Validate server capacity

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const testData = await TestDataLoader.loadComprehensiveTestPackages({
  validateOnLoad: true,
  throwOnValidationError: true // Enable for debugging
});
```

## Contributing

### Adding New Test Packages

1. Follow existing JSON structure
2. Use proper validation schemas
3. Include comprehensive documentation
4. Add test scenarios for new features

### Updating Documentation

1. Keep examples up to date
2. Document new configuration options
3. Update troubleshooting guides
4. Maintain API compatibility notes

## Conclusion

The bundled test survey JSON packages provide comprehensive coverage for all aspects of the Surveyor platform's API testing. They support various testing scenarios from simple validation to complex performance testing, ensuring robust and reliable API functionality.

For questions or support, refer to the existing API testing framework documentation or contact the development team.