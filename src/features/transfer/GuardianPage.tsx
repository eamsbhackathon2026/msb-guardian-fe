import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Lock, MessageSquarePlus, PhoneCall, ShieldAlert } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { CustomerAction, GuardianAction, GuardianActionKey, InterveneAdvice } from '@/data/types'
import { getInterveneDetail, postIntervene, postTransferAction } from '@/lib/api'
import { formatVnd } from '@/lib/format'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

interface GuardianState {
  decisionId?: string
  score?: number
  reasons?: string[]
  question?: string
  options?: string[]
  amount?: number
  note?: string
  beneficiary?: { name: string; bank: string; account: string }
  from?: string
}

/** Nút của Guardian → từ vựng hành động mà gateway ghi xuống risk_decision. */
const ACTION_MAP: Record<GuardianActionKey, CustomerAction> = {
  hold: 'held',
  cancel: 'cancelled',
  contact: 'contacted',
  continue: 'proceeded',
}

const FALLBACK_OPTIONS = ['Có, đang có người hướng dẫn', 'Không, tôi tự chuyển', 'Tôi không chắc']

/**
 * Màn Guardian chèn giữa nút Chuyển và bước xác thực, chỉ khi precheck chấm
 * level = intervene (>= 75 điểm). Một component, hai lượt:
 *
 *  · SHOW_REASONS — vì sao dừng (3 yếu tố nặng nhất của engine) + câu hỏi playbook.
 *  · SHOW_ADVICE  — khuyến cáo theo kịch bản + bốn hành động để KHÁCH tự quyết.
 *
 * Điểm và lý do lấy thẳng từ precheck truyền qua router state, nên lượt 1 hiện
 * ngay, không chờ mạng. Chỉ khi vào thẳng URL (không có state) mới gọi
 * /api/transfer/intervene/{id} để dựng lại.
 */
export function GuardianPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as GuardianState | null) ?? {}
  const decisionId = state.decisionId ?? ''

  const [advice, setAdvice] = useState<InterveneAdvice | null>(null)
  const [chosen, setChosen] = useState('')
  const [freeText, setFreeText] = useState('')
  const [showFreeText, setShowFreeText] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  // Chỉ gọi khi thiếu dữ liệu (vào thẳng URL) — đường chính không tốn round-trip.
  const thieuDuLieu = !state.reasons?.length && Boolean(decisionId)
  const { data: fetched } = useQuery({
    queryKey: ['intervene', decisionId],
    queryFn: () => getInterveneDetail(decisionId),
    enabled: thieuDuLieu,
  })

  const score = state.score ?? fetched?.score ?? 0
  const reasons = state.reasons?.length ? state.reasons : (fetched?.reasons ?? [])
  const question = state.question ?? fetched?.question ?? 'Có ai đang hướng dẫn bạn thực hiện giao dịch này không?'
  const options = (state.options?.length ? state.options : fetched?.options) ?? FALLBACK_OPTIONS
  const amount = state.amount ?? fetched?.amount ?? 0
  const b = state.beneficiary

  async function chon(option: string) {
    if (busy) return
    setChosen(option)
    setBusy(true)
    try {
      const res = await postIntervene({
        decisionId,
        selectedOption: option,
        freeText: freeText.trim() || undefined,
      })
      setAdvice(res)
    } catch {
      // Gateway lỗi thì vẫn phải cho khách quyết — không nhốt họ ở lượt 1.
      setAdvice({
        decisionId,
        selectedOption: option,
        adviceTitle: 'Giao dịch này có dấu hiệu bất thường',
        adviceBody: 'Hãy dừng lại và xác minh trực tiếp với người nhận trước khi chuyển tiền.',
        recommendedAction: 'hold',
        actions: [
          { key: 'hold', label: 'Khóa tạm 24 giờ', recommended: true },
          { key: 'cancel', label: 'Hủy giao dịch', recommended: false },
          { key: 'contact', label: 'Gọi MSB 1900 6083', recommended: false },
          { key: 'continue', label: 'Vẫn tiếp tục', recommended: false },
        ],
        source: 'playbook',
      })
    } finally {
      setBusy(false)
    }
  }

  async function hanhDong(a: GuardianAction) {
    if (busy) return
    setBusy(true)
    let message = ''
    try {
      const res = await postTransferAction(ACTION_MAP[a.key], decisionId || undefined)
      message = res.message
    } catch {
      message = 'Đã ghi nhận lựa chọn của bạn.'
    }
    setBusy(false)
    if (a.key === 'continue') {
      // Khách hiểu rủi ro và vẫn muốn đi tiếp → về luồng xác nhận + mật khẩu.
      navigate('/transfer/confirm', {
        state: { beneficiary: b, amount, note: state.note, from: state.from, afterReview: true },
      })
      return
    }
    setDone(message)
  }

  if (done) {
    return (
      <MobileFrame statusBar="dark">
        <MobileHeader title="Guardian" backTo="/" />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
            <Lock size={32} strokeWidth={1.7} />
          </span>
          <span className="text-[17px] font-semibold text-ink">Đã xử lý</span>
          <span className="text-[14px] leading-[20px] text-muted">{done}</span>
        </div>
        <div className="flex-none space-y-2 border-t border-line bg-surface px-4 py-3">
          <Button className="w-full" onClick={() => navigate('/safety-center')}>
            Tới Trung tâm an toàn
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        </div>
      </MobileFrame>
    )
  }

  return (
    <MobileFrame statusBar="dark" screenClassName="bg-danger-soft">
      <MobileHeader title="Xác nhận chuyển tiền" backTo="/transfer" />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 rounded-card border-[1.5px] border-danger-300 bg-surface p-4 shadow-card"
        >
          {/* Đầu thẻ: điểm rủi ro do engine chấm, không phải LLM */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-danger">Guardian tạm dừng giao dịch</div>
              <div className="mt-0.5 truncate text-[12px] text-muted">
                {formatVnd(amount)}
                {b ? ` · ${b.bank} ${b.account}` : ''}
              </div>
            </div>
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full border-[3.5px] border-danger text-[15px] font-bold text-danger">
              {score}
            </span>
          </div>

          {advice === null ? (
            <>
              {/* Lượt 1 — lý do rule-based, hiện ngay không chờ LLM */}
              {reasons.length > 0 && (
                <div className="flex flex-col gap-1.5 border-t border-divider pt-3">
                  {reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-[13px] leading-[19px] text-ink">
                      <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-danger" />
                      {r}
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-btn bg-app px-3 py-2.5 text-[13px] font-medium leading-[19px] text-ink">
                {question}
              </div>

              <div className="flex flex-col gap-2">
                {options.map((o) => (
                  <button
                    key={o}
                    type="button"
                    disabled={busy}
                    onClick={() => void chon(o)}
                    className="cursor-pointer rounded-btn border border-line bg-surface px-3 py-2.5 text-center text-[13px] text-ink hover:bg-app disabled:opacity-50"
                  >
                    {o}
                  </button>
                ))}
              </div>

              {/* Ô tự do là tùy chọn, ẩn sau một chạm — nút bấm mới là đường chính */}
              {showFreeText ? (
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value.slice(0, 300))}
                  rows={2}
                  autoFocus
                  placeholder="Nói thêm với Guardian…"
                  aria-label="Nói thêm với Guardian"
                  className="rounded-btn border border-line bg-app px-3 py-2 text-[13px] text-ink outline-none placeholder:text-muted focus:border-primary"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowFreeText(true)}
                  className="flex cursor-pointer items-center gap-1.5 self-start text-[12px] text-muted hover:text-ink"
                >
                  <MessageSquarePlus size={14} strokeWidth={1.8} />
                  Nói thêm với Guardian…
                </button>
              )}
            </>
          ) : (
            <>
              {/* Lượt 2 — khuyến cáo theo kịch bản, khách là người quyết */}
              <div className="border-t border-divider pt-3 text-[12px] text-muted">
                Bạn chọn: “{chosen}”
              </div>
              <div className="rounded-btn bg-danger-soft px-3 py-2.5 text-[13px] leading-[19px] text-danger">
                <b className="mb-1 block font-semibold">{advice.adviceTitle}</b>
                {advice.adviceBody}
              </div>
              <div className="flex items-start gap-2 text-[12px] leading-[17px] text-muted">
                <ShieldAlert size={14} strokeWidth={1.8} className="mt-0.5 flex-none text-danger" />
                Guardian khuyên:{' '}
                {advice.actions.find((a) => a.recommended)?.label ?? 'Khóa tạm 24 giờ'}
              </div>

              <div className="flex flex-col gap-2">
                {advice.actions
                  .filter((a) => a.key !== 'continue')
                  .map((a) => (
                    <Button
                      key={a.key}
                      variant={a.recommended ? 'primary' : 'secondary'}
                      className="w-full"
                      disabled={busy}
                      onClick={() => void hanhDong(a)}
                    >
                      {a.key === 'contact' && <PhoneCall size={16} strokeWidth={1.9} />}
                      {a.label}
                    </Button>
                  ))}
                {/* "Vẫn tiếp tục" cố ý nhạt và đặt cuối, nhưng không bao giờ ẩn */}
                {advice.actions
                  .filter((a) => a.key === 'continue')
                  .map((a) => (
                    <button
                      key={a.key}
                      type="button"
                      disabled={busy}
                      onClick={() => void hanhDong(a)}
                      className="w-full cursor-pointer py-2 text-center text-[13px] font-medium text-muted underline-offset-2 hover:underline disabled:opacity-50"
                    >
                      {a.label}
                    </button>
                  ))}
              </div>
            </>
          )}
        </motion.div>

        <p className="px-1 text-center text-[11px] leading-[15px] text-muted">
          Lý do và điểm do hệ thống chấm rủi ro tính; mọi lựa chọn của bạn đều được ghi nhận.
        </p>
      </div>
    </MobileFrame>
  )
}
