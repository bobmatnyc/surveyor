import { SurveyResponse, SurveyResult, SurveySchema, MaturityLevel, QuestionType } from './types';

export interface OrganizationProfile {
  id: string;
  name: string;
  type: 'small' | 'medium' | 'large';
  sector: string;
  maturityTarget: 'building' | 'emerging' | 'thriving';
  yearEstablished: number;
  staffSize: number;
  annualBudget: number;
  location: string;
  website?: string;
  hasITStaff: boolean;
  itBudgetPercentage: number;
}

export class SampleDataGenerator {
  private static instance: SampleDataGenerator;
  
  static getInstance(): SampleDataGenerator {
    if (!SampleDataGenerator.instance) {
      SampleDataGenerator.instance = new SampleDataGenerator();
    }
    return SampleDataGenerator.instance;
  }

  private organizationProfiles: OrganizationProfile[] = [
    {
      id: 'org_beth_shalom_community',
      name: 'Beth Shalom Community Center',
      type: 'small',
      sector: 'Community Services',
      maturityTarget: 'building',
      yearEstablished: 1985,
      staffSize: 12,
      annualBudget: 750000,
      location: 'Chicago, IL',
      website: 'https://bethshalomcenter.org',
      hasITStaff: false,
      itBudgetPercentage: 3
    },
    {
      id: 'org_jewish_federation_metro',
      name: 'Jewish Federation of Metropolitan Detroit',
      type: 'large',
      sector: 'Federation',
      maturityTarget: 'thriving',
      yearEstablished: 1926,
      staffSize: 85,
      annualBudget: 25000000,
      location: 'Detroit, MI',
      website: 'https://jewishdetroit.org',
      hasITStaff: true,
      itBudgetPercentage: 12
    },
    {
      id: 'org_hillel_university',
      name: 'Hillel at State University',
      type: 'medium',
      sector: 'Campus Life',
      maturityTarget: 'emerging',
      yearEstablished: 1995,
      staffSize: 28,
      annualBudget: 1800000,
      location: 'Columbus, OH',
      website: 'https://hillelstate.org',
      hasITStaff: true,
      itBudgetPercentage: 8
    },
    {
      id: 'org_temple_emanuel',
      name: 'Temple Emanuel',
      type: 'medium',
      sector: 'Religious Institution',
      maturityTarget: 'emerging',
      yearEstablished: 1952,
      staffSize: 35,
      annualBudget: 2200000,
      location: 'Atlanta, GA',
      website: 'https://templeemanuel.org',
      hasITStaff: false,
      itBudgetPercentage: 5
    },
    {
      id: 'org_jewish_family_services',
      name: 'Jewish Family Services of Greater Boston',
      type: 'large',
      sector: 'Social Services',
      maturityTarget: 'thriving',
      yearEstablished: 1938,
      staffSize: 120,
      annualBudget: 18000000,
      location: 'Boston, MA',
      website: 'https://jfsgb.org',
      hasITStaff: true,
      itBudgetPercentage: 15
    },
    {
      id: 'org_chabad_center',
      name: 'Chabad Center of Silicon Valley',
      type: 'small',
      sector: 'Religious Institution',
      maturityTarget: 'building',
      yearEstablished: 1998,
      staffSize: 8,
      annualBudget: 450000,
      location: 'Palo Alto, CA',
      website: 'https://chabadsv.org',
      hasITStaff: false,
      itBudgetPercentage: 4
    },
    {
      id: 'org_jewish_museum',
      name: 'Jewish Museum of Heritage',
      type: 'medium',
      sector: 'Arts & Culture',
      maturityTarget: 'emerging',
      yearEstablished: 1976,
      staffSize: 42,
      annualBudget: 3200000,
      location: 'New York, NY',
      website: 'https://jewishmuseum.org',
      hasITStaff: true,
      itBudgetPercentage: 10
    },
    {
      id: 'org_jewish_day_school',
      name: 'Maimonides Jewish Day School',
      type: 'medium',
      sector: 'Education',
      maturityTarget: 'emerging',
      yearEstablished: 1963,
      staffSize: 65,
      annualBudget: 8500000,
      location: 'Los Angeles, CA',
      website: 'https://maimonides.edu',
      hasITStaff: true,
      itBudgetPercentage: 18
    }
  ];

  private stakeholderProfiles = [
    {
      id: 'ceo',
      commonTitles: ['Executive Director', 'CEO', 'President', 'Director'],
      commonNames: ['Sarah Cohen', 'Michael Goldstein', 'Rebecca Rosen', 'David Levy', 'Rachel Green', 'Jonathan Silver']
    },
    {
      id: 'tech_lead',
      commonTitles: ['IT Director', 'Technology Manager', 'Systems Administrator', 'Digital Director'],
      commonNames: ['Alex Kim', 'Jordan Davis', 'Taylor Johnson', 'Morgan Brown', 'Casey Wilson', 'Riley Chen']
    },
    {
      id: 'staff',
      commonTitles: ['Program Manager', 'Operations Coordinator', 'Social Worker', 'Education Director', 'Development Associate'],
      commonNames: ['Emily Rose', 'Jacob Miller', 'Sofia Martinez', 'Noah Thompson', 'Ava Garcia', 'Ethan Williams']
    },
    {
      id: 'board',
      commonTitles: ['Board Chair', 'Board Member', 'Treasurer', 'Secretary', 'Board Vice Chair'],
      commonNames: ['Dr. Ruth Shapiro', 'Mark Goldberg', 'Lisa Stern', 'Robert Kahn', 'Jennifer Weinstein', 'Steven Friedman']
    }
  ];

  getOrganizationProfiles(): OrganizationProfile[] {
    return this.organizationProfiles;
  }

  getRandomStakeholderName(stakeholderType: string): string {
    const profile = this.stakeholderProfiles.find(p => p.id === stakeholderType);
    if (!profile) return 'Anonymous User';
    
    const names = profile.commonNames;
    return names[Math.floor(Math.random() * names.length)];
  }

  getRandomStakeholderTitle(stakeholderType: string): string {
    const profile = this.stakeholderProfiles.find(p => p.id === stakeholderType);
    if (!profile) return 'Staff Member';
    
    const titles = profile.commonTitles;
    return titles[Math.floor(Math.random() * titles.length)];
  }

  generateRealisticResponse(
    questionId: string,
    questionOptions: any[],
    organizationProfile: OrganizationProfile,
    stakeholderType: string,
    questionDomain: string
  ): number {
    const baseScore = this.getBaseScoreForMaturity(organizationProfile.maturityTarget);
    const stakeholderModifier = this.getStakeholderModifier(stakeholderType, questionDomain);
    const organizationModifier = this.getOrganizationModifier(organizationProfile, questionDomain);
    const randomVariation = (Math.random() - 0.5) * 0.8; // ±0.4 variation
    
    let score = baseScore + stakeholderModifier + organizationModifier + randomVariation;
    
    // Apply question-specific adjustments
    score = this.applyQuestionSpecificAdjustments(questionId, score, organizationProfile, stakeholderType);
    
    // Clamp to valid range and round to nearest option
    score = Math.max(1, Math.min(5, score));
    return Math.round(score);
  }

  private getBaseScoreForMaturity(maturityLevel: string): number {
    switch (maturityLevel) {
      case 'building': return 2.1;
      case 'emerging': return 3.2;
      case 'thriving': return 4.3;
      default: return 3.0;
    }
  }

  private getStakeholderModifier(stakeholderType: string, domain: string): number {
    const modifiers: Record<string, Record<string, number>> = {
      'ceo': {
        'infrastructure': -0.2,
        'business_systems': 0.1,
        'data': 0.0,
        'program_tech': -0.1,
        'culture': 0.3
      },
      'tech_lead': {
        'infrastructure': 0.4,
        'business_systems': 0.2,
        'data': 0.5,
        'program_tech': 0.1,
        'culture': 0.0
      },
      'staff': {
        'infrastructure': -0.3,
        'business_systems': -0.1,
        'data': -0.2,
        'program_tech': 0.2,
        'culture': -0.1
      },
      'board': {
        'infrastructure': -0.4,
        'business_systems': 0.0,
        'data': -0.2,
        'program_tech': -0.3,
        'culture': 0.1
      }
    };

    return modifiers[stakeholderType]?.[domain] || 0;
  }

  private getOrganizationModifier(org: OrganizationProfile, domain: string): number {
    let modifier = 0;
    
    // Size modifier
    if (org.type === 'large') modifier += 0.3;
    else if (org.type === 'small') modifier -= 0.2;
    
    // IT staff modifier
    if (org.hasITStaff && domain === 'infrastructure') modifier += 0.4;
    if (org.hasITStaff && domain === 'data') modifier += 0.3;
    
    // Budget modifier
    if (org.itBudgetPercentage > 10) modifier += 0.2;
    else if (org.itBudgetPercentage < 5) modifier -= 0.3;
    
    // Sector-specific modifiers
    if (org.sector === 'Education' && domain === 'program_tech') modifier += 0.2;
    if (org.sector === 'Social Services' && domain === 'data') modifier += 0.1;
    
    return modifier;
  }

  private applyQuestionSpecificAdjustments(
    questionId: string,
    score: number,
    org: OrganizationProfile,
    stakeholderType: string
  ): number {
    // Apply specific logic for certain questions
    if (questionId === 'infra_onboarding_ceo' || questionId === 'infra_onboarding_tech') {
      if (org.staffSize < 15) return Math.max(score - 0.5, 1); // Smaller orgs struggle more
      if (org.hasITStaff) return Math.min(score + 0.3, 5);
    }
    
    if (questionId === 'data_collection_ceo' || questionId === 'data_systems_tech') {
      if (org.sector === 'Social Services') return Math.min(score + 0.4, 5); // Better at data
      if (org.type === 'small') return Math.max(score - 0.4, 1);
    }
    
    if (questionId === 'culture_leadership_ceo' && stakeholderType === 'ceo') {
      return Math.min(score + 0.3, 5); // CEOs tend to be more optimistic about their leadership
    }
    
    if (questionId === 'program_tech_staff' && org.sector === 'Education') {
      return Math.min(score + 0.3, 5); // Educational institutions tend to have better program tech
    }
    
    return score;
  }

  generateSurveyResponse(
    survey: SurveySchema,
    organization: OrganizationProfile,
    stakeholderType: string
  ): SurveyResponse {
    const respondentName = this.getRandomStakeholderName(stakeholderType);
    const respondentTitle = this.getRandomStakeholderTitle(stakeholderType);
    
    const stakeholder = survey.stakeholders.find(s => s.id === stakeholderType);
    const expertiseAreas = stakeholder?.requiredExpertise || [];
    
    const responses: Record<string, any> = {};
    
    // Generate responses for questions targeting this stakeholder
    const relevantQuestions = survey.questions.filter(q => 
      q.targetStakeholders.includes(stakeholderType)
    );
    
    for (const question of relevantQuestions) {
      const responseValue = this.generateRealisticResponse(
        question.id,
        question.options || [],
        organization,
        stakeholderType,
        question.domain
      );
      
      responses[question.id] = responseValue;
    }
    
    const startTime = new Date();
    const completionTime = new Date(startTime.getTime() + Math.random() * 1800000 + 600000); // 10-40 minutes
    
    return {
      id: `resp_${organization.id}_${stakeholderType}_${Date.now()}`,
      surveyId: survey.id,
      organizationId: organization.id,
      respondentId: `${stakeholderType}_${organization.id}`,
      stakeholder: stakeholderType,
      expertise: expertiseAreas,
      responses,
      startTime,
      completionTime,
      progress: 100,
      metadata: {
        respondentName,
        respondentTitle,
        organizationName: organization.name,
        organizationType: organization.type,
        organizationSector: organization.sector,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ipAddress: '192.168.1.1',
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };
  }

  calculateSurveyResult(
    survey: SurveySchema,
    organization: OrganizationProfile,
    responses: SurveyResponse[]
  ): SurveyResult {
    const domainScores: Record<string, number> = {};
    const stakeholderContributions: Record<string, Record<string, number>> = {};
    
    // Calculate domain scores
    for (const domain of survey.domains) {
      const domainQuestions = survey.questions.filter(q => q.domain === domain.id);
      let domainScore = 0;
      let totalWeight = 0;
      
      for (const question of domainQuestions) {
        for (const response of responses) {
          if (response.responses[question.id] !== undefined) {
            const stakeholderWeight = survey.scoring.stakeholderWeights[response.stakeholder] || 0;
            const questionScore = response.responses[question.id];
            
            domainScore += questionScore * stakeholderWeight;
            totalWeight += stakeholderWeight;
            
            // Track stakeholder contributions
            if (!stakeholderContributions[response.stakeholder]) {
              stakeholderContributions[response.stakeholder] = {};
            }
            stakeholderContributions[response.stakeholder][domain.id] = 
              (stakeholderContributions[response.stakeholder][domain.id] || 0) + questionScore;
          }
        }
      }
      
      domainScores[domain.id] = totalWeight > 0 ? domainScore / totalWeight : 0;
    }
    
    // Calculate overall score
    let overallScore = 0;
    for (const domain of survey.domains) {
      overallScore += domainScores[domain.id] * domain.weight;
    }
    
    // Determine maturity level
    const maturityLevel = survey.scoring.maturityLevels.find(level => 
      overallScore >= level.minScore && overallScore <= level.maxScore
    ) || survey.scoring.maturityLevels[0];
    
    // Generate stakeholder breakdown
    const stakeholderBreakdown: Record<string, number> = {};
    for (const response of responses) {
      stakeholderBreakdown[response.stakeholder] = 1;
    }
    
    return {
      surveyId: survey.id,
      organizationId: organization.id,
      overallScore,
      domainScores,
      stakeholderContributions,
      maturityLevel,
      recommendations: maturityLevel.recommendations,
      completionDate: new Date(),
      responseCount: responses.length,
      stakeholderBreakdown
    };
  }

  generateComprehensiveDataset(survey: SurveySchema): {
    organizations: OrganizationProfile[],
    responses: SurveyResponse[],
    results: SurveyResult[]
  } {
    const organizations = this.getOrganizationProfiles();
    const responses: SurveyResponse[] = [];
    const results: SurveyResult[] = [];
    
    for (const org of organizations) {
      const orgResponses: SurveyResponse[] = [];
      
      // Generate responses for each required stakeholder
      for (const stakeholder of survey.stakeholders) {
        const response = this.generateSurveyResponse(survey, org, stakeholder.id);
        responses.push(response);
        orgResponses.push(response);
      }
      
      // Calculate and store results
      const result = this.calculateSurveyResult(survey, org, orgResponses);
      results.push(result);
    }
    
    return { organizations, responses, results };
  }
}