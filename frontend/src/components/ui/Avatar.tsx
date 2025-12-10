
import { useState, useMemo } from 'react';
import { API_BASE_URL } from '../../common/api';

type Props = {
    src: string | null | undefined;
    alt: string;
    className?: string;
    fallbackText?: string;
};

export default function Avatar({ src, alt, className = "", fallbackText = "U" }: Props) {
    const [error, setError] = useState(false);

    const imageUrl = useMemo(() => {
        if (!src) return null;
        return src.startsWith('http') ? src : `${API_BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
    }, [src]);

    if (!imageUrl || error) {
        return (
            <div
                className={`bg-gray-200 flex items-center justify-center text-gray-500 font-bold ${className}`}
                aria-label={alt}
            >
                <span className="text-xl uppercase select-none">
                    {fallbackText.charAt(0)}
                </span>
            </div>
        );
    }

    return (
        <img
            src={imageUrl}
            alt={alt}
            className={`object-cover ${className}`}
            onError={() => setError(true)}
        />
    );
}
