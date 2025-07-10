import { QAReport, QATestResult } from './types';
import fs from 'fs';
import path from 'path';

export class ReportGenerator {
  private reportPath: string;

  constructor(reportPath: string = './qa-agent/reports') {
    this.reportPath = reportPath;
    this.ensureReportDirectory();
  }

  private ensureReportDirectory(): void {
    if (!fs.existsSync(this.reportPath)) {
      fs.mkdirSync(this.reportPath, { recursive: true });
    }
  }

  generateReport(qaReport: QAReport): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFilename = `qa-report-${timestamp}.json`;
    const reportPath = path.join(this.reportPath, reportFilename);

    // Write JSON report
    fs.writeFileSync(reportPath, JSON.stringify(qaReport, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(qaReport);
    const htmlFilename = `qa-report-${timestamp}.html`;
    const htmlPath = path.join(this.reportPath, htmlFilename);
    fs.writeFileSync(htmlPath, htmlReport);

    // Generate summary report
    const summaryReport = this.generateSummaryReport(qaReport);
    const summaryFilename = `qa-summary-${timestamp}.txt`;
    const summaryPath = path.join(this.reportPath, summaryFilename);
    fs.writeFileSync(summaryPath, summaryReport);

    console.log(`\n🎯 QA Report Generated:`);
    console.log(`   JSON Report: ${reportPath}`);
    console.log(`   HTML Report: ${htmlPath}`);
    console.log(`   Summary Report: ${summaryPath}`);
  }

  private generateHTMLReport(qaReport: QAReport): string {
    const statusIcon = (status: string) => {
      switch (status) {
        case 'PASS': return '✅';
        case 'FAIL': return '❌';
        case 'WARNING': return '⚠️';
        default: return '❓';
      }
    };

    const statusColor = (status: string) => {
      switch (status) {
        case 'PASS': return '#28a745';
        case 'FAIL': return '#dc3545';
        case 'WARNING': return '#ffc107';
        default: return '#6c757d';
      }
    };

    const recommendationBadge = (recommendation: string) => {
      switch (recommendation) {
        case 'APPROVE': return '<span class="badge badge-success">✅ APPROVE</span>';
        case 'REJECT': return '<span class="badge badge-danger">❌ REJECT</span>';
        case 'NEEDS_REVIEW': return '<span class="badge badge-warning">🔍 NEEDS REVIEW</span>';
        default: return '<span class="badge badge-secondary">❓ UNKNOWN</span>';
      }
    };

    const groupedTests = this.groupTestsByPhase(qaReport.testResults);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Frontend QA Report - ${qaReport.url}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .summary {
            background: white;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .summary-item {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .summary-item h3 {
            margin: 0 0 10px 0;
            color: #495057;
        }
        .summary-item .score {
            font-size: 2.5em;
            font-weight: bold;
            color: #007bff;
        }
        .recommendation {
            text-align: center;
            margin: 20px 0;
        }
        .badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 1.1em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .badge-success { background-color: #28a745; color: white; }
        .badge-danger { background-color: #dc3545; color: white; }
        .badge-warning { background-color: #ffc107; color: #212529; }
        .phase-section {
            background: white;
            margin-bottom: 30px;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .phase-header {
            background: #495057;
            color: white;
            padding: 20px;
            margin: 0;
            font-size: 1.5em;
        }
        .test-results {
            padding: 20px;
        }
        .test-item {
            display: flex;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #dee2e6;
        }
        .test-item.pass { border-left-color: #28a745; }
        .test-item.fail { border-left-color: #dc3545; }
        .test-item.warning { border-left-color: #ffc107; }
        .test-icon {
            font-size: 1.5em;
            margin-right: 15px;
        }
        .test-content {
            flex: 1;
        }
        .test-type {
            font-weight: bold;
            color: #495057;
            margin-bottom: 5px;
        }
        .test-message {
            color: #6c757d;
            margin-bottom: 10px;
        }
        .test-details {
            background: #e9ecef;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 0.9em;
            margin-top: 10px;
        }
        .details-toggle {
            background: #007bff;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8em;
            margin-top: 5px;
        }
        .details-toggle:hover {
            background: #0056b3;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding: 20px;
            color: #6c757d;
            font-size: 0.9em;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .metric-card h3 {
            margin: 0 0 15px 0;
            color: #495057;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #007bff;
        }
        .metric-label {
            color: #6c757d;
            font-size: 0.9em;
        }
        @media (max-width: 768px) {
            .summary-grid {
                grid-template-columns: 1fr;
            }
            .metrics-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Frontend QA Report</h1>
        <p>Comprehensive testing analysis for ${qaReport.url}</p>
        <p>Generated: ${new Date(qaReport.timestamp).toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="recommendation">
            <h2>Overall Recommendation</h2>
            ${recommendationBadge(qaReport.recommendation)}
        </div>
        
        <div class="summary-grid">
            <div class="summary-item">
                <h3>Overall Score</h3>
                <div class="score">${qaReport.overallScore.toFixed(0)}%</div>
            </div>
            <div class="summary-item">
                <h3>Total Tests</h3>
                <div class="score">${qaReport.testResults.length}</div>
            </div>
            <div class="summary-item">
                <h3>Passed</h3>
                <div class="score" style="color: #28a745;">${qaReport.testResults.filter(t => t.status === 'PASS').length}</div>
            </div>
            <div class="summary-item">
                <h3>Failed</h3>
                <div class="score" style="color: #dc3545;">${qaReport.testResults.filter(t => t.status === 'FAIL').length}</div>
            </div>
            <div class="summary-item">
                <h3>Warnings</h3>
                <div class="score" style="color: #ffc107;">${qaReport.testResults.filter(t => t.status === 'WARNING').length}</div>
            </div>
        </div>
    </div>

    <div class="metrics-grid">
        <div class="metric-card">
            <h3>🚀 Performance</h3>
            <div class="metric-value">${(qaReport.performanceTest.categories.performance.score * 100).toFixed(0)}%</div>
            <div class="metric-label">Lighthouse Score</div>
        </div>
        <div class="metric-card">
            <h3>♿ Accessibility</h3>
            <div class="metric-value">${(qaReport.performanceTest.categories.accessibility.score * 100).toFixed(0)}%</div>
            <div class="metric-label">Lighthouse Score</div>
        </div>
        <div class="metric-card">
            <h3>🔒 Security</h3>
            <div class="metric-value">${qaReport.securityTest.score.toFixed(0)}%</div>
            <div class="metric-label">Security Headers</div>
        </div>
        <div class="metric-card">
            <h3>📝 HTML Validation</h3>
            <div class="metric-value">${qaReport.htmlValidation.isValid ? '✅' : '❌'}</div>
            <div class="metric-label">${qaReport.htmlValidation.errors.length} errors</div>
        </div>
    </div>

    ${Object.entries(groupedTests).map(([phase, tests]) => `
        <div class="phase-section">
            <h2 class="phase-header">Phase ${phase}: ${this.getPhaseDescription(phase)}</h2>
            <div class="test-results">
                ${tests.map(test => `
                    <div class="test-item ${test.status.toLowerCase()}">
                        <div class="test-icon">${statusIcon(test.status)}</div>
                        <div class="test-content">
                            <div class="test-type">${test.testType}</div>
                            <div class="test-message">${test.message}</div>
                            ${test.details ? `
                                <button class="details-toggle" onclick="toggleDetails('${test.testType.replace(/\s+/g, '-')}-${test.timestamp}')">
                                    Show Details
                                </button>
                                <div id="${test.testType.replace(/\s+/g, '-')}-${test.timestamp}" class="test-details" style="display: none;">
                                    <pre>${JSON.stringify(test.details, null, 2)}</pre>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('')}

    <div class="footer">
        <p>Report generated by Frontend QA Agent v1.0.0</p>
        <p>Testing completed at ${new Date(qaReport.timestamp).toLocaleString()}</p>
    </div>

    <script>
        function toggleDetails(id) {
            const element = document.getElementById(id);
            const button = element.previousElementSibling;
            if (element.style.display === 'none') {
                element.style.display = 'block';
                button.textContent = 'Hide Details';
            } else {
                element.style.display = 'none';
                button.textContent = 'Show Details';
            }
        }
    </script>
</body>
</html>
    `.trim();
  }

  private generateSummaryReport(qaReport: QAReport): string {
    const passCount = qaReport.testResults.filter(t => t.status === 'PASS').length;
    const failCount = qaReport.testResults.filter(t => t.status === 'FAIL').length;
    const warningCount = qaReport.testResults.filter(t => t.status === 'WARNING').length;

    return `
🎯 FRONTEND QA REPORT SUMMARY
═══════════════════════════════════════════════════════════════════

📊 OVERALL ASSESSMENT
   URL: ${qaReport.url}
   Timestamp: ${new Date(qaReport.timestamp).toLocaleString()}
   Overall Score: ${qaReport.overallScore.toFixed(1)}%
   
   RECOMMENDATION: ${qaReport.recommendation}
   ${qaReport.recommendation === 'APPROVE' ? '✅' : qaReport.recommendation === 'REJECT' ? '❌' : '🔍'}

📈 TEST RESULTS BREAKDOWN
   Total Tests: ${qaReport.testResults.length}
   ✅ Passed: ${passCount} (${((passCount / qaReport.testResults.length) * 100).toFixed(1)}%)
   ❌ Failed: ${failCount} (${((failCount / qaReport.testResults.length) * 100).toFixed(1)}%)
   ⚠️  Warnings: ${warningCount} (${((warningCount / qaReport.testResults.length) * 100).toFixed(1)}%)

🔍 DETAILED METRICS
   ═══════════════════════════════════════════════════════════════════
   
   🚀 PERFORMANCE (Lighthouse)
      Overall Score: ${(qaReport.performanceTest.categories.performance.score * 100).toFixed(0)}%
      Accessibility: ${(qaReport.performanceTest.categories.accessibility.score * 100).toFixed(0)}%
      Best Practices: ${(qaReport.performanceTest.categories['best-practices'].score * 100).toFixed(0)}%
      SEO: ${(qaReport.performanceTest.categories.seo.score * 100).toFixed(0)}%
   
   ♿ ACCESSIBILITY
      Violations: ${qaReport.accessibilityTest.violations.length}
      Critical: ${qaReport.accessibilityTest.violations.filter(v => v.impact === 'critical').length}
      Serious: ${qaReport.accessibilityTest.violations.filter(v => v.impact === 'serious').length}
      Moderate: ${qaReport.accessibilityTest.violations.filter(v => v.impact === 'moderate').length}
      Minor: ${qaReport.accessibilityTest.violations.filter(v => v.impact === 'minor').length}
   
   🔒 SECURITY
      Security Score: ${qaReport.securityTest.score.toFixed(0)}%
      Headers Configured: ${Object.values(qaReport.securityTest.headers).filter(Boolean).length}/${Object.keys(qaReport.securityTest.headers).length}
      
   📝 HTML VALIDATION
      Valid HTML: ${qaReport.htmlValidation.isValid ? 'YES' : 'NO'}
      Errors: ${qaReport.htmlValidation.errors.length}
      Warnings: ${qaReport.htmlValidation.warnings.length}
   
   🎨 VISUAL TESTING
      Visual Regression: ${qaReport.visualTest.passed ? 'PASSED' : 'FAILED'}
      Pixel Difference: ${qaReport.visualTest.pixelDifference.toFixed(2)}%
      Threshold: ${qaReport.visualTest.threshold}%

📋 CRITICAL ISSUES
   ═══════════════════════════════════════════════════════════════════
   ${qaReport.testResults
     .filter(t => t.status === 'FAIL')
     .map(test => `   ❌ ${test.testType}: ${test.message}`)
     .join('\n   ')
   }

⚠️  WARNINGS
   ═══════════════════════════════════════════════════════════════════
   ${qaReport.testResults
     .filter(t => t.status === 'WARNING')
     .map(test => `   ⚠️  ${test.testType}: ${test.message}`)
     .join('\n   ')
   }

💡 RECOMMENDATIONS
   ═══════════════════════════════════════════════════════════════════
   ${qaReport.securityTest.recommendations.map(rec => `   • ${rec}`).join('\n   ')}

📊 SUMMARY
   ═══════════════════════════════════════════════════════════════════
   ${qaReport.summary}

═══════════════════════════════════════════════════════════════════
Report generated by Frontend QA Agent v1.0.0
Testing completed at ${new Date(qaReport.timestamp).toLocaleString()}
═══════════════════════════════════════════════════════════════════
    `.trim();
  }

  private groupTestsByPhase(tests: QATestResult[]): Record<string, QATestResult[]> {
    return tests.reduce((groups, test) => {
      const phase = test.phase;
      if (!groups[phase]) {
        groups[phase] = [];
      }
      groups[phase].push(test);
      return groups;
    }, {} as Record<string, QATestResult[]>);
  }

  private getPhaseDescription(phase: string): string {
    switch (phase) {
      case 'A': return 'HTTP Testing & Content Validation';
      case 'B': return 'Browser Automation & Performance Testing';
      case 'C': return 'Visual Testing & Screenshot Analysis';
      default: return 'Unknown Phase';
    }
  }

  calculateOverallScore(qaReport: QAReport): number {
    const weights = {
      httpTest: 0.15,
      performanceTest: 0.25,
      accessibilityTest: 0.25,
      securityTest: 0.20,
      htmlValidation: 0.10,
      visualTest: 0.05
    };

    // Calculate individual scores
    const httpScore = qaReport.httpTest.errors.length === 0 ? 100 : 50;
    const performanceScore = qaReport.performanceTest.categories.performance.score * 100;
    const accessibilityScore = qaReport.accessibilityTest.violations.length === 0 ? 100 : 
      Math.max(0, 100 - (qaReport.accessibilityTest.violations.length * 10));
    const securityScore = qaReport.securityTest.score;
    const htmlScore = qaReport.htmlValidation.isValid ? 100 : 
      Math.max(0, 100 - (qaReport.htmlValidation.errors.length * 5));
    const visualScore = qaReport.visualTest.passed ? 100 : 50;

    // Calculate weighted average
    const overallScore = (
      httpScore * weights.httpTest +
      performanceScore * weights.performanceTest +
      accessibilityScore * weights.accessibilityTest +
      securityScore * weights.securityTest +
      htmlScore * weights.htmlValidation +
      visualScore * weights.visualTest
    );

    return Math.round(overallScore);
  }

  determineRecommendation(qaReport: QAReport): 'APPROVE' | 'REJECT' | 'NEEDS_REVIEW' {
    const criticalFailures = qaReport.testResults.filter(t => 
      t.status === 'FAIL' && (
        t.testType.includes('Security') ||
        t.testType.includes('Accessibility') ||
        t.testType.includes('Performance')
      )
    ).length;

    const overallScore = qaReport.overallScore;
    const hasSecurityIssues = qaReport.securityTest.score < 70;
    const hasAccessibilityIssues = qaReport.accessibilityTest.violations.filter(v => 
      v.impact === 'critical' || v.impact === 'serious'
    ).length > 0;
    const hasPerformanceIssues = qaReport.performanceTest.categories.performance.score < 0.7;

    if (criticalFailures > 0 || hasSecurityIssues || hasAccessibilityIssues || hasPerformanceIssues) {
      return 'REJECT';
    }

    if (overallScore >= 85) {
      return 'APPROVE';
    }

    return 'NEEDS_REVIEW';
  }

  generateExecutiveSummary(qaReport: QAReport): string {
    const passRate = (qaReport.testResults.filter(t => t.status === 'PASS').length / qaReport.testResults.length) * 100;
    const recommendation = qaReport.recommendation;
    
    let summary = `Frontend QA analysis completed for ${qaReport.url} with an overall score of ${qaReport.overallScore}% (${passRate.toFixed(1)}% pass rate). `;
    
    if (recommendation === 'APPROVE') {
      summary += 'The application meets quality standards and is recommended for approval. ';
    } else if (recommendation === 'REJECT') {
      summary += 'The application has critical issues that prevent approval. ';
    } else {
      summary += 'The application requires review before approval decision. ';
    }

    // Add key findings
    const keyIssues = qaReport.testResults
      .filter(t => t.status === 'FAIL')
      .slice(0, 3)
      .map(t => t.testType)
      .join(', ');

    if (keyIssues) {
      summary += `Key issues identified: ${keyIssues}. `;
    }

    // Add performance summary
    const perfScore = Math.round(qaReport.performanceTest.categories.performance.score * 100);
    summary += `Performance score: ${perfScore}%. `;

    // Add accessibility summary
    const a11yViolations = qaReport.accessibilityTest.violations.length;
    if (a11yViolations === 0) {
      summary += 'No accessibility violations found. ';
    } else {
      summary += `${a11yViolations} accessibility violations detected. `;
    }

    return summary;
  }
}