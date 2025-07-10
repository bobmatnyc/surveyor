import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import { QATestResult, QAAgentConfig } from './types';
import fs from 'fs';
import path from 'path';

export class BrowserTester {
  private config: QAAgentConfig;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private visualMode: boolean = false;
  private interactionDelay: number = 2000; // Default 2 seconds for visual verification

  constructor(config: QAAgentConfig) {
    this.config = config;
    this.visualMode = config.visualBrowserMode || false;
    this.interactionDelay = config.visualInteractionDelay || 2000;
  }

  async initialize(): Promise<void> {
    console.log(`🌐 Initializing browser: ${this.config.browser} (${this.visualMode ? 'Visual' : 'Headless'} mode)`);
    
    // Configure browser launch options
    const baseArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-zygote'
    ];

    // Add visual mode specific arguments
    const visualArgs = this.visualMode ? [
      '--start-maximized',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ] : [
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ];

    const launchOptions = {
      headless: !this.visualMode,
      args: [...baseArgs, ...visualArgs],
      slowMo: this.visualMode ? 500 : 0, // Slow down actions for visual verification
      timeout: this.config.testTimeout
    };

    // Launch browser based on config
    switch (this.config.browser) {
      case 'chromium':
        this.browser = await chromium.launch(launchOptions);
        break;
      case 'msedge':
        // MS Edge using Chromium engine
        this.browser = await chromium.launch({
          ...launchOptions,
          channel: 'msedge'
        });
        break;
      case 'firefox':
        this.browser = await firefox.launch({
          headless: !this.visualMode,
          slowMo: this.visualMode ? 500 : 0,
          timeout: this.config.testTimeout
        });
        break;
      case 'webkit':
        this.browser = await webkit.launch({
          headless: !this.visualMode,
          slowMo: this.visualMode ? 500 : 0,
          timeout: this.config.testTimeout
        });
        break;
      default:
        throw new Error(`Unsupported browser: ${this.config.browser}`);
    }

    if (this.visualMode) {
      console.log(`👁️  Visual mode enabled - Browser window will be visible for user interaction`);
    }

    // Create context with specified viewport and user agent
    this.context = await this.browser.newContext({
      viewport: this.config.viewport,
      userAgent: this.config.userAgent
    });

    // Create page
    this.page = await this.context.newPage();

    // Set timeout
    this.page.setDefaultTimeout(this.config.testTimeout);

    // Ensure screenshot directory exists
    if (!fs.existsSync(this.config.screenshotPath)) {
      fs.mkdirSync(this.config.screenshotPath, { recursive: true });
    }
  }

  async navigateToUrl(url: string): Promise<QATestResult[]> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const testResults: QATestResult[] = [];
    
    try {
      // Phase B: Browser Launch Verification
      testResults.push({
        phase: 'B',
        testType: 'Browser Launch',
        status: 'PASS',
        message: `${this.config.browser} browser launched successfully in ${this.visualMode ? 'visual' : 'headless'} mode`,
        details: { 
          browser: this.config.browser, 
          visualMode: this.visualMode,
          viewport: this.config.viewport
        },
        timestamp: new Date().toISOString()
      });

      console.log(`🚀 Navigating to: ${url}`);
      
      const response = await this.page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.config.testTimeout
      });

      if (response) {
        const status = response.status();
        
        if (status >= 200 && status < 400) {
          testResults.push({
            phase: 'B',
            testType: 'Page Navigation',
            status: 'PASS',
            message: `Successfully navigated to ${url}`,
            details: { url, status, browser: this.config.browser },
            timestamp: new Date().toISOString()
          });
        } else {
          testResults.push({
            phase: 'B',
            testType: 'Page Navigation',
            status: 'FAIL',
            message: `Failed to navigate to ${url} - HTTP ${status}`,
            details: { url, status, browser: this.config.browser },
            timestamp: new Date().toISOString()
          });
        }
      }

      // Wait for page to be fully loaded
      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForLoadState('networkidle');

      // Visual mode: Add interaction delay for user verification
      if (this.visualMode) {
        console.log(`👁️  Visual verification: Page displayed for ${this.interactionDelay}ms`);
        await this.page.waitForTimeout(this.interactionDelay);
        
        testResults.push({
          phase: 'B',
          testType: 'Visual Verification',
          status: 'PASS',
          message: `Page displayed visually for ${this.interactionDelay}ms verification`,
          details: { 
            url, 
            verificationTime: this.interactionDelay,
            visualMode: true
          },
          timestamp: new Date().toISOString()
        });
      }

      testResults.push({
        phase: 'B',
        testType: 'Page Load',
        status: 'PASS',
        message: 'Page loaded successfully',
        details: { url, browser: this.config.browser },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      testResults.push({
        phase: 'B',
        testType: 'Page Navigation',
        status: 'FAIL',
        message: `Navigation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { 
          url, 
          error: error instanceof Error ? error.message : 'Unknown error',
          browser: this.config.browser
        },
        timestamp: new Date().toISOString()
      });
    }

    return testResults;
  }

  async captureScreenshot(filename: string): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const screenshotPath = path.join(this.config.screenshotPath, filename);
    await this.page.screenshot({ 
      path: screenshotPath, 
      fullPage: true,
      type: 'png'
    });

    return screenshotPath;
  }

  async validatePageStructure(): Promise<QATestResult[]> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const testResults: QATestResult[] = [];

    try {
      // Check for basic HTML structure
      const hasDoctype = await this.page.evaluate(() => {
        return document.doctype !== null;
      });

      if (hasDoctype) {
        testResults.push({
          phase: 'B',
          testType: 'HTML Structure',
          status: 'PASS',
          message: 'Valid HTML DOCTYPE found',
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'B',
          testType: 'HTML Structure',
          status: 'FAIL',
          message: 'Missing HTML DOCTYPE',
          timestamp: new Date().toISOString()
        });
      }

      // Check for title
      const title = await this.page.title();
      if (title && title.trim().length > 0) {
        testResults.push({
          phase: 'B',
          testType: 'Page Title',
          status: 'PASS',
          message: `Page title: "${title}"`,
          details: { title },
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'B',
          testType: 'Page Title',
          status: 'FAIL',
          message: 'Missing or empty page title',
          timestamp: new Date().toISOString()
        });
      }

      // Check for meta viewport
      const hasViewport = await this.page.evaluate(() => {
        return !!document.querySelector('meta[name="viewport"]');
      });

      if (hasViewport) {
        testResults.push({
          phase: 'B',
          testType: 'Meta Viewport',
          status: 'PASS',
          message: 'Meta viewport tag found',
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'B',
          testType: 'Meta Viewport',
          status: 'WARNING',
          message: 'Missing meta viewport tag',
          timestamp: new Date().toISOString()
        });
      }

      // Check for main content
      const hasMainContent = await this.page.evaluate(() => {
        return document.querySelector('main') !== null ||
               document.querySelector('[role="main"]') !== null ||
               document.querySelector('div[id*="main"]') !== null ||
               document.querySelector('div[class*="main"]') !== null;
      });

      if (hasMainContent) {
        testResults.push({
          phase: 'B',
          testType: 'Main Content',
          status: 'PASS',
          message: 'Main content area found',
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'B',
          testType: 'Main Content',
          status: 'WARNING',
          message: 'No clear main content area found',
          timestamp: new Date().toISOString()
        });
      }

      // Check for JavaScript errors
      const jsErrors: string[] = [];
      this.page.on('pageerror', (error) => {
        jsErrors.push(error.message);
      });

      // Wait a bit to capture any async errors
      await this.page.waitForTimeout(2000);

      if (jsErrors.length === 0) {
        testResults.push({
          phase: 'B',
          testType: 'JavaScript Errors',
          status: 'PASS',
          message: 'No JavaScript errors detected',
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'B',
          testType: 'JavaScript Errors',
          status: 'FAIL',
          message: `${jsErrors.length} JavaScript errors detected`,
          details: { errors: jsErrors },
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      testResults.push({
        phase: 'B',
        testType: 'Page Structure Validation',
        status: 'FAIL',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      });
    }

    return testResults;
  }

  async testInteractivity(): Promise<QATestResult[]> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const testResults: QATestResult[] = [];

    try {
      // Test clickable elements
      const buttons = await this.page.$$('button, [role="button"], a, input[type="button"], input[type="submit"]');
      
      testResults.push({
        phase: 'B',
        testType: 'Interactive Elements',
        status: 'PASS',
        message: `Found ${buttons.length} interactive elements`,
        details: { count: buttons.length, browser: this.config.browser },
        timestamp: new Date().toISOString()
      });

      // Visual mode: Highlight interactive elements for user verification
      if (this.visualMode && buttons.length > 0) {
        console.log(`👆 Visual mode: Highlighting ${buttons.length} interactive elements`);
        
        // Add visual highlights to interactive elements
        await this.page.evaluate(() => {
          const elements = document.querySelectorAll('button, [role="button"], a, input[type="button"], input[type="submit"]');
          elements.forEach((el, index) => {
            if (el instanceof HTMLElement) {
              el.style.border = '2px solid #ff6b6b';
              el.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
              el.style.transition = 'all 0.3s ease';
            }
          });
        });
        
        await this.page.waitForTimeout(this.interactionDelay);
        
        // Remove highlights
        await this.page.evaluate(() => {
          const elements = document.querySelectorAll('button, [role="button"], a, input[type="button"], input[type="submit"]');
          elements.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.border = '';
              el.style.backgroundColor = '';
              el.style.transition = '';
            }
          });
        });
        
        testResults.push({
          phase: 'B',
          testType: 'Visual Interactive Elements',
          status: 'PASS',
          message: `Visually highlighted ${buttons.length} interactive elements for verification`,
          details: { 
            count: buttons.length, 
            highlightDuration: this.interactionDelay,
            visualMode: true
          },
          timestamp: new Date().toISOString()
        });
      }

      // Test form elements
      const forms = await this.page.$$('form');
      const inputs = await this.page.$$('input, textarea, select');

      if (forms.length > 0) {
        testResults.push({
          phase: 'B',
          testType: 'Form Elements',
          status: 'PASS',
          message: `Found ${forms.length} forms with ${inputs.length} input elements`,
          details: { forms: forms.length, inputs: inputs.length, browser: this.config.browser },
          timestamp: new Date().toISOString()
        });
      }

      // Test navigation
      const navElements = await this.page.$$('nav, [role="navigation"], .navigation, .nav');
      
      if (navElements.length > 0) {
        testResults.push({
          phase: 'B',
          testType: 'Navigation',
          status: 'PASS',
          message: `Found ${navElements.length} navigation elements`,
          details: { count: navElements.length, browser: this.config.browser },
          timestamp: new Date().toISOString()
        });
      } else {
        testResults.push({
          phase: 'B',
          testType: 'Navigation',
          status: 'WARNING',
          message: 'No navigation elements found',
          details: { browser: this.config.browser },
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      testResults.push({
        phase: 'B',
        testType: 'Interactivity Test',
        status: 'FAIL',
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          browser: this.config.browser
        },
        timestamp: new Date().toISOString()
      });
    }

    return testResults;
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  getPage(): Page | null {
    return this.page;
  }
}