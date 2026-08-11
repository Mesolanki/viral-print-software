import type React from 'react'
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
  History,
  HardDrive
} from 'lucide-react'
import viralLogo from '../../assets/logo_viral.png'
import type { ActiveTabType } from './AppLayout'
import './Sidebar.css'

interface SidebarProps {
  theme: 'dark' | 'light'
  activeTab: ActiveTabType
  onTabChange: (tab: ActiveTabType) => void
  mode: 'open' | 'compact' | 'hidden'
}

const Sidebar: React.FC<SidebarProps> = ({ theme, activeTab, onTabChange, mode }) => {
  const themeClass = `theme-${theme}`

  if (mode === 'hidden') return null

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

        {mode === 'open' && (
          <span className="vpm-nav-section-label" style={{ marginTop: 10 }}>Billing & Payments</span>
        )}

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

        <button
          className={`vpm-nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => onTabChange('history')}
          title="Previous Bills & Saved Invoices History"
        >
          <span className="vpm-nav-icon">
            <History size={18} />
          </span>
          {mode === 'open' && <span className="vpm-nav-label">Bill History</span>}
        </button>

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

        {mode === 'open' && (
          <span className="vpm-nav-section-label" style={{ marginTop: 10 }}>Commercial & Stock</span>
        )}

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

        <button
          className={`vpm-nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => onTabChange('products')}
          title="Products & Services"
        >
          <span className="vpm-nav-icon">
            <Package size={18} />
          </span>
          {mode === 'open' && <span className="vpm-nav-label">Products & Rates</span>}
        </button>

        {mode === 'open' && (
          <span className="vpm-nav-section-label" style={{ marginTop: 10 }}>Reports & Admin</span>
        )}

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

        <button
          className={`vpm-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => onTabChange('tasks')}
          title="Tasks & Calendar"
        >
          <span className="vpm-nav-icon">
            <CheckSquare size={18} />
          </span>
          {mode === 'open' && <span className="vpm-nav-label">Tasks & To-Do</span>}
        </button>

        <button
          className={`vpm-nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => onTabChange('users')}
          title="Users & Roles"
        >
          <span className="vpm-nav-icon">
            <Users size={18} />
          </span>
          {mode === 'open' && <span className="vpm-nav-label">Users & Security</span>}
        </button>

        <button
          className={`vpm-nav-item ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => onTabChange('backup')}
          title="Drive Backup & Restore"
        >
          <span className="vpm-nav-icon">
            <HardDrive size={18} />
          </span>
          {mode === 'open' && <span className="vpm-nav-label">Drive Backup & Restore</span>}
        </button>
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
