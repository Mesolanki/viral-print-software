/**
 * App.tsx — Root application component
 * Sets up routing and authentication guard.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

// ── Protected Route Guard ────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#080d1a',
          fontFamily: 'Inter, sans-serif',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '14px',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            border: '2px solid rgba(0,174,239,0.3)',
            borderTopColor: '#00AEEF',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        Loading…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// ── Public Route Guard (redirect if already logged in) ───────
function PublicRoute({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <></>

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// ── Router ───────────────────────────────────────────────────
function AppRouter(): React.JSX.Element {
  return (
    <Routes>
      {/* Default: redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Login — public only */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Dashboard — protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

// ── Root App ─────────────────────────────────────────────────
export default function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0F1729',
              color: '#fff',
              border: '1px solid rgba(0,174,239,0.2)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
            },
            success: {
              iconTheme: { primary: '#00AEEF', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ED1C24', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
