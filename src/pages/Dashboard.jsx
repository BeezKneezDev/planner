import { useStore } from '../store/useStore'
import { calcNetWorth, calcMonthlyCashFlow, calcMonthlyIncome, calcMonthlyDebtPayments, calcMonthlyGoalExpenses } from '../utils/calculations'
import { formatCurrency, formatPercent } from '../utils/formatters'
import StatCard from '../components/StatCard'
import ProgressBar from '../components/ProgressBar'
import NetWorthChart from '../components/charts/NetWorthChart'
import CashFlowChart from '../components/charts/CashFlowChart'
import InvestmentChart from '../components/charts/InvestmentChart'
import DebtChart from '../components/charts/DebtChart'

export default function Dashboard() {
  const { state } = useStore()
  const netWorth = calcNetWorth(state.assets, state.liabilities)
  const debtPayments = calcMonthlyDebtPayments(state.liabilities)
  const goalExpenses = calcMonthlyGoalExpenses(state.goals)
  const cashFlow = calcMonthlyCashFlow(state.income, state.bills) - debtPayments - goalExpenses
  const monthlyIncome = calcMonthlyIncome(state.income)
  const savingsRate = monthlyIncome > 0 ? (cashFlow / monthlyIncome) * 100 : 0

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      <div className="flex gap-4 flex-wrap">
        <StatCard label="Net Worth" value={formatCurrency(netWorth)} />
        <StatCard
          label="Monthly Cash Flow"
          value={formatCurrency(cashFlow)}
          color={cashFlow >= 0 ? 'text-green-600' : 'text-red-500'}
        />
        <StatCard
          label="Savings Rate"
          value={formatPercent(savingsRate)}
          color={savingsRate >= 0 ? 'text-primary-600' : 'text-red-500'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NetWorthChart />
        <CashFlowChart />
        <InvestmentChart />
        <DebtChart />
      </div>

      {state.goals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Goal Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.goals.map((goal) => {
              const pct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0
              return (
                <div key={goal.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-800">{goal.name}</h4>
                    <span className="text-xs text-gray-400">{pct}%</span>
                  </div>
                  <ProgressBar current={goal.currentAmount} target={goal.targetAmount} />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{formatCurrency(goal.currentAmount)}</span>
                    <span>{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {state.income.length === 0 && state.assets.length === 0 && (
        <div className="bg-primary-50 rounded-xl p-6 text-center">
          <p className="text-primary-700 font-medium">Get started by adding your income, bills, assets, and goals using the sidebar.</p>
        </div>
      )}
    </div>
  )
}
