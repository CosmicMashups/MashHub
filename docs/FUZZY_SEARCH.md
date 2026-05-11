# Fuse.js Fuzzy Search in the Music Library (Beginner Guide)

## Overview

This document explains, in beginner-friendly terms, how fuzzy search is implemented in the Music Library search bar using **Fuse.js**.

In this project, search has two main parts:

1. **UI layer**: [`src/components/AdvancedSearchBar.tsx`](../src/components/AdvancedSearchBar.tsx)
2. **Search engine layer**: [`src/services/searchService.ts`](../src/services/searchService.ts)

The UI collects user input and displays results. The search service does the fuzzy matching and ranking.

---

## What is Fuzzy Search?

Fuzzy search means users do not need exact text matches.

Example:
- User types `anl gea`
- A result like `Angel Beats` can still appear because Fuse.js measures similarity, not just exact equality.

This is useful for:
- typos
- partial words
- different word order

---

## Where Fuse.js is Configured

Fuse.js is configured in [`src/services/searchService.ts`](../src/services/searchService.ts) using weighted fields:

- `title` (0.4)
- `artist` (0.3)
- `type` (0.15)
- `origin` (0.1)
- `part` (0.05)

This means title and artist have the strongest influence on ranking.

### Important options

The service uses these key options:

- `threshold: 0.6` - controls how fuzzy matching can be
- `distance: 100` - character distance tolerance
- `minMatchCharLength: 2` - ignore too-short trivial matches
- `includeScore: true` - return similarity score
- `includeMatches: true` - return match positions
- `ignoreLocation: true` - match can occur anywhere in text
- `findAllMatches: true` - collect all candidate matches
- `useExtendedSearch: true` - allow field-based query syntax

These values come from [`src/constants/index.ts`](../src/constants/index.ts):
- `FUSE_THRESHOLD`
- `FUSE_DISTANCE`
- `FUSE_MIN_MATCH_CHAR_LENGTH`
- `SEARCH_DEBOUNCE_MS`

---

## Why a Module-Level Fuse Instance is Used

Instead of creating a new Fuse object every time a user types, the app keeps one module-level instance:

- `initSearchService(songs)` - initialize once
- `updateSongs(songs)` - replace collection when data changes
- `addSong(song)` - add one song incrementally
- `removeSong(id)` - remove one song incrementally

This improves performance because the index is reused, not rebuilt repeatedly.

---

## End-to-End Search Flow

### 1) User types in the search bar

In [`AdvancedSearchBar.tsx`](../src/components/AdvancedSearchBar.tsx), input is stored in `query`.

### 2) Debounce waits 300ms

`useDebounce(query, 300)` avoids firing a search on every keystroke.

### 3) Query validation

If trimmed query length is less than 2:
- results are cleared
- suggestions are hidden

### 4) Search execution

For valid query length (`>= 2`):
- call `search(debouncedQuery)`
- store/display results
- call `getSuggestions(debouncedQuery)`

### 5) Result rendering

The component shows:
- total result count
- best match title
- match percent based on Fuse score

---

## How Ranking Works

Fuse returns a `score` for each result:

- lower score = better match
- higher score = weaker match

The UI converts score to percent:

- `matchPercent = (1 - score) * 100`

Because field weights are used, a close title match usually ranks above a weak type/origin match.

---

## Fuzzy Computation (Step-by-Step)

This section focuses on the actual computation concept so you can understand what Fuse is "calculating".

### 1) Per-field fuzzy similarity

For each song, Fuse checks each configured field (`title`, `artist`, `type`, `origin`, `part`) against the query.

Conceptually, each field gets a fuzzy similarity value:
- close to **0** -> very good match in that field
- close to **1** -> poor match in that field

This is based on approximate string matching (typos, missing letters, partial sequences).

### 2) Weighted contribution by field importance

Each field score is multiplied by its weight:

- `titleScore * 0.4`
- `artistScore * 0.3`
- `typeScore * 0.15`
- `originScore * 0.1`
- `partScore * 0.05`

Then Fuse combines these into one final score for that song.

You can think of it as:

```text
finalScore ~= weightedCombinationOfFieldScores
```

Lower `finalScore` means a stronger overall match.

### 3) Threshold filtering

The app uses `threshold = 0.6`.

Interpretation:
- if computed score is too weak (above acceptable fuzziness), the item is not included;
- if score is within threshold, it is kept and ranked.

### 4) Sorting

After scoring all songs, Fuse sorts ascending:
- smallest score first (best match)
- largest score later (weaker match)

The UI then shows:

```text
matchPercent = (1 - score) * 100
```

So a score of `0.18` becomes about `82%`.

### 5) Mini worked example

Suppose query is `angl beat` and two songs are candidates:

- Song A: `title = "Angel Beats"`  
- Song B: `title = "Beat Control"`

Expected behavior:
- Song A gets a better title fuzzy score (query resembles both words despite typo).
- Song B may match "beat" but not "angel".
- Because title has high weight (`0.4`), Song A usually ranks higher.

Even if Song B has matching `type` or `origin`, those fields have lower combined weight (`0.25`) than `title + artist` (`0.7`).

### 6) Why `ignoreLocation: true` matters computationally

With `ignoreLocation: true`, Fuse does not heavily penalize where in the string the match appears.

That means:
- `anime` can match `Best Anime OP` and `OP Anime Best`
- score is influenced more by character similarity than strict position

This improves robustness for real music metadata, where word order is inconsistent.

---

## Suggestions Behavior

`getSuggestions(query, limit=5)`:

1. searches using Fuse
2. extracts candidate strings from:
   - title
   - artist
   - type
3. returns unique values using a `Set`

So suggestions are data-driven from top fuzzy results.

---

## Advanced (Extended) Search

`searchExtended(query)` supports field-style syntax:

- `title:Angel artist:Lia`

The helper `parseExtendedQuery()` maps known field names (`title`, `artist`, `type`, `origin`, `part`) into Fuse-compatible extended query format.

---

## Key Takeaways for Novice Developers

- The search bar itself does not do fuzzy math; it delegates to `searchService`.
- Fuse.js options and weights strongly affect relevance and user experience.
- Debouncing and singleton index reuse are critical for smooth performance.
- Fuzzy text search is separate from the app's harmonic BPM/key matching logic.

---

## Quick File Reference

- UI search input and rendering: [`src/components/AdvancedSearchBar.tsx`](../src/components/AdvancedSearchBar.tsx)
- Fuse singleton and search functions: [`src/services/searchService.ts`](../src/services/searchService.ts)
- Search constants: [`src/constants/index.ts`](../src/constants/index.ts)

