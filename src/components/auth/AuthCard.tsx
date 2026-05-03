/**
 * AuthCard: elevated form surface aligned with theme tokens and soft depth.
 */
import { motion } from 'framer-motion';

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <motion.div
      className={`
        relative w-full rounded-2xl sm:rounded-3xl
        border border-theme-border-default
        bg-theme-surface-elevated/95 backdrop-blur-md
        shadow-[var(--theme-shadow-modal)]
        p-6 sm:p-8 sm:pt-9
        ring-1 ring-theme-border-subtle/60
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
