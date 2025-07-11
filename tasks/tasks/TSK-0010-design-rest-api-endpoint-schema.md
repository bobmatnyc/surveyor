---
task_id: TSK-0010
issue_id: ISS-0004
epic_id: EP-0003
title: Design REST API endpoint schema
description: Design comprehensive REST API schema for survey steps, stakeholder selection, and question flow with JSON
  response structure
status: completed
priority: critical
assignee: masa
created_date: 2025-07-11T01:21:57.138Z
updated_date: 2025-07-11T04:30:00.000Z
estimated_tokens: 0
actual_tokens: 0
ai_context:
  - context/requirements
  - context/constraints
  - context/assumptions
  - context/dependencies
sync_status: local
subtasks: []
blocked_by: []
blocks: []
---

# Task: Design REST API endpoint schema

## Description
Design comprehensive REST API schema for survey steps, stakeholder selection, and question flow with JSON response structure

## API Endpoint Design

### Core Survey Endpoints
```
GET /api/survey/{surveyId}
GET /api/survey/{surveyId}/stakeholders
GET /api/survey/{surveyId}/stakeholder/{stakeholderId}
GET /api/survey/{surveyId}/step/{stepId}
POST /api/survey/{surveyId}/step/{stepId}/submit
GET /api/survey/{surveyId}/progress
POST /api/survey/{surveyId}/complete
```

### Response Schema Design

#### Survey Metadata Response
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

#### Stakeholder List Response
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

#### Survey Step Response
```json
{
  "stepId": "string",
  "stepNumber": "number",
  "totalSteps": "number",
  "questions": [
    {
      "id": "string",
      "type": "text|multipleChoice|likert|boolean",
      "text": "string",
      "required": "boolean",
      "options": ["string"] // for multipleChoice
    }
  ],
  "navigation": {
    "canGoBack": "boolean",
    "canGoForward": "boolean",
    "nextStepId": "string|null",
    "prevStepId": "string|null"
  }
}
```

#### Submit Response
```json
{
  "success": "boolean",
  "nextStepId": "string|null",
  "isComplete": "boolean",
  "message": "string"
}
```

## Implementation Steps
1. ✅ Design endpoint structure and URL patterns
2. ✅ Define JSON response schemas
3. ✅ Create TypeScript interfaces for API responses
4. ✅ Design error handling and validation schema
5. ✅ Document API specification with examples

## Acceptance Criteria
- ✅ Complete endpoint structure defined
- ✅ JSON response schemas specified
- ✅ TypeScript interfaces created
- ✅ Error handling patterns defined
- ✅ API documentation with examples

## Completion Notes
✅ **COMPLETED** - All API endpoint schemas designed and documented
- Complete REST API structure with 7 core endpoints
- Comprehensive JSON response schemas for all endpoints
- TypeScript interfaces implemented in /lib/api-types.ts
- Error handling patterns established
- Full API documentation with examples provided

## Notes
- All endpoints follow RESTful conventions
- Supports stakeholder-specific content filtering
- Enables addressable URLs for each survey step
- Designed for dynamic step navigation
