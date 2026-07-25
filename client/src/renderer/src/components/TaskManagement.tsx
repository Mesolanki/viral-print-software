import React, { useState, useEffect, useMemo } from 'react'
import {
  Row,
  Col,
  Card,
  Button,
  Badge,
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
  Sparkles
} from 'lucide-react'

const API_HOST = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost'
const API_BASE_URL = `http://${API_HOST}:3000/api`
const DEFAULT_COMPANY_ID = 1

export interface UserEmployee {
  id: number
  name: string
  username: string
  role?: {
    id: number
    name: string
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
    try {
      // Fetch users
      const usersRes = await fetch(`${API_BASE_URL}/users?company_id=${DEFAULT_COMPANY_ID}`)
      if (usersRes.ok) {
        const usersJson = await usersRes.json()
        const usersData = Array.isArray(usersJson) ? usersJson : (usersJson.data || [])
        setUsers(usersData)
      }

      // Fetch tasks
      const tasksRes = await fetch(`${API_BASE_URL}/tasks?company_id=${DEFAULT_COMPANY_ID}`)
      if (tasksRes.ok) {
        const tasksJson = await tasksRes.json()
        const tasksData = Array.isArray(tasksJson) ? tasksJson : (tasksJson.data || [])
        setTasks(tasksData)
      } else {
        // Fallback demo data if DB empty or server initializing
        setTasks(getSampleTasks())
      }
    } catch (err) {
      console.warn('API unavailable, using fallback mock data', err)
      setTasks(getSampleTasks())
      setUsers([
        { id: 1, name: 'Admin User', username: 'admin' },
        { id: 2, name: 'Rahul Sharma', username: 'rahul' },
        { id: 3, name: 'Priya Patel', username: 'priya' },
        { id: 4, name: 'Amit Kumar', username: 'amit' }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Sample tasks for initial demo or fallback
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
        assigned_to: { id: 2, name: 'Rahul Sharma', username: 'rahul' }
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
        assigned_to: { id: 3, name: 'Priya Patel', username: 'priya' }
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
        assigned_to: { id: 4, name: 'Amit Kumar', username: 'amit' }
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

    try {
      let updatedTask: TaskItem

      if (editingTask) {
        // PUT update
        const res = await fetch(`${API_BASE_URL}/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (res.ok) {
          const resJson = await res.json()
          updatedTask = resJson.data || resJson
        } else {
          // Local state update fallback
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (res.ok) {
          const resJson = await res.json()
          updatedTask = resJson.data || resJson
        } else {
          // Local state fallback
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
      // Fallback local update
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

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)))

    try {
      await fetch(`${API_BASE_URL}/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
      await fetch(`${API_BASE_URL}/tasks/${taskId}`, { method: 'DELETE' })
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

  // Priority styling badges
  const renderPriorityBadge = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'URGENT':
        return <Badge bg="danger" className="px-2 py-1 shadow-sm text-uppercase font-monospace fs-7">Urgent</Badge>
      case 'HIGH':
        return <Badge bg="warning" className="text-dark px-2 py-1 shadow-sm text-uppercase font-monospace fs-7">High</Badge>
      case 'MEDIUM':
        return <Badge bg="info" className="text-dark px-2 py-1 shadow-sm text-uppercase font-monospace fs-7">Medium</Badge>
      case 'LOW':
        return <Badge bg="secondary" className="px-2 py-1 shadow-sm text-uppercase font-monospace fs-7">Low</Badge>
    }
  }

  // Status styling badges
  const renderStatusBadge = (status: TaskItem['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge bg="success" className="px-2 py-1 shadow-sm d-inline-flex align-items-center gap-1">
            <CheckCircle2 size={12} /> Done
          </Badge>
        )
      case 'IN_PROGRESS':
        return (
          <Badge bg="primary" className="px-2 py-1 shadow-sm d-inline-flex align-items-center gap-1">
            <Clock size={12} /> In Progress
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge bg="warning" className="text-dark px-2 py-1 shadow-sm d-inline-flex align-items-center gap-1">
            <AlertCircle size={12} /> Pending
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge bg="dark" className="border border-secondary text-secondary px-2 py-1 d-inline-flex align-items-center gap-1">
            <XCircle size={12} /> Cancelled
          </Badge>
        )
    }
  }

  return (
    <div className="py-2">
      {/* Toast Alert */}
      {successMsg && (
        <Alert variant="success" onClose={() => setSuccessMsg(null)} dismissible className="shadow-lg border-success">
          <Sparkles size={18} className="me-2 d-inline" />
          {successMsg}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="shadow-lg border-danger">
          <AlertCircle size={18} className="me-2 d-inline" />
          {error}
        </Alert>
      )}

      {/* Header & Main Controls */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className={`fw-bold mb-1 d-flex align-items-center gap-2 ${isDark ? 'text-light' : 'text-dark'}`}>
            <CalendarDays className={isDark ? 'text-info' : 'text-primary'} size={28} />
            To-Do & Task Management
          </h2>
          <p className={isDark ? 'text-secondary mb-0' : 'text-muted mb-0'}>
            Organize print shop orders, assign employees, track status, and view calendar schedule.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* View Mode Switcher */}
          <div className={`btn-group ${isDark ? 'bg-dark border-secondary' : 'bg-light border-light-subtle'} border p-1 rounded-3 shadow-sm`}>
            <Button
              variant={viewMode === 'list' ? (isDark ? 'info' : 'primary') : (isDark ? 'dark' : 'light')}
              size="sm"
              className={viewMode === 'list' ? (isDark ? 'text-dark fw-bold' : 'text-white fw-bold') : (isDark ? 'text-secondary border-0' : 'text-dark border-0')}
              onClick={() => setViewMode('list')}
            >
              <ListIcon size={16} className="me-1" /> List View
            </Button>
            <Button
              variant={viewMode === 'calendar' ? (isDark ? 'info' : 'primary') : (isDark ? 'dark' : 'light')}
              size="sm"
              className={viewMode === 'calendar' ? (isDark ? 'text-dark fw-bold' : 'text-white fw-bold') : (isDark ? 'text-secondary border-0' : 'text-dark border-0')}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon size={16} className="me-1" /> Calendar View
            </Button>
          </div>

          <Button
            variant={isDark ? 'info' : 'primary'}
            className={`${isDark ? 'text-dark' : 'text-white'} fw-bold px-3 shadow-sm d-flex align-items-center gap-1`}
            onClick={() => handleOpenAddModal()}
          >
            <Plus size={18} /> Add Task
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={2} className="flex-grow-1">
          <Card className={`${isDark ? 'bg-dark bg-opacity-75 border-secondary text-light' : 'bg-white border-light-subtle text-dark'} shadow-sm h-100`}>
            <Card.Body className="p-3">
              <div className={`${isDark ? 'text-secondary' : 'text-muted'} fs-7 text-uppercase font-monospace fw-bold mb-1`}>Total Tasks</div>
              <div className={`fs-3 fw-bold ${isDark ? 'text-light' : 'text-dark'}`}>{metrics.total}</div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={2} className="flex-grow-1">
          <Card className={`${isDark ? 'bg-dark bg-opacity-75 border-secondary text-light' : 'bg-white border-light-subtle text-dark'} shadow-sm h-100 border-start border-warning border-4`}>
            <Card.Body className="p-3">
              <div className="text-warning fs-7 text-uppercase font-monospace fw-bold mb-1">Pending</div>
              <div className="fs-3 fw-bold text-warning">{metrics.pending}</div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={2} className="flex-grow-1">
          <Card className={`${isDark ? 'bg-dark bg-opacity-75 border-secondary text-light' : 'bg-white border-light-subtle text-dark'} shadow-sm h-100 border-start border-primary border-4`}>
            <Card.Body className="p-3">
              <div className="text-primary fs-7 text-uppercase font-monospace fw-bold mb-1">In Progress</div>
              <div className="fs-3 fw-bold text-primary">{metrics.inProgress}</div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={2} className="flex-grow-1">
          <Card className={`${isDark ? 'bg-dark bg-opacity-75 border-secondary text-light' : 'bg-white border-light-subtle text-dark'} shadow-sm h-100 border-start border-success border-4`}>
            <Card.Body className="p-3">
              <div className="text-success fs-7 text-uppercase font-monospace fw-bold mb-1">Completed</div>
              <div className="fs-3 fw-bold text-success">{metrics.completed}</div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={2} className="flex-grow-1">
          <Card className={`${isDark ? 'bg-dark bg-opacity-75 border-secondary text-light' : 'bg-white border-light-subtle text-dark'} shadow-sm h-100 border-start border-danger border-4`}>
            <Card.Body className="p-3">
              <div className="text-danger fs-7 text-uppercase font-monospace fw-bold mb-1">Overdue</div>
              <div className="fs-3 fw-bold text-danger">{metrics.overdue}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters Toolbar */}
      <Card className={`${isDark ? 'bg-secondary bg-opacity-10 border-secondary text-light' : 'bg-white border-light-subtle text-dark'} mb-4 shadow-sm`}>
        <Card.Body className="p-3">
          <Row className="g-2 align-items-center">
            {/* Search */}
            <Col lg={4} md={12}>
              <InputGroup size="sm">
                <InputGroup.Text className={isDark ? 'bg-dark border-secondary text-secondary' : 'bg-light border-light-subtle text-muted'}>
                  <Search size={14} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search tasks by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={isDark ? 'bg-dark text-light border-secondary placeholder-secondary' : 'bg-white text-dark border-light-subtle'}
                />
              </InputGroup>
            </Col>

            {/* Status Filter */}
            <Col lg={2} md={4} xs={6}>
              <Form.Select
                size="sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={isDark ? 'bg-dark text-light border-secondary' : 'bg-white text-dark border-light-subtle'}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Form.Select>
            </Col>

            {/* Priority Filter */}
            <Col lg={2} md={4} xs={6}>
              <Form.Select
                size="sm"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={isDark ? 'bg-dark text-light border-secondary' : 'bg-white text-dark border-light-subtle'}
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </Form.Select>
            </Col>

            {/* Assignee Filter */}
            <Col lg={3} md={4} xs={12}>
              <Form.Select
                size="sm"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className={isDark ? 'bg-dark text-light border-secondary' : 'bg-white text-dark border-light-subtle'}
              >
                <option value="ALL">All Employees / Assignees</option>
                <option value="UNASSIGNED">Unassigned Tasks</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (@{u.username})
                  </option>
                ))}
              </Form.Select>
            </Col>

            {/* Reset Filters */}
            <Col lg={1} md={12} className="text-end">
              <Button
                variant={isDark ? 'outline-secondary' : 'outline-dark'}
                size="sm"
                className="w-100"
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

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="info" />
          <p className="text-secondary mt-2">Loading tasks and employee roster...</p>
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        <div>
          {filteredTasks.length === 0 ? (
            <Card className="bg-dark border-secondary text-center py-5 shadow-sm">
              <Card.Body className="text-secondary">
                <Filter size={40} className="mb-3 opacity-50" />
                <h5>No Tasks Found</h5>
                <p className="mb-3">No tasks match your filter criteria or search query.</p>
                <Button variant="outline-info" size="sm" onClick={() => handleOpenAddModal()}>
                  Create New Task
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <div className="d-flex flex-column gap-3">
              {filteredTasks.map((t) => {
                const isCompleted = t.status === 'COMPLETED'
                const todayStr = new Date().toISOString().split('T')[0]
                const dueDateStr = t.due_date ? t.due_date.split('T')[0] : null
                const isOverdue = !isCompleted && dueDateStr && dueDateStr < todayStr

                return (
                  <Card
                    key={t.id}
                    className={`${isDark ? 'bg-dark border-secondary text-light' : 'bg-white border-light-subtle text-dark'} shadow-sm transition-all ${isCompleted ? 'opacity-75 border-start border-success border-4' : isOverdue ? 'border-start border-danger border-4' : isDark ? 'border-start border-info border-4' : 'border-start border-primary border-4'
                      }`}
                  >
                    <Card.Body className="p-3">
                      <Row className="align-items-center gy-2">
                        {/* Checkbox & Status */}
                        <Col xs="auto">
                          <Form.Check
                            type="checkbox"
                            checked={isCompleted}
                            onChange={() => handleToggleStatus(t)}
                            className="fs-4 custom-checkbox"
                          />
                        </Col>

                        {/* Title & Description */}
                        <Col className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                            <h5 className={`mb-0 fw-bold ${isCompleted ? 'text-decoration-line-through text-secondary' : 'text-light'}`}>
                              {t.title}
                            </h5>
                            {renderPriorityBadge(t.priority)}
                            {renderStatusBadge(t.status)}
                          </div>
                          {t.description && (
                            <p className="text-secondary fs-7 mb-2 line-clamp-2">{t.description}</p>
                          )}

                          <div className="d-flex align-items-center gap-3 text-secondary fs-7 flex-wrap">
                            {/* Assigned Employee */}
                            <span className="d-flex align-items-center gap-1 bg-secondary bg-opacity-25 px-2 py-1 rounded text-light">
                              <UserCheck size={14} className="text-info" />
                              {t.assigned_to ? t.assigned_to.name : <span className="fst-italic opacity-75">Unassigned</span>}
                            </span>

                            {/* Start Date */}
                            {t.start_date && (
                              <span>
                                Start: <span className="text-light">{t.start_date.split('T')[0]}</span>
                              </span>
                            )}

                            {/* Due Date */}
                            {dueDateStr && (
                              <span className={isOverdue ? 'text-danger fw-bold d-flex align-items-center gap-1' : ''}>
                                {isOverdue && <AlertCircle size={14} />}
                                Due: {dueDateStr}
                              </span>
                            )}
                          </div>
                        </Col>

                        {/* Status Select & Actions */}
                        <Col xs="auto" className="d-flex align-items-center gap-2">
                          <Dropdown>
                            <Dropdown.Toggle variant="outline-secondary" size="sm" className="text-light fs-7">
                              Status
                            </Dropdown.Toggle>
                            <Dropdown.Menu variant="dark">
                              <Dropdown.Item onClick={() => handleChangeStatus(t, 'PENDING')}>Pending</Dropdown.Item>
                              <Dropdown.Item onClick={() => handleChangeStatus(t, 'IN_PROGRESS')}>In Progress</Dropdown.Item>
                              <Dropdown.Item onClick={() => handleChangeStatus(t, 'COMPLETED')}>Completed</Dropdown.Item>
                              <Dropdown.Item onClick={() => handleChangeStatus(t, 'CANCELLED')}>Cancelled</Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>

                          <Button
                            variant="outline-info"
                            size="sm"
                            title="Edit Task"
                            onClick={() => handleOpenEditModal(t)}
                          >
                            <Edit2 size={14} />
                          </Button>

                          <Button
                            variant="outline-danger"
                            size="sm"
                            title="Delete Task"
                            onClick={() => handleDeleteTask(t.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* CALENDAR VIEW */
        <Card className={`${isDark ? 'bg-dark border-secondary text-light' : 'bg-white border-light-subtle text-dark'} shadow-lg border-0 rounded-4 overflow-hidden`}>
          {/* Calendar Header Navigation */}
          <Card.Header className={`${isDark ? 'bg-dark bg-opacity-75 border-secondary' : 'bg-light border-light-subtle'} border-bottom p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3`}>
            <div className="d-flex align-items-center gap-3">
              <h3 className={`mb-0 fw-bold ${isDark ? 'text-info' : 'text-primary'} me-2`}>
                {monthNames[month]} {year}
              </h3>
              <div className="btn-group rounded-pill overflow-hidden shadow-sm border">
                <Button variant={isDark ? 'dark' : 'white'} size="sm" onClick={handlePrevMonth} className="px-3 border-0">
                  <ChevronLeft size={16} /> Prev
                </Button>
                <Button variant={isDark ? 'info' : 'primary'} size="sm" onClick={handleToday} className={`${isDark ? 'text-dark' : 'text-white'} px-3 fw-semibold`}>
                  Today
                </Button>
                <Button variant={isDark ? 'dark' : 'white'} size="sm" onClick={handleNextMonth} className="px-3 border-0">
                  Next <ChevronRight size={16} />
                </Button>
              </div>
            </div>

            <div className={`fs-7 fw-medium ${isDark ? 'text-secondary' : 'text-muted'}`}>
              💡 Click on any calendar date cell to quickly schedule a task for that day.
            </div>
          </Card.Header>

          <Card.Body className="p-0">
            {/* Day Header Row */}
            <div className={`d-grid grid-cols-7 border-bottom ${isDark ? 'border-secondary bg-dark bg-opacity-50 text-secondary' : 'border-light-subtle bg-light text-secondary'} text-center fw-bold py-3 fs-7 text-uppercase letter-spacing-1`}>
              <div className="text-danger">Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div className="text-info">Sat</div>
            </div>

            {/* Calendar Month Grid */}
            <div className={`d-grid grid-cols-7 calendar-grid ${isDark ? 'text-light' : 'text-dark'}`}>
              {/* Empty leading padding cells */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className={`p-2 border-end border-bottom ${isDark ? 'border-secondary bg-dark bg-opacity-40' : 'border-light-subtle bg-light bg-opacity-50'} min-vh-15 empty-cell`}
                />
              ))}

              {/* Month Day Cells */}
              {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
                const dayNum = dayIdx + 1
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`

                const isToday =
                  new Date().getDate() === dayNum &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year

                // Find tasks matching due date or start date
                const dayTasks = filteredTasks.filter((t) => {
                  const tDue = t.due_date ? t.due_date.split('T')[0] : null
                  const tStart = t.start_date ? t.start_date.split('T')[0] : null
                  return tDue === dateStr || tStart === dateStr
                })

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`p-2 border-end border-bottom ${isDark ? 'border-secondary' : 'border-light-subtle'} min-vh-15 day-cell position-relative transition-all cursor-pointer ${isToday
                        ? isDark
                          ? 'bg-info bg-opacity-10 border-info border-2'
                          : 'bg-primary bg-opacity-10 border-primary border-2'
                        : isDark
                          ? 'bg-dark'
                          : 'bg-white'
                      }`}
                    onClick={() => handleOpenAddModal(dateStr)}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span
                        className={`fw-bold font-monospace px-2 py-1 rounded-circle fs-7 d-inline-flex align-items-center justify-content-center ${isToday
                            ? isDark
                              ? 'bg-info text-dark shadow-sm'
                              : 'bg-primary text-white shadow-sm'
                            : isDark
                              ? 'text-light opacity-75'
                              : 'text-dark opacity-75'
                          }`}
                        style={{ width: '26px', height: '26px' }}
                      >
                        {dayNum}
                      </span>
                      {dayTasks.length > 0 && (
                        <Badge bg={isDark ? 'secondary' : 'light'} className={`fs-8 fw-semibold ${isDark ? 'text-light' : 'text-dark border'}`}>
                          {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                        </Badge>
                      )}
                    </div>

                    {/* Task Chips in Calendar Cell */}
                    <div className="d-flex flex-column gap-1 overflow-hidden" style={{ maxHeight: '72px' }}>
                      {dayTasks.slice(0, 2).map((t) => {
                        const isDone = t.status === 'COMPLETED'
                        const isUrgent = t.priority === 'URGENT'
                        const isHigh = t.priority === 'HIGH'

                        return (
                          <div
                            key={`cal-t-${t.id}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEditModal(t)
                            }}
                            className={`px-2 py-0.5 rounded-2 fs-8 d-flex align-items-center justify-content-between cursor-pointer border transition-all task-chip ${isDone
                                ? 'bg-success bg-opacity-15 border-success text-success text-decoration-line-through'
                                : isUrgent
                                  ? 'bg-danger bg-opacity-15 border-danger text-danger fw-semibold'
                                  : isHigh
                                    ? 'bg-warning bg-opacity-20 border-warning text-warning-emphasis fw-semibold'
                                    : isDark
                                      ? 'bg-secondary bg-opacity-20 border-secondary text-light'
                                      : 'bg-light border-light-subtle text-dark'
                              }`}
                          >
                            <span className="text-truncate fw-medium">{t.title}</span>
                            {t.assigned_to && (
                              <span className="ms-1 opacity-75 font-monospace fs-8 border-start ps-1">
                                {t.assigned_to.name.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        )
                      })}
                      {dayTasks.length > 2 && (
                        <div className={`fs-8 text-center font-semibold opacity-75 ${isDark ? 'text-info' : 'text-primary'}`}>
                          +{dayTasks.length - 2} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Trailing empty cells to complete the grid cleanly */}
              {Array.from({ length: trailingEmptyCount }).map((_, i) => (
                <div
                  key={`trailing-${i}`}
                  className={`p-2 border-end border-bottom ${isDark ? 'border-secondary bg-dark bg-opacity-40' : 'border-light-subtle bg-light bg-opacity-50'} min-vh-15 empty-cell`}
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
                        {u.name} (@{u.username})
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

      {/* Grid & Modern CSS Helper Styling */}
      <style>{`
        .grid-cols-7 {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
        }
        .min-vh-15 {
          min-height: 98px;
        }
        .day-cell {
          transition: all 0.15s ease-in-out;
        }
        .day-cell:hover {
          transform: translateY(-1px);
          box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.4);
          z-index: 2;
        }
        .task-chip:hover {
          transform: scale(1.02);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
        }
        .empty-cell {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0, 0, 0, 0.02) 10px, rgba(0, 0, 0, 0.02) 20px);
        }
        .letter-spacing-1 {
          letter-spacing: 1px;
        }
        .fs-7 {
          font-size: 0.82rem;
        }
        .fs-8 {
          font-size: 0.72rem;
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
