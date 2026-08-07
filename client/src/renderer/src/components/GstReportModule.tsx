import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Table, Form, Badge } from 'react-bootstrap'
import { FileSpreadsheet, Download, Printer, Filter } from 'lucide-react'
import { DataService, Invoice, Customer } from '../services/dataService'

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
    <div className="vpm-gst-report-module">
      {/* ── Top Header ───────────────────────────────────────── */}
      <Card
        className={`border-0 shadow-sm rounded-4 mb-4 ${
          isDark ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white'
        }`}
      >
        <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <FileSpreadsheet className="text-emerald-500" size={24} style={{ color: '#10B981' }} />
              <h4 className="fw-bold m-0">GST Summary Report (CA Filing Format)</h4>
            </div>
            <p className="text-muted small m-0">
              Generate B2B tax invoice summary reports formatted specifically for Chartered Accountant GST return filing.
            </p>
          </div>

          <div className="d-flex gap-2">
            <Button variant="outline-primary" className="fw-bold rounded-3 d-flex align-items-center gap-2" onClick={handlePrint}>
              <Printer size={16} /> Print Report
            </Button>
            <Button
              variant="success"
              className="fw-bold rounded-3 d-flex align-items-center gap-2 px-3"
              onClick={exportToCSV}
            >
              <Download size={16} /> Export to Excel / CSV
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* ── Filter Controls ───────────────────────────────────── */}
      <Card className={`border-0 shadow-sm rounded-4 mb-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">Filter Customer</Form.Label>
                <Form.Select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
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
              <Button variant="secondary" className="w-100 fw-bold mt-4" onClick={() => loadData()}>
                <Filter size={15} className="me-1" /> Apply
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Summary Tax Cards ─────────────────────────────────── */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} md={3}>
          <Card className={`border-0 shadow-sm rounded-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
            <Card.Body className="p-3">
              <span className="small text-muted fw-bold text-uppercase d-block mb-1">Total Taxable Sales</span>
              <h4 className="fw-bold text-primary m-0">₹{totalTaxable.toLocaleString('en-IN')}</h4>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <Card className={`border-0 shadow-sm rounded-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
            <Card.Body className="p-3">
              <span className="small text-muted fw-bold text-uppercase d-block mb-1">CGST Collected (9%)</span>
              <h4 className="fw-bold text-info m-0">₹{totalCGST.toLocaleString('en-IN')}</h4>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <Card className={`border-0 shadow-sm rounded-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
            <Card.Body className="p-3">
              <span className="small text-muted fw-bold text-uppercase d-block mb-1">SGST Collected (9%)</span>
              <h4 className="fw-bold text-info m-0">₹{totalSGST.toLocaleString('en-IN')}</h4>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <Card className={`border-0 shadow-sm rounded-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
            <Card.Body className="p-3">
              <span className="small text-muted fw-bold text-uppercase d-block mb-1">Total GST Liability</span>
              <h4 className="fw-bold text-success m-0">₹{totalGstAmount.toLocaleString('en-IN')}</h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── GST CA Report Table ───────────────────────────────── */}
      <Card className={`border-0 shadow-sm rounded-4 overflow-hidden ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <Card.Header className="bg-transparent border-0 p-3 fw-bold fs-6 d-flex justify-content-between align-items-center">
          <span>
            GST Tax Invoices Statement ({startDate} to {endDate})
          </span>
          <Badge bg="success">Viral Print Media GSTIN: 24BAAPM9783K1Z7</Badge>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover bordered className={`m-0 align-middle ${isDark ? 'table-dark' : ''}`}>
              <thead className={isDark ? 'bg-slate-800' : 'bg-light'}>
                <tr className="small text-uppercase text-muted">
                  <th>Sr.</th>
                  <th>Invoice No.</th>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th>GSTIN Number</th>
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
                    <td colSpan={10} className="text-center py-4 text-muted">
                      No GST Tax Invoices recorded within this date range.
                    </td>
                  </tr>
                ) : (
                  gstInvoices.map((inv, idx) => (
                    <tr key={inv.id}>
                      <td className="text-center small">{idx + 1}</td>
                      <td className="fw-bold">{inv.invoice_number}</td>
                      <td className="small">{inv.date}</td>
                      <td>{inv.customer_name}</td>
                      <td className="font-monospace small">{inv.customer_gstin || 'URP'}</td>
                      <td className="text-end">₹{inv.sub_total.toLocaleString('en-IN')}</td>
                      <td className="text-end">₹{inv.cgst.toLocaleString('en-IN')}</td>
                      <td className="text-end">₹{inv.sgst.toLocaleString('en-IN')}</td>
                      <td className="text-end fw-semibold text-info">₹{(inv.cgst + inv.sgst).toLocaleString('en-IN')}</td>
                      <td className="text-end fw-bold text-success">₹{inv.grand_total.toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className={`fw-bold ${isDark ? 'bg-slate-800' : 'bg-light'}`}>
                  <td colSpan={5} className="text-end text-uppercase">
                    Summary Total:
                  </td>
                  <td className="text-end">₹{totalTaxable.toLocaleString('en-IN')}</td>
                  <td className="text-end">₹{totalCGST.toLocaleString('en-IN')}</td>
                  <td className="text-end">₹{totalSGST.toLocaleString('en-IN')}</td>
                  <td className="text-end text-info">₹{totalGstAmount.toLocaleString('en-IN')}</td>
                  <td className="text-end text-success fs-6">₹{totalInvoiceValue.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}

export default GstReportModule
