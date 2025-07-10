import { VisualTestResult, QATestResult } from './types';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export class VisualTester {
  private screenshotPath: string;
  private threshold: number;

  constructor(screenshotPath: string, threshold: number = 0.1) {
    this.screenshotPath = screenshotPath;
    this.threshold = threshold;
  }

  async compareScreenshots(baselinePath: string, currentPath: string, testName: string): Promise<VisualTestResult> {
    try {
      // Ensure both images exist
      if (!fs.existsSync(baselinePath)) {
        // If baseline doesn't exist, create it from current
        fs.copyFileSync(currentPath, baselinePath);
        return {
          baseline: baselinePath,
          current: currentPath,
          diff: '',
          pixelDifference: 0,
          threshold: this.threshold,
          passed: true
        };
      }

      // Read both images
      const baselineImg = PNG.sync.read(fs.readFileSync(baselinePath));
      const currentImg = PNG.sync.read(fs.readFileSync(currentPath));

      // Ensure images have same dimensions
      if (baselineImg.width !== currentImg.width || baselineImg.height !== currentImg.height) {
        throw new Error(`Image dimensions don't match: baseline(${baselineImg.width}x${baselineImg.height}) vs current(${currentImg.width}x${currentImg.height})`);
      }

      // Create diff image
      const diffImg = new PNG({ width: baselineImg.width, height: baselineImg.height });
      
      // Compare images
      const pixelDiff = pixelmatch(
        baselineImg.data,
        currentImg.data,
        diffImg.data,
        baselineImg.width,
        baselineImg.height,
        {
          threshold: this.threshold,
          includeAA: false,
          diffMask: true
        }
      );

      // Calculate difference percentage
      const totalPixels = baselineImg.width * baselineImg.height;
      const pixelDifference = (pixelDiff / totalPixels) * 100;

      // Save diff image
      const diffPath = path.join(this.screenshotPath, `${testName}-diff.png`);
      fs.writeFileSync(diffPath, PNG.sync.write(diffImg));

      return {
        baseline: baselinePath,
        current: currentPath,
        diff: diffPath,
        pixelDifference,
        threshold: this.threshold,
        passed: pixelDifference <= this.threshold
      };

    } catch (error) {
      throw new Error(`Visual comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateScreenshot(screenshotPath: string, testName: string): Promise<QATestResult[]> {
    const testResults: QATestResult[] = [];

    try {
      // Check if screenshot exists
      if (!fs.existsSync(screenshotPath)) {
        testResults.push({
          phase: 'C',
          testType: 'Screenshot Capture',
          status: 'FAIL',
          message: `Screenshot not found: ${screenshotPath}`,
          details: { path: screenshotPath },
          timestamp: new Date().toISOString()
        });
        return testResults;
      }

      // Check file size
      const stats = fs.statSync(screenshotPath);
      if (stats.size === 0) {
        testResults.push({
          phase: 'C',
          testType: 'Screenshot Validation',
          status: 'FAIL',
          message: 'Screenshot file is empty',
          details: { path: screenshotPath, size: stats.size },
          timestamp: new Date().toISOString()
        });
        return testResults;
      }

      // Validate PNG format
      try {
        const img = PNG.sync.read(fs.readFileSync(screenshotPath));
        
        testResults.push({
          phase: 'C',
          testType: 'Screenshot Format',
          status: 'PASS',
          message: `Valid PNG screenshot (${img.width}x${img.height})`,
          details: { 
            path: screenshotPath, 
            width: img.width, 
            height: img.height,
            size: stats.size
          },
          timestamp: new Date().toISOString()
        });

        // Check for reasonable dimensions
        if (img.width < 100 || img.height < 100) {
          testResults.push({
            phase: 'C',
            testType: 'Screenshot Dimensions',
            status: 'WARNING',
            message: `Screenshot dimensions seem too small: ${img.width}x${img.height}`,
            details: { width: img.width, height: img.height },
            timestamp: new Date().toISOString()
          });
        } else {
          testResults.push({
            phase: 'C',
            testType: 'Screenshot Dimensions',
            status: 'PASS',
            message: `Good screenshot dimensions: ${img.width}x${img.height}`,
            details: { width: img.width, height: img.height },
            timestamp: new Date().toISOString()
          });
        }

      } catch (error) {
        testResults.push({
          phase: 'C',
          testType: 'Screenshot Format',
          status: 'FAIL',
          message: `Invalid PNG format: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { path: screenshotPath, error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      testResults.push({
        phase: 'C',
        testType: 'Screenshot Validation',
        status: 'FAIL',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      });
    }

    return testResults;
  }

  async performVisualRegression(currentScreenshot: string, testName: string): Promise<QATestResult[]> {
    const testResults: QATestResult[] = [];
    
    try {
      const baselinePath = path.join(this.screenshotPath, 'baseline', `${testName}.png`);
      
      // Ensure baseline directory exists
      const baselineDir = path.dirname(baselinePath);
      if (!fs.existsSync(baselineDir)) {
        fs.mkdirSync(baselineDir, { recursive: true });
      }

      const visualResult = await this.compareScreenshots(baselinePath, currentScreenshot, testName);

      if (visualResult.passed) {
        testResults.push({
          phase: 'C',
          testType: 'Visual Regression',
          status: 'PASS',
          message: `Visual regression test passed - ${visualResult.pixelDifference.toFixed(2)}% difference`,
          details: visualResult,
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'C',
          testType: 'Visual Regression',
          status: 'FAIL',
          message: `Visual regression test failed - ${visualResult.pixelDifference.toFixed(2)}% difference (threshold: ${visualResult.threshold}%)`,
          details: visualResult,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      testResults.push({
        phase: 'C',
        testType: 'Visual Regression',
        status: 'FAIL',
        message: `Visual regression test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      });
    }

    return testResults;
  }

  async analyzeVisualContent(screenshotPath: string): Promise<QATestResult[]> {
    const testResults: QATestResult[] = [];

    try {
      if (!fs.existsSync(screenshotPath)) {
        throw new Error('Screenshot not found');
      }

      const img = PNG.sync.read(fs.readFileSync(screenshotPath));
      
      // Analyze color distribution
      const colorAnalysis = this.analyzeColors(img);
      
      // Check for blank/white pages
      if (colorAnalysis.isBlank) {
        testResults.push({
          phase: 'C',
          testType: 'Visual Content Analysis',
          status: 'FAIL',
          message: 'Screenshot appears to be blank or mostly white',
          details: colorAnalysis,
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'C',
          testType: 'Visual Content Analysis',
          status: 'PASS',
          message: 'Screenshot contains visual content',
          details: colorAnalysis,
          timestamp: new Date().toISOString()
        });
      }

      // Check for sufficient contrast
      if (colorAnalysis.hasGoodContrast) {
        testResults.push({
          phase: 'C',
          testType: 'Visual Contrast',
          status: 'PASS',
          message: 'Good visual contrast detected',
          details: { contrast: colorAnalysis.contrastRatio },
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'C',
          testType: 'Visual Contrast',
          status: 'WARNING',
          message: 'Low visual contrast detected',
          details: { contrast: colorAnalysis.contrastRatio },
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      testResults.push({
        phase: 'C',
        testType: 'Visual Content Analysis',
        status: 'FAIL',
        message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      });
    }

    return testResults;
  }

  private analyzeColors(img: PNG): any {
    const data = img.data;
    const totalPixels = img.width * img.height;
    let whitePixels = 0;
    let blackPixels = 0;
    let coloredPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Check if pixel is white/near white
      if (r > 240 && g > 240 && b > 240) {
        whitePixels++;
      }
      // Check if pixel is black/near black
      else if (r < 15 && g < 15 && b < 15) {
        blackPixels++;
      }
      // Colored pixel
      else {
        coloredPixels++;
      }
    }

    const whitePercentage = (whitePixels / totalPixels) * 100;
    const blackPercentage = (blackPixels / totalPixels) * 100;
    const coloredPercentage = (coloredPixels / totalPixels) * 100;

    return {
      isBlank: whitePercentage > 90,
      whitePercentage,
      blackPercentage,
      coloredPercentage,
      hasGoodContrast: blackPercentage > 5 && coloredPercentage > 10,
      contrastRatio: blackPercentage + coloredPercentage
    };
  }
}