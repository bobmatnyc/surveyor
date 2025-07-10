import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth, SecurityManager, RateLimiter, SecurityAuditLogger } from '@/lib/security';
import { z } from 'zod';

// Validation schema for login request
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50),
  password: z.string().min(1, 'Password is required').max(100)
});

export async function POST(request: NextRequest) {
  const security = SecurityManager.getInstance();
  const clientIP = AdminAuth.getClientIP(request);
  
  try {
    // Check if IP is currently locked out
    if (AdminAuth.isLockedOut(clientIP)) {
      SecurityAuditLogger.log('LOGIN_ATTEMPT_WHILE_LOCKED', {
        ip: clientIP,
        lockoutStatus: 'active'
      }, request);
      
      return security.createErrorResponse(
        'Too many failed attempts. Account locked for 15 minutes.',
        429
      );
    }

    // Rate limiting for login attempts
    const rateLimitResult = RateLimiter.check(`login:${clientIP}`, 10, 60000); // 10 attempts per minute
    
    if (!rateLimitResult.allowed) {
      SecurityAuditLogger.log('LOGIN_RATE_LIMIT_EXCEEDED', {
        ip: clientIP,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      }, request);
      
      return security.createErrorResponse(
        'Too many login attempts. Please try again later.',
        429
      );
    }

    // Validate and sanitize request body
    const body = await security.validateAndSanitizeRequest(request);
    
    // Validate input schema
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      SecurityAuditLogger.log('LOGIN_VALIDATION_ERROR', {
        ip: clientIP,
        errors: validationResult.error.errors
      }, request);
      
      return security.createErrorResponse(
        'Invalid input data',
        400
      );
    }

    const { username, password } = validationResult.data;

    // Validate admin credentials
    const isValid = AdminAuth.validateCredentials(username, password);
    
    if (!isValid) {
      SecurityAuditLogger.log('INVALID_LOGIN_ATTEMPT', {
        username,
        ip: clientIP,
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      }, request);
      
      return AdminAuth.createAuthResponse(username, clientIP, false);
    }

    // Successful authentication
    return AdminAuth.createAuthResponse(username, clientIP, true);
    
  } catch (error) {
    console.error('Login error:', error);
    
    SecurityAuditLogger.log('LOGIN_SYSTEM_ERROR', {
      ip: clientIP,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, request);
    
    return security.createErrorResponse(
      'Authentication system error',
      500
    );
  }
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  const security = SecurityManager.getInstance();
  const clientIP = AdminAuth.getClientIP(request);
  
  try {
    // Check if authenticated
    const authResult = AdminAuth.isAdminAuthenticated(request);
    
    if (authResult.authenticated) {
      SecurityAuditLogger.log('ADMIN_LOGOUT', {
        username: authResult.username,
        ip: clientIP,
        timestamp: new Date().toISOString()
      }, request);
    }
    
    return AdminAuth.createLogoutResponse();
    
  } catch (error) {
    console.error('Logout error:', error);
    return security.createErrorResponse(
      'Logout system error',
      500
    );
  }
}

// Check authentication status
export async function GET(request: NextRequest) {
  const security = SecurityManager.getInstance();
  
  try {
    const authResult = AdminAuth.isAdminAuthenticated(request);
    
    return security.createSecureResponse({
      authenticated: authResult.authenticated,
      username: authResult.username || null,
      expired: authResult.expired || false
    });
    
  } catch (error) {
    console.error('Auth check error:', error);
    return security.createErrorResponse(
      'Authentication check failed',
      500
    );
  }
}