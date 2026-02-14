## Context

Based on the feasibility assessment, Spotify API integration is technically feasible with 75-85% automatic mapping success rate for the anime music catalog. The primary constraints are:
- ~20% of songs have missing artist names (reduces matching accuracy)
- Preview URLs available for only 60-70% of anime tracks
- Full playback requires Spotify Premium + OAuth (not in scope for MVP)

## Goals / Non-Goals

### Goals
- Display album artwork for mapped songs (lazy-loaded)
- Enable preview playback (30-second clips) when available
- Cache Spotify Track IDs to avoid repeated API calls
- Support manual override for ambiguous matches
- Graceful fallback when tracks are not available
- Batch pre-mapping to minimize runtime API calls

### Non-Goals
- Full track playback (requires Premium + OAuth - deferred)
- Real-time audio analysis
- Spotify playlist integration
- User authentication with Spotify (Client Credentials only for MVP)
- Automatic re-mapping of existing songs (manual trigger only)

## Decisions

### Decision 1: Storage Strategy for Spotify Mappings

**Decision**: Add new Dexie table `spotifyMappings` (IndexedDB)

**Rationale**:
- Keeps Spotify data separate from core song data
- Allows easy clearing/re-mapping without affecting songs
- IndexedDB provides fast lookups
- No backend required (client-side only)

**Alternatives considered**:
- Extend Song interface with optional spotifyTrackId: Rejected - pollutes core data model
- Separate JSON file: Rejected - harder to query and update
- Backend database: Rejected - adds infrastructure complexity

### Decision 2: Matching Strategy

**Decision**: Hybrid approach - Persistent Mapping (Strategy D) + Year Filtering (Strategy B) + Fuzzy Matching (Strategy C)

**Rationale**:
- Persistent mapping eliminates 95%+ of runtime API calls
- Year filtering reduces false positives (remastered versions)
- Fuzzy matching handles typos and formatting inconsistencies
- Expected 75-85% automatic success rate

**Implementation**:
1. Batch pre-mapping on initialization (one-time)
2. Runtime cache lookup (fast path)
3. On-demand search for cache misses (fallback)
4. Manual override UI for ambiguous matches

### Decision 3: Preview Playback Implementation

**Decision**: HTML5 audio element with preview_url (no authentication required)

**Rationale**:
- Simplest implementation
- Works for all users (no login required)
- 30-second clips sufficient for preview
- Graceful fallback when preview_url unavailable

**Alternatives considered**:
- Spotify Embedded Player: Deferred - can add as enhancement later
- Web Playback SDK: Deferred - requires Premium + OAuth (out of scope)

### Decision 4: Batch Mapping Timing

**Decision**: On-demand batch mapping (manual trigger) + background job option

**Rationale**:
- Initial mapping can be slow (2000-3000 API calls)
- User should control when mapping runs
- Can run in background without blocking UI
- Weekly/monthly re-mapping can be added later

**Alternatives considered**:
- Automatic on app load: Rejected - slow initial load
- Always on-demand: Rejected - too many API calls at runtime

## Risks / Trade-offs

- **Ambiguous matches (15-25% of tracks)**: Mitigation - Confidence scoring + manual override UI
- **Missing tracks in Spotify (5-15% for anime)**: Mitigation - Flag unmapped songs, allow manual URL input
- **Rate limiting**: Mitigation - Batch pre-mapping + caching eliminates 95% of runtime calls
- **Preview URL unavailability (30-40%)**: Mitigation - Graceful fallback to Spotify link
- **Missing artist names (~20%)**: Mitigation - Title-only search (lower accuracy), flag for manual mapping

## Migration Plan

1. **Phase 1**: Add database schema (spotifyMappings table) - no data migration needed
2. **Phase 2**: Implement Spotify API service and mapping logic
3. **Phase 3**: Add UI components (artwork display, preview player)
4. **Phase 4**: Implement batch mapping service
5. **Phase 5**: Add manual override UI
6. **Rollback**: Remove spotifyMappings table, remove UI components, disable Spotify service

## Open Questions

- Should we support multiple market regions for regional availability?
- Should we cache image URLs with TTL or rely on Spotify CDN?
- Should batch mapping be automatic on first load or always manual?
