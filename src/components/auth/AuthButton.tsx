/**
 * AuthButton: primary submit button with loading state and gradient hover.
 */
import { motion } from 'framer-motion';

interface AuthButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function AuthButton({
  children,
  type = 'submit',
  disabled = false,
  loading = false,
  loadingLabel = 'Signing in...',
  className = '',
  icon,
}: AuthButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      className={`
        w-full py-3 px-4 rounded-xl font-semibold text-white
        bg-gradient-to-r from-music-electric to-music-cosmic
        hover:from-music-electric/90 hover:to-music-cosmic/90
        focus:outline-none focus:ring-2 focus:ring-music-electric/50 focus:ring-offset-2 dark:focus:ring-offset-gray-800
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        shadow-lg hover:shadow-xl
        inline-flex items-center justify-center gap-2
        ${className}
      `}
      whileHover={isDisabled ? undefined : { scale: 1.02 }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <motion.span
            className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
          {loadingLabel}
        </span>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
}
