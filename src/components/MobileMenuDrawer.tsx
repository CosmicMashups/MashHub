import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Folder, Plus, Filter, Settings, ClipboardList, CircleDot, FileText } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface MobileMenuDrawerProps {
  open: boolean;
  onClose: () => void;
  onProjectsClick: () => void;
  onAnalysisClick?: () => void;
  onAddSongClick: () => void;
  onUtilitiesClick: () => void;
  onFiltersClick: () => void;
}

/**
 * MobileMenuDrawer - Slide-in navigation drawer for mobile devices
 * Displays navigation links and action buttons in a touch-friendly format
 */
export function MobileMenuDrawer({
  open,
  onClose,
  onProjectsClick,
  onAnalysisClick,
  onAddSongClick,
  onUtilitiesClick,
  onFiltersClick,
}: MobileMenuDrawerProps) {
  const navigate = useNavigate();
  const handleNavClick = (callback: () => void) => {
    callback();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 lg:hidden overflow-y-auto"
          >
            <div className="p-6">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Logo */}
              <div className="flex items-center space-x-2 mb-8">
                <BrandLogo size="md" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">MashHub</span>
              </div>

              {/* Navigation */}
              <nav className="space-y-2 mb-8">
                <button
                  onClick={() => handleNavClick(onProjectsClick)}
                  className="w-full flex items-center px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Folder className="h-5 w-5 mr-3" />
                  Projects
                </button>
                {onAnalysisClick && (
                  <button
                    onClick={() => handleNavClick(onAnalysisClick)}
                    className="w-full flex items-center px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <ClipboardList className="h-5 w-5 mr-3" />
                    Analysis
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleNavClick(() => navigate('/harmonic-wheel'))}
                  className="w-full flex items-center px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <CircleDot className="h-5 w-5 mr-3" />
                  Harmonic Wheel
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick(() => navigate('/lyrics'))}
                  className="w-full flex items-center px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <FileText className="h-5 w-5 mr-3" />
                  Lyrics
                </button>
                <button
                  onClick={() => handleNavClick(onFiltersClick)}
                  className="w-full flex items-center px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Filter className="h-5 w-5 mr-3" />
                  Filters
                </button>
                <button
                  onClick={() => handleNavClick(onUtilitiesClick)}
                  className="w-full flex items-center px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Utilities
                </button>
              </nav>

              {/* Actions */}
              <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={() => handleNavClick(onAddSongClick)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-music-electric text-white rounded-lg hover:bg-music-electric/90 transition-colors font-medium"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Song
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

