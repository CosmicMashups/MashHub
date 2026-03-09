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
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100 dark:bg-gray-900">
      {/* Theme toggle - top right */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
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
            className="inline-flex items-center gap-3 text-gray-900 dark:text-white hover:opacity-90 transition-opacity"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-music-electric to-music-cosmic flex items-center justify-center shadow-lg">
              <Music className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold">MashHub</span>
          </Link>
        </div>
        <div className="relative z-10 space-y-6 max-w-md">
          <h2 className="text-3xl xl:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
            Music metadata, harmonic matching, DJ workflow.
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Search by BPM and key, match song sections, and build sets with confidence.
          </p>
        </div>
        <div className="relative z-10 text-sm text-gray-500 dark:text-gray-400">
          Professional music analysis and matching tool.
        </div>
      </motion.div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-900 dark:text-white"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-music-electric to-music-cosmic flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">MashHub</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{title}</h1>
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400 mb-6">{subtitle}</p>
          )}
          {children}
        </motion.div>
      </div>
    </div>
  );
}
