import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChartPie,
  faWallet,
  faFileInvoiceDollar,
  faReceipt,
  faBuilding,
  faCreditCard,
  faBullseye,
  faGlobe,
  faFlask,
} from '@fortawesome/free-solid-svg-icons'

const features = [
  { icon: faChartPie, label: 'Dashboard', color: 'bg-blue-100 text-blue-600', desc: 'See your full financial picture at a glance with net worth tracking and cash flow charts.' },
  { icon: faWallet, label: 'Income', color: 'bg-green-100 text-green-600', desc: 'Track all income sources with flexible frequencies — weekly, fortnightly, monthly, or yearly.' },
  { icon: faFileInvoiceDollar, label: 'Bills & Expenses', color: 'bg-red-100 text-red-600', desc: 'Manage recurring bills and expenses, categorised and converted to monthly totals.' },
  { icon: faReceipt, label: 'Transactions', color: 'bg-purple-100 text-purple-600', desc: 'Import bank statements and review transaction history with CSV support.' },
  { icon: faBuilding, label: 'Assets', color: 'bg-amber-100 text-amber-600', desc: 'Track property, savings, investments, KiwiSaver, and crypto with growth projections.' },
  { icon: faCreditCard, label: 'Liabilities', color: 'bg-orange-100 text-orange-600', desc: 'Monitor mortgages, loans, and credit cards with payoff timelines.' },
  { icon: faBullseye, label: 'Goals', color: 'bg-pink-100 text-pink-600', desc: 'Set savings goals with deadlines and track your progress over time.' },
  { icon: faGlobe, label: 'Cost of Living', color: 'bg-teal-100 text-teal-600', desc: 'Compare living costs across NZ cities with built-in regional presets.' },
  { icon: faFlask, label: 'Scenarios', color: 'bg-indigo-100 text-indigo-600', desc: 'Run "what if" scenarios — adjust income, expenses, and rates to plan ahead.' },
]

export default function Landing() {
  const { user, authLoading } = useAuth()

  if (authLoading) return null
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-primary-600">Financial Planner</span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">
              Sign In
            </Link>
            <Link to="/signup" className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-4 py-1.5 rounded-lg">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
          Take Control of Your<br />
          <span className="text-primary-600">Financial Future</span>
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
          Track income, expenses, assets, and liabilities in one place. Set goals, run scenarios, and plan smarter — built for New Zealand.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/signup" className="w-full sm:w-auto text-center font-medium text-white bg-primary-600 hover:bg-primary-700 px-8 py-3 rounded-lg text-sm">
            Get Started — Free
          </Link>
          <Link to="/login?demo=1" className="w-full sm:w-auto text-center font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-8 py-3 rounded-lg text-sm">
            Try Demo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Everything You Need</h2>
        <p className="text-gray-500 text-center mb-10 text-sm">Nine powerful tools to manage your personal finances.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.label} className="bg-white rounded-lg shadow-sm p-5 flex gap-4 items-start">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${f.color}`}>
                <FontAwesomeIcon icon={f.icon} className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{f.label}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Your Dashboard at a Glance</h2>
        <p className="text-gray-500 text-center mb-8 text-sm">A snapshot of what your personalised dashboard looks like.</p>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Stat cards row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Net Worth', value: '$487,200', color: 'text-primary-600' },
              { label: 'Monthly Income', value: '$8,450', color: 'text-green-600' },
              { label: 'Monthly Expenses', value: '$5,120', color: 'text-red-500' },
              { label: 'Monthly Surplus', value: '$3,330', color: 'text-emerald-600' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-lg font-bold ${s.color} mt-0.5`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Mock bar chart */}
          <div>
            <p className="text-xs font-medium text-gray-700 mb-3">Monthly Cash Flow</p>
            <div className="flex items-end gap-2 h-28">
              {[65, 45, 70, 55, 80, 60, 75, 50, 85, 40, 72, 58].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col gap-0.5">
                    <div className="bg-green-400 rounded-t" style={{ height: `${h}px` }} />
                    <div className="bg-red-300 rounded-b" style={{ height: `${h * 0.6}px` }} />
                  </div>
                  <span className="text-[9px] text-gray-400">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mock goal progress */}
          <div>
            <p className="text-xs font-medium text-gray-700 mb-3">Goal Progress</p>
            <div className="space-y-2.5">
              {[
                { name: 'Emergency Fund', pct: 72 },
                { name: 'House Deposit', pct: 35 },
                { name: 'Holiday', pct: 90 },
              ].map((g) => (
                <div key={g.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700">{g.name}</span>
                    <span className="text-gray-500">{g.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${g.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Take Control?</h2>
        <p className="text-gray-500 text-sm mb-8 max-w-lg mx-auto">
          Join and start planning your financial future today. No credit card required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/signup" className="w-full sm:w-auto text-center font-medium text-white bg-primary-600 hover:bg-primary-700 px-8 py-3 rounded-lg text-sm">
            Create Free Account
          </Link>
          <Link to="/login" className="w-full sm:w-auto text-center font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-8 py-3 rounded-lg text-sm">
            Sign In
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Financial Planner</span>
          <span className="text-xs text-gray-400">Your data stays in your browser. We never sell your information.</span>
        </div>
      </footer>
    </div>
  )
}
