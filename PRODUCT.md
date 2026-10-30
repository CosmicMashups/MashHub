# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19, TypeScript, Vite 7, Tailwind CSS, React Router 7, Supabase, Dexie (IndexedDB fallback), Fuse.js, Recharts, Framer Motion, @dnd-kit.

## Users

DJs, music producers, bootleg/mashup creators, and audio mixers who need to catalogue songs, identify harmonic compatibility, analyze BPM and key relationships across song sections, and assemble coherent multi-track mashups and megamixes.

## Product Purpose

MashHub eliminates guesswork and manual spreadsheet friction in creating mashups. It provides precision tools for section-by-section harmonic matching (Camelot / standard musical key, BPM tempo scaling, segment compatibility), project structuring (Megamixes, Seasonal/Year-End compilations), and instant discovery across large audio track libraries.

## Positioning

Unlike generic DJ software or streaming library managers, MashHub treats harmonic compatibility and song anatomy (Intro, Verse, Chorus, Bridge, Drop, Outro) as first-class multi-track signals. It offers instantaneous cross-track harmonic distance scoring, vocal phrase indexing, and structured project timeline workspaces that bridge track discovery directly to DAW arrangement logic.

## Operating Context

- Used in dim studio environments, DJ booths, and late-night desktop production sessions (requiring high readability, clear contrast, low glare, and high data density).
- Frequent rapid scanning of BPM, Key, Section markers, and compatibility ratings across dense lists.
- Dual-mode data resilience: runs completely offline with browser IndexedDB (Dexie) or syncs with Supabase.

## Capabilities and Constraints

- Capabilities: Section-based BPM/key harmonic matching, Camelot wheel visualization & circle of fifths distance matrix, fuzzy search (Fuse.js), song library import/export (CSV/XLSX/JSON), project workspaces (Kanban and Megamix timeline), vocal phrase cataloging, audio feature analysis, multi-language lyrical connection matching (exact, morphological lemma, and semantic embeddings) with persistent project links.
- Constraints: Must remain blazingly fast at thousands of tracks. Must maintain zero visual clutter, strong typographic hierarchy, and avoid generic boilerplate "AI slop" (no neon halos, no generic cards, no bloated marketing hero tropes in operational workspaces).

## Brand Commitments

- Name: MashHub.
- Identity: High-precision music engineering workbench. Tactile, confident, studio-grade hardware/software hybrid aesthetic (reminiscent of professional audio hardware, high-end DAWs, and precision signal monitors).
- Avoid: Generic purple/blue SaaS gradients, sterile boilerplate card grids, vague marketing buzzwords, and decorative fake waveforms.

## Evidence on Hand

- Fully functional React/Vite app with local storage/IndexedDB demo songs and live project workspaces.
- Real music metadata structures (BPM, key, Camelot wheel notes, sections, vocal phrases).

## Product Principles

1. Precision Audio Tooling: Information density, accuracy, and scanability outrank decorative fluff.
2. Studio Rigor: High contrast, purposeful harmonic color-coding (Camelot colors with intentional musical meaning), and clear state feedback.
3. Fast Physicality: Instant filtering, low-latency interaction, and keyboard-friendly workflows.
