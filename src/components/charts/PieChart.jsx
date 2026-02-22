import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { formatCurrency } from '../../utils/formatters'

ChartJS.register(ArcElement, Tooltip, Legend)

const COLORS = ['#1976d2', '#43a047', '#ff9800', '#e53935', '#9c27b0', '#00bcd4', '#f06292']

export default function PieChart({ title, labels, values }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <Doughnut
        data={{
          labels,
          datasets: [{
            data: values,
            backgroundColor: COLORS.slice(0, labels.length),
            borderWidth: 2,
            borderColor: '#fff',
          }],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw)}`,
              },
            },
          },
        }}
      />
    </div>
  )
}
