import { useState } from 'react'
import { Container, Row, Col, Card, Button, Navbar, Badge, Alert } from 'react-bootstrap'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App(): React.JSX.Element {
  const [pingStatus, setPingStatus] = useState<string | null>(null)

  const ipcHandle = (): void => {
    window.electron.ipcRenderer.send('ping')
    setPingStatus('Ping sent successfully via IPC!')
    setTimeout(() => setPingStatus(null), 3000)
  }

  return (
    <div className="bg-dark text-light min-vh-100 pb-5" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Navbar bg="dark" variant="dark" className="border-bottom border-secondary mb-4 px-4 py-3">
        <Navbar.Brand href="#home" className="d-flex align-items-center gap-2 font-monospace fw-bold">
          <img
            alt="Electron Logo"
            src={electronLogo}
            width="30"
            height="30"
            className="d-inline-block align-top"
          />{' '}
          VIRAL PRINT SOFTWARE
        </Navbar.Brand>
        <div className="ms-auto">
          <Badge bg="success" className="px-3 py-2 fs-6 shadow-sm">
            Client Connected
          </Badge>
        </div>
      </Navbar>

      <Container>
        {pingStatus && (
          <Alert variant="info" onClose={() => setPingStatus(null)} dismissible className="shadow-lg border-info">
            {pingStatus}
          </Alert>
        )}

        <Row className="gy-4">
          {/* Main Hero Card */}
          <Col lg={8}>
            <Card className="bg-secondary bg-opacity-25 border-secondary text-light h-100 shadow-lg">
              <Card.Body className="p-5 d-flex flex-column justify-content-between">
                <div>
                  <h1 className="display-5 fw-bold mb-3 text-info">
                    Welcome to Viral Print Software
                  </h1>
                  <p className="lead text-light fs-5 opacity-75">
                    A premium desktop application built using Electron, React, TypeScript, and Bootstrap. The backend server runs with Express, PostgreSQL, and Prisma ORM.
                  </p>
                </div>
                <div className="d-flex gap-3 mt-4 flex-wrap">
                  <Button variant="info" size="lg" className="px-4 py-2 text-dark fw-bold shadow-sm" onClick={ipcHandle}>
                    Send IPC Ping
                  </Button>
                  <a href="https://electron-vite.org/" target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-lg px-4 py-2">
                    Documentation
                  </a>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* System Info Sidebar */}
          <Col lg={4}>
            <Card className="bg-secondary bg-opacity-25 border-secondary text-light h-100 shadow-lg">
              <Card.Header className="bg-dark bg-opacity-50 border-secondary py-3 fw-bold font-monospace text-uppercase text-secondary">
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
                <div className="border-top border-secondary pt-3">
                  <Versions />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default App
