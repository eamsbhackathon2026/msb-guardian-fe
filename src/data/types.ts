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

export interface ChatTableRow {
  label: string
  amount: number
  pct: number
  /** null khi chưa có kỳ trước để so — hiện "—", khác hẳn 0 (không đổi). */
  trendPct: number | null
}

/** Bảng số liệu do gateway dựng từ dữ liệu domain (không phải LLM sinh). */
export interface ChatTable {
  title: string
  rows: ChatTableRow[]
  totalLabel: string
  totalAmount: number
  /** Nhãn cột đầu: "Nhóm" (mặc định) hoặc "Tháng" cho bảng so sánh tháng. */
  rowHeader?: string
  /** Nhãn hai cột giữa — bảng tư vấn đổi thành "Cần/tháng", "% thu nhập". */
  amountHeader?: string
  pctHeader?: string
  /** null → bỏ hẳn cột Δ (bảng kịch bản không có kỳ trước để so). */
  trendHeader?: string | null
  /** Chú thích dưới bảng: con số suy ra từ đâu. */
  footnote?: string | null
}

export interface ChatGridColumn {
  label: string
  align: 'left' | 'right'
}

/** Bảng do agent viết bằng markdown, gateway chỉ chuyển thể — dùng cho những
 *  câu hỏi tài chính gateway không tự dựng được bảng chuẩn. */
export interface ChatGrid {
  /** Bảng gateway tự dựng có tiêu đề; bảng bóc từ markdown agent thì không. */
  title?: string | null
  columns: ChatGridColumn[]
  rows: string[][]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  chart?: ChatChart
  table?: ChatTable
  grids?: ChatGrid[]
  /** Nút hành động dưới câu trả lời — FE tự gắn khi nhận ra ý định (hỏi lãi
   *  suất/tiết kiệm → "Mở tiết kiệm ngay" link /invest/open; hỏi hóa đơn chưa
   *  thanh toán → "Thanh toán hóa đơn" link /payments/bill; hỏi/nhờ thanh toán
   *  nợ thẻ → "Thanh toán thẻ" link /cards/pay). */
  cta?: 'open-deposit' | 'pay-bill' | 'pay-card'
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
  updatedLabel: string
  shieldEnabled: boolean
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

/* ---- Payload gộp theo màn hình, do guardian-gateway phục vụ ---- */

export interface PendingTransfer {
  amount: number
  beneficiary: Beneficiary
}

export interface RiskExplain {
  assessment: RiskAssessment
  beneficiaryTimeline: TimelineEvent[]
  similarScenario: SimilarScenario
}

export type OpsDeltas = Record<keyof OpsMetrics, KpiDelta>

export interface OpsDashboard {
  deltas: OpsDeltas
  hourlyAlerts: HourlyAlertPoint[]
  scenarioCounts: ScenarioCount[]
  modelInputs: string[]
}

/* ---- Nội dung màn Home / Copilot ---- */

export interface HomeContent {
  greeting: string
  customerName: string
  productTier: string
  assistantHint: string
}

export interface CopilotIntro {
  greeting: string
  suggestions: string[]
  monthLabel: string
}

/* ---- Chi tiết case cho Ops ---- */

export interface CaseTransaction {
  channel: string
  content: string
  holdStatus: string
  slaMinutes: number
}

export interface CaseCustomerProfile {
  customerSince: string
  segment: string
  avgTransferVnd: number
  recentAlertsWindowDays: number
  recentAlertsCount: number
  recentAlertsTopScore: number
}

export interface CaseModelInfo {
  version: string
  method: string
  scoringMs: number
  confidencePct: number
  interveneThreshold: number
  softWarnMin: number
  softWarnMax: number
}

export interface CaseNoteChip {
  label: string
  primary: boolean
}

export interface CaseDetail {
  transaction: CaseTransaction
  customerProfile: CaseCustomerProfile
  model: CaseModelInfo
  noteChips: CaseNoteChip[]
}

/* ---- Phiên làm việc của chuyên viên Ops ---- */

export interface SystemStatusRow {
  label: string
  value: string
  /** Ngữ nghĩa, không phải màu — FE tự ánh xạ sang biến CSS */
  tone: 'ok' | 'warn' | 'danger'
}

export interface Operator {
  name: string
  role: string
  shift: string
  initials: string
}

export interface OpsSession {
  operator: Operator
  systemStatus: SystemStatusRow[]
  nowLabel: string
}

/* ---- Bốn màn vận hành phụ trong sidebar Ops ---- */

export type OpsCaseStatus = 'open' | 'callbackDone' | 'closedFraud' | 'closedLegit'

export interface OpsCase {
  id: string
  decisionId: string
  customer: string
  scenarioName: string
  status: OpsCaseStatus
  statusLabel: string
  narrative: string
  openedAt: string
  closedAt?: string
}

export interface OpsScenario {
  id: string
  name: string
  groupLabel: string
  patternLabel: string
  actionLabel: string
  canAsk: boolean
  adviceTitle: string
  adviceBody: string
  priority: number
  alertsToday: number
}

export interface OpsModelFactor {
  key: string
  label: string
  maxScore: number
}

export interface OpsModelConfig {
  softWarnMin: number
  interveneMin: number
  maxScore: number
  factors: OpsModelFactor[]
  inputs: string[]
}

export type AuditTraceStatus = 'ok' | 'cache' | 'timeout' | 'error'

export interface AuditTrace {
  id: string
  time: string
  agentLabel: string
  model: string
  status: AuditTraceStatus
  statusLabel: string
  latencyMs?: number
  decisionId?: string
}

export interface AuditAgentStat {
  agentLabel: string
  calls: number
  fallbackCalls: number
  avgLatencyMs: number
}

export interface OpsAuditLog {
  totalCalls: number
  fallbackRatePct: number
  avgLatencyMs: number
  perAgent: AuditAgentStat[]
  traces: AuditTrace[]
}

/* ---- Thao tác ghi ---- */

// 'held' và 'contacted' thêm cho màn Guardian (bốn nút: khóa tạm · huỷ ·
// gọi MSB · vẫn tiếp tục).
export type CustomerAction = 'cancelled' | 'proceeded' | 'reported' | 'held' | 'contacted'

export interface TransferActionResult {
  ok: boolean
  caseStatus: AlertStatus
  message: string
}

/* ---- Thống kê theo quý ---- */

export interface QuarterCategory {
  category: string
  labelVi: string
  amount: number
  pct: number
  rank: number
  /** null khi chưa có quý trước để so — khác hẳn 0 nghĩa là không đổi */
  deltaVsPrevPct: number | null
}

export interface QuarterSummary {
  period: string
  label: string
  income: number
  expense: number
  net: number
  count: number
  byCategory: QuarterCategory[]
}

export interface CategoryTotal {
  category: string
  labelVi: string
  amount: number
  pct: number
}

export interface QuarterlyReport {
  quarters: QuarterSummary[]
  categoryTotals: CategoryTotal[]
}

/* ---- Luồng chuyển tiền: favorite (bỏ Scam Shield) vs stk mới (agent check) ---- */

export interface TransferBeneficiary {
  id: string
  name: string
  bank: string
  account: string
  relationship: string
  /** true → chuyển thẳng, không cần Scam Shield (stk quen, không bị nghi ngờ). */
  trusted: boolean
}

export interface ScamShieldVerdict {
  level: 'safe' | 'suspect' | 'danger'
  title: string
  summary: string
  reasons: string[]
  recommendation: string
  /** "agent" = do agent Scam Shield (LLM) kết luận; "fallback" = suy từ tín hiệu khi agent lỗi. */
  source: 'agent' | 'fallback'
}

export interface TransferPrecheckResult {
  /** false → stk quen, đi thẳng màn xác nhận; true → stk mới/nghi ngờ, hiện verdict. */
  requiresReview: boolean
  trusted: boolean
  isNew: boolean
  beneficiaryName: string
  beneficiaryBank: string
  beneficiaryAccount: string
  verdict?: ScamShieldVerdict

  /* ---- Guardian 3 mức (wireframe màn Transfer) ---- */
  /** <40 pass · 40–74 soft_warn · >=75 intervene — do risk engine chấm. */
  score: number
  level: GuardianLevel
  /** Ba yếu tố nặng nhất, đã là câu hoàn chỉnh của engine. */
  topFactors: string[]
  /** Câu cảnh báo rule-based, hiện ngay không chờ LLM. */
  templateText: string
  decisionId: string
  question?: string
  options: string[]
  scenarioId?: string
  /** "Đã chuyển N lần" — tín hiệu tin cậy ngầm ở mức pass. */
  txCount: number
}

/** Ý định chuyển tiền do agent bóc từ một câu của khách. */
export interface ChatBankingDraft {
  intent: 'transfer' | 'list_beneficiaries' | 'other'
  amount?: number | null
  recipient?: string | null
  matches: TransferBeneficiary[]
  /** 'fallback' → agent lỗi/chậm, FE tự dùng bộ luật regex. */
  source: 'agent' | 'fallback'
}

export type GuardianLevel = 'pass' | 'soft_warn' | 'intervene'
export type GuardianActionKey = 'hold' | 'cancel' | 'contact' | 'continue'

/** Lượt 1 màn Guardian: vì sao dừng và câu cần hỏi khách. */
export interface InterveneDetail {
  decisionId: string
  score: number
  level: GuardianLevel
  amount: number
  beneficiaryLabel: string
  reasons: string[]
  question: string
  options: string[]
  scenarioId?: string
}

export interface GuardianAction {
  key: GuardianActionKey
  label: string
  /** Nút engine khuyến nghị — tô đậm. Do engine chọn, không phải LLM. */
  recommended: boolean
}

/** Lượt 2 màn Guardian: khuyến cáo và bốn hành động. */
export interface InterveneAdvice {
  decisionId: string
  selectedOption: string
  adviceTitle: string
  adviceBody: string
  recommendedAction: GuardianActionKey
  actions: GuardianAction[]
  source: 'agent' | 'playbook'
}


/* ---- Màn Biểu lãi suất (Khám phá sản phẩm → Biểu lãi suất) ---- */

export interface RateTerm {
  /** KKH | T01 | T03... — khớp interest_rate_term.term_code phía backend */
  code: string
  /** 0 = không kỳ hạn; dùng để xếp trục kỳ hạn */
  months: number
  label: string
}

export interface RateProduct {
  /** Mã sản phẩm lõi là chuỗi ("RB.TK.LSCN"), không phải số tự tăng. */
  id: string
  name: string
}

export interface RateCell {
  productId: string
  /** %/năm — đợt hiệu lực mới nhất của cặp (sản phẩm, kỳ hạn) */
  ratePct: number
}

export interface RateRow {
  term: RateTerm
  rates: RateCell[]
}

export interface InvestRates {
  /** Ngày hiệu lực mới nhất trong biểu — hiển thị "Áp dụng từ ..." */
  asOf: string
  products: RateProduct[]
  /** Mỗi dòng một kỳ hạn — vẽ bảng và biểu đồ so sánh cùng kỳ hạn */
  rows: RateRow[]
}


/* ---- Màn Financial Copilot: thông báo dưới nhóm chi tiêu ---- */

export interface CopilotNotification {
  id: string
  /** saving = sổ tiết kiệm đến hạn (CTA mở biểu lãi suất) · card = sao kê thẻ
   *  chưa thanh toán · loan = đến kỳ trả nợ khoản vay */
  kind: 'saving' | 'card' | 'loan'
  title: string
  body: string
  ctaLabel?: string
}


/* ---- Sổ tiết kiệm đến hạn (check maturity_date với hôm nay) ---- */

export interface MaturingDeposit {
  depositId: number
  productName?: string
  amount: number
  /** %/năm đang hưởng (lãi gốc + biên) */
  ratePct: number
  termMonths?: number
  /** ISO yyyy-mm-dd */
  maturityDate: string
  dueToday: boolean
  /** Đã qua ngày đáo hạn mà chưa tái tục */
  overdue: boolean
}

export interface MaturingDeposits {
  /** Ngày (giờ VN) backend dùng để so maturity_date */
  asOf: string
  count: number
  deposits: MaturingDeposit[]
}
