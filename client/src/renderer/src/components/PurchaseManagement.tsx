import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Table, Modal, Form, Badge, InputGroup } from 'react-bootstrap'
import { ShoppingCart, Plus, Trash2, Search, UserCheck } from 'lucide-react'
import { DataService, Purchase, Supplier, PurchaseItem } from '../services/dataService'

interface PurchaseManagementProps {
  theme: 'dark' | 'light'
}

const PurchaseManagement: React.FC<PurchaseManagementProps> = ({ theme }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // New Purchase Modal
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [supplierName, setSupplierName] = useState('')
  const [supplierMobile, setSupplierMobile] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PurchaseItem[]>([
    { product_name: '', qty: 1, rate: 0, amount: 0 }
  ])

  // Supplier Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({ name: '', mobile: '', email: '', gst_no: '', address: '' })

  const isDark = theme === 'dark'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setPurchases(DataService.getPurchases())
    setSuppliers(DataService.getSuppliers())
  }

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { product_name: '', qty: 1, rate: 0, amount: 0 }])
  }

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev]
      const item = { ...updated[index], [field]: value }
      if (field === 'qty' || field === 'rate') {
        item.amount = (Number(item.qty) || 0) * (Number(item.rate) || 0)
      }
      updated[index] = item
      return updated
    })
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0)

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierName) {
      alert('Please select or enter a supplier name.')
      return
    }

    DataService.savePurchase({
      supplier_name: supplierName,
      supplier_mobile: supplierMobile,
      date: purchaseDate,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      items: items.filter((i) => i.product_name.trim() !== ''),
      notes
    })

    setShowPurchaseModal(false)
    resetPurchaseForm()
    loadData()
  }

  const resetPurchaseForm = () => {
    setSupplierName('')
    setSupplierMobile('')
    setPurchaseDate(new Date().toISOString().split('T')[0])
    setPaidAmount(0)
    setNotes('')
    setItems([{ product_name: '', qty: 1, rate: 0, amount: 0 }])
  }

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSupplier.name) return
    DataService.saveSupplier(newSupplier)
    setShowSupplierModal(false)
    setNewSupplier({ name: '', mobile: '', email: '', gst_no: '', address: '' })
    loadData()
  }

  const filteredPurchases = purchases.filter(
    (p) =>
      p.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.purchase_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="vpm-purchase-management">
      {/* ── Top Header ───────────────────────────────────────── */}
      <Card
        className={`border-0 shadow-sm rounded-4 mb-4 ${
          isDark ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white'
        }`}
      >
        <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <ShoppingCart className="text-purple-500" size={24} style={{ color: '#A855F7' }} />
              <h4 className="fw-bold m-0">Purchase & Supplier Management</h4>
            </div>
            <p className="text-muted small m-0">
              Maintain purchase records of raw materials, paper rolls, flex vinyl stocks, and supplier invoices.
            </p>
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              className="fw-bold rounded-3 d-flex align-items-center gap-2"
              onClick={() => setShowSupplierModal(true)}
            >
              <UserCheck size={18} /> Manage Suppliers
            </Button>
            <Button
              variant="primary"
              className="fw-bold rounded-3 d-flex align-items-center gap-2 px-3"
              style={{ background: '#9333EA', borderColor: '#9333EA' }}
              onClick={() => setShowPurchaseModal(true)}
            >
              <Plus size={18} /> New Purchase Entry
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* ── Search Bar ───────────────────────────────────────── */}
      <Card className={`border-0 shadow-sm rounded-4 mb-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <Card.Body className="p-3">
          <InputGroup>
            <InputGroup.Text className={isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-light border-gray-200'}>
              <Search size={18} />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search purchases by Supplier name or Purchase bill #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      {/* ── Purchase History Table ───────────────────────────── */}
      <Card className={`border-0 shadow-sm rounded-4 overflow-hidden ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className={`m-0 align-middle ${isDark ? 'table-dark' : ''}`}>
              <thead className={isDark ? 'bg-slate-800' : 'bg-light'}>
                <tr className="small text-uppercase text-muted">
                  <th>Purchase Bill #</th>
                  <th>Supplier Name</th>
                  <th>Date</th>
                  <th>Items Purchased</th>
                  <th className="text-end">Total Amount</th>
                  <th className="text-end">Paid</th>
                  <th className="text-end">Balance</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      No purchase entries found.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((pur) => (
                    <tr key={pur.id}>
                      <td className="fw-bold">{pur.purchase_number}</td>
                      <td>
                        <span className="fw-semibold d-block">{pur.supplier_name}</span>
                        <span className="small text-muted">{pur.supplier_mobile}</span>
                      </td>
                      <td className="small text-muted">{pur.date}</td>
                      <td>
                        <span className="small">
                          {pur.items.map((i) => `${i.product_name} (${i.qty})`).join(', ')}
                        </span>
                      </td>
                      <td className="text-end fw-bold">₹{pur.total_amount.toLocaleString('en-IN')}</td>
                      <td className="text-end text-success">₹{pur.paid_amount.toLocaleString('en-IN')}</td>
                      <td className="text-end text-danger fw-bold">₹{pur.balance_amount.toLocaleString('en-IN')}</td>
                      <td className="text-center">
                        <Badge bg={pur.status === 'PAID' ? 'success' : pur.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'}>
                          {pur.status}
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

      {/* ── New Purchase Entry Modal ──────────────────────────── */}
      <Modal show={showPurchaseModal} onHide={() => setShowPurchaseModal(false)} centered size="lg">
        <Modal.Header closeButton className={isDark ? 'bg-slate-800 text-white border-slate-700' : ''}>
          <Modal.Title className="fw-bold fs-5">Record Raw Material / Stock Purchase</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSavePurchase}>
          <Modal.Body className={isDark ? 'bg-slate-900 text-white' : ''}>
            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Supplier *</Form.Label>
                  <Form.Select
                    required
                    value={supplierName}
                    onChange={(e) => {
                      const selected = suppliers.find((s) => s.name === e.target.value)
                      setSupplierName(e.target.value)
                      setSupplierMobile(selected?.mobile || '')
                    }}
                    className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.mobile})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Purchase Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="fw-bold mb-2">Itemized Materials Purchased</h6>
            {items.map((item, idx) => (
              <Row key={idx} className="g-2 align-items-center mb-2">
                <Col md={5}>
                  <Form.Control
                    placeholder="Material description (e.g. Star Flex Roll)"
                    value={item.product_name}
                    onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                    className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
                  />
                </Col>
                <Col md={2}>
                  <Form.Control
                    type="number"
                    placeholder="Qty"
                    value={item.qty}
                    onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                    className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
                  />
                </Col>
                <Col md={2}>
                  <Form.Control
                    type="number"
                    placeholder="Rate ₹"
                    value={item.rate}
                    onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                    className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
                  />
                </Col>
                <Col md={2}>
                  <Form.Control readOnly value={`₹${item.amount}`} className={isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-light'} />
                </Col>
                <Col md={1} className="text-center">
                  <Button variant="outline-danger" size="sm" onClick={() => handleRemoveItemRow(idx)}>
                    <Trash2 size={14} />
                  </Button>
                </Col>
              </Row>
            ))}

            <Button variant="outline-primary" size="sm" className="mb-3 fw-bold" onClick={handleAddItemRow}>
              + Add Material Row
            </Button>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Paid Amount ₹</Form.Label>
                  <Form.Control
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <div className="p-3 bg-light rounded-3 text-dark text-end">
                  <span className="small text-muted d-block">Grand Total Purchase Amount</span>
                  <h4 className="fw-bold text-purple-600 m-0" style={{ color: '#9333EA' }}>
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </h4>
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
            <Button variant="secondary" onClick={() => setShowPurchaseModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="fw-bold" style={{ background: '#9333EA', borderColor: '#9333EA' }}>
              Save Purchase Entry
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Add Supplier Modal ───────────────────────────────── */}
      <Modal show={showSupplierModal} onHide={() => setShowSupplierModal(false)} centered>
        <Modal.Header closeButton className={isDark ? 'bg-slate-800 text-white border-slate-700' : ''}>
          <Modal.Title className="fw-bold fs-5">Add New Supplier</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveSupplier}>
          <Modal.Body className={isDark ? 'bg-slate-900 text-white' : ''}>
            <Form.Group className="mb-2">
              <Form.Label className="small fw-bold">Supplier Company Name *</Form.Label>
              <Form.Control
                required
                value={newSupplier.name}
                onChange={(e) => setNewSupplier((prev) => ({ ...prev, name: e.target.value }))}
                className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label className="small fw-bold">Contact Mobile Number</Form.Label>
              <Form.Control
                value={newSupplier.mobile}
                onChange={(e) => setNewSupplier((prev) => ({ ...prev, mobile: e.target.value }))}
                className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label className="small fw-bold">GSTIN Number</Form.Label>
              <Form.Control
                value={newSupplier.gst_no}
                onChange={(e) => setNewSupplier((prev) => ({ ...prev, gst_no: e.target.value.toUpperCase() }))}
                className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-bold">Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={newSupplier.address}
                onChange={(e) => setNewSupplier((prev) => ({ ...prev, address: e.target.value }))}
                className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
            <Button variant="secondary" onClick={() => setShowSupplierModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Supplier
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default PurchaseManagement
