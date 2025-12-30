import React from 'react';

interface MenuDesignRendererCoreProps {
    themeName: string;
    description: string;
    suggestedTypography?: string;
    htmlContent: string;
    scale?: number;
    className?: string;
    backgroundColor?: string;
}

export const MenuDesignRendererCore: React.FC<MenuDesignRendererCoreProps> = ({
    themeName,
    description,
    suggestedTypography,
    htmlContent,
    scale = 1,
    className = '',
    backgroundColor
}) => {
    return (
        <div
            className={`flex flex-col h-full overflow-hidden ${className}`}
            style={{
                backgroundColor: backgroundColor || '#ffffff',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: scale === 1 ? '100%' : `${100 / scale}%`,
                height: scale === 1 ? '100%' : `${100 / scale}%`
            }}
        >
            <div className="flex-1 overflow-y-auto custom-scrollbar h-full">
                {suggestedTypography && <style>{suggestedTypography}</style>}
                <div
                    className="prose dark:prose-invert max-w-none w-full min-h-full"
                    dangerouslySetInnerHTML={{ __html: htmlContent || `<div class="p-8 text-center text-rose-500 font-bold border-2 border-dashed border-rose-300 rounded-xl bg-vote-50"><p>⚠ No Content Received</p><p class="text-xs text-slate-500 mt-2">Check console for data flow.</p></div>` }}
                />
            </div>

            {/* Optional Footer/Metadata if needed, but HTML usually covers it */}
        </div>
    );
};
