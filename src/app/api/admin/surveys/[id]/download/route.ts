import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';
import { SurveyEngine } from '@/lib/survey-engine';
import { SurveySchema, SurveyResponse, SurveyResult } from '@/lib/types';

const dataManager = SurveyDataManager.getInstance();

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

interface DownloadStats {
  totalResponses: number;
  completedResponses: number;
  uniqueOrganizations: number;
  stakeholderBreakdown: Record<string, number>;
  domainAverages: Record<string, number>;
  completionRate: number;
  averageScore: number;
}

function calculateDownloadStats(
  responses: SurveyResponse[], 
  results: SurveyResult[],
  schema: SurveySchema
): DownloadStats {
  const completedResponses = responses.filter(r => r.completionTime);
  const uniqueOrganizations = new Set(responses.map(r => r.organizationId)).size;
  
  // Stakeholder breakdown
  const stakeholderBreakdown: Record<string, number> = {};
  responses.forEach(response => {
    stakeholderBreakdown[response.stakeholder] = (stakeholderBreakdown[response.stakeholder] || 0) + 1;
  });

  // Domain averages from results
  const domainAverages: Record<string, number> = {};
  if (results.length > 0) {
    schema.domains.forEach(domain => {
      const domainScores = results
        .map(r => r.domainScores[domain.id])
        .filter(score => score !== undefined);
      
      domainAverages[domain.name] = domainScores.length > 0 
        ? domainScores.reduce((sum, score) => sum + score, 0) / domainScores.length 
        : 0;
    });
  }

  const averageScore = results.length > 0 
    ? results.reduce((sum, r) => sum + r.overallScore, 0) / results.length 
    : 0;

  return {
    totalResponses: responses.length,
    completedResponses: completedResponses.length,
    uniqueOrganizations,
    stakeholderBreakdown,
    domainAverages,
    completionRate: responses.length > 0 ? (completedResponses.length / responses.length) * 100 : 0,
    averageScore
  };
}

function generateCSV(
  schema: SurveySchema,
  responses: SurveyResponse[],
  results: SurveyResult[],
  stats: DownloadStats
): string {
  const headers = [
    'Organization ID',
    'Stakeholder',
    'Expertise',
    'Response Date',
    'Completion Status',
    'Overall Score',
    'Maturity Level',
    ...schema.domains.map(d => `${d.name} Score`),
    ...schema.questions.map(q => `Q${schema.questions.indexOf(q) + 1}: ${q.text.substring(0, 50)}...`)
  ];

  const rows = responses.map(response => {
    const result = results.find(r => r.organizationId === response.organizationId);
    const isCompleted = !!response.completionTime;
    
    return [
      response.organizationId,
      response.stakeholder,
      response.expertise.join('; '),
      response.completionTime ? new Date(response.completionTime).toISOString() : 'Incomplete',
      isCompleted ? 'Completed' : 'In Progress',
      result ? result.overallScore.toFixed(2) : 'N/A',
      result ? result.maturityLevel.name : 'N/A',
      ...schema.domains.map(d => result ? (result.domainScores[d.id] || 0).toFixed(2) : 'N/A'),
      ...schema.questions.map(q => {
        const answer = response.responses[q.id];
        if (answer === null || answer === undefined) return 'No Answer';
        if (typeof answer === 'object') return JSON.stringify(answer);
        return answer.toString();
      })
    ];
  });

  // Add summary stats at the top
  const summaryRows = [
    ['Survey Summary', '', '', '', '', '', '', ...Array(schema.domains.length + schema.questions.length).fill('')],
    ['Total Responses', stats.totalResponses.toString(), '', '', '', '', '', ...Array(schema.domains.length + schema.questions.length).fill('')],
    ['Completed Responses', stats.completedResponses.toString(), '', '', '', '', '', ...Array(schema.domains.length + schema.questions.length).fill('')],
    ['Unique Organizations', stats.uniqueOrganizations.toString(), '', '', '', '', '', ...Array(schema.domains.length + schema.questions.length).fill('')],
    ['Completion Rate', `${stats.completionRate.toFixed(1)}%`, '', '', '', '', '', ...Array(schema.domains.length + schema.questions.length).fill('')],
    ['Average Score', stats.averageScore.toFixed(2), '', '', '', '', '', ...Array(schema.domains.length + schema.questions.length).fill('')],
    ['', '', '', '', '', '', '', ...Array(schema.domains.length + schema.questions.length).fill('')],
    ['Detailed Responses', '', '', '', '', '', '', ...Array(schema.domains.length + schema.questions.length).fill('')]
  ];

  const csvContent = [
    ...summaryRows,
    headers,
    ...rows
  ].map(row => 
    row.map(field => 
      typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))
        ? `"${field.replace(/"/g, '""')}"` 
        : field
    ).join(',')
  ).join('\n');

  return csvContent;
}

function generateJSON(
  schema: SurveySchema,
  responses: SurveyResponse[],
  results: SurveyResult[],
  stats: DownloadStats
): any {
  return {
    export: {
      timestamp: new Date().toISOString(),
      format: 'json',
      version: '1.0'
    },
    survey: {
      id: schema.id,
      name: schema.name,
      description: schema.description,
      version: schema.version,
      domains: schema.domains,
      stakeholders: schema.stakeholders,
      totalQuestions: schema.questions.length
    },
    statistics: stats,
    responses: responses.map(response => ({
      ...response,
      responses: response.responses,
      result: results.find(r => r.organizationId === response.organizationId)
    })),
    results: results,
    analysis: {
      topPerformingOrganizations: results
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, 5)
        .map(r => ({
          organizationId: r.organizationId,
          score: r.overallScore,
          maturityLevel: r.maturityLevel.name
        })),
      stakeholderParticipation: Object.entries(stats.stakeholderBreakdown).map(([stakeholder, count]) => ({
        stakeholder,
        responseCount: count,
        percentage: ((count / stats.totalResponses) * 100).toFixed(1)
      })),
      domainAnalysis: Object.entries(stats.domainAverages).map(([domain, average]) => ({
        domain,
        averageScore: average,
        performanceLevel: average >= 4 ? 'High' : average >= 3 ? 'Medium' : 'Low'
      }))
    }
  };
}

function generatePDFContent(
  schema: SurveySchema,
  responses: SurveyResponse[],
  results: SurveyResult[],
  stats: DownloadStats
): string {
  // Generate HTML content that can be converted to PDF
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Survey Results - ${schema.name}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6;
            color: #333;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #007bff; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
        }
        .summary { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px;
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 15px; 
            margin-bottom: 20px;
        }
        .stat-item { 
            text-align: center; 
            padding: 15px; 
            background: white; 
            border-radius: 4px;
            border: 1px solid #dee2e6;
        }
        .stat-value { 
            font-size: 2em; 
            font-weight: bold; 
            color: #007bff;
        }
        .section { 
            margin-bottom: 30px;
        }
        .section h2 { 
            color: #007bff; 
            border-bottom: 1px solid #dee2e6; 
            padding-bottom: 10px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px;
        }
        th, td { 
            border: 1px solid #dee2e6; 
            padding: 8px; 
            text-align: left;
        }
        th { 
            background-color: #f8f9fa; 
            font-weight: bold;
        }
        .maturity-high { color: #28a745; }
        .maturity-medium { color: #ffc107; }
        .maturity-low { color: #dc3545; }
        @media print { 
            body { margin: 0; } 
            .header { page-break-after: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Survey Results Report</h1>
        <h2>${schema.name}</h2>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
        <p><strong>Survey Description:</strong> ${schema.description}</p>
    </div>

    <div class="summary">
        <h2>Executive Summary</h2>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${stats.totalResponses}</div>
                <div>Total Responses</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.uniqueOrganizations}</div>
                <div>Organizations</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.completionRate.toFixed(1)}%</div>
                <div>Completion Rate</div>
            </div>
        </div>
        
        <p><strong>Average Score:</strong> ${stats.averageScore.toFixed(2)}/5.0</p>
        <p><strong>Survey Version:</strong> ${schema.version}</p>
        <p><strong>Total Questions:</strong> ${schema.questions.length}</p>
    </div>

    <div class="section">
        <h2>Domain Performance</h2>
        <table>
            <tr>
                <th>Domain</th>
                <th>Average Score</th>
                <th>Performance Level</th>
            </tr>
            ${Object.entries(stats.domainAverages).map(([domain, score]) => `
                <tr>
                    <td>${domain}</td>
                    <td>${score.toFixed(2)}</td>
                    <td class="maturity-${score >= 4 ? 'high' : score >= 3 ? 'medium' : 'low'}">
                        ${score >= 4 ? 'High' : score >= 3 ? 'Medium' : 'Low'}
                    </td>
                </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h2>Stakeholder Participation</h2>
        <table>
            <tr>
                <th>Stakeholder</th>
                <th>Response Count</th>
                <th>Percentage</th>
            </tr>
            ${Object.entries(stats.stakeholderBreakdown).map(([stakeholder, count]) => `
                <tr>
                    <td>${stakeholder}</td>
                    <td>${count}</td>
                    <td>${((count / stats.totalResponses) * 100).toFixed(1)}%</td>
                </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h2>Organization Results</h2>
        <table>
            <tr>
                <th>Organization</th>
                <th>Overall Score</th>
                <th>Maturity Level</th>
                <th>Response Count</th>
            </tr>
            ${results.map(result => `
                <tr>
                    <td>${result.organizationId}</td>
                    <td>${result.overallScore.toFixed(2)}</td>
                    <td class="maturity-${result.overallScore >= 4 ? 'high' : result.overallScore >= 3 ? 'medium' : 'low'}">
                        ${result.maturityLevel.name}
                    </td>
                    <td>${result.responseCount}</td>
                </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h2>Survey Configuration</h2>
        <h3>Domains</h3>
        <ul>
            ${schema.domains.map(domain => `
                <li><strong>${domain.name}:</strong> ${domain.description} (Weight: ${domain.weight})</li>
            `).join('')}
        </ul>
        
        <h3>Stakeholders</h3>
        <ul>
            ${schema.stakeholders.map(stakeholder => `
                <li><strong>${stakeholder.name}:</strong> ${stakeholder.description} (Weight: ${stakeholder.weight})</li>
            `).join('')}
        </ul>
    </div>
</body>
</html>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    const includeResults = url.searchParams.get('includeResults') !== 'false';
    const includeAnalysis = url.searchParams.get('includeAnalysis') !== 'false';

    // Validate format
    if (!['json', 'csv', 'pdf'].includes(format)) {
      const response = NextResponse.json(
        { error: 'Invalid format. Supported formats: json, csv, pdf' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Get survey schema
    const schema = await dataManager.getSchema(params.id);
    if (!schema) {
      const response = NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      );
      return addSecurityHeaders(response);
    }

    // Get all responses
    const responses = await dataManager.getAllResponses(params.id);
    
    // Get results if requested
    let results: SurveyResult[] = [];
    if (includeResults) {
      results = await dataManager.getAllResults(params.id);
    }

    // Calculate statistics
    const stats = calculateDownloadStats(responses, results, schema);

    // Generate appropriate format
    let content: string;
    let contentType: string;
    let filename: string;
    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'csv':
        content = generateCSV(schema, responses, results, stats);
        contentType = 'text/csv';
        filename = `survey-${schema.id}-results-${timestamp}.csv`;
        break;
      
      case 'pdf':
        content = generatePDFContent(schema, responses, results, stats);
        contentType = 'text/html'; // Will be converted to PDF client-side
        filename = `survey-${schema.id}-results-${timestamp}.html`;
        break;
      
      case 'json':
      default:
        content = JSON.stringify(generateJSON(schema, responses, results, stats), null, 2);
        contentType = 'application/json';
        filename = `survey-${schema.id}-results-${timestamp}.json`;
        break;
    }

    const response = new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(content, 'utf8').toString()
      }
    });

    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Error generating download:', error);
    const response = NextResponse.json(
      { 
        error: 'Failed to generate download', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}