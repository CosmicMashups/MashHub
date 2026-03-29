import { memo } from 'react';
import { motion } from 'framer-motion';
import { Youtube, ExternalLink, Sparkles, User, Code, Zap, Heart } from 'lucide-react';
import type { Developer } from '../types/about';

interface DeveloperCardProps {
  developer: Developer;
}

export const DeveloperCard = memo(function DeveloperCard({ developer }: DeveloperCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative"
    >
      {/* Section Header with Sparkles Icon */}
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Sparkles className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-theme-text-primary">Featured Creator</h2>
      </div>

      {/* Developer Card */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl border border-theme-border-default bg-theme-background-secondary p-8 shadow-lg hover:shadow-xl transition-shadow"
      >
        {/* Gradient overlay background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Profile Image */}
          <div className="relative flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <img
                src={developer.image}
                alt={`${developer.name} profile picture`}
                loading="lazy"
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-theme-accent-primary shadow-lg"
              />
              {/* Decorative glow on hover */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 blur-xl opacity-0 hover:opacity-100 transition-opacity duration-300 -z-10" />
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1 text-center md:text-left">
            {/* Name with User Icon */}
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <User className="w-5 h-5 text-theme-text-secondary" aria-hidden="true" />
              <h3 className="text-3xl font-bold text-theme-text-primary">{developer.name}</h3>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-3 justify-center md:justify-start mb-4 flex-wrap">
              <motion.div
                whileHover={{ y: -2 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30"
              >
                <Code className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Developer</span>
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30"
              >
                <Zap className="w-4 h-4 text-purple-500" aria-hidden="true" />
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Creator</span>
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 dark:bg-red-500/20 border border-red-500/30"
              >
                <Heart className="w-4 h-4 text-red-500" aria-hidden="true" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">Community</span>
              </motion.div>
            </div>

            {/* Description */}
            <p className="text-base text-theme-text-secondary leading-relaxed mb-6">
              {developer.description}
            </p>

            {/* YouTube CTA */}
            <motion.a
              href={developer.youtube}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-md hover:shadow-lg transition-all group"
              aria-label={`Visit ${developer.name} on YouTube (opens in new tab)`}
            >
              <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
              <span>Visit Channel</span>
              <ExternalLink 
                className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" 
                aria-hidden="true" 
              />
            </motion.a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});
