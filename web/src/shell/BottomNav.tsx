import { Home, QrCode, Shield, Sparkles, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const items = [
  { key: 'home', label: 'Trang chủ', icon: Home, to: '/' },
  { key: 'copilot', label: 'Copilot', icon: Sparkles, to: '/copilot' },
  { key: 'qr', label: 'QR', icon: QrCode, to: '/transfer/review' },
  { key: 'safety', label: 'An toàn', icon: Shield, to: '/safety-center' },
  { key: 'profile', label: 'Cá nhân', icon: User, to: '/' },
] as const

export function BottomNav({ active }: { active: 'home' | 'copilot' | 'safety' }) {
  return (
    <nav className="relative z-30 flex-none border-t border-line bg-surface px-2 pb-[22px] pt-2">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const isActive = item.key === active
          if (item.key === 'qr') {
            return (
              <Link key={item.key} to={item.to} className="flex flex-col items-center justify-start">
                <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-primary">
                  <QrCode size={22} strokeWidth={1.6} />
                </span>
                <span className="mt-1 text-[11px] font-medium text-muted">QR</span>
              </Link>
            )
          }
          const Icon = item.icon
          return (
            <Link
              key={item.key}
              to={item.to}
              className={cn('flex flex-col items-center gap-1 py-1', isActive ? 'text-primary' : 'text-muted')}
            >
              <Icon size={22} strokeWidth={1.6} />
              <span className={cn('text-[11px]', isActive ? 'font-semibold' : 'font-medium')}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
