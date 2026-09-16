import { motion } from 'framer-motion'
import { Bell, ChevronDown, Eye, Headphones, QrCode, ScanFace, UserRoundPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { demoCustomer } from '@/data/demo-scenarios'
import { MobileFrame } from '@/shell/MobileFrame'

/** Icon chuyển tiền kiểu MSB (mũi tên chéo trong vòng tròn) */
function TransferIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 14.5l5-5M10.5 9.5h4v4" />
    </svg>
  )
}

const glassCard = 'rounded-[18px] border border-white/25 bg-white/15 backdrop-blur-xl'

export function LoginPage() {
  const navigate = useNavigate()
  return (
    <MobileFrame
      statusBar="light"
      screenClassName="bg-[color:var(--msb-campaign)] bg-[url('/assets/bg-campaign.png')] bg-cover bg-top"
    >
      {/* Lớp phủ tối dần về đáy để chữ nổi trên ảnh */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[520px]"
        style={{ background: 'linear-gradient(180deg, rgba(124,22,10,0) 0%, rgba(110,18,8,.72) 38%, rgba(74,10,4,.94) 100%)' }}
      />

      {/* Hàng logo + tiện ích */}
      <div className="relative z-10 flex h-12 flex-none items-center justify-between px-5">
        <img src="/assets/msb-logo-white.png" alt="MSB" className="h-[26px] w-auto" />
        <div className="flex items-center gap-2">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white">
            <Bell size={18} strokeWidth={1.6} />
            <span className="absolute right-1.5 top-1 h-[7px] w-[7px] rounded-full bg-gold" />
          </span>
          <span className="flex h-8 items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 text-[13px] font-semibold text-white">
            VN
            <ChevronDown size={12} strokeWidth={2.4} />
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1" />

      {/* Khối đăng nhập */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 flex flex-none flex-col gap-3 px-4 pb-8"
      >
        <div className={`${glassCard} flex flex-col gap-3 p-4`}>
          <div className="flex items-center justify-between">
            <span>
              <span className="block text-[13px] leading-[18px] text-white/85">Chào buổi sáng,</span>
              <span className="block text-xl font-semibold leading-7 text-white">{demoCustomer.name}</span>
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white">
              <UserRoundPlus size={20} strokeWidth={1.6} />
            </span>
          </div>

          {/* Ô mật khẩu: 6 chấm + caret vàng */}
          <div className="flex h-12 items-center gap-2.5 rounded-btn border border-white/20 bg-black/30 px-3.5">
            <span className="flex flex-1 items-center gap-[7px]">
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className="block h-2 w-2 rounded-full bg-white" />
              ))}
              <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.1, repeat: Infinity }} className="ml-0.5 block h-5 w-[1.5px] bg-gold" />
            </span>
            <span className="text-xs text-white/70">Mật khẩu</span>
            <Eye size={20} strokeWidth={1.6} className="text-white/80" />
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-btn text-base font-semibold"
            style={{ background: 'var(--msb-gradient-gold)', color: 'var(--msb-gold-ink)' }}
          >
            <ScanFace size={20} strokeWidth={1.7} />
            Đăng nhập
          </button>

          <div className="flex items-center justify-between text-[13px] font-medium text-white/85">
            <span>Đổi người dùng</span>
            <span className="font-semibold text-gold">Quên mật khẩu?</span>
          </div>
        </div>

        {/* 3 tiện ích nhanh */}
        <div className={`${glassCard} grid grid-cols-3 py-3.5`}>
          <button type="button" onClick={() => navigate('/')} className="flex cursor-pointer flex-col items-center gap-[7px] text-white">
            <TransferIcon />
            <span className="text-xs font-medium leading-4">Chuyển tiền</span>
          </button>
          <button type="button" className="flex cursor-pointer flex-col items-center gap-[7px] border-x border-white/20 text-white">
            <QrCode size={24} strokeWidth={1.5} />
            <span className="text-xs font-medium leading-4">Quét QR</span>
          </button>
          <button type="button" className="flex cursor-pointer flex-col items-center gap-[7px] text-white">
            <Headphones size={24} strokeWidth={1.5} />
            <span className="text-xs font-medium leading-4">Hỗ trợ</span>
          </button>
        </div>

        {/* Banner ưu đãi */}
        <div className="overflow-hidden rounded-card border border-white/20">
          <img src="/assets/banner-mfirst.png" alt="Ưu đãi thẻ M-First" className="block h-auto w-full" />
        </div>

        <div className="text-center text-xs leading-[17px] text-white/75">
          Hotline 24/7 <span className="font-semibold text-gold">1800 6083</span> · Phiên bản 9.2.1
        </div>
      </motion.div>
    </MobileFrame>
  )
}
