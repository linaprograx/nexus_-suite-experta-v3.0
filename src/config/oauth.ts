import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import type { Auth, UserCredential } from 'firebase/auth';

/**
 * OAuth Configuration and Utilities
 * Handles Google OAuth authentication flows
 */

// Google OAuth Provider
export const googleProvider = new GoogleAuthProvider();

// Configure OAuth scopes (optional - Firebase handles basic profile by default)
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Set custom parameters (optional)
googleProvider.setCustomParameters({
    prompt: 'select_account', // Always show account selection
});

/**
 * Sign in with Google using popup
 * Preferred method for desktop
 */
export const signInWithGoogle = async (auth: Auth): Promise<UserCredential> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result;
    } catch (error: any) {
        // Handle specific OAuth errors
        if (error.code === 'auth/popup-blocked') {
            throw new Error('Popup bloqueado. Por favor, permite popups para este sitio.');
        }
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('Inicio de sesión cancelado.');
        }
        if (error.code === 'auth/account-exists-with-different-credential') {
            throw new Error('Ya existe una cuenta con este email usando otro método de inicio de sesión.');
        }
        if (error.code === 'auth/cancelled-popup-request') {
            // User opened multiple popups, ignore this error
            throw new Error('Múltiples ventanas de inicio de sesión abiertas. Por favor, cierra las demás.');
        }
        throw error;
    }
};

/**
 * Sign in with Google using redirect
 * Fallback for mobile or when popup is blocked
 */
export const signInWithGoogleRedirect = async (auth: Auth): Promise<void> => {
    try {
        await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
        if (error.code === 'auth/account-exists-with-different-credential') {
            throw new Error('Ya existe una cuenta con este email usando otro método de inicio de sesión.');
        }
        throw error;
    }
};

/**
 * Handle redirect result after OAuth redirect flow
 * Call this on component mount to handle redirect results
 */
export const handleOAuthRedirectResult = async (auth: Auth): Promise<UserCredential | null> => {
    try {
        const result = await getRedirectResult(auth);
        return result;
    } catch (error: any) {
        if (error.code === 'auth/account-exists-with-different-credential') {
            throw new Error('Ya existe una cuenta con este email usando otro método de inicio de sesión.');
        }
        throw error;
    }
};

/**
 * Detect if device is mobile
 * Used to determine whether to use popup or redirect flow
 */
export const isMobileDevice = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};
