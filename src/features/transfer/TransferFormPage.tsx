import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, House, Info, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Switch } from '@/components/ui/switch'
import { getSessionCustomer } from '@/lib/api'
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
  // Chat Banking gửi kèm số tiền đã hiểu từ câu chat để form điền sẵn
  const state = (location.state as { beneficiary?: Beneficiary; amount?: number } | null) ?? {}
  const beneficiary: Beneficiary = state.beneficiary ?? favoriteBeneficiaries[0]

  const { data: customer } = useQuery({ queryKey: ['session-customer'], queryFn: getSessionCustomer })

  const [amountDigits, setAmountDigits] = useState(state.amount && state.amount > 0 ? String(Math.floor(state.amount)) : '')
  const [note, setNote] = useState('NGUYEN VIET ANH chuyen tien')
  const [scheduled, setScheduled] = useState(false)
  const [amountFocused, setAmountFocused] = useState(false)

  const canContinue = amountDigits.length > 0 && Number(amountDigits) > 0

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

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-2">
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
                onBlur={() => setAmountFocused(false)}
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
          </div>

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
          disabled={!canContinue}
          onClick={() => navigate('/transfer/review')}
          className={`flex h-12 flex-none cursor-pointer items-center justify-center rounded-btn text-base font-semibold transition-colors ${
            canContinue ? 'bg-primary text-white active:scale-[.99]' : 'cursor-default bg-line text-muted'
          }`}
        >
          Tiếp tục
        </button>
      </div>
    </MobileFrame>
  )
}
