import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { DesktopShell } from '@/shell/DesktopShell'

/**
 * Khung chung của bốn màn vận hành phụ (Case, Kịch bản, Mô hình, Nhật ký AI).
 *
 * Bốn màn này ra đời cùng lúc và giống nhau tới từng khoảng cách: tiêu đề, phụ
 * đề, hàng bộ lọc, rồi nội dung. Gom vào một chỗ để sau này đổi khoảng cách hay
 * kiểu chữ chỉ phải sửa một lần — và để chúng không trôi dần ra khác nhau.
 */
export function OpsPage({
  title,
  subtitle,
  toolbar,
  children,
}: {
  title: string
  subtitle: string
  toolbar?: ReactNode
  children: ReactNode
}) {
  return (
    <DesktopShell>
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold leading-8">{title}</h1>
            <p className="text-[13px] text-muted">{subtitle}</p>
          </div>
          {toolbar}
        </div>
        {children}
      </div>
    </DesktopShell>
  )
}

/**
 * Màn rỗng phải nói được việc tiếp theo.
 *
 * "Không có dữ liệu" để chuyên viên đứng im; câu giải thích kèm một lối đi tiếp
 * mới giúp họ biết mình cần làm gì hoặc chờ điều gì.
 */
export function OpsEmpty({ title, hint, actionLabel = 'Về Tổng quan', to = '/ops', onAction }: {
  title: string
  hint: string
  actionLabel?: string
  to?: string
  /** Khi việc tiếp theo nằm ngay trên màn này (ví dụ xoá bộ lọc) thì lối đi tiếp
   *  là một nút, không phải đường dẫn sang màn khác. */
  onAction?: () => void
}) {
  const actionClass = 'mt-2 text-[13px] font-semibold text-primary hover:text-primary-pressed'
  return (
    <div className="flex flex-col items-center gap-2 rounded-card bg-surface px-6 py-14 text-center shadow-card">
      <span className="text-[15px] font-semibold">{title}</span>
      <span className="max-w-[420px] text-[13px] leading-5 text-muted">{hint}</span>
      {onAction ? (
        <button type="button" onClick={onAction} className={`cursor-pointer ${actionClass}`}>
          {actionLabel}
        </button>
      ) : (
        <Link to={to} className={actionClass}>
          {actionLabel} →
        </Link>
      )}
    </div>
  )
}

export function OpsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-card bg-surface p-5 shadow-card">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  )
}

/** Hàng bộ lọc dạng pill — cùng kiểu với bộ lọc trạng thái trên Ops Dashboard. */
export function OpsFilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[]
  value: T
  onChange: (key: T) => void
}) {
  return (
    <div className="flex items-center gap-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={
            value === opt.key
              ? 'cursor-pointer rounded-full bg-orange-soft px-3 py-1.5 text-xs font-semibold text-primary-pressed'
              : 'cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-muted hover:bg-app'
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
