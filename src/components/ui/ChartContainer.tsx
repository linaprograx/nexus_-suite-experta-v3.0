import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps {
    children: React.ReactNode;
    className?: string;
    height?: number | string;
    minHeight?: number | string;
}

/**
 * A wrapper for Recharts ResponsiveContainer to ensure it always has a valid parent height.
 * Prevents "width/height" warnings in console.
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
    children,
    className = "",
    height = "240px",
    minHeight = "240px"
}) => {
    return (
        <div
            className={`w-full min-h-[240px] h-[240px] flex items-center justify-center relative ${className}`}
            style={{ height, minHeight }}
        >
            <div className="absolute inset-0 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    {children}
                </ResponsiveContainer>
            </div>
        </div>
    );
};
