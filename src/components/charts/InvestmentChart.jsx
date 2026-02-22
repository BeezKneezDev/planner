import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import { useStore } from '../../store/useStore'
import { projectInvestment, getMonthLabels } from '../../utils/calculations'
import { formatCurrency } from '../../utils/formatters'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const COLORS = ['#1976d2', '#43a047', '#ff9800', '#e53935', '#9c27b0', '#00bcd4']

export default function InvestmentChart({ months = 48 }) {
  const { state } = useStore()
  const labels = getMonthLabels(months)
  const sparseLabels = labels.map((l, i) => (i % 6 === 0 ? l : ''))

  const investmentAssets = state.assets.filter((a) =>
    ['stock', 'crypto', 'kiwisaver'].includes(a.type)
  )

  if (investmentAssets.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Investment Growth</h3>
        <p className="text-gray-400 text-sm">Add investment assets to see projections</p>
      </div>
    )
  }

  const datasets = investmentAssets.map((asset, i) => ({
    label: asset.name,
    data: projectInvestment(asset.value, asset.growthRate || 0, asset.type === 'kiwisaver' ? (Number(asset.kiwiGovt) || 0) / 12 + (Number(asset.kiwiEmployer) || 0) + (Number(asset.kiwiPersonal) || 0) : 0, months),
    borderColor: COLORS[i % COLORS.length],
    tension: 0.3,
    pointRadius: 0,
    fill: false,
  }))

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Investment Growth</h3>
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
