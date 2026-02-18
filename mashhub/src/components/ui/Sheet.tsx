import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  side?: 'bottom' | 'right' | 'left' | 'top';
  className?: string;
}

interface SheetContentProps {
  children: ReactNode;
  className?: string;
  side?: 'bottom' | 'right' | 'left' | 'top';
  showDragHandle?: boolean;
}

interface SheetHeaderProps {
  children: ReactNode;
  className?: string;
}

interface SheetFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * Sheet component for mobile bottom sheets and side drawers
 * Uses framer-motion for smooth animations
 */
export function Sheet({ open, onOpenChange, children }: SheetProps) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle ESC key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Sheet Content */}
          {children}
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * SheetContent - The main content area of the sheet
 */
export function SheetContent({
  children,
  className = '',
  side = 'bottom',
  showDragHandle = true,
}: SheetContentProps) {
  const getSideClasses = () => {
    switch (side) {
      case 'bottom':
        return 'bottom-0 left-0 right-0 rounded-t-2xl';
      case 'right':
        return 'right-0 top-0 bottom-0 w-full max-w-md rounded-l-2xl';
      case 'left':
        return 'left-0 top-0 bottom-0 w-full max-w-md rounded-r-2xl';
      case 'top':
        return 'top-0 left-0 right-0 rounded-b-2xl';
      default:
        return 'bottom-0 left-0 right-0 rounded-t-2xl';
    }
  };

  const getInitialAnimation = () => {
    switch (side) {
      case 'bottom':
        return { y: '100%' };
      case 'right':
        return { x: '100%' };
      case 'left':
        return { x: '-100%' };
      case 'top':
        return { y: '-100%' };
      default:
        return { y: '100%' };
    }
  };

  return (
    <motion.div
      initial={getInitialAnimation()}
      animate={{ x: 0, y: 0 }}
      exit={getInitialAnimation()}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`fixed z-50 bg-white dark:bg-gray-900 shadow-2xl ${getSideClasses()} ${className}`}
    >
      {/* Drag Handle */}
      {showDragHandle && side === 'bottom' && (
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
      )}

      {children}
    </motion.div>
  );
}

/**
 * SheetHeader - Header section of the sheet
 */
export function SheetHeader({ children, className = '' }: SheetHeaderProps) {
  return (
    <div className={`px-4 pb-3 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
}

/**
 * SheetFooter - Footer section of the sheet (sticky on mobile)
 */
export function SheetFooter({ children, className = '' }: SheetFooterProps) {
  return (
    <div className={`border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * SheetTitle - Title component for sheet header
 */
export function SheetTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-lg font-semibold ${className}`}>
      {children}
    </h2>
  );
}

/**
 * SheetClose - Close button for sheet
 */
export function SheetClose({ onClose, className = '' }: { onClose: () => void; className?: string }) {
  return (
    <button
      onClick={onClose}
      className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors ${className}`}
      aria-label="Close"
    >
      <X className="h-5 w-5" />
    </button>
  );
}
