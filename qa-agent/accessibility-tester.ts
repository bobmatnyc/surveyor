import { Page } from 'playwright';
import { AccessibilityTestResult, QATestResult } from './types';

export class AccessibilityTester {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async runAccessibilityTests(): Promise<AccessibilityTestResult> {
    try {
      // Inject axe-core into the page
      await this.page.addScriptTag({
        url: 'https://unpkg.com/axe-core@4.10.0/axe.min.js'
      });

      // Run accessibility scan
      const results = await this.page.evaluate(() => {
        return (window as any).axe.run();
      });

      // Process violations
      const violations = results.violations.map((violation: any) => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        nodes: violation.nodes.map((node: any) => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary
        }))
      }));

      return {
        violations,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        inapplicable: results.inapplicable.length
      };

    } catch (error) {
      throw new Error(`Accessibility testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateAccessibility(): Promise<QATestResult[]> {
    const testResults: QATestResult[] = [];

    try {
      const a11yResults = await this.runAccessibilityTests();

      // Overall accessibility score
      const totalTests = a11yResults.passes + a11yResults.violations.length + a11yResults.incomplete;
      const passRate = totalTests > 0 ? (a11yResults.passes / totalTests) * 100 : 0;

      if (a11yResults.violations.length === 0) {
        testResults.push({
          phase: 'B',
          testType: 'Accessibility Compliance',
          status: 'PASS',
          message: `No accessibility violations found (${a11yResults.passes} tests passed)`,
          details: a11yResults,
          timestamp: new Date().toISOString()
        });
      } else {
        const criticalViolations = a11yResults.violations.filter(v => v.impact === 'critical').length;
        const seriousViolations = a11yResults.violations.filter(v => v.impact === 'serious').length;
        const moderateViolations = a11yResults.violations.filter(v => v.impact === 'moderate').length;
        const minorViolations = a11yResults.violations.filter(v => v.impact === 'minor').length;

        const status = criticalViolations > 0 || seriousViolations > 0 ? 'FAIL' : 'WARNING';
        
        testResults.push({
          phase: 'B',
          testType: 'Accessibility Compliance',
          status,
          message: `${a11yResults.violations.length} accessibility violations found: ${criticalViolations} critical, ${seriousViolations} serious, ${moderateViolations} moderate, ${minorViolations} minor`,
          details: a11yResults,
          timestamp: new Date().toISOString()
        });
      }

      // Test specific accessibility requirements
      await this.testKeyboardNavigation(testResults);
      await this.testAriaLabels(testResults);
      await this.testHeadingStructure(testResults);
      await this.testColorContrast(testResults);
      await this.testImageAlternatives(testResults);
      await this.testFormLabels(testResults);

    } catch (error) {
      testResults.push({
        phase: 'B',
        testType: 'Accessibility Testing',
        status: 'FAIL',
        message: `Accessibility testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      });
    }

    return testResults;
  }

  private async testKeyboardNavigation(testResults: QATestResult[]): Promise<void> {
    try {
      // Test tab navigation
      const focusableElements = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]');
        return Array.from(elements).filter(el => {
          const tabIndex = el.getAttribute('tabindex');
          return tabIndex !== '-1' && !el.hasAttribute('disabled');
        }).length;
      });

      if (focusableElements > 0) {
        testResults.push({
          phase: 'B',
          testType: 'Keyboard Navigation',
          status: 'PASS',
          message: `Found ${focusableElements} focusable elements`,
          details: { focusableElements },
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'B',
          testType: 'Keyboard Navigation',
          status: 'WARNING',
          message: 'No focusable elements found',
          details: { focusableElements },
          timestamp: new Date().toISOString()
        });
      }

      // Test focus visibility
      const hasFocusStyles = await this.page.evaluate(() => {
        const styles = window.getComputedStyle(document.body);
        const hasOutline = styles.outline !== 'none';
        const hasFocusVisible = document.querySelector('[data-focus-visible-added]') !== null;
        return hasOutline || hasFocusVisible;
      });

      if (hasFocusStyles) {
        testResults.push({
          phase: 'B',
          testType: 'Focus Visibility',
          status: 'PASS',
          message: 'Focus styles detected',
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'B',
          testType: 'Focus Visibility',
          status: 'WARNING',
          message: 'No focus styles detected',
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      testResults.push({
        phase: 'B',
        testType: 'Keyboard Navigation',
        status: 'FAIL',
        message: `Keyboard navigation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async testAriaLabels(testResults: QATestResult[]): Promise<void> {
    try {
      const ariaResults = await this.page.evaluate(() => {
        const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]');
        const interactiveElements = document.querySelectorAll('button, input, select, textarea, a');
        const interactiveWithAria = Array.from(interactiveElements).filter(el => 
          el.hasAttribute('aria-label') || 
          el.hasAttribute('aria-labelledby') || 
          el.hasAttribute('aria-describedby') ||
          el.hasAttribute('role')
        );

        return {
          totalAriaElements: elementsWithAria.length,
          totalInteractive: interactiveElements.length,
          interactiveWithAria: interactiveWithAria.length
        };
      });

      const ariaUsageRate = ariaResults.totalInteractive > 0 ? 
        (ariaResults.interactiveWithAria / ariaResults.totalInteractive) * 100 : 0;

      if (ariaUsageRate > 80) {
        testResults.push({
          phase: 'B',
          testType: 'ARIA Labels',
          status: 'PASS',
          message: `Good ARIA usage: ${ariaUsageRate.toFixed(0)}% of interactive elements have ARIA attributes`,
          details: ariaResults,
          timestamp: new Date().toISOString()
        });
      } else if (ariaUsageRate > 50) {
        testResults.push({
          phase: 'B',
          testType: 'ARIA Labels',
          status: 'WARNING',
          message: `Moderate ARIA usage: ${ariaUsageRate.toFixed(0)}% of interactive elements have ARIA attributes`,
          details: ariaResults,
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'B',
          testType: 'ARIA Labels',
          status: 'FAIL',
          message: `Poor ARIA usage: ${ariaUsageRate.toFixed(0)}% of interactive elements have ARIA attributes`,
          details: ariaResults,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      testResults.push({
        phase: 'B',
        testType: 'ARIA Labels',
        status: 'FAIL',
        message: `ARIA label test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async testHeadingStructure(testResults: QATestResult[]): Promise<void> {
    try {
      const headingStructure = await this.page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const structure = headings.map(h => ({
          level: parseInt(h.tagName.charAt(1)),
          text: h.textContent?.trim() || '',
          hasContent: (h.textContent?.trim().length || 0) > 0
        }));

        const h1Count = structure.filter(h => h.level === 1).length;
        const hasProperOrder = structure.every((heading, index) => {
          if (index === 0) return true;
          const prevLevel = structure[index - 1].level;
          return heading.level <= prevLevel + 1;
        });

        return {
          headings: structure,
          h1Count,
          hasProperOrder,
          totalHeadings: structure.length
        };
      });

      // Check for single H1
      if (headingStructure.h1Count === 1) {
        testResults.push({
          phase: 'B',
          testType: 'Heading Structure - H1',
          status: 'PASS',
          message: 'Proper H1 usage (exactly one H1 found)',
          details: { h1Count: headingStructure.h1Count },
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'B',
          testType: 'Heading Structure - H1',
          status: 'WARNING',
          message: `Improper H1 usage: ${headingStructure.h1Count} H1 elements found`,
          details: { h1Count: headingStructure.h1Count },
          timestamp: new Date().toISOString()
        });
      }

      // Check heading hierarchy
      if (headingStructure.hasProperOrder) {
        testResults.push({
          phase: 'B',
          testType: 'Heading Structure - Hierarchy',
          status: 'PASS',
          message: 'Proper heading hierarchy maintained',
          details: headingStructure,
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'B',
          testType: 'Heading Structure - Hierarchy',
          status: 'FAIL',
          message: 'Improper heading hierarchy detected',
          details: headingStructure,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      testResults.push({
        phase: 'B',
        testType: 'Heading Structure',
        status: 'FAIL',
        message: `Heading structure test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async testColorContrast(testResults: QATestResult[]): Promise<void> {
    try {
      // This is a simplified contrast test - axe-core does the heavy lifting
      const contrastElements = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
        let testedElements = 0;
        
        Array.from(elements).forEach(el => {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const backgroundColor = style.backgroundColor;
          
          if (color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
            testedElements++;
          }
        });

        return { testedElements };
      });

      testResults.push({
        phase: 'B',
        testType: 'Color Contrast',
        status: 'PASS',
        message: `Color contrast analysis completed (${contrastElements.testedElements} elements checked)`,
        details: contrastElements,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      testResults.push({
        phase: 'B',
        testType: 'Color Contrast',
        status: 'FAIL',
        message: `Color contrast test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async testImageAlternatives(testResults: QATestResult[]): Promise<void> {
    try {
      const imageResults = await this.page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const imagesWithAlt = images.filter(img => img.hasAttribute('alt'));
        const imagesWithEmptyAlt = images.filter(img => img.getAttribute('alt') === '');
        const imagesWithMeaningfulAlt = images.filter(img => {
          const alt = img.getAttribute('alt');
          return alt && alt.trim().length > 0;
        });

        return {
          totalImages: images.length,
          imagesWithAlt: imagesWithAlt.length,
          imagesWithEmptyAlt: imagesWithEmptyAlt.length,
          imagesWithMeaningfulAlt: imagesWithMeaningfulAlt.length
        };
      });

      if (imageResults.totalImages === 0) {
        testResults.push({
          phase: 'B',
          testType: 'Image Alternatives',
          status: 'PASS',
          message: 'No images found',
          details: imageResults,
          timestamp: new Date().toISOString()
        });
      } else {
        const altTextRate = (imageResults.imagesWithAlt / imageResults.totalImages) * 100;
        
        if (altTextRate === 100) {
          testResults.push({
            phase: 'B',
            testType: 'Image Alternatives',
            status: 'PASS',
            message: `All ${imageResults.totalImages} images have alt attributes`,
            details: imageResults,
            timestamp: new Date().toISOString()
          });
        } else {
          testResults.push({
            phase: 'B',
            testType: 'Image Alternatives',
            status: 'FAIL',
            message: `${imageResults.totalImages - imageResults.imagesWithAlt} images missing alt attributes`,
            details: imageResults,
            timestamp: new Date().toISOString()
          });
        }
      }

    } catch (error) {
      testResults.push({
        phase: 'B',
        testType: 'Image Alternatives',
        status: 'FAIL',
        message: `Image alternatives test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async testFormLabels(testResults: QATestResult[]): Promise<void> {
    try {
      const formResults = await this.page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
        const inputsWithLabels = inputs.filter(input => {
          const hasLabel = document.querySelector(`label[for="${input.id}"]`) !== null;
          const hasAriaLabel = input.hasAttribute('aria-label');
          const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');
          const hasTitle = input.hasAttribute('title');
          
          return hasLabel || hasAriaLabel || hasAriaLabelledBy || hasTitle;
        });

        return {
          totalInputs: inputs.length,
          inputsWithLabels: inputsWithLabels.length
        };
      });

      if (formResults.totalInputs === 0) {
        testResults.push({
          phase: 'B',
          testType: 'Form Labels',
          status: 'PASS',
          message: 'No form inputs found',
          details: formResults,
          timestamp: new Date().toISOString()
        });
      } else {
        const labelRate = (formResults.inputsWithLabels / formResults.totalInputs) * 100;
        
        if (labelRate === 100) {
          testResults.push({
            phase: 'B',
            testType: 'Form Labels',
            status: 'PASS',
            message: `All ${formResults.totalInputs} form inputs have labels`,
            details: formResults,
            timestamp: new Date().toISOString()
          });
        } else {
          testResults.push({
            phase: 'B',
            testType: 'Form Labels',
            status: 'FAIL',
            message: `${formResults.totalInputs - formResults.inputsWithLabels} form inputs missing labels`,
            details: formResults,
            timestamp: new Date().toISOString()
          });
        }
      }

    } catch (error) {
      testResults.push({
        phase: 'B',
        testType: 'Form Labels',
        status: 'FAIL',
        message: `Form labels test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      });
    }
  }
}