import { Check, ChevronDown, TriangleAlert } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import type { ChatStep } from '@/data/types'

/** Mỗi dòng phải kịp đọc trước khi bị thay. Công cụ trả về trong 50ms sẽ làm
 *  dòng loé rồi biến mất — trông như máy giật chứ không như người đang nghĩ. */
const NHIP_TOI_THIEU_MS = 400

/** Chỉ nêu thời gian khi nó đáng nêu; người ta cũng chỉ nhắc khi thấy lâu. */
const NGUONG_NEU_THOI_GIAN_MS = 1_500

function giay(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace('.', ',')} giây`
}

/** Giữ một dòng ít nhất `nhipMs` trước khi cho dòng sau thay chỗ.
 *
 *  Câu đến trong lúc dòng hiện tại chưa đủ nhịp thì CHỜ, và nếu có câu mới hơn
 *  nữa thì câu ở giữa bị bỏ qua — thà mất một dòng trung gian còn hơn nhấp nháy
 *  ba dòng trong một phần tư giây. Dấu vết đầy đủ vẫn nằm ở phần gấp cuối lượt.
 */
function useDongChay(muon: string | null, nhipMs = NHIP_TOI_THIEU_MS): string | null {
  const [hien, setHien] = useState<string | null>(null)
  const hienTu = useRef(0)
  const moiNhat = useRef<string | null>(null)
  const hen = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    moiNhat.current = muon
    if (muon === null) {
      setHien(null)
      return
    }
    const conLai = nhipMs - (Date.now() - hienTu.current)
    if (conLai <= 0) {
      hienTu.current = Date.now()
      setHien(muon)
      return
    }
    if (hen.current) return
    hen.current = setTimeout(() => {
      hen.current = null
      if (moiNhat.current === null) return
      hienTu.current = Date.now()
      setHien(moiNhat.current)
    }, conLai)
  }, [muon, nhipMs])

  useEffect(() => () => { if (hen.current) clearTimeout(hen.current) }, [])
  return hien
}

/** Dòng suy nghĩ đang chạy: đúng MỘT dòng, dòng sau thay chỗ dòng trước.
 *
 *  Người ta nghĩ tuần tự chứ không nghĩ ra một bảng kiểm, nên trong lúc trợ lý
 *  còn làm việc thì màn hình chỉ kể việc đang làm. Toàn bộ dấu vết được gấp vào
 *  tin nhắn khi câu trả lời xong.
 */
export function ChatThinkingLine({
  steps,
  waiting,
  reasoning,
}: {
  steps: ChatStep[]
  waiting: boolean
  /** Tóm tắt suy nghĩ do mô hình tự kể, khi trợ lý được bật cờ bên Agent Platform. */
  reasoning?: string
}) {
  const dangChay = steps.find((s) => s.status === 'running')
  const vuaXong = [...steps].reverse().find((s) => s.status !== 'running')
  let muon: string | null = null
  if (dangChay) muon = `Em đang ${dangChay.label}…`
  else if (vuaXong?.durationMs != null && vuaXong.durationMs >= NGUONG_NEU_THOI_GIAN_MS) {
    muon = `Em ${vuaXong.status === 'error' ? 'chưa' : 'đã'} ${vuaXong.label} (${giay(vuaXong.durationMs)})`
  } else if (reasoning) {
    // Mô hình tự kể thì để nó kể: câu của nó nói đúng việc nó đang cân nhắc, còn
    // "Em đang suy nghĩ…" chỉ là câu chống trống của giao diện.
    muon = reasoning
  } else if (waiting) muon = 'Em đang suy nghĩ…'

  const hien = useDongChay(muon)
  if (!hien) return null
  return (
    <p className="flex items-center gap-2 text-[13px] leading-[18px] text-muted">
      <motion.span
        className="block h-[7px] w-[7px] flex-none rounded-full bg-primary"
        animate={{ opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 1.1, repeat: Infinity }}
      />
      <motion.span key={hien} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
        {hien}
      </motion.span>
    </p>
  )
}

function StepRow({ step }: { step: ChatStep }) {
  const loi = step.status === 'error'
  return (
    <li className="flex items-center gap-2 text-[13px] leading-[18px] text-muted">
      <span className={`flex h-4 w-4 flex-none items-center justify-center rounded-full ${loi ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
        {loi ? <TriangleAlert size={11} strokeWidth={2.2} /> : <Check size={11} strokeWidth={2.4} />}
      </span>
      {/* Nhãn hiện NGUYÊN VĂN chuỗi gateway gửi — nó do người vận hành đặt bên
          Agent Platform, FE chỉ thêm chủ ngữ để câu đứng được một mình. */}
      <span className={loi ? 'text-danger' : undefined}>
        Em {loi ? 'chưa' : 'đã'} {step.label}
        {step.durationMs != null && step.durationMs >= NGUONG_NEU_THOI_GIAN_MS ? ` (${giay(step.durationMs)})` : ''}
      </span>
    </li>
  )
}

/** Câu kể lại, ghép từ chính các nhãn — không thêm chữ nào không có thật. */
function cauTongKet(steps: ChatStep[]): string {
  const nhan = steps.map((s) => (s.status === 'error' ? `${s.label} (chưa xong)` : s.label))
  if (nhan.length === 1) return `Em đã ${nhan[0]}`
  const dau = nhan.slice(0, -1).join(', ')
  return `Em đã ${dau} và ${nhan[nhan.length - 1]}`
}

/** Dấu vết sau khi trả lời xong: một câu, bấm vào mở ra từng bước. */
export function ChatSteps({ steps }: { steps: ChatStep[] }) {
  const [open, setOpen] = useState(false)
  if (!steps.length) return null
  return (
    <div className="mt-2 border-t border-line pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-start gap-1 text-left text-[13px] leading-[18px] text-muted hover:text-primary"
      >
        <span className="min-w-0 flex-1">{cauTongKet(steps)}</span>
        <ChevronDown size={14} strokeWidth={1.8} className={`mt-0.5 flex-none transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {steps.map((s) => (
            <StepRow key={s.callId} step={s} />
          ))}
        </ul>
      )}
    </div>
  )
}
