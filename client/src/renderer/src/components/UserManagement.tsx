import React, { useState, useEffect, useMemo } from 'react'
import {
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  InputGroup,
  Spinner,
  Alert,
  Table
} from 'react-bootstrap'
import './UserManagement.css'
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Sparkles,
  Mail,
  User,
  Eye,
  EyeOff,
  Briefcase,
  UserCheck,
  Check,
  Building,
  LayoutDashboard,
  Receipt,
  FileText,
  Tag,
  Truck,
  CreditCard,
  ShoppingCart,
  Package,
  FileSpreadsheet,
  CheckSquare,
  HardDrive
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_HOST = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost'
const API_BASE_URL = `http://${API_HOST}:5000/api`
const DEFAULT_COMPANY_ID = 1

export type RoleType = 'ADMIN' | 'MANAGER' | 'DESIGNER' | 'OPERATOR' | 'SALES_BILLING'

export interface ModulePermission {
  view: boolean
  add: boolean
  edit: boolean
  delete: boolean
}

export type UserPermissions = Record<string, ModulePermission>

export interface ModuleDef {
  key: string
  name: string
  desc: string
  icon: any
}

export const MODULE_LIST: ModuleDef[] = [
  { key: 'dashboard', name: 'Dashboard Overview', desc: 'Command center & sales metrics overview', icon: LayoutDashboard },
  { key: 'invoice', name: 'Tax Invoice (GST)', desc: 'GST tax invoices, GSTN validation & billing', icon: Receipt },
  { key: 'quotation', name: 'Quotations & Sales', desc: 'Estimations, client quotes & proforma', icon: FileText },
  { key: 'estimate', name: 'Estimate Bill (Non-GST)', desc: 'Non-GST bills, job vouchers & receipts', icon: Tag },
  { key: 'eway_bill', name: 'E-Way Bills & Logistics', desc: 'E-way bills, vehicle transport & NIC export', icon: Truck },
  { key: 'payments', name: 'Payment Entry & Ledger', desc: 'Customer payments, cash/bank entries & Khata', icon: CreditCard },
  { key: 'customers', name: 'Customer Directory', desc: 'Customer profiles, contact details & balances', icon: UserCheck },
  { key: 'purchases', name: 'Purchase Management', desc: 'Vendor purchase bills & raw material stock', icon: ShoppingCart },
  { key: 'products', name: 'Products & Rate Cards', desc: 'Printing services, unit prices & catalog', icon: Package },
  { key: 'gst_reports', name: 'GST & CA Reports', desc: 'GSTR-1, GSTR-3B summaries & accounting export', icon: FileSpreadsheet },
  { key: 'tasks', name: 'Tasks & Production To-Do', desc: 'Daily task checklists & team workflow', icon: CheckSquare },
  { key: 'users', name: 'User Management', desc: 'Employee profiles, roles & security control', icon: Shield },
  { key: 'backup', name: 'Drive Backup & Restore', desc: 'Google Drive & local cloud database backup', icon: HardDrive }
]

export const DEPARTMENTS = [
  'Sales & Business Development',
  'Printing & Press Production',
  'Design & Prepress Studio',
  'Management & Operations',
  'Accounts & Financial Billing'
]

export interface UserAccount {
  id: number
  company_id: number
  full_name: string
  username: string
  email?: string | null
  phone?: string | null
  role: RoleType
  role_label?: string
  department?: string
  status: 'ACTIVE' | 'INACTIVE'
  created_at?: string
  permissions?: UserPermissions
}

interface UserManagementProps {
  theme?: 'dark' | 'light'
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('vpm_auth_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

export const getRoleLabel = (role: RoleType): string => {
  switch (role) {
    case 'ADMIN':
      return 'Administrator'
    case 'MANAGER':
      return 'Shop Manager'
    case 'DESIGNER':
      return 'Graphic Designer'
    case 'OPERATOR':
      return 'Print Operator'
    case 'SALES_BILLING':
      return 'Sales & Billing'
  }
}

export const getDefaultPermissionsForRole = (role: RoleType): UserPermissions => {
  const perms: UserPermissions = {}
  MODULE_LIST.forEach((m) => {
    if (role === 'ADMIN') {
      perms[m.key] = { view: true, add: true, edit: true, delete: true }
    } else if (role === 'MANAGER') {
      perms[m.key] = { view: true, add: true, edit: true, delete: m.key === 'tasks' || m.key === 'customers' }
    } else if (role === 'DESIGNER') {
      const isDesignModule = ['dashboard', 'quotation', 'estimate', 'tasks', 'products'].includes(m.key)
      perms[m.key] = {
        view: isDesignModule || m.key === 'customers',
        add: isDesignModule,
        edit: isDesignModule,
        delete: false
      }
    } else if (role === 'OPERATOR') {
      const isOpModule = ['dashboard', 'estimate', 'tasks', 'products'].includes(m.key)
      perms[m.key] = {
        view: isOpModule,
        add: isOpModule,
        edit: isOpModule,
        delete: false
      }
    } else if (role === 'SALES_BILLING') {
      const isSalesModule = ['dashboard', 'invoice', 'quotation', 'estimate', 'payments', 'customers', 'products', 'tasks'].includes(m.key)
      perms[m.key] = {
        view: isSalesModule,
        add: isSalesModule,
        edit: isSalesModule,
        delete: m.key === 'quotation' || m.key === 'estimate'
      }
    }
  })
  return perms
}

export const getUserInitials = (name?: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export default function UserManagement({ theme = 'dark' }: UserManagementProps): React.JSX.Element {
  const isDark = theme === 'dark'

  const { user: currentUser, isLoading: isAuthLoading } = useAuth()
  const currentUserRole = currentUser?.role?.name ? String(currentUser.role.name).toUpperCase() : ''
  const isAdmin = !isAuthLoading && currentUserRole === 'ADMIN'

  const [users, setUsers] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null)

  // Form Fields
  const [fullName, setFullName] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<RoleType>('OPERATOR')
  const [department, setDepartment] = useState<string>('Sales & Business Development')
  const [password, setPassword] = useState<string>('')
  const [userStatus, setUserStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [permissions, setPermissions] = useState<UserPermissions>(getDefaultPermissionsForRole('OPERATOR'))

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('vpm_users_roster', JSON.stringify(users))
      window.dispatchEvent(new Event('vpm_roster_updated'))
    }
  }, [users])

  const fetchUsers = async (): Promise<void> => {
    setLoading(true)
    setError(null)

    // Check local stored roster for custom granular permissions
    const localSaved = localStorage.getItem('vpm_users_roster')
    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUsers(parsed)
          setLoading(false)
          return
        }
      } catch (e) {
        console.warn('Error reading saved roster', e)
      }
    }

    const headers = getAuthHeaders()

    try {
      const res = await fetch(`${API_BASE_URL}/users?company_id=${DEFAULT_COMPANY_ID}`, { headers })
      if (res.ok) {
        const json = await res.json()
        const rawData = Array.isArray(json) ? json : (json.data || [])
        const mapped: UserAccount[] = rawData.map((u: any) => {
          const r: RoleType = u.role?.name ? mapBackendRole(u.role.name) : (u.role || 'OPERATOR')
          return {
            id: u.id,
            company_id: u.company_id || DEFAULT_COMPANY_ID,
            full_name: u.full_name || u.name || u.username,
            username: u.username,
            email: u.email || `${u.username}@gmail.com`,
            phone: u.phone || '+91 98765 43210',
            role: r,
            role_label: u.role?.label || getRoleLabel(r),
            department: u.department || 'Sales & Business Development',
            status: u.status || 'ACTIVE',
            created_at: u.createdAt || new Date().toISOString(),
            permissions: u.permissions || getDefaultPermissionsForRole(r)
          }
        })
        setUsers(mapped)
      } else {
        setUsers(getSampleUsers())
      }
    } catch (err) {
      console.warn('Backend users API fallback:', err)
      setUsers(getSampleUsers())
    } finally {
      setLoading(false)
    }
  }

  const mapBackendRole = (roleStr: string): RoleType => {
    const r = roleStr.toUpperCase()
    if (r.includes('ADMIN')) return 'ADMIN'
    if (r.includes('MANAGER')) return 'MANAGER'
    if (r.includes('DESIGN')) return 'DESIGNER'
    if (r.includes('OPERAT')) return 'OPERATOR'
    if (r.includes('SALE') || r.includes('BILL')) return 'SALES_BILLING'
    return 'OPERATOR'
  }

  const getSampleUsers = (): UserAccount[] => [
    {
      id: 1,
      company_id: DEFAULT_COMPANY_ID,
      full_name: 'smit',
      username: 'smit',
      email: 'kathanpatel09@gmail.com',
      phone: '+91 98200 11223',
      role: 'ADMIN',
      role_label: 'Administrator',
      department: 'Management & Operations',
      status: 'ACTIVE',
      created_at: '2026-01-10T10:00:00Z',
      permissions: getDefaultPermissionsForRole('ADMIN')
    },
    {
      id: 2,
      company_id: DEFAULT_COMPANY_ID,
      full_name: 'Rahul Sharma',
      username: 'rahul_print',
      email: 'rahul@viralprint.com',
      phone: '+91 98765 43210',
      role: 'MANAGER',
      role_label: 'Shop Manager',
      department: 'Printing & Press Production',
      status: 'ACTIVE',
      created_at: '2026-02-01T11:30:00Z',
      permissions: getDefaultPermissionsForRole('MANAGER')
    },
    {
      id: 3,
      company_id: DEFAULT_COMPANY_ID,
      full_name: 'Priya Patel',
      username: 'priya_design',
      email: 'priya@viralprint.com',
      phone: '+91 98111 22334',
      role: 'DESIGNER',
      role_label: 'Graphic Designer',
      department: 'Design & Prepress Studio',
      status: 'ACTIVE',
      created_at: '2026-02-15T14:20:00Z',
      permissions: getDefaultPermissionsForRole('DESIGNER')
    },
    {
      id: 4,
      company_id: DEFAULT_COMPANY_ID,
      full_name: 'Amit Kumar',
      username: 'amit_press',
      email: 'amit@viralprint.com',
      phone: '+91 97222 33445',
      role: 'OPERATOR',
      role_label: 'Print Operator',
      department: 'Printing & Press Production',
      status: 'ACTIVE',
      created_at: '2026-03-01T09:15:00Z',
      permissions: getDefaultPermissionsForRole('OPERATOR')
    },
    {
      id: 5,
      company_id: DEFAULT_COMPANY_ID,
      full_name: 'Sneh Lata',
      username: 'sneh_billing',
      email: 'sneh@viralprint.com',
      phone: '+91 96333 44556',
      role: 'SALES_BILLING',
      role_label: 'Sales & Billing',
      department: 'Sales & Business Development',
      status: 'ACTIVE',
      created_at: '2026-03-10T16:45:00Z',
      permissions: getDefaultPermissionsForRole('SALES_BILLING')
    }
  ]

  const showToast = (msg: string): void => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3500)
  }

  // Open modal for new user registration
  const handleOpenAddModal = (): void => {
    if (!isAdmin) {
      setError('Permission Denied: Only System Administrators can register new user accounts.')
      return
    }
    setEditingUser(null)
    setFullName('')
    setUsername('')
    setEmail('')
    setPhone('')
    setSelectedRole('OPERATOR')
    setDepartment('Sales & Business Development')
    setPassword('')
    setUserStatus('ACTIVE')
    setShowPassword(false)
    setPermissions(getDefaultPermissionsForRole('OPERATOR'))
    setShowModal(true)
  }

  // Open modal for editing user
  const handleOpenEditModal = (user: UserAccount): void => {
    if (!isAdmin) {
      setError('Permission Denied: Only System Administrators can edit user accounts and roles.')
      return
    }
    setEditingUser(user)
    setFullName(user.full_name)
    setUsername(user.username)
    setEmail(user.email || '')
    setPhone(user.phone || '')
    setSelectedRole(user.role)
    setDepartment(user.department || 'Sales & Business Development')
    setPassword('')
    setUserStatus(user.status)
    setShowPassword(false)
    setPermissions(user.permissions || getDefaultPermissionsForRole(user.role))
    setShowModal(true)
  }

  // Role Selection Change Handler
  const handleRoleChange = (newRole: RoleType) => {
    setSelectedRole(newRole)
  }

  // Matrix Action Button Handlers
  const handleSelectAllFull = () => {
    const updated: UserPermissions = {}
    MODULE_LIST.forEach((m) => {
      updated[m.key] = { view: true, add: true, edit: true, delete: true }
    })
    setPermissions(updated)
  }

  const handleSelectReadOnly = () => {
    const updated: UserPermissions = {}
    MODULE_LIST.forEach((m) => {
      updated[m.key] = { view: true, add: false, edit: false, delete: false }
    })
    setPermissions(updated)
  }

  const handleRevokeAll = () => {
    const updated: UserPermissions = {}
    MODULE_LIST.forEach((m) => {
      updated[m.key] = { view: false, add: false, edit: false, delete: false }
    })
    setPermissions(updated)
  }

  // Toggle individual permission checkbox
  const togglePermission = (modKey: string, field: 'view' | 'add' | 'edit' | 'delete') => {
    setPermissions((prev) => {
      const currentMod = prev[modKey] || { view: false, add: false, edit: false, delete: false }
      const newVal = !currentMod[field]
      const updatedMod = { ...currentMod, [field]: newVal }
      // If adding/editing/deleting is enabled, automatically enable view as well
      if (field !== 'view' && newVal) {
        updatedMod.view = true
      }
      return { ...prev, [modKey]: updatedMod }
    })
  }

  // Column Header ALL toggle handler
  const toggleColumnAll = (field: 'view' | 'add' | 'edit' | 'delete') => {
    const allChecked = MODULE_LIST.every((m) => permissions[m.key]?.[field])
    const targetVal = !allChecked

    setPermissions((prev) => {
      const updated: UserPermissions = { ...prev }
      MODULE_LIST.forEach((m) => {
        const cur = updated[m.key] || { view: false, add: false, edit: false, delete: false }
        const nextMod = { ...cur, [field]: targetVal }
        if (field !== 'view' && targetVal) {
          nextMod.view = true
        }
        updated[m.key] = nextMod
      })
      return updated
    })
  }

  // Save/Register user
  const handleSaveUser = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!fullName.trim() || !username.trim()) {
      setError('Display name and username are required.')
      return
    }

    if (!editingUser) {
      if (!password) {
        setError('Password is required for new registration.')
        return
      }
    }

    setSubmitting(true)
    setError(null)

    const payload = {
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim() || `${username.trim().toLowerCase()}@gmail.com`,
      phone: phone.trim() || null,
      role: selectedRole,
      department,
      status: userStatus,
      permissions,
      ...(password ? { password } : {})
    }

    const headers = getAuthHeaders()

    try {
      if (editingUser) {
        await fetch(`${API_BASE_URL}/users/${editingUser.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        })

        const updated: UserAccount = {
          ...editingUser,
          full_name: payload.fullName,
          username: payload.username,
          email: payload.email,
          phone: payload.phone,
          role: payload.role,
          role_label: getRoleLabel(payload.role),
          department: payload.department,
          status: payload.status,
          permissions: payload.permissions
        }

        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)))
        showToast(`User ${updated.full_name} updated successfully!`)
      } else {
        const res = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        })

        let createdUser: UserAccount

        if (res.ok) {
          const json = await res.json()
          const raw = json.data || json
          createdUser = {
            id: raw.id || Date.now(),
            company_id: DEFAULT_COMPANY_ID,
            full_name: raw.full_name || payload.fullName,
            username: raw.username || payload.username,
            email: payload.email,
            phone: payload.phone,
            role: raw.role?.name ? mapBackendRole(raw.role.name) : payload.role,
            role_label: raw.role?.label || getRoleLabel(payload.role),
            department: payload.department,
            status: raw.status || payload.status,
            created_at: raw.createdAt || new Date().toISOString(),
            permissions: payload.permissions
          }
        } else {
          createdUser = {
            id: Date.now(),
            company_id: DEFAULT_COMPANY_ID,
            full_name: payload.fullName,
            username: payload.username,
            email: payload.email,
            phone: payload.phone,
            role: payload.role,
            role_label: getRoleLabel(payload.role),
            department: payload.department,
            status: payload.status,
            created_at: new Date().toISOString(),
            permissions: payload.permissions
          }
        }

        setUsers((prev) => [createdUser, ...prev])
        showToast(`User ${createdUser.full_name} registered successfully as ${getRoleLabel(createdUser.role)}!`)
      }

      setShowModal(false)
    } catch (err) {
      console.error('Error registering/updating user:', err)
      const fallbackUser: UserAccount = {
        id: editingUser ? editingUser.id : Date.now(),
        company_id: DEFAULT_COMPANY_ID,
        full_name: payload.fullName,
        username: payload.username,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        role_label: getRoleLabel(payload.role),
        department: payload.department,
        status: payload.status,
        created_at: new Date().toISOString(),
        permissions: payload.permissions
      }

      if (editingUser) {
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? fallbackUser : u)))
        showToast(`User ${fallbackUser.full_name} updated locally.`)
      } else {
        setUsers((prev) => [fallbackUser, ...prev])
        showToast(`User ${fallbackUser.full_name} registered locally.`)
      }
      setShowModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle User Active / Inactive
  const handleToggleStatus = async (user: UserAccount): Promise<void> => {
    if (!isAdmin) {
      setError('Permission Denied: Only System Administrators can alter employee account status.')
      return
    }
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)))

    try {
      await fetch(`${API_BASE_URL}/users/${user.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      })
      showToast(`User ${user.full_name} status set to ${newStatus}.`)
    } catch (err) {
      console.warn('Network error on status toggle:', err)
    }
  }

  // Delete user
  const handleDeleteUser = async (userId: number, name: string): Promise<void> => {
    if (!isAdmin) {
      setError('Permission Denied: Only System Administrators can delete user accounts.')
      return
    }
    if (!window.confirm(`Are you sure you want to delete user account "${name}"?`)) return

    setUsers((prev) => prev.filter((u) => u.id !== userId))
    showToast(`User "${name}" removed.`)

    try {
      await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
    } catch (err) {
      console.warn('Network error on user delete:', err)
    }
  }

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase()
        const matchName = u.full_name.toLowerCase().includes(q)
        const matchUser = u.username.toLowerCase().includes(q)
        const matchEmail = u.email ? u.email.toLowerCase().includes(q) : false
        if (!matchName && !matchUser && !matchEmail) return false
      }

      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false

      return true
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  // Stat Metrics
  const metrics = useMemo(() => {
    let total = users.length
    let admins = 0
    let managers = 0
    let designers = 0
    let operators = 0

    users.forEach((u) => {
      if (u.role === 'ADMIN') admins++
      else if (u.role === 'MANAGER') managers++
      else if (u.role === 'DESIGNER') designers++
      else if (u.role === 'OPERATOR' || u.role === 'SALES_BILLING') operators++
    })

    return { total, admins, managers, designers, operators }
  }, [users])

  // Role Badge Styling Component
  const renderRoleBadge = (role: RoleType) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="role-badge role-admin">
            <ShieldCheck size={12} className="me-1" /> Admin
          </span>
        )
      case 'MANAGER':
        return (
          <span className="role-badge role-manager">
            <Briefcase size={12} className="me-1" /> Manager
          </span>
        )
      case 'DESIGNER':
        return (
          <span className="role-badge role-designer">
            <Sparkles size={12} className="me-1" /> Designer
          </span>
        )
      case 'OPERATOR':
        return (
          <span className="role-badge role-operator">
            <User size={12} className="me-1" /> Operator
          </span>
        )
      case 'SALES_BILLING':
        return (
          <span className="role-badge role-sales">
            <CheckCircle2 size={12} className="me-1" /> Sales & Billing
          </span>
        )
    }
  }

  return (
    <div className={`um-page-container ${isDark ? 'theme-dark' : 'theme-light'} w-100 pt-1 pb-5 mb-4`}>
      {/* Toast Alert */}
      {successMsg && (
        <Alert variant="success" onClose={() => setSuccessMsg(null)} dismissible className="shadow-lg border-success mb-3 rounded-3">
          <Sparkles size={18} className="me-2 d-inline" />
          {successMsg}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="shadow-lg border-danger mb-3 rounded-3">
          <AlertCircle size={18} className="me-2 d-inline" />
          {error}
        </Alert>
      )}

      {/* Read-Only Notice for Non-Admin Users */}
      {!isAdmin && (
        <Alert variant="warning" className="shadow-sm border-warning mb-3 rounded-3 d-flex align-items-center gap-2.5">
          <ShieldAlert size={20} className="flex-shrink-0 text-warning" />
          <div className="fs-7">
            <strong>Read-Only Access Mode:</strong> You are currently logged in as <strong>{currentUser?.role?.label || currentUserRole || 'Staff User'}</strong>. Only System Administrators have permission to register new employees or alter account roles and credentials.
          </div>
        </Alert>
      )}

      {/* Header & Register Action Controls */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 w-100">
        <div className="d-flex align-items-center gap-3">
          <div className="vpm-page-header-icon">
            <Shield size={22} />
          </div>
          <div>
            <h2 className="vpm-page-heading">
              Employee &amp; Role-Based User Management
            </h2>
            <p className="vpm-page-subheading">
              {isAdmin ? 'Admin Control Panel: Register shop employees, configure role-based permissions, and manage credentials.' : 'Employee Roster Directory: View team members, assigned role permissions, and contact details.'}
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            onClick={fetchUsers}
            title="Refresh Roster"
            className="vpm-btn-secondary"
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Refresh Roster</span>
          </button>

          {isAdmin && (
            <button
              className="vpm-btn-primary"
              onClick={handleOpenAddModal}
            >
              <UserPlus size={17} /> Register New User
            </button>
          )}
        </div>
      </div>

      {/* Stat Overview Cards */}
      <Row className="g-3 mb-4 w-100 mx-0">
        <Col className="col-12 col-sm-6 col-md flex-grow-1 px-2">
          <div className={`vpm-stat-card ${isDark ? 'vpm-stat-card-dark' : 'vpm-stat-card-light'} vpm-stat-cyan`}>
            <div className="vpm-stat-top">
              <span className="vpm-stat-label">Total Employees</span>
              <div className="vpm-stat-icon-ring">
                <Users size={16} />
              </div>
            </div>
            <div className="vpm-stat-divider" />
            <div className="vpm-stat-value">{metrics.total}</div>
            <div className="vpm-stat-desc">Total registered team members</div>
          </div>
        </Col>

        <Col className="col-12 col-sm-6 col-md flex-grow-1 px-2">
          <div className={`vpm-stat-card ${isDark ? 'vpm-stat-card-dark' : 'vpm-stat-card-light'} vpm-stat-amber`}>
            <div className="vpm-stat-top">
              <span className="vpm-stat-label">Administrators</span>
              <div className="vpm-stat-icon-ring">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="vpm-stat-divider" />
            <div className="vpm-stat-value">{metrics.admins}</div>
            <div className="vpm-stat-desc">System control administrators</div>
          </div>
        </Col>

        <Col className="col-12 col-sm-6 col-md flex-grow-1 px-2">
          <div className={`vpm-stat-card ${isDark ? 'vpm-stat-card-dark' : 'vpm-stat-card-light'} vpm-stat-indigo`}>
            <div className="vpm-stat-top">
              <span className="vpm-stat-label">Shop Managers</span>
              <div className="vpm-stat-icon-ring">
                <Briefcase size={16} />
              </div>
            </div>
            <div className="vpm-stat-divider" />
            <div className="vpm-stat-value">{metrics.managers}</div>
            <div className="vpm-stat-desc">Production shop managers</div>
          </div>
        </Col>

        <Col className="col-12 col-sm-6 col-md flex-grow-1 px-2">
          <div className={`vpm-stat-card ${isDark ? 'vpm-stat-card-dark' : 'vpm-stat-card-light'} vpm-stat-emerald`}>
            <div className="vpm-stat-top">
              <span className="vpm-stat-label">Staff & Operators</span>
              <div className="vpm-stat-icon-ring">
                <UserCheck size={16} />
              </div>
            </div>
            <div className="vpm-stat-divider" />
            <div className="vpm-stat-value">{metrics.designers + metrics.operators}</div>
            <div className="vpm-stat-desc">Designers & operators roster</div>
          </div>
        </Col>
      </Row>

      {/* Filter Toolbar */}
      <div className={`vpm-filter-toolbar ${isDark ? 'filter-toolbar-dark' : 'filter-toolbar-light'} mb-4 w-100`}>
        <Row className="g-2.5 align-items-center w-100 mx-0">
          <Col lg={5} md={12} className="px-1">
            <div className="position-relative">
              <div className={`cal-search-box ${isDark ? 'search-dark' : 'search-light'}`}>
                <Search size={15} className="search-icon" />
                <input
                  placeholder="Search employees by name, username, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="search-clear-btn"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </Col>

          <Col lg={3} md={6} className="px-1">
            <Form.Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="vpm-filter-select"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Administrator</option>
              <option value="MANAGER">Shop Manager</option>
              <option value="DESIGNER">Graphic Designer</option>
              <option value="OPERATOR">Print Operator</option>
              <option value="SALES_BILLING">Sales &amp; Billing</option>
            </Form.Select>
          </Col>

          <Col lg={2} md={4} className="px-1">
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="vpm-filter-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Account</option>
              <option value="INACTIVE">Inactive Account</option>
            </Form.Select>
          </Col>

          <Col lg={2} md={2} className="px-1 text-end">
            <button
              className="vpm-btn-secondary w-100 py-1.5 fs-7"
              onClick={() => {
                setSearchQuery('')
                setRoleFilter('ALL')
                setStatusFilter('ALL')
              }}
            >
              Reset
            </button>
          </Col>
        </Row>
      </div>

      {/* User Roster Table */}
      <Card className={`user-roster-card ${isDark ? 'user-roster-card-dark' : 'user-roster-card-light'} border-0 w-100`}>
        <Card.Body className="p-0 w-100">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant={isDark ? 'info' : 'primary'} />
              <p className="text-secondary mt-2 fs-7">Loading employee roster...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <Users size={42} className="mb-2 opacity-40 d-block mx-auto" />
              <h5 className="fw-bold">No Users Found</h5>
              <p className="fs-7 opacity-75">No user accounts match your search query or filter criteria.</p>
            </div>
          ) : (
            <div className="table-responsive w-100">
              <Table hover className="align-middle mb-0 user-roster-table">
                <thead>
                  <tr className="user-roster-thead-row">
                    <th className="ps-4 py-3">Employee Name</th>
                    <th className="py-3">Role & Access</th>
                    <th className="py-3">Department</th>
                    <th className="py-3">Contact Email</th>
                    <th className="py-3">Status</th>
                    {isAdmin && <th className="pe-4 text-end py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isActive = u.status === 'ACTIVE'

                    return (
                      <tr key={u.id} className={!isActive ? 'row-inactive' : ''}>
                        {/* Name & Avatar */}
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-center gap-3">
                            <div className={`user-avatar-ring avatar-role-${u.role.toLowerCase()}`}>
                              {getUserInitials(u.full_name)}
                            </div>
                            <div>
                              <div className="user-full-name">{u.full_name}</div>
                              <div className="user-username font-monospace">@{u.username}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3">
                          {renderRoleBadge(u.role)}
                        </td>

                        {/* Department */}
                        <td className="py-3">
                          <span className="fs-7 text-secondary fw-semibold">
                            {u.department || 'Sales & Business Development'}
                          </span>
                        </td>

                        {/* Email */}
                        <td className="py-3">
                          <div className="user-contact-pill" title={u.email || ''}>
                            <span className="user-contact-icon">
                              <Mail size={13} />
                            </span>
                            <span className="user-contact-text">{u.email}</span>
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            disabled={!isAdmin}
                            className={`badge-status-toggle ${isActive ? 'status-active' : 'status-inactive'} ${!isAdmin ? 'pe-none opacity-85' : ''}`}
                            title={isAdmin ? "Click to toggle account status" : "Admin permission required to toggle status"}
                          >
                            <span className={`status-dot-mini ${isActive ? 'bg-success' : 'bg-secondary'}`} />
                            <span>{isActive ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        {isAdmin && (
                          <td className="um-actions-cell py-3">
                            <div className="um-action-group">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(u)}
                                className="um-icon-btn um-btn-edit"
                                aria-label="Edit User"
                              >
                                <Edit2 size={14} strokeWidth={2.2} />
                                <span className="um-btn-tooltip">Edit User</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.full_name)}
                                className="um-icon-btn um-btn-delete"
                                aria-label="Delete Account"
                              >
                                <Trash2 size={14} strokeWidth={2.2} />
                                <span className="um-btn-tooltip">Delete</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Register / Edit User Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl" className={isDark ? 'dark-modal' : 'light-modal'}>
        <Modal.Header className="d-flex align-items-center justify-content-between px-4 py-3.5 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className={`um-modal-header-icon ${isDark ? 'icon-box-dark' : 'icon-box-light'}`}>
              {editingUser ? <Edit2 size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <Modal.Title className={`fw-bold mb-0.5 fs-5 ${isDark ? 'text-white' : 'text-dark'}`}>
                {editingUser ? `Edit Account: ${editingUser.full_name}` : 'Register New Role-Based Employee'}
              </Modal.Title>
              <div className="fs-8 text-secondary">Configure identity credentials, system role hierarchy, and granular module access matrix.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="um-modal-close-btn"
            aria-label="Close Modal"
            title="Close Modal"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </Modal.Header>
        <Form onSubmit={handleSaveUser}>
          <Modal.Body className={`${isDark ? 'bg-dark text-light' : 'bg-white text-dark'} p-4`}>
            <div className="d-flex flex-column gap-4">

              {/* TOP ROW: CREDENTIALS (LEFT) & ROLE/DEPARTMENT (RIGHT) */}
              <Row className="g-4">

                {/* ── CARD 1: ACCOUNT IDENTITY CREDENTIALS (LEFT) ── */}
                <Col lg={6} md={12}>
                  <div className={`um-section-card ${isDark ? 'um-section-card-dark' : 'um-section-card-light'} h-100 rounded-4 border`}>
                    <div className="um-section-header d-flex align-items-center gap-2">
                      <div className="um-header-icon-box text-purple">
                        <User size={16} />
                      </div>
                      <h6 className="fw-bold mb-0 text-uppercase tracking-wider fs-7">
                        ACCOUNT IDENTITY CREDENTIALS
                      </h6>
                    </div>

                    <div className="d-flex flex-column gap-3.5">
                      {/* USER ID / USERNAME */}
                      <Form.Group>
                        <Form.Label className="vpm-input-label fs-8 fw-bold text-uppercase">
                          USER ID / USERNAME *
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="e.g. smit"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className={`vpm-control-input ${isDark ? 'input-dark' : 'input-light'}`}
                        />
                      </Form.Group>

                      {/* EMAIL ADDRESS */}
                      <Form.Group>
                        <Form.Label className="vpm-input-label fs-8 fw-bold text-uppercase">
                          EMAIL ADDRESS *
                        </Form.Label>
                        <Form.Control
                          type="email"
                          required
                          placeholder="kathanpatel09@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`vpm-control-input ${isDark ? 'input-dark' : 'input-light'}`}
                        />
                      </Form.Group>

                      {/* CONTACT PHONE NUMBER */}
                      <Form.Group>
                        <Form.Label className="vpm-input-label fs-8 fw-bold text-uppercase">
                          CONTACT PHONE NUMBER (10 DIGITS)
                        </Form.Label>
                        <Form.Control
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className={`vpm-control-input ${isDark ? 'input-dark' : 'input-light'}`}
                        />
                      </Form.Group>

                      {/* NEW PASSWORD */}
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="vpm-input-label fs-8 fw-bold text-uppercase mb-0">
                            NEW PASSWORD
                          </Form.Label>
                          <span className="fs-8 text-secondary italic opacity-75">
                            leave blank to keep unchanged
                          </span>
                        </div>
                        <InputGroup className="vpm-input-group">
                          <Form.Control
                            type={showPassword ? 'text' : 'password'}
                            required={!editingUser}
                            placeholder={editingUser ? '•••••••• (unchanged)' : 'Enter password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`vpm-control-input ${isDark ? 'input-dark' : 'input-light'}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`btn-password-toggle ${isDark ? 'btn-toggle-dark' : 'btn-toggle-light'}`}
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </InputGroup>
                      </Form.Group>

                      {/* DISPLAY NAME */}
                      <Form.Group>
                        <Form.Label className="vpm-input-label fs-8 fw-bold text-uppercase">
                          DISPLAY NAME *
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="e.g. smit"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={`vpm-control-input ${isDark ? 'input-dark' : 'input-light'}`}
                        />
                      </Form.Group>

                      {/* ACTIVE STATUS TOGGLE */}
                      <div className="um-status-toggle-card">
                        <div>
                          <div className="fw-bold fs-7">Active Status</div>
                          <div className="fs-8 text-secondary">Enable user account access</div>
                        </div>
                        <Form.Check
                          type="switch"
                          id="active-status-switch"
                          checked={userStatus === 'ACTIVE'}
                          onChange={(e) => setUserStatus(e.target.checked ? 'ACTIVE' : 'INACTIVE')}
                          className="um-purple-switch fs-5"
                        />
                      </div>
                    </div>
                  </div>
                </Col>

                {/* ── CARD 2: ROLE & DEPARTMENT HIERARCHY (RIGHT) ── */}
                <Col lg={6} md={12}>
                  <div className={`um-section-card ${isDark ? 'um-section-card-dark' : 'um-section-card-light'} h-100 rounded-4 border d-flex flex-column justify-content-between`}>
                    <div>
                      <div className="um-section-header d-flex align-items-center gap-2">
                        <div className="um-header-icon-box text-purple">
                          <Building size={16} />
                        </div>
                        <h6 className="fw-bold mb-0 text-uppercase tracking-wider fs-7">
                          ROLE &amp; DEPARTMENT HIERARCHY
                        </h6>
                      </div>

                      <div className="d-flex flex-column gap-3.5">
                        {/* ROLE DROPDOWN */}
                        <Form.Group>
                          <Form.Label className="vpm-input-label fs-8 fw-bold text-uppercase">
                            ROLE *
                          </Form.Label>
                          <Form.Select
                            value={selectedRole}
                            onChange={(e) => handleRoleChange(e.target.value as RoleType)}
                            className={`um-form-select ${isDark ? 'select-dark' : 'select-light'}`}
                          >
                            <option value="ADMIN">ADMIN (Administrator)</option>
                            <option value="MANAGER">Shop Manager</option>
                            <option value="DESIGNER">Graphic Designer</option>
                            <option value="OPERATOR">Print Operator</option>
                            <option value="SALES_BILLING">Sales &amp; Billing</option>
                          </Form.Select>
                        </Form.Group>

                        {/* DEPARTMENT DROPDOWN */}
                        <Form.Group>
                          <Form.Label className="vpm-input-label fs-8 fw-bold text-uppercase">
                            DEPARTMENT / DIVISION *
                          </Form.Label>
                          <Form.Select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className={`um-form-select ${isDark ? 'select-dark' : 'select-light'}`}
                          >
                            {DEPARTMENTS.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </div>
                    </div>

                    {/* ROLE INFO SUMMARY CARD FOR VISUAL SYMMETRY */}
                    <div className="um-role-info-card mt-4">
                      <div className="d-flex align-items-center justify-content-between mb-1.5">
                        <span className="fs-8 fw-bold text-uppercase text-purple tracking-wider">Role Authority Summary</span>
                        {renderRoleBadge(selectedRole)}
                      </div>
                      <p className="fs-8 text-secondary mb-0 lh-sm">
                        {selectedRole === 'ADMIN' && 'Unrestricted system control, user account management, and financial reporting privileges.'}
                        {selectedRole === 'MANAGER' && 'Operational overview, job assignments, customer quotes, and staff roster control.'}
                        {selectedRole === 'DESIGNER' && 'Artwork proofing, design file management, print assets, and order status updates.'}
                        {selectedRole === 'OPERATOR' && 'Print queue execution, machine setup, order completion, and production tracking.'}
                        {selectedRole === 'SALES_BILLING' && 'POS checkout, customer invoices, payments, tax receipts, and order intake.'}
                      </p>
                    </div>
                  </div>
                </Col>

              </Row>

              {/* ── CARD 3: GRANULAR MODULE ACCESS MATRIX (BOTTOM FULL-WIDTH) ── */}
              <div className={`um-section-card ${isDark ? 'um-section-card-dark' : 'um-section-card-light'} p-3.5 rounded-4 border w-100`}>
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2.5 pb-3 mb-3 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <div className="um-header-icon-box text-purple">
                      <Shield size={18} />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0 text-uppercase tracking-wider fs-7 text-purple">
                        GRANULAR MODULE ACCESS MATRIX
                      </h6>
                      <div className="fs-8 text-secondary">
                        Configure exact View, Add, Edit &amp; Delete privileges across all {MODULE_LIST.length} authentic app modules
                      </div>
                    </div>
                  </div>

                  {/* ACTION PRESET BUTTONS */}
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFull}
                      className="um-preset-btn preset-full"
                    >
                      Select All (Full)
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectReadOnly}
                      className="um-preset-btn preset-readonly"
                    >
                      Read-Only
                    </button>
                    <button
                      type="button"
                      onClick={handleRevokeAll}
                      className="um-preset-btn preset-revoke"
                    >
                      Revoke All
                    </button>
                  </div>
                </div>

                {/* ACCESS MATRIX TABLE */}
                <div className="table-responsive w-100 um-matrix-container">
                  <Table className="align-middle mb-0 um-matrix-table" borderless>
                    <thead>
                      <tr className="um-matrix-thead-row">
                        <th className="ps-3 py-2.5 text-uppercase fs-8 fw-bold">
                          AUTHENTIC CRM MODULE NAME
                        </th>
                        <th className="text-center py-2.5 text-uppercase fs-8 fw-bold">
                          View{' '}
                          <button
                            type="button"
                            onClick={() => toggleColumnAll('view')}
                            className="um-all-badge"
                          >
                            ALL
                          </button>
                        </th>
                        <th className="text-center py-2.5 text-uppercase fs-8 fw-bold">
                          Add{' '}
                          <button
                            type="button"
                            onClick={() => toggleColumnAll('add')}
                            className="um-all-badge"
                          >
                            ALL
                          </button>
                        </th>
                        <th className="text-center py-2.5 text-uppercase fs-8 fw-bold">
                          Edit{' '}
                          <button
                            type="button"
                            onClick={() => toggleColumnAll('edit')}
                            className="um-all-badge"
                          >
                            ALL
                          </button>
                        </th>
                        <th className="text-center py-2.5 text-uppercase fs-8 fw-bold">
                          Delete{' '}
                          <button
                            type="button"
                            onClick={() => toggleColumnAll('delete')}
                            className="um-all-badge"
                          >
                            ALL
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {MODULE_LIST.map((mod) => {
                        const IconComp = mod.icon
                        const perm = permissions[mod.key] || { view: false, add: false, edit: false, delete: false }

                        return (
                          <tr key={mod.key} className="um-matrix-row">
                            {/* Module Name & Icon */}
                            <td className="ps-3 py-2.5">
                              <div className="d-flex align-items-center gap-3">
                                <div className="um-module-icon-box">
                                  <IconComp size={16} />
                                </div>
                                <div>
                                  <div className="fw-bold fs-7 text-dark-emphasis mb-0">
                                    {mod.name}
                                  </div>
                                  <div className="fs-8 text-secondary">
                                    {mod.desc}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* View Column */}
                            <td className="text-center py-2.5">
                              <button
                                type="button"
                                onClick={() => togglePermission(mod.key, 'view')}
                                className={`um-check-circle ${perm.view ? 'is-checked' : ''}`}
                                title={`Toggle View for ${mod.name}`}
                              >
                                {perm.view && <Check size={14} strokeWidth={3} />}
                              </button>
                            </td>

                            {/* Add Column */}
                            <td className="text-center py-2.5">
                              <button
                                type="button"
                                onClick={() => togglePermission(mod.key, 'add')}
                                className={`um-check-circle ${perm.add ? 'is-checked' : ''}`}
                                title={`Toggle Add for ${mod.name}`}
                              >
                                {perm.add && <Check size={14} strokeWidth={3} />}
                              </button>
                            </td>

                            {/* Edit Column */}
                            <td className="text-center py-2.5">
                              <button
                                type="button"
                                onClick={() => togglePermission(mod.key, 'edit')}
                                className={`um-check-circle ${perm.edit ? 'is-checked' : ''}`}
                                title={`Toggle Edit for ${mod.name}`}
                              >
                                {perm.edit && <Check size={14} strokeWidth={3} />}
                              </button>
                            </td>

                            {/* Delete Column */}
                            <td className="text-center py-2.5">
                              <button
                                type="button"
                                onClick={() => togglePermission(mod.key, 'delete')}
                                className={`um-check-circle ${perm.delete ? 'is-checked' : ''}`}
                                title={`Toggle Delete for ${mod.name}`}
                              >
                                {perm.delete && <Check size={14} strokeWidth={3} />}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </div>
              </div>

            </div>
          </Modal.Body>
          <Modal.Footer className={`px-4 py-3 ${isDark ? 'bg-dark border-secondary border-opacity-40' : 'bg-white border-light-subtle'}`}>
            <Button variant={isDark ? 'outline-secondary' : 'outline-dark'} onClick={() => setShowModal(false)} className="px-3.5 py-1.5 fs-7 rounded-3">
              Cancel
            </Button>
            <Button variant={isDark ? 'info' : 'primary'} type="submit" disabled={submitting} className={`${isDark ? 'text-dark' : 'text-white'} fw-bold px-4 py-1.5 fs-7 rounded-3 border-0 shadow-sm`}>
              {submitting ? <Spinner size="sm" animation="border" /> : editingUser ? 'Save Account Changes' : 'Register Employee'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}
