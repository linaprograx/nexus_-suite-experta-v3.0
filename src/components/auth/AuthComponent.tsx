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

  // Parallax
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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
    // Artificially wait for animation smooth out
    await new Promise(r => setTimeout(r, 600));

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
            initial={{ opacity: 0, scale: 0.94, y: 30, filter: 'blur(20px)' }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              filter: 'blur(0px)',
              x: mousePos.x * 6,
              rotateX: -mousePos.y * 1,
              rotateY: mousePos.x * 1
            }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(40px)', transition: { duration: 0.6 } }}
            transition={{
              duration: 1.2,
              ease: [0.16, 1, 0.3, 1],
              x: { type: "spring", stiffness: 20, damping: 20 },
              rotateX: { type: "spring", stiffness: 20, damping: 20 },
              rotateY: { type: "spring", stiffness: 20, damping: 20 }
            }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative z-10 w-full max-w-[380px] px-6" // Slightly narrower/taller feel
          >
            {/* === REAL GLASS STACK (High Transparency) === */}

            {/* Layer A: Wrapper Gradient Rim */}
            <div className="relative rounded-[32px] p-[1px] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Background Rim Gradient */}
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/10 via-white/5 to-transparent opacity-50" />

              {/* REFERENCE IMAGE 2: Sharp Vertical Edge Highlight (Right Side) */}
              <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-orange-300/60 to-transparent" />
              <div className="absolute top-0 right-[1px] bottom-0 w-[1px] bg-gradient-to-b from-transparent via-orange-200/30 to-transparent blur-[1px]" />

              {/* Layer B: Glass Body */}
              <div className="relative rounded-[31px] bg-[#03050a]/30 backdrop-blur-[24px] overflow-hidden border border-white/5">

                {/* Layer C: Refraction/Reflection */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

                {/* Layer D: Diagonal Specular Streak */}
                <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent rotate-45 pointer-events-none blur-xl" />

                {/* Layer E: Chromatic Edge */}
                <div className="absolute inset-x-0 top-0 h-px bg-blue-400/20 mix-blend-screen" />
                <div className="absolute inset-x-0 bottom-0 h-px bg-red-400/20 mix-blend-screen" />

                {/* === CONTENT === */}
                <div className="relative pt-12 pb-10 px-8 flex flex-col items-center z-20">

                  {/* ICON: Living Energy Sphere */}
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ delay: 0.5, duration: 1.0, type: "spring" }}
                    className="relative mb-10 group"
                  >
                    {/* Outer Glow */}
                    <div className="absolute inset-0 rounded-full blur-[30px] bg-orange-500/20 group-hover:bg-orange-500/40 transition-colors duration-1000" />

                    <div className="w-20 h-20 rounded-full relative z-10 overflow-hidden shadow-[inset_0_-8px_16px_rgba(0,0,0,0.6),inset_0_4px_12px_rgba(255,255,255,0.4)]">
                      {/* Conic Gradient Core (Multi-color) */}
                      <div className="absolute inset-[-50%] w-[200%] h-[200%] animate-[spin_20s_linear_infinite]"
                        style={{ background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #f97316, #fbbf24, #3b82f6)' }} />
                      {/* Surface Gloss */}
                      <div className="absolute top-3 left-4 w-6 h-3 bg-white/50 blur-[4px] rounded-full -rotate-45" />
                      <div className="absolute inset-0 backdrop-blur-[2px]" />
                    </div>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-2xl font-semibold text-white tracking-wide mb-1"
                  >
                    Nexus
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ delay: 0.7 }}
                    className="text-[10px] uppercase tracking-[0.25em] font-medium text-slate-300 mb-10"
                  >
                    Suite Experta
                  </motion.p>

                  <form onSubmit={handleSubmit} className="w-full space-y-5">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="group"
                    >
                      <input
                        type="email"
                        placeholder="USUARIO"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-xl px-5 py-4 bg-[#0a0f1c]/40 border border-white/5 text-[12px] font-medium tracking-wide text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all duration-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)] group-hover:bg-[#0a0f1c]/60"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="group"
                    >
                      <input
                        type="password"
                        placeholder="CONTRASEÑA"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-xl px-5 py-4 bg-[#0a0f1c]/40 border border-white/5 text-[12px] font-medium tracking-wide text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all duration-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)] group-hover:bg-[#0a0f1c]/60"
                      />
                    </motion.div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-red-200/90 text-[11px] bg-red-500/5 border border-red-500/10 rounded-lg p-3 text-center"
                      >
                        {error}
                      </motion.div>
                    )}

                    {/* DARK BACKLIT GLASS BUTTON */}
                    <motion.button
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.0 }}
                      whileHover={{ scale: 1.02, filter: 'brightness(1.2)' }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={loading}
                      className="relative w-full py-4 mt-4 rounded-xl font-bold text-[12px] tracking-widest text-slate-100 uppercase transition-all duration-300 overflow-hidden group bg-gradient-to-b from-white/10 to-transparent border border-white/5 shadow-[0_0_20px_-5px_rgba(249,115,22,0.15)] hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.3)] hover:border-orange-500/20"
                    >
                      {/* REFERENCE IMAGE 1: Top Beam Highlight (Intense Center) */}
                      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-orange-300 to-transparent opacity-70" />
                      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 shadow-[0_0_10px_1px_rgba(255,255,255,0.4)]" />
                      <div className="absolute top-0 left-1/3 right-1/3 h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent blur-[2px] opacity-80" />

                      {/* Inner Glow */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {loading ? 'CARGANDO...' : (isLogin ? 'ACCEDER' : 'REGISTRARSE')}
                    </motion.button>
                  </form>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    onClick={() => setIsLogin(!isLogin)}
                    className="mt-8 text-[10px] text-slate-500 hover:text-white transition-colors tracking-widest uppercase font-medium"
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