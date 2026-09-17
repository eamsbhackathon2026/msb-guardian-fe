import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, Landmark, Loader2, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'
import { lookupAccountHolder } from '@/lib/mock-account-lookup'

/** Ngân hàng phổ biến — value là mã ngân hàng dùng cho precheck. */
const BANKS: { code: string; label: string }[] = [
  { code: 'MSB', label: 'MSB — Ngân hàng Hàng Hải' },
  { code: 'VCB', label: 'Vietcombank' },
  { code: 'ACB', label: 'ACB — Á Châu' },
  { code: 'TCB', label: 'Techcombank' },
  { code: 'MBB', label: 'MB Bank' },
  { code: 'BIDV', label: 'BIDV' },
  { code: 'VPB', label: 'VPBank' },
  { code: 'VTB', label: 'VietinBank' },
]

/**
 * Nhập số tài khoản người nhận MỚI (không chọn từ danh bạ). Vì là stk mới nên
 * luôn đi qua Scam Shield: màn này chỉ thu ngân hàng + số tài khoản rồi chuyển
 * sang màn nhập lệnh (/transfer/new) với beneficiary trusted=false — nút "Tiếp
 * tục" ở đó sẽ gọi precheck để agent Scam Shield kiểm tra.
 */
export function NewAccountPage() {
  const navigate = useNavigate()
  const [bank, setBank] = useState(BANKS[0])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [account, setAccount] = useState('')
  // Tên chủ tài khoản do GIẢ LẬP tra cứu trả về (xem lib/mock-account-lookup).
  const [holderName, setHolderName] = useState('')
  const [looking, setLooking] = useState(false)

  const accountDigits = account.replace(/\D/g, '')
  const canLookup = accountDigits.length >= 6

  // Đủ 6 số là tra cứu tên như inquiry Napas: đợi 400ms cho khách gõ xong,
  // đổi ngân hàng hoặc sửa số thì huỷ kết quả cũ và tra lại.
  useEffect(() => {
    setHolderName('')
    if (!canLookup) {
      setLooking(false)
      return
    }
    setLooking(true)
    let cancelled = false
    const timer = setTimeout(() => {
      lookupAccountHolder(bank.code, accountDigits).then((name) => {
        if (cancelled) return
        setHolderName(name)
        setLooking(false)
      })
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [bank.code, accountDigits, canLookup])

  const canContinue = canLookup && holderName !== ''

  function onContinue() {
    if (!canContinue) return
    navigate('/transfer/new', {
      state: {
        beneficiary: {
          id: `new-${accountDigits}`,
          name: holderName,
          bank: bank.code,
          account: accountDigits,
          bankCode: bank.code,
          trusted: false,
        },
      },
    })
  }

  return (
    <MobileFrame statusBar="dark">
      <MobileHeader title="Chuyển tới số tài khoản" backTo="/transfer" />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-2">
        <div className="flex items-start gap-2 rounded-card bg-orange-soft px-4 py-3 text-[13px] leading-[18px] text-ink">
          <Landmark size={18} strokeWidth={1.8} className="mt-0.5 flex-none text-primary" />
          Số tài khoản mới sẽ được Scam Shield kiểm tra dấu hiệu lừa đảo trước khi chuyển.
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-card">
          {/* Ngân hàng */}
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-semibold text-ink">Ngân hàng nhận</span>
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="flex cursor-pointer items-center gap-3 rounded-btn border border-line bg-app px-3.5 py-3 text-left"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-orange-soft text-[11px] font-bold text-primary">
                {bank.code}
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-medium text-ink">{bank.label}</span>
              <ChevronDown size={20} strokeWidth={1.8} className={`flex-none text-muted transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
            </button>
            {pickerOpen && (
              <div className="flex flex-col overflow-hidden rounded-btn border border-line">
                {BANKS.map((b) => (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => {
                      setBank(b)
                      setPickerOpen(false)
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-left text-[14px] hover:bg-app ${b.code === bank.code ? 'font-semibold text-primary' : 'text-ink'}`}
                  >
                    {b.label}
                    {b.code === bank.code && <Check size={16} strokeWidth={2.2} className="text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Số tài khoản */}
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-semibold text-ink">Số tài khoản</span>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value.replace(/[^\d\s]/g, '').slice(0, 24))}
              inputMode="numeric"
              placeholder="Nhập số tài khoản người nhận"
              aria-label="Số tài khoản"
              className="rounded-btn border border-line bg-app px-3.5 py-3 text-[16px] font-semibold tracking-wide text-ink outline-none placeholder:font-normal placeholder:text-muted focus:border-primary"
            />
          </div>

          {/* Tên người thụ hưởng — giả lập tra cứu tự động theo ngân hàng + stk */}
          {(looking || holderName) && (
            <div className="flex flex-col gap-2">
              <span className="text-[15px] font-semibold text-ink">Tên người thụ hưởng</span>
              {looking ? (
                <div className="flex items-center gap-2.5 rounded-btn border border-line bg-app px-3.5 py-3 text-[14px] text-muted">
                  <Loader2 size={18} strokeWidth={1.8} className="animate-spin text-primary" />
                  Đang tra cứu tên chủ tài khoản...
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 rounded-btn border border-primary/40 bg-orange-soft px-3.5 py-3"
                >
                  <UserRound size={18} strokeWidth={1.8} className="flex-none text-primary" />
                  <span className="text-[16px] font-bold uppercase tracking-wide text-ink">{holderName}</span>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <div className="flex-none border-t border-line bg-surface px-4 py-3">
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={`flex h-12 w-full items-center justify-center rounded-btn text-base font-semibold ${
            canContinue ? 'bg-primary text-white active:scale-[.99]' : 'cursor-default bg-line text-muted'
          }`}
        >
          Tiếp tục
        </button>
      </div>
    </MobileFrame>
  )
}
