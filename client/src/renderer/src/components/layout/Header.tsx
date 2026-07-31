import type React from 'react'
import {
  CheckSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sparkles,
  Sun,
  UserCheck,
  Users
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface HeaderProps {
  theme: 'dark' | 'light'
  toggleTheme: () => void
  activeTab: 'tasks' | 'users' | 'dashboard'
  onToggleSidebar: () => void
}

const pageTitles = {
  tasks: { icon: <CheckSquare size={18} />, label: 'Task Management & Calendar' },
  users: { icon: <Users size={18} />, label: 'Users & Role Management' },
  dashboard: { icon: <LayoutDashboard size={18} />, label: 'System Diagnostics' }
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, activeTab, onToggleSidebar }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const themeClass = `theme-${theme}`

  const pageInfo = pageTitles[activeTab]

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
