import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Operator } from '@/data/types'

/**
 * Phiên đăng nhập nội bộ cho `/ops` — TÁCH HẲN khỏi `useAuthStore` (phiên
 * khách trong `./auth.ts`).
 *
 * Lý do tách: đăng xuất khỏi app khách không được đá chuyên viên ra khỏi Ops,
 * và ngược lại. Đây cũng chính là lý do `/ops` xưa nay nằm ngoài `RequireAuth`
 * của app khách — hai phiên độc lập cần hai key localStorage độc lập.
 *
 * GIỚI HẠN: hệ thống không có token phiên (xem README). Phiên này chỉ là một
 * cờ trong localStorage cộng hồ sơ đã xác thực MỘT LẦN tại thời điểm đăng
 * nhập — `/api/ops/*` vẫn gọi thẳng được nếu biết URL, không có gì ở tầng API
 * chặn lại. Ở mức bản demo, mục tiêu là chặn người dùng đi lạc qua UI, không
 * phải chống truy cập trực tiếp vào API.
 */
export interface OpsSessionUser {
  username: string
  /** Hồ sơ hiển thị trả về từ `POST /api/ops/login` — dùng ngay để sidebar có
   *  tên ngay cả trước khi `GET /api/ops/session` (gọi lại theo username) trả
   *  lời, hoặc khi lời gọi đó tạm thời hỏng. */
  operator: Operator
}

interface OpsAuthState {
  authenticated: boolean
  user: OpsSessionUser | null
  login: (user: OpsSessionUser) => void
  logout: () => void
}

export const useOpsAuthStore = create<OpsAuthState>()(
  persist(
    (set) => ({
      authenticated: false,
      user: null,
      login: (user) => set({ authenticated: true, user }),
      logout: () => set({ authenticated: false, user: null }),
    }),
    { name: 'msb-guardian-ops-auth' },
  ),
)
