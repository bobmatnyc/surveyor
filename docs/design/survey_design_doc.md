### 5. Universal Scoring Engine

#### Schema-Driven Scoring System
```typescript
// lib/scoring.ts
import { SurveySchema, SurveyResponse, SurveyResult, MaturityLevel } from './types';

export class UniversalScoringEngine {
  private schema: SurveySchema;
  
  constructor(schema: SurveySchema) {
    this.schema = schema;
  }

  calculateOrganizationScore(responses: SurveyResponse[]): SurveyResult {
    const { scoring } = this.schema;
    
    if (scoring.method === 'weighted_average') {
      return this.calculateWeightedScore(responses);
    } else if (scoring.method === 'custom' && scoring.customScoringFunction) {
      return this.executeCustomScoring(responses, scoring.customScoringFunction);
    }
    
    throw new Error(`Unsupported scoring method: ${scoring.method}`);
  }

  private calculateWeightedScore(responses: SurveyResponse[]): SurveyResult {
    const domainScores: Record<string, number> = {};
    const stakeholderContributions: Record<string, Record<string, number>> = {};
    
    // Initialize domain scores
    this.schema.domains.forEach(domain => {
      domainScores[domain.id] = 0;
      stakeholderContributions[domain.id] = {};
    });

    // Calculate domain scores for each stakeholder
    for (const response of responses) {
      const stakeholderWeight = this.schema.scoring.stakeholderWeights[response.stakeholder] || 0;
      
      if (stakeholderWeight === 0) continue;

      for (const domain of this.schema.domains) {
        const domainQuestions = this.schema.questions.filter(q => 
          q.domain === domain.id && 
          q.targetStakeholders.includes(response.stakeholder)
        );

        if (domainQuestions.length === 0) continue;

        let domainSum = 0;
        let questionCount = 0;

        for (const question of domainQuestions) {
          const answer = response.responses[question.id];
          if (answer !== undefined && answer !== null) {
            domainSum += Number(answer);
            questionCount++;
          }
        }

        if (questionCount > 0) {
          const avgScore = domainSum / questionCount;
          stakeholderContributions[domain.id][response.stakeholder] = avgScore * stakeholderWeight;
        }
      }
    }

    // Aggregate stakeholder contributions to domain scores
    for (const domain of this.schema.domains) {
      const contributions = Object.values(stakeholderContributions[domain.id]);
      const totalWeight = Object.keys(stakeholderContributions[domain.id])
        .reduce((sum, stakeholder) => {
          return sum + (this.schema.scoring.stakeholderWeights[stakeholder] || 0);
        }, 0);

      if (totalWeight > 0) {
        domainScores[domain.id] = contributions.reduce((sum, contrib) => sum + contrib, 0) / totalWeight;
      }
    }

    // Calculate overall score using domain weights
    let overallScore = 0;
    let totalDomainWeight = 0;

    for (const [domainId, score] of Object.entries(domainScores)) {
      const weight = this.schema.scoring.domainWeights[domainId] || 0;
      overallScore += score * weight;
      totalDomainWeight += weight;
    }

    if (totalDomainWeight > 0) {
      overallScore = overallScore / totalDomainWeight;
    }

    // Determine maturity level
    const maturityLevel = this.schema.scoring.maturityLevels.find(level => 
      overallScore >= level.minScore && overallScore <= level.maxScore
    ) || this.schema.scoring.maturityLevels[0];

    // Generate recommendations
    const recommendations = this.generateRecommendations(domainScores, maturityLevel);

    return {
      surveyId: this.schema.id,
      overallScore,
      domainScores,
      stakeholderContributions,
      maturityLevel,
      recommendations,
      completionDate: new Date(),
      responseCount: responses.length,
      stakeholderBreakdown: this.getStakeholderBreakdown(responses)
    };
  }

  private executeCustomScoring(responses: SurveyResponse[], customFunction: string): SurveyResult {
    try {
      // Create a safe execution context
      const context = {
        responses,
        schema: this.schema,
        Math,
        console: { log: () => {} }, // Disabled console for security
      };

      // Execute custom scoring function
      const func = new Function('context', `
        const { responses, schema, Math } = context;
        ${customFunction}
      `);

      return func(context);
    } catch (error) {
      console.error('Custom scoring function failed:', error);
      throw new Error('Custom scoring function execution# Generalized Multi-Stakeholder Survey Platform
## Technical Design Document

### Project Overview
Build a lightweight, performant survey platform that supports multiple surveys with configurable JSON schemas. The system features role-based question filtering, dynamic scoring, and administrative data management. Initially designed for the Jim Joseph Foundation's Technology Maturity Assessment, the platform supports any multi-stakeholder survey with custom scoring methodologies.

---

## Technology Stack

### Frontend Framework: **Next.js 14 (App Router)**
**Rationale:**
- Server-side rendering for optimal performance and SEO
- Built-in API routes for backend functionality
- Excellent TypeScript support
- Perfect Vercel integration with zero-config deployment
- Edge runtime support for global performance

### Core Technologies
- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand (lightweight alternative to Redux)
- **Forms:** React Hook Form + Zod validation
- **Data Storage:** Vercel Blob Storage
- **Authentication:** Next-Auth.js with custom provider
- **Animations:** Framer Motion (for progress indicators)

### Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "next-auth": "^4.24.0",
    "framer-motion": "^10.16.0",
    "@vercel/blob": "^0.15.0",
    "lucide-react": "^0.294.0",
    "recharts": "^2.8.0",
    "jspdf": "^2.5.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### Data Storage Strategy

#### Environment-Aware Storage
The platform uses a dual storage approach that automatically adapts to the deployment environment:

**Development Environment:**
- **File System Storage:** All survey schemas, responses, and results stored in `/data` directory
- **Structure:** Mirrors production blob structure for consistency
- **Benefits:** 
  - Fast local development without API limits
  - Easy debugging and data inspection
  - Version control friendly (can commit sample data)
  - No external dependencies for basic development

**Production Environment (Vercel):**
- **Vercel Blob Storage:** Serverless-native storage solution
- **Benefits:**
  - Automatically scales with usage
  - Edge-distributed for global performance
  - Integrated with Vercel's platform
  - Cost-effective for survey data volumes

#### Storage Directory Structure
```
Development (/data/):
data/
├── schemas/
│   ├── jim-joseph-tech-maturity-v1.json
│   ├── employee-satisfaction-v1.json
│   └── [survey-id].json
├── responses/
│   ├── [survey-id]/
│   │   ├── [organization-id]/
│   │   │   ├── [respondent-id].json
│   │   │   └── ...
│   │   └── ...
│   └── ...
└── results/
    ├── [survey-id]/
    │   ├── [organization-id]/
    │   │   └── result.json
    │   └── ...
    └── ...

Production (Vercel Blob):
schemas/[survey-id].json
responses/[survey-id]/[organization-id]/[respondent-id].json
results/[survey-id]/[organization-id]/result.json
```

---

## Application Architecture

### Project Structure
```
survey-platform/
├── app/
│   ├── (auth)/
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── login/
│   │       ├── dashboard/
│   │       └── surveys/
│   │           ├── create/
│   │           ├── edit/[id]/
│   │           └── [id]/
│   ├── survey/
│   │   ├── [surveyId]/
│   │   │   ├── [organizationId]/
│   │   │   │   ├── page.tsx
│   │   │   │   └── complete/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── surveys/
│   │   │   ├── [id]/
│   │   │   └── schema/
│   │   ├── responses/
│   │   └── admin/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── survey/
│   ├── admin/
│   ├── schema-builder/
│   └── shared/
├── lib/
│   ├── types.ts
│   ├── schema-validation.ts
│   ├── survey-engine.ts
│   ├── scoring.ts
│   ├── storage.ts
│   └── utils.ts
├── schemas/
│   ├── jim-joseph-tech-maturity.json
│   └── example-surveys/
├── public/
└── styles/
```

### Data Flow Architecture
```
User Input → React Hook Form → Zod Validation → Zustand Store → API Route → Vercel Blob → Admin Dashboard
```

---

## Core Features & Implementation

### 1. Survey Schema System

#### Survey Schema Structure
```typescript
// lib/types.ts
export interface SurveySchema {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  settings: SurveySettings;
  stakeholders: StakeholderDefinition[];
  domains: DomainDefinition[];
  questions: Question[];
  scoring: ScoringConfiguration;
}

export interface SurveySettings {
  allowMultipleResponses: boolean;
  requireAllStakeholders: boolean;
  showProgressBar: boolean;
  allowNavigation: boolean;
  timeLimit?: number; // minutes
  customStyling?: SurveyStyling;
}

export interface StakeholderDefinition {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1 for scoring weight
  color: string; // for UI theming
  requiredExpertise?: string[];
}

export interface DomainDefinition {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1 for scoring weight
  color: string;
  icon?: string;
}

export interface Question {
  id: string;
  text: string;
  description?: string;
  type: QuestionType;
  domain: string;
  targetStakeholders: string[];
  targetExpertise?: string[];
  required: boolean;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  conditional?: ConditionalLogic;
}

export enum QuestionType {
  LIKERT_5 = 'likert_5',
  LIKERT_3 = 'likert_3',
  MULTIPLE_CHOICE = 'multiple_choice',
  SINGLE_SELECT = 'single_select',
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean'
}

export interface ScoringConfiguration {
  method: 'weighted_average' | 'custom';
  stakeholderWeights: Record<string, number>;
  domainWeights: Record<string, number>;
  maturityLevels: MaturityLevel[];
  customScoringFunction?: string; // JavaScript function as string
}

export interface MaturityLevel {
  id: string;
  name: string;
  description: string;
  minScore: number;
  maxScore: number;
  color: string;
  recommendations: string[];
}
```

#### Jim Joseph Technology Maturity Schema
```json
// schemas/jim-joseph-tech-maturity.json
{
  "id": "jim-joseph-tech-maturity-v1",
  "name": "Technology Maturity Assessment",
  "description": "Comprehensive technology capacity assessment for Jewish nonprofit organizations",
  "version": "1.0.0",
  "createdAt": "2025-01-15T00:00:00Z",
  "updatedAt": "2025-01-15T00:00:00Z",
  "isActive": true,
  "settings": {
    "allowMultipleResponses": false,
    "requireAllStakeholders": true,
    "showProgressBar": true,
    "allowNavigation": true,
    "customStyling": {
      "primaryColor": "#2563eb",
      "secondaryColor": "#1e40af",
      "logoUrl": "/logos/jim-joseph-foundation.png"
    }
  },
  "stakeholders": [
    {
      "id": "ceo",
      "name": "CEO/Executive Director",
      "description": "Senior leadership responsible for organizational strategy",
      "weight": 0.35,
      "color": "#dc2626",
      "requiredExpertise": ["strategy", "governance"]
    },
    {
      "id": "tech_lead",
      "name": "Technology Lead",
      "description": "Person responsible for technology decisions and implementation",
      "weight": 0.30,
      "color": "#2563eb",
      "requiredExpertise": ["infrastructure", "data"]
    },
    {
      "id": "staff",
      "name": "Program/Operations Staff",
      "description": "Staff members who use technology daily",
      "weight": 0.25,
      "color": "#059669"
    },
    {
      "id": "board",
      "name": "Board Member",
      "description": "Board member with governance oversight",
      "weight": 0.10,
      "color": "#7c3aed",
      "requiredExpertise": ["governance"]
    }
  ],
  "domains": [
    {
      "id": "infrastructure",
      "name": "Infrastructure",
      "description": "Technology foundation, security, and system management",
      "weight": 0.25,
      "color": "#dc2626",
      "icon": "server"
    },
    {
      "id": "business_systems",
      "name": "Business Systems",
      "description": "Financial, HR, and operational management systems",
      "weight": 0.25,
      "color": "#2563eb",
      "icon": "building-2"
    },
    {
      "id": "data",
      "name": "Data Management",
      "description": "Data collection, analysis, and decision-making capabilities",
      "weight": 0.20,
      "color": "#059669",
      "icon": "database"
    },
    {
      "id": "program_tech",
      "name": "Program Technology",
      "description": "Technology integration in program delivery and client services",
      "weight": 0.15,
      "color": "#7c3aed",
      "icon": "users"
    },
    {
      "id": "culture",
      "name": "Technology Culture",
      "description": "Leadership, strategy, and organizational readiness for technology",
      "weight": 0.15,
      "color": "#ea580c",
      "icon": "heart"
    }
  ],
  "questions": [
    {
      "id": "infra_onboarding_ceo",
      "text": "How confident are you that new employees have the technology tools they need on day 1?",
      "description": "This assesses the maturity of technology onboarding processes",
      "type": "likert_5",
      "domain": "infrastructure",
      "targetStakeholders": ["ceo"],
      "required": true,
      "options": [
        { "value": 1, "label": "Not confident - each new hire is handled ad-hoc" },
        { "value": 2, "label": "Somewhat confident - we have basic equipment but setup takes time" },
        { "value": 3, "label": "Moderately confident - standard equipment with some delays" },
        { "value": 4, "label": "Confident - streamlined process with minimal delays" },
        { "value": 5, "label": "Very confident - automated provisioning, everything ready day 1" }
      ]
    },
    {
      "id": "infra_onboarding_tech",
      "text": "Do you have a documented, standardized technology onboarding process?",
      "type": "likert_5",
      "domain": "infrastructure",
      "targetStakeholders": ["tech_lead"],
      "required": true,
      "options": [
        { "value": 1, "label": "No documented process - everything is handled case-by-case" },
        { "value": 2, "label": "Basic documentation exists but not consistently followed" },
        { "value": 3, "label": "Standard process documented and mostly followed" },
        { "value": 4, "label": "Well-documented process with role-based provisioning" },
        { "value": 5, "label": "Fully automated onboarding with role-based access management" }
      ]
    }
  ],
  "scoring": {
    "method": "weighted_average",
    "stakeholderWeights": {
      "ceo": 0.35,
      "tech_lead": 0.30,
      "staff": 0.25,
      "board": 0.10
    },
    "domainWeights": {
      "infrastructure": 0.25,
      "business_systems": 0.25,
      "data": 0.20,
      "program_tech": 0.15,
      "culture": 0.15
    },
    "maturityLevels": [
      {
        "id": "building",
        "name": "Building",
        "description": "Foundational technology needs, requires significant capacity building",
        "minScore": 1.0,
        "maxScore": 2.3,
        "color": "#dc2626",
        "recommendations": [
          "Focus on establishing basic technology infrastructure",
          "Develop technology policies and procedures",
          "Invest in staff technology training",
          "Consider hiring technology consultant or part-time IT support"
        ]
      },
      {
        "id": "emerging",
        "name": "Emerging",
        "description": "Functional technology with growth opportunities",
        "minScore": 2.31,
        "maxScore": 3.6,
        "color": "#ea580c",
        "recommendations": [
          "Integrate systems for better data flow",
          "Develop technology strategy and roadmap",
          "Enhance staff technology skills",
          "Improve security and backup procedures"
        ]
      },
      {
        "id": "thriving",
        "name": "Thriving",
        "description": "Advanced technology capabilities driving mission success",
        "minScore": 3.61,
        "maxScore": 5.0,
        "color": "#059669",
        "recommendations": [
          "Lead technology innovation in the sector",
          "Share best practices with peer organizations",
          "Explore emerging technologies like AI",
          "Mentor other organizations in technology adoption"
        ]
      }
    ]
  }
}
```

#### Dynamic Survey Engine
```typescript
// lib/survey-engine.ts
export class SurveyEngine {
  private schema: SurveySchema;
  
  constructor(schema: SurveySchema) {
    this.schema = schema;
  }

  getQuestionsForStakeholder(
    stakeholderId: string, 
    expertise: string[] = []
  ): Question[] {
    return this.schema.questions.filter(question => {
      // Check if question targets this stakeholder
      const targetsStakeholder = question.targetStakeholders.includes(stakeholderId);
      
      // Check if question requires specific expertise
      const hasRequiredExpertise = !question.targetExpertise || 
        question.targetExpertise.some(exp => expertise.includes(exp));
      
      return targetsStakeholder && hasRequiredExpertise;
    });
  }

  calculateScore(responses: SurveyResponse[]): SurveyResult {
    const { scoring } = this.schema;
    
    if (scoring.method === 'weighted_average') {
      return this.calculateWeightedScore(responses);
    } else if (scoring.method === 'custom' && scoring.customScoringFunction) {
      return this.executeCustomScoring(responses, scoring.customScoringFunction);
    }
    
    throw new Error('Invalid scoring method');
  }

  private calculateWeightedScore(responses: SurveyResponse[]): SurveyResult {
    const domainScores: Record<string, number> = {};
    
    // Calculate domain scores
    for (const domain of this.schema.domains) {
      const domainQuestions = this.schema.questions.filter(q => q.domain === domain.id);
      const domainResponses = responses.filter(r => 
        domainQuestions.some(q => r.responses[q.id] !== undefined)
      );
      
      if (domainResponses.length === 0) continue;
      
      let weightedSum = 0;
      let totalWeight = 0;
      
      for (const response of domainResponses) {
        const stakeholderWeight = this.schema.scoring.stakeholderWeights[response.stakeholder] || 0;
        
        for (const question of domainQuestions) {
          const answer = response.responses[question.id];
          if (answer !== undefined) {
            weightedSum += answer * stakeholderWeight;
            totalWeight += stakeholderWeight;
          }
        }
      }
      
      domainScores[domain.id] = totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
    
    // Calculate overall score
    let overallScore = 0;
    for (const [domainId, score] of Object.entries(domainScores)) {
      const weight = this.schema.scoring.domainWeights[domainId] || 0;
      overallScore += score * weight;
    }
    
    // Determine maturity level
    const maturityLevel = this.schema.scoring.maturityLevels.find(level => 
      overallScore >= level.minScore && overallScore <= level.maxScore
    );
    
    return {
      overallScore,
      domainScores,
      maturityLevel: maturityLevel || this.schema.scoring.maturityLevels[0],
      recommendations: maturityLevel?.recommendations || [],
      completionDate: new Date()
    };
  }

  validateResponse(response: SurveyResponse): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check required questions
    const requiredQuestions = this.getQuestionsForStakeholder(response.stakeholder)
      .filter(q => q.required);
    
    for (const question of requiredQuestions) {
      if (response.responses[question.id] === undefined) {
        errors.push(`Question "${question.text}" is required but not answered`);
      }
    }
    
    // Validate question responses
    for (const [questionId, answer] of Object.entries(response.responses)) {
      const question = this.schema.questions.find(q => q.id === questionId);
      if (!question) continue;
      
      const validation = this.validateQuestionResponse(question, answer);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateQuestionResponse(question: Question, answer: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    switch (question.type) {
      case QuestionType.LIKERT_5:
        if (typeof answer !== 'number' || answer < 1 || answer > 5) {
          errors.push(`Answer must be between 1 and 5 for question: ${question.text}`);
        }
        break;
      case QuestionType.LIKERT_3:
        if (typeof answer !== 'number' || answer < 1 || answer > 3) {
          errors.push(`Answer must be between 1 and 3 for question: ${question.text}`);
        }
        break;
      case QuestionType.TEXT:
        if (question.validation?.minLength && answer.length < question.validation.minLength) {
          errors.push(`Answer too short for question: ${question.text}`);
        }
        break;
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }
}
```

### 2. Schema Management System

#### Survey Schema Builder
```typescript
// components/admin/SchemaBuilder.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SurveySchema, StakeholderDefinition, DomainDefinition, Question } from '@/lib/types';
import { QuestionBuilder } from './QuestionBuilder';
import { StakeholderEditor } from './StakeholderEditor';
import { DomainEditor } from './DomainEditor';
import { ScoringConfigEditor } from './ScoringConfigEditor';

export default function SchemaBuilder({ 
  initialSchema 
}: { 
  initialSchema?: SurveySchema 
}) {
  const [activeTab, setActiveTab] = useState<'basic' | 'stakeholders' | 'domains' | 'questions' | 'scoring'>('basic');
  const [schema, setSchema] = useState<Partial<SurveySchema>>(
    initialSchema || {
      name: '',
      description: '',
      version: '1.0.0',
      isActive: false,
      stakeholders: [],
      domains: [],
      questions: [],
      scoring: {
        method: 'weighted_average',
        stakeholderWeights: {},
        domainWeights: {},
        maturityLevels: []
      }
    }
  );

  const form = useForm({
    defaultValues: schema,
    mode: 'onChange'
  });

  const saveSchema = async () => {
    try {
      const response = await fetch('/api/surveys/schema', {
        method: initialSchema ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schema)
      });
      
      if (response.ok) {
        // Handle success
      }
    } catch (error) {
      console.error('Error saving schema:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'basic', label: 'Basic Info' },
              { id: 'stakeholders', label: 'Stakeholders' },
              { id: 'domains', label: 'Domains' },
              { id: 'questions', label: 'Questions' },
              { id: 'scoring', label: 'Scoring' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'basic' && (
            <BasicInfoEditor schema={schema} onChange={setSchema} form={form} />
          )}
          
          {activeTab === 'stakeholders' && (
            <StakeholderEditor 
              stakeholders={schema.stakeholders || []}
              onChange={(stakeholders) => setSchema({ ...schema, stakeholders })}
            />
          )}
          
          {activeTab === 'domains' && (
            <DomainEditor 
              domains={schema.domains || []}
              onChange={(domains) => setSchema({ ...schema, domains })}
            />
          )}
          
          {activeTab === 'questions' && (
            <QuestionBuilder 
              questions={schema.questions || []}
              stakeholders={schema.stakeholders || []}
              domains={schema.domains || []}
              onChange={(questions) => setSchema({ ...schema, questions })}
            />
          )}
          
          {activeTab === 'scoring' && (
            <ScoringConfigEditor 
              scoring={schema.scoring}
              stakeholders={schema.stakeholders || []}
              domains={schema.domains || []}
              onChange={(scoring) => setSchema({ ...schema, scoring })}
            />
          )}
        </div>

        {/* Save Button */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between">
            <button
              type="button"
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Preview Survey
            </button>
            <button
              onClick={saveSchema}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {initialSchema ? 'Update Schema' : 'Create Schema'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Survey Storage and Management (Environment-Aware)
```typescript
// lib/storage.ts
import { put, list, del } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';
import { SurveySchema, SurveyResponse, SurveyResult } from './types';

export class SurveyDataManager {
  private static instance: SurveyDataManager;
  private isProduction = process.env.NODE_ENV === 'production';
  private dataDir = path.join(process.cwd(), 'data');
  
  static getInstance(): SurveyDataManager {
    if (!SurveyDataManager.instance) {
      SurveyDataManager.instance = new SurveyDataManager();
    }
    return SurveyDataManager.instance;
  }

  constructor() {
    // Ensure data directory exists in development
    if (!this.isProduction) {
      this.ensureDataDirectories();
    }
  }

  private async ensureDataDirectories() {
    const dirs = [
      path.join(this.dataDir, 'schemas'),
      path.join(this.dataDir, 'responses'),
      path.join(this.dataDir, 'results')
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  // Schema Management
  async saveSchema(schema: SurveySchema): Promise<string> {
    const filename = `schemas/${schema.id}.json`;
    const data = JSON.stringify(schema, null, 2);

    if (this.isProduction) {
      const blob = await put(filename, data, {
        access: 'public',
        contentType: 'application/json',
      });
      return blob.url;
    } else {
      const filePath = path.join(this.dataDir, filename);
      await fs.writeFile(filePath, data, 'utf8');
      return `file://${filePath}`;
    }
  }

  async getSchema(schemaId: string): Promise<SurveySchema | null> {
    try {
      if (this.isProduction) {
        const { blobs } = await list({
          prefix: `schemas/${schemaId}.json`,
        });

        if (blobs.length === 0) return null;

        const response = await fetch(blobs[0].url);
        return response.json() as SurveySchema;
      } else {
        const filePath = path.join(this.dataDir, 'schemas', `${schemaId}.json`);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data) as SurveySchema;
      }
    } catch (error) {
      console.error('Error fetching schema:', error);
      return null;
    }
  }

  async listSchemas(): Promise<SurveySchema[]> {
    try {
      if (this.isProduction) {
        const { blobs } = await list({
          prefix: 'schemas/',
        });

        const schemas = await Promise.all(
          blobs.map(async (blob) => {
            const response = await fetch(blob.url);
            return response.json() as SurveySchema;
          })
        );

        return schemas.filter(schema => schema.isActive);
      } else {
        const schemasDir = path.join(this.dataDir, 'schemas');
        const files = await fs.readdir(schemasDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        const schemas = await Promise.all(
          jsonFiles.map(async (file) => {
            const filePath = path.join(schemasDir, file);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data) as SurveySchema;
          })
        );

        return schemas.filter(schema => schema.isActive);
      }
    } catch (error) {
      console.error('Error listing schemas:', error);
      return [];
    }
  }

  // Response Management
  async saveResponse(
    schemaId: string, 
    organizationId: string, 
    response: SurveyResponse
  ): Promise<string> {
    const filename = `responses/${schemaId}/${organizationId}/${response.respondentId}.json`;
    const data = JSON.stringify(response, null, 2);

    if (this.isProduction) {
      const blob = await put(filename, data, {
        access: 'public',
        contentType: 'application/json',
      });
      return blob.url;
    } else {
      const filePath = path.join(this.dataDir, filename);
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, data, 'utf8');
      return `file://${filePath}`;
    }
  }

  async getOrganizationResponses(
    schemaId: string, 
    organizationId: string
  ): Promise<SurveyResponse[]> {
    try {
      if (this.isProduction) {
        const { blobs } = await list({
          prefix: `responses/${schemaId}/${organizationId}/`,
        });

        const responses = await Promise.all(
          blobs.map(async (blob) => {
            const response = await fetch(blob.url);
            return response.json() as SurveyResponse;
          })
        );

        return responses;
      } else {
        const responseDir = path.join(this.dataDir, 'responses', schemaId, organizationId);
        
        try {
          const files = await fs.readdir(responseDir);
          const jsonFiles = files.filter(file => file.endsWith('.json'));

          const responses = await Promise.all(
            jsonFiles.map(async (file) => {
              const filePath = path.join(responseDir, file);
              const data = await fs.readFile(filePath, 'utf8');
              return JSON.parse(data) as SurveyResponse;
            })
          );

          return responses;
        } catch (error) {
          // Directory doesn't exist yet
          return [];
        }
      }
    } catch (error) {
      console.error('Error fetching organization responses:', error);
      return [];
    }
  }

  async getAllResponses(schemaId: string): Promise<SurveyResponse[]> {
    try {
      if (this.isProduction) {
        const { blobs } = await list({
          prefix: `responses/${schemaId}/`,
        });

        const responses = await Promise.all(
          blobs.map(async (blob) => {
            const response = await fetch(blob.url);
            return response.json() as SurveyResponse;
          })
        );

        return responses;
      } else {
        const responsesDir = path.join(this.dataDir, 'responses', schemaId);
        
        try {
          const organizations = await fs.readdir(responsesDir);
          const allResponses: SurveyResponse[] = [];

          for (const org of organizations) {
            const orgDir = path.join(responsesDir, org);
            const stat = await fs.stat(orgDir);
            
            if (stat.isDirectory()) {
              const files = await fs.readdir(orgDir);
              const jsonFiles = files.filter(file => file.endsWith('.json'));

              for (const file of jsonFiles) {
                const filePath = path.join(orgDir, file);
                const data = await fs.readFile(filePath, 'utf8');
                allResponses.push(JSON.parse(data) as SurveyResponse);
              }
            }
          }

          return allResponses;
        } catch (error) {
          // Directory doesn't exist yet
          return [];
        }
      }
    } catch (error) {
      console.error('Error fetching all responses:', error);
      return [];
    }
  }

  // Results Management
  async saveResult(
    schemaId: string, 
    organizationId: string, 
    result: SurveyResult
  ): Promise<string> {
    const filename = `results/${schemaId}/${organizationId}/result.json`;
    const data = JSON.stringify(result, null, 2);

    if (this.isProduction) {
      const blob = await put(filename, data, {
        access: 'public',
        contentType: 'application/json',
      });
      return blob.url;
    } else {
      const filePath = path.join(this.dataDir, filename);
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, data, 'utf8');
      return `file://${filePath}`;
    }
  }

  async getResult(
    schemaId: string, 
    organizationId: string
  ): Promise<SurveyResult | null> {
    try {
      if (this.isProduction) {
        const { blobs } = await list({
          prefix: `results/${schemaId}/${organizationId}/result.json`,
        });

        if (blobs.length === 0) return null;

        const response = await fetch(blobs[0].url);
        return response.json() as SurveyResult;
      } else {
        const filePath = path.join(this.dataDir, 'results', schemaId, organizationId, 'result.json');
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data) as SurveyResult;
      }
    } catch (error) {
      console.error('Error fetching result:', error);
      return null;
    }
  }

  // Development-only utilities
  async clearAllData(): Promise<void> {
    if (this.isProduction) {
      throw new Error('Cannot clear data in production environment');
    }

    try {
      await fs.rm(this.dataDir, { recursive: true, force: true });
      await this.ensureDataDirectories();
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  async exportDevData(): Promise<any> {
    if (this.isProduction) {
      throw new Error('Export not available in production');
    }

    try {
      const schemas = await this.listSchemas();
      const exportData: any = { schemas: {}, responses: {}, results: {} };

      for (const schema of schemas) {
        exportData.schemas[schema.id] = schema;
        exportData.responses[schema.id] = await this.getAllResponses(schema.id);
        
        // Get all results for this schema
        const responsesDir = path.join(this.dataDir, 'results', schema.id);
        try {
          const organizations = await fs.readdir(responsesDir);
          exportData.results[schema.id] = {};

          for (const org of organizations) {
            const result = await this.getResult(schema.id, org);
            if (result) {
              exportData.results[schema.id][org] = result;
            }
          }
        } catch (error) {
          // No results directory exists yet
          exportData.results[schema.id] = {};
        }
      }

      return exportData;
    } catch (error) {
      console.error('Error exporting dev data:', error);
      return null;
    }
  }
}
```

### 3. Universal Survey Interface

#### Schema-Driven Survey Component
```typescript
// components/survey/UniversalSurveyInterface.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { SurveyEngine } from '@/lib/survey-engine';
import { SurveySchema, SurveyResponse } from '@/lib/types';
import { ProgressBar } from './ProgressBar';
import { QuestionRenderer } from './QuestionRenderer';
import { NavigationButtons } from './NavigationButtons';

interface UniversalSurveyProps {
  schema: SurveySchema;
  organizationId: string;
  respondentId: string;
  onComplete: (response: SurveyResponse) => void;
}

export default function UniversalSurveyInterface({
  schema,
  organizationId,
  respondentId,
  onComplete
}: UniversalSurveyProps) {
  const [surveyEngine] = useState(() => new SurveyEngine(schema));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [stakeholder, setStakeholder] = useState<string>('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

  const form = useForm({
    mode: 'onChange'
  });

  useEffect(() => {
    if (stakeholder) {
      const questions = surveyEngine.getQuestionsForStakeholder(stakeholder, expertise);
      setFilteredQuestions(questions);
    }
  }, [stakeholder, expertise, surveyEngine]);

  const handleStakeholderSetup = (selectedStakeholder: string, selectedExpertise: string[]) => {
    setStakeholder(selectedStakeholder);
    setExpertise(selectedExpertise);
  };

  const saveResponse = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const nextQuestion = () => {
    if (currentQuestion < filteredQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Survey complete
      const finalResponse: SurveyResponse = {
        id: respondentId,
        surveyId: schema.id,
        organizationId,
        stakeholder,
        expertise,
        responses,
        startTime: new Date(), // Should be tracked from beginning
        completionTime: new Date(),
        progress: 100
      };

      onComplete(finalResponse);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const canProceed = () => {
    const question = filteredQuestions[currentQuestion];
    return question ? responses[question.id] !== undefined : false;
  };

  // Render stakeholder selection if not set
  if (!stakeholder) {
    return (
      <StakeholderSelection 
        schema={schema}
        onSelect={handleStakeholderSetup}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: schema.settings.customStyling?.backgroundColor || '#f8fafc' }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Custom branding */}
        {schema.settings.customStyling?.logoUrl && (
          <div className="text-center mb-8">
            <img 
              src={schema.settings.customStyling.logoUrl} 
              alt={schema.name}
              className="h-16 mx-auto"
            />
          </div>
        )}

        <ProgressBar 
          current={currentQuestion + 1} 
          total={filteredQuestions.length}
          surveyName={schema.name}
          primaryColor={schema.settings.customStyling?.primaryColor}
        />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {filteredQuestions[currentQuestion] && (
              <QuestionRenderer
                question={filteredQuestions[currentQuestion]}
                value={responses[filteredQuestions[currentQuestion].id]}
                onChange={(value) => saveResponse(filteredQuestions[currentQuestion].id, value)}
                schema={schema}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <NavigationButtons
          onNext={nextQuestion}
          onPrevious={previousQuestion}
          canProceed={canProceed()}
          isLastQuestion={currentQuestion === filteredQuestions.length - 1}
          allowNavigation={schema.settings.allowNavigation}
          primaryColor={schema.settings.customStyling?.primaryColor}
        />
      </div>
    </div>
  );
}
```

#### Question Renderer Component
```typescript
// components/survey/QuestionRenderer.tsx
import { Question, QuestionType, SurveySchema } from '@/lib/types';
import { LikertScale } from './questions/LikertScale';
import { MultipleChoice } from './questions/MultipleChoice';
import { TextInput } from './questions/TextInput';
import { NumberInput } from './questions/NumberInput';
import { BooleanInput } from './questions/BooleanInput';

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  schema: SurveySchema;
}

export function QuestionRenderer({ question, value, onChange, schema }: QuestionRendererProps) {
  const domain = schema.domains.find(d => d.id === question.domain);
  const primaryColor = schema.settings.customStyling?.primaryColor || '#2563eb';

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
      {/* Domain indicator */}
      {domain && (
        <div 
          className="inline-block px-3 py-1 rounded-full text-white text-sm font-medium mb-4"
          style={{ backgroundColor: domain.color }}
        >
          {domain.name}
        </div>
      )}

      {/* Question text */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-900">
        {question.text}
      </h2>

      {/* Question description */}
      {question.description && (
        <p className="text-gray-600 mb-6">
          {question.description}
        </p>
      )}

      {/* Question input based on type */}
      <div className="mt-6">
        {question.type === QuestionType.LIKERT_5 && (
          <LikertScale
            options={question.options || []}
            value={value}
            onChange={onChange}
            primaryColor={primaryColor}
          />
        )}

        {question.type === QuestionType.LIKERT_3 && (
          <LikertScale
            options={question.options || []}
            value={value}
            onChange={onChange}
            primaryColor={primaryColor}
          />
        )}

        {question.type === QuestionType.MULTIPLE_CHOICE && (
          <MultipleChoice
            options={question.options || []}
            value={value}
            onChange={onChange}
            primaryColor={primaryColor}
          />
        )}

        {question.type === QuestionType.SINGLE_SELECT && (
          <MultipleChoice
            options={question.options || []}
            value={value}
            onChange={onChange}
            multiple={false}
            primaryColor={primaryColor}
          />
        )}

        {question.type === QuestionType.TEXT && (
          <TextInput
            value={value}
            onChange={onChange}
            validation={question.validation}
            primaryColor={primaryColor}
          />
        )}

        {question.type === QuestionType.NUMBER && (
          <NumberInput
            value={value}
            onChange={onChange}
            validation={question.validation}
            primaryColor={primaryColor}
          />
        )}

        {question.type === QuestionType.BOOLEAN && (
          <BooleanInput
            value={value}
            onChange={onChange}
            primaryColor={primaryColor}
          />
        )}
      </div>

      {/* Required indicator */}
      {question.required && (
        <p className="text-sm text-red-600 mt-2">
          * This question is required
        </p>
      )}
    </div>
  );
}
```

### 4. Multi-Survey Admin Dashboard

#### Survey Management Interface
```typescript
// app/admin/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Eye, Edit, Trash2, Download, BarChart3 } from 'lucide-react';
import { SurveySchema, SurveyResponse } from '@/lib/types';
import { SurveyDataManager } from '@/lib/storage';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [surveys, setSurveys] = useState<SurveySchema[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSurveys();
  }, []);

  useEffect(() => {
    if (selectedSurvey) {
      loadResponses(selectedSurvey);
    }
  }, [selectedSurvey]);

  const loadSurveys = async () => {
    try {
      const data = await fetch('/api/surveys').then(r => r.json());
      setSurveys(data);
      if (data.length > 0) {
        setSelectedSurvey(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load surveys:', error);
    }
  };

  const loadResponses = async (surveyId: string) => {
    try {
      const data = await fetch(`/api/surveys/${surveyId}/responses`).then(r => r.json());
      setResponses(data);
    } catch (error) {
      console.error('Failed to load responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportSurveyData = async (surveyId: string, format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}/export?format=${format}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey-${surveyId}-results.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Access denied</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Survey Administration</h1>
          <a
            href="/admin/surveys/create"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            Create Survey
          </a>
        </div>

        {/* Survey Selection */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold">Select Survey</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys.map(survey => (
                <div
                  key={survey.id}
                  onClick={() => setSelectedSurvey(survey.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSurvey === survey.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">{survey.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{survey.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      survey.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {survey.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/admin/surveys/edit/${survey.id}`, '_blank');
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/survey/${survey.id}`, '_blank');
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Survey Analytics */}
        {selectedSurvey && (
          <>
            <SurveyStatsCards 
              surveyId={selectedSurvey} 
              responses={responses}
              survey={surveys.find(s => s.id === selectedSurvey)!}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Export Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Export Data</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => exportSurveyData(selectedSurvey, 'csv')}
                    className="w-full flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <Download size={16} />
                    Export CSV
                  </button>
                  <button
                    onClick={() => exportSurveyData(selectedSurvey, 'pdf')}
                    className="w-full flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    <Download size={16} />
                    Export PDF
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Responses</span>
                    <span className="font-semibold">{responses.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Organizations</span>
                    <span className="font-semibold">
                      {new Set(responses.map(r => r.organizationId)).size}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-semibold">
                      {responses.filter(r => r.completionTime).length / responses.length * 100}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-2">
                  {responses
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .slice(0, 5)
                    .map(response => (
                      <div key={response.id} className="text-sm">
                        <div className="font-medium">{response.organizationId}</div>
                        <div className="text-gray-600">
                          {response.stakeholder} • {new Date(response.startTime).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <OrganizationResponsesTable 
              surveyId={selectedSurvey}
              responses={responses} 
              onRefresh={() => loadResponses(selectedSurvey)} 
            />
          </>
        )}
      </div>
    </div>
  );
}
```

#### API Routes for Multi-Survey Support
```typescript
// app/api/surveys/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';
import { getServerSession } from 'next-auth/next';

const dataManager = SurveyDataManager.getInstance();

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const surveys = await dataManager.listSchemas();
    return NextResponse.json(surveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch surveys' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const schema = await request.json();
    schema.id = schema.id || `survey-${Date.now()}`;
    schema.createdAt = new Date().toISOString();
    schema.updatedAt = new Date().toISOString();
    
    const schemaUrl = await dataManager.saveSchema(schema);
    
    return NextResponse.json({
      success: true,
      schemaUrl,
      schema,
      message: 'Survey created successfully'
    });
  } catch (error) {
    console.error('Error creating survey:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create survey' },
      { status: 500 }
    );
  }
}

// app/api/surveys/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schema = await dataManager.getSchema(params.id);
    if (!schema) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(schema);
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json(
      { error: 'Failed to fetch survey' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const schema = await request.json();
    schema.id = params.id;
    schema.updatedAt = new Date().toISOString();
    
    const schemaUrl = await dataManager.saveSchema(schema);
    
    return NextResponse.json({
      success: true,
      schemaUrl,
      schema,
      message: 'Survey updated successfully'
    });
  } catch (error) {
    console.error('Error updating survey:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update survey' },
      { status: 500 }
    );
  }
}
```

### 3. Scoring Engine

#### Multi-Stakeholder Weighted Scoring
```typescript
// lib/scoring.ts
export interface ScoringWeights {
  stakeholder: {
    ceo: number;
    techLead: number;
    staff: number;
    board: number;
  };
  domain: {
    infrastructure: number;
    businessSystems: number;
    data: number;
    programTech: number;
    culture: number;
  };
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  stakeholder: {
    ceo: 0.35,
    techLead: 0.30,
    staff: 0.25,
    board: 0.10
  },
  domain: {
    infrastructure: 0.25,
    businessSystems: 0.25,
    data: 0.20,
    programTech: 0.15,
    culture: 0.15
  }
};

export function calculateOrganizationScore(
  responses: SurveyResponse[],
  weights: ScoringWeights = DEFAULT_WEIGHTS
): OrganizationScore {
  const domainScores = calculateDomainScores(responses, weights.stakeholder);
  
  const overallScore = Object.entries(domainScores).reduce(
    (total, [domain, score]) => {
      const weight = weights.domain[domain as keyof typeof weights.domain];
      return total + (score * weight);
    },
    0
  );

  return {
    overall: overallScore,
    domains: domainScores,
    maturityLevel: getMaturityLevel(overallScore),
    percentile: calculatePercentile(overallScore),
    recommendations: generateRecommendations(domainScores)
  };
}

export function getMaturityLevel(score: number): MaturityLevel {
  if (score < 2.3) return 'Building';
  if (score < 3.6) return 'Emerging';
  return 'Thriving';
}
```

### 4. Data Storage & Management

#### Vercel Blob Storage Integration
```typescript
// lib/storage.ts
import { put, list, del } from '@vercel/blob';

export class SurveyDataManager {
  private static instance: SurveyDataManager;
  
  static getInstance(): SurveyDataManager {
    if (!SurveyDataManager.instance) {
      SurveyDataManager.instance = new SurveyDataManager();
    }
    return SurveyDataManager.instance;
  }

  async saveResponse(response: SurveyResponse): Promise<string> {
    const filename = `responses/${response.organizationId}/${response.respondentId}.json`;
    
    const blob = await put(filename, JSON.stringify(response, null, 2), {
      access: 'public',
      contentType: 'application/json',
    });

    return blob.url;
  }

  async getOrganizationResponses(organizationId: string): Promise<SurveyResponse[]> {
    const { blobs } = await list({
      prefix: `responses/${organizationId}/`,
    });

    const responses = await Promise.all(
      blobs.map(async (blob) => {
        const response = await fetch(blob.url);
        return response.json() as SurveyResponse;
      })
    );

    return responses;
  }

  async getAllResponses(): Promise<SurveyResponse[]> {
    const { blobs } = await list({
      prefix: 'responses/',
    });

    const responses = await Promise.all(
      blobs.map(async (blob) => {
        const response = await fetch(blob.url);
        return response.json() as SurveyResponse;
      })
    );

    return responses;
  }

  async deleteResponse(organizationId: string, respondentId: string): Promise<void> {
    const filename = `responses/${organizationId}/${respondentId}.json`;
    await del(filename);
  }
}
```

#### API Routes
```typescript
// app/api/survey/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';
import { surveyResponseSchema } from '@/lib/validation';

const dataManager = SurveyDataManager.getInstance();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = surveyResponseSchema.parse(body);
    
    const responseUrl = await dataManager.saveResponse(validatedData);
    
    return NextResponse.json({
      success: true,
      responseUrl,
      message: 'Response saved successfully'
    });
  } catch (error) {
    console.error('Error saving response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save response' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const responses = await dataManager.getOrganizationResponses(params.id);
    return NextResponse.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}
```

### 5. Admin Dashboard

#### Authentication
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Admin Login',
      credentials: {
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (credentials?.password === process.env.ADMIN_PASSWORD) {
          return {
            id: 'admin',
            name: 'Admin User',
            email: 'admin@jimjoseph.org'
          };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: '/admin/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET
});

export { handler as GET, handler as POST };
```

#### Admin Dashboard Component
```typescript
// app/admin/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Download, Eye, Trash2, Filter } from 'lucide-react';
import { SurveyDataManager } from '@/lib/storage';
import { calculateOrganizationScore } from '@/lib/scoring';
import { exportToCSV, exportToPDF } from '@/lib/export';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      const data = await fetch('/api/admin/responses').then(r => r.json());
      setResponses(data);
    } catch (error) {
      console.error('Failed to load responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = (format: 'csv' | 'pdf') => {
    const organizationScores = groupResponsesByOrganization(responses)
      .map(org => calculateOrganizationScore(org.responses));

    if (format === 'csv') {
      exportToCSV(organizationScores, 'survey-results.csv');
    } else {
      exportToPDF(organizationScores, 'survey-results.pdf');
    }
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Access denied</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Survey Administration</h1>
          <div className="flex gap-4">
            <button
              onClick={() => exportData('csv')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={() => exportData('pdf')}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>

        <SurveyStatsCards responses={responses} />
        <OrganizationResponsesTable responses={responses} onRefresh={loadResponses} />
      </div>
    </div>
  );
}
```

### 6. State Management

#### Zustand Store
```typescript
// lib/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SurveyState {
  currentQuestion: number;
  responses: Record<string, number>;
  role: RespondentRole | null;
  expertise: ExpertiseArea[];
  organizationId: string;
  respondentId: string;
  startTime: Date;
  filteredQuestions: Question[];
  
  // Actions
  setRole: (role: RespondentRole) => void;
  setExpertise: (expertise: ExpertiseArea[]) => void;
  saveResponse: (questionId: string, value: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  setCurrentQuestion: (index: number) => void;
  reset: () => void;
  canProceed: () => boolean;
}

export const useSurveyStore = create<SurveyState>()(
  persist(
    (set, get) => ({
      currentQuestion: 0,
      responses: {},
      role: null,
      expertise: [],
      organizationId: '',
      respondentId: '',
      startTime: new Date(),
      filteredQuestions: [],

      setRole: (role) => {
        set({ role });
        const { expertise } = get();
        const filteredQuestions = getRelevantQuestions(role, expertise);
        set({ filteredQuestions });
      },

      setExpertise: (expertise) => {
        set({ expertise });
        const { role } = get();
        if (role) {
          const filteredQuestions = getRelevantQuestions(role, expertise);
          set({ filteredQuestions });
        }
      },

      saveResponse: (questionId, value) => {
        set((state) => ({
          responses: { ...state.responses, [questionId]: value }
        }));
      },

      nextQuestion: () => {
        const { currentQuestion, filteredQuestions } = get();
        if (currentQuestion < filteredQuestions.length - 1) {
          set({ currentQuestion: currentQuestion + 1 });
        }
      },

      previousQuestion: () => {
        const { currentQuestion } = get();
        if (currentQuestion > 0) {
          set({ currentQuestion: currentQuestion - 1 });
        }
      },

      setCurrentQuestion: (index) => set({ currentQuestion: index }),

      reset: () => set({
        currentQuestion: 0,
        responses: {},
        role: null,
        expertise: [],
        filteredQuestions: []
      }),

      canProceed: () => {
        const { currentQuestion, responses, filteredQuestions } = get();
        const currentQuestionId = filteredQuestions[currentQuestion]?.id;
        return currentQuestionId ? !!responses[currentQuestionId] : false;
      }
    }),
    {
      name: 'survey-storage',
      partialize: (state) => ({
        responses: state.responses,
        role: state.role,
        expertise: state.expertise,
        currentQuestion: state.currentQuestion,
        organizationId: state.organizationId,
        respondentId: state.respondentId,
        startTime: state.startTime
      })
    }
  )
);
```

---

## Performance Optimizations

### 1. Code Splitting & Lazy Loading
```typescript
// Lazy load heavy components
const AdminDashboard = dynamic(() => import('@/components/admin/Dashboard'), {
  ssr: false,
  loading: () => <div>Loading dashboard...</div>
});

const ResultsVisualization = dynamic(() => import('@/components/survey/ResultsViz'), {
  loading: () => <div>Loading results...</div>
});
```

### 2. Image Optimization
```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  experimental: {
    optimizeCss: true,
  }
};

module.exports = nextConfig;
```

### 3. API Route Optimization
```typescript
// Use edge runtime for faster responses
export const runtime = 'edge';

// Add response caching
export async function GET(request: NextRequest) {
  const response = NextResponse.json(data);
  response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  return response;
}
```

---

## Security Implementation

### Environment Variables
```bash
# .env.local
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-domain.vercel.app
ADMIN_PASSWORD=secure-admin-password
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

### Rate Limiting
```typescript
// lib/rateLimit.ts
import { NextRequest } from 'next/server';

const rateLimit = new Map();

export function checkRateLimit(request: NextRequest, limit = 10): boolean {
  const ip = request.ip || 'anonymous';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  const userData = rateLimit.get(ip);
  
  if (now > userData.resetTime) {
    userData.count = 1;
    userData.resetTime = now + windowMs;
    return true;
  }

  if (userData.count >= limit) {
    return false;
  }

  userData.count++;
  return true;
}
```

---

## Deployment Configuration

### Vercel Configuration
```json
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "framework": "nextjs",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "ADMIN_PASSWORD": "@admin_password",
    "BLOB_READ_WRITE_TOKEN": "@blob_token"
  }
}
```

### Build Optimization
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "analyze": "ANALYZE=true next build"
  }
}
```

---

## Testing Strategy

### Unit Tests
```typescript
// __tests__/scoring.test.ts
import { calculateOrganizationScore } from '@/lib/scoring';

describe('Scoring Engine', () => {
  test('calculates weighted scores correctly', () => {
    const mockResponses = [
      { role: 'ceo', responses: { 'q1': 4, 'q2': 5 } },
      { role: 'tech_lead', responses: { 'q1': 3, 'q2': 4 } }
    ];

    const result = calculateOrganizationScore(mockResponses);
    expect(result.overall).toBeGreaterThan(3);
    expect(result.maturityLevel).toBe('Emerging');
  });
});
```

### E2E Tests
```typescript
// cypress/e2e/survey-flow.cy.ts
describe('Survey Flow', () => {
  it('completes a full survey', () => {
    cy.visit('/survey/test-org');
    cy.selectRole('CEO');
    cy.selectExpertise(['strategy', 'governance']);
    cy.completeAllQuestions();
    cy.should('contain', 'Survey Complete');
  });
});
```

---

## Performance Metrics & Monitoring

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

### Monitoring Setup
```typescript
// lib/analytics.ts
export function trackSurveyProgress(questionIndex: number, totalQuestions: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'survey_progress', {
      question_index: questionIndex,
      total_questions: totalQuestions,
      progress_percentage: (questionIndex / totalQuestions) * 100
    });
  }
}

export function trackSurveyCompletion(organizationId: string, role: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'survey_complete', {
      organization_id: organizationId,
      respondent_role: role
    });
  }
}
```

---

## Launch Checklist

### Pre-Launch
- [ ] Set up Vercel project and environment variables
- [ ] Configure domain and SSL
- [ ] Test all survey flows with different roles
- [ ] Validate scoring calculations
- [ ] Test admin authentication and data export
- [ ] Run accessibility audit
- [ ] Performance audit with Lighthouse
- [ ] Security scan
- [ ] Mobile responsiveness testing

### Post-Launch
- [ ] Monitor Core Web Vitals
- [ ] Track survey completion rates
- [ ] Monitor error rates and API response times
- [ ] Regular backup verification
- [ ] Weekly admin dashboard review

---

## Estimated Timeline

- **Setup & Infrastructure:** 2 days
- **Core Survey Components:** 5 days
- **Scoring Engine:** 3 days
- **Admin Dashboard:** 4 days
- **Data Export Features:** 2 days
- **Testing & Polish:** 3 days
- **Deployment & QA:** 1 day

**Total Estimated Time:** 20 days (4 weeks for single developer)

---

## Future Enhancements

### Phase 2 Features
- Real-time collaboration for multi-stakeholder surveys
- Advanced analytics and trend analysis
- Integration with external benchmarking data
- Automated report generation
- Email notifications and reminders
- Multi-language support

### Technical Improvements
- GraphQL API for more efficient data fetching
- Offline survey capability with service workers
- Advanced caching strategies
- Microservices architecture for scalability