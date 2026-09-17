import { motion } from 'framer-motion'
import { AlertTriangle, PhoneCall, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { ScamShieldVerdict } from '@/data/types'
import { formatVnd } from '@/lib/format'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

interface VerdictState {
  verdict?: ScamShieldVerdict
  beneficiary?: { name: string; bank: string; account: string }
  amount?: number
  note?: string
}

const THEME = {
  danger: { bg: 'bg-danger-soft', fg: 'text-danger', chip: 'bg-danger text-white', Icon: ShieldAlert, label: 'Nguy hiểm' },
  suspect: { bg: 'bg-warning-soft', fg: 'text-warning', chip: 'bg-warning text-white', Icon: AlertTriangle, label: 'Cần thận trọng' },
  safe: { bg: 'bg-success-soft', fg: 'text-success', chip: 'bg-success text-white', Icon: ShieldCheck, label: 'Bình thường' },
} as const

/**
 * Kết quả Scam Shield cho lệnh chuyển tới tài khoản MỚI. Verdict do agent Scam
 * Shield (LLM) tạo, gateway trả qua /api/transfer/precheck và TransferForm
 * truyền vào đây qua location.state.
 */
export function ScamShieldVerdictPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as VerdictState | null) ?? {}
  const v = state.verdict

  if (!v) {
    // Vào thẳng URL không có verdict — quay về danh bạ.
    navigate('/transfer', { replace: true })
    return null
  }

  const t = THEME[v.level]
  const proceed = () =>
    navigate('/transfer/confirm', {
      state: { beneficiary: state.beneficiary, amount: state.amount, note: state.note, afterReview: true },
    })

  return (
    <MobileFrame screenClassName={t.bg}>
      <MobileHeader title="Scam Shield" backTo="/transfer" />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-2">
        {/* Kết luận */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 rounded-card bg-surface p-5 text-center shadow-card"
        >
          <span className={`flex h-16 w-16 items-center justify-center rounded-full ${t.bg} ${t.fg}`}>
            <t.Icon size={34} strokeWidth={1.7} />
          </span>
          <span className={`rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-wide ${t.chip}`}>{t.label}</span>
          <span className="text-[18px] font-semibold leading-6 text-ink">{v.title}</span>
          <span className="text-[14px] leading-[20px] text-muted">{v.summary}</span>
          {state.amount ? (
            <span className="text-[13px] text-muted">
              {formatVnd(state.amount)} → {state.beneficiary?.name} · {state.beneficiary?.bank} {state.beneficiary?.account}
            </span>
          ) : null}
        </motion.div>

        {/* Dấu hiệu do agent chỉ ra */}
        {v.reasons.length > 0 && (
          <div className="flex flex-col gap-2 rounded-card bg-surface p-4 shadow-card">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-muted">
              <Sparkles size={14} strokeWidth={1.8} className="text-primary" />
              Dấu hiệu Scam Shield phát hiện
            </span>
            {v.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-[14px] leading-[20px] text-ink">
                <span className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${t.fg.replace('text-', 'bg-')}`} />
                {r}
              </div>
            ))}
          </div>
        )}

        {/* Khuyến nghị */}
        {v.recommendation && (
          <div className="flex items-start gap-2.5 rounded-card bg-surface p-4 shadow-card">
            <PhoneCall size={18} strokeWidth={1.8} className={`mt-0.5 flex-none ${t.fg}`} />
            <span className="text-[14px] leading-[20px] text-ink">{v.recommendation}</span>
          </div>
        )}
      </div>

      {/* Hành động */}
      <div className="flex-none space-y-2 border-t border-line bg-surface px-4 py-3">
        <Button className="w-full" onClick={() => navigate('/safety-center')}>
          Huỷ giao dịch, giữ tiền an toàn
        </Button>
        <button
          type="button"
          onClick={proceed}
          className="w-full cursor-pointer py-2 text-center text-[13px] font-medium text-muted underline-offset-2 hover:underline"
        >
          Tôi hiểu rủi ro, vẫn tiếp tục chuyển
        </button>
      </div>
    </MobileFrame>
  )
}
