/*
 * Client gọi guardian-gateway. Mọi đường dẫn nằm dưới /api cùng origin — nginx
 * của FE proxy sang gateway, nên trình duyệt không cần biết địa chỉ backend và
 * không phát sinh CORS.
 *
 * MOCK ĐÃ CHUYỂN SANG BACKEND. Trước đây mỗi hàm ở đây nhận thêm một hàm trả dữ
 * liệu demo, và `guardedCall` sẽ im lặng rơi về dữ liệu đó khi backend lỗi hoặc
 * quá 6 giây. Cách đó khiến backend chết mà màn hình vẫn đẹp như thường — không
 * ai phát hiện ra cho tới lúc trình bày. Nay lỗi được ném ra để react-query xử
 * lý và hiện đúng trạng thái.
 *
 * Toàn bộ mã mock cũ được GIỮ LẠI dưới dạng comment ngay cạnh hàm tương ứng,
 * không xoá, để đối chiếu hoặc khôi phục nhanh khi cần trình bày offline.
 */
import type {
  CaseDetail,
  CaseTimelineStep,
  CopilotIntro,
  CopilotNotification,
  CustomerAction,
  HomeContent,
  Operator,
  OpsSession,
  QuarterlyReport,
  TransferActionResult,
  ChatChart,
  ChatGrid,
  ChatTable,
  CopilotOverview,
  Customer,
  InvestRates,
  MaturingDeposits,
  OpsAuditLog,
  OpsCase,
  OpsCaseStatus,
  OpsDashboard,
  OpsDecision,
  OpsModelConfig,
  OpsScenario,
  OpsMetrics,
  PendingTransfer,
  RiskAssessment,
  RiskExplain,
  SafetyCenter,
  ScamAlert,
  TransferBeneficiary,
  ChatBankingDraft,
  InterveneAdvice,
  InterveneDetail,
  TransferPrecheckResult,
} from '@/data/types'

// MOCK CŨ — không còn được gọi, giữ để đối chiếu với dữ liệu gateway trả về:
// import {
//   demoCaseTimeline,
//   demoCopilotOverview,
//   demoOpsAlerts,
//   demoOpsMetrics,
//   demoRiskAssessment,
//   getScriptedReply,
// } from '@/data/demo-scenarios'
// import { guardedCall, isDemoMode, replayAsStream } from './demo-mode'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return res.json() as Promise<T>
}

/* ---- Đăng nhập ---- */

import type { AuthUser } from './auth'

export interface LoginResult {
  authenticated: boolean
  /** "domain" = xác thực thật qua identity-service; "degraded" = gateway không
   *  gọi được identity-service nên cho qua bằng hồ sơ demo. */
  source: 'domain' | 'degraded'
  user?: AuthUser
  /** Khi authenticated=false: invalid_credentials | disabled | locked */
  reason?: string
}

/**
 * POST /api/auth/login — xác thực thật tên đăng nhập + mật khẩu.
 *
 * Trước đây LoginPage chỉ gọi store.login() phía client, không có backend nào.
 * Nay gateway so khớp bcrypt với bảng app_user qua identity-service. Đăng nhập
 * của kịch bản demo là kh100008 / 123456.
 *
 * Ở đây KHÔNG dùng fetchJson (nó ném lỗi khi !res.ok): nếu gateway hoàn toàn
 * không gọi được, LoginPage tự bắt và rơi về đăng nhập demo để buổi trình bày
 * không bị chặn.
 */
export function login(username: string, password: string): Promise<LoginResult> {
  return fetchJson<LoginResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

/* ---- Phiên hiện tại ---- */

export function getSessionCustomer(): Promise<Customer> {
  return fetchJson<Customer>('/api/session/customer')
}

/* ---- Financial Copilot ---- */

export function getCopilotOverview(): Promise<CopilotOverview> {
  // Cũ: guardedCall('getCopilotOverview', () => fetchJson(...), () => demoCopilotOverview)
  return fetchJson<CopilotOverview>('/api/copilot/overview')
}

export function getCopilotIntro(): Promise<CopilotIntro> {
  return fetchJson<CopilotIntro>('/api/copilot/intro')
}

/**
 * GET /api/copilot/notifications — 3 nhắc việc dưới nhóm chi tiêu: sổ tiết kiệm
 * đến hạn hôm nay (CTA mở biểu lãi suất chọn sản phẩm tái gửi), sao kê thẻ chưa
 * thanh toán, và kỳ trả nợ khoản vay. Số tiền sổ lấy từ portfolio khi domain sống.
 */
export function getCopilotNotifications(): Promise<CopilotNotification[]> {
  return fetchJson<CopilotNotification[]>('/api/copilot/notifications')
}

/**
 * GET /api/invest/maturing-deposits — CHECK sổ tiết kiệm đến hạn: backend so
 * maturity_date của từng sổ với ngày HÔM NAY (giờ VN). days=0 (mặc định) là
 * đến hạn đúng hôm nay, kèm cả sổ đã quá hạn chưa tái tục.
 */
export function getMaturingDeposits(days = 0): Promise<MaturingDeposits> {
  return fetchJson<MaturingDeposits>(`/api/invest/maturing-deposits?days=${days}`)
}

/**
 * Thu chi theo quý, phân rã theo nhóm chi tiêu.
 *
 * Cùng endpoint mà agent gọi như một tool, nên số trên màn hình và số agent nói
 * ra luôn khớp nhau.
 */
export function getQuarterlyReport(quarters = 4): Promise<QuarterlyReport> {
  return fetchJson<QuarterlyReport>(`/api/copilot/quarters?quarters=${quarters}`)
}

export interface ChatStreamResult {
  content: string
  chart?: ChatChart
  table?: ChatTable
  grids: ChatGrid[]
}

/**
 * POST /api/copilot/chat (SSE).
 *
 * Stream có hai loại sự kiện: `{"token": "..."}` lặp lại cho tới hết câu, rồi
 * tối đa một `{"chart": {...}}` phát sau đó. Bản trước chỉ đọc `token` nên biểu
 * đồ cột bị mất khi chạy live — đây là chỗ sửa.
 */
export async function streamChat(question: string, onToken: (token: string) => void): Promise<ChatStreamResult> {
  const res = await fetch('/api/copilot/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: question }),
  })
  if (!res.ok || !res.body) throw new Error(`chat → HTTP ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  let chart: ChatChart | undefined
  let table: ChatTable | undefined
  const grids: ChatGrid[] = []
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    // Dòng cuối có thể bị cắt giữa chừng: giữ lại chờ chunk sau.
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') continue
      try {
        const parsed = JSON.parse(payload) as { token?: string; chart?: ChatChart; table?: ChatTable; grid?: ChatGrid }
        if (parsed.token) {
          full += parsed.token
          onToken(parsed.token)
        } else if (parsed.table) {
          table = parsed.table
        } else if (parsed.grid) {
          grids.push(parsed.grid)
        } else if (parsed.chart) {
          chart = parsed.chart
        }
      } catch {
        // Payload không phải JSON: coi như văn bản thuần để không mất nội dung.
        full += payload
        onToken(payload)
      }
    }
  }

  return { content: full, chart, table, grids }
}

// MOCK CŨ của streamChat: phát lại câu trả lời ghi sẵn ~25ms/token.
//   const reply = getScriptedReply(question)
//   await new Promise((resolve) => setTimeout(resolve, 600))
//   await replayAsStream(reply.content, onToken)
//   return { content: reply.content, chart: reply.chart }

/* ---- Chuyển tiền: danh bạ + precheck (favorite vs stk mới) ---- */

export function getTransferBeneficiaries(): Promise<TransferBeneficiary[]> {
  return fetchJson<TransferBeneficiary[]>('/api/transfer/beneficiaries')
}

/**
 * Quyết định luồng: stk quen (requiresReview=false → chuyển thẳng) hay stk mới
 * (requiresReview=true → agent Scam Shield trả verdict). Gateway tự gọi agent.
 */
/** Agent bóc ý định chuyển tiền từ một câu. Gateway đã đối chiếu danh bạ thật,
 *  nên matches là người nhận có thật của đúng khách đang đăng nhập. */
export function parseChatBanking(message: string): Promise<ChatBankingDraft> {
  return fetchJson<ChatBankingDraft>('/api/chat-banking/parse', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

/** Lượt 1 màn Guardian — đọc lại quyết định đã chấm, không chấm lại. */
export function getInterveneDetail(decisionId: string): Promise<InterveneDetail> {
  return fetchJson<InterveneDetail>(`/api/transfer/intervene/${encodeURIComponent(decisionId)}`)
}

/** Lượt 2 — gửi lựa chọn của khách, nhận khuyến cáo và bốn hành động. */
export function postIntervene(payload: {
  decisionId: string
  selectedOption: string
  freeText?: string
}): Promise<InterveneAdvice> {
  return fetchJson<InterveneAdvice>('/api/transfer/intervene', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function precheckTransfer(payload: {
  bankCode: string
  accountNo: string
  amount: number
  note?: string
  holderName?: string
}): Promise<TransferPrecheckResult> {
  return fetchJson<TransferPrecheckResult>('/api/transfer/precheck', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/* ---- Scam Shield ---- */

export function getPendingTransfer(): Promise<PendingTransfer> {
  return fetchJson<PendingTransfer>('/api/transfer/pending')
}

export function assessRisk(payload: { amount: number }): Promise<RiskAssessment> {
  // Cũ: guardedCall(..., () => demoRiskAssessment, { demoDelayMs: [1_800, 2_200] })
  // Nhịp ~2s của màn "Đang phân tích giao dịch..." nay do gateway giữ, qua biến
  // RISK_ASSESS_DELAY_MS — xem services/guardian-gateway/main.py.
  return fetchJson<RiskAssessment>('/api/risk/assess', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getRiskExplain(): Promise<RiskExplain> {
  return fetchJson<RiskExplain>('/api/risk/explain')
}

export function getSafetyCenter(): Promise<SafetyCenter> {
  return fetchJson<SafetyCenter>('/api/safety-center')
}

/* ---- Ops ---- */

export function getOpsMetrics(): Promise<OpsMetrics> {
  // Cũ: guardedCall('getOpsMetrics', () => fetchJson(...), () => demoOpsMetrics)
  return fetchJson<OpsMetrics>('/api/ops/metrics')
}

export function getOpsDashboard(): Promise<OpsDashboard> {
  return fetchJson<OpsDashboard>('/api/ops/dashboard')
}

export function getOpsAlerts(): Promise<ScamAlert[]> {
  // Cũ: guardedCall('getOpsAlerts', () => fetchJson(...), () => demoOpsAlerts)
  return fetchJson<ScamAlert[]>('/api/ops/alerts')
}

export function getOpsAlert(id: string): Promise<ScamAlert> {
  // Cũ trả `ScamAlert | undefined` vì bản demo dùng .find(). Nay id không tồn
  // tại thì gateway trả 404 và hàm này ném lỗi, để react-query hiện trạng thái
  // lỗi thay vì render màn trắng.
  return fetchJson<ScamAlert>(`/api/ops/alerts/${id}`)
}

export function getCaseTimeline(id: string): Promise<CaseTimelineStep[]> {
  // Cũ: bỏ qua id và trả thẳng demoCaseTimeline, không hề gọi mạng.
  return fetchJson<CaseTimelineStep[]>(`/api/ops/alerts/${id}/timeline`)
}

export function postDecision(id: string, decision: OpsDecision, note: string): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>(`/api/ops/alerts/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, note }),
  })
}

/* ---- Chuyển tiền: ghi và truy vấn bảng transaction_history ---- */

export interface TransferHistoryItem {
  id: string
  datetime: string
  name: string
  bank: string
  account: string
  amount: number
  note?: string
  status?: string
}

/** Gọi sau khi khách nhập đúng PIN — gateway ghi bản ghi OUT/POSTED vào
 *  transaction_history để màn Lịch sử giao dịch truy vấn lại được. */
export function executeTransfer(payload: {
  bankCode: string
  accountNo: string
  holderName: string
  amount: number
  note?: string
}): Promise<{ ok: boolean; transactionId?: number }> {
  return fetchJson('/api/transfer/execute', { method: 'POST', body: JSON.stringify(payload) })
}

/** Lịch sử chuyển tiền (FT, chiều OUT) trong 3 tháng gần nhất */
export function getTransferHistory(): Promise<TransferHistoryItem[]> {
  return fetchJson<TransferHistoryItem[]>('/api/transfer/history')
}

/** Mở tiền gửi CÓ HẠCH TOÁN: gateway ghi nợ tài khoản nguồn, tạo sổ deposit,
 *  ghi bút toán OUT/INVESTMENT vào transaction_history. */
export function openDeposit(payload: { amount: number; months: number; rate: number }): Promise<{
  ok: boolean
  depositNo?: string
  startDate?: string
  maturityDate?: string
  balanceAfter?: number
}> {
  return fetchJson('/api/invest/open', { method: 'POST', body: JSON.stringify(payload) })
}

/* ---- Đầu tư: biểu lãi suất tiết kiệm ---- */

/**
 * GET /api/invest/rates — biểu lãi suất HIỆN TẠI của sản phẩm tiết kiệm.
 *
 * Gateway → transaction-service join 3 bảng product × interest_rate ×
 * interest_rate_term và chọn đợt hiệu lực mới nhất của từng cặp (sản phẩm,
 * kỳ hạn). Dữ liệu về đã nhóm sẵn theo kỳ hạn để vẽ bảng + biểu đồ so sánh.
 */
export function getInvestRates(): Promise<InvestRates> {
  return fetchJson<InvestRates>('/api/invest/rates')
}

/* ---- Ops: bốn màn vận hành phụ ---- */

export function getOpsCases(status?: OpsCaseStatus): Promise<OpsCase[]> {
  const query = status ? `?status=${status}` : ''
  return fetchJson<OpsCase[]>(`/api/ops/cases${query}`)
}

export function getOpsScenarios(): Promise<OpsScenario[]> {
  return fetchJson<OpsScenario[]>('/api/ops/scenarios')
}

export function getOpsModel(): Promise<OpsModelConfig> {
  return fetchJson<OpsModelConfig>('/api/ops/model')
}

export function getOpsAudit(params: { agent?: string; status?: string } = {}): Promise<OpsAuditLog> {
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ).toString()
  return fetchJson<OpsAuditLog>(`/api/ops/audit${query ? `?${query}` : ''}`)
}

/* ---- Nội dung màn Home ---- */

export function getHomeContent(): Promise<HomeContent> {
  return fetchJson<HomeContent>('/api/home')
}

/* ---- Thao tác ghi của khách trong luồng Scam Shield ---- */

/**
 * Trước đây ba nút Huỷ / Vẫn chuyển / Báo cáo chỉ đổi state zustand, backend
 * không hề biết. Nay mỗi hành động cập nhật case và dòng thời gian bên Ops.
 */
export function postTransferAction(action: CustomerAction, decisionId?: string): Promise<TransferActionResult> {
  return fetchJson<TransferActionResult>('/api/transfer/action', {
    method: 'POST',
    // decisionId chỉ có ở màn Guardian; bỏ trống thì gateway dùng lần chấm gần nhất.
    body: JSON.stringify(decisionId ? { action, decisionId } : { action }),
  })
}

export function patchProtection(key: string, enabled: boolean): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>(`/api/safety-center/protections/${key}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  })
}

/* ---- Ops: đăng nhập nội bộ ---- */

export interface OpsLoginResult {
  authenticated: boolean
  operator?: Operator
  /** Khi authenticated=false: not_backoffice | invalid_credentials | disabled | locked */
  reason?: string
}

/**
 * POST /api/ops/login — đăng nhập nội bộ cho `/ops`.
 *
 * Khác `login()` của khách: không có nhánh dự phòng khi gateway/identity-service
 * hỏng — lời gọi sẽ ném lỗi qua `fetchJson` (HTTP 503), và `OpsLoginPage` tự bắt
 * để hiện "chưa kết nối được hệ thống danh tính". Tài khoản đúng mật khẩu nhưng
 * không có quyền vận hành bị từ chối với `reason="not_backoffice"`.
 */
export function opsLogin(username: string, password: string): Promise<OpsLoginResult> {
  return fetchJson<OpsLoginResult>('/api/ops/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

/* ---- Ops: phiên làm việc và chi tiết case ---- */

/**
 * `username` đến từ phiên Ops đã đăng nhập (`useOpsAuthStore`). Có thì gateway
 * tra identity-service để trả đúng chuyên viên đang trực; không có thì gateway
 * giữ hằng số catalog như trước phase đăng nhập nội bộ.
 */
export function getOpsSession(username?: string): Promise<OpsSession> {
  const query = username ? `?username=${encodeURIComponent(username)}` : ''
  return fetchJson<OpsSession>(`/api/ops/session${query}`)
}

export function getCaseDetail(id: string): Promise<CaseDetail> {
  return fetchJson<CaseDetail>(`/api/ops/alerts/${id}/detail`)
}
