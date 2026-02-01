# Google OAuth Setup Guide

## Overview
This guide explains how to configure Google OAuth authentication for Nexus Suite using Firebase Authentication.

## Prerequisites
- Firebase project created
- Firebase Authentication enabled
- Access to Google Cloud Console

## Step 1: Google Cloud Console Configuration

### 1.1 Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project from the dropdown
3. Navigate to **APIs & Services** → **Credentials**

### 1.2 Create OAuth 2.0 Client ID
1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for public apps) or **Internal** (for G Suite)
   - App name: **Nexus Suite**
   - User support email: Your email
   - Developer contact: Your email
   - Save and continue through scopes (no additional scopes needed)
   - Add test users if in testing mode
3. Return to **Credentials** and create OAuth client ID:
   - Application type: **Web application**
   - Name: **Nexus Suite Web Client**

### 1.3 Configure Authorized Origins
Add the following JavaScript origins:
```
http://localhost:3000
http://localhost:5173
https://your-production-domain.com
```

### 1.4 Configure Redirect URIs
Firebase Auth handles redirects automatically. Add:
```
http://localhost:3000/__/auth/handler
https://your-production-domain.com/__/auth/handler
```

### 1.5 Save Client ID
- Click **CREATE**
- **IMPORTANT**: Copy the **Client ID** (you'll need it for Firebase)
- The Client Secret is not needed for Firebase Auth

## Step 2: Firebase Console Configuration

### 2.1 Enable Google Provider
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** in the providers list
5. Toggle **Enable**

### 2.2 Configure Web SDK
1. Paste the **Web Client ID** from Step 1.5
2. **Web Client Secret**: Leave empty (Firebase handles this)
3. Click **Save**

### 2.3 Authorized Domains
Firebase automatically authorizes:
- `localhost`
- Your Firebase Hosting domain
- Your custom domains (if configured)

To add custom domains:
1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Click **Add domain**
3. Enter your production domain

## Step 3: Verify Implementation

### 3.1 Test Locally
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click **"Continuar con Google"**
4. Select a Google account
5. Verify successful login

### 3.2 Check Console
Open browser DevTools and verify:
- No errors in console
- User object logged after successful sign-in
- Firestore user profile created

### 3.3 Test Logout
1. Log out from the application
2. Verify you're redirected to login screen
3. Test login again to ensure persistence

## Troubleshooting

### Error: "Popup blocked"
**Solution**: Allow popups for localhost in browser settings, or the app will automatically fall back to redirect flow on mobile.

### Error: "redirect_uri_mismatch"
**Solution**: 
1. Check that redirect URI in Google Cloud Console matches exactly
2. Ensure you're using the correct domain (localhost vs production)
3. Clear browser cache and try again

### Error: "Invalid OAuth client"
**Solution**:
1. Verify Client ID is correctly pasted in Firebase Console
2. Ensure the OAuth client is for "Web application" type
3. Check that the client hasn't been deleted in Google Cloud Console

### Error: "Account exists with different credential"
**Solution**: This user previously signed up with email/password. Options:
1. Link accounts programmatically (advanced)
2. User should sign in with their original method
3. Delete the existing account and re-register with Google

### No user profile created in Firestore
**Solution**: Check that your app has logic to create user profiles on first sign-in. This should be handled in `AppContext` or similar.

## Security Notes

✅ **OAuth Client ID is public** - It's safe to expose in client-side code
✅ **Firebase validates tokens** - Server-side validation happens automatically
✅ **No secrets in code** - Client Secret is not used for web apps
⚠️ **CORS configured** - Ensure authorized origins match your domains exactly

## Mobile Considerations

The implementation automatically detects mobile devices and uses redirect flow instead of popups:
- **Desktop**: Popup window (better UX)
- **Mobile**: Redirect flow (popup-free)

## Production Checklist

Before deploying to production:
- [ ] Add production domain to Google Cloud Console authorized origins
- [ ] Add production redirect URI to Google Cloud Console
- [ ] Add production domain to Firebase authorized domains
- [ ] Test OAuth flow on production URL
- [ ] Verify SSL certificate is valid (required for OAuth)
- [ ] Test on multiple browsers (Chrome, Safari, Firefox)
- [ ] Test on mobile devices (iOS Safari, Android Chrome)

## Environment Variables

No additional environment variables are needed. Firebase configuration is already set up in `src/config/firebase.ts`.

## Support

For issues:
1. Check Firebase Console → Authentication → Users to see if sign-in succeeded
2. Check browser console for detailed error messages
3. Verify Google Cloud Console settings match this guide
4. Review Firebase Auth documentation: https://firebase.google.com/docs/auth/web/google-signin
