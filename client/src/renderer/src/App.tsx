import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Row, Col, Card, Button, Alert } from 'react-bootstrap'
import Versions from './components/Versions'
import TaskManagement from './components/TaskManagement'
import UserManagement from './components/UserManagement'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import { useAuth } from './context/AuthContext'
import { LayoutDashboard } from 'lucide-react'

/* ── Dashboard View ─────────────────────────────────────────────── */
function DashboardView({
  theme,
  toggleTheme
}: {
  theme: 'dark' | 'light'
  toggleTheme: () => void
}): React.JSX.Element {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'tasks' | 'users' | 'dashboard'>('tasks')
  const [pingStatus, setPingStatus] = useState<string | null>(null)
  const isDark = theme === 'dark'

  const ipcHandle = (): void => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('ping')
      setPingStatus('Ping sent successfully via IPC!')
    } else {
      setPingStatus('Running in browser mode — IPC simulation active.')
    }
    setTimeout(() => setPingStatus(null), 3000)
  }

  return (
    <AppLayout
      theme={theme}
      toggleTheme={toggleTheme}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ── Alert Banner ─────────────────────────────────── */}
      {pingStatus && (
        <Alert
          variant="info"
          onClose={() => setPingStatus(null)}
          dismissible
          className="shadow-sm border-info mb-4"
          style={{ borderRadius: '12px' }}
        >
          {pingStatus}
        </Alert>
      )}

      {/* ── Page Content ─────────────────────────────────── */}
      {activeTab === 'tasks' ? (
        <TaskManagement theme={theme} />
      ) : activeTab === 'users' ? (
        <UserManagement theme={theme} />
      ) : (
        /* ── System Overview / Diagnostics Page ─────────── */
        <Row className="gy-4">
          {/* Main Welcome Card */}
          <Col lg={8}>
            <Card
              className={`h-100 ${isDark ? 'bg-transparent border-0' : 'bg-white border-0'}`}
              style={{
                borderRadius: '20px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0'}`,
                boxShadow: isDark
                  ? '0 4px 20px rgba(0,0,0,0.25)'
                  : '0 4px 20px rgba(15,23,42,0.06)'
              }}
            >
              <Card.Body className="p-5 d-flex flex-column justify-content-between">
                <div>
                  <div
                    className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
                    style={{
                      background: isDark
                        ? 'rgba(0,174,239,0.10)'
                        : 'rgba(0,119,182,0.06)',
                      border: `1px solid ${isDark ? 'rgba(0,174,239,0.20)' : 'rgba(0,119,182,0.15)'}`,
                      color: isDark ? '#00AEEF' : '#0077B6',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}
                  >
                    <LayoutDashboard size={12} />
                    System Overview
                  </div>

                  <h1
                    className="fw-bold mb-3"
                    style={{
                      fontSize: '1.9rem',
                      letterSpacing: '-0.5px',
                      color: isDark ? '#F1F5F9' : '#0F172A'
                    }}
                  >
                    Welcome to Viral Print Software
                  </h1>

                  <p
                    style={{
                      color: isDark ? '#94A3B8' : '#64748B',
                      fontSize: '0.95rem',
                      lineHeight: '1.7'
                    }}
                  >
                    A premium desktop application built with Electron, React, TypeScript, and
                    Bootstrap. The backend runs on Express, PostgreSQL, and Prisma ORM.
                  </p>
                </div>

                <div className="d-flex gap-3 mt-4 flex-wrap">
                  <Button
                    onClick={ipcHandle}
                    style={{
                      background: isDark
                        ? 'linear-gradient(135deg, #00AEEF, #00CFFF)'
                        : 'linear-gradient(135deg, #0077B6, #00AEEF)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 22px',
                      fontWeight: 700,
                      color: isDark ? '#05101F' : '#FFF',
                      boxShadow: isDark
                        ? '0 4px 14px rgba(0,174,239,0.30)'
                        : '0 4px 14px rgba(0,119,182,0.28)'
                    }}
                  >
                    Send IPC Ping
                  </Button>
                  <Button
                    variant="outline-secondary"
                    style={{ borderRadius: '10px', padding: '10px 22px', fontWeight: 600 }}
                    onClick={() => setActiveTab('tasks')}
                  >
                    Open Task Management →
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Diagnostics Card */}
          <Col lg={4}>
            <Card
              className={`h-100 ${isDark ? 'bg-transparent' : 'bg-white'}`}
              style={{
                borderRadius: '20px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0'}`,
                boxShadow: isDark
                  ? '0 4px 20px rgba(0,0,0,0.25)'
                  : '0 4px 20px rgba(15,23,42,0.06)'
              }}
            >
              <Card.Header
                style={{
                  background: 'transparent',
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0'}`,
                  padding: '16px 24px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  color: isDark ? '#64748B' : '#94A3B8'
                }}
              >
                System Diagnostics
              </Card.Header>
              <Card.Body className="p-4 d-flex flex-column justify-content-between">
                <div>
                  {[
                    { label: 'Database Engine', value: 'PostgreSQL (Prisma ORM)' },
                    { label: 'Backend Service', value: 'Express Server (Port 5000)' }
                  ].map((item) => (
                    <div key={item.label} className="mb-4">
                      <p
                        style={{
                          fontSize: '0.70rem',
                          fontWeight: 700,
                          letterSpacing: '0.8px',
                          textTransform: 'uppercase',
                          color: isDark ? '#475569' : '#94A3B8',
                          marginBottom: '6px'
                        }}
                      >
                        {item.label}
                      </p>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#10B981',
                            boxShadow: '0 0 6px rgba(16,185,129,0.7)',
                            animation: 'vpmPulse 2.5s infinite'
                          }}
                        />
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            color: isDark ? '#E2E8F0' : '#1E293B'
                          }}
                        >
                          {item.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0'}`,
                    paddingTop: '16px'
                  }}
                >
                  <Versions theme={theme} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </AppLayout>
  )
}

/* ── Root App ───────────────────────────────────────────────────── */
function App(): React.JSX.Element {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app_theme') as 'dark' | 'light') || 'light'
  })

  useEffect(() => {
    localStorage.setItem('app_theme', theme)
    // Keep body class minimal — layout handles theming via vpm-app-shell
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light'
  }, [theme])

  const toggleTheme = (): void => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={<DashboardView theme={theme} toggleTheme={toggleTheme} />}
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
