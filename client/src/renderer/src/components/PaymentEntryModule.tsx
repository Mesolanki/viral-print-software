import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Table, Modal, Form, Badge, InputGroup, Nav } from 'react-bootstrap'
import { CreditCard, Plus, Search, CheckCircle2, History } from 'lucide-react'
import { DataService, Invoice, PaymentRecord } from '../services/dataService'

interface PaymentEntryModuleProps {
  theme: 'dark' | 'light'
}

const PaymentEntryModule: React.FC<PaymentEntryModuleProps> = ({ theme }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [filterMode, setFilterMode] = useState<'ALL' | 'GST' | 'NON_GST'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Payment Entry Modal State
  const [showModal, setShowModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentType, setPaymentType] = useState<'CASH' | 'BANK' | 'UPI' | 'CARD'>('BANK')
  const [paymentNotes, setPaymentNotes] = useState('')

  const isDark = theme === 'dark'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setInvoices(DataService.getInvoices())
    setPayments(DataService.getPayments())
  }

  const handleOpenPaymentModal = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setPaymentAmount(inv.balance_amount)
    setPaymentType('BANK')
    setPaymentNotes('')
    setShowModal(true)
  }

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoice || paymentAmount <= 0) return

    DataService.recordPayment({
      invoice_id: selectedInvoice.id,
      invoice_number: selectedInvoice.invoice_number,
      invoice_type: selectedInvoice.type,
      customer_name: selectedInvoice.customer_name,
      date: new Date().toISOString().split('T')[0],
      amount: paymentAmount,
      payment_type: paymentType,
      notes: paymentNotes
    })

    setShowModal(false)
    loadData()
  }

  // Filtering
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase())

    if (filterMode === 'GST') return matchesSearch && inv.type === 'TAX_INVOICE'
    if (filterMode === 'NON_GST') return matchesSearch && (inv.type === 'ESTIMATE' || inv.type === 'QUOTATION')
    return matchesSearch
  })

  // Outstanding Summary Metrics
  const gstOutstanding = invoices
    .filter((i) => i.type === 'TAX_INVOICE')
    .reduce((sum, i) => sum + i.balance_amount, 0)

  const nonGstOutstanding = invoices
    .filter((i) => i.type !== 'TAX_INVOICE')
    .reduce((sum, i) => sum + i.balance_amount, 0)

  return (
    <div className="vpm-payment-entry-module">
      {/* ── Top Header ───────────────────────────────────────── */}
      <Card
        className={`border-0 shadow-sm rounded-4 mb-4 ${
          isDark ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white'
        }`}
      >
        <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <CreditCard className="text-success" size={24} />
              <h4 className="fw-bold m-0">Payment Entry & Outstanding Management</h4>
            </div>
            <p className="text-muted small m-0">
              Manage all customer payment transactions separately for GST (Tax Invoices) and Non-GST (Estimates/Quotes).
            </p>
          </div>
        </Card.Body>
      </Card>

      {/* ── Summary Stats Cards ───────────────────────────────── */}
      <Row className="g-3 mb-4">
        <Col md={6}>
          <Card
            className={`border-0 shadow-sm rounded-4 ${
              isDark ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white'
            }`}
          >
            <Card.Body className="p-3 d-flex justify-content-between align-items-center">
              <div>
                <span className="small text-muted fw-bold text-uppercase d-block mb-1">
                  GST Bills Outstanding (Tax Invoices)
                </span>
                <h3 className="fw-bold text-primary m-0">₹{gstOutstanding.toLocaleString('en-IN')}</h3>
              </div>
              <Badge bg="primary" className="p-2 fs-6">
                GST Ledger
              </Badge>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card
            className={`border-0 shadow-sm rounded-4 ${
              isDark ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white'
            }`}
          >
            <Card.Body className="p-3 d-flex justify-content-between align-items-center">
              <div>
                <span className="small text-muted fw-bold text-uppercase d-block mb-1">
                  Non-GST Bills Outstanding (Estimates & Quotes)
                </span>
                <h3 className="fw-bold text-warning m-0">₹{nonGstOutstanding.toLocaleString('en-IN')}</h3>
              </div>
              <Badge bg="warning" className="text-dark p-2 fs-6">
                Non-GST Ledger
              </Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Filter Tabs & Search Bar ─────────────────────────── */}
      <Card className={`border-0 shadow-sm rounded-4 mb-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col md={6}>
              <Nav variant="pills" activeKey={filterMode} onSelect={(k) => setFilterMode(k as any)}>
                <Nav.Item>
                  <Nav.Link eventKey="ALL" className="fw-bold px-3">
                    All Bills ({invoices.length})
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="GST" className="fw-bold px-3">
                    GST Tax Invoices
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="NON_GST" className="fw-bold px-3">
                    Non-GST Estimates
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>

            <Col md={6}>
              <InputGroup>
                <InputGroup.Text
                  className={isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-light border-gray-200'}
                >
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search bill number or customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
                />
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Invoice List & Payment Actions Table ───────────────── */}
      <Card className={`border-0 shadow-sm rounded-4 overflow-hidden mb-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <Card.Header className="bg-transparent border-0 p-3 fw-bold fs-6">
          Pending & Active Invoices ({filteredInvoices.length})
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className={`m-0 align-middle ${isDark ? 'table-dark' : ''}`}>
              <thead className={isDark ? 'bg-slate-800' : 'bg-light'}>
                <tr className="small text-uppercase text-muted">
                  <th>Bill #</th>
                  <th>Customer Name</th>
                  <th>Bill Type</th>
                  <th>Date</th>
                  <th className="text-end">Grand Total</th>
                  <th className="text-end">Paid Amount</th>
                  <th className="text-end">Balance Amount</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="fw-bold">{inv.invoice_number}</td>
                      <td>{inv.customer_name}</td>
                      <td>
                        <Badge bg={inv.type === 'TAX_INVOICE' ? 'primary' : 'warning'}>
                          {inv.type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="small text-muted">{inv.date}</td>
                      <td className="text-end fw-bold">₹{inv.grand_total.toLocaleString('en-IN')}</td>
                      <td className="text-end text-success">₹{inv.paid_amount.toLocaleString('en-IN')}</td>
                      <td className="text-end text-danger fw-bold">₹{inv.balance_amount.toLocaleString('en-IN')}</td>
                      <td className="text-center">
                        <Badge bg={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'}>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="text-center">
                        {inv.balance_amount > 0 ? (
                          <Button
                            variant="success"
                            size="sm"
                            className="fw-bold rounded-3 d-inline-flex align-items-center gap-1"
                            onClick={() => handleOpenPaymentModal(inv)}
                          >
                            <Plus size={14} /> Record Payment
                          </Button>
                        ) : (
                          <span className="small text-success fw-bold">
                            <CheckCircle2 size={16} className="me-1" /> Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* ── Payment History Log ──────────────────────────────── */}
      <Card className={`border-0 shadow-sm rounded-4 overflow-hidden ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <Card.Header className="bg-transparent border-0 p-3 fw-bold fs-6 d-flex align-items-center gap-2">
          <History size={18} className="text-primary" /> Payment Transaction History
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className={`m-0 align-middle ${isDark ? 'table-dark' : ''}`}>
              <thead className={isDark ? 'bg-slate-800' : 'bg-light'}>
                <tr className="small text-uppercase text-muted">
                  <th>Date</th>
                  <th>Bill #</th>
                  <th>Customer</th>
                  <th>Mode</th>
                  <th className="text-end">Amount Paid</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="small text-muted">{p.date}</td>
                    <td className="fw-bold">{p.invoice_number}</td>
                    <td>{p.customer_name}</td>
                    <td>
                      <Badge bg="secondary">{p.payment_type}</Badge>
                    </td>
                    <td className="text-end fw-bold text-success">₹{p.amount.toLocaleString('en-IN')}</td>
                    <td className="small text-muted">{p.notes || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* ── Record Payment Entry Modal ───────────────────────── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className={isDark ? 'bg-slate-800 text-white border-slate-700' : ''}>
          <Modal.Title className="fw-bold fs-5">Record Customer Payment Entry</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSavePayment}>
          <Modal.Body className={isDark ? 'bg-slate-900 text-white' : ''}>
            {selectedInvoice && (
              <div className="p-3 bg-light rounded-3 text-dark mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small text-muted">Bill Number:</span>
                  <strong>{selectedInvoice.invoice_number}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="small text-muted">Customer Name:</span>
                  <strong>{selectedInvoice.customer_name}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="small text-muted">Total Amount:</span>
                  <strong>₹{selectedInvoice.grand_total.toLocaleString('en-IN')}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="small text-muted">Remaining Balance:</span>
                  <strong className="text-danger">₹{selectedInvoice.balance_amount.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Payment Amount Received (₹) *</Form.Label>
              <Form.Control
                required
                type="number"
                max={selectedInvoice?.balance_amount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Payment Method Mode</Form.Label>
              <Form.Select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as any)}
                className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
              >
                <option value="BANK">Bank Transfer (IMPS/NEFT)</option>
                <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                <option value="CASH">Cash Payment</option>
                <option value="CARD">Debit / Credit Card</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="fw-bold small">Transaction Reference / Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="e.g. UTR / URN number or payment note"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit" className="fw-bold">
              Save Payment Entry
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default PaymentEntryModule
