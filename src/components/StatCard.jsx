export default function StatCard({ label, value, sub, color = 'text-primary-600' }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex-1">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
