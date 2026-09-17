import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, CheckCircle2, ChevronDown, Delete, House, Info, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { getSessionCustomer } from '@/lib/api'
import { formatDate, formatTime, formatVnd, fullAccountNumber, fullCustomerName } from '@/lib/format'
import { useGuardianStore } from '@/lib/store'
import { MobileFrame, usePhoneContainer } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

const vnd = new Intl.NumberFormat('en-US')

/** Kỳ hạn + lãi suất của Tiền gửi lãi suất đặc biệt — theo mẫu tk2.jpg */
const TERMS = [
  { months: 6, rate: 7.0 },
  { months: 12, rate: 7.5 },
  { months: 15, rate: 7.5 },
  { months: 24, rate: 7.5 },
]

const MATURITY_OPTIONS = ['Quay vòng gốc, nhận lãi về tài khoản thanh toán', 'Quay vòng gốc và lãi']

const OTP_LENGTH = 6
const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

function addMonths(d: Date, months: number): Date {
  const x = new Date(d)
  x.setMonth(x.getMonth() + months)
  return x
}

/** Sổ tiền gửi vừa mở — dựng ở bước xác nhận, hiển thị ở màn thành công */
interface OpenedDeposit {
  depositNo: string
  amount: number
  months: number
  rate: number
  openedAt: Date
  maturity: Date
}

export function OpenDepositPage() {
  return (
    <MobileFrame statusBar="dark">
      <OpenDepositInner />
    </MobileFrame>
  )
}

/** Luồng mở tiền gửi 3 bước theo tk1→tk4, đổi từ tone tối của mẫu sang tone cam
 *  sáng đồng bộ app: nhập tiền + kỳ hạn → xác nhận (lãi dự kiến) → thành công. */
function OpenDepositInner() {
  const navigate = useNavigate()
  const container = usePhoneContainer()
  const pushNotification = useGuardianStore((s) => s.pushNotification)
  const { data: customer } = useQuery({ queryKey: ['session-customer'], queryFn: getSessionCustomer })

  const [phase, setPhase] = useState<'form' | 'confirm' | 'otp' | 'processing' | 'done'>('form')
  const [otp, setOtp] = useState('')
  const [amountDigits, setAmountDigits] = useState('')
  const [term, setTerm] = useState<(typeof TERMS)[number] | null>(null)
  const [termSheetOpen, setTermSheetOpen] = useState(false)
  const [maturityOption, setMaturityOption] = useState(0)
  const [agreed, setAgreed] = useState(true)
  const [opened, setOpened] = useState<OpenedDeposit | null>(null)

  const amount = Number(amountDigits)
  const balance = customer?.balance ?? 0
  const overBalance = balance > 0 && amount > balance
  const canContinue = amount > 0 && term !== null && !overBalance

  // Lãi dự kiến cuối kỳ = tiền × lãi suất năm × số ngày thực của kỳ hạn / 365
  // (1.000.000 × 7% × 181/365 ≈ 34.712 — khớp con số trong mẫu tk3).
  const now = new Date()
  const maturity = term ? addMonths(now, term.months) : now
  const termDays = Math.round((maturity.getTime() - now.getTime()) / 86_400_000)
  const expectedInterest = term ? Math.round((amount * (term.rate / 100) * termDays) / 365) : 0

  const accountBox = (
    <div className="flex items-center gap-3 rounded-btn border border-line bg-app px-3.5 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] leading-[18px] text-muted">
          {fullAccountNumber(customer?.maskedAccount)} · Tài khoản thanh toán
        </span>
        <span className="block text-[16px] font-bold leading-6 text-ink">
          {vnd.format(balance)} <span className="font-medium text-muted">VND</span>
        </span>
      </span>
      <ChevronDown size={20} strokeWidth={1.8} className="flex-none text-muted" />
    </div>
  )

  function confirmOpen() {
    if (!term || !agreed) return
    const openedAt = new Date()
    const deposit: OpenedDeposit = {
      // Số sổ tiền gửi giả lập dạng 2000xxxxxxx như mẫu tk4
      depositNo: `2000${String(openedAt.getTime()).slice(-7)}`,
      amount,
      months: term.months,
      rate: term.rate,
      openedAt,
      maturity: addMonths(openedAt, term.months),
    }
    setOpened(deposit)
    pushNotification({
      id: `noti-deposit-${openedAt.getTime()}`,
      title: `Mở tiền gửi thành công ${formatVnd(amount)}, kỳ hạn ${term.months} tháng (${term.rate}%/năm)`,
      timeLabel: `Hôm nay · ${formatTime(openedAt.toISOString())}`,
    })
    setPhase('done')
  }

  function resetForNew() {
    setPhase('form')
    setAmountDigits('')
    setTerm(null)
    setOpened(null)
    setOtp('')
  }

  /** Bàn phím OTP — đủ 6 số thì sang màn xử lý (logo M xoay 1s) rồi hoàn tất */
  function pressOtp(key: (typeof KEYPAD)[number]) {
    if (phase !== 'otp' || key === '') return
    if (key === 'del') {
      setOtp((p) => p.slice(0, -1))
      return
    }
    const next = (otp + key).slice(0, OTP_LENGTH)
    setOtp(next)
    if (next.length === OTP_LENGTH) {
      setPhase('processing')
      setTimeout(confirmOpen, 1000)
    }
  }

  /* ---- Màn xử lý — logo M xoay như luồng chuyển tiền ---- */
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
        <span className="text-[15px] font-medium text-muted">Đang mở tiền gửi…</span>
      </div>
    )
  }

  /* ---- Màn xác thực OTP — cùng kiểu bàn phím với màn chuyển tiền ---- */
  if (phase === 'otp') {
    return (
      <>
        <MobileHeader title="Xác thực giao dịch" onBack={() => { setOtp(''); setPhase('confirm') }} />
        <div className="flex min-h-0 flex-1 flex-col items-center px-6 pt-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-soft text-primary">
            <Lock size={26} strokeWidth={1.6} />
          </span>
          <span className="mt-3 text-[17px] font-semibold">Nhập mã OTP</span>
          <span className="mt-1 text-center text-[13px] leading-[18px] text-muted">
            Mã xác thực đã gửi tới số điện thoại của anh — mở tiền gửi {vnd.format(amount)} VND, kỳ hạn {term?.months} tháng
          </span>
          <div className="mt-6 flex gap-3">
            {Array.from({ length: OTP_LENGTH }, (_, i) => (
              <span key={i} className={`h-3.5 w-3.5 rounded-full border ${i < otp.length ? 'border-primary bg-primary' : 'border-line bg-transparent'}`} />
            ))}
          </div>
        </div>
        <div className="grid flex-none grid-cols-3 gap-2 px-6 pb-8">
          {KEYPAD.map((k, i) => (
            <button
              key={i}
              type="button"
              disabled={k === ''}
              aria-label={k === 'del' ? 'Xóa' : k}
              onClick={() => pressOtp(k)}
              className={`flex h-14 items-center justify-center rounded-card text-[22px] font-semibold text-ink ${
                k === '' ? '' : 'cursor-pointer bg-app active:bg-orange-soft'
              }`}
            >
              {k === 'del' ? <Delete size={24} strokeWidth={1.6} /> : k}
            </button>
          ))}
        </div>
      </>
    )
  }

  /* ---- Màn thành công — theo tk4, tone sáng ---- */
  if (phase === 'done' && opened) {
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
                <span className="block text-[16px] font-bold leading-[22px] text-success">Mở tiền gửi thành công</span>
                <span className="block text-[22px] font-bold leading-7 text-ink">{vnd.format(opened.amount)} VND</span>
                <span className="block text-[12px] leading-[17px] text-muted">
                  {formatTime(opened.openedAt.toISOString())} - {formatDate(opened.openedAt.toISOString())}
                </span>
              </span>
            </div>
            <div className="h-px bg-divider" />
            {[
              ['Số tài khoản tiền gửi', opened.depositNo],
              ['Kỳ hạn và lãi suất', `${opened.months} tháng - ${opened.rate.toFixed(1)}%/năm`],
              ['Loại tiền gửi', 'Lãi suất đặc biệt'],
              ['Ngày hiệu lực', formatDate(opened.openedAt.toISOString())],
              ['Ngày đến hạn', formatDate(opened.maturity.toISOString())],
            ].map(([label, value]) => (
              <span key={label} className="flex flex-col gap-0.5 pt-3">
                <span className="text-[13px] leading-[18px] text-muted">{label}</span>
                <span className="text-[15px] font-semibold leading-5 text-ink">{value}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="grid flex-none grid-cols-2 gap-3 px-4 pb-8 pt-3">
          <Button variant="outline" className="w-full font-semibold" onClick={() => navigate('/invest')}>
            Quản lý
          </Button>
          <Button className="w-full font-semibold" onClick={resetForNew}>
            Mở thêm
          </Button>
        </div>
      </>
    )
  }

  /* ---- Màn xác nhận — theo tk3, tone sáng ---- */
  if (phase === 'confirm') {
    return (
      <>
        <MobileHeader title="Xác nhận thông tin" onBack={() => setPhase('form')} />
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-1">
          <div className="flex items-center gap-2.5 rounded-card border border-info/30 bg-info/10 px-4 py-3 text-[13px] leading-[18px] text-info">
            <Info size={16} strokeWidth={1.8} className="flex-none" />
            Thông tin hiển thị theo giờ Việt Nam (GMT+7)
          </div>
          <div className="flex flex-col rounded-card bg-surface p-4 shadow-card">
            <span className="text-[13px] leading-[18px] text-muted">Số tiền gửi</span>
            <span className="pb-3 text-[24px] font-bold leading-8 text-ink">{vnd.format(amount)} VND</span>
            <div className="h-px bg-divider" />
            <span className="flex flex-col gap-0.5 pt-3">
              <span className="text-[13px] leading-[18px] text-muted">Tài khoản nguồn</span>
              <span className="text-[15px] font-bold uppercase leading-5 text-ink">{fullCustomerName(customer?.name)}</span>
              <span className="text-[13px] leading-[18px] text-muted">
                {fullAccountNumber(customer?.maskedAccount)} · Tài khoản thanh toán
              </span>
            </span>
            {[
              ['Loại tiền gửi', 'Lãi suất đặc biệt'],
              ['Kỳ hạn', `${term?.months} tháng`],
              ['Lãi suất', `${term?.rate.toFixed(1)}%/năm`],
              ['Lãi dự kiến cuối kỳ', `${vnd.format(expectedInterest)} VND`],
            ].map(([label, value]) => (
              <span key={label} className="flex flex-col gap-0.5 pt-3">
                <span className="text-[13px] leading-[18px] text-muted">{label}</span>
                <span className="text-[15px] font-semibold leading-5 text-ink">{value}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex-none px-4 pb-8 pt-2">
          <button type="button" onClick={() => setAgreed((v) => !v)} className="flex cursor-pointer items-start gap-2.5 pb-3 text-left">
            <span
              className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-[6px] border ${
                agreed ? 'border-primary bg-primary text-white' : 'border-line bg-surface'
              }`}
            >
              {agreed && <Check size={13} strokeWidth={3} />}
            </span>
            <span className="text-[13px] leading-[18px] text-ink">
              Tôi đã đọc, hiểu rõ và đồng ý với <span className="font-medium text-primary">Điều khoản & Điều kiện</span> của dịch vụ
            </span>
          </button>
          <Button className="w-full font-semibold" disabled={!agreed} onClick={() => setPhase('otp')}>
            Xác nhận
          </Button>
        </div>
      </>
    )
  }

  /* ---- Màn nhập thông tin — theo tk1, tone sáng ---- */
  return (
    <>
      <MobileHeader title="Mở tiền gửi lãi suất đặc biệt" backTo="/invest" />
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-1">
        <div className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-card">
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-semibold text-ink">Tài khoản nguồn</span>
            {accountBox}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-semibold text-ink">Số tiền</span>
            <label className="flex items-center gap-2.5 rounded-btn border border-line bg-app px-3.5 py-3 focus-within:border-primary">
              <input
                value={amountDigits ? vnd.format(amount) : ''}
                onChange={(e) => setAmountDigits(e.target.value.replace(/\D/g, '').slice(0, 12))}
                inputMode="numeric"
                placeholder="Nhập số tiền"
                aria-label="Số tiền gửi"
                className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted"
              />
              <span className="flex-none text-[15px] font-medium text-muted">VND</span>
            </label>
            {overBalance && <span className="text-[12px] leading-4 text-danger">Số tiền vượt quá số dư khả dụng</span>}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-semibold text-ink">Kỳ hạn và lãi suất</span>
            <button
              type="button"
              onClick={() => setTermSheetOpen(true)}
              className="flex cursor-pointer items-center gap-3 rounded-btn border border-line bg-app px-3.5 py-3 text-left"
            >
              <span className={`min-w-0 flex-1 text-[15px] ${term ? 'font-semibold text-ink' : 'text-muted'}`}>
                {term ? `${term.months} tháng - ${term.rate.toFixed(1)}%/năm` : 'Chọn kỳ hạn'}
              </span>
              <ChevronDown size={20} strokeWidth={1.8} className="flex-none text-muted" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
          <span className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
            Phương thức đến hạn
            <Info size={15} strokeWidth={1.8} className="text-muted" />
          </span>
          {MATURITY_OPTIONS.map((label, i) => (
            <button key={label} type="button" onClick={() => setMaturityOption(i)} className="flex cursor-pointer items-start gap-2.5 text-left">
              <span
                className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
                  maturityOption === i ? 'border-primary' : 'border-line'
                }`}
              >
                {maturityOption === i && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </span>
              <span className="text-[14px] leading-5 text-ink">{label}</span>
            </button>
          ))}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[15px] font-semibold text-ink">Tài khoản nhận</span>
            {accountBox}
          </div>
        </div>
      </div>

      <div className="flex-none px-4 pb-8 pt-3">
        <Button className="w-full font-semibold" disabled={!canContinue} onClick={() => setPhase('confirm')}>
          Tiếp tục
        </Button>
      </div>

      {/* Sheet chọn kỳ hạn — theo tk2 */}
      <Sheet open={termSheetOpen} onOpenChange={setTermSheetOpen}>
        <SheetContent container={container}>
          <div className="flex flex-col gap-1">
            <SheetTitle className="pb-2 text-lg font-semibold">Chọn kỳ hạn</SheetTitle>
            {TERMS.map((t, i) => (
              <button
                key={t.months}
                type="button"
                onClick={() => {
                  setTerm(t)
                  setTermSheetOpen(false)
                }}
                className={`flex cursor-pointer items-center justify-between py-3.5 text-left text-[16px] hover:bg-app ${
                  i > 0 ? 'border-t border-divider' : ''
                } ${term?.months === t.months ? 'font-semibold text-primary' : 'text-ink'}`}
              >
                {t.months} tháng - {t.rate.toFixed(1)}%/năm
                {term?.months === t.months && <Check size={18} strokeWidth={2.2} className="text-primary" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
