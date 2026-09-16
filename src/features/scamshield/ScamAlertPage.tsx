import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CircleAlert, Flag, LoaderCircle, ShieldAlert, ShieldCheck, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { demoBeneficiary, demoScamAmount } from '@/data/demo-scenarios'
import { assessRisk } from '@/lib/api'
import { formatVnd } from '@/lib/format'
import { useGuardianStore } from '@/lib/store'
import { MobileFrame, usePhoneContainer } from '@/shell/MobileFrame'
import { RiskGauge } from './RiskGauge'

export function ScamAlertPage() {
  return (
    <MobileFrame screenClassName="bg-danger-soft">
      <ScamAlertInner />
    </MobileFrame>
  )
}

function AnalyzingState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8">
      <LoaderCircle size={44} strokeWidth={1.6} className="animate-spin text-primary" />
      <span className="text-[15px] font-medium text-muted">Đang phân tích giao dịch...</span>
      <span className="text-center text-[13px] text-muted">Scam Shield kiểm tra người nhận, lịch sử và mẫu hành vi giao dịch.</span>
    </div>
  )
}

function ProtectedState({ onDone }: { onDone: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-1 flex-col items-center justify-center gap-4 px-8">
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-success"
      >
        <ShieldCheck size={40} strokeWidth={1.6} />
      </motion.span>
      <span className="text-center text-[22px] font-semibold leading-7">Bạn đã được bảo vệ</span>
      <span className="text-center text-sm leading-5 text-muted">Giao dịch đã được huỷ. Số tiền được giữ lại an toàn trong tài khoản của bạn:</span>
      <span className="text-[32px] font-bold text-success">{formatVnd(demoScamAmount)}</span>
      <span className="text-center text-[13px] text-muted">Chúng tôi đã ghi nhận tài khoản đáng ngờ và chia sẻ (ẩn danh) tới hệ thống cảnh báo cộng đồng.</span>
      <Button className="mt-2 w-full" onClick={onDone}>
        Về Trung tâm an toàn
      </Button>
    </motion.div>
  )
}

function ScamAlertInner() {
  const navigate = useNavigate()
  const container = usePhoneContainer()
  const setShieldOutcome = useGuardianStore((s) => s.setShieldOutcome)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [understood, setUnderstood] = useState(false)
  const [phase, setPhase] = useState<'alert' | 'protected'>('alert')

  const { data: assessment, isPending } = useQuery({
    queryKey: ['risk-assess'],
    queryFn: () => assessRisk({ amount: demoScamAmount }),
  })

  const topSignals = assessment?.signals.slice(0, 3) ?? []

  function cancelTransfer() {
    setShieldOutcome('cancelled')
    setPhase('protected')
  }

  if (isPending) return <AnalyzingState />
  if (phase === 'protected') return <ProtectedState onDone={() => navigate('/safety-center')} />

  return (
    <>
      {/* Viền mạch đập chậm, không chói */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 rounded-[44px]"
        animate={{ boxShadow: ['inset 0 0 0 0px rgba(220,38,38,0)', 'inset 0 0 0 4px rgba(220,38,38,.28)', 'inset 0 0 0 0px rgba(220,38,38,0)'] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="flex flex-none items-center justify-between px-4 pt-1">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[.04em] text-danger-deep">
          <ShieldAlert size={14} strokeWidth={2} />
          Scam Shield · Chuyển tiền
        </span>
        <button type="button" aria-label="Đóng" onClick={() => navigate('/')} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full hover:bg-black/5">
          <X size={20} strokeWidth={1.6} />
        </button>
      </div>

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto px-5 pb-3">
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 16 }}
          className="mt-1 flex h-[72px] w-[72px] flex-none items-center justify-center rounded-full bg-surface text-danger shadow-raised"
        >
          <ShieldAlert size={36} strokeWidth={1.5} />
        </motion.span>
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-center text-[22px] font-semibold leading-7">Giao dịch có dấu hiệu lừa đảo</h1>
          <p className="text-center text-sm leading-5 text-muted">Chúng tôi đã tạm dừng lệnh chuyển để bạn kiểm tra lại. Tiền vẫn an toàn trong tài khoản.</p>
        </div>

        {assessment && <RiskGauge score={assessment.score} levelLabel="Rủi ro cao" />}

        {/* Card thông tin giao dịch */}
        <div className="flex w-full items-center justify-between rounded-card bg-surface p-4 shadow-card">
          <span className="flex flex-col gap-0.5">
            <span className="text-[13px] text-muted">Chuyển đến</span>
            <span className="text-[15px] font-semibold">{demoBeneficiary.holderName}</span>
            <span className="text-[13px] text-muted">
              {demoBeneficiary.bankName} · {demoBeneficiary.accountNo}
            </span>
          </span>
          <span className="flex flex-col items-end gap-0.5">
            <span className="text-[13px] text-muted">Số tiền</span>
            <span className="text-xl font-bold">{formatVnd(demoScamAmount)}</span>
          </span>
        </div>

        {/* 3 dấu hiệu chính — vào lần lượt cách nhau 120ms */}
        <div className="flex w-full flex-col gap-2.5 rounded-card bg-surface p-4 shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">3 dấu hiệu chính</span>
          {topSignals.map((sig, i) => (
            <motion.span
              key={sig.id}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.3 }}
              className="flex items-start gap-2.5 text-sm leading-5"
            >
              <CircleAlert size={17} strokeWidth={1.8} className="mt-0.5 flex-none text-danger" />
              {sig.label}
            </motion.span>
          ))}
          <Link to="/transfer/review/why" className="pt-0.5 text-sm font-medium text-primary">
            Vì sao chúng tôi cảnh báo? →
          </Link>
        </div>
      </div>

      {/* 3 nút hành động */}
      <div className="flex flex-none flex-col gap-2.5 px-5 pb-8 pt-1">
        <Button className="w-full" onClick={cancelTransfer}>
          Huỷ giao dịch
        </Button>
        <Button variant="secondary" className="w-full font-medium" onClick={() => setConfirmOpen(true)}>
          Tôi vẫn muốn chuyển
        </Button>
        <Button
          variant="dangerText"
          size="md"
          className="w-full font-semibold"
          onClick={() => {
            setShieldOutcome('reported')
            navigate('/safety-center')
          }}
        >
          <Flag size={16} strokeWidth={1.8} />
          Báo cáo lừa đảo
        </Button>
      </div>

      {/* Xác nhận lần hai — không chặn cứng, người dùng luôn có quyền quyết định */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) setUnderstood(false)
        }}
      >
        <DialogContent container={container}>
          <div className="flex flex-col gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
              <ShieldAlert size={24} strokeWidth={1.7} />
            </span>
            <DialogTitle className="text-lg font-semibold leading-6">Bạn có chắc chắn muốn tiếp tục?</DialogTitle>
            <DialogDescription className="text-sm leading-5 text-muted">
              87/100 điểm rủi ro — mức rất cao. Trong các vụ tương tự, <b className="text-danger">tiền đã chuyển gần như không thể thu hồi</b>. MSB sẽ không thể hoàn tiền nếu đây là lừa đảo.
            </DialogDescription>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-app p-3 text-sm leading-5">
              <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[color:var(--msb-danger)]" />
              Tôi hiểu rủi ro và tự chịu trách nhiệm với giao dịch này
            </label>
            <div className="flex flex-col gap-2">
              <Button className="w-full" onClick={() => setConfirmOpen(false)}>
                Quay lại — huỷ giao dịch
              </Button>
              <Button
                variant="outline"
                className="w-full font-medium text-muted"
                disabled={!understood}
                onClick={() => {
                  setShieldOutcome('proceeded')
                  setConfirmOpen(false)
                  navigate('/safety-center')
                }}
              >
                Vẫn tiếp tục chuyển
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
