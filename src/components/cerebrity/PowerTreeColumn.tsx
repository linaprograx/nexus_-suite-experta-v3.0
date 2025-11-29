import React from 'react';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

type Power = {
  name: string;
  description: string;
  locked: boolean;
  size: 'small square' | 'medium square' | 'horizontal' | 'vertical' | 'large square';
  color: 'purple' | 'cyan' | 'green' | 'orange' | 'gray';
  icon: string;
};

type PowerTreeColumnProps = {
  mode: 'cerebrity' | 'lab';
  powers: Power[];
  onClickPower: (powerName: string) => void;
};

const cardStyles = {
  size: {
    'small square': 'col-span-1 row-span-1',
    'medium square': 'col-span-1 row-span-1 aspect-square',
    'horizontal': 'col-span-2 row-span-1',
    'vertical': 'col-span-1 row-span-2',
    'large square': 'col-span-2 row-span-2',
  },
  color: {
    cerebrity: {
      purple: 'bg-violet-100/80 border-violet-200/90',
      cyan: 'bg-cyan-100/80 border-cyan-200/90',
      green: 'bg-emerald-100/80 border-emerald-200/90',
      orange: 'bg-orange-100/80 border-orange-200/90',
      gray: 'bg-slate-200/80 border-slate-300/90',
    },
    lab: {
      purple: 'bg-violet-100/70 border-violet-200/80',
      cyan: 'bg-cyan-100/70 border-cyan-200/80',
      green: 'bg-emerald-100/70 border-emerald-200/80',
      orange: 'bg-orange-100/70 border-orange-200/80',
      gray: 'bg-slate-200/70 border-slate-300/80',
    }
  }
};

const cardDarkStyles: { [key: string]: string } = {
  'Intensidad Creativa': 'dark:bg-[#3C2C52]',
  'Coherencia Técnica': 'dark:bg-[#23444B]',
  'Optimización del Garnish': 'dark:bg-[#1F3C26]',
  'Mejora de Storytelling': 'dark:bg-[#3B3050]',
  'Creative Booster Avanzado': 'dark:bg-[#4A2C2C]',
  'Analizador de Storytelling': 'dark:bg-[#23444B]', // Re-using cyan tone for consistency
  'Identificador de Rarezas': 'dark:bg-[#4B3924]',
  'Harmony Optimizer': 'dark:bg-[#1F3C26]', // Re-using green tone for consistency
};

const PowerTreeColumn: React.FC<PowerTreeColumnProps> = ({ mode, powers, onClickPower }) => {
  return (
    <div className="h-full w-full p-4 overflow-y-auto">
      <div className="grid grid-cols-2 grid-flow-row-dense gap-4">
        {powers.map((power) => (
          <div
            key={power.name}
            className={`
              ${cardStyles.size[power.size]}
              ${cardStyles.color[mode][power.color]}
              ${cardDarkStyles[power.name] || 'dark:bg-white/5'}
              dark:border-white/10
              rounded-2xl p-4 flex flex-col justify-between
              border backdrop-blur-md dark:backdrop-blur-xl shadow-soft
              transition-all duration-300
              ${power.locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:scale-[1.02]'}
            `}
            onClick={() => !power.locked && onClickPower(power.name)}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-sm leading-tight text-slate-800 dark:text-white" style={{ fontSize: '85%', lineHeight: '1.4' }}>
                {power.name}
              </h3>
              <Icon svg={ICONS[power.icon as keyof typeof ICONS]} className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <p className="text-xs text-slate-500 mt-2 dark:text-slate-300" style={{ fontSize: '85%', lineHeight: '1.4' }}>
              {power.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PowerTreeColumn;
