import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Headphones,
  HandCoins,
  Home,
  LayoutGrid,
  LogOut,
  MessageSquareText,
  PiggyBank,
  QrCode,
  ReceiptText,
  Search,
  Settings,
  Star,
  Sun,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { demoCustomer } from '@/data/demo-scenarios'
import { useAuthStore } from '@/lib/auth'
import { formatVnd } from '@/lib/format'
import { useGuardianStore } from '@/lib/store'
import { MobileFrame, usePhoneContainer } from '@/shell/MobileFrame'

/** Icon chuyển tiền kiểu MSB (mũi tên chéo trong vòng tròn) */
function TransferIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 14.5l5-5M10.5 9.5h4v4" />
    </svg>
  )
}

const blockVariants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35, ease: 'easeOut' as const } }),
}

function GlassIcon({ children, badge }: { children: React.ReactNode; badge?: string }) {
  return (
    <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white">
      {children}
      {badge && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-surface px-1 text-[11px] font-bold text-primary-pressed">
          {badge}
        </span>
      )}
    </span>
  )
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex cursor-pointer flex-col items-center gap-2 py-1.5 text-primary">
      {icon}
      <span className="text-sm font-medium leading-[19px] text-ink">{label}</span>
    </button>
  )
}

/** Sheet Cài đặt — chứa thông tin phiên và nút Đăng xuất */
function SettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const container = usePhoneContainer()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  function handleLogout() {
    logout()
    onOpenChange(false)
    navigate('/login', { replace: true })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent container={container}>
        <div className="flex flex-col gap-4">
          <SheetTitle className="text-lg font-semibold">Cài đặt</SheetTitle>
          <div className="flex items-center gap-3 rounded-card bg-app p-4">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-orange-soft text-[15px] font-semibold text-primary">MA</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{demoCustomer.name}</span>
              <span className="block text-[13px] text-muted">Tài khoản thanh toán {demoCustomer.maskedAccount}</span>
            </span>
            <Badge variant="soft">M-FIRST GOLD</Badge>
          </div>
          <span className="text-[13px] leading-5 text-muted">
            Phiên đăng nhập được bảo vệ bởi Scam Shield. Đăng xuất sẽ đưa bạn về màn hình đăng nhập.
          </span>
          <Button variant="outline" className="w-full font-semibold text-danger" onClick={handleLogout}>
            <LogOut size={18} strokeWidth={1.8} />
            Đăng xuất
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { balanceHidden, toggleBalance } = useGuardianStore()
  const [botBubble, setBotBubble] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <MobileFrame statusBar="light" indicator="dark">
      {/* Header chiến dịch: ảnh 300px tan dần vào nền app */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-[color:var(--msb-campaign)] bg-[url('/assets/bg-campaign.png')] bg-cover bg-top"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[300px]"
        style={{ background: 'linear-gradient(180deg, rgba(112,18,8,.42) 0%, rgba(96,14,6,.55) 55%, var(--msb-bg) 100%)' }}
      />

      {/* Hàng logo + 3 icon tiện ích */}
      <div className="relative z-10 flex h-[52px] flex-none items-center justify-between px-5">
        <img src="/assets/msb-logo-white.png" alt="MSB" className="h-[22px] w-auto" />
        <div className="flex gap-2">
          <GlassIcon>
            <Search size={19} strokeWidth={1.6} />
          </GlassIcon>
          <GlassIcon>
            <Headphones size={19} strokeWidth={1.6} />
          </GlassIcon>
          <GlassIcon badge="9">
            <Bell size={19} strokeWidth={1.6} />
          </GlassIcon>
        </div>
      </div>

      {/* Nội dung cuộn */}
      <div className="no-scrollbar relative z-[5] flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-[110px] pt-4">
        {/* Card tài khoản M-FIRST GOLD */}
        <motion.div custom={0} variants={blockVariants} initial="hidden" animate="show" className="flex flex-col rounded-card bg-surface shadow-raised">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-orange-soft text-primary">
              <Sun size={18} strokeWidth={1.5} />
            </span>
            <span className="flex-1 text-[15px] font-semibold tracking-[.01em] text-primary">M-FIRST GOLD</span>
            <ChevronRight size={20} strokeWidth={1.6} className="text-muted" />
          </div>
          <div className="mx-0 h-px bg-divider" />
          <div className="flex items-end justify-between px-4 pb-4 pt-3">
            <span className="flex flex-col gap-0.5">
              <span className="text-[13px] leading-[18px] tracking-[.02em] text-muted">Tài khoản thanh toán {demoCustomer.maskedAccount}</span>
              <span className="flex items-baseline gap-2">
                <span className="text-[26px] font-bold leading-8 tracking-[.02em]">
                  {balanceHidden ? '•••••••' : formatVnd(demoCustomer.balance).replace(' ₫', '')}
                </span>
                <span className="text-[17px] font-medium text-muted">VND</span>
              </span>
            </span>
            <button type="button" aria-label="Ẩn/hiện số dư" onClick={toggleBalance} className="flex h-10 w-10 cursor-pointer items-center justify-center text-ink">
              {balanceHidden ? <EyeOff size={22} strokeWidth={1.5} /> : <Eye size={22} strokeWidth={1.5} />}
            </button>
          </div>
        </motion.div>

        {/* Lưới tiện ích 2×3 + Rewards/Xem thêm */}
        <motion.div custom={1} variants={blockVariants} initial="hidden" animate="show" className="flex flex-col rounded-card bg-surface px-1 pt-1.5 shadow-card">
          <div className="grid grid-cols-3 py-1.5">
            <QuickAction icon={<TransferIcon />} label="Chuyển tiền" onClick={() => navigate('/transfer/review')} />
            <QuickAction icon={<QrCode size={30} strokeWidth={1.5} />} label="Quét QR" />
            <QuickAction icon={<PiggyBank size={30} strokeWidth={1.5} />} label="Tiền gửi" />
          </div>
          <div className="mx-3 h-px bg-divider" />
          <div className="grid grid-cols-3 py-1.5">
            <QuickAction icon={<CreditCard size={30} strokeWidth={1.5} />} label="Thẻ" />
            <QuickAction icon={<ReceiptText size={30} strokeWidth={1.5} />} label="Thanh toán" />
            <QuickAction icon={<HandCoins size={30} strokeWidth={1.5} />} label="Vay" />
          </div>
          <div className="mx-3 h-px bg-divider" />
          <div className="grid grid-cols-2">
            <button type="button" className="flex h-[52px] cursor-pointer items-center justify-center gap-2 text-primary">
              <Star size={20} strokeWidth={1.5} />
              <span className="text-[15px] font-medium text-ink">Rewards</span>
            </button>
            <button type="button" className="flex h-[52px] cursor-pointer items-center justify-center gap-2 border-l border-divider text-primary">
              <LayoutGrid size={20} strokeWidth={1.5} />
              <span className="text-[15px] font-medium text-ink">Xem thêm</span>
            </button>
          </div>
        </motion.div>

        {/* Banner Chat Banking */}
        <motion.button
          custom={2}
          variants={blockVariants}
          initial="hidden"
          animate="show"
          type="button"
          onClick={() => navigate('/copilot/chat')}
          className="flex cursor-pointer items-center gap-3 rounded-card border border-orange-border bg-surface p-3 text-left shadow-card"
        >
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[13px] bg-orange-soft text-primary">
            <MessageSquareText size={22} strokeWidth={1.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-[15px] font-semibold leading-[21px]">Chat Banking</span>
              <Badge variant="primary">Mới</Badge>
            </span>
            <span className="block text-[13px] leading-[18px] text-muted">Nhắn một câu, chuyển tiền xong ngay.</span>
          </span>
          <ChevronRight size={20} strokeWidth={1.5} className="flex-none text-muted" />
        </motion.button>
      </div>

      {/* Trợ lý AI Guardian nổi */}
      <div className="absolute bottom-[104px] right-4 z-20 flex items-end gap-2">
        {botBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="relative max-w-[196px] cursor-pointer rounded-[16px_16px_4px_16px] bg-surface p-3 shadow-float"
            onClick={() => navigate('/copilot')}
          >
            <span className="block text-xs font-semibold text-primary">Trợ lý AI Guardian</span>
            <span className="block text-[13px] leading-[18px]">Chi tiêu Ăn uống tháng này tăng 34%. Xem ngay?</span>
            <button
              type="button"
              aria-label="Đóng gợi ý"
              onClick={(e) => {
                e.stopPropagation()
                setBotBubble(false)
              }}
              className="absolute -right-2 -top-2 flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-muted"
            >
              <X size={11} strokeWidth={2.4} />
            </button>
          </motion.div>
        )}
        <motion.img
          src="/assets/msb-bot.png"
          alt="Trợ lý AI MSB"
          className="block h-[68px] w-[68px] cursor-pointer"
          style={{ filter: 'drop-shadow(0 6px 14px rgba(240,90,40,.38))' }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 260, damping: 18 }}
          onClick={() => navigate('/copilot')}
        />
      </div>

      {/* Bottom nav dạng pill nổi */}
      <div className="absolute inset-x-4 bottom-[26px] z-10 grid h-16 grid-cols-3 items-center rounded-full bg-surface p-2 shadow-float">
        <span className="flex h-12 items-center justify-center gap-2 rounded-full bg-orange-soft text-primary">
          <Home size={20} strokeWidth={1.6} />
          <span className="text-[13px] font-semibold">Trang chủ</span>
        </span>
        <button type="button" onClick={() => navigate('/safety-center')} className="flex h-12 cursor-pointer items-center justify-center gap-2 text-muted">
          <CreditCard size={20} strokeWidth={1.6} />
          <span className="text-[13px] font-medium">Tài khoản</span>
        </button>
        <button type="button" onClick={() => setSettingsOpen(true)} className="flex h-12 cursor-pointer items-center justify-center gap-2 text-muted">
          <Settings size={21} strokeWidth={1.6} />
          <span className="text-[13px] font-medium">Cài đặt</span>
        </button>
      </div>

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </MobileFrame>
  )
}
