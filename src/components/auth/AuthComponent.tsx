import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence, Easing } from 'framer-motion';

// NOTE: Using inline SVGs to avoid react-icons import errors

export const AuthComponent = () => {
  const { auth } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Ultra-Slow Atmospheric Background Animation (Maintained for internal loop)
  const backgroundVariants = {
    animate: {
      backgroundPosition: ['0% 0%', '100% 100%', '0% 100%', '100% 0%'],
      transition: {
        duration: 40,
        ease: "linear" as Easing,
        repeat: Infinity,
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    setError('');

    // Artificial delay for smooth exit animation feels
    const minTime = new Promise(resolve => setTimeout(resolve, 800));

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setSuccess(true);
      await minTime;
    } catch (err: any) {
      let msg = err.message;
      if (msg.includes('invalid-credential')) msg = "Credenciales incorrectas. Verifica tu email y contraseña.";
      if (msg.includes('invalid-email')) msg = "El formato del email no es válido.";
      if (msg.includes('user-not-found')) msg = "No existe cuenta con este usuario.";
      if (msg.includes('wrong-password')) msg = "Contraseña incorrecta.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    // PASO 5: Profundidad Final (Fondo base oscuro y profundo)
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-[#020617] text-slate-200 font-sans selection:bg-orange-500/30">
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] to-[#0f172a] z-0 pointer-events-none" />

      {/* PASO 1: Contenedor de Escena (Luz) - Z:1 */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">

        {/* PASO 2: Luz Principal (Frio -> Calido) */}
        {/* Frio Izquierda */}
        <div
          className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] rounded-full opacity-30 blur-[150px]"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)', mixBlendMode: 'screen' }}
        />
        {/* Calido Derecha */}
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] rounded-full opacity-25 blur-[150px]"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)', mixBlendMode: 'screen' }}
        />

        {/* PASO 3: Bloom Ambiental (Centro) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-[0.15] blur-[180px]"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)' }}
        />

        {/* PASO 4: Halo Inferior del Card (Energia) */}
        <div
          className="absolute top-[65%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-40 blur-[100px]"
          style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.6) 0%, transparent 70%)', mixBlendMode: 'screen' }}
        />
      </div>

      {/* Grain Overlay */}
      <div className="absolute inset-0 z-[2] bg-white/[0.02] mix-blend-overlay pointer-events-none" />

      <AnimatePresence>
        {!success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15, filter: 'blur(12px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(16px)', transition: { duration: 0.5 } }}
            transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
            // PASO 6: Orden de Capas - Card Z:10
            className="w-full max-w-[420px] mx-4 relative z-10"
          >
            {/* Card Light Rim & Glass */}
            <div className="relative rounded-[32px] p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent shadow-[0_40px_120px_rgba(0,0,0,0.5)]">

              <div className="relative rounded-[31px] bg-white/[0.06] backdrop-blur-[24px] border border-white/[0.05] overflow-hidden">

                {/* Top Shine */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />

                {/* Inner Warm Glow (Bottom) */}
                <div className="absolute inset-x-0 bottom-0 h-[100px] bg-gradient-to-t from-orange-500/5 to-transparent opacity-60 pointer-events-none" />

                <div className="relative z-20 p-10 flex flex-col items-center">

                  {/* Branding */}
                  <div className="mb-10 text-center flex flex-col items-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.8 }}
                      className="relative mb-5"
                    >
                      <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full" />
                      <svg className="w-11 h-11 text-orange-500 relative z-10 drop-shadow-[0_0_20px_rgba(249,115,22,0.3)]" viewBox="0 0 24 24" fill="currentColor">
                        <defs>
                          <linearGradient id="nexusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#fbbf24" />
                          </linearGradient>
                        </defs>
                        <path fill="url(#nexusGradient)" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </motion.div>

                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2 drop-shadow-md">Nexus</h1>
                    <p className="text-slate-300/80 text-[13px] font-medium tracking-wide">
                      Your operational brain for cocktails.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="w-full space-y-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-300/90 tracking-widest ml-1 uppercase">Email</label>
                      <div className="relative group/input">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading}
                          className="w-full bg-[#0a0f1e]/60 border border-white/10 rounded-xl px-4 py-3.5 text-slate-100 text-sm placeholder-slate-500/60
                                                   focus:outline-none focus:ring-1 focus:ring-orange-400/40 focus:border-orange-400/50 
                                                   shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-300 disabled:opacity-50"
                          placeholder="executive@hotel.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-300/90 tracking-widest ml-1 uppercase">Contraseña</label>
                      <div className="relative group/input">
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                          className="w-full bg-[#0a0f1e]/60 border border-white/10 rounded-xl px-4 py-3.5 text-slate-100 text-sm placeholder-slate-500/60
                                                   focus:outline-none focus:ring-1 focus:ring-orange-400/40 focus:border-orange-400/50 
                                                   shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-300 disabled:opacity-50"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 text-red-200/90 text-[13px] bg-red-500/10 p-3 rounded-lg border border-red-500/10"
                      >
                        <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium">{error}</span>
                      </motion.div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                      type="submit"
                      className="relative w-full rounded-2xl font-semibold text-white text-[15px] tracking-wide py-4 mt-4
                                           bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500
                                           shadow-[0_20px_40px_-12px_rgba(249,115,22,0.5)]
                                           hover:shadow-[0_25px_60px_-12px_rgba(249,115,22,0.6)]
                                           border-t border-white/20
                                           disabled:opacity-70 disabled:filter-none transition-all duration-300"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {loading ? (
                          <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <>
                            {isLogin ? 'Acceder' : 'Registrarse'}
                            <svg className="w-4 h-4 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </>
                        )}
                      </span>
                    </motion.button>
                  </form>

                  <div className="mt-8 text-center">
                    <button
                      onClick={() => { setIsLogin(!isLogin); setError(''); }}
                      className="text-[13px] text-slate-400/80 hover:text-orange-300 transition-colors duration-200 font-medium hover:underline hover:underline-offset-4 decoration-orange-500/30"
                    >
                      {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Accede"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
