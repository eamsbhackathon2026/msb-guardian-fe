export interface Customer {
  id: string
  name: string
  maskedAccount: string
  balance: number
}

export interface Transaction {
  id: string
  datetime: string
  merchant: string
  category: string
  amount: number
  direction: 'in' | 'out'
}

export interface SpendingCategory {
  key: string
  labelVi: string
  amount: number
  pct: number
  trendPct: number
}

export interface Insight {
  id: string
  kind: 'info' | 'warning' | 'action'
  title: string
  body: string
  ctaLabel?: string
}

export interface RiskSignal {
  id: string
  label: string
  detail: string
  weight: number
  severity: 'low' | 'med' | 'high'
  confidencePct?: number
}

export interface RiskAssessment {
  score: number
  level: 'low' | 'medium' | 'high'
  scenarioName: string
  signals: RiskSignal[]
  recommendations: string[]
}

export interface Beneficiary {
  accountNo: string
  bankName: string
  holderName: string
  accountAgeDays: number
  reportCount: number
}

export type AlertStatus = 'pending' | 'confirmed' | 'dismissed' | 'investigating'

export interface ScamAlert {
  id: string
  timestamp: string
  customer: string
  amount: number
  beneficiary: Beneficiary
  assessment: RiskAssessment
  status: AlertStatus
}

export interface OpsMetrics {
  scannedToday: number
  alertsFired: number
  cancelRatePct: number
  protectedValueVnd: number
}

export interface ChatChart {
  type: 'bar'
  title: string
  data: { label: string; value: number }[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  chart?: ChatChart
  timestamp: string
}

/* ---- Payload tổng hợp cho các màn ---- */

export interface BudgetSummary {
  monthLabel: string
  spentVnd: number
  budgetVnd: number
}

export interface CopilotOverview {
  budget: BudgetSummary
  categories: SpendingCategory[]
  insights: Insight[]
}

export interface TimelineEvent {
  id: string
  label: string
  detail?: string
  time: string
  tone: 'neutral' | 'warning' | 'danger'
}

export interface SimilarScenario {
  name: string
  description: string
  reportedCases: number
}

export interface SafetyHistoryItem {
  id: string
  date: string
  amount: number
  scenarioName: string
  status: 'blocked' | 'ignored' | 'processing'
}

export interface ProtectionLayer {
  key: string
  label: string
  description: string
  enabled: boolean
}

export interface SafetyCenter {
  safetyScore: number
  scoreLabel: string
  blockedCount: number
  warnedCount: number
  reportedCount: number
  history: SafetyHistoryItem[]
  protections: ProtectionLayer[]
}

export interface HourlyAlertPoint {
  hour: string
  count: number
}

export interface ScenarioCount {
  name: string
  count: number
}

export interface KpiDelta {
  valueLabel: string
  up: boolean
}

export interface CaseTimelineStep {
  id: string
  time: string
  label: string
  done: boolean
}

export type OpsDecision = 'confirmed' | 'dismissed' | 'investigating'
