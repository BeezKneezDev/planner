import { useState, useEffect, useRef } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../store/useAuth'

export default function Login() {
  const { user, login, resetPassword, resendVerification } = useAuth()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const demoTriggered = useRef(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resendDone, setResendDone] = useState(false)

  // Auto-trigger demo login from landing page
  useEffect(() => {
    if (searchParams.get('demo') === '1' && !demoTriggered.current) {
      demoTriggered.current = true
      setLoading(true)
      login('demo@financialplanner.co.nz', 'demo1234')
        .catch((err) => setError('Demo account unavailable. ' + err.message))
        .finally(() => setLoading(false))
    }
  }, [searchParams, login])

  if (user) return <Navigate to="/dashboard" replace />

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setShowResend(false)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setError('Please verify your email before signing in.')
        setShowResend(true)
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(forgotEmail)
      setForgotSent(true)
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with that email.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setLoading(true)
    try {
      await resendVerification(email, password)
      setResendDone(true)
      setShowResend(false)
    } catch (err) {
      setError('Could not resend verification email. ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-primary-600">Financial Planner</Link>
          <div className="flex items-center gap-3">
            <Link to="/signup" className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-4 py-1.5 rounded-lg">
              Get Started
            </Link>
          </div>
        </div>
      </header>
      <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
      <div className="w-full max-w-sm">
        <p className="text-gray-500 text-center mb-8 text-sm">Sign in to your account</p>

        {showForgot ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Reset Password</h2>
            {forgotSent ? (
              <div>
                <p className="text-sm text-green-600 mb-4">Password reset email sent. Check your inbox.</p>
                <button
                  onClick={() => { setShowForgot(false); setForgotSent(false); setError('') }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Email'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setError('') }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Back to sign in
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {showResend && (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Resend verification email
              </button>
            )}
            {resendDone && <p className="text-sm text-green-600">Verification email sent. Check your inbox.</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => { setShowForgot(true); setForgotEmail(email); setError('') }}
                className="text-gray-500 hover:text-gray-700"
              >
                Forgot password?
              </button>
              <Link to="/signup" className="text-primary-600 hover:text-primary-700">
                Create account
              </Link>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setEmail('demo@financialplanner.co.nz')
                  setPassword('demo1234')
                  setError('')
                  setShowResend(false)
                  setLoading(true)
                  login('demo@financialplanner.co.nz', 'demo1234')
                    .catch((err) => setError('Demo account unavailable. ' + err.message))
                    .finally(() => setLoading(false))
                }}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Try Demo Account'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">Explore the app without signing up</p>
            </div>
          </form>
        )}
      </div>
      </div>
    </div>
  )
}
