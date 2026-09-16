import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, ChevronDown, Eye, EyeOff, Headphones, QrCode, ScanFace, ShieldCheck, UserRoundPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
// MOCK CŨ: import { demoCustomer } from '@/data/demo-scenarios'
import { getSessionCustomer } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { MobileFrame } from '@/shell/MobileFrame'

const DEMO_PASSWORD = '123456'
const SPLASH_MS = 1_900

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

/**
 * Splash chuyển cảnh: giữ nguyên màn login phía sau (phủ mờ nhẹ),
 * chữ M của logo MSB nổi lên giữa, vòng tròn mờ xoay quanh.
 */
function LoginSplash() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-[35] flex flex-col items-center justify-center gap-6 bg-black/25 backdrop-blur-[2px]"
    >
      {/* Logo M nổi (PNG nền trong suốt), vòng mờ bán kính ~1cm xoay quanh */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0, y: 26 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 250, damping: 17 }}
        className="relative flex h-[76px] w-[76px] items-center justify-center"
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-[3px] border-white/25 border-t-white/90"
        />
        <motion.img
          src="/assets/icon-logo-msb.png"
          alt="MSB"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="h-8 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,.35)]"
        />
      </motion.div>
      <span className="flex items-center gap-2 text-[13px] text-white/85">
        <ShieldCheck size={15} strokeWidth={1.7} className="text-success-bright" />
        Đăng nhập an toàn cùng Scam Shield…
      </span>
    </motion.div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const { data: customer } = useQuery({ queryKey: ['session-customer'], queryFn: getSessionCustomer })

  const [splash, setSplash] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Hiệu ứng nhập mật khẩu: tự gõ từng ký tự khi màn hình mở
  useEffect(() => {
    let i = 0
    let interval: ReturnType<typeof setInterval>
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1
        setPassword(DEMO_PASSWORD.slice(0, i))
        if (i >= DEMO_PASSWORD.length) clearInterval(interval)
      }, 150)
    }, 700)
    return () => {
      clearTimeout(start)
      clearInterval(interval)
    }
  }, [])

  function signIn(to = '/') {
    if (splash) return
    setSplash(true)
    setTimeout(() => {
      login()
      navigate(to)
    }, SPLASH_MS)
  }

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
              <span className="block text-xl font-semibold leading-7 text-white">{customer?.name ?? '…'}</span>
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white">
              <UserRoundPlus size={20} strokeWidth={1.6} />
            </span>
          </div>

          {/* Ô mật khẩu: gõ thật được, chấm hiện dần, mắt để xem mật khẩu */}
          <div
            className="relative flex h-12 cursor-text items-center gap-2.5 rounded-btn border border-white/20 bg-black/30 px-3.5"
            onClick={() => inputRef.current?.focus()}
          >
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              aria-label="Mật khẩu"
              className={
                showPassword
                  ? 'min-w-0 flex-1 bg-transparent text-[15px] font-semibold tracking-[.2em] text-white outline-none'
                  : 'pointer-events-none absolute inset-0 opacity-0'
              }
            />
            {!showPassword && (
              <span className="flex min-w-0 flex-1 items-center gap-[7px]">
                <AnimatePresence>
                  {password.split('').map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 24 }}
                      className="block h-2 w-2 rounded-full bg-white"
                    />
                  ))}
                </AnimatePresence>
                {(focused || password.length < DEMO_PASSWORD.length) && (
                  <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.1, repeat: Infinity }} className="ml-0.5 block h-5 w-[1.5px] bg-gold" />
                )}
              </span>
            )}
            <span className="text-xs text-white/70">Mật khẩu</span>
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
              onClick={(e) => {
                e.stopPropagation()
                setShowPassword((v) => !v)
              }}
              className="flex h-9 w-9 flex-none cursor-pointer items-center justify-center text-white/80 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} strokeWidth={1.6} /> : <Eye size={20} strokeWidth={1.6} />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => signIn('/')}
            className="flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-btn text-base font-semibold active:scale-[.98]"
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
          <button type="button" onClick={() => signIn('/transfer/review')} className="flex cursor-pointer flex-col items-center gap-[7px] text-white">
            <TransferIcon />
            <span className="text-xs font-medium leading-4">Chuyển tiền</span>
          </button>
          <button type="button" onClick={() => signIn('/')} className="flex cursor-pointer flex-col items-center gap-[7px] border-x border-white/20 text-white">
            <QrCode size={24} strokeWidth={1.5} />
            <span className="text-xs font-medium leading-4">Quét QR</span>
          </button>
          <button type="button" onClick={() => navigate('/support')} className="flex cursor-pointer flex-col items-center gap-[7px] text-white">
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

      {/* Splash logo MSB đỏ xoay vòng */}
      <AnimatePresence>{splash && <LoginSplash />}</AnimatePresence>
    </MobileFrame>
  )
}
