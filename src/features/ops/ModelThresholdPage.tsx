import { useQuery } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { getOpsModel } from '@/lib/api'
import { OpsPage, OpsSkeleton } from './ops-page'

/** Ba mức của engine, vẽ trên cùng một thanh 0–100. */
function ThresholdBar({ softWarnMin, interveneMin }: { softWarnMin: number; interveneMin: number }) {
  const bands = [
    { label: 'Cho đi tiếp', range: `0 – ${softWarnMin - 1}`, width: softWarnMin, color: 'var(--msb-success)' },
    { label: 'Cảnh báo mềm', range: `${softWarnMin} – ${interveneMin - 1}`, width: interveneMin - softWarnMin, color: 'var(--msb-warning)' },
    { label: 'Can thiệp', range: `${interveneMin} – 100`, width: 100 - interveneMin, color: 'var(--msb-danger)' },
  ]
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-3 overflow-hidden rounded-full">
        {bands.map((b) => (
          <span key={b.label} style={{ width: `${b.width}%`, background: b.color }} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {bands.map((b) => (
          <div key={b.label} className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2 text-[13px] font-semibold">
              <span className="block h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
              {b.label}
            </span>
            <span className="font-mono text-xs text-muted">{b.range} điểm</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ModelThresholdPage() {
  const { data: model, isPending } = useQuery({ queryKey: ['ops-model'], queryFn: getOpsModel })

  return (
    <OpsPage
      title="Mô hình & ngưỡng"
      subtitle="Cấu hình engine chấm điểm rủi ro — đây là bản chỉ đọc"
      toolbar={
        <span className="flex items-center gap-1.5 rounded-full bg-app px-3 py-1.5 text-xs font-medium text-muted">
          <Lock size={13} strokeWidth={1.8} />
          Chỉ đọc
        </span>
      }
    >
      {isPending || !model ? (
        <OpsSkeleton rows={3} />
      ) : (
        <>
          <div className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
            <div>
              <span className="text-[15px] font-semibold">Ba mức xử lý theo điểm rủi ro</span>
              <span className="block text-xs text-muted">
                Cùng cặp ngưỡng mà màn chi tiết case hiển thị — đổi ở engine thì cả hai màn đổi theo
              </span>
            </div>
            <ThresholdBar softWarnMin={model.softWarnMin} interveneMin={model.interveneMin} />
          </div>

          <div className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card">
            <div>
              <span className="text-[15px] font-semibold">Trần điểm của từng yếu tố</span>
              <span className="block text-xs text-muted">
                Tổng tối đa {model.maxScore} điểm, chặn trên ở 100 — một yếu tố không tự quyết định được kết quả
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {model.factors.map((f) => (
                <div key={f.key} className="flex flex-col gap-1">
                  <span className="flex items-baseline justify-between text-[13px]">
                    <span className="font-medium">{f.label}</span>
                    <span className="font-semibold">tối đa {f.maxScore} điểm</span>
                  </span>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-divider">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${(f.maxScore / model.maxScore) * 100}%` }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 rounded-card bg-surface p-5 shadow-card">
            <span className="text-[15px] font-semibold">Dữ liệu đầu vào mô hình</span>
            <span className="flex flex-wrap gap-1.5">
              {model.inputs.map((inp) => (
                <span key={inp} className="rounded-full border border-line bg-app px-2.5 py-1 text-xs">
                  {inp}
                </span>
              ))}
            </span>
          </div>
        </>
      )}
    </OpsPage>
  )
}
