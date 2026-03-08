# Testing Guide

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Test Structure

- `__tests__/` - Component and service unit tests
- `integration.test.tsx` - Integration tests
- `e2e.test.ts` - End-to-end tests
- `testUtils.tsx` - Test utilities and mock data

## Writing Tests

### Component Tests
Test individual components in isolation with mocked dependencies.

### Service Tests
Test business logic and data processing functions.

### Integration Tests
Test component interactions and data flow.

### E2E Tests
Test complete user workflows in a real browser environment.

## Mock Data

Use `mockSongs` from `testUtils.tsx` for consistent test data across all tests.