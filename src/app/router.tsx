import type { ReactElement } from 'react'
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/lib/auth'
import { useOpsAuthStore } from '@/lib/ops-auth'
import { LoginPage } from '@/features/auth/LoginPage'
import { SupportPage } from '@/features/support/SupportPage'
import { HomePage } from '@/features/home/HomePage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'
import { PayBillPage } from '@/features/payments/PayBillPage'
import { InvestPage } from '@/features/invest/InvestPage'
import { OpenDepositPage } from '@/features/invest/OpenDepositPage'
import { InvestRatesPage } from '@/features/invest/InvestRatesPage'
import { LoansPage } from '@/features/loans/LoansPage'
import { CardsPage } from '@/features/cards/CardsPage'
import { CardPayPage } from '@/features/cards/CardPayPage'
import { BeneficiariesPage } from '@/features/transfer/BeneficiariesPage'
import { TransferFormPage } from '@/features/transfer/TransferFormPage'
import { TransferConfirmPage } from '@/features/transfer/TransferConfirmPage'
import { NewAccountPage } from '@/features/transfer/NewAccountPage'
import { TransferPinPage } from '@/features/transfer/TransferPinPage'
import { TransferHistoryPage } from '@/features/transfer/TransferHistoryPage'
import { ScamShieldVerdictPage } from '@/features/transfer/ScamShieldVerdictPage'
import { GuardianPage } from '@/features/transfer/GuardianPage'
import { ChatBankingPage } from '@/features/transfer/ChatBankingPage'
import { CopilotOverviewPage } from '@/features/copilot/CopilotOverviewPage'
import { CopilotChatPage } from '@/features/copilot/CopilotChatPage'
import { ScamAlertPage } from '@/features/scamshield/ScamAlertPage'
import { RiskWhyPage } from '@/features/scamshield/RiskWhyPage'
import { SafetyCenterPage } from '@/features/scamshield/SafetyCenterPage'
import { OpsDashboardPage } from '@/features/ops/OpsDashboardPage'
import { OpsLoginPage } from '@/features/ops/OpsLoginPage'
import { CaseDetailPage } from '@/features/ops/CaseDetailPage'
import { CaseListPage } from '@/features/ops/CaseListPage'
import { ScenarioListPage } from '@/features/ops/ScenarioListPage'
import { ModelThresholdPage } from '@/features/ops/ModelThresholdPage'
import { AiAuditLogPage } from '@/features/ops/AiAuditLogPage'

/** Các màn khách hàng yêu cầu đăng nhập; chưa đăng nhập → về /login */
function RequireAuth({ children }: { children: ReactElement }) {
  const authenticated = useAuthStore((s) => s.authenticated)
  return authenticated ? children : <Navigate to="/login" replace />
}

/** Sáu màn Ops nội bộ; phiên tách hẳn khỏi `RequireAuth` của khách (xem
 *  `src/lib/ops-auth.ts`). Chưa đăng nhập → về `/ops/login`, kèm đường dẫn
 *  đang định mở để đăng nhập xong quay lại đúng chỗ. */
function RequireOpsAuth({ children }: { children: ReactElement }) {
  const authenticated = useOpsAuthStore((s) => s.authenticated)
  const location = useLocation()
  const from = `${location.pathname}${location.search}`
  return authenticated ? children : <Navigate to="/ops/login" replace state={{ from }} />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  // Hỗ trợ vào được từ màn đăng nhập nên không cần auth
  { path: '/support', element: <SupportPage /> },
  { path: '/', element: <RequireAuth><HomePage /></RequireAuth> },
  { path: '/payments', element: <RequireAuth><PaymentsPage /></RequireAuth> },
  { path: '/payments/bill', element: <RequireAuth><PayBillPage /></RequireAuth> },
  { path: '/loans', element: <RequireAuth><LoansPage /></RequireAuth> },
  { path: '/cards', element: <RequireAuth><CardsPage /></RequireAuth> },
  { path: '/cards/pay', element: <RequireAuth><CardPayPage /></RequireAuth> },
  { path: '/transfer', element: <RequireAuth><BeneficiariesPage /></RequireAuth> },
  { path: '/transfer/new', element: <RequireAuth><TransferFormPage /></RequireAuth> },
  { path: '/transfer/account', element: <RequireAuth><NewAccountPage /></RequireAuth> },
  { path: '/transfer/confirm', element: <RequireAuth><TransferConfirmPage /></RequireAuth> },
  { path: '/transfer/pin', element: <RequireAuth><TransferPinPage /></RequireAuth> },
  { path: '/transactions', element: <RequireAuth><TransferHistoryPage /></RequireAuth> },
  { path: '/transfer/verdict', element: <RequireAuth><ScamShieldVerdictPage /></RequireAuth> },
  { path: '/transfer/guardian', element: <RequireAuth><GuardianPage /></RequireAuth> },
  { path: '/chat-banking', element: <RequireAuth><ChatBankingPage /></RequireAuth> },
  { path: '/invest', element: <RequireAuth><InvestPage /></RequireAuth> },
  { path: '/invest/open', element: <RequireAuth><OpenDepositPage /></RequireAuth> },
  { path: '/invest/rates', element: <RequireAuth><InvestRatesPage /></RequireAuth> },
  { path: '/copilot', element: <RequireAuth><CopilotOverviewPage /></RequireAuth> },
  { path: '/copilot/chat', element: <RequireAuth><CopilotChatPage /></RequireAuth> },
  { path: '/transfer/review', element: <RequireAuth><ScamAlertPage /></RequireAuth> },
  { path: '/transfer/review/why', element: <RequireAuth><RiskWhyPage /></RequireAuth> },
  { path: '/safety-center', element: <RequireAuth><SafetyCenterPage /></RequireAuth> },
  // Ops là màn nội bộ ngân hàng — đăng nhập riêng, không đi qua RequireAuth khách
  { path: '/ops/login', element: <OpsLoginPage /> },
  { path: '/ops', element: <RequireOpsAuth><OpsDashboardPage /></RequireOpsAuth> },
  { path: '/ops/alerts/:id', element: <RequireOpsAuth><CaseDetailPage /></RequireOpsAuth> },
  { path: '/ops/cases', element: <RequireOpsAuth><CaseListPage /></RequireOpsAuth> },
  { path: '/ops/scenarios', element: <RequireOpsAuth><ScenarioListPage /></RequireOpsAuth> },
  { path: '/ops/model', element: <RequireOpsAuth><ModelThresholdPage /></RequireOpsAuth> },
  { path: '/ops/audit', element: <RequireOpsAuth><AiAuditLogPage /></RequireOpsAuth> },
])
