import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import type { AuditTrace, AuditTraceStatus } from '@/data/types'
import { getOpsAudit } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import {
  AuditFilterBar,
  EMPTY_FILTER,
  auditQueryParams,
  isFilterActive,
  type AuditFilter,
} from './audit-filter-bar'
import { OpsEmpty, OpsFilterPills, OpsPage, OpsSkeleton } from './ops-page'

type Filter = AuditTraceStatus | 'all'

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'ok', label: 'Thành công' },
  { key: 'cache', label: 'Dùng lại kết quả cũ' },
  { key: 'timeout', label: 'Quá hạn' },
  { key: 'error', label: 'Lỗi' },
]

function statusVariant(status: AuditTraceStatus) {
  if (status === 'ok') return 'success' as const
  if (status === 'cache') return 'info' as const
  return 'danger' as const
}

const GRID = 'grid grid-cols-[150px_1.1fr_1.2fr_1fr_150px_100px] gap-3'

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-card bg-surface p-5 shadow-card">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="text-[28px] font-bold leading-9">{value}</span>
      <span className="text-xs text-muted">{hint}</span>
    </div>
  )
}

/** Ô khách hàng: mã để đối chiếu hồ sơ, tên đã che để đọc cho nhanh. */
function CustomerCell({ trace }: { trace: AuditTrace }) {
  if (trace.customerId === undefined) return <span className="text-muted">—</span>
  return (
    <span className="flex flex-col leading-tight">
      <span className="font-mono text-xs font-semibold">{trace.customerId}</span>
      {trace.customerLabel && <span className="text-xs text-muted">{trace.customerLabel}</span>}
    </span>
  )
}

export function AiAuditLogPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Filter>('all')
  const [filter, setFilter] = useState<AuditFilter>(EMPTY_FILTER)
  // Bộ lọc chạy dưới server: màn hình chỉ giữ 100 lượt gần nhất, lọc trên tập đó
  // sẽ giấu mất lượt gọi cũ hơn của chính khách đang xem.
  const params = auditQueryParams(filter, status)
  const { data: log, isPending } = useQuery({
    queryKey: ['ops-audit', params],
    queryFn: () => getOpsAudit(params),
    // Giữ kết quả cũ trong lúc chờ: đổi bộ lọc mà bảng nháy về khung xương thì
    // chuyên viên mất luôn ngữ cảnh vừa đọc.
    placeholderData: keepPreviousData,
  })

  const traces = log?.traces ?? []
  const filtering = isFilterActive(filter) || status !== 'all'

  function resetFilters() {
    setFilter(EMPTY_FILTER)
    setStatus('all')
  }

  return (
    <OpsPage
      title="Nhật ký quyết định AI"
      subtitle="Mọi lượt gọi mô hình đều được ghi lại — kể cả lượt hỏng phải dùng bản dự phòng"
      toolbar={<OpsFilterPills options={filters} value={status} onChange={setStatus} />}
    >
      {isPending || !log ? (
        <OpsSkeleton rows={5} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatTile
              label="Tổng lượt gọi"
              value={log.totalCalls.toLocaleString('vi-VN')}
              hint="Toàn bộ nhật ký, không đổi theo bộ lọc"
            />
            <StatTile
              label="Tỷ lệ dùng bản dự phòng"
              value={`${log.fallbackRatePct}%`}
              hint="Lượt quá hạn hoặc lỗi trên toàn bộ nhật ký"
            />
            <StatTile
              label="Độ trễ trung bình"
              value={`${log.avgLatencyMs.toLocaleString('vi-VN')} ms`}
              hint="Bình quân theo số lượt đã đo được thời gian"
            />
          </div>

          {log.perAgent.length > 0 && (
            <div className="flex flex-col gap-2.5 rounded-card bg-surface p-5 shadow-card">
              <span className="text-[15px] font-semibold">Theo từng trợ lý</span>
              {log.perAgent.map((a) => (
                <span key={a.agentLabel} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="font-medium">{a.agentLabel}</span>
                  <span className="text-muted">
                    {a.calls.toLocaleString('vi-VN')} lượt · {a.fallbackCalls} lượt dự phòng ·{' '}
                    {a.avgLatencyMs.toLocaleString('vi-VN')} ms
                  </span>
                </span>
              ))}
            </div>
          )}

          {traces.length === 0 && !filtering ? (
            <OpsEmpty
              title="Chưa có lượt gọi nào"
              hint="Nhật ký ghi lại mọi lượt trợ lý trả lời khách hoặc giải thích rủi ro. Chạy thử một luồng chuyển tiền để sinh bản ghi đầu tiên."
            />
          ) : (
            <div className="flex flex-col rounded-card bg-surface shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
                <span className="text-[15px] font-semibold">Lượt gọi gần nhất</span>
                <AuditFilterBar
                  customers={log.customers}
                  agents={log.perAgent}
                  latestTraceAt={log.latestTraceAt}
                  value={filter}
                  onChange={setFilter}
                  statusActive={status !== 'all'}
                  onReset={resetFilters}
                />
              </div>

              {traces.length === 0 ? (
                <div className="border-t border-line px-5">
                  <OpsEmpty
                    title="Không có lượt gọi nào khớp bộ lọc"
                    hint="Thử nới khoảng thời gian, chọn lại khách hàng hoặc trợ lý khác. Nhật ký vẫn còn các lượt gọi khác ngoài bộ lọc hiện tại."
                    actionLabel="Xoá bộ lọc"
                    onAction={resetFilters}
                  />
                </div>
              ) : (
                <>
                  <div className={`${GRID} border-y border-line bg-[color:var(--msb-bg)] px-5 py-2 text-[11px] font-semibold uppercase tracking-[.06em] text-muted`}>
                    <span>Thời gian</span>
                    <span>Khách hàng</span>
                    <span>Trợ lý</span>
                    <span>Mô hình</span>
                    <span>Kết quả</span>
                    <span className="text-right">Độ trễ</span>
                  </div>
                  {traces.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      // Chỉ lượt gắn với một quyết định mới mở được case tương ứng.
                      disabled={!t.decisionId}
                      onClick={() => t.decisionId && navigate(`/ops/alerts/${t.decisionId}`)}
                      className={`${GRID} items-center border-b border-divider px-5 py-2.5 text-left text-[13px] last:border-0 ${
                        t.decisionId ? 'cursor-pointer hover:bg-app' : 'cursor-default'
                      }`}
                    >
                      <span className="text-muted">{formatDateTime(t.time)}</span>
                      <CustomerCell trace={t} />
                      <span className="font-medium">{t.agentLabel}</span>
                      <span className="font-mono text-xs text-muted">{t.model}</span>
                      <span>
                        <Badge variant={statusVariant(t.status)}>{t.statusLabel}</Badge>
                      </span>
                      <span className="text-right font-semibold">
                        {t.latencyMs === undefined ? '—' : `${t.latencyMs.toLocaleString('vi-VN')} ms`}
                      </span>
                    </button>
                  ))}
                  <div className="px-5 py-3 text-xs text-muted">
                    {filtering
                      ? `Đang xem ${traces.length} lượt gọi khớp bộ lọc, trên tổng ${log.totalCalls.toLocaleString('vi-VN')} lượt của nhật ký`
                      : `Đang xem ${traces.length} lượt gọi gần nhất`}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </OpsPage>
  )
}
