import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import { useStore } from '../../store/useStore'
import { projectMortgage, getMonthLabels } from '../../utils/calculations'
import { formatCurrency, toMonthly } from '../../utils/formatters'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const COLORS = ['#e53935', '#ff9800', '#9c27b0', '#f44336']

export default function DebtChart({ months = 48 }) {
  const { state } = useStore()
  const labels = getMonthLabels(months)
  const sparseLabels = labels.map((l, i) => (i % 6 === 0 ? l : ''))

  if (state.liabilities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Debt Reduction</h3>
        <p className="text-gray-400 text-sm">Add liabilities to see payoff projections</p>
      </div>
    )
  }

  const datasets = state.liabilities.map((debt, i) => ({
    label: debt.name,
    data: projectMortgage(debt.balance, debt.interestRate || 0, toMonthly(Number(debt.minPayment) || 0, debt.paymentFrequency || 'monthly'), 0, months),
    borderColor: COLORS[i % COLORS.length],
    backgroundColor: COLORS[i % COLORS.length] + '20',
    fill: true,
    tension: 0.3,
    pointRadius: 0,
  }))

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Debt Reduction</h3>
      <Line
        data={{ labels: sparseLabels, datasets }}
        options={{
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` },
            },
          },
          scales: {
            y: { ticks: { callback: (v) => formatCurrency(v) } },
          },
        }}
      />
    </div>
  )
}
