import { motion, useReducedMotion } from 'framer-motion';
import { loadingDurations, loadingEase, loadingStagger } from './motionTokens';

interface EqualizerLoaderProps {
  bars?: number;
  height?: number;
  barWidth?: number;
  className?: string;
  compact?: boolean;
}

export function EqualizerLoader({
  bars = 7,
  height = 38,
  barWidth = 5,
  className = '',
  compact = false,
}: EqualizerLoaderProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={`flex items-end justify-center gap-1.5 ${className}`} style={{ height }} aria-hidden="true">
      {Array.from({ length: bars }).map((_, index) => {
        const peak = 0.42 + ((index % 3) * 0.16);

        return (
          <motion.span
            key={`eq-${index}`}
            className="block rounded-full bg-theme-accent-secondary/75"
            style={{ width: barWidth, height }}
            animate={
              prefersReducedMotion
                ? { opacity: [0.45, 0.95, 0.45] }
                : { scaleY: [0.26, peak, 0.72, 0.34, 0.26], opacity: [0.5, 1, 0.7, 0.95, 0.5] }
            }
            transition={{
              duration: compact ? loadingDurations.loop * 0.66 : loadingDurations.loop,
              repeat: Infinity,
              ease: loadingEase.smooth,
              delay: index * loadingStagger.tight,
            }}
          />
        );
      })}
    </div>
  );
}
