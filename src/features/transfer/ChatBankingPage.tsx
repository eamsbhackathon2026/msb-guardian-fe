import { ChatMarkdown } from '@/components/chat-markdown'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, MessageSquareText, Send, ShieldAlert, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getTransferBeneficiaries, parseChatBanking } from '@/lib/api'
import type { ChatGuardianHandoff, ChatScamWarning } from '@/data/types'
import { formatDate, formatVnd, timeGreeting } from '@/lib/format'
import { useGuardianStore } from '@/lib/store'
import { MobileFrame } from '@/shell/MobileFrame'
import { favoriteBeneficiaries, type Beneficiary } from './BeneficiariesPage'

/** Lệnh chuyển bot đã hiểu được từ câu chat, chờ khách xác nhận */
interface DraftTransfer {
  beneficiary: Beneficiary
  amount: number
  /** Nội dung chuyển khoản = câu khách gõ, mang sang màn chuyển tiền để Guardian
   *  bắt kịch bản lừa đảo. Chỉ có khi khách gõ nguyên câu (không phải bấm chọn). */
  note?: string
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
  /** Cảnh báo lừa đảo (giả danh công an, đầu tư…) — hiện thẻ đỏ trong chat */
  scamWarning?: ChatScamWarning
}

let nextId = 0
function makeMsg(
  role: BankingMessage['role'],
  content: string,
  extra?: { transfer?: DraftTransfer; beneficiaries?: Beneficiary[]; action?: { label: string; to: string }; scamWarning?: ChatScamWarning },
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

/** Từ xưng hô đứng trước tên — bỏ đi để lấy đúng tên cần tìm trong danh bạ */
const HONORIFICS = new Set(['anh', 'chi', 'em', 'co', 'chu', 'bac', 'ong', 'ba', 'ban', 'thay', 'sep'])

/**
 * Tách phần TÊN người nhận sau "cho/đến/tới/gửi/tặng": "chuyển 500k đến anh
 * khánh" → "khánh". Bỏ từ xưng hô và từ chứa số (số tiền đứng sau tên).
 * Trả null khi câu không nêu người nhận.
 */
function recipientName(text: string): string | null {
  const m = text.toLowerCase().match(/\b(?:cho|đến|den|tới|toi|gửi|gui|tặng|tang|sang)\s+(.+)$/)
  if (!m) return null
  const words = m[1].split(/\s+/).filter((w) => !HONORIFICS.has(stripDiacritics(w)) && !/\d/.test(w))
  const name = words.join(' ').replace(/[.,!?]+$/, '').trim()
  return name.length >= 2 ? name : null
}

/** Lọc danh bạ theo tên: mọi từ của tên cần tìm đều xuất hiện trong tên BEN (so không dấu) */
function matchByName(list: Beneficiary[], name: string): Beneficiary[] {
  const words = stripDiacritics(name).split(/\s+/).filter((w) => w.length >= 2)
  if (words.length === 0) return []
  return list.filter((b) => {
    const n = stripDiacritics(b.name)
    return words.every((w) => n.includes(w))
  })
}

/** Khớp người nhận theo tên (bỏ dấu) hoặc số tài khoản trong danh bạ đưa vào —
 *  trả về MỌI người khớp: 2 người cùng tên (anh Khánh) là câu mơ hồ, phần gọi
 *  phải hỏi lại thay vì lặng lẽ lấy người đầu tiên.
 *  Token "msb" bị loại khi so từng từ vì gần như tên nào cũng chứa nó. */
function findBeneficiaries(text: string, book: Beneficiary[]): Beneficiary[] {
  const t = stripDiacritics(text)
  const whole = book.filter((b) => t.includes(stripDiacritics(b.name)) || t.includes(b.account))
  if (whole.length > 0) return whole
  return book.filter((b) =>
    stripDiacritics(b.name)
      .split(/\s+/)
      .some((w) => w.length >= 3 && w !== 'msb' && t.includes(w)),
  )
}

const fallbackChips = ['Chuyển 500k cho anh Khánh', 'Chuyển 2 triệu cho MSB Thái', 'Chuyển 1,5 triệu cho My Account']

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
        onClick={() => navigate('/transfer/new', { state: { beneficiary: transfer.beneficiary, amount: transfer.amount, note: transfer.note, from: 'chat-banking' } })}
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
      `${timeGreeting()} anh! Em là Chat Banking MSB — anh nhắn một câu là em soạn lệnh chuyển tiền ngay. Ví dụ: “Chuyển 500k cho anh Khánh”.`,
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
  // Danh bạ của KHÁCH ĐANG ĐĂNG NHẬP (API theo cookie phiên) — nguồn duy nhất
  // để bot liệt kê và khớp tên. Danh bạ demo chỉ dùng khi gateway chết.
  const bookRef = useRef<Beneficiary[] | null>(null)
  const [chips, setChips] = useState<string[]>(fallbackChips)

  async function loadBook(): Promise<Beneficiary[]> {
    if (bookRef.current) return bookRef.current
    try {
      const api = await getTransferBeneficiaries()
      if (api.length > 0) {
        bookRef.current = api.map((b) => ({
          id: b.id, name: b.name, bank: b.bank, account: b.account,
          trusted: b.trusted, bankCode: b.bank, relationship: b.relationship,
        }))
        return bookRef.current
      }
    } catch {
      // gateway lỗi → dùng danh bạ demo để chat không chết hẳn
    }
    bookRef.current = favoriteBeneficiaries
    return bookRef.current
  }

  // Chip gợi ý dựng theo danh bạ thật để bấm vào là khớp được ngay
  useEffect(() => {
    void loadBook().then((book) => {
      if (book !== favoriteBeneficiaries && book.length >= 2) {
        setChips([`Chuyển 500k cho ${book[0].name}`, `Chuyển 2 triệu cho ${book[1].name}`, 'Xem danh bạ thụ hưởng'])
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  async function reply(text: string): Promise<BankingMessage> {
    // Danh bạ của khách đang đăng nhập — mọi bước liệt kê/khớp tên đều dùng nó,
    // hết cảnh bot liệt kê danh bạ demo của người khác hay soạn lệnh tới ben
    // không thuộc khách.
    const book = await loadBook()
    const local = findBeneficiaries(text, book)
    // Chỉ chốt luôn khi danh bạ khớp ĐÚNG MỘT người; khớp nhiều người
    // (2 anh Khánh) là câu mơ hồ, phải qua bước hỏi chọn bên dưới.
    let beneficiary = (local.length === 1 ? local[0] : undefined) ?? pending.beneficiary

    // Agent bóc số tiền và tên người nhận. Bộ luật regex bên dưới GIỮ NGUYÊN
    // làm đường lui: agent lỗi hoặc quá chậm thì màn chuyển tiền vẫn chạy như
    // trước, thà kém thông minh còn hơn đứng hình giữa lúc khách đang gõ.
    const ai = await parseChatBanking(text).catch(() => null)
    const byAgent = ai?.source === 'agent'
    // SỐ TIỀN luôn ưu tiên của gateway, kể cả khi agent hỏng: phần đó do code
    // tất định tính, không phải mô hình đoán. parseAmount của FE chỉ dùng khi
    // gọi gateway cũng không được — và nó KHÔNG hiểu "rưỡi", nên "3 triệu rưỡi"
    // sẽ ra 3.000.000.
    const amount = (ai?.amount ?? undefined) ?? parseAmount(text) ?? pending.amount
    // TÊN NGƯỜI NHẬN mới là phần cần mô hình; agent hỏng thì về regex.
    const name = byAgent ? (ai?.recipient ?? null) : recipientName(text)

    // Agent hiểu là khách hỏi danh bạ → trả danh sách luôn, khỏi đoán tiếp.
    if (byAgent && ai?.intent === 'list_beneficiaries') {
      return makeMsg('assistant', 'Danh bạ thụ hưởng của anh đây ạ, bấm chọn là em soạn lệnh luôn:', { beneficiaries: book })
    }

    // GIẢ DANH LỪA ĐẢO mức nặng → dẫn thẳng vào MÀN GUARDIAN đầy đủ (lý do +
    // câu hỏi + Scam Shield lượt 2 + 4 nút: khóa tạm / hủy / gọi MSB / vẫn tiếp
    // tục). Bắt cả khi người nhận KHÔNG có trong danh bạ.
    if (byAgent && ai?.guardian) {
      const g: ChatGuardianHandoff = ai.guardian
      setPending({})
      navigate('/transfer/guardian', {
        state: {
          beneficiary: { name: g.beneficiaryName, bank: g.bank, account: g.account || '(tài khoản mới)' },
          amount: g.amount,
          note: g.note,
          from: 'chat-banking',
          decisionId: g.decisionId,
          score: g.score,
          reasons: g.reasons,
          question: g.question,
          options: g.options,
        },
      })
      return makeMsg('assistant', 'Guardian đang kiểm tra giao dịch này…')
    }

    // Dấu hiệu lừa đảo nhưng chưa đủ dựng quyết định (thiếu số tiền…) → thẻ cảnh
    // báo tĩnh ngay trong chat, vẫn bắt được bất kể người nhận có trong danh bạ.
    if (byAgent && ai?.scamWarning) {
      setPending({})
      return makeMsg('assistant',
        'Khoan đã anh/chị ơi — giao dịch này có dấu hiệu lừa đảo, em tạm dừng để cảnh báo:',
        { scamWarning: ai.scamWarning })
    }

    // Tên người nhận KHÔNG đủ thông tin để chỉ đích danh → lọc danh bạ theo
    // tên: trùng nhiều người thì trả danh sách cho khách bấm chọn, đúng một
    // người thì dùng luôn.
    if (!beneficiary && (name || local.length >= 2)) {
      const matches = name ? matchByName(book, name) : local
      if (matches.length >= 2) {
        setPending({ amount })
        const display = (name ?? matches[0].name).replace(/(^|\s)\S/g, (c) => c.toUpperCase())
        return makeMsg(
          'assistant',
          `Danh bạ của anh có ${matches.length} người tên “${display}”. Anh muốn chuyển${amount ? ` ${formatVnd(amount)}` : ''} đến ai ạ, bấm chọn giúp em nhé:`,
          { beneficiaries: matches },
        )
      }
      if (matches.length === 1) beneficiary = matches[0]
    }

    // Khách nêu đích danh người nhận ("cho ai đó" / một dãy số dài như stk)
    // nhưng không khớp danh bạ → người nhận MỚI, rẽ sang màn chuyển thường.
    const namesRecipient = name != null || /\d{6,}/.test(text)

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
        { transfer: { beneficiary, amount, note: ai?.note ?? text } },
      )
    }
    if (beneficiary) {
      setPending({ beneficiary })
      return makeMsg('assistant', `Chuyển cho ${beneficiary.name} (${beneficiary.bank} · ${beneficiary.account}) — anh muốn chuyển bao nhiêu tiền ạ?`)
    }
    if (amount) {
      setPending({ amount })
      return makeMsg('assistant', `${formatVnd(amount)} — anh muốn chuyển cho ai ạ? Anh bấm chọn trong danh bạ nhé:`, { beneficiaries: book })
    }
    if (/danh bạ|danh ba|người thụ hưởng|nguoi thu huong|người nhận|nguoi nhan/i.test(text)) {
      return makeMsg('assistant', 'Danh bạ thụ hưởng của anh đây ạ, bấm chọn là em soạn lệnh luôn:', { beneficiaries: book })
    }
    if (/chi tiêu|chi tieu|tài chính|tai chinh|phân tích|phan tich|ngân sách|ngan sach/i.test(text)) {
      return makeMsg('assistant', 'Câu hỏi về chi tiêu, tài chính anh hỏi Trợ lý AI Financial Copilot sẽ chuẩn hơn ạ — anh bấm vào bạn bot ở trang chủ nhé. Ở đây em lo phần chuyển tiền cho anh.')
    }
    return makeMsg('assistant', 'Anh nhắn giúp em tên người nhận và số tiền trong một câu nhé, ví dụ: “Chuyển 2 triệu cho anh Khánh” — hoặc nhắn “danh bạ” để chọn người nhận.')
  }

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || typing) return
    setShowChips(false)
    setInput('')
    setMessages((prev) => [...prev, makeMsg('user', trimmed)])
    setTyping(true)
    // Giữ nhịp gõ tối thiểu ~550ms cho tự nhiên; câu cần tra danh bạ thì reply
    // còn chờ thêm API thật nên Promise.all lấy mốc lâu hơn trong hai việc.
    const beat = new Promise((resolve) => setTimeout(resolve, 550))
    Promise.all([reply(trimmed), beat]).then(([msg]) => {
      setMessages((prev) => [...prev, msg])
      setTyping(false)
    })
  }

  /** Khách bấm chọn một người trong danh sách bot liệt kê — ghép với số tiền
   *  đã nhớ (vd 500k của câu trước) và soạn lệnh luôn, không đi vòng qua text
   *  vì tên từ API có thể không nằm trong danh bạ demo của findBeneficiary. */
  function pick(b: Beneficiary) {
    if (typing) return
    const amount = pending.amount
    setMessages((prev) => [...prev, makeMsg('user', `Chuyển cho ${b.name}`)])
    setTyping(true)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        amount
          ? makeMsg(
              'assistant',
              `Em đã soạn lệnh chuyển ${formatVnd(amount)} tới ${b.name}. Anh kiểm tra rồi bấm xác nhận nhé — giao dịch vẫn được Scam Shield kiểm tra như thường.`,
              { transfer: { beneficiary: b, amount } },
            )
          : makeMsg('assistant', `Chuyển cho ${b.name} (${b.bank} · ${b.account}) — anh muốn chuyển bao nhiêu tiền ạ?`),
      ])
      setPending(amount ? {} : { beneficiary: b })
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
            <div key={m.id} className="max-w-[280px] self-end whitespace-pre-wrap rounded-[16px_16px_4px_16px] bg-primary px-3.5 py-3 text-[15px] leading-[22px] text-white">
              {m.content}
            </div>
          ) : (
            <div key={m.id} className="flex max-w-[330px] items-end gap-2 self-start">
              <span className="mb-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-orange-soft text-primary">
                <MessageSquareText size={14} strokeWidth={1.8} />
              </span>
              <div className="min-w-0 rounded-[16px_16px_16px_4px] bg-surface px-3.5 py-3 text-[15px] leading-[22px] shadow-card">
                <ChatMarkdown text={m.content} />
                {m.scamWarning && (
                  <div className="mt-2 flex flex-col gap-1.5 rounded-xl border-[1.5px] border-danger-300 bg-danger-soft p-3">
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-danger">
                      <ShieldAlert size={15} strokeWidth={2} />
                      {m.scamWarning.title}
                    </span>
                    <span className="text-[13px] leading-[19px] text-ink">{m.scamWarning.body}</span>
                    <span className="mt-0.5 text-[12px] font-medium text-danger">
                      Guardian khuyên: không chuyển, hãy gọi 1900 6083 để xác minh.
                    </span>
                  </div>
                )}
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
                        onClick={() => pick(b)}
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
            {chips.map((q) => (
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
