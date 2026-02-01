# 🔐 Google OAuth Setup Guide

## Overview
This guide explains how to configure Google OAuth authentication for Nexus Suite.

---

## Prerequisites
- Firebase project created
- Firebase Authentication enabled
- Access to Firebase Console

---

## Step 1: Enable Google Sign-In in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Toggle **Enable**
6. Add your **Project support email** (required)
7. Click **Save**

---

## Step 2: Configure Authorized Domains

Firebase automatically authorizes:
- `localhost` (for development)
- Your Firebase Hosting domain
- Your Vercel domain (if deployed)

To add custom domains:
1. In Firebase Console → Authentication → Settings
2. Scroll to **Authorized domains**
3. Click **Add domain**
4. Enter your domain (e.g., `nexus-suite.vercel.app`)
5. Click **Add**

---

## Step 3: Update CORS in AI Gateway (Optional)

If using AI Gateway, update allowed origins in `ai-gateway/src/server.ts`:

```typescript
const allowedOrigins = [
    'http://localhost:5173',
    'https://your-domain.vercel.app',  // Add your domain
    process.env.FRONTEND_URL
];
```

---

## Step 4: Test Google Sign-In

### Development
1. Run `npm run dev`
2. Navigate to login page
3. Click "Continuar con Google"
4. Select Google account
5. Verify successful login

### Production
1. Deploy to Vercel
2. Test from production URL
3. Verify popup is not blocked
4. Check Sentry for any errors

---

## Troubleshooting

### Popup Blocked
**Error**: `auth/popup-blocked`

**Solution**:
- Allow popups for your domain
- Use redirect flow instead (see below)

### Account Exists with Different Credential
**Error**: `auth/account-exists-with-different-credential`

**Solution**:
- User already registered with email/password
- Link accounts manually or use same sign-in method

### Network Request Failed
**Error**: `auth/network-request-failed`

**Solution**:
- Check internet connection
- Verify Firebase config is correct
- Check CORS settings

### Popup Closed by User
**Error**: `auth/popup-closed-by-user`

**Solution**:
- User closed popup before completing sign-in
- This is expected behavior, no action needed

---

## Alternative: Redirect Flow

If popups are problematic, use redirect flow instead:

```typescript
// In OAuthButtons.tsx, replace signInWithPopup with:
import { signInWithRedirect, getRedirectResult } from 'firebase/auth';

// On component mount, check for redirect result
useEffect(() => {
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        console.log('Signed in via redirect:', result.user);
      }
    })
    .catch((error) => {
      console.error('Redirect error:', error);
    });
}, []);

// In button click handler
const handleGoogleSignIn = async () => {
  await signInWithRedirect(auth, googleProvider);
};
```

**Note**: Redirect flow is better for mobile devices.

---

## Security Best Practices

### 1. Validate User Data
Always validate user data on the backend:
```typescript
const user = result.user;
// Verify email is from trusted domain
if (!user.email?.endsWith('@yourdomain.com')) {
  // Restrict access
}
```

### 2. Monitor Sign-Ins
- Check Firebase Authentication logs
- Monitor Sentry for auth errors
- Track failed sign-in attempts

### 3. Rate Limiting
Implement rate limiting to prevent abuse:
- Limit sign-in attempts per IP
- Use Firebase App Check (recommended)

---

## Firebase App Check (Recommended)

Protect your app from abuse:

1. Enable App Check in Firebase Console
2. Install dependencies:
```bash
npm install firebase/app-check
```

3. Initialize App Check:
```typescript
// src/config/firebaseApp.ts
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('your-recaptcha-site-key'),
  isTokenAutoRefreshEnabled: true
});
```

---

## Additional OAuth Providers

### Apple Sign-In (iOS Required)
See implementation plan Day 6-7 for Apple Sign-In setup.

### Microsoft/GitHub (Future)
Firebase supports:
- Microsoft
- GitHub
- Twitter
- Facebook

Enable in Firebase Console → Authentication → Sign-in method.

---

## Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Google Sign-In Best Practices](https://developers.google.com/identity/sign-in/web/sign-in)
- [Firebase App Check](https://firebase.google.com/docs/app-check)

---

**Setup Date**: 2026-02-01  
**Last Updated**: 2026-02-01  
**Status**: ✅ Implemented
