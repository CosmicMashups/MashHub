## ADDED Requirements

### Requirement: PostgreSQL Database Storage
The system SHALL use PostgreSQL as the primary data storage backend, replacing IndexedDB local storage. The database SHALL maintain the section-based data model with songs, song sections, projects, and project entries.

#### Scenario: Database connection established
- **WHEN** the backend server starts
- **THEN** a connection to PostgreSQL database is established using Prisma client
- **AND** connection errors are logged appropriately

#### Scenario: Database schema matches data model
- **WHEN** Prisma migrations are run
- **THEN** the database schema includes tables for songs, song_sections, projects, and project_entries
- **AND** all foreign key relationships are properly defined
- **AND** all required indexes are created for performance

### Requirement: Prisma ORM Integration
The system SHALL use Prisma ORM for type-safe database access, automatic migration generation, and query building.

#### Scenario: Prisma client generated
- **WHEN** `npx prisma generate` is executed
- **THEN** TypeScript types are generated from the Prisma schema
- **AND** the Prisma client is available for database operations

#### Scenario: Database queries are type-safe
- **WHEN** database queries are executed using Prisma client
- **THEN** TypeScript compiler validates query syntax and return types
- **AND** type errors are caught at compile time

### Requirement: Database Configuration
The system SHALL support environment-based database configuration with connection string, logging, and connection pooling.

#### Scenario: Database URL from environment
- **WHEN** the backend server starts
- **THEN** the DATABASE_URL environment variable is read
- **AND** the Prisma client is configured with the connection string
- **AND** missing or invalid DATABASE_URL results in a startup error

#### Scenario: Development logging enabled
- **WHEN** NODE_ENV is set to "development"
- **THEN** Prisma query logging is enabled
- **AND** database queries are logged to console

### Requirement: Database Migrations
The system SHALL support versioned database schema migrations using Prisma Migrate.

#### Scenario: Initial migration creates schema
- **WHEN** `npx prisma migrate dev --name init` is executed
- **THEN** all database tables are created according to the Prisma schema
- **AND** indexes and foreign keys are properly configured
- **AND** migration files are generated in `prisma/migrations/`

#### Scenario: Migration rollback
- **WHEN** a migration needs to be rolled back
- **THEN** Prisma provides mechanisms to revert schema changes
- **AND** data integrity is maintained during rollback

### Requirement: Data Integrity Constraints
The database SHALL enforce referential integrity through foreign key constraints and cascade delete rules.

#### Scenario: Song deletion cascades to sections
- **WHEN** a song is deleted from the database
- **THEN** all associated song sections are automatically deleted (CASCADE)
- **AND** all project entries referencing the song are handled according to cascade rules

#### Scenario: Orphan section prevention
- **WHEN** an attempt is made to create a song section with invalid songId
- **THEN** the database rejects the operation due to foreign key constraint
- **AND** an appropriate error is returned

### Requirement: Database Indexes
The database SHALL maintain indexes on frequently queried columns for optimal query performance.

#### Scenario: Indexes created on key columns
- **WHEN** the database schema is initialized
- **THEN** indexes are created on artist, type, year, bpm, and key columns
- **AND** compound indexes are created for common query patterns (e.g., [songId+bpm], [songId+key])

#### Scenario: Query performance optimization
- **WHEN** queries filter by indexed columns
- **THEN** the database uses indexes to optimize query execution
- **AND** query response times are acceptable for large datasets
