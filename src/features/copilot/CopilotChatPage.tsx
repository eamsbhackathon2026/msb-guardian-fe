import { useEffect, useRef, useState } from 'react'
import { CreditCard, PiggyBank, ReceiptText, Send, Sparkles, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis } from 'recharts'
import { useQuery } from '@tanstack/react-query'
// MOCK CŨ: import { demoChatSuggestions } from '@/data/demo-scenarios'
import { ChatSteps, ChatThinkingLine } from '@/components/chat-steps'
import type { ChatChart, ChatGrid, ChatMessage, ChatStep, ChatTable } from '@/data/types'
import { getCopilotIntro, streamChat } from '@/lib/api'
import { FPT_BILL, billPeriod } from '@/features/payments/PayBillPage'
import { CARD } from '@/features/cards/CardPayPage'
import { formatDate, formatVnd, timeGreeting, formatVndWithSign } from '@/lib/format'
import { MobileFrame } from '@/shell/MobileFrame'

const chartShades = ['var(--msb-primary)', 'var(--msb-orange-300)', 'var(--msb-orange-200)', 'var(--msb-orange-border)', 'var(--msb-border)']

function MiniBarChart({ chart }: { chart: ChatChart }) {
  // Cột cao nhất phải TÌM ra, không lấy cột đầu: bảng chi tiêu xếp giảm dần nên
  // cột đầu đúng là lớn nhất, nhưng bảng tiền dư xếp theo tháng thì không.
  const dinh = chart.data.length ? chart.data.reduce((a, b) => (b.value > a.value ? b : a)) : undefined
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
      {dinh && <span className="text-[11px] text-muted">Lớn nhất: {dinh.label} · {formatVnd(dinh.value)}</span>}
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
  // Bảng lộ trình tiết kiệm nói về tương lai nên không có "kỳ trước" để so:
  // gateway gửi trendHeader = null và cột Δ biến mất, thay vì thành một cột
  // toàn dấu "—".
  const coCotTrend = table.trendHeader !== null && table.trendHeader !== undefined
  return (
    <div className="mt-1.5 overflow-hidden rounded-xl bg-app">
      <div className="px-3 pt-2.5 pb-1.5 text-xs font-semibold text-muted">{table.title}</div>
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-muted">
            <th className="px-3 pb-1 text-left font-medium">{table.rowHeader ?? 'Nhóm'}</th>
            <th className="px-1 pb-1 text-right font-medium">{table.amountHeader ?? 'Số tiền'}</th>
            <th className="px-1 pb-1 text-right font-medium">{table.pctHeader ?? '%'}</th>
            {coCotTrend && <th className="px-3 pb-1 text-right font-medium">{table.trendHeader}</th>}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={row.label} className={i % 2 ? 'bg-black/[0.025]' : ''}>
              <td className="px-3 py-1.5 text-ink">{row.label}</td>
              <td className={`whitespace-nowrap px-1 py-1.5 text-right tabular-nums ${row.amount < 0 ? 'text-danger' : 'text-ink'}`}>
                {formatVndWithSign(row.amount)}
              </td>
              <td className="px-1 py-1.5 text-right tabular-nums text-muted">{row.pct}%</td>
              {coCotTrend && (
                <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                  <TrendBadge pct={row.trendPct} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-line font-semibold">
            <td className="px-3 py-2 text-ink">{table.totalLabel}</td>
            <td className="whitespace-nowrap px-1 py-2 text-right tabular-nums text-ink">{formatVndWithSign(table.totalAmount)}</td>
            <td colSpan={coCotTrend ? 2 : 1} />
          </tr>
        </tfoot>
      </table>
      {table.footnote && (
        <p className="px-3 pb-2.5 pt-1 text-[11px] leading-[15px] text-muted">{table.footnote}</p>
      )}
    </div>
  )
}

/** Bảng agent tự kẻ (markdown). Gateway chỉ chuyển thể nên ô đã là chuỗi định
 *  dạng sẵn — component không diễn giải số, chỉ trình bày cho dễ đọc. Nhờ vậy
 *  câu hỏi tài chính nào agent kẻ bảng được thì ở đây cũng ra bảng. */
function AgentGrid({ grid }: { grid: ChatGrid }) {
  return (
    <div className="mt-1.5 overflow-x-auto rounded-xl bg-app">
      {grid.title && <div className="px-3 pt-2.5 text-xs font-semibold text-muted">{grid.title}</div>}
      {/* w-max: bảng lấy đúng bề rộng nội dung rồi cho cuộn ngang. Ép w-full thì
          bong bóng chat hẹp sẽ bóp cột chữ xuống mỗi dòng một tiếng ("Hỗ / trợ /
          gia / đình") và vẫn cắt mất cột cuối. */}
      <table className="w-max min-w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-muted">
            {grid.columns.map((c, i) => (
              <th
                key={`${c.label}-${i}`}
                className={`whitespace-nowrap px-3 pb-1 pt-2.5 font-medium ${c.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 ? 'bg-black/[0.025]' : ''}>
              {row.map((o, ci) => (
                <td
                  key={ci}
                  className={`whitespace-nowrap px-3 py-1.5 text-ink ${grid.columns[ci]?.align === 'right' ? 'text-right tabular-nums' : 'text-left'}`}
                >
                  {o}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


/** Gateway trả lời chào soạn sẵn với khung giờ cố định; thay bằng khung giờ
 *  thực của thiết bị để vào buổi tối không bị "Chào buổi sáng". */
function liveGreeting(raw: string): string {
  const out = raw.replace(/^(chào buổi (sáng|trưa|chiều|tối)|chúc ngủ ngon|xin chào|chào)/i, timeGreeting())
  return out === raw ? `${timeGreeting()}! ${raw}` : out
}

/** Câu cuối cùng trong một đoạn đang chảy dở.
 *
 *  Mô hình kể suy nghĩ thành nhiều câu; dòng trên màn hình chỉ cao một dòng nên
 *  nối dồn sẽ thành một đoạn văn trườn ngang. Lấy câu cuối là thứ nó đang cân
 *  nhắc lúc này; câu chưa kết thúc thì hiện dở, đúng nhịp nó đang nghĩ. */
function cauCuoi(doan: string): string {
  const cau = doan.split(/(?<=[.!?…])\s+/u)
  return (cau[cau.length - 1] ?? doan).trim().slice(0, 120)
}

let nextId = 0
function makeMessage(role: ChatMessage['role'], content: string, chart?: ChatChart): ChatMessage {
  nextId += 1
  return { id: `msg-${nextId}`, role, content, chart, timestamp: new Date().toISOString() }
}

/** Bỏ dấu tiếng Việt + thường hoá để so khớp từ khoá — khách gõ "lai suat"
 *  hay "Lãi Suất" đều nhận ra như nhau. NFD không tách được "đ" nên thay riêng. */
function boDau(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
}

/** Khách RA LỆNH mở tiết kiệm ("mở tiết kiệm cho tôi", "tôi muốn mở sổ tiết
 *  kiệm") → chuyển thẳng sang màn mở tiết kiệm, không cần hỏi agent. Câu có
 *  dạng câu hỏi ("mở tiết kiệm lãi bao nhiêu?") thì KHÔNG phải lệnh — để agent
 *  tư vấn rồi hiện nút bên dưới. */
function laLenhMoTietKiem(question: string): boolean {
  const q = boDau(question)
  const laCauHoi = /bao nhieu|the nao|nhu the nao|la gi|\?/.test(q)
  if (laCauHoi) return false
  return /\b(mo|tao)\s+(so\s+|tai khoan\s+)?(tiet kiem|tien gui)/.test(q)
}

/** Câu hỏi thuộc chủ đề lãi suất / sản phẩm tiết kiệm → sau khi tư vấn xong
 *  gắn nút "Mở tiết kiệm ngay" dưới câu trả lời. */
function laCauHoiTietKiem(question: string): boolean {
  const q = boDau(question)
  return /lai suat|tiet kiem|tien gui|bieu lai/.test(q)
}

/** Hỏi về hóa đơn → trả lời cục bộ về hóa đơn Internet FPT giả lập (agent
 *  phía gateway không biết hóa đơn demo này nên sẽ đáp "không có" — sai).
 *  Bắt RỘNG: cứ nhắc "hóa đơn" là báo nợ, chỉ trừ câu hỏi định nghĩa "là gì";
 *  bản trước đòi đúng cụm "chưa thanh toán / còn nợ" nên "nợ hóa đơn" trượt. */
function laCauHoiHoaDon(question: string): boolean {
  const q = boDau(question)
  return /hoa don/.test(q) && !/la gi/.test(q)
}

/** Hỏi/nhờ thanh toán nợ thẻ → báo dư nợ thẻ M-First Green World (giả lập,
 *  cùng dữ liệu với màn /cards/pay) kèm nút thanh toán ngay. Chú ý "thẻ" mất
 *  dấu trùng "thế" nên chặn cụm "the nao" để "thanh toán thế nào" không lọt. */
function laCauHoiNoThe(question: string): boolean {
  const q = boDau(question)
  return /the tin dung/.test(q) || /\b(du no|no|thanh toan|tra no|sao ke)\s+(no\s+)?the\b(?!\s*nao)/.test(q)
}

export function CopilotChatPage() {
  const navigate = useNavigate()
  const location = useLocation()
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
    setMessages((prev) => (prev.length === 0 ? [makeMessage('assistant', liveGreeting(intro.greeting))] : prev))
  }, [intro])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [waitingFirstToken, setWaitingFirstToken] = useState(false)
  // Bước của lượt ĐANG chạy. Xong lượt thì chúng đi vào tin nhắn và chỗ này trống lại.
  const [liveSteps, setLiveSteps] = useState<ChatStep[]>([])
  // Câu suy nghĩ gần nhất của mô hình. Chỉ giữ CÂU CUỐI chứ không nối dồn: dòng
  // này cao một dòng, và thứ khách cần biết là trợ lý đang cân nhắc gì lúc này.
  const [liveReasoning, setLiveReasoning] = useState('')
  const [showChips, setShowChips] = useState(true)
  // Chỉ giữ dòng suy nghĩ khi thật sự đang chờ: lúc chữ đã chảy mà không công cụ
  // nào chạy, nó chỉ lặp lại thứ sắp gấp vào chính câu trả lời.
  const dangCho = waitingFirstToken || liveSteps.some((s) => s.status === 'running')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Câu hỏi mang theo từ ô chat ở màn tổng quan Copilot — tự gửi đúng một lần
  // khi vào (StrictMode mount đôi nên cần cờ ref).
  const initialQuestion = (location.state as { question?: string } | null)?.question
  const sentInitialRef = useRef(false)
  useEffect(() => {
    if (!initialQuestion || sentInitialRef.current) return
    sentInitialRef.current = true
    void send(initialQuestion)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tự cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, waitingFirstToken, liveSteps])

  async function send(question: string) {
    const trimmed = question.trim()
    if (!trimmed || streaming) return
    setShowChips(false)
    setInput('')

    // Khách ra lệnh "mở tiết kiệm cho tôi" → xác nhận ngắn rồi link thẳng sang
    // màn mở tiết kiệm, không đi qua agent (agent không mở sổ được).
    if (laLenhMoTietKiem(trimmed)) {
      setMessages((prev) => [
        ...prev,
        makeMessage('user', trimmed),
        makeMessage('assistant', 'Dạ vâng, em chuyển anh/chị sang màn hình mở tiết kiệm ngay ạ…'),
      ])
      setTimeout(() => navigate('/invest/open'), 1_000)
      return
    }

    // Hỏi/nhờ thanh toán nợ thẻ → báo dư nợ thẻ M-First Green World (giả lập,
    // cùng dữ liệu với màn /cards/pay) kèm nút thanh toán ngay. Xét TRƯỚC hóa
    // đơn để "hóa đơn thẻ tín dụng" ra thẻ chứ không ra hóa đơn Internet.
    if (laCauHoiNoThe(trimmed)) {
      const traLoi =
        `Dạ, thẻ ${CARD.name} (•••• ${CARD.last4}) của anh/chị đang có dư nợ ${formatVnd(CARD.totalDue)}, ` +
        `số tiền thanh toán tối thiểu là ${formatVnd(CARD.minDue)} ạ. ` +
        'Anh/chị bấm nút bên dưới để thanh toán ngay ạ.'
      setMessages((prev) => [
        ...prev,
        makeMessage('user', trimmed),
        { ...makeMessage('assistant', traLoi), cta: 'pay-card' as const },
      ])
      return
    }

    // Hỏi hóa đơn chưa thanh toán → thông báo còn nợ hóa đơn Internet FPT
    // (giả lập, cùng dữ liệu với màn /payments/bill) kèm nút thanh toán ngay.
    if (laCauHoiHoaDon(trimmed)) {
      const traLoi =
        `Dạ, anh/chị còn 1 hóa đơn chưa thanh toán ạ: Internet ${FPT_BILL.provider} — kỳ cước ${billPeriod()}, ` +
        `số tiền ${formatVnd(FPT_BILL.amount)} (mã khách hàng ${FPT_BILL.customerCode}, chủ hợp đồng ${FPT_BILL.holderName}). ` +
        'Anh/chị bấm nút bên dưới để thanh toán ngay ạ.'
      setMessages((prev) => [
        ...prev,
        makeMessage('user', trimmed),
        { ...makeMessage('assistant', traLoi), cta: 'pay-bill' as const },
      ])
      return
    }

    setStreaming(true)
    setWaitingFirstToken(true)
    setLiveSteps([])
    setLiveReasoning('')
    setMessages((prev) => [...prev, makeMessage('user', trimmed)])

    const draft = makeMessage('assistant', '')
    let started = false
    const result = await streamChat(
      trimmed,
      (token) => {
        if (!started) {
          started = true
          setWaitingFirstToken(false)
          setMessages((prev) => [...prev, draft])
        }
        setMessages((prev) => prev.map((m) => (m.id === draft.id ? { ...m, content: m.content + token } : m)))
      },
      setLiveSteps,
      (text) => setLiveReasoning((truoc) => cauCuoi(truoc + text)),
    )
    // Hỏi về lãi suất / sản phẩm tiết kiệm → sau câu tư vấn gắn nút mở tiết
    // kiệm. Nhận diện theo CÂU HỎI của khách (chắc chắn), thêm vế "lãi suất"
    // trong câu trả lời để đỡ sót khi khách hỏi vòng ("gửi 12 tháng được bao nhiêu?").
    const goiYMoTietKiem = laCauHoiTietKiem(trimmed) || /lai suat/.test(boDau(result.content))
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === draft.id)
      const finalMsg: ChatMessage = {
        ...draft,
        content: result.content,
        chart: result.chart,
        table: result.table,
        grids: result.grids,
        steps: result.steps,
        cta: goiYMoTietKiem ? 'open-deposit' : undefined,
      }
      return exists ? prev.map((m) => (m.id === draft.id ? finalMsg : m)) : [...prev, finalMsg]
    })
    setWaitingFirstToken(false)
    setLiveSteps([])
    setLiveReasoning('')
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
        <span className="text-center text-xs text-muted">Hôm nay · {formatDate(new Date().toISOString())}</span>
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
                {m.steps?.length ? <ChatSteps steps={m.steps} /> : null}
                {m.grids?.map((g, i) => <AgentGrid key={i} grid={g} />)}
                {m.chart && <MiniBarChart chart={m.chart} />}
                {m.cta === 'open-deposit' && (
                  <button
                    type="button"
                    onClick={() => navigate('/invest/open')}
                    className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    <PiggyBank size={16} strokeWidth={1.8} />
                    Mở tiết kiệm ngay
                  </button>
                )}
                {m.cta === 'pay-bill' && (
                  <button
                    type="button"
                    onClick={() => navigate('/payments/bill')}
                    className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    <ReceiptText size={16} strokeWidth={1.8} />
                    Thanh toán hóa đơn
                  </button>
                )}
                {m.cta === 'pay-card' && (
                  <button
                    type="button"
                    onClick={() => navigate('/cards/pay')}
                    className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    <CreditCard size={16} strokeWidth={1.8} />
                    Thanh toán thẻ
                  </button>
                )}
              </div>
            </div>
          ),
        )}
        {/* Bước sống suốt lượt, không chỉ lúc chờ token đầu: trợ lý có thể nói
            vài chữ rồi mới gọi công cụ, lúc đó danh sách vẫn phải còn đó. */}
        {streaming && dangCho && (
          <div className="flex items-end gap-2 self-start">
            <span className="mb-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-orange-soft text-primary">
              <Sparkles size={14} strokeWidth={1.8} />
            </span>
            {/* Thay ba chấm bằng lời: "Đang suy nghĩ" nói đúng việc máy đang làm,
                và khi công cụ chạy thì nó nối tiếp ngay dưới cùng một khung. */}
            <div className="min-w-0 rounded-[16px_16px_16px_4px] bg-surface px-3.5 py-3 shadow-card">
              <ChatThinkingLine steps={liveSteps} waiting={waitingFirstToken} reasoning={liveReasoning} />
            </div>
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
