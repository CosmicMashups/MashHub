# Add Auth Login and Register UI

## Why

MashHub needs professional, music-inspired Login and Register pages that match the product (DJ-style workflow, harmonic matching, music metadata) and provide a polished SaaS-level experience with split-screen layout, animations, and strong UX.

## What Changes

- New auth UI component library under `src/components/auth/`: AuthCard, AuthInput, PasswordInput, AuthButton, Divider, FormError, FormSuccess, AnimatedBackground.
- New Login and Register full pages with split-screen layout (left: branding + music visualization, right: form).
- Auth layout with responsive breakpoints (desktop, tablet, mobile).
- Framer Motion animations (waveform, focus glow, loading, page transition).
- Light theme support on auth pages; dark theme default.
- Routes: `/login`, `/register`; AuthGuard redirects unauthenticated users to `/login`.
- Inline validation, password strength indicator, confirm password, accessibility.

## Impact

- Affected code: `src/components/LoginPage.tsx`, `src/components/AuthGuard.tsx`, `src/main.tsx`, new `src/components/auth/*`, new `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`, `src/index.css` (auth keyframes if needed).
- No social login (per answers). No audio-reactive background.
