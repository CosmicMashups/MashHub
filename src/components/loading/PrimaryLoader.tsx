import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { EqualizerLoader } from './EqualizerLoader';
import { VinylLoader } from './VinylLoader';
import { WaveformLoader } from './WaveformLoader';
import { loadingDurations, loadingEase } from './motionTokens';

interface PrimaryLoaderProps {
  label?: string;
  fullscreen?: boolean;
  compact?: boolean;
  overlay?: boolean;
}

export function PrimaryLoader({
  label,
  fullscreen = true,
  compact = false,
  overlay = false,
}: PrimaryLoaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  return (
    <motion.div
      className={`${fullscreen ? 'fixed inset-0 h-dvh w-screen' : 'h-full w-full'} ${overlay ? 'z-[var(--z-modal-overlay)] bg-black/45' : 'bg-theme-bg-primary'} flex items-center justify-center overflow-hidden`}
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: loadingDurations.medium, ease: loadingEase.smooth }}
      role="status"
      aria-live="polite"
      onMouseMove={(event) => {
        if (prefersReducedMotion) return;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const x = (event.clientX - centerX) / centerX;
        const y = (event.clientY - centerY) / centerY;
        setParallax({ x: x * 10, y: y * 8 });
      }}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={
          prefersReducedMotion
            ? { opacity: [0.22, 0.32, 0.22] }
            : { opacity: [0.2, 0.38, 0.2], scale: [1, 1.04, 1] }
        }
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-theme-accent-primary/15 blur-3xl" />
        <div className="absolute left-[44%] top-[56%] h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-theme-accent-secondary/15 blur-3xl" />
      </motion.div>

      <motion.div
        className="relative flex flex-col items-center gap-5 px-6 py-8"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                x: [parallax.x, parallax.x + 4, parallax.x - 4, parallax.x],
                y: [parallax.y, parallax.y - 3, parallax.y + 2, parallax.y],
              }
        }
        whileHover={{ scale: 1.015 }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <WaveformLoader width={compact ? 160 : 240} height={compact ? 28 : 40} compact={compact} />
        <div className="flex items-center gap-5">
          <EqualizerLoader bars={compact ? 5 : 7} compact={compact} />
          <VinylLoader size={compact ? 66 : 94} />
          <EqualizerLoader bars={compact ? 5 : 7} compact={compact} />
        </div>
        {label ? <p className="text-sm text-theme-text-secondary">{label}</p> : null}
      </motion.div>
    </motion.div>
  );
}
