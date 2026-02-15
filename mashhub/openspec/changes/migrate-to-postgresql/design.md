## Context

MashHub is a music library management system for DJs that currently operates as a single-page application using IndexedDB for local storage. The system manages songs with a section-based architecture where each song can have multiple sections with different BPM and key values. Data is loaded from CSV files (songs.csv and song_sections.csv) and stored locally in the browser.

The migration to PostgreSQL requires:
- Backend API server to handle database operations
- Database schema matching the current section-based data model
- CSV import functionality accessible via CLI and API
- Type-safe database access using Prisma ORM
- RESTful API design following industry standards

## Goals / Non-Goals

### Goals
- Replace IndexedDB with PostgreSQL as the primary data store
- Create a RESTful API backend for all database operations
- Maintain the existing section-based data model architecture
- Preserve all existing data relationships (songs → sections, projects → entries)
- Support CSV import via CLI script and API endpoint
- Provide type-safe database access through Prisma
- Enable future scalability and multi-user support

### Non-Goals
- Frontend API client implementation (separate phase)
- Authentication and authorization (future phase)
- Real-time synchronization (future phase)
- Data migration from existing IndexedDB instances (manual process)
- Caching layer implementation (future optimization)
- API documentation generation (future phase)

## Decisions

### Decision: Use Prisma ORM
**Rationale**: Prisma provides type-safe database access, automatic migration generation, and excellent TypeScript integration. It reduces boilerplate code and prevents common SQL injection vulnerabilities through parameterized queries.

**Alternatives considered**:
- TypeORM: More complex setup, less intuitive API
- Raw SQL with pg: Too much boilerplate, no type safety
- Sequelize: Less modern, weaker TypeScript support

### Decision: Express.js for Backend Framework
**Rationale**: Express is mature, well-documented, has extensive middleware ecosystem, and aligns with Node.js best practices. It provides flexibility for future enhancements.

**Alternatives considered**:
- Fastify: Faster but less ecosystem maturity
- NestJS: Over-engineered for initial phase
- Koa: Less middleware ecosystem

### Decision: PostgreSQL 15+ as Database
**Rationale**: PostgreSQL provides robust relational database features, excellent JSON support, full-text search capabilities, and strong data integrity guarantees. Version 15+ ensures access to recent performance improvements.

**Alternatives considered**:
- MySQL/MariaDB: Less advanced features, weaker JSON support
- SQLite: Not suitable for multi-user scenarios
- MongoDB: Relational model better fits current data structure

### Decision: Zod for Validation
**Rationale**: Zod provides runtime type validation, excellent TypeScript inference, and integrates well with Express. It ensures API request/response validation matches Prisma types.

**Alternatives considered**:
- Joi: Less TypeScript-friendly
- Yup: Less active development
- class-validator: More verbose, requires decorators

### Decision: Separate Backend Directory Structure
**Rationale**: Clear separation of concerns, independent deployment, and allows backend to scale independently. Follows standard Node.js project structure.

**Alternatives considered**:
- Monorepo with shared types: Adds complexity for initial phase
- Single directory: Mixes concerns, harder to maintain

### Decision: CLI Import Script
**Rationale**: Provides direct database access for bulk imports, useful for development and deployment. Complements API endpoint for different use cases.

**Alternatives considered**:
- API-only: Less flexible for automation and scripts
- Migration-based: Too complex for CSV import workflow

## Risks / Trade-offs

### Risk: Data Loss During Migration
**Mitigation**: Implement validation checks, transaction-based imports, and backup procedures. Provide clear rollback instructions.

### Risk: Performance Degradation
**Mitigation**: Create appropriate database indexes, use connection pooling, implement query optimization. Monitor query performance during development.

### Risk: Type Mismatches Between Frontend and Backend
**Mitigation**: Use Prisma-generated types, share type definitions, implement Zod validation to catch mismatches early.

### Risk: Breaking Changes to Frontend
**Mitigation**: This is a breaking change by design. Frontend migration will be handled in a separate phase with proper API client implementation.

### Trade-off: Initial Complexity vs. Future Scalability
**Decision**: Accept initial complexity of backend setup to enable future features like authentication, real-time updates, and multi-user support.

## Migration Plan

### Phase 1: Backend Setup (This Proposal)
1. Initialize backend project structure
2. Set up PostgreSQL database
3. Create Prisma schema matching current data model
4. Implement database connection and configuration
5. Create CSV import service and CLI script
6. Implement basic API endpoints for songs
7. Test CSV import and data integrity

### Phase 2: Frontend Integration (Future)
1. Create API client service
2. Replace Dexie calls with API calls
3. Update all hooks and services
4. Implement error handling and loading states
5. Add authentication if needed

### Phase 3: Data Migration (Future)
1. Export existing IndexedDB data
2. Transform to PostgreSQL format
3. Import via CLI script or API
4. Validate data integrity

### Rollback Plan
- Keep IndexedDB code in version control
- Database migrations are reversible via Prisma
- API versioning can support gradual migration

## Open Questions

- Should we support both IndexedDB and PostgreSQL during transition period? (Decision: No, clean break)
- What authentication mechanism will be used? (Deferred to future phase)
- How will we handle concurrent modifications? (Deferred to future phase)
- What is the deployment strategy for the backend? (Deferred to future phase)
