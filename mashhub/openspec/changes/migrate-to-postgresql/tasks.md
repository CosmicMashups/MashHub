## 1. Backend Project Initialization
- [x] 1.1 Create `backend/` directory structure
- [x] 1.2 Initialize npm project with `package.json`
- [x] 1.3 Install dependencies: express, @prisma/client, prisma, dotenv, cors, csv-parse, zod
- [x] 1.4 Install dev dependencies: typescript, @types/express, @types/node, @types/cors, ts-node, tsx, nodemon
- [x] 1.5 Create `backend/tsconfig.json` with TypeScript configuration
- [x] 1.6 Create `backend/.env` and `backend/.env.example` files
- [x] 1.7 Add npm scripts to `package.json`: dev, build, start, db:migrate, db:generate, db:studio, import:csv

## 2. Database Schema Setup
- [x] 2.1 Initialize Prisma with `npx prisma init`
- [x] 2.2 Create `backend/prisma/schema.prisma` with Song, SongSection, Project, ProjectEntry models
- [x] 2.3 Define all fields matching current data model (id, title, artist, type, origin, season, year, notes, etc.)
- [x] 2.4 Add foreign key relationships (Song → SongSection, Project → ProjectEntry, Song → ProjectEntry, SongSection → ProjectEntry)
- [x] 2.5 Add database indexes for performance (artist, type, year, bpm, key, compound indexes)
- [x] 2.6 Configure Prisma generator and datasource
- [ ] 2.7 Run initial migration: `npx prisma migrate dev --name init` (requires database setup)
- [ ] 2.8 Generate Prisma client: `npx prisma generate` (requires database setup)

## 3. Database Configuration
- [x] 3.1 Create `backend/src/config/database.ts` with Prisma client singleton
- [x] 3.2 Configure connection pooling and logging
- [ ] 3.3 Add environment variable validation for DATABASE_URL
- [ ] 3.4 Test database connection (requires database setup)

## 4. Type Definitions
- [x] 4.1 Create `backend/src/types/index.ts`
- [x] 4.2 Define SongCSVRow interface matching CSV structure
- [x] 4.3 Define SongSectionCSVRow interface matching CSV structure
- [x] 4.4 Define ParsedSong interface for processed data
- [x] 4.5 Define ParsedSongSection interface for processed data
- [x] 4.6 Export all types for use across backend

## 5. CSV Parsing Service
- [x] 5.1 Create `backend/src/services/csvService.ts`
- [x] 5.2 Implement `parseSongsCSV()` method to read and parse songs.csv
- [x] 5.3 Implement `parseSongSectionsCSV()` method to read and parse song_sections.csv
- [x] 5.4 Add data transformation logic (ID padding, type conversion, null handling)
- [x] 5.5 Implement `validateSections()` method to check for orphan sections
- [x] 5.6 Add error handling for malformed CSV data
- [x] 5.7 Add logging for parsing progress and errors

## 6. CSV Import Script
- [x] 6.1 Create `backend/scripts/import-csv.ts`
- [x] 6.2 Implement main import function with error handling
- [x] 6.3 Add CSV file path resolution (data/songs.csv, data/song_sections.csv)
- [x] 6.4 Integrate CSV parsing service
- [x] 6.5 Add validation step for orphan sections
- [x] 6.6 Implement database clearing logic (optional, with confirmation)
- [x] 6.7 Implement bulk insert using Prisma `createMany`
- [x] 6.8 Add import summary statistics (song count, section count, average sections per song)
- [x] 6.9 Add proper error handling and rollback on failure
- [ ] 6.10 Test import script with sample CSV files (requires database setup)

## 7. Express Server Setup
- [x] 7.1 Create `backend/src/server.ts`
- [x] 7.2 Configure Express app with CORS middleware
- [x] 7.3 Add JSON body parsing middleware
- [x] 7.4 Add error handling middleware
- [x] 7.5 Create health check endpoint (`GET /health`)
- [x] 7.6 Configure server port from environment variables
- [x] 7.7 Add server startup logging

## 8. Song Service Layer
- [x] 8.1 Create `backend/src/services/songService.ts`
- [x] 8.2 Implement `getAllSongs()` with sections included
- [x] 8.3 Implement `getSongById()` with sections included
- [x] 8.4 Implement `createSong()` with nested section creation
- [x] 8.5 Implement `updateSong()` with section update handling
- [x] 8.6 Implement `deleteSong()` with cascade delete
- [x] 8.7 Add proper error handling for all methods
- [ ] 8.8 Add input validation using Zod schemas (deferred - basic validation in place)

## 9. Song Controller
- [x] 9.1 Create `backend/src/controllers/songController.ts`
- [x] 9.2 Implement `getAllSongs()` controller method
- [x] 9.3 Implement `getSongById()` controller method
- [x] 9.4 Implement `createSong()` controller method
- [x] 9.5 Implement `updateSong()` controller method
- [x] 9.6 Implement `deleteSong()` controller method
- [x] 9.7 Add proper HTTP status codes and error responses
- [x] 9.8 Add request validation error handling

## 10. Song Routes
- [x] 10.1 Create `backend/src/routes/songRoutes.ts`
- [x] 10.2 Define GET `/api/songs` route
- [x] 10.3 Define GET `/api/songs/:id` route
- [x] 10.4 Define POST `/api/songs` route
- [x] 10.5 Define PUT `/api/songs/:id` route
- [x] 10.6 Define DELETE `/api/songs/:id` route
- [x] 10.7 Wire routes to controller methods
- [x] 10.8 Register routes in main server file

## 11. Import API Routes
- [x] 11.1 Create `backend/src/routes/importRoutes.ts`
- [x] 11.2 Create `backend/src/controllers/importController.ts`
- [x] 11.3 Implement POST `/api/import/csv` endpoint for file upload
- [x] 11.4 Add CSV file validation
- [x] 11.5 Integrate CSV service for parsing
- [x] 11.6 Add database import logic
- [x] 11.7 Return import results and statistics
- [x] 11.8 Add error handling for import failures

## 12. Data Directory Setup
- [x] 12.1 Create `data/` directory at project root
- [x] 12.2 Copy `songs.csv` to `data/songs.csv`
- [x] 12.3 Copy `song_sections.csv` to `data/song_sections.csv`
- [x] 12.4 Verify CSV file formats match expected schema
- [ ] 12.5 Add `.gitignore` entry if CSV files contain sensitive data (not needed - data files are version controlled)

## 13. Testing and Validation
- [ ] 13.1 Test database connection
- [ ] 13.2 Run CSV import script and verify data integrity
- [ ] 13.3 Test all API endpoints with curl or Postman
- [ ] 13.4 Verify foreign key relationships are maintained
- [ ] 13.5 Check for orphan sections in database
- [ ] 13.6 Verify indexes are created correctly
- [ ] 13.7 Test error handling for invalid requests
- [ ] 13.8 Validate data types match Prisma schema
- [ ] 13.9 Test bulk operations performance
- [ ] 13.10 Verify transaction rollback on errors

## 14. Documentation
- [ ] 14.1 Document database setup instructions
- [ ] 14.2 Document environment variable configuration
- [ ] 14.3 Document CSV import process
- [ ] 14.4 Document API endpoint usage
- [ ] 14.5 Add inline code comments for complex logic
