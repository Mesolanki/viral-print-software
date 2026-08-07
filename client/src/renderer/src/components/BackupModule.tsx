import React, { useState, useEffect } from 'react'
import { Card, Button, Row, Col, Alert, Badge, Table, Form } from 'react-bootstrap'
import {
  HardDrive,
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Receipt,
  Users,
  Package,
  ShieldCheck,
  RefreshCw,
  FileText,
  FolderOpen
} from 'lucide-react'
import { DataService, Invoice } from '../services/dataService'

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

  const loadStats = () => {
    const data = DataService.exportAllData()
    setBackupStats(data)
    setInvoices(data.data.invoices || [])
  }

  useEffect(() => {
    loadStats()
  }, [])

  // ── Handle Full Backup to Drive (JSON) ────────────────────────────
  const handleBackupToDrive = async () => {
    setIsProcessing(true)
    setStatusAlert(null)
    try {
      const result = await DataService.saveBackupToFileDrive()
      const nowStr = new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
      localStorage.setItem('vpm_last_backup_timestamp', nowStr)
      setLastBackupTime(nowStr)

      setStatusAlert({
        type: 'success',
        message: `✅ Full JSON Backup successfully saved to your drive as "${result.filename}"!`
      })
    } catch (err: any) {
      if (err.message && err.message.includes('cancelled')) {
        setStatusAlert({ type: 'info', message: 'Backup save operation was cancelled.' })
      } else {
        setStatusAlert({ type: 'danger', message: `❌ Backup failed: ${err.message || 'Unknown error'}` })
      }
    } finally {
      setIsProcessing(false)
    }
  }

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

  // ── Handle CSV Export ──────────────────────────────────────────────
  const handleExportCSV = () => {
    try {
      DataService.exportBillsCSV()
      setStatusAlert({
        type: 'success',
        message: '📊 All bill and invoice records exported as CSV for Excel/Drive!'
      })
    } catch (err: any) {
      setStatusAlert({ type: 'danger', message: `Export failed: ${err.message}` })
    }
  }

  // ── Handle File Restore ─────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const jsonContent = JSON.parse(evt.target?.result as string)
        const res = DataService.importBackupData(jsonContent)
        loadStats()
        setStatusAlert({
          type: 'success',
          message: `🎉 System restored! Imported ${res.counts.invoices || 0} invoices, ${res.counts.customers || 0} customers, and ${res.counts.products || 0} products.`
        })
      } catch (err: any) {
        setStatusAlert({
          type: 'danger',
          message: `❌ Failed to restore backup: ${err.message || 'Invalid backup JSON file'}`
        })
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="vpm-backup-module p-3">
      {/* ── Top Header Card ────────────────────────────────────────── */}
      <div
        className="p-4 mb-4 rounded-4 text-white d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center shadow-sm"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
            : 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none'
        }}
      >
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-white text-dark fw-bold px-2 py-1 uppercase" style={{ fontSize: '0.7rem' }}>
              EXCEL & DRIVE BACKUP SYSTEM
            </span>
            <span className="text-white-50 small">Offline Data Protection</span>
          </div>
          <h2 className="fw-bold m-0" style={{ letterSpacing: '-0.5px' }}>
            Bill Data Excel & Drive Backup System
          </h2>
          <p className="text-white-50 small m-0 mt-1">
            Save complete backups of all Tax Invoices, Quotations, Estimate Bills, Customers, and Financial Ledgers as Excel Worksheets (.xlsx) or JSON directly to your PC or Google Drive.
          </p>
        </div>

        <div className="d-flex flex-column flex-sm-row gap-2 mt-3 mt-md-0">
          <Button
            variant="success"
            size="lg"
            className="fw-bold px-4 py-2.5 rounded-3 shadow d-flex align-items-center justify-content-center gap-2"
            onClick={handleBackupToExcel}
            disabled={isProcessing}
            style={{ fontWeight: 800 }}
          >
            {isProcessing ? <RefreshCw className="spin" size={20} /> : <FileSpreadsheet size={20} />}
            Backup to Excel (.xlsx)
          </Button>

          <Button
            variant="light"
            size="lg"
            className="fw-bold px-3 py-2.5 text-indigo-700 border-0 rounded-3 shadow d-flex align-items-center justify-content-center gap-2"
            onClick={handleBackupToDrive}
            disabled={isProcessing}
            style={{ color: '#4338ca', fontWeight: 800 }}
          >
            <HardDrive size={20} /> Backup JSON to Drive
          </Button>
        </div>
      </div>

      {/* ── Status Alert Notification ──────────────────────────────── */}
      {statusAlert && (
        <Alert
          variant={statusAlert.type}
          onClose={() => setStatusAlert(null)}
          dismissible
          className="shadow-sm rounded-3 mb-4"
        >
          {statusAlert.message}
        </Alert>
      )}

      {/* ── Last Backup Info Banner ────────────────────────────────── */}
      <div
        className={`p-3 mb-4 rounded-3 d-flex align-items-center justify-content-between ${
          isDark ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border text-dark'
        }`}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="p-2.5 rounded-3 d-flex align-items-center justify-content-center"
            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="fw-bold d-block mb-0">Local Drive Backup Protection Active</span>
            <span className="text-muted small">
              {lastBackupTime ? `Last backup saved on: ${lastBackupTime}` : 'No backups saved yet. Click "Backup All Bills to Drive" to create your first backup.'}
            </span>
          </div>
        </div>

        <Badge bg={lastBackupTime ? 'success' : 'warning'} className="px-3 py-2 fs-6">
          {lastBackupTime ? 'SYSTEM BACKED UP' : 'BACKUP PENDING'}
        </Badge>
      </div>

      {/* ── Metrics Cards Grid ──────────────────────────────────────── */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} md={3}>
          <Card className={`border-0 shadow-sm rounded-4 h-100 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-semibold text-uppercase">Total Invoices & Bills</span>
                <Receipt className="text-primary" size={20} />
              </div>
              <h3 className="fw-bold m-0 text-primary">{backupStats?.metrics?.totalInvoices || invoices.length}</h3>
              <span className="text-muted small">Tax Invoices, Quotes & Estimates</span>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <Card className={`border-0 shadow-sm rounded-4 h-100 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-semibold text-uppercase">Total Financial Sales</span>
                <FileText className="text-success" size={20} />
              </div>
              <h3 className="fw-bold m-0 text-success">
                ₹{(backupStats?.metrics?.totalSales || 0).toLocaleString('en-IN')}
              </h3>
              <span className="text-muted small">All recorded billing value</span>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <Card className={`border-0 shadow-sm rounded-4 h-100 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-semibold text-uppercase">Customer Directory</span>
                <Users className="text-info" size={20} />
              </div>
              <h3 className="fw-bold m-0 text-info">{backupStats?.metrics?.totalCustomers || 0}</h3>
              <span className="text-muted small">GST Accounts & Walk-ins</span>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <Card className={`border-0 shadow-sm rounded-4 h-100 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-semibold text-uppercase">Products & Rates</span>
                <Package className="text-warning" size={20} />
              </div>
              <h3 className="fw-bold m-0 text-warning">{backupStats?.metrics?.totalProducts || 0}</h3>
              <span className="text-muted small">Flex, Vinyl, Boards & Print items</span>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Main Operations Section: Backup & Restore ──────────────── */}
      <Row className="g-4 mb-4">
        {/* Left: Backup Actions */}
        <Col lg={6}>
          <Card className={`border-0 shadow-sm rounded-4 h-100 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
            <Card.Header className="p-3 border-0 bg-transparent d-flex align-items-center gap-2">
              <HardDrive className="text-primary" size={20} />
              <h5 className="fw-bold m-0">1-Click Backup Options</h5>
            </Card.Header>
            <Card.Body className="p-3 pt-0 d-flex flex-column justify-content-between">
              <div>
                <p className="text-muted small mb-3">
                  Select your preferred backup method below. You can save full database JSON snapshots directly to any folder on your hard drive (e.g. Google Drive sync folder, D:\Backups, external flash drive).
                </p>

                <div className="d-flex flex-column gap-3 mb-3">
                  {/* Excel Backup Card */}
                  <div className={`p-3 rounded-3 border d-flex align-items-center justify-content-between ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-light border-gray-200'}`}>
                    <div className="d-flex align-items-center gap-3">
                      <FileSpreadsheet className="text-success" size={26} />
                      <div>
                        <h6 className="fw-bold m-0 text-success">Backup All Data to Excel (.xlsx)</h6>
                        <span className="text-muted small">Creates 6 Worksheets: Invoices, Item Breakdown, Customers, Payments, Rates & Purchases</span>
                      </div>
                    </div>
                    <Button
                      variant="success"
                      className="fw-bold px-3 py-2 rounded-3 text-nowrap"
                      onClick={handleBackupToExcel}
                      disabled={isProcessing}
                    >
                      Export Excel
                    </Button>
                  </div>

                  {/* JSON Backup Card */}
                  <div className={`p-3 rounded-3 border d-flex align-items-center justify-content-between ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-light border-gray-200'}`}>
                    <div className="d-flex align-items-center gap-3">
                      <Download className="text-primary" size={24} />
                      <div>
                        <h6 className="fw-bold m-0">Full Bill System Backup (.json)</h6>
                        <span className="text-muted small">Includes all Invoices, Quotations, Estimates, E-Way bills, Payments & System data</span>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      className="fw-bold px-3 py-2 rounded-3 text-nowrap"
                      onClick={handleBackupToDrive}
                      disabled={isProcessing}
                    >
                      Save JSON
                    </Button>
                  </div>

                  {/* CSV Export Card */}
                  <div className={`p-3 rounded-3 border d-flex align-items-center justify-content-between ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-light border-gray-200'}`}>
                    <div className="d-flex align-items-center gap-3">
                      <FileText className="text-info" size={24} />
                      <div>
                        <h6 className="fw-bold m-0">Export Bills Summary CSV (.csv)</h6>
                        <span className="text-muted small">Export all invoice dates, customer GSTINs, totals, and payment balances</span>
                      </div>
                    </div>
                    <Button
                      variant="outline-info"
                      className="fw-bold px-3 py-2 rounded-3 text-nowrap"
                      onClick={handleExportCSV}
                    >
                      Export CSV
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-3 bg-primary bg-opacity-10 text-primary small">
                <strong>💡 Tip for Google Drive / OneDrive users:</strong> When saving your backup file, choose your synchronized Google Drive or OneDrive folder to automatically sync your bill data to the cloud!
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right: Restore Actions */}
        <Col lg={6}>
          <Card className={`border-0 shadow-sm rounded-4 h-100 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
            <Card.Header className="p-3 border-0 bg-transparent d-flex align-items-center gap-2">
              <Upload className="text-warning" size={20} />
              <h5 className="fw-bold m-0">Restore Database Backup</h5>
            </Card.Header>
            <Card.Body className="p-3 pt-0 d-flex flex-column justify-content-between">
              <div>
                <p className="text-muted small mb-3">
                  Upload a previously saved `.json` backup file from your drive to restore all bills, customers, products, and sales logs into the software.
                </p>

                <div className={`p-4 border-2 border-dashed rounded-4 text-center mb-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-light border-secondary'}`}>
                  <FolderOpen className="text-warning mb-2" size={36} />
                  <h6 className="fw-bold mb-1">Select Backup File (.json)</h6>
                  <p className="text-muted small mb-3">Drag and drop or click below to choose a backup file from your drive</p>
                  <Form.Group controlId="backupFileUpload">
                    <Form.Control
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <Form.Label
                      htmlFor="backupFileUpload"
                      className="btn btn-warning fw-bold px-4 py-2 rounded-3 text-dark cursor-pointer shadow-sm m-0"
                    >
                      <Upload size={16} className="me-2" /> Browse Backup File from Drive
                    </Form.Label>
                  </Form.Group>
                </div>
              </div>

              <Alert variant="warning" className="m-0 small py-2 px-3 rounded-3">
                <AlertCircle size={14} className="me-1" />
                <strong>Note:</strong> Restoring a backup file will safely update your local bill dataset. Make sure to back up your current work before restoring an older file.
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Bill Data Overview Table ───────────────────────────────── */}
      <Card className={`border-0 shadow-sm rounded-4 overflow-hidden ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <Card.Header className="p-3 border-0 bg-transparent d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Receipt className="text-primary" size={20} />
            <h5 className="fw-bold m-0">Bill Records Ready for Drive Backup</h5>
          </div>
          <Badge bg="primary" className="px-3 py-1.5">
            {invoices.length} Bills Saved
          </Badge>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className={`m-0 align-middle ${isDark ? 'table-dark' : ''}`}>
              <thead className={isDark ? 'bg-slate-800' : 'bg-light'}>
                <tr className="small text-uppercase text-muted">
                  <th>#</th>
                  <th>Invoice Number</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th className="text-end">Amount (₹)</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      No invoices found in database.
                    </td>
                  </tr>
                ) : (
                  invoices.slice(0, 10).map((inv, idx) => (
                    <tr key={inv.id || idx}>
                      <td>{idx + 1}</td>
                      <td className="fw-bold">{inv.invoice_number}</td>
                      <td>
                        <Badge bg={inv.type === 'TAX_INVOICE' ? 'primary' : inv.type === 'QUOTATION' ? 'info' : 'warning'}>
                          {inv.type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="small text-muted">{inv.date}</td>
                      <td>{inv.customer_name}</td>
                      <td className="text-end fw-bold">₹{inv.grand_total.toLocaleString('en-IN')}</td>
                      <td className="text-center">
                        <Badge bg={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'}>
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}

export default BackupModule
