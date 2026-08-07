import React, { useState, useEffect } from 'react'
import { Row, Col, Form } from 'react-bootstrap'
import { FileSpreadsheet, Download, Printer, Filter, Receipt } from 'lucide-react'
import { DataService, Invoice, Customer } from '../services/dataService'
import './GstReportModule.css'

interface GstReportModuleProps {
  theme: 'dark' | 'light'
}

const GstReportModule: React.FC<GstReportModuleProps> = ({ theme }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [startDate, setStartDate] = useState('2026-08-01')
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL')

  const isDark = theme === 'dark'

  const loadData = () => {
    setInvoices(DataService.getInvoices())
    setCustomers(DataService.getCustomers())
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter Tax Invoices for GST CA Report
  const gstInvoices = invoices.filter((inv) => {
    if (inv.type !== 'TAX_INVOICE') return false
    const matchDate = inv.date >= startDate && inv.date <= endDate
    if (selectedCustomerId !== 'ALL') {
      const cust = customers.find((c) => c.id === Number(selectedCustomerId))
      return matchDate && cust && inv.customer_name.toLowerCase() === cust.name.toLowerCase()
    }
    return matchDate
  })

  // GST Totals
  const totalTaxable = gstInvoices.reduce((sum, i) => sum + i.sub_total, 0)
  const totalCGST = gstInvoices.reduce((sum, i) => sum + i.cgst, 0)
  const totalSGST = gstInvoices.reduce((sum, i) => sum + i.sgst, 0)
  const totalGstAmount = totalCGST + totalSGST
  const totalInvoiceValue = gstInvoices.reduce((sum, i) => sum + i.grand_total, 0)

  // CSV Export for CA
  const exportToCSV = () => {
    const headers = [
      'Invoice Number',
      'Date',
      'Customer Name',
      'Customer GSTIN',
      'State Code',
      'Taxable Value (Rs)',
      'CGST (9%)',
      'SGST (9%)',
      'Total GST (Rs)',
      'Invoice Grand Total (Rs)',
      'Status'
    ]

    const rows = gstInvoices.map((inv) => [
      inv.invoice_number,
      inv.date,
      `"${inv.customer_name}"`,
      inv.customer_gstin || 'URP',
      '24',
      inv.sub_total.toFixed(2),
      inv.cgst.toFixed(2),
      inv.sgst.toFixed(2),
      (inv.cgst + inv.sgst).toFixed(2),
      inv.grand_total.toFixed(2),
      inv.status
    ])

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `GST_CA_Summary_Report_${startDate}_to_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={`vpm-gst-module ${isDark ? 'theme-dark' : 'theme-light'}`}>
      {/* ── Top Header Banner ─────────────────────────────────── */}
      <div className="vpm-gst-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="vpm-gst-icon-box">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h4 className="fw-extrabold m-0 text-gradient-title">GST Summary Report (CA Filing Format)</h4>
            <p className="text-muted small m-0 fw-medium">
              Generate B2B tax invoice summary reports formatted specifically for Chartered Accountant GST return filing.
            </p>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="vpm-btn-gst-sec" onClick={handlePrint}>
            <Printer size={15} /> Print Report
          </button>
          <button type="button" className="vpm-btn-add-gst" onClick={exportToCSV}>
            <Download size={15} /> Export to Excel / CSV
          </button>
        </div>
      </div>

      {/* ── Filter Controls ───────────────────────────────────── */}
      <div className="vpm-gst-filter-bar">
        <Row className="g-2 align-items-center">
          <Col md={3}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted mb-1">From Date</Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="vpm-gst-input"
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted mb-1">To Date</Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="vpm-gst-input"
              />
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted mb-1">Filter Customer</Form.Label>
              <Form.Select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="vpm-gst-input"
              >
                <option value="ALL">All B2B Customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.gst_no ? `(${c.gst_no})` : ''}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2} className="d-flex align-items-end">
            <button
              type="button"
              className="vpm-btn-gst-sec w-100 justify-content-center mt-3"
              style={{ height: 36 }}
              onClick={() => loadData()}
            >
              <Filter size={14} /> Apply Filter
            </button>
          </Col>
        </Row>
      </div>

      {/* ── Summary Tax Cards ─────────────────────────────────── */}
      <Row className="g-2">
        <Col xs={12} sm={6} md={3}>
          <div className="vpm-gst-stat-card">
            <span className="small text-muted fw-bold text-uppercase d-block mb-1">Total Taxable Sales</span>
            <div className="vpm-gst-stat-val text-primary">₹{totalTaxable.toLocaleString('en-IN')}</div>
          </div>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <div className="vpm-gst-stat-card">
            <span className="small text-muted fw-bold text-uppercase d-block mb-1">CGST Collected (9%)</span>
            <div className="vpm-gst-stat-val text-info">₹{totalCGST.toLocaleString('en-IN')}</div>
          </div>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <div className="vpm-gst-stat-card">
            <span className="small text-muted fw-bold text-uppercase d-block mb-1">SGST Collected (9%)</span>
            <div className="vpm-gst-stat-val text-info">₹{totalSGST.toLocaleString('en-IN')}</div>
          </div>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <div className="vpm-gst-stat-card">
            <span className="small text-muted fw-bold text-uppercase d-block mb-1">Total GST Liability</span>
            <div className="vpm-gst-stat-val text-success">₹{totalGstAmount.toLocaleString('en-IN')}</div>
          </div>
        </Col>
      </Row>

      {/* ── GST CA Report Table ───────────────────────────────── */}
      <div className="vpm-gst-table-card">
        <div className="vpm-table-header-pro">
          <h5 className="vpm-table-title-pro">
            <Receipt size={18} className="text-success" />
            GST Tax Invoices Statement ({startDate} to {endDate})
          </h5>
          <span className="vpm-gst-badge">GSTIN: 24BAAPM9783K1Z7</span>
        </div>

        <div className="table-responsive">
          <table className="vpm-gst-table">
            <thead>
              <tr>
                <th className="text-center">Sr.</th>
                <th className="text-start">Invoice No.</th>
                <th className="text-center">Date</th>
                <th className="text-start">Customer Name</th>
                <th className="text-center">GSTIN Number</th>
                <th className="text-end">Taxable Value</th>
                <th className="text-end">CGST (9%)</th>
                <th className="text-end">SGST (9%)</th>
                <th className="text-end">Total GST</th>
                <th className="text-end">Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {gstInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-5 text-muted fw-medium">
                    No GST Tax Invoices recorded within this date range.
                  </td>
                </tr>
              ) : (
                gstInvoices.map((inv, idx) => (
                  <tr key={inv.id}>
                    <td className="text-center">
                      <span className="vpm-date-pill">{idx + 1}</span>
                    </td>
                    <td className="text-start">
                      <span className="vpm-bill-num-pill">{inv.invoice_number}</span>
                    </td>
                    <td className="text-center">
                      <span className="vpm-date-pill">{inv.date}</span>
                    </td>
                    <td className="text-start">
                      <div className="vpm-cust-name-cell">
                        <div className="vpm-avatar-mini">
                          {inv.customer_name
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <span className="fw-bold">{inv.customer_name}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="vpm-gst-badge">{inv.customer_gstin || 'URP'}</span>
                    </td>
                    <td className="text-end">
                      <span className="vpm-amount-total">₹{inv.sub_total.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="text-end">
                      <span className="vpm-amount-paid">₹{inv.cgst.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="text-end">
                      <span className="vpm-amount-paid">₹{inv.sgst.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="text-end">
                      <span className="vpm-amount-paid" style={{ color: '#00D2FF' }}>
                        ₹{(inv.cgst + inv.sgst).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="text-end">
                      <span className="vpm-amount-balance" style={{ color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.1)' }}>
                        ₹{inv.grand_total.toLocaleString('en-IN')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="text-end text-uppercase fw-extrabold">
                  Summary Total:
                </td>
                <td className="text-end fw-extrabold">₹{totalTaxable.toLocaleString('en-IN')}</td>
                <td className="text-end fw-extrabold">₹{totalCGST.toLocaleString('en-IN')}</td>
                <td className="text-end fw-extrabold">₹{totalSGST.toLocaleString('en-IN')}</td>
                <td className="text-end fw-extrabold" style={{ color: '#00D2FF' }}>
                  ₹{totalGstAmount.toLocaleString('en-IN')}
                </td>
                <td className="text-end fw-extrabold fs-6" style={{ color: '#10B981' }}>
                  ₹{totalInvoiceValue.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

export default GstReportModule
