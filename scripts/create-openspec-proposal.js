const fs = require('fs');
const path = require('path');

// Proposal content
const proposalMd = `# Refactor Authentication to Selective Model

## Why

The application currently enforces authentication globally—every route including the home page, song library, search, and matching engine requires users to log in before accessing any functionality. This creates unnecessary friction for users who want to browse songs, use the matching engine, or explore features before committing to account creation.

Authentication should only be required when accessing features that persist user-specific data, specifically the Projects page and related project management functionality. This aligns with modern SaaS patterns where exploration is freely available and authentication is deferred until actual commitment (saving, creating persistent resources).

**Current Pain Points:**
- Users cannot browse the song library without creating an account
- Matching engine functionality is blocked by login requirement
- Increased bounce rate due to premature authentication friction
- Null session assumptions cause potential runtime errors
- Tight coupling between UI components and authentication state

## What Changes

### Breaking Changes
- **BREAKING**: Remove \`ProtectedRoute\` wrapper from \`/\` (home/app root)
- **BREAKING**: Remove global authentication requirement for song browsing
- **BREAKING**: Components must handle \`session === null\` gracefully

### New Capabilities
- Add selective route protection for \`/projects\` and \`/projects/:projectId\` only
- Create \`useRequireAuth()\` hook for reusable authentication guards
- Add conditional UI rendering based on authentication state
- Implement "Login to save" CTA for unauthenticated users
- Add authentication redirect with return URL preservation

### Modifications
- Refactor all components to null-safe session handling
- Update navbar to show context-appropriate auth state
- Implement lazy session fetching (avoid global session calls)
- Add route-level authentication guards instead of app-level
- Update project APIs to validate authenticated users server-side

### Removed Patterns
- Global \`ProtectedRoute\` wrapper on app root
- Forced redirects to \`/login\` at application startup
- Unsafe session destructuring without null checks
- Assumption that \`user\` or \`session\` always exists

## Impact

### Affected Capabilities
- **authentication** (new spec) - Selective authentication model
- **routing** (new spec) - Public vs protected route separation
- **project-management** (new spec) - Authentication requirements for project features
- **ui-components** (existing change conflicts) - Session-aware conditional rendering
- **navbar** (existing change conflicts) - Authentication-aware navigation

### Affected Code
**Core routing and auth:**
- \`src/main.tsx\` - Remove \`ProtectedRoute\` from \`/\`, keep on \`/projects\`
- \`src/components/ProtectedRoute.tsx\` - Enhance with return URL logic
- \`src/contexts/AuthContext.tsx\` - Add lazy initialization support
- \`src/components/AuthGuard.tsx\` - May become unnecessary

**Components requiring null-safety:**
- \`src/components/UserMenu.tsx\` - Already safe, no changes needed
- \`src/pages/App.tsx\` - Remove session dependencies
- Any component using \`session\` or \`user\` from context

**New files:**
- \`src/hooks/useRequireAuth.ts\` - Reusable auth guard hook
- \`src/components/LoginPrompt.tsx\` - CTA for unauthenticated users

**Backend/API:**
- Supabase RLS policies already enforce user-level isolation
- No backend changes required (validation via Row Level Security)

### Migration Path
1. Deploy changes atomically (single deployment)
2. No database migrations required
3. Existing sessions remain valid
4. Users already logged in: no disruption
5. Users logged out: can now access public features without login

### Risks
- **Session persistence**: Users may lose unsaved project work if they browse anonymously then log in (mitigation: persist draft state in localStorage with user association prompt)
- **Confusion**: Users may not realize login is needed for projects (mitigation: clear "Login to save" CTA)
- **Security**: Ensure project APIs validate authentication server-side (already handled by Supabase RLS)
- **Breaking change**: Any external links to \`/\` will no longer require auth (acceptable—intended behavior)

### Testing Requirements
1. Anonymous user can browse songs without login
2. Anonymous user can use matching engine
3. Anonymous user redirected to login when accessing \`/projects\`
4. Login preserves intended destination (redirect back to \`/projects\`)
5. No runtime errors when \`session === null\`
6. Navbar updates correctly based on auth state
7. Project creation requires valid session
8. Session-based features gracefully degrade when not authenticated

### Rollback Plan
- Revert commit and redeploy
- Re-wrap \`/\` with \`ProtectedRoute\` in \`main.tsx\`
- All users forced back to login-required flow
- No data loss risk
`;

const tasksMd = `# Implementation Tasks

## 1. Routing Infrastructure
- [ ] 1.1 Remove \`ProtectedRoute\` wrapper from \`/\` in \`src/main.tsx\` (line 54)
- [ ] 1.2 Keep \`ProtectedRoute\` on \`/projects\` route (line 56)
- [ ] 1.3 Keep \`ProtectedRoute\` on \`/projects/:projectId\` route (line 57)
- [ ] 1.4 Update \`ProtectedRoute.tsx\` to preserve return URL in redirect query param
- [ ] 1.5 Update \`LoginPage.tsx\` to read and redirect to \`?redirect=\` param after successful login

## 2. Authentication Guards
- [ ] 2.1 Create \`src/hooks/useRequireAuth.ts\` hook
- [ ] 2.2 Implement session check + redirect logic in hook
- [ ] 2.3 Export hook for use in protected pages/components
- [ ] 2.4 Add JSDoc documentation for hook usage

## 3. Auth Context Optimization
- [ ] 3.1 Review \`AuthContext.tsx\` session initialization
- [ ] 3.2 Ensure loading states don't block public page rendering
- [ ] 3.3 Consider lazy session fetching for performance (optional optimization)
- [ ] 3.4 Verify \`AuthGuard\` wrapper still serves purpose or can be removed

## 4. Component Null-Safety Audit
- [ ] 4.1 Search codebase for all \`session\` usage: \`grep -r "session" src/\`
- [ ] 4.2 Search for all \`user\` context usage: \`grep -r "user" src/\`
- [ ] 4.3 Audit \`App.tsx\` for session dependencies
- [ ] 4.4 Audit \`ProjectsPage.tsx\` for null-safe session access
- [ ] 4.5 Audit \`ProjectWorkspacePage.tsx\` for null-safe session access
- [ ] 4.6 Fix any unsafe destructuring patterns found

## 5. Navbar Authentication State
- [ ] 5.1 Update navbar to show "Login" button when \`session === null\`
- [ ] 5.2 Update navbar to show user avatar/menu when \`session !== null\`
- [ ] 5.3 Ensure "Projects" link visible but triggers redirect if not authenticated
- [ ] 5.4 Test navbar behavior in both authenticated and anonymous states

## 6. Login Prompt Component
- [ ] 6.1 Create \`src/components/LoginPrompt.tsx\` component
- [ ] 6.2 Add "Login to save projects" CTA with styling
- [ ] 6.3 Include "Sign up" link for new users
- [ ] 6.4 Export component for use in public pages

## 7. Conditional UI Rendering
- [ ] 7.1 Add \`LoginPrompt\` to song browsing UI when \`!session\`
- [ ] 7.2 Hide "Save to Project" buttons when \`!session\`
- [ ] 7.3 Show "Save to Project" buttons when \`session\` exists
- [ ] 7.4 Test graceful degradation of project-related features

## 8. API and Backend Validation
- [ ] 8.1 Verify Supabase RLS policies enforce user-level isolation on \`projects\` table
- [ ] 8.2 Verify project creation API requires authenticated user
- [ ] 8.3 Verify project update API validates user ownership
- [ ] 8.4 Add error handling for unauthorized API calls

## 9. Testing
- [ ] 9.1 Test anonymous browsing: home page, song library, search
- [ ] 9.2 Test anonymous matching engine usage
- [ ] 9.3 Test redirect to login when clicking "Projects" without auth
- [ ] 9.4 Test redirect back to \`/projects\` after successful login
- [ ] 9.5 Test no crashes with \`session === null\`
- [ ] 9.6 Test navbar updates correctly after login/logout
- [ ] 9.7 Test project creation requires authentication
- [ ] 9.8 Test project editing requires authentication and ownership

## 10. Documentation
- [ ] 10.1 Update README with authentication model explanation
- [ ] 10.2 Document public vs protected routes
- [ ] 10.3 Add code comments explaining auth guard usage
- [ ] 10.4 Document \`useRequireAuth\` hook API

## 11. Cleanup (Optional)
- [ ] 11.1 Evaluate if \`AuthGuard.tsx\` can be removed (if no longer serving purpose)
- [ ] 11.2 Remove any unused session checks from public pages
- [ ] 11.3 Consolidate auth logic if duplicated across components
`;

// Create directory structure
const basePath = 'openspec/changes/refactor-selective-authentication';
const dirs = [
  basePath,
  path.join(basePath, 'specs/authentication'),
  path.join(basePath, 'specs/routing'),
  path.join(basePath, 'specs/project-management')
];

dirs.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

// Write proposal and tasks
fs.writeFileSync(path.join(basePath, 'proposal.md'), proposalMd);
fs.writeFileSync(path.join(basePath, 'tasks.md'), tasksMd);

console.log('✓ Created OpenSpec proposal structure');
console.log('✓ Files: proposal.md, tasks.md');
console.log('✓ Ready for implementation');
