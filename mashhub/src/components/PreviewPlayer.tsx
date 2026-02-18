import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, ExternalLink } from 'lucide-react';

interface PreviewPlayerProps {
  previewUrl?: string;
  spotifyUrl?: string;
  trackName?: string;
  className?: string;
}

export function PreviewPlayer({ 
  previewUrl, 
  spotifyUrl, 
  className = ''
}: PreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('Error playing preview:', error);
        setIsPlaying(false);
      });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  if (!previewUrl && !spotifyUrl) {
    return (
      <div className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        Preview not available
      </div>
    );
  }

  if (!previewUrl && spotifyUrl) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-500 dark:text-gray-400">Preview not available</span>
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Open in Spotify
          <ExternalLink size={14} />
        </a>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <audio ref={audioRef} src={previewUrl} />
      
      <button
        onClick={togglePlay}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <div className="flex-1 flex items-center gap-2">
        <Volume2 size={16} className="text-gray-500 dark:text-gray-400" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400 w-8">
          {Math.round(volume * 100)}%
        </span>
      </div>

      {spotifyUrl && (
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          title="Open full track in Spotify"
        >
          <ExternalLink size={14} />
        </a>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400">
        <span className="text-[10px]">Powered by Spotify</span>
      </div>
    </div>
  );
}
