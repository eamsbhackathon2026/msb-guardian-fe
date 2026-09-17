import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import type { OpsCase, OpsCaseStatus } from '@/data/types'
import { getOpsCases } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { OpsEmpty, OpsFilterPills, OpsPage, OpsSkeleton } from './ops-page'

type Filter = OpsCaseStatus | 'all'

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'open', label: 'Đang mở' },
  { key: 'callbackDone', label: 'Đã gọi lại khách' },
  { key: 'closedFraud', label: 'Xác nhận lừa đảo' },
  { key: 'closedLegit', label: 'Giao dịch hợp lệ' },
]

/** Case đã đóng thì không cần màu cảnh báo nữa — chỉ case đang mở mới cần bắt mắt. */
function statusVariant(status: OpsCaseStatus) {
  if (status === 'open') return 'danger' as const
  if (status === 'callbackDone') return 'warning' as const
  if (status === 'closedFraud') return 'neutral' as const
  return 'success' as const
}

const GRID = 'grid grid-cols-[150px_1.1fr_1fr_1.6fr_150px_170px] gap-3'

export function CaseListPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  // Tải một lần rồi lọc tại chỗ: danh sách case của một ngày rất ngắn, và đổi
  // bộ lọc thì thấy kết quả ngay thay vì chờ một vòng mạng nữa.
  const { data: cases, isPending } = useQuery({ queryKey: ['ops-cases'], queryFn: () => getOpsCases() })

  const rows: OpsCase[] = useMemo(
    () => (cases ?? []).filter((c) => filter === 'all' || c.status === filter),
    [cases, filter],
  )

  return (
    <OpsPage
      title="Case vận hành"
      subtitle="Case mở khi chuyên viên tạm giữ lệnh hoặc liên hệ khách hàng"
      toolbar={<OpsFilterPills options={filters} value={filter} onChange={setFilter} />}
    >
      {isPending ? (
        <OpsSkeleton />
      ) : rows.length === 0 ? (
        <OpsEmpty
          title="Chưa có case nào ở trạng thái này"
          hint="Case tự mở khi chuyên viên tạm giữ lệnh hoặc gọi lại khách từ màn cảnh báo. Mở một cảnh báo ở Tổng quan để bắt đầu."
        />
      ) : (
        <div className="flex flex-col rounded-card bg-surface shadow-card">
          <div className={`${GRID} border-b border-line bg-[color:var(--msb-bg)] px-5 py-2 text-[11px] font-semibold uppercase tracking-[.06em] text-muted`}>
            <span>Mã case</span>
            <span>Khách hàng</span>
            <span>Kịch bản</span>
            <span>Diễn giải</span>
            <span>Mở lúc</span>
            <span>Trạng thái</span>
          </div>
          {rows.map((c) => (
            <button
              key={c.id}
              type="button"
              // Case và quyết định là 1-1, nên bấm vào case là mở đúng màn xử lý.
              onClick={() => navigate(`/ops/alerts/${c.decisionId}`)}
              className={`${GRID} cursor-pointer items-center border-b border-divider px-5 py-2.5 text-left text-[13px] last:border-0 hover:bg-app`}
            >
              <span className="font-mono text-xs font-semibold">{c.id}</span>
              <span className="font-semibold">{c.customer}</span>
              <span>{c.scenarioName}</span>
              <span className="truncate text-muted" title={c.narrative}>{c.narrative}</span>
              <span className="text-muted">{formatDateTime(c.openedAt)}</span>
              <span>
                <Badge variant={statusVariant(c.status)}>{c.statusLabel}</Badge>
              </span>
            </button>
          ))}
          <div className="px-5 py-3 text-xs text-muted">Đang xem {rows.length} case</div>
        </div>
      )}
    </OpsPage>
  )
}
