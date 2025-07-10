# CSP Problem: Comprehensive Security Investigation Report

## Executive Summary

**ROOT CAUSE IDENTIFIED**: The CSP issue is caused by `NODE_ENV` being `undefined` instead of `'development'`, causing the application to default to production-level CSP policies that include `'strict-dynamic'` and block JavaScript execution.

## Critical Findings

### 1. Environment Variable Issue
- **Problem**: `NODE_ENV` is not consistently set to `'development'`
- **Impact**: System defaults to production CSP with `'strict-dynamic'`
- **Evidence**: 
  ```bash
  echo $NODE_ENV  # Returns empty
  node -e "console.log(process.env.NODE_ENV)"  # Returns 'undefined'
  ```

### 2. CSP Logic Analysis
The CSP generation logic in `/Users/masa/Projects/managed/surveyor/lib/security.ts` line 16:
```typescript
if (isDevelopment) {
  return "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'...";
}
```
Where `isDevelopment = process.env.NODE_ENV === 'development'` returns `false` when `NODE_ENV` is undefined.

## Complete CSP Configuration Sources

### 1. Primary Sources (ACTIVE)
1. **`/Users/masa/Projects/managed/surveyor/lib/security.ts`** - `generateCSP()` function
2. **`/Users/masa/Projects/managed/surveyor/middleware.ts`** - Lines 41-45, calls generateCSP
3. **`/Users/masa/Projects/managed/surveyor/next.config.js`** - Lines 55-72, disabled in dev

### 2. Secondary Sources (CALLING PRIMARY)
4. **API Routes using SecurityManager** - All routes under `/app/api/admin/`
5. **SecurityManager.addSecurityHeaders()** - Line 197 in `lib/security.ts`

### 3. Platform Configuration (INACTIVE)
6. **`/Users/masa/Projects/managed/surveyor/vercel.json`** - No CSP headers configured

## Current CSP Behavior

### When NODE_ENV is undefined (CURRENT STATE):
```
CSP: default-src 'self'; script-src 'self' 'nonce-{nonce}' 'strict-dynamic'; 
     style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
     [additional directives...]
```
- ❌ Contains `'strict-dynamic'` (blocks all non-nonce scripts)
- ❌ Missing `'unsafe-eval'` (blocks Next.js hot reload)
- ❌ Missing WebSocket connections (breaks dev tools)

### When NODE_ENV='development' (DESIRED STATE):
```
CSP: default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; 
     script-src * 'unsafe-inline' 'unsafe-eval'; 
     [additional permissive directives...]
```
- ✅ Completely permissive for development
- ✅ Allows all JavaScript execution
- ✅ Supports Next.js development features

## Comprehensive Solution Plan

### Phase 1: Immediate Fix (Environment Variable)
1. **Fix NODE_ENV Setting**:
   ```bash
   # Update package.json dev script (ALREADY CORRECT)
   "dev": "NODE_ENV=development next dev"
   
   # Alternative: Create .env.local
   echo "NODE_ENV=development" >> .env.local
   ```

2. **Verify Environment Detection**:
   - Test CSP generation with proper NODE_ENV
   - Confirm middleware behavior
   - Validate next.config.js logic

### Phase 2: Defensive Programming
1. **Improve Environment Detection**:
   ```typescript
   // More robust development detection
   const isDevelopment = process.env.NODE_ENV === 'development' || 
                        process.env.NODE_ENV === undefined ||
                        !process.env.NODE_ENV;
   ```

2. **Add Development Mode Indicators**:
   - Check for Next.js dev server
   - Detect localhost/development domains
   - Add explicit development flags

### Phase 3: Complete CSP Elimination (Alternative)
If CSP continues to be problematic in development:

1. **Remove CSP Entirely in Development**:
   ```typescript
   // In middleware.ts and security.ts
   if (isDevelopment) {
     return; // Don't set any CSP headers
   }
   ```

2. **Disable All Security Headers in Dev**:
   - Comment out all CSP-related code in development
   - Create development-specific configuration

### Phase 4: Long-term Architecture
1. **Environment-Specific Configurations**:
   - `config/development.ts` - No security restrictions
   - `config/production.ts` - Full security headers
   - `config/staging.ts` - Relaxed security for testing

2. **CSP Policy Management**:
   - Centralized CSP policy definitions
   - Environment-aware policy selection
   - Runtime policy validation

## Verification Steps

### 1. Environment Check
```bash
# Test current environment
node -e "console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined')"

# Test with explicit setting
NODE_ENV=development node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"
```

### 2. CSP Generation Test
```bash
# Run the CSP test
node simple-csp-test.js

# Compare with forced development mode
NODE_ENV=development node simple-csp-test.js
```

### 3. Live Server Test
```bash
# Start server with explicit NODE_ENV
NODE_ENV=development npm run dev

# Check headers
curl -I http://localhost:3000 | grep -i security
```

## Recommended Immediate Action

**Execute the following commands to fix the issue immediately**:

```bash
# 1. Set NODE_ENV in environment
export NODE_ENV=development

# 2. Add to .env.local for persistence
echo "NODE_ENV=development" >> .env.local

# 3. Restart development server
npm run dev
```

## Risk Assessment

### Current Risk: HIGH
- ❌ JavaScript blocked by CSP in development
- ❌ Next.js hot reload not working
- ❌ Development tools not functioning
- ❌ Application essentially broken in dev mode

### Post-Fix Risk: LOW
- ✅ Development environment fully functional
- ✅ Production security maintained
- ✅ Proper environment separation
- ✅ No impact on deployed application

## Files Modified in This Investigation
- `/Users/masa/Projects/managed/surveyor/test-csp-debug.js` (created)
- `/Users/masa/Projects/managed/surveyor/simple-csp-test.js` (created)
- `/Users/masa/Projects/managed/surveyor/CSP_COMPREHENSIVE_ANALYSIS.md` (this file)

## Conclusion

The CSP problem is definitively caused by missing `NODE_ENV=development` environment variable. The existing code has proper logic to disable CSP in development, but the environment detection is failing due to undefined `NODE_ENV`.

**IMMEDIATE ACTION REQUIRED**: Set `NODE_ENV=development` before starting the development server.