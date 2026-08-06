import type React from 'react'
import { CheckSquare, LayoutDashboard, Users, Package, FileText, Receipt, Tag } from 'lucide-react'
import electronLogo from '../../assets/electron.svg'
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
        <div className="vpm-sidebar-logo">
          <img src={electronLogo} alt="Viral Print" />
        </div>
        {mode === 'open' && (
          <div className="vpm-sidebar-brand-text">
            <span className="vpm-brand-name">VIRAL PRINT</span>
            <span className="vpm-brand-sub">Media Software</span>
          </div>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="vpm-sidebar-nav">
        {mode === 'open' && (
          <span className="vpm-nav-section-label">Billing & Invoices</span>
        )}

        <button
          className={`vpm-nav-item ${activeTab === 'invoice' ? 'active' : ''}`}
          onClick={() => onTabChange('invoice')}
          title="Tax Invoice (GST)"
        >
          <span className="vpm-nav-icon">
            <Receipt size={18} />
          </span>
          {mode === 'open' && <span className="vpm-nav-label">Tax Invoice</span>}
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
          title="Estimate Bill"
        >
          <span className="vpm-nav-icon">
            <Tag size={18} />
          </span>
          {mode === 'open' && <span className="vpm-nav-label">Estimate Bill</span>}
        </button>

        {mode === 'open' && (
          <span className="vpm-nav-section-label" style={{ marginTop: 12 }}>Management</span>
        )}

        <button
          className={`vpm-nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => onTabChange('products')}
          title="Products & Rates"
        >
          <span className="vpm-nav-icon">
            <Package size={18} />
          </span>
          {mode === 'open' && <span className="vpm-nav-label">Products & Rates</span>}
        </button>

        <button
          className={`vpm-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => onTabChange('tasks')}
          title="Tasks & To-Do"
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
          {mode === 'open' && <span className="vpm-nav-label">Users & Roles</span>}
        </button>

        <button
          className={`vpm-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
          title="System Overview"
        >
          <span className="vpm-nav-icon">
            <LayoutDashboard size={18} />
          </span>
          {mode === 'open' && <span className="vpm-nav-label">System Overview</span>}
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
