import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectWorkspacePage } from './pages/ProjectWorkspacePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { AccountSettingsPage } from './pages/AccountSettingsPage'
import { AboutPage } from './pages/AboutPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BackendProvider } from './contexts/BackendContext'
import { AuthProvider } from './contexts/AuthContext'
import { AuthGuard } from './components/AuthGuard'
import { ProtectedRoute } from './components/ProtectedRoute'
import { sectionService } from './services/database'

// Apply saved theme (or default dark) before first paint so all routes see correct theme
// even when landing directly on /projects or /projects/:id (where App does not mount).
(function applyInitialTheme() {
  if (typeof document === 'undefined') return
  const saved = localStorage.getItem('theme')
  const isDark = saved !== 'light'
  document.documentElement.classList.toggle('dark', isDark)
  if (!saved) localStorage.setItem('theme', 'dark')
})()

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
      <BackendProvider>
        <AuthProvider>
          <AuthGuard>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/account" element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/" element={<App />} />
                <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
                <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectWorkspacePage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthGuard>
        </AuthProvider>
      </BackendProvider>
    </ErrorBoundary>
  </StrictMode>,
)
