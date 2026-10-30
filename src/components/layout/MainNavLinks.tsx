import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Folder, Info, ClipboardList, CircleDot, Sparkles } from 'lucide-react';

const linkClass =
  'flex min-h-[38px] items-center rounded-lg px-3 py-1.5 text-xs font-medium text-theme-text-secondary transition-all hover:bg-theme-surface-hover hover:text-theme-text-primary aria-[current=page]:bg-theme-surface-elevated aria-[current=page]:text-theme-accent-primary aria-[current=page]:font-semibold aria-[current=page]:shadow-xs';

export interface MainNavLinksProps {
  /** Shown first (e.g. App utilities control). */
  leadingSlot?: ReactNode;
  /** Extra links after the standard cluster (e.g. Add Song). */
  trailingSlot?: ReactNode;
  showProjects?: boolean;
  showAnalysis?: boolean;
  showHarmonicWheel?: boolean;
  showLyrics?: boolean;
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
  showLyrics = true,
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
      {showLyrics && (
        <Link to="/lyrics" className={linkClass} title="Match shared lyrics" aria-current={current('/lyrics')}>
          <Sparkles size={16} className="mr-1 inline shrink-0 text-primary-400" />
          Lyrics
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
