import { memo } from 'react';
import { motion } from 'framer-motion';
import { Tv, Globe, Radio, type LucideIcon } from 'lucide-react';
import { ArtistCard } from './ArtistCard';
import type { Artist } from '../types/about';

interface ArtistSectionProps {
  category: 'Anime' | 'Western' | 'K-Pop';
  artists: Artist[];
}

// Map categories to icons
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Anime': Tv,
  'Western': Globe,
  'K-Pop': Radio
};

// Map categories to colors
const CATEGORY_COLORS: Record<string, string> = {
  'Anime': 'text-pink-500 dark:text-pink-400',
  'Western': 'text-blue-500 dark:text-blue-400',
  'K-Pop': 'text-purple-500 dark:text-purple-400'
};

export const ArtistSection = memo(function ArtistSection({ category, artists }: ArtistSectionProps) {
  const Icon = CATEGORY_ICONS[category];
  const iconColor = CATEGORY_COLORS[category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      {/* Category Header with Icon */}
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          animate={category === 'Western' ? { rotate: 360 } : category === 'K-Pop' ? { scale: [1, 1.1, 1] } : {}}
          transition={
            category === 'Western' 
              ? { duration: 30, repeat: Infinity, ease: 'linear' }
              : category === 'K-Pop'
              ? { duration: 2, repeat: Infinity, repeatDelay: 2 }
              : {}
          }
        >
          <Icon className={`w-6 h-6 ${iconColor}`} aria-hidden="true" />
        </motion.div>
        <h3 className="text-2xl font-bold text-theme-text-primary">
          {category} Mashups
        </h3>
      </div>

      {/* Artist Grid - Responsive: 1 col mobile, 2 col tablet, 3-4 col desktop */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {artists.map((artist, index) => (
          <ArtistCard key={artist.name} artist={artist} index={index} />
        ))}
      </motion.div>
    </motion.div>
  );
});
