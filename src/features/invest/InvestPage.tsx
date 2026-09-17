import { motion } from 'framer-motion'
import { ArrowLeftRight, Calculator, CirclePlus, Coins, Lightbulb, Percent, PiggyBank, ScrollText, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

const blockVariants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' as const } }),
}

/** 4 lối tắt của trợ lý đầu tư — theo bố cục dautu.jpg; to là đường dẫn nếu đã có màn */
const assistantActions: { icon: LucideIcon; label: string; to?: string }[] = [
  { icon: Lightbulb, label: 'Gợi ý sản phẩm' },
  { icon: ArrowLeftRight, label: 'So sánh sản phẩm' },
  { icon: Percent, label: 'Biểu lãi suất', to: '/invest/rates' },
  { icon: Calculator, label: 'Tính thử lợi nhuận' },
]

interface Product {
  id: string
  icon: LucideIcon
  name: string
  rate: string
  desc: string
  cta: string
  /** Đường dẫn của luồng mở sản phẩm nếu đã có màn */
  to?: string
}

const products: Product[] = [
  {
    id: 'm-sinh-loi',
    icon: Coins,
    name: 'M - Sinh lời',
    rate: '4.0%',
    desc: 'Giải pháp tài chính thông minh, giúp dòng tiền trong tài khoản sinh lời liên tục mỗi ngày.',
    cta: 'Sinh lời ngay',
  },
  {
    id: 'chung-chi-tien-gui',
    icon: ScrollText,
    name: 'Chứng chỉ tiền gửi',
    rate: '7.6%',
    desc: 'Sinh lời linh hoạt từ 11 triệu đồng, tối ưu dòng tiền với lợi nhuận theo ngày hấp dẫn.',
    cta: 'Sở hữu ngay',
  },
  {
    id: 'tien-gui-dac-biet',
    icon: PiggyBank,
    name: 'Tiền gửi lãi suất đặc biệt',
    rate: '7.5%',
    desc: 'Ưu đãi lãi suất vượt trội cho khoản tiền gửi lớn, kỳ hạn linh hoạt theo nhu cầu.',
    cta: 'Gửi tiền ngay',
    to: '/invest/open',
  },
]

export function InvestPage() {
  const navigate = useNavigate()
  return (
    <MobileFrame statusBar="dark">
      <MobileHeader title="Khám phá sản phẩm" backTo="/" />

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-2">
        {/* Trợ lý đầu tư thông minh */}
        <motion.div custom={0} variants={blockVariants} initial="hidden" animate="show" className="flex flex-col rounded-card bg-surface shadow-card">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold leading-[22px] text-ink">Trợ lý đầu tư thông minh</span>
              <span className="block text-[13px] leading-[18px] text-muted">Tư vấn giải pháp đầu tư phù hợp</span>
            </span>
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[13px] bg-orange-soft text-primary">
              <TrendingUp size={22} strokeWidth={1.7} />
            </span>
          </div>
          <div className="mx-4 h-px bg-divider" />
          <div className="grid grid-cols-4 px-1 py-3">
            {assistantActions.map((a) => {
              const Icon = a.icon
              return (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => a.to && navigate(a.to)}
                  className="flex cursor-pointer flex-col items-center gap-2 px-1 py-1.5 text-primary"
                >
                  <Icon size={24} strokeWidth={1.5} />
                  <span className="text-center text-[12px] font-medium leading-4 text-ink">{a.label}</span>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Các sản phẩm đầu tư */}
        {products.map((p, i) => {
          const Icon = p.icon
          return (
            <motion.div key={p.id} custom={i + 1} variants={blockVariants} initial="hidden" animate="show" className="flex flex-col rounded-card bg-surface shadow-card">
              <div className="flex items-center gap-3 px-4 pt-4">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[13px] bg-orange-soft text-primary">
                  <Icon size={24} strokeWidth={1.6} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-semibold leading-6 text-ink">{p.name}</span>
                  <span className="block text-[14px] leading-5 text-muted">
                    Lên tới <span className="font-bold text-primary">{p.rate}</span>/năm
                  </span>
                </span>
              </div>
              <p className="px-4 pb-3.5 pt-2.5 text-[14px] leading-5 text-ink">
                {p.desc} <button type="button" className="cursor-pointer font-medium text-info">Xem chi tiết</button>
              </p>
              <div className="mx-4 h-px bg-divider" />
              <button
                type="button"
                onClick={() => p.to && navigate(p.to)}
                className="flex h-[52px] cursor-pointer items-center justify-center gap-2.5 text-primary"
              >
                <CirclePlus size={21} strokeWidth={1.7} />
                <span className="text-[15px] font-semibold">{p.cta}</span>
              </button>
            </motion.div>
          )
        })}
      </div>
    </MobileFrame>
  )
}
