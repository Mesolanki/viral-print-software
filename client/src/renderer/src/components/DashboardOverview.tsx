import React, { useState, useEffect } from 'react'
import { Row, Col, Button } from 'react-bootstrap'
import {
  TrendingUp,
  AlertCircle,
  FileText,
  CheckSquare,
  ShoppingCart,
  Receipt,
  ArrowUpRight,
  HardDrive,
  PlusCircle,
  Truck,
  Users,
  PieChart,
  ArrowRight,
  Zap,
  Calendar
} from 'lucide-react'
import viralLogo from '../assets/logo_viral.png'
import { DataService, Invoice, TaskItem, Purchase } from '../services/dataService'
import type { ActiveTabType } from './layout/AppLayout'

interface DashboardOverviewProps {
  theme: 'dark' | 'light'
  onNavigate: (tab: ActiveTabType) => void
}

type FilterType = 'ALL' | 'TAX_INVOICE' | 'QUOTATION' | 'ESTIMATE'

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ theme, onNavigate }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [filterType, setFilterType] = useState<FilterType>('ALL')
  const isDark = theme === 'dark'

  useEffect(() => {
    setInvoices(DataService.getInvoices())
    setTasks(DataService.getTasks())
    setPurchases(DataService.getPurchases())
  }, [])

  // Today's Date String
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const formattedToday = today.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  // Stats Calculations
  const todaysSales = invoices
    .filter(i => i.date === todayStr || i.created_at === todayStr)
    .reduce((sum, i) => sum + i.grand_total, 0)

  const totalSales = invoices.reduce((sum, i) => sum + i.grand_total, 0)
  const totalOutstanding = invoices.reduce((sum, i) => sum + i.balance_amount, 0)
  const pendingPaymentsCount = invoices.filter(i => i.status !== 'PAID').length
  const todaysTasks = tasks.filter(t => t.due_date === todayStr || t.start_date === todayStr || t.status === 'PENDING')
  const totalPurchaseAmount = purchases.reduce((sum, p) => sum + p.total_amount, 0)

  // Filtered Invoices
  const filteredInvoices = invoices.filter(inv => {
    if (filterType === 'ALL') return true
    return inv.type === filterType
  })

  return (
    <div className={`vpm-dashboard-overview ${isDark ? 'theme-dark' : 'theme-light'}`}>
      {/* ── 1. Top Hero Banner ─────────────────────────────────── */}
      <div className="vpm-dashboard-hero mb-4">
        <div className="vpm-hero-content d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <div className="vpm-hero-badge">
                <span className="vpm-pulse-dot"></span>
                <span>OFFLINE LAN SYSTEM • ONLINE</span>
              </div>
              <span className="vpm-hero-subtitle d-flex align-items-center gap-1">
                <Calendar size={13} /> {formattedToday}
              </span>
            </div>
            <div className="d-flex align-items-center gap-3 mt-1 mb-1">
              <img
                src={viralLogo}
                alt="Viral Print Media"
                style={{ height: '44px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
              />
              <div>
                <h2 className="vpm-hero-title my-0">
                  Business Performance Dashboard
                </h2>
                <p className="vpm-hero-subtitle m-0">
                  Real-time Financial Diagnostics & Operational Command Center
                </p>
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-2 mt-md-0">
            <Button
              className="vpm-hero-btn-primary"
              onClick={() => onNavigate('invoice')}
            >
              <Receipt size={17} /> Create Invoice
            </Button>
            <Button
              className="vpm-hero-btn-glass"
              onClick={() => onNavigate('backup')}
            >
              <HardDrive size={17} /> Backup Data to Drive
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. Key Metrics Cards (Row of 4) ────────────────────── */}
      <Row className="g-3 mb-4">
        {/* Card 1: Today's Sales */}
        <Col xs={12} sm={6} lg={3}>
          <div className="vpm-god-card emerald">
            <div className="vpm-god-card-top">
              <span className="vpm-god-card-title">Today's Sales</span>
              <div className="vpm-god-icon-box">
                <TrendingUp size={20} />
              </div>
            </div>
            <div>
              <div className="vpm-god-card-value">
                ₹{todaysSales.toLocaleString('en-IN')}
              </div>
              <div className="vpm-god-card-footer">
                <span>Live calculated today</span>
                <span className="vpm-trend-badge green">
                  <Zap size={11} /> Live
                </span>
              </div>
            </div>
          </div>
        </Col>

        {/* Card 2: Total Sales */}
        <Col xs={12} sm={6} lg={3}>
          <div className="vpm-god-card cyan">
            <div className="vpm-god-card-top">
              <span className="vpm-god-card-title">Total Sales</span>
              <div className="vpm-god-icon-box">
                <FileText size={20} />
              </div>
            </div>
            <div>
              <div className="vpm-god-card-value">
                ₹{totalSales.toLocaleString('en-IN')}
              </div>
              <div className="vpm-god-card-footer">
                <span>Total turnover</span>
                <span className="vpm-trend-badge blue">
                  {invoices.length} Invoices
                </span>
              </div>
            </div>
          </div>
        </Col>

        {/* Card 3: Outstanding Amount */}
        <Col xs={12} sm={6} lg={3}>
          <div className="vpm-god-card rose">
            <div className="vpm-god-card-top">
              <span className="vpm-god-card-title">Outstanding Amount</span>
              <div className="vpm-god-icon-box">
                <AlertCircle size={20} />
              </div>
            </div>
            <div>
              <div className="vpm-god-card-value">
                ₹{totalOutstanding.toLocaleString('en-IN')}
              </div>
              <div className="vpm-god-card-footer">
                <span>Pending collectables</span>
                <span className="vpm-trend-badge red">
                  {pendingPaymentsCount} Unpaid
                </span>
              </div>
            </div>
          </div>
        </Col>

        {/* Card 4: Purchase Summary */}
        <Col xs={12} sm={6} lg={3}>
          <div className="vpm-god-card purple">
            <div className="vpm-god-card-top">
              <span className="vpm-god-card-title">Purchase Summary</span>
              <div className="vpm-god-icon-box">
                <ShoppingCart size={20} />
              </div>
            </div>
            <div>
              <div className="vpm-god-card-value">
                ₹{totalPurchaseAmount.toLocaleString('en-IN')}
              </div>
              <div className="vpm-god-card-footer">
                <span>Raw material stock</span>
                <span className="vpm-trend-badge purple">
                  {purchases.length} Purchases
                </span>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── 3. Main Content Grid ─────────────────────────────────── */}
      <Row className="g-4">
        {/* Left Column (8 cols): Recent Invoices & Quotations Table */}
        <Col lg={8}>
          <div className="vpm-table-panel">
            <div className="vpm-table-header flex-column flex-sm-row gap-3">
              <div className="vpm-table-header-title">
                <div className="vpm-table-icon-badge">
                  <Receipt size={18} />
                </div>
                <div>
                  <h6>Recent Invoices & Quotations</h6>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3 w-100 w-sm-auto justify-content-between justify-content-sm-end">
                {/* Filter Pills */}
                <div className="vpm-filter-pill-group">
                  <button
                    className={`vpm-filter-pill ${filterType === 'ALL' ? 'active' : ''}`}
                    onClick={() => setFilterType('ALL')}
                  >
                    All
                  </button>
                  <button
                    className={`vpm-filter-pill ${filterType === 'TAX_INVOICE' ? 'active' : ''}`}
                    onClick={() => setFilterType('TAX_INVOICE')}
                  >
                    Invoices
                  </button>
                  <button
                    className={`vpm-filter-pill ${filterType === 'QUOTATION' ? 'active' : ''}`}
                    onClick={() => setFilterType('QUOTATION')}
                  >
                    Quotes
                  </button>
                  <button
                    className={`vpm-filter-pill ${filterType === 'ESTIMATE' ? 'active' : ''}`}
                    onClick={() => setFilterType('ESTIMATE')}
                  >
                    Estimates
                  </button>
                </div>

                <Button
                  variant="link"
                  className="p-0 text-decoration-none vpm-view-all-btn"
                  onClick={() => onNavigate('invoice')}
                >
                  View All <ArrowUpRight size={15} />
                </Button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="vpm-god-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th className="text-end">Amount</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No records match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.slice(0, 6).map((inv) => (
                      <tr key={inv.id}>
                        <td className="vpm-inv-num">{inv.invoice_number}</td>
                        <td className="vpm-customer-name">{inv.customer_name}</td>
                        <td>
                          <span
                            className={`vpm-type-badge ${
                              inv.type === 'TAX_INVOICE'
                                ? 'tax'
                                : inv.type === 'QUOTATION'
                                ? 'quote'
                                : 'est'
                            }`}
                          >
                            {inv.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="text-muted small">{inv.date}</td>
                        <td className="text-end fw-bold">
                          ₹{inv.grand_total.toLocaleString('en-IN')}
                        </td>
                        <td className="text-center">
                          <span
                            className={`vpm-status-pill ${
                              inv.status === 'PAID'
                                ? 'paid'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'partial'
                                : 'unpaid'
                            }`}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor:
                                  inv.status === 'PAID'
                                    ? '#10b981'
                                    : inv.status === 'PARTIALLY_PAID'
                                    ? '#f59e0b'
                                    : '#ef4444'
                              }}
                            />
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Col>

        {/* Right Column (4 cols): Sidebar Widgets */}
        <Col lg={4}>
          <div className="d-flex flex-column gap-3">
            {/* Quick Actions Grid Tile Widget */}
            <div className="vpm-widget-card">
              <div className="vpm-widget-header mb-3">
                <h6 className="vpm-widget-title">
                  <Zap size={18} className="text-primary" />
                  Quick Shortcuts
                </h6>
              </div>
              <div className="vpm-quick-grid">
                <div className="vpm-quick-tile" onClick={() => onNavigate('quotation')}>
                  <div className="vpm-quick-icon" style={{ background: 'rgba(6,182,212,0.12)', color: '#0891b2' }}>
                    <PlusCircle size={18} />
                  </div>
                  <span className="vpm-quick-tile-text">New Quote</span>
                </div>
                <div className="vpm-quick-tile" onClick={() => onNavigate('eway_bill')}>
                  <div className="vpm-quick-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                    <Truck size={18} />
                  </div>
                  <span className="vpm-quick-tile-text">E-Way Bill</span>
                </div>
                <div className="vpm-quick-tile" onClick={() => onNavigate('customers')}>
                  <div className="vpm-quick-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                    <Users size={18} />
                  </div>
                  <span className="vpm-quick-tile-text">Add Customer</span>
                </div>
                <div className="vpm-quick-tile" onClick={() => onNavigate('gst_reports')}>
                  <div className="vpm-quick-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                    <PieChart size={18} />
                  </div>
                  <span className="vpm-quick-tile-text">GST Summary</span>
                </div>
              </div>
            </div>

            {/* Today's Tasks */}
            <div className="vpm-widget-card">
              <div className="vpm-widget-header">
                <h6 className="vpm-widget-title">
                  <CheckSquare size={18} className="text-warning" />
                  Today's Tasks ({todaysTasks.length})
                </h6>
                <Button
                  variant="link"
                  className="p-0 text-decoration-none fw-bold text-primary small"
                  onClick={() => onNavigate('tasks')}
                >
                  Manage
                </Button>
              </div>

              {todaysTasks.length === 0 ? (
                <p className="text-muted small m-0 py-2">No active tasks scheduled for today.</p>
              ) : (
                <div className="d-flex flex-column">
                  {todaysTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`vpm-task-item-pro ${
                        task.priority === 'URGENT'
                          ? 'urgent'
                          : task.priority === 'HIGH'
                          ? 'high'
                          : ''
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="fw-bold small" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                          {task.title}
                        </span>
                        <span
                          className={`badge ${
                            task.priority === 'URGENT' || task.priority === 'HIGH'
                              ? 'bg-danger'
                              : 'bg-secondary'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="small text-muted" style={{ fontSize: '0.74rem' }}>
                          {task.assigned_to || 'Unassigned'}
                        </span>
                        <span className="small text-muted" style={{ fontSize: '0.72rem' }}>
                          {task.due_date || task.start_date || 'Today'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Payments Alert Card */}
            <div className="vpm-payment-alert-card">
              <div className="d-flex align-items-center gap-2 mb-2">
                <AlertCircle size={20} className="text-danger" />
                <h6 className="fw-bold m-0 text-danger" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Pending Payment Action
                </h6>
              </div>
              <p className="small text-muted mb-3" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
                You have <strong>{pendingPaymentsCount}</strong> unpaid or partially paid bills totaling{' '}
                <strong className="text-danger fs-6">₹{totalOutstanding.toLocaleString('en-IN')}</strong>.
              </p>
              <Button
                className="vpm-payment-alert-btn"
                onClick={() => onNavigate('payments')}
              >
                Collect Pending Payments <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardOverview
