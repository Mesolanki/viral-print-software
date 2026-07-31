import type React from 'react'
import { CheckSquare, LayoutDashboard, Users } from 'lucide-react'
import electronLogo from '../../assets/electron.svg'

interface SidebarProps {
  theme: 'dark' | 'light'
  activeTab: 'tasks' | 'users' | 'dashboard'
  onTabChange: (tab: 'tasks' | 'users' | 'dashboard') => void
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
          <span className="vpm-nav-section-label">Main Menu</span>
        )}

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
