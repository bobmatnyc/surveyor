// Static survey data for immediate loading without API dependencies
import { SurveySchema, QuestionType } from './types';

export const demoSurvey: SurveySchema = {
  "id": "demo-survey-showcase",
  "name": "Platform Demo Survey",
  "description": "Demonstration of all available question types and platform features",
  "version": "1.0.0",
  "createdAt": new Date("2025-07-10T00:00:00.000Z"),
  "updatedAt": new Date("2025-07-10T00:00:00.000Z"),
  "isActive": true,
  "settings": {
    "allowMultipleResponses": true,
    "requireAllStakeholders": false,
    "showProgressBar": true,
    "allowNavigation": true,
    "customStyling": {
      "primaryColor": "#059669",
      "secondaryColor": "#047857",
      "logoUrl": "/logos/demo-logo.png"
    }
  },
  "stakeholders": [
    {
      "id": "manager",
      "name": "Manager/Executive",
      "description": "Leadership role with strategic oversight",
      "weight": 0.4,
      "color": "#dc2626",
      "requiredExpertise": ["strategy", "operations"]
    },
    {
      "id": "specialist",
      "name": "Subject Matter Expert",
      "description": "Expert with specialized knowledge in the topic area",
      "weight": 0.35,
      "color": "#2563eb",
      "requiredExpertise": ["technical", "expertise"]
    },
    {
      "id": "user",
      "name": "General User",
      "description": "Regular user with hands-on experience",
      "weight": 0.25,
      "color": "#059669",
      "requiredExpertise": ["user_experience"]
    }
  ],
  "domains": [
    {
      "id": "satisfaction",
      "name": "Satisfaction & Experience",
      "description": "Overall satisfaction and user experience",
      "weight": 0.3,
      "color": "#059669",
      "icon": "user"
    },
    {
      "id": "quality",
      "name": "Quality & Effectiveness",
      "description": "Quality, reliability, and effectiveness",
      "weight": 0.25,
      "color": "#2563eb",
      "icon": "zap"
    },
    {
      "id": "support",
      "name": "Support & Resources",
      "description": "Availability of support and resources",
      "weight": 0.25,
      "color": "#dc2626",
      "icon": "shield"
    },
    {
      "id": "value",
      "name": "Value & Impact",
      "description": "Overall value and positive impact",
      "weight": 0.2,
      "color": "#7c3aed",
      "icon": "link"
    }
  ],
  "questions": [
    {
      "id": "likert_5_example",
      "text": "How satisfied are you with the overall service quality?",
      "description": "This demonstrates a 5-point Likert scale for measuring satisfaction levels",
      "type": QuestionType.LIKERT_5,
      "domain": "quality",
      "targetStakeholders": ["manager", "specialist", "user"],
      "required": true,
      "options": [
        {
          "value": 1,
          "label": "Very Dissatisfied",
          "description": "Service significantly below expectations"
        },
        {
          "value": 2,
          "label": "Dissatisfied",
          "description": "Service causes frequent issues"
        },
        {
          "value": 3,
          "label": "Neutral",
          "description": "Service meets basic expectations"
        },
        {
          "value": 4,
          "label": "Satisfied",
          "description": "Service exceeds expectations"
        },
        {
          "value": 5,
          "label": "Very Satisfied",
          "description": "Service significantly exceeds expectations"
        }
      ]
    },
    {
      "id": "likert_3_example",
      "text": "How often do you encounter issues or problems?",
      "description": "This demonstrates a 3-point Likert scale for frequency assessment",
      "type": QuestionType.LIKERT_3,
      "domain": "quality",
      "targetStakeholders": ["user", "specialist"],
      "required": true,
      "options": [
        {
          "value": 1,
          "label": "Frequently",
          "description": "Multiple times per day"
        },
        {
          "value": 2,
          "label": "Occasionally",
          "description": "A few times per week"
        },
        {
          "value": 3,
          "label": "Rarely",
          "description": "Less than once per week"
        }
      ]
    },
    {
      "id": "multiple_choice_example",
      "text": "Which of the following features do you find most valuable? (Select all that apply)",
      "description": "This demonstrates multiple choice selection allowing multiple answers",
      "type": QuestionType.MULTIPLE_CHOICE,
      "domain": "satisfaction",
      "targetStakeholders": ["user", "manager"],
      "required": true,
      "options": [
        {
          "value": "communication",
          "label": "Communication Tools",
          "description": "Features that help with communication"
        },
        {
          "value": "organization",
          "label": "Organization & Planning",
          "description": "Features for organizing and planning activities"
        },
        {
          "value": "collaboration",
          "label": "Collaboration Features",
          "description": "Tools for working together with others"
        },
        {
          "value": "automation",
          "label": "Automation & Efficiency",
          "description": "Features that automate tasks and improve efficiency"
        },
        {
          "value": "analytics",
          "label": "Analytics & Reporting",
          "description": "Data analysis and reporting capabilities"
        },
        {
          "value": "customization",
          "label": "Customization Options",
          "description": "Ability to customize and personalize the experience"
        }
      ]
    },
    {
      "id": "single_select_example",
      "text": "What is your primary role in your organization?",
      "description": "This demonstrates single selection from multiple options",
      "type": QuestionType.SINGLE_SELECT,
      "domain": "value",
      "targetStakeholders": ["specialist", "user"],
      "required": true,
      "options": [
        {
          "value": "executive",
          "label": "Executive/Leadership",
          "description": "Senior leadership or executive role"
        },
        {
          "value": "management",
          "label": "Middle Management",
          "description": "Team lead or department manager"
        },
        {
          "value": "specialist",
          "label": "Subject Matter Expert",
          "description": "Expert in specific domain or field"
        },
        {
          "value": "contributor",
          "label": "Individual Contributor",
          "description": "Team member focused on specific tasks"
        },
        {
          "value": "other",
          "label": "Other",
          "description": "Another role not listed above"
        }
      ]
    },
    {
      "id": "text_input_example",
      "text": "What is the most significant challenge your organization faces in this area?",
      "description": "This demonstrates free-text input for detailed responses",
      "type": QuestionType.TEXT,
      "domain": "satisfaction",
      "targetStakeholders": ["manager", "specialist"],
      "required": true,
      "validation": {
        "minLength": 10,
        "maxLength": 500,
        "required": true
      }
    },
    {
      "id": "number_input_example",
      "text": "How many hours per week do you spend on this type of activity?",
      "description": "This demonstrates numeric input with validation",
      "type": QuestionType.NUMBER,
      "domain": "satisfaction",
      "targetStakeholders": ["user", "specialist", "manager"],
      "required": true,
      "validation": {
        "required": true
      }
    },
    {
      "id": "boolean_example",
      "text": "Do you have access to adequate support and resources?",
      "description": "This demonstrates yes/no boolean input",
      "type": QuestionType.BOOLEAN,
      "domain": "support",
      "targetStakeholders": ["user", "manager"],
      "required": true
    },
    {
      "id": "confidence_assessment_likert",
      "text": "How confident are you in your organization's current approach?",
      "description": "Confidence-focused Likert scale assessment",
      "type": QuestionType.LIKERT_5,
      "domain": "support",
      "targetStakeholders": ["manager", "specialist"],
      "required": true,
      "options": [
        {
          "value": 1,
          "label": "Not Confident",
          "description": "Significant concerns about current approach"
        },
        {
          "value": 2,
          "label": "Somewhat Confident",
          "description": "Basic measures are in place"
        },
        {
          "value": 3,
          "label": "Moderately Confident",
          "description": "Standard practices are followed"
        },
        {
          "value": 4,
          "label": "Very Confident",
          "description": "Strong framework is implemented"
        },
        {
          "value": 5,
          "label": "Extremely Confident",
          "description": "Excellent practices are in place"
        }
      ]
    },
    {
      "id": "organizational_challenges",
      "text": "Which challenges does your organization face? (Select all that apply)",
      "description": "Multiple choice for identifying organizational challenges",
      "type": QuestionType.MULTIPLE_CHOICE,
      "domain": "value",
      "targetStakeholders": ["specialist", "manager"],
      "required": false,
      "options": [
        {
          "value": "communication",
          "label": "Communication Issues",
          "description": "Challenges with internal and external communication"
        },
        {
          "value": "resource_constraints",
          "label": "Resource Limitations",
          "description": "Insufficient resources for optimal performance"
        },
        {
          "value": "process_inefficiency",
          "label": "Process Inefficiencies",
          "description": "Outdated or inefficient processes"
        },
        {
          "value": "coordination",
          "label": "Coordination Difficulties",
          "description": "Challenges coordinating between teams or departments"
        },
        {
          "value": "budget_constraints",
          "label": "Budget Constraints",
          "description": "Financial limitations affecting operations"
        },
        {
          "value": "skill_gaps",
          "label": "Skill Gaps",
          "description": "Lack of necessary expertise or training"
        }
      ]
    },
    {
      "id": "future_priorities",
      "text": "What should be your organization's top priority for improvement?",
      "description": "Single select for strategic planning",
      "type": QuestionType.SINGLE_SELECT,
      "domain": "value",
      "targetStakeholders": ["manager"],
      "required": true,
      "options": [
        {
          "value": "quality_improvement",
          "label": "Quality Improvement",
          "description": "Enhance overall quality and standards"
        },
        {
          "value": "user_experience",
          "label": "User Experience Enhancement",
          "description": "Improve user satisfaction and experience"
        },
        {
          "value": "process_optimization",
          "label": "Process Optimization",
          "description": "Streamline and improve processes"
        },
        {
          "value": "efficiency_improvement",
          "label": "Efficiency Enhancement",
          "description": "Increase operational efficiency"
        },
        {
          "value": "innovation",
          "label": "Innovation Initiatives",
          "description": "Implement new innovative approaches"
        },
        {
          "value": "training",
          "label": "Staff Development",
          "description": "Improve staff skills and capabilities"
        }
      ]
    }
  ],
  "scoring": {
    "method": "weighted_average",
    "stakeholderWeights": {
      "manager": 0.4,
      "specialist": 0.35,
      "user": 0.25
    },
    "domainWeights": {
      "satisfaction": 0.3,
      "quality": 0.25,
      "support": 0.25,
      "value": 0.2
    },
    "maturityLevels": [
      {
        "id": "basic",
        "name": "Basic",
        "description": "Basic level with room for improvement",
        "minScore": 1,
        "maxScore": 2.5,
        "color": "#dc2626",
        "recommendations": [
          "Focus on addressing critical gaps",
          "Invest in user training and support",
          "Establish basic protocols and procedures",
          "Create improvement roadmap"
        ]
      },
      {
        "id": "developing",
        "name": "Developing",
        "description": "Developing capabilities with strategic opportunities",
        "minScore": 2.51,
        "maxScore": 3.5,
        "color": "#ea580c",
        "recommendations": [
          "Enhance integration and coordination",
          "Implement advanced measures and protocols",
          "Develop staff skills and capabilities",
          "Optimize overall performance"
        ]
      },
      {
        "id": "advanced",
        "name": "Advanced",
        "description": "Advanced capabilities driving organizational success",
        "minScore": 3.51,
        "maxScore": 5,
        "color": "#059669",
        "recommendations": [
          "Lead innovation initiatives",
          "Share best practices with peers",
          "Explore emerging approaches",
          "Mentor other organizations"
        ]
      }
    ]
  }
};

// Array of available surveys for easy iteration
export const availableSurveys: SurveySchema[] = [demoSurvey];

// Simple function to get survey by ID
export function getSurveyById(id: string): SurveySchema | null {
  return availableSurveys.find(survey => survey.id === id) || null;
}

// Get all active surveys
export function getActiveSurveys(): SurveySchema[] {
  return availableSurveys.filter(survey => survey.isActive);
}