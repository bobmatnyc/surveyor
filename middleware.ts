import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateCSP } from './lib/security';

// Generate a unique nonce for each request
function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

// Legacy function kept for backwards compatibility
function generateCSPWithNonce(nonce: string): string {
  return generateCSP({ nonce });
}

// Security headers configuration
function getSecurityHeaders(request: NextRequest, nonce?: string) {
  const headers = new Headers();
  
  // Core security headers
  headers.set('X-DNS-Prefetch-Control', 'on');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy - restrict potentially dangerous features
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), autoplay=(), fullscreen=(self)'
  );
  
  // HSTS for HTTPS enforcement
  headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // Enhanced CSP with nonce for inline scripts
  if (nonce) {
    const isAPI = request.nextUrl.pathname.startsWith('/api/');
    headers.set('Content-Security-Policy', generateCSP({ nonce, isAPI }));
  }
  
  // Additional security headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  }
  
  return headers;
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Simple rate limiting
function rateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = `${ip}:${Math.floor(now / windowMs)}`;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const entry = rateLimitStore.get(key)!;
  if (entry.count >= limit) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Clean up expired rate limit entries
function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Clean up rate limit store periodically
  if (Math.random() < 0.01) { // 1% chance per request
    cleanupRateLimit();
  }
  
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1';
  
  // Apply rate limiting
  if (!rateLimit(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
  
  // Generate nonce for CSP
  const nonce = generateNonce();
  
  // Apply security headers
  const securityHeaders = getSecurityHeaders(request, nonce);
  securityHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });
  
  // Set nonce in response for use in components
  response.headers.set('X-Nonce', nonce);
  
  // Block common attack patterns
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /burp/i,
    /zaproxy/i,
    /acunetix/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // Block requests with suspicious query parameters
  const url = request.nextUrl;
  const suspiciousParams = ['<script', 'javascript:', 'data:', 'vbscript:'];
  const queryString = url.search.toLowerCase();
  
  if (suspiciousParams.some(param => queryString.includes(param))) {
    return new NextResponse('Bad Request', { status: 400 });
  }
  
  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};