import type { ReactNode } from 'react'
import { Briefcase, FileText, History, LayoutGrid, LineChart, Search, TriangleAlert } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { demoOpsAlerts } from '@/data/demo-scenarios'
import { cn } from '@/lib/utils'

const menu = [
  { key: 'overview', label: 'Tổng quan', icon: LayoutGrid, to: '/ops' },
  { key: 'alerts', label: 'Cảnh báo', icon: TriangleAlert, to: `/ops/alerts/${demoOpsAlerts[0].id}`, badge: String(demoOpsAlerts.length) },
  { key: 'cases', label: 'Case', icon: Briefcase, to: '/ops' },
  { key: 'scenarios', label: 'Kịch bản lừa đảo', icon: FileText, to: '/ops' },
  { key: 'models', label: 'Mô hình & ngưỡng', icon: LineChart, to: '/ops' },
  { key: 'audit', label: 'Nhật ký quyết định AI', icon: History, to: '/ops' },
]

function SystemStatus() {
  const rows = [
    { label: 'API Gateway', value: 'OK', tone: 'var(--msb-success-bright)' },
    { label: 'Risk Engine', value: 'OK', tone: 'var(--msb-success-bright)' },
    { label: 'LLM GreenNode', value: 'Chậm', tone: 'var(--msb-warning-bright)' },
  ]
  return (
    <div className="mt-auto flex flex-col gap-2 rounded-xl bg-sidebar-soft p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[.06em] text-muted">Tình trạng hệ thống</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between text-xs text-sidebar-text">
          <span>{r.label}</span>
          <span className="flex items-center gap-1.5" style={{ color: r.tone }}>
            <span className="block h-[7px] w-[7px] rounded-full" style={{ background: r.tone }} />
            {r.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function DesktopShell({ children, breadcrumb }: { children: ReactNode; breadcrumb?: ReactNode }) {
  const location = useLocation()
  const activeKey = location.pathname.startsWith('/ops/alerts') ? 'alerts' : 'overview'
  return (
    <div className="flex min-h-screen bg-app">
      {/* Sidebar tối màu */}
      <aside className="sticky top-0 flex h-screen w-[240px] flex-none flex-col gap-1 overflow-y-auto bg-sidebar px-4 py-6 text-white">
        <div className="px-2 pb-7">
          <div className="text-2xl font-bold tracking-[-.02em] text-primary">MSB</div>
          <div className="text-[13px] font-medium text-muted">Guardian Ops</div>
        </div>
        {menu.map((item) => {
          const isActive = item.key === activeKey
          const Icon = item.icon
          return (
            <Link
              key={item.key}
              to={item.to}
              className={cn(
                'flex h-[42px] items-center gap-2.5 rounded-[10px] px-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-primary/16 font-semibold text-[color:var(--msb-orange-300)]' : 'text-sidebar-text hover:bg-white/5',
              )}
            >
              <Icon size={18} strokeWidth={1.6} />
              <span className="flex-1">{item.label}</span>
              {item.badge && <span className="rounded-full bg-danger px-2 py-0.5 text-[11px] font-semibold text-white">{item.badge}</span>}
            </Link>
          )
        })}
        <SystemStatus />
        <div className="mt-3 flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-soft text-[13px] font-semibold">QB</span>
          <span>
            <span className="block text-[13px] font-medium">Trần Quốc Bảo</span>
            <span className="block text-[11px] text-muted">Fraud Ops · Ca sáng</span>
          </span>
        </div>
      </aside>

      {/* Vùng nội dung */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-none items-center justify-between border-b border-line bg-surface px-6">
          {breadcrumb ?? (
            <label className="flex h-10 w-[380px] items-center gap-2.5 rounded-[10px] bg-app px-3.5 text-sm text-muted">
              <Search size={18} strokeWidth={1.6} />
              <input
                className="w-full bg-transparent outline-none placeholder:text-muted"
                placeholder="Tìm khách hàng, số tài khoản, case…"
              />
            </label>
          )}
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-muted">Thứ Ba, 15/09/2026 · 09:41</span>
            <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1.5 text-xs font-semibold text-success-deep">
              <span className="block h-[7px] w-[7px] rounded-full bg-success" />
              Live
            </span>
            <span className="h-7 w-px bg-line" />
            <span className="flex items-center gap-2.5">
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-orange-soft text-[13px] font-semibold text-primary">QB</span>
              <span>
                <span className="block text-[13px] font-semibold text-ink">Trần Quốc Bảo</span>
                <span className="block text-xs text-muted">Fraud Ops</span>
              </span>
            </span>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
