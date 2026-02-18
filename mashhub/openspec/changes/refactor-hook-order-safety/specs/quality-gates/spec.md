## ADDED Requirements

### Requirement: Hook Safety Linting Gate
The repository SHALL enforce hook safety using ESLint with `eslint-plugin-react-hooks` such that hook-order violations are detected before merge.

#### Scenario: Rules-of-hooks failures are blocking
- **WHEN** a developer introduces a Rules of Hooks violation (e.g., conditional hook call, hook after early return)
- **THEN** `npm run lint` SHALL fail, and the violation SHALL be treated as an error

#### Scenario: Dependency correctness is visible
- **WHEN** a developer introduces a missing dependency in a hook dependency array
- **THEN** the lint configuration SHALL surface `react-hooks/exhaustive-deps` feedback (warn or error) so it can be addressed during review

### Requirement: Continuous Integration Quality Gate
The project SHALL run automated checks on pull requests to prevent hook-order regressions and related runtime hazards.

#### Scenario: PR quality gate
- **WHEN** a pull request is opened or updated
- **THEN** CI SHALL run, at minimum:
  - `npm ci`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`

