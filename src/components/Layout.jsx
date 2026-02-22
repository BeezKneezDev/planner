import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ProfilePicker from './ProfilePicker'
import { useStore } from '../store/useStore'

export default function Layout() {
  const { profile } = useStore()

  if (!profile) {
    return <ProfilePicker />
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
