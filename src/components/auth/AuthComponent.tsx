import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthBackground } from './AuthBackground';
import { OAuthButtons } from './OAuthButtons';
import { handleOAuthRedirectResult } from '../../config/oauth';
import { NexusOrb } from '../ui/NexusOrb';

export const AuthComponent = () => {
  const { auth } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  // Handle OAuth redirect result (for mobile flow)
  useEffect(() => {
    const handleRedirect = async () => {
      if (!auth) return;
      try {
        const result = await handleOAuthRedirectResult(auth);
        if (result) {
          console.log('OAuth redirect successful:', result.user.email);
          setSuccess(true);
        }
      } catch (error: any) {
        console.error('OAuth redirect error:', error);
        setError(error.message || 'Error al procesar inicio de sesión');
      }
    };
    handleRedirect();
  }, [auth]);

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
    // 100dvh, not 100vh: iOS Safari's vh includes the collapsible toolbars, so 100vh is
    // taller than what you can actually see and the card gets cut off.
    // Vertical scroll is allowed (only the decorative overflow is clipped, on X) because
    // the card is taller than a short phone screen. The child centres with `m-auto`
    // rather than `items-center`, which would make the overflowing top unreachable.
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto flex bg-[#010205] text-slate-200 perspective-[1200px]">

      {/* 0. WEBGL BACKGROUND (Z-0) */}
      <AuthBackground />

      {/* 1. CARD CONTAINER (Z-10) */}
      <AnimatePresence>
        {!success && (
          /* Tampoco aquí hay `filter`, y este importaba más todavía: es el
             ANCESTRO de la tarjeta de cristal. Un filtro en un ancestro cambia
             de dónde muestrea un `backdrop-filter`, y al terminar la animación
             se quedaba un `blur(0px)` permanente encima. Además, desenfocar una
             tarjeta a pantalla completa en cada carga es caro en un móvil.
             Opacidad, escala y desplazamiento van por compositor y dan la misma
             entrada. */
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              x: mousePos.x * 6,
              rotateX: -mousePos.y * 1,
              rotateY: mousePos.x * 1
            }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.6 } }}
            transition={{
              duration: 1.2,
              ease: [0.16, 1, 0.3, 1],
              x: { type: "spring", stiffness: 20, damping: 20 },
              rotateX: { type: "spring", stiffness: 20, damping: 20 },
              rotateY: { type: "spring", stiffness: 20, damping: 20 }
            }}
            style={{ transformStyle: 'preserve-3d' }}
            // m-auto (not the parent's items-center) so a card taller than the viewport
            // stays fully reachable by scrolling instead of having its top clipped.
            className="relative z-10 m-auto w-full max-w-[290px] sm:max-w-[380px] px-4 sm:px-6 py-6"
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

                {/* Layer E: Refined top edge highlight (single, warm) */}
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                {/* === CONTENT === */}
                <div className="relative pt-6 pb-5 px-4 sm:pt-12 sm:pb-10 sm:px-8 flex flex-col items-center z-20">

                  {/* ICON: Living Energy Sphere */}
                  {/* Sin `filter` en la animación.
                      Framer deja `filter: blur(0px)` puesto al terminar, y
                      `blur(0px)` sigue siendo un filtro: dentro de esta tarjeta
                      —que es `backdrop-blur-[24px]`— WebKit pinta ese elemento
                      como un rectángulo, para siempre. Escala y opacidad dan la
                      misma entrada y van por compositor. */}
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1.0, type: "spring" }}
                    className="relative mb-5 sm:mb-10 group"
                  >
                    <NexusOrb size={typeof window !== 'undefined' && window.innerWidth < 640 ? 52 : 72} prioritaria />
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-2xl sm:text-3xl font-light text-white tracking-[0.08em] mb-1 sm:mb-2"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    Nexus
                  </motion.h1>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-center gap-2.5 mb-5 sm:mb-9"
                  >
                    <span className="w-5 h-px bg-gradient-to-r from-transparent to-orange-400/50" />
                    <span className="text-[9px] uppercase tracking-[0.3em] font-medium text-slate-400">Suite Experta</span>
                    <span className="w-5 h-px bg-gradient-to-l from-transparent to-orange-400/50" />
                  </motion.div>

                  {/* OAuth Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 }}
                    className="w-full mb-2"
                  >
                    <OAuthButtons
                      onSuccess={() => setSuccess(true)}
                      onError={(err) => setError(err)}
                    />
                  </motion.div>

                  <form onSubmit={handleSubmit} className="w-full space-y-3 sm:space-y-5">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="group relative"
                    >
                      {/* Mail icon */}
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-400/80 transition-colors pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" />
                      </svg>
                      <input
                        type="email"
                        placeholder="USUARIO"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        autoComplete="email"
                        className="w-full rounded-xl pl-11 pr-5 py-3 sm:py-4 bg-[#0a0f1c]/40 border border-white/5 text-[12px] font-medium tracking-wide text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all duration-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)] group-hover:bg-[#0a0f1c]/60"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="group relative"
                    >
                      {/* Lock icon */}
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-400/80 transition-colors pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="CONTRASEÑA"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        autoComplete="current-password"
                        className="w-full rounded-xl pl-11 pr-12 py-3 sm:py-4 bg-[#0a0f1c]/40 border border-white/5 text-[12px] font-medium tracking-wide text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all duration-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)] group-hover:bg-[#0a0f1c]/60"
                      />
                      {/* Show/hide toggle */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-orange-400/80 transition-colors"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                      </button>
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
                      className="relative w-full py-3 sm:py-4 mt-3 sm:mt-4 rounded-xl font-bold text-[12px] tracking-widest text-slate-100 uppercase transition-all duration-300 overflow-hidden group bg-gradient-to-b from-white/10 to-transparent border border-white/5 shadow-[0_0_20px_-5px_rgba(249,115,22,0.15)] hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.3)] hover:border-orange-500/20"
                    >
                      {/* Single refined top beam (warm, centered) */}
                      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent opacity-80 shadow-[0_0_12px_1px_rgba(249,115,22,0.4)]" />

                      {/* Inner Glow on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          CARGANDO
                        </span>
                      ) : (isLogin ? 'ACCEDER' : 'REGISTRARSE')}
                    </motion.button>
                  </form>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    className="mt-7 sm:mt-9 mb-1 px-3 py-1.5 rounded-full bg-black/25 backdrop-blur-sm text-[10px] text-slate-300 transition-colors tracking-widest uppercase font-medium group/toggle"
                  >
                    {isLogin ? '¿Sin cuenta? ' : '¿Ya tienes cuenta? '}
                    <span className="text-orange-300 group-hover/toggle:text-orange-200 transition-colors">
                      {isLogin ? 'Crear Cuenta' : 'Iniciar Sesión'}
                    </span>
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