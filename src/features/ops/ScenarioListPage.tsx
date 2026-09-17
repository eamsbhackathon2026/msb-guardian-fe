import { useQuery } from '@tanstack/react-query'
import { MessageCircleOff, MessagesSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getOpsScenarios } from '@/lib/api'
import { OpsEmpty, OpsPage, OpsSkeleton } from './ops-page'

export function ScenarioListPage() {
  const { data: scenarios, isPending } = useQuery({ queryKey: ['ops-scenarios'], queryFn: getOpsScenarios })
  const rows = scenarios ?? []
  const total = rows.reduce((sum, s) => sum + s.alertsToday, 0)

  return (
    <OpsPage
      title="Kịch bản lừa đảo"
      subtitle={`Playbook đang áp dụng · ${rows.length} kịch bản · ${total} cảnh báo hôm nay`}
    >
      {isPending ? (
        <OpsSkeleton rows={3} />
      ) : rows.length === 0 ? (
        <OpsEmpty
          title="Chưa nạp được playbook"
          hint="Playbook do đội nghiệp vụ soạn và nạp vào hệ thống. Nếu màn này trống, kịch bản chưa được nạp hoặc dịch vụ tri thức đang tạm dừng."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {rows.map((s) => (
            <div key={s.id} className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[15px] font-semibold leading-5">{s.name}</span>
                  <span className="text-xs text-muted">{s.groupLabel} · {s.patternLabel}</span>
                </div>
                <Badge variant={s.alertsToday > 0 ? 'danger' : 'neutral'} size="md">
                  {s.alertsToday} hôm nay
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="soft">{s.actionLabel}</Badge>
                {s.canAsk ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-muted">
                    <MessagesSquare size={13} strokeWidth={1.7} />
                    Được hỏi khách
                  </span>
                ) : (
                  // agent_can_ask = 'N': kẻ gian đang nhìn thấy màn hình khách.
                  <span className="flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-1 text-[11px] font-semibold text-danger-deep">
                    <MessageCircleOff size={13} strokeWidth={1.8} />
                    Không hỏi khách
                  </span>
                )}
              </div>

              <div className="border-t border-divider pt-3">
                <span className="block text-[13px] font-semibold">{s.adviceTitle}</span>
                <span className="mt-1 block text-[13px] leading-5 text-muted">{s.adviceBody}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </OpsPage>
  )
}
