import { Check, ChevronDown, TriangleAlert } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

import type { ChatStep } from '@/data/types'

/** Chấm trạng thái của một bước: đang chạy thì nhấp nháy, xong thì dấu tích,
 *  hỏng thì dấu chấm than. Ba trạng thái phải nhìn ra ngay, đừng bắt đọc chữ. */
function StepMark({ status }: { status: ChatStep['status'] }) {
  if (status === 'done') {
    return (
      <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check size={11} strokeWidth={2.4} />
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-danger/10 text-danger">
        <TriangleAlert size={11} strokeWidth={2.2} />
      </span>
    )
  }
  return (
    <span className="flex h-4 w-4 flex-none items-center justify-center">
      <motion.span
        className="block h-[7px] w-[7px] rounded-full bg-primary"
        animate={{ opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 1.1, repeat: Infinity }}
      />
    </span>
  )
}

function StepRow({ step }: { step: ChatStep }) {
  return (
    <li className="flex items-center gap-2 text-[13px] leading-[18px] text-muted">
      <StepMark status={step.status} />
      {/* Nhãn hiện NGUYÊN VĂN chuỗi gateway gửi: nó do người vận hành đặt bên
          Agent Platform, FE không dịch và không ghép thêm chữ. */}
      <span className={step.status === 'error' ? 'text-danger' : undefined}>{step.label}</span>
    </li>
  )
}

/** Danh sách bước trợ lý đã đi qua.
 *
 *  Lúc đang trả lời thì mở sẵn — đó là lúc khách cần biết máy đang làm gì. Trả
 *  lời xong thì gấp lại thành một dòng, vì khi đã có câu trả lời thì các bước
 *  chỉ còn là phần chứng minh, ai muốn xem mới mở. */
export function ChatSteps({ steps, collapsed = false }: { steps: ChatStep[]; collapsed?: boolean }) {
  const [open, setOpen] = useState(!collapsed)
  if (!steps.length) return null

  if (!collapsed) {
    return (
      <ul className="flex flex-col gap-1.5">
        {steps.map((s) => (
          <StepRow key={s.callId} step={s} />
        ))}
      </ul>
    )
  }
  return (
    <div className="mt-2 border-t border-line pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-1 text-[13px] text-muted hover:text-primary"
      >
        Đã xem {steps.length} nguồn dữ liệu
        <ChevronDown size={14} strokeWidth={1.8} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
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
