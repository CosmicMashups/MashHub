# MashHub Lyric Matching: Implementation Plan

> Target agent: Antigravity. Read this whole file before writing code. Work phase by phase (Section 12). Do not start a phase until the previous phase's acceptance criteria pass.
> Companion docs: `PROJECT_1.md`, `FEATURES.md`, `FUZZY.md`, `SECOND-BRAIN.md`, `BRAIN.md`.

---

## 1. Goal

DJs and mashup artists connect songs through shared lyrics: the same words, the same words in a different form (tense, plural, gerund), or a similar meaning in different words. Lyric Matching finds those links.

**Input:** a set of songs. **Output:** groups per shared phrase (`phrase → songs containing it`). Each group lists the **whole original lyric line** from each song with that song's title and artist, so the DJ sees the exact words to cut on.

Worked example (must pass as a test): "If you wanna get stronger" (Sam Feldt, *Stronger*) and "Every time I cry, I get a little bit stronger" (Ava Max, *Everytime I Cry*) both match on `stronger` even though everything else is a stopword or differs. The group returns both full lines, each with title and artist.

## 2. Scope

**In scope (v1)**
1. Standalone page `/lyrics`:
   - **Compare selected:** pick 2 to 20 songs from the library using the existing search.
   - **One vs library:** pick one song and match it against all songs whose lyrics are already indexed.
2. Project integration, no song cap (50+ songs expected):
   - Scope choices: **whole project**, **one section**, **a section plus its succeeding section** (matched across the union of their songs).
   - Actions per result group: view, **add note** to entries (existing notes field), **highlight and link** entries in Kanban, Megamix and Spreadsheet views. Links are **persistent**.
3. Languages: **English, Japanese, Korean, Tagalog**. Matching happens **within the same language only**. Language is detected **per line** (K-pop and J-pop mix English lines into other-language songs).
4. Three match kinds with three distinct indicators (Section 6):
   - `exact`: same content words, same surface forms.
   - `lemma`: same words in a different form (eyes/eye, danced/dance).
   - `semantic`: different words, similar meaning.
5. Lyrics are fetched automatically (title and artist lookup) and **full lyrics are persisted** in Supabase.

**Out of scope (v1)**
- Bulk or background fetching of the whole library (explicitly forbidden, Section 5.4).
- Cross-language matching (romaji vs kana vs kanji, English vs Korean).
- Combining lyric affinity with the key/BPM FIS score. Lyric ranking is its own simple ordering (Section 6.6).
- Lyric-based tab in `SuggestionDrawer` (**planned, not now**; see Section 14).
- Audio-based alignment.

## 3. Decisions log (from the requirements discussion)

| # | Decision |
|---|---|
| D1 | Persist full lyrics (plain text always, timestamps when available). |
| D2 | Timestamps used when the source provides them; never required. |
| D3 | Automatic lookup; non-English required. |
| D4 | All three match kinds, with **different indicators** for same-word vs semantic. |
| D5 | Stopwords dropped completely before indexing and lexical matching. |
| D6 | Repeated words collapsed to one token (`dance, dance, dance` → `dance`). |
| D7 | Output is grouped per shared phrase. |
| D8 | No FIS-style score. A plain ranking is used only to order groups. |
| D9 | Standalone page: library search picker (2 to 20) plus one-vs-library mode. |
| D10 | Project integration: no cap; union of songs in scope. |
| D11 | Project actions: view, add note, persistent highlight and link in all three views. |
| D12 | Languages: en, ja, ko, tl; same-language matching only. |
| D13 | Single-word matches allowed; ranked by rarity; very common words collapsed. |
| D14 | Runtime: Supabase Edge Function default, Vercel serverless fallback in the same repo. No separate backend server. |
| D15 | **No bulk fetch** for the whole library. |

## 4. Verified platform constraints (checked against current docs, Oct 2026)

- **Supabase Edge Functions (Free):** 2 s CPU per request (async I/O not counted), 256 MB memory, 150 s wall clock, 20 MB bundle after CLI bundling, 100 functions per project.
- **Supabase built-in embeddings:** `Supabase.ai.Session('gte-small')` only. It is an **English** model. There is no built-in multilingual model.
- **LRCLIB:** free, no key. `GET /api/get` (track, artist, optional album/duration) and `GET /api/search`. Responses contain `plainLyrics` and `syncedLyrics`. A descriptive `User-Agent` is recommended.

**Consequences for the architecture (important):**
1. English NLP and English embeddings can run entirely in an Edge Function.
2. Japanese morphological analysis (dictionary-based tokenizer), Korean/Tagalog processing and **multilingual embeddings** do not fit comfortably in 2 s CPU and a 20 MB bundle. They run in the **Vercel serverless function** (same repo, not a separate server). So the Vercel function is not only a fallback; it is the processor for ja/ko/tl. Everything is behind one interface so either runtime can serve any language where it fits (Section 5.2).
3. Check current Vercel Hobby limits (bundle size, timeout, memory) before Phase 4; these were not verified here.

## 5. Architecture

### 5.1 Overview

```
Browser (React/TS)
  lyricsService ──► Edge Function  lyrics-ingest / lyrics-embed / lyrics-candidates   (default)
        │               └─► Vercel /api/lyrics-nlp   (ja, ko, tl tokenization + multilingual embeddings)
        └──────────► Vercel /api/lyrics-ingest, /api/lyrics-embed                      (automatic failover)
  lyricMatchEngine (pure TS, client)  ◄── lines + tokens from Supabase (RPC / select)
  Supabase Postgres: song_lyrics, lyric_lines (+pgvector), project_lyric_links(+members)
  Dexie: projectLyricLinks (local fallback only; lyrics themselves are Supabase-only)
```

### 5.2 Runtime abstraction

- Shared dependency-free core in `supabase/functions/_shared/lyrics/` (LRC parser, line cleaner, title normalizer, language detector, repeat collapse, n-gram helpers). Vercel imports it by relative path. **No Deno-only or Node-only APIs and no `npm:` specifiers inside the core.**
- Language-specific pieces are injected as adapters implementing:

```ts
export interface LyricNlpAdapter {
  lang: LyricLanguage;
  tokenize(line: string): { surface: string; lemma: string; isStop: boolean }[];
}
```

- Client chooses the backend with `VITE_LYRICS_BACKEND=auto|edge|vercel` (default `auto`): try Edge; on network error, 5xx, `BOOT_ERROR`, `WORKER_LIMIT` or CPU-time shutdown, retry once on Vercel `/api/lyrics-ingest`.
- Edge → Vercel calls (for ja/ko/tl lines) use a shared secret header `x-lyrics-nlp-secret` (env var in both platforms). The Vercel `/api/lyrics-nlp` route rejects requests without it.

### 5.3 Auth and data safety

- All Edge and Vercel routes require a valid Supabase user JWT (Vercel verifies with `supabase.auth.getUser(token)`).
- The client sends **only a `songId`**. The function reads title and artist from the `songs` table itself. Never accept arbitrary title/artist/URL from the client (abuse and SSRF risk).
- Lyric tables are written **only** by the functions (service role). The client has `select` only (authenticated users).
- Full lyric text lives in `song_lyrics.plain_lyrics` and `lyric_lines.text`. **Never include lyrics in CSV/XLSX/JSON exports or project exports.**
- Do not scrape Genius or any site that forbids scraping. Sources: LRCLIB (primary), `lyrics.ovh` (plain-text fallback). Manual paste is the last resort (Section 8.3).

### 5.4 No bulk fetch (hard rule, D15)

- Lyrics are fetched **only** for: songs the user explicitly selected on `/lyrics`, the single target song in one-vs-library mode, and songs inside the chosen project scope when the user clicks **Match lyrics**.
- The ingest function handles **exactly one song per request** (`MAX_SONGS_PER_REQUEST = 1`). The client queues requests with concurrency 3, per-song retry (max 2), progress and cancel.
- Server-side rate limit per user via `lyrics_fetch_log` (default 150 song fetches per hour; constant in `src/constants/lyrics.ts` and mirrored in the function). Return `429` with `retryAfterSeconds`.
- There must be **no** code path, button, script, cron or migration that enumerates the library and fetches lyrics in bulk.
- One-vs-library searches only songs already indexed. The UI states coverage: "Searching 143 of 8,212 songs that have lyrics."

### 5.5 Offline / local mode

- Fetching and matching need Supabase. When `useBackend().isLocal`, the `/lyrics` page and "Match lyrics" show a disabled state with a short explanation (no silent failure).
- Persistent project links also exist in Dexie (`projectLyricLinks`) so existing links still display offline.

## 6. Matching design

### 6.1 Per-line processing (ingestion)

1. Fetch from LRCLIB: `/api/get` first; on miss, `/api/search` and choose the best candidate (Section 8.2). If `instrumental`, store status `instrumental` and stop.
2. Parse synced lyrics (`[mm:ss.xx] text`) into `{startMs, text}`; otherwise split plain lyrics by line.
3. Clean: strip section tags like `[Chorus]` (keep as `section_hint`), trim, drop empty lines.
4. De-duplicate identical normalized lines within a song; keep the first occurrence and set `repeat_count`.
5. Detect language **per line**:
   - Hangul → `ko`; Kana (or Kana+Han) → `ja`; Han-only → `ja` (v1 assumption).
   - Latin → `en` or `tl` by stopword hit ratio; if neither wins clearly → `other` (exact-token matching only, no lemmatization).
6. Tokenize and normalize per language adapter (Section 6.2).
7. Drop stopwords and **lyric filler vocables** (Section 6.3), drop tokens below `MIN_TOKEN_LENGTH`, then **collapse consecutive duplicate tokens** (D6).
8. Store `tokens` (lemmas) and `surface_tokens` (parallel array of surface forms) per line. Lines with zero remaining tokens are kept for display in `song_lyrics.plain_lyrics` but not inserted into `lyric_lines`.

### 6.2 Language adapters

| Lang | Segmentation | Stopwords | Lemmatization | Runtime |
|---|---|---|---|---|
| `en` | regex word split, strip apostrophes | `stopwords-iso` en | a small pure-JS lemmatizer (e.g. `wink-lemmatizer`; try noun, verb, adjective forms) | Edge |
| `ja` | dictionary morphological analyzer (e.g. kuromoji); drop POS: particles, auxiliaries, symbols | by POS plus `stopwords-iso` ja | analyzer base form | Vercel |
| `ko` | `Intl.Segmenter` word split into eojeol, then rule-based suffix stripping (common particles and endings) | `stopwords-iso` ko | rule-based stemming (**best effort**) | Vercel |
| `tl` | regex word split | `stopwords-iso` tl | rule-based affix stripping plus reduplication collapse (**best effort**) | Vercel |

Known limitation (document it, do not hide it): Korean and Tagalog have no mature lightweight JS lemmatizer. Word-form matching is weaker there; semantic matching partially compensates.

### 6.3 Filler vocables

Per-language list in `lyric filler` constants dropped like stopwords (en examples: `oh, ooh, yeah, yeh, ah, uh, hey, la, na, woah, whoa, mm, hmm`; add ja/ko/tl equivalents). Without this, "oh oh oh" matches everything.

### 6.4 Match kinds and indicators

| Kind | Definition | UI badge |
|---|---|---|
| `exact` | Group members share the key and **all members have identical surface forms** for the shared terms | **Same words** |
| `lemma` | Same lemma key but at least one member has a different surface form (tense, plural, gerund, comparative) | **Word form** |
| `semantic` | No shared content lemma; embedding similarity at or above threshold; same language | **Similar meaning** (show similarity %) |

The `semantic` badge must be visually distinct (different color **and** icon, not only a different label) from the two lexical badges.

### 6.5 Grouping algorithm (`lyricMatchEngine`, pure TS)

Lexical:
1. For each line, generate keys: every contiguous lemma n-gram, n = 1 to 4 (`LYRIC_MAX_NGRAM = 4`), prefixed by language.
2. Build an inverted index `key → lines`. A key forms a group only if its lines belong to **at least 2 distinct songs**.
3. **Maximal-phrase rule:** drop a group for key K if a longer key's group covers the same set of lines or a superset (keep the longest shared phrase, hide its sub-phrases).
4. Decide `exact` vs `lemma` per group by comparing `surface_tokens` at the matched positions.
5. Single-word groups (n = 1): apply the rarity rules (6.6).

Semantic:
1. Obtain candidate line pairs from the `lyric_semantic_pairs` RPC (same language, different songs, cosine similarity at or above `LYRIC_SEMANTIC_THRESHOLD`, default **0.82**, to be calibrated in Phase 5).
2. Remove pairs whose lines are already in the same lexical group.
3. Merge remaining pairs into groups by union-find; label each group with its highest-degree line.

### 6.6 Rarity and ranking (single-word flood control, D13)

- Document frequency `df(lang, lemma)` = number of distinct indexed songs containing the lemma.
- A single-word group is **common** if `df / indexedSongsInLang > LYRIC_COMMON_DF_RATIO` (default **0.05**) once `indexedSongsInLang >= LYRIC_MIN_CORPUS_FOR_DF` (default **20**). Common groups are collapsed under a "Common words" section (hidden unless the user expands it).
- Ordering of groups (document the constants; this is not an FIS):
  `rank = kindWeight + 0.15 * (n / 4) + rarityBonus`, with `kindWeight = exact 1.0, lemma 0.85, semantic 0.7 * similarity`, `rarityBonus = 0.1 * idfNormalized`.
- Never show the rank number to users. Show kind badge, shared terms and (for semantic) similarity %.

### 6.7 Highlighting

Each member carries `highlightTerms` (surface forms to mark). The UI highlights them case-insensitively inside `lineText`. For ja/ko highlight by substring. Show `startMs` as `m:ss` only when present.

## 7. Data model (Supabase migration)

> Verify actual types of `songs.id` and `projects.id` in `supabase/migrations/` and adjust FK types. The SQL below assumes `text`.

```sql
create extension if not exists vector with schema extensions;

create table public.song_lyrics (
  song_id            text primary key references public.songs(id) on delete cascade,
  status             text not null check (status in ('found','not_found','instrumental','error','manual')),
  source             text,                      -- 'lrclib' | 'lyricsovh' | 'manual'
  source_track_id    text,
  match_confidence   real,
  plain_lyrics       text,
  has_timestamps     boolean not null default false,
  language_summary   text[] not null default '{}',
  processed_version  int not null default 1,
  embedding_status   text not null default 'pending' check (embedding_status in ('pending','partial','done','skipped')),
  fetched_at         timestamptz not null default now(),
  error_detail       text
);

create table public.lyric_lines (
  id               bigint generated always as identity primary key,
  song_id          text not null references public.songs(id) on delete cascade,
  line_index       int  not null,
  text             text not null,
  start_ms         int,
  section_hint     text,
  repeat_count     int  not null default 1,
  lang             text not null check (lang in ('en','ja','ko','tl','other')),
  tokens           text[] not null,
  surface_tokens   text[] not null,
  embedding        extensions.vector(384),       -- consider halfvec(384) to halve storage
  embedding_model  text,
  unique (song_id, line_index)
);
create index lyric_lines_song_idx   on public.lyric_lines (song_id);
create index lyric_lines_tokens_gin on public.lyric_lines using gin (tokens);
create index lyric_lines_emb_hnsw   on public.lyric_lines using hnsw (embedding extensions.vector_cosine_ops) where embedding is not null;

create table public.lyrics_fetch_log (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  song_id text not null,
  at timestamptz not null default now()
);
create index lyrics_fetch_log_user_at on public.lyrics_fetch_log (user_id, at desc);

create table public.project_lyric_links (
  id          uuid primary key default gen_random_uuid(),
  project_id  text not null references public.projects(id) on delete cascade,
  user_id     uuid not null default auth.uid(),
  group_key   text not null,
  lang        text not null,
  match_kind  text not null check (match_kind in ('exact','lemma','semantic')),
  shared_terms text[] not null default '{}',
  label       text not null,
  created_at  timestamptz not null default now(),
  unique (project_id, group_key)
);

create table public.project_lyric_link_members (
  link_id    uuid not null references public.project_lyric_links(id) on delete cascade,
  song_id    text not null,
  line_id    bigint,
  line_text  text not null,       -- snapshot, survives re-ingest
  line_index int,
  primary key (link_id, song_id, line_text)
);
```

- **RLS:** `song_lyrics`, `lyric_lines`: `select` for authenticated, no insert/update/delete policies (service role only). `project_lyric_links` and members: owner-only (`user_id = auth.uid()` or via parent link), mirroring existing project policies.
- **Links reference songs, not entries.** Cross-section moves recreate entries, which would orphan entry-based links. A link highlights every entry of its member songs inside that project. When the **last** entry of a song is removed from a project, remove that song from the link's members (delete the link if fewer than 2 members remain).
- **Dexie:** add `projectLyricLinks` (version bump plus migration) mirroring the two tables as one document `{ id, projectId, groupKey, lang, kind, sharedTerms, label, members[] }`. Sync with the workspace **explicit Save** model in Supabase mode like other staged workspace edits.
- **Storage estimate** (rough, verify): about 40 lines per song and about 70 KB per song including embeddings and index. At 1,000 indexed songs this is about 70 MB of the 500 MB free tier. The no-bulk rule keeps growth proportional to real use.

### RPCs (all `security invoker`, all take explicit song-id arrays)

- `lyric_lines_for_songs(p_song_ids text[])`: lines plus tokens for the engine.
- `lyric_candidates_for_song(p_song_id text, p_limit int)`: lines of **other** songs sharing any token (`tokens && target_tokens`, same `lang`); used by one-vs-library.
- `lyric_semantic_pairs(p_song_ids text[], p_threshold real, p_limit int)`: cross-song same-language pairs above threshold. For one-vs-library use a `lateral` kNN per target line against the HNSW index (top 5 each).
- `lyric_term_df(p_lang text, p_lemmas text[])` and `lyric_indexed_song_count(p_lang text)`: rarity stats.
- `lyric_coverage()`: `{ songsWithLyrics, totalSongs }`.
- Keep statements fast (free tier statement timeout). If a project scope is large and the semantic RPC times out, the client splits song-id arrays into batches (Section 9.4).

## 8. Edge Functions (and Vercel mirrors)

### 8.1 Contracts

| Route | Request | Response |
|---|---|---|
| `lyrics-ingest` | `{ songId, force?, candidateId? }` | `{ status, lineCount, languages[], source, confidence, embeddingPending }` |
| `lyrics-embed` | `{ songId, limit<=16 }` | `{ embedded, remaining }` |
| `lyrics-candidates` | `{ songId }` | `{ candidates: [{ id, track, artist, album, duration, hasSynced }] }` (LRCLIB search results for the "wrong lyrics?" flow) |

Vercel mirrors: `/api/lyrics-ingest`, `/api/lyrics-embed`, `/api/lyrics-candidates`, plus internal `/api/lyrics-nlp` (`{ lang, lines[] }` → tokens) and `/api/lyrics-embed-ml` (multilingual vectors).

### 8.2 Lookup and confidence

1. Normalize title and artist: strip `(feat. …)`, `(TV Size)`, `(Remix)`, `(Instrumental)`, bracketed tags, extra whitespace; keep a romanized and original form if both exist in the song record.
2. LRCLIB `/api/get`; on miss `/api/search`; choose the candidate with the best normalized title similarity (and artist similarity). Below `LYRIC_MIN_CONFIDENCE` (default 0.75) store `not_found`, **never** store low-confidence lyrics silently.
3. Fall back to `lyrics.ovh` (plain only). Send a descriptive `User-Agent` to LRCLIB.
4. Timeouts per upstream call (8 s) and one retry with backoff.

### 8.3 Wrong or missing lyrics

- UI action **"Not the right lyrics?"** calls `lyrics-candidates` and lets the user pick one (`candidateId` on re-ingest).
- UI action **"Paste lyrics"** (status `manual`) for songs with `not_found`. Same processing pipeline; `source = 'manual'`.

### 8.4 Embeddings

- Embed the **cleaned original line** (not the stopword-stripped tokens): embeddings need grammar and context. Stopword removal applies to the lexical index only.
- English: Edge built-in `gte-small` (mean pooling, normalized). Other languages: Vercel function using a multilingual sentence-embedding model that outputs **384 dimensions** (so one `vector(384)` column serves all), e.g. a multilingual MiniLM-class model via a JS inference library. Store `embedding_model` per row. **Never compare vectors across models:** the RPC filters by `lang` and `embedding_model`.
- Embedding runs **after** lexical ingestion and is chunked (`limit <= 16` lines per call, to be tuned to stay inside 2 s CPU). The client calls `lyrics-embed` repeatedly until `remaining = 0`. Lexical matches are usable immediately; semantic results appear when embedding finishes (show progress).
- **Tagalog caveat:** many multilingual sentence models do not officially list Tagalog. Phase 5 includes a labeled Tagalog check; if quality is poor, set `embedding_status = 'skipped'` for `tl` and keep lexical matching only (shown in the UI as "Meaning match unavailable for Tagalog").

## 9. Frontend

### 9.1 Files (new)

```
src/types/lyrics.ts
src/constants/lyrics.ts
src/services/lyricsService.ts          // ingest/embed/candidates with edge→vercel failover, queue, rate-limit handling
src/services/lyricMatchEngine.ts       // pure functions, no I/O (see 6.5)
src/hooks/useLyricIngest.ts            // queue, progress, cancel, per-song status
src/hooks/useLyricMatch.ts             // orchestrates fetch missing → embed → engine → groups
src/hooks/useLyricLinks.ts             // project links (service-backed), linksBySongId
src/pages/LyricMatchPage.tsx           // route /lyrics
src/components/lyrics/LyricSongPicker.tsx
src/components/lyrics/LyricMatchResults.tsx
src/components/lyrics/LyricMatchGroupCard.tsx
src/components/lyrics/LyricKindBadge.tsx
src/components/lyrics/LyricSongStatusChip.tsx
src/components/lyrics/LyricCoverageBanner.tsx
src/components/lyrics/WrongLyricsDialog.tsx
src/components/lyrics/PasteLyricsDialog.tsx
src/components/ProjectLyricMatchDialog.tsx
src/components/LyricLinkBadge.tsx       // used inside Kanban / Megamix / Spreadsheet rows
supabase/migrations/<ts>_lyrics.sql
supabase/functions/lyrics-ingest/index.ts
supabase/functions/lyrics-embed/index.ts
supabase/functions/lyrics-candidates/index.ts
supabase/functions/_shared/lyrics/*      // dependency-free core
api/lyrics-ingest.ts, api/lyrics-embed.ts, api/lyrics-candidates.ts, api/lyrics-nlp.ts, api/lyrics-embed-ml.ts
```

### 9.2 Types (`src/types/lyrics.ts`)

```ts
export type LyricLanguage = 'en' | 'ja' | 'ko' | 'tl' | 'other';
export type LyricMatchKind = 'exact' | 'lemma' | 'semantic';
export type LyricIngestStatus = 'found' | 'not_found' | 'instrumental' | 'error' | 'manual';

export interface LyricLine {
  id: number;
  songId: string;
  lineIndex: number;
  text: string;
  startMs?: number;
  sectionHint?: string;
  lang: LyricLanguage;
  tokens: string[];
  surfaceTokens: string[];
}

export interface LyricMatchMember {
  songId: string;
  title: string;
  artist: string;
  lineId: number;
  lineIndex: number;
  lineText: string;
  startMs?: number;
  highlightTerms: string[];
}

export interface LyricMatchGroup {
  id: string;                 // stable: `${lang}:${kind}:${sharedTerms.join('+')}` (semantic: hash of line ids)
  language: LyricLanguage;
  kind: LyricMatchKind;
  sharedTerms: string[];
  label: string;
  isCommonWord: boolean;
  semanticSimilarity?: number; // 0..1, semantic only
  rank: number;
  members: LyricMatchMember[]; // >= 2 distinct songs
}
```

Strict TypeScript: zero `any`.

### 9.3 Standalone page `/lyrics`

- Add route `/lyrics` behind the same auth guard behavior as other routes, plus a navigation entry.
- **Mode toggle:** *Compare selected* | *One vs library*.
- *Compare selected:* reuse the existing search (`searchService` / `AdvancedSearchBar` behavior) as a multi-select picker; chips for selected songs; hard limit 20 with a clear message at the limit; **Find matches** button.
- *One vs library:* single-song picker; `LyricCoverageBanner` shows indexed coverage; only the target song may trigger a fetch.
- Per-song `LyricSongStatusChip`: pending, fetching, found, not found, instrumental, error (retry), manual. `not_found` and `error` offer **Paste lyrics** and **Not the right lyrics?**.
- Results: `LyricMatchResults` with filters: kind (Same words / Word form / Similar meaning), language, "Show common words". Each `LyricMatchGroupCard` shows kind badge, shared terms, and every member as: **Title, Artist, whole lyric line with highlighted terms, optional timestamp**. Include a copy-line action.
- Empty and partial states: "No shared lyrics found", "Meaning matches still processing (x of y lines)".

### 9.4 Project integration

Entry points: `ProjectOptionsMenu` (new item **Match Lyrics**) and the workspace toolbar in `ProjectWorkspacePage`.

`ProjectLyricMatchDialog`:
- **Scope selector:** Whole project | One section | Section + succeeding section. The last option is disabled for the final section. Songs in scope are the **union** of entries (de-duplicate by `songId`).
- No song cap. Missing lyrics are fetched through the queue (Section 5.4) with progress. Show how many songs lack lyrics after fetching.
- Large scopes: run the engine in chunks and the semantic RPC in batches of song-id arrays (e.g. 25 songs per batch, plus cross-batch comparison handled by pairing batches); never block the main thread (use an async loop or a Web Worker for the engine).
- Per group actions:
  1. **Add note:** appends a tagged line to the notes of every entry whose song is in the group, using `onNotesChange`/`projectService.updateEntryNotes`. Format: `[Lyric link] <terms>: <Title - Artist>: "<line>" ↔ ...`. Idempotent: skip if the note already contains the group's link id.
  2. **Link and highlight:** creates a persistent link (Section 7) via `projectService` (`withFallback`, staged in the workspace draft when in Supabase mode, saved with the explicit Save action).
  3. **Unlink:** removes the link (and offers to remove the appended notes only if the user confirms; never delete user-written note text automatically).

Views (extend, do not fork):
- **Kanban** (`KanbanSectionCard` song items) and **Megamix** (`MegamixTimeline` blocks): render `LyricLinkBadge` (chain icon plus ring/outline in a dedicated link palette, **not** a fill that clashes with the Camelot key gradient). Hover or focus on a badge highlights all partner entries via a shared `highlightedLinkId` context.
- **Spreadsheet view:** add a "Lyrics" cell/column showing the badge(s); same hover behavior.
- Mobile: tap the badge to open a popover listing partner songs and the matched lines.
- Compact mode: badge only (no text).
- Accessibility: badge has an `aria-label` ("Lyric link with <Title> by <Artist>"), keyboard focusable, visible focus ring, and the highlight never relies on color alone (icon plus outline).

### 9.5 Existing-code rules to respect

- Hooks: unconditional hook execution only (see `docs/HOOK_SAFETY.md`).
- Backend access: through services with `withFallback`; check `isLocal` before any direct Supabase call.
- **Do not create a second `DndContext`.** Link badges must not interfere with drag handles and the existing `section-` / `entry-` ID prefixes.
- Reuse theme tokens and the existing modal patterns. Persist any new UI preference under a `mashhub_`-prefixed `localStorage` key (e.g. `mashhub_lyrics_show_common`).

## 10. Prohibitions (do NOT)

1. Do not add any bulk/background/cron/enumerate-the-library lyrics fetching.
2. Do not scrape Genius or any site whose terms forbid it.
3. Do not accept title, artist or URLs from the client in the ingest functions; accept `songId` only.
4. Do not put lyric text in exports (CSV, XLSX, JSON, project export) or logs.
5. Do not expose a service-role key to the browser.
6. Do not compare embeddings across different models or languages.
7. Do not match across languages in v1.
8. Do not silently store low-confidence lyric lookups.
9. Do not add a separate backend server or a second long-running service.
10. Do not use `any`; do not add a second `DndContext`; do not wrap hooks conditionally.
11. Do not link by `entryId`; link by `songId` within a project.
12. Do not display a numeric "score" for lexical matches, and do not merge the lexical and semantic badges into one style.
13. Do not call `songService.getAll()` from new components; use `getByIds` or paged queries.
14. Do not delete user-written note text when unlinking.

## 11. Testing and acceptance criteria

### 11.1 Engine unit tests (Vitest, fixtures with short synthetic or user-provided snippets)

1. Same words: two lines containing "We gonna party like" → one group, kind `exact`, both full lines, both title/artist pairs present.
2. Word form: "I've got my eye on you" and "All eyes on me" → group on lemma `eye`, kind `lemma`, `highlightTerms` contain `eye` / `eyes`.
3. Repetition collapse: "dance, dance, dance with my hands, hands, hands above my head" and "Dance, dance the night away" → group on `dance`, tokens collapsed (no `dance dance dance`), whole lines returned.
4. **Stronger case:** "If you wanna get stronger" and "Every time I cry, I get a little bit stronger" → group on `stronger`/`strong`, both **full original lines** returned with their own title and artist even though only one content word matched.
5. Maximal phrase: a 2-word shared phrase suppresses its two single-word sub-groups when they cover the same lines.
6. Common-word collapse: with a synthetic corpus of at least 20 songs, a lemma appearing in more than 5% of songs lands in the common section.
7. Filler words (`oh`, `yeah`) never form groups.
8. Same-language rule: an English and a Japanese line never group lexically or semantically.
9. Semantic pairs already inside a lexical group are not duplicated as `semantic` groups.
10. Groups never contain fewer than 2 distinct songs.
11. Per-language adapters: at least 10 labeled lines each for ja, ko, tl producing expected lemma/stem output; the known weak spots (ko, tl) are listed in the test file as documented limitations rather than silently skipped.

### 11.2 Service and function tests

- LRC parser (timestamps, multiple timestamps per line, metadata tags, missing timestamps).
- Title normalizer; confidence threshold behavior (`not_found` below threshold).
- Rate limit returns `429` with `retryAfterSeconds`; ingest rejects a request that carries more than one song or a non-`songId` payload.
- Failover: simulated Edge failure triggers exactly one Vercel retry.
- RLS: an authenticated client cannot insert into `song_lyrics` or `lyric_lines`; a user cannot read another user's `project_lyric_links`.

### 11.3 Integration / E2E (Playwright)

- `/lyrics` compare mode with 2 songs: results appear with three badge types distinguishable by icon and label.
- Selecting a 21st song is blocked with a message.
- One-vs-library shows the coverage banner and does not fetch lyrics for any song except the target (assert request log).
- Project dialog: scope "section + next section" returns only songs from those two sections; whole project with 50+ songs completes without freezing the UI (long-task check).
- Link persists after reload and appears in Kanban, Megamix and Spreadsheet; hover highlights partners; moving an entry between sections keeps the link.
- Local mode: page shows the disabled explanation; existing project links still render.

### 11.4 Performance checks

- Engine on 2,000 lines completes in under 1 s on a mid-range laptop (record the number).
- `lyric_semantic_pairs` for about 1,750 lines completes within the free-tier statement timeout; if not, batching in 9.4 is required.
- Measure Edge CPU per `lyrics-embed` call and set `limit` so it stays under 2 s CPU with margin.

## 12. Phased task list (each phase ends with its acceptance gate)

**Phase 0: Scaffolding.** Types, constants (`LYRIC_SEMANTIC_THRESHOLD`, `LYRIC_COMMON_DF_RATIO`, `LYRIC_MIN_CORPUS_FOR_DF`, `LYRIC_MAX_NGRAM`, `LYRIC_MIN_CONFIDENCE`, `MAX_SONGS_PER_REQUEST`, rate-limit values, `MIN_TOKEN_LENGTH`), feature flag `VITE_LYRICS_ENABLED`. *Gate:* project builds; no behavior change.

**Phase 1: Database.** Migration, RLS, RPCs, Dexie table and version bump. *Gate:* migration applies cleanly on a fresh project; RLS tests pass.

**Phase 2: Core library.** `_shared/lyrics` (LRC parser, cleaner, title normalizer, language detector, collapse, n-grams) plus tests. *Gate:* 11.1 items 1 to 4 and 7 pass against English adapter.

**Phase 3: English ingestion on Edge.** `lyrics-ingest`, `lyricsService`, queue hook, status chips, wrong-lyrics and paste flows. Vercel mirror and failover. *Gate:* ingest one English song end to end; failover test passes; rate limit test passes.

**Phase 4: ja/ko/tl on Vercel.** `/api/lyrics-nlp`, adapters, secret header, Edge→Vercel delegation. Check Vercel limits first. *Gate:* 11.1 item 11 passes; a mixed Korean/English song splits lines to the right language.

**Phase 5: Embeddings and semantic.** `lyrics-embed` (English on Edge; others via Vercel), RPC `lyric_semantic_pairs`, threshold calibration on a small labeled set (include Tagalog decision). *Gate:* semantic group appears for a known synonym pair; no cross-language pairs; threshold value recorded with its evidence.

**Phase 6: Engine and `useLyricMatch`.** Grouping, maximal phrase, rarity, ranking. *Gate:* all of 11.1 pass.

**Phase 7: `/lyrics` page.** Both modes, filters, badges, coverage banner. *Gate:* 11.3 standalone cases pass.

**Phase 8: Project integration.** Dialog, notes, persistent links (Supabase and Dexie, Save model), badges in the three views. *Gate:* remaining 11.3 cases pass.

**Phase 9: Hardening and docs.** Error and empty states, mobile, accessibility pass, update `FEATURES.md`, `PROJECT_1.md`, `SECOND-BRAIN.md` file map, and document limitations (Section 13).

## 13. Risks and limitations to state honestly

- **Copyright:** persisting full lyrics is a legal risk the owner has accepted. Mitigations built in: no exports, authenticated read only, no client-supplied lookups, no scraping. For the research paper, describe this in the limitations section.
- **Korean and Tagalog** lexical normalization is best-effort; **Tagalog** semantic quality is unverified and may be switched off.
- **Romanized lyrics** (e.g. romaji) are detected as Latin and treated as English/`other`; they will not match their kanji/kana versions (cross-script matching is out of scope).
- Source coverage: LRCLIB may lack niche anime songs; expect a visible `not_found` rate.
- **Free-tier limits:** 2 s CPU on Edge and 500 MB database size drive the chunked embedding design and the no-bulk rule.
- Semantic threshold (0.82) is a starting value, not an established one.

## 14. Planned for later (document only, do not build now)

- **SuggestionDrawer lyric source:** a "Lyric matches" tab that suggests library songs sharing lyrics with the songs in a section. Prepare for it by keeping `lyric_candidates_for_song` and the engine's group output independent of the UI, so the drawer can call them later. Respect the same no-bulk rule: it can only search already-indexed songs.
- Cross-language / cross-script matching.
- Combining lyric affinity with key/BPM compatibility in a ranked suggestion.
- Offline matching over locally cached processed lines.

## 15. Documentation hooks (for the research paper)

- *Proposed System Design / Architecture:* Sections 5 to 8.
- *AI Model Description:* Section 6 (rule-based NLP pipeline plus embedding similarity; contrast with the Sugeno FIS in `FUZZY.md` and with Fuse.js text search).
- *Testing and Evaluation:* Section 11.
- *Limitations and Future Enhancements:* Sections 13 and 14.
