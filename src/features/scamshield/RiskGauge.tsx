import { useEffect, useState } from 'react'
import { riskTone } from '@/components/shared'

const ARC_LENGTH = Math.PI * 80 // bán kính 80, nửa vòng

/**
 * Gauge bán nguyệt: số đếm tăng 0→score trong ~1.2s,
 * màu vòng cung chuyển xanh → vàng → đỏ theo mức hiện tại.
 */
export function RiskGauge({ score, levelLabel }: { score: number; levelLabel: string }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let t0: number | null = null
    let raf = 0
    const tick = (now: number) => {
      if (t0 === null) t0 = now
      const p = Math.min(1, Math.max(0, (now - t0) / 1_200))
      const eased = 1 - Math.pow(1 - p, 3)
      setCurrent(Math.round(score * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [score])

  const tone = riskTone(current)
  const dash = (current / 100) * ARC_LENGTH

  return (
    <div className="relative flex h-[128px] w-[212px] flex-col items-center">
      <svg width="212" height="118" viewBox="0 0 212 118">
        <path d="M 26 106 A 80 80 0 0 1 186 106" fill="none" stroke="var(--msb-danger-track)" strokeWidth="14" strokeLinecap="round" />
        <path
          d="M 26 106 A 80 80 0 0 1 186 106"
          fill="none"
          stroke={tone}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${ARC_LENGTH}`}
          style={{ transition: 'stroke 150ms linear' }}
        />
      </svg>
      <div className="absolute inset-x-0 top-[52px] flex flex-col items-center">
        <span className="text-[40px] font-bold leading-[44px]" style={{ color: tone }}>
          {current}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[.04em]" style={{ color: 'var(--msb-danger-deep)' }}>
          Risk Score · {levelLabel}
        </span>
      </div>
    </div>
  )
}
