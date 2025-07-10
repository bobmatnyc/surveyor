/**
 * Client-side button test
 * Add this to any page to test button functionality
 */

function testButtonInteraction() {
  console.log('=== CLIENT-SIDE BUTTON TEST ===');
  
  // Test 1: Find all buttons
  const buttons = document.querySelectorAll('button');
  console.log('Found', buttons.length, 'buttons on the page');
  
  buttons.forEach((button, index) => {
    console.log(`Button ${index + 1}:`, {
      text: button.textContent.trim(),
      disabled: button.disabled,
      type: button.type,
      className: button.className
    });
  });
  
  // Test 2: Find Start Survey button specifically
  const startButtons = Array.from(buttons).filter(btn => 
    btn.textContent.toLowerCase().includes('start survey')
  );
  
  console.log('Found', startButtons.length, 'Start Survey buttons');
  
  startButtons.forEach((button, index) => {
    console.log(`Start Survey Button ${index + 1}:`, {
      text: button.textContent.trim(),
      disabled: button.disabled,
      type: button.type,
      form: button.form,
      clickHandler: button.onclick ? 'has onclick' : 'no onclick'
    });
  });
  
  // Test 3: Test clicking
  if (startButtons.length > 0) {
    const button = startButtons[0];
    console.log('Testing click on first Start Survey button...');
    
    // Add temporary event listener to test
    const testClickHandler = (e) => {
      console.log('✅ Click event fired!', {
        target: e.target,
        currentTarget: e.currentTarget,
        type: e.type,
        timestamp: new Date().toISOString()
      });
    };
    
    button.addEventListener('click', testClickHandler);
    
    // Simulate click
    setTimeout(() => {
      console.log('Simulating click...');
      button.click();
      
      // Remove test handler
      setTimeout(() => {
        button.removeEventListener('click', testClickHandler);
        console.log('Test completed - event listener removed');
      }, 100);
    }, 1000);
  }
  
  // Test 4: Check for form submission
  const forms = document.querySelectorAll('form');
  console.log('Found', forms.length, 'forms on the page');
  
  forms.forEach((form, index) => {
    console.log(`Form ${index + 1}:`, {
      action: form.action,
      method: form.method,
      elements: form.elements.length,
      onsubmit: form.onsubmit ? 'has onsubmit' : 'no onsubmit'
    });
  });
  
  console.log('=== TEST COMPLETE ===');
  console.log('Check console above for results');
}

// Auto-run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testButtonInteraction);
} else {
  testButtonInteraction();
}

// Also expose globally for manual testing
window.testButtonInteraction = testButtonInteraction;