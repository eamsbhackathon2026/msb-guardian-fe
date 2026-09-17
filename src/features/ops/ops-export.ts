import type { ScamAlert } from '@/data/types'
import { formatDateTime } from '@/lib/format'

/**
 * Xuất danh sách cảnh báo ra CSV, dựng ngay trên trình duyệt.
 *
 * Không cần endpoint riêng: dữ liệu đã nằm sẵn trong bộ nhớ của màn hình, và
 * chuyên viên muốn đúng những dòng họ đang nhìn — tức là đã qua bộ lọc và ô tìm
 * kiếm — chứ không phải toàn bộ danh sách.
 */
const HEADERS = ['Thời gian', 'Mã cảnh báo', 'Khách hàng', 'Số tiền (VND)', 'Risk Score', 'Kịch bản', 'Trạng thái']

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  investigating: 'Đang điều tra',
  confirmed: 'Xác nhận lừa đảo',
  dismissed: 'Bỏ qua',
}

/** Dấu phẩy, nháy kép và xuống dòng đều phải bọc nháy, nếu không cột sẽ lệch.
 *  Ô mở đầu bằng = + - @ được chèn thêm dấu nháy đơn: Excel coi những ký tự đó
 *  là công thức, nên một cái tên bắt đầu bằng "=" có thể chạy như lệnh khi mở
 *  file. */
function cell(value: string | number): string {
  const text = String(value)
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function alertsToCsv(alerts: ScamAlert[]): string {
  const rows = alerts.map((a) => [
    formatDateTime(a.timestamp),
    a.id,
    a.customer,
    a.amount,
    a.assessment.score,
    a.assessment.scenarioName,
    STATUS_LABELS[a.status] ?? a.status,
  ])
  // Excel trên Windows đọc CSV theo dấu chấm phẩy ở locale Việt Nam; dùng dấu
  // phẩy thì cả dòng dồn vào một ô.
  return [HEADERS, ...rows].map((r) => r.map(cell).join(';')).join('\r\n')
}

export function csvFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `canh-bao-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.csv`
}

export function downloadAlertsCsv(alerts: ScamAlert[]): void {
  // BOM ﻿: thiếu nó thì Excel đọc UTF-8 thành ký tự rác, tên khách hàng
  // tiếng Việt vỡ hết dấu.
  const blob = new Blob(['﻿', alertsToCsv(alerts)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = csvFileName()
  // Firefox chỉ tải khi thẻ nằm trong DOM, và thu hồi URL ngay trong cùng nhịp
  // có thể huỷ luôn lần tải vừa bắt đầu.
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
