import { ShieldCheck } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { formatVnd } from '@/lib/format'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

interface ConfirmState {
  beneficiary?: { name: string; bank: string; account: string }
  amount?: number
  note?: string
  /** true khi tới đây từ màn cảnh báo Scam Shield (khách chọn "vẫn chuyển"). */
  afterReview?: boolean
  /** 'chat-banking' khi lệnh bắt nguồn từ chat — màn thành công quay lại chat */
  from?: string
}

/**
 * Màn xác nhận chuyển tiền. Tới đây theo hai đường:
 *  - stk quen (favorite) → thẳng từ màn nhập lệnh, không qua Scam Shield.
 *  - stk mới → sau khi Scam Shield cảnh báo và khách vẫn chọn tiếp tục.
 * "Xác nhận chuyển" → màn nhập mật khẩu (/transfer/pin) rồi mới hoàn tất.
 */
export function TransferConfirmPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as ConfirmState | null) ?? {}

  const amount = state.amount ?? 0
  const b = state.beneficiary

  return (
    <MobileFrame statusBar="dark">
      <MobileHeader title="Xác nhận chuyển tiền" backTo="/transfer" />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-2">
        {state.afterReview ? (
          <div className="flex items-start gap-2 rounded-card bg-warning-soft px-4 py-3 text-[13px] leading-[18px] text-ink">
            <ShieldCheck size={18} strokeWidth={1.8} className="mt-0.5 flex-none text-warning" />
            Bạn đã xem cảnh báo Scam Shield và chọn tiếp tục. Hãy chắc chắn bạn tin tưởng người nhận.
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-card bg-success-soft px-4 py-3 text-[13px] leading-[18px] text-success-deep">
            <ShieldCheck size={18} strokeWidth={1.8} className="flex-none" />
            Người nhận nằm trong danh bạ tin cậy — không cần kiểm tra Scam Shield.
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
          <Row label="Người nhận" value={b?.name ?? '—'} />
          <Row label="Ngân hàng" value={`${b?.bank ?? ''} · ${b?.account ?? ''}`} />
          <div className="h-px bg-divider" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted">Số tiền</span>
            <span className="text-[22px] font-bold text-primary">{formatVnd(amount)}</span>
          </div>
          {state.note && <Row label="Nội dung" value={state.note} />}
        </div>
      </div>

      <div className="flex-none border-t border-line bg-surface px-4 py-3">
        <Button className="w-full" onClick={() => navigate('/transfer/pin', { state: { beneficiary: b, amount, note: state.note, from: state.from } })}>
          Xác nhận chuyển
        </Button>
      </div>
    </MobileFrame>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="max-w-[62%] text-right text-[15px] font-semibold text-ink">{value}</span>
    </div>
  )
}
