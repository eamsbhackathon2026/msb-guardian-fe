import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, House, Info, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Switch } from '@/components/ui/switch'
import { getSessionCustomer, precheckTransfer } from '@/lib/api'
import type { TransferPrecheckResult } from '@/data/types'
import { fullAccountNumber } from '@/lib/format'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'
import { favoriteBeneficiaries, type Beneficiary } from './BeneficiariesPage'

const blockVariants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' as const } }),
}

const vnd = new Intl.NumberFormat('en-US')

/** Màn nhập lệnh chuyển tiền — theo chuyentien2.jpg, tone sáng.
 *  Nhấn "Tiếp tục" đi vào luồng Scam Shield (/transfer/review) như kịch bản demo. */
export function TransferFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // Chat Banking gửi kèm số tiền đã hiểu từ câu chat để form điền sẵn;
  // from='chat-banking' được chuyền suốt luồng để màn thành công quay lại chat.
  const state = (location.state as { beneficiary?: Beneficiary; amount?: number; from?: string } | null) ?? {}
  const beneficiary: Beneficiary = state.beneficiary ?? favoriteBeneficiaries[0]

  const { data: customer } = useQuery({ queryKey: ['session-customer'], queryFn: getSessionCustomer })

  const [amountDigits, setAmountDigits] = useState(state.amount && state.amount > 0 ? String(Math.floor(state.amount)) : '')
  const [note, setNote] = useState('NGUYEN VIET ANH chuyen tien')
  const [scheduled, setScheduled] = useState(false)
  const [amountFocused, setAmountFocused] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Kết quả chấm điểm Guardian của số tiền đang nhập. Chạy khi rời ô số tiền để
  // banner cảnh báo hiện ngay tại chỗ, đúng như wireframe, chứ không đợi bấm nút.
  const [check, setCheck] = useState<TransferPrecheckResult | null>(null)
  const [showFactors, setShowFactors] = useState(false)

  const canContinue = amountDigits.length > 0 && Number(amountDigits) > 0

  // Gõ "50" gợi ý 50.000 / 500.000 / 5.000.000 — nhân theo bậc nghìn như các
  // app ngân hàng. Không gợi ý nữa khi số đã đủ lớn (≥ 6 chữ số coi như đã là
  // số tiền thật) hoặc vượt trần 12 chữ số của ô nhập.
  const amountValue = Number(amountDigits)
  const amountSuggestions =
    amountDigits.length > 0 && amountDigits.length < 6 && amountValue > 0
      ? [amountValue * 1_000, amountValue * 10_000, amountValue * 100_000].filter((v) => String(v).length <= 12)
      : []

  /** Chấm điểm lệnh đang nhập. Lỗi thì trả null — không bao giờ chặn khách. */
  async function runPrecheck(amount: number): Promise<TransferPrecheckResult | null> {
    if (!amount) return null
    try {
      return await precheckTransfer({
        bankCode: beneficiary.bankCode ?? beneficiary.bank,
        accountNo: beneficiary.account,
        amount,
        note,
        holderName: beneficiary.name,
      })
    } catch {
      return null
    }
  }

  /**
   * "Tiếp tục" rẽ nhánh theo yêu cầu:
   *  - stk QUEN (trusted) → thẳng màn xác nhận, KHÔNG cần Scam Shield.
   *  - stk MỚI → gọi precheck, agent Scam Shield kiểm tra; nguy hiểm/nghi ngờ
   *    thì hiện màn verdict, an toàn thì tới xác nhận. Gateway lỗi → không chặn.
   */
  async function onContinue() {
    if (!canContinue || submitting) return
    const amount = Number(amountDigits)
    const payload = {
      beneficiary: { name: beneficiary.name, bank: beneficiary.bank, account: beneficiary.account },
      amount,
      note,
      from: state.from,
    }
    setSubmitting(true)
    const res = await runPrecheck(amount)
    setSubmitting(false)
    setCheck(res)
    // Chỉ mức intervene mới chèn màn Guardian. pass và soft_warn đi thẳng sang
    // xác nhận — soft_warn đã cảnh báo bằng banner ngay trên màn này rồi.
    // Engine im lặng (res null) cũng đi tiếp: không chặn vì Guardian lỗi.
    if (res?.level === 'intervene') {
      navigate('/transfer/guardian', {
        state: {
          ...payload,
          decisionId: res.decisionId,
          score: res.score,
          reasons: res.topFactors,
          question: res.question,
          options: res.options,
        },
      })
      return
    }
    navigate('/transfer/confirm', { state: { ...payload, level: res?.level, score: res?.score } })
  }

  return (
    <MobileFrame statusBar="dark">
      <MobileHeader
        title="Chuyển tiền"
        right={
          <button type="button" aria-label="Về trang chủ" onClick={() => navigate('/')} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-black/5">
            <House size={21} strokeWidth={1.6} />
          </button>
        }
      />

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-8 pt-2">
        {/* Người nhận */}
        <motion.div custom={0} variants={blockVariants} initial="hidden" animate="show" className="flex flex-col gap-2.5 rounded-card bg-surface p-4 shadow-card">
          <span className="text-[13px] leading-[18px] text-muted">Người nhận</span>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-line bg-surface">
              <img src="/assets/icon-logo-msb.png" alt={beneficiary.bank} className="h-4 w-auto" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold uppercase leading-[22px] text-ink">{beneficiary.name}</span>
              <span className="block text-[13px] leading-[18px] text-muted">
                {beneficiary.bank} · {beneficiary.account}
              </span>
              {/* Tín hiệu tin cậy ngầm: "Đã chuyển N lần" là trấn an, "Người
                  nhận mới" là nhắc nhở — không phải cảnh báo.
                  isNew xét TRƯỚC txCount: người nhận mới vẫn có thể đã chuyển
                  một lần, hiện "Đã chuyển 1 lần" màu xanh ngay cạnh cảnh báo
                  "chưa từng chuyển" là hai câu chọi nhau trên cùng màn hình. */}
              {check?.isNew ? (
                <span className="block text-[12px] leading-[17px] text-warning">Người nhận mới</span>
              ) : check?.txCount ? (
                <span className="block text-[12px] leading-[17px] text-success">Đã chuyển {check.txCount} lần</span>
              ) : null}
            </span>
          </div>
        </motion.div>

        {/* Thông tin lệnh chuyển */}
        <motion.div custom={1} variants={blockVariants} initial="hidden" animate="show" className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-card">
          {/* Tài khoản nguồn */}
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-semibold text-ink">Tài khoản nguồn</span>
            <button type="button" className="flex cursor-pointer items-center gap-3 rounded-btn border border-line bg-app px-3.5 py-3 text-left">
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] leading-[18px] text-muted">
                  {fullAccountNumber(customer?.maskedAccount)} · Tài khoản thanh toán
                </span>
                <span className="block text-[17px] font-bold leading-6 text-ink">
                  {vnd.format(customer?.balance ?? 0)} <span className="font-medium text-muted">VND</span>
                </span>
              </span>
              <ChevronDown size={20} strokeWidth={1.8} className="flex-none text-muted" />
            </button>
          </div>

          {/* Số tiền */}
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
              Số tiền
              <Info size={15} strokeWidth={1.8} className="text-muted" />
            </span>
            <label
              className={`flex items-center gap-2.5 rounded-btn border bg-app px-3.5 py-3 ${amountFocused ? 'border-primary' : 'border-line'}`}
            >
              <input
                value={amountDigits ? vnd.format(Number(amountDigits)) : ''}
                onChange={(e) => setAmountDigits(e.target.value.replace(/\D/g, '').slice(0, 12))}
                onFocus={() => setAmountFocused(true)}
                onBlur={() => {
                  setAmountFocused(false)
                  void runPrecheck(Number(amountDigits)).then(setCheck)
                }}
                inputMode="numeric"
                placeholder="Nhập số tiền"
                aria-label="Số tiền"
                className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted"
              />
              {amountDigits && (
                <button type="button" aria-label="Xóa số tiền" onClick={() => setAmountDigits('')} className="flex-none cursor-pointer text-muted">
                  <X size={16} strokeWidth={2} />
                </button>
              )}
              <span className="flex-none text-[15px] font-medium text-muted">VND</span>
            </label>
            {/* Gợi ý số tiền theo con số đang gõ: 50 → 50.000 / 500.000 / 5.000.000 */}
            {amountSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {amountSuggestions.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmountDigits(String(v))}
                    className="cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink hover:border-primary hover:text-primary"
                  >
                    {vnd.format(v)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cảnh báo mức soft-warn: hiện ngay tại chỗ, KHÔNG thêm bước nào.
              Chữ là template rule-based của engine nên hiện tức thì, không chờ
              LLM. Mức intervene không dùng banner mà chèn hẳn màn Guardian. */}
          {check?.level === 'soft_warn' && check.templateText && (
            <div className="flex items-start gap-2.5 rounded-btn border border-warning bg-warning-soft px-3 py-2.5">
              <span className="mt-0.5 flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border-[1.5px] border-warning text-[11px] font-bold text-warning">
                !
              </span>
              <div className="min-w-0 flex-1">
                {/* Chỉ lấy câu đầu: phần sau "Lý do:" là tên yếu tố thô của
                    engine (amount deviation, behavior drift...), đọc rất khó.
                    Bản diễn giải sạch nằm dưới nút "Xem lý do". */}
                <div className="text-[12.5px] leading-[18px] text-ink">
                  {check.templateText.split(/\s*Lý do:/)[0]}
                </div>
                <button
                  type="button"
                  onClick={() => setShowFactors((v) => !v)}
                  className="mt-1 cursor-pointer text-[11px] text-warning underline underline-offset-2"
                >
                  Điểm rủi ro {check.score}/100 · {showFactors ? 'Thu gọn' : 'Xem lý do'}
                </button>
                {showFactors && (
                  <div className="mt-1.5 flex flex-col gap-1">
                    {check.topFactors.map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11.5px] leading-[16px] text-muted">
                        <span className="mt-[6px] h-1 w-1 flex-none rounded-full bg-warning" />
                        {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nội dung */}
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-semibold text-ink">Nội dung</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-label="Nội dung chuyển tiền"
              className="rounded-btn border border-line bg-app px-3.5 py-3 text-[15px] text-ink outline-none focus:border-primary"
            />
          </div>

          {/* Đặt lịch chuyển tiền */}
          <div className="flex items-center justify-between rounded-btn border border-line bg-app px-3.5 py-3">
            <span className="text-[15px] font-medium text-ink">Đặt lịch chuyển tiền</span>
            <Switch checked={scheduled} onCheckedChange={setScheduled} aria-label="Đặt lịch chuyển tiền" />
          </div>
        </motion.div>

        <div className="min-h-2 flex-1" />

        {/* Tiếp tục → vào luồng kiểm tra Scam Shield */}
        <button
          type="button"
          disabled={!canContinue || submitting}
          onClick={() => void onContinue()}
          className={`flex h-12 flex-none cursor-pointer items-center justify-center rounded-btn text-base font-semibold transition-colors ${
            canContinue ? 'bg-primary text-white active:scale-[.99]' : 'cursor-default bg-line text-muted'
          }`}
        >
          {submitting ? 'Đang kiểm tra…' : 'Tiếp tục'}
        </button>
      </div>
    </MobileFrame>
  )
}
