import React, { useState, useEffect, useMemo } from 'react'
import {
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  InputGroup,
  Dropdown,
  Spinner,
  Alert
} from 'react-bootstrap'
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  Plus,
  Search,
  User as UserIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Edit2,
  Trash2,
  UserCheck,
  CalendarDays,
  Sparkles,
  RefreshCw,
  X,
  ChevronDown
} from 'lucide-react'

const API_HOST = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost'
const API_BASE_URL = `http://${API_HOST}:5000/api`
const DEFAULT_COMPANY_ID = 1

export interface UserEmployee {
  id: number
  name?: string
  full_name?: string
  username: string
  role?: {
    id: number
    name: string
    label?: string
  }
}

export interface TaskItem {
  id: number
  company_id: number
  title: string
  description?: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  start_date?: string | null
  due_date?: string | null
  assigned_to_id?: number | null
  assigned_to?: UserEmployee | null
  created_by_id?: number | null
  created_by?: UserEmployee | null
  createdAt?: string
  updatedAt?: string
}

interface TaskManagementProps {
  theme?: 'dark' | 'light'
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('vpm_auth_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

export const getDisplayName = (user?: UserEmployee | null): string => {
  if (!user) return 'Unassigned'
  return user.full_name || user.name || user.username
}

export const getUserInitials = (name?: string): string => {
  if (!name || name === 'Unassigned') return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return ''
  const cleanStr = dateStr.split('T')[0]
  const parts = cleanStr.split('-')
  if (parts.length !== 3) return cleanStr
  const [y, m, d] = parts
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthIdx = parseInt(m, 10) - 1
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${monthNames[monthIdx]} ${parseInt(d, 10)}, ${y}`
  }
  return cleanStr
}

export default function TaskManagement({ theme = 'dark' }: TaskManagementProps): React.JSX.Element {
  const isDark = theme === 'dark'
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [users, setUsers] = useState<UserEmployee[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // View state: 'list' | 'calendar'
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL')

  // Calendar Date Navigation
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date())

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null)

  // Form State
  const [formTitle, setFormTitle] = useState<string>('')
  const [formDescription, setFormDescription] = useState<string>('')
  const [formPriority, setFormPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [formStatus, setFormStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('PENDING')
  const [formAssignedTo, setFormAssignedTo] = useState<string>('')
  const [formStartDate, setFormStartDate] = useState<string>('')
  const [formDueDate, setFormDueDate] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Fetch tasks and users on mount
  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    const headers = getAuthHeaders()

    try {
      // Fetch users
      const usersRes = await fetch(`${API_BASE_URL}/users?company_id=${DEFAULT_COMPANY_ID}`, { headers })
      if (usersRes.ok) {
        const usersJson = await usersRes.json()
        const usersData = Array.isArray(usersJson) ? usersJson : (usersJson.data || [])
        setUsers(usersData)
      } else {
        setUsers([
          { id: 1, full_name: 'System Administrator', username: 'admin' },
          { id: 2, full_name: 'Rahul Sharma', username: 'rahul' },
          { id: 3, full_name: 'Priya Patel', username: 'priya' },
          { id: 4, full_name: 'Amit Kumar', username: 'amit' }
        ])
      }

      // Fetch tasks
      const tasksRes = await fetch(`${API_BASE_URL}/tasks?company_id=${DEFAULT_COMPANY_ID}`, { headers })
      if (tasksRes.ok) {
        const tasksJson = await tasksRes.json()
        const tasksData = Array.isArray(tasksJson) ? tasksJson : (tasksJson.data || [])
        setTasks(tasksData)
      } else {
        setTasks(getSampleTasks())
      }
    } catch (err) {
      console.warn('API connection check fallback:', err)
      setTasks(getSampleTasks())
      setUsers([
        { id: 1, full_name: 'System Administrator', username: 'admin' },
        { id: 2, full_name: 'Rahul Sharma', username: 'rahul' },
        { id: 3, full_name: 'Priya Patel', username: 'priya' },
        { id: 4, full_name: 'Amit Kumar', username: 'amit' }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Sample tasks for fallback
  const getSampleTasks = (): TaskItem[] => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 5)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 2)

    return [
      {
        id: 101,
        company_id: DEFAULT_COMPANY_ID,
        title: 'Design Brochure for Royal Sweets Print Order',
        description: 'Prepare high-resolution CMYK brochure layout for client approval.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        start_date: today.toISOString().split('T')[0],
        due_date: tomorrow.toISOString().split('T')[0],
        assigned_to_id: 2,
        assigned_to: { id: 2, full_name: 'Rahul Sharma', username: 'rahul' }
      },
      {
        id: 102,
        company_id: DEFAULT_COMPANY_ID,
        title: 'Calibrate Digital Press Machine #2',
        description: 'Perform color test calibration and update firmware settings.',
        status: 'PENDING',
        priority: 'URGENT',
        start_date: today.toISOString().split('T')[0],
        due_date: today.toISOString().split('T')[0],
        assigned_to_id: 3,
        assigned_to: { id: 3, full_name: 'Priya Patel', username: 'priya' }
      },
      {
        id: 103,
        company_id: DEFAULT_COMPANY_ID,
        title: 'Deliver Vinyl Banners to Apex Mall',
        description: 'Verify package count, dispatch courier, and obtain signed proof of delivery.',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        start_date: yesterday.toISOString().split('T')[0],
        due_date: yesterday.toISOString().split('T')[0],
        assigned_to_id: 4,
        assigned_to: { id: 4, full_name: 'Amit Kumar', username: 'amit' }
      },
      {
        id: 104,
        company_id: DEFAULT_COMPANY_ID,
        title: 'Order Glossy Paper Stock (300 GSM)',
        description: 'Procure 500 sheets of premium cardstock from Star Paper Supplies.',
        status: 'PENDING',
        priority: 'LOW',
        start_date: today.toISOString().split('T')[0],
        due_date: nextWeek.toISOString().split('T')[0],
        assigned_to_id: null,
        assigned_to: null
      }
    ]
  }

  // Trigger flash message
  const showToast = (msg: string): void => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3500)
  }

  // Open modal for creating task
  const handleOpenAddModal = (initialDate?: string): void => {
    setEditingTask(null)
    setFormTitle('')
    setFormDescription('')
    setFormPriority('MEDIUM')
    setFormStatus('PENDING')
    setFormAssignedTo('')
    setFormStartDate(new Date().toISOString().split('T')[0])
    setFormDueDate(initialDate || new Date().toISOString().split('T')[0])
    setShowModal(true)
  }

  // Open modal for editing task
  const handleOpenEditModal = (task: TaskItem): void => {
    setEditingTask(task)
    setFormTitle(task.title)
    setFormDescription(task.description || '')
    setFormPriority(task.priority)
    setFormStatus(task.status)
    setFormAssignedTo(task.assigned_to_id ? String(task.assigned_to_id) : '')
    setFormStartDate(task.start_date ? task.start_date.split('T')[0] : '')
    setFormDueDate(task.due_date ? task.due_date.split('T')[0] : '')
    setShowModal(true)
  }

  // Handle Create or Update submission
  const handleSaveTask = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!formTitle.trim()) {
      setError('Task title is required.')
      return
    }

    setSubmitting(true)
    setError(null)

    const payload = {
      company_id: DEFAULT_COMPANY_ID,
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      priority: formPriority,
      status: formStatus,
      start_date: formStartDate || null,
      due_date: formDueDate || null,
      assigned_to_id: formAssignedTo ? Number(formAssignedTo) : null
    }

    const headers = getAuthHeaders()

    try {
      let updatedTask: TaskItem

      if (editingTask) {
        // PUT update
        const res = await fetch(`${API_BASE_URL}/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        })

        if (res.ok) {
          const resJson = await res.json()
          updatedTask = resJson.data || resJson
        } else {
          const assignedUser = users.find((u) => u.id === Number(formAssignedTo)) || null
          updatedTask = {
            ...editingTask,
            ...payload,
            assigned_to: assignedUser
          }
        }

        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updatedTask : t)))
        showToast(`Task "${updatedTask.title}" updated successfully!`)
      } else {
        // POST create
        const res = await fetch(`${API_BASE_URL}/tasks`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        })

        if (res.ok) {
          const resJson = await res.json()
          updatedTask = resJson.data || resJson
        } else {
          const assignedUser = users.find((u) => u.id === Number(formAssignedTo)) || null
          updatedTask = {
            id: Date.now(),
            ...payload,
            assigned_to: assignedUser
          }
        }

        setTasks((prev) => [updatedTask, ...prev])
        showToast(`Task "${updatedTask.title}" created successfully!`)
      }

      setShowModal(false)
    } catch (err) {
      console.error('Error saving task:', err)
      const assignedUser = users.find((u) => u.id === Number(formAssignedTo)) || null
      if (editingTask) {
        const fallback = { ...editingTask, ...payload, assigned_to: assignedUser }
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? fallback : t)))
        showToast(`Task "${formTitle}" updated locally.`)
      } else {
        const fallback: TaskItem = { id: Date.now(), ...payload, assigned_to: assignedUser }
        setTasks((prev) => [fallback, ...prev])
        showToast(`Task "${formTitle}" created locally.`)
      }
      setShowModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  // Quick toggle completion status
  const handleToggleStatus = async (task: TaskItem): Promise<void> => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)))

    try {
      await fetch(`${API_BASE_URL}/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      })
    } catch (err) {
      console.warn('Network error on status update:', err)
    }
  }

  // Quick status selection dropdown
  const handleChangeStatus = async (task: TaskItem, newStatus: TaskItem['status']): Promise<void> => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)))

    try {
      await fetch(`${API_BASE_URL}/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      })
    } catch (err) {
      console.warn('Network error on status update:', err)
    }
  }

  // Delete task
  const handleDeleteTask = async (taskId: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this task?')) return

    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    showToast('Task deleted successfully.')

    try {
      await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
    } catch (err) {
      console.warn('Network error on task delete:', err)
    }
  }

  // Filtered Tasks Calculation
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase()
        const matchTitle = t.title.toLowerCase().includes(q)
        const matchDesc = t.description ? t.description.toLowerCase().includes(q) : false
        if (!matchTitle && !matchDesc) return false
      }

      // Status
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false

      // Priority
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false

      // Assignee
      if (assigneeFilter !== 'ALL') {
        if (assigneeFilter === 'UNASSIGNED' && t.assigned_to_id !== null && t.assigned_to_id !== undefined) return false
        if (assigneeFilter !== 'UNASSIGNED' && t.assigned_to_id !== Number(assigneeFilter)) return false
      }

      return true
    })
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter])

  // Metric counts
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    let total = tasks.length
    let pending = 0
    let inProgress = 0
    let completed = 0
    let overdue = 0

    tasks.forEach((t) => {
      if (t.status === 'PENDING') pending++
      else if (t.status === 'IN_PROGRESS') inProgress++
      else if (t.status === 'COMPLETED') completed++

      if (t.status !== 'COMPLETED' && t.due_date) {
        const dueDateStr = t.due_date.split('T')[0]
        if (dueDateStr < todayStr) overdue++
      }
    })

    return { total, pending, inProgress, completed, overdue }
  }, [tasks])

  // Calendar Helpers
  const year = currentCalendarDate.getFullYear()
  const month = currentCalendarDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalGridSlots = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7
  const trailingEmptyCount = totalGridSlots - (firstDayOfMonth + daysInMonth)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const handlePrevMonth = (): void => {
    setCurrentCalendarDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = (): void => {
    setCurrentCalendarDate(new Date(year, month + 1, 1))
  }

  const handleToday = (): void => {
    setCurrentCalendarDate(new Date())
  }

  // Monthly task metrics for Calendar Header
  const monthMetrics = useMemo(() => {
    let monthTotal = 0
    let completed = 0
    let inProgress = 0
    let pending = 0

    filteredTasks.forEach((t) => {
      const dStr = t.due_date || t.start_date
      if (!dStr) return
      const tDate = new Date(dStr)
      if (tDate.getFullYear() === year && tDate.getMonth() === month) {
        monthTotal++
        if (t.status === 'COMPLETED') completed++
        else if (t.status === 'IN_PROGRESS') inProgress++
        else if (t.status === 'PENDING') pending++
      }
    })

    return { monthTotal, completed, inProgress, pending }
  }, [filteredTasks, year, month])

  // Priority styling badges - Refined, soft SaaS aesthetic
  const renderPriorityBadge = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="saas-badge badge-urgent">
            <span className="badge-dot dot-urgent" /> Urgent
          </span>
        )
      case 'HIGH':
        return (
          <span className="saas-badge badge-high">
            <span className="badge-dot dot-high" /> High
          </span>
        )
      case 'MEDIUM':
        return (
          <span className="saas-badge badge-medium">
            <span className="badge-dot dot-medium" /> Medium
          </span>
        )
      case 'LOW':
        return (
          <span className="saas-badge badge-low">
            <span className="badge-dot dot-low" /> Low
          </span>
        )
    }
  }

  // Status styling badges - Refined with icons
  const renderStatusBadge = (status: TaskItem['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="saas-badge badge-done">
            <CheckCircle2 size={12} className="text-success" /> Done
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="saas-badge badge-progress">
            <Clock size={12} className="text-primary" /> In Progress
          </span>
        )
      case 'PENDING':
        return (
          <span className="saas-badge badge-pending">
            <AlertCircle size={12} className="text-warning" /> Pending
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="saas-badge badge-cancelled">
            <XCircle size={12} className="text-secondary" /> Cancelled
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

      {/* Header & Main Controls */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3 w-100">
        <div>
          <h2 className={`fw-bold mb-0.5 d-flex align-items-center gap-2.5 ${isDark ? 'text-light' : 'text-dark'} fs-4`}>
            <div className={`p-1.5 rounded-3 d-inline-flex align-items-center justify-content-center ${isDark ? 'bg-info bg-opacity-15 text-info' : 'bg-primary bg-opacity-10 text-primary'}`}>
              <CalendarDays size={20} />
            </div>
            To-Do & Task Management
          </h2>
          <p className={isDark ? 'text-secondary mb-0 fs-7' : 'text-muted mb-0 fs-7'}>
            Organize print shop orders, assign employees, track status, and view calendar schedule in real-time.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Button
            variant={isDark ? 'outline-secondary' : 'outline-dark'}
            size="sm"
            onClick={fetchInitialData}
            title="Refresh Tasks"
            className="d-flex align-items-center gap-1.5 px-2.5 py-1.5 rounded-3 border-secondary border-opacity-50 fs-7"
          >
            <RefreshCw size={13} className={loading ? 'spin-icon' : ''} />
            <span className="d-none d-sm-inline font-medium">Refresh</span>
          </Button>

          {/* View Mode Switcher */}
          <div className={`btn-group ${isDark ? 'bg-dark bg-opacity-90 border-secondary' : 'bg-white border-light-subtle'} border p-1 rounded-3 shadow-sm`}>
            <Button
              variant={viewMode === 'list' ? (isDark ? 'info' : 'primary') : (isDark ? 'dark' : 'light')}
              size="sm"
              className={viewMode === 'list' ? (isDark ? 'text-dark fw-bold px-3 py-1 fs-7' : 'text-white fw-bold px-3 py-1 fs-7') : (isDark ? 'text-secondary border-0 px-3 py-1 fs-7' : 'text-dark border-0 px-3 py-1 fs-7')}
              onClick={() => setViewMode('list')}
            >
              <ListIcon size={14} className="me-1.5 d-inline" /> List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? (isDark ? 'info' : 'primary') : (isDark ? 'dark' : 'light')}
              size="sm"
              className={viewMode === 'calendar' ? (isDark ? 'text-dark fw-bold px-3 py-1 fs-7' : 'text-white fw-bold px-3 py-1 fs-7') : (isDark ? 'text-secondary border-0 px-3 py-1 fs-7' : 'text-dark border-0 px-3 py-1 fs-7')}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon size={14} className="me-1.5 d-inline" /> Calendar
            </Button>
          </div>

          <Button
            variant={isDark ? 'info' : 'primary'}
            className={`${isDark ? 'text-dark' : 'text-white'} fw-bold px-3 py-1.5 fs-7 shadow-sm d-flex align-items-center gap-1.5 rounded-3 border-0`}
            onClick={() => handleOpenAddModal()}
          >
            <Plus size={16} /> Add Task
          </Button>
        </div>
      </div>

      {/* Conditionally Render Stat Cards & Filters ONLY in List View */}
      {viewMode === 'list' && (
        <>
          {/* Summary Stat Cards */}
          <Row className="g-3 mb-4 w-100 mx-0">
            <Col xs={6} md={2.4} className="col-12 col-sm-6 col-md-4 col-lg-2.4 flex-grow-1 px-1">
              <Card className={`stat-card ${isDark ? 'stat-card-dark' : 'stat-card-light'} shadow-sm h-100 rounded-3 border-0`}>
                <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-uppercase font-monospace fw-semibold fs-8 text-secondary mb-1">Total Tasks</div>
                    <div className={`fs-2 fw-bold ${isDark ? 'text-light' : 'text-dark'}`}>{metrics.total}</div>
                  </div>
                  <div className={`p-2.5 rounded-3 ${isDark ? 'bg-secondary bg-opacity-20 text-info' : 'bg-light text-primary'}`}>
                    <CalendarDays size={22} />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={6} md={2.4} className="col-12 col-sm-6 col-md-4 col-lg-2.4 flex-grow-1 px-1">
              <Card className={`stat-card ${isDark ? 'stat-card-dark' : 'stat-card-light'} shadow-sm h-100 rounded-3 border-0`}>
                <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-uppercase font-monospace fw-semibold fs-8 text-warning mb-1">Pending</div>
                    <div className="fs-2 fw-bold text-warning">{metrics.pending}</div>
                  </div>
                  <div className="p-2.5 rounded-3 bg-warning bg-opacity-15 text-warning">
                    <AlertCircle size={22} />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={6} md={2.4} className="col-12 col-sm-6 col-md-4 col-lg-2.4 flex-grow-1 px-1">
              <Card className={`stat-card ${isDark ? 'stat-card-dark' : 'stat-card-light'} shadow-sm h-100 rounded-3 border-0`}>
                <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-uppercase font-monospace fw-semibold fs-8 text-primary mb-1">In Progress</div>
                    <div className="fs-2 fw-bold text-primary">{metrics.inProgress}</div>
                  </div>
                  <div className="p-2.5 rounded-3 bg-primary bg-opacity-15 text-primary">
                    <Clock size={22} />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={6} md={2.4} className="col-12 col-sm-6 col-md-4 col-lg-2.4 flex-grow-1 px-1">
              <Card className={`stat-card ${isDark ? 'stat-card-dark' : 'stat-card-light'} shadow-sm h-100 rounded-3 border-0`}>
                <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-uppercase font-monospace fw-semibold fs-8 text-success mb-1">Completed</div>
                    <div className="fs-2 fw-bold text-success">{metrics.completed}</div>
                  </div>
                  <div className="p-2.5 rounded-3 bg-success bg-opacity-15 text-success">
                    <CheckCircle2 size={22} />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={6} md={2.4} className="col-12 col-sm-6 col-md-4 col-lg-2.4 flex-grow-1 px-1">
              <Card className={`stat-card ${isDark ? 'stat-card-dark' : 'stat-card-light'} shadow-sm h-100 rounded-3 border-0`}>
                <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-uppercase font-monospace fw-semibold fs-8 text-danger mb-1">Overdue</div>
                    <div className="fs-2 fw-bold text-danger">{metrics.overdue}</div>
                  </div>
                  <div className="p-2.5 rounded-3 bg-danger bg-opacity-15 text-danger">
                    <AlertCircle size={22} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Filters Toolbar */}
          <Card className={`${isDark ? 'bg-dark bg-opacity-80 border-secondary' : 'bg-white border-light-subtle'} mb-4 shadow-sm w-100 rounded-3`}>
            <Card.Body className="p-3">
              <Row className="g-2.5 align-items-center w-100 mx-0">
                {/* Search Input */}
                <Col lg={4} md={12} className="px-1">
                  <InputGroup size="sm" className="position-relative">
                    <InputGroup.Text className={isDark ? 'bg-secondary bg-opacity-20 border-secondary text-secondary' : 'bg-light border-light-subtle text-muted'}>
                      <Search size={15} />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Search tasks by title or description..."
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
                        title="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </InputGroup>
                </Col>

                {/* Status Filter */}
                <Col lg={2} md={4} xs={6} className="px-1">
                  <Form.Select
                    size="sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={isDark ? 'bg-secondary bg-opacity-20 text-light border-secondary fs-7 py-2' : 'bg-light text-dark border-light-subtle fs-7 py-2'}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Form.Select>
                </Col>

                {/* Priority Filter */}
                <Col lg={2} md={4} xs={6} className="px-1">
                  <Form.Select
                    size="sm"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className={isDark ? 'bg-secondary bg-opacity-20 text-light border-secondary fs-7 py-2' : 'bg-light text-dark border-light-subtle fs-7 py-2'}
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </Form.Select>
                </Col>

                {/* Assignee Filter */}
                <Col lg={3} md={4} xs={12} className="px-1">
                  <Form.Select
                    size="sm"
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className={isDark ? 'bg-secondary bg-opacity-20 text-light border-secondary fs-7 py-2' : 'bg-light text-dark border-light-subtle fs-7 py-2'}
                  >
                    <option value="ALL">All Employees / Assignees</option>
                    <option value="UNASSIGNED">Unassigned Tasks</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {getDisplayName(u)} (@{u.username})
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                {/* Reset Filters */}
                <Col lg={1} md={12} className="px-1 text-end">
                  <Button
                    variant={isDark ? 'outline-secondary' : 'outline-dark'}
                    size="sm"
                    className="w-100 py-1.5 fs-7 rounded-3"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('ALL')
                      setPriorityFilter('ALL')
                      setAssigneeFilter('ALL')
                    }}
                  >
                    Reset
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant={isDark ? 'info' : 'primary'} />
          <p className="text-secondary mt-2">Loading tasks and employee roster...</p>
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        <div className="w-100">
          {filteredTasks.length === 0 ? (
            <Card className={`${isDark ? 'bg-dark border-secondary text-light' : 'bg-white border-light-subtle text-dark'} text-center py-5 shadow-sm rounded-4 w-100`}>
              <Card.Body className="text-secondary py-5">
                <Filter size={48} className="mb-3 opacity-40 d-block mx-auto" />
                <h5 className="fw-bold">No Tasks Found</h5>
                <p className="mb-3 fs-6 opacity-75">No tasks match your filter criteria or search query.</p>
                <Button variant={isDark ? 'info' : 'primary'} size="sm" onClick={() => handleOpenAddModal()} className={`${isDark ? 'text-dark' : 'text-white'} px-4 py-2 font-semibold rounded-3`}>
                  Create New Task
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <div className="d-flex flex-column gap-3 w-100">
              {filteredTasks.map((t) => {
                const isCompleted = t.status === 'COMPLETED'
                const todayStr = new Date().toISOString().split('T')[0]
                const dueDateStr = t.due_date ? t.due_date.split('T')[0] : null
                const isOverdue = !isCompleted && dueDateStr && dueDateStr < todayStr

                return (
                  <div
                    key={t.id}
                    className={`task-card ${isDark ? 'task-card-dark' : 'task-card-light'} ${isCompleted ? 'is-completed' : ''}`}
                  >
                    {/* Status Color Bar on Left */}
                    <div
                      className={`status-strip ${
                        isCompleted
                          ? 'bg-success'
                          : isOverdue
                            ? 'bg-danger'
                            : t.priority === 'URGENT'
                              ? 'bg-danger'
                              : t.priority === 'HIGH'
                                ? 'bg-warning'
                                : 'bg-primary'
                      }`}
                    />

                    <div className="task-card-content">
                      {/* Top Row: Checkbox + Title + Badges (Inline Flex Row) + Actions on Right */}
                      <div className="task-header-row">
                        <div className="task-title-group">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(t)}
                            className="task-check-toggle"
                            title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                          >
                            <CheckCircle2 size={20} className={isCompleted ? 'text-success' : isDark ? 'text-secondary opacity-60' : 'text-slate-400'} />
                          </button>

                          {/* Title */}
                          <h5 className={`task-title-text ${isCompleted ? 'line-through text-secondary opacity-60' : isDark ? 'text-light' : 'text-dark'}`}>
                            {t.title}
                          </h5>

                          {/* Badges inline */}
                          <div className="task-badges-inline">
                            {renderPriorityBadge(t.priority)}
                            {renderStatusBadge(t.status)}
                          </div>
                        </div>

                        {/* Action Buttons (Right Aligned) */}
                        <div className="task-actions-group">
                          {/* Quick Status Picker Dropdown */}
                          <Dropdown align="end">
                            <Dropdown.Toggle
                              variant={isDark ? 'outline-secondary' : 'outline-dark'}
                              size="sm"
                              className="btn-status-dropdown d-flex align-items-center gap-1 fs-7 py-1 px-2.5 rounded-3"
                            >
                              <span>Status</span> <ChevronDown size={12} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu variant={isDark ? 'dark' : 'light'} className="shadow-lg fs-7 p-1">
                              <Dropdown.Item onClick={() => handleChangeStatus(t, 'PENDING')} className="d-flex align-items-center gap-2 py-1.5 rounded-2">
                                <AlertCircle size={14} className="text-warning" /> Pending
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleChangeStatus(t, 'IN_PROGRESS')} className="d-flex align-items-center gap-2 py-1.5 rounded-2">
                                <Clock size={14} className="text-primary" /> In Progress
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleChangeStatus(t, 'COMPLETED')} className="d-flex align-items-center gap-2 py-1.5 rounded-2">
                                <CheckCircle2 size={14} className="text-success" /> Completed
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleChangeStatus(t, 'CANCELLED')} className="d-flex align-items-center gap-2 py-1.5 rounded-2">
                                <XCircle size={14} className="text-secondary" /> Cancelled
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(t)}
                            className="btn-icon btn-icon-edit"
                            title="Edit Task"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTask(t.id)}
                            className="btn-icon btn-icon-delete"
                            title="Delete Task"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Description (if present) */}
                      {t.description && (
                        <p className={`task-description-text ${isDark ? 'text-secondary opacity-75' : 'text-muted'} ${isCompleted ? 'opacity-50' : ''}`}>
                          {t.description}
                        </p>
                      )}

                      {/* Bottom Row: Metadata (Assignee, Start Date, Due Date) in a single horizontal flex line */}
                      <div className="task-meta-row">
                        {/* Assignee */}
                        <span className={`task-meta-badge ${isDark ? 'meta-dark' : 'meta-light'}`}>
                          <UserCheck size={13} className={t.assigned_to ? (isDark ? 'text-info' : 'text-primary') : 'opacity-50'} />
                          <span>{getDisplayName(t.assigned_to)}</span>
                        </span>

                        {/* Start Date */}
                        {t.start_date && (
                          <span className={`task-meta-badge ${isDark ? 'meta-dark' : 'meta-light'}`}>
                            <CalendarDays size={13} className="opacity-60" />
                            <span>Start: {formatDate(t.start_date)}</span>
                          </span>
                        )}

                        {/* Due Date */}
                        {dueDateStr && (
                          <span className={`task-meta-badge ${isOverdue ? 'meta-overdue' : isDark ? 'meta-dark' : 'meta-light'}`}>
                            <Clock size={13} className={isOverdue ? 'text-danger' : 'opacity-60'} />
                            <span>Due: {formatDate(dueDateStr)}</span>
                            {isOverdue && <span className="overdue-tag">Overdue</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* PRO SAAS CALENDAR VIEW */
        <Card className={`w-100 ${isDark ? 'bg-dark-calendar' : 'bg-light-calendar'} shadow-lg border-0 rounded-4 overflow-hidden`}>
          {/* Pro SaaS Calendar Header Controller Bar */}
          <div className={`cal-header-bar px-4 py-3 d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom ${isDark ? 'border-secondary border-opacity-30 bg-dark bg-opacity-80' : 'border-light-subtle bg-white'}`}>
            {/* Left: Month Title + Task Count Badge + Segmented Navigation */}
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <h4 className={`mb-0 fw-bold fs-4 d-flex align-items-center gap-2 ${isDark ? 'text-white' : 'text-dark'}`}>
                {monthNames[month]} <span className={isDark ? 'text-info' : 'text-primary'}>{year}</span>
              </h4>

              <span className={`cal-task-count-badge ${isDark ? 'count-badge-dark' : 'count-badge-light'}`}>
                <CalendarDays size={13} />
                <span>{monthMetrics.monthTotal} {monthMetrics.monthTotal === 1 ? 'Task' : 'Tasks'}</span>
              </span>

              {/* Modern Segmented Navigation */}
              <div className={`cal-segmented-nav ${isDark ? 'nav-dark' : 'nav-light'}`}>
                <button type="button" onClick={handlePrevMonth} className="nav-btn-icon" title="Previous Month">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" onClick={handleToday} className="nav-btn-today" title="Jump to Today">
                  Today
                </button>
                <button type="button" onClick={handleNextMonth} className="nav-btn-icon" title="Next Month">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Center: Integrated Search Box */}
            <div className="d-flex align-items-center flex-grow-1 justify-content-center" style={{ maxWidth: '360px' }}>
              <div className={`cal-search-box ${isDark ? 'search-dark' : 'search-light'} w-100`}>
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  placeholder="Filter calendar tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="search-clear-btn">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Metric Pills + Schedule Task Button */}
            <div className="d-flex align-items-center gap-3 flex-wrap ms-auto">
              <div className="d-none d-lg-flex align-items-center gap-2 me-1">
                <span className="cal-metric-pill metric-done">
                  <span className="dot bg-success" /> {monthMetrics.completed} Done
                </span>
                <span className="cal-metric-pill metric-progress">
                  <span className="dot bg-primary" /> {monthMetrics.inProgress} Progress
                </span>
                <span className="cal-metric-pill metric-pending">
                  <span className="dot bg-warning" /> {monthMetrics.pending} Pending
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className={`btn-schedule-task ${isDark ? 'btn-schedule-dark' : 'btn-schedule-light'}`}
              >
                <Plus size={16} />
                <span>Schedule Task</span>
              </button>
            </div>
          </div>

          <Card.Body className="p-0 w-100">
            {/* Day Header Row (Sun - Sat) */}
            <div className={`d-grid grid-cols-7 border-bottom ${isDark ? 'border-secondary border-opacity-30 bg-dark bg-opacity-60 text-secondary' : 'border-light-subtle bg-light text-secondary'} text-center fw-bold py-1.5 fs-8 text-uppercase letter-spacing-1 w-100`}>
              <div className="text-rose-500 fw-bold">Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div className="text-cyan-500 fw-bold">Sat</div>
            </div>

            {/* Month Days Grid */}
            <div className={`d-grid grid-cols-7 cal-grid ${isDark ? 'text-light' : 'text-dark'} w-100`}>
              {/* Empty leading padding cells */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className={`p-1.5 border-end border-bottom ${isDark ? 'border-secondary border-opacity-20 cal-cell-empty-dark' : 'border-light-subtle cal-cell-empty-light'} min-cell-height`}
                />
              ))}

              {/* Month Day Cells */}
              {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
                const dayNum = dayIdx + 1
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                const dayOfWeek = new Date(year, month, dayNum).getDay()
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                const isToday =
                  new Date().getDate() === dayNum &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year

                // Tasks for this specific date
                const dayTasks = filteredTasks.filter((t) => {
                  const tDue = t.due_date ? t.due_date.split('T')[0] : null
                  const tStart = t.start_date ? t.start_date.split('T')[0] : null
                  return tDue === dateStr || tStart === dateStr
                })

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`p-1.5 border-end border-bottom ${isDark ? 'border-secondary border-opacity-20' : 'border-light-subtle'} min-cell-height cal-day-cell position-relative transition-all ${
                      isToday
                        ? isDark
                          ? 'cal-today-dark'
                          : 'cal-today-light'
                        : isWeekend
                          ? isDark
                            ? 'cal-weekend-dark'
                            : 'cal-weekend-light'
                          : isDark
                            ? 'bg-dark'
                            : 'bg-white'
                    }`}
                    onClick={() => handleOpenAddModal(dateStr)}
                  >
                    {/* Header inside Day Cell */}
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center gap-1">
                        <span
                          className={`cal-date-number ${
                            isToday
                              ? 'cal-date-today'
                              : isDark
                                ? 'text-light opacity-85'
                                : 'text-dark opacity-85'
                          }`}
                        >
                          {dayNum}
                        </span>
                        {isToday && <span className="cal-today-indicator">TODAY</span>}
                      </div>

                      {/* Quick Schedule Plus Button on Cell Hover */}
                      <button
                        type="button"
                        className="cal-cell-add-btn"
                        title={`Schedule task on ${dateStr}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenAddModal(dateStr)
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Task Chips inside Cell */}
                    <div className="d-flex flex-column gap-1 overflow-hidden cal-chips-container">
                      {dayTasks.slice(0, 2).map((t) => {
                        const isDone = t.status === 'COMPLETED'
                        const isUrgent = t.priority === 'URGENT'
                        const isHigh = t.priority === 'HIGH'

                        return (
                          <div
                            key={`cal-chip-${t.id}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEditModal(t)
                            }}
                            className={`cal-task-chip ${
                              isDone
                                ? 'chip-done'
                                : isUrgent
                                  ? 'chip-urgent'
                                  : isHigh
                                    ? 'chip-high'
                                    : isDark
                                      ? 'chip-dark'
                                      : 'chip-light'
                            }`}
                            title={`${t.title} (${t.status})`}
                          >
                            <span className={`chip-dot ${isDone ? 'bg-success' : isUrgent ? 'bg-danger' : isHigh ? 'bg-warning' : 'bg-primary'}`} />
                            <span className="text-truncate flex-grow-1 chip-title">{t.title}</span>
                            {t.assigned_to && (
                              <span className="chip-avatar" title={getDisplayName(t.assigned_to)}>
                                {getUserInitials(getDisplayName(t.assigned_to))}
                              </span>
                            )}
                          </div>
                        )
                      })}

                      {dayTasks.length > 2 && (
                        <div
                          className={`cal-more-btn ${isDark ? 'text-info' : 'text-primary'}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSearchQuery(dateStr)
                            setViewMode('list')
                          }}
                        >
                          +{dayTasks.length - 2} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Trailing Empty Cells */}
              {Array.from({ length: trailingEmptyCount }).map((_, i) => (
                <div
                  key={`trailing-${i}`}
                  className={`p-1.5 border-end border-bottom ${isDark ? 'border-secondary border-opacity-20 cal-cell-empty-dark' : 'border-light-subtle cal-cell-empty-light'} min-cell-height`}
                />
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Add / Edit Task Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" className={isDark ? 'dark-modal' : 'light-modal'}>
        <Modal.Header closeButton className={isDark ? 'bg-dark text-light border-secondary' : 'bg-white text-dark border-light-subtle'}>
          <Modal.Title className={`fw-bold d-flex align-items-center gap-2 ${isDark ? 'text-info' : 'text-primary'} fs-5`}>
            {editingTask ? <Edit2 size={20} /> : <Plus size={20} />}
            {editingTask ? `Edit Task #${editingTask.id}` : 'Create New Task'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveTask}>
          <Modal.Body className={`${isDark ? 'bg-dark text-light border-secondary' : 'bg-white text-dark border-light-subtle'} p-4`}>
            <Row className="g-3">
              {/* Task Title */}
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className={`fw-bold fs-7 text-uppercase ${isDark ? 'text-secondary' : 'text-muted'}`}>Task Title *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="e.g. Print 1000 Flex Banners for Apex Corp"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className={isDark ? 'bg-secondary bg-opacity-25 text-light border-secondary' : 'bg-light text-dark border-light-subtle'}
                  />
                </Form.Group>
              </Col>

              {/* Task Description */}
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className={`fw-bold fs-7 text-uppercase ${isDark ? 'text-secondary' : 'text-muted'}`}>Description / Details</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter specific printing guidelines, client notes, paper stock specifications..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className={isDark ? 'bg-secondary bg-opacity-25 text-light border-secondary' : 'bg-light text-dark border-light-subtle'}
                  />
                </Form.Group>
              </Col>

              {/* Assigned Employee */}
              <Col md={6} xs={12}>
                <Form.Group>
                  <Form.Label className={`fw-bold fs-7 text-uppercase ${isDark ? 'text-secondary' : 'text-muted'} d-flex align-items-center gap-1`}>
                    <UserIcon size={14} className={isDark ? 'text-info' : 'text-primary'} /> Assign Employee
                  </Form.Label>
                  <Form.Select
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className={isDark ? 'bg-secondary bg-opacity-25 text-light border-secondary' : 'bg-light text-dark border-light-subtle'}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {getDisplayName(u)} (@{u.username})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Priority */}
              <Col md={3} xs={6}>
                <Form.Group>
                  <Form.Label className={`fw-bold fs-7 text-uppercase ${isDark ? 'text-secondary' : 'text-muted'}`}>Priority</Form.Label>
                  <Form.Select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className={isDark ? 'bg-secondary bg-opacity-25 text-light border-secondary' : 'bg-light text-dark border-light-subtle'}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Status */}
              <Col md={3} xs={6}>
                <Form.Group>
                  <Form.Label className={`fw-bold fs-7 text-uppercase ${isDark ? 'text-secondary' : 'text-muted'}`}>Status</Form.Label>
                  <Form.Select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className={isDark ? 'bg-secondary bg-opacity-25 text-light border-secondary' : 'bg-light text-dark border-light-subtle'}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Start Date */}
              <Col md={6} xs={12}>
                <Form.Group>
                  <Form.Label className={`fw-bold fs-7 text-uppercase ${isDark ? 'text-secondary' : 'text-muted'}`}>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className={isDark ? 'bg-secondary bg-opacity-25 text-light border-secondary' : 'bg-light text-dark border-light-subtle'}
                  />
                </Form.Group>
              </Col>

              {/* Due Date */}
              <Col md={6} xs={12}>
                <Form.Group>
                  <Form.Label className={`fw-bold fs-7 text-uppercase ${isDark ? 'text-secondary' : 'text-muted'}`}>Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className={isDark ? 'bg-secondary bg-opacity-25 text-light border-secondary' : 'bg-light text-dark border-light-subtle'}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className={isDark ? 'bg-dark border-secondary' : 'bg-white border-light-subtle'}>
            <Button variant={isDark ? 'outline-secondary' : 'outline-dark'} onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant={isDark ? 'info' : 'primary'} type="submit" disabled={submitting} className={`${isDark ? 'text-dark' : 'text-white'} fw-bold px-4`}>
              {submitting ? <Spinner size="sm" animation="border" /> : editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modern CSS Rules */}
      <style>{`
        /* List View Task Cards */
        .task-card {
          display: flex;
          align-items: stretch;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease-in-out;
          position: relative;
          width: 100%;
        }
        .task-card-dark {
          background: #1e293b;
          border: 1px solid #334155;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }
        .task-card-dark:hover {
          border-color: #475569;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }
        .task-card-light {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .task-card-light:hover {
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
        }
        .task-card.is-completed {
          opacity: 0.8;
        }

        .status-strip {
          width: 5px;
          flex-shrink: 0;
        }

        .task-card-content {
          flex: 1;
          padding: 14px 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .task-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
        }

        .task-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
          flex-wrap: wrap;
        }

        .task-check-toggle {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.15s ease;
        }
        .task-check-toggle:hover {
          transform: scale(1.15);
        }

        .task-title-text {
          margin: 0;
          font-size: 1.02rem;
          font-weight: 600;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .line-through {
          text-decoration: line-through;
        }

        .task-badges-inline {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .task-actions-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          margin-left: auto;
        }

        .btn-status-dropdown {
          font-size: 0.78rem;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 500;
        }

        .btn-icon {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          background: rgba(148, 163, 184, 0.1);
          color: #94a3b8;
        }
        .btn-icon-edit:hover {
          background: rgba(56, 189, 248, 0.15);
          color: #0ea5e9;
          border-color: rgba(56, 189, 248, 0.3);
        }
        .btn-icon-delete:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
        }

        .task-description-text {
          margin: 0;
          font-size: 0.85rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .task-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 2px;
        }

        .task-meta-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 6px;
          white-space: nowrap;
        }

        .meta-dark {
          background: rgba(51, 65, 85, 0.5);
          color: #cbd5e1;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .meta-light {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .meta-overdue {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.25);
          font-weight: 600;
        }

        .overdue-tag {
          background: #ef4444;
          color: #ffffff;
          font-size: 0.65rem;
          padding: 1px 5px;
          border-radius: 4px;
          font-weight: 700;
          text-transform: uppercase;
          margin-left: 2px;
        }

        .saas-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.70rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          white-space: nowrap;
        }
        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }
        .badge-urgent { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .dot-urgent { background-color: #ef4444; }
        .badge-high { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
        .dot-high { background-color: #f59e0b; }
        .badge-medium { background: rgba(14, 165, 233, 0.15); color: #0ea5e9; border: 1px solid rgba(14, 165, 233, 0.3); }
        .dot-medium { background-color: #0ea5e9; }
        .badge-low { background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); }
        .dot-low { background-color: #94a3b8; }

        .badge-done { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-progress { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }
        .badge-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
        .badge-cancelled { background: rgba(100, 116, 139, 0.15); color: #64748b; border: 1px solid rgba(100, 116, 139, 0.3); }

        /* Stat Cards */
        .stat-card-dark {
          background: rgba(30, 41, 59, 0.85);
          border: 1px solid #334155 !important;
        }
        .stat-card-light {
          background: #ffffff;
          border: 1px solid #e2e8f0 !important;
        }

        /* Screen-Fitted Pro Calendar Styling */
        .bg-dark-calendar {
          background-color: #0f172a;
          border: 1px solid rgba(51, 65, 85, 0.6) !important;
        }
        .bg-light-calendar {
          background-color: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.9) !important;
        }

        /* Pro SaaS Calendar Header Controller Bar */
        .cal-header-bar {
          min-height: 60px;
          box-sizing: border-box;
          padding: 14px 20px !important;
        }

        .cal-task-count-badge {
          font-size: 0.76rem;
          font-weight: 600;
          padding: 4px 11px;
          border-radius: 9999px;
          letter-spacing: 0.2px;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .count-badge-dark {
          background: rgba(56, 189, 248, 0.12);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .count-badge-light {
          background: rgba(37, 99, 235, 0.08);
          color: #2563eb;
          border: 1px solid rgba(37, 99, 235, 0.25);
        }

        /* Segmented Month Navigation */
        .cal-segmented-nav {
          display: inline-flex;
          align-items: center;
          border-radius: 9px;
          padding: 3px;
          gap: 2px;
          height: 36px;
          box-sizing: border-box;
        }
        .nav-dark {
          background: #1e293b;
          border: 1px solid #334155;
        }
        .nav-light {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
        }

        .nav-btn-icon {
          border: none;
          background: transparent;
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          color: inherit;
          cursor: pointer;
          transition: all 0.15s ease;
          opacity: 0.8;
        }
        .nav-btn-icon:hover {
          opacity: 1;
          background: rgba(148, 163, 184, 0.25);
          transform: scale(1.05);
        }

        .nav-btn-today {
          border: none;
          background: transparent;
          padding: 2px 12px;
          font-size: 0.78rem;
          font-weight: 700;
          color: inherit;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.15s ease;
          opacity: 0.9;
          height: 28px;
        }
        .nav-btn-today:hover {
          opacity: 1;
          background: rgba(148, 163, 184, 0.25);
        }

        /* Integrated Search Box */
        .cal-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 9px;
          height: 38px;
          box-sizing: border-box;
          transition: all 0.15s ease;
        }
        .search-dark {
          background: #1e293b;
          border: 1px solid #334155;
          color: #f8fafc;
        }
        .search-dark:focus-within {
          border-color: #38bdf8;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
        }
        .search-light {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
        }
        .search-light:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .search-icon {
          flex-shrink: 0;
          opacity: 0.55;
        }

        .search-input {
          border: none;
          outline: none;
          background: transparent;
          color: inherit;
          font-size: 0.82rem;
          width: 100%;
        }
        .search-input::placeholder {
          opacity: 0.5;
        }

        .search-clear-btn {
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          color: inherit;
          opacity: 0.5;
          display: flex;
          align-items: center;
        }
        .search-clear-btn:hover {
          opacity: 1;
        }

        /* Metric Pills */
        .cal-metric-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 9999px;
          white-space: nowrap;
        }
        .cal-metric-pill .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
        .metric-done {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }
        .metric-progress {
          background: rgba(59, 130, 246, 0.12);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.25);
        }
        .metric-pending {
          background: rgba(245, 158, 11, 0.12);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.25);
        }

        /* Schedule Task Button */
        .btn-schedule-task {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 0.82rem;
          font-weight: 700;
          padding: 7px 16px;
          border-radius: 9px;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }
        .btn-schedule-dark {
          background: #38bdf8;
          color: #090d16;
          box-shadow: 0 4px 14px rgba(56, 189, 248, 0.35);
        }
        .btn-schedule-dark:hover {
          background: #0ea5e9;
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(14, 165, 233, 0.45);
        }
        .btn-schedule-light {
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
        }
        .btn-schedule-light:hover {
          background: #1d4ed8;
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(29, 78, 216, 0.4);
        }

        .text-rose-500 { color: #f43f5e; }
        .text-cyan-500 { color: #06b6d4; }

        /* Optimized Cell Height for Balanced Desktop Proportion */
        .min-cell-height {
          min-height: 108px;
        }

        .cal-day-cell {
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
        }
        .cal-day-cell:hover {
          background-color: rgba(56, 189, 248, 0.04) !important;
          z-index: 5;
        }
        .cal-day-cell:hover .cal-cell-add-btn {
          opacity: 1;
        }

        .cal-weekend-dark {
          background-color: rgba(15, 23, 42, 0.6);
        }
        .cal-weekend-light {
          background-color: #f8fafc;
        }

        .cal-today-dark {
          background-color: rgba(56, 189, 248, 0.08) !important;
          box-shadow: inset 0 0 0 2px rgba(56, 189, 248, 0.6);
        }
        .cal-today-light {
          background-color: rgba(37, 99, 235, 0.06) !important;
          box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.5);
        }

        .cal-cell-empty-dark {
          background-color: rgba(15, 23, 42, 0.4);
          background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255, 255, 255, 0.015) 8px, rgba(255, 255, 255, 0.015) 16px);
        }
        .cal-cell-empty-light {
          background-color: #f8fafc;
          background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0, 0, 0, 0.02) 8px, rgba(0, 0, 0, 0.02) 16px);
        }

        .cal-date-number {
          font-weight: 700;
          font-size: 0.82rem;
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .cal-date-today {
          background-color: #0ea5e9;
          color: #ffffff !important;
          box-shadow: 0 2px 6px rgba(14, 165, 233, 0.4);
        }

        .cal-today-indicator {
          font-size: 0.62rem;
          font-weight: 800;
          color: #0ea5e9;
          letter-spacing: 0.5px;
        }

        .cal-cell-add-btn {
          opacity: 0;
          background: rgba(148, 163, 184, 0.15);
          border: none;
          border-radius: 4px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #0ea5e9;
          transition: all 0.15s ease;
        }
        .cal-cell-add-btn:hover {
          background: #0ea5e9;
          color: #ffffff;
          transform: scale(1.1);
        }

        .cal-chips-container {
          max-height: 74px;
        }

        .cal-task-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 3px 7px;
          border-radius: 5px;
          font-size: 0.72rem;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
        }
        .cal-task-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
        }

        .chip-title {
          font-weight: 500;
          line-height: 1.2;
        }

        .chip-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .chip-avatar {
          font-size: 0.60rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.25);
          color: inherit;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .chip-done {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.3);
          text-decoration: line-through;
          opacity: 0.8;
        }

        .chip-urgent {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
          font-weight: 600;
        }

        .chip-high {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border-color: rgba(245, 158, 11, 0.3);
          font-weight: 600;
        }

        .chip-dark {
          background: rgba(51, 65, 85, 0.6);
          color: #e2e8f0;
          border-color: rgba(255, 255, 255, 0.08);
        }

        .chip-light {
          background: #f1f5f9;
          color: #1e293b;
          border-color: #cbd5e1;
        }

        .cal-more-btn {
          font-size: 0.68rem;
          font-weight: 600;
          text-align: center;
          cursor: pointer;
          padding: 1px 0;
          transition: opacity 0.15s ease;
        }
        .cal-more-btn:hover {
          text-decoration: underline;
          opacity: 0.9;
        }

        .grid-cols-7 {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
        }
        .letter-spacing-1 {
          letter-spacing: 1px;
        }
        .fs-7 { font-size: 0.82rem; }
        .fs-8 { font-size: 0.72rem; }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        .dark-modal .modal-content {
          border-color: #334155;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .light-modal .modal-content {
          border-color: #cbd5e1;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  )
}
