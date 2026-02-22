import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { useStore } from '../../store/useStore'
import { calcMonthlyIncome, calcMonthlyExpenses, calcMonthlyDebtPayments, calcMonthlyGoalExpenses } from '../../utils/calculations'
import { formatCurrency } from '../../utils/formatters'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function CashFlowChart() {
  const { state } = useStore()
  const income = calcMonthlyIncome(state.income)
  const billExpenses = calcMonthlyExpenses(state.bills)
  const debtPayments = calcMonthlyDebtPayments(state.liabilities)
  const goalExpenses = calcMonthlyGoalExpenses(state.goals)
  const expenses = billExpenses + debtPayments + goalExpenses
  const surplus = income - expenses

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Cash Flow</h3>
      <Bar
        data={{
          labels: ['Income', 'Expenses', 'Surplus'],
          datasets: [{
            data: [income, expenses, surplus],
            backgroundColor: ['#43a047', '#e53935', surplus >= 0 ? '#1976d2' : '#ff9800'],
            borderRadius: 6,
          }],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => formatCurrency(ctx.raw),
              },
            },
          },
          scales: {
            y: {
              ticks: { callback: (v) => formatCurrency(v) },
            },
          },
        }}
      />
    </div>
  )
}
