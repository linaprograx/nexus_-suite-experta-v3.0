import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { ImpactBadge } from './ImpactBadge';
import { NextBestActionData } from '../nextBestActionService';

interface HybridNBACardProps {
  data: NextBestActionData;
  isLoading: boolean;
  onRefresh: () => void;
}

export const HybridNBACard: React.FC<HybridNBACardProps> = ({ data, isLoading, onRefresh }) => {
  if (!data?.action) return null;

  const { action = "Revisa tus tareas", reason = "", impact = "medium", time = 10 } = data || {};

  return (
    <Card className="backdrop-blur-md bg-white/40 dark:bg-slate-900/20 ring-1 ring-white/30 dark:ring-slate-800/40 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:shadow-slate-900/60">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Icon svg={ICONS.sparkles} className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </span>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Análisis estratégico + acción inmediata
              </h3>
              <ImpactBadge impact={impact} />
            </div>

            <div>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                {isLoading ? 'Analizando tu contexto creativo...' : action}
              </p>
              {!isLoading && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {reason} • <span className="text-blue-600 dark:text-blue-400 font-medium">{time} min</span>
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          >
            <Icon svg={ICONS.refresh} className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
