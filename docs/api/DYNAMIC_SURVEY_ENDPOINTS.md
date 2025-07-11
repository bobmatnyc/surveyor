# Dynamic Survey Step Endpoints

This document describes the REST API endpoints for dynamic survey steps, stakeholder selection, and survey flow management.

## Overview

The Dynamic Survey API provides endpoints for:
- Retrieving survey metadata
- Fetching stakeholder information
- Getting survey steps with stakeholder-specific filtering
- Submitting survey responses
- Tracking survey progress
- Completing surveys

All endpoints follow RESTful conventions and return JSON responses with consistent error handling.

## Base URL

```
/api/survey/{surveyId}
```

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Security Headers

All API responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`
- `Referrer-Policy: no-referrer`

## Endpoints

### 1. Get Survey Metadata

Retrieves basic information about a survey.

```
GET /api/survey/{surveyId}
```

**Parameters:**
- `surveyId` (string): Unique identifier for the survey

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "totalSteps": "number",
  "estimatedTimeMinutes": "number",
  "status": "active|completed|draft"
}
```

**Example:**
```bash
curl -X GET /api/survey/demo-survey-showcase
```

### 2. Get Stakeholders

Retrieves the list of stakeholders for a survey.

```
GET /api/survey/{surveyId}/stakeholders
```

**Parameters:**
- `surveyId` (string): Unique identifier for the survey

**Response:**
```json
{
  "stakeholders": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "color": "string",
      "expertise": ["string"]
    }
  ]
}
```

**Example:**
```bash
curl -X GET /api/survey/demo-survey-showcase/stakeholders
```

### 3. Get Specific Stakeholder

Retrieves information about a specific stakeholder.

```
GET /api/survey/{surveyId}/stakeholder/{stakeholderId}
```

**Parameters:**
- `surveyId` (string): Unique identifier for the survey
- `stakeholderId` (string): Unique identifier for the stakeholder

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "color": "string",
  "expertise": ["string"]
}
```

**Example:**
```bash
curl -X GET /api/survey/demo-survey-showcase/stakeholder/manager
```

### 4. Get Survey Step

Retrieves a specific survey step with stakeholder-specific content filtering.

```
GET /api/survey/{surveyId}/step/{stepId}?stakeholderId={stakeholderId}&organizationId={organizationId}
```

**Parameters:**
- `surveyId` (string): Unique identifier for the survey
- `stepId` (string): Step identifier (question ID or step number)
- `stakeholderId` (string, optional): Filter questions for specific stakeholder
- `organizationId` (string, optional): Organization context

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
      "required": "boolean",
      "options": ["string"],
      "scale": {
        "min": "number",
        "max": "number",
        "labels": ["string"]
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
  "organizationId": "string"
}
```

**Example:**
```bash
curl -X GET "/api/survey/demo-survey-showcase/step/q1?stakeholderId=manager&organizationId=test-org"
```

### 5. Submit Survey Step

Submits responses for a survey step.

```
POST /api/survey/{surveyId}/step/{stepId}
```

**Parameters:**
- `surveyId` (string): Unique identifier for the survey
- `stepId` (string): Step identifier

**Request Body:**
```json
{
  "responses": {
    "questionId": "any"
  },
  "stepId": "string",
  "stakeholderId": "string",
  "organizationId": "string"
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
  }
}
```

**Example:**
```bash
curl -X POST /api/survey/demo-survey-showcase/step/q1 \
  -H "Content-Type: application/json" \
  -d '{
    "responses": {"q1": 4},
    "stepId": "q1",
    "stakeholderId": "manager",
    "organizationId": "test-org"
  }'
```

### 6. Get Survey Progress

Retrieves progress information for a survey session.

```
GET /api/survey/{surveyId}/progress?stakeholderId={stakeholderId}&organizationId={organizationId}&currentStepId={currentStepId}
```

**Parameters:**
- `surveyId` (string): Unique identifier for the survey
- `stakeholderId` (string): Stakeholder identifier
- `organizationId` (string): Organization identifier
- `currentStepId` (string, optional): Current step identifier

**Response:**
```json
{
  "currentStepId": "string",
  "currentStepNumber": "number",
  "totalSteps": "number",
  "completedSteps": "number",
  "percentageComplete": "number",
  "stakeholderId": "string",
  "organizationId": "string"
}
```

**Example:**
```bash
curl -X GET "/api/survey/demo-survey-showcase/progress?stakeholderId=manager&organizationId=test-org&currentStepId=q2"
```

### 7. Complete Survey

Completes a survey and saves all responses.

```
POST /api/survey/{surveyId}/complete
```

**Parameters:**
- `surveyId` (string): Unique identifier for the survey

**Request Body:**
```json
{
  "stakeholderId": "string",
  "organizationId": "string",
  "respondentId": "string",
  "responses": {
    "questionId": "any"
  },
  "expertise": ["string"],
  "startTime": "string",
  "metadata": {
    "key": "value"
  }
}
```

**Response:**
```json
{
  "success": "boolean",
  "surveyId": "string",
  "completedAt": "string",
  "resultId": "string",
  "message": "string"
}
```

**Example:**
```bash
curl -X POST /api/survey/demo-survey-showcase/complete \
  -H "Content-Type: application/json" \
  -d '{
    "stakeholderId": "manager",
    "organizationId": "test-org",
    "respondentId": "user-123",
    "responses": {"q1": 4, "q2": "Manager"},
    "expertise": ["strategy"],
    "startTime": "2025-07-11T10:00:00.000Z",
    "metadata": {"userAgent": "Mozilla/5.0..."}
  }'
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": true,
  "message": "string",
  "code": "string",
  "details": {}
}
```

### Error Codes

- `INVALID_SURVEY_ID`: Survey ID is invalid or missing
- `INVALID_STEP_ID`: Step ID is invalid or missing
- `INVALID_STAKEHOLDER_ID`: Stakeholder ID is invalid or missing
- `INVALID_CONTENT_TYPE`: Request content type is not application/json
- `INVALID_JSON`: Request body contains invalid JSON
- `SURVEY_NOT_FOUND`: Survey does not exist
- `SURVEY_INACTIVE`: Survey is not active
- `STAKEHOLDER_NOT_FOUND`: Stakeholder does not exist
- `STEP_NOT_FOUND`: Step does not exist or not accessible to stakeholder
- `NO_QUESTIONS_FOUND`: No questions found for the specified stakeholder
- `MISSING_REQUIRED_FIELDS`: Required fields are missing from request
- `MISSING_REQUIRED_PARAMS`: Required query parameters are missing
- `MISSING_REQUIRED_RESPONSES`: Required question responses are missing
- `SAVE_ERROR`: Failed to save survey response
- `INTERNAL_ERROR`: Internal server error
- `NETWORK_ERROR`: Network request failed

## TypeScript Support

The API includes comprehensive TypeScript interfaces:

```typescript
import { SurveyApiClient, isSuccessResponse, isApiError } from '@/lib/api-client';

const client = new SurveyApiClient();

// Get survey metadata
const metadata = await client.getSurveyMetadata('demo-survey-showcase');
if (isSuccessResponse(metadata)) {
  console.log('Survey name:', metadata.name);
} else {
  console.error('Error:', metadata.message);
}
```

## Stakeholder-Specific Filtering

The API automatically filters questions based on the stakeholder:

1. When requesting a step with `stakeholderId`, only questions targeted to that stakeholder are returned
2. Step numbers and navigation are adjusted based on the filtered question set
3. Total steps count reflects the stakeholder-specific view
4. Progress tracking is stakeholder-aware

## Validation

### Request Validation

- All required fields are validated
- Question responses are validated against question types
- Text responses are validated against length requirements
- Number responses are validated for numeric values
- Boolean responses are validated for true/false values

### Response Validation

- All API responses conform to defined TypeScript interfaces
- Error responses include appropriate error codes and messages
- Success responses include all required fields

## Performance Considerations

- Responses include caching headers to prevent unnecessary requests
- Large survey schemas are efficiently filtered by stakeholder
- Step navigation is optimized for sequential access
- Error responses are lightweight and informative

## Testing

The API includes comprehensive test coverage:

- Unit tests for all endpoints
- Integration tests for complete survey flows
- Error handling tests for all error scenarios
- TypeScript type checking for all interfaces
- Mock data for consistent testing

## Usage Examples

### Complete Survey Flow

```javascript
import { SurveyApiClient, isSuccessResponse } from '@/lib/api-client';

const client = new SurveyApiClient();

// 1. Get survey metadata
const metadata = await client.getSurveyMetadata('demo-survey-showcase');
if (!isSuccessResponse(metadata)) {
  throw new Error('Failed to load survey');
}

// 2. Get stakeholders
const stakeholders = await client.getStakeholders('demo-survey-showcase');
if (!isSuccessResponse(stakeholders)) {
  throw new Error('Failed to load stakeholders');
}

// 3. Select stakeholder (user choice)
const selectedStakeholder = stakeholders.stakeholders[0];

// 4. Get first step
const step = await client.getSurveyStep(
  'demo-survey-showcase', 
  '1', 
  selectedStakeholder.id, 
  'org-123'
);
if (!isSuccessResponse(step)) {
  throw new Error('Failed to load first step');
}

// 5. Submit response
const submitResponse = await client.submitSurveyStep(
  'demo-survey-showcase', 
  step.stepId,
  {
    responses: { [step.questions[0].id]: 4 },
    stepId: step.stepId,
    stakeholderId: selectedStakeholder.id,
    organizationId: 'org-123'
  }
);

// 6. Continue until complete or complete survey
if (isSuccessResponse(submitResponse) && submitResponse.isComplete) {
  const completion = await client.completeSurvey('demo-survey-showcase', {
    stakeholderId: selectedStakeholder.id,
    organizationId: 'org-123',
    respondentId: 'user-456',
    responses: { /* all responses */ },
    expertise: selectedStakeholder.expertise,
    startTime: new Date().toISOString()
  });
  
  if (isSuccessResponse(completion)) {
    console.log('Survey completed!', completion.resultId);
  }
}
```

## Related Documentation

- [API Types Documentation](./API_TYPES.md)
- [Survey Data Architecture](../architecture/DATA_ARCHITECTURE_RESTRUCTURE.md)
- [Testing Framework](../testing/TESTING_FRAMEWORK.md)
- [Security Implementation](../security/SECURITY_IMPLEMENTATION.md)