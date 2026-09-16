import { create } from 'zustand'
import { demoSafetyCenter } from '@/data/demo-scenarios'
import type { AlertStatus } from '@/data/types'

interface GuardianState {
  /** Ẩn/hiện số dư trên Home */
  balanceHidden: boolean
  toggleBalance: () => void

  /** Lớp bảo vệ trong Trung tâm an toàn */
  protections: Record<string, boolean>
  toggleProtection: (key: string) => void

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

  protections: Object.fromEntries(demoSafetyCenter.protections.map((p) => [p.key, p.enabled])),
  toggleProtection: (key) => set((s) => ({ protections: { ...s.protections, [key]: !s.protections[key] } })),

  alertStatusOverrides: {},
  setAlertStatus: (id, status) => set((s) => ({ alertStatusOverrides: { ...s.alertStatusOverrides, [id]: status } })),

  lastShieldOutcome: null,
  setShieldOutcome: (outcome) => set({ lastShieldOutcome: outcome }),
}))
