# MashHub Backend API

Node.js/Express backend API for MashHub music library management system.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
# Using psql
psql -U postgres -c "CREATE DATABASE mashhub;"

# Or using createdb
createdb mashhub
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and update the `DATABASE_URL`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/mashhub?schema=public"
PORT=3001
NODE_ENV=development
```

### 4. Database Migration

Run Prisma migrations to create the database schema:

```bash
npm run db:migrate
```

This will:
- Create all database tables (songs, song_sections, projects, project_entries)
- Set up foreign key relationships
- Create indexes for performance

### 5. Generate Prisma Client

```bash
npm run db:generate
```

## CSV Import

### Import via CLI Script

Place CSV files in the `data/` directory at the project root:
- `data/songs.csv`
- `data/song_sections.csv`

Then run:

```bash
npm run import:csv
```

### Import via API

Start the server and make a POST request to `/api/import/csv`:

```bash
curl -X POST http://localhost:3001/api/import/csv
```

## Running the Server

### Development Mode

```bash
npm run dev
```

The server will start on port 3001 (or the port specified in `.env`).

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

```
GET /health
```

Returns server status and timestamp.

### Songs

- `GET /api/songs` - Get all songs with sections
- `GET /api/songs/:id` - Get song by ID
- `POST /api/songs` - Create new song
- `PUT /api/songs/:id` - Update song
- `DELETE /api/songs/:id` - Delete song

### Import

- `POST /api/import/csv` - Import CSV data from `data/` directory

## Database Schema

The database uses a section-based architecture:

- **songs**: Song metadata (id, title, artist, type, origin, season, year, notes)
- **song_sections**: Song sections with BPM/key variations (sectionId, songId, part, bpm, key, sectionOrder)
- **projects**: Project containers (id, name, createdAt)
- **project_entries**: Songs/sections in projects (id, projectId, songId, sectionId, sectionName, orderIndex)

## Development Tools

### Prisma Studio

View and edit database data in a GUI:

```bash
npm run db:studio
```

### TypeScript Compilation

```bash
npm run build
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   └── server.ts        # Express app entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── scripts/
│   └── import-csv.ts    # CSV import CLI script
└── package.json
```

## Notes

- The backend uses Prisma ORM for type-safe database access
- CSV import validates section references to prevent orphan sections
- All timestamps are automatically managed by Prisma
- Foreign key relationships enforce data integrity
