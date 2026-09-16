const vndFormatter = new Intl.NumberFormat('vi-VN')

/** 12500000 -> "12.500.000 ₫" */
export function formatVnd(amount: number): string {
  return `${vndFormatter.format(Math.abs(amount))} ₫`
}

/** Có dấu +/- cho danh sách giao dịch: -128.000 ₫ / +28.500.000 ₫ */
export function formatVndSigned(amount: number, direction: 'in' | 'out'): string {
  return `${direction === 'in' ? '+' : '-'}${formatVnd(amount)}`
}

/** 8400000000 -> "8,4 tỷ ₫" — dùng cho KPI ops */
export function formatVndCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    const ty = amount / 1_000_000_000
    return `${vndFormatter.format(Math.round(ty * 10) / 10)} tỷ ₫`
  }
  if (amount >= 1_000_000) {
    const tr = amount / 1_000_000
    return `${vndFormatter.format(Math.round(tr * 10) / 10)} tr ₫`
  }
  return formatVnd(amount)
}

/** ISO -> "15/09/2026" */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** ISO -> "09:41 · 15/09/2026" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${formatTime(iso)} · ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
}

/** ISO -> "09:41" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** 34 -> "+34%" · -8 -> "-8%" */
export function formatPct(pct: number, signed = true): string {
  const sign = signed && pct > 0 ? '+' : ''
  return `${sign}${vndFormatter.format(pct)}%`
}
