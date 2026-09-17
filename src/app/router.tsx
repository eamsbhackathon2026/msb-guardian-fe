import type { ReactElement } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/auth'
import { LoginPage } from '@/features/auth/LoginPage'
import { SupportPage } from '@/features/support/SupportPage'
import { HomePage } from '@/features/home/HomePage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'
import { InvestPage } from '@/features/invest/InvestPage'
import { InvestRatesPage } from '@/features/invest/InvestRatesPage'
import { LoansPage } from '@/features/loans/LoansPage'
import { CardsPage } from '@/features/cards/CardsPage'
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
import { CaseDetailPage } from '@/features/ops/CaseDetailPage'

/** Các màn khách hàng yêu cầu đăng nhập; chưa đăng nhập → về /login */
function RequireAuth({ children }: { children: ReactElement }) {
  const authenticated = useAuthStore((s) => s.authenticated)
  return authenticated ? children : <Navigate to="/login" replace />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  // Hỗ trợ vào được từ màn đăng nhập nên không cần auth
  { path: '/support', element: <SupportPage /> },
  { path: '/', element: <RequireAuth><HomePage /></RequireAuth> },
  { path: '/payments', element: <RequireAuth><PaymentsPage /></RequireAuth> },
  { path: '/loans', element: <RequireAuth><LoansPage /></RequireAuth> },
  { path: '/cards', element: <RequireAuth><CardsPage /></RequireAuth> },
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
  { path: '/invest/rates', element: <RequireAuth><InvestRatesPage /></RequireAuth> },
  { path: '/copilot', element: <RequireAuth><CopilotOverviewPage /></RequireAuth> },
  { path: '/copilot/chat', element: <RequireAuth><CopilotChatPage /></RequireAuth> },
  { path: '/transfer/review', element: <RequireAuth><ScamAlertPage /></RequireAuth> },
  { path: '/transfer/review/why', element: <RequireAuth><RiskWhyPage /></RequireAuth> },
  { path: '/safety-center', element: <RequireAuth><SafetyCenterPage /></RequireAuth> },
  // Ops là màn nội bộ ngân hàng — không đi qua đăng nhập khách hàng
  { path: '/ops', element: <OpsDashboardPage /> },
  { path: '/ops/alerts/:id', element: <CaseDetailPage /> },
])
