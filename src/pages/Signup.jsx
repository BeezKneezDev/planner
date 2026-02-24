import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'

export default function Signup() {
  const { user, signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await signup(email, password)
      setSuccess(true)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const headerBar = (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-primary-600">Financial Planner</Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">
            Sign In
          </Link>
        </div>
      </div>
    </header>
  )

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        {headerBar}
        <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
          <div className="w-full max-w-sm bg-white rounded-xl shadow-sm p-6 text-center">
            <h1 className="text-2xl font-bold text-primary-600 mb-4">Check Your Email</h1>
            <p className="text-sm text-gray-600 mb-6">
              We've sent a verification link to <span className="font-medium">{email}</span>.
              Please verify your email, then sign in.
            </p>
            <Link
              to="/login"
              className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {headerBar}
      <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
      <div className="w-full max-w-sm">
        <p className="text-gray-500 text-center mb-8 text-sm">Create your account</p>

        <form onSubmit={handleSignup} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
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
          <div>
            <label className="block text-sm text-gray-600 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
          <p className="text-sm text-center text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700">Sign in</Link>
          </p>
        </form>
      </div>
      </div>
    </div>
  )
}
