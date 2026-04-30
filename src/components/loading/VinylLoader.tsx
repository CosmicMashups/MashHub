import { motion } from 'framer-motion';

interface VinylLoaderProps {
  size?: number;
  compact?: boolean;
}

export function VinylLoader({ size = 80, compact = false }: VinylLoaderProps) {
  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="absolute inset-0 rounded-full border border-theme-border-strong bg-theme-surface-elevated"
        animate={{ rotate: 360 }}
        transition={{ duration: compact ? 1.6 : 2.2, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-[15%] rounded-full border border-theme-border-default bg-theme-bg-secondary" />
        <div className="absolute inset-[35%] rounded-full bg-theme-accent-primary/20 border border-theme-accent-primary/40" />
      </motion.div>
      <motion.div
        className="absolute left-1/2 top-1/2 w-2.5 h-2.5 rounded-full bg-theme-accent-primary -translate-x-1/2 -translate-y-1/2"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.div>
  );
}
