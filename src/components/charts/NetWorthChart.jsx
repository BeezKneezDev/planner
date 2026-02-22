import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { useStore } from '../../store/useStore'
import { projectNetWorth, getMonthLabels } from '../../utils/calculations'
import { formatCurrency } from '../../utils/formatters'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function NetWorthChart({ months = 48 }) {
  const { state } = useStore()
  const labels = getMonthLabels(months)
  const data = projectNetWorth(state.assets, state.liabilities, state.income, state.bills, months)

  // Show every 6th label to avoid clutter
  const sparseLabels = labels.map((l, i) => (i % 6 === 0 ? l : ''))

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Net Worth Projection (4 Years)</h3>
      <Line
        data={{
          labels: sparseLabels,
          datasets: [{
            label: 'Net Worth',
            data,
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
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
