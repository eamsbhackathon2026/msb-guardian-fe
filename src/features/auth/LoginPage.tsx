import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, ChevronDown, Eye, EyeOff, Headphones, QrCode, ScanFace, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
// MOCK CŨ: import { demoCustomer } from '@/data/demo-scenarios'
import { getHomeContent, login as apiLogin } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { fullCustomerName, timeGreeting } from '@/lib/format'
import { MobileFrame } from '@/shell/MobileFrame'

const DEMO_USERNAME = 'kh100008'
const DEMO_PASSWORD = '123456'
const SPLASH_MS = 1_900
/** Nhớ tên đăng nhập giữa các phiên: có tên → chỉ hỏi mật khẩu, chưa có → hỏi cả user + mật khẩu */
const REMEMBER_KEY = 'msb-remembered-user'

/** Nguyên do đăng nhập thất bại → câu tiếng Việt hiển thị dưới ô mật khẩu. */
function reasonLabel(reason?: string): string {
  if (reason === 'locked') return 'Tài khoản đã bị khoá do nhập sai nhiều lần'
  if (reason === 'disabled') return 'Tài khoản đã bị vô hiệu hoá'
  return 'Mật khẩu không đúng'
}

/** Icon đổi người dùng (người + hai mũi tên qua lại) — theo mẫu login.jpg */
function SwitchUserIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9.5" cy="8" r="3.6" />
      <path d="M3.5 19.5c.5-3.3 3-5.6 6-5.6 1.2 0 2.3.3 3.2.9" />
      <path d="M15.3 14.6h5.4" />
      <path d="M18.9 12.8l1.8 1.8-1.8 1.8" />
      <path d="M20.7 19.2h-5.4" />
      <path d="M17.1 17.4l-1.8 1.8 1.8 1.8" />
    </svg>
  )
}

/** Icon chuyển tiền kiểu MSB (mũi tên chéo trong vòng tròn) */
function TransferIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 14.5l5-5M10.5 9.5h4v4" />
    </svg>
  )
}

const glassCard = 'rounded-[18px] border border-white/25 bg-white/10 backdrop-blur-md'

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
      <span className="flex items-center gap-2 text-[13px] font-medium text-success-bright">
        <ShieldCheck size={15} strokeWidth={1.7} />
        Đăng nhập an toàn cùng Scam Shield…
      </span>
    </motion.div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const authLogin = useAuthStore((s) => s.login)
  const queryClient = useQueryClient()
  const { data: home } = useQuery({ queryKey: ['home-content'], queryFn: getHomeContent })

  const [splash, setSplash] = useState(false)
  const [rememberedUser, setRememberedUser] = useState<string | null>(() => localStorage.getItem(REMEMBER_KEY))
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const firstLogin = !rememberedUser

  // Hiệu ứng nhập mật khẩu: tự gõ từng ký tự — chỉ khi đã nhớ user (đăng nhập lần 2 trở đi)
  useEffect(() => {
    if (firstLogin) return
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
  }, [firstLogin])

  /** Lối tắt demo (Chuyển tiền / QR): vào thẳng bằng phiên demo, không xác thực. */
  function signIn(to = '/') {
    if (splash) return
    if (firstLogin) {
      const name = username.trim()
      if (!name || !password) return
      localStorage.setItem(REMEMBER_KEY, name)
      setRememberedUser(name)
    } else if (!password) {
      return
    }
    setSplash(true)
    setTimeout(() => {
      // Xoá cache truy vấn của phiên trước: đổi tài khoản mà giữ cache là danh
      // bạ/số dư của khách cũ hiện lên trong 60s staleTime đầu tiên.
      queryClient.clear()
      authLogin(null)
      navigate(to)
    }, SPLASH_MS)
  }

  /** Nút "Đăng nhập": xác thực thật với identity-service qua gateway.
   *  Lần đầu dùng tên vừa nhập, các lần sau dùng tên đã nhớ; đăng nhập
   *  thành công mới lưu tên vào localStorage. Sai mật khẩu → hiện thông báo,
   *  không vào. Gateway không gọi được → rơi về đăng nhập demo để buổi
   *  trình bày không bị chặn (cùng triết lý guardedCall). */
  async function signInWithPassword() {
    if (splash || submitting) return
    const name = firstLogin ? username.trim() : (rememberedUser ?? DEMO_USERNAME)
    if (!name || !password) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await apiLogin(name, password)
      if (!res.authenticated) {
        setSubmitting(false)
        setError(reasonLabel(res.reason))
        return
      }
      localStorage.setItem(REMEMBER_KEY, name)
      setRememberedUser(name)
      setSubmitting(false)
      setSplash(true)
      setTimeout(() => {
        // Gateway giờ trả dữ liệu theo khách vừa đăng nhập — xoá cache để mọi
        // màn (danh bạ, home, lịch sử...) refetch đúng khách mới.
        queryClient.clear()
        authLogin(res.user ?? null)
        navigate('/')
      }, SPLASH_MS)
    } catch {
      // Gateway hỏng hoàn toàn: giữ luồng demo thay vì kẹt ở màn đăng nhập.
      setSubmitting(false)
      signIn('/')
    }
  }

  function switchUser() {
    localStorage.removeItem(REMEMBER_KEY)
    setRememberedUser(null)
    setUsername('')
    setPassword('')
    setShowPassword(false)
    setError(null)
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
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] leading-[18px] text-white/85">
                {firstLogin ? 'Chào mừng đến với MSB,' : `${timeGreeting()},`}
              </span>
              {firstLogin ? (
                <span className="block text-xl font-semibold leading-7 text-white">Đăng nhập lần đầu</span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="text-xl font-semibold leading-7 text-white">{fullCustomerName(home?.customerName)}</span>
                  <button
                    type="button"
                    aria-label="Đổi người dùng"
                    onClick={switchUser}
                    className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center text-white/85 hover:text-white active:scale-95"
                  >
                    <SwitchUserIcon size={21} />
                  </button>
                </span>
              )}
            </span>
            <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-[10px] bg-white">
              <QrCode size={38} strokeWidth={1.4} className="text-[#15242c]" />
            </span>
          </div>

          {/* Ô tên đăng nhập — chỉ hiện ở lần đăng nhập đầu */}
          {firstLogin && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex h-12 items-center gap-2.5 rounded-btn border border-white/20 bg-black/30 px-3.5"
            >
              <UserRound size={18} strokeWidth={1.7} className="flex-none text-white/70" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                aria-label="Tên đăng nhập"
                placeholder="Tên đăng nhập"
                className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-white outline-none placeholder:text-white/50"
              />
            </motion.div>
          )}

          {/* Ô mật khẩu: gõ thật được, chấm hiện dần, mắt để xem mật khẩu */}
          <div
            className="relative flex h-12 cursor-text items-center gap-2.5 rounded-btn border border-white/20 bg-black/30 px-3.5"
            onClick={() => inputRef.current?.focus()}
          >
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
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

          {/* Thông báo lỗi đăng nhập (sai mật khẩu / tài khoản khoá) */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="alert"
                className="text-[13px] font-medium text-[#ffd7cf]"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => void signInWithPassword()}
            disabled={submitting}
            className="flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-btn text-base font-semibold active:scale-[.98] disabled:opacity-70"
            style={{ background: 'var(--msb-gradient-gold)', color: 'var(--msb-gold-ink)' }}
          >
            <ScanFace size={20} strokeWidth={1.7} />
            {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>

          <div className="flex items-center justify-between text-[13px] font-medium text-white/85">
            <span>Đăng ký tài khoản</span>
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
          Hotline 24/7 <span className="font-semibold text-gold">1900 6083</span> · Phiên bản 9.2.1
        </div>
      </motion.div>

      {/* Splash logo MSB đỏ xoay vòng */}
      <AnimatePresence>{splash && <LoginSplash />}</AnimatePresence>
    </MobileFrame>
  )
}
