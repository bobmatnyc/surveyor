import { chromium, BrowserContext, Page } from 'playwright';
import { DEFAULT_QA_CONFIG } from './config';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function captureSurveyForm() {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-web-security']
  });
  
  const context = await browser.newContext({
    viewport: DEFAULT_QA_CONFIG.viewport,
    userAgent: DEFAULT_QA_CONFIG.userAgent
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Starting survey navigation test...');
    
    // Navigate to the survey page
    console.log('📍 Navigating to survey page...');
    await page.goto('http://localhost:3002/survey');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of survey selection page
    await page.screenshot({ 
      path: join(DEFAULT_QA_CONFIG.screenshotPath, 'survey-selection-page.png'),
      fullPage: true
    });
    console.log('📸 Screenshot taken: survey-selection-page.png');
    
    // Fill in organization ID
    console.log('📝 Filling organization ID...');
    await page.fill('input[placeholder*="organization"]', 'test-org-123');
    
    // Click Start Survey button
    console.log('🔘 Clicking Start Survey button...');
    await page.click('button:has-text("Start Survey")');
    await page.waitForLoadState('networkidle');
    
    // Wait for stakeholder selection page
    console.log('👥 Waiting for stakeholder selection...');
    await page.waitForSelector('text=Select Your Role', { timeout: 10000 });
    
    // Take screenshot of stakeholder selection
    await page.screenshot({ 
      path: join(DEFAULT_QA_CONFIG.screenshotPath, 'stakeholder-selection.png'),
      fullPage: true
    });
    console.log('📸 Screenshot taken: stakeholder-selection.png');
    
    // Select a stakeholder role (Technology Lead)
    console.log('🎯 Selecting Technology Lead role...');
    await page.click('text=Technology Lead');
    
    // Wait for expertise selection or continue button
    await page.waitForTimeout(2000);
    
    // Look for continue/next button
    const continueButton = await page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Start")').first();
    if (await continueButton.isVisible()) {
      console.log('➡️ Clicking continue button...');
      await continueButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Wait for the actual survey form to load
    console.log('📋 Waiting for survey form to load...');
    await page.waitForSelector('.surveyjs-container, .sd-root-modern, .survey-question, .sd-question', { timeout: 15000 });
    
    // Take screenshot of the survey form
    await page.screenshot({ 
      path: join(DEFAULT_QA_CONFIG.screenshotPath, 'survey-form-main.png'),
      fullPage: true
    });
    console.log('📸 Screenshot taken: survey-form-main.png');
    
    // Look for specific elements that might have compression issues
    const questions = await page.locator('.sd-question, .survey-question, .question-container').all();
    console.log(`📝 Found ${questions.length} questions on the page`);
    
    // Take screenshots of individual questions if they exist
    for (let i = 0; i < Math.min(questions.length, 3); i++) {
      await questions[i].screenshot({ 
        path: join(DEFAULT_QA_CONFIG.screenshotPath, `question-${i + 1}.png`)
      });
      console.log(`📸 Screenshot taken: question-${i + 1}.png`);
    }
    
    // Look for Likert scale elements specifically
    const likertElements = await page.locator('.sd-matrix, .likert-scale, .rating-scale, .scale-container').all();
    console.log(`📊 Found ${likertElements.length} Likert scale elements`);
    
    for (let i = 0; i < likertElements.length; i++) {
      await likertElements[i].screenshot({ 
        path: join(DEFAULT_QA_CONFIG.screenshotPath, `likert-scale-${i + 1}.png`)
      });
      console.log(`📸 Screenshot taken: likert-scale-${i + 1}.png`);
    }
    
    // Get page info for analysis
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        questionCount: document.querySelectorAll('.sd-question, .survey-question, .question-container').length,
        likertCount: document.querySelectorAll('.sd-matrix, .likert-scale, .rating-scale, .scale-container').length,
        bodyClasses: document.body.className,
        surveyElements: Array.from(document.querySelectorAll('.surveyjs-container, .sd-root-modern')).map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id
        }))
      };
    });
    
    console.log('📊 Page Analysis:', pageInfo);
    
    // Save analysis to file
    writeFileSync(
      join(DEFAULT_QA_CONFIG.screenshotPath, 'survey-analysis.json'),
      JSON.stringify(pageInfo, null, 2)
    );
    
    console.log('✅ Survey navigation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during survey navigation:', error);
    
    // Take error screenshot
    await page.screenshot({ 
      path: join(DEFAULT_QA_CONFIG.screenshotPath, 'error-screenshot.png'),
      fullPage: true
    });
    
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
captureSurveyForm().catch(console.error);