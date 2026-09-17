import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, MessageSquareText, Send, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatVnd, timeGreeting } from '@/lib/format'
import { useGuardianStore } from '@/lib/store'
import { MobileFrame } from '@/shell/MobileFrame'
import { favoriteBeneficiaries, type Beneficiary } from './BeneficiariesPage'

/** Lệnh chuyển bot đã hiểu được từ câu chat, chờ khách xác nhận */
interface DraftTransfer {
  beneficiary: Beneficiary
  amount: number
}

interface BankingMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  transfer?: DraftTransfer
  /** Danh bạ bot liệt kê để khách bấm chọn — tên + số tài khoản đầy đủ, không che */
  beneficiaries?: Beneficiary[]
  /** Nút hành động dưới tin nhắn (mở màn chuyển thường, xem lịch sử…) */
  action?: { label: string; to: string }
}

let nextId = 0
function makeMsg(
  role: BankingMessage['role'],
  content: string,
  extra?: { transfer?: DraftTransfer; beneficiaries?: Beneficiary[]; action?: { label: string; to: string } },
): BankingMessage {
  nextId += 1
  return { id: `cb-${nextId}`, role, content, ...extra }
}

// Dải U+0300–U+036F (dấu thanh/mũ sau NFD) nhúng trực tiếp trong regex
const COMBINING_MARKS = /[̀-ͯ]/g

/** Bỏ dấu tiếng Việt để so khớp tên người nhận khi khách gõ không dấu */
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(COMBINING_MARKS, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
}

/** "500k" / "2tr" / "1,5 triệu" / "500.000đ" -> số VND; không đọc được -> null */
function parseAmount(text: string): number | null {
  const t = text.toLowerCase().replace(/,/g, '.')
  const withUnit = t.match(/(\d+(?:\.\d+)?)\s*(k|nghìn|nghin|ngàn|ngan|tr|triệu|trieu|củ|cu)\b/)
  if (withUnit) {
    const n = parseFloat(withUnit[1])
    const thousand = ['k', 'nghìn', 'nghin', 'ngàn', 'ngan'].includes(withUnit[2])
    return Math.round(n * (thousand ? 1_000 : 1_000_000))
  }
  const raw = t.match(/(\d[\d.\s]{2,})\s*(?:đ|d|vnd|₫)?/)
  if (raw) {
    const digits = raw[1].replace(/[.\s]/g, '')
    if (digits.length >= 4) return Number(digits)
  }
  return null
}

/** Khớp người nhận theo tên (bỏ dấu) hoặc số tài khoản trong danh bạ demo.
 *  Token "msb" bị loại khi so từng từ vì gần như tên nào cũng chứa nó. */
function findBeneficiary(text: string): Beneficiary | null {
  const t = stripDiacritics(text)
  const whole = favoriteBeneficiaries.find((b) => t.includes(stripDiacritics(b.name)) || t.includes(b.account))
  if (whole) return whole
  return (
    favoriteBeneficiaries.find((b) =>
      stripDiacritics(b.name)
        .split(/\s+/)
        .some((w) => w.length >= 3 && w !== 'msb' && t.includes(w)),
    ) ?? null
  )
}

const chipSuggestions = ['Chuyển 500k cho LongPD MSB', 'Chuyển 2 triệu cho MSB Thái', 'Chuyển 1,5 triệu cho My Account']

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

/** Card xác nhận lệnh chuyển trong hội thoại — bấm là sang form đã điền sẵn */
function TransferCard({ transfer }: { transfer: DraftTransfer }) {
  const navigate = useNavigate()
  return (
    <div className="mt-1.5 flex flex-col gap-2.5 rounded-xl bg-app p-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-line bg-surface">
          <img src="/assets/icon-logo-msb.png" alt={transfer.beneficiary.bank} className="h-3.5 w-auto" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold uppercase leading-5 text-ink">{transfer.beneficiary.name}</span>
          <span className="block text-[12px] leading-4 text-muted">
            {transfer.beneficiary.bank} · {transfer.beneficiary.account}
          </span>
        </span>
      </div>
      <span className="flex items-baseline justify-between">
        <span className="text-[12px] text-muted">Số tiền</span>
        <span className="text-[17px] font-bold text-ink">{formatVnd(transfer.amount)}</span>
      </span>
      <button
        type="button"
        onClick={() => navigate('/transfer/new', { state: { beneficiary: transfer.beneficiary, amount: transfer.amount, from: 'chat-banking' } })}
        className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-btn bg-primary text-[14px] font-semibold text-white active:scale-[.99]"
      >
        Tạo lệnh chuyển
        <ArrowUpRight size={16} strokeWidth={2} />
      </button>
    </div>
  )
}

/** Chat Banking — chuyển tiền bằng tin nhắn, tách khỏi Financial Copilot.
 *  Bot hiểu câu ở FE (danh bạ demo), lệnh hoàn chỉnh thì đưa sang form chuyển
 *  tiền đã điền sẵn để đi tiếp luồng Scam Shield như bình thường. */
export function ChatBankingPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<BankingMessage[]>([
    makeMsg(
      'assistant',
      `${timeGreeting()} anh! Em là Chat Banking MSB — anh nhắn một câu là em soạn lệnh chuyển tiền ngay. Ví dụ: “Chuyển 500k cho LongPD MSB”.`,
    ),
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [showChips, setShowChips] = useState(true)
  // Nhớ mảnh lệnh đã hiểu ở các câu trước: khách nói tên trước, số tiền sau vẫn ghép được
  const [pending, setPending] = useState<{ beneficiary?: Beneficiary; amount?: number }>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const transactions = useGuardianStore((s) => s.transactions)
  const announcedRef = useRef(false)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  // Khách vừa chuyển tiền xong (< 5 phút) quay lại chat → báo thành công ngay
  // trong hội thoại kèm nút xem lại lịch sử giao dịch.
  useEffect(() => {
    if (announcedRef.current) return
    const last = transactions[0]
    if (!last || Date.now() - new Date(last.datetime).getTime() > 5 * 60_000) return
    announcedRef.current = true
    setMessages((prev) => [
      ...prev,
      makeMsg('assistant', `✅ Chuyển tiền thành công ${formatVnd(last.amount)} tới ${last.name} (${last.bank} · ${last.account}).`, {
        action: { label: 'Xem lại lịch sử giao dịch', to: '/transactions' },
      }),
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function reply(text: string) {
    const beneficiary = findBeneficiary(text) ?? pending.beneficiary
    const amount = parseAmount(text) ?? pending.amount
    // Khách nêu đích danh người nhận ("cho ai đó" / một dãy số dài như stk)
    // nhưng không khớp danh bạ → người nhận MỚI, rẽ sang màn chuyển thường.
    const namesRecipient = /\bcho\s+\S/.test(stripDiacritics(text)) || /\d{6,}/.test(text)

    if (!beneficiary && namesRecipient && (amount || /\bchuyen\b|\bck\b/.test(stripDiacritics(text)))) {
      setPending({})
      return makeMsg(
        'assistant',
        'Người nhận này chưa có trong danh bạ của anh. Với tài khoản mới, anh thao tác trên màn chuyển tiền thông thường để nhập số tài khoản và được Scam Shield kiểm tra đầy đủ nhé.',
        { action: { label: 'Chuyển tới tài khoản mới', to: '/transfer/account' } },
      )
    }

    if (beneficiary && amount) {
      setPending({})
      return makeMsg(
        'assistant',
        `Em đã soạn lệnh chuyển ${formatVnd(amount)} tới ${beneficiary.name}. Anh kiểm tra rồi bấm xác nhận nhé — giao dịch vẫn được Scam Shield kiểm tra như thường.`,
        { transfer: { beneficiary, amount } },
      )
    }
    if (beneficiary) {
      setPending({ beneficiary })
      return makeMsg('assistant', `Chuyển cho ${beneficiary.name} (${beneficiary.bank} · ${beneficiary.account}) — anh muốn chuyển bao nhiêu tiền ạ?`)
    }
    if (amount) {
      setPending({ amount })
      return makeMsg('assistant', `${formatVnd(amount)} — anh muốn chuyển cho ai ạ? Anh bấm chọn trong danh bạ nhé:`, { beneficiaries: favoriteBeneficiaries })
    }
    if (/danh bạ|danh ba|người thụ hưởng|nguoi thu huong|người nhận|nguoi nhan/i.test(text)) {
      return makeMsg('assistant', 'Danh bạ thụ hưởng của anh đây ạ, bấm chọn là em soạn lệnh luôn:', { beneficiaries: favoriteBeneficiaries })
    }
    if (/chi tiêu|chi tieu|tài chính|tai chinh|phân tích|phan tich|ngân sách|ngan sach/i.test(text)) {
      return makeMsg('assistant', 'Câu hỏi về chi tiêu, tài chính anh hỏi Trợ lý AI Financial Copilot sẽ chuẩn hơn ạ — anh bấm vào bạn bot ở trang chủ nhé. Ở đây em lo phần chuyển tiền cho anh.')
    }
    return makeMsg('assistant', 'Anh nhắn giúp em tên người nhận và số tiền trong một câu nhé, ví dụ: “Chuyển 2 triệu cho MSB Thái”.')
  }

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || typing) return
    setShowChips(false)
    setInput('')
    setMessages((prev) => [...prev, makeMsg('user', trimmed)])
    setTyping(true)
    // Nhịp gõ ngắn cho tự nhiên — bot chạy hoàn toàn ở FE, không có mạng thật
    setTimeout(() => {
      setMessages((prev) => [...prev, reply(trimmed)])
      setTyping(false)
    }, 550)
  }

  return (
    <MobileFrame>
      {/* Header */}
      <div className="flex flex-none items-center gap-2.5 border-b border-line bg-surface px-3 pb-2.5 pt-1">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-soft text-primary">
          <MessageSquareText size={20} strokeWidth={1.7} />
        </span>
        <span className="flex-1">
          <span className="block text-[17px] font-semibold leading-[22px]">Chat Banking</span>
          <span className="flex items-center gap-1.5 text-xs text-success">
            <span className="block h-1.5 w-1.5 rounded-full bg-success" />
            Chuyển tiền bằng tin nhắn
          </span>
        </span>
        <button type="button" aria-label="Đóng" onClick={() => navigate('/')} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full hover:bg-black/5">
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
                <MessageSquareText size={14} strokeWidth={1.8} />
              </span>
              <div className="min-w-0 rounded-[16px_16px_16px_4px] bg-surface px-3.5 py-3 text-[15px] leading-[22px] shadow-card">
                {m.content}
                {m.transfer && <TransferCard transfer={m.transfer} />}
                {m.action && (
                  <button
                    type="button"
                    onClick={() => navigate(m.action!.to)}
                    className="mt-2 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-btn bg-primary text-[14px] font-semibold text-white active:scale-[.99]"
                  >
                    {m.action.label}
                    <ArrowUpRight size={16} strokeWidth={2} />
                  </button>
                )}
                {m.beneficiaries && (
                  <div className="mt-1.5 flex flex-col overflow-hidden rounded-xl bg-app">
                    {m.beneficiaries.map((b, i) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => send(`Chuyển cho ${b.name}`)}
                        className={`flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left hover:bg-black/[.03] ${i > 0 ? 'border-t border-line' : ''}`}
                      >
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line bg-surface">
                          <img src="/assets/icon-logo-msb.png" alt={b.bank} className="h-3 w-auto" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-semibold leading-5 text-ink">{b.name}</span>
                          <span className="block text-[12px] leading-4 text-muted">
                            {b.bank} · {b.account}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {typing && (
          <div className="flex items-end gap-2 self-start">
            <span className="mb-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-orange-soft text-primary">
              <MessageSquareText size={14} strokeWidth={1.8} />
            </span>
            <TypingDots />
          </div>
        )}
        {showChips && (
          <div className="flex max-w-[320px] flex-col gap-2 self-start pl-9">
            {chipSuggestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
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
        <div className="pb-1.5 text-center text-[11px] font-medium text-success">Lệnh chuyển luôn được Scam Shield kiểm tra trước khi thực hiện.</div>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Chuyển 500k cho…"
            className="h-11 min-w-0 flex-1 rounded-full bg-app px-4 text-[15px] outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            aria-label="Gửi"
            disabled={typing || input.trim().length === 0}
            className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-full bg-primary text-white disabled:opacity-40"
          >
            <Send size={20} strokeWidth={1.7} />
          </button>
        </form>
      </div>
    </MobileFrame>
  )
}
