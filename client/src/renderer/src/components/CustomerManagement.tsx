import React, { useState, useEffect, useMemo } from 'react'
import { Row, Col, Modal, Form } from 'react-bootstrap'
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Building2,
  UserX,
  AlertCircle,
  X
} from 'lucide-react'

import { DataService, Customer, Invoice } from '../services/dataService'
import './CustomerManagement.css'

interface CustomerManagementProps {
  theme: 'dark' | 'light'
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({ theme }) => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  // ── Filter States ────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [gstFilter, setGstFilter] = useState<'ALL' | 'GST' | 'NON_GST'>('ALL')
  const [dueFilter, setDueFilter] = useState<'ALL' | 'DUE_ONLY' | 'HIGH_DUE' | 'ZERO_DUE'>('ALL')
  const [sortBy, setSortBy] = useState<'name_asc' | 'due_desc' | 'due_asc' | 'newest'>('name_asc')

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

  // ── Dynamic Filter & Sorting Computation ───────────────────────
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // 1. GST Filter
        const hasGst = !!(c.gst_no && c.gst_no.trim().length > 0)
        if (gstFilter === 'GST' && !hasGst) return false
        if (gstFilter === 'NON_GST' && hasGst) return false

        // 2. Outstanding Balance Filter
        const balance = Number(c.outstanding_balance) || 0
        if (dueFilter === 'DUE_ONLY' && balance <= 0) return false
        if (dueFilter === 'HIGH_DUE' && balance < 5000) return false
        if (dueFilter === 'ZERO_DUE' && balance > 0) return false

        // 3. Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const matchName = c.name.toLowerCase().includes(q)
          const matchMobile = c.mobile.includes(q)
          const matchGst = c.gst_no ? c.gst_no.toLowerCase().includes(q) : false
          const matchAddress = c.billing_address ? c.billing_address.toLowerCase().includes(q) : false
          if (!matchName && !matchMobile && !matchGst && !matchAddress) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
        if (sortBy === 'due_desc') return (Number(b.outstanding_balance) || 0) - (Number(a.outstanding_balance) || 0)
        if (sortBy === 'due_asc') return (Number(a.outstanding_balance) || 0) - (Number(b.outstanding_balance) || 0)
        if (sortBy === 'newest') return (b.id || 0) - (a.id || 0)
        return 0
      })
  }, [customers, searchQuery, gstFilter, dueFilter, sortBy])

  // ── Dynamic Filter Metrics Memo ─────────────────────────────────
  const metrics = useMemo(() => {
    const totalCount = filteredCustomers.length
    let gstCount = 0
    let nonGstCount = 0
    let totalDues = 0

    filteredCustomers.forEach((c) => {
      const hasGst = !!(c.gst_no && c.gst_no.trim().length > 0)
      if (hasGst) gstCount++
      else nonGstCount++
      totalDues += Number(c.outstanding_balance) || 0
    })

    return { totalCount, gstCount, nonGstCount, totalDues }
  }, [filteredCustomers])

  const customerInvoices = selectedLedgerCustomer
    ? invoices.filter((i) => i.customer_name.toLowerCase() === selectedLedgerCustomer.name.toLowerCase())
    : []

  const resetFilters = () => {
    setSearchQuery('')
    setGstFilter('ALL')
    setDueFilter('ALL')
    setSortBy('name_asc')
  }

  const isFiltered = searchQuery || gstFilter !== 'ALL' || dueFilter !== 'ALL' || sortBy !== 'name_asc'

  return (
    <div className={`vpm-cust-module ${isDark ? 'theme-dark' : 'theme-light'}`}>
      {/* ── Top Header Banner ─────────────────────────────────── */}
      <div className="vpm-cust-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="vpm-cust-icon-box">
            <UserCheck size={22} />
          </div>
          <div>
            <h4 className="fw-extrabold m-0 text-gradient-title">Customer Management & Directory</h4>
            <p className="text-muted small m-0 fw-medium">
              Filter by GST, Non-GST, Outstanding dues, mobile numbers, and ledger statements.
            </p>
          </div>
        </div>

        <button type="button" className="vpm-btn-add-cust" onClick={handleOpenAdd}>
          <Plus size={16} /> Add New Customer
        </button>
      </div>

      {/* ── Metric Summary Cards for Filtered Selection ────────── */}
      <Row className="g-2 w-100 mx-0 my-1">
        <Col lg={3} sm={6} className="px-1">
          <div className="p-2.5 rounded-3 border bg-body-tertiary d-flex align-items-center justify-content-between shadow-sm">
            <div>
              <span className="text-muted fw-bold d-block" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Filtered Accounts</span>
              <h5 className="fw-extrabold m-0">{metrics.totalCount}</h5>
            </div>
            <div className="p-2 rounded-circle bg-primary bg-opacity-10 text-primary">
              <UserCheck size={18} />
            </div>
          </div>
        </Col>

        <Col lg={3} sm={6} className="px-1">
          <div className="p-2.5 rounded-3 border bg-body-tertiary d-flex align-items-center justify-content-between shadow-sm">
            <div>
              <span className="text-muted fw-bold d-block" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>GST Registered</span>
              <h5 className="fw-extrabold text-info m-0">{metrics.gstCount}</h5>
            </div>
            <div className="p-2 rounded-circle bg-info bg-opacity-10 text-info">
              <Building2 size={18} />
            </div>
          </div>
        </Col>

        <Col lg={3} sm={6} className="px-1">
          <div className="p-2.5 rounded-3 border bg-body-tertiary d-flex align-items-center justify-content-between shadow-sm">
            <div>
              <span className="text-muted fw-bold d-block" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Non-GST / Retail</span>
              <h5 className="fw-extrabold text-warning m-0">{metrics.nonGstCount}</h5>
            </div>
            <div className="p-2 rounded-circle bg-warning bg-opacity-10 text-warning">
              <UserX size={18} />
            </div>
          </div>
        </Col>

        <Col lg={3} sm={6} className="px-1">
          <div className="p-2.5 rounded-3 border bg-body-tertiary d-flex align-items-center justify-content-between shadow-sm">
            <div>
              <span className="text-muted fw-bold d-block" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Filtered Dues</span>
              <h5 className="fw-extrabold text-danger m-0">₹{metrics.totalDues.toLocaleString('en-IN')}</h5>
            </div>
            <div className="p-2 rounded-circle bg-danger bg-opacity-10 text-danger">
              <IndianRupee size={18} />
            </div>
          </div>
        </Col>
      </Row>

      {/* ── Comprehensive Filter Toolbar ───────────────────────── */}
      <div className="vpm-cust-search-bar">
        <Row className="g-2 align-items-center w-100 mx-0">
          {/* Search Input */}
          <Col xl={4} lg={4} md={12} className="px-1">
            <div className="vpm-cust-search-wrap">
              <Search size={16} className="vpm-cust-search-icon" />
              <input
                type="text"
                className="vpm-cust-search-input"
                placeholder="Search name, mobile, GSTIN, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="btn btn-sm text-muted border-0 position-absolute end-0 me-2"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </Col>

          {/* GST Status Filter */}
          <Col xl={2.5} lg={2.5} sm={6} className="px-1">
            <Form.Select
              className="vpm-cust-search-input"
              style={{ paddingLeft: '12px' }}
              value={gstFilter}
              onChange={(e) => setGstFilter(e.target.value as any)}
            >
              <option value="ALL">🏢 All GST Types</option>
              <option value="GST">✅ GST Registered</option>
              <option value="NON_GST">📑 Non-GST (Retail)</option>
            </Form.Select>
          </Col>

          {/* Outstanding Due Filter */}
          <Col xl={2.5} lg={2.5} sm={6} className="px-1">
            <Form.Select
              className="vpm-cust-search-input"
              style={{ paddingLeft: '12px' }}
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value as any)}
            >
              <option value="ALL">💰 All Balances</option>
              <option value="DUE_ONLY">🔴 Has Outstanding Dues</option>
              <option value="HIGH_DUE">⚠️ High Dues (&gt; ₹5,000)</option>
              <option value="ZERO_DUE">🟢 Zero Dues (Fully Paid)</option>
            </Form.Select>
          </Col>

          {/* Sort By Selector */}
          <Col xl={2} lg={2} sm={8} className="px-1">
            <Form.Select
              className="vpm-cust-search-input"
              style={{ paddingLeft: '12px' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="name_asc">🔤 Name (A-Z)</option>
              <option value="due_desc">⬇️ Highest Dues</option>
              <option value="due_asc">⬆️ Lowest Dues</option>
              <option value="newest">🆕 Newest Customers</option>
            </Form.Select>
          </Col>

          {/* Reset Filters */}
          {isFiltered && (
            <Col xl={1} lg={1} sm={4} className="px-1 text-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-100 rounded-3 py-1.5 fw-bold"
                onClick={resetFilters}
                title="Reset Filters"
                style={{ fontSize: '0.75rem' }}
              >
                Reset
              </button>
            </Col>
          )}
        </Row>
      </div>

      {/* ── Customers List Table ──────────────────────────────── */}
      <div className="vpm-cust-table-card">
        <div className="table-responsive">
          <table className="vpm-cust-table">
            <thead>
              <tr>
                <th className="text-start">Customer Name</th>
                <th className="text-start">Contact Info</th>
                <th className="text-center">GST Status</th>
                <th className="text-start">Billing Address</th>
                <th className="text-end">Outstanding Balance</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted fw-medium">
                    <AlertCircle size={32} className="mb-2 opacity-40 d-block mx-auto" />
                    No customer accounts match your selected filter criteria.
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
                        <span className="vpm-amount-balance fw-extrabold text-danger">₹{cust.outstanding_balance.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="vpm-amount-paid fw-bold text-success">₹0</span>
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
