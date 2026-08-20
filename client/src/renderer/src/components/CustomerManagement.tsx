import React, { useState, useEffect } from 'react'
import { Row, Col, Modal, Form } from 'react-bootstrap'
import { UserCheck, Plus, Search, Edit2, Trash2, BookOpen, Phone, Mail, MapPin } from 'lucide-react'
import { DataService, Customer, Invoice } from '../services/dataService'
import './CustomerManagement.css'

interface CustomerManagementProps {
  theme: 'dark' | 'light'
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({ theme }) => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Modal States
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null)
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<Customer | null>(null)

  const isDark = theme === 'dark'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setCustomers(DataService.getCustomers())
    setInvoices(DataService.getInvoices())
  }

  const handleOpenAdd = () => {
    setEditingCustomer({
      name: '',
      mobile: '',
      email: '',
      gst_no: '',
      billing_address: '',
      shipping_address: '',
      outstanding_balance: 0
    })
    setShowModal(true)
  }

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer({ ...customer })
    setShowModal(true)
  }

  const handleModalGstChange = (val: string) => {
    const cleanGst = val.toUpperCase().trim()
    setEditingCustomer((prev) => ({ ...prev, gst_no: cleanGst }))

    if (cleanGst.length >= 5) {
      const result = DataService.lookupGst(cleanGst)
      if (result.existingCustomer) {
        const c = result.existingCustomer
        setEditingCustomer((prev) => ({
          ...prev,
          name: prev?.name || c.name,
          mobile: prev?.mobile || c.mobile,
          billing_address: prev?.billing_address || c.billing_address,
          shipping_address: prev?.shipping_address || c.shipping_address || c.billing_address
        }))
      } else if (cleanGst.length === 15 && result.parsed) {
        const p = result.parsed
        setEditingCustomer((prev) => ({
          ...prev,
          name: prev?.name || p.companyName,
          mobile: prev?.mobile || p.mobile,
          billing_address: prev?.billing_address || p.address,
          shipping_address: prev?.shipping_address || p.address
        }))
      }
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCustomer || !editingCustomer.name) return
    DataService.saveCustomer(editingCustomer)
    setShowModal(false)
    loadData()
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      DataService.deleteCustomer(id)
      loadData()
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobile.includes(searchQuery) ||
      (c.gst_no && c.gst_no.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const customerInvoices = selectedLedgerCustomer
    ? invoices.filter((i) => i.customer_name.toLowerCase() === selectedLedgerCustomer.name.toLowerCase())
    : []

  return (
    <div className={`vpm-cust-module ${isDark ? 'theme-dark' : 'theme-light'}`}>
      {/* ── Top Header Banner ─────────────────────────────────── */}
      <div className="vpm-cust-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="vpm-cust-icon-box">
            <UserCheck size={22} />
          </div>
          <div>
            <h4 className="fw-extrabold m-0 text-gradient-title">Customer Management</h4>
            <p className="text-muted small m-0 fw-medium">
              Manage complete customer database, GSTIN records, addresses, ledgers, and outstanding balances.
            </p>
          </div>
        </div>

        <button type="button" className="vpm-btn-add-cust" onClick={handleOpenAdd}>
          <Plus size={16} /> Add New Customer
        </button>
      </div>

      {/* ── Search Bar ───────────────────────────────────────── */}
      <div className="vpm-cust-search-bar">
        <div className="vpm-cust-search-wrap">
          <Search size={18} className="vpm-cust-search-icon" />
          <input
            type="text"
            className="vpm-cust-search-input"
            placeholder="Search customers by Name, Mobile number, or GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Customers List Table ──────────────────────────────── */}
      <div className="vpm-cust-table-card">
        <div className="table-responsive">
          <table className="vpm-cust-table">
            <thead>
              <tr>
                <th className="text-start">Customer Name</th>
                <th className="text-start">Contact Info</th>
                <th className="text-center">GST Number</th>
                <th className="text-start">Billing Address</th>
                <th className="text-end">Outstanding Balance</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted fw-medium">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id}>
                    <td className="text-start">
                      <div className="vpm-cust-name-cell">
                        <div className="vpm-cust-avatar">
                          {cust.name
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="vpm-cust-info-box">
                          <span className="vpm-cust-title">{cust.name}</span>
                          <span className="vpm-cust-date">Added {cust.created_at}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-start">
                      <div className="d-flex flex-column gap-1">
                        <span className="vpm-contact-pill">
                          <Phone size={12} className="text-primary" /> {cust.mobile || 'N/A'}
                        </span>
                        {cust.email && (
                          <span className="vpm-contact-pill text-muted">
                            <Mail size={12} /> {cust.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      {cust.gst_no ? (
                        <span className="vpm-gst-badge">{cust.gst_no}</span>
                      ) : (
                        <span className="vpm-gst-nongst-tag">Non-GST</span>
                      )}
                    </td>
                    <td className="text-start">
                      <span className="vpm-contact-pill text-truncate d-inline-block" style={{ maxWidth: '220px' }}>
                        <MapPin size={12} className="me-1 text-primary" />
                        {cust.billing_address || 'Not specified'}
                      </span>
                    </td>
                    <td className="text-end">
                      {cust.outstanding_balance > 0 ? (
                        <span className="vpm-amount-balance">₹{cust.outstanding_balance.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="vpm-amount-paid">₹0</span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="vpm-action-group">
                        <button
                          type="button"
                          className="vpm-act-btn vpm-act-btn-ledger"
                          title="Customer Ledger"
                          onClick={() => setSelectedLedgerCustomer(cust)}
                        >
                          <BookOpen size={14} />
                        </button>
                        <button
                          type="button"
                          className="vpm-act-btn vpm-act-btn-edit"
                          title="Edit Customer"
                          onClick={() => handleOpenEdit(cust)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="vpm-act-btn vpm-act-btn-delete"
                          title="Delete Customer"
                          onClick={() => handleDelete(cust.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Customer Modal ──────────────────────────── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" className="vpm-modal-dialog">
        <div className={isDark ? 'theme-dark' : 'theme-light'}>
          <div className="modal-content border-0">
            <div className="vpm-modal-header-pro d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div className="vpm-cust-icon-box" style={{ width: 34, height: 34, borderRadius: 10 }}>
                  <UserCheck size={18} />
                </div>
                <h5 className="fw-extrabold m-0">
                  {editingCustomer?.id ? 'Edit Customer Information' : 'Add New Customer'}
                </h5>
              </div>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
            </div>

            <Form onSubmit={handleSave}>
              <Modal.Body className="p-4">
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">Customer / Business Name *</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        placeholder="Enter business name"
                        value={editingCustomer?.name || ''}
                        onChange={(e) => setEditingCustomer((prev) => ({ ...prev, name: e.target.value }))}
                        className="vpm-cust-search-input"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">Contact Mobile Number (10 Digits) *</Form.Label>
                      <Form.Control
                        required
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={editingCustomer?.mobile || ''}
                        onChange={(e) => setEditingCustomer((prev) => ({ ...prev, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        className="vpm-cust-search-input"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter email address"
                        value={editingCustomer?.email || ''}
                        onChange={(e) => setEditingCustomer((prev) => ({ ...prev, email: e.target.value }))}
                        className="vpm-cust-search-input"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">GSTIN Number (Optional)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. 24AAAAA0000A1Z5"
                        value={editingCustomer?.gst_no || ''}
                        onChange={(e) => handleModalGstChange(e.target.value)}
                        className="vpm-cust-search-input"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">Billing Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Enter complete billing address"
                        value={editingCustomer?.billing_address || ''}
                        onChange={(e) => setEditingCustomer((prev) => ({ ...prev, billing_address: e.target.value }))}
                        className="vpm-cust-search-input"
                        style={{ paddingLeft: '14px', height: 'auto' }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">Shipping Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Enter shipping address (if different)"
                        value={editingCustomer?.shipping_address || ''}
                        onChange={(e) => setEditingCustomer((prev) => ({ ...prev, shipping_address: e.target.value }))}
                        className="vpm-cust-search-input"
                        style={{ paddingLeft: '14px', height: 'auto' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Modal.Body>

              <div className="p-3 bg-light-subtle d-flex justify-content-end gap-2 border-top">
                <button type="button" className="vpm-tab-btn-pro" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="vpm-btn-add-cust" style={{ padding: '8px 24px' }}>
                  Save Customer Details
                </button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>

      {/* ── Customer Ledger Modal ──────────────────────────────── */}
      {selectedLedgerCustomer && (
        <Modal show onHide={() => setSelectedLedgerCustomer(null)} centered size="lg" className="vpm-modal-dialog">
          <div className={isDark ? 'theme-dark' : 'theme-light'}>
            <div className="modal-content border-0">
              <div className="vpm-modal-header-pro d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-extrabold m-0">Customer Account Statement / Ledger</h5>
                  <span className="small text-muted fw-bold">{selectedLedgerCustomer.name}</span>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedLedgerCustomer(null)} />
              </div>

              <Modal.Body className="p-4">
                <div className="vpm-invoice-preview-box d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <span className="small text-muted fw-bold d-block">Current Outstanding Balance</span>
                    <h4 className="fw-extrabold text-danger m-0">
                      ₹{selectedLedgerCustomer.outstanding_balance.toLocaleString('en-IN')}
                    </h4>
                  </div>
                  <span className="vpm-gst-badge">GSTIN: {selectedLedgerCustomer.gst_no || 'N/A'}</span>
                </div>

                <h6 className="fw-extrabold mb-3">Invoice & Payment History</h6>
                <div className="table-responsive">
                  <table className="vpm-cust-table">
                    <thead>
                      <tr>
                        <th className="text-start">Date</th>
                        <th className="text-start">Invoice #</th>
                        <th className="text-center">Type</th>
                        <th className="text-end">Total Amount</th>
                        <th className="text-end">Paid Amount</th>
                        <th className="text-end">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted">
                            No billing history found for this customer.
                          </td>
                        </tr>
                      ) : (
                        customerInvoices.map((inv) => (
                          <tr key={inv.id}>
                            <td className="text-start">{inv.date}</td>
                            <td className="text-start fw-bold">{inv.invoice_number}</td>
                            <td className="text-center">
                              <span className="vpm-badge-bill vpm-badge-bill-tax">{inv.type}</span>
                            </td>
                            <td className="text-end fw-bold">₹{inv.grand_total.toLocaleString('en-IN')}</td>
                            <td className="text-end text-success fw-bold">₹{inv.paid_amount.toLocaleString('en-IN')}</td>
                            <td className="text-end text-danger fw-extrabold">
                              ₹{inv.balance_amount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Modal.Body>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default CustomerManagement
