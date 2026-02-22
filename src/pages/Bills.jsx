import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, generateId, toMonthly } from '../utils/formatters'
import { getGoalMonthlyExpense, calcMonthlySurplus, calcMonthlyIncome } from '../utils/calculations'
import Modal from '../components/Modal'

const CATEGORIES = ['housing', 'utilities', 'food', 'transport', 'education', 'healthcare', 'lifestyle', 'other']
const emptyBill = { name: '', amount: '', frequency: 'monthly', category: 'other', dueDay: '', isFixed: true }

export default function Bills() {
  const { state, dispatch } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyBill)
  const [budgetWarning, setBudgetWarning] = useState(null)

  const openAdd = () => { setForm(emptyBill); setEditing(null); setShowModal(true) }
  const openEdit = (item) => { setForm(item); setEditing(item.id); setShowModal(true) }

  const handleSave = () => {
    if (!form.name || !form.amount) return

    const newMonthly = toMonthly(Number(form.amount), form.frequency)
    const currentSurplus = calcMonthlySurplus(state)
    const monthlyIncome = calcMonthlyIncome(state.income)
    const minPct = state.settings?.minSurplusPercent || 0
    const minSurplus = monthlyIncome * (minPct / 100)
    // If editing, add back the old bill's monthly so we don't double-count
    const oldMonthly = editing
      ? toMonthly(Number(state.bills.find((b) => b.id === editing)?.amount || 0), state.bills.find((b) => b.id === editing)?.frequency || 'monthly')
      : 0
    const surplusAfter = currentSurplus + oldMonthly - newMonthly
    if (surplusAfter < minSurplus) {
      const shortfall = minSurplus - surplusAfter
      setBudgetWarning({ deficit: shortfall, monthly: newMonthly, surplus: currentSurplus + oldMonthly, minPct })
      return
    }

    doSave()
  }

  const doSave = () => {
    if (editing) {
      dispatch({ type: 'UPDATE_ITEM', collection: 'bills', item: form })
    } else {
      dispatch({ type: 'ADD_ITEM', collection: 'bills', item: { ...form, id: generateId() } })
    }
    setShowModal(false)
    setBudgetWarning(null)
  }

  const handleDelete = (id) => dispatch({ type: 'DELETE_ITEM', collection: 'bills', id })

  // Build goal expense items (read-only)
  const goalExpenses = state.goals
    .filter((g) => g.isExpense)
    .map((g) => {
      const monthly = getGoalMonthlyExpense(g)
      return monthly > 0 ? { id: g.id, name: g.name, amount: monthly, frequency: 'monthly', category: g.category || 'other', isGoal: true } : null
    })
    .filter(Boolean)

  // Build liability payment items (read-only)
  const liabilityExpenses = state.liabilities
    .filter((l) => Number(l.minPayment) > 0)
    .map((l) => ({
      id: l.id,
      name: `${l.name} (payment)`,
      amount: toMonthly(Number(l.minPayment), l.paymentFrequency || 'monthly'),
      frequency: 'monthly',
      category: l.costCategory || 'housing',
      isLiability: true,
    }))

  const allItems = [...state.bills, ...goalExpenses, ...liabilityExpenses]
  const totalMonthly = allItems.reduce((sum, b) => sum + toMonthly(Number(b.amount), b.frequency), 0)

  const grouped = CATEGORIES.map((cat) => {
    const items = allItems.filter((b) => b.category === cat)
    return {
      category: cat,
      items,
      total: items.reduce((s, b) => s + toMonthly(Number(b.amount), b.frequency), 0),
    }
  }).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Bills & Expenses</h2>
          <p className="text-sm text-gray-500">Total monthly: {formatCurrency(totalMonthly)}</p>
        </div>
        <button onClick={openAdd} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors">
          + Add Bill
        </button>
      </div>

      {grouped.length === 0 && <p className="text-gray-400 text-sm">No bills added yet</p>}

      {grouped.map((group) => (
        <div key={group.category}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-md font-semibold text-gray-600 capitalize">{group.category}</h3>
            <span className="text-sm text-gray-400">{formatCurrency(group.total)}/mo</span>
          </div>
          <div className="space-y-2">
            {group.items.map((item) => (
              <div key={item.id} className={`bg-white rounded-lg shadow-sm p-4 flex items-center justify-between ${item.isGoal ? 'border-l-4 border-green-300' : item.isLiability ? 'border-l-4 border-red-300' : ''}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    {item.isGoal && <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600 font-medium">Goal</span>}
                    {item.isLiability && <span className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-500 font-medium">Debt</span>}
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(item.amount)} / {item.frequency}
                    {item.isFixed && <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Fixed</span>}
                    {item.isGoal && <span className="ml-2 text-xs text-gray-400">Edit in Goals</span>}
                    {item.isLiability && <span className="ml-2 text-xs text-gray-400">Edit in Liabilities</span>}
                  </p>
                </div>
                {!item.isGoal && !item.isLiability && (
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(item)} className="text-sm text-primary-600 hover:text-primary-800">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-sm text-red-500 hover:text-red-700">Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {budgetWarning && (
        <Modal title="Budget Warning" onClose={() => setBudgetWarning(null)}>
          <div className="space-y-4">
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-red-700 font-semibold text-lg">
                This will put you {formatCurrency(budgetWarning.deficit)}/mo over budget
              </p>
              <p className="text-red-600 text-sm mt-1">
                Your surplus is {formatCurrency(budgetWarning.surplus)}/mo but this bill costs {formatCurrency(budgetWarning.monthly)}/mo
                {budgetWarning.minPct > 0 && ` (${budgetWarning.minPct}% buffer required)`}
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-800 mb-2">Try one of these:</p>
              <ul className="text-sm text-amber-700 space-y-1.5">
                <li>- Reduce the amount or change to a less frequent billing cycle</li>
                <li>- Cut an existing expense (cancel a subscription?)</li>
                <li>- Add additional income</li>
                <li>- Deactivate a goal expense to free up budget</li>
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
        <Modal title={editing ? 'Edit Bill' : 'Add Bill'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Electricity" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Day of Month</label>
              <input type="number" min="1" max="31" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="1-31" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isFixed} onChange={(e) => setForm({ ...form, isFixed: e.target.checked })}
                className="rounded" id="isFixed" />
              <label htmlFor="isFixed" className="text-sm text-gray-700">Fixed cost (doesn't vary)</label>
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
