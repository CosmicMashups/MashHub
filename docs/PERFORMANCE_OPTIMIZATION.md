# Performance Optimization for Large Dataset Loading

## Issue
Browser console shows React Scheduler violations:
```
[Violation] 'message' handler took 545-651ms
```

These warnings indicate that synchronous operations are blocking the main thread for too long during the initial 20k row database load.

## Root Cause
1. **Bulk insert operations** - Loading 20k songs + sections into IndexedDB
2. **CSV parsing** - Processing large CSV files synchronously
3. **Small batch sizes** - Original batch size of 100 meant 200 batch operations for 20k rows

## Optimizations Implemented

### 1. Increased Batch Size
**File**: `src/constants/index.ts`
- Changed `SONG_BULK_INSERT_BATCH_SIZE` from `100` to `500`
- Reduces number of batch operations from 200 to 40 for 20k rows
- Each batch still yields to the event loop, but fewer total yields

### 2. Added Batching to Section Inserts
**File**: `src/services/database.ts`
- Sections were being inserted all at once (no batching)
- Now uses 1000-item batches with event loop yielding
- Prevents long-running synchronous operations

### 3. Increased Loading Timeout
**Files**: `src/constants/index.ts`, `src/App.tsx`
- Timeout increased from 10s to 60s
- Gives sufficient time for large dataset initialization

## Performance Expectations

### Before Optimization:
- 200 batches × 100 songs = blocking operations every 100 songs
- Sections loaded in single operation (all 80k+ sections at once)
- React Scheduler violations: 500-650ms

### After Optimization:
- 40 batches × 500 songs = fewer context switches
- Sections batched in 1000-item chunks with yielding
- Expected violations reduced to <300ms or eliminated

## Additional Recommendations

### For Even Better Performance:

#### 1. Web Worker for CSV Parsing
Move CSV parsing off the main thread:
```typescript
// Create worker: src/workers/csvParser.worker.ts
self.onmessage = (e) => {
  const { csvText } = e.data;
  const songs = parseCSVSync(csvText);
  self.postMessage(songs);
};
```

#### 2. IndexedDB Cursor Pagination
Instead of loading all 20k songs at once:
```typescript
// Load in pages
const PAGE_SIZE = 1000;
let allSongs = [];
for (let i = 0; i < totalCount; i += PAGE_SIZE) {
  const page = await db.songs.offset(i).limit(PAGE_SIZE).toArray();
  allSongs.push(...page);
  await new Promise(r => setTimeout(r, 0)); // yield
}
```

#### 3. Virtual Scrolling
Only render visible items in the song list:
- Use `react-window` or `react-virtual`
- Render only 50-100 visible items instead of all 20k
- Dramatically reduces initial render time

#### 4. Lazy State Initialization
Don't load all songs into React state immediately:
```typescript
// Instead of: const [songs, setSongs] = useState<Song[]>([]);
// Use: const [songCount, setSongCount] = useState(0);
// Query from IndexedDB as needed
```

#### 5. Service Worker Pre-caching
Pre-cache CSV files during install:
```typescript
// In service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('csv-cache').then(cache => {
      return cache.addAll(['/assets/songs.csv', '/assets/sections.csv']);
    })
  );
});
```

## Testing Performance

### Check Browser DevTools:
1. Open DevTools → Performance tab
2. Start recording
3. Reload the page
4. Stop recording after load completes

### Look for:
- ✅ **Long Tasks** should be <50ms each
- ✅ **Total blocking time** should be <300ms
- ✅ **Time to Interactive** should be <3s

### Current Status:
- Loading timeout: 60 seconds (sufficient for 20k rows)
- Batch size: 500 songs (optimized)
- Section batching: 1000 sections (optimized)
- Expected load time: 5-15 seconds depending on device

## What the Violations Mean

React Scheduler violations are **warnings**, not errors:
- They indicate the UI thread was blocked
- User interaction may feel laggy during loading
- Doesn't break functionality
- Can be minimized with the optimizations above

### Normal vs Concerning:
- **Normal**: 200-400ms violations during initial load
- **Concerning**: 500ms+ violations or violations during normal use
- **Critical**: >1000ms violations or app unresponsive

## Monitoring

To track performance improvements:
```javascript
// Add to App.tsx
console.time('Database Load');
await loadSongs();
console.timeEnd('Database Load'); // Should be <15s for 20k rows
```

## Next Steps

1. **Test the current optimizations** - Reload app and check console
2. **Measure improvement** - Compare violation times before/after
3. **If still slow**, implement Web Worker parsing
4. **For production**, consider virtual scrolling for large lists

## References
- React Scheduler: https://react.dev/reference/react/Scheduler
- IndexedDB Performance: https://dexie.org/docs/Tutorial/Performance
- Web Workers: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
