import { useState, useMemo } from 'react'
import Papa from 'papaparse'
import { Doughnut, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { useStore } from '../store/useStore'
import { formatCurrency, formatCurrencyDecimal, generateId } from '../utils/formatters'
import { categorizeTransaction, CATEGORIES } from '../utils/categorize'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const CHART_COLORS = ['#1976d2', '#43a047', '#ff9800', '#e53935', '#9c27b0', '#00bcd4', '#f06292', '#8d6e63']

function parseNZDate(str) {
  if (!str) return null
  const s = str.trim()
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (dmy) {
    const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
    if (!isNaN(d)) return d
  }
  // YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    if (!isNaN(d)) return d
  }
  // "15 Jan 2026" style
  const d = new Date(s)
  if (!isNaN(d)) return d
  return null
}

function formatDateStr(dateObj) {
  if (!dateObj) return ''
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

function autoDetectColumns(headers) {
  const lower = headers.map(h => h.toLowerCase().trim())
  const mapping = { date: -1, description: -1, amount: -1, otherParty: -1 }

  for (let i = 0; i < lower.length; i++) {
    // Prefer "effective date" over "transaction date" for Kiwibank
    if (mapping.date === -1 && (lower[i] === 'effective date' || lower[i] === 'date')) mapping.date = i
    if (mapping.description === -1 && (lower[i].includes('desc') || lower[i].includes('particular') || lower[i].includes('detail') || lower[i].includes('narrat') || lower[i].includes('memo') || lower[i].includes('payee'))) mapping.description = i
    if (mapping.amount === -1 && (lower[i].includes('amount') || lower[i].includes('value') || lower[i].includes('sum'))) mapping.amount = i
    if (mapping.otherParty === -1 && lower[i].includes('other party name')) mapping.otherParty = i
  }

  // Second pass: pick up any date column if we didn't find a preferred one
  if (mapping.date === -1) {
    for (let i = 0; i < lower.length; i++) {
      if (lower[i].includes('date') || lower[i].includes('time')) { mapping.date = i; break }
    }
  }

  // Fallbacks for NZ bank CSVs with no clear headers
  if (mapping.date === -1) mapping.date = 0
  if (mapping.description === -1) mapping.description = Math.min(1, headers.length - 1)
  if (mapping.amount === -1) mapping.amount = Math.min(headers.length - 1, 2)

  return mapping
}

export default function Transactions() {
  const { state, dispatch } = useStore()
  const transactions = state.transactions || []
  const categoryRules = state.categoryRules || []

  // Import wizard state
  const [wizardOpen, setWizardOpen] = useState(false)
  const [step, setStep] = useState(0) // 0=upload, 1=map, 2=preview, 3=done
  const [rawData, setRawData] = useState(null)
  const [headers, setHeaders] = useState([])
  const [mapping, setMapping] = useState({ date: 0, description: 1, amount: 2, otherParty: -1 })
  const [preview, setPreview] = useState([])
  const [importResult, setImportResult] = useState(null)

  // History filters
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Create income/bill modal
  const [createModal, setCreateModal] = useState(null)
  const [createForm, setCreateForm] = useState(null)

  // Confirm clear
  const [confirmClear, setConfirmClear] = useState(false)

  // --- Import Wizard ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (result) => {
        if (result.data.length < 2) return
        const hdrs = result.data[0].map(String)
        setHeaders(hdrs)
        setRawData(result.data.slice(1))
        setMapping(autoDetectColumns(hdrs))
        setStep(1)
      },
    })
  }

  const handleConfirmMapping = () => {
    if (!rawData) return
    const existing = new Set(transactions.map(t => `${t.date}|${t.description}|${t.amount}`))
    const parsed = []

    for (const row of rawData) {
      const dateStr = row[mapping.date]
      const desc = (row[mapping.description] || '').trim()
      const otherParty = mapping.otherParty >= 0 ? (row[mapping.otherParty] || '').trim() : ''
      const amountRaw = parseFloat((row[mapping.amount] || '').replace(/[,$]/g, ''))
      if (!desc || isNaN(amountRaw) || amountRaw === 0) continue

      const dateObj = parseNZDate(dateStr)
      const date = dateObj ? formatDateStr(dateObj) : ''
      const amount = Math.abs(amountRaw)
      const type = amountRaw >= 0 ? 'income' : 'expense'
      // Use both description and other party name for categorization
      const catSource = otherParty ? `${desc} ${otherParty}` : desc
      const category = type === 'expense' ? categorizeTransaction(catSource, categoryRules) : 'income'
      // Use other party name as description if it's cleaner (non-empty and not truncated)
      const displayDesc = otherParty && !otherParty.includes('0000000') ? otherParty : desc
      const key = `${date}|${displayDesc}|${amount}`
      const isDuplicate = existing.has(key)

      parsed.push({
        id: generateId(),
        date,
        description: displayDesc,
        amount,
        type,
        category,
        isDuplicate,
      })
    }

    setPreview(parsed)
    setStep(2)
  }

  const handleCategoryChange = (id, newCategory) => {
    setPreview(prev => prev.map(t => t.id === id ? { ...t, category: newCategory } : t))
    // Learn rule from this correction
    const txn = preview.find(t => t.id === id)
    if (txn) {
      // Extract a keyword from description (use first two words or whole description)
      const words = txn.description.toLowerCase().split(/\s+/).filter(Boolean)
      const keyword = words.length >= 2 ? words.slice(0, 2).join(' ') : words[0] || ''
      if (keyword) {
        const existing = categoryRules.filter(r => r.keyword !== keyword)
        dispatch({ type: 'SET_CATEGORY_RULES', rules: [...existing, { keyword, category: newCategory }] })
      }
    }
  }

  const handleImport = () => {
    const toImport = preview.filter(t => !t.isDuplicate)
    const clean = toImport.map(({ isDuplicate, ...t }) => t)
    dispatch({ type: 'SET_TRANSACTIONS', transactions: [...transactions, ...clean] })
    setImportResult({ added: clean.length, skipped: preview.length - clean.length })
    setStep(3)
  }

  const resetWizard = () => {
    setStep(0)
    setRawData(null)
    setHeaders([])
    setPreview([])
    setImportResult(null)
  }

  // --- Filtered transactions ---
  const filtered = useMemo(() => {
    let list = [...transactions]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(t => t.description.toLowerCase().includes(s))
    }
    if (filterCategory) {
      list = list.filter(t => t.category === filterCategory)
    }
    if (dateFrom) {
      list = list.filter(t => t.date >= dateFrom)
    }
    if (dateTo) {
      list = list.filter(t => t.date <= dateTo)
    }
    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    return list
  }, [transactions, search, filterCategory, dateFrom, dateTo])

  // --- Stats ---
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net = totalIncome - totalExpenses

  // --- Chart data ---
  const spendingByCategory = useMemo(() => {
    const map = {}
    filtered.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount
    })
    const labels = Object.keys(map).map(c => c.charAt(0).toUpperCase() + c.slice(1))
    const values = Object.values(map)
    return { labels, values }
  }, [filtered])

  const monthlyData = useMemo(() => {
    const map = {}
    filtered.forEach(t => {
      const month = t.date ? t.date.slice(0, 7) : 'Unknown'
      if (!map[month]) map[month] = { income: 0, expenses: 0 }
      if (t.type === 'income') map[month].income += t.amount
      else map[month].expenses += t.amount
    })
    const months = Object.keys(map).sort()
    return {
      labels: months,
      income: months.map(m => map[m].income),
      expenses: months.map(m => map[m].expenses),
    }
  }, [filtered])

  // --- Create income/bill from transaction ---
  const openCreateModal = (txn, itemType) => {
    setCreateModal(itemType)
    if (itemType === 'income') {
      setCreateForm({
        name: txn.description,
        person: '',
        amount: txn.amount,
        frequency: 'monthly',
        startDate: txn.date,
        endDate: '',
      })
    } else {
      setCreateForm({
        name: txn.description,
        amount: txn.amount,
        frequency: 'monthly',
        category: txn.category || 'other',
        dueDay: txn.date ? new Date(txn.date + 'T00:00:00').getDate().toString() : '',
        isFixed: true,
      })
    }
  }

  const handleCreateSave = () => {
    if (!createForm?.name || !createForm?.amount) return
    if (createModal === 'income') {
      dispatch({
        type: 'ADD_ITEM',
        collection: 'income',
        item: { ...createForm, amount: Number(createForm.amount), id: generateId() },
      })
    } else {
      dispatch({
        type: 'ADD_ITEM',
        collection: 'bills',
        item: { ...createForm, amount: Number(createForm.amount), id: generateId() },
      })
    }
    setCreateModal(null)
    setCreateForm(null)
  }

  const handleClearAll = () => {
    dispatch({ type: 'SET_TRANSACTIONS', transactions: [] })
    setConfirmClear(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
          <p className="text-sm text-gray-500">Import bank statements and track spending</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { resetWizard(); setWizardOpen(!wizardOpen) }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            {wizardOpen ? 'Close Import' : '+ Import CSV'}
          </button>
          {transactions.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-100 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Import Wizard */}
      {wizardOpen && (
        <div className="bg-white rounded-lg shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            {[0, 1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {s + 1}
                </div>
                <span className="text-xs text-gray-500 hidden sm:inline">
                  {['Upload', 'Map Columns', 'Preview', 'Done'][s]}
                </span>
                {s < 3 && <div className={`w-6 h-0.5 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Upload */}
          {step === 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV file from your bank</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-400 mt-2">Supports most NZ bank CSV formats (ASB, ANZ, BNZ, Westpac, Kiwibank)</p>
            </div>
          )}

          {/* Step 2: Map Columns */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Confirm which columns contain the date, description, and amount.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {['date', 'description', 'amount'].map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
                    <select
                      value={mapping[field]}
                      onChange={(e) => setMapping({ ...mapping, [field]: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Party <span className="text-gray-400 font-normal">(optional)</span></label>
                  <select
                    value={mapping.otherParty}
                    onChange={(e) => setMapping({ ...mapping, otherParty: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value={-1}>None</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Preview first 3 rows */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 px-2 text-gray-500">Date</th>
                      <th className="text-left py-1 px-2 text-gray-500">Description</th>
                      <th className="text-right py-1 px-2 text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawData?.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-1 px-2">{row[mapping.date]}</td>
                        <td className="py-1 px-2">{row[mapping.description]}</td>
                        <td className="py-1 px-2 text-right">{row[mapping.amount]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <button onClick={handleConfirmMapping} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
                  Continue
                </button>
                <button onClick={() => { setStep(0); setRawData(null) }} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {preview.filter(t => !t.isDuplicate).length} new transactions found.
                {preview.filter(t => t.isDuplicate).length > 0 && (
                  <span className="text-amber-600"> {preview.filter(t => t.isDuplicate).length} duplicates will be skipped.</span>
                )}
              </p>
              <div className="max-h-80 overflow-y-auto space-y-1">
                {preview.map(txn => (
                  <div key={txn.id} className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${txn.isDuplicate ? 'bg-gray-50 opacity-50' : 'bg-white border border-gray-100'}`}>
                    <span className="text-gray-400 w-20 shrink-0 text-xs">{formatDisplayDate(txn.date)}</span>
                    <span className="flex-1 truncate">{txn.description}</span>
                    {txn.type === 'expense' && !txn.isDuplicate ? (
                      <select
                        value={txn.category}
                        onChange={(e) => handleCategoryChange(txn.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-gray-400 px-2">{txn.isDuplicate ? 'Duplicate' : 'Income'}</span>
                    )}
                    <span className={`font-medium w-24 text-right ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrencyDecimal(txn.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleImport} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
                  Import {preview.filter(t => !t.isDuplicate).length} Transactions
                </button>
                <button onClick={() => setStep(1)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 3 && importResult && (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">&#10003;</div>
              <p className="text-lg font-semibold text-gray-800">Import Complete</p>
              <p className="text-sm text-gray-500 mt-1">
                {importResult.added} transaction{importResult.added !== 1 ? 's' : ''} added
                {importResult.skipped > 0 && `, ${importResult.skipped} duplicate${importResult.skipped !== 1 ? 's' : ''} skipped`}
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <button onClick={resetWizard} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
                  Import More
                </button>
                <button onClick={() => setWizardOpen(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {transactions.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Income" value={formatCurrency(totalIncome)} color="text-green-600" />
            <StatCard label="Total Expenses" value={formatCurrency(totalExpenses)} color="text-red-600" />
            <StatCard label="Net" value={formatCurrency(net)} color={net >= 0 ? 'text-green-600' : 'text-red-600'} />
            <StatCard label="Transactions" value={filtered.length} sub={filtered.length !== transactions.length ? `of ${transactions.length}` : undefined} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spendingByCategory.labels.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Spending by Category</h3>
                <Doughnut
                  data={{
                    labels: spendingByCategory.labels,
                    datasets: [{
                      data: spendingByCategory.values,
                      backgroundColor: CHART_COLORS.slice(0, spendingByCategory.labels.length),
                      borderWidth: 2,
                      borderColor: '#fff',
                    }],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } },
                      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw)}` } },
                    },
                  }}
                />
              </div>
            )}
            {monthlyData.labels.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Income vs Expenses</h3>
                <Bar
                  data={{
                    labels: monthlyData.labels,
                    datasets: [
                      { label: 'Income', data: monthlyData.income, backgroundColor: '#43a047', borderRadius: 4 },
                      { label: 'Expenses', data: monthlyData.expenses, backgroundColor: '#e53935', borderRadius: 4 },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } },
                      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } },
                    },
                    scales: {
                      y: { ticks: { callback: (v) => formatCurrency(v) } },
                    },
                  }}
                />
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Categories</option>
                <option value="income">Income</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="From"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="To"
              />
            </div>
          </div>

          {/* Transaction list */}
          <div className="space-y-1">
            {filtered.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No transactions match your filters</p>
            )}
            {filtered.map(txn => (
              <div key={txn.id} className="bg-white rounded-lg shadow-sm px-4 py-3 flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">{formatDisplayDate(txn.date)}</span>
                <span className="flex-1 text-sm text-gray-800 truncate">{txn.description}</span>
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                  txn.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {txn.type === 'income' ? 'Income' : txn.category}
                </span>
                <span className={`font-medium text-sm w-24 text-right ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.type === 'income' ? '+' : '-'}{formatCurrencyDecimal(txn.amount)}
                </span>
                <div className="flex gap-1 shrink-0">
                  {txn.type === 'income' ? (
                    <button
                      onClick={() => openCreateModal(txn, 'income')}
                      className="text-xs text-primary-600 hover:text-primary-800 whitespace-nowrap"
                    >
                      Create Income
                    </button>
                  ) : (
                    <button
                      onClick={() => openCreateModal(txn, 'bill')}
                      className="text-xs text-primary-600 hover:text-primary-800 whitespace-nowrap"
                    >
                      Create Bill
                    </button>
                  )}
                  <button
                    onClick={() => dispatch({ type: 'SET_TRANSACTIONS', transactions: transactions.filter(t => t.id !== txn.id) })}
                    className="text-xs text-red-500 hover:text-red-700 ml-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {transactions.length === 0 && !wizardOpen && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm mb-3">No transactions yet. Import a bank statement CSV to get started.</p>
          <button
            onClick={() => { resetWizard(); setWizardOpen(true) }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            + Import CSV
          </button>
        </div>
      )}

      {/* Create Income/Bill Modal */}
      {createModal && createForm && (
        <Modal title={createModal === 'income' ? 'Create Income Item' : 'Create Bill'} onClose={() => setCreateModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {createModal === 'income' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Person</label>
                <input
                  type="text"
                  value={createForm.person}
                  onChange={(e) => setCreateForm({ ...createForm, person: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Partner"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
              <input
                type="number"
                value={createForm.amount}
                onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                value={createForm.frequency}
                onChange={(e) => setCreateForm({ ...createForm, frequency: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            {createModal === 'bill' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={handleCreateSave} className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm hover:bg-primary-700">
                Create
              </button>
              <button onClick={() => setCreateModal(null)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Clear Modal */}
      {confirmClear && (
        <Modal title="Clear All Transactions" onClose={() => setConfirmClear(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will permanently delete all {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}. This cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={handleClearAll} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700">
                Delete All
              </button>
              <button onClick={() => setConfirmClear(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
