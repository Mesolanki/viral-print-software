import { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap'
import Versions from './components/Versions'
import TaskManagement from './components/TaskManagement'
import electronLogo from './assets/electron.svg'
import {
  CheckSquare,
  LayoutDashboard,
  Sun,
  Moon,
  Menu,
  ChevronLeft,
  Printer,
  Sparkles
} from 'lucide-react'

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'tasks' | 'dashboard'>('tasks')
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app_theme') as 'dark' | 'light') || 'dark'
  })
  const [pingStatus, setPingStatus] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem('app_theme', theme)
    document.body.className = theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'
  }, [theme])

  const toggleTheme = (): void => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const toggleSidebar = (): void => {
    setSidebarCollapsed((prev) => !prev)
  }

  const ipcHandle = (): void => {
    window.electron.ipcRenderer.send('ping')
    setPingStatus('Ping sent successfully via IPC!')
    setTimeout(() => setPingStatus(null), 3000)
  }

  const isDark = theme === 'dark'

  return (
    <div
      className={`d-flex min-vh-100 ${isDark ? 'bg-dark text-light' : 'bg-light text-dark'}`}
      style={{ fontFamily: "'Outfit', sans-serif", overflowX: 'hidden' }}
    >
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`d-flex flex-column justify-content-between p-3 border-end transition-all ${isDark ? 'bg-dark bg-opacity-95 border-secondary' : 'bg-white border-light-subtle shadow-sm'
          }`}
        style={{
          width: sidebarCollapsed ? '75px' : '260px',
          minWidth: sidebarCollapsed ? '75px' : '260px',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000
        }}
      >
        <div>
          {/* Brand Header */}
          <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-secondary">
            {!sidebarCollapsed ? (
              <div className="d-flex align-items-center gap-2 font-monospace fw-bold fs-6 text-truncate">
                <img alt="Logo" src={electronLogo} width="26" height="26" />
                <span className={isDark ? 'text-info' : 'text-primary'}>VIRAL PRINT</span>
              </div>
            ) : (
              <img alt="Logo" src={electronLogo} width="28" height="28" className="mx-auto" />
            )}

            <Button
              variant={isDark ? 'outline-secondary' : 'outline-dark'}
              size="sm"
              onClick={toggleSidebar}
              className="p-1 border-0 rounded-circle d-flex align-items-center justify-content-center"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
            </Button>
          </div>

          {/* Nav Items */}
          <nav className="d-flex flex-column gap-2">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 text-start border-0 transition-all ${activeTab === 'tasks'
                  ? isDark
                    ? 'bg-info text-dark fw-bold shadow-sm'
                    : 'bg-primary text-white fw-bold shadow-sm'
                  : isDark
                    ? 'bg-transparent text-light opacity-75 hover-opacity-100'
                    : 'bg-transparent text-dark opacity-75 hover-opacity-100'
                }`}
              title="To-Do & Task Management"
            >
              <CheckSquare size={20} className="flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-truncate fs-7">Tasks & To-Do</span>}
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 text-start border-0 transition-all ${activeTab === 'dashboard'
                  ? isDark
                    ? 'bg-info text-dark fw-bold shadow-sm'
                    : 'bg-primary text-white fw-bold shadow-sm'
                  : isDark
                    ? 'bg-transparent text-light opacity-75 hover-opacity-100'
                    : 'bg-transparent text-dark opacity-75 hover-opacity-100'
                }`}
              title="System Overview"
            >
              <LayoutDashboard size={20} className="flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-truncate fs-7">System Overview</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="d-flex flex-column gap-3 pt-3 border-top border-secondary">
          {/* Theme Switcher Button */}
          <Button
            variant={isDark ? 'outline-light' : 'outline-dark'}
            size="sm"
            onClick={toggleTheme}
            className={`d-flex align-items-center ${sidebarCollapsed ? 'justify-content-center px-0' : 'justify-content-between px-3'} py-2 rounded-pill shadow-sm border-0 ${isDark ? 'bg-secondary bg-opacity-25' : 'bg-light'}`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            <div className="d-flex align-items-center gap-2">
              {isDark ? <Sun size={16} className="text-warning" /> : <Moon size={16} className="text-primary" />}
              {!sidebarCollapsed && <span className="fs-7 font-monospace">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
            </div>
          </Button>

          {/* Connection Status */}
          {!sidebarCollapsed ? (
            <Badge bg="success" className="py-2 px-3 text-truncate shadow-sm d-flex align-items-center justify-content-center gap-1">
              <Printer size={14} /> Shop Server Active
            </Badge>
          ) : (
            <div className="rounded-circle bg-success mx-auto" style={{ width: '12px', height: '12px' }} title="Server Connected" />
          )}
        </div>
      </aside>

      {/* RIGHT MAIN DATA CONTENT AREA */}
      <main className="flex-grow-1 d-flex flex-column min-vh-100 overflow-auto">
        {/* Top Header Bar */}
        <header
          className={`d-flex align-items-center justify-content-between px-4 py-3 border-bottom ${isDark ? 'bg-dark bg-opacity-50 border-secondary' : 'bg-white border-light-subtle shadow-sm'
            }`}
        >
          <div className="d-flex align-items-center gap-3">
            <Button
              variant={isDark ? 'outline-secondary' : 'outline-dark'}
              size="sm"
              onClick={toggleSidebar}
              className="p-1.5 border-0 rounded-3"
            >
              <Menu size={18} />
            </Button>
            <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
              {activeTab === 'tasks' ? (
                <>
                  <CheckSquare size={18} className={isDark ? 'text-info' : 'text-primary'} />
                  <span>Task Management & Calendar Schedule</span>
                </>
              ) : (
                <>
                  <LayoutDashboard size={18} className={isDark ? 'text-info' : 'text-primary'} />
                  <span>System Diagnostics & Overview</span>
                </>
              )}
            </h5>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="fs-7 text-secondary font-monospace d-none d-md-inline">
              <Sparkles size={14} className="text-warning me-1" />
              Viral Print Shop Desktop
            </span>
          </div>
        </header>

        {/* Full-width Main Body */}
        <div className="p-3 p-md-4 flex-grow-1">
          {pingStatus && (
            <Alert variant="info" onClose={() => setPingStatus(null)} dismissible className="shadow-lg border-info mb-4">
              {pingStatus}
            </Alert>
          )}

          {activeTab === 'tasks' ? (
            <TaskManagement theme={theme} />
          ) : (
            <Row className="gy-4">
              {/* Main Hero Card */}
              <Col lg={8}>
                <Card className={`${isDark ? 'bg-secondary bg-opacity-25 border-secondary text-light' : 'bg-white border-light-subtle text-dark'} h-100 shadow-lg`}>
                  <Card.Body className="p-5 d-flex flex-column justify-content-between">
                    <div>
                      <h1 className={`display-5 fw-bold mb-3 ${isDark ? 'text-info' : 'text-primary'}`}>
                        Welcome to Viral Print Software
                      </h1>
                      <p className={`lead fs-5 ${isDark ? 'text-light opacity-75' : 'text-muted'}`}>
                        A premium desktop application built using Electron, React, TypeScript, and Bootstrap. The backend server runs with Express, PostgreSQL, and Prisma ORM.
                      </p>
                    </div>
                    <div className="d-flex gap-3 mt-4 flex-wrap">
                      <Button variant={isDark ? 'info' : 'primary'} size="lg" className={`px-4 py-2 ${isDark ? 'text-dark' : 'text-white'} fw-bold shadow-sm`} onClick={ipcHandle}>
                        Send IPC Ping
                      </Button>
                      <Button variant={isDark ? 'outline-info' : 'outline-primary'} size="lg" className="px-4 py-2" onClick={() => setActiveTab('tasks')}>
                        Go to Task Management
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* System Info Sidebar */}
              <Col lg={4}>
                <Card className={`${isDark ? 'bg-secondary bg-opacity-25 border-secondary text-light' : 'bg-white border-light-subtle text-dark'} h-100 shadow-lg`}>
                  <Card.Header className={`${isDark ? 'bg-dark bg-opacity-50 border-secondary text-secondary' : 'bg-light border-light-subtle text-muted'} py-3 fw-bold font-monospace text-uppercase`}>
                    System Diagnostics
                  </Card.Header>
                  <Card.Body className="p-4 d-flex flex-column justify-content-between">
                    <div>
                      <div className="mb-4">
                        <h6 className="text-secondary text-uppercase fs-7 fw-bold font-monospace">Database Engine</h6>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-success" style={{ width: '10px', height: '10px' }} />
                          <span className="fw-semibold">PostgreSQL (Prisma ORM)</span>
                        </div>
                      </div>
                      <div className="mb-4">
                        <h6 className="text-secondary text-uppercase fs-7 fw-bold font-monospace">Backend Service</h6>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-success" style={{ width: '10px', height: '10px' }} />
                          <span className="fw-semibold">Express Server (Port 3000)</span>
                        </div>
                      </div>
                    </div>
                    <div className={`border-top ${isDark ? 'border-secondary' : 'border-light-subtle'} pt-3`}>
                      <Versions />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
                    </Card.Body >
                  </Card >
                </Col >
              </Row >
            </div >
          )}
        </main >
      </div >
    </div >
  )
}

export default App
