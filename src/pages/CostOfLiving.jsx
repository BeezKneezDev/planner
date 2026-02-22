import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { formatCurrency, toMonthly } from '../utils/formatters'
import { getGoalMonthlyExpense } from '../utils/calculations'
import PieChart from '../components/charts/PieChart'

const COST_KEYS = ['housing', 'utilities', 'food', 'transport', 'education', 'healthcare', 'lifestyle', 'other']
const LABELS = { housing: 'Housing', utilities: 'Utilities', food: 'Food & Groceries', transport: 'Transport', education: 'Education', healthcare: 'Healthcare', lifestyle: 'Lifestyle', other: 'Other' }

function InlineForm({ form, setForm, onSave, onCancel }) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-primary-50 rounded-lg">
      <input
        type="text"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Item name"
        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
        autoFocus
      />
      <input
        type="number"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
        placeholder="$"
        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
      />
      <button onClick={onSave} className="text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700">Save</button>
      <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
    </div>
  )
}

function getCategoryTotal(items) {
  return (items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0)
}

export default function CostOfLiving() {
  const { state, dispatch } = useStore()
  const comparison = state.costOfLiving.comparisons[0] || null
  const [expanded, setExpanded] = useState({})
  const [addingTo, setAddingTo] = useState(null) // { category }
  const [editingItem, setEditingItem] = useState(null) // { category, itemIdx }
  const [form, setForm] = useState({ name: '', amount: '' })

  // Build home costs from bills + liability payments — group by category and normalize to monthly
  const homeCosts = useMemo(() => {
    const grouped = {}
    for (const key of COST_KEYS) {
      grouped[key] = []
    }
    for (const bill of state.bills) {
      const cat = COST_KEYS.includes(bill.category) ? bill.category : 'other'
      grouped[cat].push({
        name: bill.name,
        amount: Math.round(toMonthly(Number(bill.amount), bill.frequency)),
      })
    }
    // Include liability payments under their assigned cost category
    for (const liability of state.liabilities) {
      const monthlyPayment = Math.round(toMonthly(Number(liability.minPayment) || 0, liability.paymentFrequency || 'monthly'))
      if (monthlyPayment > 0) {
        const cat = COST_KEYS.includes(liability.costCategory) ? liability.costCategory : 'housing'
        grouped[cat].push({
          name: `${liability.name} (payment)`,
          amount: monthlyPayment,
        })
      }
    }
    // Include goals marked as expenses under their category
    for (const goal of state.goals) {
      if (goal.isExpense) {
        const monthlyExpense = getGoalMonthlyExpense(goal)
        if (monthlyExpense > 0) {
          const cat = COST_KEYS.includes(goal.category) ? goal.category : 'other'
          grouped[cat].push({
            name: `${goal.name} (goal)`,
            amount: monthlyExpense,
          })
        }
      }
    }
    return grouped
  }, [state.bills, state.liabilities, state.goals])

  const toggleExpand = (side, category) => {
    const key = `${side}-${category}`
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // --- Comparison location CRUD ---
  const updateComparison = (newCosts) => {
    dispatch({
      type: 'UPDATE_COST_OF_LIVING',
      data: {
        ...state.costOfLiving,
        comparisons: [{ ...comparison, costs: newCosts }],
      },
    })
  }

  const startAdd = (category) => {
    setAddingTo({ category })
    setEditingItem(null)
    setForm({ name: '', amount: '' })
  }

  const startEdit = (category, itemIdx) => {
    const item = comparison.costs[category][itemIdx]
    setEditingItem({ category, itemIdx })
    setAddingTo(null)
    setForm({ name: item.name, amount: item.amount })
  }

  const saveItem = () => {
    if (!form.name || !form.amount) return
    const costs = { ...comparison.costs }
    if (addingTo) {
      costs[addingTo.category] = [...(costs[addingTo.category] || []), { name: form.name, amount: Number(form.amount) }]
    }
    if (editingItem) {
      const items = [...costs[editingItem.category]]
      items[editingItem.itemIdx] = { name: form.name, amount: Number(form.amount) }
      costs[editingItem.category] = items
    }
    updateComparison(costs)
    setAddingTo(null)
    setEditingItem(null)
    setForm({ name: '', amount: '' })
  }

  const deleteItem = (category, itemIdx) => {
    const costs = { ...comparison.costs }
    costs[category] = costs[category].filter((_, i) => i !== itemIdx)
    updateComparison(costs)
  }

  // Totals
  const homeTotal = COST_KEYS.reduce((sum, k) => sum + getCategoryTotal(homeCosts[k]), 0)
  const compTotal = comparison ? COST_KEYS.reduce((sum, k) => sum + getCategoryTotal(comparison.costs[k]), 0) : 0
  const savings = homeTotal - compTotal

  const renderSubItems = (side, category, items, editable) => {
    const key = `${side}-${category}`
    const isExpanded = expanded[key]

    return (
      <div className="border-b border-gray-100 last:border-b-0">
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleExpand(side, category)}
        >
          <div className="flex items-center gap-2">
            <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>&#9654;</span>
            <span className="text-sm font-medium text-gray-700">{LABELS[category]}</span>
            <span className="text-xs text-gray-400">({items.length})</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">{formatCurrency(getCategoryTotal(items))}</span>
        </div>

        {isExpanded && (
          <div className="px-4 pb-3">
            {items.length === 0 && (
              <p className="text-xs text-gray-400 py-1 pl-5">
                {editable ? 'No items yet' : 'No bills in this category — add them in Bills & Expenses'}
              </p>
            )}
            {items.map((item, idx) => (
              <div key={idx}>
                {editable && editingItem && editingItem.category === category && editingItem.itemIdx === idx ? (
                  <InlineForm form={form} setForm={setForm} onSave={saveItem} onCancel={() => setEditingItem(null)} />
                ) : (
                  <div className="flex items-center justify-between py-1.5 pl-5 group">
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700">{formatCurrency(item.amount)}/mo</span>
                      {editable && (
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                          <button onClick={() => startEdit(category, idx)} className="text-xs text-primary-500 hover:text-primary-700">Edit</button>
                          <button onClick={() => deleteItem(category, idx)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {editable && (
              addingTo && addingTo.category === category ? (
                <div className="mt-2">
                  <InlineForm form={form} setForm={setForm} onSave={saveItem} onCancel={() => setAddingTo(null)} />
                </div>
              ) : (
                <button onClick={() => startAdd(category)} className="mt-2 text-xs text-primary-500 hover:text-primary-700 pl-5">
                  + Add item
                </button>
              )
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Cost of Living{comparison ? ' Comparison' : ''}</h2>

      {comparison && savings > 0 && (
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-green-700 font-semibold text-lg">
            Moving to {comparison.name} could save you {formatCurrency(savings)}/month
          </p>
          <p className="text-green-600 text-sm">That's {formatCurrency(savings * 12)}/year</p>
        </div>
      )}

      {!comparison && (
        <div className="bg-primary-50 rounded-xl p-4 text-center">
          <p className="text-primary-700 text-sm">
            Want to compare?{' '}
            <Link to="/settings" className="underline font-medium hover:text-primary-800">Select a comparison city in Settings</Link>
          </p>
        </div>
      )}

      {/* Summary table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow-sm overflow-hidden">
          <thead>
            <tr className="bg-primary-50">
              <th className="px-5 py-3 text-left text-sm font-semibold text-primary-700">Category</th>
              <th className="px-5 py-3 text-right text-sm font-semibold text-primary-700">{state.homeName} (from bills)</th>
              {comparison && (
                <>
                  <th className="px-5 py-3 text-right text-sm font-semibold text-primary-700">{comparison.name}</th>
                  <th className="px-5 py-3 text-right text-sm font-semibold text-primary-700">Savings</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {COST_KEYS.map((key) => {
              const v1 = getCategoryTotal(homeCosts[key])
              const v2 = comparison ? getCategoryTotal(comparison.costs[key]) : 0
              const diff = v1 - v2
              return (
                <tr key={key} className="border-t border-gray-100">
                  <td className="px-5 py-3 text-sm text-gray-700">{LABELS[key]}</td>
                  <td className="px-5 py-3 text-sm text-right text-gray-700">{formatCurrency(v1)}</td>
                  {comparison && (
                    <>
                      <td className="px-5 py-3 text-sm text-right text-gray-700">{formatCurrency(v2)}</td>
                      <td className={`px-5 py-3 text-sm text-right font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
            <tr className="border-t-2 border-gray-200 font-semibold">
              <td className="px-5 py-3 text-sm text-gray-800">Total Monthly</td>
              <td className="px-5 py-3 text-sm text-right text-gray-800">{formatCurrency(homeTotal)}</td>
              {comparison && (
                <>
                  <td className="px-5 py-3 text-sm text-right text-gray-800">{formatCurrency(compTotal)}</td>
                  <td className={`px-5 py-3 text-sm text-right ${savings > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {savings > 0 ? '+' : ''}{formatCurrency(savings)}
                  </td>
                </>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {state.bills.length === 0 && (
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <p className="text-amber-700 text-sm">The {state.homeName} column is empty — add your bills in <a href="/bills" className="underline font-medium">Bills & Expenses</a> and they'll show up here automatically.</p>
        </div>
      )}

      {/* Detailed breakdown + pie charts */}
      {comparison ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gray-700 px-5 py-3 flex items-center justify-between">
                <h3 className="text-white font-semibold">{state.homeName}</h3>
                <span className="text-gray-300 text-sm">{formatCurrency(homeTotal)}/mo &middot; from bills</span>
              </div>
              <div>
                {COST_KEYS.map((category) => renderSubItems('home', category, homeCosts[category], false))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-primary-600 px-5 py-3 flex items-center justify-between">
                <h3 className="text-white font-semibold">{comparison.name}</h3>
                <span className="text-primary-100 text-sm">{formatCurrency(compTotal)}/mo</span>
              </div>
              <div>
                {COST_KEYS.map((category) => renderSubItems('comp', category, comparison.costs[category] || [], true))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PieChart
              title={`${state.homeName} Breakdown`}
              labels={COST_KEYS.map((k) => LABELS[k])}
              values={COST_KEYS.map((k) => getCategoryTotal(homeCosts[k]))}
            />
            <PieChart
              title={`${comparison.name} Breakdown`}
              labels={COST_KEYS.map((k) => LABELS[k])}
              values={COST_KEYS.map((k) => getCategoryTotal(comparison.costs[k]))}
            />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-700 px-5 py-3 flex items-center justify-between">
              <h3 className="text-white font-semibold">{state.homeName}</h3>
              <span className="text-gray-300 text-sm">{formatCurrency(homeTotal)}/mo &middot; from bills</span>
            </div>
            <div>
              {COST_KEYS.map((category) => renderSubItems('home', category, homeCosts[category], false))}
            </div>
          </div>

          <PieChart
            title={`${state.homeName} Breakdown`}
            labels={COST_KEYS.map((k) => LABELS[k])}
            values={COST_KEYS.map((k) => getCategoryTotal(homeCosts[k]))}
          />
        </div>
      )}
    </div>
  )
}
