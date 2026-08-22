import React, { useState, useEffect, useMemo } from 'react'
import { Row, Col, Alert, Form } from 'react-bootstrap'
import {
  Upload,
  FileSpreadsheet,

  AlertCircle,
  Receipt,
  Users,
  Package,
  ShieldCheck,
  RefreshCw,
  FileText,
  FolderOpen,
  Search,
  X
} from 'lucide-react'
import { DataService, Invoice } from '../services/dataService'
import './BackupModule.css'

interface BackupModuleProps {
  theme: 'dark' | 'light'
}

const BackupModule: React.FC<BackupModuleProps> = ({ theme }) => {
  const isDark = theme === 'dark'
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [backupStats, setBackupStats] = useState<any>(null)
  const [statusAlert, setStatusAlert] = useState<{ type: 'success' | 'danger' | 'info'; message: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    return localStorage.getItem('vpm_last_backup_timestamp') || null
  })

  // ── Search & Filter Controls ─────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [displayLimit, setDisplayLimit] = useState<number | 'ALL'>('ALL')

  const loadStats = () => {
    const data = DataService.exportAllData()
    setBackupStats(data)
    setInvoices(data.data.invoices || [])
  }

  useEffect(() => {
    loadStats()
  }, [])

  // ── Filtered & Visible Invoices ──────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        q === '' ||
        (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q)) ||
        (inv.customer_name && inv.customer_name.toLowerCase().includes(q)) ||
        (inv.date && inv.date.includes(q)) ||
        (inv.type && inv.type.toLowerCase().includes(q))

      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter
      const matchesType = typeFilter === 'ALL' || inv.type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [invoices, searchTerm, statusFilter, typeFilter])

  const visibleInvoices = useMemo(() => {
    if (displayLimit === 'ALL') return filteredInvoices
    return filteredInvoices.slice(0, displayLimit)
  }, [filteredInvoices, displayLimit])

  const filteredTotal = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0)
  }, [filteredInvoices])

  // ── Handle Multi-Sheet Excel Workbook Backup (.xlsx) ───────────────
  const handleBackupToExcel = async () => {
    setIsProcessing(true)
    setStatusAlert(null)
    try {
      const result = await DataService.exportAllDataToExcel()
      const nowStr = new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
      localStorage.setItem('vpm_last_backup_timestamp', nowStr)
      setLastBackupTime(nowStr)

      setStatusAlert({
        type: 'success',
        message: `📊 Excel Multi-Sheet Backup Workbook (.xlsx) saved to drive as "${result.filename}"!`
      })
    } catch (err: any) {
      if (err.message && err.message.includes('cancelled')) {
        setStatusAlert({ type: 'info', message: 'Excel export cancelled.' })
      } else {
        setStatusAlert({ type: 'danger', message: `❌ Excel export failed: ${err.message || 'Unknown error'}` })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // ── Handle Excel Workbook Restore (.xlsx) ─────────────────────────
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx')
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const res = DataService.importExcelBackupData(workbook)
        loadStats()
        setStatusAlert({
          type: 'success',
          message: `🎉 System restored! Imported ${res.counts.invoices || 0} invoices, ${res.counts.customers || 0} customers, and ${res.counts.products || 0} products from Excel.`
        })
      } catch (err: any) {
        setStatusAlert({
          type: 'danger',
          message: `❌ Failed to restore backup from Excel: ${err.message || 'Invalid Excel file format'}`
        })
      }
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className={`vpm-backup-module ${isDark ? 'theme-dark' : 'theme-light'}`}>
      {/* ── Top Header Hero Banner ────────────────────────────── */}
      <div className="vpm-backup-hero d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="vpm-backup-icon-box">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="vpm-gst-badge" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                EXCEL BACKUP & RESTORE SYSTEM
              </span>
              <span className="small opacity-75 fw-medium">Offline Data Protection</span>
            </div>
            <h4 className="fw-extrabold m-0 text-gradient-title">Bill Data Excel Backup & Restore System</h4>
            <p className="small opacity-75 m-0 fw-medium">
              Save and restore complete backups of all Tax Invoices, Quotations, Estimate Bills, Customers, and Products using Excel (.xlsx) files.
            </p>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="vpm-btn-excel-main"
            onClick={handleBackupToExcel}
            disabled={isProcessing}
          >
            {isProcessing ? <RefreshCw className="spin" size={16} /> : <FileSpreadsheet size={16} />}
            Backup to Excel (.xlsx)
          </button>
        </div>
      </div>


      {/* ── Status Alert Notification ──────────────────────────────── */}
      {statusAlert && (
        <Alert
          variant={statusAlert.type}
          onClose={() => setStatusAlert(null)}
          dismissible
          className="shadow-sm rounded-3 m-0 py-2 px-3 small"
        >
          {statusAlert.message}
        </Alert>
      )}

      {/* ── Last Backup Protection Banner ────────────────────────── */}
      <div className="vpm-backup-status-banner">
        <div className="d-flex align-items-center gap-3">
          <div
            className="p-2 rounded-3 d-flex align-items-center justify-content-center"
            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="fw-bold d-block small m-0">Local Drive Backup Protection Active</span>
            <span className="text-muted" style={{ fontSize: '0.74rem' }}>
              {lastBackupTime
                ? `Last backup saved on: ${lastBackupTime}`
                : 'No backups saved yet. Click "Backup All Bills to Drive" to create your first backup.'}
            </span>
          </div>
        </div>

        {lastBackupTime ? (
          <span className="vpm-status-pill vpm-status-pill-paid">
            <span className="vpm-status-dot" /> SYSTEM BACKED UP
          </span>
        ) : (
          <span className="vpm-status-pill vpm-status-pill-partial">
            <span className="vpm-status-dot" /> BACKUP PENDING
          </span>
        )}
      </div>

      {/* ── Compact Metrics Cards ──────────────────────────────────── */}
      <Row className="g-2">
        <Col xs={12} sm={6} md={3}>
          <div className="vpm-gst-stat-card">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-muted fw-bold text-uppercase">Invoices & Bills</span>
              <Receipt className="text-primary" size={16} />
            </div>
            <div className="vpm-gst-stat-val text-primary">
              {backupStats?.metrics?.totalInvoices || invoices.length}
            </div>
          </div>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <div className="vpm-gst-stat-card">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-muted fw-bold text-uppercase">Financial Sales</span>
              <FileText className="text-success" size={16} />
            </div>
            <div className="vpm-gst-stat-val text-success">
              ₹{(backupStats?.metrics?.totalSales || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <div className="vpm-gst-stat-card">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-muted fw-bold text-uppercase">Customers</span>
              <Users className="text-info" size={16} />
            </div>
            <div className="vpm-gst-stat-val text-info">
              {backupStats?.metrics?.totalCustomers || 0}
            </div>
          </div>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <div className="vpm-gst-stat-card">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-muted fw-bold text-uppercase">Products & Rates</span>
              <Package className="text-warning" size={16} />
            </div>
            <div className="vpm-gst-stat-val text-warning">
              {backupStats?.metrics?.totalProducts || 0}
            </div>
          </div>
        </Col>
      </Row>

      {/* ── Main Operations Section: Backup & Restore ──────────────── */}
      <Row className="g-3">
        {/* Left: Backup Actions */}
        <Col lg={6}>
          <div className="vpm-backup-card p-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              <FileSpreadsheet className="text-success" size={18} />
              <h6 className="fw-extrabold m-0">Excel Backup Options</h6>
            </div>

            <div className="d-flex flex-column gap-2 mb-2">
              {/* Excel Backup Card */}
              <div className="vpm-backup-option-row">
                <div className="d-flex align-items-center gap-2">
                  <FileSpreadsheet className="text-success" size={20} />
                  <div>
                    <span className="fw-bold d-block text-success small">Backup All Data to Excel (.xlsx)</span>
                    <span className="text-muted" style={{ fontSize: '0.70rem' }}>Exports 7 Worksheets: Invoices, Items, Customers, Payments, Products, Purchases, Suppliers</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="vpm-btn-excel-main"
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                  onClick={handleBackupToExcel}
                  disabled={isProcessing}
                >
                  Export Excel (.xlsx)
                </button>
              </div>
            </div>

            <div className="p-2 rounded-3 bg-success bg-opacity-10 text-success" style={{ fontSize: '0.72rem' }}>
              <strong>💡 Tip for PC & Cloud Drive:</strong> Save your Excel workbook (.xlsx) directly into your synced Google Drive / OneDrive folder!
            </div>
          </div>
        </Col>

        {/* Right: Restore Actions */}
        <Col lg={6}>
          <div className="vpm-backup-card p-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              <Upload className="text-warning" size={18} />
              <h6 className="fw-extrabold m-0">Restore Database from Excel Backup</h6>
            </div>

            <div className="vpm-restore-dropzone mb-2">
              <FolderOpen className="text-warning mb-1" size={28} />
              <h6 className="fw-extrabold mb-1 small">Select Excel Backup File (.xlsx)</h6>
              <p className="text-muted mb-2" style={{ fontSize: '0.72rem' }}>Choose an Excel backup workbook (.xlsx) exported from this software to restore</p>
              <Form.Group controlId="backupFileUpload">
                <Form.Control
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelUpload}
                  style={{ display: 'none' }}
                />
                <Form.Label
                  htmlFor="backupFileUpload"
                  className="vpm-btn-pur-action vpm-btn-pur-sec m-0 cursor-pointer"
                  style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#D97706', borderColor: 'rgba(234, 179, 8, 0.3)' }}
                >
                  <Upload size={14} className="me-1" /> Browse Excel Backup File (.xlsx)
                </Form.Label>
              </Form.Group>
            </div>

            <Alert variant="warning" className="m-0 py-1.5 px-2.5 rounded-3" style={{ fontSize: '0.72rem' }}>
              <AlertCircle size={13} className="me-1" />
              <strong>Note:</strong> Restoring from Excel safely updates your local bill, customer, and product dataset.
            </Alert>
          </div>
        </Col>

      </Row>

      {/* ── Bill Data Overview Table ───────────────────────────────── */}
      <div className="vpm-backup-table-card">
        {/* Header & Search/Filter Controls */}
        <div className="vpm-table-header-pro">
          <div className="d-flex align-items-center gap-2">
            <Receipt size={18} className="text-primary" />
            <h5 className="vpm-table-title-pro m-0">Bill Records Ready for Drive Backup</h5>
            <span className="vpm-gst-badge">
              {filteredInvoices.length} of {invoices.length} Bills
            </span>
          </div>

          {/* Controls: Search, Type, Status, Row Limit */}
          <div className="vpm-table-controls-row">
            {/* Search Input */}
            <div className="vpm-search-box-mini">
              <Search size={14} className="vpm-search-icon" />
              <input
                type="text"
                className="vpm-search-input"
                placeholder="Search bill#, customer, date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="vpm-search-clear"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <select
              className="vpm-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="TAX_INVOICE">Tax Invoice</option>
              <option value="QUOTATION">Quotation</option>
              <option value="ESTIMATE">Estimate</option>
            </select>

            {/* Status Filter */}
            <select
              className="vpm-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partial</option>
              <option value="UNPAID">Unpaid</option>
            </select>

            {/* Limit Selector */}
            <select
              className="vpm-filter-select"
              value={displayLimit}
              onChange={(e) =>
                setDisplayLimit(
                  e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
                )
              }
            >
              <option value="ALL">Show All</option>
              <option value="10">Show 10</option>
              <option value="25">Show 25</option>
              <option value="50">Show 50</option>
              <option value="100">Show 100</option>
            </select>
          </div>
        </div>

        {/* Scrollable Table Viewport */}
        <div className="table-responsive vpm-pro-scrollable-table">
          <table className="vpm-backup-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '50px' }}>#</th>
                <th className="text-start">Invoice Number</th>
                <th className="text-center">Type</th>
                <th className="text-center">Date</th>
                <th className="text-start">Customer Name</th>
                <th className="text-end">Amount (₹)</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted fw-medium">
                    <div className="d-flex flex-column align-items-center gap-2">
                      <Receipt size={32} className="opacity-50" />
                      <span>No matching bill records found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleInvoices.map((inv, idx) => (
                  <tr key={inv.id || idx}>
                    <td className="text-center">
                      <span className="vpm-date-pill">{idx + 1}</span>
                    </td>
                    <td className="text-start">
                      <span className="vpm-bill-num-pill">{inv.invoice_number}</span>
                    </td>
                    <td className="text-center">
                      <span className="vpm-badge-bill vpm-badge-bill-tax">
                        {(inv.type || 'TAX_INVOICE').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="vpm-date-pill">{inv.date}</span>
                    </td>
                    <td className="text-start">
                      <div className="vpm-cust-name-cell">
                        <div className="vpm-avatar-mini">
                          {(inv.customer_name || 'C')
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <span className="fw-bold">{inv.customer_name || 'Walk-in Customer'}</span>
                      </div>
                    </td>
                    <td className="text-end">
                      <span className="vpm-amount-total">
                        ₹{(inv.grand_total || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="text-center">
                      {inv.status === 'PAID' && (
                        <span className="vpm-status-pill vpm-status-pill-paid">
                          <span className="vpm-status-dot" /> Paid
                        </span>
                      )}
                      {inv.status === 'PARTIALLY_PAID' && (
                        <span className="vpm-status-pill vpm-status-pill-partial">
                          <span className="vpm-status-dot" /> Partial
                        </span>
                      )}
                      {(inv.status === 'UNPAID' || !inv.status) && (
                        <span className="vpm-status-pill vpm-status-pill-unpaid">
                          <span className="vpm-status-dot" /> Unpaid
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="vpm-table-footer-pro">
          <span>
            Showing <strong>{visibleInvoices.length}</strong> of <strong>{filteredInvoices.length}</strong> records
          </span>
          <span className="ms-auto fw-bold">
            Filtered Total: <span className="text-success">₹{filteredTotal.toLocaleString('en-IN')}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default BackupModule
