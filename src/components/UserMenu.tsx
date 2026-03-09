/**
 * UserMenu: avatar + username in header with dropdown for Account Settings and Logout.
 * Renders only when user is authenticated (e.g. inside protected routes).
 */
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useBackendContext } from '../contexts/BackendContext';

function getDisplayName(user: { user_metadata?: { username?: string }; email?: string | null }): string {
  const u = user?.user_metadata?.username;
  if (u && String(u).trim()) return String(u).trim();
  if (user?.email) return user.email;
  return 'User';
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/[\s@.]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return displayName.slice(0, 2).toUpperCase() || 'U';
}

export function UserMenu() {
  const { user, signOut } = useAuthContext();
  const { isLocal } = useBackendContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLocal || !user) return null;

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 min-h-[44px] text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-music-electric to-music-cosmic flex items-center justify-center text-white text-sm font-medium overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <span className="hidden sm:block text-sm font-medium truncate max-w-[120px]">{displayName}</span>
        <ChevronDown size={16} className={`flex-shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-48 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50"
          role="menu"
        >
          <Link
            to="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            role="menuitem"
          >
            <Settings size={16} className="text-gray-500" />
            Account Settings
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            role="menuitem"
          >
            <LogOut size={16} className="text-gray-500" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
