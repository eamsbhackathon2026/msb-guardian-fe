const vndFormatter = new Intl.NumberFormat('vi-VN')

/** 12500000 -> "12.500.000 ₫" */
export function formatVnd(amount: number): string {
  return `${vndFormatter.format(Math.abs(amount))} ₫`
}

/** Có dấu +/- cho danh sách giao dịch: -128.000 ₫ / +28.500.000 ₫ */
/** formatVnd dùng Math.abs nên số âm hiện y như số dương — "dư -4,6 triệu"
 *  thành "dư 4,6 triệu", đọc ngược hẳn ý nghĩa. Dùng hàm này cho mọi chỗ giá
 *  trị có thể âm (tiền dư = thu - chi). */
export function formatVndWithSign(amount: number): string {
  return `${amount < 0 ? '−' : ''}${formatVnd(amount)}`
}
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

/** Lời chào theo giờ thiết bị: sáng 5–11h, trưa 11–14h, chiều 14–18h, tối 18–22h, còn lại chúc ngủ ngon */
export function timeGreeting(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return 'Chào buổi sáng'
  if (h >= 11 && h < 14) return 'Chào buổi trưa'
  if (h >= 14 && h < 18) return 'Chào buổi chiều'
  if (h >= 18 && h < 22) return 'Chào buổi tối'
  return 'Chúc ngủ ngon'
}

/** Tên khách hàng phải hiện đầy đủ, không che. BE có nơi trả tên đã che
 *  (dạng "Nguyễn V** A**") hoặc chưa kịp tải — khi đó dùng tên demo đầy đủ. */
export function fullCustomerName(name?: string | null): string {
  if (!name || /[*•]/.test(name)) return 'Nguyễn Việt Anh'
  return name
}

/** BE chỉ trả số tài khoản đã che ("**** 4821"). Màn demo cần hiện số đầy đủ
 *  nên ghép đầu số tài khoản demo cố định với 4 số cuối thật từ BE. */
export function fullAccountNumber(masked?: string): string {
  // BE chưa trả dữ liệu (đang tải / offline) vẫn hiện số demo để màn hình không trống.
  if (!masked) return '6803 6886 4821'
  const last4 = masked.replace(/\D/g, '').slice(-4)
  return last4 ? `6803 6886 ${last4}` : masked
}

/** 34 -> "+34%" · -8 -> "-8%" */
export function formatPct(pct: number, signed = true): string {
  const sign = signed && pct > 0 ? '+' : ''
  return `${sign}${vndFormatter.format(pct)}%`
}
