/**
 * AnimatedBackground: music-inspired background for auth layout.
 * Waveform motif, subtle equalizer bars, gradient accents. No audio input.
 */
import { motion } from 'framer-motion';

const barHeights = [40, 65, 45, 80, 55, 70, 50, 60, 45, 75, 55, 65];

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl">
      <div
        className="absolute inset-0 opacity-90 dark:opacity-100"
        style={{
          background: 'linear-gradient(135deg, var(--theme-bg-primary) 0%, var(--theme-bg-secondary) 50%, var(--theme-surface-base) 100%)',
        }}
      />
      <div
        className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full opacity-20 dark:opacity-30"
        style={{
          background: 'radial-gradient(circle, rgb(139 92 246) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full opacity-15 dark:opacity-25"
        style={{
          background: 'radial-gradient(circle, rgb(6 182 212) 0%, transparent 60%)',
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 px-4 pb-8">
        {barHeights.map((h, i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-music-electric/60 to-music-wave/50 dark:from-music-electric/70 dark:to-music-wave/60"
            style={{ height: h }}
            animate={{
              height: [h, h * 0.6, h * 1.2, h],
            }}
            transition={{
              duration: 2 + i * 0.15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <svg
        className="absolute bottom-24 left-0 right-0 h-12 opacity-30 dark:opacity-40"
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,20 Q50,5 100,20 T200,20 T300,20 T400,20"
          fill="none"
          stroke="url(#authWaveGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.5 }}
          animate={{ pathLength: 1, opacity: 0.8 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        />
        <defs>
          <linearGradient id="authWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(139 92 246)" />
            <stop offset="100%" stopColor="rgb(6 182 212)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
