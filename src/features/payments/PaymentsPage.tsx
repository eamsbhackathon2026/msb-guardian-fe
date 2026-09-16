import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlarmClock, ChevronRight, Droplet, Globe, Phone, Search, Smartphone, Tv, X, Zap } from 'lucide-react'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

const blockVariants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' as const } }),
}

/** Lưới dịch vụ thanh toán — theo bố cục thanhtoan.jpg, tone sáng của app */
const services = [
  { icon: Zap, label: 'Điện' },
  { icon: Droplet, label: 'Nước' },
  { icon: Smartphone, label: 'Điện thoại di động' },
  { icon: Tv, label: 'Truyền hình' },
  { icon: Globe, label: 'Internet' },
  { icon: Phone, label: 'Điện thoại cố định' },
]

interface Biller {
  id: string
  provider: string
  tone: string
  name: string
  service: string
  code: string
}

const savedBillers: Biller[] = [
  { id: 's1', provider: 'FPT', tone: 'bg-info-soft text-info', name: 'PHAN THI KIM CHI', service: 'Internet', code: 'HNH787748' },
]

const recentBillers: Biller[] = [
  { id: 'r1', provider: 'EVN', tone: 'bg-orange-soft text-primary', name: 'NGUYEN VIET ANH', service: 'Điện', code: 'PE0400123456' },
  { id: 'r2', provider: 'FPT', tone: 'bg-info-soft text-info', name: 'PHAN THI KIM CHI', service: 'Internet', code: 'HNH787748' },
]

export function PaymentsPage() {
  const [tab, setTab] = useState<'saved' | 'recent'>('saved')
  const [query, setQuery] = useState('')

  const list = (tab === 'saved' ? savedBillers : recentBillers).filter((b) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q) || b.service.toLowerCase().includes(q)
  })

  return (
    <MobileFrame statusBar="dark">
      <MobileHeader title="Thanh toán và nạp tiền" backTo="/" />

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-2">
        {/* Lưới 2×3 dịch vụ + Thanh toán tự động */}
        <motion.div custom={0} variants={blockVariants} initial="hidden" animate="show" className="flex flex-col rounded-card bg-surface shadow-card">
          <div className="grid grid-cols-3 gap-y-1 px-2 py-3">
            {services.map((s) => {
              const Icon = s.icon
              return (
                <button key={s.label} type="button" className="flex cursor-pointer flex-col items-center gap-2 px-1 py-2.5 text-primary">
                  <Icon size={26} strokeWidth={1.5} />
                  <span className="text-center text-[13px] font-medium leading-[17px] text-ink">{s.label}</span>
                </button>
              )
            })}
          </div>
          <div className="mx-4 h-px bg-divider" />
          <button type="button" className="flex h-[52px] cursor-pointer items-center justify-center gap-2.5 text-primary">
            <AlarmClock size={21} strokeWidth={1.6} />
            <span className="text-[15px] font-semibold">Thanh toán tự động</span>
          </button>
        </motion.div>

        {/* Đã lưu / Gần đây + tìm kiếm */}
        <motion.div custom={1} variants={blockVariants} initial="hidden" animate="show" className="flex flex-col rounded-card bg-surface shadow-card">
          <div className="flex border-b border-divider">
            {(
              [
                { key: 'saved', label: 'Đã lưu' },
                { key: 'recent', label: 'Gần đây' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`relative flex-1 cursor-pointer py-3.5 text-center text-[15px] ${
                  tab === t.key ? 'font-semibold text-primary' : 'font-medium text-muted'
                }`}
              >
                {t.label}
                {tab === t.key && <span className="absolute inset-x-8 bottom-0 h-[3px] rounded-full bg-primary" />}
              </button>
            ))}
          </div>

          <div className="p-4 pb-2">
            <label className="flex items-center gap-2.5 rounded-full bg-app px-4 py-3 text-ink">
              <Search size={18} strokeWidth={1.7} className="flex-none text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tên, số hợp đồng, mã khách hàng"
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
              />
              {query && (
                <button type="button" aria-label="Xóa" onClick={() => setQuery('')} className="flex-none cursor-pointer text-muted">
                  <X size={16} strokeWidth={2} />
                </button>
              )}
            </label>
          </div>

          <div className="flex flex-col px-2 pb-2">
            {list.length === 0 && (
              <span className="py-6 text-center text-[13px] text-muted">
                {tab === 'saved' ? 'Chưa có hoá đơn nào được lưu' : 'Chưa có giao dịch gần đây'}
              </span>
            )}
            {list.map((b) => (
              <button key={b.id} type="button" className="flex cursor-pointer items-center gap-3 rounded-card px-2 py-3 text-left hover:bg-app">
                <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-[11px] font-bold ${b.tone}`}>{b.provider}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold leading-5">{b.name}</span>
                  <span className="block text-[13px] leading-[18px] text-muted">
                    {b.service} · {b.code}
                  </span>
                </span>
                <ChevronRight size={18} strokeWidth={1.6} className="flex-none text-muted" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </MobileFrame>
  )
}
