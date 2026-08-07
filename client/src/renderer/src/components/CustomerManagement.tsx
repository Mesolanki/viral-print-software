import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Table, Modal, Form, InputGroup, Badge } from 'react-bootstrap'
import { UserCheck, Plus, Search, Edit2, Trash2, BookOpen, Phone, Mail, MapPin } from 'lucide-react'
import { DataService, Customer, Invoice } from '../services/dataService'

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
    <div className="vpm-customer-management">
      {/* ── Top Header ───────────────────────────────────────── */}
      <Card
        className={`border-0 shadow-sm rounded-4 mb-4 ${
          isDark ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white'
        }`}
      >
        <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <UserCheck className="text-primary" size={24} />
              <h4 className="fw-bold m-0">Customer Management</h4>
            </div>
            <p className="text-muted small m-0">
              Manage complete customer database, GST numbers, addresses, ledgers, and outstanding balances.
            </p>
          </div>

          <Button variant="primary" className="fw-bold rounded-3 d-flex align-items-center gap-2 px-3" onClick={handleOpenAdd}>
            <Plus size={18} /> Add New Customer
          </Button>
        </Card.Body>
      </Card>

      {/* ── Search & Filter Bar ───────────────────────────────── */}
      <Card
        className={`border-0 shadow-sm rounded-4 mb-4 ${
          isDark ? 'bg-slate-900 text-white' : 'bg-white'
        }`}
      >
        <Card.Body className="p-3">
          <InputGroup>
            <InputGroup.Text className={isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-light border-gray-200'}>
              <Search size={18} />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search customers by Name, Mobile number, or GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      {/* ── Customers List Table ──────────────────────────────── */}
      <Card className={`border-0 shadow-sm rounded-4 overflow-hidden ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className={`m-0 align-middle ${isDark ? 'table-dark' : ''}`}>
              <thead className={isDark ? 'bg-slate-800' : 'bg-light'}>
                <tr className="small text-uppercase text-muted">
                  <th>Customer Name</th>
                  <th>Contact Info</th>
                  <th>GST Number</th>
                  <th>Billing Address</th>
                  <th className="text-end">Outstanding Balance</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No customers found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.id}>
                      <td>
                        <span className="fw-bold d-block">{cust.name}</span>
                        <span className="small text-muted">Added {cust.created_at}</span>
                      </td>
                      <td>
                        <div className="d-flex flex-column small">
                          <span className="d-flex align-items-center gap-1">
                            <Phone size={13} className="text-primary" /> {cust.mobile || 'N/A'}
                          </span>
                          {cust.email && (
                            <span className="d-flex align-items-center gap-1 text-muted">
                              <Mail size={13} /> {cust.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {cust.gst_no ? (
                          <Badge bg="secondary" className="font-monospace fw-normal">
                            {cust.gst_no}
                          </Badge>
                        ) : (
                          <span className="text-muted small">Non-GST</span>
                        )}
                      </td>
                      <td>
                        <span className="small text-muted text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                          <MapPin size={12} className="me-1" />
                          {cust.billing_address || 'Not specified'}
                        </span>
                      </td>
                      <td className="text-end">
                        <span
                          className={`fw-bold ${
                            cust.outstanding_balance > 0 ? 'text-danger' : 'text-success'
                          }`}
                        >
                          ₹{cust.outstanding_balance.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <Button
                            variant="outline-info"
                            size="sm"
                            title="Customer Ledger"
                            onClick={() => setSelectedLedgerCustomer(cust)}
                          >
                            <BookOpen size={15} />
                          </Button>
                          <Button variant="outline-primary" size="sm" title="Edit" onClick={() => handleOpenEdit(cust)}>
                            <Edit2 size={15} />
                          </Button>
                          <Button variant="outline-danger" size="sm" title="Delete" onClick={() => handleDelete(cust.id)}>
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* ── Add / Edit Customer Modal ──────────────────────────── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className={isDark ? 'bg-slate-800 text-white border-slate-700' : ''}>
          <Modal.Title className="fw-bold fs-5">
            {editingCustomer?.id ? 'Edit Customer Information' : 'Add New Customer'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body className={isDark ? 'bg-slate-900 text-white' : ''}>
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
                    className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Contact Mobile Number *</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    placeholder="Enter mobile number"
                    value={editingCustomer?.mobile || ''}
                    onChange={(e) => setEditingCustomer((prev) => ({ ...prev, mobile: e.target.value }))}
                    className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
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
                    className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
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
                    className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Billing Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Complete billing address"
                    value={editingCustomer?.billing_address || ''}
                    onChange={(e) => setEditingCustomer((prev) => ({ ...prev, billing_address: e.target.value }))}
                    className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Shipping Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Shipping address (same as billing if blank)"
                    value={editingCustomer?.shipping_address || ''}
                    onChange={(e) => setEditingCustomer((prev) => ({ ...prev, shipping_address: e.target.value }))}
                    className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="fw-bold">
              Save Customer
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Customer Ledger Modal ─────────────────────────────── */}
      <Modal show={!!selectedLedgerCustomer} onHide={() => setSelectedLedgerCustomer(null)} centered size="lg">
        <Modal.Header closeButton className={isDark ? 'bg-slate-800 text-white border-slate-700' : ''}>
          <Modal.Title className="fw-bold fs-5">
            Customer Ledger Statement - {selectedLedgerCustomer?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={isDark ? 'bg-slate-900 text-white' : ''}>
          {selectedLedgerCustomer && (
            <div>
              <div className="p-3 bg-light rounded-3 mb-3 text-dark d-flex justify-content-between">
                <div>
                  <span className="small text-muted d-block">Customer Mobile</span>
                  <strong>{selectedLedgerCustomer.mobile}</strong>
                </div>
                <div>
                  <span className="small text-muted d-block">GSTIN</span>
                  <strong>{selectedLedgerCustomer.gst_no || 'N/A'}</strong>
                </div>
                <div>
                  <span className="small text-muted d-block">Current Outstanding</span>
                  <strong className="text-danger">₹{selectedLedgerCustomer.outstanding_balance.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <h6 className="fw-bold mb-2">Billing History</h6>
              <div className="table-responsive">
                <Table bordered hover size="sm" className={isDark ? 'table-dark' : ''}>
                  <thead>
                    <tr className="small text-uppercase">
                      <th>Date</th>
                      <th>Invoice #</th>
                      <th>Type</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-3 text-muted">
                          No invoices recorded for this customer yet.
                        </td>
                      </tr>
                    ) : (
                      customerInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td>{inv.date}</td>
                          <td className="fw-bold">{inv.invoice_number}</td>
                          <td>{inv.type}</td>
                          <td>₹{inv.grand_total.toLocaleString('en-IN')}</td>
                          <td className="text-success">₹{inv.paid_amount.toLocaleString('en-IN')}</td>
                          <td className="text-danger fw-bold">₹{inv.balance_amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
          <Button variant="secondary" onClick={() => setSelectedLedgerCustomer(null)}>
            Close Ledger
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default CustomerManagement
