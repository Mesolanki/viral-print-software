import React, { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import './AppLayout.css'

interface AppLayoutProps {
  theme: 'dark' | 'light'
  toggleTheme: () => void
  activeTab: 'tasks' | 'users' | 'dashboard'
  onTabChange: (tab: 'tasks' | 'users' | 'dashboard') => void
  children: ReactNode
}

const AppLayout: React.FC<AppLayoutProps> = ({
  theme,
  toggleTheme,
  activeTab,
  onTabChange,
  children
}) => {
  const [sidebarMode, setSidebarMode] = useState<'open' | 'compact' | 'hidden'>('open')

  const toggleSidebar = (): void => {
    setSidebarMode((prev) => (prev === 'hidden' ? 'open' : 'hidden'))
  }

  const themeClass = `theme-${theme}`

  return (
    <div className={`vpm-app-shell ${themeClass}`}>
      {/* ── Left Sidebar ───────────────────────────────────── */}
      <Sidebar
        theme={theme}
        activeTab={activeTab}
        onTabChange={onTabChange}
        mode={sidebarMode}
      />

      {/* ── Right Main Area ────────────────────────────────── */}
      <main className="vpm-main">
        {/* Top Header */}
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          activeTab={activeTab}
          onToggleSidebar={toggleSidebar}
        />

        {/* Page Content */}
        <div className={`vpm-page-body ${themeClass}`}>
          {children}
        </div>
      </main>
    </div>
  )
}

export default AppLayout
