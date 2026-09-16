import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Hồ sơ người dùng sau khi đăng nhập thật qua gateway → identity-service.
 *  PII đã được che ở tầng identity-service (email dạng ng***@…, sđt 09** *** 303). */
export interface AuthUser {
  userId: number
  username: string
  role: string
  customerId: number | null
  fullNameMasked: string | null
  emailMasked: string | null
  phoneMasked: string | null
  userStatus: string
}

interface AuthState {
  authenticated: boolean
  /** Hồ sơ của phiên. null khi đăng nhập bằng lối tắt demo hoặc khi gateway
   *  không gọi được (nhánh dự phòng) — màn hình vẫn chạy bằng DEMO_CUSTOMER_ID. */
  user: AuthUser | null
  /** Gọi không tham số = đăng nhập demo (lối tắt, hoặc dự phòng khi backend lỗi).
   *  Gọi kèm hồ sơ = đăng nhập thật đã xác thực. */
  login: (user?: AuthUser | null) => void
  logout: () => void
}

/** Phiên đăng nhập demo — giữ qua reload bằng localStorage */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      authenticated: false,
      user: null,
      login: (user = null) => set({ authenticated: true, user }),
      logout: () => set({ authenticated: false, user: null }),
    }),
    { name: 'msb-guardian-auth' },
  ),
)
