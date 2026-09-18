import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ChevronDown, Delete, Globe, House, Info, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { getSessionCustomer } from '@/lib/api'
import { formatDate, formatTime, fullAccountNumber, fullCustomerName } from '@/lib/format'
import { useGuardianStore } from '@/lib/store'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

const vnd = new Intl.NumberFormat('en-US')

/** Hóa đơn Internet FPT GIẢ LẬP — màn thanh toán demo, không gọi backend.
 *  Mã khách hàng và chủ hợp đồng khớp với biller FPT đã lưu ở màn Thanh toán.
 *  Export cho Copilot chat nhắc "còn nợ hóa đơn Internet" với đúng con số. */
export const FPT_BILL = {
  provider: 'FPT Telecom',
  service: 'Internet',
  customerCode: 'HNH787748',
  holderName: 'PHAN THI KIM CHI',
  plan: 'Giga 150Mbps',
  amount: 330_000,
}

/** Kỳ cước là tháng hiện tại — hóa đơn giả lập luôn "vừa phát hành". */
export function billPeriod(): string {
  const now = new Date()
  return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`
}

const OTP_LENGTH = 6
const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

/** Giao dịch vừa thanh toán — dựng lúc bấm xác nhận, hiển thị ở màn thành công */
interface PaidBill {
  transactionId: string
  paidAt: Date
}

export function PayBillPage() {
  return (
    <MobileFrame statusBar="dark">
      <PayBillInner />
    </MobileFrame>
  )
}

/** Luồng thanh toán hóa đơn 3 bước, cùng nhịp với màn mở tiền gửi: chi tiết
 *  hóa đơn (kiêm xác nhận) → OTP → xử lý (logo M xoay) → thành công. */
function PayBillInner() {
  const navigate = useNavigate()
  const pushNotification = useGuardianStore((s) => s.pushNotification)
  const { data: customer } = useQuery({ queryKey: ['session-customer'], queryFn: getSessionCustomer })

  const [phase, setPhase] = useState<'detail' | 'otp' | 'processing' | 'done'>('detail')
  const [otp, setOtp] = useState('')
  const [paid, setPaid] = useState<PaidBill | null>(null)

  const balance = customer?.balance ?? 0

  function confirmPay() {
    const paidAt = new Date()
    setPaid({ transactionId: `FT${String(paidAt.getTime()).slice(-8)}`, paidAt })
    pushNotification({
      id: `noti-bill-${paidAt.getTime()}`,
      title: `Thanh toán hóa đơn Internet FPT ${vnd.format(FPT_BILL.amount)} VND thành công`,
      timeLabel: `Hôm nay · ${formatTime(paidAt.toISOString())}`,
    })
    setPhase('done')
  }

  /** Bàn phím OTP — đủ 6 số thì sang màn xử lý rồi hoàn tất */
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
      setTimeout(confirmPay, 1000)
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
        <span className="text-[15px] font-medium text-muted">Đang thanh toán…</span>
      </div>
    )
  }

  /* ---- Màn xác thực OTP — cùng kiểu bàn phím với màn chuyển tiền ---- */
  if (phase === 'otp') {
    return (
      <>
        <MobileHeader title="Xác thực giao dịch" onBack={() => { setOtp(''); setPhase('detail') }} />
        <div className="flex min-h-0 flex-1 flex-col items-center px-6 pt-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-soft text-primary">
            <Lock size={26} strokeWidth={1.6} />
          </span>
          <span className="mt-3 text-[17px] font-semibold">Nhập mã OTP</span>
          <span className="mt-1 text-center text-[13px] leading-[18px] text-muted">
            Mã xác thực đã gửi tới số điện thoại của anh — thanh toán hóa đơn Internet FPT {vnd.format(FPT_BILL.amount)} VND
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
                <span className="block text-[16px] font-bold leading-[22px] text-success">Thanh toán thành công</span>
                <span className="block text-[22px] font-bold leading-7 text-ink">{vnd.format(FPT_BILL.amount)} VND</span>
                <span className="block text-[12px] leading-[17px] text-muted">
                  {formatTime(paid.paidAt.toISOString())} - {formatDate(paid.paidAt.toISOString())}
                </span>
              </span>
            </div>
            <div className="h-px bg-divider" />
            {[
              ['Mã giao dịch', paid.transactionId],
              ['Nhà cung cấp', `${FPT_BILL.provider} · ${FPT_BILL.service}`],
              ['Mã khách hàng', FPT_BILL.customerCode],
              ['Chủ hợp đồng', FPT_BILL.holderName],
              ['Kỳ cước', billPeriod()],
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
          <Button variant="outline" className="w-full font-semibold" onClick={() => navigate('/payments')}>
            Thanh toán khác
          </Button>
          <Button className="w-full font-semibold" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        </div>
      </>
    )
  }

  /* ---- Màn chi tiết hóa đơn (kiêm xác nhận) ---- */
  return (
    <>
      <MobileHeader title="Thanh toán Internet" backTo="/payments" />
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-1">
        <div className="flex items-center gap-2.5 rounded-card border border-info/30 bg-info/10 px-4 py-3 text-[13px] leading-[18px] text-info">
          <Info size={16} strokeWidth={1.8} className="flex-none" />
          Hóa đơn được tra cứu tự động từ nhà cung cấp
        </div>

        {/* Hóa đơn FPT */}
        <div className="flex flex-col rounded-card bg-surface p-4 shadow-card">
          <div className="flex items-center gap-3 pb-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-info-soft text-[12px] font-bold text-info">FPT</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold leading-5 text-ink">{FPT_BILL.provider}</span>
              <span className="flex items-center gap-1 text-[13px] leading-[18px] text-muted">
                <Globe size={13} strokeWidth={1.8} />
                {FPT_BILL.service} · {FPT_BILL.plan}
              </span>
            </span>
          </div>
          <div className="h-px bg-divider" />
          {[
            ['Mã khách hàng', FPT_BILL.customerCode],
            ['Chủ hợp đồng', FPT_BILL.holderName],
            ['Kỳ cước', billPeriod()],
            ['Phí giao dịch', 'Miễn phí'],
          ].map(([label, value]) => (
            <span key={label} className="flex flex-col gap-0.5 pt-3">
              <span className="text-[13px] leading-[18px] text-muted">{label}</span>
              <span className="text-[15px] font-semibold leading-5 text-ink">{value}</span>
            </span>
          ))}
          <span className="flex flex-col gap-0.5 pt-3">
            <span className="text-[13px] leading-[18px] text-muted">Số tiền thanh toán</span>
            <span className="text-[24px] font-bold leading-8 text-ink">{vnd.format(FPT_BILL.amount)} VND</span>
          </span>
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
        <Button className="w-full font-semibold" onClick={() => setPhase('otp')}>
          Thanh toán
        </Button>
      </div>
    </>
  )
}
