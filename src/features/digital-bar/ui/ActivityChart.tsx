import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ActivityChartProps {
    data: any[];
    dataKey: string;
    color?: string;
    height?: number;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data, dataKey, color = "#06b6d4", height = 200 }) => {
    if (!data || data.length === 0) {
        return <div style={{ height }} className="flex items-center justify-center text-slate-400 text-xs">Sin datos disponibles</div>;
    }

    return (
        <div style={{ width: '100%', height, minHeight: height }}>
            <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.2)" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={[0, 'auto']} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: color, fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#gradient-${dataKey})`}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
