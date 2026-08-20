import React, { useState, useEffect } from 'react'
import { Row, Col, Button, Form, Modal } from 'react-bootstrap'
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Search,
  FileSpreadsheet,
  Printer,
  DollarSign,
  Coffee,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Sparkles
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { DataService, type DailyTransaction } from '../services/dataService'
import './DailyExpenseModule.css'

interface DailyExpenseModuleProps {
  theme: 'dark' | 'light'
}

export const DailyExpenseModule: React.FC<DailyExpenseModuleProps> = ({ theme }) => {
  const isDark = theme === 'dark'

  const [transactions, setTransactions] = useState<DailyTransaction[]>([])
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')
  const [filterDateRange, setFilterDateRange] = useState<'TODAY' | 'YESTERDAY' | 'MONTH' | 'ALL'>('TODAY')
  const [searchQuery, setSearchQuery] = useState('')

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false)
  const [txType, setTxType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE')
  const [txCategory, setTxCategory] = useState('Tea & Snacks')
  const [txAmount, setTxAmount] = useState('')
  const [txPaymentMode, setTxPaymentMode] = useState<'CASH' | 'UPI' | 'BANK'>('CASH')
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])
  const [txNotes, setTxNotes] = useState('')

  // Categories
  const incomeCategories = [
    'Counter Cash Sales',
    'Design & Editing Charges',
    'Scanning & Photocopy',
    'Paper Scrap / Waste Sale',
    'Delivery & Packing Fee',
    'Urgent Printing Charge',
    'Miscellaneous Income'
  ]

  const expenseCategories = [
    'Tea & Snacks / Office Refreshments',
    'Paper Wastage / Damaged Goods Loss',
    'Ink & Chemical Refill',
    'Machine Maintenance & Repairs',
    'Courier & Delivery Charges',
    'Office Stationary & Supplies',
    'Staff Advance / Wages',
    'Electricity / Utility Bill',
    'Miscellaneous Expense / Loss'
  ]

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = () => {
    const list = DataService.getDailyTransactions()
    setTransactions(list)
  }

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(txAmount) || 0
    if (amt <= 0) {
      alert('Please enter a valid amount greater than 0.')
      return
    }

    DataService.saveDailyTransaction({
      type: txType,
      category: txCategory,
      amount: amt,
      payment_mode: txPaymentMode,
      date: txDate,
      notes: txNotes
    })

    loadTransactions()
    setShowModal(false)
    resetForm()
  }

  const handleDeleteTransaction = (id: number) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      DataService.deleteDailyTransaction(id)
      loadTransactions()
    }
  }

  const resetForm = () => {
    setTxType('EXPENSE')
    setTxCategory(expenseCategories[0])
    setTxAmount('')
    setTxPaymentMode('CASH')
    setTxDate(new Date().toISOString().split('T')[0])
    setTxNotes('')
  }

  const openAddModal = (type: 'INCOME' | 'EXPENSE') => {
    setTxType(type)
    setTxCategory(type === 'INCOME' ? incomeCategories[0] : expenseCategories[0])
    setShowModal(true)
  }

  // Filter calculations
  const todayStr = new Date().toISOString().split('T')[0]
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0]

  const filteredList = transactions.filter(t => {
    // Type Filter
    if (filterType !== 'ALL' && t.type !== filterType) return false

    // Date Range Filter
    if (filterDateRange === 'TODAY' && t.date !== todayStr) return false
    if (filterDateRange === 'YESTERDAY' && t.date !== yesterdayStr) return false
    if (filterDateRange === 'MONTH') {
      const tMonth = (t.date || '').substring(0, 7)
      const currentMonth = todayStr.substring(0, 7)
      if (tMonth !== currentMonth) return false
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchCat = (t.category || '').toLowerCase().includes(q)
      const matchNotes = (t.notes || '').toLowerCase().includes(q)
      const matchAmt = (t.amount || 0).toString().includes(q)
      if (!matchCat && !matchNotes && !matchAmt) return false
    }

    return true
  })

  // Stat Calculations
  const todayTransactions = transactions.filter(t => t.date === todayStr)
  const todayIncome = todayTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const todayExpense = todayTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
  const todayNet = todayIncome - todayExpense

  const currentMonthStr = todayStr.substring(0, 7)
  const monthTransactions = transactions.filter(t => (t.date || '').substring(0, 7) === currentMonthStr)
  const monthExpense = monthTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredList.map((t, idx) => ({
      'Sr No': idx + 1,
      'Date': t.date,
      'Type': t.type,
      'Category': t.category,
      'Amount (Rs)': t.amount,
      'Payment Mode': t.payment_mode,
      'Notes / Description': t.notes || '—'
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily_Income_Expenses')
    XLSX.writeFile(workbook, `Daily_Income_Expense_Report_${todayStr}.xlsx`)
  }

  // Print Summary
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={`vpm-daily-expense-module p-3 p-md-4 ${isDark ? 'theme-dark' : 'theme-light'}`}>
      
      {/* ── 1. PRO HERO BANNER ───────────────────────────────────────── */}
      <div className="vpm-expense-hero mb-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div className="d-flex align-items-start gap-3">
            <div className="vpm-hero-icon-wrapper mt-1">
              <DollarSign size={22} />
            </div>
            <div>
              <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                <h3 className="vpm-hero-title m-0">Daily Small Income & Expense Loss Tracker</h3>
                <span className="vpm-badge-petty">Counter Petty Cash</span>
              </div>
              <p className="vpm-hero-subtitle m-0">
                Track counter cash incomes, paper wastage losses, refreshments, refills, and net daily shop margin
              </p>
            </div>
          </div>

          <div className="vpm-hero-action-group">
            <Button
              className="vpm-btn-add-income d-flex align-items-center gap-2"
              onClick={() => openAddModal('INCOME')}
            >
              <Plus size={16} /> Add Daily Income
            </Button>
            <Button
              className="vpm-btn-record-expense d-flex align-items-center gap-2"
              onClick={() => openAddModal('EXPENSE')}
            >
              <Plus size={16} /> Record Expense / Loss
            </Button>
            <Button
              className="vpm-btn-hero-glass d-flex align-items-center gap-2"
              onClick={exportToExcel}
            >
              <FileSpreadsheet size={16} /> Export Excel
            </Button>
            <Button
              className="vpm-btn-hero-glass d-flex align-items-center gap-2"
              onClick={handlePrint}
            >
              <Printer size={16} /> Print
            </Button>
          </div>
        </div>
      </div>


      {/* ── 2. PRO KPI STAT CARDS ─────────────────────────────────────── */}
      <Row className="g-3 mb-4 align-items-stretch">
        <Col sm={6} lg={3}>
          <div className="vpm-kpi-card kpi-income">
            <div className="vpm-kpi-content-box">
              <span className="vpm-kpi-label">Today's Small Income</span>
              <div className="vpm-kpi-value val-income">₹{todayIncome.toLocaleString('en-IN')}</div>
              <span className="vpm-kpi-subtag text-success">
                <ArrowUpRight size={12} /> Counter Incomes
              </span>
            </div>
            <div className="vpm-kpi-icon-bubble bubble-income">
              <ArrowUpRight size={22} />
            </div>
          </div>
        </Col>

        <Col sm={6} lg={3}>
          <div className="vpm-kpi-card kpi-expense">
            <div className="vpm-kpi-content-box">
              <span className="vpm-kpi-label">Today's Expenses & Loss</span>
              <div className="vpm-kpi-value val-expense">₹{todayExpense.toLocaleString('en-IN')}</div>
              <span className="vpm-kpi-subtag text-danger">
                <ArrowDownRight size={12} /> Tea, Refills & Loss
              </span>
            </div>
            <div className="vpm-kpi-icon-bubble bubble-expense">
              <ArrowDownRight size={22} />
            </div>
          </div>
        </Col>

        <Col sm={6} lg={3}>
          <div className="vpm-kpi-card kpi-net">
            <div className="vpm-kpi-content-box">
              <span className="vpm-kpi-label">Today's Net Margin</span>
              <div className={`vpm-kpi-value ${todayNet >= 0 ? 'val-net-pos' : 'val-net-neg'}`}>
                ₹{todayNet.toLocaleString('en-IN')}
              </div>
              <span className={`vpm-kpi-subtag ${todayNet >= 0 ? 'text-info' : 'text-danger'}`}>
                {todayNet >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} Net Daily Profit
              </span>
            </div>
            <div className={`vpm-kpi-icon-bubble ${todayNet >= 0 ? 'bubble-net-pos' : 'bubble-net-neg'}`}>
              {todayNet >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
            </div>
          </div>
        </Col>

        <Col sm={6} lg={3}>
          <div className="vpm-kpi-card kpi-month">
            <div className="vpm-kpi-content-box">
              <span className="vpm-kpi-label">This Month Expenses</span>
              <div className="vpm-kpi-value val-month">₹{monthExpense.toLocaleString('en-IN')}</div>
              <span className="vpm-kpi-subtag text-purple">
                <Coffee size={12} /> Month Total Outflow
              </span>
            </div>
            <div className="vpm-kpi-icon-bubble bubble-month">
              <Coffee size={22} />
            </div>
          </div>
        </Col>
      </Row>


      {/* ── 3. MAIN DATA TABLE CARD & FILTERS ─────────────────────────── */}
      <div className="vpm-table-card">
        <div className="vpm-control-header">
          <Row className="g-3 align-items-center justify-content-between">
            <Col md={4}>
              <div className="vpm-search-group">
                <Search size={18} className="vpm-search-icon" />
                <Form.Control
                  type="text"
                  placeholder="Search category, notes, amount..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="vpm-search-input"
                />
              </div>
            </Col>

            <Col md={8} className="d-flex flex-wrap gap-2 justify-content-md-end">
              {/* Type Filter Buttons */}
              <div className="vpm-filter-pill-group">
                <button
                  type="button"
                  className={`vpm-filter-pill ${filterType === 'ALL' ? 'active-all' : ''}`}
                  onClick={() => setFilterType('ALL')}
                >
                  All Types
                </button>
                <button
                  type="button"
                  className={`vpm-filter-pill ${filterType === 'INCOME' ? 'active-income' : ''}`}
                  onClick={() => setFilterType('INCOME')}
                >
                  Income Only
                </button>
                <button
                  type="button"
                  className={`vpm-filter-pill ${filterType === 'EXPENSE' ? 'active-expense' : ''}`}
                  onClick={() => setFilterType('EXPENSE')}
                >
                  Expenses Only
                </button>
              </div>

              {/* Date Filter Buttons */}
              <div className="vpm-filter-pill-group">
                <button
                  type="button"
                  className={`vpm-filter-pill ${filterDateRange === 'TODAY' ? 'active-date' : ''}`}
                  onClick={() => setFilterDateRange('TODAY')}
                >
                  Today
                </button>
                <button
                  type="button"
                  className={`vpm-filter-pill ${filterDateRange === 'YESTERDAY' ? 'active-date' : ''}`}
                  onClick={() => setFilterDateRange('YESTERDAY')}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  className={`vpm-filter-pill ${filterDateRange === 'MONTH' ? 'active-date' : ''}`}
                  onClick={() => setFilterDateRange('MONTH')}
                >
                  This Month
                </button>
                <button
                  type="button"
                  className={`vpm-filter-pill ${filterDateRange === 'ALL' ? 'active-date' : ''}`}
                  onClick={() => setFilterDateRange('ALL')}
                >
                  All Dates
                </button>
              </div>
            </Col>
          </Row>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="vpm-custom-table">
            <thead>
              <tr>
                <th style={{ width: 50 }} className="text-center">#</th>
                <th style={{ width: 135 }}>Date</th>
                <th style={{ width: 120 }}>Type</th>
                <th>Category</th>
                <th>Notes / Description</th>
                <th style={{ width: 140 }}>Payment Mode</th>
                <th style={{ width: 150 }} className="text-end">Amount (₹)</th>
                <th style={{ width: 60 }} className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="vpm-empty-container">
                      <div className="vpm-empty-icon">
                        <Receipt size={32} />
                      </div>
                      <h6 className="fw-bold mb-1">No transactions found</h6>
                      <p className="text-muted small mb-3">
                        No income or expense entries match your selected date or type filters.
                      </p>
                      <Button
                        size="sm"
                        className="vpm-btn-add-income border-0"
                        onClick={() => openAddModal('INCOME')}
                      >
                        <Plus size={14} className="me-1" /> Add Entry Now
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((tx, idx) => (
                  <tr key={tx.id}>
                    <td className="text-center text-muted small fw-bold">{idx + 1}</td>
                    <td className="vpm-table-date">{tx.date}</td>
                    <td>
                      {tx.type === 'INCOME' ? (
                        <span className="vpm-badge-type-income">
                          <TrendingUp size={13} /> INCOME
                        </span>
                      ) : (
                        <span className="vpm-badge-type-expense">
                          <TrendingDown size={13} /> EXPENSE
                        </span>
                      )}
                    </td>
                    <td className="fw-bold">{tx.category}</td>
                    <td className="small text-muted">{tx.notes || '—'}</td>
                    <td>
                      <span className={`vpm-badge-mode mode-${(tx.payment_mode || 'CASH').toLowerCase()}`}>
                        {tx.payment_mode}
                      </span>
                    </td>
                    <td className="text-end">
                      <span className={tx.type === 'INCOME' ? 'vpm-amount-income' : 'vpm-amount-expense'}>
                        <span className="vpm-amount-sign">{tx.type === 'INCOME' ? '+' : '-'}</span>
                        <span className="vpm-amount-num">₹{tx.amount.toLocaleString('en-IN')}</span>
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="vpm-btn-delete"
                        onClick={() => handleDeleteTransaction(tx.id)}
                        title="Delete Transaction"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ── 4. ADD / EDIT TRANSACTION MODAL ──────────────────────────── */}
      {/* ── 4. ADD / EDIT TRANSACTION MODAL ──────────────────────────── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="vpm-modal-content">
        <Form onSubmit={handleSaveTransaction}>
          <div className={txType === 'INCOME' ? 'vpm-modal-header-income d-flex justify-content-between align-items-center' : 'vpm-modal-header-expense d-flex justify-content-between align-items-center'}>
            <div className="d-flex align-items-center gap-2 text-white">
              <Sparkles size={20} />
              <h5 className="fw-extrabold m-0 text-white fs-5">
                {txType === 'INCOME' ? 'Record Daily Small Income' : 'Record Expense / Loss'}
              </h5>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
          </div>

          <Modal.Body className="p-4">
            {/* Type Switch Buttons */}
            <div className="vpm-modal-switch-group mb-4">
              <button
                type="button"
                className={`vpm-modal-switch-btn ${txType === 'INCOME' ? 'active-income' : ''}`}
                onClick={() => {
                  setTxType('INCOME')
                  setTxCategory(incomeCategories[0])
                }}
              >
                💰 Daily Income
              </button>
              <button
                type="button"
                className={`vpm-modal-switch-btn ${txType === 'EXPENSE' ? 'active-expense' : ''}`}
                onClick={() => {
                  setTxType('EXPENSE')
                  setTxCategory(expenseCategories[0])
                }}
              >
                💸 Expense / Loss
              </button>
            </div>

            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <label className="vpm-form-label">Category</label>
                  <Form.Select
                    value={txCategory}
                    onChange={e => setTxCategory(e.target.value)}
                    className="vpm-modal-input"
                  >
                    {(txType === 'INCOME' ? incomeCategories : expenseCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <label className="vpm-form-label">Amount (₹)</label>
                  <div className="vpm-input-with-prefix">
                    <span className="vpm-input-prefix">₹</span>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={txAmount}
                      onChange={e => setTxAmount(e.target.value)}
                      required
                      className="vpm-modal-input has-prefix fw-bold"
                    />
                  </div>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <label className="vpm-form-label">Payment Mode</label>
                  <Form.Select
                    value={txPaymentMode}
                    onChange={e => setTxPaymentMode(e.target.value as any)}
                    className="vpm-modal-input"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / PhonePe / GPay</option>
                    <option value="BANK">Bank Transfer</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <label className="vpm-form-label">Date</label>
                  <Form.Control
                    type="date"
                    value={txDate}
                    onChange={e => setTxDate(e.target.value)}
                    required
                    className="vpm-modal-input"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <label className="vpm-form-label">Notes / Description (Optional)</label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="e.g. Chai for client, 5 sheets Star Flex wasted..."
                    value={txNotes}
                    onChange={e => setTxNotes(e.target.value)}
                    className="vpm-modal-textarea"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>

          <div className="p-3 bg-light-subtle d-flex justify-content-end gap-2 border-top">
            <button
              type="button"
              className="vpm-btn-hero-glass"
              style={{ color: isDark ? '#c4d0e8' : '#475569', background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: '1px solid #e2e8f0' }}
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={txType === 'INCOME' ? 'vpm-btn-add-income' : 'vpm-btn-record-expense'}
              style={{ padding: '9px 24px' }}
            >
              {txType === 'INCOME' ? 'Save Income Entry' : 'Save Expense Entry'}
            </button>
          </div>
        </Form>
      </Modal>

    </div>
  )
}

export default DailyExpenseModule
