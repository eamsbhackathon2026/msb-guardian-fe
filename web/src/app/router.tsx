import { createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { HomePage } from '@/features/home/HomePage'
import { CopilotOverviewPage } from '@/features/copilot/CopilotOverviewPage'
import { CopilotChatPage } from '@/features/copilot/CopilotChatPage'
import { ScamAlertPage } from '@/features/scamshield/ScamAlertPage'
import { RiskWhyPage } from '@/features/scamshield/RiskWhyPage'
import { SafetyCenterPage } from '@/features/scamshield/SafetyCenterPage'
import { OpsDashboardPage } from '@/features/ops/OpsDashboardPage'
import { CaseDetailPage } from '@/features/ops/CaseDetailPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <HomePage /> },
  { path: '/copilot', element: <CopilotOverviewPage /> },
  { path: '/copilot/chat', element: <CopilotChatPage /> },
  { path: '/transfer/review', element: <ScamAlertPage /> },
  { path: '/transfer/review/why', element: <RiskWhyPage /> },
  { path: '/safety-center', element: <SafetyCenterPage /> },
  { path: '/ops', element: <OpsDashboardPage /> },
  { path: '/ops/alerts/:id', element: <CaseDetailPage /> },
])
