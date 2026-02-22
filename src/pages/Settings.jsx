import { useState } from 'react'
import { useStore } from '../store/useStore'
import { CITY_PRESETS } from '../utils/cityPresets'
import { generateId } from '../utils/formatters'

const DEMO_DATA = {
  homeName: 'Rotorua',
  settings: { minSurplusPercent: 5 },
  costOfLiving: { comparisons: [] },
  income: [
    { id: 'd-inc-1', name: 'Salary', person: 'me', amount: '5800', frequency: 'monthly', startDate: '2024-01', endDate: '' },
    { id: 'd-inc-2', name: 'Salary', person: 'partner', amount: '4200', frequency: 'monthly', startDate: '2024-03', endDate: '' },
  ],
  bills: [
    { id: 'd-bill-2', name: 'Rates', amount: '650', frequency: 'quarterly', category: 'housing' },
    { id: 'd-bill-3', name: 'Home Insurance', amount: '180', frequency: 'monthly', category: 'housing' },
    { id: 'd-bill-4', name: 'Power & Gas', amount: '220', frequency: 'monthly', category: 'utilities' },
    { id: 'd-bill-5', name: 'Internet & Phone', amount: '130', frequency: 'monthly', category: 'utilities' },
    { id: 'd-bill-6', name: 'Water', amount: '75', frequency: 'monthly', category: 'utilities' },
    { id: 'd-bill-7', name: 'Groceries', amount: '250', frequency: 'weekly', category: 'food' },
    { id: 'd-bill-8', name: 'Eating Out', amount: '200', frequency: 'monthly', category: 'food' },
    { id: 'd-bill-9', name: 'Petrol', amount: '80', frequency: 'weekly', category: 'transport' },
    { id: 'd-bill-10', name: 'Car Insurance', amount: '95', frequency: 'monthly', category: 'transport' },
    { id: 'd-bill-11', name: 'Car Rego & WOF', amount: '350', frequency: 'yearly', category: 'transport' },
    { id: 'd-bill-12', name: 'Health Insurance', amount: '160', frequency: 'monthly', category: 'healthcare' },
    { id: 'd-bill-13', name: 'Gym Membership', amount: '50', frequency: 'fortnightly', category: 'lifestyle' },
    { id: 'd-bill-14', name: 'Streaming & Subscriptions', amount: '65', frequency: 'monthly', category: 'lifestyle' },
  ],
  assets: [
    { id: 'd-asset-1', name: 'Family Home', type: 'property', value: '680000', growthRate: '4', startDate: '2021-06' },
    { id: 'd-asset-2', name: 'KiwiSaver - Partner A', type: 'kiwisaver', value: '45000', growthRate: '7', startDate: '2018-01', kiwiGovt: '521', kiwiEmployer: '174', kiwiPersonal: '174' },
    { id: 'd-asset-3', name: 'KiwiSaver - Partner B', type: 'kiwisaver', value: '28000', growthRate: '7', startDate: '2020-05', kiwiGovt: '521', kiwiEmployer: '126', kiwiPersonal: '126' },
    { id: 'd-asset-4', name: 'Sharesies Portfolio', type: 'stock', value: '12000', growthRate: '9', startDate: '2023-01' },
    { id: 'd-asset-5', name: 'Emergency Fund', type: 'savings', value: '8500', growthRate: '4.5', startDate: '2022-01' },
    { id: 'd-asset-6', name: 'Bitcoin', type: 'crypto', value: '3000', growthRate: '15', startDate: '2024-06' },
  ],
  liabilities: [
    { id: 'd-liab-1', name: 'Home Mortgage', type: 'mortgage', balance: '520000', interestRate: '6.5', minPayment: '2400', paymentFrequency: 'monthly' },
    { id: 'd-liab-2', name: 'Car Loan', type: 'loan', balance: '14000', interestRate: '9.9', minPayment: '350', paymentFrequency: 'monthly' },
    { id: 'd-liab-3', name: 'Visa Card', type: 'credit-card', balance: '2800', interestRate: '20.9', minPayment: '85', paymentFrequency: 'monthly' },
  ],
  goals: [
    { id: 'd-goal-1', name: 'Emergency Fund (3 months)', targetAmount: '15000', currentAmount: '8500', deadline: '2027-06', monthlyContribution: '', isExpense: true },
    { id: 'd-goal-2', name: 'Family Holiday - Gold Coast', targetAmount: '6000', currentAmount: '1200', deadline: '2027-01', monthlyContribution: '400', isExpense: true },
    { id: 'd-goal-3', name: 'Pay Off Visa', targetAmount: '2800', currentAmount: '0', deadline: '2026-12', monthlyContribution: '', isExpense: false },
    { id: 'd-goal-4', name: 'New Car Fund', targetAmount: '25000', currentAmount: '2000', deadline: '2029-01', monthlyContribution: '', isExpense: true },
  ],
}

export default function Settings() {
  const { state, dispatch } = useStore()
  const settings = state.settings || {}
  const [showDemoConfirm, setShowDemoConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const set = (key, value) => dispatch({ type: 'SET_SETTING', key, value })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Settings</h2>

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-1">Budget Guard</h3>
          <p className="text-xs text-gray-400 mb-3">Block new expenses or goal activations that would eat into your safety buffer</p>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Minimum surplus buffer</label>
            <input
              type="number"
              min="0"
              max="50"
              value={settings.minSurplusPercent ?? 0}
              onChange={(e) => set('minSurplusPercent', Number(e.target.value) || 0)}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-sm text-gray-500">% of income</span>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <h3 className="font-semibold text-gray-700 mb-1">General</h3>
          <p className="text-xs text-gray-400 mb-3">Display and location settings</p>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Home location name</label>
            <input
              type="text"
              value={state.homeName || ''}
              onChange={(e) => dispatch({ type: 'SET_HOME_NAME', value: e.target.value })}
              className="w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <h3 className="font-semibold text-gray-700 mb-1">Comparison City</h3>
          <p className="text-xs text-gray-400 mb-3">Choose a city to compare your cost of living against</p>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">City</label>
            <select
              value={state.costOfLiving.comparisons[0]?.name || ''}
              onChange={(e) => {
                const cityName = e.target.value
                if (!cityName) {
                  dispatch({ type: 'UPDATE_COST_OF_LIVING', data: { comparisons: [] } })
                } else {
                  const preset = CITY_PRESETS.find((c) => c.name === cityName)
                  if (preset) {
                    dispatch({
                      type: 'UPDATE_COST_OF_LIVING',
                      data: { comparisons: [JSON.parse(JSON.stringify(preset))] },
                    })
                  }
                }
              }}
              className="w-56 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {CITY_PRESETS.map((city) => (
                <option key={city.name} value={city.name}>{city.name}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-400 mt-2">Customise individual costs on the Cost of Living page</p>
        </div>

        <hr className="border-gray-100" />

        <div>
          <h3 className="font-semibold text-gray-700 mb-1">Data</h3>
          <p className="text-xs text-gray-400 mb-3">Export or import your financial data</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `planner-backup-${new Date().toISOString().slice(0, 10)}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700"
            >
              Export Data
            </button>
            <label className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 cursor-pointer">
              Import Data
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    try {
                      const data = JSON.parse(ev.target.result)
                      if (data && typeof data === 'object') {
                        dispatch({ type: 'IMPORT_DATA', data })
                      }
                    } catch {
                      alert('Invalid JSON file')
                    }
                  }
                  reader.readAsText(file)
                }}
              />
            </label>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <h3 className="font-semibold text-gray-700 mb-1">Reset Data</h3>
          <p className="text-xs text-gray-400 mb-3">Permanently erase all data for this profile and start fresh</p>
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
            >
              Reset All Data
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-600">This will delete everything. Are you sure?</span>
              <button
                onClick={() => {
                  dispatch({ type: 'IMPORT_DATA', data: {} })
                  setShowResetConfirm(false)
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
              >
                Yes, reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <hr className="border-gray-100" />

        <div>
          <h3 className="font-semibold text-gray-700 mb-1">Demo Data</h3>
          <p className="text-xs text-gray-400 mb-3">Load sample data to explore the app — this will replace all current data</p>
          {!showDemoConfirm ? (
            <button
              onClick={() => setShowDemoConfirm(true)}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600"
            >
              Load Demo Data
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-600">This will overwrite all your data. Are you sure?</span>
              <button
                onClick={() => {
                  dispatch({ type: 'IMPORT_DATA', data: DEMO_DATA })
                  setShowDemoConfirm(false)
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
              >
                Yes, load demo
              </button>
              <button
                onClick={() => setShowDemoConfirm(false)}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
