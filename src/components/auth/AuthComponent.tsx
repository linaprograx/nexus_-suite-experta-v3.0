import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthBackground } from './AuthBackground';

export const AuthComponent = () => {
  const { auth } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // === Parallax State ===
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize -1 to 1 for tilt calculation
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-[#010205] text-slate-200 perspective-[1200px]">

      {/* 0. WEBGL BACKGROUND (Z-0) */}
      <AuthBackground />

      {/* 1. CARD CONTAINER (Z-10) */}
      <AnimatePresence>
        {!success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20, filter: 'blur(16px)' }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              filter: 'blur(0px)',
              x: mousePos.x * 8,   // Micro-Parallax
              rotateX: -mousePos.y * 1.5,
              rotateY: mousePos.x * 1.5
            }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(30px)', transition: { duration: 0.5 } }}
            transition={{
              duration: 1.2, // Cinematic 1.2s Intro
              ease: [0.16, 1, 0.3, 1], // Custom Ease
              x: { type: "spring", stiffness: 30, damping: 20 },
              rotateX: { type: "spring", stiffness: 30, damping: 20 },
              rotateY: { type: "spring", stiffness: 30, damping: 20 }
            }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative z-10 w-full max-w-[420px] px-6"
          >
            {/* === REAL GLASS STACK === */}

            {/* Layer A: Wrapper Gradient Rim */}
            <div className="relative rounded-[36px] p-[1px] bg-gradient-to-br from-white/20 via-white/5 to-transparent shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)]">

              {/* Layer B: Glass Body */}
              <div className="relative rounded-[35px] bg-[#050a15]/40 backdrop-blur-[36px] overflow-hidden border border-white/5">

                {/* Layer C: Inner Refraction Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

                {/* Layer D: Diagonal Specular Streak */}
                <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent rotate-45 pointer-events-none blur-xl" />

                {/* Layer E: Chromatic Edge (Red/Blue Sub-pixel shift) */}
                <div className="absolute inset-0 rounded-[35px] border border-red-500/10 pointer-events-none mix-blend-screen translate-x-[0.5px]" />
                <div className="absolute inset-0 rounded-[35px] border border-blue-500/10 pointer-events-none mix-blend-screen -translate-x-[0.5px]" />

                {/* Layer F: Bottom Glow (Warmth) */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 1.0 }}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-orange-500/15 blur-[60px] pointer-events-none mix-blend-screen"
                />

                {/* === CONTENT === */}
                <div className="relative p-10 flex flex-col items-center z-20">

                  {/* ICON: Living Sphere */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, filter: 'blur(8px)' }}
                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ delay: 0.5, duration: 1.0, type: "spring" }}
                    className="relative mb-8 group"
                  >
                    <div className="absolute inset-0 rounded-full blur-[20px] bg-orange-500/30 group-hover:bg-orange-500/50 transition-colors duration-700" />
                    <div className="w-16 h-16 rounded-full relative z-10 overflow-hidden shadow-[inset_0_4px_8px_rgba(255,255,255,0.3),inset_0_-6px_10px_rgba(0,0,0,0.5)]">
                      {/* Conic Gradient Core */}
                      <div className="absolute inset-[-50%] w-[200%] h-[200%] animate-[spin_20s_linear_infinite]"
                        style={{ background: 'conic-gradient(from 0deg, #60a5fa, #a78bfa, #f97316, #fbbf24, #60a5fa)' }} />
                      {/* Surface Specular */}
                      <div className="absolute top-2 left-3 w-5 h-3 bg-white/40 blur-[3px] rounded-full -rotate-45" />
                    </div>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-3xl font-semibold text-white tracking-tight drop-shadow-md mb-2"
                  >
                    Nexus
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ delay: 0.7 }}
                    className="text-[12px] uppercase tracking-widest font-medium text-slate-200 mb-8"
                  >
                    Suite Experta v3.0
                  </motion.p>

                  <form onSubmit={handleSubmit} className="w-full space-y-5">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      className="group"
                    >
                      <input
                        type="email"
                        placeholder="USUARIO"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-xl px-5 py-4 bg-[#0a0f1c]/50 border border-white/5 text-[13px] font-medium tracking-wide text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all duration-300 shadow-inner group-hover:bg-[#0a0f1c]/70"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                      className="group"
                    >
                      <input
                        type="password"
                        placeholder="CONTRASEÑA"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-xl px-5 py-4 bg-[#0a0f1c]/50 border border-white/5 text-[13px] font-medium tracking-wide text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all duration-300 shadow-inner group-hover:bg-[#0a0f1c]/70"
                      />
                    </motion.div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-red-200/90 text-xs bg-red-500/10 border border-red-500/10 rounded-lg p-3 text-center"
                      >
                        {error}
                      </motion.div>
                    )}

                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 }}
                      whileHover={{ scale: 1.015, filter: 'brightness(1.1)' }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="relative w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white font-bold text-sm tracking-wide shadow-[0_15px_40px_-10px_rgba(249,115,22,0.5)] border-t border-white/20 overflow-hidden disabled:opacity-50 disabled:grayscale transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]" />
                      {loading ? 'CARGANDO...' : (isLogin ? 'ACCEDER' : 'REGISTRARSE')}
                    </motion.button>
                  </form>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    onClick={() => setIsLogin(!isLogin)}
                    className="mt-8 text-[11px] text-slate-500 hover:text-orange-300 transition-colors tracking-widest uppercase font-semibold"
                  >
                    {isLogin ? 'Crear Cuenta' : 'Iniciar Sesión'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};