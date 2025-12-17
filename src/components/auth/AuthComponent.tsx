import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

export const AuthComponent = () => {
  const { auth } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setSuccess(true);
    } catch (err: any) {
      let msg = err.message;
      if (msg.includes('invalid-credential')) msg = 'Credenciales incorrectas.';
      if (msg.includes('invalid-email')) msg = 'Email no válido.';
      if (msg.includes('user-not-found')) msg = 'Usuario no encontrado.';
      if (msg.includes('wrong-password')) msg = 'Contraseña incorrecta.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-[#050814] text-slate-200">

      {/* === ATMOSPHERIC BACKGROUND === */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#060b1f] via-[#0a1028] to-[#120918] z-0" />

      {/* === CINEMATIC LIGHT SCENE === */}
      <div className="absolute inset-0 z-[1] pointer-events-none">

        {/* Cool light (top-left) */}
        <div
          className="absolute -top-[20%] -left-[20%] w-[80vw] h-[80vw] rounded-full blur-[180px] opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(120,150,255,0.55), transparent 65%)',
            mixBlendMode: 'screen',
          }}
        />

        {/* Warm light (bottom-right) */}
        <div
          className="absolute -bottom-[20%] -right-[20%] w-[80vw] h-[80vw] rounded-full blur-[200px] opacity-45"
          style={{
            background: 'radial-gradient(circle, rgba(255,140,80,0.55), transparent 65%)',
            mixBlendMode: 'screen',
          }}
        />

        {/* Ambient bloom */}
        <div
          className="absolute top-1/2 left-1/2 w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2 blur-[220px] opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.9), transparent 70%)',
          }}
        />
      </div>

      {/* === CARD === */}
      <AnimatePresence>
        {!success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, filter: 'blur(20px)' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[420px] px-4"
          >
            <div className="relative rounded-[34px] p-[1px] bg-gradient-to-br from-white/30 via-white/10 to-transparent shadow-[0_60px_160px_rgba(0,0,0,0.65)]">

              <div className="relative rounded-[33px] bg-white/[0.08] backdrop-blur-[28px] border border-white/[0.06] overflow-hidden">

                {/* Glass reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30" />

                {/* Bottom glow */}
                <div className="absolute bottom-0 left-0 right-0 h-[120px] bg-gradient-to-t from-orange-500/10 to-transparent" />

                <div className="relative p-10 flex flex-col items-center">

                  {/* === ICON === */}
                  <motion.div
                    className="relative mb-6"
                    animate={{ rotate: [0, 1, -1, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="absolute inset-0 rounded-full blur-xl bg-gradient-to-br from-orange-400/40 to-amber-300/40 animate-pulse" />
                    <div
                      className="w-14 h-14 rounded-full relative z-10"
                      style={{
                        background: 'conic-gradient(from 0deg, #f97316, #fbbf24, #fb923c, #f97316)',
                        animation: 'spin 20s linear infinite',
                      }}
                    />
                  </motion.div>

                  <h1 className="text-3xl font-semibold tracking-tight text-white mb-1">Nexus</h1>
                  <p className="text-sm text-slate-300/80 mb-8">
                    Your operational brain for cocktails.
                  </p>

                  <form onSubmit={handleSubmit} className="w-full space-y-5">
                    <input
                      type="email"
                      placeholder="executive@hotel.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-xl px-4 py-3 bg-[#070b1f]/70 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-400/40"
                    />

                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-xl px-4 py-3 bg-[#070b1f]/70 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-400/40"
                    />

                    {error && (
                      <div className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-semibold shadow-[0_30px_80px_-20px_rgba(249,115,22,0.8)] hover:brightness-110 transition"
                    >
                      {isLogin ? 'Acceder' : 'Registrarse'}
                    </button>
                  </form>

                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="mt-6 text-sm text-slate-400 hover:text-orange-300"
                  >
                    {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Accede'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};