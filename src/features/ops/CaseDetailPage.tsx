import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertStatusBadge, riskTone } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
// MOCK CŨ: import { demoCustomer, demoModelInputs } from '@/data/demo-scenarios'
import type { OpsDecision } from '@/data/types'
import { getCaseTimeline, getOpsAlert, getOpsDashboard, getSessionCustomer, postDecision } from '@/lib/api'
import { formatDateTime, formatVnd } from '@/lib/format'
import { useGuardianStore } from '@/lib/store'
import { DesktopShell } from '@/shell/DesktopShell'

const decisionLabels: Record<OpsDecision, string> = {
  confirmed: 'Xác nhận lừa đảo',
  dismissed: 'Bỏ qua — giao dịch hợp lệ',
  investigating: 'Chuyển điều tra',
}

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <span className="flex items-start justify-between gap-3 text-[13px]">
      <span className="flex-none text-muted">{label}</span>
      <span className={strong ? 'text-right font-semibold' : 'text-right font-medium'}>{value}</span>
    </span>
  )
}

export function CaseDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { alertStatusOverrides, setAlertStatus } = useGuardianStore()
  const [note, setNote] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data: alert, isPending } = useQuery({ queryKey: ['ops-alert', id], queryFn: () => getOpsAlert(id) })
  // Trước đây getCaseTimeline bỏ qua id và trả thẳng dữ liệu demo, không gọi mạng.
  const { data: timeline = [] } = useQuery({ queryKey: ['case-timeline', id], queryFn: () => getCaseTimeline(id) })
  const { data: customer } = useQuery({ queryKey: ['session-customer'], queryFn: getSessionCustomer })
  const { data: dashboard } = useQuery({ queryKey: ['ops-dashboard'], queryFn: getOpsDashboard })

  async function decide(decision: OpsDecision) {
    if (!alert || submitting) return
    setSubmitting(true)
    await postDecision(alert.id, decision, note)
    setAlertStatus(alert.id, decision)
    setToast(`Đã ghi nhận: ${decisionLabels[decision]}. Quyết định được lưu vào nhật ký AI.`)
    setSubmitting(false)
    setTimeout(() => setToast(null), 3_500)
  }

  const breadcrumb = (
    <span className="flex items-center gap-1.5 text-[13px] text-muted">
      <Link to="/ops" className="hover:text-ink">
        Cảnh báo
      </Link>
      <ChevronRight size={14} />
      <span className="font-medium text-ink">Case {id}</span>
    </span>
  )

  if (isPending || !alert) {
    return (
      <DesktopShell breadcrumb={breadcrumb}>
        <div className="grid grid-cols-[280px_1fr_320px] gap-4">
          <Skeleton className="h-[420px] rounded-card" />
          <Skeleton className="h-[420px] rounded-card" />
          <Skeleton className="h-[420px] rounded-card" />
        </div>
      </DesktopShell>
    )
  }

  const status = alertStatusOverrides[alert.id] ?? alert.status
  const { assessment, beneficiary } = alert

  return (
    <DesktopShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-4">
        {/* Header case */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold leading-8">
              Chuyển {formatVnd(alert.amount)} → {beneficiary.bankName}
            </h1>
            <span className="flex items-center gap-2">
              <Badge variant="danger" size="md">
                Risk Score {assessment.score}
              </Badge>
              <Badge variant="neutral" size="md">
                {assessment.scenarioName}
              </Badge>
              <AlertStatusBadge status={status} />
              <span className="text-[13px] text-muted">Tạo lúc {formatDateTime(alert.timestamp)} · SLA còn 42 phút</span>
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/ops')}>
            ← Về danh sách
          </Button>
        </div>

        <div className="grid grid-cols-[280px_minmax(0,1fr)_320px] items-start gap-4">
          {/* Cột trái */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2.5 rounded-card bg-surface p-5 shadow-card">
              <span className="text-[15px] font-semibold">Giao dịch</span>
              <InfoRow label="Số tiền" value={formatVnd(alert.amount)} strong />
              <InfoRow label="Thời gian" value={formatDateTime(alert.timestamp)} />
              <InfoRow label="Kênh" value="Mobile · iPhone 15 (quen)" />
              <InfoRow label="Nội dung" value="Nop tien xac minh" />
              <InfoRow label="Trạng thái lệnh" value="Tạm giữ bởi Scam Shield" strong />
            </div>

            <div className="flex flex-col gap-2.5 rounded-card bg-surface p-5 shadow-card">
              <span className="text-[15px] font-semibold">Khách hàng</span>
              <span className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-soft text-[15px] font-semibold text-primary">
                  {alert.customer
                    .split(' ')
                    .slice(-2)
                    .map((w) => w[0])
                    .join('')}
                </span>
                <span>
                  <span className="block text-[15px] font-semibold">{alert.customer}</span>
                  <span className="block text-xs text-muted">{customer?.maskedAccount ?? '••••'} · KH từ 2019 · Phân khúc Lương</span>
                </span>
              </span>
              <InfoRow label="Số dư hiện tại" value={formatVnd(customer?.balance ?? 0)} />
              <InfoRow label="Mức chuyển TB" value="9.400.000 ₫" />
              <InfoRow label="Cảnh báo 90 ngày" value="1 (58/100)" />
            </div>

            <div className="flex flex-col gap-2.5 rounded-card bg-surface p-5 shadow-card">
              <span className="text-[15px] font-semibold">Người nhận</span>
              <InfoRow label="Chủ tài khoản" value={beneficiary.holderName} strong />
              <InfoRow label="Ngân hàng" value={beneficiary.bankName} />
              <InfoRow label="Số tài khoản" value={beneficiary.accountNo} />
              <InfoRow label="Tuổi tài khoản" value={`${beneficiary.accountAgeDays} ngày`} strong />
              <InfoRow label="Báo cáo cộng đồng" value={`${beneficiary.reportCount} báo cáo`} strong />
            </div>
          </div>

          {/* Cột giữa */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
              <div>
                <span className="text-[15px] font-semibold">Phân rã điểm rủi ro của AI</span>
                <span className="block text-xs text-muted">Risk Engine v2.3 · rule + anomaly · chấm điểm trong 212 ms</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-[44px] font-bold leading-[48px]" style={{ color: riskTone(assessment.score) }}>
                  {assessment.score}
                  <span className="text-xl font-medium text-muted"> / 100</span>
                </span>
                <span className="flex-1">
                  <span className="flex justify-between text-[13px]">
                    <span className="text-muted">Độ tin cậy mô hình</span>
                    <span className="font-semibold">92%</span>
                  </span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-divider">
                    <span className="block h-full w-[92%] rounded-full bg-ink" />
                  </span>
                  <span className="mt-1 block text-xs text-muted">Ngưỡng can thiệp ≥ 75 · Cảnh báo mềm 40–74</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {assessment.signals.map((sig) => (
                  <div key={sig.id} className="flex flex-col gap-1">
                    <span className="flex items-baseline justify-between gap-2 text-[13px]">
                      <span className="font-medium leading-4">{sig.label}</span>
                      <span className="font-semibold text-danger">+{sig.weight}</span>
                    </span>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-divider">
                      <span className="block h-full rounded-full bg-danger" style={{ width: `${sig.weight}%` }} />
                    </span>
                    <span className="text-[11px] text-muted">Độ tin cậy {sig.confidencePct ?? 80}%</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-divider pt-3">
                <span className="text-xs font-semibold uppercase tracking-[.04em] text-muted">Dữ liệu đầu vào mô hình</span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {(dashboard?.modelInputs ?? []).map((inp) => (
                    <span key={inp} className="rounded-full border border-line bg-app px-2.5 py-1 text-xs">
                      {inp}
                    </span>
                  ))}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card">
              <span className="text-[15px] font-semibold">Timeline xử lý</span>
              <div className="flex flex-col">
                {timeline.map((step, i) => (
                  <div key={step.id} className="grid grid-cols-[16px_1fr] gap-x-3">
                    <span className="flex flex-col items-center">
                      <span
                        className="mt-1 block h-2.5 w-2.5 flex-none rounded-full"
                        style={{ background: step.done ? 'var(--msb-primary)' : 'var(--msb-border)' }}
                      />
                      {i < timeline.length - 1 && <span className="w-[2px] flex-1 bg-divider" />}
                    </span>
                    <span className={i < timeline.length - 1 ? 'pb-3' : ''}>
                      <span className="block text-[13px] leading-[18px]">
                        <span className="font-mono text-xs text-muted">{step.time}</span> · {step.label}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cột phải */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card">
              <span className="text-[15px] font-semibold">Ghi chú xử lý</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú của chuyên viên… (vd: đã gọi khách hàng xác minh)"
                className="min-h-[150px] resize-none rounded-xl border border-line bg-[color:var(--msb-bg)] p-3 text-[13px] leading-5 outline-none placeholder:text-muted focus:border-primary"
              />
              <span className="flex flex-wrap gap-1.5">
                <span className="rounded-full bg-orange-soft px-2.5 py-1 text-xs font-medium text-primary-pressed">Đã liên hệ KH</span>
                <span className="rounded-full border border-line bg-app px-2.5 py-1 text-xs">Khoá 24h</span>
                <span className="rounded-full border border-line bg-app px-2.5 py-1 text-xs">Thêm TK vào blacklist</span>
              </span>
            </div>

            <div className="flex flex-col gap-2.5 rounded-card bg-surface p-5 shadow-card">
              <span className="text-xs font-semibold uppercase tracking-[.04em] text-muted">Quyết định</span>
              <Button variant="danger" size="md" className="w-full" disabled={submitting} onClick={() => void decide('confirmed')}>
                Xác nhận lừa đảo
              </Button>
              <Button variant="secondary" size="md" className="w-full" disabled={submitting} onClick={() => void decide('dismissed')}>
                Bỏ qua — giao dịch hợp lệ
              </Button>
              <Button variant="outline" size="md" className="w-full" disabled={submitting} onClick={() => void decide('investigating')}>
                Chuyển điều tra
              </Button>
              <span className="text-center text-[11px] leading-4 text-muted">Quyết định được ghi vào nhật ký AI và dùng để hiệu chỉnh lại ngưỡng.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast xác nhận */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-card bg-surface p-4 pr-6 shadow-float"
          >
            <CheckCircle2 size={20} className="text-success" />
            <span className="text-sm font-medium">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </DesktopShell>
  )
}
