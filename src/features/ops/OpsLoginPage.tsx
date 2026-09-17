import { useState, type FormEvent } from 'react'
import { Lock, ShieldCheck, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { opsLogin } from '@/lib/api'
import { useOpsAuthStore } from '@/lib/ops-auth'
import { Button } from '@/components/ui/button'

/** Nguyên do đăng nhập nội bộ thất bại → câu tiếng Việt hiện dưới form, luôn
 *  kèm việc cần làm tiếp thay vì chỉ báo lỗi suông. */
function reasonLabel(reason?: string): string {
  if (reason === 'not_backoffice') {
    return 'Tài khoản này là tài khoản khách hàng. Trang vận hành cần tài khoản nội bộ — liên hệ quản trị viên để được cấp.'
  }
  if (reason === 'disabled' || reason === 'locked') {
    return 'Tài khoản đang bị khoá. Liên hệ quản trị viên.'
  }
  return 'Tên đăng nhập hoặc mật khẩu chưa đúng.'
}

const CALL_FAILED_LABEL = 'Chưa kết nối được hệ thống danh tính. Thử lại sau ít phút.'

/**
 * Màn đăng nhập nội bộ cho `/ops`. Cố tình KHÔNG dùng `MobileFrame` như màn
 * đăng nhập khách (`LoginPage`) — khung desktop tối màu, không có sidebar, để
 * người trực phân biệt ngay đây là hệ thống nội bộ chứ không phải app khách.
 *
 * `from` lấy từ state điều hướng do `RequireOpsAuth` đặt: đăng nhập xong quay
 * lại đúng trang đang định mở, không phải luôn về `/ops`.
 */
export function OpsLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useOpsAuthStore((s) => s.login)
  const from = (location.state as { from?: string } | null)?.from ?? '/ops'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const name = username.trim()
    if (!name || !password || submitting) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await opsLogin(name, password)
      if (!res.authenticated || !res.operator) {
        setError(reasonLabel(res.reason))
        return
      }
      login({ username: name, operator: res.operator })
      navigate(from, { replace: true })
    } catch {
      // Gateway/identity-service không gọi được — KHÔNG có nhánh dự phòng ở màn
      // này (khác màn đăng nhập khách): identity-service chết là không ai vào
      // Ops được, xem POST /api/ops/login.
      setError(CALL_FAILED_LABEL)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <div className="w-full max-w-[380px] rounded-card bg-surface p-8 shadow-card">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-soft text-primary">
            <ShieldCheck size={22} strokeWidth={1.8} />
          </span>
          <div>
            <div className="text-xl font-bold tracking-[-.02em] text-ink">MSB Guardian Ops</div>
            <div className="text-[13px] text-muted">Đăng nhập nội bộ — chỉ dành cho chuyên viên vận hành</div>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
          <label className="flex h-12 items-center gap-2.5 rounded-btn border border-line px-3.5">
            <UserRound size={18} strokeWidth={1.7} className="flex-none text-muted" />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              aria-label="Tên đăng nhập"
              placeholder="Tên đăng nhập nội bộ"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
            />
          </label>

          <label className="flex h-12 items-center gap-2.5 rounded-btn border border-line px-3.5">
            <Lock size={18} strokeWidth={1.7} className="flex-none text-muted" />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
              autoComplete="current-password"
              aria-label="Mật khẩu"
              placeholder="Mật khẩu"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
            />
          </label>

          {error && (
            <p role="alert" className="text-[13px] font-medium text-danger">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Button>
        </form>

        <p className="mt-5 text-center text-[11px] leading-4 text-muted">
          Hệ thống nội bộ MSB Guardian — không dùng để đăng nhập ứng dụng khách hàng.
        </p>
      </div>
    </div>
  )
}
