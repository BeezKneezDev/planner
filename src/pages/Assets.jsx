import { useState } from 'react'
import { useStore } from '../store/useStore'
import { formatCurrency, formatPercent, generateId } from '../utils/formatters'
import Modal from '../components/Modal'

const TYPES = ['property', 'stock', 'savings', 'crypto', 'kiwisaver', 'other']
const TYPE_LABELS = { property: 'Property', stock: 'Stocks', savings: 'Savings', crypto: 'Crypto', kiwisaver: 'KiwiSaver', other: 'Other' }
const emptyAsset = { name: '', type: 'savings', value: '', growthRate: '', startDate: '', kiwiGovt: '', kiwiEmployer: '', kiwiPersonal: '' }

export default function Assets() {
  const { state, dispatch } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyAsset)

  const openAdd = () => { setForm(emptyAsset); setEditing(null); setShowModal(true) }
  const openEdit = (item) => { setForm(item); setEditing(item.id); setShowModal(true) }

  const handleSave = () => {
    if (!form.name || !form.value) return
    if (editing) {
      dispatch({ type: 'UPDATE_ITEM', collection: 'assets', item: form })
    } else {
      dispatch({ type: 'ADD_ITEM', collection: 'assets', item: { ...form, id: generateId() } })
    }
    setShowModal(false)
  }

  const handleDelete = (id) => dispatch({ type: 'DELETE_ITEM', collection: 'assets', id })

  const totalAssets = state.assets.reduce((sum, a) => sum + Number(a.value), 0)

  const grouped = TYPES.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    items: state.assets.filter((a) => a.type === type),
    total: state.assets.filter((a) => a.type === type).reduce((s, a) => s + Number(a.value), 0),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Assets & Investments</h2>
          <p className="text-sm text-gray-500">Total: {formatCurrency(totalAssets)}</p>
        </div>
        <button onClick={openAdd} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors">
          + Add Asset
        </button>
      </div>

      {grouped.length === 0 && <p className="text-gray-400 text-sm">No assets added yet</p>}

      {grouped.map((group) => (
        <div key={group.type}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-md font-semibold text-gray-600">{group.label}</h3>
            <span className="text-sm text-gray-400">{formatCurrency(group.total)}</span>
          </div>
          <div className="space-y-2">
            {group.items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(item.value)}
                    {item.growthRate && <span className="ml-2 text-green-600">+{formatPercent(Number(item.growthRate))}/yr</span>}
                    {item.type === 'kiwisaver' && ((Number(item.kiwiGovt) || 0) / 12 + (Number(item.kiwiEmployer) || 0) + (Number(item.kiwiPersonal) || 0)) > 0 && (
                      <span className="ml-2 text-blue-600">+{formatCurrency((Number(item.kiwiGovt) || 0) / 12 + (Number(item.kiwiEmployer) || 0) + (Number(item.kiwiPersonal) || 0))}/mo contributions</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(item)} className="text-sm text-primary-600 hover:text-primary-800">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-sm text-red-500 hover:text-red-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showModal && (
        <Modal title={editing ? 'Edit Asset' : 'Add Asset'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Tesla Stock" />
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Value ($)</label>
              <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Projected Growth Rate (% per year)</label>
              <input type="number" value={form.growthRate} onChange={(e) => setForm({ ...form, growthRate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 8" />
            </div>
            {form.type === 'kiwisaver' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Government Contribution ($/yr)</label>
                  <input type="number" value={form.kiwiGovt} onChange={(e) => setForm({ ...form, kiwiGovt: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employer Contribution ($/mo)</label>
                  <input type="number" value={form.kiwiEmployer} onChange={(e) => setForm({ ...form, kiwiEmployer: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Personal Contribution ($/mo)</label>
                  <input type="number" value={form.kiwiPersonal} onChange={(e) => setForm({ ...form, kiwiPersonal: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acquired Date</label>
              <input type="month" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
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
