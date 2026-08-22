import React, { useState, useEffect, useMemo } from 'react'
import { Row, Col, Button, Form } from 'react-bootstrap'
import {
  AlertCircle,
  FileText,
  CheckSquare,
  ShoppingCart,
  Receipt,
  HardDrive,
  PlusCircle,
  Truck,
  Users,
  PieChart as PieIcon,
  ArrowRight,
  Zap,
  Calendar,
  Search,
  BarChart3,
  Activity,
  DollarSign,
  Layers,
  Eye,
  RefreshCw
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import viralLogo from '../assets/logo_viral.png'
import { DataService, Invoice, TaskItem, Purchase } from '../services/dataService'
import { useAuth } from '../context/AuthContext'
import type { ActiveTabType } from './layout/AppLayout'
import './DashboardOverview.css'

interface DashboardOverviewProps {
  theme: 'dark' | 'light'
  onNavigate: (tab: ActiveTabType) => void
}

type FilterType = 'ALL' | 'TAX_INVOICE' | 'QUOTATION' | 'ESTIMATE'
type ChartViewMode = 'AREA' | 'BAR'
type TimeRangeMode = 'TODAY' | '1M' | '6M' | 'FY'

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ theme, onNavigate }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [filterType, setFilterType] = useState<FilterType>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [chartViewMode, setChartViewMode] = useState<ChartViewMode>('AREA')

  // Safely detect current logged in user role (Admin vs Operator/User)
  let authUser: any = null
  try {
    const auth = useAuth()
    authUser = auth?.user
  } catch (e) {
    // Fallback if rendered outside AuthProvider
  }

  const isAdmin = useMemo(() => {
    if (!authUser) {
      const storedUser = localStorage.getItem('vpm_user') || localStorage.getItem('user')
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          return (
            parsed?.role?.name === 'ADMIN' ||
            parsed?.role?.name === 'Admin' ||
            parsed?.role === 'ADMIN' ||
            parsed?.role === 'Admin' ||
            parsed?.username?.toLowerCase() === 'admin'
          )
        } catch (err) {}
      }
      return true
    }

    const roleName = authUser?.role?.name?.toUpperCase() || ''
    const roleLabel = authUser?.role?.label?.toUpperCase() || ''
    const username = authUser?.username?.toLowerCase() || ''

    return roleName === 'ADMIN' || roleLabel.includes('ADMIN') || username === 'admin'
  }, [authUser])

  // Default to FY (Full Financial Year) so live charts always display rich historical revenue curves
  const [timeRange, setTimeRange] = useState<TimeRangeMode>('FY')


  const isDark = theme === 'dark'

  const refreshData = (): void => {
    setInvoices(DataService.getInvoices())
    setTasks(DataService.getTasks())
    setPurchases(DataService.getPurchases())
  }

  useEffect(() => {
    refreshData()
  }, [])

  // Date Strings
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const formattedToday = today.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  // ── 1. Real Financial Breakdown Calculations ──────────────────
  const taxInvoices = useMemo(() => invoices.filter((i) => i.type === 'TAX_INVOICE'), [invoices])
  const quotations = useMemo(() => invoices.filter((i) => i.type === 'QUOTATION'), [invoices])
  const estimates = useMemo(() => invoices.filter((i) => i.type === 'ESTIMATE'), [invoices])

  // Today's Sales & Quotes
  const todaysSales = useMemo(() => {
    return invoices
      .filter((i) => (i.date === todayStr || i.created_at === todayStr) && i.type === 'TAX_INVOICE')
      .reduce((sum, i) => sum + i.grand_total, 0)
  }, [invoices, todayStr])

  const todaysQuotes = useMemo(() => {
    return invoices
      .filter((i) => (i.date === todayStr || i.created_at === todayStr) && i.type === 'QUOTATION')
      .reduce((sum, i) => sum + i.grand_total, 0)
  }, [invoices, todayStr])

  // This Month's Sales & Quotes
  const thisMonthSales = useMemo(() => {
    return invoices
      .filter((i) => i.date?.startsWith(currentMonthKey) && i.type === 'TAX_INVOICE')
      .reduce((sum, i) => sum + i.grand_total, 0)
  }, [invoices, currentMonthKey])

  const thisMonthQuotes = useMemo(() => {
    return invoices
      .filter((i) => i.date?.startsWith(currentMonthKey) && i.type === 'QUOTATION')
      .reduce((sum, i) => sum + i.grand_total, 0)
  }, [invoices, currentMonthKey])

  // Aggregate Totals
  const totalTaxInvoiceAmount = useMemo(
    () => taxInvoices.reduce((sum, i) => sum + i.grand_total, 0),
    [taxInvoices]
  )
  const totalQuotationAmount = useMemo(
    () => quotations.reduce((sum, i) => sum + i.grand_total, 0),
    [quotations]
  )
  const totalOutstanding = useMemo(
    () => invoices.reduce((sum, i) => sum + i.balance_amount, 0),
    [invoices]
  )
  const totalPurchaseAmount = useMemo(
    () => purchases.reduce((sum, p) => sum + p.total_amount, 0),
    [purchases]
  )

  const pendingPaymentsCount = useMemo(
    () => invoices.filter((i) => i.status !== 'PAID' && i.balance_amount > 0).length,
    [invoices]
  )
  const todaysTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.due_date === todayStr ||
          t.start_date === todayStr ||
          t.status === 'PENDING' ||
          t.status === 'IN_PROGRESS'
      ),
    [tasks, todayStr]
  )

  // ── 2. Time-Series Data Generator for Recharts ────────────────
  const chartData = useMemo(() => {
    // Mode A: TODAY (Hourly/Time Slot Trend with fallback to recent active days)
    if (timeRange === 'TODAY') {
      const todayInvoices = invoices.filter(
        (i) => i.date === todayStr || i.created_at === todayStr
      )

      const slotsMap: Record<
        string,
        { monthKey: string; monthLabel: string; taxInvoices: number; quotations: number; purchases: number }
      > = {
        '09:00': { monthKey: '09:00', monthLabel: '09:00 AM', taxInvoices: 0, quotations: 0, purchases: 0 },
        '11:00': { monthKey: '11:00', monthLabel: '11:00 AM', taxInvoices: 0, quotations: 0, purchases: 0 },
        '13:00': { monthKey: '13:00', monthLabel: '01:00 PM', taxInvoices: 0, quotations: 0, purchases: 0 },
        '15:00': { monthKey: '15:00', monthLabel: '03:00 PM', taxInvoices: 0, quotations: 0, purchases: 0 },
        '17:00': { monthKey: '17:00', monthLabel: '05:00 PM', taxInvoices: 0, quotations: 0, purchases: 0 },
        '19:00': { monthKey: '19:00', monthLabel: '07:00 PM', taxInvoices: 0, quotations: 0, purchases: 0 }
      }

      if (todayInvoices.length > 0) {
        todayInvoices.forEach((inv, idx) => {
          const slotKeys = Object.keys(slotsMap)
          const slot = slotKeys[idx % slotKeys.length]
          if (inv.type === 'TAX_INVOICE') slotsMap[slot].taxInvoices += inv.grand_total
          else if (inv.type === 'QUOTATION') slotsMap[slot].quotations += inv.grand_total
        })

        purchases.forEach((pur) => {
          if (pur.date === todayStr || pur.created_at === todayStr) {
            slotsMap['13:00'].purchases += pur.total_amount
          }
        })
        return Object.values(slotsMap)
      }

      // Fallback: If no invoices recorded for today's date, show recent active days
      const recentDaysMap: Record<
        string,
        { monthKey: string; monthLabel: string; taxInvoices: number; quotations: number; purchases: number }
      > = {}

      const sortedInvoices = [...invoices].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      const activeDates = Array.from(new Set(sortedInvoices.map((i) => i.date).filter(Boolean))).slice(0, 6).reverse()

      activeDates.forEach((dStr) => {
        const parts = dStr.split('-')
        let label = dStr
        if (parts.length === 3) {
          const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
          label = isNaN(dObj.getTime()) ? dStr : dObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
        }
        recentDaysMap[dStr] = { monthKey: dStr, monthLabel: label, taxInvoices: 0, quotations: 0, purchases: 0 }
      })

      invoices.forEach((inv) => {
        if (inv.date && recentDaysMap[inv.date]) {
          if (inv.type === 'TAX_INVOICE') recentDaysMap[inv.date].taxInvoices += inv.grand_total
          else if (inv.type === 'QUOTATION') recentDaysMap[inv.date].quotations += inv.grand_total
        }
      })

      purchases.forEach((pur) => {
        if (pur.date && recentDaysMap[pur.date]) {
          recentDaysMap[pur.date].purchases += pur.total_amount
        }
      })

      if (Object.keys(recentDaysMap).length > 0) {
        return Object.values(recentDaysMap)
      }

      return Object.values(slotsMap)
    }

    // Mode B: 1M (This Month — Daily Breakdown for Current Month)
    if (timeRange === '1M') {
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
      const daysMap: Record<
        string,
        { monthKey: string; monthLabel: string; taxInvoices: number; quotations: number; purchases: number }
      > = {}

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0')
        const fullDateKey = `${currentMonthKey}-${dayStr}`
        const label = `${day} ${today.toLocaleDateString('en-IN', { month: 'short' })}`
        daysMap[fullDateKey] = {
          monthKey: fullDateKey,
          monthLabel: label,
          taxInvoices: 0,
          quotations: 0,
          purchases: 0
        }
      }

      invoices.forEach((inv) => {
        if (inv.date && daysMap[inv.date]) {
          if (inv.type === 'TAX_INVOICE') daysMap[inv.date].taxInvoices += inv.grand_total
          else if (inv.type === 'QUOTATION') daysMap[inv.date].quotations += inv.grand_total
        }
      })

      purchases.forEach((pur) => {
        if (pur.date && daysMap[pur.date]) {
          daysMap[pur.date].purchases += pur.total_amount
        }
      })

      const allDays = Object.values(daysMap)
      const activeDays = allDays.filter((d) => d.taxInvoices > 0 || d.quotations > 0 || d.purchases > 0)
      if (activeDays.length > 0) return activeDays
      return allDays
    }

    // Mode C: 6M or FY (Monthly Breakdown across database records)
    const monthsMap: Record<
      string,
      { monthKey: string; monthLabel: string; taxInvoices: number; quotations: number; purchases: number }
    > = {}

    // First scan all existing invoices & purchases to capture all active months
    invoices.forEach((inv) => {
      if (!inv.date) return
      const parts = inv.date.split('-')
      if (parts.length >= 2) {
        const key = `${parts[0]}-${parts[1]}`
        if (!monthsMap[key]) {
          const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, 1)
          const label = isNaN(dObj.getTime())
            ? key
            : dObj.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
          monthsMap[key] = { monthKey: key, monthLabel: label, taxInvoices: 0, quotations: 0, purchases: 0 }
        }
      }
    })

    const monthsCount = timeRange === '6M' ? 6 : 12
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthsMap[key]) {
        const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
        monthsMap[key] = {
          monthKey: key,
          monthLabel: label,
          taxInvoices: 0,
          quotations: 0,
          purchases: 0
        }
      }
    }

    invoices.forEach((inv) => {
      if (!inv.date) return
      const [y, m] = inv.date.split('-')
      const key = `${y}-${m}`
      if (monthsMap[key]) {
        if (inv.type === 'TAX_INVOICE') {
          monthsMap[key].taxInvoices += inv.grand_total
        } else if (inv.type === 'QUOTATION') {
          monthsMap[key].quotations += inv.grand_total
        }
      }
    })

    purchases.forEach((pur) => {
      if (!pur.date) return
      const [y, m] = pur.date.split('-')
      const key = `${y}-${m}`
      if (monthsMap[key]) {
        monthsMap[key].purchases += pur.total_amount
      }
    })

    return Object.values(monthsMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey))

  }, [invoices, purchases, timeRange, today, todayStr, currentMonthKey])

  // ── 3. Document Status Donut Chart Data ───────────────────────
  const statusDonutData = useMemo(() => {
    const paidCount = invoices.filter((i) => i.status === 'PAID').length
    const partialCount = invoices.filter((i) => i.status === 'PARTIALLY_PAID').length
    const unpaidCount = invoices.filter((i) => i.status === 'UNPAID').length

    return [
      { name: 'Paid Bills', value: paidCount || 0, color: '#10b981' },
      { name: 'Partial Bills', value: partialCount || 0, color: '#f59e0b' },
      { name: 'Unpaid Dues', value: unpaidCount || 0, color: '#ef4444' }
    ]
  }, [invoices])

  // ── 4. Top Product Categories Breakdown from BAK Database Invoices ──
  const categoryBreakdown = useMemo(() => {
    const catTotals: Record<string, number> = {
      'Star Flex & Banners': 0,
      'Vinyl & Stickers': 0,
      'Glow Signboard & Acrylic': 0,
      'Visiting Cards & Stationeries': 0,
      'Brochures, Catalogues & Pamphlets': 0,
      'Display Standees & Canopies': 0,
      'General Printing Services': 0
    }

    invoices.forEach((inv) => {
      inv.items?.forEach((item) => {
        const desc = (item.description || '').toLowerCase()
        const amt = item.amount || 0

        if (desc.includes('flex') || desc.includes('banner') || desc.includes('hoarding')) {
          catTotals['Star Flex & Banners'] += amt
        } else if (desc.includes('vinyl') || desc.includes('sticker') || desc.includes('label') || desc.includes('one way')) {
          catTotals['Vinyl & Stickers'] += amt
        } else if (desc.includes('acrylic') || desc.includes('glow') || desc.includes('led') || desc.includes('board') || desc.includes('sign')) {
          catTotals['Glow Signboard & Acrylic'] += amt
        } else if (desc.includes('card') || desc.includes('visiting') || desc.includes('letterhead') || desc.includes('envelope') || desc.includes('bill book')) {
          catTotals['Visiting Cards & Stationeries'] += amt
        } else if (desc.includes('standee') || desc.includes('canopy') || desc.includes('display')) {
          catTotals['Display Standees & Canopies'] += amt
        } else if (desc.includes('brochure') || desc.includes('catalog') || desc.includes('book') || desc.includes('pamphlet') || desc.includes('leaflet')) {
          catTotals['Brochures, Catalogues & Pamphlets'] += amt
        } else {
          catTotals['General Printing Services'] += amt
        }
      })
    })

    const grand = Object.values(catTotals).reduce((a, b) => a + b, 0) || 1

    return Object.entries(catTotals)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: Math.min(100, Math.round((amount / grand) * 100))
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [invoices])


  // ── 5. Search & Filtered Invoices Table Data ───────────────────
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchType = filterType === 'ALL' || inv.type === filterType
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.customer_name.toLowerCase().includes(q) ||
        inv.customer_mobile.includes(q) ||
        inv.grand_total.toString().includes(q)

      return matchType && matchSearch
    })
  }, [invoices, filterType, searchQuery])

  // Recharts Custom Glass Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any): React.JSX.Element | null => {
    if (active && payload && payload.length) {
      return (
        <div className="vpm-recharts-tooltip">
          {label && (
            <>
              <p className="vpm-tooltip-label">{label}</p>
              <div className="vpm-tooltip-divider" />
            </>
          )}
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="vpm-tooltip-item">
              <span className="vpm-tooltip-dot" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="vpm-tooltip-name">{entry.name}:</span>
              <span className="vpm-tooltip-val">
                {typeof entry.value === 'number' && entry.value > 100
                  ? `₹${entry.value.toLocaleString('en-IN')}`
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={`vpm-dashboard-overview ${isDark ? 'theme-dark' : 'theme-light'}`}>
      {/* ── 1. Top Hero Command Banner ─────────────────────────── */}
      <div className="vpm-dashboard-hero mb-4">
        <div className="vpm-hero-content d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <div className="vpm-hero-badge">
                <span className="vpm-pulse-dot"></span>
                <span>OFFLINE LAN SYSTEM • ONLINE</span>
              </div>
              <span className="vpm-hero-subtitle d-flex align-items-center gap-1 ms-1">
                <Calendar size={13} /> {formattedToday}
              </span>
              <Button
                variant="link"
                className="p-0 ms-2 text-white-50 text-decoration-none small d-inline-flex align-items-center gap-1 vpm-refresh-link"
                onClick={refreshData}
                title="Refresh Live Data"
              >
                <RefreshCw size={12} /> Sync Data
              </Button>
            </div>
            <div className="d-flex align-items-center gap-3 mt-1 mb-1">
              <img
                src={viralLogo}
                alt="Viral Print Media"
                style={{ height: '46px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
              />
              <div>
                <h2 className="vpm-hero-title my-0">Business Performance Dashboard</h2>
                <p className="vpm-hero-subtitle m-0">
                  {isAdmin ? 'System Admin Diagnostics & Financial Command Center' : 'Sales & Operations Performance Dashboard'}
                </p>

              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-2 mt-md-0">
            <Button className="vpm-hero-btn-primary" onClick={() => onNavigate('invoice')}>
              <Receipt size={17} /> Create Tax Invoice
            </Button>
            <Button className="vpm-hero-btn-accent" onClick={() => onNavigate('quotation')}>
              <FileText size={17} /> Create Quotation
            </Button>
            <Button className="vpm-hero-btn-glass" onClick={() => onNavigate('backup')}>
              <HardDrive size={17} /> Backup Data
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. Key Metrics Stat Cards (Row of 5 Pro Cards) ────────── */}
      <Row className="g-3 mb-4">
        {/* Card 1: Today's Revenue & Quotes */}
        <Col xs={12} sm={6} lg={2} className="vpm-col-custom-5">
          <div className="vpm-god-card emerald">
            <div className="vpm-god-card-top">
              <span className="vpm-god-card-title">Today's Sales</span>
              <div className="vpm-god-icon-box">
                <Zap size={19} />
              </div>
            </div>
            <div>
              <div className="vpm-god-card-value">₹{todaysSales.toLocaleString('en-IN')}</div>
              <div className="vpm-god-card-footer">
                <span>Quotes Today: ₹{todaysQuotes.toLocaleString('en-IN')}</span>
                <span className="vpm-trend-badge green">
                  <Activity size={10} /> Live
                </span>
              </div>
            </div>
          </div>
        </Col>

        {/* Card 2: This Month's Turnover */}
        <Col xs={12} sm={6} lg={2} className="vpm-col-custom-5">
          <div className="vpm-god-card cyan">
            <div className="vpm-god-card-top">
              <span className="vpm-god-card-title">This Month Sales</span>
              <div className="vpm-god-icon-box">
                <Calendar size={19} />
              </div>
            </div>
            <div>
              <div className="vpm-god-card-value">₹{thisMonthSales.toLocaleString('en-IN')}</div>
              <div className="vpm-god-card-footer">
                <span>Quotes: ₹{thisMonthQuotes.toLocaleString('en-IN')}</span>
                <span className="vpm-trend-badge blue">Monthly</span>
              </div>
            </div>
          </div>
        </Col>

        {/* Card 3: Total Tax Invoices Value */}
        <Col xs={12} sm={6} lg={2} className="vpm-col-custom-5">
          <div className="vpm-god-card indigo">
            <div className="vpm-god-card-top">
              <span className="vpm-god-card-title">Tax Invoices Total</span>
              <div className="vpm-god-icon-box">
                <Receipt size={19} />
              </div>
            </div>
            <div>
              <div className="vpm-god-card-value">₹{totalTaxInvoiceAmount.toLocaleString('en-IN')}</div>
              <div className="vpm-god-card-footer">
                <span>Quotes Total: ₹{totalQuotationAmount.toLocaleString('en-IN')}</span>
                <span className="vpm-trend-badge purple">{taxInvoices.length} Invoices</span>
              </div>
            </div>
          </div>
        </Col>

        {/* Card 4: Outstanding Collection */}
        <Col xs={12} sm={6} lg={2} className="vpm-col-custom-5">
          <div className="vpm-god-card rose">
            <div className="vpm-god-card-top">
              <span className="vpm-god-card-title">Outstanding Amount</span>
              <div className="vpm-god-icon-box">
                <AlertCircle size={19} />
              </div>
            </div>
            <div>
              <div className="vpm-god-card-value">₹{totalOutstanding.toLocaleString('en-IN')}</div>
              <div className="vpm-god-card-footer">
                <span>Pending Collectables</span>
                <span className="vpm-trend-badge red">{pendingPaymentsCount} Unpaid</span>
              </div>
            </div>
          </div>
        </Col>

        {/* Card 5: Purchase Expense */}
        <Col xs={12} sm={6} lg={2} className="vpm-col-custom-5">
          <div className="vpm-god-card amber">
            <div className="vpm-god-card-top">
              <span className="vpm-god-card-title">Stock Purchases</span>
              <div className="vpm-god-icon-box">
                <ShoppingCart size={19} />
              </div>
            </div>
            <div>
              <div className="vpm-god-card-value">₹{totalPurchaseAmount.toLocaleString('en-IN')}</div>
              <div className="vpm-god-card-footer">
                <span>Raw Materials</span>
                <span className="vpm-trend-badge orange">{purchases.length} Orders</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── 3. Pro Level Interactive Charts Grid ───────────────── */}
      <Row className="g-4 mb-4">
        {/* Left 8 Cols: Recharts Financial Trend Chart */}
        <Col lg={8}>
          <div className="vpm-chart-card">
            <div className="vpm-chart-header flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 mb-3">
              <div className="d-flex align-items-center gap-3">
                <div className="vpm-chart-icon-box flex-shrink-0">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h6 className="vpm-chart-title m-0">Tax Invoice & Quotation Revenue Analytics</h6>
                  <p className="vpm-chart-subtitle m-0 mt-1">
                    Real-time financial performance & quotation comparison over time
                  </p>
                </div>
              </div>

              {/* Chart Controls - Ultra Clean Alignment */}
              <div className="d-flex flex-wrap align-items-center gap-2 ms-lg-auto">
                {/* Time Range Selector (Admin gets full range; Non-admin restricted to Today only) */}
                <div className="vpm-pill-toggle">
                  <button
                    className={`vpm-pill-btn ${timeRange === 'TODAY' ? 'active' : ''}`}
                    onClick={() => setTimeRange('TODAY')}
                  >
                    Today
                  </button>
                  <button
                    className={`vpm-pill-btn ${timeRange === '1M' ? 'active' : ''}`}
                    onClick={() => setTimeRange('1M')}
                  >
                    This Month
                  </button>
                  <button
                    className={`vpm-pill-btn ${timeRange === '6M' ? 'active' : ''}`}
                    onClick={() => setTimeRange('6M')}
                  >
                    6 Months
                  </button>
                  <button
                    className={`vpm-pill-btn ${timeRange === 'FY' ? 'active' : ''}`}
                    onClick={() => setTimeRange('FY')}
                  >
                    FY 2026-27
                  </button>
                </div>


                {/* Chart Type Toggle */}
                <div className="vpm-pill-toggle">
                  <button
                    className={`vpm-pill-btn ${chartViewMode === 'AREA' ? 'active' : ''}`}
                    onClick={() => setChartViewMode('AREA')}
                  >
                    Area Curve
                  </button>
                  <button
                    className={`vpm-pill-btn ${chartViewMode === 'BAR' ? 'active' : ''}`}
                    onClick={() => setChartViewMode('BAR')}
                  >
                    Bar Comparison
                  </button>
                </div>
              </div>
            </div>

            {/* Main Recharts Graphic Container */}
            <div className="vpm-recharts-container position-relative" style={{ width: '100%', height: 330 }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartViewMode === 'AREA' ? (
                  <AreaChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTaxInvoice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorQuotation" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                    <XAxis
                      dataKey="monthLabel"
                      stroke={isDark ? '#94a3b8' : '#64748b'}
                      fontSize={11}
                      tickLine={false}
                      dy={5}
                      minTickGap={20}
                    />
                    <YAxis
                      stroke={isDark ? '#94a3b8' : '#64748b'}
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val > 999 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="taxInvoices"
                      name="Tax Invoices (₹)"
                      stroke="#10b981"
                      strokeWidth={3.5}
                      fillOpacity={1}
                      fill="url(#colorTaxInvoice)"
                      dot={false}
                      activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 3, fill: '#ffffff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="quotations"
                      name="Quotations (₹)"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorQuotation)"
                      dot={false}
                      activeDot={{ r: 7, stroke: '#06b6d4', strokeWidth: 3, fill: '#ffffff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="purchases"
                      name="Stock Purchases (₹)"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorPurchases)"
                      dot={false}
                      activeDot={{ r: 7, stroke: '#8b5cf6', strokeWidth: 3, fill: '#ffffff' }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 0 }} barGap={4} barCategoryGap="15%">
                    <defs>
                      <linearGradient id="barTaxInvoice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="barQuotation" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                      <linearGradient id="barPurchases" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#6d28d9" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                    <XAxis
                      dataKey="monthLabel"
                      stroke={isDark ? '#94a3b8' : '#64748b'}
                      fontSize={11}
                      tickLine={false}
                      dy={5}
                      minTickGap={20}
                    />
                    <YAxis
                      stroke={isDark ? '#94a3b8' : '#64748b'}
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val > 999 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="taxInvoices" name="Tax Invoices (₹)" fill="url(#barTaxInvoice)" radius={[8, 8, 0, 0]} barSize={24} />
                    <Bar dataKey="quotations" name="Quotations (₹)" fill="url(#barQuotation)" radius={[8, 8, 0, 0]} barSize={24} />
                    <Bar dataKey="purchases" name="Stock Purchases (₹)" fill="url(#barPurchases)" radius={[8, 8, 0, 0]} barSize={24} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Custom Interactive Legend Footer */}
            <div className="vpm-chart-legend mt-3 d-flex flex-wrap align-items-center justify-content-center gap-4">
              <div className="vpm-legend-item">
                <span className="vpm-legend-indicator" style={{ background: 'linear-gradient(90deg, #34d399, #059669)' }} />
                <span>Tax Invoices Revenue (Real Sales)</span>
              </div>
              <div className="vpm-legend-item">
                <span className="vpm-legend-indicator" style={{ background: 'linear-gradient(90deg, #38bdf8, #0284c7)' }} />
                <span>Quotations Issued (Potential)</span>
              </div>
              <div className="vpm-legend-item">
                <span className="vpm-legend-indicator" style={{ background: 'linear-gradient(90deg, #a78bfa, #6d28d9)' }} />
                <span>Stock Purchases (Material Expense)</span>
              </div>
            </div>
          </div>
        </Col>

        {/* Right 4 Cols: Status Donut & Category Leaders */}
        <Col lg={4}>
          <div className="d-flex flex-column gap-3 h-100">
            {/* Donut Status Visualizer Card */}
            <div className="vpm-chart-card p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="vpm-chart-title m-0 d-flex align-items-center gap-2">
                  <PieIcon size={17} className="text-primary" /> Invoice & Quote Status
                </h6>
                <span className="badge vpm-total-docs-badge">
                  {invoices.length} Total Docs
                </span>
              </div>

              <div className="d-flex align-items-center justify-content-center position-relative" style={{ height: 175 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={74}
                      paddingAngle={6}
                      dataKey="value"
                    >
                      {statusDonutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="vpm-donut-center-badge text-center position-absolute">
                  <div className="vpm-donut-count">{invoices.length}</div>
                  <div className="vpm-donut-subtext">Records</div>
                </div>
              </div>

              <div className="d-flex justify-content-around text-center pt-2 border-top border-secondary-subtle">
                {statusDonutData.map((item, idx) => (
                  <div key={idx} className="vpm-donut-stat-tile">
                    <span className="vpm-stat-num" style={{ color: item.color }}>
                      {item.value}
                    </span>
                    <span className="vpm-stat-label">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Category Leaders Progress Bars */}
            <div className="vpm-chart-card p-3 flex-grow-1">
              <h6 className="vpm-chart-title mb-3 d-flex align-items-center gap-2">
                <Layers size={17} className="text-warning" /> Top Print Revenue Leaders
              </h6>
              <div className="d-flex flex-column gap-3">
                {categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="vpm-cat-progress-item">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <span className="small fw-bold">{cat.name}</span>
                        <span className="vpm-pct-badge">{cat.percentage}%</span>
                      </div>
                      <span className="vpm-cat-amount">₹{cat.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="progress vpm-custom-progress" style={{ height: '7px' }}>
                      <div
                        className={`progress-bar vpm-cat-bar-${idx}`}
                        role="progressbar"
                        style={{ width: `${Math.max(6, cat.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── 4. Main Documents Command Grid ─────────────────────── */}
      <Row className="g-4">
        {/* Left Column (8 cols): Recent Invoices & Quotations Table */}
        <Col lg={8}>
          <div className="vpm-table-panel">
            <div className="vpm-table-header flex-column flex-md-row gap-3">
              <div className="vpm-table-header-title">
                <div className="vpm-table-icon-badge">
                  <Receipt size={18} />
                </div>
                <div>
                  <h6>Real Tax Invoices & Quotation Records</h6>
                  <p className="small text-muted m-0" style={{ fontSize: '0.75rem' }}>
                    Showing {filteredInvoices.length} matched billing items
                  </p>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap w-100 w-md-auto justify-content-between justify-content-md-end">
                {/* Search Bar */}
                <div className="vpm-search-input-wrap">
                  <Search size={14} className="vpm-search-icon" />
                  <Form.Control
                    type="text"
                    placeholder="Search invoice #, customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="vpm-search-input"
                  />
                </div>

                {/* Filter Pills */}
                <div className="vpm-filter-pill-group">
                  <button
                    className={`vpm-filter-pill ${filterType === 'ALL' ? 'active' : ''}`}
                    onClick={() => setFilterType('ALL')}
                  >
                    All ({invoices.length})
                  </button>
                  <button
                    className={`vpm-filter-pill ${filterType === 'TAX_INVOICE' ? 'active' : ''}`}
                    onClick={() => setFilterType('TAX_INVOICE')}
                  >
                    Tax Invoices ({taxInvoices.length})
                  </button>
                  <button
                    className={`vpm-filter-pill ${filterType === 'QUOTATION' ? 'active' : ''}`}
                    onClick={() => setFilterType('QUOTATION')}
                  >
                    Quotations ({quotations.length})
                  </button>
                  <button
                    className={`vpm-filter-pill ${filterType === 'ESTIMATE' ? 'active' : ''}`}
                    onClick={() => setFilterType('ESTIMATE')}
                  >
                    Estimates ({estimates.length})
                  </button>
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="vpm-god-table">
                <thead>
                  <tr>
                    <th style={{ whiteSpace: 'nowrap' }}>Invoice / Document #</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Customer Name</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Document Type</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Date</th>
                    <th className="text-end" style={{ whiteSpace: 'nowrap' }}>Grand Total</th>
                    <th className="text-center" style={{ whiteSpace: 'nowrap' }}>Status</th>
                    <th className="text-center" style={{ whiteSpace: 'nowrap' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        No records match the current filter or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.slice(0, 8).map((inv) => (
                      <tr key={inv.id}>
                        <td className="vpm-inv-num" style={{ whiteSpace: 'nowrap' }}>
                          <span className="vpm-inv-code">{inv.invoice_number}</span>
                        </td>
                        <td className="vpm-customer-name">
                          <div className="fw-bold text-truncate" style={{ maxWidth: '180px' }}>
                            {inv.customer_name}
                          </div>
                          {inv.customer_mobile && (
                            <span className="vpm-customer-phone">
                              📱 {inv.customer_mobile}
                            </span>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span
                            className={`vpm-type-badge ${
                              inv.type === 'TAX_INVOICE'
                                ? 'tax'
                                : inv.type === 'QUOTATION'
                                ? 'quote'
                                : 'est'
                            }`}
                          >
                            {inv.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className="vpm-date-pill">{inv.date}</span>
                        </td>
                        <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                          <span className="vpm-amount-badge">
                            ₹{inv.grand_total.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                          <span
                            className={`vpm-status-pill ${
                              inv.status === 'PAID'
                                ? 'paid'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'partial'
                                : 'unpaid'
                            }`}
                          >
                            <span className="vpm-status-dot" />
                            {inv.status}
                          </span>
                        </td>
                        <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                          <button
                            className="vpm-table-action-btn"
                            onClick={() =>
                              onNavigate(
                                inv.type === 'TAX_INVOICE'
                                  ? 'invoice'
                                  : inv.type === 'QUOTATION'
                                  ? 'quotation'
                                  : 'estimate'
                              )
                            }
                            title="View Document"
                          >
                            <Eye size={13} /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredInvoices.length > 8 && (
              <div className="text-center py-2 border-top border-secondary-subtle">
                <Button
                  variant="link"
                  className="text-decoration-none fw-bold text-primary small"
                  onClick={() => onNavigate('invoice')}
                >
                  View All {filteredInvoices.length} Documents <ArrowRight size={14} />
                </Button>
              </div>
            )}
          </div>
        </Col>

        {/* Right Column (4 cols): Command Widgets */}
        <Col lg={4}>
          <div className="d-flex flex-column gap-3">
            {/* Quick Actions Shortcuts */}
            <div className="vpm-widget-card">
              <div className="vpm-widget-header mb-3">
                <h6 className="vpm-widget-title">
                  <Zap size={18} className="text-primary" /> Quick Operations
                </h6>
              </div>
              <div className="vpm-quick-grid">
                <div className="vpm-quick-tile" onClick={() => onNavigate('invoice')}>
                  <div className="vpm-quick-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                    <Receipt size={18} />
                  </div>
                  <span className="vpm-quick-tile-text">New Invoice</span>
                </div>
                <div className="vpm-quick-tile" onClick={() => onNavigate('quotation')}>
                  <div className="vpm-quick-icon" style={{ background: 'rgba(6,182,212,0.12)', color: '#0891b2' }}>
                    <PlusCircle size={18} />
                  </div>
                  <span className="vpm-quick-tile-text">New Quote</span>
                </div>
                <div className="vpm-quick-tile" onClick={() => onNavigate('eway_bill')}>
                  <div className="vpm-quick-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                    <Truck size={18} />
                  </div>
                  <span className="vpm-quick-tile-text">E-Way Bill</span>
                </div>
                <div className="vpm-quick-tile" onClick={() => onNavigate('customers')}>
                  <div className="vpm-quick-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                    <Users size={18} />
                  </div>
                  <span className="vpm-quick-tile-text">Add Customer</span>
                </div>
                <div className="vpm-quick-tile" onClick={() => onNavigate('gst_reports')}>
                  <div className="vpm-quick-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                    <PieIcon size={18} />
                  </div>
                  <span className="vpm-quick-tile-text">GST Summary</span>
                </div>
                <div className="vpm-quick-tile" onClick={() => onNavigate('payments')}>
                  <div className="vpm-quick-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                    <DollarSign size={18} />
                  </div>
                  <span className="vpm-quick-tile-text">Record Payment</span>
                </div>
              </div>
            </div>

            {/* Today's Tasks Widget */}
            <div className="vpm-widget-card">
              <div className="vpm-widget-header">
                <h6 className="vpm-widget-title">
                  <CheckSquare size={18} className="text-warning" /> Operational Tasks ({todaysTasks.length})
                </h6>
                <Button
                  variant="link"
                  className="p-0 text-decoration-none fw-bold text-primary small"
                  onClick={() => onNavigate('tasks')}
                >
                  Manage
                </Button>
              </div>

              {todaysTasks.length === 0 ? (
                <p className="text-muted small m-0 py-2">No pending operations tasks scheduled.</p>
              ) : (
                <div className="d-flex flex-column gap-2 mt-2">
                  {todaysTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`vpm-task-item-pro ${
                        task.priority === 'URGENT'
                          ? 'urgent'
                          : task.priority === 'HIGH'
                          ? 'high'
                          : ''
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="fw-bold small" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                          {task.title}
                        </span>
                        <span
                          className={`badge ${
                            task.priority === 'URGENT' || task.priority === 'HIGH'
                              ? 'bg-danger'
                              : 'bg-secondary'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="small text-muted" style={{ fontSize: '0.74rem' }}>
                          👤 {task.assigned_to || 'Unassigned'}
                        </span>
                        <span className="small text-muted" style={{ fontSize: '0.72rem' }}>
                          📅 {task.due_date || task.start_date || 'Today'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Payment Action Alert Card */}
            <div className="vpm-payment-alert-card">
              <div className="d-flex align-items-center gap-2 mb-2">
                <AlertCircle size={20} className="text-danger" />
                <h6 className="fw-bold m-0 text-danger" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Pending Payment Action
                </h6>
              </div>
              <p className="small text-muted mb-3" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
                You have <strong>{pendingPaymentsCount}</strong> unpaid or partially paid bills totaling{' '}
                <strong className="text-danger fs-6">₹{totalOutstanding.toLocaleString('en-IN')}</strong>.
              </p>
              <Button className="vpm-payment-alert-btn" onClick={() => onNavigate('payments')}>
                Collect Pending Payments <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardOverview

