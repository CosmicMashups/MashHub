import { motion } from 'framer-motion';
import { loadingDurations, loadingStagger } from './motionTokens';

interface SkeletonLoaderProps {
  rows?: number;
  className?: string;
  compact?: boolean;
}

export function SkeletonLoader({ rows = 8, className = '', compact = false }: SkeletonLoaderProps) {
  return (
    <div className={`rounded-lg border border-theme-border-default bg-theme-surface-base p-4 ${className}`}>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <motion.div
            key={`skeleton-row-${rowIndex}`}
            className="relative overflow-hidden rounded-xl border border-theme-border-subtle bg-theme-bg-secondary/80 p-3"
            initial={{ opacity: 0.65, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rowIndex * loadingStagger.tight, duration: loadingDurations.fast }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-end gap-1.5">
                {Array.from({ length: compact ? 5 : 7 }).map((_, barIndex) => (
                  <motion.span
                    key={`bar-${rowIndex}-${barIndex}`}
                    className="block w-1.5 rounded-full bg-theme-accent-primary/40"
                    style={{ height: `${16 + ((barIndex * 7 + rowIndex * 3) % 14)}px` }}
                    animate={{ opacity: [0.35, 0.85, 0.35] }}
                    transition={{ duration: loadingDurations.loop, repeat: Infinity, delay: barIndex * 0.08 + rowIndex * 0.03 }}
                  />
                ))}
              </div>
              <div className="h-3 w-2/5 rounded-full bg-theme-bg-tertiary/90" />
            </div>
            <motion.div
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-music-electric/20 to-transparent"
              animate={{ x: ['-120%', '120%'] }}
              transition={{ duration: loadingDurations.loop, repeat: Infinity, ease: 'easeInOut', delay: rowIndex * loadingStagger.tight }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
