import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Gift,
  Headphones,
  HandCoins,
  History,
  Home,
  Languages,
  LayoutGrid,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquareText,
  Palette,
  PhoneCall,
  PhoneOff,
  PiggyBank,
  QrCode,
  ReceiptText,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Wallet,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useQuery } from '@tanstack/react-query'
// MOCK CŨ: import { demoCustomer } from '@/data/demo-scenarios'
import { getHomeContent, getSessionCustomer } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { formatVnd, fullAccountNumber, fullCustomerName, timeGreeting } from '@/lib/format'
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

function GlassIcon({ children, badge, label, onClick }: { children: React.ReactNode; badge?: string; label?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/20 text-white"
    >
      {children}
      {badge && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-surface px-1 text-[11px] font-bold text-primary-pressed">
          {badge}
        </span>
      )}
    </button>
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

const searchFeatures = [
  { icon: <TransferIcon size={22} />, label: 'Chuyển tiền', desc: 'Chuyển nhanh 24/7 miễn phí', to: '/transfer' },
  { icon: <QrCode size={22} strokeWidth={1.5} />, label: 'Quét QR', desc: 'Thanh toán bằng mã QR' },
  { icon: <PiggyBank size={22} strokeWidth={1.5} />, label: 'Tiền gửi', desc: 'Mở sổ tiết kiệm online', to: '/invest' },
  { icon: <CreditCard size={22} strokeWidth={1.5} />, label: 'Thẻ', desc: 'Quản lý thẻ ghi nợ, tín dụng', to: '/cards' },
  { icon: <ReceiptText size={22} strokeWidth={1.5} />, label: 'Thanh toán hóa đơn', desc: 'Điện, nước, internet…', to: '/payments' },
  { icon: <History size={22} strokeWidth={1.5} />, label: 'Lịch sử giao dịch', desc: 'Các lệnh chuyển đã thực hiện', to: '/transactions' },
  { icon: <HandCoins size={22} strokeWidth={1.5} />, label: 'Vay', desc: 'Vay tiêu dùng lãi suất ưu đãi', to: '/loans' },
  { icon: <MessageSquareText size={22} strokeWidth={1.5} />, label: 'Chat Banking', desc: 'Nhắn một câu, chuyển tiền xong ngay', to: '/chat-banking', isNew: true },
  { icon: <Sparkles size={22} strokeWidth={1.5} />, label: 'Trợ lý AI Financial Copilot', desc: 'Phân tích chi tiêu, hỏi đáp tài chính', to: '/copilot', isNew: true },
  { icon: <ShieldCheck size={22} strokeWidth={1.5} />, label: 'Trung tâm an toàn', desc: 'Scam Shield bảo vệ giao dịch', to: '/safety-center' },
  { icon: <Headphones size={22} strokeWidth={1.5} />, label: 'Trung tâm hỗ trợ', desc: 'Câu hỏi thường gặp, liên hệ MSB', to: '/support' },
]

/** Sheet Tìm kiếm tính năng (mockup) */
function SearchSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const container = usePhoneContainer()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  useEffect(() => {
    if (!open) setQuery('')
  }, [open])
  const items = searchFeatures.filter((f) => f.label.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent container={container}>
        <div className="flex flex-col gap-4">
          <SheetTitle className="text-lg font-semibold">Tìm kiếm</SheetTitle>
          <label className="flex items-center gap-2.5 rounded-full bg-app px-4 py-3 text-ink">
            <Search size={18} strokeWidth={1.7} className="flex-none text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tính năng, dịch vụ…"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
            />
            {query && (
              <button type="button" aria-label="Xóa" onClick={() => setQuery('')} className="flex-none cursor-pointer text-muted">
                <X size={16} strokeWidth={2} />
              </button>
            )}
          </label>
          <div className="no-scrollbar flex max-h-[380px] flex-col overflow-y-auto">
            {items.length === 0 && <span className="py-6 text-center text-[13px] text-muted">Không tìm thấy tính năng phù hợp</span>}
            {items.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => {
                  onOpenChange(false)
                  if (f.to) navigate(f.to)
                }}
                className="flex cursor-pointer items-center gap-3 rounded-card px-2 py-3 text-left hover:bg-app"
              >
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[13px] bg-orange-soft text-primary">{f.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[15px] font-medium leading-5">{f.label}</span>
                    {f.isNew && <Badge variant="primary">Mới</Badge>}
                  </span>
                  <span className="block truncate text-[13px] leading-[18px] text-muted">{f.desc}</span>
                </span>
                <ChevronRight size={18} strokeWidth={1.6} className="flex-none text-muted" />
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Sheet Tổng đài — mock cuộc gọi 1800 6083 với trạng thái đang kết nối/đã kết nối */
function HotlineSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const container = usePhoneContainer()
  const [calling, setCalling] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const connected = seconds >= 3

  useEffect(() => {
    if (!calling) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [calling])
  useEffect(() => {
    if (!open) {
      setCalling(false)
      setSeconds(0)
    }
  }, [open])

  const talk = Math.max(0, seconds - 3)
  const timer = `${String(Math.floor(talk / 60)).padStart(2, '0')}:${String(talk % 60).padStart(2, '0')}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent container={container}>
        {calling ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <span className="relative flex h-20 w-20 items-center justify-center">
              <motion.span
                className="absolute inset-0 rounded-full bg-orange-soft"
                animate={{ scale: [1, 1.35, 1], opacity: [0.9, 0.25, 0.9] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                <Headphones size={28} strokeWidth={1.6} />
              </span>
            </span>
            <span className="flex flex-col items-center gap-1">
              <span className="text-[17px] font-semibold">Tổng đài MSB · 1800 6083</span>
              <span className="text-[13px] text-muted">{connected ? `Đã kết nối tổng đài viên · ${timer}` : 'Đang kết nối…'}</span>
            </span>
            <Button variant="outline" className="w-full font-semibold text-danger" onClick={() => onOpenChange(false)}>
              <PhoneOff size={18} strokeWidth={1.8} />
              Kết thúc cuộc gọi
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <SheetTitle className="text-lg font-semibold">Liên hệ MSB</SheetTitle>
            <div className="flex items-center gap-3 rounded-card bg-app p-4">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-orange-soft text-primary">
                <Headphones size={22} strokeWidth={1.6} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">Tổng đài 24/7</span>
                <span className="block text-[20px] font-bold tracking-[.02em] text-primary">1800 6083</span>
              </span>
            </div>
            <Button className="w-full font-semibold" onClick={() => setCalling(true)}>
              <PhoneCall size={18} strokeWidth={1.8} />
              Gọi tổng đài
            </Button>
            <div className="flex flex-col rounded-card bg-app">
              <span className="flex items-center gap-3 px-4 py-3">
                <Mail size={18} strokeWidth={1.6} className="flex-none text-primary" />
                <span className="text-[14px]">msb@msb.com.vn</span>
              </span>
              <div className="mx-4 h-px bg-divider" />
              <span className="flex items-center gap-3 px-4 py-3">
                <MapPin size={18} strokeWidth={1.6} className="flex-none text-primary" />
                <span className="text-[14px]">Tìm ATM / Chi nhánh / PGD gần bạn</span>
              </span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

const mockNotifications = [
  { id: 'n1', icon: <ShieldAlert size={19} strokeWidth={1.7} />, tone: 'text-danger bg-danger/10', title: 'Scam Shield tạm giữ giao dịch 85.000.000 ₫', time: 'Hôm nay · 09:41', unread: true },
  { id: 'n2', icon: <Wallet size={19} strokeWidth={1.7} />, tone: 'text-primary bg-orange-soft', title: 'Biến động số dư: -2.500.000 ₫ đến NGUYEN VAN B', time: 'Hôm nay · 08:15', unread: true },
  { id: 'n3', icon: <ShieldCheck size={19} strokeWidth={1.7} />, tone: 'text-primary bg-orange-soft', title: 'Đăng nhập trên thiết bị mới — iPhone 15 Pro', time: 'Hôm nay · 07:58', unread: false },
  { id: 'n4', icon: <Gift size={19} strokeWidth={1.7} />, tone: 'text-primary bg-orange-soft', title: 'Hoàn tiền 30% khi thanh toán QR tại Highlands Coffee', time: 'Hôm qua · 19:20', unread: false },
  { id: 'n5', icon: <ReceiptText size={19} strokeWidth={1.7} />, tone: 'text-primary bg-orange-soft', title: 'Sao kê tháng 8 của bạn đã sẵn sàng', time: '01/09 · 09:00', unread: false },
]

/** Sheet Thông báo (mockup) */
function NotificationsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const container = usePhoneContainer()
  // Thông báo sinh trong phiên (vd chuyển tiền thành công) đứng trước danh sách mock
  const sessionNotis = useGuardianStore((s) => s.notifications)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent container={container}>
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2">
            <SheetTitle className="text-lg font-semibold">Thông báo</SheetTitle>
            <Badge variant="primary">{9 + sessionNotis.length} mới</Badge>
          </span>
          <div className="no-scrollbar flex max-h-[420px] flex-col overflow-y-auto">
            {sessionNotis.map((n) => (
              <span key={n.id} className="flex items-start gap-3 rounded-card px-2 py-3 hover:bg-app">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-orange-soft text-primary">
                  <Wallet size={19} strokeWidth={1.7} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold leading-5">{n.title}</span>
                  <span className="block text-[12px] leading-[18px] text-muted">{n.timeLabel}</span>
                </span>
                <span className="mt-2 h-2 w-2 flex-none rounded-full bg-primary" />
              </span>
            ))}
            {mockNotifications.map((n) => (
              <span key={n.id} className="flex items-start gap-3 rounded-card px-2 py-3 hover:bg-app">
                <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${n.tone}`}>{n.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[14px] leading-5 ${n.unread ? 'font-semibold' : 'font-medium'}`}>{n.title}</span>
                  <span className="block text-[12px] leading-[18px] text-muted">{n.time}</span>
                </span>
                {n.unread && <span className="mt-2 h-2 w-2 flex-none rounded-full bg-primary" />}
              </span>
            ))}
          </div>
          <Button variant="outline" className="w-full font-medium" onClick={() => onOpenChange(false)}>
            Xem tất cả thông báo
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Sheet Cài đặt — tone cam sáng theo bố cục setup.jpg */
function SettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: customer } = useQuery({ queryKey: ['session-customer'], queryFn: getSessionCustomer })
  const { data: home } = useQuery({ queryKey: ['home-content'], queryFn: getHomeContent })
  const container = usePhoneContainer()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  function handleLogout() {
    logout()
    onOpenChange(false)
    navigate('/login', { replace: true })
  }

  const menu = [
    { key: 'security', icon: Lock, label: 'Bảo mật' },
    { key: 'limits', icon: Wallet, label: 'Tài khoản và hạn mức' },
    { key: 'noti', icon: Bell, label: 'Thông báo' },
    { key: 'theme', icon: Palette, label: 'Giao diện' },
    { key: 'lang', icon: Languages, label: 'Ngôn ngữ', flag: true },
  ]
  const row = 'flex w-full cursor-pointer items-center gap-3.5 px-4 py-3 text-left'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent container={container} className="bg-[#ffe3ce]">
        <div className="flex flex-col gap-3.5">
          <SheetTitle className="text-lg font-semibold text-ink">Cài đặt</SheetTitle>

          {/* Hồ sơ: avatar cam + tên + hạng khách hàng */}
          <button
            type="button"
            className="flex cursor-pointer items-center gap-3.5 rounded-card p-4 text-left shadow-card"
            style={{ background: 'linear-gradient(135deg, #ff9a4d 0%, #f05a28 55%, #e04a1a 100%)' }}
          >
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full border-2 border-white/80 bg-white">
              <img src="/assets/icon-logo-msb.png" alt="MSB" className="h-5 w-auto" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold uppercase tracking-[.02em] text-white">{fullCustomerName(customer?.name)}</span>
              <span className="block text-[13px] font-semibold tracking-[.12em] text-[#ffe1b0]">{home?.productTier ?? ''}</span>
            </span>
            <ChevronRight size={20} strokeWidth={1.8} className="flex-none text-white/85" />
          </button>

          {/* Nhóm cài đặt chính */}
          <div className="flex flex-col rounded-card bg-surface shadow-card">
            {menu.map((item, i) => {
              const Icon = item.icon
              return (
                <Fragment key={item.key}>
                  {i > 0 && <div className="mx-4 h-px bg-divider" />}
                  <button type="button" className={row}>
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-orange-soft text-primary">
                      <Icon size={19} strokeWidth={1.7} />
                    </span>
                    <span className="flex-1 text-[15px] font-medium text-ink">{item.label}</span>
                    {item.flag && (
                      <span className="flex h-[18px] w-[26px] flex-none items-center justify-center rounded-[4px] bg-[#da251d]">
                        <Star size={10} strokeWidth={0} fill="#ffcd00" />
                      </span>
                    )}
                    <ChevronRight size={18} strokeWidth={1.8} className="flex-none text-muted" />
                  </button>
                </Fragment>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              onOpenChange(false)
              navigate('/support')
            }}
            className={`${row} rounded-card bg-surface shadow-card`}
          >
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-orange-soft text-primary">
              <Headphones size={19} strokeWidth={1.7} />
            </span>
            <span className="flex-1 text-[15px] font-medium text-ink">Trung tâm hỗ trợ</span>
            <ChevronRight size={18} strokeWidth={1.8} className="flex-none text-muted" />
          </button>

          <button type="button" onClick={handleLogout} className={`${row} rounded-card bg-surface shadow-card`}>
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-orange-soft text-primary">
              <LogOut size={19} strokeWidth={1.7} />
            </span>
            <span className="flex-1 text-[15px] font-medium text-ink">Đăng xuất</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  // Cùng queryKey với SettingsSheet nên chỉ có một lời gọi mạng cho cả hai.
  const { data: customer } = useQuery({ queryKey: ['session-customer'], queryFn: getSessionCustomer })
  const { data: home } = useQuery({ queryKey: ['home-content'], queryFn: getHomeContent })
  const { balanceHidden, toggleBalance } = useGuardianStore()
  const sessionNotis = useGuardianStore((s) => s.notifications)
  const notiToast = useGuardianStore((s) => s.notiToast)
  const clearNotiToast = useGuardianStore((s) => s.clearNotiToast)
  const [botBubble, setBotBubble] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [hotlineOpen, setHotlineOpen] = useState(false)
  const [notiOpen, setNotiOpen] = useState(false)

  // Toast tự trôi sau 4s; bấm vào thì mở luôn quả chuông
  useEffect(() => {
    if (!notiToast) return
    const id = setTimeout(clearNotiToast, 4000)
    return () => clearTimeout(id)
  }, [notiToast, clearNotiToast])

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
          <GlassIcon label="Tìm kiếm" onClick={() => setSearchOpen(true)}>
            <Search size={19} strokeWidth={1.6} />
          </GlassIcon>
          <GlassIcon label="Gọi tổng đài" onClick={() => setHotlineOpen(true)}>
            <Headphones size={19} strokeWidth={1.6} />
          </GlassIcon>
          <GlassIcon badge={String(9 + sessionNotis.length)} label="Thông báo" onClick={() => setNotiOpen(true)}>
            <Bell size={19} strokeWidth={1.6} />
          </GlassIcon>
        </div>
      </div>

      {/* Nội dung cuộn */}
      <div className="no-scrollbar relative z-[5] flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-[110px] pt-4">
        {/* Lời chào + tên người dùng sau khi đăng nhập thành công */}
        <motion.div custom={0} variants={blockVariants} initial="hidden" animate="show" className="flex flex-col px-1 pb-0.5">
          <span className="text-[13px] leading-[18px] text-white/85">{timeGreeting()},</span>
          <span className="text-xl font-bold leading-7 text-white">{fullCustomerName(customer?.name ?? home?.customerName)}</span>
        </motion.div>

        {/* Card tài khoản M-FIRST GOLD */}
        <motion.div custom={0} variants={blockVariants} initial="hidden" animate="show" className="flex flex-col rounded-card bg-surface shadow-raised">
          {/* Bấm vào tài khoản thanh toán → bảng lịch sử giao dịch chuyển tiền */}
          <button type="button" onClick={() => navigate('/transactions')} className="flex cursor-pointer items-center gap-3 px-4 py-3.5 text-left">
            <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-orange-soft text-primary">
              <Sun size={18} strokeWidth={1.5} />
            </span>
            <span className="flex flex-1 items-center gap-2">
              <span className="text-[15px] font-semibold tracking-[.01em] text-primary">{home?.productTier ?? ''}</span>
              <Badge variant="primary">Mới</Badge>
            </span>
            <ChevronRight size={20} strokeWidth={1.6} className="text-muted" />
          </button>
          <div className="mx-0 h-px bg-divider" />
          <div className="flex items-end justify-between px-4 pb-4 pt-3">
            <button type="button" onClick={() => navigate('/transactions')} className="flex cursor-pointer flex-col gap-0.5 text-left">
              <span className="text-[13px] font-semibold leading-[18px] tracking-[.04em] text-ink">{fullAccountNumber(customer?.maskedAccount)}</span>
              <span className="flex items-baseline gap-2">
                <span className="text-[26px] font-bold leading-8 tracking-[.02em]">
                  {balanceHidden ? '•••••••' : formatVnd(customer?.balance ?? 0).replace(' ₫', '')}
                </span>
                <span className="text-[17px] font-medium text-muted">VND</span>
              </span>
            </button>
            <button type="button" aria-label="Ẩn/hiện số dư" onClick={toggleBalance} className="flex h-10 w-10 cursor-pointer items-center justify-center text-ink">
              {balanceHidden ? <EyeOff size={22} strokeWidth={1.5} /> : <Eye size={22} strokeWidth={1.5} />}
            </button>
          </div>
        </motion.div>

        {/* Lưới tiện ích 2×3 + Rewards/Xem thêm */}
        <motion.div custom={1} variants={blockVariants} initial="hidden" animate="show" className="flex flex-col rounded-card bg-surface px-1 pt-1.5 shadow-card">
          <div className="grid grid-cols-3 py-1.5">
            <QuickAction icon={<TransferIcon />} label="Chuyển tiền" onClick={() => navigate('/transfer')} />
            <QuickAction icon={<QrCode size={30} strokeWidth={1.5} />} label="Quét QR" />
            <QuickAction icon={<PiggyBank size={30} strokeWidth={1.5} />} label="Tiền gửi" onClick={() => navigate('/invest')} />
          </div>
          <div className="mx-3 h-px bg-divider" />
          <div className="grid grid-cols-3 py-1.5">
            <QuickAction icon={<CreditCard size={30} strokeWidth={1.5} />} label="Thẻ" onClick={() => navigate('/cards')} />
            <QuickAction icon={<ReceiptText size={30} strokeWidth={1.5} />} label="Thanh toán" onClick={() => navigate('/payments')} />
            <QuickAction icon={<HandCoins size={30} strokeWidth={1.5} />} label="Vay" onClick={() => navigate('/loans')} />
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
          onClick={() => navigate('/chat-banking')}
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
            <span className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-primary">Trợ lý AI Guardian</span>
              <Badge variant="primary">Mới</Badge>
            </span>
            <span className="block text-[13px] leading-[18px]">{home?.assistantHint ?? ''}</span>
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
        <motion.span
          className="relative block cursor-pointer"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 260, damping: 18 }}
          onClick={() => navigate('/copilot')}
        >
          <img
            src="/assets/msb-bot.png"
            alt="Trợ lý AI MSB"
            className="block h-[68px] w-[68px]"
            style={{ filter: 'drop-shadow(0 6px 14px rgba(240,90,40,.38))' }}
          />
          <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[.04em] text-white shadow-primary">
            New
          </span>
        </motion.span>
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

      {/* Toast thông báo trượt xuống như noti hệ điều hành, sau chuyển tiền thành công */}
      {notiToast && (
        <motion.button
          type="button"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          onClick={() => {
            clearNotiToast()
            setNotiOpen(true)
          }}
          className="absolute inset-x-4 top-3 z-40 flex cursor-pointer items-start gap-3 rounded-card bg-surface p-3 text-left shadow-float"
        >
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-orange-soft text-primary">
            <Bell size={18} strokeWidth={1.7} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-semibold uppercase tracking-[.04em] text-primary">MSB mBank</span>
            <span className="block text-[13px] leading-[18px] text-ink">{notiToast.title}</span>
            <span className="block text-[11px] leading-4 text-muted">{notiToast.timeLabel}</span>
          </span>
        </motion.button>
      )}

      <SearchSheet open={searchOpen} onOpenChange={setSearchOpen} />
      <HotlineSheet open={hotlineOpen} onOpenChange={setHotlineOpen} />
      <NotificationsSheet open={notiOpen} onOpenChange={setNotiOpen} />
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </MobileFrame>
  )
}
