# Environment Variables

This document lists all environment variables used in the Nexus Suite application.

## Required Variables

### Sentry (Error Tracking)
```env
VITE_SENTRY_DSN=your_sentry_dsn_here
```
- **Description**: Sentry Data Source Name for error tracking
- **Get it from**: https://sentry.io/settings/projects/
- **Required for**: Production error monitoring
- **Optional in**: Development (errors will be logged to console)

### Sentry Debug (Optional)
```env
VITE_SENTRY_DEBUG=true
```
- **Description**: Enable Sentry in development mode
- **Default**: false (Sentry disabled in dev)
- **Use when**: Testing Sentry integration locally

### Firebase Configuration
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
- **Description**: Firebase project configuration
- **Get it from**: Firebase Console → Project Settings
- **Required for**: Authentication, Firestore, Storage

### Gemini API
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
```
- **Description**: Google Gemini API key for AI features
- **Get it from**: Google AI Studio
- **Required for**: AI-powered features (Cerebrity, Lab, etc.)

## Optional Variables

### Analytics
```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```
- **Description**: Google Analytics 4 Measurement ID
- **Get it from**: Google Analytics Admin
- **Required for**: User analytics tracking

### Vercel Analytics
```env
VITE_VERCEL_ANALYTICS_ID=your_analytics_id
```
- **Description**: Vercel Analytics ID
- **Get it from**: Vercel Dashboard
- **Required for**: Vercel-specific analytics

## File Structure

### Development
Create `.env.local` in the project root:
```env
# .env.local (NOT committed to git)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_GEMINI_API_KEY=your_gemini_key
VITE_FIREBASE_API_KEY=your_firebase_key
# ... other variables
```

### Production (Vercel)
Set environment variables in Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add each variable with appropriate scope (Production/Preview/Development)
3. Redeploy to apply changes

## Google OAuth (Optional)

Google OAuth is configured through Firebase Console and Google Cloud Console. No environment variables are required in `.env` files.

### Configuration Steps:
1. See `docs/GOOGLE_OAUTH_SETUP.md` for detailed setup instructions
2. Configure OAuth Client ID in Google Cloud Console
3. Enable Google provider in Firebase Console
4. No code changes or environment variables needed

### Notes:
- OAuth Client ID is public and safe to expose in client code
- Firebase handles all token validation server-side
- Works automatically once configured in Firebase Console

---

## Security Notes

⚠️ **NEVER commit `.env.local` to git**
- Already in `.gitignore`
- Contains sensitive API keys

✅ **Use `.env.example` for documentation**
- Commit this file to show required variables
- Don't include actual values

✅ **Rotate keys if exposed**
- If keys are accidentally committed, rotate them immediately
- Use environment-specific keys when possible

## Validation

The app will warn in console if required variables are missing:
- Sentry: "⚠️ Sentry DSN not configured"
- Firebase: Will fail to initialize
- Gemini: AI features will not work

## Testing

To test with different configurations:
1. Copy `.env.local` to `.env.test`
2. Modify test values
3. Run with: `VITE_ENV_FILE=.env.test npm run dev`
