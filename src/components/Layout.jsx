import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../store/useAuth'
import { useStore } from '../store/useStore'

export default function Layout() {
  const { user, authLoading } = useAuth()
  const { dataLoading } = useStore()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading your data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="p-6 pt-16 md:pt-6 md:ml-60 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
