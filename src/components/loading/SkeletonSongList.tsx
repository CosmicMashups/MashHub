import { motion } from 'framer-motion';
import { loadingStagger } from './motionTokens';

interface SkeletonSongListProps {
  rows?: number;
}

export function SkeletonSongList({ rows = 8 }: SkeletonSongListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-theme-border-default bg-theme-surface-base">
      <div className="grid grid-cols-[64px_1.2fr_1.4fr_0.8fr_0.7fr_0.6fr] gap-3 border-b border-theme-border-subtle bg-theme-bg-secondary/70 px-4 py-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={`head-${idx}`} className="h-3 rounded-full bg-theme-bg-tertiary" />
        ))}
      </div>
      <div className="space-y-2 p-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <motion.div
            key={`row-${rowIndex}`}
            className="grid grid-cols-[64px_1.2fr_1.4fr_0.8fr_0.7fr_0.6fr] items-center gap-3 rounded-xl border border-theme-border-subtle bg-theme-bg-secondary/40 px-3 py-2.5"
            initial={{ opacity: 0.45, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rowIndex * loadingStagger.tight, duration: 0.22 }}
          >
            <div className="h-10 w-10 rounded-md bg-theme-bg-tertiary" />
            <div className="h-3.5 w-4/5 rounded-full bg-theme-bg-tertiary" />
            <div className="h-3.5 w-5/6 rounded-full bg-theme-bg-tertiary" />
            <div className="h-7 w-20 rounded-full bg-theme-bg-tertiary" />
            <div className="h-7 w-14 rounded-full bg-theme-bg-tertiary" />
            <div className="h-7 w-16 rounded-full bg-theme-bg-tertiary" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
