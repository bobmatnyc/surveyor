import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// CSP functions completely removed to allow unrestricted JavaScript execution

export interface SecurityConfig {
  enableHSTS?: boolean;
  enableRateLimit?: boolean;
  customHeaders?: Record<string, string>;
  isDevelopment?: boolean;
}

// CSRF Protection utility
export class CSRFProtection {
  private static readonly CSRF_TOKEN_LENGTH = 32;
  private static tokenStore = new Map<string, { token: string; expires: number }>();

  /**
   * Generate CSRF token for session
   */
  public static generateToken(sessionId: string): string {
    const token = crypto.randomBytes(this.CSRF_TOKEN_LENGTH).toString('hex');
    const expires = Date.now() + (2 * 60 * 60 * 1000); // 2 hours
    
    this.tokenStore.set(sessionId, { token, expires });
    
    // Cleanup expired tokens
    this.cleanup();
    
    return token;
  }

  /**
   * Validate CSRF token
   */
  public static validateToken(sessionId: string, submittedToken: string): boolean {
    const stored = this.tokenStore.get(sessionId);
    
    if (!stored) {
      return false;
    }
    
    // Check expiration
    if (Date.now() > stored.expires) {
      this.tokenStore.delete(sessionId);
      return false;
    }
    
    // Check token match
    return stored.token === submittedToken;
  }

  /**
   * Clean up expired tokens
   */
  private static cleanup(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.tokenStore.entries()) {
      if (now > data.expires) {
        this.tokenStore.delete(sessionId);
      }
    }
  }

  /**
   * Require CSRF token validation for state-changing operations
   */
  public static requireCSRF(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      // Only check CSRF for state-changing methods
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        const csrfToken = request.headers.get('x-csrf-token');
        const sessionCookie = request.cookies.get('admin_session')?.value;
        
        if (!csrfToken || !sessionCookie) {
          SecurityAuditLogger.log('CSRF_TOKEN_MISSING', {
            method: request.method,
            path: request.nextUrl.pathname,
            hasCSRF: !!csrfToken,
            hasSession: !!sessionCookie
          }, request);
          
          return NextResponse.json({
            success: false,
            error: 'CSRF token required'
          }, { status: 403 });
        }
        
        // Extract session ID from JWT token (simplified for this example)
        const sessionId = sessionCookie;
        
        if (!this.validateToken(sessionId, csrfToken)) {
          SecurityAuditLogger.log('CSRF_TOKEN_INVALID', {
            method: request.method,
            path: request.nextUrl.pathname
          }, request);
          
          return NextResponse.json({
            success: false,
            error: 'Invalid CSRF token'
          }, { status: 403 });
        }
      }
      
      return handler(request);
    };
  }
}

export class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig;

  private constructor(config: SecurityConfig = {}) {
    this.config = {
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

    // Content Security Policy completely removed for unrestricted JavaScript execution

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
   * Sanitize input data with enhanced security patterns
   */
  public sanitizeInput(data: any, depth: number = 0): any {
    // Prevent deeply nested objects (DoS protection)
    if (depth > 10) {
      throw new Error('Object nesting too deep');
    }

    if (typeof data === 'string') {
      // Remove potential XSS patterns
      return data
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data:text\/html/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/<iframe\b[^>]*>/gi, '')
        .replace(/<object\b[^>]*>/gi, '')
        .replace(/<embed\b[^>]*>/gi, '')
        .trim();
    }

    if (Array.isArray(data)) {
      // Limit array size
      if (data.length > 1000) {
        throw new Error('Array too large');
      }
      return data.map(item => this.sanitizeInput(item, depth + 1));
    }

    if (typeof data === 'object' && data !== null) {
      // Limit object size
      const keys = Object.keys(data);
      if (keys.length > 100) {
        throw new Error('Object has too many properties');
      }
      
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Sanitize key names
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
        if (sanitizedKey) {
          sanitized[sanitizedKey] = this.sanitizeInput(value, depth + 1);
        }
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
   * Generate secure response with error handling and CSRF token
   */
  public createSecureResponse(data: any, status: number = 200, options?: SecurityConfig & { includeCSRF?: boolean; sessionId?: string }): NextResponse {
    let responseData = data;
    
    // Add CSRF token if requested
    if (options?.includeCSRF && options?.sessionId) {
      const csrfToken = CSRFProtection.generateToken(options.sessionId);
      responseData = {
        ...data,
        csrfToken
      };
    }
    
    const response = NextResponse.json(responseData, { status });
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
   * Validate and sanitize request body with enhanced security checks
   */
  public async validateAndSanitizeRequest(request: NextRequest, options?: {
    maxBodySize?: number;
    requireJSON?: boolean;
    allowedFields?: string[];
  }): Promise<any> {
    const { maxBodySize = 10 * 1024 * 1024, requireJSON = true, allowedFields } = options || {};
    
    // Validate content type
    if (requireJSON && !this.validateContentType(request)) {
      throw new Error('Invalid content type - JSON required');
    }

    // Check content length
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxBodySize) {
      throw new Error(`Request body too large. Maximum size: ${maxBodySize} bytes`);
    }

    // Parse and sanitize body
    const body = await request.json();
    const sanitizedBody = this.sanitizeInput(body);

    // Basic validation
    if (!sanitizedBody || typeof sanitizedBody !== 'object') {
      throw new Error('Invalid request body structure');
    }

    // Field filtering if specified
    if (allowedFields && Array.isArray(allowedFields)) {
      const filteredBody: any = {};
      for (const field of allowedFields) {
        if (field in sanitizedBody) {
          filteredBody[field] = sanitizedBody[field];
        }
      }
      return filteredBody;
    }

    return sanitizedBody;
  }

  /**
   * Validate file upload security
   */
  public validateFileUpload(file: File, options?: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  }): { valid: boolean; errors: string[] } {
    const { maxSize = 10 * 1024 * 1024, allowedTypes = ['application/json'], allowedExtensions = ['.json'] } = options || {};
    const errors: string[] = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension)) {
      errors.push(`Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`);
    }

    // Check for suspicious file names
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      errors.push('Invalid file name');
    }

    return { valid: errors.length === 0, errors };
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
      ip: request ? AdminAuth.getClientIP(request) : 'unknown',
      userAgent: request?.headers.get('user-agent') || 'unknown',
      url: request?.url || 'unknown',
    };

    // In production, send to logging service (e.g., DataDog, Splunk)
    console.log('[SECURITY AUDIT]', JSON.stringify(logEntry, null, 2));
    
    // Optional: Store critical events in database
    if (['ADMIN_LOGIN_SUCCESS', 'FAILED_LOGIN_ATTEMPT', 'UNAUTHORIZED_ADMIN_ACCESS'].includes(event)) {
      // TODO: Store in database for long-term audit trail
    }
  }
}

// Survey code generation system
export class SurveyCodes {
  /**
   * Generate cryptographically secure 32-character distribution code
   */
  public static generateDistributionCode(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate cryptographically secure 32-character admin code
   */
  public static generateAdminCode(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Validate code format (32-character hex)
   */
  public static validateCodeFormat(code: string): boolean {
    return /^[a-f0-9]{32}$/.test(code);
  }

  /**
   * Generate both codes for a survey
   */
  public static generateCodePair(): { distributionCode: string; adminCode: string } {
    return {
      distributionCode: this.generateDistributionCode(),
      adminCode: this.generateAdminCode()
    };
  }
}

// Admin authentication utility
export class AdminAuth {
  private static readonly ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  private static readonly ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  private static readonly JWT_SECRET = process.env.JWT_SECRET;
  private static readonly TOKEN_EXPIRY = '24h';
  private static loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Validate admin credentials with environment password requirement
   */
  public static validateCredentials(username: string, password: string): boolean {
    // Require admin password to be set in environment
    if (!this.ADMIN_PASSWORD) {
      SecurityAuditLogger.log('ADMIN_AUTH_ERROR', {
        error: 'Admin password not configured in environment'
      });
      return false;
    }
    
    return username === this.ADMIN_USERNAME && password === this.ADMIN_PASSWORD;
  }

  /**
   * Check if IP is currently locked out due to failed attempts
   */
  public static isLockedOut(ip: string): boolean {
    const attempt = this.loginAttempts.get(ip);
    if (!attempt) return false;
    
    if (attempt.count >= this.MAX_LOGIN_ATTEMPTS) {
      const timeElapsed = Date.now() - attempt.lastAttempt;
      if (timeElapsed < this.LOCKOUT_DURATION) {
        return true;
      } else {
        // Reset after lockout period
        this.loginAttempts.delete(ip);
        return false;
      }
    }
    
    return false;
  }

  /**
   * Record failed login attempt
   */
  public static recordFailedAttempt(ip: string): void {
    const attempt = this.loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    attempt.count++;
    attempt.lastAttempt = Date.now();
    this.loginAttempts.set(ip, attempt);
    
    SecurityAuditLogger.log('FAILED_LOGIN_ATTEMPT', {
      ip,
      attemptCount: attempt.count,
      isLockedOut: attempt.count >= this.MAX_LOGIN_ATTEMPTS
    });
  }

  /**
   * Clear failed attempts on successful login
   */
  public static clearFailedAttempts(ip: string): void {
    this.loginAttempts.delete(ip);
  }

  /**
   * Generate JWT admin session token
   */
  public static generateSessionToken(username: string): string {
    // Require JWT secret to be set in environment
    if (!this.JWT_SECRET) {
      SecurityAuditLogger.log('JWT_SECRET_ERROR', {
        error: 'JWT secret not configured in environment'
      });
      throw new Error('JWT secret not configured');
    }
    
    const payload = {
      username,
      role: 'admin',
      iat: Math.floor(Date.now() / 1000)
    };
    
    return jwt.sign(payload, this.JWT_SECRET, { 
      expiresIn: this.TOKEN_EXPIRY,
      issuer: 'surveyor-admin',
      audience: 'surveyor-platform'
    });
  }

  /**
   * Validate JWT admin session token
   */
  public static validateSessionToken(token: string): { valid: boolean; username?: string; expired?: boolean } {
    // Require JWT secret to be set in environment
    if (!this.JWT_SECRET) {
      SecurityAuditLogger.log('JWT_SECRET_ERROR', {
        error: 'JWT secret not configured in environment'
      });
      return { valid: false };
    }
    
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'surveyor-admin',
        audience: 'surveyor-platform'
      }) as any;
      
      return { valid: true, username: decoded.username };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return { valid: false, expired: true };
      }
      return { valid: false };
    }
  }

  /**
   * Check if request has valid admin authentication
   */
  public static isAdminAuthenticated(request: NextRequest): { authenticated: boolean; username?: string; expired?: boolean } {
    const authHeader = request.headers.get('authorization');
    const sessionCookie = request.cookies.get('admin_session')?.value;
    
    // Check Authorization header (for API calls)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const result = this.validateSessionToken(token);
      return { authenticated: result.valid, username: result.username, expired: result.expired };
    }

    // Check session cookie (for web interface)
    if (sessionCookie) {
      const result = this.validateSessionToken(sessionCookie);
      return { authenticated: result.valid, username: result.username, expired: result.expired };
    }

    return { authenticated: false };
  }

  /**
   * Create admin authentication response with enhanced security
   */
  public static createAuthResponse(username: string, ip: string, success: boolean = true): NextResponse {
    if (success) {
      const token = this.generateSessionToken(username);
      
      // Clear failed attempts on successful login
      this.clearFailedAttempts(ip);
      
      SecurityAuditLogger.log('ADMIN_LOGIN_SUCCESS', {
        username,
        ip,
        timestamp: new Date().toISOString()
      });
      
      const response = NextResponse.json({
        success: true,
        message: 'Authentication successful',
        token,
        expiresIn: this.TOKEN_EXPIRY
      });

      // Set secure HTTP-only cookie
      response.cookies.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      });

      return response;
    } else {
      // Record failed attempt
      this.recordFailedAttempt(ip);
      
      const isNowLockedOut = this.isLockedOut(ip);
      
      return NextResponse.json({
        success: false,
        message: isNowLockedOut 
          ? 'Too many failed attempts. Account locked for 15 minutes.'
          : 'Invalid credentials',
        lockedOut: isNowLockedOut,
        remainingAttempts: isNowLockedOut ? 0 : Math.max(0, this.MAX_LOGIN_ATTEMPTS - (this.loginAttempts.get(ip)?.count || 0))
      }, { status: 401 });
    }
  }

  /**
   * Create admin logout response
   */
  public static createLogoutResponse(): NextResponse {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear session cookie
    response.cookies.set('admin_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;
  }

  /**
   * Require admin authentication middleware with enhanced error handling
   */
  public static requireAuth(handler: (request: NextRequest, username: string) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const authResult = this.isAdminAuthenticated(request);
      
      if (!authResult.authenticated) {
        SecurityAuditLogger.log('UNAUTHORIZED_ADMIN_ACCESS', {
          path: request.nextUrl.pathname,
          method: request.method,
          expired: authResult.expired
        }, request);

        const status = authResult.expired ? 401 : 403;
        const message = authResult.expired 
          ? 'Session expired. Please login again.'
          : 'Admin authentication required';

        return NextResponse.json({
          success: false,
          error: message,
          expired: authResult.expired
        }, { status });
      }

      return handler(request, authResult.username!);
    };
  }

  /**
   * Get client IP address from request
   */
  public static getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers.get('x-real-ip') ||
           request.ip ||
           'unknown';
  }
}