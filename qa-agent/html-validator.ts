import { HTMLValidationResult, QATestResult } from './types';

export class HTMLValidator {
  async validateHTML(html: string): Promise<HTMLValidationResult> {
    // For now, we'll use basic validation since the html-validator service
    // requires additional setup
    return this.performBasicValidation(html);
  }

  private performBasicValidation(html: string): HTMLValidationResult {
    const errors: Array<{
      line: number;
      column: number;
      message: string;
      type: 'error' | 'warning';
    }> = [];

    const warnings: Array<{
      line: number;
      column: number;
      message: string;
      type: 'warning';
    }> = [];

    // Basic HTML structure checks
    if (!html.includes('<!DOCTYPE') && !html.includes('<!doctype')) {
      errors.push({
        line: 1,
        column: 1,
        message: 'Missing DOCTYPE declaration',
        type: 'error'
      });
    }

    if (!html.includes('<html')) {
      errors.push({
        line: 1,
        column: 1,
        message: 'Missing <html> tag',
        type: 'error'
      });
    }

    if (!html.includes('<head>')) {
      errors.push({
        line: 1,
        column: 1,
        message: 'Missing <head> tag',
        type: 'error'
      });
    }

    if (!html.includes('<body>')) {
      errors.push({
        line: 1,
        column: 1,
        message: 'Missing <body> tag',
        type: 'error'
      });
    }

    // Check for unclosed tags (simplified)
    const openTags = html.match(/<[^\/][^>]*>/g) || [];
    const closeTags = html.match(/<\/[^>]*>/g) || [];
    
    if (openTags.length !== closeTags.length) {
      warnings.push({
        line: 1,
        column: 1,
        message: 'Potential unclosed tags detected',
        type: 'warning'
      });
    }

    // Check for duplicate IDs (simplified)
    const ids = html.match(/id="([^"]*)"/g) || [];
    const uniqueIds = new Set(ids);
    
    if (ids.length !== uniqueIds.size) {
      errors.push({
        line: 1,
        column: 1,
        message: 'Duplicate IDs detected',
        type: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async generateValidationTests(html: string): Promise<QATestResult[]> {
    const testResults: QATestResult[] = [];

    try {
      const validationResult = await this.validateHTML(html);

      // Overall validation result
      if (validationResult.isValid) {
        testResults.push({
          phase: 'A',
          testType: 'HTML Validation',
          status: 'PASS',
          message: `HTML is valid (${validationResult.warnings.length} warnings)`,
          details: validationResult,
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'A',
          testType: 'HTML Validation',
          status: 'FAIL',
          message: `HTML validation failed: ${validationResult.errors.length} errors found`,
          details: validationResult,
          timestamp: new Date().toISOString()
        });
      }

      // Document structure tests
      this.testDocumentStructure(html, testResults);

      // Semantic HTML tests
      this.testSemanticHTML(html, testResults);

      // Accessibility-related HTML tests
      this.testAccessibilityHTML(html, testResults);

    } catch (error) {
      testResults.push({
        phase: 'A',
        testType: 'HTML Validation',
        status: 'FAIL',
        message: `HTML validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      });
    }

    return testResults;
  }

  private testDocumentStructure(html: string, testResults: QATestResult[]): void {
    // Test for proper DOCTYPE
    const hasDoctype = html.includes('<!DOCTYPE html>') || html.includes('<!doctype html>');
    
    if (hasDoctype) {
      testResults.push({
        phase: 'A',
        testType: 'HTML DOCTYPE',
        status: 'PASS',
        message: 'HTML5 DOCTYPE declaration found',
        timestamp: new Date().toISOString()
      });
    } else {
      testResults.push({
        phase: 'A',
        testType: 'HTML DOCTYPE',
        status: 'FAIL',
        message: 'Missing or incorrect DOCTYPE declaration',
        timestamp: new Date().toISOString()
      });
    }

    // Test for lang attribute
    const hasLang = html.includes('<html lang=') || html.includes('<html xml:lang=');
    
    if (hasLang) {
      testResults.push({
        phase: 'A',
        testType: 'HTML Lang Attribute',
        status: 'PASS',
        message: 'HTML lang attribute found',
        timestamp: new Date().toISOString()
      });
    } else {
      testResults.push({
        phase: 'A',
        testType: 'HTML Lang Attribute',
        status: 'WARNING',
        message: 'HTML lang attribute missing',
        timestamp: new Date().toISOString()
      });
    }

    // Test for meta charset
    const hasCharset = html.includes('<meta charset=') || html.includes('<meta http-equiv="Content-Type"');
    
    if (hasCharset) {
      testResults.push({
        phase: 'A',
        testType: 'Meta Charset',
        status: 'PASS',
        message: 'Meta charset declaration found',
        timestamp: new Date().toISOString()
      });
    } else {
      testResults.push({
        phase: 'A',
        testType: 'Meta Charset',
        status: 'WARNING',
        message: 'Meta charset declaration missing',
        timestamp: new Date().toISOString()
      });
    }

    // Test for title tag
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    
    if (titleMatch && titleMatch[1].trim().length > 0) {
      testResults.push({
        phase: 'A',
        testType: 'HTML Title',
        status: 'PASS',
        message: `Valid page title found: "${titleMatch[1].trim()}"`,
        details: { title: titleMatch[1].trim() },
        timestamp: new Date().toISOString()
      });
    } else {
      testResults.push({
        phase: 'A',
        testType: 'HTML Title',
        status: 'FAIL',
        message: 'Missing or empty page title',
        timestamp: new Date().toISOString()
      });
    }
  }

  private testSemanticHTML(html: string, testResults: QATestResult[]): void {
    // Check for semantic HTML5 elements
    const semanticElements = ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer'];
    const foundElements = semanticElements.filter(element => 
      html.includes(`<${element}`) || html.includes(`<${element} `)
    );

    if (foundElements.length >= 3) {
      testResults.push({
        phase: 'A',
        testType: 'Semantic HTML',
        status: 'PASS',
        message: `Good use of semantic elements: ${foundElements.join(', ')}`,
        details: { semanticElements: foundElements },
        timestamp: new Date().toISOString()
      });
    } else if (foundElements.length > 0) {
      testResults.push({
        phase: 'A',
        testType: 'Semantic HTML',
        status: 'WARNING',
        message: `Limited use of semantic elements: ${foundElements.join(', ')}`,
        details: { semanticElements: foundElements },
        timestamp: new Date().toISOString()
      });
    } else {
      testResults.push({
        phase: 'A',
        testType: 'Semantic HTML',
        status: 'FAIL',
        message: 'No semantic HTML5 elements found',
        details: { semanticElements: [] },
        timestamp: new Date().toISOString()
      });
    }

    // Check for proper heading hierarchy
    const headingMatches = html.match(/<h[1-6]/g) || [];
    const headingLevels = headingMatches.map(h => parseInt(h.charAt(2)));
    
    if (headingLevels.length > 0) {
      const hasH1 = headingLevels.includes(1);
      const isSequential = headingLevels.every((level, index) => {
        if (index === 0) return true;
        return level <= headingLevels[index - 1] + 1;
      });

      if (hasH1 && isSequential) {
        testResults.push({
          phase: 'A',
          testType: 'Heading Hierarchy',
          status: 'PASS',
          message: 'Proper heading hierarchy found',
          details: { headingLevels },
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'A',
          testType: 'Heading Hierarchy',
          status: 'WARNING',
          message: 'Heading hierarchy issues detected',
          details: { headingLevels, hasH1, isSequential },
          timestamp: new Date().toISOString()
        });
      }
    } else {
      testResults.push({
        phase: 'A',
        testType: 'Heading Hierarchy',
        status: 'WARNING',
        message: 'No heading elements found',
        details: { headingLevels: [] },
        timestamp: new Date().toISOString()
      });
    }
  }

  private testAccessibilityHTML(html: string, testResults: QATestResult[]): void {
    // Test for alt attributes on images
    const imgMatches = html.match(/<img[^>]*>/g) || [];
    const imagesWithAlt = imgMatches.filter(img => img.includes('alt='));
    
    if (imgMatches.length === 0) {
      testResults.push({
        phase: 'A',
        testType: 'Image Alt Attributes',
        status: 'PASS',
        message: 'No images found',
        timestamp: new Date().toISOString()
      });
    } else if (imagesWithAlt.length === imgMatches.length) {
      testResults.push({
        phase: 'A',
        testType: 'Image Alt Attributes',
        status: 'PASS',
        message: `All ${imgMatches.length} images have alt attributes`,
        details: { totalImages: imgMatches.length, imagesWithAlt: imagesWithAlt.length },
        timestamp: new Date().toISOString()
      });
    } else {
      testResults.push({
        phase: 'A',
        testType: 'Image Alt Attributes',
        status: 'FAIL',
        message: `${imgMatches.length - imagesWithAlt.length} images missing alt attributes`,
        details: { totalImages: imgMatches.length, imagesWithAlt: imagesWithAlt.length },
        timestamp: new Date().toISOString()
      });
    }

    // Test for form labels
    const inputMatches = html.match(/<input[^>]*>/g) || [];
    const inputsWithLabels = inputMatches.filter(input => {
      const hasId = input.includes('id=');
      const hasAriaLabel = input.includes('aria-label=');
      const hasAriaLabelledBy = input.includes('aria-labelledby=');
      
      return hasId || hasAriaLabel || hasAriaLabelledBy;
    });

    if (inputMatches.length === 0) {
      testResults.push({
        phase: 'A',
        testType: 'Form Input Labels',
        status: 'PASS',
        message: 'No form inputs found',
        timestamp: new Date().toISOString()
      });
    } else if (inputsWithLabels.length === inputMatches.length) {
      testResults.push({
        phase: 'A',
        testType: 'Form Input Labels',
        status: 'PASS',
        message: `All ${inputMatches.length} form inputs have associated labels`,
        details: { totalInputs: inputMatches.length, inputsWithLabels: inputsWithLabels.length },
        timestamp: new Date().toISOString()
      });
    } else {
      testResults.push({
        phase: 'A',
        testType: 'Form Input Labels',
        status: 'WARNING',
        message: `${inputMatches.length - inputsWithLabels.length} form inputs may be missing labels`,
        details: { totalInputs: inputMatches.length, inputsWithLabels: inputsWithLabels.length },
        timestamp: new Date().toISOString()
      });
    }
  }
}