import React, { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Tag,
  CreditCard,
  UserCheck,
  ShoppingCart,
  Package,
  FileSpreadsheet,
  CheckSquare,
  Users,
  Truck,
  HardDrive
} from 'lucide-react'
import viralLogo from '../../assets/logo_viral.png'
import type { ActiveTabType } from './AppLayout'
import { useAuth } from '../../context/AuthContext'
import './Sidebar.css'

interface SidebarProps {
  theme: 'dark' | 'light'
  activeTab: ActiveTabType
  onTabChange: (tab: ActiveTabType) => void
  mode: 'open' | 'compact' | 'hidden'
}

const Sidebar: React.FC<SidebarProps> = ({ theme, activeTab, onTabChange, mode }) => {
  const { user } = useAuth()
  const [rosterVersion, setRosterVersion] = useState<number>(0)

  useEffect(() => {
    const handleUpdate = () => setRosterVersion((v) => v + 1)
    window.addEventListener('vpm_roster_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('vpm_roster_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const checkPermission = useCallback(
    (moduleKey: ActiveTabType): boolean => {
      if (!user) return true

      const roleName = (user.role?.name || user.role || '').toString().toUpperCase()
      // Admin always has full view access to all modules
      if (roleName === 'ADMIN' || user.username?.toLowerCase() === 'admin') {
        return true
      }

      // Check saved user permissions in localStorage roster
      try {
        const rosterData = localStorage.getItem('vpm_users_roster')
        if (rosterData) {
          const roster = JSON.parse(rosterData)
          if (Array.isArray(roster)) {
            const match = roster.find(
              (u) =>
                u.username?.toLowerCase() === user.username?.toLowerCase() ||
                u.id === user.id
            )
            if (match && match.permissions) {
              const p = match.permissions[moduleKey]
              if (p !== undefined) {
                return Boolean(p.view)
              }
            }
          }
        }
      } catch (e) {
        console.warn('Error checking roster permission:', e)
      }

      // Default role fallback
      if (roleName === 'MANAGER') return true
      if (roleName === 'DESIGNER') return ['dashboard', 'quotation', 'estimate', 'tasks', 'products', 'customers'].includes(moduleKey)
      if (roleName === 'OPERATOR') return ['dashboard', 'estimate', 'tasks', 'products'].includes(moduleKey)
      if (roleName === 'SALES_BILLING' || roleName === 'SALES') return ['dashboard', 'invoice', 'quotation', 'estimate', 'payments', 'customers', 'products', 'tasks'].includes(moduleKey)

      return true
    },
    [user, rosterVersion]
  )

  // Automatic fallback: if current activeTab is not allowed, switch to first allowed tab
  useEffect(() => {
    if (!checkPermission(activeTab)) {
      const tabs: ActiveTabType[] = [
        'dashboard',
        'invoice',
        'quotation',
        'estimate',
        'eway_bill',
        'payments',
        'customers',
        'purchases',
        'products',
        'gst_reports',
        'tasks',
        'users',
        'backup'
      ]
      const firstAllowed = tabs.find((t) => checkPermission(t))
      if (firstAllowed) {
        onTabChange(firstAllowed)
      }
    }
  }, [activeTab, checkPermission, onTabChange])

  const themeClass = `theme-${theme}`

  if (mode === 'hidden') return null

  // Check section visibility
  const showBillingSection =
    checkPermission('invoice') ||
    checkPermission('quotation') ||
    checkPermission('estimate') ||
    checkPermission('eway_bill') ||
    checkPermission('payments')

  const showCommercialSection =
    checkPermission('customers') ||
    checkPermission('purchases') ||
    checkPermission('products')

  const showReportsSection =
    checkPermission('gst_reports') ||
    checkPermission('tasks') ||
    checkPermission('users') ||
    checkPermission('backup')

  return (
    <aside className={`vpm-sidebar ${themeClass} ${mode === 'compact' ? 'sidebar-compact' : ''}`}>
      {/* ── Brand ──────────────────────────────────────────── */}
      <div className="vpm-sidebar-brand">
        {mode === 'open' ? (
          <img
            src={viralLogo}
            alt="Viral Print Media Management"
            className="vpm-brand-full-logo"
          />
        ) : (
          <div className="vpm-sidebar-logo" style={{ background: 'transparent', boxShadow: 'none' }}>
            <img src={viralLogo} alt="Viral Print" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          </div>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="vpm-sidebar-nav">
        {/* Dashboard */}
        {checkPermission('dashboard') && (
          <button
            className={`vpm-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onTabChange('dashboard')}
            title="Dashboard"
          >
            <span className="vpm-nav-icon">
              <LayoutDashboard size={18} />
            </span>
            {mode === 'open' && <span className="vpm-nav-label">Dashboard</span>}
          </button>
        )}

        {/* Section: Billing & Payments */}
        {mode === 'open' && showBillingSection && (
          <span className="vpm-nav-section-label" style={{ marginTop: 10 }}>Billing &amp; Payments</span>
        )}

        {checkPermission('invoice') && (
          <button
            className={`vpm-nav-item ${activeTab === 'invoice' ? 'active' : ''}`}
            onClick={() => onTabChange('invoice')}
            title="Tax Invoice (GST)"
          >
            <span className="vpm-nav-icon">
              <Receipt size={18} />
            </span>
            {mode === 'open' && <span className="vpm-nav-label">Tax Invoice (GST)</span>}
          </button>
        )}

        {checkPermission('quotation') && (
          <button
            className={`vpm-nav-item ${activeTab === 'quotation' ? 'active' : ''}`}
            onClick={() => onTabChange('quotation')}
            title="Quotation"
          >
            <span className="vpm-nav-icon">
              <FileText size={18} />
            </span>
            {mode === 'open' && <span className="vpm-nav-label">Quotation</span>}
          </button>
        )}

        {checkPermission('estimate') && (
          <button
            className={`vpm-nav-item ${activeTab === 'estimate' ? 'active' : ''}`}
            onClick={() => onTabChange('estimate')}
            title="Estimate Bill (Non-GST)"
          >
            <span className="vpm-nav-icon">
              <Tag size={18} />
            </span>
            {mode === 'open' && <span className="vpm-nav-label">Estimate Bill</span>}
          </button>
        )}

        {checkPermission('eway_bill') && (
          <button
            className={`vpm-nav-item ${activeTab === 'eway_bill' ? 'active' : ''}`}
            onClick={() => onTabChange('eway_bill')}
            title="E-Way Bill Management & NIC Govt Export"
          >
            <span className="vpm-nav-icon">
              <Truck size={18} />
            </span>
            {mode === 'open' && <span className="vpm-nav-label">E-Way Bills</span>}
          </button>
        )}

        {checkPermission('payments') && (
          <button
            className={`vpm-nav-item ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => onTabChange('payments')}
            title="Payment Entry & Ledger"
          >
            <span className="vpm-nav-icon">
              <CreditCard size={18} />
            </span>
            {mode === 'open' && <span className="vpm-nav-label">Payment Entry</span>}
          </button>
        )}

        {/* Section: Commercial & Stock */}
        {mode === 'open' && showCommercialSection && (
          <span className="vpm-nav-section-label" style={{ marginTop: 10 }}>Commercial &amp; Stock</span>
        )}

        {checkPermission('customers') && (
          <button
            className={`vpm-nav-item ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => onTabChange('customers')}
            title="Customer Management"
          >
            <span className="vpm-nav-icon">
              <UserCheck size={18} />
            </span>
            {mode === 'open' && <span className="vpm-nav-label">Customers</span>}
          </button>
        )}

        {checkPermission('purchases') && (
          <button
            className={`vpm-nav-item ${activeTab === 'purchases' ? 'active' : ''}`}
            onClick={() => onTabChange('purchases')}
            title="Purchase Management"
          >
            <span className="vpm-nav-icon">
              <ShoppingCart size={18} />
            </span>
            {mode === 'open' && <span className="vpm-nav-label">Purchases</span>}
          </button>
        )}

        {checkPermission('products') && (
          <button
            className={`vpm-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => onTabChange('products')}
            title="Products & Services"
          >
            <span className="vpm-nav-icon">
              <Package size={18} />
            </span>
            {mode === 'open' && <span className="vpm-nav-label">Products &amp; Rates</span>}
          </button>
        )}

        {/* Section: Reports & Admin */}
        {mode === 'open' && showReportsSection && (
          <span className="vpm-nav-section-label" style={{ marginTop: 10 }}>Reports &amp; Admin</span>
        )}

        {checkPermission('gst_reports') && (
          <button
            className={`vpm-nav-item ${activeTab === 'gst_reports' ? 'active' : ''}`}
            onClick={() => onTabChange('gst_reports')}
            title="GST Ledger & CA Summary"
          >
            <span className="vpm-nav-icon">
              <FileSpreadsheet size={18} />
            </span>
            {mode === 'open' && <span className="vpm-nav-label">GST CA Reports</span>}
          </button>
        )}

        {checkPermission('tasks') && (
          <button
            className={`vpm-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => onTabChange('tasks')}
            title="Tasks & Calendar"
          >
            <span className="vpm-nav-icon">
              <CheckSquare size={18} />
            </span>
            {mode === 'open' && <span className="vpm-nav-label">Tasks &amp; To-Do</span>}
          </button>
        )}

        {checkPermission('users') && (
          <button
            className={`vpm-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => onTabChange('users')}
            title="Users & Roles"
          >
            <span className="vpm-nav-icon">
              <Users size={18} />
            </span>
            {mode === 'open' && <span className="vpm-nav-label">Users &amp; Security</span>}
          </button>
        )}

        {checkPermission('backup') && (
          <button
            className={`vpm-nav-item ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => onTabChange('backup')}
            title="Drive Backup & Restore"
          >
            <span className="vpm-nav-icon">
              <HardDrive size={18} />
            </span>
            {mode === 'open' && <span className="vpm-nav-label">Drive Backup &amp; Restore</span>}
          </button>
        )}
      </nav>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="vpm-sidebar-footer">
        {mode === 'open' ? (
          <div className="vpm-server-status">
            <div className="vpm-server-dot" />
            <span className="vpm-server-text">Shop Server Active</span>
          </div>
        ) : (
          <div className="vpm-server-status" style={{ padding: '9px', justifyContent: 'center' }}>
            <div className="vpm-server-dot" title="Shop Server Active" />
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
