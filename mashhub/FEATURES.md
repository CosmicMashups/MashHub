# MashHub Feature Documentation

## Overview

MashHub (also branded as MashFlow) is a comprehensive music library management system designed for DJs, music producers, and mashup creators. The system provides advanced song management, project organization, intelligent matching algorithms, and powerful search capabilities to help users organize and discover music for their creative projects.

## Core Features

### 1. Song Management

#### 1.1 Song Data Model
Each song in the system contains the following attributes:
- **ID**: Unique identifier (5-digit zero-padded string)
- **Title**: Song title
- **Artist**: Artist name
- **BPMs**: Array of BPM values (songs can have multiple BPMs)
- **Keys**: Array of musical keys (songs can have multiple keys)
- **Primary BPM**: Main BPM value (derived from bpms array)
- **Primary Key**: Main key value (derived from keys array)
- **Part**: Song part identifier
- **Type**: Song type/category
- **Origin**: Origin/source of the song
- **Year**: Release year
- **Season**: Season identifier
- **Vocal Status**: One of: `Vocal`, `Instrumental`, `Both`, or `Pending`

#### 1.2 Song CRUD Operations
- **Create**: Add new songs individually or in bulk
  - Automatic ID generation (incremental from existing max ID)
  - Validation of required fields
  - Support for multiple BPMs and keys per song
  
- **Read**: View songs in list format with detailed information
  - Song list with all metadata displayed
  - Song details modal for comprehensive view
  - Quick stats overview (total songs, vocal/instrumental/both counts)
  
- **Update**: Edit existing song information
  - In-place editing via modal
  - Update any song attribute
  - Real-time database synchronization
  
- **Delete**: Remove songs from the library
  - Confirmation prompts for safety
  - Automatic cleanup of project associations

#### 1.3 Song Import/Export
- **CSV Import**: Bulk import songs from CSV files
  - Automatic parsing of anime.csv format
  - Hash-based change detection for automatic refresh
  - Support for manual CSV file upload
  
- **Export Formats**:
  - **CSV Export**: Export all songs to CSV format
  - **XLSX Export**: Enhanced Excel export with:
    - Conditional formatting (vocal status color coding)
    - Alternating row colors
    - Frozen header rows
    - Auto-filters
    - Proper column widths
  - **JSON Export**: Export data in JSON format for backup/transfer

#### 1.4 CSV Data Loading
- Automatic initial load from `anime.csv` if database is empty
- Hash-based change detection to detect CSV updates
- Manual "Reload CSV" button for forced refresh
- Graceful error handling for missing or malformed CSV files

### 2. Project Management

#### 2.1 Project Structure
Projects are organizational containers for songs with the following features:
- **Project Properties**:
  - Unique ID (timestamp-based)
  - Name
  - Creation date
  - Sections (customizable organizational units)

#### 2.2 Section-Based Organization
- **Sections**: Projects can contain multiple named sections
  - Custom section names (e.g., "Intro", "Main Mix", "Outro")
  - Songs can be organized into different sections
  - Each section maintains its own song order
  
- **Song Ordering**: 
  - Drag-and-drop reordering within sections
  - Order index tracking for each song
  - Visual feedback during drag operations

#### 2.3 Project Operations
- **Create Projects**: Create new projects with custom names
- **Delete Projects**: Remove projects (with confirmation)
- **Add Songs to Projects**: 
  - Add songs to specific sections
  - Quick add from song list or search results
  - Support for adding to new sections on-the-fly
  
- **Remove Songs from Projects**: Remove songs from specific sections
- **Reorder Songs**: Drag-and-drop interface for reordering within sections
- **Project Export**: Export entire projects to XLSX format with:
  - Project information sheet
  - Songs organized by section with order
  - Formatted with headers and styling

#### 2.4 Enhanced Project Manager
- Visual project list with creation dates
- Section-based song organization
- Drag-and-drop song management
- In-project song search
- Quick section creation
- Project statistics display

### 3. Advanced Search

#### 3.1 Fuzzy Search (Fuse.js Integration)

Fuzzy logic was applied to the search system using the Fuse.js library to enable intelligent, typo-tolerant searching across multiple song metadata fields. This implementation allows users to find songs even when their search queries contain spelling errors, partial matches, or variations of the actual data.

**How Fuzzy Logic Was Applied:**

1. **Library Selection**: Fuse.js was chosen as the fuzzy search engine because it provides:
   - Fast in-memory searching with pre-built indexes
   - Configurable similarity thresholds
   - Multi-field search with weighted scoring
   - Extended search syntax support
   - Match highlighting capabilities

2. **Fuzzy Matching Algorithm Configuration**:
   The system uses the following Fuse.js configuration parameters to control fuzzy matching behavior:
   - **Threshold (0.6)**: Controls how similar a match must be to be considered valid
     - Range: 0.0 (exact match) to 1.0 (match anything)
     - 0.6 means matches must be at least 60% similar to the query
     - Higher values = more lenient matching (finds more results, including typos)
     - Lower values = stricter matching (fewer results, closer to exact match)
   
   - **Distance (100)**: Maximum character distance allowed for a match
     - Limits how far apart matching characters can be in the text
     - Prevents matches that are too scattered
   
   - **MinMatchCharLength (2)**: Minimum number of characters that must match
     - Prevents single-character matches that would be too broad
     - Ensures meaningful search results
   
   - **IgnoreLocation (true)**: Matches can occur anywhere in the field
     - "anime" will match "Japanese Anime Music" even though "anime" appears in the middle
     - Improves search flexibility
   
   - **FindAllMatches (true)**: Finds all possible matches, not just the first
     - Ensures comprehensive search results
   
   - **UseExtendedSearch (true)**: Enables advanced query syntax
     - Supports field-specific searches (e.g., "title:anime artist:japan")
     - Allows quoted phrases and boolean operators

3. **Multi-field Weighted Search**:
   The fuzzy search algorithm searches across multiple song fields simultaneously, with each field assigned a weight that determines its importance in the final match score:
   - **Title (40% weight)**: Highest priority - song titles are most important for identification
   - **Artist (30% weight)**: Second priority - artist names are key identifiers
   - **Type (15% weight)**: Medium priority - song type/category matching
   - **Origin (10% weight)**: Lower priority - origin/source information
   - **Part (5% weight)**: Lowest priority - part identifiers are least critical
   
   The weighted scoring system ensures that:
   - A match in the title field contributes more to the final score than a match in the part field
   - Results are ranked by relevance, with the most relevant matches appearing first
   - Users can find songs even if they only remember partial information

4. **Fuzzy Matching Process**:
   When a user enters a search query:
   1. The query is passed to the Fuse.js search engine
   2. Fuse.js calculates similarity scores for each song across all weighted fields
   3. The algorithm uses the Levenshtein distance algorithm to measure string similarity
   4. Scores are combined using the field weights to produce a final relevance score
   5. Results are sorted by score (best matches first)
   6. Only results above the threshold (0.6) are returned
   7. Match locations are identified for highlighting in the UI

5. **Integration with Search Service**:
   The fuzzy search is implemented in the `SearchService` class (`src/services/searchService.ts`):
   - The service initializes a Fuse.js instance with the song database
   - The index is rebuilt whenever songs are added, updated, or removed
   - Search methods provide different levels of functionality:
     - `search()`: Basic fuzzy search with optional result limiting
     - `searchAdvanced()`: Combines fuzzy search with additional filters (vocal status, year range, BPM, key)
     - `searchExtended()`: Supports field-specific queries using extended syntax
     - `getSuggestions()`: Generates search suggestions based on fuzzy matches
     - `getSearchStats()`: Provides statistics about search results (total count, average score, categories)

6. **Real-time Search Experience**:
   The fuzzy search is integrated into the `AdvancedSearchBar` component to provide:
   - **As-you-type searching**: Results update in real-time as the user types
   - **Debounced input**: Prevents excessive searches while typing (improves performance)
   - **Search suggestions**: Shows potential matches before the user finishes typing
   - **Match highlighting**: Visual indicators show which parts of the text matched
   - **Score display**: Users can see how relevant each result is

7. **Benefits of Fuzzy Logic Application**:
   - **Typo tolerance**: Users can find songs even with spelling mistakes
   - **Partial matching**: Finds results with incomplete queries
   - **Flexible searching**: Works with variations in capitalization, spacing, and word order
   - **Relevance ranking**: Most relevant results appear first
   - **Multi-field intelligence**: Searches across all relevant metadata simultaneously
   - **User-friendly**: Reduces frustration from exact-match requirements

**Search Features**:
  - Fuzzy matching with configurable threshold (0.6)
  - Extended search syntax support (e.g., "title:anime artist:japan")
  - Real-time search suggestions based on fuzzy matches
  - Search result scoring and ranking by relevance
  - Highlighted matches in results showing matched text
  - Integration with filter system for combined fuzzy search and filtering

#### 3.2 Advanced Search Bar
- Real-time search as you type
- Search suggestions dropdown
- Clear search functionality
- Integration with filter panel
- Visual search state indicators

#### 3.3 Search Results Display
- Formatted search results with match highlighting
- Quick actions from results (edit, delete, add to project)
- Search statistics (total results, average score)
- Category breakdown of results

### 4. Matching Service

#### 4.1 Match Criteria
The matching service supports filtering by:
- **BPM Matching**:
  - Target BPM with tolerance range
  - BPM range (min-max)
  - Harmonic BPM relationship detection
  
- **Key Matching**:
  - Target key with tolerance
  - Key range (start to end key)
  - Key compatibility checking
  - Linked key range support
  
- **Vocal Status**: Filter by Vocal, Instrumental, Both, or Pending
- **Type**: Filter by song type
- **Year Range**: Filter by release year range
- **Text Search**: Search in title, artist, part, origin, season
- **Artist**: Filter by artist name
- **Part**: Filter by part identifier
- **Origin**: Filter by origin
- **Season**: Filter by season

#### 4.2 Match Scoring
Songs are scored based on how well they match criteria:
- **BPM Score** (40% weight): Based on BPM compatibility
- **Key Score** (30% weight): Based on key compatibility
- **Vocal Status** (10% weight): Exact match bonus
- **Type** (10% weight): Type match bonus
- **Year** (5% weight): Year range match
- **Text Search** (5% weight): Title match

#### 4.3 Harmonic Matching
- **Harmonic BPM Relationships**: Detects songs with harmonically related BPMs
- **Key Compatibility**: Finds songs with compatible keys
- **Quick Matches**: Provides instant match suggestions for a target song
- **Match Reasons**: Explains why songs match (for transparency)

### 5. Filtering System

#### 5.1 Filter Panel
Comprehensive filter interface with:
- **BPM Filters**:
  - Target BPM input
  - BPM tolerance slider
  - BPM range selector
  
- **Key Filters**:
  - Target key selector
  - Key tolerance slider
  - Key range selector (start and end keys)
  
- **Vocal Status Filter**: Dropdown selection
- **Type Filter**: Text input with suggestions
- **Year Range Filter**: Min/max year inputs
- **Additional Filters**: Artist, part, origin, season

#### 5.2 Active Filters Display
- Visual display of currently active filters
- Filter tags showing applied criteria
- Quick clear all functionality
- Filter count indicators

#### 5.3 Filter Application
- Real-time filtering as criteria change
- Combined filter logic (AND conditions)
- Filter persistence during session
- Clear filters option

### 6. User Interface Features

#### 6.1 Theme System
- **Dark Mode**: Full dark theme support
- **Light Mode**: Clean light theme
- **Theme Toggle**: Quick switch between themes
- **Persistent Theme**: Theme preference saved in localStorage
- **Smooth Transitions**: Animated theme transitions

#### 6.2 Responsive Design
- **Mobile Support**: Mobile-optimized layout
- **Mobile Menu**: Collapsible menu for mobile devices
- **Responsive Grid**: Adaptive song list layout
- **Touch-Friendly**: Optimized for touch interactions

#### 6.3 Visual Feedback
- **Loading States**: Animated loading indicators
- **Error Handling**: User-friendly error messages
- **Success Feedback**: Visual confirmation of actions
- **Empty States**: Helpful messages when no data
- **Animations**: Smooth fade-in and slide animations

#### 6.4 Song Details Modal
Comprehensive song information display:
- All song metadata in organized layout
- Quick action buttons (edit, delete, add to project)
- Visual key and BPM indicators
- Related information display

### 7. Database & Storage

#### 7.1 IndexedDB (Dexie)
- **Local Storage**: All data stored locally in browser
- **Offline Support**: Full functionality without internet
- **Performance**: Fast queries with indexed fields
- **Schema Versioning**: Automatic database migrations

#### 7.2 Database Schema
- **Songs Table**: 
  - Indexed on: id, title, artist, type, year, vocalStatus, primaryBpm, primaryKey, origin, season, part
  - Compound indexes: [artist+type], [year+season]
  
- **Projects Table**:
  - Indexed on: id, name, createdAt
  
- **Project Entries Table**:
  - Indexed on: id, projectId, songId, sectionName, orderIndex
  - Compound index: [projectId+orderIndex]

#### 7.3 Data Services
- **Song Service**: CRUD operations for songs
- **Project Service**: CRUD operations for projects and project entries
- **Search Service**: Optimized search queries
- **Export Service**: Data export functionality

### 8. Drag and Drop

#### 8.1 Drag-and-Drop Framework (@dnd-kit)
- **Sortable Lists**: Drag to reorder songs in projects
- **Cross-Section Dragging**: Move songs between sections
- **Visual Feedback**: Drag preview and drop indicators
- **Touch Support**: Works on touch devices

#### 8.2 Drag Operations
- Reorder songs within project sections
- Move songs between sections
- Visual drag handles
- Drop zone highlighting

### 9. Import/Export Features

#### 9.1 Import Modal
- **CSV File Upload**: Drag-and-drop or file picker
- **Bulk Import**: Import multiple songs at once
- **Validation**: Error checking for malformed data
- **Progress Feedback**: Import status indicators

#### 9.2 Enhanced Export Modal
- **Export Options**:
  - Export all songs
  - Export filtered songs
  - Export specific projects
  - Export multiple projects
  
- **Format Selection**:
  - CSV format
  - XLSX format (enhanced)
  - JSON format
  
- **Customization**: Filename customization
- **Batch Export**: Export multiple items at once

### 10. Statistics & Analytics

#### 10.1 Library Overview
- Total song count
- Project count
- Vocal status breakdown:
  - Vocal songs count
  - Instrumental songs count
  - Both songs count
  
#### 10.2 Quick Stats
- Header statistics display
- Real-time counts
- Visual indicators

### 11. Error Handling & Edge Cases

#### 11.1 Error Boundaries
- React Error Boundary component
- Graceful error recovery
- User-friendly error messages

#### 11.2 Loading States
- Initial load handling
- Loading timeout (10 seconds)
- Fallback UI for slow loads
- Progress indicators

#### 11.3 Data Validation
- Input validation for song data
- CSV parsing error handling
- Database operation error handling
- User feedback for errors

### 12. Performance Optimizations

#### 12.1 Search Performance
- Fuse.js indexing for fast searches
- Debounced search input
- Result limiting for large datasets

#### 12.2 Database Performance
- Indexed queries for fast lookups
- Bulk operations for efficiency
- Lazy loading where appropriate

#### 12.3 UI Performance
- React memoization
- Optimized re-renders
- Virtual scrolling considerations

## Technical Stack

### Frontend
- **React 19.1.1**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations

### Libraries
- **Dexie 4.2.0**: IndexedDB wrapper
- **Fuse.js 7.1.0**: Fuzzy search
- **ExcelJS 4.4.0**: Excel export
- **@dnd-kit**: Drag and drop
- **Lucide React**: Icons

### Testing
- **Vitest**: Unit testing
- **Playwright**: E2E testing
- **Testing Library**: Component testing

## Data Flow

1. **Initial Load**: 
   - Check IndexedDB for existing songs
   - If empty, load from anime.csv
   - Store hash for change detection
   
2. **User Actions**:
   - Actions update IndexedDB
   - State updates trigger UI refresh
   - Optimistic updates for better UX
   
3. **Search/Filter**:
   - User input triggers search/filter
   - Results computed and displayed
   - Active filters maintained in state

## Future Considerations

While not currently implemented, the architecture supports:
- Cloud sync capabilities
- User authentication
- Collaborative projects
- Advanced analytics
- Playlist management
- Audio preview integration
- BPM/key detection from audio files

## Usage Patterns

### Typical Workflow
1. Import songs from CSV or add manually
2. Search/filter to find songs
3. Create projects for specific mixes
4. Add songs to project sections
5. Reorder songs within sections
6. Export projects for reference

### Power User Features
- Advanced matching for harmonic compatibility
- Bulk operations for efficiency
- Custom export formats
- Project templates
- Quick match suggestions

## Accessibility

- Keyboard navigation support
- Screen reader considerations
- High contrast mode support
- Focus management
- ARIA labels where appropriate

## Browser Compatibility

- Modern browsers with IndexedDB support
- Chrome, Firefox, Safari, Edge
- Mobile browser support
- Progressive Web App capabilities

---

*This documentation reflects the current state of MashHub as of the last update. Features may evolve over time.*
