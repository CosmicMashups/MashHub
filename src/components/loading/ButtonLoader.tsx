import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { EqualizerLoader } from './EqualizerLoader';

type ButtonLoaderState = 'idle' | 'loading' | 'success';

interface ButtonLoaderProps {
  state: ButtonLoaderState;
  label?: string;
  className?: string;
}

export function ButtonLoader({ state, label, className = '' }: ButtonLoaderProps) {
  return (
    <span className={`inline-flex items-center justify-center gap-2 ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        {state === 'loading' ? (
          <motion.span
            key="loading"
            className="inline-flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
          >
            <motion.span
              className="absolute h-6 w-6 rounded-full border border-white/35"
              animate={{ scale: [0.78, 1.2, 0.78], opacity: [0.65, 0.2, 0.65] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <EqualizerLoader bars={4} height={14} barWidth={2} compact className="relative" />
            {label ? <span>{label}</span> : null}
          </motion.span>
        ) : state === 'success' ? (
          <motion.span
            key="success"
            className="inline-flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
          >
            <motion.span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/25"
              animate={{ boxShadow: ['0 0 0 0 rgba(255,255,255,0.2)', '0 0 0 8px rgba(255,255,255,0)'] }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <Check size={12} />
            </motion.span>
            {label ? <span>{label}</span> : null}
          </motion.span>
        ) : (
          <motion.span key="idle" initial={{ opacity: 0.95 }} animate={{ opacity: 1 }}>
            {label ?? ''}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
