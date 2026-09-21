import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Briefcase, FileText, History, LayoutGrid, LineChart, LogOut, TriangleAlert } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
// MOCK CŨ: import { demoOpsAlerts } from '@/data/demo-scenarios'
import { getOpsAlerts, getOpsSession } from '@/lib/api'
import { useOpsAuthStore } from '@/lib/ops-auth'
import { cn } from '@/lib/utils'
import { OpsSearch } from './OpsSearch'

/**
 * Menu phải dựng trong component vì mục "Cảnh báo" cần id của cảnh báo đầu tiên
 * và số lượng cảnh báo — hai giá trị nay đến từ gateway chứ không còn là hằng số.
 */
function buildMenu(firstAlertId: string | undefined, alertCount: number) {
  return [
  { key: 'overview', label: 'Tổng quan', icon: LayoutGrid, to: '/ops' },
  { key: 'alerts', label: 'Cảnh báo', icon: TriangleAlert, to: firstAlertId ? `/ops/alerts/${firstAlertId}` : '/ops', badge: alertCount ? String(alertCount) : undefined },
  { key: 'cases', label: 'Case', icon: Briefcase, to: '/ops/cases' },
  { key: 'scenarios', label: 'Kịch bản lừa đảo', icon: FileText, to: '/ops/scenarios' },
  { key: 'models', label: 'Mô hình & ngưỡng', icon: LineChart, to: '/ops/model' },
  { key: 'audit', label: 'Nhật ký quyết định AI', icon: History, to: '/ops/audit' },
  ]
}

/** Đường dẫn hiện tại thuộc mục nào trong sidebar. Thứ tự có ý nghĩa: /ops khớp
 *  mọi thứ nên phải xét cuối cùng. */
function activeMenuKey(pathname: string): string {
  if (pathname.startsWith('/ops/alerts')) return 'alerts'
  if (pathname.startsWith('/ops/cases')) return 'cases'
  if (pathname.startsWith('/ops/scenarios')) return 'scenarios'
  if (pathname.startsWith('/ops/model')) return 'models'
  if (pathname.startsWith('/ops/audit')) return 'audit'
  return 'overview'
}

/** Gateway gửi tone dạng ngữ nghĩa; màu là quyết định của giao diện. */
const toneVar: Record<'ok' | 'warn' | 'danger', string> = {
  ok: 'var(--msb-success-bright)',
  warn: 'var(--msb-warning-bright)',
  danger: 'var(--msb-danger)',
}

function SystemStatus() {
  const opsUsername = useOpsAuthStore((s) => s.user?.username)
  const { data: session } = useQuery({
    queryKey: ['ops-session', opsUsername],
    queryFn: () => getOpsSession(opsUsername),
  })
  const rows = (session?.systemStatus ?? []).map((r) => ({ ...r, tone: toneVar[r.tone] }))
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
  // Tab trình duyệt của khu vận hành mang tên sản phẩm; app khách vẫn giữ
  // title chung trong index.html.
  useEffect(() => {
    document.title = 'Scam Shield'
  }, [])
  const location = useLocation()
  const navigate = useNavigate()
  const activeKey = activeMenuKey(location.pathname)
  const opsUser = useOpsAuthStore((s) => s.user)
  const opsLogout = useOpsAuthStore((s) => s.logout)
  // Dùng chung queryKey với OpsDashboardPage nên react-query trả cache, không gọi thêm lần nào.
  const { data: alerts } = useQuery({ queryKey: ['ops-alerts'], queryFn: getOpsAlerts })
  const { data: session } = useQuery({
    queryKey: ['ops-session', opsUser?.username],
    queryFn: () => getOpsSession(opsUser?.username),
  })
  // Ưu tiên phiên đăng nhập nội bộ đang có (tên đúng người vừa đăng nhập, có
  // ngay cả khi lời gọi gateway chưa xong hoặc tạm hỏng); getOpsSession chỉ để
  // đồng bộ lại role/shift/initials từ identity-service khi gọi được.
  const operator = session?.operator ?? opsUser?.operator
  const menu = buildMenu(alerts?.[0]?.id, alerts?.length ?? 0)

  function handleLogout() {
    opsLogout()
    navigate('/ops/login', { replace: true })
  }
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
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-sidebar-soft text-[13px] font-semibold">{operator?.initials ?? ''}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium">{operator?.name ?? ''}</span>
            <span className="block truncate text-[11px] text-muted">{operator ? `${operator.role} · ${operator.shift}` : ''}</span>
          </span>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Đăng xuất"
            title="Đăng xuất"
            className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-full text-sidebar-text hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} strokeWidth={1.8} />
          </button>
        </div>
      </aside>

      {/* Vùng nội dung */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-none items-center justify-between border-b border-line bg-surface px-6">
          {breadcrumb ?? <OpsSearch />}
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-muted">{session?.nowLabel ?? ''}</span>
            <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1.5 text-xs font-semibold text-success-deep">
              <span className="block h-[7px] w-[7px] rounded-full bg-success" />
              Live
            </span>
            <span className="h-7 w-px bg-line" />
            <span className="flex items-center gap-2.5">
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-orange-soft text-[13px] font-semibold text-primary">{operator?.initials ?? ''}</span>
              <span>
                <span className="block text-[13px] font-semibold text-ink">{operator?.name ?? ''}</span>
                <span className="block text-xs text-muted">{operator?.role ?? ''}</span>
              </span>
            </span>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
