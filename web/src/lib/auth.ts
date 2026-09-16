import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  authenticated: boolean
  login: () => void
  logout: () => void
}

/** Phiên đăng nhập demo — giữ qua reload bằng localStorage */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      authenticated: false,
      login: () => set({ authenticated: true }),
      logout: () => set({ authenticated: false }),
    }),
    { name: 'msb-guardian-auth' },
  ),
)
