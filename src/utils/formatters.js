export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyDecimal(amount) {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPercent(value) {
  return `${value.toFixed(1)}%`
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'short',
  })
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function toMonthly(amount, frequency) {
  switch (frequency) {
    case 'weekly': return amount * 52 / 12
    case 'fortnightly': return amount * 26 / 12
    case 'monthly': return amount
    case 'quarterly': return amount / 3
    case 'yearly': return amount / 12
    default: return amount
  }
}
