import { motion, useReducedMotion } from 'framer-motion';
import { loadingDurations, loadingEase } from './motionTokens';

interface WaveformLoaderProps {
  bars?: number;
  width?: number;
  height?: number;
  className?: string;
  compact?: boolean;
}

export function WaveformLoader({
  bars = 20,
  width = 220,
  height = 42,
  className = '',
  compact = false,
}: WaveformLoaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const itemWidth = Math.max(2, width / bars - 2);

  return (
    <div
      className={`flex items-center justify-center gap-1 ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    >
      {Array.from({ length: bars }).map((_, idx) => {
        const phase = (idx / bars) * Math.PI * 2;
        const minScale = compact ? 0.32 : 0.24;
        const maxScale = compact ? 0.88 : 1;

        return (
          <motion.span
            key={`wave-${idx}`}
            className="block rounded-full bg-theme-accent-primary/70"
            style={{ width: itemWidth, height }}
            animate={
              prefersReducedMotion
                ? { opacity: [0.4, 0.8, 0.4] }
                : {
                    scaleY: [minScale, maxScale - Math.sin(phase) * 0.14, minScale],
                    opacity: [0.5, 0.95, 0.5],
                  }
            }
            transition={{
              duration: compact ? loadingDurations.loop * 0.72 : loadingDurations.loop,
              repeat: Infinity,
              ease: loadingEase.pulse,
              delay: idx * 0.03,
            }}
          />
        );
      })}
    </div>
  );
}
