import React, { useState, useEffect } from 'react'
import { Row, Col, Modal, Form } from 'react-bootstrap'
import { ShoppingCart, Plus, Trash2, Search, UserCheck } from 'lucide-react'
import { DataService, Purchase, Supplier, PurchaseItem } from '../services/dataService'
import './PurchaseManagement.css'

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
    <div className={`vpm-pur-module ${isDark ? 'theme-dark' : 'theme-light'}`}>
      {/* ── Top Header Banner ─────────────────────────────────── */}
      <div className="vpm-pur-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="vpm-pur-icon-box">
            <ShoppingCart size={22} />
          </div>
          <div>
            <h4 className="fw-extrabold m-0 text-gradient-title">Purchase & Supplier Management</h4>
            <p className="text-muted small m-0 fw-medium">
              Maintain purchase records of raw materials, paper rolls, flex vinyl stocks, and supplier invoices.
            </p>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="vpm-btn-pur-action vpm-btn-pur-sec"
            onClick={() => setShowSupplierModal(true)}
          >
            <UserCheck size={16} /> Manage Suppliers
          </button>
          <button
            type="button"
            className="vpm-btn-pur-action vpm-btn-add-pur"
            onClick={() => setShowPurchaseModal(true)}
          >
            <Plus size={16} /> New Purchase Entry
          </button>
        </div>
      </div>

      {/* ── Search Bar ───────────────────────────────────────── */}
      <div className="vpm-pur-search-bar">
        <div className="vpm-pur-search-wrap">
          <Search size={18} className="vpm-pur-search-icon" />
          <input
            type="text"
            className="vpm-pur-search-input"
            placeholder="Search purchases by Supplier name or Purchase bill #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Purchase History Table ───────────────────────────── */}
      <div className="vpm-pur-table-card">
        <div className="table-responsive">
          <table className="vpm-pur-table">
            <thead>
              <tr>
                <th className="text-start">Purchase Bill #</th>
                <th className="text-start">Supplier Name</th>
                <th className="text-center">Date</th>
                <th className="text-start">Items Purchased</th>
                <th className="text-end">Total Amount</th>
                <th className="text-end">Paid</th>
                <th className="text-end">Balance</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted fw-medium">
                    No purchase entries found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((pur) => (
                  <tr key={pur.id}>
                    <td className="text-start">
                      <span className="vpm-pur-bill-pill">{pur.purchase_number}</span>
                    </td>
                    <td className="text-start">
                      <div className="vpm-cust-name-cell">
                        <div className="vpm-supplier-avatar">
                          {pur.supplier_name
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="vpm-cust-info-box">
                          <span className="vpm-cust-title">{pur.supplier_name}</span>
                          <span className="vpm-cust-date">{pur.supplier_mobile}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="vpm-date-pill">{pur.date}</span>
                    </td>
                    <td className="text-start">
                      <div className="d-flex flex-wrap gap-1">
                        {pur.items.map((item, idx) => (
                          <span key={idx} className="vpm-item-chip">
                            {item.product_name} ({item.qty})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-end">
                      <span className="vpm-amount-total">₹{pur.total_amount.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="text-end">
                      <span className="vpm-amount-paid">₹{pur.paid_amount.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="text-end">
                      <span className="vpm-amount-balance">₹{pur.balance_amount.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="text-center">
                      {pur.status === 'PAID' && (
                        <span className="vpm-status-pill vpm-status-pill-paid">
                          <span className="vpm-status-dot" /> Paid
                        </span>
                      )}
                      {pur.status === 'PARTIALLY_PAID' && (
                        <span className="vpm-status-pill vpm-status-pill-partial">
                          <span className="vpm-status-dot" /> Partial
                        </span>
                      )}
                      {pur.status === 'UNPAID' && (
                        <span className="vpm-status-pill vpm-status-pill-unpaid">
                          <span className="vpm-status-dot" /> Unpaid
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

      {/* ── New Purchase Entry Modal ──────────────────────────── */}
      <Modal show={showPurchaseModal} onHide={() => setShowPurchaseModal(false)} centered size="lg" className="vpm-modal-dialog">
        <div className={isDark ? 'theme-dark' : 'theme-light'}>
          <div className="modal-content border-0">
            <div className="vpm-modal-header-pro d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div className="vpm-pur-icon-box" style={{ width: 34, height: 34, borderRadius: 10 }}>
                  <ShoppingCart size={18} />
                </div>
                <h5 className="fw-extrabold m-0">Record Raw Material / Stock Purchase</h5>
              </div>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowPurchaseModal(false)} />
            </div>

            <Form onSubmit={handleSavePurchase}>
              <Modal.Body className="p-4">
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
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px' }}
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
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <h6 className="fw-extrabold mb-2">Itemized Materials Purchased</h6>
                {items.map((item, idx) => (
                  <Row key={idx} className="g-2 align-items-center mb-2">
                    <Col md={5}>
                      <Form.Control
                        placeholder="Material description (e.g. Star Flex Roll)"
                        value={item.product_name}
                        onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Control
                        type="number"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Control
                        type="number"
                        placeholder="Rate ₹"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Control
                        readOnly
                        value={`₹${item.amount}`}
                        className="vpm-pur-search-input bg-light-subtle"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Col>
                    <Col md={1} className="text-center">
                      <button
                        type="button"
                        className="vpm-act-btn vpm-act-btn-delete"
                        onClick={() => handleRemoveItemRow(idx)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </Col>
                  </Row>
                ))}

                <button
                  type="button"
                  className="vpm-btn-pur-action vpm-btn-pur-sec mt-2"
                  onClick={handleAddItemRow}
                >
                  <Plus size={14} /> Add Another Material Line
                </button>

                <div className="vpm-invoice-preview-box d-flex justify-content-between align-items-center mt-3 mb-0">
                  <span className="fw-bold">Total Bill Amount:</span>
                  <h4 className="fw-extrabold text-primary m-0">₹{totalAmount.toLocaleString('en-IN')}</h4>
                </div>
              </Modal.Body>

              <div className="p-3 bg-light-subtle d-flex justify-content-end gap-2 border-top">
                <button type="button" className="vpm-tab-btn-pro" onClick={() => setShowPurchaseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="vpm-btn-pur-action vpm-btn-add-pur" style={{ padding: '8px 24px' }}>
                  Save Purchase Entry
                </button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>

      {/* ── Supplier Management Modal ──────────────────────────── */}
      <Modal show={showSupplierModal} onHide={() => setShowSupplierModal(false)} centered size="lg" className="vpm-modal-dialog">
        <div className={isDark ? 'theme-dark' : 'theme-light'}>
          <div className="modal-content border-0">
            <div className="vpm-modal-header-pro d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div className="vpm-pur-icon-box" style={{ width: 34, height: 34, borderRadius: 10 }}>
                  <UserCheck size={18} />
                </div>
                <h5 className="fw-extrabold m-0">Supplier Management</h5>
              </div>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowSupplierModal(false)} />
            </div>

            <Form onSubmit={handleSaveSupplier}>
              <Modal.Body className="p-4">
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">Supplier Business Name *</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        placeholder="Enter supplier company name"
                        value={newSupplier.name || ''}
                        onChange={(e) => setNewSupplier((prev) => ({ ...prev, name: e.target.value }))}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">Mobile Number *</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        placeholder="Enter contact mobile number"
                        value={newSupplier.mobile || ''}
                        onChange={(e) => setNewSupplier((prev) => ({ ...prev, mobile: e.target.value }))}
                        className="vpm-pur-search-input"
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
                        value={newSupplier.email || ''}
                        onChange={(e) => setNewSupplier((prev) => ({ ...prev, email: e.target.value }))}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">GSTIN Number</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. 24DDDDD3333D4Z8"
                        value={newSupplier.gst_no || ''}
                        onChange={(e) => setNewSupplier((prev) => ({ ...prev, gst_no: e.target.value }))}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">Supplier Office Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Enter complete office address"
                        value={newSupplier.address || ''}
                        onChange={(e) => setNewSupplier((prev) => ({ ...prev, address: e.target.value }))}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px', height: 'auto' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Modal.Body>

              <div className="p-3 bg-light-subtle d-flex justify-content-end gap-2 border-top">
                <button type="button" className="vpm-tab-btn-pro" onClick={() => setShowSupplierModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="vpm-btn-pur-action vpm-btn-add-pur" style={{ padding: '8px 24px' }}>
                  Save Supplier
                </button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PurchaseManagement
