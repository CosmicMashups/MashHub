import type { ReactNode } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * ResponsiveContainer - Provides consistent responsive padding and max-width
 * - Mobile (xs-sm): px-4 (16px)
 * - Tablet (md): px-6 (24px)
 * - Desktop (lg+): px-8 (32px)
 * - Max width: 1280px (max-w-7xl)
 */
export function ResponsiveContainer({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl ${className}`}>
      {children}
    </div>
  );
}
