import { toMonthly } from './formatters'

export function calcNetWorth(assets, liabilities) {
  const totalAssets = assets.reduce((sum, a) => sum + Number(a.value), 0)
  const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.balance), 0)
  return totalAssets - totalLiabilities
}

export function calcTotalAssets(assets) {
  return assets.reduce((sum, a) => sum + Number(a.value), 0)
}

export function calcTotalLiabilities(liabilities) {
  return liabilities.reduce((sum, l) => sum + Number(l.balance), 0)
}

export function calcMonthlyIncome(incomes) {
  return incomes.reduce((sum, i) => sum + toMonthly(Number(i.amount), i.frequency), 0)
}

export function calcMonthlyExpenses(bills) {
  return bills.reduce((sum, b) => sum + toMonthly(Number(b.amount), b.frequency), 0)
}

export function calcMonthlyDebtPayments(liabilities) {
  return liabilities.reduce((sum, l) => sum + toMonthly(Number(l.minPayment) || 0, l.paymentFrequency || 'monthly'), 0)
}

export function calcMonthlyCashFlow(incomes, bills) {
  return calcMonthlyIncome(incomes) - calcMonthlyExpenses(bills)
}

export function calcMonthlySurplus(state) {
  return calcMonthlyIncome(state.income) - calcMonthlyExpenses(state.bills) - calcMonthlyDebtPayments(state.liabilities) - calcMonthlyGoalExpenses(state.goals)
}

export function calcSavingsRate(incomes, bills) {
  const income = calcMonthlyIncome(incomes)
  if (income === 0) return 0
  const cashFlow = calcMonthlyCashFlow(incomes, bills)
  return (cashFlow / income) * 100
}

// contributions: optional { [assetId]: monthlyAmount } for scenario projections
// extraDebtPayments: optional { [liabilityId]: extraMonthly } for scenario projections
// lumpSums: optional [{ month, amount, targetType: 'cash'|'debt'|'asset', targetId }]
export function projectNetWorth(assets, liabilities, incomes, bills, months, contributions = {}, extraDebtPayments = {}, lumpSums = []) {
  const monthlyCashFlow = calcMonthlyCashFlow(incomes, bills)
  const points = []
  let cash = 0

  // Track each asset's running value (for contributions + compounding)
  const assetValues = assets.map((a) => ({
    id: a.id,
    value: Number(a.value),
    monthlyGrowth: (Number(a.growthRate) || 0) / 100 / 12,
    monthlyContribution: (Number(contributions[a.id]) || 0) + (a.type === 'kiwisaver' ? (Number(a.kiwiGovt) || 0) / 12 + (Number(a.kiwiEmployer) || 0) + (Number(a.kiwiPersonal) || 0) : 0),
  }))

  // Track each liability's running balance (convert payment to monthly)
  const liabilityValues = liabilities.map((l) => ({
    id: l.id,
    balance: Number(l.balance),
    monthlyRate: (Number(l.interestRate) || 0) / 100 / 12,
    payment: toMonthly(Number(l.minPayment) || 0, l.paymentFrequency || 'monthly'),
    extraPayment: Number(extraDebtPayments[l.id]) || 0,
  }))

  for (let m = 0; m <= months; m++) {
    // Apply lump sums at start of this month
    for (const ls of lumpSums) {
      if (ls.month === m) {
        if (ls.targetType === 'cash') {
          cash += ls.amount
        } else if (ls.targetType === 'debt') {
          const l = liabilityValues.find((v) => v.id === ls.targetId)
          if (l) l.balance = Math.max(0, l.balance - ls.amount)
        } else if (ls.targetType === 'asset') {
          const a = assetValues.find((v) => v.id === ls.targetId)
          if (a) a.value += ls.amount
        }
      }
    }

    const totalAssets = assetValues.reduce((sum, a) => sum + a.value, 0)
    const totalLiabilities = liabilityValues.reduce((sum, l) => sum + l.balance, 0)
    points.push(totalAssets + Math.max(0, cash) - totalLiabilities)

    // Deduct debt payments and investment contributions from cash
    const debtPayments = liabilityValues.reduce((sum, l) =>
      sum + (l.balance > 0 ? l.payment + l.extraPayment : 0), 0)
    const investContributions = assetValues.reduce((sum, a) => sum + a.monthlyContribution, 0)
    cash += monthlyCashFlow - debtPayments - investContributions

    // Advance one month
    for (const a of assetValues) {
      a.value = a.value * (1 + a.monthlyGrowth) + a.monthlyContribution
    }
    for (const l of liabilityValues) {
      if (l.balance > 0) {
        l.balance = l.balance * (1 + l.monthlyRate) - l.payment - l.extraPayment
        if (l.balance < 0) l.balance = 0
      }
    }
  }
  return points
}

export function projectMortgage(balance, annualRate, monthlyPayment, extraPayment, months, lumpSums = []) {
  const monthlyRate = annualRate / 100 / 12
  const points = []
  let remaining = Number(balance)

  for (let m = 0; m <= months; m++) {
    // Apply lump sum payments at start of this month
    for (const ls of lumpSums) {
      if (ls.month === m) remaining = Math.max(0, remaining - ls.amount)
    }
    points.push(Math.max(0, remaining))
    const interest = remaining * monthlyRate
    remaining = remaining + interest - monthlyPayment - extraPayment
    if (remaining < 0) remaining = 0
  }
  return points
}

export function projectInvestment(value, annualGrowthRate, monthlyAdd, months) {
  const monthlyRate = annualGrowthRate / 100 / 12
  const points = []
  let current = Number(value)

  for (let m = 0; m <= months; m++) {
    points.push(current)
    current = current * (1 + monthlyRate) + monthlyAdd
  }
  return points
}

export function calcMonthlyGoalExpenses(goals) {
  return goals.filter((g) => g.isExpense).reduce((sum, g) => sum + getGoalMonthlyExpense(g), 0)
}

export function getGoalMonthlyExpense(goal) {
  if (Number(goal.monthlyContribution) > 0) return Number(goal.monthlyContribution)
  if (goal.deadline) {
    const remaining = Number(goal.targetAmount) - Number(goal.currentAmount)
    if (remaining <= 0) return 0
    const now = new Date()
    const deadlineDate = new Date(goal.deadline + '-01')
    const monthsLeft = (deadlineDate.getFullYear() - now.getFullYear()) * 12 + (deadlineDate.getMonth() - now.getMonth())
    if (monthsLeft <= 0) return remaining
    return Math.round(remaining / monthsLeft)
  }
  return 0
}

export function getMonthLabels(months) {
  const labels = []
  const now = new Date()
  for (let m = 0; m <= months; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1)
    labels.push(d.toLocaleDateString('en-NZ', { year: '2-digit', month: 'short' }))
  }
  return labels
}

export function getYearLabels(years) {
  const labels = []
  const now = new Date()
  for (let y = 0; y <= years; y++) {
    labels.push((now.getFullYear() + y).toString())
  }
  return labels
}
