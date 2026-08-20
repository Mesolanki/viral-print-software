import React, { useState, useEffect, useMemo } from 'react'
import { Row, Col, Modal, Form } from 'react-bootstrap'
import {
  ShoppingCart,
  Plus,
  Trash2,
  Search,
  UserCheck,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  X,
  Building2,
  CreditCard,
  Mail,
  MapPin
} from 'lucide-react'
import { DataService, Purchase, Supplier, PurchaseItem } from '../services/dataService'
import './PurchaseManagement.css'

interface PurchaseManagementProps {
  theme: 'dark' | 'light'
}

const UNITS = ['pcs', 'roll', 'sqft', 'sqmtr', 'meter', 'feet', 'inch', 'kg', 'litre', 'sheet', 'packet', 'ream', 'box', 'set', 'nos', 'bundle', 'job', 'carton', 'hr', 'Other']

export const PurchaseManagement: React.FC<PurchaseManagementProps> = ({ theme }) => {
  const isDark = theme === 'dark'

  // Data States
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [productsList, setProductsList] = useState<any[]>([])

  // View Filter State
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [supplierBalanceFilter, setSupplierBalanceFilter] = useState<string>('ALL')

  // Purchase Form & Edit Modal
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null)
  const [purchaseNo, setPurchaseNo] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [supplierMobile, setSupplierMobile] = useState('')
  const [supplierGstin, setSupplierGstin] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PurchaseItem[]>([
    { product_name: '', qty: 1, unit: 'roll', rate: 0, amount: 0 }
  ])

  // Autocomplete State
  const [activeSearchRowIndex, setActiveSearchRowIndex] = useState<number | null>(null)

  // Payment Recording Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPurchaseForPayment, setSelectedPurchaseForPayment] = useState<Purchase | null>(null)
  const [paymentInputAmt, setPaymentInputAmt] = useState('')
  const [paymentMode, setPaymentMode] = useState('BANK')
  const [paymentNotes, setPaymentNotes] = useState('')

  // Supplier Add/Edit Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null)
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
    name: '', mobile: '', email: '', gst_no: '', address: ''
  })

  // Quick Add Product Modal State
  const [showQuickProductModal, setShowQuickProductModal] = useState(false)
  const [quickProductForm, setQuickProductForm] = useState({
    name: '', category: 'Raw Materials', unit: 'roll', price: 0, gst_rate: 18, hsn_code: '9983'
  })

  // Supplier Ledger View Modal
  const [selectedLedgerSupplier, setSelectedLedgerSupplier] = useState<Supplier | null>(null)

  // Voucher Print Modal
  const [previewPurchaseVoucher, setPreviewPurchaseVoucher] = useState<Purchase | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setPurchases(DataService.getPurchases())
    setSuppliers(DataService.getSuppliers())
    setProductsList(DataService.getProducts())
  }

  // Generate Purchase Bill No
  const genPurchaseNo = () => {
    const list = DataService.getPurchases()
    return `PUR-2627-${String(list.length + 1).padStart(3, '0')}`
  }

  // ── Metrics ────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalVolume = purchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0)
    const totalPaid = purchases.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0)
    const totalPayable = purchases.reduce((sum, p) => sum + (Number(p.balance_amount) || 0), 0)
    const activeSuppliersCount = suppliers.length
    return { totalVolume, totalPaid, totalPayable, activeSuppliersCount }
  }, [purchases, suppliers])

  // ── Product Autocomplete Helpers ────────────────────────────────────
  const getProductMatches = (queryStr: string) => {
    const q = (queryStr || '').trim().toLowerCase()
    if (!q) return productsList.slice(0, 6)
    return productsList.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8)
  }

  const selectProductForPurchaseRow = (index: number, prod: any) => {
    setItems(prev => {
      const updated = [...prev]
      const qty = Number(updated[index]?.qty) || 1
      const rate = Number(prod.price) || 0
      updated[index] = {
        product_name: prod.name,
        unit: prod.unit || 'pcs',
        qty,
        rate,
        amount: qty * rate
      }
      return updated
    })
    setActiveSearchRowIndex(null)
  }

  // ── Item Row Handlers ───────────────────────────────────────────────
  const handleAddItemRow = () => {
    setItems(prev => [...prev, { product_name: '', qty: 1, unit: 'roll', rate: 0, amount: 0 }])
  }

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    setItems(prev => {
      const updated = [...prev]
      const item = { ...updated[index], [field]: value }
      if (field === 'qty' || field === 'rate') {
        item.amount = (Number(item.qty) || 0) * (Number(item.rate) || 0)
      }
      updated[index] = item
      return updated
    })
  }

  const totalBillAmount = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)

  // ── Open Purchase Modal ─────────────────────────────────────────────
  const openNewPurchaseModal = () => {
    setEditingPurchaseId(null)
    setPurchaseNo(genPurchaseNo())
    setSupplierName('')
    setSupplierMobile('')
    setSupplierGstin('')
    setPurchaseDate(new Date().toISOString().split('T')[0])
    setPaidAmount(0)
    setNotes('')
    setItems([{ product_name: '', qty: 1, unit: 'roll', rate: 0, amount: 0 }])
    setShowPurchaseModal(true)
  }

  const openEditPurchaseModal = (pur: Purchase) => {
    setEditingPurchaseId(pur.id)
    setPurchaseNo(pur.purchase_number)
    setSupplierName(pur.supplier_name)
    setSupplierMobile(pur.supplier_mobile || '')
    setSupplierGstin(pur.supplier_gstin || '')
    setPurchaseDate(pur.date || new Date().toISOString().split('T')[0])
    setPaidAmount(pur.paid_amount || 0)
    setNotes(pur.notes || '')
    if (pur.items && pur.items.length > 0) {
      setItems(pur.items.map(i => ({
        product_name: i.product_name,
        unit: i.unit || 'pcs',
        qty: Number(i.qty) || 1,
        rate: Number(i.rate) || 0,
        amount: Number(i.amount) || (Number(i.qty) * Number(i.rate))
      })))
    } else {
      setItems([{ product_name: '', qty: 1, unit: 'pcs', rate: 0, amount: 0 }])
    }
    setShowPurchaseModal(true)
  }

  // ── Save Purchase ───────────────────────────────────────────────────
  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierName.trim()) {
      alert('Please select or enter a supplier name.')
      return
    }

    const validItems = items.filter(i => i.product_name.trim() !== '')
    if (validItems.length === 0) {
      alert('Please add at least one material item.')
      return
    }

    DataService.savePurchase({
      id: editingPurchaseId || undefined,
      purchase_number: purchaseNo || genPurchaseNo(),
      supplier_name: supplierName.trim(),
      supplier_mobile: supplierMobile.trim(),
      supplier_gstin: supplierGstin.trim(),
      date: purchaseDate,
      total_amount: totalBillAmount,
      paid_amount: paidAmount,
      items: validItems,
      notes
    })

    // Auto sync any new products to the catalog
    validItems.forEach(item => {
      const nameTrim = item.product_name.trim()
      const exists = productsList.some(p => p.name.toLowerCase() === nameTrim.toLowerCase())
      if (!exists && nameTrim) {
        DataService.saveProduct({
          name: nameTrim,
          unit: item.unit || 'pcs',
          price: Number(item.rate) || 0,
          gst_rate: 18,
          hsn_code: '9983'
        })
      }
    })

    // Also auto-save supplier if not present
    const existingSupp = suppliers.find(s => s.name.toLowerCase() === supplierName.trim().toLowerCase())
    if (!existingSupp && supplierName.trim()) {
      DataService.saveSupplier({
        name: supplierName.trim(),
        mobile: supplierMobile.trim(),
        gst_no: supplierGstin.trim()
      })
    }

    setShowPurchaseModal(false)
    loadData()
  }

  // ── Save Quick Product to Catalog ────────────────────────────────────
  const handleSaveQuickProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickProductForm.name.trim()) return

    DataService.saveProduct({
      name: quickProductForm.name.trim(),
      category: quickProductForm.category,
      unit: quickProductForm.unit,
      price: Number(quickProductForm.price) || 0,
      gst_rate: Number(quickProductForm.gst_rate) || 18,
      hsn_code: quickProductForm.hsn_code || '9983'
    })

    setShowQuickProductModal(false)
    setQuickProductForm({ name: '', category: 'Raw Materials', unit: 'roll', price: 0, gst_rate: 18, hsn_code: '9983' })
    loadData()
  }

  // ── Delete Purchase ─────────────────────────────────────────────────
  const handleDeletePurchase = (id: number, billNo: string) => {
    if (window.confirm(`Are you sure you want to delete purchase bill ${billNo}?`)) {
      DataService.deletePurchase(id)
      loadData()
    }
  }

  // ── Record Payment Modal ────────────────────────────────────────────
  const openPaymentModal = (pur: Purchase) => {
    setSelectedPurchaseForPayment(pur)
    setPaymentInputAmt(String(pur.balance_amount || 0))
    setPaymentMode('BANK')
    setPaymentNotes('Payment against raw material purchase bill')
    setShowPaymentModal(true)
  }

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPurchaseForPayment) return
    const amt = parseFloat(paymentInputAmt) || 0
    if (amt <= 0) {
      alert('Please enter a valid payment amount.')
      return
    }

    DataService.recordPurchasePayment(selectedPurchaseForPayment.id, amt)
    setShowPaymentModal(false)
    loadData()
  }

  // ── Supplier Management Modal ────────────────────────────────────────
  const openNewSupplierModal = () => {
    setEditingSupplierId(null)
    setSupplierForm({ name: '', mobile: '', email: '', gst_no: '', address: '' })
    setShowSupplierModal(true)
  }

  const openEditSupplierModal = (supp: Supplier) => {
    setEditingSupplierId(supp.id)
    setSupplierForm({
      name: supp.name,
      mobile: supp.mobile || '',
      email: supp.email || '',
      gst_no: supp.gst_no || '',
      address: supp.address || ''
    })
    setShowSupplierModal(true)
  }

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierForm.name?.trim()) return

    DataService.saveSupplier({
      id: editingSupplierId || undefined,
      name: supplierForm.name.trim(),
      mobile: supplierForm.mobile?.trim() || '',
      email: supplierForm.email?.trim() || '',
      gst_no: supplierForm.gst_no?.trim() || '',
      address: supplierForm.address?.trim() || ''
    })

    setShowSupplierModal(false)
    loadData()
  }

  const handleDeleteSupplier = (id: number, name: string) => {
    if (window.confirm(`Delete supplier "${name}"?`)) {
      DataService.deleteSupplier(id)
      loadData()
    }
  }

  // ── Filtered Datasets ───────────────────────────────────────────────
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const q = searchQuery.toLowerCase().trim()
      const matchQuery =
        !q ||
        p.supplier_name.toLowerCase().includes(q) ||
        p.purchase_number.toLowerCase().includes(q) ||
        p.items.some(i => i.product_name.toLowerCase().includes(q))

      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter

      return matchQuery && matchStatus
    })
  }, [purchases, searchQuery, statusFilter])

  const filteredSuppliers = useMemo(() => {
    return suppliers.map(supp => {
      const suppPurchases = purchases.filter(p => p.supplier_name.toLowerCase() === supp.name.toLowerCase())
      const totalPurchased = suppPurchases.reduce((s, p) => s + Number(p.total_amount || 0), 0)
      const totalPaid = suppPurchases.reduce((s, p) => s + Number(p.paid_amount || 0), 0)
      const outstandingPayable = totalPurchased - totalPaid
      return {
        ...supp,
        purchaseCount: suppPurchases.length,
        totalPurchased,
        totalPaid,
        outstandingPayable
      }
    }).filter(supp => {
      const q = searchQuery.toLowerCase().trim()
      const matchQuery =
        !q ||
        supp.name.toLowerCase().includes(q) ||
        (supp.mobile && supp.mobile.includes(q)) ||
        (supp.gst_no && supp.gst_no.toLowerCase().includes(q))

      const matchBalance =
        supplierBalanceFilter === 'ALL' ||
        (supplierBalanceFilter === 'PAYABLE' && supp.outstandingPayable > 0) ||
        (supplierBalanceFilter === 'PAID' && supp.outstandingPayable <= 0)

      return matchQuery && matchBalance
    })
  }, [suppliers, purchases, searchQuery, supplierBalanceFilter])

  return (
    <div className={`vpm-pur-module ${isDark ? 'theme-dark' : 'theme-light'}`}>
      
      {/* ── Top Header Banner ──────────────────────────────────────── */}
      <div className="vpm-pur-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="vpm-pur-icon-box">
            <ShoppingCart size={22} />
          </div>
          <div>
            <h3 className="fw-extrabold m-0 text-gradient-title">Purchase & Supplier Management</h3>
            <p className="text-muted small m-0 fw-medium">
              Maintain raw material stock purchases, paper rolls, flex vinyl media, supplier ledgers, and payments.
            </p>
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <button
            type="button"
            className="vpm-btn-pur-action vpm-btn-pur-sec"
            onClick={() => DataService.exportAllDataToExcel()}
            title="Export all records to Excel (.xlsx)"
          >
            <FileSpreadsheet size={15} /> Excel Export
          </button>
          <button
            type="button"
            className="vpm-btn-pur-action vpm-btn-pur-sec"
            onClick={openNewSupplierModal}
          >
            <UserCheck size={16} /> Add Supplier
          </button>
          <button
            type="button"
            className="vpm-btn-pur-action vpm-btn-add-pur"
            onClick={openNewPurchaseModal}
          >
            <Plus size={16} /> New Purchase Entry
          </button>
        </div>
      </div>

      {/* ── Stat Metric Cards ──────────────────────────────────────── */}
      <Row className="g-3 my-2">
        <Col xl={3} md={6} sm={6}>
          <div className="vpm-pur-stat-card card-purple">
            <div className="vpm-pur-stat-top">
              <span className="vpm-pur-stat-label">Total Purchase Volume</span>
              <div className="vpm-pur-stat-icon"><ShoppingCart size={18} /></div>
            </div>
            <div className="vpm-pur-stat-val">₹{metrics.totalVolume.toLocaleString('en-IN')}</div>
            <div className="vpm-pur-stat-sub">Across {purchases.length} purchase bills</div>
          </div>
        </Col>

        <Col xl={3} md={6} sm={6}>
          <div className="vpm-pur-stat-card card-emerald">
            <div className="vpm-pur-stat-top">
              <span className="vpm-pur-stat-label">Total Paid to Vendors</span>
              <div className="vpm-pur-stat-icon"><CheckCircle2 size={18} /></div>
            </div>
            <div className="vpm-pur-stat-val">₹{metrics.totalPaid.toLocaleString('en-IN')}</div>
            <div className="vpm-pur-stat-sub">Cleared vendor payments</div>
          </div>
        </Col>

        <Col xl={3} md={6} sm={6}>
          <div className="vpm-pur-stat-card card-amber">
            <div className="vpm-pur-stat-top">
              <span className="vpm-pur-stat-label">Outstanding Payable</span>
              <div className="vpm-pur-stat-icon"><Clock size={18} /></div>
            </div>
            <div className="vpm-pur-stat-val">₹{metrics.totalPayable.toLocaleString('en-IN')}</div>
            <div className="vpm-pur-stat-sub">Pending supplier balance</div>
          </div>
        </Col>

        <Col xl={3} md={6} sm={6}>
          <div className="vpm-pur-stat-card card-indigo">
            <div className="vpm-pur-stat-top">
              <span className="vpm-pur-stat-label">Active Suppliers</span>
              <div className="vpm-pur-stat-icon"><Building2 size={18} /></div>
            </div>
            <div className="vpm-pur-stat-val">{metrics.activeSuppliersCount}</div>
            <div className="vpm-pur-stat-sub">Registered paper & media vendors</div>
          </div>
        </Col>
      </Row>

      {/* ── View Toggle Tabs ────────────────────────────────────────── */}
      <div className="vpm-pur-toggle-bar my-3">
        <button
          className={`vpm-pur-tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          <ShoppingCart size={16} /> Purchase Bills & Stock Entries ({purchases.length})
        </button>
        <button
          className={`vpm-pur-tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          <Building2 size={16} /> Supplier Directory & Ledgers ({suppliers.length})
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: PURCHASES VIEW
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'purchases' && (
        <>
          {/* Search & Filter Toolbar */}
          <div className="vpm-pur-search-bar mb-3">
            <div className="row g-2 align-items-center w-100">
              <div className="col-md-7">
                <div className="vpm-pur-search-wrap">
                  <Search size={18} className="vpm-pur-search-icon" />
                  <input
                    type="text"
                    className="vpm-pur-search-input"
                    placeholder="Search by Supplier name, Purchase Bill #, or Material Item..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <X size={16} className="clear-search-icon" onClick={() => setSearchQuery('')} />
                  )}
                </div>
              </div>

              <div className="col-md-5 d-flex gap-2 justify-content-end">
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="vpm-pur-filter-select"
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="PAID">Paid</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="UNPAID">Unpaid</option>
                </Form.Select>
              </div>
            </div>
          </div>

          {/* Purchase History Table */}
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
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-5 text-muted fw-medium">
                        <ShoppingCart size={36} className="mb-2 opacity-50 d-block mx-auto" />
                        No purchase records found matching filter.
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
                              {pur.supplier_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="vpm-cust-info-box">
                              <span className="vpm-cust-title">{pur.supplier_name}</span>
                              <span className="vpm-cust-date">{pur.supplier_mobile || 'No Mobile'}</span>
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
                                {item.product_name} ({item.qty} {item.unit || 'pcs'})
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
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            {pur.balance_amount > 0 && (
                              <button
                                type="button"
                                className="vpm-act-btn vpm-act-btn-pay"
                                onClick={() => openPaymentModal(pur)}
                                title="Record Vendor Payment"
                              >
                                <CreditCard size={14} /> Pay
                              </button>
                            )}

                            <button
                              type="button"
                              className="vpm-act-btn vpm-act-btn-print"
                              onClick={() => setPreviewPurchaseVoucher(pur)}
                              title="Print Purchase Slip / Goods Note"
                            >
                              <Printer size={14} />
                            </button>

                            <button
                              type="button"
                              className="vpm-act-btn vpm-act-btn-edit"
                              onClick={() => openEditPurchaseModal(pur)}
                              title="Edit Purchase Entry"
                            >
                              <Edit2 size={14} />
                            </button>

                            <button
                              type="button"
                              className="vpm-act-btn vpm-act-btn-delete"
                              onClick={() => handleDeletePurchase(pur.id, pur.purchase_number)}
                              title="Delete Purchase Record"
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
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: SUPPLIERS DIRECTORY VIEW
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'suppliers' && (
        <>
          {/* Search & Filter Toolbar */}
          <div className="vpm-pur-search-bar mb-3">
            <div className="row g-2 align-items-center w-100">
              <div className="col-md-7">
                <div className="vpm-pur-search-wrap">
                  <Search size={18} className="vpm-pur-search-icon" />
                  <input
                    type="text"
                    className="vpm-pur-search-input"
                    placeholder="Search by Supplier Business Name, Mobile, or GSTIN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <X size={16} className="clear-search-icon" onClick={() => setSearchQuery('')} />
                  )}
                </div>
              </div>

              <div className="col-md-5 d-flex gap-2 justify-content-end">
                <Form.Select
                  value={supplierBalanceFilter}
                  onChange={(e) => setSupplierBalanceFilter(e.target.value)}
                  className="vpm-pur-filter-select"
                >
                  <option value="ALL">All Suppliers</option>
                  <option value="PAYABLE">Has Outstanding Payable</option>
                  <option value="PAID">Fully Cleared Balance</option>
                </Form.Select>
              </div>
            </div>
          </div>

          {/* Supplier Grid Cards */}
          <Row className="g-3">
            {filteredSuppliers.length === 0 ? (
              <Col xs={12} className="text-center py-5 text-muted">
                <Building2 size={36} className="mb-2 opacity-50 d-block mx-auto" />
                No supplier records found.
              </Col>
            ) : (
              filteredSuppliers.map((supp) => (
                <Col key={supp.id} lg={4} md={6} sm={12}>
                  <div className="vpm-supplier-card">
                    <div className="vpm-supp-card-header d-flex justify-content-between align-items-start">
                      <div className="d-flex gap-2 align-items-center">
                        <div className="vpm-supp-avatar-big">
                          {supp.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h6 className="fw-extrabold m-0 text-truncate" style={{ maxWidth: 180 }}>{supp.name}</h6>
                          <span className="small text-muted d-block">{supp.mobile || 'No Phone'}</span>
                        </div>
                      </div>

                      <div className="d-flex gap-1">
                        <button
                          type="button"
                          className="vpm-act-btn vpm-act-btn-edit"
                          onClick={() => openEditSupplierModal(supp)}
                          title="Edit Supplier"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="vpm-act-btn vpm-act-btn-delete"
                          onClick={() => handleDeleteSupplier(supp.id, supp.name)}
                          title="Delete Supplier"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="vpm-supp-card-body my-3">
                      {supp.gst_no && (
                        <div className="vpm-supp-info-row">
                          <Building2 size={13} />
                          <span>GSTIN: <strong>{supp.gst_no}</strong></span>
                        </div>
                      )}
                      {supp.email && (
                        <div className="vpm-supp-info-row">
                          <Mail size={13} />
                          <span>{supp.email}</span>
                        </div>
                      )}
                      {supp.address && (
                        <div className="vpm-supp-info-row">
                          <MapPin size={13} />
                          <span className="text-truncate" style={{ maxWidth: 220 }}>{supp.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="vpm-supp-card-footer d-flex justify-content-between align-items-center border-top pt-2">
                      <div>
                        <span className="small text-muted d-block">Outstanding Balance:</span>
                        <strong className={supp.outstandingPayable > 0 ? 'text-danger' : 'text-success'}>
                          ₹{supp.outstandingPayable.toLocaleString('en-IN')}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="vpm-btn-pur-action vpm-btn-pur-sec"
                        style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                        onClick={() => setSelectedLedgerSupplier(supp)}
                      >
                        <Eye size={13} /> View Ledger
                      </button>
                    </div>
                  </div>
                </Col>
              ))
            )}
          </Row>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL 1: NEW / EDIT PURCHASE ENTRY MODAL
         ══════════════════════════════════════════════════════════════ */}
      <Modal
        show={showPurchaseModal}
        onHide={() => setShowPurchaseModal(false)}
        centered
        size="lg"
        contentClassName={isDark ? 'vpm-modal-content theme-dark' : 'vpm-modal-content theme-light'}
      >
        <div className="vpm-modal-header-pro d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div className="vpm-pur-icon-box" style={{ width: 34, height: 34, borderRadius: 10 }}>
                  <ShoppingCart size={18} />
                </div>
                <h5 className="fw-extrabold m-0">
                  {editingPurchaseId ? 'Edit Raw Material Purchase Entry' : 'Record Raw Material / Stock Purchase'}
                </h5>
              </div>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowPurchaseModal(false)} />
            </div>

            <Form onSubmit={handleSavePurchase}>
              <Modal.Body className="p-4">
                <Row className="g-3 mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">Purchase Bill No.</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        value={purchaseNo}
                        onChange={(e) => setPurchaseNo(e.target.value)}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px', fontWeight: 700 }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={5}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">Supplier Business Name *</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        placeholder="Select or type vendor name"
                        value={supplierName}
                        onChange={(e) => {
                          const val = e.target.value
                          setSupplierName(val)
                          const matched = suppliers.find(s => s.name.toLowerCase() === val.toLowerCase())
                          if (matched) {
                            setSupplierMobile(matched.mobile || '')
                            setSupplierGstin(matched.gst_no || '')
                          }
                        }}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
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

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">Supplier Mobile No.</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="9XXXXXXXXX"
                        value={supplierMobile}
                        onChange={(e) => setSupplierMobile(e.target.value)}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">Supplier GSTIN</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. 24DDDDD3333D4Z8"
                        value={supplierGstin}
                        onChange={(e) => setSupplierGstin(e.target.value.toUpperCase())}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px', textTransform: 'uppercase' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-between align-items-center mb-2 mt-3">
                  <h6 className="fw-extrabold m-0 text-primary">Itemized Raw Materials & Media Stock</h6>
                  <button
                    type="button"
                    className="vpm-btn-pur-action vpm-btn-pur-sec"
                    style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                    onClick={() => setShowQuickProductModal(true)}
                  >
                    <Plus size={13} /> Add Product to Catalog
                  </button>
                </div>

                {/* Explicit Item Column Header Row */}
                <Row className="g-2 fw-bold text-muted small mb-1 px-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <Col md={4}>Material / Product Description</Col>
                  <Col md={2}>Unit</Col>
                  <Col md={2}>Qty</Col>
                  <Col md={2}>Rate (₹)</Col>
                  <Col md={1}>Total</Col>
                  <Col md={1} className="text-center"></Col>
                </Row>

                {items.map((item, idx) => (
                  <Row key={idx} className="g-2 align-items-center mb-2">
                    <Col md={4} style={{ position: 'relative' }}>
                      <Form.Control
                        placeholder="Material description (e.g. Star Flex Roll)"
                        value={item.product_name}
                        onChange={(e) => {
                          handleItemChange(idx, 'product_name', e.target.value)
                          setActiveSearchRowIndex(idx)
                        }}
                        onFocus={() => setActiveSearchRowIndex(idx)}
                        onBlur={() => setTimeout(() => setActiveSearchRowIndex(null), 250)}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px' }}
                      />

                      {/* Product Catalog Autocomplete Menu */}
                      {activeSearchRowIndex === idx && getProductMatches(item.product_name).length > 0 && (
                        <div className="eb-product-autocomplete-menu" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1050 }}>
                          <div className="eb-product-autocomplete-header">
                            <span>Catalog Suggestions</span>
                          </div>
                          {getProductMatches(item.product_name).map((p) => (
                            <div
                              key={p.id}
                              className="eb-product-autocomplete-item"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                selectProductForPurchaseRow(idx, p)
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="eb-product-title">
                                  <span className="eb-product-title-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                                </div>
                                <div className="eb-product-meta">
                                  <span className="eb-product-hsn-tag">{p.category || 'Product'}</span>
                                </div>
                              </div>
                              <span className="eb-product-price-tag">₹{p.price}{p.unit ? <span className="eb-price-unit"> / {p.unit}</span> : ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Col>

                    <Col md={2}>
                      <Form.Select
                        value={UNITS.includes(item.unit || 'pcs') ? (item.unit || 'pcs') : 'Other'}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === 'Other') {
                            handleItemChange(idx, 'unit', 'Custom')
                          } else {
                            handleItemChange(idx, 'unit', val)
                          }
                        }}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '8px' }}
                      >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </Form.Select>
                      {(!UNITS.includes(item.unit || 'pcs') || item.unit === 'Other' || item.unit === 'Custom') && (
                        <Form.Control
                          placeholder="Type unit..."
                          value={item.unit === 'Other' ? '' : item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="vpm-pur-search-input mt-1"
                          style={{ paddingLeft: '8px', fontSize: '0.74rem' }}
                        />
                      )}
                    </Col>

                    <Col md={2}>
                      <Form.Control
                        type="number" min="0" step="0.01"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Col>

                    <Col md={2}>
                      <Form.Control
                        type="number" min="0" step="0.01"
                        placeholder="Rate ₹"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px' }}
                      />
                    </Col>

                    <Col md={1}>
                      <Form.Control
                        readOnly
                        value={`₹${item.amount}`}
                        className="vpm-pur-search-input bg-light-subtle"
                        style={{ paddingLeft: '6px', fontSize: '0.78rem', fontWeight: 700 }}
                      />
                    </Col>

                    <Col md={1} className="text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          className="vpm-act-btn vpm-act-btn-delete"
                          onClick={() => handleRemoveItemRow(idx)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
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

                <Row className="g-3 mt-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">Notes / Internal Remarks</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Delivery notes, transport details, batch numbers..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px', height: 'auto' }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <div className="vpm-invoice-preview-box p-3 rounded-3" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', border: '1px solid var(--pur-border)' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold small text-muted">Total Bill Amount:</span>
                        <h4 className="fw-extrabold text-primary m-0">₹{totalBillAmount.toLocaleString('en-IN')}</h4>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold small text-muted">Amount Paid Now (₹):</span>
                        <Form.Control
                          type="number" min="0" step="0.01"
                          style={{ width: 130, padding: '4px 8px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'right' }}
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="d-flex justify-content-between align-items-center border-top pt-2">
                        <span className="fw-bold small text-muted">Remaining Balance (Payable):</span>
                        <strong className="text-danger fw-extrabold" style={{ fontSize: '1rem' }}>
                          ₹{Math.max(0, totalBillAmount - paidAmount).toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  </Col>
                </Row>

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
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          MODAL 2: RECORD PAYMENT MODAL
         ══════════════════════════════════════════════════════════════ */}
      {showPaymentModal && selectedPurchaseForPayment && (
        <Modal
          show={showPaymentModal}
          onHide={() => setShowPaymentModal(false)}
          centered
          contentClassName={isDark ? 'vpm-modal-content theme-dark' : 'vpm-modal-content theme-light'}
        >
          <div className="vpm-modal-header-pro d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                <div className="d-flex align-items-center gap-2 text-white">
                  <CreditCard size={18} />
                  <h5 className="fw-extrabold m-0">Record Supplier Payment</h5>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPaymentModal(false)} />
              </div>

              <Form onSubmit={handleSavePayment}>
                <Modal.Body className="p-4">
                  <div className="p-3 rounded-3 mb-3" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <div className="small text-muted">Purchase Bill #: <strong>{selectedPurchaseForPayment.purchase_number}</strong></div>
                    <div className="fw-bold text-dark">{selectedPurchaseForPayment.supplier_name}</div>
                    <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                      <span>Outstanding Balance:</span>
                      <strong className="text-danger">₹{selectedPurchaseForPayment.balance_amount.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small">Payment Amount (₹) *</Form.Label>
                    <Form.Control
                      required
                      type="number" min="0.01" step="0.01"
                      value={paymentInputAmt}
                      onChange={(e) => setPaymentInputAmt(e.target.value)}
                      className="vpm-pur-search-input"
                      style={{ paddingLeft: '14px', fontSize: '1rem', fontWeight: 800 }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small">Payment Mode</Form.Label>
                    <Form.Select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="vpm-pur-search-input"
                      style={{ paddingLeft: '14px' }}
                    >
                      <option value="BANK">Bank Transfer (IMPS / NEFT)</option>
                      <option value="UPI">UPI (Google Pay / PhonePe)</option>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Cheque / Card</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="fw-bold small">Payment Remarks</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. UTR / Transaction reference no."
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="vpm-pur-search-input"
                      style={{ paddingLeft: '14px' }}
                    />
                  </Form.Group>
                </Modal.Body>

                <div className="p-3 bg-light-subtle d-flex justify-content-end gap-2 border-top">
                  <button type="button" className="vpm-tab-btn-pro" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="vpm-btn-pur-action" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', border: 'none', padding: '8px 24px' }}>
                    Save Payment
                  </button>
                </div>
              </Form>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL 3: SUPPLIER ADD / EDIT MODAL
         ══════════════════════════════════════════════════════════════ */}
      <Modal
        show={showSupplierModal}
        onHide={() => setShowSupplierModal(false)}
        centered
        size="lg"
        contentClassName={isDark ? 'vpm-modal-content theme-dark' : 'vpm-modal-content theme-light'}
      >
        <div className="vpm-modal-header-pro d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div className="vpm-pur-icon-box" style={{ width: 34, height: 34, borderRadius: 10 }}>
                  <UserCheck size={18} />
                </div>
                <h5 className="fw-extrabold m-0">
                  {editingSupplierId ? 'Edit Supplier Details' : 'Add New Supplier / Vendor'}
                </h5>
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
                        value={supplierForm.name || ''}
                        onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
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
                        value={supplierForm.mobile || ''}
                        onChange={(e) => setSupplierForm(prev => ({ ...prev, mobile: e.target.value }))}
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
                        placeholder="vendor@company.com"
                        value={supplierForm.email || ''}
                        onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
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
                        value={supplierForm.gst_no || ''}
                        onChange={(e) => setSupplierForm(prev => ({ ...prev, gst_no: e.target.value.toUpperCase() }))}
                        className="vpm-pur-search-input"
                        style={{ paddingLeft: '14px', textTransform: 'uppercase' }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">Office / Warehouse Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Enter complete office address"
                        value={supplierForm.address || ''}
                        onChange={(e) => setSupplierForm(prev => ({ ...prev, address: e.target.value }))}
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
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          QUICK ADD PRODUCT TO CATALOG MODAL
         ══════════════════════════════════════════════════════════════ */}
      <Modal
        show={showQuickProductModal}
        onHide={() => setShowQuickProductModal(false)}
        centered
        contentClassName={isDark ? 'vpm-modal-content theme-dark' : 'vpm-modal-content theme-light'}
      >
        <div className="vpm-modal-header-pro d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Plus size={18} />
            <h5 className="fw-extrabold m-0">Add Product to Catalog</h5>
          </div>
          <button type="button" className="btn-close btn-close-white" onClick={() => setShowQuickProductModal(false)} />
        </div>

        <Form onSubmit={handleSaveQuickProduct}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Product / Material Name *</Form.Label>
              <Form.Control
                required
                type="text"
                placeholder="e.g. Star Flex Roll 13oz"
                value={quickProductForm.name}
                onChange={(e) => setQuickProductForm(prev => ({ ...prev, name: e.target.value }))}
                className="vpm-pur-search-input"
                style={{ paddingLeft: '14px' }}
              />
            </Form.Group>

            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Unit</Form.Label>
                  <Form.Select
                    value={quickProductForm.unit}
                    onChange={(e) => setQuickProductForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="vpm-pur-search-input"
                    style={{ paddingLeft: '10px' }}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Standard Rate (₹)</Form.Label>
                  <Form.Control
                    type="number" min="0" step="0.01"
                    placeholder="0.00"
                    value={quickProductForm.price}
                    onChange={(e) => setQuickProductForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="vpm-pur-search-input"
                    style={{ paddingLeft: '14px' }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">GST Rate (%)</Form.Label>
                  <Form.Select
                    value={quickProductForm.gst_rate}
                    onChange={(e) => setQuickProductForm(prev => ({ ...prev, gst_rate: Number(e.target.value) }))}
                    className="vpm-pur-search-input"
                    style={{ paddingLeft: '10px' }}
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">HSN Code</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="9983"
                    value={quickProductForm.hsn_code}
                    onChange={(e) => setQuickProductForm(prev => ({ ...prev, hsn_code: e.target.value }))}
                    className="vpm-pur-search-input"
                    style={{ paddingLeft: '14px' }}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>

          <div className="p-3 bg-light-subtle d-flex justify-content-end gap-2 border-top">
            <button type="button" className="vpm-tab-btn-pro" onClick={() => setShowQuickProductModal(false)}>
              Cancel
            </button>
            <button type="submit" className="vpm-btn-pur-action vpm-btn-add-pur" style={{ padding: '8px 24px' }}>
              Add to Catalog
            </button>
          </div>
        </Form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          MODAL 4: SUPPLIER LEDGER MODAL
         ══════════════════════════════════════════════════════════════ */}
      {selectedLedgerSupplier && (
        <Modal
          show={true}
          onHide={() => setSelectedLedgerSupplier(null)}
          centered
          size="lg"
          contentClassName={isDark ? 'vpm-modal-content theme-dark' : 'vpm-modal-content theme-light'}
        >
          <div className="vpm-modal-header-pro d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <Building2 size={18} />
                  <h5 className="fw-extrabold m-0">Supplier Ledger: {selectedLedgerSupplier.name}</h5>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedLedgerSupplier(null)} />
              </div>

              <Modal.Body className="p-4">
                <div className="p-3 rounded-3 mb-3 bg-light-subtle d-flex justify-content-between align-items-center border">
                  <div>
                    <h6 className="fw-extrabold m-0">{selectedLedgerSupplier.name}</h6>
                    <span className="small text-muted">📞 {selectedLedgerSupplier.mobile || 'N/A'} | GST: {selectedLedgerSupplier.gst_no || 'N/A'}</span>
                  </div>
                  <div className="text-end">
                    <span className="small text-muted d-block">Outstanding Payable</span>
                    <h5 className="fw-extrabold text-danger m-0">
                      ₹{purchases
                        .filter(p => p.supplier_name.toLowerCase() === selectedLedgerSupplier.name.toLowerCase())
                        .reduce((s, p) => s + (p.balance_amount || 0), 0)
                        .toLocaleString('en-IN')}
                    </h5>
                  </div>
                </div>

                <h6 className="fw-extrabold mb-2">Purchase History & Bills</h6>
                <div className="table-responsive" style={{ maxHeight: 280, overflowY: 'auto' }}>
                  <table className="vpm-pur-table">
                    <thead>
                      <tr>
                        <th>Bill #</th>
                        <th>Date</th>
                        <th>Total (₹)</th>
                        <th>Paid (₹)</th>
                        <th>Balance (₹)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.filter(p => p.supplier_name.toLowerCase() === selectedLedgerSupplier.name.toLowerCase()).map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.purchase_number}</strong></td>
                          <td>{p.date}</td>
                          <td>₹{p.total_amount.toLocaleString('en-IN')}</td>
                          <td>₹{p.paid_amount.toLocaleString('en-IN')}</td>
                          <td><strong className="text-danger">₹{p.balance_amount.toLocaleString('en-IN')}</strong></td>
                          <td>
                            <span className={`vpm-status-pill ${p.status === 'PAID' ? 'vpm-status-pill-paid' : 'vpm-status-pill-unpaid'}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Modal.Body>

              <div className="p-3 bg-light-subtle d-flex justify-content-end border-top">
                <button type="button" className="vpm-tab-btn-pro" onClick={() => setSelectedLedgerSupplier(null)}>
                  Close Ledger
                </button>
              </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL 5: PRINTABLE PURCHASE VOUCHER SLIP
         ══════════════════════════════════════════════════════════════ */}
      {previewPurchaseVoucher && (
        <Modal
          show={true}
          onHide={() => setPreviewPurchaseVoucher(null)}
          centered
          size="lg"
          contentClassName={isDark ? 'vpm-modal-content theme-dark' : 'vpm-modal-content theme-light'}
        >
          <div className="vpm-modal-header-pro d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <Printer size={18} />
              <h5 className="fw-extrabold m-0">Purchase Order / Goods Received Note</h5>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="vpm-btn-pur-action vpm-btn-add-pur"
                onClick={() => window.print()}
              >
                <Printer size={14} /> Print Voucher
              </button>
              <button type="button" className="btn-close btn-close-white" onClick={() => setPreviewPurchaseVoucher(null)} />
            </div>
          </div>

          <Modal.Body className="p-4">
            <div id="printable-bill" className="bill-paper p-3 border" style={{ background: '#ffffff', color: '#000000' }}>
              <div className="text-center border-bottom pb-2 mb-3">
                <h4 className="fw-extrabold text-uppercase m-0">VIRAL PRINT MEDIA</h4>
                <span className="small d-block">GF-10, 13, 14, Satyamev Arcade, Chandkheda, Ahmedabad - 382424</span>
                <strong className="d-block mt-1">GOODS RECEIVED NOTE / PURCHASE ENTRY</strong>
              </div>

              <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                <div>
                  <div><strong>Purchase Bill #:</strong> {previewPurchaseVoucher.purchase_number}</div>
                  <div><strong>Supplier:</strong> {previewPurchaseVoucher.supplier_name}</div>
                  {previewPurchaseVoucher.supplier_gstin && <div><strong>GSTIN:</strong> {previewPurchaseVoucher.supplier_gstin}</div>}
                </div>
                <div className="text-end">
                  <div><strong>Date:</strong> {previewPurchaseVoucher.date}</div>
                  <div><strong>Status:</strong> {previewPurchaseVoucher.status}</div>
                </div>
              </div>

              <table className="table table-bordered table-sm">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Material Description</th>
                    <th>Unit</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Rate (₹)</th>
                    <th className="text-end">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {previewPurchaseVoucher.items.map((item, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{item.product_name}</td>
                      <td>{item.unit || 'pcs'}</td>
                      <td className="text-center">{item.qty}</td>
                      <td className="text-end">{item.rate}</td>
                      <td className="text-end">{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                <div>
                  <span className="small">Remarks: {previewPurchaseVoucher.notes || 'N/A'}</span>
                </div>
                <div className="text-end">
                  <div>Total Bill: <strong>₹{previewPurchaseVoucher.total_amount.toLocaleString('en-IN')}</strong></div>
                  <div>Paid: ₹{previewPurchaseVoucher.paid_amount.toLocaleString('en-IN')}</div>
                  <div>Balance: <strong className="text-danger">₹{previewPurchaseVoucher.balance_amount.toLocaleString('en-IN')}</strong></div>
                </div>
              </div>

              <div className="d-flex justify-content-between mt-5 pt-4">
                <div>Receiver Signatory</div>
                <div>Authorised Store Keeper</div>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}

    </div>
  )
}

export default PurchaseManagement
