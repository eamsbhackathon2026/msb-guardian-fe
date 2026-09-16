import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Sparkles, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis } from 'recharts'
import { useQuery } from '@tanstack/react-query'
// MOCK CŨ: import { demoChatSuggestions } from '@/data/demo-scenarios'
import type { ChatChart, ChatMessage, ChatTable } from '@/data/types'
import { getCopilotIntro, streamChat } from '@/lib/api'
import { formatVnd } from '@/lib/format'
import { MobileFrame } from '@/shell/MobileFrame'

const chartShades = ['var(--msb-primary)', 'var(--msb-orange-300)', 'var(--msb-orange-200)', 'var(--msb-orange-border)', 'var(--msb-border)']

function MiniBarChart({ chart }: { chart: ChatChart }) {
  return (
    <div className="mt-1 flex flex-col gap-1 rounded-xl bg-app p-3">
      <span className="text-xs font-semibold text-muted">{chart.title}</span>
      <ResponsiveContainer width="100%" height={110}>
        <BarChart data={chart.data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--msb-text-muted)' }} interval={0} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={700}>
            {chart.data.map((entry, i) => (
              <Cell key={entry.label} fill={chartShades[i] ?? chartShades[0]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <span className="text-[11px] text-muted">Lớn nhất: {chart.data[0]?.label} · {formatVnd(chart.data[0]?.value ?? 0)}</span>
    </div>
  )
}

/** Badge xu hướng: chi tiêu TĂNG là điều cần lưu ý (đỏ), GIẢM là tích cực
 *  (xanh), 0 trung tính, null = chưa có kỳ trước để so (—). Cùng quy ước với
 *  khối "Chi tiêu theo quý" ở màn Copilot. */
function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null || pct === undefined) return <span className="text-muted">—</span>
  if (pct === 0) return <span className="text-muted">0%</span>
  const up = pct > 0
  return (
    <span className={up ? 'text-danger' : 'text-success'}>
      {up ? '+' : ''}
      {pct}%
    </span>
  )
}

/** Bảng số liệu chi tiêu do gateway dựng từ dữ liệu domain — số luôn khớp
 *  database, không phải LLM sinh. */
function SpendingTable({ table }: { table: ChatTable }) {
  return (
    <div className="mt-1.5 overflow-hidden rounded-xl bg-app">
      <div className="px-3 pt-2.5 pb-1.5 text-xs font-semibold text-muted">{table.title}</div>
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-muted">
            <th className="px-3 pb-1 text-left font-medium">Nhóm</th>
            <th className="px-1 pb-1 text-right font-medium">Số tiền</th>
            <th className="px-1 pb-1 text-right font-medium">%</th>
            <th className="px-3 pb-1 text-right font-medium">Δ kỳ trước</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={row.label} className={i % 2 ? 'bg-black/[0.025]' : ''}>
              <td className="px-3 py-1.5 text-ink">{row.label}</td>
              <td className="whitespace-nowrap px-1 py-1.5 text-right tabular-nums text-ink">{formatVnd(row.amount)}</td>
              <td className="px-1 py-1.5 text-right tabular-nums text-muted">{row.pct}%</td>
              <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                <TrendBadge pct={row.trendPct} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-line font-semibold">
            <td className="px-3 py-2 text-ink">{table.totalLabel}</td>
            <td className="whitespace-nowrap px-1 py-2 text-right tabular-nums text-ink">{formatVnd(table.totalAmount)}</td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex w-fit items-center gap-1.5 rounded-[16px_16px_16px_4px] bg-surface px-4 py-3.5 shadow-card">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-[7px] w-[7px] rounded-full bg-muted"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

let nextId = 0
function makeMessage(role: ChatMessage['role'], content: string, chart?: ChatChart): ChatMessage {
  nextId += 1
  return { id: `msg-${nextId}`, role, content, chart, timestamp: new Date().toISOString() }
}

export function CopilotChatPage() {
  const navigate = useNavigate()
  // Gợi ý câu hỏi lấy từ gateway. Khi chưa tải xong thì không hiện chip nào,
  // thay vì hiện danh sách cứng rồi nhảy sang danh sách khác.
  const { data: intro } = useQuery({ queryKey: ['copilot-intro'], queryFn: getCopilotIntro })
  const suggestions = intro?.suggestions ?? []
  // Lời chào đến từ gateway. Khởi tạo rỗng rồi nạp khi tải xong, vì useState
  // chỉ đọc giá trị khởi tạo đúng một lần.
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Chèn lời chào khi tải xong, và chỉ khi chưa có tin nhắn nào — nếu không,
  // refetch giữa cuộc trò chuyện sẽ chèn lại lời chào vào giữa.
  useEffect(() => {
    if (!intro) return
    setMessages((prev) => (prev.length === 0 ? [makeMessage('assistant', intro.greeting)] : prev))
  }, [intro])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [waitingFirstToken, setWaitingFirstToken] = useState(false)
  const [showChips, setShowChips] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Tự cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, waitingFirstToken])

  async function send(question: string) {
    const trimmed = question.trim()
    if (!trimmed || streaming) return
    setShowChips(false)
    setInput('')
    setStreaming(true)
    setWaitingFirstToken(true)
    setMessages((prev) => [...prev, makeMessage('user', trimmed)])

    const draft = makeMessage('assistant', '')
    let started = false
    const result = await streamChat(trimmed, (token) => {
      if (!started) {
        started = true
        setWaitingFirstToken(false)
        setMessages((prev) => [...prev, draft])
      }
      setMessages((prev) => prev.map((m) => (m.id === draft.id ? { ...m, content: m.content + token } : m)))
    })
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === draft.id)
      const finalMsg = { ...draft, content: result.content, chart: result.chart, table: result.table }
      return exists ? prev.map((m) => (m.id === draft.id ? finalMsg : m)) : [...prev, finalMsg]
    })
    setWaitingFirstToken(false)
    setStreaming(false)
  }

  return (
    <MobileFrame>
      {/* Header */}
      <div className="flex flex-none items-center gap-2.5 border-b border-line bg-surface px-3 pb-2.5 pt-1">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-soft text-primary">
          <Sparkles size={20} strokeWidth={1.7} />
        </span>
        <span className="flex-1">
          <span className="block text-[17px] font-semibold leading-[22px]">Financial Copilot</span>
          <span className="flex items-center gap-1.5 text-xs text-success">
            <span className="block h-1.5 w-1.5 rounded-full bg-success" />
            Sẵn sàng hỗ trợ
          </span>
        </span>
        <button type="button" aria-label="Đóng" onClick={() => navigate('/copilot')} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full hover:bg-black/5">
          <X size={22} strokeWidth={1.6} />
        </button>
      </div>

      {/* Hội thoại */}
      <div ref={scrollRef} className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
        <span className="text-center text-xs text-muted">Hôm nay · 15/09/2026</span>
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="max-w-[280px] self-end rounded-[16px_16px_4px_16px] bg-primary px-3.5 py-3 text-[15px] leading-[22px] text-white">
              {m.content}
            </div>
          ) : (
            <div key={m.id} className="flex max-w-[330px] items-end gap-2 self-start">
              <span className="mb-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-orange-soft text-primary">
                <Sparkles size={14} strokeWidth={1.8} />
              </span>
              <div className="min-w-0 rounded-[16px_16px_16px_4px] bg-surface px-3.5 py-3 text-[15px] leading-[22px] shadow-card">
                {m.content}
                {m.table && <SpendingTable table={m.table} />}
                {m.chart && <MiniBarChart chart={m.chart} />}
              </div>
            </div>
          ),
        )}
        {waitingFirstToken && (
          <div className="flex items-end gap-2 self-start">
            <span className="mb-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-orange-soft text-primary">
              <Sparkles size={14} strokeWidth={1.8} />
            </span>
            <TypingDots />
          </div>
        )}
        {showChips && (
          <div className="flex max-w-[320px] flex-col gap-2 self-start pl-9">
            {suggestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void send(q)}
                className="w-fit cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2.5 text-left text-[13px] font-medium hover:border-primary hover:text-primary-pressed"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer nhập */}
      <div className="flex-none border-t border-line bg-surface px-4 pb-7 pt-2">
        <div className="pb-1.5 text-center text-[11px] text-muted">Thông tin mang tính tham khảo, không phải tư vấn đầu tư.</div>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void send(input)
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi…"
            className="h-11 min-w-0 flex-1 rounded-full bg-app px-4 text-[15px] outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            aria-label="Gửi"
            disabled={streaming || input.trim().length === 0}
            className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-full bg-primary text-white disabled:opacity-40"
          >
            <Send size={20} strokeWidth={1.7} />
          </button>
        </form>
      </div>
    </MobileFrame>
  )
}
