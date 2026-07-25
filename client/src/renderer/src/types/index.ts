// ── Auth Types ───────────────────────────────────────────────

export interface UserRole {
  id: number
  name: string
  label: string
}

export interface UserCompany {
  id: number
  name: string
  gstNumber: string | null
  address: string | null
  phone: string | null
}

export interface AuthUser {
  id: number
  fullName: string
  username: string
  status: 'ACTIVE' | 'INACTIVE'
  lastLogin: string | null
  role: UserRole
  permissions: string[]
  company: UserCompany
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

// ── API Response Wrapper ─────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  statusCode: number
  message: string
  data: T
}

// ── Role ─────────────────────────────────────────────────────

export type RoleName = 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'SALES' | 'CASHIER' | 'OPERATOR'

export interface Role {
  id: number
  name: RoleName
  label: string
}
