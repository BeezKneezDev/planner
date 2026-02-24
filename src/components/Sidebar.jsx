import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChartPie,
  faWallet,
  faFileInvoiceDollar,
  faBuilding,
  faCreditCard,
  faBullseye,
  faGlobe,
  faFlask,
  faGear,
  faBars,
  faXmark,
  faUser,
  faRightFromBracket,
  faReceipt,
  faComments,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../store/useAuth'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: faChartPie },
  { to: '/income', label: 'Income', icon: faWallet },
  { to: '/bills', label: 'Bills & Expenses', icon: faFileInvoiceDollar },
  { to: '/transactions', label: 'Transactions', icon: faReceipt },
  { to: '/assets', label: 'Assets', icon: faBuilding },
  { to: '/liabilities', label: 'Liabilities', icon: faCreditCard },
  { to: '/goals', label: 'Goals', icon: faBullseye },
  { to: '/cost-of-living', label: 'Cost of Living', icon: faGlobe },
  { to: '/scenarios', label: 'Scenarios', icon: faFlask },
  { to: '/settings', label: 'Settings', icon: faGear },
  { to: '/submit', label: 'Submit', icon: faComments },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm flex items-center px-4 py-3 md:hidden">
        <button onClick={() => setOpen(!open)} className="text-gray-600 mr-3">
          <FontAwesomeIcon icon={open ? faXmark : faBars} className="w-5 h-5" />
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
              <FontAwesomeIcon icon={link.icon} className="w-4 h-4" fixedWidth />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
            <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium truncate">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 cursor-pointer shrink-0 ml-2"
            title="Sign out"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
