import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="p-6 pt-16 md:pt-6 md:ml-60 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
