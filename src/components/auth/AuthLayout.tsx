/**
 * AuthLayout: split-screen layout for Login/Register.
 * Left: branding, tagline, AnimatedBackground. Right: form content.
 * Responsive: stacks on mobile/tablet.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { BrandLogo } from '../BrandLogo';
import { AnimatedBackground } from './AnimatedBackground';
import { useTheme } from '../../hooks/useTheme';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Tighter header and panel padding so forms fit 1080p without scrolling */
  compact?: boolean;
}

export function AuthLayout({ children, title, subtitle, eyebrow, compact = false }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="h-screen min-h-0 flex flex-col lg:flex-row overflow-hidden bg-theme-background-primary">
      {/* Theme toggle - top right */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-theme-surface-base/85 backdrop-blur border border-theme-border-default text-theme-text-secondary hover:text-theme-text-primary transition-colors"
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Left: branding + visualization */}
      <motion.div
        className={`relative hidden lg:flex lg:w-1/2 h-full min-h-0 flex-col justify-between overflow-hidden ${
          compact ? 'p-6 xl:p-9' : 'p-8 xl:p-12'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatedBackground compact={compact} />
        <div className="relative z-10">
          <Link
            to="/"
            className={`inline-flex items-center text-theme-text-primary hover:opacity-90 transition-opacity ${compact ? 'gap-2.5' : 'gap-3'}`}
          >
            <BrandLogo size={compact ? 'md' : 'lg'} className="shadow-lg" />
            <span className={`font-bold ${compact ? 'text-xl' : 'text-2xl'}`}>MashHub</span>
          </Link>
        </div>
        <div className={`relative z-10 max-w-md ${compact ? 'space-y-4' : 'space-y-6'}`}>
          <h2 className={`font-bold text-theme-text-primary leading-tight ${compact ? 'text-2xl xl:text-3xl' : 'text-3xl xl:text-4xl'}`}>
            Music metadata, harmonic matching, DJ workflow.
          </h2>
          <p className={`text-theme-text-secondary ${compact ? 'text-base leading-snug' : 'text-lg'}`}>
            Search by BPM and key, match song sections, and build sets with confidence.
          </p>
        </div>
        <div className={`relative z-10 text-theme-text-muted ${compact ? 'text-xs' : 'text-sm'}`}>
          Professional music analysis and matching tool.
        </div>
      </motion.div>

      {/* Right: form */}
      <div
        className={`flex-1 min-h-0 flex items-center justify-center lg:border-l lg:border-theme-border-subtle bg-gradient-to-b from-theme-background-primary via-theme-background-primary to-theme-background-secondary/40 overflow-y-auto ${
          compact ? 'p-4 sm:p-4 lg:py-5 lg:px-7' : 'p-4 sm:p-5 lg:py-6 lg:px-8'
        }`}
      >
        <motion.div
          className={`w-full ${compact ? 'max-w-[24.5rem] py-0.5' : 'max-w-[26rem] py-1'}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Mobile logo */}
          <div className={`lg:hidden flex justify-center border-b border-theme-border-subtle ${compact ? 'mb-5 pb-4' : 'mb-10 pb-8'}`}>
            <Link
              to="/"
              className="inline-flex items-center gap-3 text-theme-text-primary transition-opacity hover:opacity-90"
            >
              <BrandLogo size="md" className="shadow-[var(--theme-shadow-card)]" />
              <span className="text-xl font-bold tracking-tight">MashHub</span>
            </Link>
          </div>
          <header className={compact ? 'mb-3' : 'mb-8'}>
            {eyebrow && (
              <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-accent-primary ${compact ? 'mb-1.5' : 'mb-3'}`}>
                {eyebrow}
              </p>
            )}
            <h1 className={`font-bold tracking-tight text-theme-text-primary leading-tight ${compact ? 'text-2xl' : 'text-3xl sm:text-[2rem]'}`}>
              {title}
            </h1>
            {subtitle && (
              <p className={`text-theme-text-secondary max-w-sm ${compact ? 'mt-1.5 text-sm leading-snug line-clamp-2' : 'mt-3 text-[15px] leading-relaxed'}`}>
                {subtitle}
              </p>
            )}
            <div
              className={`rounded-full bg-gradient-to-r from-theme-accent-primary via-theme-accent-secondary to-transparent opacity-90 ${compact ? 'mt-3 h-0.5 w-10' : 'mt-6 h-1 w-14'}`}
              aria-hidden
            />
          </header>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
