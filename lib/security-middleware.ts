import { NextRequest, NextResponse } from 'next/server';
import { SecurityManager, AdminAuth, RateLimiter, SecurityAuditLogger } from './security';

export interface SecurityMiddlewareOptions {
  requireAuth?: boolean;
  requireCSRF?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  allowedMethods?: string[];
  maxBodySize?: number;
  requireJSON?: boolean;
}

/**
 * Comprehensive security middleware for API endpoints
 */
export function withSecurity(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const security = SecurityManager.getInstance();
    const clientIP = AdminAuth.getClientIP(request);
    
    try {
      // Method validation
      if (options.allowedMethods && !options.allowedMethods.includes(request.method)) {
        SecurityAuditLogger.log('METHOD_NOT_ALLOWED', {
          method: request.method,
          path: request.nextUrl.pathname,
          allowedMethods: options.allowedMethods
        }, request);
        
        return security.createErrorResponse('Method not allowed', 405);
      }

      // Rate limiting
      if (options.rateLimit) {
        const { maxRequests, windowMs } = options.rateLimit;
        const rateLimitKey = `${request.nextUrl.pathname}:${clientIP}`;
        const rateLimitResult = RateLimiter.check(rateLimitKey, maxRequests, windowMs);
        
        if (!rateLimitResult.allowed) {
          SecurityAuditLogger.log('RATE_LIMIT_EXCEEDED', {
            path: request.nextUrl.pathname,
            ip: clientIP,
            limit: maxRequests,
            window: windowMs
          }, request);
          
          const response = security.createErrorResponse('Rate limit exceeded', 429);
          response.headers.set('X-RateLimit-Limit', maxRequests.toString());
          response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
          response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
          
          return response;
        }
      }

      // Content validation for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        // Body size validation
        const contentLength = request.headers.get('content-length');
        if (contentLength && options.maxBodySize) {
          const bodySize = parseInt(contentLength);
          if (bodySize > options.maxBodySize) {
            SecurityAuditLogger.log('REQUEST_BODY_TOO_LARGE', {
              path: request.nextUrl.pathname,
              bodySize,
              maxSize: options.maxBodySize
            }, request);
            
            return security.createErrorResponse(
              `Request body too large. Maximum size: ${Math.round(options.maxBodySize / 1024 / 1024)}MB`,
              413
            );
          }
        }

        // Content type validation
        if (options.requireJSON && !security.validateContentType(request)) {
          SecurityAuditLogger.log('INVALID_CONTENT_TYPE', {
            path: request.nextUrl.pathname,
            contentType: request.headers.get('content-type')
          }, request);
          
          return security.createErrorResponse('Invalid content type - JSON required', 400);
        }
      }

      // Origin validation for cross-origin requests
      const origin = request.headers.get('origin');
      if (origin) {
        const allowedOrigins = [
          process.env.NEXT_PUBLIC_BASE_URL,
          'http://localhost:3000',
          'https://localhost:3000'
        ].filter((origin): origin is string => Boolean(origin));
        
        if (!security.validateOrigin(request, allowedOrigins)) {
          SecurityAuditLogger.log('INVALID_ORIGIN', {
            path: request.nextUrl.pathname,
            origin,
            allowedOrigins
          }, request);
          
          return security.createErrorResponse('Invalid origin', 403);
        }
      }

      // Authentication check
      if (options.requireAuth) {
        const authResult = AdminAuth.isAdminAuthenticated(request);
        
        if (!authResult.authenticated) {
          SecurityAuditLogger.log('AUTHENTICATION_REQUIRED', {
            path: request.nextUrl.pathname,
            expired: authResult.expired
          }, request);
          
          const status = authResult.expired ? 401 : 403;
          const message = authResult.expired 
            ? 'Session expired. Please login again.'
            : 'Authentication required';
            
          return security.createErrorResponse(message, status);
        }
        
        // Add username to context if available
        if (context && authResult.username) {
          context.username = authResult.username;
        }
      }

      // CSRF protection for state-changing operations
      if (options.requireCSRF && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        const csrfToken = request.headers.get('x-csrf-token');
        const sessionCookie = request.cookies.get('admin_session')?.value;
        
        if (!csrfToken || !sessionCookie) {
          SecurityAuditLogger.log('CSRF_TOKEN_MISSING', {
            path: request.nextUrl.pathname,
            method: request.method
          }, request);
          
          return security.createErrorResponse('CSRF token required', 403);
        }
        
        // Note: In a real implementation, you'd validate the CSRF token here
        // For now, we just check presence
      }

      // Call the actual handler
      const response = await handler(request, context);
      
      // Add security headers to response
      return security.addSecurityHeaders(response, {
        isDevelopment: process.env.NODE_ENV === 'development'
      });
      
    } catch (error) {
      console.error('Security middleware error:', error);
      
      SecurityAuditLogger.log('SECURITY_MIDDLEWARE_ERROR', {
        path: request.nextUrl.pathname,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, request);
      
      return security.createErrorResponse('Security validation failed', 500);
    }
  };
}

/**
 * Preset security configurations for different endpoint types
 */
export const SecurityPresets = {
  // Public endpoints (surveys accessible via distribution code)
  public: {
    rateLimit: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
    allowedMethods: ['GET', 'POST'],
    maxBodySize: 1024 * 1024, // 1MB
    requireJSON: true
  },
  
  // Admin endpoints requiring authentication
  admin: {
    requireAuth: true,
    requireCSRF: true,
    rateLimit: { maxRequests: 50, windowMs: 60000 }, // 50 requests per minute
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    maxBodySize: 10 * 1024 * 1024, // 10MB for survey uploads
    requireJSON: true
  },
  
  // Authentication endpoints
  auth: {
    rateLimit: { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
    allowedMethods: ['POST', 'GET', 'DELETE'],
    maxBodySize: 1024, // 1KB
    requireJSON: true
  },
  
  // File upload endpoints
  upload: {
    requireAuth: true,
    requireCSRF: true,
    rateLimit: { maxRequests: 10, windowMs: 300000 }, // 10 uploads per 5 minutes
    allowedMethods: ['POST'],
    maxBodySize: 50 * 1024 * 1024, // 50MB
    requireJSON: true
  }
};

/**
 * Helper function to create secured API endpoint
 */
export function createSecureEndpoint(
  handlers: Partial<Record<string, (req: NextRequest, ctx?: any) => Promise<NextResponse>>>,
  preset: keyof typeof SecurityPresets = 'public'
) {
  const options = SecurityPresets[preset];
  
  return {
    GET: handlers.GET ? withSecurity(handlers.GET, { ...options, allowedMethods: ['GET'] }) : undefined,
    POST: handlers.POST ? withSecurity(handlers.POST, { ...options, allowedMethods: ['POST'] }) : undefined,
    PUT: handlers.PUT ? withSecurity(handlers.PUT, { ...options, allowedMethods: ['PUT'] }) : undefined,
    PATCH: handlers.PATCH ? withSecurity(handlers.PATCH, { ...options, allowedMethods: ['PATCH'] }) : undefined,
    DELETE: handlers.DELETE ? withSecurity(handlers.DELETE, { ...options, allowedMethods: ['DELETE'] }) : undefined,
  };
}