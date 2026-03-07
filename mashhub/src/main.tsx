import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectWorkspacePage } from './pages/ProjectWorkspacePage'
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
      {/* Use Vite base as basename so routes work under /MashHub/ in dev and on GitHub Pages */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectWorkspacePage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
