import { memo } from 'react';
import { motion } from 'framer-motion';
import { Youtube, ExternalLink } from 'lucide-react';
import type { Artist } from '../types/about';

interface ArtistCardProps {
  artist: Artist;
  index: number;
}

export const ArtistCard = memo(function ArtistCard({ artist, index }: ArtistCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={{ scale: 1.05 }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-xl border border-theme-border-default bg-theme-background-secondary p-6 shadow-md hover:shadow-xl transition-all">
        {/* Hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Profile Image */}
          <div className="relative mb-4">
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <img
                src={artist.image}
                alt={`${artist.name} profile picture`}
                loading="lazy"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-3 border-theme-accent-primary/50 group-hover:border-theme-accent-primary shadow-md"
              />
              {/* Glow border on hover */}
              <div className="absolute inset-0 rounded-full ring-4 ring-indigo-500/0 group-hover:ring-indigo-500/30 transition-all duration-300 blur-sm" />
            </motion.div>
          </div>

          {/* Artist Name */}
          <h4 className="text-lg font-bold text-theme-text-primary mb-3 group-hover:text-theme-accent-primary transition-colors">
            {artist.name}
          </h4>

          {/* YouTube Link */}
          <motion.a
            href={artist.youtube}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 hover:border-indigo-500/50 transition-all"
            aria-label={`Visit ${artist.name} on YouTube (opens in new tab)`}
          >
            <Youtube className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" aria-hidden="true" />
            <span className="text-sm font-medium text-theme-text-primary">Channel</span>
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              whileHover={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ExternalLink className="w-3.5 h-3.5 text-theme-text-secondary" aria-hidden="true" />
            </motion.div>
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
});
