import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Folder, Info, ClipboardList, CircleDot } from 'lucide-react';

const linkClass =
  'flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm text-theme-text-secondary transition-colors hover:bg-theme-state-hover hover:text-theme-text-primary';

export interface MainNavLinksProps {
  /** Shown first (e.g. App utilities control). */
  leadingSlot?: ReactNode;
  /** Extra links after the standard cluster (e.g. Add Song). */
  trailingSlot?: ReactNode;
  showProjects?: boolean;
  showAnalysis?: boolean;
  showHarmonicWheel?: boolean;
  showAbout?: boolean;
  /** Library / home link (label varies by page). */
  showLibrary?: boolean;
  libraryTo?: string;
  libraryLabel?: string;
}

export function MainNavLinks({
  leadingSlot,
  trailingSlot,
  showProjects = true,
  showAnalysis = true,
  showHarmonicWheel = true,
  showAbout = true,
  showLibrary = false,
  libraryTo = '/',
  libraryLabel = 'Library',
}: MainNavLinksProps) {
  const { pathname } = useLocation();

  const current = (path: string) => (pathname === path ? 'page' : undefined);

  return (
    <>
      {leadingSlot}
      {showLibrary && (
        <Link
          to={libraryTo}
          className={linkClass}
          aria-current={pathname === libraryTo ? 'page' : undefined}
        >
          {libraryLabel}
        </Link>
      )}
      {showProjects && (
        <Link to="/projects" className={linkClass} title="Manage Projects" aria-current={current('/projects')}>
          <Folder size={16} className="mr-1 inline shrink-0" />
          Projects
        </Link>
      )}
      {showAnalysis && (
        <Link to="/analysis" className={linkClass} title="Analysis submissions" aria-current={current('/analysis')}>
          <ClipboardList size={16} className="mr-1 inline shrink-0" />
          Analysis
        </Link>
      )}
      {showHarmonicWheel && (
        <Link
          to="/harmonic-wheel"
          className={linkClass}
          title="Interactive harmonic wheel"
          aria-current={current('/harmonic-wheel')}
        >
          <CircleDot size={16} className="mr-1 inline shrink-0" />
          Harmonic Wheel
        </Link>
      )}
      {showAbout && (
        <Link to="/about" className={linkClass} title="About MashHub" aria-current={current('/about')}>
          <Info size={16} className="mr-1 inline shrink-0" />
          About
        </Link>
      )}
      {trailingSlot}
    </>
  );
}
