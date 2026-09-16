import type { ReactElement } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/auth'
import { LoginPage } from '@/features/auth/LoginPage'
import { HomePage } from '@/features/home/HomePage'
import { CopilotOverviewPage } from '@/features/copilot/CopilotOverviewPage'
import { CopilotChatPage } from '@/features/copilot/CopilotChatPage'
import { ScamAlertPage } from '@/features/scamshield/ScamAlertPage'
import { RiskWhyPage } from '@/features/scamshield/RiskWhyPage'
import { SafetyCenterPage } from '@/features/scamshield/SafetyCenterPage'
import { OpsDashboardPage } from '@/features/ops/OpsDashboardPage'
import { CaseDetailPage } from '@/features/ops/CaseDetailPage'

/** Các màn khách hàng yêu cầu đăng nhập; chưa đăng nhập → về /login */
function RequireAuth({ children }: { children: ReactElement }) {
  const authenticated = useAuthStore((s) => s.authenticated)
  return authenticated ? children : <Navigate to="/login" replace />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <RequireAuth><HomePage /></RequireAuth> },
  { path: '/copilot', element: <RequireAuth><CopilotOverviewPage /></RequireAuth> },
  { path: '/copilot/chat', element: <RequireAuth><CopilotChatPage /></RequireAuth> },
  { path: '/transfer/review', element: <RequireAuth><ScamAlertPage /></RequireAuth> },
  { path: '/transfer/review/why', element: <RequireAuth><RiskWhyPage /></RequireAuth> },
  { path: '/safety-center', element: <RequireAuth><SafetyCenterPage /></RequireAuth> },
  // Ops là màn nội bộ ngân hàng — không đi qua đăng nhập khách hàng
  { path: '/ops', element: <OpsDashboardPage /> },
  { path: '/ops/alerts/:id', element: <CaseDetailPage /> },
])
