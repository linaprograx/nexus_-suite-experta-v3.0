import React from 'react';

type Power = {
  name: string;
  description: string;
  locked: boolean;
  size: 'square_sm' | 'square_md' | 'rect_vertical' | 'rect_horizontal' | 'square_lg';
};

type PowerTreeColumnProps = {
  mode: 'cerebrity' | 'lab';
  powers: Power[];
  onClickPower: (powerName: string) => void;
};

const cardSizes = {
  square_sm: 'w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32',
  square_md: 'w-32 h-32 md:w-36 md:h-36 lg:w-40 lg:h-40',
  rect_vertical: 'w-28 h-48 md:w-32 md:h-56 lg:w-36 lg:h-64',
  rect_horizontal: 'w-48 h-24 md:w-56 md:h-28 lg:w-64 lg:h-32',
  square_lg: 'w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56',
};

const modeStyles = {
  cerebrity: {
    background: 'bg-gradient-to-b from-[#EDE3FF] to-[#F7F2FF]',
    card: 'bg-white/50 border-[#B388FF]/30 text-[#4C2889]',
    cardHover: 'hover:bg-white/80 hover:border-[#B388FF]/80',
    locked: 'bg-gray-200/30 border-gray-300/30 text-gray-400',
  },
  lab: {
    background: 'bg-gradient-to-b from-[#D9FAF3] to-[#E6FFFB]',
    card: 'bg-white/50 border-[#8AE6DA]/30 text-[#005A4D]',
    cardHover: 'hover:bg-white/80 hover:border-[#8AE6DA]/80',
    locked: 'bg-gray-200/30 border-gray-300/30 text-gray-400',
  },
};

const PowerTreeColumn: React.FC<PowerTreeColumnProps> = ({ mode, powers, onClickPower }) => {
  const styles = modeStyles[mode];

  return (
    <div className={`h-full w-full p-4 overflow-y-auto ${styles.background}`}>
      <div className="grid grid-cols-2 gap-4 auto-rows-min">
        {powers.map((power) => (
          <div
            key={power.name}
            className={`
              rounded-2xl p-3 flex items-center justify-center text-center
              backdrop-blur-md border shadow-soft transition-all duration-300
              ${cardSizes[power.size]}
              ${power.locked 
                ? `${styles.locked} cursor-not-allowed` 
                : `${styles.card} ${styles.cardHover} cursor-pointer`
              }
            `}
            onClick={() => !power.locked && onClickPower(power.name)}
            style={{
              boxShadow: '0 4px 14px rgba(0,0,0,0.07)',
            }}
          >
            <p className="font-medium text-sm md:text-base leading-tight">{power.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PowerTreeColumn;
