import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import LandingPage from './pages/LandingPage'

const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'))

function RouteEffects() {
  const { pathname, key } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.title = pathname === '/app' ? 'Workspace — NeuroGraph' : 'NeuroGraph — The Idea-Collision Engine'
    if (!document.querySelector('dialog[open]')) document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [pathname, key])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[110] -translate-y-24 rounded-lg bg-bronze px-4 py-3 text-sm font-semibold text-void focus:translate-y-0"
        >
          Skip to content
        </a>
        <Suspense
          fallback={
            <div role="status" className="grid min-h-dvh place-items-center bg-void font-mono text-xs text-bronze/80">
              Opening your workspace…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<DashboardLayout />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <RouteEffects />
        </Suspense>
      </MotionConfig>
    </BrowserRouter>
  )
}
