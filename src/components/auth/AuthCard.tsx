/**
 * AuthCard: elevated form surface aligned with theme tokens and soft depth.
 */
import { motion } from 'framer-motion';

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function AuthCard({ children, className = '', compact = false }: AuthCardProps) {
  return (
    <motion.div
      className={`
        relative w-full rounded-2xl sm:rounded-3xl
        border border-theme-border-default
        bg-theme-surface-elevated/95 backdrop-blur-md
        shadow-[var(--theme-shadow-modal)]
        ring-1 ring-theme-border-subtle/60
        ${compact ? 'p-3.5 sm:p-4' : 'p-6 sm:p-8 sm:pt-9'}
        ${className}
      `}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
