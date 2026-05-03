/**
 * AuthLayout: split-screen layout for Login/Register.
 * Left: branding, tagline, AnimatedBackground. Right: form content.
 * Responsive: stacks on mobile/tablet.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music, Sun, Moon } from 'lucide-react';
import { AnimatedBackground } from './AnimatedBackground';
import { useTheme } from '../../hooks/useTheme';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  eyebrow?: string;
}

export function AuthLayout({ children, title, subtitle, eyebrow }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-theme-background-primary">
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
        className="relative hidden lg:flex lg:w-1/2 min-h-screen flex-col justify-between p-10 xl:p-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatedBackground />
        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-3 text-theme-text-primary hover:opacity-90 transition-opacity"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-theme-accent-primary to-theme-accent-hover flex items-center justify-center shadow-lg">
              <Music className="w-7 h-7 text-theme-text-inverse" />
            </div>
            <span className="text-2xl font-bold">MashHub</span>
          </Link>
        </div>
        <div className="relative z-10 space-y-6 max-w-md">
          <h2 className="text-3xl xl:text-4xl font-bold text-theme-text-primary leading-tight">
            Music metadata, harmonic matching, DJ workflow.
          </h2>
          <p className="text-lg text-theme-text-secondary">
            Search by BPM and key, match song sections, and build sets with confidence.
          </p>
        </div>
        <div className="relative z-10 text-sm text-theme-text-muted">
          Professional music analysis and matching tool.
        </div>
      </motion.div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 lg:border-l lg:border-theme-border-subtle bg-gradient-to-b from-theme-background-primary via-theme-background-primary to-theme-background-secondary/40">
        <motion.div
          className="w-full max-w-[26rem]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-10 pb-8 border-b border-theme-border-subtle">
            <Link
              to="/"
              className="inline-flex items-center gap-3 text-theme-text-primary transition-opacity hover:opacity-90"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-theme-accent-primary to-theme-accent-hover flex items-center justify-center shadow-[var(--theme-shadow-card)]">
                <Music className="w-5 h-5 text-theme-text-inverse" />
              </div>
              <span className="text-xl font-bold tracking-tight">MashHub</span>
            </Link>
          </div>
          <header className="mb-8">
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-accent-primary mb-3">
                {eyebrow}
              </p>
            )}
            <h1 className="text-3xl sm:text-[2rem] font-bold tracking-tight text-theme-text-primary leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-[15px] leading-relaxed text-theme-text-secondary max-w-sm">
                {subtitle}
              </p>
            )}
            <div
              className="mt-6 h-1 w-14 rounded-full bg-gradient-to-r from-theme-accent-primary via-theme-accent-secondary to-transparent opacity-90"
              aria-hidden
            />
          </header>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
