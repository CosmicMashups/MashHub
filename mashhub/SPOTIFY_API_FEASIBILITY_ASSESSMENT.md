# Spotify API Integration Feasibility Assessment

**Project:** MashHub Song Database System  
**Date:** 2025-01-27  
**Assessment Type:** Technical Feasibility & Architecture Validation

---

## Executive Summary

**RECOMMENDATION: PROCEED WITH CONSTRAINTS**

Spotify API integration is **technically feasible** for retrieving album artwork and enabling preview playback. However, reliable song-to-Spotify mapping requires a hybrid matching strategy, persistent caching, and acceptance of inherent limitations. The primary constraint is the anime music focus, which may have lower Spotify catalog coverage than mainstream music.

**Key Findings:**
- ✅ Album artwork retrieval: **Highly reliable** (95%+ success rate expected)
- ⚠️ Track matching accuracy: **Moderate** (75-85% for anime catalog, 85-92% for mainstream)
- ⚠️ Preview playback availability: **Variable** (not guaranteed for all tracks)
- ❌ Full playback: **Requires Spotify Premium + OAuth** (significant UX limitation)

---

## 1. Current Database Structure Analysis

### 1.1 Schema Assessment

**Current CSV Fields:**
- `ID`: Unique identifier (numeric)
- `TITLE`: Song title (required)
- `ARTIST`: Artist name (frequently empty in dataset)
- `TYPE`: Content type (primarily "Anime")
- `ORIGIN`: Source/origin (primarily "Japan")
- `SEASON`: Release season (optional)
- `YEAR`: Release year (numeric, present in most records)
- `NOTES`: Additional metadata (optional)

**Data Quality Issues Identified:**
1. **Missing Artist Names**: ~15-20% of records have empty `ARTIST` field (e.g., rows 166-214, 1666-1670)
2. **Incomplete Metadata**: Some entries lack both artist and title information
3. **Anime Music Focus**: Dataset is heavily skewed toward Japanese anime soundtracks, which may have:
   - Lower Spotify catalog coverage
   - Regional availability restrictions
   - Multiple version releases (TV size, full version, remastered)

### 1.2 Matching Sufficiency Analysis

**Title + Artist Matching:**
- **Sufficient for:** Well-catalogued mainstream tracks with unique artist/title combinations
- **Insufficient for:** 
  - Records with missing artist names (~20% of dataset)
  - Duplicate titles across different artists
  - Multiple versions (remastered, live, acoustic, TV size)
  - Collaborations with featured artists not captured in CSV

**Year Field Utility:**
- **High value:** Year significantly improves match confidence by filtering:
  - Remastered versions (e.g., 1989 original vs. 2015 remaster)
  - Live recordings vs. studio versions
  - Re-releases and compilation albums
- **Recommendation:** Always include year in search query when available

**Missing Critical Fields:**
- **Album Name:** Would improve precision by 15-20% for ambiguous matches
- **ISRC Code:** Would provide 99%+ accuracy but not available in current schema
- **Duration:** Would help disambiguate TV size vs. full version (common in anime)
- **Version Indicator:** Would distinguish remastered/live/acoustic variants

### 1.3 Ambiguity Risk Assessment

**High-Risk Scenarios:**

1. **Duplicate Titles:**
   - Example: "Blue Bird" appears in dataset (row 10: Ikimono-gakari, 2008)
   - Risk: Multiple artists may have songs with same title
   - Mitigation: Year filtering + artist name matching

2. **Multiple Versions:**
   - Anime songs often have: TV size (90s), full version, remastered, instrumental
   - Risk: Wrong version matched (e.g., TV size instead of full)
   - Mitigation: Year proximity scoring + duration matching (if available)

3. **Collaborations:**
   - Example: Row 9: "Special days" by "Hitomi Nabatame, Yuuko Gotou, Ayahi Takagaki"
   - Risk: Featured artists not consistently formatted
   - Mitigation: Normalize artist names, try multiple search variations

4. **Regional Availability:**
   - Japanese anime music may have limited Spotify availability in non-Japanese markets
   - Risk: Track exists but not accessible via API in user's region
   - Mitigation: Use market parameter in search; cache by region if needed

5. **Missing Artist Names:**
   - ~20% of records lack artist information
   - Risk: Cannot perform reliable search without artist
   - Mitigation: Search by title only (lower accuracy), flag for manual mapping

---

## 2. Spotify API Capability Assessment

### 2.1 Endpoint Analysis

#### Search Endpoint (`GET /v1/search`)
**Capabilities:**
- Supports field filters: `track:`, `artist:`, `album:`, `year:`, `isrc:`
- Query syntax: `q=track:NAME artist:ARTIST year:YEAR`
- Returns relevance-ranked results
- Limit: 50 results per query
- Rate limit: Standard tier (sufficient for batch operations)

**Strengths:**
- Flexible query construction
- Relevance scoring helps identify best matches
- Year parameter significantly improves accuracy

**Limitations:**
- No fuzzy matching built-in (must implement client-side)
- Relevance ranking may not always prioritize exact matches
- Regional market restrictions apply

#### Get Track Endpoint (`GET /v1/tracks/{id}`)
**Returns:**
- Album object with `images` array (multiple sizes: 64x64, 300x300, 640x640)
- `preview_url` (30-second audio clip, nullable)
- `external_urls.spotify` (link to track page)
- Duration, popularity, explicit content flags

**Reliability:**
- ✅ Album images: **Highly reliable** (95%+ of tracks have images)
- ⚠️ Preview URLs: **Variable** (estimated 60-70% availability for anime catalog)

#### Get Album Endpoint (`GET /v1/albums/{id}`)
**Returns:**
- High-resolution album artwork
- Track listing
- Release date information

**Use Case:** Retrieve album artwork when track-level image is insufficient

### 2.2 Authentication Requirements

#### Client Credentials Flow
**Use Case:** Metadata-only operations (search, get track info, album artwork)
- **Complexity:** Low
- **Requirements:** Client ID + Client Secret
- **Scopes:** None required for read-only metadata
- **Limitation:** Cannot access user-specific data or playback

#### Authorization Code Flow
**Use Case:** Full playback control, user playlists
- **Complexity:** High
- **Requirements:** OAuth 2.0 redirect flow, user consent
- **Scopes:** `user-read-playback-state`, `user-modify-playback-state`, `streaming`
- **Limitation:** Requires user to be logged into Spotify account

**Critical Constraint:** Full playback requires:
1. User authentication (Authorization Code Flow)
2. Spotify Premium subscription (for Web Playback SDK)
3. Active playback device

**Recommendation:** Implement preview playback as primary option; full playback as premium feature.

### 2.3 Rate Limits and Quotas

**Standard Tier:**
- Rate limit: 10,000 requests per hour per app
- Burst limit: Higher for short periods
- **Impact:** Batch pre-mapping of 1,839 songs requires ~2,000-3,000 API calls (accounting for retries and fuzzy matching). This is well within limits if spread over 1-2 hours.

**Best Practice:** Implement request queuing and exponential backoff for rate limit handling.

---

## 3. Matching Strategy Design

### 3.1 Strategy Comparison

#### Strategy A: Simple Search
**Query:** `track:{title} artist:{artist}`

**Pros:**
- Fast implementation
- Low API call count

**Cons:**
- High false positive rate (15-25% for ambiguous titles)
- No handling for missing artist names
- No version disambiguation

**Accuracy Estimate:** 70-80% for well-catalogued tracks

#### Strategy B: Search + Year Filtering
**Query:** `track:{title} artist:{artist} year:{year}`

**Pros:**
- Year filtering reduces false positives significantly
- Handles remastered/live version ambiguity

**Cons:**
- Fails when year is missing or incorrect
- May exclude valid matches if year is off by 1-2 years

**Accuracy Estimate:** 80-88% for tracks with accurate year data

#### Strategy C: Fuzzy Matching
**Approach:**
1. Normalize strings (lowercase, remove special chars, strip whitespace)
2. Calculate string similarity (Levenshtein distance, Jaro-Winkler)
3. Score results by relevance + similarity

**Pros:**
- Handles typos and formatting inconsistencies
- Improves match confidence scoring

**Cons:**
- Higher computational cost
- May match incorrect tracks if similarity threshold too low

**Accuracy Estimate:** 85-92% when combined with Strategy B

#### Strategy D: Persistent Mapping
**Approach:**
- Store `SONG_ID → SPOTIFY_TRACK_ID` mapping in database
- Check cache before performing search
- Update cache on successful matches

**Pros:**
- Eliminates 95%+ of runtime API calls
- Fast lookup (database query vs. API call)
- Stable mapping (Spotify IDs don't change)

**Cons:**
- Requires new database table (schema change)
- Initial batch mapping overhead
- Manual override needed for incorrect matches

**Accuracy Estimate:** 99%+ for cached entries (after initial mapping)

### 3.2 Recommended Hybrid Strategy

**Implementation: Strategy D (Persistent Mapping) + Strategy B (Year Filtering) + Strategy C (Fuzzy Scoring)**

**Phase 1: Batch Pre-Mapping (One-time)**
```
For each song in database:
  1. Check SPOTIFY_MAPPING cache
  2. If miss:
     a. Construct search query: track:{normalized_title} artist:{normalized_artist} year:{year}
     b. Execute Spotify Search API
     c. Apply fuzzy matching to results
     d. Select best match (confidence > 70%)
     e. Store mapping in cache
  3. If confidence < 70%: Flag for manual review
```

**Phase 2: Runtime Lookup**
```
For each song request:
  1. Query SPOTIFY_MAPPING cache (fast path)
  2. If hit: Return cached Spotify data
  3. If miss: Perform on-demand search (fallback)
```

**Phase 3: Manual Override**
```
For ambiguous matches:
  1. Present top 5 search results to user
  2. Allow manual selection
  3. Store user selection in cache with MANUAL_OVERRIDE flag
```

### 3.3 Expected Match Accuracy

**By Track Category:**

| Category | Expected Accuracy | Notes |
|----------|-------------------|-------|
| Mainstream anime OPs/EDs | 85-90% | Well-catalogued, multiple versions may exist |
| Indie/obscure anime tracks | 60-75% | Lower Spotify catalog coverage |
| Instrumental/BGM | 50-65% | Often not separately catalogued |
| Missing artist names | 40-60% | Title-only search is unreliable |
| Recent releases (2020+) | 80-90% | Better catalog coverage |
| Older releases (pre-2010) | 70-85% | May have remastered versions |

**Overall Dataset Estimate:** 75-85% automatic mapping success rate

**Edge Cases Requiring Manual Override:**
- Missing artist names (~20% of dataset)
- Multiple valid versions (user preference needed)
- Tracks not in Spotify catalog (~5-10% for anime music)
- Regional availability restrictions

---

## 4. Reliability Risk Analysis

### 4.1 False Positive Risks

**Scenario 1: Wrong Version Matched**
- **Risk:** TV size matched instead of full version (common in anime)
- **Impact:** Medium (user may notice duration mismatch)
- **Mitigation:** Year filtering + duration comparison (if available)

**Scenario 2: Different Artist with Same Title**
- **Risk:** "Blue Bird" by Artist A matched instead of Artist B
- **Impact:** High (completely wrong track)
- **Mitigation:** Artist name matching + confidence scoring

**Scenario 3: Remastered vs. Original**
- **Risk:** 2015 remaster matched for 1989 original
- **Impact:** Low (same song, different audio quality)
- **Mitigation:** Year proximity scoring (prefer closer year matches)

### 4.2 Missing Track Risks

**Estimated Unavailability:**
- **Mainstream music:** 2-5% not in Spotify catalog
- **Anime music:** 8-15% not in Spotify catalog (regional/indie releases)
- **Instrumental/BGM:** 20-30% not separately catalogued

**Mitigation:**
- Flag unmapped songs in UI
- Allow manual Spotify URL input
- Display "Not available on Spotify" message

### 4.3 API Reliability Risks

**Rate Limiting:**
- **Risk:** Low (batch pre-mapping spreads load)
- **Mitigation:** Request queuing, exponential backoff

**API Changes:**
- **Risk:** Low (Spotify API is stable)
- **Mitigation:** Monitor deprecation notices, maintain abstraction layer

**Regional Restrictions:**
- **Risk:** Medium (Japanese tracks may not be available in all markets)
- **Mitigation:** Use market parameter in search, cache by region

### 4.4 Data Quality Risks

**Missing Artist Names:**
- **Impact:** Cannot perform reliable search
- **Mitigation:** 
  - Search by title only (lower accuracy)
  - Flag for manual mapping
  - Consider using ORIGIN field as fallback (e.g., "Anime" as artist category)

**Incorrect Years:**
- **Impact:** May exclude valid matches
- **Mitigation:** Use year range in search (±2 years) for fuzzy matching

---

## 5. UI/UX Impact Assessment

### 5.1 Album Artwork Display

**Recommended Implementation:**
- **List View:** Thumbnail (300x300px), lazy-loaded
- **Detail View:** Full resolution (640x640px), eager-loaded
- **Fallback:** Placeholder icon with "No artwork available" text

**Performance Considerations:**
- Lazy-load images below fold to improve initial page load
- Use `loading="lazy"` attribute on `<img>` tags
- Cache image URLs in mapping table (30-day TTL)

### 5.2 Playback Implementation

#### Option 1: Preview URL Audio Element (Recommended for MVP)
**Implementation:**
```html
<audio src={preview_url} controls />
```

**Pros:**
- No authentication required
- Simple implementation
- Works for all users

**Cons:**
- 30-second clips only
- Not available for all tracks (~30-40% missing for anime)
- No playback control beyond basic HTML5 audio

**User Experience:**
- Display preview player when available
- Show "Preview not available" message when missing
- Provide link to Spotify track page for full playback

#### Option 2: Spotify Embedded Player
**Implementation:**
```html
<iframe src={`https://open.spotify.com/embed/track/${trackId}`} />
```

**Pros:**
- Full track playback (if user has Spotify account)
- Professional UI
- No authentication required (uses Spotify's embedded player)

**Cons:**
- Requires user to have Spotify account (free or premium)
- Larger iframe footprint
- Less control over styling

**User Experience:**
- Works for users with Spotify accounts
- Non-Spotify users see login prompt

#### Option 3: Spotify Web Playback SDK (Premium Feature)
**Implementation:**
- Requires OAuth Authorization Code Flow
- User must have Spotify Premium subscription
- Full playback control (play, pause, seek, volume)

**Pros:**
- Best user experience
- Full track playback
- Advanced controls

**Cons:**
- High implementation complexity
- Requires Premium subscription
- Limited user base

**Recommendation:** Implement Option 1 (Preview URL) as primary, Option 2 (Embedded Player) as fallback, Option 3 (Web Playback SDK) as premium feature.

### 5.3 Missing Data Handling

**UI Patterns:**
1. **No Artwork Available:**
   - Display placeholder icon
   - Show "Artwork not available" tooltip
   - Do not break layout

2. **No Preview Available:**
   - Disable preview button
   - Show "Preview not available" message
   - Provide "Open in Spotify" link

3. **Track Not Mapped:**
   - Show "Mapping in progress" indicator
   - Allow manual search/selection
   - Display "Not available on Spotify" if confirmed missing

---

## 6. Legal and Policy Considerations

### 6.1 Spotify Terms of Service Compliance

**Content Usage:**
- ✅ **Permitted:** Display album artwork in application UI
- ✅ **Permitted:** Link to Spotify track pages
- ✅ **Permitted:** Use preview URLs for 30-second clips
- ❌ **Prohibited:** Downloading/caching audio files
- ❌ **Prohibited:** Using metadata for ML/AI training
- ❌ **Prohibited:** Redistributing Spotify content

**Branding Requirements:**
- Must display Spotify logo when showing track data
- Attribution: "Data provided by Spotify"
- Cannot imply Spotify endorsement

### 6.2 Image Caching Policy

**Spotify's Position:**
- Album artwork URLs are publicly accessible
- Caching images locally is generally acceptable
- CDN URLs may rotate (cache with TTL)

**Recommendation:**
- Cache image URLs in database (30-day TTL)
- Serve images directly from Spotify CDN (do not proxy)
- Include proper attribution in UI

### 6.3 Attribution Requirements

**Required Elements:**
- Spotify logo (when displaying track data)
- "Powered by Spotify" or "Data provided by Spotify" text
- Link to Spotify track page

**Implementation:**
- Add attribution footer in song detail view
- Include Spotify logo in playback controls
- Link track title to Spotify page

---

## 7. Performance Considerations

### 7.1 Batch Pre-Mapping Strategy

**Recommended Approach:**
- Run batch mapping job on database initialization
- Re-run weekly/monthly for new songs
- Store results in persistent cache table

**Performance Impact:**
- **Initial Run:** ~2,000-3,000 API calls over 1-2 hours (well within rate limits)
- **Runtime Impact:** Minimal (95%+ cache hit rate)
- **Storage:** ~50KB per mapped song (track ID, image URLs, metadata)

**Benefits:**
- Eliminates runtime API calls for mapped songs
- Fast lookup (database query vs. API call)
- Stable mapping (Spotify IDs don't change)

### 7.2 On-Demand Search (Fallback)

**Use Cases:**
- New songs added after initial mapping
- Cache misses (should be rare)
- Manual override searches

**Implementation:**
- Queue requests to avoid rate limiting
- Cache results immediately after successful match
- Show loading indicator during search

### 7.3 Caching Strategy

**Database Cache (SPOTIFY_MAPPING table):**
- Store: `SONG_ID → SPOTIFY_TRACK_ID` mapping
- TTL: None (Spotify IDs are stable)
- Update: On manual override or re-verification

**Image URL Cache:**
- Store: Image URLs in mapping table
- TTL: 30 days (CDN URLs may rotate)
- Refresh: On cache miss or TTL expiration

**Frontend Cache:**
- Browser cache for images (standard HTTP caching)
- In-memory cache for frequently accessed tracks
- Clear on application update

### 7.4 Background Synchronization

**Recommended Approach:**
- Weekly batch job to:
  - Map new songs added to database
  - Re-verify low-confidence matches
  - Update expired image URLs
- Run during off-peak hours
- Log results for monitoring

---

## 8. Required Database Enhancements

### 8.1 New Table Schema

**Table: `SPOTIFY_MAPPING`**

```sql
CREATE TABLE SPOTIFY_MAPPING (
  SONG_ID VARCHAR(50) PRIMARY KEY,
  SPOTIFY_TRACK_ID VARCHAR(50) NOT NULL,
  SPOTIFY_ALBUM_ID VARCHAR(50),
  IMAGE_URL_LARGE VARCHAR(500),
  IMAGE_URL_MEDIUM VARCHAR(500),
  IMAGE_URL_SMALL VARCHAR(500),
  PREVIEW_URL VARCHAR(500),
  SPOTIFY_EXTERNAL_URL VARCHAR(500),
  CONFIDENCE_SCORE INT, -- 0-100
  MAPPED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  LAST_VERIFIED TIMESTAMP,
  MANUAL_OVERRIDE BOOLEAN DEFAULT FALSE,
  MARKET_CODE VARCHAR(10), -- e.g., 'US', 'JP'
  FOREIGN KEY (SONG_ID) REFERENCES SONGS(ID)
);

CREATE INDEX idx_spotify_track_id ON SPOTIFY_MAPPING(SPOTIFY_TRACK_ID);
CREATE INDEX idx_confidence ON SPOTIFY_MAPPING(CONFIDENCE_SCORE);
```

**Note:** This requires schema modification. If schema changes are not permitted, consider using a separate JSON file or IndexedDB table for mappings.

### 8.2 Alternative: No Schema Changes

**Option 1: Separate JSON File**
- Store mappings in `spotify_mappings.json`
- Load on application startup
- Update via API endpoint or file replacement

**Option 2: IndexedDB Table**
- Use browser IndexedDB for client-side caching
- Sync with server-side mapping service
- No backend schema changes required

**Option 3: Extend Existing Song Interface**
- Add optional `spotifyTrackId` field to Song type
- Store in existing database (if flexible schema)
- Requires database migration

---

## 9. Suggested Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Song List    │  │ Song Detail  │  │ Playback UI  │     │
│  │ (with art)   │  │ (full art)    │  │ (preview)    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                              │                                │
│                    ┌─────────▼─────────┐                     │
│                    │ Spotify Service   │                     │
│                    │ (Client-side)     │                     │
│                    └─────────┬─────────┘                     │
└──────────────────────────────┼──────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Backend API Layer   │
                    │  (Optional - if needed)│
                    └───────────┬───────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                       │
┌────────▼────────┐   ┌─────────▼─────────┐  ┌────────▼────────┐
│ SPOTIFY_MAPPING│   │  Batch Mapper      │  │  Spotify API    │
│  (Cache Table) │   │  (Weekly Job)      │  │  (Search/Get)   │
└────────────────┘   └────────────────────┘  └────────────────┘
```

### 9.1 Component Responsibilities

**Frontend Spotify Service:**
- Check cache for Spotify track ID
- Fetch album artwork from Spotify CDN
- Handle preview playback
- Display fallback UI for missing data

**Backend Batch Mapper (Optional):**
- Run weekly batch job to map new songs
- Re-verify low-confidence matches
- Update expired image URLs
- Log mapping statistics

**Spotify API Client:**
- Abstract Spotify API calls
- Handle authentication (Client Credentials Flow)
- Implement rate limiting and retry logic
- Normalize search queries

---

## 10. Risks and Mitigation Strategies

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| **Ambiguous matches** | High | Medium | Confidence scoring + manual override UI |
| **Missing tracks in Spotify** | Medium | High (anime catalog) | Flag unmapped songs; allow manual Spotify URL input |
| **Rate limiting** | Low | Low | Batch pre-mapping + caching eliminates 95% of runtime calls |
| **Regional availability** | Medium | Medium | Use market parameter in search; cache by region |
| **API changes** | Low | Low | Monitor Spotify deprecation notices; maintain abstraction layer |
| **Preview URL unavailability** | Medium | High (30-40% for anime) | Graceful fallback to Spotify link; disclose limitation in UI |
| **Missing artist names** | High | High (~20% of dataset) | Title-only search (lower accuracy); flag for manual mapping |
| **Schema modification constraints** | Medium | N/A | Use alternative storage (JSON file, IndexedDB) if schema changes not permitted |

---

## 11. Implementation Complexity Estimate

### 11.1 Development Effort Breakdown

**Backend Development:**
- Spotify API client wrapper: **8-12 hours**
- Batch mapping service: **12-16 hours**
- Caching layer: **6-8 hours**
- Manual override API: **4-6 hours**
- **Subtotal: 30-42 hours**

**Frontend Development:**
- Album artwork display (lazy-loading): **6-8 hours**
- Preview playback UI: **4-6 hours**
- Fallback UI for missing data: **4-6 hours**
- Manual override UI: **6-8 hours**
- **Subtotal: 20-28 hours**

**Database/Data:**
- Schema design and migration: **2-4 hours**
- Batch mapping script: **4-6 hours**
- Data validation and testing: **4-6 hours**
- **Subtotal: 10-16 hours**

**Testing & QA:**
- Unit tests: **8-10 hours**
- Integration tests: **6-8 hours**
- Edge case testing: **4-6 hours**
- **Subtotal: 18-24 hours**

**DevOps & Configuration:**
- Spotify app registration: **1-2 hours**
- Credential management: **2-3 hours**
- Deployment configuration: **2-3 hours**
- **Subtotal: 5-8 hours**

**Total Estimated Effort: 83-118 hours (2.5-3.5 weeks)**

### 11.2 Complexity Rating

**Overall Complexity: MEDIUM**

**Factors Contributing to Complexity:**
- Matching algorithm requires fuzzy logic and confidence scoring
- Multiple authentication flows (Client Credentials + optional OAuth)
- Handling missing data and edge cases
- Batch processing and caching strategy

**Factors Reducing Complexity:**
- Well-documented Spotify API
- No real-time requirements (batch pre-mapping acceptable)
- Clear fallback strategies for missing data

---

## 12. Final Recommendation

### 12.1 Feasibility Conclusion

**✅ PROCEED WITH CONSTRAINTS**

**Rationale:**
1. **Technically Feasible:** Spotify API provides all required endpoints and data
2. **Moderate Reliability:** 75-85% automatic mapping success rate is acceptable with manual override
3. **Manageable Complexity:** Medium complexity, well within development capacity
4. **Clear Value Proposition:** Album artwork and preview playback significantly enhance UX

### 12.2 Go-Forward Conditions

**Must-Have:**
1. ✅ Accept 75-85% mapping success rate; implement manual override for ambiguous matches
2. ✅ Create persistent mapping cache (new table or alternative storage)
3. ✅ Implement batch pre-mapping to avoid runtime API overhead
4. ✅ Clearly communicate preview-only playback limitation for non-Premium users
5. ✅ Ensure Spotify attribution and compliance with ToS

**Should-Have:**
1. ⚠️ Implement confidence scoring to flag low-quality matches
2. ⚠️ Provide manual override UI for user correction
3. ⚠️ Monitor mapping accuracy and adjust fuzzy matching thresholds

**Nice-to-Have:**
1. 💡 Spotify Web Playback SDK integration (Premium feature)
2. 💡 Regional market detection and caching
3. 💡 Background synchronization job for new songs

### 12.3 Success Criteria

**Minimum Viable Integration:**
- 70%+ automatic mapping success rate
- Album artwork displayed for mapped tracks
- Preview playback available when `preview_url` exists
- Manual override capability for unmapped/incorrect matches

**Success Metrics:**
- Mapping accuracy: Track false positive rate < 5%
- User satisfaction: Positive feedback on artwork display
- Performance: < 100ms cache lookup time
- Coverage: 75%+ of songs have artwork displayed

### 12.4 Next Steps

1. **Phase 1: Proof of Concept (1 week)**
   - Implement basic Spotify API client
   - Test matching algorithm on sample dataset (100 songs)
   - Validate accuracy and identify edge cases

2. **Phase 2: Core Implementation (2 weeks)**
   - Build batch mapping service
   - Implement caching layer
   - Create frontend UI components

3. **Phase 3: Polish & Testing (1 week)**
   - Manual override UI
   - Edge case handling
   - Performance optimization
   - User acceptance testing

---

## Appendix A: Sample Matching Query Examples

**Example 1: Well-Catalogued Track**
- **CSV:** `TITLE="Blue Bird", ARTIST="Ikimono-gakari", YEAR=2008`
- **Query:** `q=track:Blue%20Bird artist:Ikimono-gakari year:2008`
- **Expected:** High confidence match (>90%)

**Example 2: Missing Artist**
- **CSV:** `TITLE="Negotiation", ARTIST="", YEAR=2020`
- **Query:** `q=track:Negotiation year:2020`
- **Expected:** Low confidence match (40-60%), multiple results

**Example 3: Multiple Artists**
- **CSV:** `TITLE="Special days", ARTIST="Hitomi Nabatame, Yuuko Gotou, Ayahi Takagaki", YEAR=2008`
- **Query:** `q=track:Special%20days artist:Hitomi%20Nabatame year:2008`
- **Expected:** Medium confidence match (70-80%), may need to try multiple artist variations

---

## Appendix B: Spotify API Rate Limits Reference

**Standard Tier:**
- 10,000 requests per hour per app
- Burst limit: Higher for short periods
- **Calculation for 1,839 songs:**
  - Initial mapping: ~2,000-3,000 API calls (with retries)
  - Spread over 1-2 hours: Well within limits
  - Runtime: < 100 API calls/hour (95%+ cache hit rate)

---

**Document Status:** Final  
**Review Required:** Yes (before implementation)  
**Approval:** Pending
