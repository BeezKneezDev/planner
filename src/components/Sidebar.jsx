import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/income', label: 'Income', icon: '💰' },
  { to: '/bills', label: 'Bills & Expenses', icon: '📝' },
  { to: '/assets', label: 'Assets', icon: '🏠' },
  { to: '/liabilities', label: 'Liabilities', icon: '💳' },
  { to: '/goals', label: 'Goals', icon: '🎯' },
  { to: '/cost-of-living', label: 'Cost of Living', icon: '🌏' },
  { to: '/scenarios', label: 'Scenarios', icon: '🔮' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm flex items-center px-4 py-3 md:hidden">
        <button onClick={() => setOpen(!open)} className="text-gray-600 mr-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
        <h1 className="text-lg font-bold text-primary-600">Financial Planner</h1>
      </div>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-60 bg-white shadow-md flex flex-col transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:h-screen md:overflow-y-auto
      `}>
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-xl font-bold text-primary-600">Financial Planner</h1>
          <p className="text-xs text-gray-400 mt-1">Plan for a brighter future</p>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-semibold border-r-3 border-primary-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
