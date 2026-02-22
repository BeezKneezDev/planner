import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatPercent, generateId, toMonthly } from '../utils/formatters'
import Modal from '../components/Modal'

const TYPES = ['mortgage', 'loan', 'credit', 'other']
const TYPE_LABELS = { mortgage: 'Mortgage', loan: 'Loan', credit: 'Credit Card', other: 'Other' }
const FREQ_LABELS = { weekly: 'Weekly', fortnightly: 'Fortnightly', monthly: 'Monthly' }
const COST_CATEGORIES = ['housing', 'utilities', 'food', 'transport', 'education', 'healthcare', 'lifestyle', 'other']
const COST_CAT_LABELS = { housing: 'Housing', utilities: 'Utilities', food: 'Food', transport: 'Transport', education: 'Education', healthcare: 'Healthcare', lifestyle: 'Lifestyle', other: 'Other' }
const emptyLiability = { name: '', type: 'mortgage', balance: '', interestRate: '', minPayment: '', paymentFrequency: 'weekly', costCategory: 'housing' }

export default function Liabilities() {
  const { state, dispatch } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyLiability)

  const openAdd = () => { setForm(emptyLiability); setEditing(null); setShowModal(true) }
  const openEdit = (item) => { setForm(item); setEditing(item.id); setShowModal(true) }

  const handleSave = () => {
    if (!form.name || !form.balance) return
    if (editing) {
      dispatch({ type: 'UPDATE_ITEM', collection: 'liabilities', item: form })
    } else {
      dispatch({ type: 'ADD_ITEM', collection: 'liabilities', item: { ...form, id: generateId() } })
    }
    setShowModal(false)
  }

  const handleDelete = (id) => dispatch({ type: 'DELETE_ITEM', collection: 'liabilities', id })

  const totalDebt = state.liabilities.reduce((sum, l) => sum + Number(l.balance), 0)
  const totalPayments = state.liabilities.reduce((sum, l) => sum + toMonthly(Number(l.minPayment || 0), l.paymentFrequency || 'monthly'), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Liabilities & Debt</h2>
          <p className="text-sm text-gray-500">Total: {formatCurrency(totalDebt)} | Monthly payments: {formatCurrency(totalPayments)}</p>
        </div>
        <button onClick={openAdd} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors">
          + Add Liability
        </button>
      </div>

      {state.liabilities.length === 0 && <p className="text-gray-400 text-sm">No liabilities added yet</p>}

      <div className="space-y-2">
        {state.liabilities.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-800">{item.name}</p>
                <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded capitalize">{TYPE_LABELS[item.type] || item.type}</span>
              </div>
              <p className="text-sm text-gray-500">
                Balance: {formatCurrency(item.balance)}
                {item.interestRate && <span className="ml-2">@ {formatPercent(Number(item.interestRate))}</span>}
                {item.minPayment && <span className="ml-2">| Payment: {formatCurrency(item.minPayment)}/{item.paymentFrequency === 'weekly' ? 'wk' : item.paymentFrequency === 'fortnightly' ? 'fn' : 'mo'} ({formatCurrency(toMonthly(Number(item.minPayment), item.paymentFrequency || 'monthly'))}/mo)</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(item)} className="text-sm text-primary-600 hover:text-primary-800">Edit</button>
              <button onClick={() => handleDelete(item.id)} className="text-sm text-red-500 hover:text-red-700">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit Liability' : 'Add Liability'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Home Mortgage" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {TYPES.map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost of Living Category</label>
                <select value={form.costCategory || 'housing'} onChange={(e) => setForm({ ...form, costCategory: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {COST_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{COST_CAT_LABELS[c]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Balance Owing ($)</label>
              <input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% per year)</label>
              <input type="number" step="0.1" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 5.4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount ($)</label>
              <div className="flex gap-2">
                <input type="number" value={form.minPayment} onChange={(e) => setForm({ ...form, minPayment: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
                <select value={form.paymentFrequency || 'monthly'} onChange={(e) => setForm({ ...form, paymentFrequency: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {Object.entries(FREQ_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              {form.minPayment && form.paymentFrequency !== 'monthly' && (
                <p className="text-xs text-gray-400 mt-1">= {formatCurrency(toMonthly(Number(form.minPayment), form.paymentFrequency))}/mo</p>
              )}
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
