import { useState, useEffect, useRef, type ReactNode, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Sun, Moon, Disc, Search, Plus, X, Music, CornerDownLeft } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useTheme, useDarkMode } from '../../hooks/useTheme';
import { UserMenu } from '../UserMenu';
import { search, ensureSearchInitialized } from '../../services/searchService';
import { getKeyChipStyle } from '../../utils/keyColors';
import type { Song } from '../../types';
import type { FuseResult } from 'fuse.js';

interface AppHeaderProps {
  onAddTrack?: () => void;
  mobileActions?: ReactNode;
  onSearchSubmit?: (query: string) => void;
  initialSearchQuery?: string;
}

export function AppHeader({
  onAddTrack,
  mobileActions,
  onSearchSubmit,
  initialSearchQuery = '',
}: AppHeaderProps) {
  const { user } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const isDark = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [quickResults, setQuickResults] = useState<FuseResult<Song>[]>([]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state if initialSearchQuery changes externally (e.g. from page search bar or URL)
  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  // Debounced live quick search autocomplete
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setQuickResults([]);
      setShowDropdown(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      await ensureSearchInitialized();
      if (!active) return;
      const results = search(trimmed, 5);
      setQuickResults(results);
      if (isFocused) {
        setShowDropdown(true);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, isFocused]);

  // Global hotkeys: '/' or 'Ctrl+K' / 'Cmd+K' to focus search input, 'Escape' to dismiss
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );

      if ((e.key === '/' && !isInput) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
        inputRef.current?.blur();
        setIsMobileSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dismiss dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeSearch = (queryToSearch: string) => {
    const trimmed = queryToSearch.trim();
    setShowDropdown(false);
    setIsMobileSearchOpen(false);
    inputRef.current?.blur();
    mobileInputRef.current?.blur();

    if (onSearchSubmit) {
      onSearchSubmit(trimmed);
    } else {
      // Navigates to database catalogue from any other page with the search query
      navigate(`/?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery('');
    setQuickResults([]);
    setShowDropdown(false);
    if (onSearchSubmit) {
      onSearchSubmit('');
    }
  };

  const handleResultClick = (song: Song) => {
    setSearchQuery(song.title);
    executeSearch(song.title);
  };

  const navLinks = [
    { to: '/', label: 'Database' },
    { to: '/projects', label: 'Projects' },
    { to: '/harmonic-wheel', label: 'Harmonic Wheel' },
    { to: '/lyrics', label: 'Lyrics' },
    { to: '/analysis', label: 'Analysis' },
    { to: '/about', label: 'About' },
  ];

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 w-full border-b border-theme-border-default bg-theme-surface-base/95 backdrop-blur-md text-theme-text-primary shadow-xs select-none transition-[background-color,border-color,box-shadow] duration-200"
    >
      {/* Top Soundstage Accent Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-sky-500 via-indigo-500 via-purple-500 to-amber-500" />
      {/* Primary Global Top Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-3 sm:gap-6">
          
          {/* Brand Identity / Vinyl Monogram */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group text-inherit no-underline">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/15 to-indigo-500/15 border border-sky-500/30 text-theme-accent-primary shadow-xs transition-transform group-hover:rotate-45 duration-300">
                <Disc size={18} className="stroke-[2.25]" />
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-black tracking-tight text-lg leading-none text-theme-text-primary">
                  MASH<span className="text-theme-accent-primary">HUB</span>
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-theme-text-muted leading-tight">
                  Audio Registry
                </span>
              </div>
            </Link>
          </div>

          {/* Functional Global Top Search Bar */}
          <div ref={searchContainerRef} className="flex-1 max-w-2xl relative hidden md:block">
            <form onSubmit={handleSubmit} className="relative w-full">
              <div
                className={`flex h-9 w-full items-center rounded-lg bg-theme-surface-elevated text-theme-text-primary px-3 border transition-all shadow-xs ${
                  isFocused
                    ? 'border-theme-border-focus ring-1 ring-theme-border-focus'
                    : 'border-theme-border-default hover:border-theme-border-focus'
                }`}
              >
                <Search
                  size={15}
                  className={`mr-2.5 shrink-0 transition-colors ${
                    isFocused ? 'text-theme-accent-primary' : 'text-theme-text-muted'
                  }`}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    setIsFocused(true);
                    if (searchQuery.trim().length >= 2) {
                      setShowDropdown(true);
                    }
                  }}
                  onBlur={() => {
                    // Small timeout so click inside dropdown registers before blur closes it
                    setTimeout(() => setIsFocused(false), 200);
                  }}
                  placeholder="Search catalogue by artist, track title, key or BPM..."
                  className="w-full bg-transparent text-xs text-theme-text-primary placeholder:text-theme-text-muted outline-none"
                  aria-label="Search catalogue"
                />

                {searchQuery ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 text-theme-text-muted hover:text-theme-text-primary transition-colors cursor-pointer rounded-md"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <div className="ml-auto hidden xl:flex items-center gap-1 select-none pointer-events-none">
                    <kbd className="rounded bg-theme-surface-base px-1.5 py-0.5 text-[10px] font-mono text-theme-text-muted border border-theme-border-subtle">
                      Ctrl
                    </kbd>
                    <kbd className="rounded bg-theme-surface-base px-1.5 py-0.5 text-[10px] font-mono text-theme-text-muted border border-theme-border-subtle">
                      K
                    </kbd>
                  </div>
                )}
              </div>
            </form>

            {/* Live Autocomplete / Quick Search Results Dropdown */}
            {showDropdown && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-theme-border-default bg-theme-surface-elevated/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl p-1.5 overflow-hidden animate-fade-in-up">
                <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-theme-text-muted">
                  <span>Matching tracks</span>
                  <span>{quickResults.length} found</span>
                </div>

                <div className="divide-y divide-theme-border-subtle">
                  {quickResults.length > 0 ? (
                    quickResults.map(({ item: song }) => {
                      const primaryKey = song.primaryKey || song.keys?.[0] || '—';
                      const primaryBpm = song.primaryBpm || song.bpms?.[0] || '—';
                      const chipStyle = getKeyChipStyle(primaryKey, isDark);

                      return (
                        <div
                          key={song.id}
                          onClick={() => handleResultClick(song)}
                          className="flex items-center justify-between gap-3 px-2.5 py-2 hover:bg-theme-surface-hover rounded-lg cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/20 text-theme-accent-primary group-hover:scale-105 transition-transform">
                              <Music size={13} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-theme-text-primary truncate group-hover:text-theme-accent-primary transition-colors">
                                {song.title}
                              </span>
                              <span className="text-[11px] text-theme-text-muted truncate">
                                {song.artist || 'Unknown Artist'}
                                {song.year ? ` • ${song.year}` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {primaryKey !== '—' && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                                style={chipStyle}
                              >
                                {primaryKey}
                              </span>
                            )}
                            {primaryBpm !== '—' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30">
                                {primaryBpm}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3 py-3 text-center text-xs text-theme-text-muted">
                      No tracks found matching "{searchQuery}". Press Enter to search full database.
                    </div>
                  )}
                </div>

                {/* View all full results action */}
                <button
                  type="button"
                  onClick={() => executeSearch(searchQuery)}
                  className="mt-1 flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-theme-accent-primary hover:bg-theme-accent-soft transition-colors cursor-pointer border-t border-theme-border-subtle"
                >
                  <span className="truncate">View all results for "{searchQuery}"</span>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-theme-text-muted">
                    <span>Press Enter</span>
                    <CornerDownLeft size={11} />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Right Header Area: Search Toggle, Add Track, Log In / UserMenu */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Mobile Search Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(!isMobileSearchOpen);
                if (!isMobileSearchOpen) {
                  setTimeout(() => mobileInputRef.current?.focus(), 100);
                }
              }}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-theme-border-default bg-theme-surface-elevated text-theme-text-secondary hover:text-theme-text-primary transition-colors shadow-xs"
              aria-label="Toggle search"
            >
              <Search size={15} />
            </button>

            {/* Add Track Button (Prominently placed beside Log In / UserMenu) */}
            {onAddTrack && (
              <button
                type="button"
                onClick={onAddTrack}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-theme-accent-primary px-3 text-xs font-semibold text-theme-accent-contrast hover:bg-theme-accent-hover shadow-xs active:scale-[0.98] transition-all"
                title="Add New Track"
              >
                <Plus size={14} className="stroke-[2.5]" />
                <span className="hidden sm:inline">Add Track</span>
              </button>
            )}

            {/* User Profile or Direct Sign In */}
            {user ? (
              <UserMenu />
            ) : (
              <Link
                to="/login"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-theme-border-default bg-theme-surface-elevated px-3 text-xs font-medium text-theme-text-primary hover:bg-theme-surface-hover hover:border-theme-border-strong transition-colors shadow-xs"
              >
                <LogIn size={13} />
                <span>Log In</span>
              </Link>
            )}

            {/* Mobile Drawer Trigger */}
            <div className="lg:hidden ml-1">{mobileActions}</div>
          </div>
        </div>
      </div>

      {/* Mobile Expandable Search Bar */}
      {isMobileSearchOpen && (
        <div className="md:hidden w-full border-t border-theme-border-subtle bg-theme-surface-elevated/95 px-4 py-2 backdrop-blur-md animate-slide-down">
          <form onSubmit={handleSubmit} className="relative w-full">
            <div className="flex h-9 w-full items-center rounded-lg bg-theme-surface-base text-theme-text-primary px-3 border border-theme-border-default focus-within:border-theme-border-focus focus-within:ring-1 focus-within:ring-theme-border-focus shadow-xs">
              <Search size={14} className="mr-2 text-theme-text-muted shrink-0" />
              <input
                ref={mobileInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artist, title, key, BPM..."
                className="w-full bg-transparent text-xs text-theme-text-primary placeholder:text-theme-text-muted outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-theme-text-muted hover:text-theme-text-primary"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Secondary Sub-Bar (Catalogue Section Tabs & Studio Switch) */}
      <nav
        aria-label="Catalogue Sub-navigation"
        className="w-full border-t border-theme-border-subtle bg-theme-surface-elevated/70 px-4 sm:px-6 lg:px-8 backdrop-blur-xs"
      >
        <div className="flex w-full items-center justify-between py-1 gap-4">
          {/* Section Navigation Tabs */}
          <ul className="flex items-center gap-1 sm:gap-1.5 text-xs font-medium tracking-normal overflow-x-auto scrollbar-hide py-0.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <li key={link.to} className="shrink-0">
                  <Link
                    to={link.to}
                    className={'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition-colors ' +
                      (isActive
                        ? 'bg-gradient-to-r from-sky-500/15 to-indigo-500/15 text-theme-accent-primary font-bold shadow-xs border border-sky-500/30'
                        : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-surface-hover')
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right Sub-Bar Area: Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-theme-border-default bg-theme-surface-base text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-surface-hover transition-colors shadow-xs"
              title={theme === 'dark' ? 'Switch to daylight studio' : 'Switch to obsidian'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
