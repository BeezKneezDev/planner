import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, generateId, formatDate } from '../utils/formatters'
import { getGoalMonthlyExpense, calcMonthlySurplus, calcMonthlyIncome } from '../utils/calculations'
import ProgressBar from '../components/ProgressBar'
import Modal from '../components/Modal'

const CATEGORIES = ['housing', 'utilities', 'food', 'transport', 'education', 'healthcare', 'lifestyle', 'other']
const CATEGORY_LABELS = { housing: 'Housing', utilities: 'Utilities', food: 'Food', transport: 'Transport', education: 'Education', healthcare: 'Healthcare', lifestyle: 'Lifestyle', other: 'Other' }
const CATEGORY_STYLES = {
  housing: 'bg-blue-50 text-blue-600',
  utilities: 'bg-cyan-50 text-cyan-600',
  food: 'bg-orange-50 text-orange-600',
  transport: 'bg-indigo-50 text-indigo-600',
  education: 'bg-violet-50 text-violet-600',
  healthcare: 'bg-pink-50 text-pink-600',
  lifestyle: 'bg-purple-50 text-purple-600',
  other: 'bg-gray-50 text-gray-600',
}
const CATEGORY_COLORS = {
  housing: 'bg-blue-500', utilities: 'bg-cyan-500', food: 'bg-orange-500', transport: 'bg-indigo-500',
  education: 'bg-violet-500', healthcare: 'bg-pink-500', lifestyle: 'bg-purple-500', other: 'bg-gray-500',
}
const PRIORITIES = ['high', 'medium', 'low']
const PRIORITY_STYLES = {
  high: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-300' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-300' },
  low: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-300' },
}
const emptyGoal = { name: '', targetAmount: '', currentAmount: '', monthlyContribution: '', deadline: '', category: 'other', priority: 'medium', isExpense: false }

export default function Goals() {
  const { state, dispatch } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyGoal)
  const [budgetWarning, setBudgetWarning] = useState(null)

  const openAdd = () => { setForm(emptyGoal); setEditing(null); setShowModal(true) }
  const openEdit = (item) => { setForm({ ...emptyGoal, ...item }); setEditing(item.id); setShowModal(true) }

  const handleSave = () => {
    if (!form.name || !form.targetAmount) return

    // Budget check when expense is enabled
    if (form.isExpense) {
      const newMonthly = getGoalMonthlyExpense(form)
      if (newMonthly > 0) {
        const currentSurplus = calcMonthlySurplus(state)
        const monthlyIncome = calcMonthlyIncome(state.income)
        const minPct = state.settings?.minSurplusPercent || 0
        const minSurplus = monthlyIncome * (minPct / 100)
        // If editing a goal that was already an expense, add back its old cost so we don't double-count
        const oldGoal = editing ? state.goals.find((g) => g.id === editing) : null
        const oldExpense = oldGoal?.isExpense ? getGoalMonthlyExpense(oldGoal) : 0
        const surplusAfter = currentSurplus + oldExpense - newMonthly
        if (surplusAfter < minSurplus) {
          const shortfall = minSurplus - surplusAfter
          setShowModal(false)
          setBudgetWarning({ deficit: shortfall, monthly: newMonthly, surplus: currentSurplus + oldExpense, minPct })
          return
        }
      }
    }

    doSave()
  }

  const doSave = () => {
    if (editing) {
      dispatch({ type: 'UPDATE_ITEM', collection: 'goals', item: form })
    } else {
      dispatch({ type: 'ADD_ITEM', collection: 'goals', item: { ...form, id: generateId() } })
    }
    setShowModal(false)
    setBudgetWarning(null)
  }

  const handleDelete = (id) => dispatch({ type: 'DELETE_ITEM', collection: 'goals', id })

  const calcMonthsToGoal = (goal) => {
    const remaining = Number(goal.targetAmount) - Number(goal.currentAmount)
    const monthly = Number(goal.monthlyContribution)
    if (monthly <= 0 || remaining <= 0) return null
    return Math.ceil(remaining / monthly)
  }

  const getMilestones = (goal) => {
    const target = Number(goal.targetAmount)
    const current = Number(goal.currentAmount)
    const monthly = Number(goal.monthlyContribution)
    if (monthly <= 0) return []

    const milestoneMonths = [3, 6, 9, 12, 24, 36, 48]
    return milestoneMonths.map((m) => {
      const projected = current + monthly * m
      const pct = Math.min(100, Math.round((projected / target) * 100))
      const label = m < 12 ? `${m}mo` : `${m / 12}yr`
      return { label, months: m, projected, pct, reached: projected >= target }
    })
  }

  // Sort goals: by deadline (earliest first, no deadline last), then by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sortedGoals = useMemo(() => {
    return [...state.goals].sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline)
      if (a.deadline && !b.deadline) return -1
      if (!a.deadline && b.deadline) return 1
      return (priorityOrder[a.priority || 'medium'] || 1) - (priorityOrder[b.priority || 'medium'] || 1)
    })
  }, [state.goals])

  // Totals
  const overallTarget = state.goals.reduce((s, g) => s + Number(g.targetAmount || 0), 0)
  const overallCurrent = state.goals.reduce((s, g) => s + Number(g.currentAmount || 0), 0)
  const overallPct = overallTarget > 0 ? Math.round((overallCurrent / overallTarget) * 100) : 0
  const totalMonthlyExpense = state.goals.filter((g) => g.isExpense).reduce((s, g) => s + getGoalMonthlyExpense(g), 0)


  // Resolve category style (handle old categories gracefully)
  const getCatStyle = (cat) => CATEGORY_STYLES[cat] || 'bg-gray-50 text-gray-600'
  const getCatLabel = (cat) => CATEGORY_LABELS[cat] || cat

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Goals</h2>
        <button onClick={openAdd} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors">
          + Add Goal
        </button>
      </div>

      {state.goals.length === 0 && (
        <div className="bg-primary-50 rounded-xl p-6 text-center">
          <p className="text-primary-700">Add your first goal — new kitchen, firewood, travel fund, mortgage payoff, emergency fund...</p>
        </div>
      )}

      {/* Summary totals */}
      {state.goals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">Active Goals</h3>
            <div className="text-right">
              <span className="text-sm text-gray-500">{formatCurrency(overallCurrent)} / {formatCurrency(overallTarget)} ({overallPct}%)</span>
              {totalMonthlyExpense > 0 && (
                <p className="text-xs text-amber-600">{formatCurrency(totalMonthlyExpense)}/mo as expenses</p>
              )}
            </div>
          </div>
          <ProgressBar current={overallCurrent} target={overallTarget} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sortedGoals.map((goal) => {
          const pct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0
          const monthsLeft = calcMonthsToGoal(goal)
          const milestones = getMilestones(goal)
          const pStyle = PRIORITY_STYLES[goal.priority || 'medium']
          const monthlyExpense = goal.isExpense ? getGoalMonthlyExpense(goal) : 0

          return (
            <div key={goal.id} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${pStyle.border}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{goal.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${getCatStyle(goal.category)}`}>{getCatLabel(goal.category)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${pStyle.bg} ${pStyle.text}`}>{goal.priority || 'medium'}</span>
                    {goal.isExpense && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600 font-medium">Active &middot; {formatCurrency(monthlyExpense)}/mo</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(goal)} className="text-sm text-primary-600 hover:text-primary-800">Edit</button>
                  <button onClick={() => handleDelete(goal.id)} className="text-sm text-red-500 hover:text-red-700">Delete</button>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">{formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}</span>
                  <span className="font-medium text-gray-700">{pct}%</span>
                </div>
                <ProgressBar current={goal.currentAmount} target={goal.targetAmount} color={CATEGORY_COLORS[goal.category] || 'bg-gray-500'} />
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                {goal.monthlyContribution > 0 && <p>Contributing: {formatCurrency(goal.monthlyContribution)}/mo</p>}
                {monthsLeft && <p>Estimated completion: {monthsLeft} months</p>}
                {goal.deadline && <p>Deadline: {formatDate(goal.deadline)}</p>}
              </div>

              {milestones.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">Milestone Projections</p>
                  <div className="flex flex-wrap gap-2">
                    {milestones.map((ms) => (
                      <div
                        key={ms.label}
                        className={`text-xs px-2 py-1 rounded ${
                          ms.reached ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {ms.label}: {ms.pct}%
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {budgetWarning && (
        <Modal title="Budget Warning" onClose={() => setBudgetWarning(null)}>
          <div className="space-y-4">
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-red-700 font-semibold text-lg">
                This will put you {formatCurrency(budgetWarning.deficit)}/mo over budget
              </p>
              <p className="text-red-600 text-sm mt-1">
                Your surplus is {formatCurrency(budgetWarning.surplus)}/mo but this goal costs {formatCurrency(budgetWarning.monthly)}/mo
                {budgetWarning.minPct > 0 && ` (${budgetWarning.minPct}% buffer required)`}
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-800 mb-2">Try one of these:</p>
              <ul className="text-sm text-amber-700 space-y-1.5">
                <li>- Extend the deadline to reduce the monthly cost</li>
                <li>- Lower the target amount or increase current savings</li>
                <li>- Set a smaller monthly contribution</li>
                <li>- Cut an existing expense (cancel a subscription?)</li>
                <li>- Add additional income</li>
              </ul>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setBudgetWarning(null)} className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm hover:bg-primary-700">
                Go Back & Adjust
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Goal' : 'Add Goal'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Firewood, New Kitchen" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={form.priority || 'medium'} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount ($)</label>
              <input type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Amount ($)</label>
              <input type="number" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Contribution ($)</label>
              <input type="number" value={form.monthlyContribution} onChange={(e) => setForm({ ...form, monthlyContribution: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input type="month" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Include as monthly expense</p>
                <p className="text-xs text-gray-500">
                  {form.isExpense && (form.monthlyContribution || form.deadline)
                    ? `Adds ${formatCurrency(getGoalMonthlyExpense({ ...form }))}/mo to ${CATEGORY_LABELS[form.category] || 'Other'} in Cost of Living`
                    : 'Shows in Cost of Living under the selected category'}
                </p>
                {form.isExpense && (form.monthlyContribution || form.deadline) && (() => {
                  const cost = getGoalMonthlyExpense({ ...form })
                  const surplus = calcMonthlySurplus(state)
                  const oldGoal = editing ? state.goals.find((g) => g.id === editing) : null
                  const oldExp = oldGoal?.isExpense ? getGoalMonthlyExpense(oldGoal) : 0
                  const after = surplus + oldExp - cost
                  return (
                    <div className="text-xs font-medium mt-0.5">
                      <span className="text-gray-500">Current surplus {formatCurrency(surplus + oldExp)}/mo</span>
                      <span className="mx-1">&rarr;</span>
                      <span className={after >= 0 ? 'text-green-600' : 'text-red-500'}>After {formatCurrency(after)}/mo</span>
                    </div>
                  )
                })()}
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, isExpense: !form.isExpense })}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.isExpense ? 'bg-primary-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.isExpense ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm hover:bg-primary-700">
                {editing ? 'Update' : 'Add'}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
