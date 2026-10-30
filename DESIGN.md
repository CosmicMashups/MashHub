# DESIGN.md - MashHub Ultra-Modern Audio Workstation & Precision Sound Stage

## 1. Vision & Architecture
MashHub is an elite audio engineering and harmonic matching workstation designed for mashup artists, DJs, and DAW music producers. The visual system mirrors professional hardware consoles (Teenage Engineering, Elektron, SSL, Ableton Push) merged with the razor-sharp digital precision of modern software (Linear, Bitwig).

## 2. Typography System
- **Display & Headings**: `Satoshi`, `General Sans`, -apple-system, sans-serif
  - Weight: 600, 700 (Tracking: `-0.025em`)
- **Body & Controls**: `General Sans`, `Inter`, system-ui, sans-serif
  - Weight: 400, 500 (Tracking: `-0.01em`)
- **Numerals, Timecodes, BPM & Telemetry**: `Fira Code`, `JetBrains Mono`, monospace
  - Feature settings: `'tnum' on, 'zero' on` (Strict tabular numerals)

## 3. Color & Surface Architecture

### Dark Mode (Primary Workstation Chassis)
- `--theme-bg-primary`: `#080A0F` (Deep Obsidian Vacuum)
- `--theme-bg-secondary`: `#0E121A` (Chassis Recessed Deck)
- `--theme-bg-tertiary`: `#141A24` (Sub-rack Channel)
- `--theme-surface-base`: `#121620` (Standard Module Unit)
- `--theme-surface-elevated`: `#1A2130` (Console Faceplate / Dialog)
- `--theme-surface-hover`: `#222B3E` (Interactive Hover Surface)
- `--theme-surface-selected`: `#1E3A5F` (Active Channel Highlight)
- `--theme-border-default`: `rgba(255, 255, 255, 0.08)` (1px Precision Micro-border)
- `--theme-border-subtle`: `rgba(255, 255, 255, 0.04)`
- `--theme-border-strong`: `rgba(255, 255, 255, 0.16)`
- `--theme-accent-primary`: `#00F0FF` (Electric Studio Cyan)
- `--theme-accent-contrast`: `#05080E`
- `--theme-accent-hover`: `#38F4FF`
- `--theme-accent-amber`: `#F59E0B` (Signal Level Meter)
- `--theme-accent-emerald`: `#10B981` (Harmonic Lock)

### Light Mode (Mastering Studio Daylight)
- `--theme-bg-primary`: `#F4F5F8` (Warm Technical Slate)
- `--theme-bg-secondary`: `#EAECEF` (Module Recess)
- `--theme-surface-base`: `#FFFFFF` (Crisp Unit Surface)
- `--theme-surface-elevated`: `#FFFFFF`
- `--theme-border-default`: `#D5D9E2`
- `--theme-border-subtle`: `#E2E6EE`
- `--theme-text-primary`: `#0B101B`
- `--theme-text-secondary`: `#475569`
- `--theme-accent-primary`: `#0098A6` (Crisp Studio Cyan-Teal)
- `--theme-accent-contrast`: `#FFFFFF`

## 4. Micro-Interactions & Motion (Emil Kowalski + GSAP)
- **Buttons & Controls**:
  - `active:scale-[0.98]`
  - Duration: 140ms ease-out
  - Inner physical bevel highlight on dark surfaces
- **Telemetry & Meters**:
  - GSAP timeline reveals for real-time telemetry meters and Camelot harmony sweeps.
- **Modals & Drawers**:
  - High-depth backdrop `rgba(4, 6, 10, 0.8)` with subtle blur.
  - Spring enter: `stiffness: 420, damping: 32`.
