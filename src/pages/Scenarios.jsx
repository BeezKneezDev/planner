import { useState, useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js'
import { useStore } from '../store/useStore'
import { projectNetWorth, projectMortgage, projectInvestment, calcMonthlyIncome, calcMonthlyExpenses, getMonthLabels } from '../utils/calculations'
import { formatCurrency, toMonthly, generateId } from '../utils/formatters'
import Modal from '../components/Modal'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const TEMP_TYPES = [
  { key: 'income', label: 'Income', bg: 'bg-green-50', text: 'text-green-600' },
  { key: 'expense', label: 'Expense', bg: 'bg-red-50', text: 'text-red-600' },
  { key: 'debt', label: 'Debt', bg: 'bg-amber-50', text: 'text-amber-600' },
  { key: 'investment', label: 'Investment', bg: 'bg-blue-50', text: 'text-blue-600' },
  { key: 'lumpsum', label: 'Lump Sum', bg: 'bg-purple-50', text: 'text-purple-600' },
]

export default function Scenarios() {
  const { state } = useStore()
  const YEAR_OPTIONS = [1, 2, 3, 4, 5, 10, 15, 20]
  const [years, setYears] = useState(4)
  const months = years * 12
  const labels = getMonthLabels(months)
  const labelInterval = months <= 24 ? 3 : months <= 60 ? 6 : 12
  const sparseLabels = labels.map((l, i) => (i % labelInterval === 0 ? l : ''))

  // --- Scenario adjustments state ---
  const [incomeAdj, setIncomeAdj] = useState({})
  const [billAdj, setBillAdj] = useState({})
  const [growthAdj, setGrowthAdj] = useState({})
  const [extraPayments, setExtraPayments] = useState({})
  const [contributions, setContributions] = useState({})

  // --- Temp what-if items ---
  const [tempItems, setTempItems] = useState([])
  const [showTempModal, setShowTempModal] = useState(false)
  const [tempForm, setTempForm] = useState({ type: 'income', name: '', amount: '', interestRate: '', growthRate: '', payment: '', month: '', applyTo: 'cash' })

  const addTempItem = () => {
    if (!tempForm.name || !tempForm.amount) return
    setTempItems((prev) => [...prev, { ...tempForm, id: generateId(), amount: Number(tempForm.amount), interestRate: Number(tempForm.interestRate) || 0, growthRate: Number(tempForm.growthRate) || 0, payment: Number(tempForm.payment) || 0, month: Number(tempForm.month) || 0 }])
    setShowTempModal(false)
    setTempForm({ type: 'income', name: '', amount: '', interestRate: '', growthRate: '', payment: '', month: '', applyTo: 'cash' })
  }

  const removeTempItem = (id) => setTempItems((prev) => prev.filter((t) => t.id !== id))

  const tempIncome = tempItems.filter((t) => t.type === 'income')
  const tempExpenses = tempItems.filter((t) => t.type === 'expense')
  const tempDebts = tempItems.filter((t) => t.type === 'debt')
  const tempInvestments = tempItems.filter((t) => t.type === 'investment')

  const tempMonthlyIncome = tempIncome.reduce((s, t) => s + t.amount, 0)
  const tempMonthlyExpenses = tempExpenses.reduce((s, t) => s + t.amount, 0)
  const tempDebtPayments = tempDebts.reduce((s, t) => s + t.payment, 0)

  // Investment chart view
  const [investChartView, setInvestChartView] = useState('all')

  // Expanded sections
  const [expanded, setExpanded] = useState({})
  const toggle = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }))

  // --- Base calculations ---
  const baseMonthlyIncome = calcMonthlyIncome(state.income)
  const baseMonthlyExpenses = calcMonthlyExpenses(state.bills)
  const baseMonthlyDebtPayments = state.liabilities.reduce((sum, l) =>
    sum + toMonthly(Number(l.minPayment) || 0, l.paymentFrequency || 'monthly'), 0)
  const baseSurplus = baseMonthlyIncome - baseMonthlyExpenses - baseMonthlyDebtPayments

  // --- Scenario calculations ---
  // Income: base monthly per item, with optional adjustments
  const incomeItems = useMemo(() => state.income.map((i) => {
    const baseMonthly = Math.round(toMonthly(Number(i.amount), i.frequency))
    const adjusted = incomeAdj[i.id] !== undefined ? incomeAdj[i.id] : baseMonthly
    return { ...i, baseMonthly, adjusted }
  }), [state.income, incomeAdj])

  const scenarioMonthlyIncome = incomeItems.reduce((s, i) => s + i.adjusted, 0) + tempMonthlyIncome

  // Bills: base monthly per item, with optional adjustments
  const billItems = useMemo(() => state.bills.map((b) => {
    const baseMonthly = Math.round(toMonthly(Number(b.amount), b.frequency))
    const adjusted = billAdj[b.id] !== undefined ? billAdj[b.id] : baseMonthly
    return { ...b, baseMonthly, adjusted }
  }), [state.bills, billAdj])

  const scenarioMonthlyExpenses = billItems.reduce((s, b) => s + b.adjusted, 0) + tempMonthlyExpenses + tempDebtPayments

  // Extra debt payments
  const totalExtraPayments = Object.values(extraPayments).reduce((s, v) => s + (Number(v) || 0), 0)

  // Investment contributions (scenario slider + base KiwiSaver contributions)
  const totalScenarioContributions = Object.values(contributions).reduce((s, v) => s + (Number(v) || 0), 0)
  const totalKiwiBaseContributions = state.assets
    .filter((a) => a.type === 'kiwisaver')
    .reduce((s, a) => s + (Number(a.kiwiGovt) || 0) / 12 + (Number(a.kiwiEmployer) || 0) + (Number(a.kiwiPersonal) || 0), 0)
  const totalContributions = totalScenarioContributions + totalKiwiBaseContributions

  // Available surplus in scenario (after bills AND base debt payments)
  const scenarioSurplus = scenarioMonthlyIncome - scenarioMonthlyExpenses - baseMonthlyDebtPayments
  const allocatedFromSurplus = totalExtraPayments + totalContributions
  const remainingSurplus = scenarioSurplus - allocatedFromSurplus
  const isOverBudget = remainingSurplus < 0

  // Income change from adjustments
  const incomeChange = scenarioMonthlyIncome - baseMonthlyIncome
  // Expense change (negative = saving money)
  const expenseChange = scenarioMonthlyExpenses - baseMonthlyExpenses

  // --- Build scenario data for projections ---
  const allAssets = state.assets

  // Lump sum targets for dropdown
  const lumpSumTargets = useMemo(() => {
    const targets = [{ value: 'cash', label: 'Keep as cash' }]
    state.liabilities.forEach((l) => targets.push({ value: `debt-${l.id}`, label: `Pay down ${l.name}` }))
    allAssets.filter((a) => ['stock', 'crypto', 'kiwisaver'].includes(a.type)).forEach((a) => targets.push({ value: `asset-${a.id}`, label: `Add to ${a.name}` }))
    return targets
  }, [state.liabilities, allAssets])

  // Build lump sum events for projections
  const tempLumpSums = tempItems
    .filter((t) => t.type === 'lumpsum')
    .map((t) => ({
      month: t.month,
      amount: t.amount,
      targetType: t.applyTo === 'cash' ? 'cash' : t.applyTo.startsWith('debt-') ? 'debt' : 'asset',
      targetId: t.applyTo === 'cash' ? null : t.applyTo.split('-').slice(1).join('-'),
    }))

  const scenarioAssets = [
    ...allAssets.map((a) => ({
      ...a,
      growthRate: growthAdj[a.id] !== undefined ? growthAdj[a.id] : (a.growthRate || 0),
    })),
    ...tempInvestments.map((t) => ({ id: t.id, value: t.amount, growthRate: t.growthRate, type: 'stock' })),
  ]

  const scenarioLiabilities = [
    ...state.liabilities,
    ...tempDebts.map((t) => ({ id: t.id, balance: t.amount, interestRate: t.interestRate, minPayment: t.payment, type: 'loan' })),
  ]

  const scenarioIncomeForProjection = [
    ...incomeItems.map((i) => ({ amount: i.adjusted, frequency: 'monthly' })),
    ...tempIncome.map((t) => ({ amount: t.amount, frequency: 'monthly' })),
  ]
  const scenarioExpensesForProjection = [
    { amount: billItems.reduce((s, b) => s + b.adjusted, 0) + tempMonthlyExpenses, frequency: 'monthly' },
  ]

  const baseNetWorth = projectNetWorth(allAssets, state.liabilities, state.income, state.bills, months)
  const scenarioNetWorth = projectNetWorth(scenarioAssets, scenarioLiabilities, scenarioIncomeForProjection, scenarioExpensesForProjection, months, contributions, extraPayments, tempLumpSums)

  // Mortgage projections
  const mortgage = state.liabilities.find((l) => l.type === 'mortgage')
  const mortgageExtra = extraPayments[mortgage?.id] || 0
  const mortgageLumpSums = tempLumpSums
    .filter((ls) => ls.targetType === 'debt' && ls.targetId === mortgage?.id)
    .map((ls) => ({ month: ls.month, amount: ls.amount }))
  let baseMortgage = []
  let scenarioMortgage = []
  const mortgageMonthlyPayment = mortgage ? toMonthly(Number(mortgage.minPayment) || 0, mortgage.paymentFrequency || 'monthly') : 0
  if (mortgage) {
    baseMortgage = projectMortgage(mortgage.balance, mortgage.interestRate || 0, mortgageMonthlyPayment, 0, months)
    scenarioMortgage = projectMortgage(mortgage.balance, mortgage.interestRate || 0, mortgageMonthlyPayment, Number(mortgageExtra), months, mortgageLumpSums)
  }

  // Find payoff month
  const findPayoffMonth = (data) => {
    const idx = data.findIndex((v) => v <= 0)
    return idx >= 0 ? idx : null
  }
  const basePayoff = findPayoffMonth(baseMortgage)
  const scenarioPayoff = findPayoffMonth(scenarioMortgage)

  // Investment projections (per-asset base vs scenario)
  const investmentAssets = allAssets.filter((a) => ['stock', 'crypto', 'kiwisaver'].includes(a.type))
  const investProjections = useMemo(() => {
    return investmentAssets.map((asset) => {
      const baseGrowth = Number(asset.growthRate) || 0
      const scenarioGrowth = growthAdj[asset.id] !== undefined ? growthAdj[asset.id] : baseGrowth
      const kiwiMonthly = asset.type === 'kiwisaver'
        ? (Number(asset.kiwiGovt) || 0) / 12 + (Number(asset.kiwiEmployer) || 0) + (Number(asset.kiwiPersonal) || 0)
        : 0
      const scenarioContrib = (Number(contributions[asset.id]) || 0) + kiwiMonthly
      const base = projectInvestment(asset.value, baseGrowth, kiwiMonthly, months)
      const scenario = projectInvestment(asset.value, scenarioGrowth, scenarioContrib, months)
      return { id: asset.id, name: asset.name, base, scenario }
    })
  }, [investmentAssets.map((a) => a.id).join(','), growthAdj, contributions, months])

  // Combined "all investments" projection
  const allInvestBase = useMemo(() => {
    if (investProjections.length === 0) return []
    return investProjections[0].base.map((_, i) => investProjections.reduce((sum, p) => sum + p.base[i], 0))
  }, [investProjections])
  const allInvestScenario = useMemo(() => {
    if (investProjections.length === 0) return []
    return investProjections[0].scenario.map((_, i) => investProjections.reduce((sum, p) => sum + p.scenario[i], 0))
  }, [investProjections])

  // End values
  const baseEnd = baseNetWorth[months] || 0
  const scenarioEnd = scenarioNetWorth[months] || 0
  const difference = scenarioEnd - baseEnd

  // --- Render helpers ---
  const renderSlider = (value, min, max, step, onChange) => (
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
  )

  const BILL_CATEGORIES = { housing: 'Housing', utilities: 'Utilities', food: 'Food', transport: 'Transport', education: 'Education', healthcare: 'Healthcare', lifestyle: 'Lifestyle', other: 'Other' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Scenario Simulation</h2>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-500 mr-2">Projection:</span>
          {YEAR_OPTIONS.map((y) => (
            <button key={y} onClick={() => setYears(y)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${years === y ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >{y}yr</button>
          ))}
        </div>
      </div>

      {/* Budget balance bar */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-700">Monthly Budget Balance</h3>
          <span className={`text-sm font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(remainingSurplus)} {isOverBudget ? 'over budget' : 'available'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div className="h-full flex">
            {scenarioSurplus > 0 && (
              <>
                <div
                  className="bg-primary-500 h-full transition-all"
                  style={{ width: `${Math.min(100, (allocatedFromSurplus / scenarioSurplus) * 100)}%` }}
                />
                <div
                  className="bg-green-400 h-full transition-all"
                  style={{ width: `${Math.max(0, Math.min(100 - (allocatedFromSurplus / scenarioSurplus) * 100, (remainingSurplus / scenarioSurplus) * 100))}%` }}
                />
              </>
            )}
            {isOverBudget && <div className="bg-red-500 h-full w-full" />}
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Surplus: {formatCurrency(scenarioSurplus)}/mo</span>
          <span>Allocated: {formatCurrency(allocatedFromSurplus)}</span>
          <span>Free: {formatCurrency(Math.max(0, remainingSurplus))}</span>
        </div>
        {isOverBudget && (
          <p className="text-red-500 text-xs mt-2 font-medium">
            You're allocating {formatCurrency(Math.abs(remainingSurplus))} more than your surplus — reduce extra payments or increase income.
          </p>
        )}
      </div>

      {/* Income adjustments */}
      <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('income')}>
            <div className="flex items-center gap-3">
              <span className={`text-xs transition-transform ${expanded.income ? 'rotate-90' : ''}`}>&#9654;</span>
              <h3 className="font-semibold text-gray-700">Income</h3>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-gray-800">{formatCurrency(scenarioMonthlyIncome)}/mo</span>
              {incomeChange !== 0 && (
                <span className={`text-xs ml-2 ${incomeChange > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  ({incomeChange > 0 ? '+' : ''}{formatCurrency(incomeChange)})
                </span>
              )}
            </div>
          </div>
          {expanded.income && (
            <div className="mt-4 space-y-4">
              {incomeItems.map((item) => {
                const diff = item.adjusted - item.baseMonthly
                return (
                  <div key={item.id} className="pl-4 border-l-2 border-green-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{item.name} <span className="text-xs text-gray-400">({item.person})</span></span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{formatCurrency(item.adjusted)}/mo</span>
                        {diff !== 0 && (
                          <span className={`text-xs ${diff > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            ({diff > 0 ? '+' : ''}{formatCurrency(diff)})
                          </span>
                        )}
                      </div>
                    </div>
                    {renderSlider(
                      item.adjusted,
                      0,
                      Math.round(item.baseMonthly * 3),
                      50,
                      (val) => setIncomeAdj((p) => ({ ...p, [item.id]: val }))
                    )}
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>$0</span>
                      <span className="text-gray-500">Base: {formatCurrency(item.baseMonthly)}</span>
                      <span>{formatCurrency(Math.round(item.baseMonthly * 3))}</span>
                    </div>
                  </div>
                )
              })}
              {incomeItems.length === 0 && <p className="text-xs text-gray-400">No income sources — add them in Income page</p>}
            </div>
          )}
        </div>

      {/* Expenses adjustments */}
      <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('expenses')}>
            <div className="flex items-center gap-3">
              <span className={`text-xs transition-transform ${expanded.expenses ? 'rotate-90' : ''}`}>&#9654;</span>
              <h3 className="font-semibold text-gray-700">Expenses</h3>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-gray-800">{formatCurrency(scenarioMonthlyExpenses)}/mo</span>
              {expenseChange !== 0 && (
                <span className={`text-xs ml-2 ${expenseChange < 0 ? 'text-green-600' : 'text-red-500'}`}>
                  ({expenseChange < 0 ? '' : '+'}{formatCurrency(expenseChange)})
                </span>
              )}
            </div>
          </div>
          {expanded.expenses && (
            <div className="mt-4 space-y-4">
              {Object.entries(BILL_CATEGORIES).map(([cat, label]) => {
                const items = billItems.filter((b) => b.category === cat)
                if (items.length === 0) return null
                const catBase = items.reduce((s, b) => s + b.baseMonthly, 0)
                const catAdj = items.reduce((s, b) => s + b.adjusted, 0)
                const catDiff = catAdj - catBase
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between cursor-pointer mb-2" onClick={() => toggle(`exp-${cat}`)}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs transition-transform ${expanded[`exp-${cat}`] ? 'rotate-90' : ''}`}>&#9654;</span>
                        <span className="text-sm font-medium text-gray-600">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">{formatCurrency(catAdj)}/mo</span>
                        {catDiff !== 0 && (
                          <span className={`text-xs ${catDiff < 0 ? 'text-green-600' : 'text-red-500'}`}>
                            ({catDiff < 0 ? '' : '+'}{formatCurrency(catDiff)})
                          </span>
                        )}
                      </div>
                    </div>
                    {expanded[`exp-${cat}`] && (
                      <div className="space-y-3 ml-4">
                        {items.map((item) => {
                          const diff = item.adjusted - item.baseMonthly
                          return (
                            <div key={item.id} className="pl-3 border-l-2 border-red-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-600">{item.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{formatCurrency(item.adjusted)}/mo</span>
                                  {diff !== 0 && (
                                    <span className={`text-xs ${diff < 0 ? 'text-green-600' : 'text-red-500'}`}>
                                      ({diff < 0 ? '' : '+'}{formatCurrency(diff)})
                                    </span>
                                  )}
                                </div>
                              </div>
                              {renderSlider(
                                item.adjusted,
                                0,
                                Math.round(item.baseMonthly * 2),
                                10,
                                (val) => setBillAdj((p) => ({ ...p, [item.id]: val }))
                              )}
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>$0</span>
                                <span className="text-gray-500">Base: {formatCurrency(item.baseMonthly)}</span>
                                <span>{formatCurrency(Math.round(item.baseMonthly * 2))}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      {/* Debt / Extra Payments */}
      {state.liabilities.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('debt')}>
            <div className="flex items-center gap-3">
              <span className={`text-xs transition-transform ${expanded.debt ? 'rotate-90' : ''}`}>&#9654;</span>
              <h3 className="font-semibold text-gray-700">Extra Debt Payments</h3>
            </div>
            <span className="text-sm font-semibold text-gray-800">
              {totalExtraPayments > 0 ? `+${formatCurrency(totalExtraPayments)}/mo` : 'None'}
            </span>
          </div>
          {expanded.debt && (
            <div className="mt-4 space-y-4">
              {state.liabilities.map((debt) => {
                const extra = Number(extraPayments[debt.id]) || 0
                const maxExtra = Math.max(0, remainingSurplus + extra)
                return (
                  <div key={debt.id} className="pl-4 border-l-2 border-amber-200">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm text-gray-700">{debt.name}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          Balance: {formatCurrency(debt.balance)} @ {debt.interestRate}%
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        +{formatCurrency(extra)}/mo extra
                      </span>
                    </div>
                    {renderSlider(
                      extra,
                      0,
                      Math.min(5000, Math.max(extra, maxExtra)),
                      50,
                      (val) => setExtraPayments((p) => ({ ...p, [debt.id]: val }))
                    )}
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>$0 extra</span>
                      <span>Current payment: {formatCurrency(toMonthly(Number(debt.minPayment) || 0, debt.paymentFrequency || 'monthly'))}/mo</span>
                      <span>Max: {formatCurrency(Math.min(5000, Math.max(extra, maxExtra)))}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Investment adjustments */}
      {allAssets.filter((a) => ['stock', 'crypto', 'kiwisaver'].includes(a.type)).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('invest')}>
            <div className="flex items-center gap-3">
              <span className={`text-xs transition-transform ${expanded.invest ? 'rotate-90' : ''}`}>&#9654;</span>
              <h3 className="font-semibold text-gray-700">Investments</h3>
            </div>
            <span className="text-sm font-semibold text-gray-800">
              {totalContributions > 0 ? `+${formatCurrency(totalContributions)}/mo contributions` : 'Growth rates only'}
              {totalKiwiBaseContributions > 0 && totalScenarioContributions === 0 && <span className="text-xs text-blue-500 ml-1">(KiwiSaver)</span>}
            </span>
          </div>
          {expanded.invest && (
            <div className="mt-4 space-y-4">
              {allAssets.filter((a) => ['stock', 'crypto', 'kiwisaver'].includes(a.type)).map((asset) => {
                const currentGrowth = growthAdj[asset.id] !== undefined ? growthAdj[asset.id] : (Number(asset.growthRate) || 0)
                const contrib = Number(contributions[asset.id]) || 0
                const maxContrib = Math.max(0, remainingSurplus + contrib)
                const kiwiBase = asset.type === 'kiwisaver'
                  ? (Number(asset.kiwiGovt) || 0) / 12 + (Number(asset.kiwiEmployer) || 0) + (Number(asset.kiwiPersonal) || 0)
                  : 0
                return (
                  <div key={asset.id} className="pl-4 border-l-2 border-green-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{asset.name}</span>
                      <span className="text-sm text-gray-500">Value: {formatCurrency(asset.value)}</span>
                    </div>
                    {kiwiBase > 0 && (
                      <p className="text-xs text-blue-600 mb-1">
                        Base KiwiSaver contributions: {formatCurrency(kiwiBase)}/mo
                        <span className="text-gray-400 ml-1">
                          (Govt {formatCurrency((Number(asset.kiwiGovt) || 0) / 12)} + Employer {formatCurrency(Number(asset.kiwiEmployer) || 0)} + Personal {formatCurrency(Number(asset.kiwiPersonal) || 0)})
                        </span>
                      </p>
                    )}
                    <div className="space-y-2 mt-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs text-gray-500">Growth Rate</label>
                          <div className="flex items-center gap-1">
                            <input type="number" min="0" max="30" step="0.1" value={currentGrowth}
                              onChange={(e) => setGrowthAdj((p) => ({ ...p, [asset.id]: Number(e.target.value) || 0 }))}
                              className="w-16 border border-gray-300 rounded px-2 py-0.5 text-xs text-right" />
                            <span className="text-xs text-gray-500">%/yr</span>
                          </div>
                        </div>
                        {renderSlider(
                          currentGrowth,
                          0,
                          30,
                          0.5,
                          (val) => setGrowthAdj((p) => ({ ...p, [asset.id]: val }))
                        )}
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>0%</span>
                          <span className="text-gray-500">Base: {asset.growthRate || 0}%</span>
                          <span>30%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          {asset.type === 'kiwisaver'
                            ? <>Extra Personal Contribution: {formatCurrency(contrib)}<span className="text-blue-500 ml-1">(total: {formatCurrency(contrib + kiwiBase)}/mo)</span></>
                            : <>Monthly Contribution: {formatCurrency(contrib)}</>
                          }
                        </label>
                        {renderSlider(
                          contrib,
                          0,
                          Math.min(3000, Math.max(contrib, maxContrib)),
                          50,
                          (val) => setContributions((p) => ({ ...p, [asset.id]: val }))
                        )}
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>$0</span>
                          <span>Max from surplus: {formatCurrency(Math.min(3000, Math.max(contrib, maxContrib)))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* What If - Temp Items */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggle('whatif')}>
            <span className={`text-xs transition-transform ${expanded.whatif ? 'rotate-90' : ''}`}>&#9654;</span>
            <h3 className="font-semibold text-gray-700">What If...</h3>
            {tempItems.length > 0 && <span className="text-xs text-gray-400">({tempItems.length} items)</span>}
          </div>
          <button onClick={() => setShowTempModal(true)} className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700">
            + Add
          </button>
        </div>
        {expanded.whatif && (
          <div className="space-y-2">
            {tempItems.length === 0 && <p className="text-xs text-gray-400">Add hypothetical items to test scenarios — side gig, car payment, lump sum gift, new investment...</p>}
            {tempItems.map((item) => {
              const typeInfo = TEMP_TYPES.find((t) => t.key === item.type)
              const lsTarget = item.type === 'lumpsum' ? lumpSumTargets.find((t) => t.value === item.applyTo) : null
              return (
                <div key={item.id} className="flex items-center justify-between py-2 pl-4 border-l-2 border-purple-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${typeInfo.bg} ${typeInfo.text}`}>{typeInfo.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {item.type === 'income' && `+${formatCurrency(item.amount)}/mo`}
                      {item.type === 'expense' && `${formatCurrency(item.amount)}/mo`}
                      {item.type === 'debt' && `${formatCurrency(item.amount)} @ ${item.interestRate}% — ${formatCurrency(item.payment)}/mo payment`}
                      {item.type === 'investment' && `${formatCurrency(item.amount)} @ ${item.growthRate}% growth`}
                      {item.type === 'lumpsum' && `${formatCurrency(item.amount)} at month ${item.month} → ${lsTarget?.label || 'Cash'}`}
                    </p>
                  </div>
                  <button onClick={() => removeTempItem(item.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showTempModal && (
        <Modal title="Add What-If Item" onClose={() => setShowTempModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <div className="grid grid-cols-5 gap-2">
                {TEMP_TYPES.map((t) => (
                  <button key={t.key}
                    onClick={() => setTempForm({ ...tempForm, type: t.key })}
                    className={`text-sm py-2 rounded-lg border transition-colors ${tempForm.type === t.key ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-300'}`}
                  >{t.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={tempForm.name} onChange={(e) => setTempForm({ ...tempForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder={tempForm.type === 'income' ? 'e.g. Side gig' : tempForm.type === 'expense' ? 'e.g. Car payment' : tempForm.type === 'debt' ? 'e.g. Personal loan' : tempForm.type === 'lumpsum' ? 'e.g. Gift from family' : 'e.g. Index fund'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tempForm.type === 'income' ? 'Monthly Amount ($)' : tempForm.type === 'expense' ? 'Monthly Amount ($)' : tempForm.type === 'debt' ? 'Total Balance ($)' : tempForm.type === 'lumpsum' ? 'Lump Sum Amount ($)' : 'Starting Value ($)'}
              </label>
              <input type="number" value={tempForm.amount} onChange={(e) => setTempForm({ ...tempForm, amount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
            </div>
            {tempForm.type === 'debt' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% per year)</label>
                  <input type="number" step="0.1" value={tempForm.interestRate} onChange={(e) => setTempForm({ ...tempForm, interestRate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 8.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Payment ($)</label>
                  <input type="number" value={tempForm.payment} onChange={(e) => setTempForm({ ...tempForm, payment: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
                </div>
              </>
            )}
            {tempForm.type === 'investment' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Growth Rate (% per year)</label>
                <input type="number" step="0.1" value={tempForm.growthRate} onChange={(e) => setTempForm({ ...tempForm, growthRate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 8" />
              </div>
            )}
            {tempForm.type === 'lumpsum' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">When (months from now)</label>
                  <input type="number" min="0" max="48" value={tempForm.month} onChange={(e) => setTempForm({ ...tempForm, month: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 6" />
                  <p className="text-xs text-gray-400 mt-1">0 = now, 12 = 1 year, 24 = 2 years</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apply to</label>
                  <select value={tempForm.applyTo} onChange={(e) => setTempForm({ ...tempForm, applyTo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {lumpSumTargets.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={addTempItem} className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm hover:bg-primary-700">Add to Scenario</button>
              <button onClick={() => setShowTempModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Summary */}
      <div className={`rounded-xl p-5 ${isOverBudget ? 'bg-red-50' : difference >= 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
        {isOverBudget ? (
          <p className="text-red-600 font-semibold text-center">Scenario is over budget — adjust your allocations</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Base Net Worth ({years}yr)</p>
                <p className="text-lg font-bold text-gray-700">{formatCurrency(baseEnd)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Scenario Net Worth ({years}yr)</p>
                <p className="text-lg font-bold text-primary-600">{formatCurrency(scenarioEnd)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Difference</p>
                <p className={`text-lg font-bold ${difference >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Monthly Surplus</p>
                <p className={`text-lg font-bold ${remainingSurplus >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {formatCurrency(remainingSurplus)}
                </p>
              </div>
            </div>
            {mortgage && (
              <div className="flex justify-center gap-8 mt-3 pt-3 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Base Mortgage at {years}yr</p>
                  <p className="text-sm font-semibold text-gray-700">{formatCurrency(baseMortgage[months] || 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Scenario Mortgage at {years}yr</p>
                  <p className="text-sm font-semibold text-primary-600">{formatCurrency(scenarioMortgage[months] || 0)}</p>
                </div>
                {scenarioPayoff && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Paid Off In</p>
                    <p className="text-sm font-semibold text-green-600">{Math.floor(scenarioPayoff / 12)}yr {scenarioPayoff % 12}mo</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Charts */}
      {!isOverBudget && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Net Worth: Base vs Scenario</h3>
            <Line
              data={{
                labels: sparseLabels,
                datasets: [
                  { label: 'Base Case', data: baseNetWorth, borderColor: '#90caf9', tension: 0.3, pointRadius: 0, borderDash: [5, 5] },
                  { label: 'Scenario', data: scenarioNetWorth, borderColor: '#1976d2', tension: 0.3, pointRadius: 0 },
                ],
              }}
              options={{
                responsive: true,
                plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } } },
                scales: { y: { ticks: { callback: (v) => formatCurrency(v) } } },
              }}
            />
          </div>

          {mortgage && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Mortgage Payoff</h3>
              <Line
                data={{
                  labels: sparseLabels,
                  datasets: [
                    { label: 'Base Payments', data: baseMortgage, borderColor: '#ef5350', tension: 0.3, pointRadius: 0, borderDash: [5, 5] },
                    { label: 'With Extra Payments', data: scenarioMortgage, borderColor: '#43a047', tension: 0.3, pointRadius: 0 },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } } },
                  scales: { y: { ticks: { callback: (v) => formatCurrency(v) } } },
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Investment Growth Chart */}
      {!isOverBudget && investProjections.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Investment Growth: Base vs Scenario</h3>
            <select
              value={investChartView}
              onChange={(e) => setInvestChartView(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">All Investments</option>
              {investProjections.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {(() => {
            const selected = investChartView === 'all'
              ? { base: allInvestBase, scenario: allInvestScenario, label: 'All Investments' }
              : (() => { const p = investProjections.find((p) => p.id === investChartView); return p ? { base: p.base, scenario: p.scenario, label: p.name } : { base: allInvestBase, scenario: allInvestScenario, label: 'All Investments' } })()
            const baseEndVal = selected.base[months] || 0
            const scenEndVal = selected.scenario[months] || 0
            const diff = scenEndVal - baseEndVal
            return (
              <>
                <Line
                  data={{
                    labels: sparseLabels,
                    datasets: [
                      { label: `${selected.label} (Base)`, data: selected.base, borderColor: '#90caf9', tension: 0.3, pointRadius: 0, borderDash: [5, 5] },
                      { label: `${selected.label} (Scenario)`, data: selected.scenario, borderColor: '#1976d2', tension: 0.3, pointRadius: 0 },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } } },
                    scales: { y: { ticks: { callback: (v) => formatCurrency(v) } } },
                  }}
                />
                <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Base at {years}yr</p>
                    <p className="text-sm font-semibold text-gray-700">{formatCurrency(baseEndVal)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Scenario at {years}yr</p>
                    <p className="text-sm font-semibold text-primary-600">{formatCurrency(scenEndVal)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Difference</p>
                    <p className={`text-sm font-semibold ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                    </p>
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* Reset */}
      <div className="text-center">
        <button
          onClick={() => { setIncomeAdj({}); setBillAdj({}); setGrowthAdj({}); setExtraPayments({}); setContributions({}); setTempItems([]) }}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Reset all adjustments
        </button>
      </div>
    </div>
  )
}
