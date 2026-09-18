/*
 * NGUỒN DỮ LIỆU DUY NHẤT cho toàn bộ demo.
 * Mọi màn hình đọc từ đây — không màn nào tự định nghĩa số liệu riêng.
 */
import type {
  Beneficiary,
  CaseTimelineStep,
  ChatChart,
  CopilotOverview,
  Customer,
  HourlyAlertPoint,
  Insight,
  KpiDelta,
  OpsMetrics,
  RiskAssessment,
  SafetyCenter,
  ScamAlert,
  ScenarioCount,
  SimilarScenario,
  SpendingCategory,
  TimelineEvent,
  Transaction,
} from './types'

/* ============ KHÁCH HÀNG ============ */

export const demoCustomer: Customer = {
  id: 'cus-001',
  name: 'Nguyễn Minh Anh',
  maskedAccount: '**** 4821',
  balance: 47_820_000,
}

/* ============ GIAO DỊCH THÁNG 9/2026 ============ */

export const demoTransactions: Transaction[] = [
  { id: 'tx-12', datetime: '2026-09-15T08:45:00', merchant: 'Highlands Coffee', category: 'Ăn uống', amount: 65_000, direction: 'out' },
  { id: 'tx-11', datetime: '2026-09-14T19:20:00', merchant: 'GrabCar', category: 'Di chuyển', amount: 128_000, direction: 'out' },
  { id: 'tx-10', datetime: '2026-09-14T12:05:00', merchant: 'VinMart', category: 'Mua sắm', amount: 486_000, direction: 'out' },
  { id: 'tx-09', datetime: '2026-09-13T09:00:00', merchant: 'EVN Hà Nội', category: 'Hoá đơn', amount: 1_240_000, direction: 'out' },
  { id: 'tx-08', datetime: '2026-09-12T21:30:00', merchant: 'Shopee', category: 'Mua sắm', amount: 1_259_000, direction: 'out' },
  { id: 'tx-07', datetime: '2026-09-11T07:50:00', merchant: 'Phúc Long', category: 'Ăn uống', amount: 89_000, direction: 'out' },
  { id: 'tx-06', datetime: '2026-09-10T20:15:00', merchant: 'CGV Vincom', category: 'Khác', amount: 360_000, direction: 'out' },
  { id: 'tx-05', datetime: '2026-09-09T18:40:00', merchant: 'GrabFood', category: 'Ăn uống', amount: 215_000, direction: 'out' },
  { id: 'tx-04', datetime: '2026-09-08T11:25:00', merchant: 'Nước sạch Hà Nội', category: 'Hoá đơn', amount: 385_000, direction: 'out' },
  { id: 'tx-03', datetime: '2026-09-06T16:00:00', merchant: 'Tiki', category: 'Mua sắm', amount: 745_000, direction: 'out' },
  { id: 'tx-02', datetime: '2026-09-05T09:00:00', merchant: 'Lương tháng 9 — Công ty TNHH ABC', category: 'Thu nhập', amount: 28_500_000, direction: 'in' },
  { id: 'tx-01', datetime: '2026-09-05T08:30:00', merchant: 'Circle K', category: 'Khác', amount: 78_000, direction: 'out' },
]

/* ============ CHI TIÊU & COPILOT ============ */

export const demoCategories: SpendingCategory[] = [
  { key: 'an-uong', labelVi: 'Ăn uống', amount: 4_230_000, pct: 34, trendPct: 34 },
  { key: 'mua-sam', labelVi: 'Mua sắm', amount: 3_120_000, pct: 25, trendPct: 12 },
  { key: 'hoa-don', labelVi: 'Hoá đơn', amount: 2_410_000, pct: 19, trendPct: -5 },
  { key: 'di-chuyen', labelVi: 'Di chuyển', amount: 1_850_000, pct: 15, trendPct: -8 },
  { key: 'khac', labelVi: 'Khác', amount: 850_000, pct: 7, trendPct: 3 },
]

export const demoSpentThisMonth = demoCategories.reduce((sum, c) => sum + c.amount, 0) // 12.460.000
export const demoMonthBudget = 18_000_000

export const demoInsights: Insight[] = [
  {
    id: 'ins-1',
    kind: 'warning',
    title: 'Chi tiêu Ăn uống tăng 34% so với tháng 8',
    body: 'Bạn đã chi 4.230.000 ₫ cho Ăn uống trong nửa đầu tháng, cao hơn hẳn nhịp chi thường lệ. Ba khoản lớn nhất đến từ GrabFood và cà phê sáng.',
  },
  {
    id: 'ins-2',
    kind: 'info',
    title: 'Hoá đơn điện vào mùa cao điểm',
    body: 'Tiền điện EVN Hà Nội kỳ này là 1.240.000 ₫, cao hơn 18% trung bình 3 tháng gần nhất — phù hợp xu hướng mùa nóng.',
  },
  {
    id: 'ins-3',
    kind: 'action',
    title: 'Bạn có thể tiết kiệm thêm trong tháng này',
    body: 'Với nhịp chi hiện tại, dự kiến cuối tháng bạn dư khoảng 6.500.000 ₫. Trích một phần sang tiết kiệm sẽ không ảnh hưởng chi tiêu.',
    ctaLabel: 'Chuyển 3.000.000 ₫ vào Tiết kiệm',
  },
]

export const demoCopilotOverview: CopilotOverview = {
  budget: { monthLabel: 'Tháng 9/2026', spentVnd: demoSpentThisMonth, budgetVnd: demoMonthBudget },
  categories: demoCategories,
  insights: demoInsights,
}

/* ============ KỊCH BẢN LỪA ĐẢO (SCAM SHIELD) ============ */

export const demoScamAmount = 85_000_000

export const demoBeneficiary: Beneficiary = {
  accountNo: '0899 552 617',
  bankName: 'VPBank',
  holderName: 'TRAN VAN KHOA',
  accountAgeDays: 2,
  reportCount: 12,
}

export const demoRiskAssessment: RiskAssessment = {
  score: 87,
  level: 'high',
  scenarioName: 'Mạo danh cơ quan công an',
  signals: [
    {
      id: 'sig-1',
      label: 'Tài khoản nhận mới mở 2 ngày',
      detail: 'Tài khoản người nhận vừa được mở ngày 13/09/2026, chưa có lịch sử giao dịch đáng tin cậy.',
      weight: 32,
      severity: 'high',
      confidencePct: 96,
    },
    {
      id: 'sig-2',
      label: 'Nằm trong danh sách cảnh báo cộng đồng',
      detail: '12 người dùng đã báo cáo số tài khoản này trong 48 giờ qua trên hệ thống cảnh báo liên ngân hàng.',
      weight: 28,
      severity: 'high',
      confidencePct: 92,
    },
    {
      id: 'sig-3',
      label: 'Khớp mẫu hành vi mạo danh công an',
      detail: 'Chuỗi hành vi cuộc gọi lạ kéo dài → chuyển gần hết số dư tới tài khoản mới khớp 92% kịch bản đã ghi nhận.',
      weight: 18,
      severity: 'med',
      confidencePct: 84,
    },
    {
      id: 'sig-4',
      label: 'Giao dịch bất thường so với thói quen',
      detail: 'Số tiền gấp 9 lần giao dịch trung bình của bạn và được tạo chỉ 18 phút sau một cuộc gọi từ số lạ.',
      weight: 9,
      severity: 'low',
      confidencePct: 71,
    },
  ],
  recommendations: [
    'Gọi tổng đài MSB 1900 6083 để xác minh trước khi thực hiện bất kỳ giao dịch nào.',
    'Cơ quan công an không bao giờ yêu cầu chuyển tiền qua điện thoại. Hãy đến trực tiếp công an phường nơi cư trú để xác nhận.',
  ],
}

export const demoBeneficiaryTimeline: TimelineEvent[] = [
  { id: 'tl-1', time: '13/09/2026', label: 'Tài khoản người nhận được mở tại VPBank', tone: 'neutral' },
  { id: 'tl-2', time: '14/09/2026', label: 'Nhận giao dịch đầu tiên 92.000.000 ₫', detail: 'Từ một nạn nhân khác, đã có báo cáo tra soát', tone: 'warning' },
  { id: 'tl-3', time: '14–15/09/2026', label: '12 báo cáo lừa đảo từ cộng đồng', detail: 'Ghi nhận trên hệ thống cảnh báo liên ngân hàng', tone: 'danger' },
  { id: 'tl-4', time: 'Hôm nay · 09:41', label: 'Giao dịch 85.000.000 ₫ của bạn được tạm giữ', tone: 'danger' },
]

export const demoSimilarScenario: SimilarScenario = {
  name: 'Mạo danh cơ quan công an',
  description:
    'Kẻ gian gọi điện tự xưng công an, thông báo bạn liên quan tới một vụ án và yêu cầu chuyển tiền vào "tài khoản tạm giữ" để chứng minh vô tội. Chúng tạo áp lực tâm lý, yêu cầu giữ bí mật và thao túng nạn nhân chuyển tiền ngay trong cuộc gọi.',
  reportedCases: 1_284,
}

/* ============ TRUNG TÂM AN TOÀN ============ */

export const demoSafetyCenter: SafetyCenter = {
  safetyScore: 92,
  scoreLabel: 'Rất an toàn',
  // Hai trường thêm khi SafetyCenter chuyển sang lấy từ gateway. Giữ ở đây để
  // file mock vẫn khớp kiểu và khôi phục được nếu cần trình bày offline.
  updatedLabel: 'Cập nhật 15/09/2026',
  shieldEnabled: true,
  blockedCount: 3,
  warnedCount: 7,
  reportedCount: 2,
  history: [
    { id: 'sh-1', date: '2026-09-15', amount: 85_000_000, scenarioName: 'Mạo danh cơ quan công an', status: 'processing' },
    { id: 'sh-2', date: '2026-08-28', amount: 12_000_000, scenarioName: 'Trúng thưởng giả', status: 'blocked' },
    { id: 'sh-3', date: '2026-08-15', amount: 5_600_000, scenarioName: 'Giả mạo người thân', status: 'ignored' },
    { id: 'sh-4', date: '2026-08-02', amount: 32_000_000, scenarioName: 'Đầu tư ảo', status: 'blocked' },
  ],
  protections: [
    { key: 'realtime', label: 'Cảnh báo lừa đảo realtime', description: 'Chấm điểm rủi ro mọi giao dịch chuyển tiền', enabled: true },
    { key: 'beneficiary', label: 'Kiểm tra tài khoản nhận', description: 'Đối chiếu danh sách cảnh báo liên ngân hàng', enabled: true },
    { key: 'limit', label: 'Giới hạn giao dịch lớn', description: 'Xác nhận thêm với giao dịch trên 50.000.000 ₫', enabled: true },
    { key: 'biometric', label: 'Xác thực sinh trắc học', description: 'Face ID cho mọi giao dịch chuyển tiền', enabled: false },
  ],
}

/* ============ OPS DASHBOARD ============ */

export const demoOpsMetrics: OpsMetrics = {
  scannedToday: 24_817,
  alertsFired: 142,
  cancelRatePct: 78,
  protectedValueVnd: 8_400_000_000,
}

export const demoOpsDeltas: Record<keyof OpsMetrics, KpiDelta> = {
  scannedToday: { valueLabel: '+12% so với hôm qua', up: true },
  alertsFired: { valueLabel: '+8% so với hôm qua', up: true },
  cancelRatePct: { valueLabel: '+5 điểm so với hôm qua', up: true },
  protectedValueVnd: { valueLabel: '+1,2 tỷ so với hôm qua', up: true },
}

function buildAssessment(score: number, scenarioName: string): RiskAssessment {
  // Phân rã điểm theo cùng tỷ trọng với case chính để dữ liệu luôn cộng khớp tổng
  const ratios = [32 / 87, 28 / 87, 18 / 87, 9 / 87]
  const weights = ratios.map((r) => Math.round(score * r))
  weights[3] = score - weights[0] - weights[1] - weights[2]
  return {
    score,
    level: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low',
    scenarioName,
    signals: demoRiskAssessment.signals.map((s, i) => ({ ...s, weight: weights[i] })),
    recommendations: demoRiskAssessment.recommendations,
  }
}

export const demoOpsAlerts: ScamAlert[] = [
  {
    id: 'ALT-4092',
    timestamp: '2026-09-15T09:41:00',
    customer: 'Nguyễn Minh Anh',
    amount: demoScamAmount,
    beneficiary: demoBeneficiary,
    assessment: demoRiskAssessment,
    status: 'pending',
  },
  {
    id: 'ALT-4091',
    timestamp: '2026-09-15T09:12:00',
    customer: 'Trần Quốc Bảo',
    amount: 42_500_000,
    beneficiary: { accountNo: '1902 664 130', bankName: 'Techcombank', holderName: 'NGUYEN HUU PHUC', accountAgeDays: 5, reportCount: 7 },
    assessment: buildAssessment(81, 'Đầu tư ảo'),
    status: 'investigating',
  },
  {
    id: 'ALT-4090',
    timestamp: '2026-09-15T08:56:00',
    customer: 'Lê Thu Hà',
    amount: 12_000_000,
    beneficiary: { accountNo: '0071 220 954', bankName: 'Sacombank', holderName: 'DO THI KIM NGAN', accountAgeDays: 9, reportCount: 4 },
    assessment: buildAssessment(74, 'Trúng thưởng giả'),
    status: 'pending',
  },
  {
    id: 'ALT-4089',
    timestamp: '2026-09-15T08:31:00',
    customer: 'Phạm Văn Long',
    amount: 156_000_000,
    beneficiary: { accountNo: '8833 107 462', bankName: 'VIB', holderName: 'LUU DINH TRONG', accountAgeDays: 1, reportCount: 19 },
    assessment: buildAssessment(91, 'Giả nhân viên ngân hàng'),
    status: 'confirmed',
  },
  {
    id: 'ALT-4088',
    timestamp: '2026-09-15T08:02:00',
    customer: 'Đỗ Ngọc Lan',
    amount: 8_400_000,
    beneficiary: { accountNo: '2210 458 771', bankName: 'BIDV', holderName: 'HOANG MINH TUAN', accountAgeDays: 34, reportCount: 1 },
    assessment: buildAssessment(58, 'Giả mạo người thân'),
    status: 'dismissed',
  },
  {
    id: 'ALT-4087',
    timestamp: '2026-09-15T07:45:00',
    customer: 'Vũ Minh Châu',
    amount: 27_900_000,
    beneficiary: { accountNo: '5504 913 286', bankName: 'MB Bank', holderName: 'PHAN VAN DUC', accountAgeDays: 3, reportCount: 8 },
    assessment: buildAssessment(69, 'Mạo danh cơ quan công an'),
    status: 'pending',
  },
]

export const demoHourlyAlerts: HourlyAlertPoint[] = [
  { hour: '00h', count: 1 }, { hour: '01h', count: 0 }, { hour: '02h', count: 1 }, { hour: '03h', count: 0 },
  { hour: '04h', count: 1 }, { hour: '05h', count: 2 }, { hour: '06h', count: 4 }, { hour: '07h', count: 7 },
  { hour: '08h', count: 12 }, { hour: '09h', count: 16 }, { hour: '10h', count: 14 }, { hour: '11h', count: 11 },
  { hour: '12h', count: 8 }, { hour: '13h', count: 7 }, { hour: '14h', count: 9 }, { hour: '15h', count: 10 },
  { hour: '16h', count: 8 }, { hour: '17h', count: 6 }, { hour: '18h', count: 5 }, { hour: '19h', count: 6 },
  { hour: '20h', count: 8 }, { hour: '21h', count: 4 }, { hour: '22h', count: 2 }, { hour: '23h', count: 0 },
]

export const demoScenarioCounts: ScenarioCount[] = [
  { name: 'Mạo danh cơ quan công an', count: 48 },
  { name: 'Đầu tư ảo', count: 34 },
  { name: 'Giả nhân viên ngân hàng', count: 26 },
  { name: 'Trúng thưởng giả', count: 19 },
  { name: 'Giả mạo người thân', count: 15 },
]

export const demoModelInputs: string[] = [
  'Lịch sử giao dịch 12 tháng của khách hàng',
  'Danh sách cảnh báo cộng đồng & liên ngân hàng',
  'Hành vi thiết bị & phiên đăng nhập',
  'Hồ sơ tài khoản người nhận',
]

export const demoCaseTimeline: CaseTimelineStep[] = [
  { id: 'ct-1', time: '09:41:02', label: 'Khách hàng khởi tạo lệnh chuyển 85.000.000 ₫', done: true },
  { id: 'ct-2', time: '09:41:03', label: 'Risk Engine chấm điểm 87/100 — mức cao', done: true },
  { id: 'ct-3', time: '09:41:03', label: 'Hiển thị cảnh báo Scam Shield cho khách hàng', done: true },
  { id: 'ct-4', time: '09:41:20', label: 'Tạo case cho chuyên viên vận hành', done: true },
  { id: 'ct-5', time: '—', label: 'Chờ quyết định xử lý', done: false },
]

/* ============ CHAT COPILOT — KỊCH BẢN TRẢ LỜI ============ */

export const demoChatSuggestions: string[] = [
  'Tháng này tôi tiêu nhiều nhất vào đâu?',
  'Tôi có thể tiết kiệm bao nhiêu?',
  'Dự báo số dư cuối tháng',
]

export const demoSpendingChart: ChatChart = {
  type: 'bar',
  title: 'Chi tiêu theo nhóm · Tháng 9/2026',
  data: demoCategories.map((c) => ({ label: c.labelVi, value: c.amount })),
}

interface ScriptedReply {
  content: string
  chart?: ChatChart
}

const scriptedReplies: { match: RegExp; reply: ScriptedReply }[] = [
  {
    match: /tiêu nhiều nhất|tiêu bao nhiêu|chi tiêu/i,
    reply: {
      content:
        'Từ 01/09 đến 15/09 bạn đã chi 12.460.000 ₫, bằng 69% ngân sách tháng. Nhóm lớn nhất là Ăn uống với 4.230.000 ₫ — tăng 34% so với tháng 8, chủ yếu từ GrabFood và cà phê sáng. Dưới đây là bức tranh đầy đủ theo nhóm:',
      chart: demoSpendingChart,
    },
  },
  {
    match: /tiết kiệm/i,
    reply: {
      content:
        'Với nhịp chi hiện tại, dự kiến cuối tháng bạn dư khoảng 6.500.000 ₫ sau khi trừ các hoá đơn định kỳ. Tôi gợi ý trích 3.000.000 ₫ vào Tiết kiệm mục tiêu ngay hôm nay — phần còn lại vẫn đủ thoải mái cho 2 tuần cuối tháng.',
    },
  },
  {
    match: /dự báo|số dư/i,
    reply: {
      content:
        'Số dư hiện tại là 47.820.000 ₫. Sau khi trừ các khoản chi dự kiến (hoá đơn nước, di chuyển và ăn uống theo thói quen ~5.500.000 ₫), số dư ngày 30/09 ước tính khoảng 42.300.000 ₫. Không có hoá đơn lớn nào đến hạn trong 2 tuần tới.',
    },
  },
]

const fallbackReply: ScriptedReply = {
  content:
    'Tôi có thể giúp bạn phân tích chi tiêu, dự báo dòng tiền và gợi ý tiết kiệm dựa trên giao dịch của bạn tại MSB. Bạn thử hỏi: "Tháng này tôi tiêu nhiều nhất vào đâu?" nhé.',
}

export function getScriptedReply(question: string): ScriptedReply {
  return scriptedReplies.find((s) => s.match.test(question))?.reply ?? fallbackReply
}

/* ============ HOME ============ */

export const demoRecentTransactions = demoTransactions.slice(0, 4)

export const demoHomeGreeting = 'Chào buổi sáng, Minh Anh'
