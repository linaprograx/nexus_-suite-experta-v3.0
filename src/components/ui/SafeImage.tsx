import React, { useState, useEffect } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackIcon?: string;
    fallbackText?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
    src,
    alt,
    className,
    fallbackIcon = "image_not_supported",
    fallbackText = "Imagen no disponible",
    ...props
}) => {
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

    // Reset status when src changes
    useEffect(() => {
        setStatus(src ? 'loading' : 'error');
    }, [src]);

    return (
        <div className={`relative overflow-hidden ${className} ${status === 'loading' ? 'animate-pulse bg-neutral-800' : ''}`}>

            {/* The Image */}
            {src && status !== 'error' && (
                <img
                    src={src}
                    alt={alt}
                    className={`transition-opacity duration-500 w-full h-full object-cover ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setStatus('loaded')}
                    onError={() => setStatus('error')}
                    {...props}
                />
            )}

            {/* Error / Placeholder State */}
            {status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 p-6 text-center z-10 border border-neutral-800">
                    <span className="material-symbols-outlined text-4xl text-red-500 mb-2">{fallbackIcon}</span>
                    <p className="text-xs font-bold text-white uppercase tracking-widest">{fallbackText}</p>
                </div>
            )}
        </div>
    );
};
