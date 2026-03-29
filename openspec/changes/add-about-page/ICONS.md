# Icon Usage Guide - About Page

This document provides a comprehensive reference for all icons used in the About page.

## Icon Inventory

### Primary Navigation
| Icon | Component | Purpose | Size | Animation |
|------|-----------|---------|------|-----------|
| `Info` | Footer Link | About page navigation | 16px | None |

### Page Structure Icons

#### Main Header
| Icon | Location | Purpose | Size | Animation |
|------|----------|---------|------|-----------|
| `Music` | Page Title | Main branding/theme indicator | 32px | Pulse on load |
| `Sparkles` | Page Subtitle | Decorative accent | 24px | Shimmer |

#### Developer Section
| Icon | Location | Purpose | Size | Animation |
|------|----------|---------|------|-----------|
| `Sparkles` | Section Header | Featured creator emphasis | 24px | Rotate on hover |
| `User` | Name Badge | Profile indicator | 20px | None |
| `Code` | Badge | Developer/creator indicator | 18px | Bounce on hover |
| `Youtube` | Call-to-Action | External YouTube link | 20px | Scale on hover |
| `ExternalLink` | YouTube Button | New tab indicator | 16px | Slide-right on hover |
| `Heart` | Optional Decoration | Community love | 18px | Pulse continuously |
| `Zap` | Optional Badge | Energy/creativity | 18px | Flash on hover |

#### Artist Categories
| Icon | Category | Purpose | Size | Animation |
|------|----------|---------|------|-----------|
| `Tv` | Anime | Television/anime content | 24px | None |
| `Globe` | Western | Global/international reach | 24px | Rotate slowly |
| `Radio` | K-Pop | Music broadcast theme | 24px | Pulse subtly |
| `Award` | Section Header | Recognition/credits | 24px | Shimmer |

#### Artist Cards
| Icon | Location | Purpose | Size | Animation |
|------|----------|---------|------|-----------|
| `Youtube` | Card Link | YouTube channel link | 18px | Scale on hover |
| `ExternalLink` | Card Overlay | New tab indicator | 16px | Fade in on hover |
| `Play` | Hover State | Video playback suggestion | 20px | Scale on hover |
| `ArrowRight` | Optional CTA | Action direction | 16px | Slide-right |

### Decorative & Atmospheric Icons

#### Section Dividers
| Icon | Location | Purpose | Size | Animation |
|------|----------|---------|------|-----------|
| `Waves` | Between Sections | Audio waveform visual | 48px | Subtle wave motion |
| `Music2` | Divider Accent | Music theme reinforcement | 24px | None |
| `Disc3` | Divider Decoration | Vinyl record theme | 32px | Slow rotate |

#### Floating Elements
| Icon | Location | Purpose | Size | Animation |
|------|----------|---------|------|-----------|
| `Headphones` | Background Float | Music listening theme | 64px | Parallax scroll |
| `Mic2` | Background Float | Recording/creation theme | 48px | Parallax scroll |
| `Star` | Background Accent | Excellence/featured | 32px | Twinkle |
| `Disc3` | Background Accent | Vinyl/music media | 40px | Slow rotate |
| `Music` | Background Pattern | Musical notes | 24px | Float up |

#### Interactive States
| Icon | Trigger | Purpose | Size | Animation |
|------|---------|---------|------|-----------|
| `Heart` | Like/Favorite | Show appreciation | 20px | Pulse + fill |
| `Share` | Share Action | Social sharing (future) | 18px | Bounce |

## Icon Color Scheme

### Light Mode
```css
/* Primary Interactive */
.icon-primary { color: #6366f1; } /* Indigo-500 */

/* Secondary/Decorative */
.icon-secondary { color: #64748b; } /* Slate-500 */

/* Muted Background */
.icon-muted { color: #cbd5e1; opacity: 0.3; } /* Slate-300 */

/* Accent (Special) */
.icon-accent { color: #8b5cf6; } /* Purple-500 */
```

### Dark Mode
```css
/* Primary Interactive */
.icon-primary { color: #818cf8; } /* Indigo-400 */

/* Secondary/Decorative */
.icon-secondary { color: #94a3b8; } /* Slate-400 */

/* Muted Background */
.icon-muted { color: #475569; opacity: 0.3; } /* Slate-600 */

/* Accent (Special) */
.icon-accent { color: #a78bfa; } /* Purple-400 */
```

## Animation Specifications

### Pulse Animation
```typescript
// For hearts, favorites, emphasis
<motion.div
  animate={{
    scale: [1, 1.2, 1],
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    repeatType: "reverse"
  }}
>
  <Heart className="text-red-500" />
</motion.div>
```

### Rotate Animation
```typescript
// For stars, sparkles, decorative elements
<motion.div
  animate={{
    rotate: 360,
  }}
  transition={{
    duration: 20,
    repeat: Infinity,
    ease: "linear"
  }}
>
  <Star className="text-yellow-500" />
</motion.div>
```

### Bounce Animation
```typescript
// For music notes, playful elements
<motion.div
  animate={{
    y: [0, -10, 0],
  }}
  transition={{
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut"
  }}
>
  <Music2 className="text-purple-500" />
</motion.div>
```

### Hover Scale
```typescript
// For interactive cards and buttons
<motion.div
  whileHover={{
    scale: 1.1,
    rotate: 5
  }}
  transition={{
    duration: 0.2
  }}
>
  <ExternalLink />
</motion.div>
```

### Parallax Scroll
```typescript
// For background floating icons
const { scrollY } = useScroll();
const y = useTransform(scrollY, [0, 1000], [0, -200]);

<motion.div style={{ y }}>
  <Headphones className="opacity-20" />
</motion.div>
```

## Accessibility Notes

1. **Decorative Icons**: Use `aria-hidden="true"` for purely decorative icons
2. **Interactive Icons**: Ensure proper labels
   ```tsx
   <button aria-label="Visit YouTube channel">
     <Youtube />
   </button>
   ```
3. **Icon + Text**: When combining, icon is decorative
   ```tsx
   <a href="..." aria-label="Anime Mashups section">
     <Tv aria-hidden="true" />
     <span>Anime</span>
   </a>
   ```

## Performance Considerations

1. **Bundle Size**: Lucide React uses tree-shaking, only imports used icons
2. **Animation Performance**: All animations use GPU-accelerated properties (transform, opacity)
3. **Reduced Motion**: Respect `prefers-reduced-motion` media query
   ```tsx
   const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   const animationDuration = prefersReducedMotion ? 0 : 0.3;
   ```

## Implementation Example

```tsx
import { 
  Music, 
  Sparkles, 
  User, 
  Youtube, 
  ExternalLink,
  Tv,
  Globe,
  Radio,
  Heart,
  Waves,
  Headphones,
  Star
} from 'lucide-react';
import { motion } from 'framer-motion';

// Page Header with Icon
<div className="flex items-center gap-3 mb-8">
  <motion.div
    animate={{ rotate: [0, 10, 0] }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    <Music className="w-8 h-8 text-theme-accent-primary" />
  </motion.div>
  <h1 className="text-4xl font-bold">About MashHub</h1>
</div>

// Developer Card with Icons
<div className="developer-card">
  <div className="flex items-center gap-2 mb-2">
    <Sparkles className="w-6 h-6 text-yellow-500" />
    <h2>Featured Creator</h2>
  </div>
  <div className="profile">
    <img src="..." alt="..." />
    <div className="flex items-center gap-2">
      <User className="w-5 h-5 text-theme-text-secondary" />
      <span>CosmicMashups</span>
    </div>
  </div>
  <a href="..." className="group">
    <Youtube className="w-5 h-5 group-hover:scale-110 transition" />
    <span>Visit Channel</span>
    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100" />
  </a>
</div>

// Category Header with Icon
<div className="category-header">
  <Tv className="w-6 h-6 text-theme-accent-primary" />
  <h3>Anime Mashups</h3>
</div>

// Decorative Floating Icon
<motion.div
  className="absolute top-20 right-10 opacity-10"
  animate={{ y: [0, -20, 0] }}
  transition={{ duration: 3, repeat: Infinity }}
>
  <Headphones className="w-16 h-16 text-theme-text-muted" />
</motion.div>
```

## Icon Checklist

- [x] Info - Footer navigation
- [x] Music - Page branding
- [x] Sparkles - Developer section emphasis
- [x] User - Profile indicator
- [x] Code - Developer badge
- [x] Youtube - External video links
- [x] ExternalLink - New tab indicator
- [x] Tv - Anime category
- [x] Globe - Western category
- [x] Radio - K-Pop category
- [x] Award - Credits header
- [x] Waves - Section divider
- [x] Headphones - Decorative float
- [x] Star - Excellence indicator
- [x] Heart - Community love
- [x] Zap - Energy/creativity
- [x] Play - Video playback
- [x] Music2 - Background pattern
- [x] Disc3 - Vinyl theme
- [x] Mic2 - Recording theme
- [x] ArrowRight - Action direction

**Total Icons Used: 21+ unique icons**
