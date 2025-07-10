import { chromium } from 'playwright';
import { DEFAULT_QA_CONFIG } from './config';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function comprehensiveSurveyTest() {
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
    console.log('🚀 Starting comprehensive survey test...');
    
    // Navigate to the survey page
    await page.goto('http://localhost:3002/survey');
    await page.waitForLoadState('networkidle');
    
    // Fill organization ID and start survey
    await page.fill('input[placeholder*="organization"]', 'test-org-comprehensive');
    await page.click('button:has-text("Start Survey")');
    await page.waitForLoadState('networkidle');
    
    // Select Technology Lead
    await page.click('text=Technology Lead');
    await page.waitForTimeout(1000);
    
    // Continue to survey
    const continueButton = await page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Start")').first();
    if (await continueButton.isVisible()) {
      await continueButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Wait for survey form
    await page.waitForSelector('.surveyjs-container, .sd-root-modern', { timeout: 15000 });
    
    let questionIndex = 1;
    const maxQuestions = 5; // Limit to first 5 questions
    
    while (questionIndex <= maxQuestions) {
      console.log(`📋 Processing question ${questionIndex}...`);
      
      // Take screenshot of current question
      await page.screenshot({ 
        path: join(DEFAULT_QA_CONFIG.screenshotPath, `comprehensive-question-${questionIndex}.png`),
        fullPage: true
      });
      
      // Check for different question types
      const questionAnalysis = await page.evaluate(() => {
        const questionElement = document.querySelector('.sd-question');
        if (!questionElement) return null;
        
        return {
          questionTitle: questionElement.querySelector('.sd-question__title')?.textContent?.trim() || '',
          questionType: questionElement.querySelector('.sd-question__content')?.className || '',
          hasMatrix: !!questionElement.querySelector('.sd-matrix'),
          hasRadioGroup: !!questionElement.querySelector('.sd-radiogroup'),
          hasLikert: !!questionElement.querySelector('.sd-matrix, .likert-scale, .rating-scale'),
          radioButtons: Array.from(questionElement.querySelectorAll('.sd-radiogroup-item')).map(item => ({
            text: item.textContent?.trim(),
            className: item.className
          })),
          matrixCells: Array.from(questionElement.querySelectorAll('.sd-matrix__cell')).map(cell => ({
            text: cell.textContent?.trim(),
            className: cell.className
          }))
        };
      });
      
      console.log(`📊 Question ${questionIndex} analysis:`, questionAnalysis);
      
      // Save analysis
      writeFileSync(
        join(DEFAULT_QA_CONFIG.screenshotPath, `question-${questionIndex}-analysis.json`),
        JSON.stringify(questionAnalysis, null, 2)
      );
      
      // Try to answer the question
      const radioButtons = await page.locator('.sd-radiogroup-item, .sd-item--radio').all();
      if (radioButtons.length > 0) {
        console.log(`🔘 Found ${radioButtons.length} radio options, selecting first one`);
        await radioButtons[0].click();
        await page.waitForTimeout(500);
      }
      
      // Check for matrix/Likert scale
      const matrixCells = await page.locator('.sd-matrix__cell input, .sd-matrix input[type="radio"]').all();
      if (matrixCells.length > 0) {
        console.log(`📊 Found matrix/Likert scale with ${matrixCells.length} cells`);
        // Take detailed screenshot of matrix
        const matrixElement = await page.locator('.sd-matrix').first();
        if (await matrixElement.isVisible()) {
          await matrixElement.screenshot({ 
            path: join(DEFAULT_QA_CONFIG.screenshotPath, `matrix-question-${questionIndex}.png`)
          });
        }
        
        // Select first available option in each row
        for (let i = 0; i < Math.min(matrixCells.length, 5); i++) {
          try {
            await matrixCells[i].click();
            await page.waitForTimeout(200);
          } catch (e) {
            // Skip if can't click
          }
        }
      }
      
      // Try to go to next question
      const nextButton = await page.locator('button:has-text("Next"), input[value="Next"]').first();
      if (await nextButton.isVisible()) {
        console.log('➡️ Clicking Next button...');
        await nextButton.click();
        await page.waitForTimeout(2000);
        
        // Check if we're still on a question or moved to completion
        const stillHasQuestion = await page.locator('.sd-question').isVisible();
        if (!stillHasQuestion) {
          console.log('✅ Survey completed or no more questions');
          break;
        }
      } else {
        console.log('❌ No Next button found, ending survey navigation');
        break;
      }
      
      questionIndex++;
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: join(DEFAULT_QA_CONFIG.screenshotPath, 'comprehensive-final-state.png'),
      fullPage: true
    });
    
    console.log('✅ Comprehensive survey test completed!');
    
  } catch (error) {
    console.error('❌ Error during comprehensive survey test:', error);
    await page.screenshot({ 
      path: join(DEFAULT_QA_CONFIG.screenshotPath, 'comprehensive-error.png'),
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

comprehensiveSurveyTest().catch(console.error);