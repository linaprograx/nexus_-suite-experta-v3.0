import React from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { useNavigate } from 'react-router-dom';

interface InsightsProps {
    insights: any[];
}

export const IntelligenceWidget: React.FC<InsightsProps> = ({ insights }) => {
    const navigate = useNavigate();
    // Take specific insights or hardcode mock for better visuals if empty
    const displayInsights = (insights && insights.length > 0) ? insights.slice(0, 3) : [
        { title: 'Oportunidad de Coste', desc: 'El precio del limón ha subido un 15%. Revisa tus cócteles cítricos.', type: 'alert' },
        { title: 'Tendencia Detectada', desc: 'El interés en mocktails botánicos ha crecido un 30% esta semana.', type: 'trend' },
        { title: 'Recordatorio', desc: 'Actualiza el inventario de espirituosos antes del viernes.', type: 'check' }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[24px] p-6 border border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.25),_0_20px_40px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_0_25px_-5px_rgba(99,102,241,0.4),_0_20px_50px_-12px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.4),_0_25px_60px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.6),_0_25px_60px_-12px_rgba(0,0,0,0.7)] transition-all duration-500 relative overflow-hidden group">
                {/* Glass Highlight */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Icon svg={ICONS.star} className="w-3 h-3 text-indigo-500" /> Insights Rápidos
                </h3>
                <div className="space-y-3">
                    {displayInsights.map((insight, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs group cursor-pointer hover:bg-white/5 p-1 rounded transition-colors">
                            <div className="flex items-center gap-2 truncate">
                                <div className={`w-1.5 h-1.5 rounded-full ${insight.type === 'alert' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                                <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{insight.title}</span>
                            </div>
                            <Icon svg={ICONS.chevronRight} className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
                <button className="w-full mt-4 text-[10px] text-indigo-500 hover:text-indigo-400 font-bold uppercase tracking-widest text-center">
                    Ver Informe Completo
                </button>
            </div>

            {/* Micro Widget: Collegium */}
            <div
                onClick={() => navigate('/collegium')}
                className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>

                <h3 className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2">Collegium</h3>
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-lg font-serif mb-1">Reto Diario</p>
                        <p className="text-xs text-indigo-200 opacity-80">Gana +50XP hoy</p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <Icon svg={ICONS.play} className="w-4 h-4 text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
};
