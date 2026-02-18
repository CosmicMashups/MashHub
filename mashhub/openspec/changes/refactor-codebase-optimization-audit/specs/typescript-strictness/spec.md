## ADDED Requirements

### Requirement: TypeScript Strict Mode Enforcement
The codebase SHALL compile with `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`, `noImplicitOverride: true`, and `forceConsistentCasingInFileNames: true` enabled in `tsconfig.json`, with zero TypeScript errors.

#### Scenario: Build passes with strict flags
- **WHEN** `tsc --noEmit` is run after enabling all strict compiler flags
- **THEN** the command exits with code 0 and prints no errors or warnings

#### Scenario: Array index access is type-safe
- **WHEN** code accesses `songs[0]` or `sections[index]` after enabling `noUncheckedIndexedAccess`
- **THEN** TypeScript infers the type as `Song | undefined` (not `Song`), forcing a null-check before use

### Requirement: Elimination of Implicit Any Types
Every TypeScript file in `src/` SHALL have zero occurrences of implicit or explicit `any`. All function parameters, return types, and variable declarations SHALL use precise types, generics, or discriminated unions.

#### Scenario: No any in service layer
- **WHEN** ESLint rule `@typescript-eslint/no-explicit-any: error` is run against `src/services/`
- **THEN** zero lint errors are reported

#### Scenario: Dexie table generics are explicit
- **WHEN** `src/services/database.ts` is read
- **THEN** every `Table` declaration includes both the row type and key type generic parameters (e.g., `Table<Song, string>`)

### Requirement: Centralized Constants File
All magic numbers and string literals used for configuration SHALL be extracted to `/src/constants/index.ts` and imported by name throughout the codebase.

#### Scenario: Fuse.js configuration references constants
- **WHEN** `src/services/searchService.ts` is read
- **THEN** `threshold`, `distance`, and `minMatchCharLength` reference named constants from `/src/constants/index.ts` rather than inline literals

#### Scenario: Match scoring weights reference constants
- **WHEN** `src/services/matchingService.ts` is read
- **THEN** the BPM weight (0.4/0.45), key weight (0.3/0.45), and other scoring fractions reference named constants

### Requirement: ReadOnly Data Types on Service Outputs
Domain objects returned by service layer functions SHALL use `Readonly<T>` or `ReadonlyArray<T>` to prevent accidental mutation at call sites.

#### Scenario: Song list is immutable at call site
- **WHEN** a component receives the result of `songService.getAll()`
- **THEN** TypeScript prevents direct mutation (e.g., `songs.push(...)` or `song.title = 'x'`) without a type assertion
