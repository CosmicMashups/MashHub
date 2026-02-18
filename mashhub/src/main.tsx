import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { sectionService } from './services/database'

// Schedule orphan cleanup as a non-blocking background task after the first paint.
// This removes any songSections rows that reference deleted songs without blocking startup.
setTimeout(() => {
  sectionService.cleanOrphanedSections().then((count) => {
    if (count > 0) {
      console.info(`[DB cleanup] Removed ${count} orphaned section(s).`);
    }
  }).catch((err: unknown) => {
    console.warn('[DB cleanup] cleanOrphanedSections failed:', err);
  });
}, 3000);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
