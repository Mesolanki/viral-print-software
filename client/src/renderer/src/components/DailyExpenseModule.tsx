import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Table, Badge, Form, InputGroup, Modal } from 'react-bootstrap'
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
  ArrowDownRight
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { DataService, type DailyTransaction } from '../services/dataService'

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
    <div className="vpm-daily-expense-module p-3">
      
      {/* ── Header Bar ───────────────────────────────────────────── */}
      <Card className={`border-0 shadow-sm rounded-4 mb-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <DollarSign className="text-primary" size={24} />
              <h4 className="fw-bold m-0">Daily Small Income & Expense Loss Tracker</h4>
              <Badge bg="primary" className="px-2 py-1">Counter Petty Cash</Badge>
            </div>
            <p className="text-muted small m-0">
              Track daily small cash incomes, paper wastage losses, tea/snacks, ink refills, and net daily shop profit
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <Button
              variant="success"
              className="fw-bold rounded-3 d-flex align-items-center gap-2"
              onClick={() => openAddModal('INCOME')}
            >
              <Plus size={16} /> + Add Daily Income
            </Button>
            <Button
              variant="danger"
              className="fw-bold rounded-3 d-flex align-items-center gap-2"
              onClick={() => openAddModal('EXPENSE')}
            >
              <Plus size={16} /> + Record Expense / Loss
            </Button>
            <Button
              variant="outline-success"
              className="fw-bold rounded-3 d-flex align-items-center gap-2"
              onClick={exportToExcel}
            >
              <FileSpreadsheet size={16} /> Export Excel
            </Button>
            <Button
              variant="outline-secondary"
              className="fw-bold rounded-3 d-flex align-items-center gap-2"
              onClick={handlePrint}
            >
              <Printer size={16} /> Print Report
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* ── 4 KPI Stat Cards ─────────────────────────────────────── */}
      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <Card className={`border-0 shadow-sm rounded-4 ${isDark ? 'bg-slate-800 text-white' : 'bg-white'}`}>
            <Card.Body className="p-3 d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small font-semibold d-block">Today's Small Income</span>
                <h3 className="fw-bold text-success m-0 mt-1">₹{todayIncome.toLocaleString('en-IN')}</h3>
              </div>
              <div className="rounded-circle p-3 bg-success-subtle text-success">
                <ArrowUpRight size={24} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col sm={6} lg={3}>
          <Card className={`border-0 shadow-sm rounded-4 ${isDark ? 'bg-slate-800 text-white' : 'bg-white'}`}>
            <Card.Body className="p-3 d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small font-semibold d-block">Today's Expenses & Loss</span>
                <h3 className="fw-bold text-danger m-0 mt-1">₹{todayExpense.toLocaleString('en-IN')}</h3>
              </div>
              <div className="rounded-circle p-3 bg-danger-subtle text-danger">
                <ArrowDownRight size={24} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col sm={6} lg={3}>
          <Card className={`border-0 shadow-sm rounded-4 ${isDark ? 'bg-slate-800 text-white' : 'bg-white'}`}>
            <Card.Body className="p-3 d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small font-semibold d-block">Today's Net Margin</span>
                <h3 className={`fw-bold m-0 mt-1 ${todayNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  ₹{todayNet.toLocaleString('en-IN')}
                </h3>
              </div>
              <div className={`rounded-circle p-3 ${todayNet >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {todayNet >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col sm={6} lg={3}>
          <Card className={`border-0 shadow-sm rounded-4 ${isDark ? 'bg-slate-800 text-white' : 'bg-white'}`}>
            <Card.Body className="p-3 d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small font-semibold d-block">This Month's Total Expenses</span>
                <h3 className="fw-bold text-purple-600 m-0 mt-1">₹{monthExpense.toLocaleString('en-IN')}</h3>
              </div>
              <div className="rounded-circle p-3 bg-purple-100 text-purple-600">
                <Coffee size={24} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Main Table Card with Search & Filters ──────────────── */}
      <Card className={`border-0 shadow-sm rounded-4 ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <Card.Header className="p-3 border-0 bg-transparent">
          <Row className="g-3 align-items-center justify-content-between">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search category, notes, amount..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
                />
              </InputGroup>
            </Col>

            <Col md={8} className="d-flex flex-wrap gap-2 justify-content-md-end">
              {/* Type Filter Buttons */}
              <div className="btn-group" role="group">
                <Button
                  variant={filterType === 'ALL' ? 'primary' : (isDark ? 'outline-light' : 'outline-secondary')}
                  size="sm"
                  onClick={() => setFilterType('ALL')}
                  className="fw-bold"
                >
                  All Types
                </Button>
                <Button
                  variant={filterType === 'INCOME' ? 'success' : (isDark ? 'outline-light' : 'outline-secondary')}
                  size="sm"
                  onClick={() => setFilterType('INCOME')}
                  className="fw-bold"
                >
                  Income Only
                </Button>
                <Button
                  variant={filterType === 'EXPENSE' ? 'danger' : (isDark ? 'outline-light' : 'outline-secondary')}
                  size="sm"
                  onClick={() => setFilterType('EXPENSE')}
                  className="fw-bold"
                >
                  Expenses Only
                </Button>
              </div>

              {/* Date Filter Buttons */}
              <div className="btn-group" role="group">
                <Button
                  variant={filterDateRange === 'TODAY' ? 'dark' : (isDark ? 'outline-light' : 'outline-secondary')}
                  size="sm"
                  onClick={() => setFilterDateRange('TODAY')}
                  className="fw-bold"
                >
                  Today
                </Button>
                <Button
                  variant={filterDateRange === 'YESTERDAY' ? 'dark' : (isDark ? 'outline-light' : 'outline-secondary')}
                  size="sm"
                  onClick={() => setFilterDateRange('YESTERDAY')}
                  className="fw-bold"
                >
                  Yesterday
                </Button>
                <Button
                  variant={filterDateRange === 'MONTH' ? 'dark' : (isDark ? 'outline-light' : 'outline-secondary')}
                  size="sm"
                  onClick={() => setFilterDateRange('MONTH')}
                  className="fw-bold"
                >
                  This Month
                </Button>
                <Button
                  variant={filterDateRange === 'ALL' ? 'dark' : (isDark ? 'outline-light' : 'outline-secondary')}
                  size="sm"
                  onClick={() => setFilterDateRange('ALL')}
                  className="fw-bold"
                >
                  All Dates
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          <div style={{ overflowX: 'auto' }}>
            <Table hover responsive className={`align-middle m-0 ${isDark ? 'table-dark' : ''}`}>
              <thead className={isDark ? 'table-slate-800' : 'bg-light'}>
                <tr>
                  <th style={{ width: 40 }} className="text-center">#</th>
                  <th style={{ width: 110 }}>Date</th>
                  <th style={{ width: 100 }}>Type</th>
                  <th>Category</th>
                  <th>Notes / Description</th>
                  <th style={{ width: 110 }}>Payment Mode</th>
                  <th style={{ width: 130 }} className="text-end">Amount (₹)</th>
                  <th style={{ width: 50 }} className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted">
                      No income or expense records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((tx, idx) => (
                    <tr key={tx.id}>
                      <td className="text-center text-muted small fw-bold">{idx + 1}</td>
                      <td className="small font-monospace fw-bold">{tx.date}</td>
                      <td>
                        {tx.type === 'INCOME' ? (
                          <Badge bg="success" className="px-2 py-1">INCOME</Badge>
                        ) : (
                          <Badge bg="danger" className="px-2 py-1">EXPENSE</Badge>
                        )}
                      </td>
                      <td className="fw-bold">{tx.category}</td>
                      <td className="small text-muted">{tx.notes || '—'}</td>
                      <td>
                        <Badge bg="secondary" className="px-2 py-1">{tx.payment_mode}</Badge>
                      </td>
                      <td className={`text-end fw-bold fs-6 ${tx.type === 'INCOME' ? 'text-success' : 'text-danger'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="text-center">
                        <Button
                          variant="link"
                          className="text-danger p-0"
                          onClick={() => handleDeleteTransaction(tx.id)}
                          title="Delete Transaction"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* ── Add / Edit Transaction Modal ──────────────────────────── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleSaveTransaction}>
          <Modal.Header closeButton className={isDark ? 'bg-slate-900 text-white border-slate-700' : ''}>
            <Modal.Title className="fw-bold fs-5">
              {txType === 'INCOME' ? '💰 Record Daily Small Income' : '💸 Record Expense / Loss'}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className={isDark ? 'bg-slate-900 text-white' : ''}>
            {/* Type Switch Buttons */}
            <div className="d-flex gap-2 mb-3">
              <Button
                type="button"
                variant={txType === 'INCOME' ? 'success' : 'outline-success'}
                className="flex-fill fw-bold"
                onClick={() => {
                  setTxType('INCOME')
                  setTxCategory(incomeCategories[0])
                }}
              >
                💰 Daily Income
              </Button>
              <Button
                type="button"
                variant={txType === 'EXPENSE' ? 'danger' : 'outline-danger'}
                className="flex-fill fw-bold"
                onClick={() => {
                  setTxType('EXPENSE')
                  setTxCategory(expenseCategories[0])
                }}
              >
                💸 Expense / Loss
              </Button>
            </div>

            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Category</Form.Label>
                  <Form.Select
                    value={txCategory}
                    onChange={e => setTxCategory(e.target.value)}
                    className={isDark ? 'bg-slate-800 text-white border-slate-700' : ''}
                  >
                    {(txType === 'INCOME' ? incomeCategories : expenseCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Amount (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={txAmount}
                    onChange={e => setTxAmount(e.target.value)}
                    required
                    className={`fw-bold ${isDark ? 'bg-slate-800 text-white border-slate-700' : ''}`}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Payment Mode</Form.Label>
                  <Form.Select
                    value={txPaymentMode}
                    onChange={e => setTxPaymentMode(e.target.value as any)}
                    className={isDark ? 'bg-slate-800 text-white border-slate-700' : ''}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / PhonePe / GPay</option>
                    <option value="BANK">Bank Transfer</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={txDate}
                    onChange={e => setTxDate(e.target.value)}
                    required
                    className={isDark ? 'bg-slate-800 text-white border-slate-700' : ''}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Notes / Description (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="e.g. Chai for client, 5 sheets Star Flex wasted..."
                    value={txNotes}
                    onChange={e => setTxNotes(e.target.value)}
                    className={isDark ? 'bg-slate-800 text-white border-slate-700' : ''}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer className={isDark ? 'bg-slate-900 border-slate-700' : ''}>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant={txType === 'INCOME' ? 'success' : 'danger'} type="submit" className="fw-bold">
              Save Entry
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </div>
  )
}

export default DailyExpenseModule
