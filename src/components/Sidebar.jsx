import { NavLink } from 'react-router-dom'

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
  return (
    <aside className="w-60 bg-white shadow-md min-h-screen flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <h1 className="text-xl font-bold text-primary-600">Financial Planner</h1>
        <p className="text-xs text-gray-400 mt-1">Plan for a brighter future</p>
      </div>
      <nav className="flex-1 py-4">
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
  )
}
