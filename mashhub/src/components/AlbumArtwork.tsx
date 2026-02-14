import { useState } from 'react';
import { Music } from 'lucide-react';

interface AlbumArtworkProps {
  imageUrl?: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  lazy?: boolean;
}

const sizeClasses = {
  small: 'w-12 h-12',
  medium: 'w-24 h-24',
  large: 'w-64 h-64'
};

export function AlbumArtwork({ 
  imageUrl, 
  alt = 'Album artwork', 
  size = 'medium',
  className = '',
  lazy = true
}: AlbumArtworkProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center`}>
        <Music className="text-gray-400 dark:text-gray-500" size={size === 'small' ? 20 : size === 'medium' ? 32 : 64} />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative rounded overflow-hidden bg-gray-200 dark:bg-gray-700`}>
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Music className="text-gray-400 dark:text-gray-500 animate-pulse" size={size === 'small' ? 20 : size === 'medium' ? 32 : 64} />
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true);
          setImageLoaded(false);
        }}
      />
    </div>
  );
}
