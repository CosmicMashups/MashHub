/**
 * AuthCard: container for auth form with optional glow and motion.
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
        relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700
        bg-white/95 dark:bg-gray-800/95 backdrop-blur-md
        shadow-xl dark:shadow-2xl
        p-6 sm:p-8
        ${className}
      `}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.08), 0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      }}
    >
      {children}
    </motion.div>
  );
}
