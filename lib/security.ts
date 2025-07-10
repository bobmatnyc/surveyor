import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate Content Security Policy string based on environment
 */
export function generateCSP(options?: {
  nonce?: string;
  isDevelopment?: boolean;
  isAPI?: boolean;
}): string {
  const { nonce, isDevelopment = process.env.NODE_ENV === 'development', isAPI = false } = options || {};
  
  if (isAPI) {
    // Stricter CSP for API endpoints
    return isDevelopment
      ? "default-src 'none'; script-src 'self' 'unsafe-eval'; frame-ancestors 'none'; base-uri 'none'"
      : "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";
  }
  
  // CSP for regular pages
  const scriptSrc = [
    "'self'",
    nonce ? `'nonce-${nonce}'` : null,
    isDevelopment ? "'unsafe-eval'" : null,
    "'strict-dynamic'"
  ].filter(Boolean).join(' ');
  
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    isDevelopment ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "upgrade-insecure-requests"
  ].join('; ');
}

export interface SecurityConfig {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableRateLimit?: boolean;
  customHeaders?: Record<string, string>;
  isDevelopment?: boolean;
}

export class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig;

  private constructor(config: SecurityConfig = {}) {
    this.config = {
      enableCSP: true,
      enableHSTS: true,
      enableRateLimit: true,
      ...config,
    };
  }

  public static getInstance(config?: SecurityConfig): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager(config);
    }
    return SecurityManager.instance;
  }

  /**
   * Add comprehensive security headers to API responses
   */
  public addSecurityHeaders(response: NextResponse, options?: SecurityConfig): NextResponse {
    const mergedConfig = { ...this.config, ...options };

    // Core security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');

    // Cache control for API responses
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    // Content Security Policy for API responses
    if (mergedConfig.enableCSP) {
      const isDevelopment = mergedConfig.isDevelopment || process.env.NODE_ENV === 'development';
      response.headers.set('Content-Security-Policy', generateCSP({ isDevelopment, isAPI: true }));
    }

    // HTTP Strict Transport Security
    if (mergedConfig.enableHSTS) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Custom headers
    if (mergedConfig.customHeaders) {
      Object.entries(mergedConfig.customHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  }

  /**
   * Validate request content type
   */
  public validateContentType(request: NextRequest, expectedType: string = 'application/json'): boolean {
    const contentType = request.headers.get('content-type');
    return contentType ? contentType.includes(expectedType) : false;
  }

  /**
   * Sanitize input data
   */
  public sanitizeInput(data: any): any {
    if (typeof data === 'string') {
      // Remove potential XSS patterns
      return data
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeInput(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Validate request origin
   */
  public validateOrigin(request: NextRequest, allowedOrigins: string[] = []): boolean {
    const origin = request.headers.get('origin');
    if (!origin) return true; // Allow same-origin requests

    const url = new URL(request.url);
    const sameOrigin = origin === url.origin;

    if (sameOrigin) return true;
    return allowedOrigins.includes(origin);
  }

  /**
   * Generate secure response with error handling
   */
  public createSecureResponse(data: any, status: number = 200, options?: SecurityConfig): NextResponse {
    const response = NextResponse.json(data, { status });
    return this.addSecurityHeaders(response, options);
  }

  /**
   * Create secure error response
   */
  public createErrorResponse(message: string, status: number = 500, options?: SecurityConfig): NextResponse {
    const response = NextResponse.json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    }, { status });
    return this.addSecurityHeaders(response, options);
  }

  /**
   * Validate and sanitize request body
   */
  public async validateAndSanitizeRequest(request: NextRequest, schema?: any): Promise<any> {
    // Validate content type
    if (!this.validateContentType(request)) {
      throw new Error('Invalid content type');
    }

    // Parse and sanitize body
    const body = await request.json();
    const sanitizedBody = this.sanitizeInput(body);

    // Basic validation
    if (!sanitizedBody || typeof sanitizedBody !== 'object') {
      throw new Error('Invalid request body');
    }

    return sanitizedBody;
  }
}

// Rate limiting utility
export class RateLimiter {
  private static store = new Map<string, { count: number; resetTime: number }>();

  public static check(
    identifier: string,
    limit: number = 100,
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;

    if (!this.store.has(key)) {
      this.store.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
    }

    const entry = this.store.get(key)!;
    
    if (entry.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    entry.count++;
    return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime };
  }

  public static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Security audit logger
export class SecurityAuditLogger {
  public static log(event: string, details: any, request?: NextRequest): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown',
      userAgent: request?.headers.get('user-agent') || 'unknown',
      url: request?.url || 'unknown',
    };

    // In production, send to logging service
    console.log('[SECURITY AUDIT]', JSON.stringify(logEntry, null, 2));
  }
}