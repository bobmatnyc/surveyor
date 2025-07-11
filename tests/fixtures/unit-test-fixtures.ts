// Comprehensive test fixtures for unit tests
export const unitTestFixtures = {
  // Survey fixtures
  surveys: {
    minimal: {
      id: 'minimal-survey',
      title: 'Minimal Test Survey',
      description: 'A minimal survey for testing',
      questions: [
        {
          id: 'q1',
          type: 'text',
          title: 'What is your name?',
          isRequired: true,
        },
      ],
      stakeholders: [
        {
          id: 'user',
          name: 'User',
          description: 'General user',
          expertise: [],
        },
      ],
    },
    
    comprehensive: {
      id: 'comprehensive-survey',
      title: 'Comprehensive Test Survey',
      description: 'A comprehensive survey with all question types',
      questions: [
        {
          id: 'q1',
          type: 'text',
          title: 'What is your primary challenge?',
          isRequired: true,
          placeholder: 'Enter your challenge...',
        },
        {
          id: 'q2',
          type: 'rating',
          title: 'How would you rate your experience?',
          isRequired: true,
          rateMin: 1,
          rateMax: 5,
          rateStep: 1,
          minRateDescription: 'Poor',
          maxRateDescription: 'Excellent',
        },
        {
          id: 'q3',
          type: 'radiogroup',
          title: 'What is your role?',
          isRequired: true,
          choices: [
            { value: 'developer', text: 'Developer' },
            { value: 'manager', text: 'Manager' },
            { value: 'designer', text: 'Designer' },
            { value: 'other', text: 'Other' },
          ],
        },
        {
          id: 'q4',
          type: 'checkbox',
          title: 'Which technologies do you use?',
          isRequired: false,
          choices: [
            { value: 'react', text: 'React' },
            { value: 'vue', text: 'Vue' },
            { value: 'angular', text: 'Angular' },
            { value: 'svelte', text: 'Svelte' },
          ],
        },
        {
          id: 'q5',
          type: 'boolean',
          title: 'Do you enjoy your work?',
          isRequired: true,
        },
        {
          id: 'q6',
          type: 'dropdown',
          title: 'What is your experience level?',
          isRequired: true,
          choices: [
            { value: 'beginner', text: 'Beginner (0-2 years)' },
            { value: 'intermediate', text: 'Intermediate (3-5 years)' },
            { value: 'advanced', text: 'Advanced (6-10 years)' },
            { value: 'expert', text: 'Expert (10+ years)' },
          ],
        },
        {
          id: 'q7',
          type: 'comment',
          title: 'Any additional comments?',
          isRequired: false,
          placeholder: 'Enter your comments...',
          maxLength: 1000,
        },
      ],
      stakeholders: [
        {
          id: 'ceo',
          name: 'CEO',
          description: 'Chief Executive Officer',
          expertise: ['leadership', 'strategy', 'vision'],
        },
        {
          id: 'cto',
          name: 'CTO',
          description: 'Chief Technology Officer',
          expertise: ['technology', 'architecture', 'innovation'],
        },
        {
          id: 'pm',
          name: 'Product Manager',
          description: 'Product Manager',
          expertise: ['product', 'roadmap', 'requirements'],
        },
        {
          id: 'dev',
          name: 'Developer',
          description: 'Software Developer',
          expertise: ['coding', 'implementation', 'testing'],
        },
      ],
    },
    
    maturityAssessment: {
      id: 'maturity-assessment',
      title: 'Technology Maturity Assessment',
      description: 'Assess the technology maturity of your organization',
      questions: [
        {
          id: 'infra_maturity',
          type: 'matrix',
          title: 'Rate your infrastructure maturity',
          isRequired: true,
          columns: [
            { value: 1, text: 'Initial' },
            { value: 2, text: 'Developing' },
            { value: 3, text: 'Defined' },
            { value: 4, text: 'Managed' },
            { value: 5, text: 'Optimized' },
          ],
          rows: [
            { value: 'servers', text: 'Server Management' },
            { value: 'networks', text: 'Network Infrastructure' },
            { value: 'security', text: 'Security Practices' },
            { value: 'backup', text: 'Backup & Recovery' },
            { value: 'monitoring', text: 'Monitoring & Alerting' },
          ],
        },
        {
          id: 'dev_practices',
          type: 'matrix',
          title: 'Rate your development practices',
          isRequired: true,
          columns: [
            { value: 1, text: 'Initial' },
            { value: 2, text: 'Developing' },
            { value: 3, text: 'Defined' },
            { value: 4, text: 'Managed' },
            { value: 5, text: 'Optimized' },
          ],
          rows: [
            { value: 'version_control', text: 'Version Control' },
            { value: 'testing', text: 'Testing Practices' },
            { value: 'cicd', text: 'CI/CD Pipeline' },
            { value: 'code_review', text: 'Code Review Process' },
            { value: 'documentation', text: 'Documentation' },
          ],
        },
      ],
      stakeholders: [
        {
          id: 'tech_lead',
          name: 'Tech Lead',
          description: 'Technical Team Lead',
          expertise: ['architecture', 'team_leadership', 'technical_strategy'],
        },
        {
          id: 'dev_ops',
          name: 'DevOps Engineer',
          description: 'DevOps Engineer',
          expertise: ['infrastructure', 'deployment', 'monitoring'],
        },
        {
          id: 'qa_lead',
          name: 'QA Lead',
          description: 'Quality Assurance Lead',
          expertise: ['testing', 'quality_processes', 'automation'],
        },
      ],
    },
  },
  
  // User fixtures
  users: {
    admin: {
      id: 'admin-user',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'manage_users'],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    
    regularUser: {
      id: 'regular-user',
      name: 'Regular User',
      email: 'user@example.com',
      role: 'user',
      permissions: ['read'],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    
    moderator: {
      id: 'moderator-user',
      name: 'Moderator User',
      email: 'moderator@example.com',
      role: 'moderator',
      permissions: ['read', 'write', 'moderate'],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
  },
  
  // Organization fixtures
  organizations: {
    startup: {
      id: 'startup-org',
      name: 'Startup Inc.',
      description: 'A fast-growing startup',
      size: 'small',
      industry: 'technology',
      founded: '2020',
      employees: 25,
      revenue: 'under_1m',
      settings: {
        allowPublicSurveys: true,
        requireAuthentication: false,
        customBranding: false,
      },
    },
    
    enterprise: {
      id: 'enterprise-org',
      name: 'Enterprise Corp.',
      description: 'A large enterprise organization',
      size: 'large',
      industry: 'finance',
      founded: '1980',
      employees: 10000,
      revenue: 'over_100m',
      settings: {
        allowPublicSurveys: false,
        requireAuthentication: true,
        customBranding: true,
      },
    },
    
    nonprofit: {
      id: 'nonprofit-org',
      name: 'Nonprofit Foundation',
      description: 'A charitable nonprofit organization',
      size: 'medium',
      industry: 'nonprofit',
      founded: '2005',
      employees: 150,
      revenue: 'under_10m',
      settings: {
        allowPublicSurveys: true,
        requireAuthentication: false,
        customBranding: false,
      },
    },
  },
  
  // Response fixtures
  responses: {
    minimal: {
      id: 'response-1',
      surveyId: 'minimal-survey',
      organizationId: 'startup-org',
      stakeholder: 'user',
      responses: {
        q1: 'John Doe',
      },
      completedAt: '2023-01-01T12:00:00Z',
      duration: 30, // seconds
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Test Browser)',
    },
    
    comprehensive: {
      id: 'response-2',
      surveyId: 'comprehensive-survey',
      organizationId: 'startup-org',
      stakeholder: 'ceo',
      responses: {
        q1: 'Digital transformation challenges',
        q2: 4,
        q3: 'manager',
        q4: ['react', 'vue'],
        q5: true,
        q6: 'advanced',
        q7: 'Overall, we are doing well but need to improve our processes.',
      },
      completedAt: '2023-01-01T12:30:00Z',
      duration: 450, // seconds
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Test Browser)',
    },
    
    maturityAssessment: {
      id: 'response-3',
      surveyId: 'maturity-assessment',
      organizationId: 'enterprise-org',
      stakeholder: 'tech_lead',
      responses: {
        infra_maturity: {
          servers: 4,
          networks: 3,
          security: 5,
          backup: 3,
          monitoring: 4,
        },
        dev_practices: {
          version_control: 5,
          testing: 3,
          cicd: 4,
          code_review: 4,
          documentation: 2,
        },
      },
      completedAt: '2023-01-01T13:00:00Z',
      duration: 600, // seconds
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Test Browser)',
    },
  },
  
  // Analytics fixtures
  analytics: {
    surveyMetrics: {
      surveyId: 'comprehensive-survey',
      organizationId: 'startup-org',
      totalResponses: 150,
      completionRate: 0.75,
      averageDuration: 300,
      responsesByStakeholder: {
        ceo: 25,
        cto: 20,
        pm: 45,
        dev: 60,
      },
      responsesByDay: [
        { date: '2023-01-01', responses: 15 },
        { date: '2023-01-02', responses: 23 },
        { date: '2023-01-03', responses: 18 },
        { date: '2023-01-04', responses: 21 },
        { date: '2023-01-05', responses: 19 },
        { date: '2023-01-06', responses: 25 },
        { date: '2023-01-07', responses: 29 },
      ],
      questionMetrics: {
        q1: {
          responseCount: 150,
          averageLength: 45,
          commonKeywords: ['digital', 'transformation', 'process'],
        },
        q2: {
          responseCount: 148,
          averageRating: 3.2,
          distribution: {
            1: 12,
            2: 25,
            3: 48,
            4: 41,
            5: 22,
          },
        },
        q3: {
          responseCount: 150,
          distribution: {
            developer: 60,
            manager: 45,
            designer: 25,
            other: 20,
          },
        },
      },
    },
    
    organizationMetrics: {
      organizationId: 'startup-org',
      totalSurveys: 12,
      activeSurveys: 3,
      totalResponses: 1250,
      averageCompletionRate: 0.68,
      topStakeholders: [
        { stakeholder: 'dev', responses: 450 },
        { stakeholder: 'pm', responses: 320 },
        { stakeholder: 'ceo', responses: 180 },
        { stakeholder: 'cto', responses: 150 },
      ],
      surveyPerformance: [
        { surveyId: 'survey-1', completionRate: 0.85, responses: 200 },
        { surveyId: 'survey-2', completionRate: 0.72, responses: 180 },
        { surveyId: 'survey-3', completionRate: 0.56, responses: 120 },
      ],
    },
  },
  
  // Error scenarios
  errors: {
    validationError: {
      type: 'ValidationError',
      message: 'Invalid input data',
      field: 'email',
      code: 'INVALID_EMAIL',
    },
    
    networkError: {
      type: 'NetworkError',
      message: 'Failed to connect to server',
      code: 'NETWORK_ERROR',
    },
    
    authError: {
      type: 'AuthenticationError',
      message: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS',
    },
    
    permissionError: {
      type: 'PermissionError',
      message: 'Insufficient permissions',
      code: 'INSUFFICIENT_PERMISSIONS',
    },
    
    notFoundError: {
      type: 'NotFoundError',
      message: 'Resource not found',
      code: 'NOT_FOUND',
    },
    
    serverError: {
      type: 'ServerError',
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  },
  
  // API response fixtures
  apiResponses: {
    success: {
      status: 200,
      data: { message: 'Success' },
      headers: { 'content-type': 'application/json' },
    },
    
    created: {
      status: 201,
      data: { id: 'new-resource', message: 'Created successfully' },
      headers: { 'content-type': 'application/json' },
    },
    
    noContent: {
      status: 204,
      data: null,
      headers: {},
    },
    
    badRequest: {
      status: 400,
      error: 'Bad Request',
      message: 'Invalid request parameters',
    },
    
    unauthorized: {
      status: 401,
      error: 'Unauthorized',
      message: 'Authentication required',
    },
    
    forbidden: {
      status: 403,
      error: 'Forbidden',
      message: 'Access denied',
    },
    
    notFound: {
      status: 404,
      error: 'Not Found',
      message: 'Resource not found',
    },
    
    conflict: {
      status: 409,
      error: 'Conflict',
      message: 'Resource already exists',
    },
    
    serverError: {
      status: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    },
  },
  
  // Form data fixtures
  formData: {
    validRegistration: {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      organization: 'Test Corp',
      role: 'developer',
      agreedToTerms: true,
    },
    
    validLogin: {
      email: 'user@example.com',
      password: 'password123',
      rememberMe: true,
    },
    
    validSurveyCreation: {
      title: 'New Survey',
      description: 'A new survey for testing',
      questions: [
        {
          type: 'text',
          title: 'What is your name?',
          isRequired: true,
        },
      ],
      stakeholders: [
        {
          name: 'User',
          description: 'General user',
          expertise: [],
        },
      ],
    },
    
    invalidEmail: {
      email: 'not-an-email',
      password: 'password123',
    },
    
    emptyRequired: {
      name: '',
      email: '',
      password: '',
    },
  },
  
  // Navigation fixtures
  navigation: {
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Surveys', href: '/surveys' },
      { label: 'Survey Details', href: '/surveys/123' },
    ],
    
    sidebarItems: [
      { label: 'Dashboard', href: '/dashboard', icon: 'Home' },
      { label: 'Surveys', href: '/surveys', icon: 'FileText' },
      { label: 'Analytics', href: '/analytics', icon: 'BarChart' },
      { label: 'Settings', href: '/settings', icon: 'Settings' },
    ],
  },
  
  // Theme fixtures
  themes: {
    light: {
      mode: 'light',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#ffffff',
        foreground: '#000000',
      },
    },
    
    dark: {
      mode: 'dark',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#000000',
        foreground: '#ffffff',
      },
    },
  },
};

export default unitTestFixtures;