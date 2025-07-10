'use client';

import { SurveyResult, SurveySchema } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface ResultsVisualizationProps {
  results: SurveyResult;
  survey: SurveySchema;
}

export function ResultsVisualization({ results, survey }: ResultsVisualizationProps) {
  // Prepare data for domain scores chart
  const domainData = Object.entries(results.domainScores).map(([domainId, score]) => {
    const domain = survey.domains.find(d => d.id === domainId);
    return {
      name: domain?.name || domainId,
      score: score,
      color: domain?.color || '#888888'
    };
  });

  // Prepare data for radar chart
  const radarData = domainData.map(item => ({
    domain: item.name,
    score: item.score,
    fullMark: 5
  }));

  // Prepare stakeholder contribution data
  const stakeholderData = Object.entries(results.stakeholderContributions).map(([domainId, contributions]) => {
    const domain = survey.domains.find(d => d.id === domainId);
    const domainName = domain?.name || domainId;
    
    const stakeholderScores = Object.entries(contributions).map(([stakeholder, score]) => {
      const stakeholderInfo = survey.stakeholders.find(s => s.id === stakeholder);
      return {
        stakeholder: stakeholderInfo?.name || stakeholder,
        score: score as number
      };
    });

    return {
      domain: domainName,
      ...stakeholderScores.reduce((acc, { stakeholder, score }) => {
        acc[stakeholder] = score;
        return acc;
      }, {} as Record<string, number>)
    };
  });

  return (
    <div className="space-y-6">
      {/* Domain Scores Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Scores Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar 
                  dataKey="score" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Technology Maturity Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="domain" />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 5]}
                  tick={false}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stakeholder Contributions */}
      <Card>
        <CardHeader>
          <CardTitle>Stakeholder Contributions by Domain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stakeholderData.map((domainData, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">{domainData.domain}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {survey.stakeholders.map((stakeholder) => {
                    const score = Number(domainData[stakeholder.name as keyof typeof domainData]) || 0;
                    return (
                      <div key={stakeholder.id} className="text-center">
                        <div className="text-sm font-medium text-gray-600">{stakeholder.name}</div>
                        <div className="text-lg font-semibold" style={{ color: stakeholder.color }}>
                          {score ? score.toFixed(2) : 'N/A'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{results.overallScore.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{results.responseCount}</div>
              <div className="text-sm text-gray-600">Responses</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(results.domainScores).length}</div>
              <div className="text-sm text-gray-600">Domains</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{Object.keys(results.stakeholderBreakdown).length}</div>
              <div className="text-sm text-gray-600">Stakeholders</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}