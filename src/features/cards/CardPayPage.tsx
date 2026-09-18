import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ChevronDown, House, Wifi } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { getSessionCustomer } from '@/lib/api'
import { formatDate, formatTime, fullAccountNumber, fullCustomerName } from '@/lib/format'
import { useGuardianStore } from '@/lib/store'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

const vnd = new Intl.NumberFormat('en-US')

/** Dư nợ thẻ GIẢ LẬP theo bố cục ttt.jpg — thẻ trùng số cuối 7042 với màn Thẻ.
 *  Tối thiểu = 5% dư nợ sao kê, làm tròn nghìn như sao kê thật. */
const CARD = {
  name: 'MSB Visa Online',
  last4: '7042',
  minDue: 243_000,
  totalDue: 4_860_000,
}

type PayOption = 'min' | 'full' | 'custom'

const PAY_OPTIONS: { key: PayOption; label: string }[] = [
  { key: 'min', label: 'Tối thiểu dư nợ' },
  { key: 'full', label: 'Toàn bộ dư nợ' },
  { key: 'custom', label: 'Số tiền khác' },
]

const optionLabel = (o: PayOption) => PAY_OPTIONS.find((p) => p.key === o)!.label

/** Giao dịch vừa thanh toán — dựng lúc bấm xác nhận, hiển thị ở màn thành công */
interface PaidCard {
  transactionId: string
  paidAt: Date
  amount: number
  option: PayOption
}

/** Mặt thẻ thu nhỏ trong ô chọn thẻ — vẽ CSS theo thẻ cam MSB Visa Online của ảnh mẫu */
function CardThumb() {
  return (
    <span
      className="relative flex h-11 w-[68px] flex-none flex-col justify-between overflow-hidden rounded-[7px] p-1.5 shadow-card"
      style={{ background: 'var(--msb-gradient-balance)' }}
    >
      <span className="flex items-center justify-between">
        <span className="text-[7px] font-bold leading-none text-white">MSB</span>
        <Wifi size={8} strokeWidth={2.5} className="rotate-90 text-white/80" />
      </span>
      <span className="self-end text-[8px] font-bold italic leading-none tracking-wide text-white">VISA</span>
    </span>
  )
}

export function CardPayPage() {
  return (
    <MobileFrame statusBar="dark">
      <CardPayInner />
    </MobileFrame>
  )
}

/** Luồng thanh toán thẻ 3 bước, cùng nhịp với thanh toán hóa đơn nhưng bỏ OTP
 *  theo yêu cầu: chọn mức thanh toán → xác nhận → xử lý (logo M xoay) → thành công. */
function CardPayInner() {
  const navigate = useNavigate()
  const pushNotification = useGuardianStore((s) => s.pushNotification)
  const { data: customer } = useQuery({ queryKey: ['session-customer'], queryFn: getSessionCustomer })

  const [phase, setPhase] = useState<'form' | 'confirm' | 'processing' | 'done'>('form')
  const [option, setOption] = useState<PayOption>('full')
  const [customRaw, setCustomRaw] = useState('')
  const [paid, setPaid] = useState<PaidCard | null>(null)

  const balance = customer?.balance ?? 0
  const customAmount = Number(customRaw.replace(/\D/g, '') || 0)
  const amount = option === 'min' ? CARD.minDue : option === 'full' ? CARD.totalDue : customAmount
  const overBalance = amount > balance
  const canContinue = amount > 0 && !overBalance

  function confirmPay() {
    const paidAt = new Date()
    setPaid({ transactionId: `FT${String(paidAt.getTime()).slice(-8)}`, paidAt, amount, option })
    pushNotification({
      id: `noti-card-${paidAt.getTime()}`,
      title: `Thanh toán thẻ ${CARD.name} ${vnd.format(amount)} VND thành công`,
      timeLabel: `Hôm nay · ${formatTime(paidAt.toISOString())}`,
    })
    setPhase('done')
  }

  /* ---- Màn xử lý — logo M xoay như luồng hóa đơn/chuyển tiền ---- */
  if (phase === 'processing') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <motion.div
          initial={{ scale: 0.3, opacity: 0, y: 26 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 250, damping: 17 }}
          className="relative flex h-[76px] w-[76px] items-center justify-center"
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-[3px] border-primary/20 border-t-primary"
          />
          <motion.img
            src="/assets/icon-logo-msb.png"
            alt="MSB"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="h-8 w-auto"
          />
        </motion.div>
        <span className="text-[15px] font-medium text-muted">Đang thanh toán…</span>
      </div>
    )
  }

  /* ---- Màn thành công ---- */
  if (phase === 'done' && paid) {
    return (
      <>
        <div className="flex flex-none items-center justify-between px-4 pb-1 pt-2">
          <img src="/assets/icon-logo-msb.png" alt="MSB" className="h-6 w-auto" />
          <button type="button" aria-label="Về trang chủ" onClick={() => navigate('/')} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-black/5">
            <House size={21} strokeWidth={1.6} />
          </button>
        </div>
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-2">
          <div className="flex flex-col rounded-card bg-surface p-4 shadow-card">
            <div className="flex items-center gap-3 pb-3">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-success-soft text-success"
              >
                <CheckCircle2 size={30} strokeWidth={1.7} />
              </motion.span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-bold leading-[22px] text-success">Thanh toán thẻ thành công</span>
                <span className="block text-[22px] font-bold leading-7 text-ink">{vnd.format(paid.amount)} VND</span>
                <span className="block text-[12px] leading-[17px] text-muted">
                  {formatTime(paid.paidAt.toISOString())} - {formatDate(paid.paidAt.toISOString())}
                </span>
              </span>
            </div>
            <div className="h-px bg-divider" />
            {[
              ['Mã giao dịch', paid.transactionId],
              ['Thẻ thanh toán', `${CARD.name} · •••• ${CARD.last4}`],
              ['Mức thanh toán', optionLabel(paid.option)],
              ['Tài khoản nguồn', `${fullAccountNumber(customer?.maskedAccount)} · ${fullCustomerName(customer?.name)}`],
              ['Phí giao dịch', 'Miễn phí'],
            ].map(([label, value]) => (
              <span key={label} className="flex flex-col gap-0.5 pt-3">
                <span className="text-[13px] leading-[18px] text-muted">{label}</span>
                <span className="text-[15px] font-semibold leading-5 text-ink">{value}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="grid flex-none grid-cols-2 gap-3 px-4 pb-8 pt-3">
          <Button variant="outline" className="w-full font-semibold" onClick={() => navigate('/cards')}>
            Về màn Thẻ
          </Button>
          <Button className="w-full font-semibold" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        </div>
      </>
    )
  }

  /* ---- Màn xác nhận ---- */
  if (phase === 'confirm') {
    return (
      <>
        <MobileHeader title="Xác nhận thanh toán" onBack={() => setPhase('form')} />
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-1">
          <div className="flex flex-col rounded-card bg-surface p-4 shadow-card">
            <div className="flex flex-col items-center gap-1 pb-3">
              <span className="text-[13px] leading-[18px] text-muted">Số tiền thanh toán</span>
              <span className="text-[28px] font-bold leading-9 text-ink">{vnd.format(amount)} VND</span>
            </div>
            <div className="h-px bg-divider" />
            {[
              ['Thẻ thanh toán', `${CARD.name} · •••• ${CARD.last4}`],
              ['Mức thanh toán', optionLabel(option)],
              ['Tài khoản nguồn', `${fullAccountNumber(customer?.maskedAccount)} · ${fullCustomerName(customer?.name)}`],
              ['Số dư sau giao dịch', `${vnd.format(balance - amount)} VND`],
              ['Phí giao dịch', 'Miễn phí'],
            ].map(([label, value]) => (
              <span key={label} className="flex flex-col gap-0.5 pt-3">
                <span className="text-[13px] leading-[18px] text-muted">{label}</span>
                <span className="text-[15px] font-semibold leading-5 text-ink">{value}</span>
              </span>
            ))}
          </div>
          <span className="px-1 text-[12px] leading-[17px] text-muted">
            Khoản thanh toán được ghi nhận vào dư nợ thẻ ngay khi giao dịch thành công.
          </span>
        </div>
        <div className="flex-none px-4 pb-8 pt-3">
          <Button
            className="w-full font-semibold"
            onClick={() => {
              setPhase('processing')
              setTimeout(confirmPay, 1000)
            }}
          >
            Xác nhận
          </Button>
        </div>
      </>
    )
  }

  /* ---- Màn chọn mức thanh toán — bố cục theo ttt.jpg, tone sáng đồng bộ app ---- */
  return (
    <>
      <MobileHeader
        title="Thanh toán thẻ"
        backTo="/cards"
        right={
          <button type="button" aria-label="Về trang chủ" onClick={() => navigate('/')} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-black/5">
            <House size={20} strokeWidth={1.6} />
          </button>
        }
      />
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-1">
        {/* Thẻ được thanh toán */}
        <div className="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card">
          <CardThumb />
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold leading-5 text-ink">{CARD.name}</span>
            <span className="block text-[13px] leading-[18px] text-muted">•••• {CARD.last4}</span>
          </span>
          <ChevronDown size={20} strokeWidth={1.8} className="flex-none text-muted" />
        </div>

        {/* Chọn mức thanh toán */}
        <div className="flex flex-col rounded-card bg-surface p-4 shadow-card">
          <span className="pb-1 text-[15px] font-semibold text-ink">Chọn mức thanh toán</span>
          {PAY_OPTIONS.map((o) => {
            const selected = option === o.key
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => setOption(o.key)}
                className="flex cursor-pointer items-center gap-3 border-b border-divider py-3.5 text-left last:border-b-0 last:pb-1"
              >
                <span
                  className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border-2 ${
                    selected ? 'border-primary' : 'border-line'
                  }`}
                >
                  {selected && <span className="h-3 w-3 rounded-full bg-primary" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] leading-5 text-ink">{o.label}</span>
                  {o.key !== 'custom' && (
                    <span className="block pt-0.5 text-[16px] font-bold leading-[22px] text-ink">
                      {vnd.format(o.key === 'min' ? CARD.minDue : CARD.totalDue)} <span className="font-medium text-muted">VND</span>
                    </span>
                  )}
                </span>
              </button>
            )
          })}
          {option === 'custom' && (
            <div className="flex items-center gap-2 rounded-btn border border-line bg-app px-3.5 py-3">
              <input
                inputMode="numeric"
                autoFocus
                placeholder="Nhập số tiền"
                value={customRaw && vnd.format(customAmount)}
                onChange={(e) => setCustomRaw(e.target.value.replace(/\D/g, ''))}
                className="min-w-0 flex-1 bg-transparent text-[16px] font-bold text-ink outline-none placeholder:font-medium placeholder:text-muted"
              />
              <span className="flex-none text-[14px] font-medium text-muted">VND</span>
            </div>
          )}
          {overBalance && (
            <span className="pt-2 text-[12px] leading-[17px] text-danger">Số tiền vượt quá số dư tài khoản nguồn</span>
          )}
        </div>

        {/* Tài khoản nguồn */}
        <div className="flex flex-col gap-2 rounded-card bg-surface p-4 shadow-card">
          <span className="text-[15px] font-semibold text-ink">Tài khoản nguồn</span>
          <div className="flex items-center gap-3 rounded-btn border border-line bg-app px-3.5 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] leading-[18px] text-muted">
                {fullAccountNumber(customer?.maskedAccount)} · {fullCustomerName(customer?.name)}
              </span>
              <span className="block text-[16px] font-bold leading-6 text-ink">
                {vnd.format(balance)} <span className="font-medium text-muted">VND</span>
              </span>
            </span>
            <ChevronDown size={20} strokeWidth={1.8} className="flex-none text-muted" />
          </div>
        </div>
      </div>

      <div className="flex-none px-4 pb-8 pt-3">
        <Button className="w-full font-semibold" disabled={!canContinue} onClick={() => setPhase('confirm')}>
          Tiếp tục
        </Button>
      </div>
    </>
  )
}
