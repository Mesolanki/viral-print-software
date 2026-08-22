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

// ── Helper to split concatenated location names from raw BAK data ──
function formatCustomerDisplayName(rawName: string, rawAddress?: string): { name: string; address: string } {
  if (!rawName) return { name: 'Walk-in Customer', address: rawAddress || 'Chandkheda, Ahmedabad' }
  let n = rawName.trim()
  let addr = (rawAddress || '').trim()

  const LOCATIONS = [
    'Chandkheda', 'Ahmedabad', 'Gota', 'Sabarmati', 'Gandhinagar',
    'Alfa square', 'Mansarovar Road', 'Nakshatra Mall', 'Orange Mall',
    'Sun Heights', 'New Chandkheda', 'Jantanagar', 'Chankheda', 'Tp 44, Chandkheda'
  ]

  for (const loc of LOCATIONS) {
    if (n.endsWith(loc) && n.length > loc.length + 2) {
      if (!addr || addr === 'Chandkheda, Ahmedabad' || addr === loc) {
        addr = `${loc}, Ahmedabad`
      }
      n = n.slice(0, -loc.length).trim()
      break
    }
  }

  n = n.replace(/[,;.-]+$/, '').trim()
  if (!addr) addr = 'Chandkheda, Ahmedabad'

  return { name: n || rawName, address: addr }
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #0284c7 100%)'
]

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
    if (!editingCustomer?.name) return
    DataService.saveCustomer(editingCustomer as Customer)
    loadData()
    setShowModal(false)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this customer record?')) {
      DataService.deleteCustomer(id)
      loadData()
    }
  }

  // ── Filtered & Sorted Customer List ─────────────────────────────
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const hasGst = !!(c.gst_no && c.gst_no.trim().length > 0)
        const due = Number(c.outstanding_balance) || 0

        if (gstFilter === 'GST' && !hasGst) return false
        if (gstFilter === 'NON_GST' && hasGst) return false

        if (dueFilter === 'DUE_ONLY' && due <= 0) return false
        if (dueFilter === 'HIGH_DUE' && due < 5000) return false
        if (dueFilter === 'ZERO_DUE' && due > 0) return false

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

      {/* ── Metric Summary Cards ────────────────────────────── */}
      <Row className="g-2 w-100 mx-0 my-1">
        <Col xl={3} md={6} className="px-1">
          <div className="vpm-cust-stat-card border shadow-sm">
            <div>
              <span className="vpm-cust-stat-label text-muted">Filtered Accounts</span>
              <h4 className="fw-extrabold m-0 text-primary">{metrics.totalCount.toLocaleString('en-IN')}</h4>
            </div>
            <div className="vpm-cust-stat-icon-ring bg-primary bg-opacity-10 text-primary">
              <UserCheck size={18} />
            </div>
          </div>
        </Col>

        <Col xl={3} md={6} className="px-1">
          <div className="vpm-cust-stat-card border shadow-sm">
            <div>
              <span className="vpm-cust-stat-label text-muted">GST Registered</span>
              <h4 className="fw-extrabold text-info m-0">{metrics.gstCount.toLocaleString('en-IN')}</h4>
            </div>
            <div className="vpm-cust-stat-icon-ring bg-info bg-opacity-10 text-info">
              <Building2 size={18} />
            </div>
          </div>
        </Col>

        <Col xl={3} md={6} className="px-1">
          <div className="vpm-cust-stat-card border shadow-sm">
            <div>
              <span className="vpm-cust-stat-label text-muted">Non-GST / Retail</span>
              <h4 className="fw-extrabold text-warning m-0">{metrics.nonGstCount.toLocaleString('en-IN')}</h4>
            </div>
            <div className="vpm-cust-stat-icon-ring bg-warning bg-opacity-10 text-warning">
              <UserX size={18} />
            </div>
          </div>
        </Col>

        <Col xl={3} md={6} className="px-1">
          <div className="vpm-cust-stat-card border shadow-sm">
            <div>
              <span className="vpm-cust-stat-label text-muted">Filtered Dues</span>
              <h4 className="fw-extrabold text-danger m-0">₹{metrics.totalDues.toLocaleString('en-IN')}</h4>
            </div>
            <div className="vpm-cust-stat-icon-ring bg-danger bg-opacity-10 text-danger">
              <IndianRupee size={18} />
            </div>
          </div>
        </Col>
      </Row>

      {/* ── Comprehensive Filter Toolbar ───────────────────────── */}
      <div className="vpm-cust-search-bar">
        <Row className="g-2 align-items-center w-100 mx-0">
          <Col lg={4} md={5} className="px-1">
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

          <Col lg={3} md={3} sm={4} className="px-1">
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

          <Col lg={3} md={4} sm={4} className="px-1">
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

          <Col lg={2} md={12} sm={4} className="px-1 d-flex gap-1">
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

            {isFiltered && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-3 py-1.5 px-3 fw-bold flex-shrink-0"
                onClick={resetFilters}
                title="Reset Filters"
                style={{ fontSize: '0.75rem' }}
              >
                Reset
              </button>
            )}
          </Col>
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
                filteredCustomers.map((cust, idx) => {
                  const { name: cleanName, address: cleanAddress } = formatCustomerDisplayName(cust.name, cust.billing_address)
                  const gradient = AVATAR_GRADIENTS[(cust.id || idx) % AVATAR_GRADIENTS.length]
                  const initials = cleanName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'C'
                  const due = Number(cust.outstanding_balance) || 0
                  const hasGst = !!(cust.gst_no && cust.gst_no.trim().length > 0)

                  return (
                    <tr key={cust.id || idx}>
                      <td className="text-start">
                        <div className="vpm-cust-name-cell">
                          <div className="vpm-cust-avatar" style={{ background: gradient }}>
                            {initials}
                          </div>
                          <div className="vpm-cust-info-box">
                            <span className="vpm-cust-title">{cleanName}</span>
                            <span className="vpm-cust-date">Added {cust.created_at || '2026-01-01'}</span>
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
                        {hasGst ? (
                          <span className="vpm-gst-badge">
                            <Building2 size={11} className="me-1" />
                            {cust.gst_no}
                          </span>
                        ) : (
                          <span className="vpm-gst-nongst-tag px-2 py-1 bg-secondary bg-opacity-10 text-secondary rounded-2">
                            Non-GST
                          </span>
                        )}
                      </td>
                      <td className="text-start">
                        <span className="vpm-contact-pill text-truncate d-inline-block" style={{ maxWidth: '220px' }}>
                          <MapPin size={12} className="me-1 text-primary" />
                          {cleanAddress}
                        </span>
                      </td>
                      <td className="text-end">
                        {due > 0 ? (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1.5 fs-7 fw-extrabold">
                            ₹{due.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1.5 fs-7 fw-bold">
                            ₹0
                          </span>
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
                  )
                })

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
