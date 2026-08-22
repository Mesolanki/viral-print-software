/**
 * Viral Print Media — API Client
 * Centralised Axios instance that communicates with the Express backend.
 */

import axios, { type AxiosError, type AxiosResponse } from 'axios'

// ── Constants ────────────────────────────────────────────────
const API_HOST =
  typeof window !== 'undefined' && window.location?.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? window.location.hostname
    : (typeof localStorage !== 'undefined' && localStorage.getItem('vpm_server_ip')) || 'localhost'

const BASE_URL = `http://${API_HOST}:5000/api`
const TOKEN_KEY = 'vpm_auth_token'


// ── Axios Instance ───────────────────────────────────────────
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// ── Request Interceptor — attach JWT ─────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response Interceptor — handle errors globally ────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
    }
    return Promise.reject(error)
  }
)

// ── Token helpers ────────────────────────────────────────────
export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  remove: (): void => localStorage.removeItem(TOKEN_KEY),
}

// ── Auth API ─────────────────────────────────────────────────
export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  fullName: string
  username: string
  password: string
}

export interface ChangePasswordPayload {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export const authApi = {
  login: (payload: LoginPayload) => apiClient.post('/auth/login', payload),
  register: (payload: RegisterPayload) => apiClient.post('/auth/register', payload),
  getMe: () => apiClient.get('/auth/me'),
  changePassword: (payload: ChangePasswordPayload) => apiClient.patch('/auth/change-password', payload),
  logout: () => { tokenStorage.remove() },
}

// ── User Management API ──────────────────────────────────────
export interface CreateUserPayload {
  fullName: string
  username: string
  password: string
  confirmPassword: string
  role: string
  status: string
}

export const usersApi = {
  getAll: () => apiClient.get('/users'),
  getById: (id: number) => apiClient.get(`/users/${id}`),
  create: (payload: CreateUserPayload) => apiClient.post('/users', payload),
  update: (id: number, payload: Partial<CreateUserPayload>) => apiClient.patch(`/users/${id}`, payload),
  toggleStatus: (id: number) => apiClient.patch(`/users/${id}/toggle-status`),
  resetPassword: (id: number, newPassword: string) => apiClient.post(`/users/${id}/reset-password`, { newPassword }),
  getRoles: () => apiClient.get('/users/roles'),
}

// ── Customer & GST API ───────────────────────────────────────
export interface CustomerData {
  id?: number
  name: string
  mobile?: string
  email?: string
  gst_no?: string
  billing_address?: string
}

export const customersApi = {
  getAll: (query?: string) => apiClient.get('/customers', { params: { query } }),
  lookupGst: (gstNo: string) => apiClient.get(`/customers/lookup-gst/${encodeURIComponent(gstNo)}`),
  save: (customer: CustomerData) => apiClient.post('/customers', customer),
}

// ── Products API ─────────────────────────────────────────────
export const productsApi = {
  getAll: (companyId: number = 1, search?: string) =>
    apiClient.get('/products', { params: { company_id: companyId, search } }),
}

// ── Invoices API (Multi-PC Sync) ─────────────────────────────
export const invoicesApi = {
  getAll: (type?: string, query?: string) => apiClient.get('/invoices', { params: { type, query } }),
  save: (invoice: any) => apiClient.post('/invoices', invoice),
  delete: (id: number) => apiClient.delete(`/invoices/${id}`),
}

export default apiClient

