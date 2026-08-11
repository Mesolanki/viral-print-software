/**
 * LoginPage.tsx — Admin Sign In Portal
 * Viral Print Media | Ultra-Premium Glassmorphic Design
 */

import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, LogIn, User, Lock,
  AlertCircle, Loader2, CheckCircle2,
  ArrowRight, Check
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { AxiosError } from 'axios'
import './LoginPage.css'

import viralLogo from '../assets/logo_viral.png'

// ── Stat Badge ────────────────────────────────────────────────
function Stat({ value, label }: { value: string; label: string }): React.JSX.Element {
  return (
    <div className="lp-stat">
      <span className="lp-stat-value">{value}</span>
      <span className="lp-stat-label">{label}</span>
    </div>
  )
}

// ── Main Auth Portal Page ──────────────────────────────────────
export default function LoginPage(): React.JSX.Element {
  const navigate = useNavigate()
  const auth = useAuth()

  // Form input states
  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  
  // UI states
  const [showPw, setShowPw]             = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState(false)
  const [mounted, setMounted]           = useState(false)
  
  // Field errors
  const [errs, setErrs]                 = useState({ username: '', password: '' })

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  // Form Validation
  function validate(): boolean {
    const e = { username: '', password: '' }
    
    if (!username.trim()) {
      e.username = 'Username is required'
    }
    if (!password) {
      e.password = 'Password is required'
    }

    setErrs(e)
    return !e.username && !e.password
  }

  // Handle Form Submission
  async function handleSubmit(ev: FormEvent): Promise<void> {
    ev.preventDefault()
    setError(null)
    if (!validate()) return

    setLoading(true)
    try {
      await auth.login(username.trim(), password)
      setSuccess(true)
      setTimeout(() => {
        if (navigate) {
          navigate('/dashboard', { replace: true })
        }
      }, 800)
    } catch (err) {
      const e = err as AxiosError<{ message: string }>
      if (e.response?.data?.message) {
        setError(e.response.data.message)
      } else if (e.message?.includes('Network Error')) {
        setError('Cannot connect to server on port 5000. Make sure backend is running.')
      } else {
        setError('Invalid username or password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Background ambient floating particles
  const particles = Array.from({ length: 16 }, (_, i) => ({
    cls: ['a', 'b', 'c'][i % 3],
    left: `${5 + (i * 6.1) % 90}%`,
    delay: `${(i * 0.7) % 12}s`,
    dur: `${10 + (i * 1.2) % 12}s`,
  }))

  return (
    <div className={`lp-root ${mounted ? 'lp-root--mounted' : ''}`}>

      {/* ── Dynamic Ambient Glow Orbs & Particles ── */}
      <div className="lp-bg">
        <div className="lp-orb lp-orb--1" />
        <div className="lp-orb lp-orb--2" />
        <div className="lp-orb lp-orb--3" />
        <div className="lp-orb lp-orb--4" />
        {particles.map((p, i) => (
          <div
            key={i}
            className={`lp-particle lp-particle--${p.cls}`}
            style={{ left: p.left, animationDelay: p.delay, animationDuration: p.dur }}
          />
        ))}
      </div>

      {/* ══ LEFT HERO PANEL (Branding & Info) ══════════════════════════ */}
      <div className="lp-left">
        <div className="lp-left__inner">

          {/* Brand Logo & Name */}
          <div className="lp-brand">
            <img src={viralLogo} alt="Viral Print Media Management" style={{ height: '62px', objectFit: 'contain', filter: 'drop-shadow(0 4px 16px rgba(0, 210, 255, 0.35))' }} />
          </div>

          {/* Headline & Body */}
          <div className="lp-tagline">
            <h2 className="lp-tagline__headline">
              Elevate Your 
              <span> Print & Media </span>
              Enterprise
            </h2>
            <p className="lp-tagline__body">
              All-in-one smart billing, customer management, inventory tracking, and sales analytics system engineered for peak productivity.
            </p>
          </div>

          {/* Key Feature Highlights */}
          <div className="lp-features">
            <div className="lp-feature-item">
              <div className="lp-feature-icon"><Check size={14} /></div>
              <span>Fast POS Billing & GST Invoice Generation</span>
            </div>
            <div className="lp-feature-item">
              <div className="lp-feature-icon"><Check size={14} /></div>
              <span>Role-based Access & Multi-User Support</span>
            </div>
            <div className="lp-feature-item">
              <div className="lp-feature-icon"><Check size={14} /></div>
              <span>Offline-First Reliability with Instant Sync</span>
            </div>
          </div>

          {/* Stats Counter Row */}
          <div className="lp-stats">
            <Stat value="6" label="User Roles" />
            <Stat value="16+" label="Permissions" />
            <Stat value="100%" label="Offline Ready" />
          </div>
        </div>
      </div>

      {/* ══ CENTER DIVIDER ════════════════════════════════════════════ */}
      <div className="lp-divider" aria-hidden="true" />

      {/* ══ RIGHT PANEL (Auth Container Card) ══════════════════════════ */}
      <div className="lp-right">
        <div className={`lp-card ${success ? 'lp-card--success' : ''}`}>
          <div className="lp-card__border" />
          <div className="lp-card__inner">

            {/* Card Header Title */}
            <div className="lp-card__header">
              <div className="lp-card__icon">
                {success ? (
                  <CheckCircle2 size={26} color="#10B981" />
                ) : (
                  <Lock size={22} color="#736efe" />
                )}
              </div>
              <h2 className="lp-card__title">
                {success ? 'Authenticated!' : 'Sign In'}
              </h2>
              <p className="lp-card__sub">
                {success
                  ? 'Redirecting to your workspace…'
                  : 'Enter your credentials to access Viral Print Media'}
              </p>
            </div>

            {/* Global Error Banner */}
            {error && (
              <div className="lp-error" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Main Login Form */}
            <form onSubmit={handleSubmit} className="lp-form" noValidate>

              {/* Username Field */}
              <div className="lp-field">
                <label htmlFor="lp-u" className="lp-field__label">Username</label>
                <div className={`lp-field__wrap ${errs.username ? 'lp-field__wrap--err' : ''} ${username && !errs.username ? 'lp-field__wrap--filled' : ''}`}>
                  <User size={16} className="lp-field__icon" />
                  <input
                    id="lp-u"
                    type="text"
                    className="lp-field__input"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      setErrs((p) => ({ ...p, username: '' }))
                    }}
                    disabled={loading || success}
                    autoFocus
                    autoComplete="username"
                  />
                  {username && !errs.username && (
                    <div className="lp-field__check"><CheckCircle2 size={14} /></div>
                  )}
                </div>
                {errs.username && (
                  <span className="lp-field__error"><AlertCircle size={11} />{errs.username}</span>
                )}
              </div>

              {/* Password Field */}
              <div className="lp-field">
                <div className="lp-field__header">
                  <label htmlFor="lp-p" className="lp-field__label">Password</label>
                </div>
                <div className={`lp-field__wrap ${errs.password ? 'lp-field__wrap--err' : ''}`}>
                  <Lock size={16} className="lp-field__icon" />
                  <input
                    id="lp-p"
                    type={showPw ? 'text' : 'password'}
                    className="lp-field__input"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setErrs((p) => ({ ...p, password: '' }))
                    }}
                    disabled={loading || success}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="lp-field__eye"
                    onClick={() => setShowPw((s) => !s)}
                    tabIndex={-1}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errs.password && (
                  <span className="lp-field__error"><AlertCircle size={11} />{errs.password}</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                id="auth-submit-btn"
                type="submit"
                className={`lp-btn ${success ? 'lp-btn--success' : ''}`}
                disabled={loading || success}
              >
                <span className="lp-btn__bg" />
                <span className="lp-btn__content">
                  {success ? (
                    <><CheckCircle2 size={18} /> Signed In!</>
                  ) : loading ? (
                    <><Loader2 size={18} className="lp-spin" /> Signing in…</>
                  ) : (
                    <><LogIn size={18} /> Sign In <ArrowRight size={16} className="lp-btn__arrow" /></>
                  )}
                </span>
              </button>
            </form>

            <div className="lp-card__footer">
              <p>For administrative support or account updates, contact your system owner.</p>
            </div>
          </div>
        </div>

        {/* Footer Copyright */}
        <p className="lp-copy">© {new Date().getFullYear()} Viral Print Media Software · All rights reserved</p>
      </div>

    </div>
  )
}
