/**
 * DashboardPage — Placeholder for role-based dashboard.
 * Will be replaced with full sidebar + module system.
 */

import { LogOut, User2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './DashboardPage.css'

export default function DashboardPage(): React.JSX.Element {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout(): void {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dp-root">
      <div className="dp-bg">
        <div className="dp-blob dp-blob--1" />
        <div className="dp-blob dp-blob--2" />
      </div>

      <div className="dp-center">
        {/* Success card */}
        <div className="dp-card">
          {/* Icon */}
          <div className="dp-icon-wrap">
            <ShieldCheck size={32} color="#00AEEF" />
          </div>

          {/* Message */}
          <h1 className="dp-title">Login Successful! 🎉</h1>
          <p className="dp-sub">
            Welcome back, <strong>{user?.fullName}</strong>
          </p>

          {/* User info */}
          <div className="dp-info-grid">
            <div className="dp-info-item">
              <span className="dp-info-label">Username</span>
              <span className="dp-info-value">{user?.username}</span>
            </div>
            <div className="dp-info-item">
              <span className="dp-info-label">Role</span>
              <span className="dp-info-badge">{user?.role?.label}</span>
            </div>
            <div className="dp-info-item">
              <span className="dp-info-label">Status</span>
              <span className="dp-info-badge dp-info-badge--green">{user?.status}</span>
            </div>
            <div className="dp-info-item">
              <span className="dp-info-label">Permissions</span>
              <span className="dp-info-value">{user?.permissions?.length} granted</span>
            </div>
          </div>

          {/* Company */}
          <div className="dp-company">
            <User2 size={14} />
            <span>{user?.company?.name}</span>
          </div>

          {/* Actions */}
          <div className="dp-actions">
            <p className="dp-coming-soon">
              🚀 Full dashboard with sidebar is coming next!
            </p>
            <button className="dp-logout-btn" onClick={handleLogout} id="logout-btn">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
