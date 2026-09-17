import { create } from 'zustand'
// MOCK CŨ: import { demoSafetyCenter } from '@/data/demo-scenarios'
import type { CustomerAction, AlertStatus, ProtectionLayer } from '@/data/types'

/** Giao dịch chuyển tiền đã thực hiện trong phiên — nguồn cho bảng lịch sử */
export interface TransferRecord {
  id: string
  datetime: string
  name: string
  bank: string
  account: string
  amount: number
  note?: string
}

/** Thông báo trong app (quả chuông + toast) sinh ra trong phiên */
export interface AppNotification {
  id: string
  title: string
  timeLabel: string
}

interface GuardianState {
  /** Ẩn/hiện số dư trên Home */
  balanceHidden: boolean
  toggleBalance: () => void

  /** Lớp bảo vệ trong Trung tâm an toàn */
  protections: Record<string, boolean>
  toggleProtection: (key: string) => void
  /** Nạp trạng thái ban đầu từ gateway, chỉ nhận lần đầu */
  hydrateProtections: (layers: ProtectionLayer[]) => void

  /** Quyết định của chuyên viên ops (ghi đè status demo trong phiên) */
  alertStatusOverrides: Record<string, AlertStatus>
  setAlertStatus: (id: string, status: AlertStatus) => void

  /** Kết quả luồng Scam Shield của khách (huỷ / vẫn chuyển / báo cáo) */
  lastShieldOutcome: CustomerAction | null
  setShieldOutcome: (outcome: CustomerAction) => void

  /** Lịch sử giao dịch trong phiên, giao dịch mới nhất đứng đầu */
  transactions: TransferRecord[]
  addTransaction: (t: TransferRecord) => void

  /** Thông báo mới trong phiên (hiện trên quả chuông, trước danh sách mock) */
  notifications: AppNotification[]
  /** Thông báo vừa phát để trang chủ hiện toast; null khi đã tắt */
  notiToast: AppNotification | null
  pushNotification: (n: AppNotification) => void
  clearNotiToast: () => void
}

export const useGuardianStore = create<GuardianState>((set) => ({
  balanceHidden: true,
  toggleBalance: () => set((s) => ({ balanceHidden: !s.balanceHidden })),

  // Trước đây seed thẳng từ demoSafetyCenter lúc tạo store. Nay dữ liệu đến từ
  // gateway nên store khởi tạo rỗng và được nạp sau khi tải xong.
  protections: {},
  toggleProtection: (key) => set((s) => ({ protections: { ...s.protections, [key]: !s.protections[key] } })),
  // Chỉ nạp khi còn rỗng: react-query refetch không được xoá thao tác bật/tắt
  // mà người dùng vừa thực hiện.
  hydrateProtections: (layers) =>
    set((s) =>
      Object.keys(s.protections).length > 0
        ? s
        : { protections: Object.fromEntries(layers.map((p) => [p.key, p.enabled])) },
    ),

  alertStatusOverrides: {},
  setAlertStatus: (id, status) => set((s) => ({ alertStatusOverrides: { ...s.alertStatusOverrides, [id]: status } })),

  lastShieldOutcome: null,
  setShieldOutcome: (outcome) => set({ lastShieldOutcome: outcome }),

  transactions: [],
  addTransaction: (t) => set((s) => ({ transactions: [t, ...s.transactions] })),

  notifications: [],
  notiToast: null,
  pushNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications], notiToast: n })),
  clearNotiToast: () => set({ notiToast: null }),
}))
