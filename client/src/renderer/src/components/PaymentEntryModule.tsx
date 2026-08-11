import React, { useState, useEffect } from 'react'
import { Row, Col, Modal, Form } from 'react-bootstrap'
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  History,
  Receipt,
  Wallet,
  Building2,
  QrCode,
  Banknote,
  Check,
  TrendingUp,
  FileText
} from 'lucide-react'
import { DataService, Invoice, PaymentRecord } from '../services/dataService'
import './PaymentEntryModule.css'

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
  const gstInvoices = invoices.filter((i) => i.type === 'TAX_INVOICE')
  const nonGstInvoices = invoices.filter((i) => i.type !== 'TAX_INVOICE')

  const gstOutstanding = gstInvoices.reduce((sum, i) => sum + i.balance_amount, 0)
  const nonGstOutstanding = nonGstInvoices.reduce((sum, i) => sum + i.balance_amount, 0)

  return (
    <div className={`vpm-payment-module ${isDark ? 'theme-dark' : 'theme-light'}`}>
      {/* ── Top Header Banner ─────────────────────────────────── */}
      <div className="vpm-header-banner p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="vpm-header-icon-box">
            <CreditCard size={26} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h4 className="fw-extrabold m-0 text-gradient-title">Payment Entry & Outstanding Management</h4>
              <span className="vpm-badge-bill vpm-badge-bill-tax">
                <TrendingUp size={12} /> Real-Time
              </span>
            </div>
            <p className="text-muted small m-0 fw-medium">
              Manage and record payments separately for GST Tax Invoices and Non-GST Estimates & Quotations.
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary Stats Cards ───────────────────────────────── */}
      <Row className="g-3">
        <Col md={6}>
          <div className="vpm-stat-card-pro gst-card d-flex justify-content-between align-items-center">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <Receipt size={16} className="text-primary" />
                <span className="small text-muted fw-bold text-uppercase tracking-wider">
                  GST Bills Outstanding (Tax Invoices)
                </span>
              </div>
              <div className="vpm-stat-val-gst mb-1">₹{gstOutstanding.toLocaleString('en-IN')}</div>
              <span className="small text-muted fw-medium">
                From {gstInvoices.length} active GST Tax Invoices
              </span>
            </div>
            <span className="vpm-stat-badge-gst">GST Ledger</span>
          </div>
        </Col>

        <Col md={6}>
          <div className="vpm-stat-card-pro nongst-card d-flex justify-content-between align-items-center">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <FileText size={16} className="text-warning" />
                <span className="small text-muted fw-bold text-uppercase tracking-wider">
                  Non-GST Bills Outstanding (Estimates & Quotes)
                </span>
              </div>
              <div className="vpm-stat-val-nongst mb-1">₹{nonGstOutstanding.toLocaleString('en-IN')}</div>
              <span className="small text-muted fw-medium">
                From {nonGstInvoices.length} active Non-GST Bills
              </span>
            </div>
            <span className="vpm-stat-badge-nongst">Non-GST Ledger</span>
          </div>
        </Col>
      </Row>

      {/* ── Filter Tabs & Search Bar ─────────────────────────── */}
      <div className="vpm-filter-bar-pro d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="vpm-segmented-container">
          <button
            type="button"
            className={`vpm-tab-btn-pro ${filterMode === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterMode('ALL')}
          >
            All Bills
            <span className="vpm-tab-count-badge">{invoices.length}</span>
          </button>
          <button
            type="button"
            className={`vpm-tab-btn-pro ${filterMode === 'GST' ? 'active' : ''}`}
            onClick={() => setFilterMode('GST')}
          >
            <Receipt size={14} />
            GST Tax Invoices
            <span className="vpm-tab-count-badge">{gstInvoices.length}</span>
          </button>
          <button
            type="button"
            className={`vpm-tab-btn-pro ${filterMode === 'NON_GST' ? 'active' : ''}`}
            onClick={() => setFilterMode('NON_GST')}
          >
            <FileText size={14} />
            Non-GST Estimates
            <span className="vpm-tab-count-badge">{nonGstInvoices.length}</span>
          </button>
        </div>

        <div className="vpm-search-wrap-pro" style={{ maxWidth: '380px' }}>
          <Search size={18} className="vpm-search-icon-pro" />
          <input
            type="text"
            className="vpm-search-input-pro"
            placeholder="Search bill number or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Invoice List & Payment Actions Table ───────────────── */}
      <div className="vpm-table-card-pro">
        <div className="vpm-table-header-pro">
          <h5 className="vpm-table-title-pro">
            <Wallet size={18} className="text-primary" />
            Pending & Active Invoices ({filteredInvoices.length})
          </h5>
          <span className="small text-muted fw-bold">Showing {filteredInvoices.length} entries</span>
        </div>

        <div className="table-responsive">
          <table className="vpm-table-pro">
            <thead>
              <tr>
                <th className="text-start">Bill #</th>
                <th className="text-start">Customer Name</th>
                <th className="text-center">Bill Type</th>
                <th className="text-center">Date</th>
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
                  <td colSpan={9} className="text-center py-5 text-muted fw-medium">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="text-start">
                      <span className="vpm-bill-num-pill">{inv.invoice_number}</span>
                    </td>
                    <td className="text-start">
                      <div className="vpm-customer-cell">
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
                      {inv.type === 'TAX_INVOICE' && (
                        <span className="vpm-badge-bill vpm-badge-bill-tax">TAX INVOICE</span>
                      )}
                      {inv.type === 'QUOTATION' && (
                        <span className="vpm-badge-bill vpm-badge-bill-quote">QUOTATION</span>
                      )}
                      {inv.type === 'ESTIMATE' && (
                        <span className="vpm-badge-bill vpm-badge-bill-estimate">ESTIMATE</span>
                      )}
                    </td>
                    <td className="text-center">
                      <span className="vpm-date-pill">{inv.date}</span>
                    </td>

                    <td className="text-end">
                      <span className="vpm-amount-total">₹{inv.grand_total.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="text-end">
                      <span className="vpm-amount-paid">₹{inv.paid_amount.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="text-end">
                      <span className="vpm-amount-balance">₹{inv.balance_amount.toLocaleString('en-IN')}</span>
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
                      {inv.status === 'UNPAID' && (
                        <span className="vpm-status-pill vpm-status-pill-unpaid">
                          <span className="vpm-status-dot" /> Unpaid
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      {inv.balance_amount > 0 ? (
                        <button
                          type="button"
                          className="vpm-btn-record-pay"
                          onClick={() => handleOpenPaymentModal(inv)}
                        >
                          <Plus size={15} /> Record Payment
                        </button>
                      ) : (
                        <span className="small text-success fw-extrabold d-inline-flex align-items-center gap-1">
                          <CheckCircle2 size={16} /> Fully Paid
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Payment History Log ──────────────────────────────── */}
      <div className="vpm-table-card-pro">
        <div className="vpm-table-header-pro">
          <h5 className="vpm-table-title-pro">
            <History size={18} className="text-primary" /> Payment Transaction History
          </h5>
          <span className="small text-muted fw-bold">{payments.length} Records</span>
        </div>

        <div className="table-responsive">
          <table className="vpm-table-pro">
            <thead>
              <tr>
                <th className="text-center">Date</th>
                <th className="text-start">Bill #</th>
                <th className="text-start">Customer</th>
                <th className="text-center">Mode</th>
                <th className="text-end">Amount Paid</th>
                <th className="text-start">Notes</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted fw-medium">
                    No payment history recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td className="text-center">
                      <span className="vpm-date-pill">{p.date}</span>
                    </td>
                    <td className="text-start">
                      <span className="vpm-bill-num-pill">{p.invoice_number}</span>
                    </td>
                    <td className="text-start">
                      <div className="vpm-customer-cell">
                        <div className="vpm-avatar-mini">
                          {p.customer_name
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <span className="fw-bold">{p.customer_name}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="vpm-badge-bill vpm-badge-bill-tax">
                        {p.payment_type === 'BANK' && <Building2 size={12} className="me-1" />}
                        {p.payment_type === 'UPI' && <QrCode size={12} className="me-1" />}
                        {p.payment_type === 'CASH' && <Banknote size={12} className="me-1" />}
                        {p.payment_type === 'CARD' && <CreditCard size={12} className="me-1" />}
                        {p.payment_type}
                      </span>
                    </td>
                    <td className="text-end">
                      <span className="vpm-amount-paid fs-6">₹{p.amount.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="text-start small text-muted">{p.notes || 'N/A'}</td>
                  </tr>

                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Record Payment Entry Modal ───────────────────────── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="vpm-modal-dialog">
        <div className={isDark ? 'theme-dark' : 'theme-light'}>
          <div className="modal-content border-0">
            <div className="vpm-modal-header-pro d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div className="vpm-header-icon-box" style={{ width: 36, height: 36, borderRadius: 10 }}>
                  <CreditCard size={18} />
                </div>
                <h5 className="fw-extrabold m-0">Record Customer Payment Entry</h5>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowModal(false)}
              />
            </div>
            <Form onSubmit={handleSavePayment}>
              <Modal.Body className="p-4">
                {selectedInvoice && (
                  <div className="vpm-invoice-preview-box">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="small text-muted fw-bold">Bill Number:</span>
                      <strong className="text-primary fw-extrabold">{selectedInvoice.invoice_number}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="small text-muted fw-bold">Customer Name:</span>
                      <strong className="fw-bold">{selectedInvoice.customer_name}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="small text-muted fw-bold">Grand Total:</span>
                      <strong className="fw-extrabold">₹{selectedInvoice.grand_total.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="d-flex justify-content-between pt-2 border-top border-secondary-subtle">
                      <span className="small text-muted fw-bold">Outstanding Balance:</span>
                      <strong className="text-danger fw-extrabold fs-6">
                        ₹{selectedInvoice.balance_amount.toLocaleString('en-IN')}
                      </strong>
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
                    className="vpm-search-input-pro"
                    style={{ paddingLeft: '14px' }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small">Payment Mode Method</Form.Label>
                  <Form.Select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="vpm-search-input-pro"
                    style={{ paddingLeft: '14px' }}
                  >
                    <option value="BANK">Bank Transfer (IMPS / NEFT / RTGS)</option>
                    <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                    <option value="CASH">Cash Payment</option>
                    <option value="CARD">Debit / Credit Card</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="fw-bold small">Transaction Reference / UTR / Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="e.g. UTR / Transaction ID or cheque details"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="vpm-search-input-pro"
                    style={{ paddingLeft: '14px', height: 'auto' }}
                  />
                </Form.Group>
              </Modal.Body>

              <div className="p-3 bg-light-subtle d-flex justify-content-end gap-2 border-top">
                <button
                  type="button"
                  className="vpm-tab-btn-pro"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vpm-btn-record-pay"
                  style={{ padding: '9px 24px' }}
                >
                  <Check size={16} /> Save Payment Entry
                </button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PaymentEntryModule
