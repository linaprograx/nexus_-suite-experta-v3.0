import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import { useApp } from '../../../context/AppContext';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';

interface LoginProps {
    onNavigate: (page: PageName) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
    const { auth } = useApp();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        if (!auth) return;
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            onNavigate(PageName.Dashboard);
        } catch (err: any) {
            let msg = err.message;
            if (msg.includes('invalid-credential')) msg = 'Credenciales inválidas';
            if (msg.includes('invalid-email')) msg = 'Email inválido';
            if (msg.includes('user-not-found')) msg = 'Usuario no encontrado';
            if (msg.includes('wrong-password')) msg = 'Contraseña incorrecta';
            if (msg.includes('weak-password')) msg = 'Contraseña débil';
            setError(msg);
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 bg-transparent relative overflow-hidden flex flex-col items-center justify-center px-6">

            {/* Logo Glass Card */}
            <GlassCard rounded="3xl" padding="lg" className="w-32 h-32 mb-8 flex items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xl">
                    <span className="material-symbols-outlined text-5xl fill-1">grid_view</span>
                </div>
            </GlassCard>

            {/* Title */}
            <h1 className="text-6xl font-black text-white mb-3 tracking-tighter text-center" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                NEXUS
            </h1>
            <p className="text-sm font-bold text-white/80 uppercase tracking-[0.3em] mb-12">Suite Experta</p>

            {/* Login Form Glass Card */}
            <GlassCard rounded="3xl" padding="xl" className="w-full max-w-sm">
                <div className="space-y-5 mb-6">
                    {/* Email Input */}
                    <div
                        className="relative input-glow rounded-2xl overflow-hidden"
                        style={{
                            background: 'rgba(255, 255, 255, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.6)',
                        }}
                    >
                        <input
                            type="email"
                            placeholder="Correo Electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-transparent py-4 px-5 text-sm font-bold text-zinc-900 placeholder:text-zinc-500 outline-none"
                        />
                    </div>

                    {/* Password Input */}
                    <div
                        className="relative input-glow rounded-2xl overflow-hidden"
                        style={{
                            background: 'rgba(255, 255, 255, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.6)',
                        }}
                    >
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                            className="w-full bg-transparent py-4 px-5 text-sm font-bold text-zinc-900 placeholder:text-zinc-500 outline-none"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-5 px-4 py-3 bg-red-100 text-red-600 rounded-2xl text-xs font-bold text-center">
                        {error}
                    </div>
                )}

                {/* Action Button */}
                <PremiumButton
                    module="login"
                    variant="gradient"
                    size="lg"
                    fullWidth
                    onClick={handleAuth}
                    disabled={loading}
                    customGradient="linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #DB2777 100%)"
                    icon={<span className="material-symbols-outlined !text-base">arrow_forward</span>}
                    iconPosition="right"
                >
                    {loading ? 'CARGANDO...' : 'ENTRAR A SUITE'}
                </PremiumButton>

                {/* Toggle Login/Register */}
                <button
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    className="w-full mt-5 text-xs font-bold text-zinc-600 uppercase tracking-wider hover:text-zinc-900 transition-colors"
                >
                    {isLogin ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </button>
            </GlassCard>

            {/* Biometric Icons */}
            <div className="flex gap-6 mt-10">
                <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-white text-2xl">fingerprint</span>
                </div>
                <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-white text-2xl">face</span>
                </div>
            </div>

            {/* Footer */}
            <p className="absolute bottom-10 text-[9px] font-bold text-white/50 uppercase tracking-[0.3em]">
                Acceso Biométrico v4.2
            </p>
        </div>
    );
};

export default Login;
