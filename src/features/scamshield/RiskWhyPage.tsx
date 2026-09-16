import { motion } from 'framer-motion'
import { PhoneCall, ShieldQuestion } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
// MOCK CŨ: import { demoBeneficiaryTimeline, demoRiskAssessment, demoSimilarScenario } from '@/data/demo-scenarios'
import type { TimelineEvent } from '@/data/types'
import { getRiskExplain } from '@/lib/api'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

const segmentShades = ['var(--msb-danger)', 'var(--msb-danger-400)', 'var(--msb-danger-300)', 'var(--msb-danger-200)']

function toneColor(tone: TimelineEvent['tone']): string {
  if (tone === 'danger') return 'var(--msb-danger)'
  if (tone === 'warning') return 'var(--msb-warning)'
  return 'var(--msb-text-muted)'
}

export function RiskWhyPage() {
  const navigate = useNavigate()
  const { data } = useQuery({ queryKey: ['risk-explain'], queryFn: getRiskExplain })

  // Chờ đủ dữ liệu rồi mới vẽ: hiện điểm 0 rồi nhảy lên 87 trông như lỗi.
  if (!data) {
    return (
      <MobileFrame>
        <MobileHeader title="Vì sao chúng tôi cảnh báo" backTo="/transfer/review" />
        <div className="flex min-h-0 flex-1 items-center justify-center text-[15px] text-muted">Đang tải…</div>
      </MobileFrame>
    )
  }

  const { score, signals, recommendations } = data.assessment
  const beneficiaryTimeline = data.beneficiaryTimeline
  const similarScenario = data.similarScenario

  return (
    <MobileFrame>
      <MobileHeader title="Vì sao chúng tôi cảnh báo" backTo="/transfer/review" />
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4 pt-1">
        {/* Tổng điểm */}
        <div className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span>
              <span className="block text-[13px] text-muted">Risk Score</span>
              <span className="text-[32px] font-bold leading-10 text-danger">
                {score} <span className="text-lg font-medium text-muted">/ 100</span>
              </span>
            </span>
            <Badge variant="danger" size="md">
              Rủi ro rất cao
            </Badge>
          </div>
          <span className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
            {signals.map((sig, i) => (
              <motion.span
                key={sig.id}
                className="block h-full"
                style={{ background: segmentShades[i] }}
                initial={{ width: 0 }}
                animate={{ width: `${sig.weight}%` }}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.1, ease: 'easeOut' }}
              />
            ))}
          </span>
          <span className="text-xs leading-4 text-muted">Điểm được tính từ 4 tín hiệu bên dưới. Ngưỡng can thiệp: ≥ 75.</span>
        </div>

        {/* Phân rã điểm — tổng 4 thanh đúng bằng 87 */}
        <div className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
          <span className="text-[15px] font-semibold">Phân rã theo tín hiệu</span>
          {signals.map((sig, i) => (
            <div key={sig.id} className="flex flex-col gap-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium leading-5">{sig.label}</span>
                <span className="text-sm font-semibold text-danger">+{sig.weight}</span>
              </span>
              <span className="block h-2 overflow-hidden rounded-full bg-divider">
                <motion.span
                  className="block h-full rounded-full"
                  style={{ background: segmentShades[i] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(sig.weight / score) * 100}%` }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.12, ease: 'easeOut' }}
                />
              </span>
              <span className="text-xs leading-4 text-muted">{sig.detail}</span>
            </div>
          ))}
        </div>

        {/* Timeline tài khoản người nhận */}
        <div className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
          <span className="text-[15px] font-semibold">Hành vi tài khoản người nhận</span>
          <div className="flex flex-col">
            {beneficiaryTimeline.map((event, i) => (
              <div key={event.id} className="grid grid-cols-[16px_1fr] gap-x-3">
                <span className="flex flex-col items-center">
                  <span className="mt-1 block h-2.5 w-2.5 flex-none rounded-full" style={{ background: toneColor(event.tone) }} />
                  {i < beneficiaryTimeline.length - 1 && <span className="w-[2px] flex-1 bg-divider" />}
                </span>
                <span className={i < beneficiaryTimeline.length - 1 ? 'pb-4' : ''}>
                  <span className="block text-xs text-muted">{event.time}</span>
                  <span className="block text-sm font-medium leading-5">{event.label}</span>
                  {event.detail && <span className="block text-xs leading-4 text-muted">{event.detail}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Kịch bản tương tự */}
        <div className="flex flex-col gap-2 rounded-card bg-surface p-4 shadow-card">
          <span className="flex items-center justify-between gap-2">
            <span className="text-[15px] font-semibold">Kịch bản lừa đảo tương tự</span>
            <Badge variant="danger">{similarScenario.name}</Badge>
          </span>
          <span className="text-sm leading-5 text-ink">{similarScenario.description}</span>
          <span className="text-xs text-muted">{similarScenario.reportedCases.toLocaleString('vi-VN')} vụ đã ghi nhận trong 6 tháng gần nhất</span>
        </div>

        {/* Bạn nên làm gì */}
        <div className="flex flex-col gap-3 rounded-card bg-orange-soft p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary-pressed">Bạn nên làm gì</span>
          {recommendations.map((rec, i) => (
            <span key={rec} className="flex items-start gap-3 rounded-xl bg-surface p-3 shadow-card">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-orange-soft text-primary">
                {i === 0 ? <PhoneCall size={18} strokeWidth={1.7} /> : <ShieldQuestion size={18} strokeWidth={1.7} />}
              </span>
              <span className="text-sm leading-5">{rec}</span>
            </span>
          ))}
        </div>

        <Button variant="secondary" className="w-full" onClick={() => navigate('/transfer/review')}>
          Quay lại màn cảnh báo
        </Button>
      </div>
    </MobileFrame>
  )
}
