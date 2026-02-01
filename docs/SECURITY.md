# 🔒 Security Configuration Guide

## Overview
This document outlines the security measures implemented in Nexus Suite v3.0 to protect against common web vulnerabilities and ensure production-grade security.

---

## 1. Security Headers (vercel.json)

### Implemented Headers

#### X-Content-Type-Options: nosniff
- **Purpose**: Prevents MIME type sniffing
- **Protection**: Stops browsers from interpreting files as different MIME types
- **Impact**: Prevents XSS attacks via content type confusion

#### X-Frame-Options: DENY
- **Purpose**: Prevents clickjacking attacks
- **Protection**: Blocks the site from being embedded in iframes
- **Impact**: Protects against UI redress attacks

#### X-XSS-Protection: 1; mode=block
- **Purpose**: Enables browser XSS filtering
- **Protection**: Stops pages from loading when XSS is detected
- **Impact**: Additional layer against reflected XSS

#### Referrer-Policy: strict-origin-when-cross-origin
- **Purpose**: Controls referrer information
- **Protection**: Only sends origin on cross-origin requests
- **Impact**: Protects user privacy and prevents data leakage

#### Permissions-Policy
- **Purpose**: Controls browser features
- **Configuration**: `camera=(), microphone=(), geolocation=()`
- **Impact**: Disables unnecessary browser APIs

#### Content-Security-Policy (CSP)
Comprehensive policy to prevent XSS and data injection attacks:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' 
    https://www.googletagmanager.com 
    https://www.google-analytics.com 
    https://browser.sentry-cdn.com;
style-src 'self' 'unsafe-inline' 
    https://fonts.googleapis.com;
font-src 'self' 
    https://fonts.gstatic.com 
    data:;
img-src 'self' data: https: blob:;
connect-src 'self' 
    https://*.firebaseio.com 
    https://*.googleapis.com 
    https://*.sentry.io 
    https://generativelanguage.googleapis.com 
    wss://*.firebaseio.com;
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
```

**Note**: `'unsafe-inline'` and `'unsafe-eval'` are currently required for React and Vite. Consider implementing nonces in the future for stricter security.

---

## 2. Cache Control Headers

### API Routes (`/api/*`)
```
Cache-Control: no-store, no-cache, must-revalidate
```
- Prevents caching of sensitive API responses
- Ensures fresh data on every request

### Static Assets (`/assets/*`)
```
Cache-Control: public, max-age=31536000, immutable
```
- Aggressive caching for static assets (1 year)
- Improves performance
- Safe because assets are versioned/hashed

---

## 3. CORS Configuration (AI Gateway)

### Allowed Origins
```typescript
const allowedOrigins = [
    'http://localhost:5173',  // Vite dev
    'http://localhost:3000',  // Alternative dev
    'https://nexus-suite.vercel.app',  // Production
    process.env.FRONTEND_URL  // Dynamic
];
```

### Configuration
- **Credentials**: Enabled for cookie/auth support
- **Methods**: GET, POST, OPTIONS only
- **Headers**: Content-Type, Authorization
- **Origin Validation**: Strict whitelist, logs blocked requests

### Production Setup
1. Update `allowedOrigins` with your production domain
2. Set `FRONTEND_URL` environment variable in deployment
3. Remove localhost origins in production build

---

## 4. Environment Variables Security

### Protected Files
```gitignore
.env.local
.env.*.local
.sentryclirc
sentry.properties
```

### Best Practices
1. **Never commit** `.env.local` to git
2. **Use `.env.example`** for documentation
3. **Rotate keys** if accidentally exposed
4. **Use environment-specific keys** when possible

### Vercel Deployment
1. Go to Project Settings → Environment Variables
2. Add all required variables
3. Set appropriate scope (Production/Preview/Development)
4. Redeploy to apply changes

---

## 5. API Key Protection

### Current Setup
- API keys in `.env` for development
- Sentry DSN in `.env` (safe to expose in frontend)
- Firebase config in code (public by design)

### Production Recommendations
1. **Backend Proxy**: Route sensitive API calls through backend
2. **Rate Limiting**: Implement rate limiting on AI Gateway
3. **API Key Rotation**: Regular rotation schedule
4. **Monitoring**: Track API usage for anomalies

---

## 6. Error Handling Security

### Sentry Configuration
- **Production**: Errors sent to Sentry
- **Development**: Errors logged to console only
- **Sensitive Data**: Filtered before sending
- **PII Protection**: Console logs excluded from breadcrumbs

### Error Boundary
- Catches all React errors
- Prevents information disclosure
- Shows user-friendly messages
- Logs detailed errors to Sentry

---

## 7. Security Checklist

### Pre-Deployment
- [ ] Update `allowedOrigins` in AI Gateway
- [ ] Set all environment variables in Vercel
- [ ] Remove development origins from CORS
- [ ] Verify CSP doesn't block required resources
- [ ] Test error boundary in production mode
- [ ] Confirm Sentry is receiving errors

### Post-Deployment
- [ ] Monitor Sentry for CSP violations
- [ ] Check browser console for blocked resources
- [ ] Verify CORS is working correctly
- [ ] Test from different domains
- [ ] Review security headers with securityheaders.com
- [ ] Run OWASP ZAP or similar security scanner

---

## 8. Known Limitations

### CSP Unsafe Directives
- `'unsafe-inline'` required for React inline styles
- `'unsafe-eval'` required for Vite HMR in dev
- **Future**: Implement nonce-based CSP

### CORS Localhost
- Localhost origins allowed in development
- **Production**: Remove before deployment

### API Keys in Frontend
- Gemini API key exposed in frontend
- **Mitigation**: Rate limiting + usage monitoring
- **Future**: Backend proxy for sensitive calls

---

## 9. Incident Response

### If API Key is Exposed
1. **Immediately** rotate the key
2. Check usage logs for unauthorized access
3. Update key in all environments
4. Monitor for unusual activity
5. Document incident

### If CSP Violation Detected
1. Check Sentry for violation reports
2. Identify blocked resource
3. Update CSP if legitimate
4. Investigate if malicious

---

## 10. Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Security Headers](https://securityheaders.com/)
- [Sentry Security](https://docs.sentry.io/security-legal-pii/)

---

**Last Updated**: 2026-02-01  
**Review Schedule**: Quarterly  
**Next Review**: 2026-05-01
