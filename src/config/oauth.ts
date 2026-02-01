// src/config/oauth.ts

import { GoogleAuthProvider } from 'firebase/auth';

/**
 * Google OAuth Provider Configuration
 * 
 * Setup Instructions:
 * 1. Go to Firebase Console → Authentication → Sign-in method
 * 2. Enable Google provider
 * 3. Add authorized domains (localhost, your-domain.vercel.app)
 * 4. No additional API keys needed - Firebase handles it
 */

export const googleProvider = new GoogleAuthProvider();

// Configure provider settings
googleProvider.setCustomParameters({
    prompt: 'select_account',  // Always show account picker
    // login_hint: 'user@example.com',  // Optional: pre-fill email
});

// Request additional scopes if needed
// googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
// googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

/**
 * Apple OAuth Provider Configuration (for future use)
 * Requires Apple Developer Account setup
 */
// import { OAuthProvider } from 'firebase/auth';
// export const appleProvider = new OAuthProvider('apple.com');
// appleProvider.addScope('email');
// appleProvider.addScope('name');
