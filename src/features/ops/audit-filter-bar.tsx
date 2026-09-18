import type { AuditAgentStat, AuditCustomer } from '@/data/types'

/**
 * Bộ lọc của Nhật ký quyết định AI.
 *
 * Bộ lọc chạy dưới server, không cắt trên tập đã tải: màn hình chỉ giữ 100 lượt
 * gần nhất, lọc trên đó thì một khách có lượt gọi cũ hơn sẽ biến mất khỏi kết
 * quả mà không ai biết. Ô chọn khách và mốc neo của các khoảng nhanh lấy từ
 * facet của toàn bộ nhật ký nên không co lại theo chính bộ lọc.
 */
export interface AuditFilter {
  /** Mã khách hàng dạng chuỗi; rỗng nghĩa là mọi khách. */
  customerId: string
  /** Nhãn trợ lý; rỗng nghĩa là mọi trợ lý. */
  agent: string
  /** YYYY-MM-DD theo giờ người xem, tính cả hai đầu mút; rỗng là không chặn. */
  from: string
  to: string
}

export const EMPTY_FILTER: AuditFilter = { customerId: '', agent: '', from: '', to: '' }

export function isFilterActive(f: AuditFilter): boolean {
  return Boolean(f.customerId || f.agent || f.from || f.to)
}

/** YYYY-MM-DD (giờ người xem) -> mốc tuyệt đối đầu ngày hôm đó. */
function dayStart(day: string, plusDays = 0): string {
  const d = new Date(`${day}T00:00:00`)
  d.setDate(d.getDate() + plusDays)
  return d.toISOString()
}

/** Mốc tuyệt đối -> YYYY-MM-DD theo giờ người xem. */
export function localDay(instant: string): string {
  const d = new Date(instant)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Tham số gửi xuống gateway.
 *
 * Ngày người dùng chọn là ngày theo giờ của họ, còn `created_at` dưới database
 * là TIMESTAMPTZ: quy đổi sang mốc tuyệt đối ngay tại đây, khoảng nửa mở
 * [since, until) với `until` là đầu ngày kế tiếp, để ngày cuối vẫn được tính đủ
 * mà một lượt gọi không rơi vào hai khoảng liền nhau.
 */
export function auditQueryParams(f: AuditFilter, status: string) {
  return {
    status: status === 'all' ? undefined : status,
    customer_id: f.customerId || undefined,
    agent: f.agent || undefined,
    since: f.from ? dayStart(f.from) : undefined,
    until: f.to ? dayStart(f.to, 1) : undefined,
  }
}

function shiftDays(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00`)
  d.setDate(d.getDate() + delta)
  return localDay(d.toISOString())
}

/**
 * Khoảng nhanh neo vào lượt gọi mới nhất của TOÀN BỘ nhật ký, không neo vào
 * đồng hồ máy: nhật ký demo dừng ở một ngày trong quá khứ, tính "7 ngày qua"
 * theo hôm nay sẽ cho bảng trắng và người xem tưởng bộ lọc hỏng.
 */
export function presetRange(latestTraceAt: string | undefined, days: number): { from: string; to: string } {
  if (!latestTraceAt) return { from: '', to: '' }
  const newest = localDay(latestTraceAt)
  return { from: shiftDays(newest, -(days - 1)), to: newest }
}

const CONTROL = 'h-9 rounded-[10px] border border-line bg-surface px-2.5 text-[13px] outline-none focus:border-primary'

const PRESETS: { label: string; days: number | null }[] = [
  // Nhãn nói rõ "khung thời gian" chứ không chỉ "Tất cả": trên cùng màn đã có
  // pill trạng thái "Tất cả", hai chữ giống nhau cạnh nhau gây bấm nhầm.
  { label: 'Tất cả khung thời gian', days: null },
  { label: '7 ngày', days: 7 },
  { label: '30 ngày', days: 30 },
]

export function AuditFilterBar({
  customers,
  agents,
  latestTraceAt,
  value,
  onChange,
  // Pill Kết quả nằm ngoài thanh này nhưng cùng là một bộ lọc dưới mắt người
  // dùng, nên nút xoá phải biết nó đang bật và xoá luôn cả nó.
  statusActive,
  onReset,
}: {
  customers: AuditCustomer[]
  agents: AuditAgentStat[]
  latestTraceAt?: string
  value: AuditFilter
  onChange: (next: AuditFilter) => void
  statusActive: boolean
  onReset: () => void
}) {
  const active = isFilterActive(value) || statusActive

  function applyPreset(days: number | null) {
    onChange({ ...value, ...(days === null ? { from: '', to: '' } : presetRange(latestTraceAt, days)) })
  }

  function presetActive(days: number | null): boolean {
    if (days === null) return !value.from && !value.to
    const r = presetRange(latestTraceAt, days)
    return value.from === r.from && value.to === r.to
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={value.from}
          max={value.to || undefined}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className={CONTROL}
          aria-label="Từ ngày"
        />
        <span className="text-[13px] text-muted">→</span>
        <input
          type="date"
          value={value.to}
          min={value.from || undefined}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className={CONTROL}
          aria-label="Đến ngày"
        />
      </div>

      <div className="flex items-center gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.days)}
            className={
              presetActive(p.days)
                ? 'cursor-pointer rounded-full bg-orange-soft px-3 py-1.5 text-xs font-semibold text-primary-pressed'
                : 'cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-muted hover:bg-app'
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      <select
        value={value.customerId}
        onChange={(e) => onChange({ ...value, customerId: e.target.value })}
        className={`${CONTROL} max-w-[240px]`}
        aria-label="Lọc theo khách hàng"
      >
        <option value="">Mọi khách hàng</option>
        {customers.map((c) => (
          <option key={c.id} value={String(c.id)}>
            {c.label ? `${c.id} · ${c.label}` : String(c.id)} ({c.calls})
          </option>
        ))}
      </select>

      <select
        value={value.agent}
        onChange={(e) => onChange({ ...value, agent: e.target.value })}
        className={`${CONTROL} max-w-[240px]`}
        aria-label="Lọc theo trợ lý"
      >
        <option value="">Mọi trợ lý</option>
        {agents.map((a) => (
          <option key={a.agentKey} value={a.agentKey}>{a.agentLabel}</option>
        ))}
      </select>

      {active && (
        <button
          type="button"
          onClick={onReset}
          className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold text-primary hover:bg-app"
        >
          Xoá bộ lọc
        </button>
      )}
    </div>
  )
}
