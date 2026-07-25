/**
 * AuthContext — Global authentication state management.
 * Wraps the entire app and provides login, logout, and user state.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { authApi, tokenStorage } from '../api/apiClient'
import type { AuthUser, LoginResponse } from '../types'

// ── Context Shape ────────────────────────────────────────────
interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<LoginResponse>
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(tokenStorage.get())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Re-hydrate user from stored token on app start
  useEffect(() => {
    const storedToken = tokenStorage.get()
    if (!storedToken) {
      setIsLoading(false)
      return
    }

    authApi
      .getMe()
      .then((res) => {
        setUser(res.data.data)
        setToken(storedToken)
      })
      .catch(() => {
        // Token invalid, expired, or server unreachable — clear silently
        tokenStorage.remove()
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(
    async (username: string, password: string): Promise<LoginResponse> => {
      const res = await authApi.login({ username, password })
      const data: LoginResponse = res.data.data

      tokenStorage.set(data.token)
      setToken(data.token)
      setUser(data.user)

      return data
    },
    []
  )

  const logout = useCallback(() => {
    tokenStorage.remove()
    setToken(null)
    setUser(null)
  }, [])

  const hasPermission = useCallback(
    (permission: string): boolean => {
      return user?.permissions?.includes(permission) ?? false
    },
    [user]
  )

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Hook ─────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}
