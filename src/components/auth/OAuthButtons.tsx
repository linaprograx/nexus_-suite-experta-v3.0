// src/components/auth/OAuthButtons.tsx

import React, { useState } from 'react';
import { signInWithPopup, AuthError } from 'firebase/auth';
import { auth } from '../../config/firebaseApp';
import { googleProvider } from '../../config/oauth';

interface OAuthButtonsProps {
    onError?: (error: string) => void;
    onLoading?: (loading: boolean) => void;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({ onError, onLoading }) => {
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        if (!auth) {
            onError?.('Firebase Auth no está inicializado');
            return;
        }

        setLoading(true);
        onLoading?.(true);

        try {
            const result = await signInWithPopup(auth, googleProvider);

            // Optional: Access additional user info
            // const credential = GoogleAuthProvider.credentialFromResult(result);
            // const token = credential?.accessToken;
            // const user = result.user;

            console.log('✅ Google Sign-In successful:', result.user.email);

        } catch (error) {
            const authError = error as AuthError;
            console.error('Google Sign-In error:', authError);

            let errorMessage = 'Error al iniciar sesión con Google';

            // Handle specific error codes
            switch (authError.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = 'Inicio de sesión cancelado';
                    break;
                case 'auth/popup-blocked':
                    errorMessage = 'Popup bloqueado. Por favor, permite popups para este sitio.';
                    break;
                case 'auth/cancelled-popup-request':
                    errorMessage = 'Solicitud cancelada';
                    break;
                case 'auth/account-exists-with-different-credential':
                    errorMessage = 'Ya existe una cuenta con este email usando otro método de inicio de sesión';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Error de conexión. Verifica tu internet.';
                    break;
                default:
                    errorMessage = authError.message || 'Error desconocido';
            }

            onError?.(errorMessage);
        } finally {
            setLoading(false);
            onLoading?.(false);
        }
    };

    return (
        <div className="space-y-3">
            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#03050a]/80 text-slate-400">O continúa con</span>
                </div>
            </div>

            {/* Google Sign-In Button */}
            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {/* Google Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>

                <span className="font-medium text-slate-200 group-hover:text-white transition-colors">
                    {loading ? 'Conectando...' : 'Continuar con Google'}
                </span>
            </button>

            {/* Future: Apple Sign-In Button (commented out) */}
            {/* 
      <button
        type="button"
        onClick={handleAppleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
        <span className="font-medium text-slate-200 group-hover:text-white transition-colors">
          {loading ? 'Conectando...' : 'Continuar con Apple'}
        </span>
      </button>
      */}
        </div>
    );
};
