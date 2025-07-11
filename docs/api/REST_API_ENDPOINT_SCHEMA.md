# REST API Endpoint Schema for Dynamic Survey System

## Overview

This document defines the comprehensive REST API endpoint schema for the surveyor platform, supporting dynamic survey steps, stakeholder-specific content, and addressable URLs for each survey step.

## API Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://surveyor.vercel.app/api`

## Authentication & Security

All API endpoints implement:
- CSRF protection via security middleware
- Input validation and sanitization
- Rate limiting
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Audit logging for security events

## Core Survey Endpoints

### 1. Survey Metadata

#### Get Survey Metadata
```http
GET /api/survey/{surveyId}
```

**Parameters:**
- `surveyId` (path): Survey identifier

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "totalSteps": "number",
  "estimatedTimeMinutes": "number",
  "status": "active|completed|draft",
  "version": "string",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)",
  "settings": {
    "allowMultipleResponses": "boolean",
    "requireAllStakeholders": "boolean",
    "showProgressBar": "boolean",
    "allowNavigation": "boolean",
    "timeLimit": "number|null",
    "customStyling": {
      "primaryColor": "string",
      "secondaryColor": "string",
      "backgroundColor": "string",
      "logoUrl": "string",
      "fontFamily": "string"
    }
  }
}
```

**Error Responses:**
- `404`: Survey not found
- `403`: Survey access denied
- `500`: Internal server error

### 2. Stakeholder Management

#### Get Stakeholder List
```http
GET /api/survey/{surveyId}/stakeholders
```

**Response:**
```json
{
  "stakeholders": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "color": "string (hex color)",
      "expertise": ["string"],
      "weight": "number (0-1)",
      "requiredExpertise": ["string"]
    }
  ]
}
```

#### Get Specific Stakeholder
```http
GET /api/survey/{surveyId}/stakeholder/{stakeholderId}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "color": "string",
  "expertise": ["string"],
  "weight": "number",
  "requiredExpertise": ["string"],
  "availableQuestions": ["string"],
  "totalQuestions": "number",
  "estimatedTimeMinutes": "number"
}
```

### 3. Dynamic Survey Steps

#### Get Survey Step Data
```http
GET /api/survey/{surveyId}/step/{stepId}
```

**Query Parameters:**
- `stakeholderId` (required): Filter questions for specific stakeholder
- `organizationId` (required): Organization context
- `expertise` (optional): Comma-separated expertise areas for additional filtering

**Response:**
```json
{
  "stepId": "string",
  "stepNumber": "number",
  "totalSteps": "number",
  "questions": [
    {
      "id": "string",
      "type": "text|multipleChoice|likert|boolean|number",
      "text": "string",
      "description": "string",
      "required": "boolean",
      "domain": "string",
      "options": ["string"],
      "scale": {
        "min": "number",
        "max": "number",
        "labels": ["string"]
      },
      "validation": {
        "minLength": "number",
        "maxLength": "number",
        "pattern": "string",
        "required": "boolean"
      },
      "conditional": {
        "dependsOn": "string",
        "condition": "equals|not_equals|greater_than|less_than",
        "value": "any"
      }
    }
  ],
  "navigation": {
    "canGoBack": "boolean",
    "canGoForward": "boolean",
    "nextStepId": "string|null",
    "prevStepId": "string|null"
  },
  "stakeholderId": "string",
  "organizationId": "string",
  "progress": {
    "currentStep": "number",
    "totalSteps": "number",
    "percentageComplete": "number"
  }
}
```

#### Submit Survey Step
```http
POST /api/survey/{surveyId}/step/{stepId}/submit
```

**Request Body:**
```json
{
  "responses": {
    "questionId": "any"
  },
  "stepId": "string",
  "stakeholderId": "string",
  "organizationId": "string",
  "partialSubmission": "boolean",
  "timestamp": "string (ISO 8601)"
}
```

**Response:**
```json
{
  "success": "boolean",
  "nextStepId": "string|null",
  "isComplete": "boolean",
  "message": "string",
  "errors": {
    "questionId": "string"
  },
  "validationResults": {
    "questionId": {
      "isValid": "boolean",
      "errors": ["string"],
      "warnings": ["string"]
    }
  }
}
```

### 4. Survey Progress & Navigation

#### Get Survey Progress
```http
GET /api/survey/{surveyId}/progress
```

**Query Parameters:**
- `stakeholderId` (required)
- `organizationId` (required)

**Response:**
```json
{
  "currentStepId": "string",
  "currentStepNumber": "number",
  "totalSteps": "number",
  "completedSteps": "number",
  "percentageComplete": "number",
  "stakeholderId": "string",
  "organizationId": "string",
  "lastActivityAt": "string (ISO 8601)",
  "estimatedTimeRemaining": "number (minutes)",
  "completedQuestions": ["string"],
  "totalQuestions": "number"
}
```

#### Get Navigation Options
```http
GET /api/survey/{surveyId}/navigation
```

**Query Parameters:**
- `stakeholderId` (required)
- `organizationId` (required)
- `currentStepId` (optional)

**Response:**
```json
{
  "availableSteps": [
    {
      "stepId": "string",
      "stepNumber": "number",
      "title": "string",
      "isAccessible": "boolean",
      "isCompleted": "boolean",
      "questionCount": "number"
    }
  ],
  "currentStepId": "string",
  "canNavigateBack": "boolean",
  "canNavigateForward": "boolean",
  "nextStepId": "string|null",
  "prevStepId": "string|null"
}
```

### 5. Survey Completion

#### Complete Survey
```http
POST /api/survey/{surveyId}/complete
```

**Request Body:**
```json
{
  "stakeholderId": "string",
  "organizationId": "string",
  "finalResponses": {
    "questionId": "any"
  },
  "completionTimestamp": "string (ISO 8601)"
}
```

**Response:**
```json
{
  "success": "boolean",
  "surveyId": "string",
  "completedAt": "string (ISO 8601)",
  "resultId": "string",
  "message": "string",
  "summary": {
    "totalQuestions": "number",
    "answeredQuestions": "number",
    "completionRate": "number",
    "timeSpent": "number (minutes)"
  },
  "nextSteps": {
    "resultsUrl": "string",
    "canTakeAnother": "boolean",
    "shareable": "boolean"
  }
}
```

### 6. Survey State Management

#### Save Survey State (Partial Responses)
```http
POST /api/survey/{surveyId}/state
```

**Request Body:**
```json
{
  "stakeholderId": "string",
  "organizationId": "string",
  "currentStepId": "string",
  "responses": {
    "questionId": "any"
  },
  "timestamp": "string (ISO 8601)"
}
```

**Response:**
```json
{
  "success": "boolean",
  "message": "string",
  "savedAt": "string (ISO 8601)",
  "stateId": "string"
}
```

#### Load Survey State
```http
GET /api/survey/{surveyId}/state
```

**Query Parameters:**
- `stakeholderId` (required)
- `organizationId` (required)

**Response:**
```json
{
  "stateId": "string",
  "currentStepId": "string",
  "responses": {
    "questionId": "any"
  },
  "lastSavedAt": "string (ISO 8601)",
  "progress": {
    "currentStep": "number",
    "totalSteps": "number",
    "percentageComplete": "number"
  }
}
```

## Admin Endpoints

### 1. Survey Management

#### List Surveys
```http
GET /api/admin/surveys
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status
- `search` (optional): Search term

**Response:**
```json
{
  "surveys": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "status": "active|completed|draft",
      "createdAt": "string",
      "updatedAt": "string",
      "responseCount": "number",
      "completionRate": "number"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number",
  "totalPages": "number"
}
```

#### Create Survey
```http
POST /api/admin/surveys
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "stakeholders": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "color": "string",
      "expertise": ["string"],
      "weight": "number"
    }
  ],
  "questions": [
    {
      "id": "string",
      "type": "text|multipleChoice|likert|boolean|number",
      "text": "string",
      "description": "string",
      "required": "boolean",
      "domain": "string",
      "targetStakeholders": ["string"],
      "options": ["string"],
      "scale": {
        "min": "number",
        "max": "number",
        "labels": ["string"]
      }
    }
  ],
  "settings": {
    "allowMultipleResponses": "boolean",
    "requireAllStakeholders": "boolean",
    "showProgressBar": "boolean",
    "allowNavigation": "boolean",
    "timeLimit": "number"
  }
}
```

#### Get Survey Details
```http
GET /api/admin/surveys/{surveyId}
```

#### Update Survey
```http
PUT /api/admin/surveys/{surveyId}
```

#### Delete Survey
```http
DELETE /api/admin/surveys/{surveyId}
```

### 2. Response Management

#### Get Survey Responses
```http
GET /api/admin/surveys/{surveyId}/responses
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `stakeholderId` (optional): Filter by stakeholder
- `organizationId` (optional): Filter by organization
- `status` (optional): Filter by completion status

**Response:**
```json
{
  "responses": [
    {
      "id": "string",
      "surveyId": "string",
      "organizationId": "string",
      "stakeholderId": "string",
      "responses": {
        "questionId": "any"
      },
      "startTime": "string (ISO 8601)",
      "completionTime": "string (ISO 8601)",
      "progress": "number",
      "isComplete": "boolean"
    }
  ],
  "total": "number",
  "organizationCounts": {
    "organizationId": "number"
  },
  "stakeholderCounts": {
    "stakeholderId": "number"
  },
  "completionRate": "number"
}
```

#### Get Individual Response
```http
GET /api/admin/surveys/{surveyId}/responses/{responseId}
```

#### Get Partial Responses
```http
GET /api/admin/surveys/{surveyId}/responses/partial
```

### 3. Results & Analytics

#### Get Survey Results
```http
GET /api/admin/surveys/{surveyId}/results
```

**Response:**
```json
{
  "results": [
    {
      "surveyId": "string",
      "organizationId": "string",
      "overallScore": "number",
      "domainScores": {
        "domainId": "number"
      },
      "stakeholderContributions": {
        "stakeholderId": {
          "domainId": "number"
        }
      },
      "maturityLevel": {
        "id": "string",
        "name": "string",
        "description": "string",
        "minScore": "number",
        "maxScore": "number",
        "color": "string"
      },
      "recommendations": ["string"],
      "completionDate": "string (ISO 8601)",
      "responseCount": "number"
    }
  ],
  "aggregatedMetrics": {
    "averageScore": "number",
    "completionRate": "number",
    "participationByStakeholder": {
      "stakeholderId": "number"
    },
    "domainAverages": {
      "domainId": "number"
    }
  }
}
```

## Distribution Endpoints

### 1. Distribution Management

#### Get Distribution Info
```http
GET /api/distribution/{distributionCode}
```

**Response:**
```json
{
  "surveyId": "string",
  "organizationId": "string",
  "distributionCode": "string",
  "isActive": "boolean",
  "expiresAt": "string (ISO 8601)",
  "allowedStakeholders": ["string"],
  "metadata": {
    "surveyName": "string",
    "description": "string",
    "estimatedTime": "number"
  }
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "error": true,
  "message": "string",
  "code": "string",
  "details": {
    "field": "string",
    "value": "any",
    "constraint": "string"
  },
  "timestamp": "string (ISO 8601)",
  "requestId": "string"
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `SURVEY_NOT_FOUND`: Survey does not exist
- `STAKEHOLDER_NOT_FOUND`: Stakeholder not found
- `STEP_NOT_FOUND`: Survey step not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Access denied
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## URL Structure & Routing

### Addressable Survey URLs
- **Survey Start**: `/survey/{distributionCode}`
- **Stakeholder Selection**: `/survey/{distributionCode}/stakeholder`
- **Survey Step**: `/survey/{distributionCode}/step/{stepId}`
- **Survey Complete**: `/survey/{distributionCode}/complete`
- **Survey Results**: `/survey/{distributionCode}/results`

### Admin URLs
- **Survey Management**: `/admin/surveys`
- **Response Review**: `/admin/surveys/{surveyId}/responses`
- **Results Dashboard**: `/admin/surveys/{surveyId}/results`

## API Client Integration

### Request Headers
All API requests should include:
```http
Content-Type: application/json
X-Requested-With: XMLHttpRequest
X-CSRF-Token: {token}
```

### Response Headers
All API responses include:
```http
Content-Type: application/json
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Cache-Control: no-store, no-cache, must-revalidate
```

## TypeScript Integration

The API endpoints are fully typed using the interfaces defined in:
- `/lib/api-types.ts`: API request/response types
- `/lib/types.ts`: Core domain types

Example usage:
```typescript
import { SurveyStepResponse, SurveyStepSubmitRequest } from '@/lib/api-types';

const response: SurveyStepResponse = await fetch('/api/survey/123/step/1')
  .then(res => res.json());
```

## Testing

Comprehensive test coverage is provided in:
- `/tests/api/survey-endpoints.test.ts`: API endpoint tests
- `/tests/fixtures/survey-test-packages.json`: Test data packages
- `/tests/utils/api-test-utils.ts`: Testing utilities

The API schema supports:
- Happy path testing
- Error condition testing
- Edge case testing
- Performance testing
- Security testing

## Implementation Notes

1. **Security**: All endpoints implement comprehensive security measures including input validation, CSRF protection, and audit logging.

2. **Performance**: Responses are optimized for minimal payload size while maintaining complete functionality.

3. **Scalability**: The API design supports horizontal scaling and caching strategies.

4. **Extensibility**: The schema is designed to accommodate future enhancements without breaking existing integrations.

5. **Documentation**: All endpoints are self-documenting through comprehensive TypeScript interfaces and test coverage.

This REST API endpoint schema provides a complete foundation for the dynamic survey platform, supporting all required functionality while maintaining security, performance, and extensibility.