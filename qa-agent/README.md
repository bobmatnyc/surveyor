# Frontend QA Agent

A comprehensive automated testing system for frontend applications that performs HTTP testing, browser automation, accessibility testing, performance analysis, security validation, and visual regression testing.

## 🎯 Features

### Three-Phase Testing Workflow

#### Phase A: HTTP Testing & Content Validation
- **HTTP Response Testing**: Status codes, response times, content types
- **HTML Validation**: Document structure, semantic elements, accessibility compliance
- **Security Header Analysis**: CSP, X-Frame-Options, HSTS, and other security headers
- **Content Analysis**: Meta tags, charset, title validation

#### Phase B: Browser Automation & Performance Testing
- **Browser Launch**: Automatic browser launching with MS Edge/Chromium support
- **Visual Browser Mode**: Browser window displays for user interaction and verification
- **Browser Automation**: Playwright-based testing with MS Edge (default), Chromium, Firefox, WebKit support
- **Page Structure validation**: DOM structure, JavaScript errors, interactive elements
- **Interactive Element Highlighting**: Visual highlighting of buttons, links, and forms in visual mode
- **Accessibility Testing**: Axe-core integration for WCAG compliance
- **Performance Testing**: Mock Lighthouse audits for Core Web Vitals
- **Custom Metrics**: DOM complexity, resource counts, load times

#### Phase C: Visual Testing & Screenshot Analysis
- **Screenshot Capture**: Full-page screenshots with PNG format
- **Visual Regression Testing**: Pixel-by-pixel comparison with baseline images
- **Visual Content Analysis**: Color distribution, contrast validation
- **Image Validation**: Format verification, dimension checks

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Running application server (default: http://localhost:3002)
- MS Edge browser (preferred) or Chromium/Chrome

### Dependencies
```bash
npm install --save-dev playwright @axe-core/playwright lighthouse pixelmatch pngjs html-validator @types/pngjs
```

### Browser Installation
```bash
# Install MS Edge (recommended)
npx playwright install msedge

# Or install Chromium
npx playwright install chromium

# Or install all supported browsers
npx playwright install
```

## 📊 Usage

### Basic Usage
```bash
# Run comprehensive QA analysis (MS Edge, Visual mode)
npm run qa

# Test specific URL
npm run qa -- --url http://localhost:3000

# Test multiple routes
npm run qa:routes
```

### Browser Launch Modes
The QA Agent supports two browser launch modes:

#### Visual Mode (Default)
- Browser window displays for user interaction
- Interactive elements are highlighted during testing
- Visual verification delays for manual inspection
- Ideal for development and debugging

#### Headless Mode
- Browser runs in background without UI
- Faster execution for automated testing
- Suitable for CI/CD pipelines

### Programmatic Usage
```typescript
import { FrontendQAAgent } from './qa-agent';

// Visual mode with MS Edge (default)
const qaAgent = new FrontendQAAgent({
  baseUrl: 'http://localhost:3002',
  browser: 'msedge',
  visualBrowserMode: true,
  visualInteractionDelay: 3000,
  viewport: { width: 1920, height: 1080 },
  testTimeout: 30000,
  visualThreshold: 0.1
});

// Headless mode for automated testing
const qaAgentHeadless = new FrontendQAAgent({
  baseUrl: 'http://localhost:3002',
  browser: 'msedge',
  visualBrowserMode: false,
  viewport: { width: 1920, height: 1080 },
  testTimeout: 30000
});

const report = await qaAgent.runComprehensiveQA();
console.log(`Overall Score: ${report.overallScore}%`);
console.log(`Recommendation: ${report.recommendation}`);
```

## 📋 Test Categories

### HTTP Testing
- ✅ Response Status Codes (2xx success)
- ✅ Response Time (<2s good, <5s acceptable)
- ✅ Content Type Validation
- ✅ Content Length Verification
- ✅ Error Handling

### Security Testing
- ✅ Content Security Policy (CSP)
- ✅ X-Frame-Options (Clickjacking protection)
- ✅ X-Content-Type-Options (MIME sniffing protection)
- ✅ Referrer Policy
- ✅ Permissions Policy
- ✅ HTTPS/HSTS Configuration

### Accessibility Testing
- ✅ WCAG 2.1 AA Compliance
- ✅ Color Contrast Validation
- ✅ Keyboard Navigation
- ✅ ARIA Labels and Roles
- ✅ Heading Structure (H1-H6)
- ✅ Image Alt Text
- ✅ Form Labels
- ✅ Focus Management

### Performance Testing
- ✅ Core Web Vitals (FCP, LCP, CLS, TBT)
- ✅ Lighthouse Scores (Performance, Accessibility, Best Practices, SEO)
- ✅ DOM Complexity Analysis
- ✅ Resource Count Optimization
- ✅ Load Time Metrics

### Visual Testing
- ✅ Screenshot Capture
- ✅ Visual Regression Detection
- ✅ Color Distribution Analysis
- ✅ Content Visibility Validation
- ✅ Layout Stability

### HTML Validation
- ✅ Document Structure (DOCTYPE, HTML5)
- ✅ Semantic Elements (header, nav, main, footer)
- ✅ Meta Tags (charset, viewport)
- ✅ Heading Hierarchy
- ✅ Form Structure

## 📊 Scoring System

### Overall Score Calculation
- **HTTP Testing**: 15% weight
- **Performance**: 25% weight  
- **Accessibility**: 25% weight
- **Security**: 20% weight
- **HTML Validation**: 10% weight
- **Visual Testing**: 5% weight

### Recommendations
- **APPROVE**: 85%+ overall score, no critical failures
- **NEEDS_REVIEW**: 70-84% overall score, minor issues
- **REJECT**: <70% overall score, critical security/accessibility issues

## 📁 File Structure

```
qa-agent/
├── index.ts                 # Main QA Agent orchestrator
├── types.ts                 # TypeScript interfaces
├── config.ts               # Configuration settings
├── http-tester.ts          # HTTP testing module
├── browser-tester.ts       # Browser automation module
├── visual-tester.ts        # Visual regression testing
├── accessibility-tester.ts # Accessibility validation
├── performance-tester.ts   # Performance analysis
├── security-tester.ts      # Security header validation
├── html-validator.ts       # HTML structure validation
├── report-generator.ts     # Report generation
├── run-qa.ts              # CLI runner
├── screenshots/           # Screenshot storage
│   ├── baseline/         # Baseline images
│   └── *.png            # Test screenshots
└── reports/              # Generated reports
    ├── *.html           # HTML reports
    ├── *.json           # JSON data
    └── *.txt            # Summary reports
```

## 🔧 Configuration

### Default Configuration
```typescript
const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:3002',
  testTimeout: 30000,
  screenshotPath: './qa-agent/screenshots',
  visualThreshold: 0.1,
  browser: 'msedge', // MS Edge as default
  viewport: { width: 1920, height: 1080 },
  visualBrowserMode: true, // Visual mode enabled by default
  visualInteractionDelay: 3000 // 3 second delays for visual verification
};
```

### Test Routes
```typescript
const TEST_ROUTES = [
  '/',
  '/auth',
  '/survey',
  '/admin',
  '/survey/jim-joseph-tech-maturity-v1/org_beth_shalom_community'
];
```

## 📊 Sample Test Results

### Recent Test Results for Surveyor Platform
- **Overall Score**: 73%
- **Recommendation**: REJECT
- **Key Issues**:
  - Missing security headers (CSP, X-Frame-Options)
  - Poor ARIA usage (0% of interactive elements)
  - HTML validation errors
  - Missing meta charset
- **Performance**: 85% (Good)
- **Accessibility**: 92% (Excellent)

### Critical Issues Found
1. **Security Headers**: 0% compliance
2. **HTML Validation**: 1 error found
3. **ARIA Labels**: 0% interactive elements properly labeled
4. **Visual Content**: Screenshot appears blank

### Recommendations
1. Implement Content Security Policy (CSP)
2. Add security headers (X-Frame-Options, X-Content-Type-Options)
3. Improve ARIA labeling for interactive elements
4. Add proper meta charset declaration
5. Implement HSTS for HTTPS enforcement

## 🚀 Advanced Features

### Custom Test Routes
```bash
npm run qa -- --routes  # Test predefined routes
```

### Multiple Browser Testing
```typescript
const qaAgent = new FrontendQAAgent({
  browser: 'msedge' | 'chromium' | 'firefox' | 'webkit'
});
```

### Browser Launch Configuration
```typescript
// Visual mode with enhanced interaction
const visualConfig = {
  visualBrowserMode: true,
  visualInteractionDelay: 3000,
  browser: 'msedge'
};

// Headless mode for CI/CD
const headlessConfig = {
  visualBrowserMode: false,
  browser: 'msedge'
};
```

### Screenshot Comparison
The system automatically:
- Captures full-page screenshots
- Compares against baseline images
- Generates diff images for visual changes
- Provides pixel-level difference analysis

## 📊 Report Formats

### HTML Report
- Interactive web-based report
- Detailed test results by phase
- Visual charts and metrics
- Expandable test details

### JSON Report
- Machine-readable format
- Complete test data
- Integration-friendly structure
- API response format

### Summary Report
- Text-based executive summary
- Key metrics and scores
- Critical issues highlighted
- Recommendations listed

## 🔍 Troubleshooting

### Common Issues

**Browser Launch Failed**
```bash
# Install MS Edge (recommended)
npx playwright install msedge

# Or install Chromium
npx playwright install chromium
```

**TypeScript Compilation Errors**
```bash
npm install --save-dev @types/pngjs
```

**Network Timeout**
- Increase timeout in config
- Verify target URL is accessible
- Check firewall/proxy settings

**Visual Test Failures**
- Review screenshot diff images
- Adjust visual threshold if needed
- Update baseline images for UI changes

**Visual Mode Issues**
- Ensure display is available (not in headless environment)
- Check if browser window is visible during testing
- Verify `visualBrowserMode` is set to `true`
- Adjust `visualInteractionDelay` for slower systems

## 🤝 Contributing

### Adding New Tests
1. Create test module in `qa-agent/`
2. Implement test interface
3. Add to main orchestrator
4. Update documentation

### Extending Reports
1. Modify `report-generator.ts`
2. Add new metrics to types
3. Update scoring weights
4. Test report generation

## 📝 License

MIT License - See LICENSE file for details

## 🎯 Future Enhancements

- [x] **MS Edge Browser Support** - Added MS Edge as default browser
- [x] **Visual Browser Mode** - Interactive browser windows with visual verification
- [x] **Interactive Element Highlighting** - Visual highlighting of clickable elements
- [ ] Real Lighthouse integration
- [ ] Multi-browser parallel testing
- [ ] Custom rule configuration
- [ ] CI/CD pipeline integration
- [ ] Performance regression tracking
- [ ] Automated accessibility remediation
- [ ] Advanced visual diff algorithms
- [ ] Mobile device testing
- [ ] API endpoint testing
- [ ] Database connectivity validation

---

**Frontend QA Agent v1.0.0** - Comprehensive automated testing for modern web applications.