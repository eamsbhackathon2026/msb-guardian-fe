import { motion } from 'framer-motion'
import { ArrowRight, Coins, FileSearch, Gift, MessagesSquare, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

const blockVariants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' as const } }),
}

/** Màn Vay — theo bố cục vay.jpg, tone sáng đồng bộ app */
export function LoansPage() {
  const navigate = useNavigate()
  return (
    <MobileFrame statusBar="dark">
      <MobileHeader title="Vay" backTo="/" />

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-2">
        {/* Hero: đăng ký hạn mức tín dụng */}
        <motion.div custom={0} variants={blockVariants} initial="hidden" animate="show" className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-orange-soft px-3 py-1.5 text-[13px] font-semibold text-primary">
            <Star size={14} strokeWidth={0} fill="currentColor" />
            Vay nhanh tiện lợi
          </span>
          <div className="flex items-start gap-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[19px] font-bold leading-[26px] text-primary">Đăng ký hạn mức cho sản phẩm tín dụng</span>
              <span className="mt-1.5 block text-[14px] leading-5 text-muted">Giải pháp tài chính linh hoạt, minh bạch và phù hợp với mọi nhu cầu sử dụng</span>
            </span>
            <span className="flex h-[72px] w-[72px] flex-none items-center justify-center rounded-[18px] bg-orange-soft text-primary">
              <Gift size={38} strokeWidth={1.4} />
            </span>
          </div>
          <button
            type="button"
            className="inline-flex h-11 w-fit cursor-pointer items-center gap-2 rounded-btn bg-primary px-5 text-[15px] font-semibold text-white active:scale-[.98]"
          >
            Đăng ký ngay
            <ArrowRight size={18} strokeWidth={2} />
          </button>
        </motion.div>

        {/* Quản lý khoản vay + Theo dõi hồ sơ */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            custom={1}
            variants={blockVariants}
            initial="hidden"
            animate="show"
            type="button"
            className="flex cursor-pointer flex-col gap-3 rounded-card bg-surface p-4 text-left shadow-card"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-orange-soft text-primary">
              <Coins size={28} strokeWidth={1.5} />
            </span>
            <span>
              <span className="block text-[16px] font-bold leading-[22px] text-ink">Quản lý khoản vay</span>
              <span className="mt-1 block text-[13px] leading-[18px] text-muted">Quản lý tổng dư nợ và thông tin khoản vay một cách rõ ràng, thuận tiện</span>
            </span>
          </motion.button>

          <motion.button
            custom={2}
            variants={blockVariants}
            initial="hidden"
            animate="show"
            type="button"
            className="flex cursor-pointer flex-col gap-3 rounded-card bg-surface p-4 text-left shadow-card"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-orange-soft text-primary">
              <FileSearch size={28} strokeWidth={1.5} />
            </span>
            <span>
              <span className="block text-[16px] font-bold leading-[22px] text-ink">Theo dõi hồ sơ</span>
              <span className="mt-1 block text-[13px] leading-[18px] text-muted">Cập nhật trạng thái xử lý hồ sơ đăng ký vay, giải ngân</span>
            </span>
          </motion.button>
        </div>

        {/* Hỗ trợ tư vấn */}
        <motion.button
          custom={3}
          variants={blockVariants}
          initial="hidden"
          animate="show"
          type="button"
          onClick={() => navigate('/support')}
          className="flex w-[calc(50%-6px)] cursor-pointer flex-col gap-3 rounded-card bg-surface p-4 text-left shadow-card"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-orange-soft text-primary">
            <MessagesSquare size={28} strokeWidth={1.5} />
          </span>
          <span>
            <span className="block text-[16px] font-bold leading-[22px] text-ink">Hỗ trợ tư vấn</span>
            <span className="mt-1 block text-[13px] leading-[18px] text-muted">Quý khách cần tư vấn về khoản vay?</span>
          </span>
        </motion.button>
      </div>
    </MobileFrame>
  )
}
