---
description: Comprehensive design system and anti-slop rules synthesized from UI/UX Pro Max, Awesome DESIGN.md, Open Design, React BTS, Emil Kowalski, Hallmark, and GSAP.
always_on: true
---

# MashHub Precision Design System & Quality Standards

Every modification to user-facing pages, dialogs, navigation, and audio controls MUST strictly comply with these integrated rules:

## 1. Hallmark & Taste Anti-Slop Floor
- **Zero AI Defaults**: No purple-to-blue gradients, no gradient text fills, no cards inside cards, no floating/rotating emoji animations.
- **Data Authenticity**: Every meter, badge, number, and status indicator must reflect real application state or audio telemetry (BPM, Camelot key, energy score, track count, sync status). No invented filler metrics or decorative status dots.
- **Single Source of Truth**: All colors and font references must use tokens defined in `:root` and theme variables in `src/index.css`. No inline arbitrary hex codes in components.
- **Clean Motion**: Never use `transition: all`. Never animate `width`, `height`, `top`, or `left`. All animations must have a `prefers-reduced-motion: reduce` fallback.

## 2. UI/UX Pro Max & Awesome DESIGN.md Architecture
- **Aesthetic Archetype**: Ultra-Modern Precision Audio Workstation (Deep Obsidian `#080A0F`, Carbon `#121620`, Electric Cyan `#00F0FF`, Signal Amber `#F59E0B`, Harmonic Emerald `#10B981`).
- **Typography**:
  - Headings & Primary UI: `Satoshi`, `General Sans`, -apple-system, sans-serif.
  - Numerals, Keys, BPM, & Telemetry: `Fira Code`, `JetBrains Mono`, monospace with strict `tabular-nums` formatting.
- **Data Density**: High-density 4px grid rhythm. Compact, information-rich audio console strips, spreadsheets, and rack cards.

## 3. Emil Kowalski Craft & Micro-Interactions
- **Timing**: Micro-interactions (hover, active depress, focus rings) must run between 120ms - 150ms. Panel drawer/modal reveals between 200ms - 280ms.
- **Tactile Depress**: Interactive controls use physical click feedback (`active:scale-[0.98]`) with subtle top-edge micro-highlights (`inset 0 1px 0 rgba(255, 255, 255, 0.1)`).
- **Physics**: Use critically damped springs (`stiffness: 400`, `damping: 30`) or smooth exponential deceleration (`cubic-bezier(0.16, 1, 0.3, 1)`). Never use `ease-in` on enter animations.

## 4. GSAP Animation Integration
- When animating complex timelines, metric sweeps, or harmonic wheel reveals, use the official `@gsap/react` pattern:
  - Always scope tweens with `useGSAP(() => { ... }, { scope: containerRef })`.
  - Use `autoAlpha` instead of `opacity` to prevent hidden elements from blocking clicks.
  - Animate high-performance transform aliases: `x`, `y`, `scale`, `rotation`, `xPercent`, `yPercent`.

## 5. React BTS (Best Practices & Architecture)
- Wrap virtualized/mapped list rows (`SongRow`, `SpreadsheetSectionColumn`, `KanbanCard`) in `React.memo`.
- Memoize callbacks passed into dense tabular rows with `useCallback`.
- Keep interactive local states (e.g. dropdowns, tooltips, inline note editing) localized to avoid triggering parent dashboard re-renders.
