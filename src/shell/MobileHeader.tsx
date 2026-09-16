import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface MobileHeaderProps {
  title: string
  /** Route quay lại; mặc định navigate(-1) */
  backTo?: string
  right?: ReactNode
  className?: string
}

export function MobileHeader({ title, backTo, right, className }: MobileHeaderProps) {
  const navigate = useNavigate()
  return (
    <div className={cn('flex h-12 flex-none items-center gap-1 px-3', className)}>
      <button
        type="button"
        aria-label="Quay lại"
        onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-black/5"
      >
        <ChevronLeft size={24} strokeWidth={1.8} />
      </button>
      <h1 className="flex-1 text-[17px] font-semibold text-ink">{title}</h1>
      {right}
    </div>
  )
}
