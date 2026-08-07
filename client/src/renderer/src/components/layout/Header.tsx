import type React from 'react'
import {
  CheckSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Sparkles,
  Sun,
  Users,
  Receipt,
  FileText,
  Tag,
  HardDrive,
  FileSpreadsheet
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { DataService } from '../../services/dataService'
import type { ActiveTabType } from './AppLayout'
import './Header.css'

interface HeaderProps {
  theme: 'dark' | 'light'
  toggleTheme: () => void
  activeTab: ActiveTabType
  onToggleSidebar: () => void
}

const pageTitles = {
  invoice: { icon: <Receipt size={18} />, label: 'Tax Invoice (GST Billing - PDF Page 1)' },
  quotation: { icon: <FileText size={18} />, label: 'Quotation (Rate Quote - PDF Page 2)' },
  estimate: { icon: <Tag size={18} />, label: 'Estimate Bill (Slip Format - PDF Page 3)' },
  tasks: { icon: <CheckSquare size={18} />, label: 'Task Management & Calendar' },
  users: { icon: <Users size={18} />, label: 'Users & Role Management' },
  dashboard: { icon: <LayoutDashboard size={18} />, label: 'System Diagnostics' },
  products: { icon: <Package size={18} />, label: 'Products & Rate Management' },
  backup: { icon: <HardDrive size={18} />, label: 'Bill Data Drive Backup & Restore' },
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, activeTab, onToggleSidebar }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const themeClass = `theme-${theme}`

  const pageInfo = pageTitles[activeTab] || pageTitles.invoice

  const handleLogout = (): void => {
    logout()
    navigate('/login')
  }

  const initials = (user?.fullName || user?.username || 'A')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className={`vpm-header ${themeClass}`}>
      {/* ── Left: Hamburger + Page Title ──────────────────── */}
      <div className="vpm-header-left">
        <button
          className={`vpm-icon-btn ${themeClass}`}
          onClick={onToggleSidebar}
          title="Toggle Navigation"
        >
          <Menu size={18} />
        </button>

        <h5 className="vpm-page-title">
          <span className="vpm-page-title-icon">{pageInfo.icon}</span>
          <span>{pageInfo.label}</span>
        </h5>
      </div>

      {/* ── Right: Controls ────────────────────────────────── */}
      <div className="vpm-header-right">
        {/* App Brand Badge */}
        <div className={`vpm-app-badge ${themeClass}`}>
          <Sparkles size={12} />
          <span>Viral Print Software</span>
        </div>

        <div className={`vpm-header-divider ${themeClass}`} />

        {/* Quick Backup to Excel Button */}
        <button
          className={`vpm-icon-btn ${themeClass}`}
          onClick={() => DataService.exportAllDataToExcel()}
          title="Backup All Bill Data to Excel (.xlsx)"
          style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', gap: 5, padding: '5px 11px', width: 'auto', borderRadius: 8, fontWeight: 800, fontSize: '0.78rem' }}
        >
          <FileSpreadsheet size={16} />
          <span>Excel Backup</span>
        </button>

        {/* Quick Backup to Drive Button */}
        <button
          className={`vpm-icon-btn ${themeClass}`}
          onClick={() => DataService.saveBackupToFileDrive()}
          title="Backup All Bill Data as JSON to Drive"
          style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)', gap: 5, padding: '5px 10px', width: 'auto', borderRadius: 8, fontWeight: 700, fontSize: '0.78rem' }}
        >
          <HardDrive size={16} />
          <span>JSON Backup</span>
        </button>

        {/* Theme Toggle */}
        <button
          className={`vpm-icon-btn ${themeClass}`}
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Badge */}
        <div className={`vpm-user-badge ${themeClass}`}>
          <div className="vpm-user-avatar" style={{ fontSize: '0.74rem', fontWeight: 800 }}>
            {initials}
          </div>
          <div className="vpm-user-info">
            <span className="vpm-user-name">
              {user?.fullName || user?.username || 'Administrator'}
            </span>
            <span className="vpm-user-role">
              {user?.role?.label || user?.role?.name || 'ADMIN'}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button className="vpm-logout-btn" onClick={handleLogout} title="Log Out">
          <LogOut size={15} />
          <span>Log Out</span>
        </button>
      </div>
    </header>
  )
}

export default Header
