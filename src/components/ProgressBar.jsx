export default function ProgressBar({ current, target, color = 'bg-primary-500' }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
  return (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
