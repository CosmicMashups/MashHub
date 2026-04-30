/**
 * AuthButton: primary submit button with loading state and gradient hover.
 */
import { motion } from 'framer-motion';
import { ButtonLoader } from '../loading/ButtonLoader';

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
        w-full py-3 px-4 rounded-xl font-semibold text-theme-text-inverse
        bg-gradient-to-r from-theme-accent-primary to-theme-accent-hover
        hover:from-theme-accent-hover hover:to-theme-accent-primary
        focus:outline-none focus:ring-2 focus:ring-theme-accent-primary/50 focus:ring-offset-2 focus:ring-offset-theme-surface-base
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-300
        shadow-[var(--theme-shadow-card)] hover:shadow-[var(--theme-shadow-card),var(--theme-glow-accent)]
        inline-flex items-center justify-center gap-2
        ${className}
      `}
      whileHover={isDisabled ? undefined : { scale: 1.02 }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {loading ? (
        <ButtonLoader state="loading" label={loadingLabel} />
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
}
