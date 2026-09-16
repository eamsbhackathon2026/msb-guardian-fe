import { create } from 'zustand'
// MOCK CŨ: import { demoSafetyCenter } from '@/data/demo-scenarios'
import type { AlertStatus, ProtectionLayer } from '@/data/types'

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
  lastShieldOutcome: 'cancelled' | 'proceeded' | 'reported' | null
  setShieldOutcome: (outcome: 'cancelled' | 'proceeded' | 'reported') => void
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
}))
