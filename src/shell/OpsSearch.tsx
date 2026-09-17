import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getOpsAlerts } from '@/lib/api'
import { formatVnd } from '@/lib/format'

const MAX_SUGGESTIONS = 8

/**
 * Ô tìm kiếm trên thanh đầu trang Ops.
 *
 * Lọc ngay trên danh sách cảnh báo mà react-query đã tải cho Tổng quan (cùng
 * queryKey), nên gõ phím không phát sinh lời gọi mạng nào. Đủ dùng vì danh sách
 * một ngày rất ngắn; khi nào dài hơn thì đổi sang tìm kiếm phía máy chủ.
 */
export function OpsSearch() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const { data: alerts } = useQuery({ queryKey: ['ops-alerts'], queryFn: getOpsAlerts })

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length === 0) return []
    return (alerts ?? [])
      .filter((a) =>
        a.customer.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.beneficiary.accountNo.toLowerCase().includes(q) ||
        a.beneficiary.holderName.toLowerCase().includes(q) ||
        a.assessment.scenarioName.toLowerCase().includes(q),
      )
      .slice(0, MAX_SUGGESTIONS)
  }, [alerts, query])

  // Danh sách gợi ý co lại khi gõ thêm, nên con trỏ cũ có thể trỏ ra ngoài.
  const active = Math.min(cursor, Math.max(matches.length - 1, 0))

  function choose(id: string) {
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
    navigate(`/ops/alerts/${id}`)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (matches.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => (c + 1) % matches.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => (c - 1 + matches.length) % matches.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(matches[active].id)
    }
  }

  return (
    <div className="relative">
      <label className="flex h-10 w-[380px] items-center gap-2.5 rounded-[10px] bg-app px-3.5 text-sm text-muted">
        <Search size={18} strokeWidth={1.6} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setCursor(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          // Đóng trễ một nhịp: bấm chuột vào gợi ý cũng làm input mất focus.
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="w-full bg-transparent text-ink outline-none placeholder:text-muted"
          placeholder="Tìm khách hàng, số tài khoản, case…"
        />
      </label>

      {open && query.trim().length > 0 && (
        <div className="absolute left-0 top-12 z-50 w-[380px] overflow-hidden rounded-card bg-surface shadow-float">
          {matches.length === 0 ? (
            <div className="px-4 py-3 text-[13px] text-muted">
              Không có cảnh báo nào khớp “{query.trim()}”. Thử tên khách hàng hoặc mã case.
            </div>
          ) : (
            matches.map((a, i) => (
              <button
                key={a.id}
                type="button"
                onMouseEnter={() => setCursor(i)}
                onClick={() => choose(a.id)}
                className={`flex w-full flex-col gap-0.5 border-b border-divider px-4 py-2.5 text-left last:border-0 ${
                  i === active ? 'bg-orange-soft/60' : 'hover:bg-app'
                }`}
              >
                <span className="text-[13px] font-semibold">{a.customer}</span>
                <span className="text-xs text-muted">
                  {formatVnd(a.amount)} · {a.assessment.scenarioName} · Risk {a.assessment.score}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
