import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, generateId, toMonthly } from '../utils/formatters'
import Modal from '../components/Modal'

const emptyIncome = { name: '', person: 'me', amount: '', frequency: 'monthly', startDate: '', endDate: '' }

export default function Income() {
  const { state, dispatch } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyIncome)

  const openAdd = () => { setForm(emptyIncome); setEditing(null); setShowModal(true) }
  const openEdit = (item) => { setForm(item); setEditing(item.id); setShowModal(true) }

  const handleSave = () => {
    if (!form.name || !form.amount) return
    if (editing) {
      dispatch({ type: 'UPDATE_ITEM', collection: 'income', item: form })
    } else {
      dispatch({ type: 'ADD_ITEM', collection: 'income', item: { ...form, id: generateId() } })
    }
    setShowModal(false)
  }

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_ITEM', collection: 'income', id })
  }

  const myIncome = state.income.filter((i) => i.person === 'me')
  const partnerIncome = state.income.filter((i) => i.person === 'partner')
  const totalMonthly = state.income.reduce((sum, i) => sum + toMonthly(Number(i.amount), i.frequency), 0)

  const renderList = (items, title) => (
    <div className="mb-6">
      <h3 className="text-md font-semibold text-gray-600 mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">No income added yet</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(item.amount)} / {item.frequency}
                  <span className="text-gray-400 ml-2">({formatCurrency(toMonthly(Number(item.amount), item.frequency))}/mo)</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(item)} className="text-sm text-primary-600 hover:text-primary-800">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-sm text-red-500 hover:text-red-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Income</h2>
          <p className="text-sm text-gray-500">Total monthly: {formatCurrency(totalMonthly)}</p>
        </div>
        <button onClick={openAdd} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors">
          + Add Income
        </button>
      </div>

      {renderList(myIncome, 'My Income')}
      {renderList(partnerIncome, "Partner's Income")}

      {showModal && (
        <Modal title={editing ? 'Edit Income' : 'Add Income'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Salary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Person</label>
              <select value={form.person} onChange={(e) => setForm({ ...form, person: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="me">Me</option>
                <option value="partner">Partner</option>
              </select>
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
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="month" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="month" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
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
