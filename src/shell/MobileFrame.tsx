import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Giờ thật múi GMT+7 kiểu iOS ("9:41") — GMT+7 không có DST nên cộng offset trực tiếp */
function formatGmt7() {
  const now = new Date(Date.now() + 7 * 3_600_000)
  return `${now.getUTCHours()}:${String(now.getUTCMinutes()).padStart(2, '0')}`
}

function useGmt7Clock() {
  const [time, setTime] = useState(formatGmt7)
  useEffect(() => {
    const id = setInterval(() => setTime(formatGmt7()), 10_000)
    return () => clearInterval(id)
  }, [])
  return time
}

/** Container của màn hình điện thoại — dùng làm portal cho Sheet/Dialog bên trong khung */
const PhoneContainerContext = createContext<HTMLElement | null>(null)
export function usePhoneContainer() {
  return useContext(PhoneContainerContext)
}

interface MobileFrameProps {
  children: ReactNode
  /** Màu chữ status bar: 'dark' trên nền sáng, 'light' trên nền đậm */
  statusBar?: 'dark' | 'light'
  /** Màu home indicator; mặc định theo statusBar (vd Home: status trắng trên ảnh, indicator đen dưới nền sáng) */
  indicator?: 'dark' | 'light'
  /** Class cho nền màn hình (mặc định nền app) */
  screenClassName?: string
}

function StatusBar({ theme }: { theme: 'dark' | 'light' }) {
  const color = theme === 'dark' ? 'var(--msb-text)' : 'var(--msb-surface)'
  const time = useGmt7Clock()
  return (
    <div className="relative z-30 flex h-[54px] flex-none items-end justify-between px-[30px] pb-1.5 text-[15px] font-semibold" style={{ color }}>
      <span>{time}</span>
      <div className="flex items-center gap-1.5">
        <div className="flex items-end gap-[2px]">
          {[5, 7, 9, 11].map((h) => (
            <span key={h} className="block w-[3px] rounded-[1px]" style={{ height: h, background: color }} />
          ))}
        </div>
        <svg width="17" height="13" viewBox="0 0 17 13" fill="none">
          <path d="M8.5 3.5c2.4 0 4.6.9 6.3 2.4l1.7-1.8A11.4 11.4 0 0 0 8.5 1C5.4 1 2.6 2.2 .5 4.1l1.7 1.8A9 9 0 0 1 8.5 3.5zm0 4.2c1.3 0 2.5.5 3.4 1.3l1.7-1.8a7.6 7.6 0 0 0-10.2 0l1.7 1.8a5.2 5.2 0 0 1 3.4-1.3zm2 3.1L8.5 13l-2-2.2a2.9 2.9 0 0 1 4 0z" fill={color} />
        </svg>
        <div className="rounded-[4px] border-[1.5px] p-[1.5px]" style={{ borderColor: color, width: 25, height: 12 }}>
          <div className="h-full w-full rounded-[2px]" style={{ background: color }} />
        </div>
      </div>
    </div>
  )
}

/**
 * Khung điện thoại CSS thuần theo design-ref: 390×844, viền đen 12px,
 * bo góc 44px+, Dynamic Island, status bar 9:41, home indicator.
 */
export function MobileFrame({ children, statusBar = 'dark', indicator, screenClassName }: MobileFrameProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const indicatorTheme = indicator ?? statusBar
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas py-8">
      <div className="h-[868px] w-[414px] flex-none rounded-[56px] bg-[color:var(--msb-text)] p-[12px] shadow-pop">
        <div ref={setContainer} className={cn('relative flex h-[844px] w-[390px] flex-col overflow-hidden rounded-[44px] bg-app', screenClassName)}>
          {/* Dynamic Island */}
          <div className="absolute left-1/2 top-3 z-40 h-[34px] w-[120px] -translate-x-1/2 rounded-[20px] bg-[color:var(--msb-text)]" />
          <PhoneContainerContext.Provider value={container}>
            <StatusBar theme={statusBar} />
            {children}
          </PhoneContainerContext.Provider>
          {/* Home indicator */}
          <div
            className="pointer-events-none absolute bottom-2 left-1/2 z-40 h-[5px] w-[134px] -translate-x-1/2 rounded-[3px]"
            style={{ background: indicatorTheme === 'light' ? 'rgba(255,255,255,.85)' : 'var(--msb-text)' }}
          />
        </div>
      </div>
    </div>
  )
}
