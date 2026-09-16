import { useEffect, useRef, useState } from 'react'
import { Banknote, Car, Coffee, Popcorn, ReceiptText, ShoppingBag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { AlertStatus } from '@/data/types'
import { cn } from '@/lib/utils'

/* ---- Icon + màu theo nhóm chi tiêu ---- */

const categoryMeta: Record<string, { icon: typeof Coffee; bg: string; fg: string }> = {
  'Ăn uống': { icon: Coffee, bg: 'bg-orange-soft', fg: 'text-primary' },
  'Di chuyển': { icon: Car, bg: 'bg-success-soft', fg: 'text-success' },
  'Mua sắm': { icon: ShoppingBag, bg: 'bg-info-soft', fg: 'text-info' },
  'Hoá đơn': { icon: ReceiptText, bg: 'bg-warning-soft', fg: 'text-warning' },
  'Thu nhập': { icon: Banknote, bg: 'bg-success-soft', fg: 'text-success' },
  Khác: { icon: Popcorn, bg: 'bg-divider', fg: 'text-muted' },
}

export function CategoryIcon({ category, size = 40 }: { category: string; size?: number }) {
  const meta = categoryMeta[category] ?? categoryMeta['Khác']
  const Icon = meta.icon
  return (
    <span className={cn('flex flex-none items-center justify-center rounded-full', meta.bg, meta.fg)} style={{ width: size, height: size }}>
      <Icon size={size * 0.45} strokeWidth={1.6} />
    </span>
  )
}

/* ---- Badge trạng thái alert (ops) ---- */

const statusMeta: Record<AlertStatus, { label: string; variant: 'warning' | 'danger' | 'neutral' | 'info' }> = {
  pending: { label: 'Chờ xử lý', variant: 'warning' },
  confirmed: { label: 'Xác nhận lừa đảo', variant: 'danger' },
  dismissed: { label: 'Bỏ qua', variant: 'neutral' },
  investigating: { label: 'Đang điều tra', variant: 'info' },
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  const meta = statusMeta[status]
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

/* ---- Badge Risk Score theo mức ---- */

export function riskTone(score: number): string {
  if (score >= 70) return 'var(--msb-danger)'
  if (score >= 40) return 'var(--msb-warning)'
  return 'var(--msb-success)'
}

export function RiskScoreCell({ score }: { score: number }) {
  const tone = riskTone(score)
  return (
    <span className="flex items-center gap-2">
      <span className="text-lg font-bold" style={{ color: tone }}>
        {score}
      </span>
      <span className="h-1.5 w-[64px] overflow-hidden rounded-full bg-divider">
        <span className="block h-full rounded-full" style={{ width: `${score}%`, background: tone }} />
      </span>
    </span>
  )
}

/* ---- Hook đếm số tăng dần ---- */

export function useCountUp(target: number, durationMs = 1_200, start = true): number {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    if (!start) return
    let t0: number | null = null
    const tick = (now: number) => {
      if (t0 === null) t0 = now
      const p = Math.min(1, Math.max(0, (now - t0) / durationMs))
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, durationMs, start])
  return value
}
