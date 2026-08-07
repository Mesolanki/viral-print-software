import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Badge, Button, Table } from 'react-bootstrap'
import {
  TrendingUp,
  AlertCircle,
  FileText,
  CheckSquare,
  ShoppingCart,
  Receipt,
  ArrowUpRight,
  HardDrive
} from 'lucide-react'
import { DataService, Invoice, TaskItem, Purchase } from '../services/dataService'
import type { ActiveTabType } from './layout/AppLayout'

interface DashboardOverviewProps {
  theme: 'dark' | 'light'
  onNavigate: (tab: ActiveTabType) => void
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ theme, onNavigate }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const isDark = theme === 'dark'

  useEffect(() => {
    setInvoices(DataService.getInvoices())
    setTasks(DataService.getTasks())
    setPurchases(DataService.getPurchases())
  }, [])

  // Today's Date String
  const todayStr = new Date().toISOString().split('T')[0]

  // Stats Calculations
  const todaysSales = invoices
    .filter(i => i.date === todayStr || i.created_at === todayStr)
    .reduce((sum, i) => sum + i.grand_total, 0)

  const totalSales = invoices.reduce((sum, i) => sum + i.grand_total, 0)
  const totalOutstanding = invoices.reduce((sum, i) => sum + i.balance_amount, 0)
  const pendingPaymentsCount = invoices.filter(i => i.status !== 'PAID').length
  const todaysTasks = tasks.filter(t => t.due_date === todayStr || t.start_date === todayStr || t.status === 'PENDING')
  const totalPurchaseAmount = purchases.reduce((sum, p) => sum + p.total_amount, 0)

  return (
    <div className="vpm-dashboard-overview">
      {/* ── Top Header Banner ─────────────────────────────────── */}
      <div
        className="p-4 mb-4 rounded-4 text-white d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center shadow-sm"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
            : 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none'
        }}
      >
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-white text-dark fw-bold px-2 py-1 uppercase" style={{ fontSize: '0.7rem' }}>
              OFFLINE LAN SYSTEM
            </span>
            <span className="text-white-50 small">Viral Print Media Management</span>
          </div>
          <h2 className="fw-bold m-0" style={{ letterSpacing: '-0.5px' }}>
            Business Performance Dashboard
          </h2>
        </div>

        <div className="d-flex flex-wrap gap-2 mt-3 mt-md-0">
          <Button
            variant="light"
            className="fw-bold px-3 py-2 text-primary border-0 rounded-3 shadow-sm d-flex align-items-center gap-2"
            onClick={() => onNavigate('invoice')}
          >
            <Receipt size={16} /> Create Invoice
          </Button>
          <Button
            variant="outline-light"
            className="fw-bold px-3 py-2 rounded-3 d-flex align-items-center gap-2"
            onClick={() => onNavigate('backup')}
          >
            <HardDrive size={16} /> Backup Data to Drive
          </Button>
        </div>
      </div>

      {/* ── Key Metrics Cards ──────────────────────────────────── */}
      <Row className="g-3 mb-4">
        {/* Today's Sales */}
        <Col xs={12} sm={6} lg={3}>
          <Card
            className={`border-0 h-100 shadow-sm rounded-4 ${
              isDark ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white'
            }`}
          >
            <Card.Body className="p-3 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted fw-semibold small text-uppercase" style={{ fontSize: '0.72rem' }}>
                  Today's Sales
                </span>
                <div
                  className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                  style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
                >
                  <TrendingUp size={18} />
                </div>
              </div>
              <div>
                <h3 className="fw-bold mb-1" style={{ color: isDark ? '#10B981' : '#059669' }}>
                  ₹{todaysSales.toLocaleString('en-IN')}
                </h3>
                <span className="text-muted small">Live calculated today</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Total Sales */}
        <Col xs={12} sm={6} lg={3}>
          <Card
            className={`border-0 h-100 shadow-sm rounded-4 ${
              isDark ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white'
            }`}
          >
            <Card.Body className="p-3 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted fw-semibold small text-uppercase" style={{ fontSize: '0.72rem' }}>
                  Total Sales
                </span>
                <div
                  className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                  style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}
                >
                  <FileText size={18} />
                </div>
              </div>
              <div>
                <h3 className="fw-bold mb-1" style={{ color: isDark ? '#60A5FA' : '#2563EB' }}>
                  ₹{totalSales.toLocaleString('en-IN')}
                </h3>
                <span className="text-muted small">{invoices.length} Invoices generated</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Total Outstanding */}
        <Col xs={12} sm={6} lg={3}>
          <Card
            className={`border-0 h-100 shadow-sm rounded-4 ${
              isDark ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white'
            }`}
          >
            <Card.Body className="p-3 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted fw-semibold small text-uppercase" style={{ fontSize: '0.72rem' }}>
                  Outstanding Amount
                </span>
                <div
                  className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                  style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}
                >
                  <AlertCircle size={18} />
                </div>
              </div>
              <div>
                <h3 className="fw-bold mb-1" style={{ color: isDark ? '#F87171' : '#DC2626' }}>
                  ₹{totalOutstanding.toLocaleString('en-IN')}
                </h3>
                <span className="text-muted small">{pendingPaymentsCount} Pending Payments</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Purchase Summary */}
        <Col xs={12} sm={6} lg={3}>
          <Card
            className={`border-0 h-100 shadow-sm rounded-4 ${
              isDark ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white'
            }`}
          >
            <Card.Body className="p-3 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted fw-semibold small text-uppercase" style={{ fontSize: '0.72rem' }}>
                  Purchase Summary
                </span>
                <div
                  className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                  style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' }}
                >
                  <ShoppingCart size={18} />
                </div>
              </div>
              <div>
                <h3 className="fw-bold mb-1" style={{ color: isDark ? '#C084FC' : '#9333EA' }}>
                  ₹{totalPurchaseAmount.toLocaleString('en-IN')}
                </h3>
                <span className="text-muted small">{purchases.length} Stock Purchases</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Main Content Grid ─────────────────────────────────── */}
      <Row className="g-4">
        {/* Recent Invoices Table */}
        <Col lg={8}>
          <Card className={`border-0 shadow-sm rounded-4 overflow-hidden ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
            <Card.Header
              className={`p-3 border-0 bg-transparent d-flex justify-content-between align-items-center`}
            >
              <div className="d-flex align-items-center gap-2">
                <Receipt className="text-primary" size={20} />
                <h6 className="fw-bold m-0">Recent Invoices & Quotations</h6>
              </div>
              <Button
                variant="link"
                size="sm"
                className="text-decoration-none fw-bold p-0 text-primary"
                onClick={() => onNavigate('invoice')}
              >
                View All <ArrowUpRight size={14} />
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className={`m-0 align-middle ${isDark ? 'table-dark' : ''}`}>
                  <thead className={isDark ? 'bg-slate-800' : 'bg-light'}>
                    <tr className="small text-uppercase text-muted">
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th className="text-end">Amount</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(0, 5).map((inv) => (
                      <tr key={inv.id}>
                        <td className="fw-semibold">{inv.invoice_number}</td>
                        <td>{inv.customer_name}</td>
                        <td>
                          <Badge
                            bg={inv.type === 'TAX_INVOICE' ? 'primary' : inv.type === 'QUOTATION' ? 'info' : 'warning'}
                            className="px-2 py-1"
                          >
                            {inv.type.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="small text-muted">{inv.date}</td>
                        <td className="text-end fw-bold">₹{inv.grand_total.toLocaleString('en-IN')}</td>
                        <td className="text-center">
                          <Badge
                            bg={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'}
                          >
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Sidebar Widgets: Tasks & Pending Payments */}
        <Col lg={4}>
          <div className="d-flex flex-column gap-3">
            {/* Today's Tasks */}
            <Card className={`border-0 shadow-sm rounded-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
              <Card.Header className="p-3 bg-transparent border-0 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <CheckSquare className="text-warning" size={20} />
                  <h6 className="fw-bold m-0">Today's Tasks ({todaysTasks.length})</h6>
                </div>
                <Button variant="link" size="sm" className="p-0 fw-bold text-decoration-none" onClick={() => onNavigate('tasks')}>
                  Manage
                </Button>
              </Card.Header>
              <Card.Body className="p-3 pt-0">
                {todaysTasks.length === 0 ? (
                  <p className="text-muted small m-0">No active tasks scheduled for today.</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {todaysTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className={`p-2 rounded-3 border ${
                          isDark ? 'bg-slate-800 border-slate-700' : 'bg-light border-gray-200'
                        }`}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <span className="fw-semibold small">{task.title}</span>
                          <Badge bg={task.priority === 'HIGH' || task.priority === 'URGENT' ? 'danger' : 'secondary'}>
                            {task.priority}
                          </Badge>
                        </div>
                        <span className="small text-muted d-block">{task.assigned_to}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Pending Payments Alert Card */}
            <Card className={`border-0 shadow-sm rounded-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
              <Card.Header className="p-3 bg-transparent border-0 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <AlertCircle className="text-danger" size={20} />
                  <h6 className="fw-bold m-0 text-danger">Pending Payment Action</h6>
                </div>
              </Card.Header>
              <Card.Body className="p-3 pt-0">
                <p className="small text-muted mb-3">
                  You have {pendingPaymentsCount} unpaid or partially paid bills totaling{' '}
                  <strong className="text-danger">₹{totalOutstanding.toLocaleString('en-IN')}</strong>.
                </p>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="w-100 fw-bold rounded-3"
                  onClick={() => onNavigate('payments')}
                >
                  Collect Pending Payments →
                </Button>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardOverview
