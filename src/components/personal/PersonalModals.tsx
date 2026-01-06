import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input'; // Assuming these exist or standard inputs
import { Card } from '../ui/Card';

// --- CUSTOM TOAST ---
interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

export const CustomToast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColors = {
        success: 'bg-emerald-500/90 border-emerald-400',
        error: 'bg-rose-500/90 border-rose-400',
        info: 'bg-indigo-500/90 border-indigo-400'
    };

    return createPortal(
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl text-white backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.3)] border ${bgColors[type]} animate-in slide-in-from-right fade-in duration-300`}>
            <Icon svg={type === 'success' ? ICONS.check : type === 'error' ? ICONS.alert : ICONS.info} className="w-5 h-5" />
            <span className="font-medium tracking-wide text-sm">{message}</span>
            <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100">
                <Icon svg={ICONS.close} className="w-4 h-4" />
            </button>
        </div>,
        document.body
    );
};

// --- PASSWORD CHANGE MODAL ---
interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (current: string, newPass: string) => Promise<void>;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPass !== confirmPass) {
            setError("Las contraseñas nuevas no coinciden.");
            return;
        }
        if (newPass.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setLoading(true);
        try {
            await onSubmit(currentPass, newPass);
            onClose();
        } catch (err: any) {
            setError(err.message || "Error al cambiar la contraseña.");
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md bg-slate-900/90 border border-pink-500/50 shadow-[0_0_50px_rgba(236,72,153,0.3)] p-8 relative overflow-hidden ring-1 ring-pink-500/30">
                {/* Decorative Pink Glows */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-[50px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full blur-[40px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Icon svg={ICONS.lock} className="w-5 h-5 text-pink-500" />
                            Cambiar Contraseña
                        </h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <Icon svg={ICONS.close} className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contraseña Actual</label>
                            <input
                                type="password"
                                value={currentPass}
                                onChange={e => setCurrentPass(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nueva Contraseña</label>
                            <input
                                type="password"
                                value={newPass}
                                onChange={e => setNewPass(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirmar Nueva</label>
                            <input
                                type="password"
                                value={confirmPass}
                                onChange={e => setConfirmPass(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">
                                Cancelar
                            </Button>
                            <Button type="submit" variant="default" className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-900/20 border-0" disabled={loading}>
                                {loading ? 'Procesando...' : 'Actualizar'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>,
        document.body
    );
};
