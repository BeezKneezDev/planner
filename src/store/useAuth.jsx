import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext()
const DEMO_EMAIL = 'demo@financialplanner.co.nz'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && (firebaseUser.emailVerified || firebaseUser.email === DEMO_EMAIL)) {
        setUser(firebaseUser)
      } else {
        setUser(null)
      }
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    if (!cred.user.emailVerified && cred.user.email !== DEMO_EMAIL) {
      await signOut(auth)
      const error = new Error('Please verify your email before signing in.')
      error.code = 'EMAIL_NOT_VERIFIED'
      error.unverifiedUser = cred.user
      throw error
    }
    return cred.user
  }

  const signup = async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await sendEmailVerification(cred.user)
    await signOut(auth)
    return cred.user
  }

  const logout = () => signOut(auth)

  const resetPassword = (email) => sendPasswordResetEmail(auth, email)

  const resendVerification = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await sendEmailVerification(cred.user)
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, authLoading, login, signup, logout, resetPassword, resendVerification }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
