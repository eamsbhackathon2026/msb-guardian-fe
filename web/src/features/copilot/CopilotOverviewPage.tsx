import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { MessageCircle, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Cell, Pie, PieChart } from 'recharts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CopilotOverview, Insight, SpendingCategory } from '@/data/types'
import { getCopilotOverview } from '@/lib/api'
import { formatPct, formatVnd } from '@/lib/format'
import { BottomNav } from '@/shell/BottomNav'
import { MobileFrame } from '@/shell/MobileFrame'
import { MobileHeader } from '@/shell/MobileHeader'

const barShades = ['var(--msb-primary)', 'var(--msb-orange-300)', 'var(--msb-orange-200)', 'var(--msb-orange-border)', 'var(--msb-border)']

function BudgetDonut({ overview }: { overview: CopilotOverview }) {
  const { spentVnd, budgetVnd, monthLabel } = overview.budget
  const pct = Math.round((spentVnd / budgetVnd) * 100)
  const remaining = budgetVnd - spentVnd
  const data = [
    { name: 'spent', value: spentVnd },
    { name: 'left', value: remaining },
  ]
  return (
    <div className="flex items-center gap-4 rounded-card bg-surface p-4 shadow-card">
      <div className="relative h-[124px] w-[124px] flex-none">
        <PieChart width={124} height={124}>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={46}
            outerRadius={58}
            startAngle={90}
            endAngle={-270}
            strokeWidth={0}
            cornerRadius={8}
            isAnimationActive
            animationDuration={900}
          >
            <Cell fill="var(--msb-primary)" />
            <Cell fill="var(--msb-divider)" />
          </Pie>
        </PieChart>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-7">{pct}%</span>
          <span className="text-[11px] text-muted">ngân sách</span>
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[13px] text-muted">Đã chi · {monthLabel}</span>
        <span className="text-xl font-semibold">{formatVnd(spentVnd)}</span>
        <span className="text-[13px] text-muted">Còn lại · 15 ngày</span>
        <span className="text-[17px] font-medium text-success">{formatVnd(remaining)}</span>
        <span className="text-xs text-muted">Ngân sách {formatVnd(budgetVnd)}</span>
      </div>
    </div>
  )
}

function CategoryRow({ cat, index }: { cat: SpendingCategory; index: number }) {
  const trendUp = cat.trendPct > 0
  return (
    <div className="flex flex-col gap-1.5 py-2.5">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{cat.labelVi}</span>
        <span className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{formatVnd(cat.amount)}</span>
          <span className="w-9 text-right text-xs text-muted">{cat.pct}%</span>
          <span className={trendUp ? 'flex items-center gap-0.5 text-xs font-semibold text-danger' : 'flex items-center gap-0.5 text-xs font-semibold text-success'}>
            {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {formatPct(Math.abs(cat.trendPct), false)}
          </span>
        </span>
      </span>
      <span className="block h-2 overflow-hidden rounded-full bg-divider">
        <motion.span
          className="block h-full rounded-full"
          style={{ background: barShades[index] ?? barShades[0] }}
          initial={{ width: 0 }}
          animate={{ width: `${cat.pct}%` }}
          transition={{ duration: 0.7, delay: 0.15 + index * 0.08, ease: 'easeOut' }}
        />
      </span>
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  if (insight.kind === 'action') {
    return (
      <div className="flex flex-col gap-2 rounded-card border-l-4 border-primary bg-orange-soft p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary-pressed">Hành động gợi ý</span>
        <span className="text-[15px] font-semibold leading-snug">{insight.title}</span>
        <span className="text-[13px] leading-relaxed text-muted">{insight.body}</span>
        {insight.ctaLabel && (
          <Button size="md" className="mt-1 w-full">
            {insight.ctaLabel}
          </Button>
        )}
      </div>
    )
  }
  const isWarning = insight.kind === 'warning'
  return (
    <div className={isWarning ? 'flex flex-col gap-1 rounded-card border-l-4 border-warning bg-surface p-4 shadow-card' : 'flex flex-col gap-1 rounded-card bg-surface p-4 shadow-card'}>
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
        <Sparkles size={12} className="text-primary" /> AI Insight
      </span>
      <span className="text-sm font-semibold leading-snug">{insight.title}</span>
      <span className="text-[13px] leading-relaxed text-muted">{insight.body}</span>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-[156px] rounded-card" />
      <Skeleton className="h-[280px] rounded-card" />
      <Skeleton className="h-[90px] rounded-card" />
      <Skeleton className="h-[90px] rounded-card" />
    </div>
  )
}

export function CopilotOverviewPage() {
  const navigate = useNavigate()
  const { data, isPending } = useQuery({ queryKey: ['copilot-overview'], queryFn: getCopilotOverview })

  return (
    <MobileFrame>
      <MobileHeader title="Financial Copilot" backTo="/" right={<span className="mr-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-medium">Tháng 9/2026</span>} />
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-24 pt-1">
        {isPending || !data ? (
          <OverviewSkeleton />
        ) : (
          <>
            <BudgetDonut overview={data} />
            <div className="rounded-card bg-surface px-4 py-2 shadow-card">
              <span className="flex items-baseline justify-between pt-2">
                <span className="text-[15px] font-semibold">Theo nhóm chi tiêu</span>
                <span className="text-xs text-muted">so với tháng 8</span>
              </span>
              {data.categories.map((cat, i) => (
                <CategoryRow key={cat.key} cat={cat} index={i} />
              ))}
            </div>
            {data.insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </>
        )}
      </div>
      {/* CTA nổi */}
      <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center">
        <Button className="pointer-events-auto rounded-full px-6 shadow-primary" onClick={() => navigate('/copilot/chat')}>
          <MessageCircle size={20} strokeWidth={1.7} />
          Hỏi Copilot
        </Button>
      </div>
      <BottomNav active="copilot" />
    </MobileFrame>
  )
}
