/**
 * Simple test to verify button click functionality
 * Run this in browser console on the survey page
 */

function testButtonClick() {
  console.log('=== Button Click Test ===');
  
  // Find the Start Survey button
  const button = document.querySelector('button[type="submit"]');
  if (!button) {
    console.error('❌ Start Survey button not found');
    return;
  }
  
  console.log('✅ Button found:', button);
  console.log('Button text:', button.textContent);
  console.log('Button disabled:', button.disabled);
  console.log('Button click handler:', button.onclick);
  
  // Check if button is clickable
  const style = window.getComputedStyle(button);
  console.log('Button pointer-events:', style.pointerEvents);
  console.log('Button z-index:', style.zIndex);
  console.log('Button position:', style.position);
  
  // Test click simulation
  console.log('Simulating button click...');
  button.click();
  
  // Check form state
  const form = button.closest('form');
  if (form) {
    console.log('Form found:', form);
    console.log('Form data:', new FormData(form));
  }
  
  console.log('=== Test Complete ===');
}

// Run immediately
testButtonClick();