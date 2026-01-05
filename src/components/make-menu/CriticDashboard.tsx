import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

export interface CriticResultType {
    puntosFuertes: string[];
    debilidades: string[];
    oportunidades: string[];
    feedback: string;
}

interface CriticDashboardProps {
    result: CriticResultType | null;
    loading: boolean;
    error: string | null;
}

const CriticDashboard: React.FC<CriticDashboardProps> = ({ result, loading, error }) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-pulse">
                <Spinner className="w-12 h-12 text-rose-500 mb-4" />
                <p className="text-slate-500 font-medium">Analizando menú...</p>
                <p className="text-xs text-slate-400">El Crítico está revisando cada detalle.</p>
            </div>
        );
    }

    if (error) {
        return <Alert variant="destructive" title="Error de Análisis" description={error} />;
    }

    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-full mb-4">
                    <Icon svg={ICONS.critic} className="w-12 h-12 text-rose-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">Esperando Material</h3>
                <p className="text-sm text-center max-w-xs mt-2">
                    Sube tu menú o escribe su contenido en el panel derecho para recibir un análisis profesional.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto custom-scrollbar p-1">
            <Card className="border-l-4 border-emerald-500 hover:shadow-lg transition-shadow bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-emerald-700 dark:text-emerald-400 text-lg flex items-center gap-2">
                        <Icon svg={ICONS.check} className="w-5 h-5" /> Puntos Fuertes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {result.puntosFuertes.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-red-500 hover:shadow-lg transition-shadow bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-red-700 dark:text-red-400 text-lg flex items-center gap-2">
                        <Icon svg={ICONS.warning} className="w-5 h-5" /> Debilidades
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {result.debilidades.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-amber-500 hover:shadow-lg transition-shadow bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-amber-700 dark:text-amber-400 text-lg flex items-center gap-2">
                        <Icon svg={ICONS.trendingUp} className="w-5 h-5" /> Oportunidades
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {result.oportunidades.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-blue-500 hover:shadow-lg transition-shadow bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm md:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-blue-700 dark:text-blue-400 text-lg flex items-center gap-2">
                        <Icon svg={ICONS.info} className="w-5 h-5" /> Feedback Estratégico
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {result.feedback}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default CriticDashboard;
