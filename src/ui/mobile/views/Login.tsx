import React from 'react';
import { UserProfile } from '../types';

interface LoginProps {
    onUnlock: () => void;
    user: UserProfile;
}

const Login: React.FC<LoginProps> = ({ onUnlock }) => {
    return (
        <div className="flex-1 bg-transparent relative overflow-hidden flex flex-col items-center justify-center px-6">

            {/* Central Neumorphic Card */}
            <div className="w-full max-w-[340px] neu-flat rounded-[3rem] p-10 relative overflow-hidden flex flex-col items-center animate-[fadeIn_0.7s_ease-out]">

                {/* Logo Container */}
                <div className="w-24 h-24 rounded-full neu-pressed flex items-center justify-center mb-8 shrink-0">
                    <div className="w-16 h-16 rounded-full neu-btn flex items-center justify-center text-[#6D28D9]">
                        <span className="material-symbols-outlined text-4xl">grid_view</span>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-black text-neu-main mb-2 tracking-tight">Nexus</h1>
                <p className="text-[10px] font-black text-neu-sec uppercase tracking-[0.3em] mb-12">Suite Experta</p>

                {/* Inputs */}
                <div className="w-full space-y-6 mb-10">
                    <div className="neu-pressed rounded-2xl p-1">
                        <input
                            type="text"
                            placeholder="USUARIO"
                            className="w-full bg-transparent text-center py-4 text-[10px] font-black text-neu-main placeholder:text-neu-sec uppercase tracking-widest outline-none"
                        />
                    </div>
                    <div className="neu-pressed rounded-2xl p-1">
                        <input
                            type="password"
                            placeholder="CONTRASEÑA"
                            className="w-full bg-transparent text-center py-4 text-[10px] font-black text-neu-main placeholder:text-neu-sec uppercase tracking-widest outline-none"
                        />
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={onUnlock}
                    className="w-full neu-btn text-[#6D28D9] py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all mb-8"
                >
                    Acceder
                </button>

                <button className="text-[9px] font-bold text-neu-sec uppercase tracking-widest hover:text-neu-main transition-colors">
                    Crear Cuenta
                </button>
            </div>

            <p className="absolute bottom-12 text-[8px] font-black text-neu-sec uppercase tracking-[0.4em] opacity-40">Protección de Identidad Biometrica v4.2</p>
        </div>
    );
};

export default Login;
