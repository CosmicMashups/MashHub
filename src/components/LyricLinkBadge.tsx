import React from 'react';
import { Link2 } from 'lucide-react';
import type { ProjectLyricLink } from '../types/lyrics';

interface LyricLinkBadgeProps {
  links: ProjectLyricLink[];
  onHoverLink?: (linkId: string | null) => void;
  onClickLink?: (link: ProjectLyricLink) => void;
  compact?: boolean;
  className?: string;
}

export const LyricLinkBadge: React.FC<LyricLinkBadgeProps> = ({
  links,
  onHoverLink,
  onClickLink,
  compact = false,
  className = '',
}) => {
  if (!links || links.length === 0) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {links.map((link) => {
        const title = `Lyric link (${link.matchKind}): ${link.label}`;
        return (
          <button
            key={link.id}
            type="button"
            title={title}
            aria-label={title}
            onMouseEnter={() => onHoverLink?.(link.id)}
            onMouseLeave={() => onHoverLink?.(null)}
            onFocus={() => onHoverLink?.(link.id)}
            onBlur={() => onHoverLink?.(null)}
            onClick={(e) => {
              e.stopPropagation();
              onClickLink?.(link);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50 bg-slate-900/90 text-primary-300 border-primary-500/30 hover:border-primary-400 hover:bg-primary-500/10"
          >
            <Link2 className="w-3 h-3 text-primary-400 shrink-0" />
            {!compact && (
              <span className="truncate max-w-[100px]">{link.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
