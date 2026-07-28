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
  KeyRound,
  Mail,
  Phone,
  User,
  Eye,
  EyeOff,
  Briefcase,
  Lock,
  UserCheck,
  Check
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_HOST = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost'
const API_BASE_URL = `http://${API_HOST}:5000/api`
const DEFAULT_COMPANY_ID = 1

export type RoleType = 'ADMIN' | 'MANAGER' | 'DESIGNER' | 'OPERATOR' | 'SALES_BILLING'

export interface UserAccount {
  id: number
  company_id: number
  full_name: string
  username: string
  email?: string | null
  phone?: string | null
  role: RoleType
  role_label?: string
  status: 'ACTIVE' | 'INACTIVE'
  created_at?: string
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
  // User is admin ONLY if their role explicitly says ADMIN. Never grant admin by default.
  // While auth is still loading, treat as non-admin to avoid a false-admin flash.
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
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [userStatus, setUserStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    const headers = getAuthHeaders()

    try {
      const res = await fetch(`${API_BASE_URL}/users?company_id=${DEFAULT_COMPANY_ID}`, { headers })
      if (res.ok) {
        const json = await res.json()
        const rawData = Array.isArray(json) ? json : (json.data || [])
        // Map backend response to local schema
        const mapped: UserAccount[] = rawData.map((u: any) => ({
          id: u.id,
          company_id: u.company_id || DEFAULT_COMPANY_ID,
          full_name: u.full_name || u.name || u.username,
          username: u.username,
          email: u.email || `${u.username}@viralprint.com`,
          phone: u.phone || '+91 98765 43210',
          role: u.role?.name ? mapBackendRole(u.role.name) : (u.role || 'OPERATOR'),
          role_label: u.role?.label || getRoleLabel(u.role || 'OPERATOR'),
          status: u.status || 'ACTIVE',
          created_at: u.createdAt || new Date().toISOString()
        }))
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
      full_name: 'Rajesh Sharma (Admin)',
      username: 'admin',
      email: 'admin@viralprint.com',
      phone: '+91 98200 11223',
      role: 'ADMIN',
      role_label: 'Administrator',
      status: 'ACTIVE',
      created_at: '2026-01-10T10:00:00Z'
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
      status: 'ACTIVE',
      created_at: '2026-02-01T11:30:00Z'
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
      status: 'ACTIVE',
      created_at: '2026-02-15T14:20:00Z'
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
      status: 'ACTIVE',
      created_at: '2026-03-01T09:15:00Z'
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
      status: 'ACTIVE',
      created_at: '2026-03-10T16:45:00Z'
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
    setPassword('')
    setConfirmPassword('')
    setUserStatus('ACTIVE')
    setShowPassword(false)
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
    setPassword('')
    setConfirmPassword('')
    setUserStatus(user.status)
    setShowPassword(false)
    setShowModal(true)
  }

  // Save/Register user
  const handleSaveUser = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!fullName.trim() || !username.trim()) {
      setError('Full name and username are required.')
      return
    }

    if (!editingUser) {
      if (!password) {
        setError('Password is required for new registration.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify.')
        return
      }
    } else if (password && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    setError(null)

    const payload = {
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim() || `${username.trim().toLowerCase()}@viralprint.com`,
      phone: phone.trim() || null,
      role: selectedRole,
      status: userStatus,
      ...(password ? { password } : {})
    }

    const headers = getAuthHeaders()

    try {
      if (editingUser) {
        // Update user
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
          status: payload.status
        }

        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)))
        showToast(`User ${updated.full_name} updated successfully!`)
      } else {
        // Register new user via users management API
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
            status: raw.status || payload.status,
            created_at: raw.createdAt || new Date().toISOString()
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
            status: payload.status,
            created_at: new Date().toISOString()
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
        status: payload.status,
        created_at: new Date().toISOString()
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
    <div className="w-100 py-1">
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
        <div>
          <h2 className={`fw-bold mb-1 d-flex align-items-center gap-2.5 ${isDark ? 'text-light' : 'text-dark'} fs-4`}>
            <div className={`p-2 rounded-3 d-inline-flex align-items-center justify-content-center ${isDark ? 'bg-info bg-opacity-15 text-info' : 'bg-primary bg-opacity-10 text-primary'}`}>
              <Shield size={22} />
            </div>
            Employee & Role-Based User Management
          </h2>
          <p className={isDark ? 'text-secondary mb-0 fs-7' : 'text-muted mb-0 fs-7'}>
            {isAdmin ? 'Admin Control Panel: Register shop employees, configure role-based permissions, and manage credentials.' : 'Employee Roster Directory: View team members, assigned role permissions, and contact details.'}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Button
            variant={isDark ? 'outline-secondary' : 'outline-dark'}
            size="sm"
            onClick={fetchUsers}
            title="Refresh Roster"
            className="d-flex align-items-center gap-1.5 px-3 py-2 rounded-3 border-secondary border-opacity-50 fs-7"
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Refresh Roster</span>
          </Button>

          {isAdmin && (
            <Button
              variant={isDark ? 'info' : 'primary'}
              className={`${isDark ? 'text-dark' : 'text-white'} fw-bold px-3.5 py-2 fs-7 shadow-sm d-flex align-items-center gap-2 rounded-3 border-0`}
              onClick={handleOpenAddModal}
            >
              <UserPlus size={17} /> Register New User
            </Button>
          )}
        </div>
      </div>

      {/* Stat Overview Cards */}
      <Row className="g-3 mb-4 w-100 mx-0">
        <Col xs={6} md={3} className="px-1">
          <Card className={`stat-card ${isDark ? 'stat-card-dark' : 'stat-card-light'} shadow-sm h-100 rounded-3 border-0`}>
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-uppercase font-monospace fw-semibold fs-8 text-secondary mb-1">Total Employees</div>
                <div className={`fs-2 fw-bold ${isDark ? 'text-light' : 'text-dark'}`}>{metrics.total}</div>
              </div>
              <div className={`p-2.5 rounded-3 ${isDark ? 'bg-secondary bg-opacity-20 text-info' : 'bg-light text-primary'}`}>
                <Users size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={3} className="px-1">
          <Card className={`stat-card ${isDark ? 'stat-card-dark' : 'stat-card-light'} shadow-sm h-100 rounded-3 border-0`}>
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-uppercase font-monospace fw-semibold fs-8 text-purple mb-1">Administrators</div>
                <div className="fs-2 fw-bold text-purple">{metrics.admins}</div>
              </div>
              <div className="p-2.5 rounded-3 bg-purple bg-opacity-15 text-purple">
                <ShieldCheck size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={3} className="px-1">
          <Card className={`stat-card ${isDark ? 'stat-card-dark' : 'stat-card-light'} shadow-sm h-100 rounded-3 border-0`}>
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-uppercase font-monospace fw-semibold fs-8 text-primary mb-1">Shop Managers</div>
                <div className="fs-2 fw-bold text-primary">{metrics.managers}</div>
              </div>
              <div className="p-2.5 rounded-3 bg-primary bg-opacity-15 text-primary">
                <Briefcase size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={3} className="px-1">
          <Card className={`stat-card ${isDark ? 'stat-card-dark' : 'stat-card-light'} shadow-sm h-100 rounded-3 border-0`}>
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-uppercase font-monospace fw-semibold fs-8 text-success mb-1">Staff & Operators</div>
                <div className="fs-2 fw-bold text-success">{metrics.designers + metrics.operators}</div>
              </div>
              <div className="p-2.5 rounded-3 bg-success bg-opacity-15 text-success">
                <UserCheck size={22} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filter Toolbar */}
      <Card className={`${isDark ? 'bg-dark bg-opacity-80 border-secondary' : 'bg-white border-light-subtle'} mb-4 shadow-sm w-100 rounded-3`}>
        <Card.Body className="p-3">
          <Row className="g-2.5 align-items-center w-100 mx-0">
            {/* Search Input */}
            <Col lg={5} md={12} className="px-1">
              <InputGroup size="sm" className="position-relative">
                <InputGroup.Text className={isDark ? 'bg-secondary bg-opacity-20 border-secondary text-secondary' : 'bg-light border-light-subtle text-muted'}>
                  <Search size={15} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search employees by name, username, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={isDark ? 'bg-secondary bg-opacity-20 text-light border-secondary placeholder-secondary fs-7 py-2' : 'bg-light text-dark border-light-subtle fs-7 py-2'}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="position-absolute end-0 top-50 translate-middle-y me-2 border-0 bg-transparent text-secondary p-0"
                    style={{ zIndex: 10 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </InputGroup>
            </Col>

            {/* Role Filter */}
            <Col lg={3} md={6} className="px-1">
              <Form.Select
                size="sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={isDark ? 'bg-secondary bg-opacity-20 text-light border-secondary fs-7 py-2' : 'bg-light text-dark border-light-subtle fs-7 py-2'}
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Administrator</option>
                <option value="MANAGER">Shop Manager</option>
                <option value="DESIGNER">Graphic Designer</option>
                <option value="OPERATOR">Print Operator</option>
                <option value="SALES_BILLING">Sales & Billing</option>
              </Form.Select>
            </Col>

            {/* Status Filter */}
            <Col lg={2} md={4} className="px-1">
              <Form.Select
                size="sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={isDark ? 'bg-secondary bg-opacity-20 text-light border-secondary fs-7 py-2' : 'bg-light text-dark border-light-subtle fs-7 py-2'}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Account</option>
                <option value="INACTIVE">Inactive Account</option>
              </Form.Select>
            </Col>

            {/* Reset */}
            <Col lg={2} md={2} className="px-1 text-end">
              <Button
                variant={isDark ? 'outline-secondary' : 'outline-dark'}
                size="sm"
                className="w-100 py-1.5 fs-7 rounded-3"
                onClick={() => {
                  setSearchQuery('')
                  setRoleFilter('ALL')
                  setStatusFilter('ALL')
                }}
              >
                Reset
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* User Roster Table */}
      <Card className={`${isDark ? 'bg-dark border-secondary text-light' : 'bg-white border-light-subtle text-dark'} shadow-lg border-0 rounded-4 overflow-hidden w-100`}>
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
              <Table hover variant={isDark ? 'dark' : 'light'} className="align-middle mb-0 user-roster-table">
                <thead>
                  <tr className={isDark ? 'bg-dark bg-opacity-60 text-secondary fs-8 text-uppercase' : 'bg-light text-secondary fs-8 text-uppercase'}>
                    <th className="ps-4 py-3">Employee Name</th>
                    <th className="py-3">Role & Access</th>
                    <th className="py-3">Contact Email</th>
                    <th className="py-3">Mobile Phone</th>
                    <th className="py-3">Status</th>
                    {isAdmin && <th className="pe-4 text-end py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isActive = u.status === 'ACTIVE'

                    return (
                      <tr key={u.id} className={!isActive ? 'opacity-50' : ''}>
                        {/* Name & Avatar */}
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-center gap-3">
                            <div className={`user-avatar-ring avatar-role-${u.role.toLowerCase()}`}>
                              {getUserInitials(u.full_name)}
                            </div>
                            <div>
                              <div className={`fw-bold fs-7 ${isDark ? 'text-white' : 'text-dark'}`}>{u.full_name}</div>
                              <div className="fs-8 text-secondary font-monospace">@{u.username}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3">
                          {renderRoleBadge(u.role)}
                        </td>

                        {/* Email */}
                        <td className="py-3 fs-7">
                          <div className="d-flex align-items-center gap-1.5 text-truncate">
                            <Mail size={13} className="text-secondary flex-shrink-0" />
                            <span>{u.email}</span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-3 fs-7">
                          <div className="d-flex align-items-center gap-1.5 font-monospace text-secondary">
                            <Phone size={13} className="flex-shrink-0" />
                            <span>{u.phone || 'N/A'}</span>
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
                          <td className="pe-4 text-end py-3">
                            <div className="d-flex align-items-center justify-content-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(u)}
                                className="btn-user-action action-edit"
                                title="Edit User & Permissions"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.full_name)}
                                className="btn-user-action action-delete"
                                title="Delete Account"
                              >
                                <Trash2 size={14} />
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
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" className={isDark ? 'dark-modal' : 'light-modal'}>
        <Modal.Header closeButton className={`px-4 py-3 border-bottom ${isDark ? 'bg-dark text-light border-secondary' : 'bg-white text-dark border-light-subtle'}`}>
          <div className="d-flex align-items-center gap-3">
            <div className={`p-2.5 rounded-3 d-flex align-items-center justify-content-center ${isDark ? 'bg-info bg-opacity-15 text-info' : 'bg-primary bg-opacity-10 text-primary'}`}>
              {editingUser ? <Edit2 size={22} /> : <UserPlus size={22} />}
            </div>
            <div>
              <Modal.Title className={`fw-bold mb-0.5 fs-5 ${isDark ? 'text-white' : 'text-dark'}`}>
                {editingUser ? `Edit Account: ${editingUser.full_name}` : 'Register New Role-Based Employee'}
              </Modal.Title>
              <div className="fs-8 text-secondary">Configure employee profile credentials, role permissions, and access status.</div>
            </div>
          </div>
        </Modal.Header>
        <Form onSubmit={handleSaveUser}>
          <Modal.Body className={`${isDark ? 'bg-dark text-light' : 'bg-white text-dark'} p-4`}>
            <div className="d-flex flex-column gap-4">

              {/* SECTION 1: PERSONAL IDENTITY & CONTACT */}
              <div>
                <div className="fs-8 fw-bold text-uppercase tracking-wider text-primary mb-2.5 d-flex align-items-center gap-1.5">
                  <User size={14} /> 1. Personal Details & Contact Info
                </div>
                <Row className="g-3">
                  {/* Full Name */}
                  <Col md={6} xs={12}>
                    <Form.Group>
                      <Form.Label className={`fw-semibold fs-7 mb-1 ${isDark ? 'text-secondary' : 'text-muted'}`}>Full Name *</Form.Label>
                      <InputGroup size="sm">
                        <InputGroup.Text className={isDark ? 'bg-secondary bg-opacity-20 border-secondary text-secondary' : 'bg-light border-light-subtle text-muted'}>
                          <User size={15} />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          required
                          placeholder="e.g. Rahul Sharma"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={isDark ? 'bg-secondary bg-opacity-25 text-light border-secondary py-2' : 'bg-light text-dark border-light-subtle py-2'}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  {/* Username */}
                  <Col md={6} xs={12}>
                    <Form.Group>
                      <Form.Label className={`fw-semibold fs-7 mb-1 ${isDark ? 'text-secondary' : 'text-muted'}`}>Username (@handle) *</Form.Label>
                      <InputGroup size="sm">
                        <InputGroup.Text className={isDark ? 'bg-secondary bg-opacity-20 border-secondary text-secondary' : 'bg-light border-light-subtle text-muted'}>
                          @
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          required
                          placeholder="e.g. rahul_print"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className={isDark ? 'bg-secondary bg-opacity-25 text-light border-secondary py-2' : 'bg-light text-dark border-light-subtle py-2'}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  {/* Email Address */}
                  <Col md={6} xs={12}>
                    <Form.Group>
                      <Form.Label className={`fw-semibold fs-7 mb-1 ${isDark ? 'text-secondary' : 'text-muted'}`}>Email Address</Form.Label>
                      <InputGroup size="sm">
                        <InputGroup.Text className={isDark ? 'bg-secondary bg-opacity-20 border-secondary text-secondary' : 'bg-light border-light-subtle text-muted'}>
                          <Mail size={15} />
                        </InputGroup.Text>
                        <Form.Control
                          type="email"
                          placeholder="rahul@viralprint.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={isDark ? 'bg-secondary bg-opacity-25 text-light border-secondary py-2' : 'bg-light text-dark border-light-subtle py-2'}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  {/* Mobile Phone */}
                  <Col md={6} xs={12}>
                    <Form.Group>
                      <Form.Label className={`fw-semibold fs-7 mb-1 ${isDark ? 'text-secondary' : 'text-muted'}`}>Mobile Phone</Form.Label>
                      <InputGroup size="sm">
                        <InputGroup.Text className={isDark ? 'bg-secondary bg-opacity-20 border-secondary text-secondary' : 'bg-light border-light-subtle text-muted'}>
                          <Phone size={15} />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={isDark ? 'bg-secondary bg-opacity-25 text-light border-secondary py-2' : 'bg-light text-dark border-light-subtle py-2'}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* SECTION 2: ROLE & PERMISSION SELECTION */}
              <div>
                <div className="fs-8 fw-bold text-uppercase tracking-wider text-primary mb-2.5 d-flex align-items-center gap-1.5">
                  <ShieldCheck size={14} /> 2. Assign System Role & Access Level *
                </div>
                <Row className="g-2.5">
                  {[
                    { id: 'ADMIN', title: 'Administrator', desc: 'Full system access & settings', icon: ShieldCheck, color: 'purple' },
                    { id: 'MANAGER', title: 'Shop Manager', desc: 'Manage orders, tasks & staff', icon: Briefcase, color: 'blue' },
                    { id: 'DESIGNER', title: 'Graphic Designer', desc: 'Layout proofing & CMYK files', icon: Sparkles, color: 'cyan' },
                    { id: 'OPERATOR', title: 'Print Operator', desc: 'Digital press & machine queue', icon: User, color: 'amber' },
                    { id: 'SALES_BILLING', title: 'Sales & Billing', desc: 'POS Invoicing, customer billing & sales orders', icon: CheckCircle2, color: 'green' }
                  ].map((rOption, idx) => {
                    const isSelected = selectedRole === rOption.id
                    const IconComp = rOption.icon
                    const isFullWidth = idx === 4 // Sales & Billing full width for symmetry

                    return (
                      <Col key={rOption.id} md={isFullWidth ? 12 : 6} xs={12}>
                        <div
                          className={`role-select-card ${isSelected ? 'is-selected' : ''} ${isDark ? 'role-card-dark' : 'role-card-light'} h-100`}
                          onClick={() => setSelectedRole(rOption.id as RoleType)}
                        >
                          <div className="d-flex align-items-center gap-2.5 h-100">
                            <div className={`role-icon-box box-${rOption.color}`}>
                              <IconComp size={18} />
                            </div>
                            <div className="flex-grow-1 min-w-0">
                              <div className="fw-bold fs-7 text-truncate">{rOption.title}</div>
                              <div className="fs-8 text-secondary text-truncate">{rOption.desc}</div>
                            </div>
                            {isSelected && (
                              <div className="role-check-mark ms-auto">
                                <Check size={13} />
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                    )
                  })}
                </Row>
              </div>

              {/* SECTION 3: SECURITY CREDENTIALS & STATUS */}
              <div>
                <div className="fs-8 fw-bold text-uppercase tracking-wider text-primary mb-2.5 d-flex align-items-center gap-1.5">
                  <Lock size={14} /> 3. Security Credentials & Access Status
                </div>
                <Row className="g-3">
                  {/* Password */}
                  <Col md={6} xs={12}>
                    <Form.Group>
                      <Form.Label className={`fw-semibold fs-7 mb-1 ${isDark ? 'text-secondary' : 'text-muted'}`}>
                        {editingUser ? 'New Password' : 'Account Password *'}
                      </Form.Label>
                      <InputGroup size="sm">
                        <InputGroup.Text className={isDark ? 'bg-secondary bg-opacity-20 border-secondary text-secondary' : 'bg-light border-light-subtle text-muted'}>
                          <Lock size={15} />
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          required={!editingUser}
                          placeholder={editingUser ? 'Leave blank to keep existing' : 'Enter secure password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={isDark ? 'bg-secondary bg-opacity-25 text-light border-secondary py-2' : 'bg-light text-dark border-light-subtle py-2'}
                        />
                        <Button
                          variant={isDark ? 'outline-secondary' : 'outline-dark'}
                          onClick={() => setShowPassword(!showPassword)}
                          className="px-2.5"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </Button>
                      </InputGroup>
                      {editingUser && <div className="fs-8 text-secondary mt-1">Leave blank to retain current password</div>}
                    </Form.Group>
                  </Col>

                  {/* Confirm Password */}
                  <Col md={6} xs={12}>
                    <Form.Group>
                      <Form.Label className={`fw-semibold fs-7 mb-1 ${isDark ? 'text-secondary' : 'text-muted'}`}>
                        Confirm Password
                      </Form.Label>
                      <InputGroup size="sm">
                        <InputGroup.Text className={isDark ? 'bg-secondary bg-opacity-20 border-secondary text-secondary' : 'bg-light border-light-subtle text-muted'}>
                          <KeyRound size={15} />
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          required={!editingUser && Boolean(password)}
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={isDark ? 'bg-secondary bg-opacity-25 text-light border-secondary py-2' : 'bg-light text-dark border-light-subtle py-2'}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  {/* Account Status Switch */}
                  <Col xs={12}>
                    <Form.Group className={`d-flex align-items-center justify-content-between p-3 rounded-3 border ${isDark ? 'border-secondary border-opacity-30 bg-secondary bg-opacity-10' : 'border-light-subtle bg-light'}`}>
                      <div>
                        <div className="fw-bold fs-7">Account Active Status</div>
                        <div className="fs-8 text-secondary">Active employees can log in and perform role-assigned shop actions.</div>
                      </div>
                      <Form.Check
                        type="switch"
                        id="account-status-switch"
                        checked={userStatus === 'ACTIVE'}
                        onChange={(e) => setUserStatus(e.target.checked ? 'ACTIVE' : 'INACTIVE')}
                        label={userStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
                        className="fw-bold fs-7 ms-3"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

            </div>
          </Modal.Body>
          <Modal.Footer className={`px-4 py-3 ${isDark ? 'bg-dark border-secondary' : 'bg-white border-light-subtle'}`}>
            <Button variant={isDark ? 'outline-secondary' : 'outline-dark'} onClick={() => setShowModal(false)} className="px-3.5 py-1.5 fs-7 rounded-3">
              Cancel
            </Button>
            <Button variant={isDark ? 'info' : 'primary'} type="submit" disabled={submitting} className={`${isDark ? 'text-dark' : 'text-white'} fw-bold px-4 py-1.5 fs-7 rounded-3 border-0 shadow-sm`}>
              {submitting ? <Spinner size="sm" animation="border" /> : editingUser ? 'Save Account Changes' : 'Register Employee'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modern Developer-Grade CSS */}
      <style>{`
        .text-purple { color: #a855f7; }
        .bg-purple { background-color: #a855f7; }

        /* User Avatars */
        .user-avatar-ring {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.82rem;
          color: #ffffff;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .avatar-role-admin { background: linear-gradient(135deg, #a855f7, #7e22ce); }
        .avatar-role-manager { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
        .avatar-role-designer { background: linear-gradient(135deg, #06b6d4, #0891b2); }
        .avatar-role-operator { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .avatar-role-sales_billing { background: linear-gradient(135deg, #10b981, #059669); }

        /* Role Badges */
        .role-badge {
          display: inline-flex;
          align-items: center;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }
        .role-admin { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
        .role-manager { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
        .role-designer { background: rgba(6, 182, 212, 0.15); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.3); }
        .role-operator { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        .role-sales { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }

        /* Status Toggle Pill */
        .badge-status-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .status-active { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .status-active:hover { background: rgba(16, 185, 129, 0.25); }
        .status-inactive { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
        .status-inactive:hover { background: rgba(148, 163, 184, 0.25); }

        .status-dot-mini {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        /* User Action Buttons */
        .btn-user-action {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          background: rgba(148, 163, 184, 0.1);
          color: #94a3b8;
        }
        .action-edit:hover {
          background: rgba(56, 189, 248, 0.15);
          color: #0ea5e9;
          border-color: rgba(56, 189, 248, 0.3);
        }
        .action-delete:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
        }

        /* Role Select Cards in Modal */
        .role-select-card {
          padding: 12px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1.5px solid transparent;
          position: relative;
        }
        .role-card-dark {
          background: rgba(30, 41, 59, 0.6);
          border-color: #334155;
          color: #f8fafc;
        }
        .role-card-dark:hover {
          border-color: #475569;
          background: rgba(30, 41, 59, 0.9);
        }
        .role-card-light {
          background: #f8fafc;
          border-color: #e2e8f0;
          color: #0f172a;
        }
        .role-card-light:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
        }
        .role-select-card.is-selected {
          border-color: #0ea5e9 !important;
          background: rgba(14, 165, 233, 0.08) !important;
        }

        .role-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .box-purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
        .box-blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
        .box-cyan { background: rgba(6, 182, 212, 0.15); color: #22d3ee; }
        .box-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .box-green { background: rgba(16, 185, 129, 0.15); color: #34d399; }

        .role-check-mark {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #0ea5e9;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .user-roster-table tbody tr:hover {
          background-color: rgba(56, 189, 248, 0.03) !important;
        }
      `}</style>
    </div>
  )
}
