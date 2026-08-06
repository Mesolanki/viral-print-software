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
import './TaskManagement.css'
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
  ChevronDown,
  Columns,
  LayoutGrid,
  Phone,
  TrendingUp,
  Check,
  Flame,
  Pin,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  FileText
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

export const formatFullDate = (dateStr?: string | null): string => {
  if (!dateStr) return ''
  const cleanStr = dateStr.split('T')[0]
  const parts = cleanStr.split('-')
  if (parts.length !== 3) return cleanStr
  const [y, m, d] = parts
  const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10))
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayName = dayNames[dateObj.getDay()] || ''
  const monthName = monthNames[dateObj.getMonth()] || ''
  const dayNum = String(parseInt(d, 10)).padStart(2, '0')
  return `${dayName}, ${dayNum} ${monthName}, ${y}`
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
  // Calendar Sub-View: 'split' (Mini Calendar + Agenda Feed) | 'grid' (Full Month Grid)
  const [calSubView, setCalSubView] = useState<'split' | 'grid'>('split')
  // Selected Date string (YYYY-MM-DD) for Split Agenda view
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

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
    const today = new Date()
    setCurrentCalendarDate(today)
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    setSelectedDateStr(todayStr)
  }

  // Set of dates having scheduled tasks (for Mini Calendar indicators)
  const datesWithTasksSet = useMemo(() => {
    const set = new Set<string>()
    filteredTasks.forEach((t) => {
      if (t.due_date) set.add(t.due_date.split('T')[0])
      if (t.start_date) set.add(t.start_date.split('T')[0])
    })
    return set
  }, [filteredTasks])

  // Selected Date Task Feed for Split View Agenda
  const selectedDateTasks = useMemo(() => {
    return filteredTasks.filter((t) => {
      const tDue = t.due_date ? t.due_date.split('T')[0] : null
      const tStart = t.start_date ? t.start_date.split('T')[0] : null
      return tDue === selectedDateStr || tStart === selectedDateStr
    })
  }, [filteredTasks, selectedDateStr])

  // Today's schedule count
  const todayScheduleCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    return tasks.filter((t) => {
      const tDue = t.due_date ? t.due_date.split('T')[0] : null
      const tStart = t.start_date ? t.start_date.split('T')[0] : null
      return tDue === todayStr || tStart === todayStr
    }).length
  }, [tasks])

  // Upcoming non-completed tasks count
  const upcomingCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    return tasks.filter((t) => {
      if (t.status === 'COMPLETED') return false
      const tDue = t.due_date ? t.due_date.split('T')[0] : null
      const tStart = t.start_date ? t.start_date.split('T')[0] : null
      return (tDue && tDue >= todayStr) || (tStart && tStart >= todayStr)
    }).length
  }, [tasks])

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
    <div className="w-100 pt-1 pb-5 mb-4">
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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 w-100">
        <div className="d-flex align-items-center gap-3">
          <div className="vpm-page-header-icon">
            <CalendarDays size={22} />
          </div>
          <div>
            <h2 className="vpm-page-heading">
              To-Do &amp; Task Management
            </h2>
            <p className="vpm-page-subheading">
              Organize print shop orders, assign employees, track status, and view calendar schedule in real-time.
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            onClick={fetchInitialData}
            title="Refresh Tasks"
            className="vpm-btn-secondary"
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span className="font-semibold">Refresh</span>
          </button>

          {/* View Mode Switcher */}
          <div className="vpm-segmented-control">
            <button
              className={`vpm-segmented-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <ListIcon size={14} /> List
            </button>
            <button
              className={`vpm-segmented-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon size={14} /> Calendar
            </button>
          </div>

          <button
            className="vpm-btn-primary"
            onClick={() => handleOpenAddModal()}
          >
            <Plus size={16} /> Add Task
          </button>
        </div>

      </div>

      {/* Conditionally Render Stat Cards & Filters ONLY in List View */}
      {viewMode === 'list' && (
        <>
          {/* ═══ PRO LEVEL STAT CARDS ═══════════════════════════════ */}
          <Row className="g-3 mb-4 w-100 mx-0">


            {/* ── Total Tasks — Cyan ── */}
            <Col className="col-12 col-sm-6 col-md flex-grow-1 px-2">
              <div className={`vpm-stat-card ${isDark ? 'vpm-stat-card-dark' : 'vpm-stat-card-light'} vpm-stat-cyan`}>
                <div className="vpm-stat-top">
                  <span className="vpm-stat-label">Total Tasks</span>
                  <div className="vpm-stat-icon-ring">
                    <CalendarDays size={16} />
                  </div>
                </div>
                <div className="vpm-stat-divider" />
                <div className="vpm-stat-value">{metrics.total}</div>
                <div className="vpm-stat-desc">Total registered in system</div>
              </div>
            </Col>

            {/* ── Pending — Amber ── */}
            <Col className="col-12 col-sm-6 col-md flex-grow-1 px-2">
              <div className={`vpm-stat-card ${isDark ? 'vpm-stat-card-dark' : 'vpm-stat-card-light'} vpm-stat-amber`}>
                <div className="vpm-stat-top">
                  <span className="vpm-stat-label">Pending</span>
                  <div className="vpm-stat-icon-ring">
                    <AlertCircle size={16} />
                  </div>
                </div>
                <div className="vpm-stat-divider" />
                <div className="vpm-stat-value">{metrics.pending}</div>
                <div className="vpm-stat-desc">Awaiting operator review</div>
              </div>
            </Col>

            {/* ── In Progress — Indigo ── */}
            <Col className="col-12 col-sm-6 col-md flex-grow-1 px-2">
              <div className={`vpm-stat-card ${isDark ? 'vpm-stat-card-dark' : 'vpm-stat-card-light'} vpm-stat-indigo`}>
                <div className="vpm-stat-top">
                  <span className="vpm-stat-label">In Progress</span>
                  <div className="vpm-stat-icon-ring">
                    <Clock size={16} />
                  </div>
                </div>
                <div className="vpm-stat-divider" />
                <div className="vpm-stat-value">{metrics.inProgress}</div>
                <div className="vpm-stat-desc">Active shop print jobs</div>
              </div>
            </Col>

            {/* ── Completed — Emerald ── */}
            <Col className="col-12 col-sm-6 col-md flex-grow-1 px-2">
              <div className={`vpm-stat-card ${isDark ? 'vpm-stat-card-dark' : 'vpm-stat-card-light'} vpm-stat-emerald`}>
                <div className="vpm-stat-top">
                  <span className="vpm-stat-label">Completed</span>
                  <div className="vpm-stat-icon-ring">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div className="vpm-stat-divider" />
                <div className="vpm-stat-value">{metrics.completed}</div>
                <div className="vpm-stat-desc">Successfully completed jobs</div>
              </div>
            </Col>

            {/* ── Overdue — Rose ── */}
            <Col className="col-12 col-sm-6 col-md flex-grow-1 px-2">
              <div className={`vpm-stat-card ${isDark ? 'vpm-stat-card-dark' : 'vpm-stat-card-light'} vpm-stat-rose`}>
                <div className="vpm-stat-top">
                  <span className="vpm-stat-label">Overdue</span>
                  <div className="vpm-stat-icon-ring">
                    <AlertCircle size={16} />
                  </div>
                </div>
                <div className="vpm-stat-divider" />
                <div className="vpm-stat-value">{metrics.overdue}</div>
                <div className="vpm-stat-desc">Missed shop deadlines</div>
              </div>
            </Col>

          </Row>


          {/* Filters Toolbar */}
          <div className={`vpm-filter-toolbar ${isDark ? 'filter-toolbar-dark' : 'filter-toolbar-light'} mb-4 w-100`}>
            <Row className="g-2.5 align-items-center w-100 mx-0">
              {/* Search Input */}
              <Col lg={4} md={12} className="px-1">
                <div className="position-relative">
                  <div className={`cal-search-box ${isDark ? 'search-dark' : 'search-light'}`}>
                    <Search size={15} className="search-icon" />
                    <input
                      placeholder="Search tasks by title or description..."
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

              {/* Status Filter */}
              <Col lg={2} md={4} xs={6} className="px-1">
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="vpm-filter-select"
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
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="vpm-filter-select"
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
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="vpm-filter-select"
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
                <button
                  className="vpm-btn-secondary w-100 py-1.5 fs-7"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('ALL')
                    setPriorityFilter('ALL')
                    setAssigneeFilter('ALL')
                  }}
                >
                  Reset
                </button>
              </Col>
            </Row>
          </div>
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
                    className={`task-card ${isDark ? 'task-card-dark' : 'task-card-light'} ${isCompleted ? 'is-completed' : ''} priority-${t.priority.toLowerCase()} status-${t.status.toLowerCase()}`}
                  >
                    {/* Status Color Bar on Left (Sky Blue Gradient) */}
                    <div className="status-strip" />

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
                              className="btn-status-dropdown d-flex align-items-center gap-1.5 fs-7 py-1 px-2.5 rounded-3"
                            >
                              <span>Status</span> <ChevronDown size={12} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu variant={isDark ? 'dark' : 'light'} className="vpm-dropdown-menu shadow-lg">
                              <Dropdown.Item onClick={() => handleChangeStatus(t, 'PENDING')} className="vpm-dropdown-item">
                                <span className="vpm-dropdown-icon vpm-dropdown-icon-warning">
                                  <AlertCircle size={14} />
                                </span>
                                <span>Pending</span>
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleChangeStatus(t, 'IN_PROGRESS')} className="vpm-dropdown-item">
                                <span className="vpm-dropdown-icon vpm-dropdown-icon-primary">
                                  <Clock size={14} />
                                </span>
                                <span>In Progress</span>
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleChangeStatus(t, 'COMPLETED')} className="vpm-dropdown-item">
                                <span className="vpm-dropdown-icon vpm-dropdown-icon-success">
                                  <CheckCircle2 size={14} />
                                </span>
                                <span>Completed</span>
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleChangeStatus(t, 'CANCELLED')} className="vpm-dropdown-item">
                                <span className="vpm-dropdown-icon vpm-dropdown-icon-secondary">
                                  <XCircle size={14} />
                                </span>
                                <span>Cancelled</span>
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
                          {t.assigned_to ? (
                            <div className="assignee-avatar-mini">
                              {(getDisplayName(t.assigned_to) || 'A')
                                .split(' ')
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>
                          ) : (
                            <UserCheck size={13} className="opacity-50" style={{ marginRight: '6px' }} />
                          )}
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
        <div className="d-flex flex-column gap-4 w-100">
          {/* Main Card Shell for Calendar */}
          <Card className={`w-100 ${isDark ? 'bg-dark-calendar' : 'bg-light-calendar'} shadow-lg border-0 rounded-4 overflow-hidden`}>
            {/* Calendar Controller Header Bar */}
            <div className={`cal-header-bar px-4 py-3 d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom ${isDark ? 'border-secondary border-opacity-30 bg-dark bg-opacity-80' : 'border-light-subtle bg-white'}`}>
              {/* Left: Month Title + Task Count Badge + Month Nav */}
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <h4 className={`mb-0 fw-bold fs-4 d-flex align-items-center gap-2 ${isDark ? 'text-white' : 'text-dark'}`}>
                  {monthNames[month]} <span className={isDark ? 'text-info' : 'text-primary'}>{year}</span>
                </h4>

                <span className={`cal-task-count-badge ${isDark ? 'count-badge-dark' : 'count-badge-light'}`}>
                  <CalendarDays size={13} />
                  <span>{monthMetrics.monthTotal} {monthMetrics.monthTotal === 1 ? 'Task' : 'Tasks'}</span>
                </span>

                {/* Modern Month Nav */}
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

              {/* Subview Toggle Switcher (Split Agenda View vs Month Grid View) */}
              <div className={`cal-subview-nav ${isDark ? 'nav-dark' : 'nav-light'}`}>
                <button
                  type="button"
                  onClick={() => setCalSubView('split')}
                  className={`subview-btn ${calSubView === 'split' ? 'active' : ''}`}
                  title="Split Mini Calendar + Schedule Agenda View"
                >
                  <Columns size={15} />
                  <span className="d-none d-md-inline ms-1">Split Schedule</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCalSubView('grid')}
                  className={`subview-btn ${calSubView === 'grid' ? 'active' : ''}`}
                  title="Full Month Grid View"
                >
                  <LayoutGrid size={15} />
                  <span className="d-none d-md-inline ms-1">Month Grid</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="d-flex align-items-center flex-grow-1 justify-content-center" style={{ maxWidth: '300px' }}>
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

              {/* Right: Schedule Task CTA Button */}
              <div className="d-flex align-items-center gap-3 ms-auto">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(selectedDateStr)}
                  className={`btn-schedule-task ${isDark ? 'btn-schedule-dark' : 'btn-schedule-light'}`}
                >
                  <Plus size={16} />
                  <span>Schedule Task</span>
                </button>
              </div>
            </div>

            {/* If Split SubView: Render top KPI stats + Split layout (Image 2 style) */}
            {calSubView === 'split' ? (
              <Card.Body className="p-4 w-100">
                {/* Top 4 KPI Metrics Row */}
                <Row className="g-3 mb-4">
                  <Col xl={3} md={6} xs={12}>
                    <div className={`kpi-card ${isDark ? 'kpi-dark' : 'kpi-light'}`}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="kpi-title">TOTAL TASKS</span>
                        <div className="kpi-icon-badge kpi-icon-purple">
                          <Phone size={16} />
                        </div>
                      </div>
                      <div className="kpi-value">{tasks.length}</div>
                      <div className="kpi-subtitle">All logged inquiries & tasks</div>
                    </div>
                  </Col>
                  <Col xl={3} md={6} xs={12}>
                    <div className={`kpi-card ${isDark ? 'kpi-dark' : 'kpi-light'}`}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="kpi-title">TODAY'S SCHEDULE</span>
                        <div className="kpi-icon-badge kpi-icon-blue">
                          <CalendarDays size={16} />
                        </div>
                      </div>
                      <div className="kpi-value">{todayScheduleCount}</div>
                      <div className="kpi-subtitle">Due today (initial + next)</div>
                    </div>
                  </Col>
                  <Col xl={3} md={6} xs={12}>
                    <div className={`kpi-card ${isDark ? 'kpi-dark' : 'kpi-light'}`}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="kpi-title">UPCOMING</span>
                        <div className="kpi-icon-badge kpi-icon-green">
                          <TrendingUp size={16} />
                        </div>
                      </div>
                      <div className="kpi-value">{upcomingCount}</div>
                      <div className="kpi-subtitle">Next task scheduled</div>
                    </div>
                  </Col>
                  <Col xl={3} md={6} xs={12}>
                    <div className={`kpi-card ${isDark ? 'kpi-dark' : 'kpi-light'}`}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="kpi-title">CLOSED / COMPLETED</span>
                        <div className="kpi-icon-badge kpi-icon-gray">
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                      <div className="kpi-value">{metrics.completed}</div>
                      <div className="kpi-subtitle">Completed or closed tasks</div>
                    </div>
                  </Col>
                </Row>

                {/* Main Split Grid (Mini Calendar on Left + Schedule Feed on Right) */}
                <Row className="g-4">
                  {/* Left Column: Mini Calendar Widget */}
                  <Col lg={4} md={5} xs={12}>
                    <div className={`mini-cal-card ${isDark ? 'mini-dark' : 'mini-light'} p-0 rounded-4 overflow-hidden border`}>
                      {/* Mini Calendar Header with Gradient */}
                      <div className="mini-cal-header p-3 d-flex align-items-center justify-content-between text-white">
                        <button type="button" onClick={handlePrevMonth} className="btn-mini-nav" title="Previous Month">
                          <ChevronLeft size={16} />
                        </button>
                        <h6 className="mb-0 fw-bold fs-6 text-white text-center">
                          {monthNames[month]} {year}
                        </h6>
                        <button type="button" onClick={handleNextMonth} className="btn-mini-nav" title="Next Month">
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      {/* Mini Grid Header (S M T W T F S) */}
                      <div className="mini-grid-header py-2 text-center fw-bold fs-8 opacity-75">
                        <span>S</span>
                        <span>M</span>
                        <span>T</span>
                        <span>W</span>
                        <span>T</span>
                        <span>F</span>
                        <span>S</span>
                      </div>

                      {/* Mini Days Grid */}
                      <div className="mini-days-grid p-2">
                        {/* Empty leading padding cells */}
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                          <div key={`mini-empty-${i}`} className="mini-cell-empty" />
                        ))}

                        {/* Month Days */}
                        {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
                          const dayNum = dayIdx + 1
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                          const isSelected = selectedDateStr === dateStr
                          const isToday =
                            new Date().getDate() === dayNum &&
                            new Date().getMonth() === month &&
                            new Date().getFullYear() === year
                          const hasTask = datesWithTasksSet.has(dateStr)

                          return (
                            <button
                              key={`mini-day-${dayNum}`}
                              type="button"
                              onClick={() => setSelectedDateStr(dateStr)}
                              className={`mini-day-cell ${isSelected ? 'active-selected' : ''} ${isToday ? 'is-today' : ''} ${hasTask ? 'has-task' : ''}`}
                            >
                              <span className="mini-day-num">{dayNum}</span>
                              {hasTask && <span className="mini-dot-indicator" />}
                            </button>
                          )
                        })}
                      </div>

                      {/* Mini Calendar Footer Legend */}
                      <div className={`mini-cal-footer p-3 border-top d-flex align-items-center justify-content-center gap-3 fs-8 ${isDark ? 'border-secondary border-opacity-30 text-secondary' : 'border-light-subtle text-muted'}`}>
                        <div className="d-flex align-items-center gap-1.5">
                          <span className="mini-dot-sample bg-primary" />
                          <span>Has Task</span>
                        </div>
                        <div className="d-flex align-items-center gap-1.5">
                          <span className="mini-dot-sample border-today" />
                          <span>Today</span>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* Right Column: Selected Date Task Agenda Feed */}
                  <Col lg={8} md={7} xs={12}>
                    <div className={`schedule-agenda-panel p-4 rounded-4 ${isDark ? 'agenda-dark' : 'agenda-light'} border h-100`}>
                      {/* Agenda Section Title */}
                      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                        <div>
                          <div className="agenda-subtitle text-uppercase tracking-wider fw-bold text-muted fs-8">
                            UPCOMING SCHEDULE
                          </div>
                          <h5 className={`mb-0 fw-bold fs-4 ${isDark ? 'text-white' : 'text-dark'}`}>
                            {formatFullDate(selectedDateStr)}
                          </h5>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <span className="agenda-entry-badge">
                            {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'Entry' : 'Entries'}
                          </span>
                          <Button
                            size="sm"
                            variant={isDark ? 'outline-info' : 'outline-primary'}
                            onClick={() => handleOpenAddModal(selectedDateStr)}
                            className="rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm"
                          >
                            <Plus size={14} /> Add Task
                          </Button>
                        </div>
                      </div>

                      {/* Tasks Feed for Selected Date */}
                      {selectedDateTasks.length > 0 ? (
                        <div className="d-flex flex-column gap-3">
                          {selectedDateTasks.map((t) => {
                            const isDone = t.status === 'COMPLETED'
                            const isUrgent = t.priority === 'URGENT'

                            return (
                              <div
                                key={`agenda-task-${t.id}`}
                                className={`agenda-task-card p-3 rounded-4 transition-all ${isDark ? 'card-dark' : 'card-light'} ${isDone ? 'card-completed' : ''}`}
                              >
                                <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <h6 className={`mb-0 fw-bold fs-6 ${isDark ? 'text-white' : 'text-dark'} ${isDone ? 'text-decoration-line-through text-muted' : ''}`}>
                                      {t.title}
                                    </h6>
                                    {isUrgent && (
                                      <span className="agenda-hot-badge">
                                        <Flame size={11} /> Hot
                                      </span>
                                    )}
                                    <span className="agenda-task-id-badge">
                                      <Pin size={10} />
                                      TASK-{t.id}
                                    </span>
                                  </div>

                                  {/* Quick Action Buttons */}
                                  <div className="d-flex align-items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatus(t)}
                                      className={`btn-action-icon ${isDone ? 'active-done' : ''}`}
                                      title={isDone ? 'Mark as Incomplete' : 'Mark as Complete'}
                                    >
                                      <CheckCircle2 size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditModal(t)}
                                      className="btn-action-icon"
                                      title="Edit Task"
                                    >
                                      <Edit2 size={15} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTask(t.id)}
                                      className="btn-action-icon text-danger"
                                      title="Delete Task"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </div>

                                {/* Status & Priority Badges Row */}
                                <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                                  {renderStatusBadge(t.status)}
                                  {renderPriorityBadge(t.priority)}
                                </div>

                                {/* Metadata Bar (Assignee / Date / Duration) */}
                                <div className="agenda-meta-bar mb-3">
                                  <div className="d-flex align-items-center gap-2">
                                    <UserIcon size={14} className="text-primary opacity-80" />
                                    <span>{getDisplayName(t.assigned_to)}</span>
                                  </div>
                                  <div className="d-flex align-items-center gap-2">
                                    <Clock size={14} className="text-info opacity-80" />
                                    <span>{t.due_date ? formatDate(t.due_date) : 'Flexible'}</span>
                                  </div>
                                  {t.start_date && t.due_date && (
                                    <div className="d-flex align-items-center gap-1.5 text-primary fw-bold">
                                      <CalendarDays size={13} />
                                      <span>{formatDate(t.start_date)}</span>
                                      <ArrowRight size={12} />
                                      <span>{formatDate(t.due_date)}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Task Description / Notes */}
                                {t.description && (
                                  <p className={`mb-0 fs-7 ${isDark ? 'text-light opacity-80' : 'text-secondary'}`}>
                                    {t.description}
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        /* Empty Agenda State */
                        <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center my-4">
                          <div className={`empty-icon-circle mb-3 ${isDark ? 'bg-dark text-info border-secondary' : 'bg-light text-primary border-light-subtle'} border`}>
                            <CalendarDays size={32} />
                          </div>
                          <h6 className={`fw-bold mb-1 ${isDark ? 'text-white' : 'text-dark'}`}>
                            No tasks scheduled for {formatFullDate(selectedDateStr)}
                          </h6>
                          <p className="text-muted fs-7 mb-3" style={{ maxWidth: '320px' }}>
                            You have no pending tasks or appointments on this date. Click below to add a new task.
                          </p>
                          <Button
                            variant={isDark ? 'info' : 'primary'}
                            onClick={() => handleOpenAddModal(selectedDateStr)}
                            className="rounded-pill px-4 fw-bold text-white d-flex align-items-center gap-2 shadow-sm"
                          >
                            <Plus size={16} /> Schedule Task for {selectedDateStr}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            ) : (
              /* Month Grid View (Image 1 style) */
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
                        onClick={() => {
                          setSelectedDateStr(dateStr)
                          handleOpenAddModal(dateStr)
                        }}
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
                              setSelectedDateStr(dateStr)
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
                              className="cal-more-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDateStr(dateStr)
                                setCalSubView('split')
                              }}
                              title={`View all ${dayTasks.length} tasks for ${dateStr}`}
                            >
                              <span>+{dayTasks.length - 2} more tasks</span>
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
            )}
          </Card>
        </div>
      )}

      {/* Add / Edit Task Modal - ULTRA-PREMIUM PRO LEVEL FORM */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" className={`vpm-pro-modal ${isDark ? 'dark-modal' : 'light-modal'}`}>
        <Modal.Header closeButton className={`px-4 py-3 border-bottom ${isDark ? 'bg-dark text-light border-secondary border-opacity-40' : 'bg-white text-dark border-light-subtle'}`}>
          <Modal.Title className={`fw-bold d-flex align-items-center gap-2 ${isDark ? 'text-info' : 'text-primary'} fs-5`}>
            <div className="vpm-modal-icon-badge">
              {editingTask ? <Edit2 size={18} /> : <Plus size={18} />}
            </div>
            <span>{editingTask ? `Edit Task #${editingTask.id}` : 'Create New Shop Task'}</span>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveTask}>
          <Modal.Body className={`${isDark ? 'bg-dark text-light' : 'bg-white text-dark'} p-4`}>
            <div className="d-flex flex-column gap-4">
              {/* SECTION 1: GENERAL TASK DETAILS & INFORMATION */}
              <div className="vpm-form-section">
                <div className="vpm-section-header mb-3">
                  <div className="vpm-section-title">
                    <UserIcon size={16} className="text-primary me-2" />
                    <span>1. GENERAL TASK DETAILS & INFORMATION</span>
                  </div>
                </div>

                <Row className="g-3">
                  {/* Task Title Input with Left Icon Addon */}
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="vpm-input-label">TASK TITLE *</Form.Label>
                      <InputGroup className="vpm-input-group">
                        <InputGroup.Text className={`vpm-input-addon ${isDark ? 'addon-dark' : 'addon-light'}`}>
                          <FileText size={16} />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          required
                          placeholder="e.g. Print 1000 Flex Banners for Apex Corp"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          className={`vpm-control-input ${isDark ? 'input-dark' : 'input-light'}`}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  {/* Task Description */}
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="vpm-input-label">DESCRIPTION & INSTRUCTIONS</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Enter specific printing guidelines, paper stock GSM, client notes..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className={`vpm-control-input vpm-textarea ${isDark ? 'input-dark' : 'input-light'}`}
                      />
                    </Form.Group>
                  </Col>

                  {/* Assigned Employee Select with Left Addon */}
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="vpm-input-label">ASSIGNED EMPLOYEE / OPERATOR</Form.Label>
                      <InputGroup className="vpm-input-group">
                        <InputGroup.Text className={`vpm-input-addon ${isDark ? 'addon-dark' : 'addon-light'}`}>
                          <UserCheck size={16} />
                        </InputGroup.Text>
                        <Form.Select
                          value={formAssignedTo}
                          onChange={(e) => setFormAssignedTo(e.target.value)}
                          className={`vpm-control-input ${isDark ? 'input-dark' : 'input-light'}`}
                        >
                          <option value="">Unassigned (Open Pool)</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {getDisplayName(u)} (@{u.username})
                            </option>
                          ))}
                        </Form.Select>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* SECTION 2: PRIORITY & WORKFLOW STATUS */}
              <div className="vpm-form-section">
                <div className="vpm-section-header mb-3">
                  <div className="vpm-section-title">
                    <ShieldCheck size={16} className="text-primary me-2" />
                    <span>2. PRIORITY LEVEL & WORKFLOW STATUS *</span>
                  </div>
                </div>

                {/* Rich Selectable Priority Card Grid */}
                <div className="mb-3">
                  <Form.Label className="vpm-input-label mb-2">SELECT PRIORITY</Form.Label>
                  <Row className="g-2">
                    {[
                      { id: 'URGENT', title: 'Urgent Priority', desc: 'Critical order - Fast-track', icon: Flame, colorClass: 'card-p-urgent' },
                      { id: 'HIGH', title: 'High Priority', desc: 'Important client deadline', icon: Zap, colorClass: 'card-p-high' },
                      { id: 'MEDIUM', title: 'Medium Priority', desc: 'Standard production queue', icon: Target, colorClass: 'card-p-medium' },
                      { id: 'LOW', title: 'Low Priority', desc: 'Flexible delivery schedule', icon: Clock, colorClass: 'card-p-low' }
                    ].map((item) => {
                      const IconComp = item.icon
                      const isSelected = formPriority === item.id
                      return (
                        <Col key={item.id} md={6} xs={12}>
                          <div
                            onClick={() => setFormPriority(item.id as any)}
                            className={`vpm-role-card ${item.colorClass} ${isSelected ? 'selected' : ''} ${isDark ? 'role-dark' : 'role-light'}`}
                          >
                            <div className="vpm-role-icon">
                              <IconComp size={18} />
                            </div>
                            <div className="vpm-role-info">
                              <div className="vpm-role-name">{item.title}</div>
                              <div className="vpm-role-desc">{item.desc}</div>
                            </div>
                            {isSelected && (
                              <div className="vpm-check-badge">
                                <Check size={14} />
                              </div>
                            )}
                          </div>
                        </Col>
                      )
                    })}
                  </Row>
                </div>

                {/* Status Selection Chips */}
                <div>
                  <Form.Label className="vpm-input-label mb-2">WORKFLOW STATUS</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {[
                      { id: 'PENDING', label: 'Pending', icon: AlertCircle, variant: 'status-chip-pending' },
                      { id: 'IN_PROGRESS', label: 'In Progress', icon: Clock, variant: 'status-chip-progress' },
                      { id: 'COMPLETED', label: 'Completed', icon: CheckCircle2, variant: 'status-chip-completed' },
                      { id: 'CANCELLED', label: 'Cancelled', icon: XCircle, variant: 'status-chip-cancelled' }
                    ].map((st) => {
                      const StIcon = st.icon
                      const isSel = formStatus === st.id
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setFormStatus(st.id as any)}
                          className={`vpm-status-chip ${st.variant} ${isSel ? 'selected' : ''} ${isDark ? 'chip-dark' : 'chip-light'}`}
                        >
                          <StIcon size={14} />
                          <span>{st.label}</span>
                          {isSel && <Check size={12} className="ms-1" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 3: SCHEDULE & DATES */}
              <div className="vpm-form-section">
                <div className="vpm-section-header mb-3">
                  <div className="vpm-section-title">
                    <CalendarDays size={16} className="text-primary me-2" />
                    <span>3. PRODUCTION TIMELINE & DEADLINES</span>
                  </div>
                </div>

                <Row className="g-3">
                  {/* Start Date */}
                  <Col md={6} xs={12}>
                    <Form.Group>
                      <Form.Label className="vpm-input-label">START DATE</Form.Label>
                      <InputGroup className="vpm-input-group">
                        <InputGroup.Text className={`vpm-input-addon ${isDark ? 'addon-dark' : 'addon-light'}`}>
                          <CalendarDays size={16} />
                        </InputGroup.Text>
                        <Form.Control
                          type="date"
                          value={formStartDate}
                          onChange={(e) => setFormStartDate(e.target.value)}
                          className={`vpm-control-input ${isDark ? 'input-dark' : 'input-light'}`}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  {/* Due Date */}
                  <Col md={6} xs={12}>
                    <Form.Group>
                      <Form.Label className="vpm-input-label">DUE / DELIVERY DATE</Form.Label>
                      <InputGroup className="vpm-input-group">
                        <InputGroup.Text className={`vpm-input-addon ${isDark ? 'addon-dark' : 'addon-light'}`}>
                          <Clock size={16} />
                        </InputGroup.Text>
                        <Form.Control
                          type="date"
                          value={formDueDate}
                          onChange={(e) => setFormDueDate(e.target.value)}
                          className={`vpm-control-input ${isDark ? 'input-dark' : 'input-light'}`}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className={`px-4 py-3 border-top ${isDark ? 'bg-dark border-secondary border-opacity-40' : 'bg-white border-light-subtle'}`}>
            <Button variant={isDark ? 'outline-secondary' : 'outline-dark'} onClick={() => setShowModal(false)} className="rounded-pill px-4 fw-bold">
              Cancel
            </Button>
            <Button variant={isDark ? 'info' : 'primary'} type="submit" disabled={submitting} className={`rounded-pill px-5 fw-bold ${isDark ? 'text-dark' : 'text-white'} shadow-sm`}>
              {submitting ? <Spinner size="sm" animation="border" /> : editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </div>
  )
}
