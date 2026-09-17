import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Delete, Lock } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { formatTime, formatVnd } from '@/lib/format'
import { useGuardianStore } from '@/lib/store'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

interface PinState {
  beneficiary?: { name: string; bank: string; account: string }
  amount?: number
  note?: string
}

const PIN_LENGTH = 6
const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

/**
 * Xác thực giao dịch bằng mật khẩu 6 số (demo: nhận mọi mã). Đủ 6 số → logo M
 * quay 1 giây → màn thành công; lúc đó mới ghi lịch sử + phát thông báo, nên
 * thoát giữa chừng không để lại giao dịch ảo.
 */
export function TransferPinPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as PinState | null) ?? {}
  const { addTransaction, pushNotification } = useGuardianStore()

  const [pin, setPin] = useState('')
  const [phase, setPhase] = useState<'pin' | 'processing' | 'done'>('pin')

  const amount = state.amount ?? 0
  const b = state.beneficiary

  function complete() {
    const now = new Date()
    const iso = now.toISOString()
    addTransaction({
      id: `tx-${now.getTime()}`,
      datetime: iso,
      name: b?.name ?? '—',
      bank: b?.bank ?? '',
      account: b?.account ?? '',
      amount,
      note: state.note,
    })
    pushNotification({
      id: `noti-${now.getTime()}`,
      title: `Biến động số dư: -${formatVnd(amount)} đến ${b?.name ?? 'người nhận'}`,
      timeLabel: `Hôm nay · ${formatTime(iso)}`,
    })
    setPhase('done')
  }

  function press(key: (typeof keypad)[number]) {
    if (phase !== 'pin' || key === '') return
    if (key === 'del') {
      setPin((p) => p.slice(0, -1))
      return
    }
    const next = (pin + key).slice(0, PIN_LENGTH)
    setPin(next)
    if (next.length === PIN_LENGTH) {
      setPhase('processing')
      setTimeout(complete, 1000)
    }
  }

  if (phase === 'processing') {
    return (
      <MobileFrame statusBar="dark">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <motion.img
            src="/assets/icon-logo-msb.png"
            alt="MSB"
            className="h-14 w-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          />
          <span className="text-[15px] font-medium text-muted">Đang xử lý giao dịch…</span>
        </div>
      </MobileFrame>
    )
  }

  if (phase === 'done') {
    return (
      <MobileFrame statusBar="dark">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8">
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-success"
          >
            <CheckCircle2 size={40} strokeWidth={1.6} />
          </motion.span>
          <span className="text-center text-[22px] font-semibold leading-7">Chuyển tiền thành công</span>
          <span className="text-[30px] font-bold text-ink">{formatVnd(amount)}</span>
          {b && (
            <span className="text-center text-[13px] text-muted">
              tới {b.name} · {b.bank} {b.account}
            </span>
          )}
          <Button className="mt-2 w-full" onClick={() => navigate('/')}>Về trang chủ</Button>
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="cursor-pointer text-[14px] font-medium text-primary underline-offset-2 hover:underline"
          >
            Xem lịch sử giao dịch
          </button>
        </div>
      </MobileFrame>
    )
  }

  return (
    <MobileFrame statusBar="dark">
      <MobileHeader title="Xác thực giao dịch" />
      <div className="flex min-h-0 flex-1 flex-col items-center px-6 pt-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-soft text-primary">
          <Lock size={26} strokeWidth={1.6} />
        </span>
        <span className="mt-3 text-[17px] font-semibold">Nhập mật khẩu chuyển tiền</span>
        <span className="mt-1 text-center text-[13px] leading-[18px] text-muted">
          Chuyển {formatVnd(amount)} tới {b?.name ?? '—'}
        </span>

        {/* 6 chấm PIN */}
        <div className="mt-6 flex gap-3">
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <span key={i} className={`h-3.5 w-3.5 rounded-full border ${i < pin.length ? 'border-primary bg-primary' : 'border-line bg-transparent'}`} />
          ))}
        </div>
      </div>

      {/* Bàn phím số */}
      <div className="grid flex-none grid-cols-3 gap-2 px-6 pb-8">
        {keypad.map((k, i) => (
          <button
            key={i}
            type="button"
            disabled={k === ''}
            aria-label={k === 'del' ? 'Xóa' : k}
            onClick={() => press(k)}
            className={`flex h-14 items-center justify-center rounded-card text-[22px] font-semibold text-ink ${
              k === '' ? '' : 'cursor-pointer bg-app active:bg-orange-soft'
            }`}
          >
            {k === 'del' ? <Delete size={24} strokeWidth={1.6} /> : k}
          </button>
        ))}
      </div>
    </MobileFrame>
  )
}
