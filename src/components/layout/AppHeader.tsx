import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, Music } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { UserMenu } from '../UserMenu';

interface AppHeaderProps {
  actions?: ReactNode;
  mobileActions?: ReactNode;
}

export function AppHeader({ actions, mobileActions }: AppHeaderProps) {
  const { user } = useAuthContext();

  return (
    <header className="sticky top-0 z-40 border-b border-theme-border-default bg-theme-surface-base/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-theme-accent-primary to-theme-accent-hover">
              <Music className="h-6 w-6 text-theme-text-inverse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-theme-text-primary">MashHub</h1>
              <p className="text-sm text-theme-text-muted">Music Library & Database</p>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <div className="hidden items-center space-x-2 lg:flex">{actions}</div>
            <div className="lg:hidden">{mobileActions}</div>
            {user ? (
              <UserMenu />
            ) : (
              <Link
                to="/login"
                className="flex min-h-[44px] items-center gap-2 rounded-lg bg-theme-accent-primary px-4 py-2 text-sm font-medium text-theme-text-inverse transition-colors hover:bg-theme-accent-hover"
              >
                <LogIn size={16} />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
