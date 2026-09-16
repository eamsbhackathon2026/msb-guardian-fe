import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useQuery } from '@tanstack/react-query'
// MOCK CŨ: import { demoSafetyCenter } from '@/data/demo-scenarios'
import type { SafetyHistoryItem } from '@/data/types'
import { getSafetyCenter, patchProtection } from '@/lib/api'
import { formatDate, formatVnd } from '@/lib/format'
import { useGuardianStore } from '@/lib/store'
import { BottomNav } from '@/shell/BottomNav'
import { MobileFrame, usePhoneContainer } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

const historyStatusMeta: Record<SafetyHistoryItem['status'], { label: string; variant: 'danger' | 'neutral' | 'warning' }> = {
  blocked: { label: 'Đã chặn', variant: 'danger' },
  ignored: { label: 'Đã bỏ qua', variant: 'neutral' },
  processing: { label: 'Đang xử lý', variant: 'warning' },
}

const RING = 2 * Math.PI * 33

function SafetyScoreRing({ score }: { score: number }) {
  return (
    <div className="relative h-[84px] w-[84px] flex-none">
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r="33" fill="none" stroke="var(--msb-divider)" strokeWidth="8" />
        <motion.circle
          cx="42"
          cy="42"
          r="33"
          fill="none"
          stroke="var(--msb-primary)"
          strokeWidth="8"
          strokeLinecap="round"
          transform="rotate(-90 42 42)"
          strokeDasharray={RING}
          initial={{ strokeDashoffset: RING }}
          animate={{ strokeDashoffset: RING * (1 - score / 100) }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[28px] font-bold text-primary">{score}</span>
    </div>
  )
}

export function SafetyCenterPage() {
  return (
    <MobileFrame>
      <SafetyCenterInner />
    </MobileFrame>
  )
}

function SafetyCenterInner() {
  const container = usePhoneContainer()
  const { protections, toggleProtection, hydrateProtections } = useGuardianStore()

  /**
   * Bật/tắt lớp bảo vệ: đổi trạng thái tại chỗ cho công tắc phản hồi ngay, rồi
   * ghi xuống gateway. Lỗi mạng thì trả công tắc về vị trí cũ thay vì để giao
   * diện nói một đằng còn backend lưu một nẻo.
   */
  async function onToggleProtection(key: string, next: boolean) {
    toggleProtection(key)
    try {
      await patchProtection(key, next)
    } catch {
      toggleProtection(key)
    }
  }
  const [selected, setSelected] = useState<SafetyHistoryItem | null>(null)
  const { data } = useQuery({ queryKey: ['safety-center'], queryFn: getSafetyCenter })

  // Store giữ trạng thái bật/tắt trong phiên; giá trị ban đầu do gateway quyết định.
  useEffect(() => {
    if (data) hydrateProtections(data.protections)
  }, [data, hydrateProtections])

  if (!data) {
    return (
      <>
        <MobileHeader title="Trung tâm an toàn" backTo="/" />
        <div className="flex min-h-0 flex-1 items-center justify-center text-[15px] text-muted">Đang tải…</div>
      </>
    )
  }

  const stats = [
    { label: 'Đã chặn', value: data.blockedCount, tone: 'text-danger' },
    { label: 'Đã cảnh báo', value: data.warnedCount, tone: 'text-warning' },
    { label: 'Đã báo cáo', value: data.reportedCount, tone: 'text-info' },
  ]

  return (
    <>
      <MobileHeader title="Trung tâm an toàn" backTo="/" />
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4 pt-1">
        {/* Điểm an toàn */}
        <div className="flex items-center gap-4 rounded-card bg-surface p-5 shadow-card">
          <SafetyScoreRing score={data.safetyScore} />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[13px] text-muted">Điểm an toàn tài khoản</span>
            <Badge variant="success" size="md" className="w-fit">
              {data.scoreLabel}
            </Badge>
            <span className="text-xs leading-4 text-muted">
              {data.updatedLabel} · Scam Shield {data.shieldEnabled ? 'đang bật' : 'đang tắt'}
            </span>
          </span>
        </div>

        {/* 3 ô thống kê */}
        <div className="grid grid-cols-3 gap-2.5">
          {stats.map((s) => (
            <span key={s.label} className="flex flex-col items-center gap-0.5 rounded-card bg-surface px-3 py-3.5 shadow-card">
              <span className={`text-2xl font-bold ${s.tone}`}>{s.value}</span>
              <span className="text-xs text-muted">{s.label}</span>
            </span>
          ))}
        </div>

        {/* Lịch sử cảnh báo */}
        <div className="flex flex-col rounded-card bg-surface p-4 pb-1 shadow-card">
          <span className="flex items-center justify-between pb-1">
            <span className="text-[15px] font-semibold">Lịch sử cảnh báo</span>
            <span className="text-[13px] font-medium text-primary">Tất cả</span>
          </span>
          {data.history.map((item) => {
            const meta = historyStatusMeta[item.status]
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
                className="flex cursor-pointer items-center gap-3 border-b border-divider py-3 text-left last:border-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-5">
                    Chuyển {formatVnd(item.amount)}
                  </span>
                  <span className="block text-xs text-muted">
                    {formatDate(item.date)} · {item.scenarioName}
                  </span>
                </span>
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </button>
            )
          })}
        </div>

        {/* Lớp bảo vệ */}
        <div className="flex flex-col rounded-card bg-surface p-4 pb-1 shadow-card">
          <span className="pb-1 text-[15px] font-semibold">Lớp bảo vệ</span>
          {data.protections.map((p) => (
            <span key={p.key} className="flex items-center gap-3 border-b border-divider py-3 last:border-0">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-5">{p.label}</span>
                <span className="block text-xs text-muted">{p.description}</span>
              </span>
              <Switch checked={protections[p.key] ?? false} onCheckedChange={(next) => void onToggleProtection(p.key, next)} />
            </span>
          ))}
        </div>
      </div>
      <BottomNav active="safety" />

      {/* Bottom sheet chi tiết */}
      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent container={container}>
          {selected && (
            <div className="flex flex-col gap-3">
              <SheetTitle className="text-lg font-semibold">Chi tiết cảnh báo</SheetTitle>
              <div className="flex flex-col gap-2.5 rounded-xl bg-app p-4 text-sm">
                <span className="flex justify-between">
                  <span className="text-muted">Ngày</span>
                  <span className="font-medium">{formatDate(selected.date)}</span>
                </span>
                <span className="flex justify-between">
                  <span className="text-muted">Số tiền</span>
                  <span className="font-semibold">{formatVnd(selected.amount)}</span>
                </span>
                <span className="flex justify-between">
                  <span className="text-muted">Kịch bản</span>
                  <span className="font-medium">{selected.scenarioName}</span>
                </span>
                <span className="flex items-center justify-between">
                  <span className="text-muted">Trạng thái</span>
                  <Badge variant={historyStatusMeta[selected.status].variant}>{historyStatusMeta[selected.status].label}</Badge>
                </span>
              </div>
              <span className="text-[13px] leading-5 text-muted">
                Cảnh báo được tạo bởi Scam Shield dựa trên tín hiệu tài khoản nhận và mẫu hành vi. Mọi quyết định cuối cùng thuộc về bạn — MSB không tự động chặn giao dịch hợp lệ.
              </span>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
