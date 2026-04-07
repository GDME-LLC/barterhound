export function formatCurrency(cents: number | null | undefined) {
  if (typeof cents !== 'number') {
    return '$0'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`
}
