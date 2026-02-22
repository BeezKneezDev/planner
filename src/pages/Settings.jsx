import { useStore } from '../store/useStore'
import { CITY_PRESETS } from '../utils/cityPresets'

export default function Settings() {
  const { state, dispatch } = useStore()
  const settings = state.settings || {}

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
      </div>
    </div>
  )
}
