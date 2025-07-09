import { SurveyResult, SurveySchema, SurveyResponse } from './types';
import { OrganizationProfile } from './sample-data-generator';

export interface BenchmarkData {
  surveyId: string;
  generatedAt: Date;
  totalOrganizations: number;
  overallMetrics: {
    averageScore: number;
    medianScore: number;
    standardDeviation: number;
    completionRate: number;
    averageResponseTime: number;
  };
  maturityDistribution: {
    building: number;
    emerging: number;
    thriving: number;
  };
  domainAverages: Record<string, number>;
  sectorAnalysis: Record<string, {
    averageScore: number;
    count: number;
    topDomains: string[];
    commonChallenges: string[];
  }>;
  organizationSizeAnalysis: Record<string, {
    averageScore: number;
    count: number;
    itBudgetAverage: number;
    hasITStaffPercentage: number;
  }>;
  stakeholderInsights: Record<string, {
    averageEngagement: number;
    responsePatterns: Record<string, number>;
    commonChallenges: string[];
  }>;
  trendAnalysis: {
    yearOverYear: number;
    emergingTrends: string[];
    recommendations: string[];
  };
  comparativeAnalysis: {
    topPerformers: string[];
    improvementOpportunities: string[];
    bestPractices: string[];
  };
}

export interface DetailedOrgAnalysis {
  organizationId: string;
  organizationName: string;
  sector: string;
  size: string;
  overallScore: number;
  maturityLevel: string;
  percentileRank: number;
  domainBreakdown: Record<string, {
    score: number;
    percentile: number;
    sectorComparison: number;
    sizeComparison: number;
  }>;
  strengths: string[];
  weaknesses: string[];
  priorityRecommendations: string[];
  peerComparison: {
    similar: string[];
    betterPerforming: string[];
    potentialMentors: string[];
  };
  actionPlan: {
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
    budgetEstimate: number;
    timeEstimate: string;
  };
}

export class AnalyticsGenerator {
  private static instance: AnalyticsGenerator;
  
  static getInstance(): AnalyticsGenerator {
    if (!AnalyticsGenerator.instance) {
      AnalyticsGenerator.instance = new AnalyticsGenerator();
    }
    return AnalyticsGenerator.instance;
  }

  generateBenchmarkData(
    survey: SurveySchema,
    results: SurveyResult[],
    organizations: OrganizationProfile[],
    responses: SurveyResponse[]
  ): BenchmarkData {
    const overallScores = results.map(r => r.overallScore);
    const averageScore = overallScores.reduce((a, b) => a + b, 0) / overallScores.length;
    const sortedScores = overallScores.sort((a, b) => a - b);
    const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];
    const standardDeviation = Math.sqrt(
      overallScores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / overallScores.length
    );

    // Maturity distribution
    const maturityDistribution = {
      building: results.filter(r => r.maturityLevel.id === 'building').length,
      emerging: results.filter(r => r.maturityLevel.id === 'emerging').length,
      thriving: results.filter(r => r.maturityLevel.id === 'thriving').length
    };

    // Domain averages
    const domainAverages: Record<string, number> = {};
    for (const domain of survey.domains) {
      const domainScores = results.map(r => r.domainScores[domain.id]).filter(Boolean);
      domainAverages[domain.id] = domainScores.reduce((a, b) => a + b, 0) / domainScores.length;
    }

    // Sector analysis
    const sectorAnalysis: Record<string, any> = {};
    const sectorGroups = this.groupBy(organizations, 'sector');
    
    for (const [sector, orgs] of Object.entries(sectorGroups)) {
      const sectorResults = results.filter(r => 
        orgs.some(org => org.id === r.organizationId)
      );
      
      if (sectorResults.length > 0) {
        const sectorScores = sectorResults.map(r => r.overallScore);
        const avgScore = sectorScores.reduce((a, b) => a + b, 0) / sectorScores.length;
        
        // Find top domains for this sector
        const topDomains = Object.entries(domainAverages)
          .map(([domain, score]) => ({
            domain,
            sectorScore: sectorResults.reduce((sum, r) => sum + r.domainScores[domain], 0) / sectorResults.length
          }))
          .sort((a, b) => b.sectorScore - a.sectorScore)
          .slice(0, 3)
          .map(item => item.domain);

        sectorAnalysis[sector] = {
          averageScore: avgScore,
          count: sectorResults.length,
          topDomains,
          commonChallenges: this.getSectorChallenges(sector, orgs)
        };
      }
    }

    // Organization size analysis
    const sizeAnalysis: Record<string, any> = {};
    const sizeGroups = this.groupBy(organizations, 'type');
    
    for (const [size, orgs] of Object.entries(sizeGroups)) {
      const sizeResults = results.filter(r => 
        orgs.some(org => org.id === r.organizationId)
      );
      
      if (sizeResults.length > 0) {
        const sizeScores = sizeResults.map(r => r.overallScore);
        const avgScore = sizeScores.reduce((a, b) => a + b, 0) / sizeScores.length;
        const avgBudget = orgs.reduce((sum, org) => sum + org.itBudgetPercentage, 0) / orgs.length;
        const hasITStaffPercentage = orgs.filter(org => org.hasITStaff).length / orgs.length * 100;

        sizeAnalysis[size] = {
          averageScore: avgScore,
          count: sizeResults.length,
          itBudgetAverage: avgBudget,
          hasITStaffPercentage
        };
      }
    }

    // Stakeholder insights
    const stakeholderInsights: Record<string, any> = {};
    for (const stakeholder of survey.stakeholders) {
      const stakeholderResponses = responses.filter(r => r.stakeholder === stakeholder.id);
      const responsePatterns: Record<string, number> = {};
      
      // Calculate response patterns
      for (const response of stakeholderResponses) {
        for (const [questionId, value] of Object.entries(response.responses)) {
          responsePatterns[questionId] = (responsePatterns[questionId] || 0) + (value as number);
        }
      }
      
      // Average the patterns
      for (const [questionId, total] of Object.entries(responsePatterns)) {
        responsePatterns[questionId] = total / stakeholderResponses.length;
      }

      stakeholderInsights[stakeholder.id] = {
        averageEngagement: stakeholderResponses.length / organizations.length,
        responsePatterns,
        commonChallenges: this.getStakeholderChallenges(stakeholder.id)
      };
    }

    return {
      surveyId: survey.id,
      generatedAt: new Date(),
      totalOrganizations: organizations.length,
      overallMetrics: {
        averageScore,
        medianScore,
        standardDeviation,
        completionRate: 95.2, // Mock completion rate
        averageResponseTime: 18.5 // Mock average response time in minutes
      },
      maturityDistribution,
      domainAverages,
      sectorAnalysis,
      organizationSizeAnalysis: sizeAnalysis,
      stakeholderInsights,
      trendAnalysis: {
        yearOverYear: 0.3, // Mock year-over-year improvement
        emergingTrends: [
          'Increased focus on cybersecurity',
          'Growing adoption of cloud services',
          'Enhanced data analytics capabilities',
          'Remote work technology improvements'
        ],
        recommendations: [
          'Prioritize cybersecurity training and infrastructure',
          'Invest in cloud migration strategies',
          'Develop data governance frameworks',
          'Create technology mentorship programs'
        ]
      },
      comparativeAnalysis: {
        topPerformers: results
          .sort((a, b) => b.overallScore - a.overallScore)
          .slice(0, 3)
          .map(r => r.organizationId),
        improvementOpportunities: [
          'Infrastructure standardization',
          'Staff technology training',
          'Data integration projects',
          'Board technology governance'
        ],
        bestPractices: [
          'Regular technology assessments',
          'Cross-sector collaboration',
          'Dedicated IT budgets',
          'Technology committee governance'
        ]
      }
    };
  }

  generateDetailedOrgAnalysis(
    organizationId: string,
    organizations: OrganizationProfile[],
    results: SurveyResult[],
    benchmarkData: BenchmarkData
  ): DetailedOrgAnalysis {
    const organization = organizations.find(org => org.id === organizationId);
    const result = results.find(r => r.organizationId === organizationId);
    
    if (!organization || !result) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    // Calculate percentile rank
    const allScores = results.map(r => r.overallScore).sort((a, b) => a - b);
    const percentileRank = (allScores.indexOf(result.overallScore) / allScores.length) * 100;

    // Domain breakdown with comparisons
    const domainBreakdown: Record<string, any> = {};
    for (const [domain, score] of Object.entries(result.domainScores)) {
      const domainScores = results.map(r => r.domainScores[domain]).filter(Boolean);
      const domainPercentile = (domainScores.filter(s => s <= score).length / domainScores.length) * 100;
      
      // Sector comparison
      const sectorOrgs = organizations.filter(org => org.sector === organization.sector);
      const sectorResults = results.filter(r => 
        sectorOrgs.some(org => org.id === r.organizationId)
      );
      const sectorAverage = sectorResults.reduce((sum, r) => sum + r.domainScores[domain], 0) / sectorResults.length;
      
      // Size comparison
      const sizeOrgs = organizations.filter(org => org.type === organization.type);
      const sizeResults = results.filter(r => 
        sizeOrgs.some(org => org.id === r.organizationId)
      );
      const sizeAverage = sizeResults.reduce((sum, r) => sum + r.domainScores[domain], 0) / sizeResults.length;

      domainBreakdown[domain] = {
        score,
        percentile: domainPercentile,
        sectorComparison: score - sectorAverage,
        sizeComparison: score - sizeAverage
      };
    }

    // Identify strengths and weaknesses
    const strengths = Object.entries(domainBreakdown)
      .filter(([_, data]) => data.percentile > 75)
      .map(([domain, _]) => domain);
    
    const weaknesses = Object.entries(domainBreakdown)
      .filter(([_, data]) => data.percentile < 25)
      .map(([domain, _]) => domain);

    // Generate recommendations
    const priorityRecommendations = this.generateRecommendations(
      organization,
      result,
      domainBreakdown,
      benchmarkData
    );

    // Find peer organizations
    const peerComparison = this.findPeerOrganizations(
      organization,
      organizations,
      results,
      result.overallScore
    );

    // Generate action plan
    const actionPlan = this.generateActionPlan(
      organization,
      result,
      domainBreakdown,
      benchmarkData
    );

    return {
      organizationId: organization.id,
      organizationName: organization.name,
      sector: organization.sector,
      size: organization.type,
      overallScore: result.overallScore,
      maturityLevel: result.maturityLevel.id,
      percentileRank,
      domainBreakdown,
      strengths,
      weaknesses,
      priorityRecommendations,
      peerComparison,
      actionPlan
    };
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private getSectorChallenges(sector: string, orgs: OrganizationProfile[]): string[] {
    const challengeMap: Record<string, string[]> = {
      'Community Services': ['Limited funding', 'Volunteer coordination', 'Program tracking'],
      'Federation': ['Multi-organization coordination', 'Large-scale data management', 'Diverse stakeholder needs'],
      'Campus Life': ['Student engagement', 'Event management', 'Mobile-first approach'],
      'Religious Institution': ['Member management', 'Donation tracking', 'Event coordination'],
      'Social Services': ['Case management', 'Privacy compliance', 'Outcome measurement'],
      'Arts & Culture': ['Digital collections', 'Online exhibitions', 'Visitor engagement'],
      'Education': ['Student information systems', '1:1 device programs', 'Parent communication']
    };

    return challengeMap[sector] || ['Technology planning', 'Staff training', 'Budget constraints'];
  }

  private getStakeholderChallenges(stakeholderId: string): string[] {
    const challengeMap: Record<string, string[]> = {
      'ceo': ['Strategic technology planning', 'Budget allocation', 'Change management'],
      'tech_lead': ['Infrastructure maintenance', 'Security compliance', 'Training delivery'],
      'staff': ['Daily tool usage', 'Training needs', 'Workflow integration'],
      'board': ['Governance oversight', 'Strategic direction', 'Risk management']
    };

    return challengeMap[stakeholderId] || ['General technology challenges'];
  }

  private generateRecommendations(
    organization: OrganizationProfile,
    result: SurveyResult,
    domainBreakdown: Record<string, any>,
    benchmarkData: BenchmarkData
  ): string[] {
    const recommendations: string[] = [];

    // Based on maturity level
    if (result.maturityLevel.id === 'building') {
      recommendations.push('Establish basic IT infrastructure and policies');
      recommendations.push('Create technology budget and planning process');
      recommendations.push('Provide staff technology training');
    } else if (result.maturityLevel.id === 'emerging') {
      recommendations.push('Integrate systems for better data flow');
      recommendations.push('Develop comprehensive technology strategy');
      recommendations.push('Enhance cybersecurity measures');
    } else {
      recommendations.push('Explore emerging technologies and innovations');
      recommendations.push('Share best practices with peer organizations');
      recommendations.push('Develop technology mentorship capabilities');
    }

    // Based on weak domains
    const weakDomains = Object.entries(domainBreakdown)
      .filter(([_, data]) => data.percentile < 50)
      .map(([domain, _]) => domain);

    for (const domain of weakDomains) {
      switch (domain) {
        case 'infrastructure':
          recommendations.push('Upgrade core technology infrastructure');
          break;
        case 'data':
          recommendations.push('Implement data governance framework');
          break;
        case 'business_systems':
          recommendations.push('Evaluate and upgrade business systems');
          break;
        case 'program_tech':
          recommendations.push('Enhance program delivery technology');
          break;
        case 'culture':
          recommendations.push('Develop technology leadership and culture');
          break;
      }
    }

    // Organization-specific recommendations
    if (!organization.hasITStaff && organization.type !== 'small') {
      recommendations.push('Consider hiring dedicated IT staff');
    }

    if (organization.itBudgetPercentage < 5) {
      recommendations.push('Increase technology budget allocation');
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  private findPeerOrganizations(
    organization: OrganizationProfile,
    organizations: OrganizationProfile[],
    results: SurveyResult[],
    currentScore: number
  ): { similar: string[]; betterPerforming: string[]; potentialMentors: string[] } {
    const similar = organizations
      .filter(org => 
        org.id !== organization.id &&
        org.sector === organization.sector &&
        org.type === organization.type
      )
      .slice(0, 3)
      .map(org => org.id);

    const betterPerforming = results
      .filter(r => 
        r.organizationId !== organization.id &&
        r.overallScore > currentScore
      )
      .sort((a, b) => a.overallScore - b.overallScore)
      .slice(0, 3)
      .map(r => r.organizationId);

    const potentialMentors = results
      .filter(r => 
        r.organizationId !== organization.id &&
        r.overallScore > currentScore + 0.5 &&
        r.maturityLevel.id === 'thriving'
      )
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 3)
      .map(r => r.organizationId);

    return { similar, betterPerforming, potentialMentors };
  }

  private generateActionPlan(
    organization: OrganizationProfile,
    result: SurveyResult,
    domainBreakdown: Record<string, any>,
    benchmarkData: BenchmarkData
  ): DetailedOrgAnalysis['actionPlan'] {
    const shortTerm: string[] = [];
    const mediumTerm: string[] = [];
    const longTerm: string[] = [];

    // Based on maturity level
    if (result.maturityLevel.id === 'building') {
      shortTerm.push('Conduct comprehensive technology audit');
      shortTerm.push('Establish basic cybersecurity measures');
      mediumTerm.push('Implement core business systems');
      mediumTerm.push('Provide staff technology training');
      longTerm.push('Develop technology strategic plan');
    } else if (result.maturityLevel.id === 'emerging') {
      shortTerm.push('Integrate existing systems');
      shortTerm.push('Enhance data backup procedures');
      mediumTerm.push('Upgrade core infrastructure');
      mediumTerm.push('Implement data analytics tools');
      longTerm.push('Develop innovation initiatives');
    } else {
      shortTerm.push('Explore emerging technologies');
      shortTerm.push('Establish mentorship programs');
      mediumTerm.push('Lead sector technology initiatives');
      longTerm.push('Develop technology innovation lab');
    }

    // Budget estimate based on organization size and current maturity
    const budgetMultiplier = organization.type === 'large' ? 3 : organization.type === 'medium' ? 2 : 1;
    const maturityMultiplier = result.maturityLevel.id === 'building' ? 2 : result.maturityLevel.id === 'emerging' ? 1.5 : 1;
    const baseBudget = 25000;
    const budgetEstimate = baseBudget * budgetMultiplier * maturityMultiplier;

    // Time estimate
    const timeEstimate = result.maturityLevel.id === 'building' ? '18-24 months' : 
                        result.maturityLevel.id === 'emerging' ? '12-18 months' : '6-12 months';

    return {
      shortTerm: shortTerm.slice(0, 3),
      mediumTerm: mediumTerm.slice(0, 3),
      longTerm: longTerm.slice(0, 2),
      budgetEstimate,
      timeEstimate
    };
  }
}