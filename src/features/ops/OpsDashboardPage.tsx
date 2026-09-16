import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Download, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertStatusBadge, RiskScoreCell, useCountUp } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
// MOCK CŨ: import { demoHourlyAlerts, demoOpsDeltas, demoScenarioCounts } from '@/data/demo-scenarios'
import type { AlertStatus, OpsMetrics } from '@/data/types'
import { getOpsAlerts, getOpsDashboard, getOpsMetrics } from '@/lib/api'
import { formatTime, formatVnd, formatVndCompact } from '@/lib/format'
import { useGuardianStore } from '@/lib/store'
import { DesktopShell } from '@/shell/DesktopShell'

const barShades = ['var(--msb-primary)', 'var(--msb-orange-300)', 'var(--msb-orange-200)', 'var(--msb-orange-border)', 'var(--msb-border)']

const statusFilters: { key: AlertStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'investigating', label: 'Đang điều tra' },
  { key: 'confirmed', label: 'Xác nhận lừa đảo' },
  { key: 'dismissed', label: 'Bỏ qua' },
]

function KpiTile({ label, value, format, deltaKey, metrics }: { label: string; value: number; format: (n: number) => string; deltaKey: keyof OpsMetrics; metrics: boolean }) {
  const animated = useCountUp(value, 1_200, metrics)
  // Cùng queryKey với OpsDashboardPage nên bốn ô KPI dùng chung một lời gọi.
  const { data: dashboard } = useQuery({ queryKey: ['ops-dashboard'], queryFn: getOpsDashboard })
  const delta = dashboard?.deltas[deltaKey]
  return (
    <div className="flex flex-col gap-1 rounded-card bg-surface p-5 shadow-card">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="text-[28px] font-bold leading-9">{format(animated)}</span>
      <span className={delta?.up === false ? 'flex items-center gap-1 text-xs font-semibold text-danger' : 'flex items-center gap-1 text-xs font-semibold text-success-deep'}>
        <ArrowUpRight size={14} strokeWidth={2} />
        {delta?.valueLabel ?? ''}
      </span>
    </div>
  )
}

export function OpsDashboardPage() {
  const navigate = useNavigate()
  const overrides = useGuardianStore((s) => s.alertStatusOverrides)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all')

  const { data: metrics } = useQuery({ queryKey: ['ops-metrics'], queryFn: getOpsMetrics })
  const { data: alerts, isPending: alertsPending } = useQuery({ queryKey: ['ops-alerts'], queryFn: getOpsAlerts })
  const { data: dashboard } = useQuery({ queryKey: ['ops-dashboard'], queryFn: getOpsDashboard })

  const rows = useMemo(() => {
    const list = (alerts ?? []).map((a) => ({ ...a, status: overrides[a.id] ?? a.status }))
    const q = search.trim().toLowerCase()
    return list.filter((a) => {
      const matchQ = q.length === 0 || a.customer.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.assessment.scenarioName.toLowerCase().includes(q)
      const matchS = statusFilter === 'all' || a.status === statusFilter
      return matchQ && matchS
    })
  }, [alerts, overrides, search, statusFilter])

  const scenarioData = useMemo(
    () => [...(dashboard?.scenarioCounts ?? [])].sort((a, b) => b.count - a.count),
    [dashboard],
  )

  return (
    <DesktopShell>
      <div className="flex flex-col gap-4">
        {/* Tiêu đề */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold leading-8">Giám sát Scam Shield</h1>
            <p className="text-[13px] text-muted">Hôm nay · Toàn bộ kênh Mobile Banking</p>
          </div>
          <Button size="sm">
            <Download size={15} strokeWidth={1.8} />
            Xuất báo cáo
          </Button>
        </div>

        {/* 4 KPI */}
        <div className="grid grid-cols-4 gap-4">
          <KpiTile label="Giao dịch đã quét hôm nay" value={metrics?.scannedToday ?? 0} format={(n) => n.toLocaleString('vi-VN')} deltaKey="scannedToday" metrics={!!metrics} />
          <KpiTile label="Cảnh báo đã bắn" value={metrics?.alertsFired ?? 0} format={(n) => n.toLocaleString('vi-VN')} deltaKey="alertsFired" metrics={!!metrics} />
          <KpiTile label="Tỷ lệ khách huỷ giao dịch" value={metrics?.cancelRatePct ?? 0} format={(n) => `${n}%`} deltaKey="cancelRatePct" metrics={!!metrics} />
          <KpiTile label="Giá trị đã bảo vệ" value={metrics?.protectedValueVnd ?? 0} format={formatVndCompact} deltaKey="protectedValueVnd" metrics={!!metrics} />
        </div>

        {/* 2 biểu đồ */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 rounded-card bg-surface p-5 shadow-card">
            <span className="text-[15px] font-semibold">Cảnh báo theo giờ</span>
            <span className="text-xs text-muted">24 giờ qua · đỉnh 16 cảnh báo lúc 09h</span>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={dashboard?.hourlyAlerts ?? []} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="alertFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--msb-primary)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--msb-primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--msb-divider)" />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--msb-text-muted)' }} interval={3} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--msb-text-muted)' }} width={32} />
                <Tooltip
                  formatter={(value) => [`${value ?? 0} cảnh báo`, 'Số cảnh báo']}
                  labelFormatter={(label) => `Khung giờ ${label}`}
                  contentStyle={{ borderRadius: 12, border: '1px solid var(--msb-border)', fontSize: 13, fontFamily: 'var(--msb-font)' }}
                />
                <Area type="monotone" dataKey="count" stroke="var(--msb-primary)" strokeWidth={2.5} fill="url(#alertFill)" isAnimationActive animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-2 rounded-card bg-surface p-5 shadow-card">
            <span className="text-[15px] font-semibold">Theo kịch bản lừa đảo</span>
            <span className="text-xs text-muted">142 cảnh báo hôm nay</span>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={scenarioData} layout="vertical" margin={{ top: 4, right: 28, bottom: 0, left: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={185} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--msb-text)' }} />
                <Tooltip
                  formatter={(value) => [`${value ?? 0} vụ`, 'Số vụ']}
                  contentStyle={{ borderRadius: 12, border: '1px solid var(--msb-border)', fontSize: 13, fontFamily: 'var(--msb-font)' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18} isAnimationActive animationDuration={800} label={{ position: 'right', fontSize: 12, fontWeight: 600, fill: 'var(--msb-text)' }}>
                  {scenarioData.map((entry, i) => (
                    <Cell key={entry.name} fill={barShades[i] ?? barShades[0]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bảng cảnh báo */}
        <div className="flex flex-col rounded-card bg-surface shadow-card">
          <div className="flex items-center justify-between gap-4 p-5 pb-3">
            <span className="text-[15px] font-semibold">Cảnh báo cần xử lý</span>
            <div className="flex items-center gap-2">
              <label className="flex h-9 w-[240px] items-center gap-2 rounded-[10px] border border-line px-3 text-[13px] text-muted">
                <Search size={15} strokeWidth={1.7} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm khách hàng, case…" className="w-full bg-transparent outline-none placeholder:text-muted" />
              </label>
              {statusFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={
                    statusFilter === f.key
                      ? 'cursor-pointer rounded-full bg-orange-soft px-3 py-1.5 text-xs font-semibold text-primary-pressed'
                      : 'cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-muted hover:bg-app'
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[90px_1.3fr_1fr_150px_1.2fr_160px] gap-2 border-b border-line bg-[color:var(--msb-bg)] px-5 py-2 text-[11px] font-semibold uppercase tracking-[.06em] text-muted">
            <span>Thời gian</span>
            <span>Khách hàng</span>
            <span>Số tiền</span>
            <span>Risk Score</span>
            <span>Kịch bản</span>
            <span>Trạng thái</span>
          </div>
          {alertsPending ? (
            <div className="flex flex-col gap-2 p-5">
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
            </div>
          ) : (
            rows.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => navigate(`/ops/alerts/${alert.id}`)}
                className={
                  alert.assessment.score >= 85
                    ? 'grid cursor-pointer grid-cols-[90px_1.3fr_1fr_150px_1.2fr_160px] items-center gap-2 border-b border-divider bg-[color:var(--msb-danger-row)] px-5 py-2.5 text-left text-[13px] last:border-0 hover:bg-orange-soft/60'
                    : 'grid cursor-pointer grid-cols-[90px_1.3fr_1fr_150px_1.2fr_160px] items-center gap-2 border-b border-divider px-5 py-2.5 text-left text-[13px] last:border-0 hover:bg-app'
                }
              >
                <span className="text-muted">{formatTime(alert.timestamp)}</span>
                <span className="font-semibold">{alert.customer}</span>
                <span className="font-semibold">{formatVnd(alert.amount)}</span>
                <RiskScoreCell score={alert.assessment.score} />
                <span>{alert.assessment.scenarioName}</span>
                <span>
                  <AlertStatusBadge status={alert.status} />
                </span>
              </button>
            ))
          )}
          <div className="px-5 py-3 text-xs text-muted">Đang xem {rows.length} trong {alerts?.length ?? 0} cảnh báo hôm nay</div>
        </div>
      </div>
    </DesktopShell>
  )
}
