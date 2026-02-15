import { memo } from 'react';
import { 
  Youtube, 
  Twitter, 
  Music, 
  BookOpen, 
  ExternalLink,
  Github,
  FileText,
  Shield,
  Info,
  Video
} from 'lucide-react';

// Social media links
const SOCIAL_LINKS = [
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/c/CosmicMashups',
    icon: Youtube,
    ariaLabel: 'Visit CosmicMashups on YouTube (opens in new tab)'
  },
  {
    name: 'Twitter',
    url: 'https://twitter.com/CosmicMashups',
    icon: Twitter,
    ariaLabel: 'Visit CosmicMashups on Twitter (opens in new tab)'
  },
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@cosmic_mashups',
    icon: Video,
    ariaLabel: 'Visit cosmic_mashups on TikTok (opens in new tab)'
  },
  {
    name: 'MyAnimeList',
    url: 'https://myanimelist.net/profile/CosmicMashups',
    icon: BookOpen,
    ariaLabel: 'Visit CosmicMashups on MyAnimeList (opens in new tab)'
  },
  {
    name: 'Bandcamp',
    url: 'https://cosmicmashups.bandcamp.com/',
    icon: Music,
    ariaLabel: 'Visit CosmicMashups on Bandcamp (opens in new tab)'
  }
];

// Product links (placeholders for now)
const PRODUCT_LINKS = [
  { name: 'Features', href: '#features' },
  { name: 'Advanced Matching', href: '#matching' },
  { name: 'Projects', href: '#projects' },
  { name: 'Filtering', href: '#filtering' },
  { name: 'Documentation', href: '#docs' }
];

// Resources links
const RESOURCE_LINKS = [
  { name: 'GitHub', href: '#', icon: Github },
  { name: 'API Credits', href: '#api-credits', icon: Info },
  { name: 'Privacy Policy', href: '#privacy', icon: Shield },
  { name: 'Terms of Service', href: '#terms', icon: FileText }
];

export const Footer = memo(function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-16 border-t border-theme-border-default bg-theme-background-primary">
      {/* Subtle gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:via-blue-500/10 dark:to-purple-500/10 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-theme-text-primary mb-3">
              MashHub
            </h3>
            <p className="text-sm text-theme-text-secondary leading-relaxed">
              Intelligent music matching for DJs, producers, and mashup creators.
            </p>
          </div>

          {/* Product Section */}
          <div>
            <h4 className="text-sm font-semibold text-theme-text-primary mb-4 uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-theme-text-secondary hover:text-theme-accent-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent-primary focus:ring-offset-2 focus:ring-offset-theme-background-primary rounded"
                    aria-label={link.name}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h4 className="text-sm font-semibold text-theme-text-primary mb-4 uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-3">
              {RESOURCE_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="flex items-center gap-2 text-sm text-theme-text-secondary hover:text-theme-accent-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent-primary focus:ring-offset-2 focus:ring-offset-theme-background-primary rounded"
                      aria-label={link.name === 'API Credits' ? 'View API Credits - Spotify API and Jikan API' : link.name}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      <span>{link.name}</span>
                      {link.name === 'API Credits' && (
                        <span className="text-xs text-theme-text-muted ml-1">
                          (Spotify, Jikan)
                        </span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Creator Credits Section */}
          <div>
            <h4 className="text-sm font-semibold text-theme-text-primary mb-4 uppercase tracking-wider">
              Connect
            </h4>
            <ul className="space-y-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <li key={social.name}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-theme-text-secondary hover:text-theme-accent-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent-primary focus:ring-offset-2 focus:ring-offset-theme-background-primary rounded group"
                      aria-label={social.ariaLabel}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      <span>{social.name}</span>
                      <ExternalLink 
                        size={12} 
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                        aria-hidden="true"
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-theme-border-default pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-theme-text-muted">
              © {currentYear} MashHub. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-theme-text-muted">
              <span>Powered by</span>
              <a
                href="https://developer.spotify.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-theme-accent-primary transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent-primary focus:ring-offset-2 focus:ring-offset-theme-background-primary rounded"
                aria-label="Spotify API (opens in new tab)"
              >
                Spotify API
              </a>
              <span>and</span>
              <a
                href="https://jikan.moe/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-theme-accent-primary transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent-primary focus:ring-offset-2 focus:ring-offset-theme-background-primary rounded"
                aria-label="Jikan API (opens in new tab)"
              >
                Jikan API
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});
