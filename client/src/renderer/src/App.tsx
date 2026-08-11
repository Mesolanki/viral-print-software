import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Alert } from 'react-bootstrap'
import TaskManagement from './components/TaskManagement'
import UserManagement from './components/UserManagement'
import ProductManagement from './components/ProductManagement'
import EstimateBill from './components/EstimateBill'
import DashboardOverview from './components/DashboardOverview'
import CustomerManagement from './components/CustomerManagement'
import PurchaseManagement from './components/PurchaseManagement'
import PaymentEntryModule from './components/PaymentEntryModule'
import GstReportModule from './components/GstReportModule'
import EwayBillModule from './components/EwayBillModule'
import BackupModule from './components/BackupModule'
import { BillHistoryModule } from './components/BillHistoryModule'
import { Invoice } from './services/dataService'
import AppLayout, { type ActiveTabType } from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'

/* ── Dashboard View ─────────────────────────────────────────────── */
function DashboardView({
  theme,
  toggleTheme
}: {
  theme: 'dark' | 'light'
  toggleTheme: () => void
}): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('dashboard')
  const [pingStatus, setPingStatus] = useState<string | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  const handleEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv)
    if (inv.type === 'TAX_INVOICE') {
      setActiveTab('invoice')
    } else if (inv.type === 'QUOTATION') {
      setActiveTab('quotation')
    } else {
      setActiveTab('estimate')
    }
  }

  const handleTabChange = (tab: ActiveTabType) => {
    if (tab !== activeTab) {
      // Clear editing state when switching manually to new blank form tabs
      if (tab === 'invoice' || tab === 'quotation' || tab === 'estimate') {
        setEditingInvoice(null)
      }
    }
    setActiveTab(tab)
  }

  return (
    <AppLayout
      theme={theme}
      toggleTheme={toggleTheme}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {/* ── Alert Banner ─────────────────────────────────── */}
      {pingStatus && (
        <Alert
          variant="info"
          onClose={() => setPingStatus(null)}
          dismissible
          className="shadow-sm border-info mb-4"
          style={{ borderRadius: '12px' }}
        >
          {pingStatus}
        </Alert>
      )}

      {/* ── Page Content ─────────────────────────────────── */}
      {activeTab === 'dashboard' ? (
        <DashboardOverview theme={theme} onNavigate={setActiveTab} />
      ) : activeTab === 'invoice' ? (
        <EstimateBill key={`tax-invoice-${editingInvoice?.id || 'new'}`} theme={theme} formatType="TAX_INVOICE" editingInvoice={editingInvoice} />
      ) : activeTab === 'quotation' ? (
        <EstimateBill key={`quotation-${editingInvoice?.id || 'new'}`} theme={theme} formatType="QUOTATION" editingInvoice={editingInvoice} />
      ) : activeTab === 'estimate' ? (
        <EstimateBill key={`estimate-slip-${editingInvoice?.id || 'new'}`} theme={theme} formatType="ESTIMATE" editingInvoice={editingInvoice} />
      ) : activeTab === 'history' ? (
        <BillHistoryModule
          theme={theme}
          onEditInvoice={handleEditInvoice}
          onCreateNewBill={() => {
            setEditingInvoice(null)
            setActiveTab('invoice')
          }}
        />
      ) : activeTab === 'eway_bill' ? (
        <EwayBillModule theme={theme} />
      ) : activeTab === 'payments' ? (
        <PaymentEntryModule theme={theme} />
      ) : activeTab === 'customers' ? (
        <CustomerManagement theme={theme} />
      ) : activeTab === 'purchases' ? (
        <PurchaseManagement theme={theme} />
      ) : activeTab === 'products' ? (
        <ProductManagement theme={theme} />
      ) : activeTab === 'gst_reports' ? (
        <GstReportModule theme={theme} />
      ) : activeTab === 'tasks' ? (
        <TaskManagement theme={theme} />
      ) : activeTab === 'users' ? (
        <UserManagement theme={theme} />
      ) : activeTab === 'backup' ? (
        <BackupModule theme={theme} />
      ) : (
        <DashboardOverview theme={theme} onNavigate={setActiveTab} />
      )}
    </AppLayout>
  )
}

/* ── Root App ───────────────────────────────────────────────────── */
function App(): React.JSX.Element {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app_theme') as 'dark' | 'light') || 'light'
  })

  useEffect(() => {
    localStorage.setItem('app_theme', theme)
    // Keep body class minimal — layout handles theming via vpm-app-shell
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light'
  }, [theme])

  const toggleTheme = (): void => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={<DashboardView theme={theme} toggleTheme={toggleTheme} />}
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
