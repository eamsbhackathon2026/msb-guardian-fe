import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import type { AuditTraceStatus } from '@/data/types'
import { getOpsAudit } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
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

const GRID = 'grid grid-cols-[160px_1.4fr_1.1fr_180px_110px] gap-3'

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-card bg-surface p-5 shadow-card">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="text-[28px] font-bold leading-9">{value}</span>
      <span className="text-xs text-muted">{hint}</span>
    </div>
  )
}

export function AiAuditLogPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const { data: log, isPending } = useQuery({
    queryKey: ['ops-audit', filter],
    queryFn: () => getOpsAudit({ status: filter === 'all' ? undefined : filter }),
  })

  const traces = log?.traces ?? []

  return (
    <OpsPage
      title="Nhật ký quyết định AI"
      subtitle="Mọi lượt gọi mô hình đều được ghi lại — kể cả lượt hỏng phải dùng bản dự phòng"
      toolbar={<OpsFilterPills options={filters} value={filter} onChange={setFilter} />}
    >
      {isPending || !log ? (
        <OpsSkeleton rows={5} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatTile
              label="Tổng lượt gọi"
              value={log.totalCalls.toLocaleString('vi-VN')}
              hint="Toàn bộ nhật ký, không theo bộ lọc bên trên"
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

          {traces.length === 0 ? (
            <OpsEmpty
              title="Chưa có lượt gọi nào ở trạng thái này"
              hint="Nhật ký ghi lại mọi lượt trợ lý trả lời khách hoặc giải thích rủi ro. Chạy thử một luồng chuyển tiền để sinh bản ghi đầu tiên."
            />
          ) : (
            <div className="flex flex-col rounded-card bg-surface shadow-card">
              <div className={`${GRID} border-b border-line bg-[color:var(--msb-bg)] px-5 py-2 text-[11px] font-semibold uppercase tracking-[.06em] text-muted`}>
                <span>Thời gian</span>
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
              <div className="px-5 py-3 text-xs text-muted">Đang xem {traces.length} lượt gọi gần nhất</div>
            </div>
          )}
        </>
      )}
    </OpsPage>
  )
}
