import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CircleHelp, Landmark, Mail, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MobileFrame } from '@/shell/MobileFrame'

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.08 + i * 0.06, duration: 0.3, ease: 'easeOut' as const } }),
}

interface ContactRow {
  label: string
  icon: React.ReactNode
}

const contactRows: ContactRow[] = [
  {
    label: 'MSB trên Zalo OA',
    icon: (
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-info-soft text-info">
        <MessageCircle size={19} strokeWidth={1.7} />
      </span>
    ),
  },
  {
    label: 'Email',
    icon: (
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-orange-soft text-primary">
        <Mail size={19} strokeWidth={1.7} />
      </span>
    ),
  },
  {
    label: 'ATM/Chi nhánh/PGD',
    icon: (
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-orange-soft text-primary">
        <Landmark size={19} strokeWidth={1.7} />
      </span>
    ),
  },
  {
    label: 'Thông tin khác',
    icon: (
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-orange-soft">
        <img src="/assets/icon-logo-msb.png" alt="MSB" className="h-4 w-auto" />
      </span>
    ),
  },
]

/** Trung tâm hỗ trợ — theo design support.png, vào được từ màn đăng nhập */
export function SupportPage() {
  const navigate = useNavigate()
  return (
    <MobileFrame
      statusBar="light"
      indicator="light"
      screenClassName="bg-[color:var(--msb-primary)]"
    >
      {/* Nền gradient cam → đỏ đậm */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(175deg, var(--msb-primary) 0%, var(--msb-primary-pressed) 55%, var(--msb-campaign) 100%)' }}
      />

      {/* Header */}
      <div className="relative z-10 flex h-12 flex-none items-center gap-1 px-3">
        <button
          type="button"
          aria-label="Quay lại"
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-white hover:bg-white/10"
        >
          <ChevronLeft size={24} strokeWidth={1.8} />
        </button>
        <h1 className="flex-1 text-[17px] font-semibold text-white">Trung tâm hỗ trợ</h1>
      </div>

      <div className="no-scrollbar relative z-10 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4 pt-2">
        {/* Câu hỏi & hướng dẫn */}
        <motion.button
          custom={0}
          variants={rowVariants}
          initial="hidden"
          animate="show"
          type="button"
          className="flex cursor-pointer items-center gap-3 rounded-card border border-white/25 bg-white/15 p-4 text-left backdrop-blur-sm"
        >
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white/20 text-white">
            <CircleHelp size={21} strokeWidth={1.7} />
          </span>
          <span className="flex-1 text-[15px] font-medium leading-[21px] text-white">Câu hỏi và hướng dẫn sử dụng</span>
          <ChevronRight size={20} strokeWidth={1.7} className="flex-none text-white/80" />
        </motion.button>

        {/* Liên hệ với MSB */}
        <motion.div
          custom={1}
          variants={rowVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-2.5 rounded-card border border-white/25 bg-white/15 p-3 backdrop-blur-sm"
        >
          <span className="px-1 pt-1 text-[15px] font-semibold text-white">Liên hệ với MSB</span>
          {contactRows.map((row, i) => (
            <motion.button
              key={row.label}
              custom={i + 2}
              variants={rowVariants}
              initial="hidden"
              animate="show"
              type="button"
              className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface p-3 text-left shadow-card"
            >
              {row.icon}
              <span className="flex-1 text-[15px] font-medium leading-[21px]">{row.label}</span>
              <ChevronRight size={19} strokeWidth={1.7} className="flex-none text-muted" />
            </motion.button>
          ))}
        </motion.div>

        {/* Hotline nhanh */}
        <motion.div custom={6} variants={rowVariants} initial="hidden" animate="show" className="px-1 text-center text-xs leading-[17px] text-white/80">
          Hotline 24/7 <span className="font-semibold text-gold">1900 6083</span> · miễn phí cước gọi
        </motion.div>

        {/* Logo MSB dưới cùng */}
        <div className="mt-auto flex items-center px-1 pb-4">
          <img src="/assets/msb-logo-white.png" alt="MSB" className="h-7 w-auto" />
        </div>
      </div>
    </MobileFrame>
  )
}
