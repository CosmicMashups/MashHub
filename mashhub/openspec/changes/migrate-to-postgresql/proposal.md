## Why

MashHub currently uses IndexedDB (Dexie.js) for local browser storage, which limits scalability, prevents multi-device synchronization, and restricts advanced querying capabilities. Migrating to PostgreSQL with a Node.js/Express backend API will enable centralized data management, support concurrent users, provide robust data integrity, and enable future features like authentication, real-time collaboration, and advanced analytics.

## What Changes

- **BREAKING**: Storage layer migration from IndexedDB (Dexie) to PostgreSQL database
- **BREAKING**: Frontend data access changes from direct IndexedDB calls to REST API calls
- New backend API server with Express.js and TypeScript
- PostgreSQL database schema with Prisma ORM for type safety
- CSV import functionality moved to backend with CLI script support
- RESTful API endpoints for songs, sections, projects, and project entries
- Database connection management and configuration
- Environment-based configuration for database and server settings
- Data validation using Zod schemas
- Migration scripts for initial database setup

## Impact

- Affected specs: database-storage (new), api-backend (new), data-import (modified), data-loading (modified), song-management (modified), project-management (modified)
- Affected code:
  - `src/services/database.ts` - Will be replaced with API client
  - `src/services/fileService.ts` - Import logic moves to backend
  - `src/data/animeDataLoader.ts` - CSV parsing moves to backend
  - `src/hooks/useSongs.ts` - Will use API calls instead of Dexie
  - All components using database directly - Will use API client
  - New backend directory structure with Express server
  - New Prisma schema and migrations
