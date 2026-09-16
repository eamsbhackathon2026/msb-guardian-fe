import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight, ChevronRight, CirclePlus, CreditCard, Lock, Wifi } from 'lucide-react'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

const blockVariants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' as const } }),
}

interface BankCard {
  id: string
  name: string
  kind: string
  last4: string
  available: number
  limit: number
  network: 'visa' | 'mastercard'
}

type TabKey = 'credit' | 'multi' | 'debit'

const cardsByTab: Record<TabKey, BankCard[]> = {
  credit: [{ id: 'c1', name: 'MSB Visa Online', kind: 'Thẻ vật lý', last4: '7042', available: 80_000_000, limit: 80_000_000, network: 'visa' }],
  multi: [],
  debit: [{ id: 'd1', name: 'M-First Mastercard', kind: 'Thẻ vật lý', last4: '3151', available: 12_500_000, limit: 50_000_000, network: 'mastercard' }],
}

const tabs: { key: TabKey; label: string }[] = [
  { key: 'credit', label: `Tín dụng (4)` },
  { key: 'multi', label: 'Đa năng' },
  { key: 'debit', label: `Ghi nợ (2)` },
]

const vnd = new Intl.NumberFormat('en-US')

/** Hình thẻ vật lý — gradient cam MSB, chip + contactless + logo tổ chức thẻ */
function CardVisual({ card }: { card: BankCard }) {
  return (
    <div
      className="relative flex aspect-[1.62] w-full flex-col justify-between overflow-hidden rounded-[16px] p-4"
      style={{ background: 'radial-gradient(120% 160% at 85% 30%, #ff9b3f 0%, #f4581f 45%, #e03410 100%)' }}
    >
      <div className="flex items-center justify-between">
        <img src="/assets/msb-logo-white.png" alt="MSB" className="h-6 w-auto" />
        <span className="flex items-center gap-2.5 text-white">
          <span className="text-[13px] font-medium text-white/90">online</span>
          <Wifi size={18} strokeWidth={2} className="rotate-90" />
        </span>
      </div>
      <span className="block h-8 w-11 rounded-[6px] border border-[#b98a2e]/60" style={{ background: 'linear-gradient(135deg, #f3d27a, #d9a93f)' }} />
      <div className="flex items-end justify-between">
        <span className="text-[13px] font-medium tracking-[.14em] text-white/85">•••• {card.last4}</span>
        {card.network === 'visa' ? (
          <span className="text-[24px] font-extrabold italic tracking-tight text-white">VISA</span>
        ) : (
          <span className="flex">
            <span className="h-7 w-7 rounded-full bg-[#eb001b]" />
            <span className="-ml-3 h-7 w-7 rounded-full bg-[#f79e1b]/90" />
          </span>
        )}
      </div>
    </div>
  )
}

/** Màn Thẻ — theo bố cục the.jpg, tone sáng đồng bộ app */
export function CardsPage() {
  const [tab, setTab] = useState<TabKey>('credit')
  const cards = cardsByTab[tab]
  const card = cards[0]

  return (
    <MobileFrame statusBar="dark">
      <MobileHeader
        title="Thẻ"
        backTo="/"
        right={
          <button type="button" className="flex cursor-pointer items-center gap-1.5 px-2 text-[14px] font-semibold text-primary">
            <CirclePlus size={18} strokeWidth={1.8} />
            Mở thẻ
          </button>
        }
      />

      {/* Tab loại thẻ */}
      <div className="flex flex-none border-b border-divider px-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`relative flex-1 cursor-pointer py-3 text-center text-[15px] ${
              tab === t.key ? 'font-semibold text-primary' : 'font-medium text-muted'
            }`}
          >
            {t.label}
            {tab === t.key && <span className="absolute inset-x-6 bottom-0 h-[3px] rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-4">
        {!card && (
          <motion.div custom={0} variants={blockVariants} initial="hidden" animate="show" className="flex flex-col items-center gap-3 rounded-card bg-surface p-8 shadow-card">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-soft text-primary">
              <CreditCard size={26} strokeWidth={1.5} />
            </span>
            <span className="text-center text-[14px] leading-5 text-muted">Bạn chưa có thẻ đa năng.
              <br />Mở thẻ ngay để trải nghiệm.</span>
            <button type="button" className="flex h-11 cursor-pointer items-center gap-2 rounded-btn bg-primary px-5 text-[15px] font-semibold text-white">
              <CirclePlus size={18} strokeWidth={1.8} />
              Mở thẻ
            </button>
          </motion.div>
        )}

        {card && (
          <motion.div custom={0} variants={blockVariants} initial="hidden" animate="show" className="flex flex-col rounded-card bg-surface p-4 shadow-card">
            <CardVisual card={card} />

            {/* Tên thẻ + số cuối */}
            <div className="flex items-center gap-3 pt-3.5">
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-bold leading-[22px] text-ink">{card.name}</span>
                <span className="block text-[13px] leading-[18px] text-muted">
                  {card.kind} | •••• {card.last4}
                </span>
              </span>
              <button type="button" aria-label="Chi tiết thẻ" className="flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-full border border-divider text-muted">
                <ChevronRight size={18} strokeWidth={1.8} />
              </button>
            </div>

            <div className="my-3.5 h-px bg-divider" />

            {/* Khả dụng / Hạn mức */}
            <div className="flex items-center justify-between">
              <span>
                <span className="block text-[13px] leading-[18px] text-muted">Khả dụng</span>
                <span className="block text-[16px] font-bold leading-[22px] text-ink">{vnd.format(card.available)} VND</span>
              </span>
              <span className="text-right">
                <span className="block text-[13px] leading-[18px] text-muted">Hạn mức thẻ</span>
                <span className="block text-[16px] font-bold leading-[22px] text-ink">{vnd.format(card.limit)} VND</span>
              </span>
            </div>

            <div className="my-3.5 h-px bg-divider" />

            {/* 3 thao tác nhanh */}
            <div className="grid grid-cols-3">
              {[
                { icon: Lock, label: 'Khoá thẻ' },
                { icon: ArrowLeftRight, label: 'Thanh toán thẻ' },
                { icon: CreditCard, label: 'Xem thông tin thẻ' },
              ].map((a) => {
                const Icon = a.icon
                return (
                  <button key={a.label} type="button" className="flex cursor-pointer flex-col items-center gap-2 px-1 py-1.5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-orange-soft text-primary">
                      <Icon size={21} strokeWidth={1.6} />
                    </span>
                    <span className="text-center text-[12px] font-medium leading-4 text-ink">{a.label}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Chấm phân trang */}
        <div className="flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-primary" />
          <span className="h-1.5 w-1.5 rounded-full bg-line" />
          <span className="h-1.5 w-1.5 rounded-full bg-line" />
          <span className="h-1.5 w-1.5 rounded-full bg-line" />
        </div>

        {/* Banner ưu đãi thẻ */}
        <motion.div custom={1} variants={blockVariants} initial="hidden" animate="show" className="overflow-hidden rounded-card shadow-card">
          <img src="/assets/banner-mfirst.png" alt="Ưu đãi thẻ M-First" className="block h-auto w-full" />
        </motion.div>
      </div>
    </MobileFrame>
  )
}
