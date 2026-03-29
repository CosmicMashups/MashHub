# Fixed: Song Sections Not Displaying in Details Dialog

## Problem Identified
**Main page** showed correct number of sections with different keys/BPMs, but **Song Details dialog** showed only one section or none.

## Root Cause Analysis

### Critical Bug
`sectionService.getBySongId()` **ONLY queried IndexedDB**, never Supabase

### How the main page worked:
- Songs loaded via `songService.getAll()` include sections from Supabase
- Sections embedded in song objects: `song.sections`
- Main page displays these embedded sections correctly

### Why the dialog failed:
- Dialog uses `SectionStructure` component
- `SectionStructure` calls `useSections(songId)` hook
- `useSections` calls `sectionService.getBySongId(songId)`
- This ONLY queries IndexedDB, ignoring Supabase
- If sections not synced to IndexedDB, returns empty/partial data

## Fixes Applied

### 1. Created New Service with Fallback
**File**: `src/services/sectionService.ts` (NEW)
- `sectionServiceWithFallback.getBySongId()` - Queries Supabase first, falls back to IndexedDB
- Uses `withFallback()` pattern like `songService`
- Properly converts Supabase snake_case to camelCase
- Orders sections by `section_order`

### 2. Updated useSections Hook
**File**: `src/hooks/useSections.ts`
- Changed: `sectionService` → `sectionServiceWithFallback`
- Now queries Supabase when available
- Falls back to IndexedDB in offline mode

### 3. Added getAll() Method
**File**: `src/services/database.ts`
- Added `sectionService.getAll()` for completeness
- Required by the new fallback service

## How It Works Now

**When using Supabase**:
1. User opens Song Details dialog
2. `useSections(songId)` calls `sectionServiceWithFallback.getBySongId()`
3. Queries Supabase: `SELECT * FROM song_sections WHERE song_id = ? ORDER BY section_order`
4. Returns all sections directly from database
5. Displays correctly in dialog

**When offline (IndexedDB)**:
1. Falls back to local IndexedDB query
2. Returns cached sections
3. Works same as before

## Testing
1. Open any song in the main list that shows multiple sections
2. Click to open Song Details dialog
3. Should now show ALL sections with correct BPMs and keys
4. Works in both Supabase and offline modes

## Additional Benefits
✅ **Consistent with songService pattern** - all services now use fallback
✅ **Real-time data** - always fetches latest sections from Supabase
✅ **No sync issues** - doesn't rely on sections being cached in IndexedDB
✅ **Proper error handling** - gracefully falls back on failure

## Files Changed
- `src/services/sectionService.ts` - NEW service with Supabase support
- `src/hooks/useSections.ts` - Updated to use new service
- `src/services/database.ts` - Added getAll() method

**This was a critical bug affecting data consistency between list view and detail view!**
